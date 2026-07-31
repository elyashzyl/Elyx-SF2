<template>
    <Head title="Leaderboard" />

    <!-- Hero -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(251,191,36,0.1), rgba(59,130,246,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, var(--gl-accent), #F59E0B); box-shadow: 0 0 20px var(--gl-accent-glow);">
                <Trophy class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Champions Leaderboard</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Compete with your classmates, earn points, climb the rankings, and become the champion of your section.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-accent), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
    </div>

    <!-- Filters -->
    <div class="mb-6 flex items-center gap-3">
        <select v-model="gradeFilter" class="rounded-xl px-4 py-2.5 text-sm outline-none"
            style="background: var(--gl-surface-2); border: 1px solid var(--gl-border); color: var(--gl-text-primary);">
            <option value="">All grade levels</option>
            <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <select v-model="sectionFilter" class="rounded-xl px-4 py-2.5 text-sm outline-none"
            style="background: var(--gl-surface-2); border: 1px solid var(--gl-border); color: var(--gl-text-primary);">
            <option value="">All sections</option>
            <option v-for="s in filteredSections" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
    </div>

    <!-- Empty -->
    <div v-if="!filteredGroups.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style="background: var(--gl-surface-2);">
            <Trophy class="h-7 w-7" style="color: var(--gl-text-muted);" :stroke-width="1.5" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No students found</p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">No students match your filter selection.</p>
    </div>

    <!-- Sections -->
    <div v-for="group in filteredGroups" :key="group.section_id" class="gl-glow-card mb-6 overflow-hidden last:mb-0">
        <!-- Section header -->
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border); background: linear-gradient(135deg, rgba(59,130,246,0.03), rgba(124,58,237,0.02));">
            <h3 class="text-base font-semibold" style="color: var(--gl-text-primary)">{{ group.section_name || 'Unknown Section' }}</h3>
            <p v-if="group.grade_level_name" class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ group.grade_level_name }} · {{ group.entries.length }} students</p>
        </div>

        <!-- Top 3 Podium -->
        <div v-if="group.entries.length >= 3" class="grid grid-cols-3 gap-3 p-5 items-end border-b" style="border-color: var(--gl-border);">
            <!-- 2nd -->
            <div class="text-center" v-if="group.entries[1]">
                <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full"
                    style="background: linear-gradient(135deg, #94A3B8, #64748B);">
                    <Medal class="h-5 w-5 text-white" :stroke-width="2" />
                </div>
                <p class="text-sm font-semibold truncate" style="color: var(--gl-text-primary)">{{ group.entries[1].name }}</p>
                <p class="text-xs" style="color: #94A3B8;">#2 · {{ group.entries[1].total_points }} pts</p>
            </div>
            <!-- 1st -->
            <div class="text-center -mt-6" v-if="group.entries[0]">
                <div class="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full"
                    style="background: linear-gradient(135deg, #FBBF24, #F59E0B); box-shadow: 0 0 20px rgba(251,191,36,0.4);">
                    <Trophy class="h-7 w-7 text-white" :stroke-width="2" />
                </div>
                <p class="text-base font-bold truncate" style="color: var(--gl-text-primary)">{{ group.entries[0].name }}</p>
                <p class="text-sm font-semibold mt-0.5" style="color: var(--gl-accent);">#1 · {{ group.entries[0].total_points }} pts</p>
            </div>
            <!-- 3rd -->
            <div class="text-center" v-if="group.entries[2]">
                <div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full"
                    style="background: linear-gradient(135deg, #F97316, #EA580C);">
                    <Award class="h-5 w-5 text-white" :stroke-width="2" />
                </div>
                <p class="text-sm font-semibold truncate" style="color: var(--gl-text-primary)">{{ group.entries[2].name }}</p>
                <p class="text-xs" style="color: #F97316;">#3 · {{ group.entries[2].total_points }} pts</p>
            </div>
        </div>

        <!-- Rankings -->
        <table class="w-full text-sm">
            <thead>
                <tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border); background: var(--gl-surface-2);">
                    <th class="px-5 py-2.5 font-medium w-12">#</th>
                    <th class="px-5 py-2.5 font-medium">Student</th>
                    <th class="px-5 py-2.5 font-medium text-center">Points</th>
                    <th class="px-5 py-2.5 font-medium text-center">Level</th>
                </tr>
            </thead>
            <tbody class="divide-y" style="border-color: var(--gl-border);">
                <tr v-for="(e, i) in group.entries" :key="e.id" class="transition-colors hover:bg-[rgba(59,130,246,0.03)]">
                    <td class="px-5 py-3">
                        <div v-if="i < 3" class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                            :class="medalClass(i)">
                            <component :is="medalIcon(i)" class="h-4 w-4" :stroke-width="2.5" />
                        </div>
                        <span v-else class="text-sm font-medium" style="color: var(--gl-text-muted)">{{ e.rank }}</span>
                    </td>
                    <td class="px-5 py-3">
                        <p class="font-medium" style="color: var(--gl-text-primary)">{{ e.name }}</p>
                    </td>
                    <td class="px-5 py-3 text-center">
                        <span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                            style="background: var(--gl-success-bg); color: var(--gl-success);">{{ e.total_points }} pts</span>
                    </td>
                    <td class="px-5 py-3 text-center">
                        <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                            style="background: rgba(124,58,237,0.1); color: var(--gl-secondary);">
                            Lv.{{ Math.floor((e.total_points ?? 0) / 100) + 1 }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Motivation -->
    <div class="gl-glow-card mt-6 p-5 text-center" style="border-color: rgba(251,191,36,0.15); background: linear-gradient(135deg, rgba(251,191,36,0.04), rgba(59,130,246,0.02));">
        <div class="flex items-center justify-center gap-2 mb-1 text-sm">
            <Flame class="h-4 w-4" style="color: var(--gl-accent);" :stroke-width="2" />
            <span style="color: var(--gl-text-primary); font-weight: 600;">Weekly Challenge</span>
        </div>
        <p class="text-xs" style="color: var(--gl-text-muted);">Earn more points this week to move up the leaderboard and unlock exclusive achievements.</p>
    </div>
</template>

<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Trophy, Medal, Award, Flame } from '@lucide/vue';
import { computed, ref } from 'vue';

const props = defineProps<{ entries: any[]; groups: any[]; sections: any[]; gradeLevels: any[] }>();

const gradeFilter = ref('');
const sectionFilter = ref('');

const filteredSections = computed(() => {
    if (!gradeFilter.value) return props.sections;
    return props.sections.filter((s: any) => s.grade_level_id === Number(gradeFilter.value));
});

const filteredGroups = computed(() => {
    return props.groups.filter((g: any) => {
        if (gradeFilter.value && g.grade_level_name !== props.gradeLevels.find((gl: any) => gl.id === Number(gradeFilter.value))?.name) return false;
        if (sectionFilter.value && g.section_id !== Number(sectionFilter.value)) return false;
        return true;
    });
});

function medalIcon(i: number) {
    return [Trophy, Medal, Award][i] ?? Trophy;
}

function medalClass(i: number) {
    return [
        'bg-[rgba(251,191,36,0.15)] text-[#FBBF24]',
        'bg-[var(--gl-surface-2)] text-[var(--gl-text-secondary)]',
        'bg-[rgba(239,68,68,0.15)] text-[#EF4444]',
    ][i] ?? 'bg-[var(--gl-surface-2)] text-[var(--gl-text-secondary)]';
}
</script>
