<template>
    <Head title="My Results" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

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

    <div v-else class="card">
        <ul class="divide-y divide-[#E9EBEF]">
            <li v-for="item in activities" :key="item.id + item.type" class="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" :class="badgeClass(item.type)">
                        <component :is="typeIcon(item.type)" class="h-4 w-4" :stroke-width="2" />
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-medium truncate" style="color: #1B2231">{{ item.title }}</p>
                        <p class="flex items-center gap-1 text-xs" style="color: #7C8598">
                            <CalendarDays class="h-3.5 w-3.5" :stroke-width="2" />
                            {{ item.type }} · {{ formatDate(item.submitted_at) }}
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-4 shrink-0">
                    <div class="text-right">
                        <p class="text-sm font-semibold" style="color: #1B2231">{{ item.score }} <span class="font-normal" style="color: #7C8598">over</span> {{ item.total }} <span class="font-normal" style="color: #7C8598">items</span></p>
                        <p class="text-xs font-medium" :style="item.percentage >= 50 ? 'color: #2F7A54' : 'color: #AA3C36'">{{ item.percentage }}%</p>
                    </div>
                    <Link :href="item.resultUrl" class="btn-secondary">
                        <Eye class="h-4 w-4" :stroke-width="2" />
                        View
                    </Link>
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ClipboardCheck, CalendarDays, Eye, FileQuestion, FileText, ClipboardList, FlaskConical } from '@lucide/vue';
import { h } from 'vue';

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
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>