<template>
    <Head title="Leaderboard" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background: var(--gl-bg); overflow-y: auto;">
        <div class="px-6 py-6">

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(251,191,36,0.12), rgba(59,130,246,0.08)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="flex flex-wrap items-start justify-between gap-6">
                <div>
                    <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                        style="background: linear-gradient(135deg, var(--gl-accent), #F59E0B); box-shadow: 0 0 20px var(--gl-accent-glow);">
                        <Trophy class="h-6 w-6 text-white" :stroke-width="2" />
                    </div>
                    <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Leaderboard</h1>
                    <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                        Compete, earn XP, climb the ranks, and become the ultimate learner.
                    </p>
                </div>
                <div class="flex flex-wrap gap-3 text-xs">
                    <span class="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                        style="background: var(--gl-surface-2); color: var(--gl-text-secondary);">
                        <Users class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-primary);" />
                        {{ entries.length }} students
                    </span>
                    <span class="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                        style="background: var(--gl-surface-2); color: var(--gl-text-secondary);">
                        <MapPin class="h-3.5 w-3.5" :stroke-width="2" style="color: var(--gl-accent);" />
                        {{ section_name }}
                    </span>
                </div>
            </div>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-accent), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
    </div>

    <!-- Your Rank Card -->
    <div class="gl-glow-card mb-6 p-5" style="border-color: rgba(59,130,246,0.3);">
        <div class="flex flex-wrap items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
                <Target class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <div>
                <p class="text-xs font-medium uppercase tracking-wide" style="color: var(--gl-text-muted)">Your Rank</p>
                <div class="flex items-baseline gap-2">
                    <span class="text-2xl font-bold" style="color: var(--gl-primary);">#{{ student_rank }}</span>
                    <span class="text-sm" style="color: var(--gl-text-secondary)">{{ student_name }}</span>
                </div>
            </div>
            <div class="ml-auto flex items-center gap-4">
                <div class="text-center">
                    <p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ student_total_points }}</p>
                    <p class="text-xs" style="color: var(--gl-text-muted)">XP</p>
                </div>
                <div class="text-center">
                    <p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ studentLevel }}</p>
                    <p class="text-xs" style="color: var(--gl-text-muted)">Level</p>
                </div>
            </div>
        </div>
        <div class="gl-xp-bar mt-3">
            <div class="gl-xp-bar-fill" :style="{ width: xpProgressPct + '%' }"></div>
        </div>
        <p class="text-xs mt-1.5" style="color: var(--gl-text-muted)">
            {{ xpProgress }} / {{ xpNextLevel }} XP to Level {{ studentLevel + 1 }}
        </p>
    </div>

    <!-- Top 3 Podium -->
    <div v-if="entries.length >= 3" class="mb-8 grid grid-cols-3 gap-4 items-end">
        <!-- 2nd Place -->
        <div class="gl-glow-card p-5 text-center gl-fade-in" style="border-color: rgba(148,163,184,0.3);">
            <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                style="background: linear-gradient(135deg, #94A3B8, #64748B); box-shadow: 0 0 12px rgba(148,163,184,0.3);">
                <Medal class="h-7 w-7 text-white" :stroke-width="2" />
            </div>
            <p class="text-2xl font-bold" style="color: #94A3B8;">#2</p>
            <p class="text-sm font-semibold mt-1" style="color: var(--gl-text-primary)">{{ entries[1]?.name }}</p>
            <p class="text-xs mt-1" style="color: var(--gl-text-secondary)">{{ entries[1]?.total_points }} XP</p>
        </div>
        <!-- 1st Place -->
        <div class="gl-glow-card p-6 text-center gl-fade-in -mt-4" style="border-color: rgba(251,191,36,0.4);">
            <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                style="background: linear-gradient(135deg, #FBBF24, #F59E0B); box-shadow: 0 0 20px rgba(251,191,36,0.4);">
                <Crown class="h-8 w-8 text-white" :stroke-width="2" />
            </div>
            <p class="text-3xl font-bold" style="color: var(--gl-accent);">#1</p>
            <p class="text-base font-bold mt-1" style="color: var(--gl-text-primary)">{{ entries[0]?.name }}</p>
            <p class="text-sm mt-1" style="color: var(--gl-text-secondary)">{{ entries[0]?.total_points }} XP</p>
            <span class="inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold"
                style="background: rgba(251,191,36,0.15); color: var(--gl-accent);">Level {{ levelOf(entries[0]) }}</span>
        </div>
        <!-- 3rd Place -->
        <div class="gl-glow-card p-5 text-center gl-fade-in" style="border-color: rgba(249,115,22,0.3);">
            <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                style="background: linear-gradient(135deg, #F97316, #EA580C); box-shadow: 0 0 12px rgba(249,115,22,0.3);">
                <Award class="h-7 w-7 text-white" :stroke-width="2" />
            </div>
            <p class="text-2xl font-bold" style="color: #F97316;">#3</p>
            <p class="text-sm font-semibold mt-1" style="color: var(--gl-text-primary)">{{ entries[2]?.name }}</p>
            <p class="text-xs mt-1" style="color: var(--gl-text-secondary)">{{ entries[2]?.total_points }} XP</p>
        </div>
    </div>

    <!-- Empty State -->
    <div v-if="!entries.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
            style="background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(59,130,246,0.1));">
            <Trophy class="h-10 w-10" style="color: var(--gl-accent);" :stroke-width="1.5" />
        </div>
        <h3 class="text-lg font-semibold" style="color: var(--gl-text-primary)">Leaderboard Coming Soon</h3>
        <p class="mt-2 max-w-md text-sm" style="color: var(--gl-text-secondary)">
            Complete activities to become one of the first ranked learners in your section.
        </p>
    </div>

    <!-- Rankings Table -->
    <div v-if="entries.length > 3" class="gl-glow-card overflow-hidden">
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border);">
            <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">All Rankings</h3>
        </div>
        <table class="w-full text-sm">
            <thead>
                <tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border);">
                    <th class="px-6 py-3 font-medium w-12">#</th>
                    <th class="px-6 py-3 font-medium">Student</th>
                    <th class="px-6 py-3 font-medium text-center">XP</th>
                    <th class="px-6 py-3 font-medium text-center">Level</th>
                </tr>
            </thead>
            <tbody class="divide-y" style="border-color: var(--gl-border);">
                <tr v-for="(e, i) in entries" :key="e.id"
                    class="transition-colors hover:bg-[rgba(59,130,246,0.03)]"
                    :style="e.id === (page.props.auth as any).user.id ? { background: 'rgba(59,130,246,0.06)' } : {}">
                    <td class="px-6 py-3">
                        <span v-if="e.rank <= 3" class="font-bold" :class="rankClass(e.rank)">{{ e.rank }}</span>
                        <span v-else class="text-sm" style="color: var(--gl-text-muted)">{{ e.rank }}</span>
                    </td>
                    <td class="px-6 py-3" style="color: var(--gl-text-primary)">
                        <span class="font-medium">{{ e.name }}</span>
                        <span v-if="e.id === (page.props.auth as any).user.id" class="ml-2 text-xs rounded-full px-2 py-0.5"
                            style="background: rgba(59,130,246,0.12); color: var(--gl-primary);">You</span>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <span class="font-semibold" style="color: var(--gl-success);">{{ e.total_points }} XP</span>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <span class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style="background: rgba(124,58,237,0.12); color: var(--gl-secondary);">
                            Level {{ levelOf(e) }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Motivation -->
    <div class="gl-glow-card mt-6 p-5"
        style="border-color: rgba(59,130,246,0.1); background: linear-gradient(135deg, rgba(59,130,246,0.03), rgba(124,58,237,0.02));">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style="background: rgba(251,191,36,0.12);">
                    <Trophy class="h-4 w-4" style="color: var(--gl-accent);" :stroke-width="2" />
                </div>
                <p class="text-xs" style="color: var(--gl-text-secondary)">Keep learning to reach the Top 3.</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style="background: rgba(59,130,246,0.12);">
                    <Star class="h-4 w-4" style="color: var(--gl-primary);" :stroke-width="2" />
                </div>
                <p class="text-xs" style="color: var(--gl-text-secondary)">Every activity earns valuable XP.</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style="background: rgba(124,58,237,0.12);">
                    <Rocket class="h-4 w-4" style="color: var(--gl-secondary);" :stroke-width="2" />
                </div>
                <p class="text-xs" style="color: var(--gl-text-secondary)">Complete activities to climb the rankings.</p>
            </div>
        </div>
    </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';
import { Trophy, Medal, Crown, Award, Target, Users, MapPin, Star, Rocket } from '@lucide/vue';

const props = defineProps<{
    entries: any[];
    section_name: string;
    student_name: string;
    student_total_points: number;
    student_rank: number;
}>();

const page = usePage();

const studentLevel = computed(() => Math.floor(props.student_total_points / 100) + 1);
const xpNextLevel = computed(() => studentLevel.value * 100);
const xpProgress = computed(() => props.student_total_points % 100);
const xpProgressPct = computed(() => Math.min(100, Math.round((xpProgress.value / xpNextLevel.value) * 100)));

function levelOf(entry: any): number {
    return Math.floor((entry?.total_points ?? 0) / 100) + 1;
}

function rankClass(rank: number): string {
    if (rank === 1) return 'text-[#FBBF24]';
    if (rank === 2) return 'text-[#94A3B8]';
    if (rank === 3) return 'text-[#F97316]';
    return '';
}
</script>
