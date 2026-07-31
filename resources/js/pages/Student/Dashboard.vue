<template>
    <Head title="Student Dashboard" />

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>
    <div v-if="flash?.info" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-warning-bg); color: var(--gl-accent); border: 1px solid rgba(251,191,36,0.2);">
        {{ flash.info }}
    </div>

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-success)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                <LayoutDashboard class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Welcome back, {{ page.props.auth.user.name }}</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Track your progress, complete activities, earn XP, and climb the leaderboard.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-success), transparent 70%);"></div>
    </div>

    <!-- Stat + Streak Cards -->
    <div class="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon green">
                    <TrendingUp class="h-5 w-5" style="color: var(--gl-success);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ overallAvg }}<span class="text-sm font-normal" style="color: var(--gl-text-muted)">%</span></p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Overall Average</p>
                    <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ recentResults.length }} activities completed</p>
                    <div class="gl-xp-bar mt-2">
                        <div class="gl-xp-bar-fill" :style="{ width: overallAvg + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon gold">
                    <Clock class="h-5 w-5" style="color: var(--gl-accent);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" :style="{ color: pendingCount > 0 ? 'var(--gl-accent)' : 'var(--gl-success)' }">{{ pendingCount }}</p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Pending</p>
                    <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">activities not yet submitted</p>
                </div>
            </div>
        </div>

        <!-- Streak Card (visual only) -->
        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon purple">
                    <Zap class="h-5 w-5" style="color: var(--gl-secondary);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">
                        {{ gradedCount }}
                    </p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Graded Activities</p>
                    <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Keep up the momentum!</p>
                </div>
            </div>
            <!-- Streak dots -->
            <div class="flex gap-1 mt-3">
                <div v-for="i in 7" :key="i"
                    class="h-2 flex-1 rounded-full transition-all"
                    :style="{ background: i <= streakDots ? 'var(--gl-accent)' : 'var(--gl-surface-2)' }">
                </div>
            </div>
        </div>

        <!-- Points Card (visual only, from existing data) -->
        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon gold">
                    <Award class="h-5 w-5" style="color: var(--gl-accent);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ totalPoints }}</p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Total Points</p>
                    <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Earned from activities</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Activity Type Cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/student/quizzes" class="block">
            <div class="gl-glow-card p-5 transition-all duration-200 cursor-pointer">
                <div class="flex items-center gap-4">
                    <div class="gl-stat-icon blue">
                        <FileQuestion class="h-5 w-5" style="color: var(--gl-primary);" :stroke-width="2" />
                    </div>
                    <div>
                        <p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ stats.quizzes.submitted }}/{{ stats.quizzes.total }}</p>
                        <p class="text-sm" style="color: var(--gl-text-secondary)">Quizzes</p>
                        <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ typeAverages.Quiz }}% avg</p>
                    </div>
                </div>
                <!-- Progress bar -->
                <div class="gl-xp-bar mt-3">
                    <div class="gl-xp-bar-fill" :style="{ width: stats.quizzes.total > 0 ? (stats.quizzes.submitted / stats.quizzes.total) * 100 + '%' : '0%' }"></div>
                </div>
            </div>
        </Link>

        <Link href="/student/exams" class="block">
            <div class="gl-glow-card p-5 transition-all duration-200 cursor-pointer">
                <div class="flex items-center gap-4">
                    <div class="gl-stat-icon purple">
                        <FileText class="h-5 w-5" style="color: var(--gl-secondary);" :stroke-width="2" />
                    </div>
                    <div>
                        <p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ stats.exams.submitted }}/{{ stats.exams.total }}</p>
                        <p class="text-sm" style="color: var(--gl-text-secondary)">Exams</p>
                        <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ typeAverages.Exam }}% avg</p>
                    </div>
                </div>
                <div class="gl-xp-bar mt-3">
                    <div class="gl-xp-bar-fill" :style="{ width: stats.exams.total > 0 ? (stats.exams.submitted / stats.exams.total) * 100 + '%' : '0%', background: 'linear-gradient(90deg, var(--gl-secondary), #A855F7)' }"></div>
                </div>
            </div>
        </Link>

        <Link href="/student/seatworks" class="block">
            <div class="gl-glow-card p-5 transition-all duration-200 cursor-pointer">
                <div class="flex items-center gap-4">
                    <div class="gl-stat-icon green">
                        <ClipboardList class="h-5 w-5" style="color: var(--gl-success);" :stroke-width="2" />
                    </div>
                    <div>
                        <p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ stats.seatworks.submitted }}/{{ stats.seatworks.total }}</p>
                        <p class="text-sm" style="color: var(--gl-text-secondary)">Seatworks</p>
                        <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ typeAverages.Seatwork }}% avg</p>
                    </div>
                </div>
                <div class="gl-xp-bar mt-3">
                    <div class="gl-xp-bar-fill" :style="{ width: stats.seatworks.total > 0 ? (stats.seatworks.submitted / stats.seatworks.total) * 100 + '%' : '0%', background: 'linear-gradient(90deg, var(--gl-success), #34D399)' }"></div>
                </div>
            </div>
        </Link>

        <Link href="/student/practicals" class="block">
            <div class="gl-glow-card p-5 transition-all duration-200 cursor-pointer">
                <div class="flex items-center gap-4">
                    <div class="gl-stat-icon gold">
                        <FlaskConical class="h-5 w-5" style="color: var(--gl-accent);" :stroke-width="2" />
                    </div>
                    <div>
                        <p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ stats.practicals.submitted }}/{{ stats.practicals.total }}</p>
                        <p class="text-sm" style="color: var(--gl-text-secondary)">Practicals</p>
                        <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ typeAverages.Practical }}% avg</p>
                    </div>
                </div>
                <div class="gl-xp-bar mt-3">
                    <div class="gl-xp-bar-fill" :style="{ width: stats.practicals.total > 0 ? (stats.practicals.submitted / stats.practicals.total) * 100 + '%' : '0%', background: 'linear-gradient(90deg, #F59E0B, #F97316)' }"></div>
                </div>
            </div>
        </Link>
    </div>

    <!-- Recent Results -->
    <div class="gl-glow-card overflow-hidden">
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-3">
                <Activity class="h-4 w-4" style="color: var(--gl-primary);" :stroke-width="2" />
                <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Recent Results</h3>
            </div>
        </div>
        <div v-if="!recentResults.length" class="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
                <ClipboardList class="h-5 w-5" :stroke-width="1.75" style="color: var(--gl-text-muted)" />
            </div>
            <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No results yet</p>
            <p class="mt-1 text-xs" style="color: var(--gl-text-muted)">Complete an activity to see your results here.</p>
        </div>
        <ul v-else class="divide-y" style="border-color: var(--gl-border);">
            <li v-for="r in recentResults" :key="r.submitted_at + r.title"
                class="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-[rgba(59,130,246,0.03)]">
                <div class="flex items-center gap-3">
                    <PctBadge :pct="r.pct" />
                    <div>
                        <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ r.title }}</p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="badgeClass(r.type)">{{ r.type }}</span>
                            <span class="text-xs" style="color: var(--gl-text-muted)">{{ r.score }}/{{ r.total }}</span>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link, usePage } from '@inertiajs/vue3';
