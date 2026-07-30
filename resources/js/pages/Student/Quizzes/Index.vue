<template>
    <Head title="Quizzes" />
    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background: var(--gl-bg); overflow-y: auto;">
        <div class="px-6 py-6" style="max-width: 80rem;">

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.1)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                <Trophy class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Quizzes</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Complete quizzes, earn XP, unlock achievements, and climb the leaderboard.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <div class="flex gap-6">
        <!-- Main Content -->
        <div class="min-w-0 flex-1">

            <!-- Empty State -->
            <div v-if="!quizzes.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
                <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
                    style="background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.1));">
                    <FileQuestion class="h-10 w-10" style="color: var(--gl-primary);" :stroke-width="1.5" />
                </div>
                <h3 class="text-lg font-semibold" style="color: var(--gl-text-primary)">No Quizzes Available Yet</h3>
                <p class="mt-2 max-w-md text-sm" style="color: var(--gl-text-secondary)">
                    Your teacher hasn't published any quizzes yet. Check back later to continue earning XP.
                </p>
                <div class="mt-6 flex max-w-sm items-center gap-3 rounded-xl p-4"
                    style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                    <Gift class="h-5 w-5 shrink-0" style="color: var(--gl-accent);" :stroke-width="2" />
                    <p class="text-xs text-left" style="color: var(--gl-text-secondary)">
                        Complete quizzes to earn XP, unlock badges, increase your level, and collect rewards.
                    </p>
                </div>
                <button disabled class="mt-4 rounded-xl px-5 py-2.5 text-sm font-medium opacity-50 cursor-not-allowed"
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); color: white;">
                    <Bell class="inline h-4 w-4 mr-1.5" :stroke-width="2" />
                    Notify Me When a Quiz Is Available
                </button>
            </div>

            <!-- Quiz Cards Grid -->
            <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div v-for="quiz in quizzes" :key="quiz.id"
                    class="gl-glow-card group flex flex-col p-5 cursor-pointer gl-fade-in"
                    :class="{ 'opacity-60': quiz.status === 'submitted' }">
                    <!-- Header -->
                    <div class="mb-3 flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                :style="{ background: statusGradient(quiz.status) }">
                                <component :is="statusIcon(quiz.status)" class="h-5 w-5 text-white" :stroke-width="2" />
                            </div>
                            <div class="min-w-0">
                                <h3 class="text-sm font-semibold truncate" style="color: var(--gl-text-primary)">{{ quiz.title }}</h3>
                                <p v-if="quiz.description" class="text-xs truncate mt-0.5" style="color: var(--gl-text-muted)">{{ quiz.description }}</p>
                            </div>
                        </div>
                        <span class="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                            :style="{ background: statusBadgeBg(quiz.status), color: statusBadgeText(quiz.status) }">
                            <component :is="statusBadgeIcon(quiz.status)" class="h-3 w-3" :stroke-width="2" />
                            {{ statusLabel(quiz.status) }}
                        </span>
                    </div>

                    <!-- Stats Row -->
                    <div class="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style="color: var(--gl-text-muted)">
                        <span class="flex items-center gap-1.5">
                            <FileQuestion class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-primary);" />
                            {{ quiz.questions_count }} questions
                        </span>
                        <span v-if="quiz.time_limit_minutes" class="flex items-center gap-1.5">
                            <Clock class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-secondary);" />
                            {{ quiz.time_limit_minutes }} min
                        </span>
                        <span class="flex items-center gap-1.5">
                            <Zap class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-accent);" />
                            {{ xpForQuiz(quiz) }} XP
                        </span>
                    </div>

                    <!-- Score (if submitted) -->
                    <div v-if="quiz.status === 'submitted'" class="mb-4">
                        <div class="flex items-center gap-3">
                            <div class="gl-xp-bar flex-1">
                                <div class="gl-xp-bar-fill" :style="{ width: scorePct(quiz) + '%' }"></div>
                            </div>
                            <span class="text-sm font-semibold" style="color: var(--gl-text-primary)">
                                {{ quiz.score }}/{{ quiz.total_points }}
                            </span>
                        </div>
                    </div>

                    <!-- Action Button -->
                    <div class="mt-auto">
                        <Link v-if="quiz.status !== 'submitted'"
                            :href="`/student/quizzes/${quiz.id}/take`"
                            class="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
                            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
                            <PlayCircle class="h-4 w-4" :stroke-width="2" />
                            {{ quiz.status === 'in_progress' ? 'Continue quiz' : 'Start quiz' }}
                        </Link>
                        <Link v-else
                            :href="`/student/quizzes/${quiz.attempt_id}/result`"
                            class="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
                            <Eye class="h-4 w-4" :stroke-width="2" />
                            View result
                        </Link>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Sidebar (visual only) -->
        <aside class="hidden w-72 shrink-0 lg:block">
            <div class="sticky space-y-4" style="top: 80px;">

                <!-- XP Card -->
                <div class="gl-glow-card p-5">
                    <div class="mb-3 flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl"
                            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">
                            <Star class="h-5 w-5 text-white" :stroke-width="2" />
                        </div>
                        <div>
                            <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Quiz Mastery</p>
                            <p class="text-xs" style="color: var(--gl-text-muted)">Your quiz stats</p>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <div class="mb-1 flex justify-between text-xs">
                                <span style="color: var(--gl-text-secondary)">Level {{ userLevel }}</span>
                                <span style="color: var(--gl-text-muted)">{{ xpProgress }} / {{ xpNextLevel }} XP</span>
                            </div>
                            <div class="gl-xp-bar">
                                <div class="gl-xp-bar-fill" :style="{ width: xpProgressPct + '%' }"></div>
                            </div>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span style="color: var(--gl-text-muted)">Quizzes completed</span>
                            <span class="font-semibold" style="color: var(--gl-text-primary)">{{ completedCount }}</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span style="color: var(--gl-text-muted)">Average score</span>
                            <span class="font-semibold" style="color: var(--gl-success)">{{ avgScore }}%</span>
                        </div>
                    </div>
                </div>

                <!-- Reward Chest (visual only) -->
                <div class="gl-glow-card p-5 text-center" style="border-color: rgba(251,191,36,0.2);">
                    <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05));">
                        <Gift class="h-8 w-8" style="color: var(--gl-accent);" :stroke-width="1.5" />
                    </div>
                    <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Next Reward</p>
                    <p class="text-xs mt-1" style="color: var(--gl-text-muted)">
                        Earn {{ xpNextLevel - xpProgress }} more XP to unlock a badge
                    </p>
                </div>

                <!-- Motivation Panel -->
                <div class="gl-glow-card p-5">
                    <p class="mb-3 text-sm font-semibold" style="color: var(--gl-text-primary)">Tips & Rewards</p>
                    <div class="space-y-2.5">
                        <div class="flex items-center gap-2.5 text-xs">
                            <Trophy class="h-4 w-4 shrink-0" style="color: var(--gl-accent);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Complete quizzes to level up</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-xs">
                            <Award class="h-4 w-4 shrink-0" style="color: var(--gl-primary);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Earn badges for perfect scores</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-xs">
                            <Zap class="h-4 w-4 shrink-0" style="color: var(--gl-secondary);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Maintain your streak</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-xs">
                            <Shield class="h-4 w-4 shrink-0" style="color: var(--gl-success);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Unlock exclusive rewards</span>
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
import { Head, Link, usePage } from '@inertiajs/vue3';
import { FileQuestion, Clock, PlayCircle, Eye, Trophy, Star, Gift, Zap, Award, Shield, Bell, CheckCircle2, Circle, Play } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{ quizzes: any[] }>();

