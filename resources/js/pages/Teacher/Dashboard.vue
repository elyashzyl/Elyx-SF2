<template>
    <Head title="Teacher Dashboard" />

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(124,58,237,0.08)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                <LayoutDashboard class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Welcome back, {{ page.props.auth.user.name }}</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Here's an overview of all activity across your classes.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Stat Cards -->
    <div class="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon blue">
                    <ClipboardList class="h-5 w-5" style="color: var(--gl-primary);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ totalSubmissions }}</p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Total Submissions</p>
                    <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ totalActivities }} activities · {{ studentCount }} students</p>
                </div>
            </div>
        </div>

        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4">
                <div class="gl-stat-icon green">
                    <TrendingUp class="h-5 w-5" style="color: var(--gl-success);" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ overallAvg }}<span class="text-sm font-normal" style="color: var(--gl-text-muted)">%</span></p>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Overall Average</p>
                    <div class="gl-xp-bar mt-2">
                        <div class="gl-xp-bar-fill" :style="{ width: overallAvg + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4 mb-3">
                <div class="gl-stat-icon purple">
                    <BarChart3 class="h-5 w-5" style="color: var(--gl-secondary);" :stroke-width="2" />
                </div>
                <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Per-Type Averages</p>
            </div>
            <div class="space-y-2">
                <div v-for="(avg, type) in typeAverages" :key="type" class="flex items-center justify-between">
                    <span class="text-xs" style="color: var(--gl-text-secondary)">{{ type }}</span>
                    <PctBadge :value="avg" />
                </div>
            </div>
        </div>

        <div class="gl-glow-card p-5">
            <div class="flex items-center gap-4 mb-3">
                <div class="gl-stat-icon gold">
                    <Layers class="h-5 w-5" style="color: var(--gl-accent);" :stroke-width="2" />
                </div>
                <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Per-Type Submissions</p>
            </div>
            <div class="space-y-2">
                <div v-for="(count, type) in typeSubmissions" :key="type" class="flex items-center justify-between">
                    <span class="text-xs" style="color: var(--gl-text-secondary)">{{ type }}</span>
                    <span class="text-sm font-semibold" style="color: var(--gl-text-primary)">{{ count }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Recent Activity -->
    <div class="gl-glow-card overflow-hidden">
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-3">
                <Activity class="h-4 w-4" style="color: var(--gl-primary);" :stroke-width="2" />
                <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Recent Activity</h3>
            </div>
        </div>
        <div v-if="!recentActivity.length" class="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
                <ClipboardList class="h-5 w-5" :stroke-width="1.75" style="color: var(--gl-text-muted)" />
            </div>
            <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No activity yet</p>
            <p class="mt-1 text-xs" style="color: var(--gl-text-muted)">Submissions will appear here once students complete activities.</p>
        </div>
        <ul v-else class="divide-y" style="border-color: var(--gl-border);">
            <li v-for="r in recentActivity" :key="r.submitted_at + r.title + r.student"
                class="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-[rgba(59,130,246,0.03)]">
                <div class="flex items-center gap-3">
                    <PctBadge :value="r.pct" />
                    <div>
                        <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ r.student }}</p>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="badgeClass(r.type)">{{ r.type }}</span>
                            <span class="text-xs" style="color: var(--gl-text-muted)">{{ r.title }} · {{ r.score }}/{{ r.total }}</span>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { Head, usePage } from '@inertiajs/vue3';
import { ClipboardList, TrendingUp, BarChart3, Layers, Activity, LayoutDashboard } from '@lucide/vue';
import PctBadge from '@/components/PctBadge.vue';

defineProps<{
    totalSubmissions: number;
    totalActivities: number;
    studentCount: number;
    overallAvg: number;
    typeAverages: Record<string, number>;
    typeSubmissions: Record<string, number>;
    recentActivity: { type: string; title: string; student: string; score: number; total: number; pct: number; submitted_at: string }[];
    isSuperadmin: boolean;
}>();

const page = usePage();
const flash = page.props.flash as any;

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