import { FileQuestion, FileText, ClipboardList, FlaskConical, TrendingUp, Clock, Zap, Award, Activity, LayoutDashboard } from '@lucide/vue';
import PctBadge from '@/components/PctBadge.vue';

const props = defineProps<{
    overallAvg: number;
    typeAverages: Record<string, number>;
    pendingCount: number;
    recentResults: { type: string; title: string; score: number; total: number; pct: number; submitted_at: string }[];
    stats: { quizzes: { total: number; submitted: number }; exams: { total: number; submitted: number }; seatworks: { total: number; submitted: number }; practicals: { total: number; submitted: number } };
}>();

const page = usePage();
const flash = page.props.flash as any;

const totalPoints = computed(() => {
    const user = (page.props as any).auth?.user;
    return user?.total_points ?? 0;
});

const gradedCount = computed(() => {
    const r = props.recentResults.filter(x => x.pct !== null && x.pct !== undefined);
    const seen = new Set<string>();
    return r.filter(x => {
        const key = x.type + '|' + x.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).length;
});

const streakDots = computed(() => {
    const r = props.recentResults;
    const recent = r.slice(0, 7);
    return recent.filter(x => x.pct !== null && x.pct !== undefined && x.pct >= 60).length;
});

function badgeClass(type: string): string {
    const map: Record<string, string> = {
        Quiz: 'bg-[rgba(59,130,246,0.12)] text-[#3B82F6]',
        Exam: 'bg-[rgba(251,191,36,0.12)] text-[#FBBF24]',
        Seatwork: 'bg-[rgba(16,185,129,0.12)] text-[#10B981]',
        Practical: 'bg-[rgba(239,68,68,0.12)] text-[#EF4444]',
    };
    return map[type] ?? 'bg-[var(--gl-surface-2)] text-[var(--gl-text-secondary)]';
}
</script>

<style scoped>
.card a { text-decoration: none; }
</style>
