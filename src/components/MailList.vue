<script setup lang="ts">
import { computed } from 'vue';
import { formatEmailDate } from '@utils/date';

const props = defineProps<{
    emails: any[];
    selectedId: string | null;
    offset: number;
    limit: number;
}>();

const emit = defineEmits<{
    (e: 'select', id: string): void;
    (e: 'delete', id: string): void;
    (e: 'setOffset', o: number): void;
}>();

// client-side paging of the passed `emails` array
const pageCount = computed(() => Math.max(1, Math.ceil(props.emails.length / Math.max(1, props.limit))));
const currentPage = computed(() => Math.floor(props.offset / Math.max(1, props.limit)) + 1);
const startIndex = computed(() => Math.min(props.offset, props.emails.length));
const endIndex = computed(() => Math.min(props.offset + props.limit, props.emails.length));
const pagedEmails = computed(() => props.emails.slice(startIndex.value, endIndex.value));
const empty = computed(() => props.emails.length === 0);

function onSelect(id: string) { emit('select', id); }
function onDelete(id: string) { emit('delete', id); }
function setOffset(o: number) { emit('setOffset', Math.max(0, o)); }
</script>

<template>
    <div class="w-full md:w-80 lg:w-96 border-r border-slate-100 bg-white flex flex-col shrink-0 h-full shadow-sm">
        <div class="flex-1 overflow-y-auto w-full">
            <div v-if="empty"
                class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full">
                <i class="pi pi-inbox text-4xl opacity-20 mb-4"></i>
                <p class="text-sm font-medium">No emails found</p>
                <p class="text-xs">Check filters or fetch again.</p>
            </div>

            <div v-else>
                <div v-for="email in pagedEmails" :key="email.id" @click="onSelect(email.id)" :class="[
                    'w-full block text-left py-3 px-3 pl-4 border-b border-slate-200 transition-colors hover:cursor-pointer hover:bg-slate-50 relative group outline-none',
                    selectedId === email.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                ]">
                    <span v-if="!email.read" class="absolute left-1 top-4 w-2 h-2 rounded-full bg-indigo-600" />
                    <div class="flex justify-between items-start gap-2 w-full">
                        <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                            <div class="min-w-0">
                                <div
                                    :class="['truncate text-sm', !email.read ? 'font-semibold text-slate-800' : 'text-slate-600']">
                                    {{ email.from_parsed?.[0]?.name || email.from }}</div>
                                <div :class="['text-xs text-slate-400 truncate', !email.read ? 'font-semibold text-slate-800' : '']">{{ email.subject || '(no subject)' }}
                                </div>
                                <!-- body preview -->
                                <div class="text-[10px] text-slate-500 truncate mt-1">{{ email.text?.substring(0, 100)
                                    || '(no body)' }}</div>
                                <div class="mt-1"><span
                                        class="inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">{{
                                            email.tag }}</span></div>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <div class="text-[10px] text-slate-400">{{ formatEmailDate(email.timestamp) }}
                            </div>

                        </div>
                    </div>

                    <Button icon="pi pi-trash"
                        class="p-button-text p-button-sm absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        @click.stop="onDelete(email.id)"></Button>
                </div>
            </div>
        </div>

        <div class="h-12 border-t border-slate-200 px-4 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span v-if="!empty">Showing {{ startIndex + 1 }}–{{ endIndex }} (Page {{ currentPage }} / {{ pageCount }})</span>
              <span v-else>No emails</span>
            </div>
            <div class="flex gap-2">
                <Button icon="pi pi-angle-left" size="small" variant="text" :disabled="offset === 0 || currentPage <= 1"
                    @click="setOffset(offset - limit)"></Button>
                <Button icon="pi pi-angle-right" size="small" variant="text" :disabled="offset + limit >= emails.length || currentPage >= pageCount"
                    @click="setOffset(offset + limit)"></Button>
            </div>
        </div>
    </div>
</template>
