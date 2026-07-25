<template>
    <Head :title="attempt.practical.title + ' — Results'" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <div class="flex items-center gap-2.5">
                <h2 class="text-lg font-semibold" style="color: #1B2231">{{ attempt.practical.title }}</h2>
                <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs" style="color: #5A6376">Practical</span>
            </div>
        </div>
        <Link href="/student/dashboard" class="btn-secondary">
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            Back to dashboard
        </Link>
    </div>

    <div v-if="attempt.submission_text || attempt.submission_file" class="card mb-6">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Your submission</h3>
        <div v-if="attempt.submission_text" class="mb-4">
            <p class="mb-2 text-xs font-medium" style="color: #5A6376">Code / Text:</p>
            <pre class="rounded-lg border border-[#E9EBEF] bg-[#F9FAFB] p-4 text-sm font-mono whitespace-pre-wrap" style="color: #1B2231; max-height: 400px; overflow-y: auto;">{{ attempt.submission_text }}</pre>
        </div>
        <div v-if="attempt.submission_file">
            <p class="mb-2 text-xs font-medium" style="color: #5A6376">Uploaded image:</p>
            <img :src="'/storage/' + attempt.submission_file" class="max-h-96 rounded-lg border border-[#E9EBEF]" />
        </div>
    </div>

    <div class="card mb-6 p-6">
        <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold"
                :style="{ backgroundColor: scoreColor.bg, color: scoreColor.text }">
                {{ percentage }}%
            </div>
            <div>
                <p class="text-sm font-semibold" style="color: #1B2231">Your score</p>
                <p class="text-sm" style="color: #5A6376">{{ attempt.total_score }}/{{ totalMax }} points</p>
                <p class="text-xs" style="color: #7C8598">Submitted {{ formatDate(attempt.submitted_at) }}</p>
            </div>
        </div>
    </div>

    <div class="mb-6 card">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Rubric criteria</h3>
        <div v-for="(c, ci) in attempt.practical.criteria" :key="c.id" class="mb-3 rounded-lg border border-[#E9EBEF] p-4">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-medium" style="color: #1B2231">{{ ci + 1 }}. {{ c.criterion_name }}</p>
                        <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs" style="color: #5A6376">{{ c.max_points }} pts</span>
                    </div>
                    <p v-if="c.description" class="mt-0.5 text-xs" style="color: #5A6376">{{ c.description }}</p>
                </div>
                <div class="shrink-0 text-right ml-4">
                    <p class="text-lg font-semibold" :style="{ color: getScore(c) > 0 ? '#2F7A54' : '#AA3C36' }">{{ getScore(c) }} <span class="text-sm font-normal" style="color: #7C8598">/ {{ c.max_points }}</span></p>
                    <p v-if="getComment(c)" class="text-xs italic" style="color: #5A6376">{{ getComment(c) }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ArrowLeft } from '@lucide/vue';

const props = defineProps<{ attempt: any }>();

const page = usePage();
const flash = page.props.flash as any;

const totalMax = computed(() => {
    return props.attempt.practical.criteria.reduce((s: number, c: any) => s + c.max_points, 0);
});

const percentage = computed(() => {
    if (!totalMax.value) return 0;
    return Math.round((props.attempt.total_score / totalMax.value) * 100);
});

const scoreColor = computed(() => {
    if (percentage.value >= 80) return { bg: '#DCEEE3', text: '#2F7A54' };
    if (percentage.value >= 60) return { bg: '#FFF3D6', text: '#A5701A' };
    return { bg: '#F6DEDD', text: '#AA3C36' };
});

function getScore(criterion: any): number {
    return props.attempt.scores?.find((s: any) => s.criterion_id === criterion.id)?.score ?? 0;
}

function getComment(criterion: any): string | null {
    return props.attempt.scores?.find((s: any) => s.criterion_id === criterion.id)?.comment ?? null;
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
