<template>
    <Head title="Leaderboard" />

    <div class="mb-6 gl-fade-in">
        <h2 class="text-xl font-bold" style="color: var(--gl-text-primary)">Leaderboard</h2>
        <p class="text-sm mt-1" style="color: var(--gl-text-secondary)">Student rankings per section based on accumulated points.</p>
    </div>

    <div class="mb-6 flex items-center gap-4">
        <select v-model="gradeFilter"
            class="rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            style="background: var(--gl-surface-2); border: 1px solid var(--gl-border); color: var(--gl-text-primary);">
            <option value="">All grade levels</option>
            <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <select v-model="sectionFilter"
            class="rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            style="background: var(--gl-surface-2); border: 1px solid var(--gl-border); color: var(--gl-text-primary);">
            <option value="">All sections</option>
            <option v-for="s in filteredSections" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
    </div>

    <div v-if="!filteredGroups.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
            <Trophy class="h-6 w-6" :stroke-width="1.75" style="color: var(--gl-text-muted)" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No students found</p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">No students match your filter selection.</p>
    </div>

    <div v-for="group in filteredGroups" :key="group.section_id" class="gl-glow-card mb-6 overflow-hidden last:mb-0">
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border);">
            <h3 class="text-base font-semibold" style="color: var(--gl-text-primary)">{{ group.section_name || 'Unknown Section' }}</h3>
            <p v-if="group.grade_level_name" class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ group.grade_level_name }}</p>
        </div>
        <table class="w-full text-sm">
            <thead>
                <tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border);">
                    <th class="px-6 py-3 font-medium w-12">#</th>
                    <th class="px-6 py-3 font-medium">Student</th>
                    <th class="px-6 py-3 font-medium text-center">Points</th>
                </tr>
            </thead>
            <tbody class="divide-y" style="border-color: var(--gl-border);">
                <tr v-for="(e, i) in group.entries" :key="e.id" class="transition-colors hover:bg-[rgba(59,130,246,0.03)]"
                    :class="topRowClass(i)">
                    <td class="px-6 py-3">
                        <div v-if="i < 3" class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                            :class="medalClass(i)">
                            <component :is="medalIcon(i)" class="h-4 w-4" :stroke-width="2.5" />
                        </div>
                        <span v-else class="text-sm font-medium" style="color: var(--gl-text-muted)">{{ e.rank }}</span>
                    </td>
                    <td class="px-6 py-3">
                        <p class="font-medium" style="color: var(--gl-text-primary)">{{ e.name }}</p>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                            style="background: var(--gl-success-bg); color: var(--gl-success);">
                            {{ e.total_points }} pts
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Trophy, Medal, Award } from '@lucide/vue';
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

function topRowClass(i: number) {
    return i < 3 ? '' : '';
}
</script>
