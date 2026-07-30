<template>
    <Head :title="attempt.seatwork.title + ' — Results'" />

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
                    style="background: linear-gradient(135deg, #10B981, var(--gl-secondary));">
                    <ClipboardList class="h-5 w-5 text-white" :stroke-width="2" />
                </div>
                <div>
                    <h2 class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ attempt.seatwork.title }}</h2>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Seatwork Results</p>
                </div>
            </div>
        </div>
        <Link href="/student/results" class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            Back to results
        </Link>
    </div>

    <div class="gl-glow-card mb-6 p-6">
        <div class="flex flex-wrap items-center justify-between gap-6">
            <div class="flex items-center gap-5">
                <div class="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold"
                    :style="{ background: scoreColor.bg, color: scoreColor.fg }">
                    {{ percentage }}%
                </div>
                <div>
                    <p class="text-base font-semibold" style="color: var(--gl-text-primary)">Your Score</p>
                    <p class="text-sm mt-1" style="color: var(--gl-text-secondary)">{{ attempt.score }}/{{ attempt.total_points }} points</p>
                    <p class="text-xs mt-1" style="color: var(--gl-text-muted)">Submitted {{ formatDate(attempt.submitted_at) }}</p>
                </div>
            </div>
            <div class="flex items-center gap-6">
                <div class="text-center">
                    <p class="text-2xl font-bold" style="color: var(--gl-success)">{{ correctCount }}</p>
                    <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Correct</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold" style="color: var(--gl-danger)">{{ incorrectCount }}</p>
                    <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Incorrect</p>
                </div>
            </div>
        </div>
    </div>

    <div v-for="(q, qi) in questionsWithAnswers" :key="q.id" class="gl-glow-card mb-4 overflow-hidden p-0">
        <div class="flex items-center gap-2 px-5 py-3 text-sm font-medium"
            style="border-bottom: 1px solid var(--gl-border);">
            <div v-if="q.studentAnswer?.is_correct" class="flex h-6 w-6 items-center justify-center rounded-full"
                style="background: var(--gl-success-bg);">
                <Check class="h-3.5 w-3.5" :stroke-width="2.5" style="color: var(--gl-success)" />
            </div>
            <div v-else-if="q.studentAnswer && !q.studentAnswer.is_correct" class="flex h-6 w-6 items-center justify-center rounded-full"
                style="background: var(--gl-danger-bg);">
                <X class="h-3.5 w-3.5" :stroke-width="2.5" style="color: var(--gl-danger)" />
            </div>
            <div v-else class="flex h-6 w-6 items-center justify-center rounded-full"
                style="background: var(--gl-surface-2);">
                <Minus class="h-3.5 w-3.5" :stroke-width="2.5" style="color: var(--gl-text-muted)" />
            </div>
            <span style="color: var(--gl-text-primary)">Question {{ qi + 1 }}</span>
            <span class="ml-auto text-xs" style="color: var(--gl-text-muted)">{{ q.points }} pt{{ q.points !== 1 ? 's' : '' }}</span>
        </div>
        <div class="px-5 py-4">
            <p class="mb-3 text-sm" style="color: var(--gl-text-primary)">{{ q.question_text }}</p>

            <template v-if="q.type === 'multiple_choice' || q.type === 'true_false'">
                <div class="space-y-2">
                    <div v-for="opt in q.options" :key="opt.id" class="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors" :class="optionStyle(opt, q)">
                        <div v-if="opt.is_correct" class="flex h-5 w-5 items-center justify-center rounded-full" style="background: var(--gl-success-bg);">
                            <Check class="h-3.5 w-3.5" :stroke-width="2.5" style="color: var(--gl-success)" />
                        </div>
                        <div v-else-if="isSelected(opt, q)" class="flex h-5 w-5 items-center justify-center rounded-full" style="background: var(--gl-danger-bg);">
                            <X class="h-3.5 w-3.5" :stroke-width="2.5" style="color: var(--gl-danger)" />
                        </div>
                        <div v-else class="h-5 w-5 shrink-0 rounded-full" style="border: 2px solid var(--gl-border);"></div>
                        <span :class="opt.is_correct ? 'font-medium' : ''" style="color: var(--gl-text-primary)">{{ opt.option_text }}</span>
                        <span v-if="opt.is_correct" class="ml-auto text-xs font-medium" style="color: var(--gl-success)">Correct answer</span>
                        <span v-else-if="isSelected(opt, q)" class="ml-auto text-xs font-medium" style="color: var(--gl-danger)">Your answer</span>
                    </div>
                </div>
            </template>

            <template v-if="q.type === 'identification'">
                <div class="text-sm rounded-xl p-3" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                    <p style="color: var(--gl-text-secondary)">Your answer:
                        <span class="font-medium" :style="{ color: q.studentAnswer?.is_correct ? 'var(--gl-success)' : 'var(--gl-danger)' }">{{ q.studentAnswer?.answer_text ?? '—' }}</span>
                    </p>
                </div>
            </template>

            <template v-if="q.type === 'enumeration'">
                <div class="text-sm rounded-xl p-3" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                    <p style="color: var(--gl-text-secondary)">Your answer: <span class="font-medium" style="color: var(--gl-text-primary)">{{ q.studentAnswer?.answer_text?.replace(/\n/g, ', ') ?? '—' }}</span></p>
                    <p class="text-xs italic mt-1" style="color: var(--gl-text-muted)">Enumeration is manually graded by the teacher.</p>
                </div>
            </template>

            <template v-if="q.type === 'matching'">
                <div class="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="mb-1 text-xs font-medium" style="color: var(--gl-text-muted)">Items</p>
                        <div v-for="pair in q.matching_pairs" :key="pair.id" class="mb-1 rounded-lg px-3 py-2" style="background: var(--gl-surface-2); color: var(--gl-text-primary)">{{ pair.left_text }}</div>
                    </div>
                    <div>
                        <p class="mb-1 text-xs font-medium" style="color: var(--gl-text-muted)">Your matches</p>
                        <div v-for="pair in q.matching_pairs" :key="pair.id" class="mb-1 flex items-center gap-2 px-3 py-2 rounded-lg"
                            :style="{ background: getMatchCorrect(q, pair) ? 'var(--gl-success-bg)' : 'var(--gl-danger-bg)' }">
                            <Check v-if="getMatchCorrect(q, pair)" class="h-3.5 w-3.5 shrink-0" style="color: var(--gl-success)" :stroke-width="2" />
                            <X v-else class="h-3.5 w-3.5 shrink-0" style="color: var(--gl-danger)" :stroke-width="2" />
                            <span class="text-xs" style="color: var(--gl-text-primary)">{{ getMatchAnswer(q, pair) || '—' }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ArrowLeft, Check, X, Minus, ClipboardList } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{ attempt: any }>();

