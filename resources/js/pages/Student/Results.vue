<template>
    <Head title="My Results" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background: var(--gl-bg); overflow-y: auto;">
        <div class="px-6 py-6">

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(124,58,237,0.08)); border: 1px solid var(--gl-border);">
        <div class="relative z-10 flex flex-wrap items-start justify-between gap-6">
            <div>
                <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                    <Trophy class="h-6 w-6 text-white" :stroke-width="2" />
                </div>
                <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">My Results</h1>
                <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                    Track your learning journey, improve your scores, and unlock new achievements.
                </p>
            </div>
            <div class="flex flex-wrap gap-3 text-xs">
                <span class="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                    style="background: var(--gl-surface-2); color: var(--gl-text-secondary);">
                    <CheckCircle2 class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-success);" />
                    {{ activities.length }} submitted
                </span>
                <span class="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                    style="background: var(--gl-surface-2); color: var(--gl-text-secondary);">
                    <Target class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-primary);" />
                    {{ avgScore }}% avg
                </span>
                <span class="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                    style="background: var(--gl-surface-2); color: var(--gl-text-secondary);">
                    <Zap class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-accent);" />
                    {{ totalPoints }} pts
                </span>
            </div>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Stats Cards -->
    <div class="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon blue">
                    <ClipboardCheck class="h-5 w-5" style="color: var(--gl-primary);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ activities.length }}</p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Activities Submitted</p>
                </div>
            </div>
        </div>
        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon green">
                    <Target class="h-5 w-5" style="color: var(--gl-success);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ avgScore }}<span class="text-sm font-normal" style="color: var(--gl-text-muted)">%</span></p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Average Score</p>
                    <div class="gl-xp-bar mt-2">
                        <div class="gl-xp-bar-fill" :style="{ width: avgScore + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon gold">
                    <Trophy class="h-5 w-5" style="color: var(--gl-accent);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ highestScore }}<span class="text-sm font-normal" style="color: var(--gl-text-muted)">%</span></p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Highest Score</p>
                </div>
            </div>
        </div>
        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon purple">
                    <Zap class="h-5 w-5" style="color: var(--gl-secondary);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ gradableCount }}</p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Above 60%</p>
                    <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Keep up the momentum</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Progress Banner -->
    <div class="gl-glow-card mb-8 p-6" style="border-color: rgba(251,191,36,0.2);">
        <div class="flex flex-wrap items-center gap-6">
            <div class="flex items-center gap-4">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
                    style="background: linear-gradient(135deg, var(--gl-accent), #F59E0B);">
                    <Award class="h-7 w-7 text-white" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-lg font-bold" style="color: var(--gl-text-primary)">Level {{ userLevel }}</p>
                    <p class="text-xs" style="color: var(--gl-text-muted)">{{ xpProgress }} / {{ xpNextLevel }} XP</p>
                </div>
            </div>
            <div class="flex-1 min-w-[200px]">
                <div class="gl-xp-bar" style="height: 12px; border-radius: 6px;">
                    <div class="gl-xp-bar-fill" style="border-radius: 6px;" :style="{ width: xpProgressPct + '%' }"></div>
                </div>
            </div>
            <div class="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                <Gift class="h-5 w-5" style="color: var(--gl-accent);" :stroke-width="2" />
                <div>
                    <p class="text-xs font-semibold" style="color: var(--gl-text-primary)">Next Reward</p>
                    <p class="text-xs" style="color: var(--gl-text-muted)">Level {{ userLevel + 1 }} Chest</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Results Section -->
    <div class="mb-8">
        <div class="mb-4 flex items-center gap-3">
            <ClipboardCheck class="h-5 w-5" style="color: var(--gl-primary);" :stroke-width="2" />
            <h3 class="text-lg font-semibold" style="color: var(--gl-text-primary)">Activity History</h3>
        </div>

        <!-- Empty State -->
        <div v-if="!activities.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
            <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
                style="background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.1));">
                <Trophy class="h-10 w-10" style="color: var(--gl-primary);" :stroke-width="1.5" />
            </div>
            <h3 class="text-lg font-semibold" style="color: var(--gl-text-primary)">No Results Yet</h3>
            <p class="mt-2 max-w-md text-sm" style="color: var(--gl-text-secondary)">
                Complete assignments and quizzes to earn XP, unlock achievements, and build your learning profile.
            </p>
        </div>

        <!-- Results Cards -->
        <div v-else class="space-y-3">
            <div v-for="item in activities" :key="item.id + item.type"
                class="gl-glow-card group flex flex-wrap items-center gap-4 p-5 transition-all duration-200 hover:scale-[1.005]"
                :style="{ opacity: item.percentage >= 60 ? '1' : '0.75' }">
                <!-- Type icon + info -->
                <div class="flex items-center gap-4 min-w-0 flex-1">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        :style="{ background: typeColor(item.type).bg }">
                        <component :is="typeIcon(item.type)" class="h-5 w-5" :stroke-width="2" :style="{ color: typeColor(item.type).fg }" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold truncate" style="color: var(--gl-text-primary)">{{ item.title }}</p>
                            <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                                :style="{ background: typeColor(item.type).badge, color: typeColor(item.type).fg }">
                                {{ item.type }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2 mt-0.5 text-xs" style="color: var(--gl-text-muted)">
                            <span v-if="item.teacher_name">{{ item.teacher_name }}</span>
                            <span v-if="item.teacher_name && item.submitted_at">·</span>
                            <span>{{ formatDate(item.submitted_at) }}</span>
                        </div>
                    </div>
                </div>
                <!-- Score bar + action -->
                <div class="flex items-center gap-4 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="gl-xp-bar w-24" style="height: 6px; border-radius: 3px;">
                            <div class="gl-xp-bar-fill" :style="{ width: item.percentage + '%', background: scoreGradient(item.percentage) }"></div>
                        </div>
                        <span class="text-sm font-semibold tabular-nums whitespace-nowrap"
                            :style="{ color: scoreColor(item.percentage) }">
                            {{ item.score }}/{{ item.total }}
                            <span class="ml-1 text-xs opacity-80">({{ item.percentage }}%)</span>
                        </span>
                    </div>
                    <Link :href="item.resultUrl"
                        class="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
                        style="background: var(--gl-surface-2); color: var(--gl-text-secondary); border: 1px solid var(--gl-border);"
                        :title="'View ' + item.type + ' details'">
                        <Eye class="h-4 w-4" :stroke-width="2" />
                    </Link>
                </div>
            </div>
        </div>
    </div>

    <!-- Motivation Section -->
    <div class="gl-glow-card mb-6 p-6"
        style="border-color: rgba(59,130,246,0.15); background: linear-gradient(135deg, rgba(59,130,246,0.04), rgba(124,58,237,0.03));">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style="background: rgba(59,130,246,0.12);">
                    <Rocket class="h-4.5 w-4.5" style="color: var(--gl-primary);" :stroke-width="2" />
                </div>
                <p class="text-xs" style="color: var(--gl-text-secondary)">Every attempt makes you better.</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style="background: rgba(16,185,129,0.12);">
                    <Trophy class="h-4.5 w-4.5" style="color: var(--gl-success);" :stroke-width="2" />
                </div>
                <p class="text-xs" style="color: var(--gl-text-secondary)">Keep completing activities to increase your mastery.</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style="background: rgba(124,58,237,0.12);">
                    <Star class="h-4.5 w-4.5" style="color: var(--gl-secondary);" :stroke-width="2" />
                </div>
                <p class="text-xs" style="color: var(--gl-text-secondary)">Review your previous work and improve your scores.</p>
            </div>
        </div>
    </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link, usePage } from '@inertiajs/vue3';
