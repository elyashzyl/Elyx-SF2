<template>
    <Head title="Leaderboard" />

    <div class="mb-6">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Leaderboard</h2>
        <p class="text-sm" style="color: #5A6376">Student rankings based on overall performance across all activities.</p>
    </div>

    <div class="mb-4 flex items-center gap-4">
        <select v-model="gradeFilter" class="rounded-lg border border-[#D2D6DE] px-3 py-2 text-sm outline-none focus:border-[#1D3557]" style="color: #1B2231">
            <option value="">All grade levels</option>
            <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <select v-model="sectionFilter" class="rounded-lg border border-[#D2D6DE] px-3 py-2 text-sm outline-none focus:border-[#1D3557]" style="color: #1B2231">
            <option value="">All sections</option>
            <option v-for="s in filteredSections" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
    </div>

    <div v-if="!filtered.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <Trophy class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No students found</p>
        <p class="mt-1 text-sm" style="color: #7C8598">No students match your filter selection.</p>
    </div>

    <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium w-12">#</th>
                    <th class="px-6 py-3 font-medium">Student</th>
                    <th class="px-6 py-3 font-medium">Grade / Section</th>
                    <th class="px-6 py-3 font-medium text-center">Quiz</th>
                    <th class="px-6 py-3 font-medium text-center">Seatwork</th>
                    <th class="px-6 py-3 font-medium text-center">Practical</th>
                    <th class="px-6 py-3 font-medium text-center">Exam</th>
                    <th class="px-6 py-3 font-medium text-center">Overall</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="(e, i) in filtered" :key="e.id" class="hover:bg-[#F9FAFB]" :class="topRowClass(i)">
                    <td class="px-6 py-3">
                        <div v-if="i < 3" class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                            :class="medalClass(i)">
                            <component :is="medalIcon(i)" class="h-4 w-4" :stroke-width="2.5" />
                        </div>
                        <span v-else class="text-sm font-medium" style="color: #7C8598">{{ i + 1 }}</span>
                    </td>
                    <td class="px-6 py-3">
                        <p class="font-medium" style="color: #1B2231">{{ e.name }}</p>
                    </td>
                    <td class="px-6 py-3" style="color: #5A6376">
                        {{ e.grade_level_name || e.grade || '—' }}
                        <span v-if="e.section_name" class="text-xs" style="color: #7C8598"> — {{ e.section_name }}</span>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <PctBadge :value="e.quiz" />
                    </td>
                    <td class="px-6 py-3 text-center">
                        <PctBadge :value="e.seatwork" />
                    </td>
                    <td class="px-6 py-3 text-center">
                        <PctBadge :value="e.practical" />
                    </td>
                    <td class="px-6 py-3 text-center">
                        <PctBadge :value="e.exam" />
                    </td>
                    <td class="px-6 py-3 text-center">
                        <span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                            :class="overallClass(e.overall)">
                            {{ e.overall ?? '—' }}<template v-if="e.overall !== null">%</template>
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

const props = defineProps<{ entries: any[]; sections: any[]; gradeLevels: any[] }>();

const gradeFilter = ref('');
const sectionFilter = ref('');

const filteredSections = computed(() => {
    if (!gradeFilter.value) return props.sections;
    return props.sections.filter((s: any) => s.grade_level_id === Number(gradeFilter.value));
});

const filtered = computed(() => {
    return props.entries.filter((e: any) => {
        if (gradeFilter.value && e.grade_level_id !== Number(gradeFilter.value)) return false;
        if (sectionFilter.value && e.section_id !== Number(sectionFilter.value)) return false;
        return true;
    });
});

function medalIcon(i: number) {
    return [Trophy, Medal, Award][i] ?? Trophy;
}

function medalClass(i: number) {
    return [
        'bg-[#F5EBD8] text-[#A5701A]',
        'bg-[#E9EBEF] text-[#5A6376]',
        'bg-[#F6DEDD] text-[#AA3C36]',
    ][i] ?? 'bg-[#E9EBEF] text-[#5A6376]';
}

function topRowClass(i: number) {
    return i < 3 ? 'bg-[#FBFBFB]' : '';
}

function overallClass(pct: number | null) {
    if (pct === null) return 'bg-[#E9EBEF] text-[#7C8598]';
    if (pct >= 80) return 'bg-[#DCEEE3] text-[#2F7A54]';
    if (pct >= 60) return 'bg-[#FFF3D6] text-[#A5701A]';
    return 'bg-[#F6DEDD] text-[#AA3C36]';
}
</script>
