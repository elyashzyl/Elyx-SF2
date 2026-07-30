<template>
    <Head title="Practicals" />
    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background: var(--gl-bg); overflow-y: auto;">
        <div class="px-6 py-6" style="max-width: 80rem;">

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(124,58,237,0.08)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary)); box-shadow: 0 0 20px rgba(239,68,68,0.3);">
                <FlaskConical class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Practicals</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Complete hands-on practicals, earn XP, unlock achievements, and climb the leaderboard.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, #EF4444, transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <div class="flex gap-6">
        <div class="min-w-0 flex-1">
            <div v-if="!practicals.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
                <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
                    style="background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(124,58,237,0.1));">
                    <FlaskConical class="h-10 w-10" style="color: #EF4444;" :stroke-width="1.5" />
                </div>
                <h3 class="text-lg font-semibold" style="color: var(--gl-text-primary)">No Practicals Available Yet</h3>
                <p class="mt-2 max-w-md text-sm" style="color: var(--gl-text-secondary)">
                    Your teacher hasn't published any practical activities yet. Check back later to continue earning XP.
                </p>
                <div class="mt-6 flex max-w-sm items-center gap-3 rounded-xl p-4"
                    style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                    <Gift class="h-5 w-5 shrink-0" style="color: var(--gl-accent);" :stroke-width="2" />
                    <p class="text-xs text-left" style="color: var(--gl-text-secondary)">
                        Complete practicals to earn XP, unlock badges, increase your level, and collect rewards.
                    </p>
                </div>
            </div>

            <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div v-for="pr in practicals" :key="pr.id"
                    class="gl-glow-card group flex flex-col p-5 cursor-pointer gl-fade-in"
                    :class="{ 'opacity-60': pr.status === 'submitted' }">
                    <div class="mb-3 flex items-start justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                :style="{ background: statusGradient(pr.status) }">
                                <component :is="statusIcon(pr.status)" class="h-5 w-5 text-white" :stroke-width="2" />
                            </div>
                            <div class="min-w-0">
                                <h3 class="text-sm font-semibold truncate" style="color: var(--gl-text-primary)">{{ pr.title }}</h3>
                            </div>
                        </div>
                        <span class="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                            :style="{ background: statusBadgeBg(pr.status), color: statusBadgeText(pr.status) }">
                            <component :is="statusBadgeIcon(pr.status)" class="h-3 w-3" :stroke-width="2" />
                            {{ statusLabel(pr.status) }}
                        </span>
                    </div>
                    <div class="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs" style="color: var(--gl-text-muted)">
                        <span class="flex items-center gap-1.5">
                            <ListChecks class="h-3.5 w-3.5" :stroke-width="2" style="color: #EF4444;" />
                            {{ pr.criteria_count }} criteria
                        </span>
                        <span v-if="pr.time_limit_minutes" class="flex items-center gap-1.5">
                            <Clock class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-secondary);" />
                            {{ pr.time_limit_minutes }} min
                        </span>
                        <span class="flex items-center gap-1.5">
                            <RotateCw class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-primary);" />
                            {{ pr.attempts_count }}/{{ pr.max_attempts }} attempts
                        </span>
                        <span class="flex items-center gap-1.5">
                            <Zap class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-accent);" />
                            {{ xpForItem(pr) }} XP
                        </span>
                    </div>
                    <div v-if="pr.status === 'submitted'" class="mb-4">
                        <div class="flex items-center gap-3">
                            <div class="gl-xp-bar flex-1">
                                <div class="gl-xp-bar-fill" :style="{ width: scorePct(pr) + '%' }"></div>
                            </div>
                            <span class="text-sm font-semibold" style="color: var(--gl-text-primary)">
                                {{ pr.score }}/{{ pr.max_score }}
                            </span>
                        </div>
                    </div>
                    <div class="mt-auto flex flex-wrap gap-2">
                        <Link v-if="pr.status !== 'submitted'"
                            :href="`/student/practicals/${pr.id}/take`"
                            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
                            style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary)); box-shadow: 0 0 12px rgba(239,68,68,0.3);">
                            <PlayCircle class="h-4 w-4" :stroke-width="2" />
                            {{ pr.status === 'in_progress' ? 'Continue practical' : 'Start practical' }}
                        </Link>
                        <template v-else>
                            <Link v-if="pr.attempts_count < pr.max_attempts && !pr.closed_at"
                                :href="`/student/practicals/${pr.id}/take`"
                                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
                                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
                                <RotateCw class="h-4 w-4" :stroke-width="2" />
                                Retake
                            </Link>
                            <Link :href="`/student/practicals/${pr.attempt_id}/result`"
                                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                                style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
                                <Eye class="h-4 w-4" :stroke-width="2" />
                                View result
                            </Link>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <aside class="hidden w-72 shrink-0 lg:block">
            <div class="sticky space-y-4" style="top: 80px;">
                <div class="gl-glow-card p-5">
                    <div class="mb-3 flex items-center gap-3">
                        <div class="flex h-10 w-10 items-center justify-center rounded-xl"
                            style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary));">
                            <Star class="h-5 w-5 text-white" :stroke-width="2" />
                        </div>
                        <div>
                            <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Practical Mastery</p>
                            <p class="text-xs" style="color: var(--gl-text-muted)">Your stats</p>
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
                            <span style="color: var(--gl-text-muted)">Completed</span>
                            <span class="font-semibold" style="color: var(--gl-text-primary)">{{ completedCount }}</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span style="color: var(--gl-text-muted)">Average score</span>
                            <span class="font-semibold" style="color: var(--gl-success)">{{ avgScore }}%</span>
                        </div>
                    </div>
                </div>
                <div class="gl-glow-card p-5 text-center" style="border-color: rgba(251,191,36,0.2);">
                    <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05));">
                        <Gift class="h-8 w-8" style="color: var(--gl-accent);" :stroke-width="1.5" />
                    </div>
                    <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Next Reward</p>
                    <p class="text-xs mt-1" style="color: var(--gl-text-muted)">Earn {{ xpNextLevel - xpProgress }} more XP</p>
                </div>
                <div class="gl-glow-card p-5">
                    <p class="mb-3 text-sm font-semibold" style="color: var(--gl-text-primary)">Tips & Rewards</p>
                    <div class="space-y-2.5">
                        <div class="flex items-center gap-2.5 text-xs">
                            <Trophy class="h-4 w-4 shrink-0" style="color: var(--gl-accent);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Complete practicals to level up</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-xs">
                            <Award class="h-4 w-4 shrink-0" style="color: #EF4444;" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Earn badges for perfect scores</span>
                        </div>
                        <div class="flex items-center gap-2.5 text-xs">
                            <RotateCw class="h-4 w-4 shrink-0" style="color: var(--gl-primary);" :stroke-width="2" />
                            <span style="color: var(--gl-text-secondary)">Retake to improve your score</span>
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
import { FlaskConical, Clock, RotateCw, PlayCircle, Eye, Trophy, Star, Gift, Zap, Award, ListChecks, CheckCircle2, Circle, Play } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{ practicals: any[] }>();