import { Trophy, Target, Zap, Award, Gift, ClipboardCheck, Eye, FileQuestion, FileText, ClipboardList, FlaskConical, CheckCircle2, Rocket, Star } from '@lucide/vue';

const props = defineProps<{ activities: any[] }>();

const page = usePage();
const flash = page.props.flash as any;
const user = (page.props as any).auth?.user;
const totalPoints = computed(() => user?.total_points ?? 0);

const avgScore = computed(() => {
    if (!props.activities.length) return 0;
    return Math.round(props.activities.reduce((a, i) => a + i.percentage, 0) / props.activities.length);
});

const highestScore = computed(() => {
    if (!props.activities.length) return 0;
    return Math.max(...props.activities.map(i => i.percentage));
});

const gradableCount = computed(() => props.activities.filter(i => i.percentage >= 60).length);

const userLevel = computed(() => Math.floor(totalPoints.value / 100) + 1);
const xpNextLevel = computed(() => userLevel.value * 100);
const xpProgress = computed(() => totalPoints.value % 100);
const xpProgressPct = computed(() => Math.min(100, Math.round((xpProgress.value / xpNextLevel.value) * 100)));

function typeIcon(type: string) {
    const icons: Record<string, any> = { Quiz: FileQuestion, Exam: FileText, Seatwork: ClipboardList, Practical: FlaskConical };
    return icons[type] ?? ClipboardCheck;
}

function typeColor(type: string) {
    const colors: Record<string, { bg: string; fg: string; badge: string }> = {
        Quiz:       { bg: 'rgba(59,130,246,0.12)', fg: '#3B82F6', badge: 'rgba(59,130,246,0.12)' },
        Exam:       { bg: 'rgba(239,68,68,0.12)',   fg: '#EF4444', badge: 'rgba(239,68,68,0.12)' },
        Seatwork:   { bg: 'rgba(16,185,129,0.12)',  fg: '#10B981', badge: 'rgba(16,185,129,0.12)' },
        Practical:  { bg: 'rgba(124,58,237,0.12)',  fg: '#7C3AED', badge: 'rgba(124,58,237,0.12)' },
    };
    return colors[type] ?? { bg: 'rgba(148,163,184,0.12)', fg: '#94A3B8', badge: 'rgba(148,163,184,0.12)' };
}

function scoreColor(pct: number): string {
    if (pct >= 80) return 'var(--gl-success)';
    if (pct >= 60) return 'var(--gl-accent)';
    return 'var(--gl-danger)';
}

function scoreGradient(pct: number): string {
    if (pct >= 80) return 'linear-gradient(90deg, var(--gl-success), #34D399)';
    if (pct >= 60) return 'linear-gradient(90deg, var(--gl-accent), #F59E0B)';
    return 'linear-gradient(90deg, var(--gl-danger), #F87171)';
}

function formatDate(value: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.h-4\.5 { height: 1.125rem; }
.w-4\.5 { width: 1.125rem; }
</style>
