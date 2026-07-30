<template>
    <Head :title="practical.title" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background: var(--gl-bg); overflow-y: auto;">
        <div class="px-6 py-6">

    <!-- Flash messages -->
    <div v-if="flash?.info" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: rgba(59,130,246,0.12); color: var(--gl-primary); border: 1px solid rgba(59,130,246,0.2);">
        {{ flash.info }}
    </div>
    <div v-if="restored && !practical.time_limit_minutes" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-warning-bg); color: var(--gl-accent); border: 1px solid rgba(251,191,36,0.2);">
        <RotateCw class="inline h-3.5 w-3.5 mr-1.5" :stroke-width="2" />
        Progress restored from previous session.
    </div>

    <div class="flex gap-6">
        <!-- Left: Main Content -->
        <div class="min-w-0 flex-1">

            <!-- Challenge Header -->
            <div class="relative mb-6 overflow-hidden rounded-2xl p-6 gl-fade-in"
                style="background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(124,58,237,0.08)); border: 1px solid var(--gl-border);">
                <div class="relative z-10">
                    <div class="flex flex-wrap items-start justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <div class="flex h-12 w-12 items-center justify-center rounded-xl"
                                style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary)); box-shadow: 0 0 20px rgba(239,68,68,0.3);">
                                <Target class="h-6 w-6 text-white" :stroke-width="2" />
                            </div>
                            <div>
                                <div class="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ practical.title }}</h1>
                                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                        style="background: rgba(239,68,68,0.12); color: #EF4444;">Practical</span>
                                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                        style="background: rgba(59,130,246,0.12); color: var(--gl-primary);">
                                        Attempt {{ attemptNumber }} / {{ practical.max_attempts }}
                                    </span>
                                </div>
                                <p class="text-sm" style="color: var(--gl-text-secondary)">
                                    Complete this challenge to earn XP, unlock achievements, and improve your skills.
                                </p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-3 text-xs">
                            <span class="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                                style="background: var(--gl-surface-2); color: var(--gl-accent);">
                                <Zap class="h-3.5 w-3.5" :stroke-width="2" />
                                {{ xpReward }} XP
                            </span>
                            <span v-if="practical.time_limit_minutes" class="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                                style="background: var(--gl-surface-2); color: var(--gl-text-secondary);">
                                <Clock class="h-3.5 w-3.5" :stroke-width="2" />
                                {{ practical.time_limit_minutes }} min
                            </span>
                        </div>
                    </div>
                </div>
                <div class="absolute -right-4 -top-4 h-32 w-32 rounded-full opacity-10"
                    style="background: radial-gradient(circle, #EF4444, transparent 70%);"></div>
                <div class="absolute -bottom-4 -left-4 h-24 w-24 rounded-full opacity-10"
                    style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
            </div>

            <!-- Timer Card -->
            <div v-if="remainingSeconds !== null" class="gl-glow-card mb-6 p-5"
                :style="{ borderColor: remainingSeconds < 60 ? 'rgba(239,68,68,0.3)' : 'var(--gl-border)' }">
                <div class="flex items-center gap-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-full shrink-0"
                        :style="{ background: remainingSeconds < 60 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.12)' }">
                        <Clock class="h-6 w-6" :stroke-width="2"
                            :style="{ color: remainingSeconds < 60 ? '#EF4444' : 'var(--gl-primary)' }" />
                    </div>
                    <div>
                        <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--gl-text-muted)">Mission Timer</p>
                        <p class="text-2xl font-bold tabular-nums" :style="{ color: remainingSeconds < 60 ? '#EF4444' : 'var(--gl-text-primary)' }">
                            {{ formatTime(remainingSeconds) }}
                        </p>
                    </div>
                    <div class="ml-auto">
                        <svg class="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--gl-surface-3)" stroke-width="4" />
                            <circle cx="28" cy="28" r="24" fill="none"
                                :stroke="remainingSeconds < 60 ? '#EF4444' : 'var(--gl-primary)'"
                                stroke-width="4" stroke-linecap="round"
                                :stroke-dasharray="150.8"
                                :stroke-dashoffset="150.8 - (150.8 * timerProgress)" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Mission Brief (Instructions) -->
            <div v-if="practical.instructions" class="gl-glow-card mb-6 p-5">
                <div class="flex items-center gap-3 mb-4">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                        style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">
                        <BookOpen class="h-4.5 w-4.5 text-white" :stroke-width="2" />
                    </div>
                    <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Mission Brief</h3>
                </div>
                <div class="whitespace-pre-wrap text-sm leading-relaxed rounded-xl p-4 font-mono"
                    style="background: var(--gl-surface-2); color: var(--gl-text-secondary); border: 1px solid var(--gl-border);">
                    {{ practical.instructions }}
                </div>
            </div>

            <!-- Rubric Criteria -->
            <div class="gl-glow-card mb-6 p-5">
                <div class="flex items-center gap-3 mb-4">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                        style="background: linear-gradient(135deg, var(--gl-accent), #F59E0B);">
                        <Award class="h-4.5 w-4.5 text-white" :stroke-width="2" />
                    </div>
                    <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Scoring Criteria</h3>
                </div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div v-for="(c, ci) in practical.criteria" :key="c.id"
                        class="group rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
                        style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-3">
                                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                                    :style="{ background: criterionIcon(ci).bg, color: criterionIcon(ci).fg }">
                                    {{ ci + 1 }}
                                </div>
                                <div>
                                    <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ c.criterion_name }}</p>
                                    <p v-if="c.description" class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ c.description }}</p>
                                </div>
                            </div>
                            <span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                style="background: rgba(251,191,36,0.12); color: var(--gl-accent);">
                                +{{ c.max_points }} pts
                            </span>
                        </div>
                    </div>
                </div>
                <div class="mt-4 flex items-center gap-2 text-xs" style="color: var(--gl-text-muted)">
                    <Target class="h-3.5 w-3.5" :stroke-width="2" />
                    Total possible: <span class="font-semibold" style="color: var(--gl-text-primary)">{{ totalMaxPoints }} points</span>
                </div>
            </div>

            <!-- Submission Section -->
            <div class="gl-glow-card mb-6 overflow-hidden p-0">
                <div class="px-5 pt-5 pb-0">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                            style="background: linear-gradient(135deg, var(--gl-primary), #2563EB);">
                            <Terminal class="h-4.5 w-4.5 text-white" :stroke-width="2" />
                        </div>
                        <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Your Submission</h3>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="flex items-center gap-0 border-b" style="border-color: var(--gl-border);">
                    <button @click="tab = 'code'"
                        class="flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-all duration-200"
                        :style="tab === 'code' ? {
                            color: 'var(--gl-primary)',
                            borderBottom: '2px solid var(--gl-primary)',
                            background: 'rgba(59,130,246,0.04)'
                        } : {
                            color: 'var(--gl-text-muted)',
                            borderBottom: '2px solid transparent'
                        }">
                        <FileCode class="h-4 w-4" :stroke-width="2" />
                        Code / Text
                    </button>
                    <button @click="tab = 'image'"
                        class="flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-all duration-200"
                        :style="tab === 'image' ? {
                            color: 'var(--gl-primary)',
                            borderBottom: '2px solid var(--gl-primary)',
                            background: 'rgba(59,130,246,0.04)'
                        } : {
                            color: 'var(--gl-text-muted)',
                            borderBottom: '2px solid transparent'
                        }">
                        <ImageIcon class="h-4 w-4" :stroke-width="2" />
                        Upload image
                    </button>
                </div>

                <!-- Code tab -->
                <div v-if="tab === 'code'" class="p-5">
                    <div class="relative rounded-xl overflow-hidden" style="border: 1px solid var(--gl-border);">
                        <div class="flex items-center gap-1.5 px-4 py-2.5" style="background: var(--gl-surface-2); border-bottom: 1px solid var(--gl-border);">
                            <span class="h-3 w-3 rounded-full" style="background: #EF4444;"></span>
                            <span class="h-3 w-3 rounded-full" style="background: #FBBF24;"></span>
                            <span class="h-3 w-3 rounded-full" style="background: #10B981;"></span>
                            <span class="ml-3 text-xs" style="color: var(--gl-text-muted);">solution.txt</span>
                        </div>
                        <textarea v-model="submissionText" rows="14"
                            class="w-full resize-none font-mono text-sm leading-relaxed p-4 outline-none placeholder:text-[var(--gl-text-muted)]"
                            style="background: #0d1117; color: #e6edf3; caret-color: var(--gl-primary); border: none;"
                            placeholder="// Paste your solution here...&#10;// Write your code or answer below.&#10;"></textarea>
                    </div>
                </div>

                <!-- Image tab -->
                <div v-else class="p-5">
                    <!-- File already selected: show preview card -->
                    <div v-if="previewUrl" class="rounded-xl overflow-hidden" style="border: 1px solid var(--gl-border);">
                        <div class="flex items-center gap-1.5 px-4 py-2.5" style="background: var(--gl-surface-2); border-bottom: 1px solid var(--gl-border);">
                            <span class="h-3 w-3 rounded-full" style="background: #EF4444;"></span>
                            <span class="h-3 w-3 rounded-full" style="background: #FBBF24;"></span>
                            <span class="h-3 w-3 rounded-full" style="background: #10B981;"></span>
                            <span class="ml-2 flex items-center gap-1.5 text-xs" style="color: var(--gl-text-muted);">
                                <ImageIcon class="h-3 w-3" :stroke-width="2" />
                                {{ selectedFile?.name ?? 'image.png' }}
                            </span>
                            <span class="ml-auto text-xs rounded px-2 py-0.5" style="background: rgba(16,185,129,0.12); color: var(--gl-success);">
                                Ready
                            </span>
                        </div>
                        <div style="background: #0d1117;">
                            <img :src="previewUrl" class="max-h-72 w-full object-contain mx-auto" />
                        </div>
                        <div class="flex items-center justify-between gap-3 px-4 py-2.5" style="background: var(--gl-surface-2); border-top: 1px solid var(--gl-border);">
                            <input ref="fileInput" type="file" accept="image/png,image/jpg,image/jpeg,image/gif,image/webp,image/bmp" class="hidden" @change="handleFile" />
                            <button @click="fileInput?.click()"
                                class="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all"
                                style="background: transparent; color: var(--gl-text-secondary); border: 1px solid var(--gl-border);">
                                <Upload class="h-3.5 w-3.5" :stroke-width="2" />
                                Change file
                            </button>
                            <button @click="clearFile" class="flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all"
                                style="background: transparent; color: var(--gl-danger); border: 1px solid rgba(239,68,68,0.2);">
                                <X class="h-3.5 w-3.5" :stroke-width="2" />
                                Remove
                            </button>
                        </div>
                    </div>

                    <!-- No file: show drop zone -->
                    <div v-else
                        class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200"
                        :style="{ borderColor: dragging ? 'var(--gl-primary)' : 'var(--gl-border)', background: dragging ? 'rgba(59,130,246,0.04)' : 'transparent' }"
                        @dragover.prevent="dragging = true"
                        @dragleave.prevent="dragging = false"
                        @drop.prevent="handleDrop">
                        <div class="flex h-14 w-14 items-center justify-center rounded-full mb-4"
                            style="background: rgba(59,130,246,0.1);">
                            <ImageIcon class="h-7 w-7" style="color: var(--gl-primary);" :stroke-width="1.5" />
                        </div>
                        <p class="mb-1 text-sm font-medium" style="color: var(--gl-text-primary)">Drop an image here, or click to browse</p>
                        <p class="mb-4 text-xs" style="color: var(--gl-text-muted)">PNG, JPG, JPEG, GIF, WebP, BMP</p>
                        <input ref="fileInput" type="file" accept="image/png,image/jpg,image/jpeg,image/gif,image/webp,image/bmp" class="hidden" @change="handleFile" />
                        <button @click="fileInput?.click()"
                            class="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
                            <Upload class="inline h-4 w-4 mr-1.5" :stroke-width="2" />
                            Choose file
                        </button>
                    </div>
                </div>
            </div>

            <!-- Submit -->
            <div class="flex items-center justify-end">
                <button @click="submit" class="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 16px var(--gl-primary-glow);"
                    :disabled="submitting || (!submissionText && !selectedFile)">
                    <Send class="h-4 w-4" :stroke-width="2" />
                    {{ submitting ? 'Submitting...' : 'Submit practical' }}
                </button>
            </div>
        </div>

        <!-- Right: Sticky Sidebar -->
        <aside class="hidden w-72 shrink-0 lg:block">
            <div class="sticky space-y-4" style="top: 80px;">

                <!-- Mission Status -->
                <div class="gl-glow-card p-5">
                    <p class="mb-3 text-sm font-semibold" style="color: var(--gl-text-primary)">Mission Status</p>
                    <div class="space-y-3">
                        <div>
                            <div class="mb-1 flex justify-between text-xs">
                                <span style="color: var(--gl-text-muted)">Progress</span>
                                <span style="color: var(--gl-text-primary)">{{ criteriaProgress }}%</span>
                            </div>
                            <div class="gl-xp-bar">
                                <div class="gl-xp-bar-fill" :style="{ width: criteriaProgress + '%' }"></div>
                            </div>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span style="color: var(--gl-text-muted)">Criteria</span>
                            <span style="color: var(--gl-text-primary)">{{ practical.criteria.length }} items</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span style="color: var(--gl-text-muted)">Total points</span>
                            <span style="color: var(--gl-accent)">{{ totalMaxPoints }} pts</span>
                        </div>
                    </div>
                </div>

                <!-- XP & Rewards -->
                <div class="gl-glow-card p-5">
                    <p class="mb-3 text-sm font-semibold" style="color: var(--gl-text-primary)">Rewards</p>
                    <div class="space-y-3">
                        <div class="flex justify-between text-xs">
                            <span style="color: var(--gl-text-muted)">XP reward</span>
                            <span class="font-semibold" style="color: var(--gl-accent);">+{{ xpReward }} XP</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span style="color: var(--gl-text-muted)">Max attempts</span>
                            <span style="color: var(--gl-text-primary)">{{ attemptNumber }} / {{ practical.max_attempts }}</span>
                        </div>
                        <div v-if="practical.time_limit_minutes" class="flex justify-between text-xs">
                            <span style="color: var(--gl-text-muted)">Time limit</span>
                            <span style="color: var(--gl-text-primary)">{{ practical.time_limit_minutes }} min</span>
                        </div>
                    </div>
                </div>

                <!-- Student Level -->
                <div class="gl-glow-card p-5">
                    <div class="mb-3 flex items-center gap-3">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">
                            <Star class="h-4.5 w-4.5 text-white" :stroke-width="2" />
                        </div>
                        <div>
                            <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Your Level</p>
                            <p class="text-xs" style="color: var(--gl-text-muted)">Level {{ userLevel }}</p>
                        </div>
                    </div>
                    <div>
                        <div class="mb-1 flex justify-between text-xs">
                            <span style="color: var(--gl-text-secondary)">{{ xpProgress }} XP</span>
                            <span style="color: var(--gl-text-muted)">{{ xpNextLevel }} XP</span>
                        </div>
                        <div class="gl-xp-bar">
                            <div class="gl-xp-bar-fill" :style="{ width: xpProgressPct + '%' }"></div>
                        </div>
                    </div>
                </div>

                <!-- Motivation -->
                <div class="gl-glow-card p-5">
                    <p class="mb-3 text-sm font-semibold" style="color: var(--gl-text-primary)">Mission Tips</p>
                    <div class="space-y-2.5">
                        <div class="flex items-center gap-2.5 text-xs">
                            <Zap class="h-4 w-4 shrink-0" style="color: var(--gl-accent);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Finish before time runs out</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-xs">
                            <Trophy class="h-4 w-4 shrink-0" style="color: var(--gl-accent);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Submit your best work for bonus XP</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-xs">
                            <Award class="h-4 w-4 shrink-0" style="color: var(--gl-primary);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Earn badges for high scores</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-xs">
                            <RotateCw class="h-4 w-4 shrink-0" style="color: var(--gl-secondary);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">You can retake to improve</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Clock, Send, FileCode, Image as ImageIcon, X, Target, Zap, Award, Star, Trophy, RotateCw, BookOpen, Terminal, Upload } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAutoSave } from '@/composables/useAutoSave';

