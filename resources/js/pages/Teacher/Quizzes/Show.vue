<template>
    <Head :title="quiz.title" />

    <Link href="/teacher/quizzes" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--gl-text-primary)]" style="color: var(--gl-text-secondary)">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back to quizzes
    </Link>

    <!-- Hero -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-6 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(124,58,237,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                    <FileQuestion class="h-6 w-6 text-white" :stroke-width="2" />
                </div>
                <div>
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                        <h1 class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ quiz.title }}</h1>
                        <StatusBadge :status="statusLabel" />
                    </div>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">
                        <template v-if="quiz.grade_levels">{{ quiz.grade_levels.map((g: any) => g.name).join(', ') }} — </template>
                        <template v-if="quiz.sections">{{ quiz.sections.map((s: any) => s.name).join(', ') }} · </template>
                        {{ quiz.questions.length }} questions · {{ totalPoints }} pts
                        <template v-if="quiz.closes_at">
                            · <span :style="{ color: isClosed ? 'var(--gl-danger)' : 'var(--gl-success)' }">{{ isClosed ? 'Closed' : 'Closes ' + timeRemaining(quiz.closes_at) }}</span>
                        </template>
                    </p>
                    <p v-if="quiz.description" class="mt-2 max-w-2xl text-sm" style="color: var(--gl-text-muted)">{{ quiz.description }}</p>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
                <button v-if="!isClosed" @click="togglePublish" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
                    <UploadCloud class="h-3.5 w-3.5" :stroke-width="2" /> {{ quiz.is_published ? 'Unpublish' : 'Publish' }}
                </button>
                <button v-if="quiz.is_published && !isClosed" @click="closeNow" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style="color: var(--gl-danger); border: 1px solid rgba(239,68,68,0.2); background: var(--gl-danger-bg);">
                    <Lock class="h-3.5 w-3.5" :stroke-width="2" /> Close now
                </button>
                <button v-if="isClosed" @click="toggleReopen" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style="background: var(--gl-surface-2); color: var(--gl-primary); border: 1px solid rgba(59,130,246,0.3);">
                    <RefreshCw class="h-3.5 w-3.5" :stroke-width="2" /> Reopen
                </button>
                <Link v-if="!quiz.is_published" :href="`/teacher/quizzes/${quiz.id}/edit`" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
                    <PenSquare class="h-3.5 w-3.5" :stroke-width="2" /> Edit
                </Link>
            </div>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Reassign -->
    <div v-if="teachers?.length" class="mb-6 gl-glow-card flex flex-wrap items-center gap-3 px-5 py-3">
        <span class="text-sm font-medium" style="color: var(--gl-text-secondary)">Assigned to:</span>
        <select ref="reassignSelect" class="rounded-lg border px-3 py-1.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option v-for="t in teachers" :key="t.id" :value="t.id" :selected="t.id === quiz.teacher_id">{{ t.name }}</option>
        </select>
        <button @click="reassign" class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Reassign</button>
    </div>

    <!-- Questions + Results -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <!-- Questions -->
        <div class="space-y-3 lg:col-span-3">
            <div class="flex items-center gap-2 mb-1">
                <div class="flex h-7 w-7 items-center justify-center rounded-lg" style="background: rgba(59,130,246,0.1);">
                    <FileQuestion class="h-3.5 w-3.5" style="color: var(--gl-primary);" :stroke-width="2" />
                </div>
                <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Questions</h3>
            </div>
            <div v-for="(question, index) in quiz.questions" :key="question.id" class="gl-glow-card p-4">
                <div class="flex items-center justify-between gap-2 mb-3">
                    <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ index + 1 }}. {{ question.question_text }}</p>
                    <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style="background: rgba(59,130,246,0.1); color: var(--gl-primary);">{{ question.points }} pt{{ question.points === 1 ? '' : 's' }}</span>
                </div>
                <div class="space-y-1.5">
                    <div v-for="option in question.options" :key="option.id"
                        class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
                        :style="option.is_correct ? { background: 'var(--gl-success-bg)', color: 'var(--gl-success)', border: '1px solid rgba(16,185,129,0.15)' } : { background: 'var(--gl-surface-2)', color: 'var(--gl-text-secondary)' }">
                        <CheckCircle2 v-if="option.is_correct" class="h-4 w-4 shrink-0" :stroke-width="2" style="color: var(--gl-success);" />
                        <XCircle v-else class="h-4 w-4 shrink-0" :stroke-width="2" style="color: var(--gl-text-muted);" />
                        <span>{{ option.option_text }}</span>
                        <span v-if="option.is_correct" class="ml-auto text-xs font-medium" style="color: var(--gl-success);">Correct</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Results / Leaderboard -->
        <div class="lg:col-span-2">
            <div class="mb-3 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <div class="flex h-7 w-7 items-center justify-center rounded-lg" style="background: rgba(124,58,237,0.1);">
                        <Trophy class="h-3.5 w-3.5" style="color: var(--gl-secondary);" :stroke-width="2" />
                    </div>
                    <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Leaderboard</h3>
                </div>
                <div class="flex items-center gap-1.5">
                    <div class="flex rounded-lg border text-xs overflow-hidden" style="border-color: var(--gl-border);">
                        <button @click="sortMode = 'alpha'" class="px-2 py-1 font-medium transition-colors" :style="sortMode === 'alpha' ? 'background: var(--gl-primary); color: #FFF;' : 'background: transparent; color: var(--gl-text-secondary);'">A-Z</button>
                        <button @click="sortMode = 'score'" class="px-2 py-1 font-medium transition-colors" :style="sortMode === 'score' ? 'background: var(--gl-primary); color: #FFF;' : 'background: transparent; color: var(--gl-text-secondary);'">Score</button>
                    </div>
                    <select v-model="sectionFilter" class="rounded-lg border px-2 py-1 text-xs outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                        <option value="">All sections</option>
                        <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                </div>
            </div>

            <!-- Stats -->
            <div class="gl-glow-card mb-3 grid grid-cols-2 p-4 text-center" style="border-color: var(--gl-border);">
                <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ filteredAttempts.length }}</p><p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Submissions</p></div>
                <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ sectionAvg }}</p><p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Avg Score</p></div>
            </div>

            <!-- Empty -->
            <div v-if="!filteredAttempts.length" class="gl-glow-card flex flex-col items-center justify-center px-6 py-12 text-center">
                <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
                    <Users class="h-5 w-5" style="color: var(--gl-text-muted);" :stroke-width="1.75" />
                </div>
                <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No submissions yet</p>
                <p class="mt-1 text-xs" style="color: var(--gl-text-muted)">{{ sectionFilter ? 'No students from this section have submitted.' : 'Results will appear here once students complete the quiz.' }}</p>
            </div>

            <!-- Leaderboard -->
            <div v-else class="gl-glow-card divide-y overflow-hidden" style="border-color: var(--gl-border);">
                <div v-for="(attempt, index) in filteredAttempts" :key="attempt.id"
                    class="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[rgba(59,130,246,0.03)]"
                    :style="index < 3 ? { background: 'rgba(59,130,246,0.02)' } : {}">
                    <div class="flex items-center gap-3">
                        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                            :style="index === 0 ? 'background: rgba(251,191,36,0.15); color: #FBBF24;' : index === 1 ? 'background: rgba(148,163,184,0.12); color: #94A3B8;' : index === 2 ? 'background: rgba(249,115,22,0.12); color: #F97316;' : 'background: var(--gl-surface-2); color: var(--gl-text-muted);'">
                            <Trophy v-if="index === 0" class="h-4 w-4" :stroke-width="2" />
                            <Medal v-else-if="index === 1" class="h-4 w-4" :stroke-width="2" />
                            <Award v-else-if="index === 2" class="h-4 w-4" :stroke-width="2" />
                            <span v-else>{{ index + 1 }}</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ attempt.student.name }}</p>
                            <p class="text-xs" style="color: var(--gl-text-muted)">{{ attempt.student.grade }}{{ attempt.student.section ? ' — ' + attempt.student.section.name : '' }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold" style="color: var(--gl-text-primary)">{{ attempt.score }}/{{ attempt.total_points }}</span>
                        <button @click="autoRecheck(attempt.id)" class="rounded-lg p-1.5 transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-text-muted); border: 1px solid var(--gl-border);" title="Auto recheck">
                            <RotateCw class="h-3.5 w-3.5" :stroke-width="2" />
                        </button>
                        <Link :href="`/teacher/quizzes/${quiz.id}/recheck/${attempt.id}`" class="rounded-lg p-1.5 transition-colors hover:bg-[rgba(124,58,237,0.08)]" style="color: var(--gl-text-muted); border: 1px solid var(--gl-border);" title="View">
                            <Eye class="h-3.5 w-3.5" :stroke-width="2" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { ArrowLeft, CheckCircle2, XCircle, Users, Award, PenSquare, Eye, RotateCw, UploadCloud, RefreshCw, Lock, FileQuestion, Trophy, Medal } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{ quiz: any; attempts: any[]; totalPoints: number; teachers?: any[] }>();

const storageKey = 'quiz_show_' + window.location.pathname;
const sectionFilter = ref(sessionStorage.getItem(storageKey + '_section') ?? '');
const sortMode = ref<('alpha' | 'score')>((sessionStorage.getItem(storageKey + '_sort') as 'alpha' | 'score') ?? 'alpha');
function persistState() { sessionStorage.setItem(storageKey + '_section', sectionFilter.value); sessionStorage.setItem(storageKey + '_sort', sortMode.value); }
watch([sectionFilter, sortMode], persistState);

const isClosed = computed(() => { if (!props.quiz.closes_at) return false; return new Date(props.quiz.closes_at) < new Date(); });
const statusLabel = computed(() => { if (!props.quiz.is_published) return 'draft'; if (isClosed.value) return 'finished'; return 'published'; });
const sections = computed(() => { const seen = new Set<number>(); return props.attempts.map((a: any) => a.student?.section).filter((s: any) => s && !seen.has(s.id) && seen.add(s.id)); });
const filteredAttempts = computed(() => { const list = sectionFilter.value ? props.attempts.filter((a: any) => a.student?.section_id === Number(sectionFilter.value)) : [...props.attempts]; if (sortMode.value === 'alpha') return list.sort((a: any, b: any) => a.student?.name?.localeCompare(b.student?.name)); return list.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0)); });
const sectionAvg = computed(() => { if (!filteredAttempts.value.length) return 0; const sum = filteredAttempts.value.reduce((acc: number, a: any) => acc + a.score, 0); return Math.round((sum / filteredAttempts.value.length) * 10) / 10; });

const reassignSelect = ref<HTMLSelectElement | null>(null);
function reassign() { if (!reassignSelect.value) return; router.patch(`/teacher/quizzes/${props.quiz.id}/reassign`, { teacher_id: reassignSelect.value.value }, { preserveScroll: true }); }
function autoRecheck(attemptId: number) { router.put(`/teacher/quizzes/${props.quiz.id}/auto-recheck/${attemptId}`, {}, { preserveScroll: true }); }
function timeRemaining(dt: string): string { const diff = new Date(dt).getTime() - Date.now(); if (diff <= 0) return 'now'; const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); return `in ${h}h ${m}m`; }
function togglePublish() { router.patch(`/teacher/quizzes/${props.quiz.id}/publish`, {}, { preserveScroll: true }); }
function toggleReopen() { router.patch(`/teacher/quizzes/${props.quiz.id}/reopen`, {}, { preserveScroll: true }); }
function closeNow() { router.patch(`/teacher/quizzes/${props.quiz.id}/close-now`, {}, { preserveScroll: true }); }
</script>
