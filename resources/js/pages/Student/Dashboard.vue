<template>
    <Head title="Student Dashboard" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>
    <div v-if="flash?.info" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #F5EBD8; color: #A5701A">
        {{ flash.info }}
    </div>

    <div class="mb-8">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Welcome back, {{ page.props.auth.user.name }}</h2>
        <p class="text-sm" style="color: #5A6376">Here's your performance overview.</p>
    </div>

    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card flex flex-col items-center justify-center p-6 text-center">
            <p class="text-3xl font-bold" style="color: #1D3557">{{ overallAvg }}<span class="text-lg font-normal" style="color: #7C8598">%</span></p>
            <p class="mt-1 text-sm font-medium" style="color: #404A5C">Overall Average</p>
            <p class="text-xs" style="color: #7C8598">{{ recentResults.length }} activities completed</p>
        </div>

        <div class="card flex flex-col items-center justify-center p-6 text-center">
            <p class="text-3xl font-bold" :style="{ color: pendingCount > 0 ? '#A5701A' : '#2F7A54' }">{{ pendingCount }}</p>
            <p class="mt-1 text-sm font-medium" style="color: #404A5C">Pending</p>
            <p class="text-xs" style="color: #7C8598">activities not yet submitted</p>
        </div>

        <Link href="/student/quizzes" class="card flex items-center gap-4 p-5 transition hover:shadow-md">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF2F7]">
                <FileQuestion class="h-6 w-6" :stroke-width="1.75" style="color: #1D3557" />
            </div>
            <div>
                <p class="text-2xl font-semibold" style="color: #1B2231">{{ stats.quizzes.submitted }}/{{ stats.quizzes.total }}</p>
                <p class="text-sm" style="color: #5A6376">Quizzes</p>
                <p class="text-xs" style="color: #7C8598">{{ typeAverages.Quiz }}% avg</p>
            </div>
        </Link>

        <Link href="/student/exams" class="card flex items-center gap-4 p-5 transition hover:shadow-md">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF2F7]">
                <FileText class="h-6 w-6" :stroke-width="1.75" style="color: #1D3557" />
            </div>
            <div>
                <p class="text-2xl font-semibold" style="color: #1B2231">{{ stats.exams.submitted }}/{{ stats.exams.total }}</p>
                <p class="text-sm" style="color: #5A6376">Exams</p>
                <p class="text-xs" style="color: #7C8598">{{ typeAverages.Exam }}% avg</p>
            </div>
        </Link>

        <Link href="/student/seatworks" class="card flex items-center gap-4 p-5 transition hover:shadow-md">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF2F7]">
                <ClipboardList class="h-6 w-6" :stroke-width="1.75" style="color: #1D3557" />
            </div>
            <div>
                <p class="text-2xl font-semibold" style="color: #1B2231">{{ stats.seatworks.submitted }}/{{ stats.seatworks.total }}</p>
                <p class="text-sm" style="color: #5A6376">Seatworks</p>
                <p class="text-xs" style="color: #7C8598">{{ typeAverages.Seatwork }}% avg</p>
            </div>
        </Link>

        <Link href="/student/practicals" class="card flex items-center gap-4 p-5 transition hover:shadow-md">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EEF2F7]">
                <FlaskConical class="h-6 w-6" :stroke-width="1.75" style="color: #1D3557" />
            </div>
            <div>
                <p class="text-2xl font-semibold" style="color: #1B2231">{{ stats.practicals.submitted }}/{{ stats.practicals.total }}</p>
                <p class="text-sm" style="color: #5A6376">Practicals</p>
                <p class="text-xs" style="color: #7C8598">{{ typeAverages.Practical }}% avg</p>
            </div>
        </Link>
    </div>

    <div class="card">
        <div class="border-b border-[#E9EBEF] px-5 py-4">
            <h3 class="text-sm font-semibold" style="color: #1B2231">Recent Results</h3>
        </div>
        <div v-if="!recentResults.length" class="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#E9EBEF]">
                <ClipboardList class="h-5 w-5" :stroke-width="1.75" style="color: #7C8598" />
            </div>
            <p class="text-sm font-medium" style="color: #404A5C">No results yet</p>
            <p class="mt-1 text-xs" style="color: #7C8598">Complete an activity to see your results here.</p>
        </div>
        <ul v-else class="divide-y divide-[#E9EBEF]">
            <li v-for="r in recentResults" :key="r.submitted_at + r.title" class="flex items-center justify-between px-5 py-3.5">
                <div class="flex items-center gap-3">
                    <PctBadge :pct="r.pct" />
                    <div>
                        <p class="text-sm font-medium" style="color: #1B2231">{{ r.title }}</p>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="badgeClass(r.type)">{{ r.type }}</span>
                            <span class="text-xs" style="color: #7C8598">{{ r.score }}/{{ r.total }}</span>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { FileQuestion, FileText, ClipboardList, FlaskConical } from '@lucide/vue';
import PctBadge from '@/components/PctBadge.vue';

defineProps<{
    overallAvg: number;
    typeAverages: Record<string, number>;
    pendingCount: number;
    recentResults: { type: string; title: string; score: number; total: number; pct: number; submitted_at: string }[];
    stats: { quizzes: { total: number; submitted: number }; exams: { total: number; submitted: number }; seatworks: { total: number; submitted: number }; practicals: { total: number; submitted: number } };
}>();

const page = usePage();
const flash = page.props.flash as any;

function badgeClass(type: string): string {
    const map: Record<string, string> = {
        Quiz: 'bg-[#EEF2F7] text-[#1D3557]',
        Exam: 'bg-[#F5EBD8] text-[#A5701A]',
        Seatwork: 'bg-[#DCEEE3] text-[#2F7A54]',
        Practical: 'bg-[#F6DEDD] text-[#AA3C36]',
    };
    return map[type] ?? 'bg-[#E9EBEF] text-[#5A6376]';
}
</script>

<style scoped>
.card a { text-decoration: none; }
</style>