const props = defineProps<{ practical: any; startedAt: string; deadlineAt?: number; attemptNumber: number }>();

const page = usePage();
const flash = page.props.flash as any;
const user = (page.props as any).auth?.user;
const totalPoints = computed(() => user?.total_points ?? 0);
const submitting = ref(false);
const restored = ref(false);
const remainingSeconds = ref<number | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;
let autoSave: ReturnType<typeof useAutoSave> | null = null;

const tab = ref<'code' | 'image'>('code');
const submissionText = ref('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const dragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const totalMaxPoints = computed(() => (props.practical.criteria ?? []).reduce((s: number, c: any) => s + c.max_points, 0));
const xpReward = 10;
const criteriaProgress = 0;

const userLevel = computed(() => Math.floor(totalPoints.value / 100) + 1);
const xpNextLevel = computed(() => userLevel.value * 100);
const xpProgress = computed(() => totalPoints.value % 100);
const xpProgressPct = computed(() => Math.min(100, Math.round((xpProgress.value / xpNextLevel.value) * 100)));

const timerProgress = computed(() => {
    if (remainingSeconds.value === null || !props.practical.time_limit_minutes) return 1;
    const total = props.practical.time_limit_minutes * 60;
    return Math.max(0, Math.min(1, remainingSeconds.value / total));
});

function criterionIcon(ci: number) {
    const icons = [
        { bg: 'rgba(59,130,246,0.12)', fg: '#3B82F6' },
        { bg: 'rgba(16,185,129,0.12)', fg: '#10B981' },
        { bg: 'rgba(124,58,237,0.12)', fg: '#7C3AED' },
        { bg: 'rgba(239,68,68,0.12)', fg: '#EF4444' },
        { bg: 'rgba(251,191,36,0.12)', fg: '#FBBF24' },
    ];
    return icons[ci % icons.length];
}

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
        submit(true);
    }
}

