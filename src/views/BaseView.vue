<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Drawer from 'primevue/drawer';
import TopBar from '@components/TopBar.vue';

import SettingsView from '@views/SettingsView.vue';
import MailList from '@components/MailList.vue';
import MailDetails from '@components/MailDetails.vue';
import { useAppConfig } from '@composables/useAppConfig';
import { useEmails } from '@composables/useEmails';

const { config } = useAppConfig();
const isSettingsOpen = ref(!config.value.apiKey || !config.value.namespace);
const mobileSidebarVisible = ref(false);

// router
const router = useRouter();
const route = useRoute();

// UI state
const selectedEmailId = ref<string | null>(null);
const mobileViewingDetails = ref(false);
const isMobile = ref(false);
const searchQuery = ref('');
const debouncedSearch = ref('');
const filterTag = ref('');
const filterSubject = ref('');
const filterTimestamp = ref('');
const offset = ref(0);
const limit = ref(config.value.defaultLimit || 10);

// useEmails composable (pass config ref)
const { emails, isLoading, isLivePolling, error, lastRefreshed, fetchEmails, deleteEmail, markRead, clearAll } = useEmails({
  config,
  limit: limit.value,
  offset: offset.value,
  filterTag: filterTag.value,
  filterTimestamp: filterTimestamp.value,
  filterSubject: filterSubject.value
});

// derived
const filteredEmails = computed(() => {
  const q = debouncedSearch.value.trim().toLowerCase();
  if (!q) return emails.value;
  // default: search subject only (local)
  return emails.value.filter(e => (e.subject || '').toLowerCase().includes(q));
});

const selectedEmail = computed(() => emails.value.find(e => e.id === selectedEmailId.value) || null);

function handleSelectEmail(id: string) {
  selectedEmailId.value = id;
  markRead(id);
  // on small screens open the details view instead of keeping a 2-column layout
  if (isMobile.value) mobileViewingDetails.value = true;
  // update URL so deep-linking works
  const currentId = route.params.id as string | undefined;
  if (currentId !== id) {
    router.push({ name: 'Mail', params: { id } }).catch(() => { });
  }
}

function selectAdjacent(dir: -1 | 1) {
  if (!selectedEmailId.value) return;
  const idx = emails.value.findIndex(e => e.id === selectedEmailId.value);
  if (idx === -1) return;
  const next = emails.value[idx + dir];
  if (next) {
    selectedEmailId.value = next.id;
    markRead(next.id);
  }
}

function closeSettings() {
  isSettingsOpen.value = false;
  // keep URL in sync
  if (route.name === 'Settings') router.replace({ name: 'Home' }).catch(() => { });
}

function mobileNavigate(view: 'inbox' | 'settings' | 'github') {
  // close sidebar first, then navigate so the animation is smooth on mobile
  mobileSidebarVisible.value = false;
  setTimeout(() => {
    if (view === 'settings') {
      isSettingsOpen.value = true;
      router.push({ name: 'Settings' }).catch(() => { });
    } else {
      isSettingsOpen.value = false;
      router.push({ name: 'Home' }).catch(() => { });
    }
    if (view === 'github') window.open('https://github.com/Matt0550/testmail.app-vue-client', '_blank', 'noopener');
  }, 220);
}

// mobile detection (keeps UI reactive during resize)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 767px)');
  const set = () => { isMobile.value = mq.matches; if (!mq.matches) mobileViewingDetails.value = false; };
  set();
  if (mq.addEventListener) mq.addEventListener('change', set);
  else mq.addListener(set);
  onUnmounted(() => { if (mq.removeEventListener) mq.removeEventListener('change', set); else mq.removeListener(set); });
});

// --- Router <-> UI sync ------------------------------------------------------
// reflect route state into the layout (open settings / open mail deep-links)
watch(() => route.fullPath, () => {
  // settings route -> open settings pane
  isSettingsOpen.value = (route.name === 'Settings' || route.path === '/settings');

  // mail route -> select that message
  const id = (route.params?.id as string) || null;
  if (id) {
    selectedEmailId.value = id;
    if (isMobile.value) mobileViewingDetails.value = true;
  } else {
    // navigating away from a mail clears the selection in the URL-driven flow
    if (route.name !== 'Mail') selectedEmailId.value = selectedEmailId.value;
    if (!isMobile.value) mobileViewingDetails.value = false;
  }
}, { immediate: true });

