<template>
    <Head :title="practical.title" />

    <div v-if="flash?.info" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #E5F0FF; color: #1A56DB">
        {{ flash.info }}
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <div class="flex items-center gap-2.5">
                <h2 class="text-lg font-semibold" style="color: #1B2231">{{ practical.title }}</h2>
                <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs" style="color: #5A6376">Practical</span>
                <span class="rounded bg-[#EEF2F7] px-2 py-0.5 text-xs font-medium" style="color: #1D3557">Attempt {{ attemptNumber }} / {{ practical.max_attempts }}</span>
            </div>
            <p v-if="practical.instructions" class="mt-2 text-sm whitespace-pre-wrap" style="color: #404A5C">{{ practical.instructions }}</p>
        </div>
        <div v-if="remainingSeconds !== null" class="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium" :class="remainingSeconds < 60 ? 'border-[#F6DEDD] text-[#AA3C36]' : 'border-[#D2D6DE] text-[#404A5C]'" style="background-color: white">
            <Clock class="h-4 w-4" :stroke-width="2" />
            {{ formatTime(remainingSeconds) }}
        </div>
    </div>

    <div class="mb-6 card p-5">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Rubric criteria</h3>
        <p class="mb-4 text-sm" style="color: #5A6376">Your teacher will assess your work based on the following criteria.</p>
        <div v-for="(c, ci) in practical.criteria" :key="c.id" class="mb-3 rounded-lg border border-[#E9EBEF] p-4">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-sm font-medium" style="color: #1B2231">{{ ci + 1 }}. {{ c.criterion_name }}</p>
                    <p v-if="c.description" class="mt-0.5 text-xs" style="color: #5A6376">{{ c.description }}</p>
                </div>
                <span class="shrink-0 rounded bg-[#E9EBEF] px-2 py-0.5 text-xs font-medium" style="color: #5A6376">{{ c.max_points }} pts</span>
            </div>
        </div>
    </div>

    <div class="mb-6 card p-5">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Your submission</h3>
        <div class="mb-4 flex items-center gap-2 border-b border-[#E9EBEF]">
            <button @click="tab = 'code'" class="px-4 py-2.5 text-sm font-medium transition-colors" :class="tab === 'code' ? 'border-b-2 border-[#1D3557] text-[#1D3557]' : 'text-[#5A6376] hover:text-[#2B3444]'">
                <FileCode class="h-4 w-4 inline mr-1.5" :stroke-width="2" />
                Code / Text
            </button>
            <button @click="tab = 'image'" class="px-4 py-2.5 text-sm font-medium transition-colors" :class="tab === 'image' ? 'border-b-2 border-[#1D3557] text-[#1D3557]' : 'text-[#5A6376] hover:text-[#2B3444]'">
                <ImageIcon class="h-4 w-4 inline mr-1.5" :stroke-width="2" />
                Upload image
            </button>
        </div>

        <div v-if="tab === 'code'">
            <textarea v-model="submissionText" rows="12" class="input-field font-mono text-sm w-full" placeholder="Paste your code or write your answer here..." style="color: #1B2231"></textarea>
        </div>

        <div v-else>
            <div class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D2D6DE] p-8 transition-colors" :class="dragging ? 'border-[#1D3557] bg-[#EEF2F7]' : ''" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="handleDrop">
                <ImageIcon class="mb-3 h-10 w-10" :stroke-width="1.5" style="color: #7C8598" />
                <p class="mb-1 text-sm font-medium" style="color: #404A5C">Drop an image here, or click to browse</p>
                <p class="mb-3 text-xs" style="color: #7C8598">PNG, JPG, JPEG, GIF up to 10MB</p>
                <input ref="fileInput" type="file" accept="image/png,image/jpg,image/jpeg,image/gif" class="hidden" @change="handleFile" />
                <button @click="fileInput?.click()" class="btn-secondary">Choose file</button>
            </div>
            <div v-if="previewUrl" class="mt-4">
                <p class="mb-2 text-xs font-medium" style="color: #5A6376">Preview:</p>
                <img :src="previewUrl" class="max-h-96 rounded-lg border border-[#E9EBEF]" />
                <button @click="clearFile" class="mt-2 flex items-center gap-1 text-xs font-medium hover:underline" style="color: #AA3C36">
                    <X class="h-3.5 w-3.5" :stroke-width="2" />
                    Remove file
                </button>
            </div>
        </div>
    </div>

    <div class="flex items-center justify-end gap-3">
        <button @click="submit" class="btn-primary" :disabled="submitting || (!submissionText && !selectedFile)">
            <Send class="h-4 w-4" :stroke-width="2" />
            {{ submitting ? 'Submitting...' : 'Submit practical' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Clock, Send, FileCode, Image as ImageIcon, X } from '@lucide/vue';
import { onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{ practical: any; startedAt: string; attemptNumber: number }>();

const page = usePage();
const flash = page.props.flash as any;
const submitting = ref(false);
const remainingSeconds = ref<number | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const tab = ref<'code' | 'image'>('code');
const submissionText = ref('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const dragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function tick() {
    if (remainingSeconds.value === null) return;
    remainingSeconds.value -= 1;
    if (remainingSeconds.value <= 0) {
        if (timer) clearInterval(timer);
        submit();
    }
}

onMounted(() => {
    if (props.practical.time_limit_minutes && props.startedAt) {
        const start = new Date(props.startedAt).getTime();
        const deadline = start + props.practical.time_limit_minutes * 60 * 1000;
        remainingSeconds.value = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
        if (remainingSeconds.value > 0) {
            timer = setInterval(tick, 1000);
        }
    }
});

onUnmounted(() => { if (timer) clearInterval(timer); });

function handleFile(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) {
        selectedFile.value = target.files[0];
        previewUrl.value = URL.createObjectURL(target.files[0]);
    }
}

function handleDrop(e: DragEvent) {
    dragging.value = false;
    if (e.dataTransfer?.files.length) {
        selectedFile.value = e.dataTransfer.files[0];
        previewUrl.value = URL.createObjectURL(e.dataTransfer.files[0]);
    }
}

function clearFile() {
    selectedFile.value = null;
    previewUrl.value = null;
    if (fileInput.value) fileInput.value.value = '';
}

function submit() {
    if (!confirm('Submit practical? This cannot be undone.')) return;
    submitting.value = true;

    const formData = new FormData();
    if (submissionText.value) formData.append('submission_text', submissionText.value);
    if (selectedFile.value) formData.append('submission_file', selectedFile.value);

    router.post('/student/practicals/' + props.practical.id + '/submit', formData, {
        preserveScroll: true,
        onFinish: () => { submitting.value = false; },
    });
}
</script>