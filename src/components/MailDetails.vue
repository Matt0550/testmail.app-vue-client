<script setup lang="ts">
import Button from 'primevue/button';
import Panel from 'primevue/panel';

const props = defineProps<{
    email: any | null;
    namespace?: string;
}>();

const emit = defineEmits<{
    (e: 'delete', id: string): void;
    (e: 'prev'): void;
    (e: 'next'): void;
}>();

import { ref, computed } from 'vue';

const showHeaders = ref(false);
const toggleAttachments = ref(false);

const headerText = computed(() => {
    if (!props.email || !props.email.headers) return 'No headers available';
    return props.email.headers.map((h: any) => h.line || `${h.key}: ${h.line}`).join('\n');
});

function onDelete(id: string) { emit('delete', id); }

async function downloadEML(email: any) {
    if (!email) return;
    const url = email.downloadUrl;
    if (!url) return;
    try {
        // try a direct download first
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.download = `${email.id}.eml`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (err) {
        // fallback: fetch blob
        try {
            const resp = await fetch(url);
            const blob = await resp.blob();
            const href = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = href;
            a.download = `${email.id}.eml`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(href);
        } catch (e) {
            console.error('EML download failed', e);
        }
    }
}
</script>

<template>
    <div class="flex-1 overflow-auto p-6 bg-white">
        <Panel v-if="email" class="h-full p-4 lg:mx-8">
            <template #header>
                <div class="flex items-start justify-between gap-4">
                    <div class="flex flex-col gap-3">
                        <h2 class="mt-1 text-2xl font-extrabold leading-tight">{{ email.subject || '(no subject)' }}</h2>

                        <div class="min-w-0 flex items-center gap-3 text-sm text-slate-600">
                            <Avatar :label="email.from?.substring(0, 1).toUpperCase()" size="small" shape="circle"
                                class="bg-indigo-100 text-indigo-600 font-bold"></Avatar>
                            <div>
                                <div class="text-sm font-semibold">{{ email.from_parsed?.[0]?.name || email.from }}</div>
                                <div class="text-xs text-slate-400">{{ email.from_parsed?.[0]?.address || '' }}</div>
                            </div>
                            <div class="text-[11px] text-slate-400 mt-1">{{ new Date(email.timestamp).toLocaleString() }}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <Button :icon="showHeaders ? 'pi pi-eye-slash' : 'pi pi-eye'"
                            :label="showHeaders ? 'Hide Headers' : 'Show Headers'" class="p-button-text p-button-sm"
                            @click="showHeaders = !showHeaders"></Button>

                        <Button icon="pi pi-download" label="EML" class="p-button-text p-button-sm" @click="downloadEML(email)"></Button>
                    </div>
                </div>
            </template>

            <!-- recipients / context box -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div class="rounded-lg bg-slate-50 p-3 border border-slate-100 text-sm">
                    <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Recipients</div>
                    <div class="font-semibold">Recipient</div>
                    <div class="text-xs text-slate-500 mt-1">{{ email.envelope_to || (namespace + '@inbox.testmail.app')
                        }}</div>
                </div>
                <div class="rounded-lg bg-slate-50 p-3 border border-slate-100 text-sm flex flex-col justify-between">
                    <div>
                        <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Context</div>
                        <div class="text-xs text-slate-600">Namespace <div class="font-semibold mt-1">{{ namespace ||
                            '—' }}</div>
                        </div>
                    </div>
                    <div class="mt-3 text-right">
                        <span
                            class="inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">#{{
                                email.tag }}</span>
                    </div>
                </div>
            </div>

            <!-- attachments -->
            <div v-if="toggleAttachments && email.attachments?.length" class="mb-4">
                <div class="text-sm font-bold mb-2">Attachments</div>
                <ul class="space-y-2">
                    <li v-for="att in email.attachments" :key="att.filename"
                        class="flex items-center justify-between bg-white border rounded-md p-3">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-paperclip text-slate-400" />
                            <div>
                                <div class="font-semibold text-sm">{{ att.filename }}</div>
                                <div class="text-xs text-slate-400">{{ (att.size / 1024).toFixed(1) }} KB</div>
                            </div>
                        </div>
                        <a :href="att.downloadUrl" target="_blank" class="text-indigo-600 text-sm">Download</a>
                    </li>
                </ul>
            </div>

            <!-- verified content -->
            <div class="mb-6">
                <div class="flex items-center gap-3 mb-3 text-xs text-indigo-600 font-bold uppercase tracking-wider">
                    <i class="pi pi-check-circle" /> VERIFIED CONTENT
                </div>

                <div class="rounded-lg border border-slate-100 bg-white overflow-hidden">
                    <div class="h-110 overflow-auto p-4 bg-[#fafafa]">
                        <div class="max-w-3xl mx-auto bg-white rounded-md p-6 shadow-sm"
                            v-html="email.html || email.text"></div>
                    </div>
                </div>
            </div>

            <!-- Headers modal -->
            <div v-if="showHeaders" class="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 px-4">
                <div
                    class="w-full max-w-3xl rounded-lg overflow-hidden border border-slate-800 shadow-lg bg-slate-900 text-white">
                    <div class="flex items-center justify-between p-3 border-b border-slate-800">
                        <div class="text-xs text-slate-400 uppercase tracking-widest">Email Transport Headers</div>
                        <button @click="showHeaders = false" class="text-slate-400 hover:text-white">✕</button>
                    </div>
                    <pre class="font-mono text-xs leading-snug p-4 max-h-96 overflow-auto text-slate-200"
                        style="background:linear-gradient(#0b0f14, #0b0f14);">{{ headerText }}</pre>
                </div>
            </div>
        </Panel>

        <div v-else class="h-full flex items-center justify-center text-slate-400">
            <div class="text-center">
                <div class="w-24 h-24 rounded-full bg-white shadow flex items-center justify-center mb-6">
                    <i class="pi pi-envelope text-3xl text-slate-200"></i>
                </div>
                <div class="text-lg font-black">Select a message</div>
                <div class="text-sm text-slate-400 mt-2">Your testing emails will appear in the sidebar.</div>
            </div>
        </div>
    </div>
</template>