const page = usePage();
const flash = page.props.flash as any;
const user = (page.props as any).auth?.user;
const totalPoints = computed(() => user?.total_points ?? 0);

const completedCount = computed(() => props.practicals.filter(p => p.status === 'submitted').length);
const avgScore = computed(() => {
    const submitted = props.practicals.filter(p => p.status === 'submitted' && p.max_score > 0);
    if (!submitted.length) return 0;
    return Math.round(submitted.reduce((a, p) => a + (p.score / p.max_score) * 100, 0) / submitted.length);
});

const userLevel = computed(() => Math.floor(totalPoints.value / 100) + 1);
const xpNextLevel = computed(() => userLevel.value * 100);
const xpProgress = computed(() => totalPoints.value % 100);
const xpProgressPct = computed(() => Math.min(100, Math.round((xpProgress.value / xpNextLevel.value) * 100)));

function scorePct(item: any): number {
    if (!item.max_score) return 0;
    return Math.round((item.score / item.max_score) * 100);
}

function xpForItem(item: any): number {
    if (item.status === 'submitted' && item.max_score) {
        const pct = (item.score / item.max_score) * 100;
        if (pct >= 80) return 10;
        if (pct >= 60) return 5;
        return 1;
    }
    return 10;
}

function statusLabel(status: string): string {
    const labels: Record<string, string> = { not_started: 'Ready', in_progress: 'In Progress', submitted: 'Completed' };
    return labels[status] ?? status;
}

function statusIcon(status: string) {
    const icons: Record<string, any> = { not_started: Circle, in_progress: Play, submitted: CheckCircle2 };
    return icons[status] ?? Circle;
}

function statusBadgeIcon(status: string) { return statusIcon(status); }

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