// when selectedEmailId is cleared programmatically, ensure URL returns to Home
watch(selectedEmailId, (id) => {
  if (!id && route.name === 'Mail') router.replace({ name: 'Home' }).catch(() => { });
});

// when mobile details are closed, clear the route if we were on /mails/:id
watch(mobileViewingDetails, (v) => {
  if (!v && route.name === 'Mail') router.replace({ name: 'Home' }).catch(() => { });
});

function openSettings() {
  isSettingsOpen.value = true;
  router.push({ name: 'Settings' }).catch(() => { });
}
function openInbox() {
  isSettingsOpen.value = false;
  router.push({ name: 'Home' }).catch(() => { });
}
function onCloseMobile() {
  mobileViewingDetails.value = false;
  if (route.name === 'Mail') router.replace({ name: 'Home' }).catch(() => { });
}

// -----------------------------------------------------------------------------

// debounce searchQuery -> update server-side subject filter and local debouncedSearch
let _searchTimer: number | null = null;
watch(searchQuery, (val) => {
  if (_searchTimer) window.clearTimeout(_searchTimer);
  _searchTimer = window.setTimeout(() => {
    debouncedSearch.value = val;
    // apply server-side subject filter and reset offset to first page
    filterSubject.value = val;
    offset.value = 0;
  }, 350);
});

// reset offset to first page when limit changes (more intuitive)
watch(limit, () => { offset.value = 0; });

// react to param changes: re-fetch when filters/limit/offset change
watch([limit, offset, filterTag, filterTimestamp, filterSubject], () => {
  void fetchEmails({ isLiveQuery: false, forceLoadingState: true });
});

// handle settings 'cleared' event emitted by SettingsView
function onSettingsCleared() {
  void clearAll();
  window.location.reload();
}

// top-bar refresh
function onRefresh() {
  void fetchEmails({ isLiveQuery: false, forceLoadingState: true });
}
</script>

