<script setup lang="ts">
import Button from 'primevue/button';
import Panel from 'primevue/panel';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';

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

const headerText = computed(() => {
    if (!props.email || !props.email.headers) return 'No headers available';
    return props.email.headers.map((h: any) => h.line || `${h.key}: ${h.line}`).join('\n');
});


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
        } catch (err) {
            alert('Failed to download EML file');
        }
    }
}

function isImage(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext || '');
}
</script>

<template>
    <div class="flex-1 overflow-auto p-6">
        <Panel v-if="email" class="h-auto p-4 items-center max-w-6xl mx-auto rounded-xl border-slate-200 shadow-lg">
            <template #header>
                <div class="flex items-start justify-between gap-4">
                    <div class="flex flex-col gap-3">
                        <h2 class="mt-1 text-2xl font-black text-slate-800 leading-tight">{{ email.subject || '(no subject)' }}
                        </h2>

                        <div class="min-w-0 flex items-center gap-3 text-sm text-slate-600">
                            <Avatar :label="email.from?.substring(0, 1).toUpperCase()" size="small" shape="circle"
                                class="bg-indigo-100 text-indigo-600 font-bold"></Avatar>
                            <div>
                                <div class="text-sm font-semibold">{{ email.from_parsed?.[0]?.name || email.from }}
                                </div>
                                <div class="text-xs text-slate-400">{{ email.from_parsed?.[0]?.address || '' }}</div>
                            </div>
                            <div class="text-[11px] text-slate-400 mt-1">{{ new Date(email.timestamp).toLocaleString()
                                }}</div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 self-end">
                        <Button :icon="showHeaders ? 'pi pi-eye-slash' : 'pi pi-eye'"
                            :label="showHeaders ? 'Hide Headers' : 'Show Headers'" class="p-button-text p-button-sm"
                            @click="showHeaders = !showHeaders"></Button>

                        <Button icon="pi pi-download" label="EML" class="p-button-text p-button-sm"
                            @click="downloadEML(email)"></Button>
                    </div>
                </div>
            </template>

            <!-- recipients / context box -->

            <div class="border border-slate-200 rounded-2xl bg-slate-50 p-6 mb-8 flex flex-col md:flex-row gap-8">
                <div class="flex-1">
                    <div
                        class="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">
                        <i class="pi pi-users" />
                        Recipients
                    </div>
                    <div class="space-y-2">
                        <div class="text-xs"><span class="font-bold text-slate-700">TO</span>
                            <p class="text-slate-500 font-mono break-all">{{ email.to }}</p>
                        </div>
                        <div v-if="email.cc" class="text-xs"><span class="font-bold text-slate-700">CC</span>
                            <p class="text-slate-500 font-mono break-all">{{ email.cc }}</p>
                        </div>
                        <div v-if="email.bcc" class="text-xs"><span class="font-bold text-slate-700">BCC</span>
                            <p class="text-slate-500 font-mono break-all">{{ email.bcc }}</p>
                        </div>
                    </div>
                </div>
                <div class="w-px bg-slate-200 hidden md:block"></div>
                <div class="flex-1">
                    <div
                        class="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">
                        <i class="pi pi-info-circle" />
                        Context
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                            <p class="text-slate-400 mb-0.5">Namespace</p>
                            <p class="font-bold text-slate-700">{{ email.namespace }}</p>
                        </div>
                        <div>
                            <p class="text-slate-400 mb-0.5">Tag</p>
                            <div
                                class="inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold shadow-sm">
                                #{{ email.tag }}</div>
                        </div>
                        <div>
                            <p class="text-slate-400 mb-0.5">Spam Score</p>
                            <p class="font-bold text-slate-700">{{ email.spam_score ?? 'N/A' }}</p>
                        </div>
                        <div v-if="email.spam_report">
                            <p class="text-slate-400 mb-0.5">Spam Report</p>
                            <p class="font-bold text-slate-700 text-xs break-words">{{ email.spam_report }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- verified content -->
            <div class="rounded-lg w-full h-[70vh] bg-white border border-slate-200 overflow-auto">
                <iframe v-if="email.html" :srcdoc="email.html" sandbox="allow-popups allow-popups-to-escape-sandbox" class="w-full h-full border-none"></iframe>
                <pre v-else class="p-8 text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed selection:bg-indigo-100">{{ email.text || 'No preview available' }}</pre>
            </div>

            <!-- attachments -->
            <div v-if="email.attachments?.length">
                            <Divider class="my-8" />

                <h3 class="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">Attachments ({{
                    email.attachments.length
                }})</h3>
                <div class="flex flex-wrap gap-2">
                    <div v-for="att in email.attachments" :key="att.filename"
                        class="w-64 flex flex-col p-4 border-2 border-slate-100 rounded-2xl bg-white hover:border-indigo-200 transition-all group overflow-hidden">
                        <div class="flex items-center mb-3">
                            <div
                                class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mr-3 shrink-0">
                                <i class="pi pi-file text-indigo-600 text-lg"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-slate-900 truncate" :title="att.filename">{{
                                    att.filename }}</p>
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ (att.size
                                    /
                                    1024).toFixed(1) }} KB</p>
                            </div>
                        </div>
                        <div v-if="isImage(att.filename)"
                            class="mb-3 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 aspect-video relative group-hover:shadow-inner transition-shadow">
                            <img alt="Preview" class="w-full h-full object-cover" :src="att.downloadUrl">
                        </div>
                        <div class="flex gap-2 mt-auto">
                            <a :href="att.downloadUrl" target="_blank" rel="noreferrer" class="flex-1">
                                <Button icon="pi pi-download" label="Download" severity="secondary"
                                    class="p-button-sm w-full"></Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>


            <!-- Headers modal -->
            <Dialog v-model:visible="showHeaders" modal :closable="true" dismissable-mask :header="'Email Transport Headers'" :style="{ width: '50rem' }" class="bg-slate-800 text-white border-none rounded-xl shadow-lg">
                <pre class="font-mono text-xs leading-snug p-4 max-h-96 overflow-auto text-slate-200 bg-slate-900 rounded-lg"
                    >{{ headerText }}</pre>
            </Dialog>
        </Panel>

        <div v-else class="h-full flex items-center justify-center text-slate-400">
            <div class="flex flex-col items-center text-center mx-auto max-w-md">
                    <i class="pi pi-envelope text-6xl text-slate-200 mb-3"></i>
                <div class="text-lg font-black">Select a message</div>
                <div class="text-sm text-slate-400 mt-2">Your testing emails will appear in the sidebar.</div>
            </div>
        </div>
    </div>
</template>
