<template>
    <Head title="My Results" />

    <div v-if="flash?.success" class="absolute left-4 top-4 z-10 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background-color: #F4F5F7; overflow-y: auto;">
        <div class="px-6 py-6" style="max-width: 80rem;">
            <div class="mb-6">
                <h2 class="text-lg font-semibold" style="color: #1B2231">My results</h2>
                <p class="text-sm" style="color: #5A6376">All your submitted activities with scores.</p>
            </div>

            <div v-if="!activities.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
                    <ClipboardCheck class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
                </div>
                <p class="text-sm font-medium" style="color: #404A5C">No results yet</p>
                <p class="mt-1 text-sm" style="color: #7C8598">Completed activities will show up here with your scores.</p>
            </div>

            <div v-else class="card overflow-hidden">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                            <th class="px-6 py-3 font-medium">Type</th>
                            <th class="px-6 py-3 font-medium">Activity</th>
                            <th class="px-6 py-3 font-medium">Teacher</th>
                            <th class="px-6 py-3 font-medium">Score</th>
                            <th class="px-6 py-3 font-medium">Date</th>
                            <th class="px-6 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#E9EBEF]">
                        <tr v-for="item in activities" :key="item.id + item.type" class="hover:bg-[#F9FAFB]">
                            <td class="px-6 py-3">
                                <span class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium" :class="badgeClass(item.type)">
                                    <component :is="typeIcon(item.type)" class="h-3.5 w-3.5" :stroke-width="2" />
                                    {{ item.type }}
                                </span>
                            </td>
                            <td class="px-6 py-3" style="color: #1B2231">{{ item.title }}</td>
                            <td class="px-6 py-3 text-sm" style="color: #5A6376">{{ item.teacher_name ?? '—' }}</td>
                            <td class="px-6 py-3">
                                <span class="font-medium" style="color: #1B2231">{{ item.score }}/{{ item.total }}</span>
                                <span class="ml-1.5 text-xs font-medium" :style="item.percentage >= 50 ? 'color: #2F7A54' : 'color: #AA3C36'">({{ item.percentage }}%)</span>
                            </td>
                            <td class="px-6 py-3 text-xs" style="color: #7C8598">{{ formatDate(item.submitted_at) }}</td>
                            <td class="px-6 py-3">
                                <Link :href="item.resultUrl" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="View details">
                                    <Eye class="h-3.5 w-3.5" :stroke-width="2" />
                                </Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ClipboardCheck, Eye, FileQuestion, FileText, ClipboardList, FlaskConical } from '@lucide/vue';

defineProps<{ activities: any[] }>();

const page = usePage();
const flash = page.props.flash as any;

function typeIcon(type: string) {
    const icons: Record<string, any> = { Quiz: FileQuestion, Exam: FileText, Seatwork: ClipboardList, Practical: FlaskConical };
    return icons[type] ?? ClipboardCheck;
}

function badgeClass(type: string) {
    const classes: Record<string, string> = {
        Quiz: 'bg-[#EEF2F7] text-[#1D3557]',
        Exam: 'bg-[#F5EBD8] text-[#A5701A]',
        Seatwork: 'bg-[#DCEEE3] text-[#2F7A54]',
        Practical: 'bg-[#E9EBEF] text-[#5A6376]',
    };
    return classes[type] ?? 'bg-[#E9EBEF] text-[#5A6376]';
}

function formatDate(value: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>