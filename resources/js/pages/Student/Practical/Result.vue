<template>
    <Head :title="attempt.practical.title + ' — Results'" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background: var(--gl-bg); overflow-y: auto;">
        <div class="px-6 py-6" style="max-width: 80rem;">

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <div class="flex items-center gap-3 mb-1">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl"
                    style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary));">
                    <FlaskConical class="h-5 w-5 text-white" :stroke-width="2" />
                </div>
                <div>
                    <h2 class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ attempt.practical.title }}</h2>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Practical Results</p>
                </div>
            </div>
        </div>
        <Link href="/student/results" class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            Back to results
        </Link>
    </div>

    <!-- Submission -->
    <div v-if="attempt.submission_text || attempt.submission_file" class="gl-glow-card mb-6 overflow-hidden p-0">
        <div class="px-5 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                    style="background: linear-gradient(135deg, var(--gl-primary), #2563EB);">
                    <Terminal class="h-4.5 w-4.5 text-white" :stroke-width="2" />
                </div>
                <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Your Submission</h3>
            </div>
        </div>
        <div v-if="attempt.submission_text" class="p-5">
            <div class="rounded-xl overflow-hidden" style="border: 1px solid var(--gl-border);">
                <div class="flex items-center gap-1.5 px-4 py-2.5" style="background: var(--gl-surface-2); border-bottom: 1px solid var(--gl-border);">
                    <span class="h-3 w-3 rounded-full" style="background: #EF4444;"></span>
                    <span class="h-3 w-3 rounded-full" style="background: #FBBF24;"></span>
                    <span class="h-3 w-3 rounded-full" style="background: #10B981;"></span>
                    <span class="ml-3 text-xs" style="color: var(--gl-text-muted);">submission.txt</span>
                </div>
                <pre class="p-4 text-sm font-mono whitespace-pre-wrap" style="background: #0d1117; color: #e6edf3; max-height: 400px; overflow-y: auto;">{{ attempt.submission_text }}</pre>
            </div>
        </div>
        <div v-if="attempt.submission_file" class="p-5">
            <img :src="attempt.submission_file_url" class="max-h-96 rounded-xl" style="border: 1px solid var(--gl-border);" />
        </div>
    </div>

    <!-- Score Card -->
    <div class="gl-glow-card mb-6 p-6">
        <div class="flex flex-wrap items-center justify-between gap-6">
            <div class="flex items-center gap-5">
                <div class="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold"
                    :style="{ background: scoreColor.bg, color: scoreColor.fg }">
                    {{ percentage }}%
                </div>
                <div>
                    <p class="text-base font-semibold" style="color: var(--gl-text-primary)">Your Score</p>
                    <p class="text-sm mt-1" style="color: var(--gl-text-secondary)">{{ attempt.total_score }} <span style="color: var(--gl-text-muted)">/ {{ totalMax }} points</span></p>
                    <p class="text-xs mt-1" style="color: var(--gl-text-muted)">Submitted {{ formatDate(attempt.submitted_at) }}</p>
                </div>
            </div>
            <div class="gl-xp-bar w-48">
                <div class="gl-xp-bar-fill" :style="{ width: percentage + '%' }"></div>
            </div>
        </div>
    </div>

    <!-- Rubric Criteria -->
    <div class="gl-glow-card p-5">
        <div class="flex items-center gap-3 mb-4">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                style="background: linear-gradient(135deg, var(--gl-accent), #F59E0B);">
                <Award class="h-4.5 w-4.5 text-white" :stroke-width="2" />
            </div>
            <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Scoring Criteria</h3>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div v-for="(c, ci) in attempt.practical.criteria" :key="c.id"
                class="rounded-xl p-4 transition-all"
                :style="{ background: getScore(c) > 0 ? 'var(--gl-surface-2)' : 'var(--gl-surface-2)', border: '1px solid var(--gl-border)' }">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3">
                        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            :style="{ background: getScore(c) > 0 ? 'var(--gl-success-bg)' : 'var(--gl-danger-bg)', color: getScore(c) > 0 ? 'var(--gl-success)' : 'var(--gl-danger)' }">
                            {{ ci + 1 }}
                        </div>
                        <div>
                            <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ c.criterion_name }}</p>
                            <p v-if="c.description" class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ c.description }}</p>
                            <p v-if="getComment(c)" class="text-xs italic mt-1" style="color: var(--gl-text-secondary)">{{ getComment(c) }}</p>
                        </div>
                    </div>
                    <span class="shrink-0 rounded-full px-3 py-1 text-sm font-semibold"
                        :style="{ background: getScore(c) > 0 ? 'var(--gl-success-bg)' : 'var(--gl-danger-bg)', color: getScore(c) > 0 ? 'var(--gl-success)' : 'var(--gl-danger)' }">
                        {{ getScore(c) }} / {{ c.max_points }}
                    </span>
                </div>
            </div>
        </div>
    </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ArrowLeft, FlaskConical, Terminal, Award } from '@lucide/vue';

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
    if (percentage.value >= 80) return { bg: 'var(--gl-success-bg)', fg: 'var(--gl-success)' };
    if (percentage.value >= 60) return { bg: 'var(--gl-warning-bg)', fg: 'var(--gl-accent)' };
    return { bg: 'var(--gl-danger-bg)', fg: 'var(--gl-danger)' };
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

<style scoped>
.h-4\.5 { height: 1.125rem; }
.w-4\.5 { width: 1.125rem; }
</style>
