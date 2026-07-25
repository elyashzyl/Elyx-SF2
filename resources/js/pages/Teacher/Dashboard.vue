<template>
    <Head title="Teacher Dashboard" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-8">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Welcome back, {{ page.props.auth.user.name }}</h2>
        <p class="text-sm" style="color: #5A6376">Here's an overview of all activity across your classes.</p>
    </div>

    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card flex flex-col items-center justify-center p-6 text-center">
            <p class="text-3xl font-bold" style="color: #1D3557">{{ totalSubmissions }}</p>
            <p class="mt-1 text-sm font-medium" style="color: #404A5C">Total Submissions</p>
            <p class="text-xs" style="color: #7C8598">{{ totalActivities }} activities · {{ studentCount }} students</p>
        </div>

        <div class="card flex flex-col items-center justify-center p-6 text-center">
            <p class="text-3xl font-bold" style="color: #1D3557">{{ overallAvg }}<span class="text-lg font-normal" style="color: #7C8598">%</span></p>
            <p class="mt-1 text-sm font-medium" style="color: #404A5C">Overall Average</p>
            <p class="text-xs" style="color: #7C8598">across all submitted activities</p>
        </div>

        <div class="card p-5 text-center">
            <p class="mb-2 text-sm font-medium" style="color: #404A5C">Per-Type Averages</p>
            <div class="space-y-1.5 text-xs">
                <div v-for="(avg, type) in typeAverages" :key="type" class="flex items-center justify-between gap-3">
                    <span style="color: #5A6376">{{ type }}</span>
                    <PctBadge :value="avg" />
                </div>
            </div>
        </div>

        <div class="card p-5 text-center">
            <p class="mb-2 text-sm font-medium" style="color: #404A5C">Per-Type Submissions</p>
            <div class="space-y-1.5 text-xs">
                <div v-for="(count, type) in typeSubmissions" :key="type" class="flex items-center justify-between gap-3">
                    <span style="color: #5A6376">{{ type }}</span>
                    <span class="font-semibold" style="color: #1B2231">{{ count }}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="border-b border-[#E9EBEF] px-5 py-4">
            <h3 class="text-sm font-semibold" style="color: #1B2231">Recent Activity</h3>
        </div>
        <div v-if="!recentActivity.length" class="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#E9EBEF]">
                <ClipboardList class="h-5 w-5" :stroke-width="1.75" style="color: #7C8598" />
            </div>
            <p class="text-sm font-medium" style="color: #404A5C">No activity yet</p>
            <p class="mt-1 text-xs" style="color: #7C8598">Submissions will appear here once students complete activities.</p>
        </div>
        <ul v-else class="divide-y divide-[#E9EBEF]">
            <li v-for="r in recentActivity" :key="r.submitted_at + r.title + r.student" class="flex items-center justify-between px-5 py-3.5">
                <div class="flex items-center gap-3">
                    <PctBadge :value="r.pct" />
                    <div>
                        <p class="text-sm font-medium" style="color: #1B2231">{{ r.student }}</p>
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="badgeClass(r.type)">{{ r.type }}</span>
                            <span class="text-xs" style="color: #7C8598">{{ r.title }} · {{ r.score }}/{{ r.total }}</span>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { Head, usePage } from '@inertiajs/vue3';
import { ClipboardList } from '@lucide/vue';
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
        Quiz: 'bg-[#EEF2F7] text-[#1D3557]',
        Exam: 'bg-[#F5EBD8] text-[#A5701A]',
        Seatwork: 'bg-[#DCEEE3] text-[#2F7A54]',
        Practical: 'bg-[#F6DEDD] text-[#AA3C36]',
    };
    return map[type] ?? 'bg-[#E9EBEF] text-[#5A6376]';
}
</script>