const page = usePage();
const flash = page.props.flash as any;

const questionsWithAnswers = computed(() => {
    return props.attempt.seatwork.questions.map((q: any) => {
        const answer = props.attempt.answers.find((a: any) => a.question_id === q.id);
        return { ...q, studentAnswer: answer || null };
    });
});

const correctCount = computed(() => questionsWithAnswers.value.filter((q: any) => q.studentAnswer?.is_correct).length);
const incorrectCount = computed(() => questionsWithAnswers.value.filter((q: any) => q.studentAnswer && !q.studentAnswer.is_correct).length);

const percentage = computed(() => {
    if (!props.attempt.total_points) return 0;
    return Math.round((props.attempt.score / props.attempt.total_points) * 100);
});

const scoreColor = computed(() => {
    if (percentage.value >= 80) return { bg: 'var(--gl-success-bg)', fg: 'var(--gl-success)' };
    if (percentage.value >= 60) return { bg: 'var(--gl-warning-bg)', fg: 'var(--gl-accent)' };
    return { bg: 'var(--gl-danger-bg)', fg: 'var(--gl-danger)' };
});

function isSelected(option: any, question: any): boolean {
    return question.studentAnswer?.selected_option_id === option.id;
}

function optionStyle(option: any, question: any): Record<string, boolean> {
    const selected = isSelected(option, question);
    return {
        'border-[var(--gl-success)] bg-[var(--gl-success-bg)]': option.is_correct,
        'border-[var(--gl-danger)] bg-[var(--gl-danger-bg)]': !option.is_correct && selected,
        'border-[var(--gl-border)]': !option.is_correct && !selected,
    };
}

function getMatchAnswer(question: any, pair: any): string | null {
    return question.studentAnswer?.matching_answers?.[pair.id] ?? null;
}

function getMatchCorrect(question: any, pair: any): boolean {
    return getMatchAnswer(question, pair) === pair.right_text;
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
