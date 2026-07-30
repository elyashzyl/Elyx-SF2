<template>
    <Head title="Leaderboard" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background-color: #F4F5F7; overflow-y: auto;">
        <div class="px-6 py-6" style="max-width: 80rem;">
            <div class="mb-6">
                <h2 class="text-lg font-semibold" style="color: #1B2231">Leaderboard</h2>
                <p class="text-sm" style="color: #5A6376">{{ sectionName }} rankings based on overall performance.</p>
            </div>

            <div v-if="!entries.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <Trophy class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No data yet</p>
        <p class="mt-1 text-sm" style="color: #7C8598">Complete some activities to appear on the leaderboard.</p>
    </div>

    <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium w-12">#</th>
                    <th class="px-6 py-3 font-medium">Student</th>
                    <th class="px-6 py-3 font-medium text-center">Quiz</th>
                    <th class="px-6 py-3 font-medium text-center">Seatwork</th>
                    <th class="px-6 py-3 font-medium text-center">Practical</th>
                    <th class="px-6 py-3 font-medium text-center">Exam</th>
                    <th class="px-6 py-3 font-medium text-center">Overall</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="(e, i) in entries" :key="e.id" class="hover:bg-[#F9FAFB]" :class="[topRowClass(i), e.id === userId ? 'bg-[#E7F3FF] hover:bg-[#D4E9FF]' : '']">
                    <td class="px-6 py-3">
                        <div v-if="i < 3" class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                            :class="medalClass(i)">
                            <component :is="medalIcon(i)" class="h-4 w-4" :stroke-width="2.5" />
                        </div>
                        <span v-else class="text-sm font-medium" :class="e.id === userId ? 'font-bold' : ''" style="color: #7C8598">{{ e.rank }}</span>
                    </td>
                    <td class="px-6 py-3">
                        <p class="font-medium" :class="e.id === userId ? 'font-bold' : ''" style="color: #1B2231">{{ e.name }}</p>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <PctBadge :value="e.quiz.pct" />
                        <div v-if="e.quiz.pct !== null" class="mt-0.5 text-xs" style="color: #7C8598">{{ e.quiz.score }}/{{ e.quiz.total }}</div>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <PctBadge :value="e.seatwork.pct" />
                        <div v-if="e.seatwork.pct !== null" class="mt-0.5 text-xs" style="color: #7C8598">{{ e.seatwork.score }}/{{ e.seatwork.total }}</div>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <PctBadge :value="e.practical.pct" />
                        <div v-if="e.practical.pct !== null" class="mt-0.5 text-xs" style="color: #7C8598">{{ e.practical.score }}/{{ e.practical.total }}</div>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <PctBadge :value="e.exam.pct" />
                        <div v-if="e.exam.pct !== null" class="mt-0.5 text-xs" style="color: #7C8598">{{ e.exam.score }}/{{ e.exam.total }}</div>
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
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, usePage } from '@inertiajs/vue3';
import { Trophy, Medal, Award } from '@lucide/vue';
import PctBadge from '@/components/PctBadge.vue';

const page = usePage();
const userId = (page.props.auth as any).user.id;

const props = defineProps<{ entries: any[]; section_name: string }>();

const sectionName = props.section_name || 'Your Section';

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