<template>
  <div class="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-800 relative">
    <!-- Narrow navigation bar (desktop) — icons only -->
    <nav class="hidden md:flex flex-col w-20 bg-indigo-700 text-white items-center py-6 gap-6">
      <button
        :class="['w-14 h-14 rounded-lg flex items-center justify-center hover:scale-105 transition-transform hover:cursor-pointer', !isSettingsOpen ? 'bg-white text-indigo-700' : 'bg-indigo-600/90']"
        aria-label="inbox" @click="openInbox">
        <i class="pi pi-envelope text-xl" />
      </button>

      <button
        :class="['w-14 h-14 rounded-lg flex items-center justify-center hover:scale-105 transition-transform hover:cursor-pointer', isSettingsOpen ? 'bg-white text-indigo-700' : 'bg-indigo-600/80']"
        @click="openSettings" aria-label="settings">
        <i class="pi pi-cog text-xl" />
      </button>

      <a href="https://github.com/Matt0550/testmail.app-vue-client" target="_blank" rel="noreferrer" aria-label="GitHub"
        class="w-14 h-14 rounded-lg flex items-center justify-center hover:scale-105 transition-transform text-slate-100 hover:text-white">
        <!-- GitHub icon (SVG for consistent appearance) -->
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.428 2.865 8.185 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.607.069-.607 1.004.071 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.339-2.22-.253-4.555-1.112-4.555-4.948 0-1.092.39-1.986 1.03-2.684-.103-.253-.447-1.27.098-2.646 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.852.004 1.71.115 2.513.338 1.908-1.296 2.747-1.026 2.747-1.026.547 1.376.203 2.393.1 2.646.64.698 1.028 1.592 1.028 2.684 0 3.845-2.339 4.693-4.566 4.941.359.31.678.923.678 1.861 0 1.343-.012 2.426-.012 2.757 0 .268.18.58.688.481C19.138 20.197 22 16.442 22 12.017 22 6.484 17.523 2 12 2z"
            clip-rule="evenodd" />
        </svg>
      </a>

      <div class="mt-auto mb-4">
        <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">4M</div>
      </div>
    </nav>

    <!-- PrimeVue Sidebar for mobile -->
    <Drawer position="left" class="md:hidden" v-model:visible="mobileSidebarVisible" modal>
      <div class="p-4 w-64">
        <div class="flex items-center gap-3 mb-4 justify-between">
          <div class="flex items-center gap-3">
            <div>
              <div class="text-xs font-black text-slate-400 uppercase tracking-widest">Namespace</div>
              <div class="font-mono text-sm text-indigo-600 break-all">{{ config.namespace || '—' }}</div>
            </div>
          </div>
          <button type="button" class="p-2 rounded hover:bg-slate-100 text-slate-500"
            @click="mobileSidebarVisible = false" aria-label="Close menu"><i class="pi pi-times" /></button>
        </div>
        <div class="mt-6 space-y-2">
          <button @click="mobileNavigate('inbox')"
            class="w-full text-left px-3 py-2 rounded hover:bg-slate-50 hover:cursor-pointer">Inbox</button>
          <button @click="mobileNavigate('settings')"
            class="w-full text-left px-3 py-2 rounded hover:bg-slate-50 hover:cursor-pointer">Settings</button>
          <a href="#" @click.prevent="mobileNavigate('github')"
            class="w-full text-left px-3 py-2 rounded hover:bg-slate-50 flex items-center gap-2 hover:cursor-pointer">GitHub <svg
              class="w-4 h-4 ml-auto text-slate-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.428 2.865 8.185 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.607.069-.607 1.004.071 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.339-2.22-.253-4.555-1.112-4.555-4.948 0-1.092.39-1.986 1.03-2.684-.103-.253-.447-1.27.098-2.646 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.852.004 1.71.115 2.513.338 1.908-1.296 2.747-1.026 2.747-1.026.547 1.376.203 2.393.1 2.646.64.698 1.028 1.592 1.028 2.684 0 3.845-2.339 4.693-4.566 4.941.359.31.678.923.678 1.861 0 1.343-.012 2.426-.012 2.757 0 .268.18.58.688.481C19.138 20.197 22 16.442 22 12.017 22 6.484 17.523 2 12 2z" />
            </svg></a>
        </div>
      </div>
    </Drawer>

    <main class="flex-1 flex flex-col overflow-hidden">
      <template v-if="isSettingsOpen">
        <SettingsView @close="closeSettings" @cleared="onSettingsCleared" />
      </template>

      <template v-else>
        <div class="flex flex-col overflow-hidden">
          <!-- Top bar -->
          <TopBar v-model:searchQuery="searchQuery" :lastRefreshed="lastRefreshed"
            :isLoading="isLoading || isLivePolling" v-model:filterTag="filterTag"
            v-model:filterTimestamp="filterTimestamp" v-model:limit="limit" @refresh="onRefresh"
            @openMenu="mobileSidebarVisible = true" />

          <div v-if="error"
            class="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-3 text-red-700 text-sm">
            <i class="pi pi-exclamation-triangle" />
            <span>{{ error }}</span>
          </div>

          <div class="flex-1 flex overflow-hidden">
            <MailList v-show="!isMobile || !mobileViewingDetails" :emails="filteredEmails"
              :selectedId="selectedEmail?.id || null" :offset="offset" :limit="limit" @select="handleSelectEmail"
              @delete="deleteEmail" @setOffset="(o) => (offset = Math.max(0, o))" />

            <MailDetails v-show="!isMobile || mobileViewingDetails" :email="selectedEmail" :namespace="config.namespace"
              :isMobile="isMobile" @delete="deleteEmail" @prev="() => selectAdjacent(-1)"
              @next="() => selectAdjacent(1)" @closeMobile="onCloseMobile" />
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
