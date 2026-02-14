<script setup lang="ts">
const props = defineProps<{
  searchQuery: string;
  lastRefreshed: Date | null;
  isLoading: boolean;
  filterTag: string;
  filterTimestamp: string;
  filterSubject: string;
  limit: number;
}>();

const emit = defineEmits<{
  (e: 'update:searchQuery', v: string): void;
  (e: 'refresh'): void;
  (e: 'openMenu'): void;
  (e: 'update:filterTag', v: string): void;
  (e: 'update:filterTimestamp', v: string): void;
  (e: 'update:filterSubject', v: string): void;
  (e: 'update:limit', v: number): void;
}>();

function onSearchInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  emit('update:searchQuery', v);
}

function onTagInput(e: Event) {
  emit('update:filterTag', (e.target as HTMLInputElement).value);
}

function onSubjectInput(e: Event) {
  emit('update:filterSubject', (e.target as HTMLInputElement).value);
}

function onTimestampInput(e: Event) {
  emit('update:filterTimestamp', (e.target as HTMLInputElement).value);
}

function onLimitChange(e: Event) {
  emit('update:limit', parseInt((e.target as HTMLSelectElement).value || '10'));
}


</script>

<template>
  <header class="bg-white px-6 py-3 shrink-0 shadow-sm z-10">
    <div class="flex items-center justify-between gap-4 mb-3">
      <div class="flex items-center gap-4 flex-1">
        <button class="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100" @click="$emit('openMenu')">☰</button>
        <h1 class="text-xl font-bold text-slate-800 hidden sm:block">Inbox</h1>
        <div class="relative max-w-md w-full ml-4">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search locally..."
            class="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-200 transition-all outline-none"
            :value="props.searchQuery"
            @input="onSearchInput"
          />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span v-if="props.lastRefreshed" class="text-[10px] uppercase font-bold text-slate-400 hidden lg:block tracking-widest">
          Synced {{ props.lastRefreshed ? props.lastRefreshed.toLocaleTimeString() : '-' }}
        </span>
        <Button icon="pi pi-refresh" class="p-button-text"  :loading="props.isLoading" @click="$emit('refresh')"></Button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-4 text-xs">
      <div class="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-2 py-1 shadow-xs">
        <i class="pi pi-filter text-slate-400" />
        <span class="font-bold text-slate-500 uppercase tracking-tighter">API Filters:</span>
        <input
          type="text"
          placeholder="Tag (Enter to apply)"
          class="bg-transparent border-none outline-none w-28 text-indigo-600 font-medium placeholder:text-slate-300"
          :value="props.filterTag"
          @input="onTagInput"
          @keydown.enter="$emit('refresh')"
        />
        <input
          type="text"
          placeholder="Subject (server-side)"
          class="bg-transparent border-none outline-none w-56 text-slate-600 placeholder:text-slate-300 ml-2"
          :value="props.filterSubject"
          @input="onSubjectInput"
          @keydown.enter="$emit('refresh')"
        />
        <div class="w-px h-4 bg-slate-200" />
        <input
          type="datetime-local"
          class="bg-transparent border-none outline-none text-slate-600"
          :value="props.filterTimestamp"
          @input="onTimestampInput"
        />
      </div>

      <div class="flex items-center gap-2 text-slate-500">
        <span>Show</span>
        <select class="bg-white border rounded px-1.5 py-0.5 outline-none font-bold text-indigo-600 shadow-sm" :value="props.limit" @change="onLimitChange">
          <option v-for="v in [10,25,50,100]" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>
    </div>
  </header>
</template>