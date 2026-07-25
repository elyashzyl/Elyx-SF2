<template>
    <Head :title="attempt.seatwork.title + ' — Results'" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <div class="flex items-center gap-2.5">
                <h2 class="text-lg font-semibold" style="color: #1B2231">{{ attempt.seatwork.title }}</h2>
                <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs" style="color: #5A6376">Seatwork</span>
            </div>
        </div>
        <Link href="/student/dashboard" class="btn-secondary">
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            Back to dashboard
        </Link>
    </div>

    <div class="card mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold"
                :style="{ backgroundColor: scoreColor.bg, color: scoreColor.text }">
                {{ percentage }}%
            </div>
            <div>
                <p class="text-sm font-semibold" style="color: #1B2231">Your score</p>
                <p class="text-sm" style="color: #5A6376">{{ attempt.score }}/{{ attempt.total_points }} points</p>
                <p class="text-xs" style="color: #7C8598">Submitted {{ formatDate(attempt.submitted_at) }}</p>
            </div>
        </div>
        <div class="flex items-center gap-4 text-sm">
            <div class="text-center">
                <p class="text-lg font-semibold" style="color: #2F7A54">{{ correctCount }}</p>
                <p style="color: #5A6376">Correct</p>
            </div>
            <div class="text-center">
                <p class="text-lg font-semibold" style="color: #AA3C36">{{ incorrectCount }}</p>
                <p style="color: #5A6376">Incorrect</p>
            </div>
        </div>
    </div>

    <div v-for="(q, qi) in questionsWithAnswers" :key="q.id" class="card mb-4 overflow-hidden p-0">
        <div class="flex items-center gap-2 border-b border-[#E9EBEF] px-5 py-3 text-sm font-medium" style="color: #1B2231">
            <div v-if="q.studentAnswer?.is_correct" class="rounded-full p-1" style="background-color: #DCEEE3">
                <Check class="h-4 w-4" :stroke-width="2.5" style="color: #2F7A54" />
            </div>
            <div v-else-if="q.studentAnswer && !q.studentAnswer.is_correct" class="rounded-full p-1" style="background-color: #F6DEDD">
                <X class="h-4 w-4" :stroke-width="2.5" style="color: #AA3C36" />
            </div>
            <div v-else class="rounded-full p-1" style="background-color: #E9EBEF">
                <Minus class="h-4 w-4" :stroke-width="2.5" style="color: #7C8598" />
            </div>
            <span>Question {{ qi + 1 }}</span>
            <span class="ml-auto text-xs font-normal" style="color: #7C8598">{{ q.points }} pt{{ q.points !== 1 ? 's' : '' }}</span>
        </div>
        <div class="px-5 py-4">
            <p class="mb-3 text-sm" style="color: #1B2231">{{ q.question_text }}</p>

            <template v-if="q.type === 'multiple_choice' || q.type === 'true_false'">
                <div class="space-y-2">
                    <div v-for="opt in q.options" :key="opt.id" class="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm" :class="optionStyle(opt, q)">
                        <div v-if="opt.is_correct" class="rounded-full p-0.5" style="background-color: #DCEEE3">
                            <Check class="h-4 w-4" :stroke-width="2.5" style="color: #2F7A54" />
                        </div>
                        <div v-else-if="isSelected(opt, q)" class="rounded-full p-0.5" style="background-color: #F6DEDD">
                            <X class="h-4 w-4" :stroke-width="2.5" style="color: #AA3C36" />
                        </div>
                        <div v-else class="h-5 w-5 shrink-0 rounded-full border-2" style="border-color: #D2D6DE"></div>
                        <span :class="opt.is_correct ? 'font-medium' : ''">{{ opt.option_text }}</span>
                        <span v-if="opt.is_correct" class="ml-auto text-xs font-medium" style="color: #2F7A54">Correct answer</span>
                        <span v-else-if="isSelected(opt, q)" class="ml-auto text-xs font-medium" style="color: #AA3C36">Your answer</span>
                    </div>
                </div>
            </template>

            <template v-if="q.type === 'identification'">
                <div class="text-sm space-y-1">
                    <p style="color: #5A6376">Your answer: <span class="font-medium" :style="{ color: q.studentAnswer?.is_correct ? '#2F7A54' : '#AA3C36' }">{{ q.studentAnswer?.answer_text ?? '—' }}</span></p>
                </div>
            </template>

            <template v-if="q.type === 'enumeration'">
                <div class="text-sm space-y-1">
                    <p style="color: #5A6376">Your answer: <span class="font-medium">{{ q.studentAnswer?.answer_text?.replace(/\n/g, ', ') ?? '—' }}</span></p>
                    <p class="text-xs italic" style="color: #7C8598">Enumeration is manually graded by the teacher.</p>
                </div>
            </template>

            <template v-if="q.type === 'matching'">
                <div class="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p class="mb-1 text-xs font-medium" style="color: #5A6376">Items</p>
                        <div v-for="pair in q.matching_pairs" :key="pair.id" class="mb-1 rounded bg-[#F9FAFB] px-3 py-2" style="color: #1B2231">{{ pair.left_text }}</div>
                    </div>
                    <div>
                        <p class="mb-1 text-xs font-medium" style="color: #5A6376">Your matches</p>
                        <div v-for="pair in q.matching_pairs" :key="pair.id" class="mb-1 flex items-center gap-2 px-3 py-2 rounded"
                            :style="{ backgroundColor: getMatchCorrect(q, pair) ? '#DCEEE3' : '#F6DEDD' }">
                            <Check v-if="getMatchCorrect(q, pair)" class="h-3.5 w-3.5 shrink-0" style="color: #2F7A54" :stroke-width="2" />
                            <X v-else class="h-3.5 w-3.5 shrink-0" style="color: #AA3C36" :stroke-width="2" />
                            <span class="text-xs">{{ getMatchAnswer(q, pair) || '—' }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ArrowLeft, Check, X, Minus } from '@lucide/vue';
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
    if (percentage.value >= 80) return { bg: '#DCEEE3', text: '#2F7A54' };
    if (percentage.value >= 60) return { bg: '#FFF3D6', text: '#A5701A' };
    return { bg: '#F6DEDD', text: '#AA3C36' };
});

function isSelected(option: any, question: any): boolean {
    return question.studentAnswer?.selected_option_id === option.id;
}

function optionStyle(option: any, question: any): Record<string, boolean> {
    const selected = isSelected(option, question);
    return {
        'border-[#2F7A54] bg-[#DCEEE3]': option.is_correct,
        'border-[#AA3C36] bg-[#F6DEDD]': !option.is_correct && selected,
        'border-[#D2D6DE]': !option.is_correct && !selected,
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
