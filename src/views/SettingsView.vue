
<script setup lang="ts">
import { reactive, ref } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Slider from 'primevue/slider';
import ToggleSwitch  from 'primevue/inputswitch';

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

function save(e?: Event) {
  e?.preventDefault();
  setConfig({ ...localConfig });
  saveStatus.value = 'saved';
  setTimeout(() => (saveStatus.value = 'idle'), 2000);
}

async function wipeDB() {
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
        <h2 class="text-4xl font-black text-slate-800 mb-4 tracking-tighter flex items-center gap-4">
          <span class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">⚙️</span>
          Control Center
        </h2>
        <p class="text-slate-500 text-lg">Manage your API credentials and local storage persistence.</p>
      </header>

      <form @submit.prevent="save" class="space-y-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-3">
            <label class="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              API Key
              <a href="https://testmail.app/dashboard#api" target="_blank" rel="noreferrer" class="text-indigo-500 hover:scale-110 transition-transform text-sm">↗</a>
            </label>
            <InputText
              type="password"
              required
              class="w-full py-6 font-mono"
              v-model="localConfig.apiKey"
              placeholder="Your API Key"
            />
          </div>

          <div class="space-y-3">
            <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Namespace</label>
            <InputText
              required
              class="w-full py-6 font-bold text-indigo-600"
              v-model="localConfig.namespace"
              placeholder="e.g. 4mg22"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="space-y-4 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
            <div class="flex justify-between items-center">
              <label class="text-sm font-black text-slate-700">Polling Interval</label>
              <span class="text-sm font-black text-indigo-600 bg-white px-3 py-1 rounded-xl shadow-sm border">{{ localConfig.refreshInterval }}s</span>
            </div>

            <Slider v-model="localConfig.refreshInterval" :min="10" :max="300" :step="10" :disabled="localConfig.liveQuery" class="w-full" />

            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Only used when Live Query is disabled.</p>
          </div>

          <div class="flex items-center justify-between p-6 bg-indigo-50/50 rounded-3xl border-2 border-indigo-100">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-indigo-600">⚡</span>
                <label class="text-sm font-black text-indigo-900">Live Query Mode</label>
              </div>
              <p class="text-[10px] text-indigo-500 font-bold max-w-45">Instant delivery using long-polling API.</p>
            </div>
            <ToggleSwitch v-model="localConfig.liveQuery" />
          </div>
        </div>

        <div class="space-y-6 pt-10 border-t-2 border-slate-100">
          <div class="flex flex-col sm:flex-row gap-6">
            <Button type="submit" class="flex-2 text-lg h-16 rounded-2xl shadow-xl shadow-indigo-100" label="Apply Configuration">
              <template #icon>
                <i v-if="saveStatus === 'saved'" class="pi pi-check mr-2"></i>
              </template>
            </Button>

            <Button type="button" class="flex-1 h-16 rounded-2xl bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 shadow-none" label="Wipe DB" @click="wipeDB" />
          </div>

          <button type="button" class="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors" @click="back">Back to Inbox</button>
        </div>
      </form>

      <div class="mt-16 p-8 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative">
        <h3 class="text-2xl font-black mb-6 tracking-tighter">API Quick Reference</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
          <div class="space-y-2">
            <h4 class="text-indigo-400 font-black uppercase tracking-widest text-[10px]">Your Namespace Address</h4>
            <p class="font-mono text-slate-300 bg-slate-800 p-3 rounded-xl border border-slate-700 break-all select-all">
              {{ (localConfig.namespace || 'namespace') + '.[tag]@inbox.testmail.app' }}
            </p>
          </div>
          <div class="space-y-2">
            <h4 class="text-emerald-400 font-black uppercase tracking-widest text-[10px]">Storage Stats</h4>
            <p class="text-slate-400 leading-relaxed">
              IndexedDB enables offline-first experience. All mail headers, content, and read states are stored securely in your browser's private storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