onMounted(() => {
    const savedKey = 'autosave-practical-' + props.practical.id;
    autoSave = useAutoSave(savedKey, () => ({
        submissionText: submissionText.value,
        tab: tab.value,
        fileSelected: selectedFile.value !== null,
    }));

    const saved = autoSave.load();
    if (saved) {
        if (saved.submissionText) submissionText.value = saved.submissionText;
        if (saved.tab) tab.value = saved.tab;
        restored.value = true;
    }

    autoSave.start();

    if (props.practical.time_limit_minutes && props.deadlineAt) {
        remainingSeconds.value = Math.max(0, Math.floor((props.deadlineAt - Date.now()) / 1000));
        if (remainingSeconds.value > 0) {
            timer = setInterval(tick, 1000);
        } else {
            submit(true);
        }
    }
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
    if (autoSave) autoSave.stop();
});

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

function submit(auto = false) {
    if (!auto && !confirm('Submit practical? This cannot be undone.')) return;
    submitting.value = true;

    if (autoSave) autoSave.clear();

    router.post('/student/practicals/' + props.practical.id + '/submit', {
        submission_text: submissionText.value || '',
        submission_file: selectedFile.value,
    }, {
        forceFormData: true,
        onFinish: () => { submitting.value = false; },
    });
}
</script>

<style scoped>
.h-4\.5 { height: 1.125rem; }
.w-4\.5 { width: 1.125rem; }
</style>
