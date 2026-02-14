
import { ref, watch, onMounted, onUnmounted, unref, isRef, type Ref } from 'vue';
import type { TestMailEmail } from '@models/mail';
import type { AppConfig } from '@models/config';
import { fetchEmailsApi } from '@services/api';
import { saveEmailsToDB, getAllEmailsFromDB, deleteEmailFromDB, markAsReadInDB, clearEmailsDB } from '../services/db';

interface UseEmailsParams {
  config: AppConfig | Ref<AppConfig>;
  limit: number;
  offset: number;
  filterTag: string;
  filterTimestamp: string;
  /** server-side subject filter (passed to GraphQL advanced_filters) */
  filterSubject?: string;
}

export function useEmails({ config, limit, offset, filterTag, filterTimestamp, filterSubject }: UseEmailsParams) {
  const emails = ref<TestMailEmail[]>([]);
  const isLoading = ref(false);
  const isLivePolling = ref(false);
  const error = ref<string | null>(null);
  const lastRefreshed = ref<Date | null>(null);

  // keep a reactive reference to config whether caller passes a ref or plain object
  const configRef = isRef(config) ? (config as Ref<AppConfig>) : ref<AppConfig>(config as AppConfig);

  const latestTimestamp = ref<number>(Date.now());
  let mounted = true;

  onUnmounted(() => { mounted = false; });

  // keep latestTimestamp in sync with stored emails
  watch(
    emails,
    (list) => {
      if (list.length > 0) {
        const max = Math.max(...list.map(e => e.timestamp));
        if (max > latestTimestamp.value) latestTimestamp.value = max;
      }
    },
    { deep: true }
  );

  // load from IndexedDB
  async function loadFromDB() {
    const stored = await getAllEmailsFromDB();
    if (!mounted) return;
    emails.value = stored;
    if (stored.length > 0) {
      latestTimestamp.value = Math.max(...stored.map(e => e.timestamp));
    }
  }

  // API wrapper
  async function fetchEmails(params: { isLiveQuery?: boolean; forceLoadingState?: boolean } = {}) {
    const cfg = unref(configRef);
    if (!cfg.apiKey || !cfg.namespace) return;

    if (params.forceLoadingState) isLoading.value = true;
    if (params.isLiveQuery) isLivePolling.value = true;
    error.value = null;

    try {
      const timestamp_from = params.isLiveQuery ? latestTimestamp.value + 1 : filterTimestamp;

      const data = await fetchEmailsApi({
        config: cfg,
        limit: params.isLiveQuery ? 100 : limit,
        offset: params.isLiveQuery ? 0 : offset,
        tag: filterTag,
        timestamp_from,
        liveQuery: !!params.isLiveQuery,
        subject: filterSubject
      });

      if (data.result === 'success') {
        if (data.emails.length > 0) {
          await saveEmailsToDB(data.emails);
          await loadFromDB();
          if (mounted) lastRefreshed.value = new Date();
        }
      } else if (data.message !== 'timeout') {
        if (mounted) error.value = data.message || 'Unknown API error';
      }
    } catch (err: any) {
      if (params.isLiveQuery && (err.status === 502 || err.status === 504)) {
        return; // expected in live query
      }
      if (mounted && !params.isLiveQuery) {
        error.value = err.message || 'Failed to fetch emails';
      } else {
        // keep silent for polling errors
        // console.log('Polling status/error:', err.message);
      }
    } finally {
      if (!mounted) return;
      if (params.forceLoadingState) isLoading.value = false;
      if (params.isLiveQuery) isLivePolling.value = false;
    }
  }

  // initial load
  onMounted(() => {
    loadFromDB().then(() => {
      const cfg = unref(configRef);
      if (cfg.apiKey && cfg.namespace) {
        void fetchEmails({ isLiveQuery: false, forceLoadingState: true });
      }
    });
  });

  // Live query polling loop
  let liveLoopActive = false;
  async function startLiveLoop() {
    if (liveLoopActive) return;
    liveLoopActive = true;

    // small initial delay
    await new Promise((r) => setTimeout(r, 500));
    while (liveLoopActive && unref(configRef).liveQuery && mounted) {
      await fetchEmails({ isLiveQuery: true });
      if (!liveLoopActive || !mounted || !unref(configRef).liveQuery) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    liveLoopActive = false;
  }

  function stopLiveLoop() { liveLoopActive = false; }

  watch(
    () => ({ liveQuery: unref(configRef).liveQuery, apiKey: unref(configRef).apiKey }),
    (val) => {
      if (val.liveQuery && val.apiKey) startLiveLoop();
      else stopLiveLoop();
    },
    { immediate: true }
  );

  // Standard interval fallback
  let intervalId: number | null = null;
  watch(
    () => ({ liveQuery: unref(configRef).liveQuery, refreshInterval: unref(configRef).refreshInterval, apiKey: unref(configRef).apiKey }),
    (val) => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (!val.liveQuery && val.apiKey && val.refreshInterval > 0) {
        intervalId = window.setInterval(() => {
          void fetchEmails({ isLiveQuery: false, forceLoadingState: false });
        }, val.refreshInterval * 1000);
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
    stopLiveLoop();
  });

  // actions
  async function deleteEmail(id: string) {
    await deleteEmailFromDB(id);
    emails.value = emails.value.filter(e => e.id !== id);
  }

  async function markRead(id: string) {
    await markAsReadInDB(id);
    emails.value = emails.value.map(e => (e.id === id ? { ...e, read: true } : e));
  }

  async function clearAll() {
    await clearEmailsDB();
    emails.value = [];
  }

  return {
    emails,
    isLoading,
    isLivePolling,
    error,
    lastRefreshed,
    fetchEmails,
    deleteEmail,
    markRead,
    clearAll
  };
}
