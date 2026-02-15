<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Slider from 'primevue/slider';

import { useAppConfig } from '@composables/useAppConfig';
import { clearEmailsDB } from '@services/db';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'cleared'): void;
}>();

const { config, setConfig } = useAppConfig();

// local editable copy
const localConfig = reactive({ ...config.value });
const saveStatus = ref<'idle' | 'saved'>('idle');
const showApiKey = ref(false);
const showAdvanced = ref(false);

const canSave = computed(() => !!localConfig.apiKey && !!localConfig.namespace);

function save(e?: Event) {
  e?.preventDefault();
  if (!canSave.value) return;
  setConfig({ ...localConfig });
  saveStatus.value = 'saved';
  setTimeout(() => (saveStatus.value = 'idle'), 2000);
}

async function wipeDB() {
  const ok = window.confirm('Wipe local database? This will remove all stored emails (cannot be undone). Continue?');
  if (!ok) return;
  await clearEmailsDB();
  emit('cleared');
}

function back() {
  emit('close');
}

</script>

<template>
  <div class="flex-1 overflow-y-auto p-6 lg:p-12 bg-white">
    <div class="max-w-3xl mx-auto">
      <header class="mb-12">
        <h2 class="text-3xl font-semibold text-slate-800 mb-3 tracking-tight flex items-center gap-4">
          <span
            class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold"><i
              class="pi pi-cog text-lg" /></span>
          Settings
        </h2>
        <p class="text-slate-500 text-sm">Manage API credentials, sync and local storage settings.</p>
      </header>

      <form @submit.prevent="save" class="space-y-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-3">
            <label class="text-sm font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
              API Key
              <a href="https://testmail.app/docs/#get-started" target="_blank" rel="noreferrer"
                class="text-indigo-500 hover:scale-110 transition-transform text-sm">↗</a>
            </label>
            <div class="relative">
              <InputText :type="showApiKey ? 'text' : 'password'" required class="w-full py-3 font-mono text-sm pr-10"
                v-model="localConfig.apiKey" placeholder="Your API Key" />
              <Button variant="text" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                @click="showApiKey = !showApiKey" :aria-pressed="showApiKey">
                <i :class="showApiKey ? 'pi pi-eye-slash' : 'pi pi-eye'" />
              </Button>
            </div>
          </div>

          <div class="space-y-3">
            <label class="text-sm font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">Namespace</label>
            <InputText required class="w-full py-3 font-semibold text-indigo-600 text-sm"
              v-model="localConfig.namespace" placeholder="e.g. 4mg22" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6">
          <div class="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-indigo-600">⚡</span>
                <label class="text-sm font-semibold text-indigo-900">Live Query Mode</label>
              </div>
              <p class="text-xs text-indigo-500">Instant delivery using long-polling API.</p>
            </div>
            <InputSwitch v-model="localConfig.liveQuery" />
          </div>

          <Panel toggleable header="Advanced Settings" class="border-slate-200" :collapsed="!showAdvanced" @toggle="showAdvanced = !showAdvanced">
              <div class="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div class="flex justify-between items-center">
                  <label class="text-sm font-semibold text-slate-700">Polling Interval</label>
                  <span class="text-sm font-semibold text-indigo-600 bg-white px-3 py-1 rounded-xl shadow-sm border">{{
                    localConfig.refreshInterval }}s</span>
                </div>

                <div class="mt-3">
                  <Slider v-model="localConfig.refreshInterval" :min="10" :max="300" :step="10"
                    :disabled="localConfig.liveQuery" class="w-full" />
                  <p class="text-xs text-slate-400 mt-2">Used when Live Query is disabled.</p>
                </div>
              </div>
          </Panel>
        </div>

        <div class="space-y-4 pt-8 border-t border-slate-100">
          <div class="flex flex-col sm:flex-row gap-4">
            <Button type="submit" :disabled="!canSave" class="flex-2 text-base h-12 rounded-xl shadow-sm"
              label="Save changes">
              <template #icon>
                <i v-if="saveStatus === 'saved'" class="pi pi-check mr-2"></i>
              </template>
            </Button>

            <Button type="button"
              class="flex-1 h-12 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 shadow-none"
              label="Wipe DB" @click="wipeDB" />
          </div>

          <Button type="button" variant="text" class="mt-4 text-slate-500 hover:text-slate-700" @click="back">
            <i class="pi pi-arrow-left mr-2" />
            Back to Inbox
          </Button>
        </div>
      </form>

      <div class="mt-12 p-6 bg-slate-900 rounded-2xl text-white overflow-hidden relative">
        <h3 class="text-xl font-semibold mb-4 tracking-tight">API Quick Reference</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div class="space-y-2">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-indigo-400">Your Namespace Address</h4>
            <div class="flex items-center gap-3">
              <p
                class="font-mono text-slate-300 bg-slate-800 p-3 rounded-xl border border-slate-700 break-all select-all flex-1">
                {{ (localConfig.namespace || 'namespace') + '.[tag]@inbox.testmail.app' }}
              </p>
            </div>
          </div>
          <div class="space-y-2">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-emerald-400">Storage Stats</h4>
            <p class="text-slate-400 leading-relaxed text-sm">
              IndexedDB enables offline-first experience. All mail headers, content, and read states are stored securely
              in
              your browser's private storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
