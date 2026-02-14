
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Sidebar from 'primevue/sidebar';
import TopBar from '@components/TopBar.vue';

import SettingsView from '@views/SettingsView.vue';
import MailList from '@components/MailList.vue';
import MailDetails from '@components/MailDetails.vue';
import { useAppConfig } from '@composables/useAppConfig';
import { useEmails } from '@composables/useEmails';

const { config } = useAppConfig();
const isSettingsOpen = ref(!config.value.apiKey || !config.value.namespace);
const mobileSidebarVisible = ref(false);

// UI state
const selectedEmailId = ref<string | null>(null);
const searchQuery = ref('');
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
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return emails.value;
  return emails.value.filter(e =>
    (e.subject || '').toLowerCase().includes(q) ||
    (e.from || '').toLowerCase().includes(q) ||
    (e.tag || '').toLowerCase().includes(q)
  );
});

const selectedEmail = computed(() => emails.value.find(e => e.id === selectedEmailId.value) || null);

function handleSelectEmail(id: string) {
  selectedEmailId.value = id;
  markRead(id);
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
}

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
        :class="['w-14 h-14 rounded-lg flex items-center justify-center hover:scale-105 transition-transform', !isSettingsOpen ? 'bg-white text-indigo-700' : 'bg-indigo-600/90']"
        aria-label="inbox"
        @click="isSettingsOpen = false"
      >
        <i class="pi pi-envelope text-xl" />
      </button>

      <button
        :class="['w-14 h-14 rounded-lg flex items-center justify-center hover:scale-105 transition-transform', isSettingsOpen ? 'bg-white text-indigo-700' : 'bg-indigo-600/80']"
        @click="isSettingsOpen = true"
        aria-label="settings"
      >
        <i class="pi pi-cog text-xl" />
      </button>

      <div class="mt-auto mb-4">
        <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">4M</div>
      </div>
    </nav>

    <!-- PrimeVue Sidebar for mobile -->
    <Sidebar position="left" class="md:hidden" :visible="mobileSidebarVisible" @hide="mobileSidebarVisible = false">
      <div class="p-4 w-64">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">TM</div>
          <div>
            <div class="text-sm font-black">TestMail</div>
            <div class="text-xs text-slate-400">v1 • Client</div>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-xs font-black text-slate-400 uppercase tracking-widest">Namespace</div>
          <div class="font-mono text-sm text-indigo-600 break-all">{{ config.namespace || '—' }}</div>
        </div>
        <div class="mt-6 space-y-2">
          <button @click="mobileSidebarVisible = false; isSettingsOpen = false" class="w-full text-left px-3 py-2 rounded hover:bg-slate-50">Inbox</button>
          <button @click="mobileSidebarVisible = false; isSettingsOpen = true" class="w-full text-left px-3 py-2 rounded hover:bg-slate-50">Settings</button>
        </div>
      </div>
    </Sidebar>

    <main class="flex-1 flex flex-col overflow-hidden">
      <template v-if="isSettingsOpen">
        <SettingsView @close="closeSettings" @cleared="onSettingsCleared" />
      </template>

      <template v-else>
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Top bar -->
          <TopBar
            v-model:searchQuery="searchQuery"
            :lastRefreshed="lastRefreshed"
            :isLoading="isLoading || isLivePolling"
            v-model:filterTag="filterTag"
            v-model:filterSubject="filterSubject"
            v-model:filterTimestamp="filterTimestamp"
            v-model:limit="limit"
            @refresh="onRefresh"
            @openMenu="mobileSidebarVisible = true"
          />

          <div v-if="error" class="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-3 text-red-700 text-sm">
            <i class="pi pi-exclamation-triangle" />
            <span>{{ error }}</span>
          </div>

          <div class="flex-1 flex overflow-hidden">
            <MailList
              :emails="filteredEmails"
              :selectedId="selectedEmail?.id || null"
              :offset="offset"
              :limit="limit"
              @select="handleSelectEmail"
              @delete="deleteEmail"
              @setOffset="(o) => (offset = o)"
            />

            <MailDetails
              :email="selectedEmail"
              :namespace="config.namespace"
              @delete="deleteEmail"
              @prev="() => selectAdjacent(-1)"
              @next="() => selectAdjacent(1)"
            />
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