const page = usePage();
const flash = page.props.flash as any;
const user = (page.props as any).auth?.user;
const totalPoints = computed(() => user?.total_points ?? 0);

const completedCount = computed(() => props.quizzes.filter(q => q.status === 'submitted').length);

const avgScore = computed(() => {
    const submitted = props.quizzes.filter(q => q.status === 'submitted' && q.total_points > 0);
    if (!submitted.length) return 0;
    const pcts = submitted.map(q => (q.score / q.total_points) * 100);
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
});

const userLevel = computed(() => Math.floor(totalPoints.value / 100) + 1);
const xpNextLevel = computed(() => userLevel.value * 100);
const xpProgress = computed(() => totalPoints.value % 100);
const xpProgressPct = computed(() => Math.min(100, Math.round((xpProgress.value / xpNextLevel.value) * 100)));

function scorePct(quiz: any): number {
    if (!quiz.total_points) return 0;
    return Math.round((quiz.score / quiz.total_points) * 100);
}

function xpForQuiz(quiz: any): number {
    // XP is calculated based on potential score, same as PointsHelper::calculate
    // For display purposes, show potential max XP for the quiz (10 pts for ≥80%)
    const estimatedPct = quiz.status === 'submitted' && quiz.total_points
        ? (quiz.score / quiz.total_points) * 100
        : 0;
    if (estimatedPct >= 80) return 10;
    if (estimatedPct >= 60) return 5;
    if (quiz.status === 'submitted') return 1;
    return 10; // show max potential XP for unsubmitted quizzes
}

function statusLabel(status: string): string {
    const labels: Record<string, string> = { not_started: 'Ready', in_progress: 'In Progress', submitted: 'Completed' };
    return labels[status] ?? status;
}

function statusIcon(status: string) {
    const icons: Record<string, any> = { not_started: Circle, in_progress: Play, submitted: CheckCircle2 };
    return icons[status] ?? Circle;
}

function statusBadgeIcon(status: string) {
    const icons: Record<string, any> = { not_started: Circle, in_progress: Play, submitted: CheckCircle2 };
    return icons[status] ?? Circle;
}

function statusBadgeBg(status: string): string {
    const colors: Record<string, string> = {
        not_started: 'rgba(59,130,246,0.12)',
        in_progress: 'rgba(251,191,36,0.12)',
        submitted: 'rgba(16,185,129,0.12)',
    };
    return colors[status] ?? 'rgba(148,163,184,0.12)';
}

function statusBadgeText(status: string): string {
    const colors: Record<string, string> = {
        not_started: '#3B82F6',
        in_progress: '#FBBF24',
        submitted: '#10B981',
    };
    return colors[status] ?? '#94A3B8';
}

function statusGradient(status: string): string {
    const gradients: Record<string, string> = {
        not_started: 'linear-gradient(135deg, #3B82F6, #2563EB)',
        in_progress: 'linear-gradient(135deg, #F59E0B, #D97706)',
        submitted: 'linear-gradient(135deg, #10B981, #059669)',
    };
    return gradients[status] ?? 'linear-gradient(135deg, #64748B, #475569)';
}
</script>
