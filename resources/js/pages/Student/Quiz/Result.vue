<template>
    <Head :title="`${attempt.quiz.title} — Results`" />

        <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
            {{ flash.success }}
        </div>

        <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
                <h2 class="text-lg font-semibold" style="color: #1B2231">{{ attempt.quiz.title }}</h2>
                <p class="text-sm" style="color: #5A6376">{{ attempt.quiz.grade }} — {{ attempt.quiz.section }}</p>
            </div>
            <button @click="window.history.back()" class="btn-secondary">
                <ArrowLeft class="h-4 w-4" :stroke-width="2" />
                Back
            </button>
        </div>

        <div class="card mb-6 flex flex-wrap items-center justify-between gap-4 p-6">
            <div class="flex items-center gap-4">
                <div class="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold"
                    :style="{ backgroundColor: scoreColor.bg, color: scoreColor.text }">
                    {{ percentage }}%
                </div>
                <div>
                    <p class="text-sm font-semibold" style="color: #1B2231">Your score</p>
                    <p class="text-sm" style="color: #5A6376">{{ attempt.score }}/{{ attempt.total_points }} correct</p>
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

        <div v-for="(question, index) in questionsWithAnswers" :key="question.id" class="card mb-4 overflow-hidden p-0">
            <div class="flex items-center gap-2 border-b border-[#E9EBEF] px-5 py-3 text-sm font-medium"
                style="color: #1B2231">
                <div v-if="question.studentAnswer?.is_correct" class="rounded-full p-1" style="background-color: #DCEEE3">
                    <Check class="h-4 w-4" :stroke-width="2.5" style="color: #2F7A54" />
                </div>
                <div v-else class="rounded-full p-1" style="background-color: #F6DEDD">
                    <X class="h-4 w-4" :stroke-width="2.5" style="color: #AA3C36" />
                </div>
                <span>Question {{ index + 1 }}</span>
                <span class="ml-auto text-xs font-normal" style="color: #7C8598">{{ question.points }} pt{{ question.points !== 1 ? 's' : '' }}</span>
            </div>
            <div class="px-5 py-4">
                <p class="mb-3 text-sm" style="color: #1B2231">{{ question.question_text }}</p>
                <div class="space-y-2">
                    <div v-for="option in question.options" :key="option.id"
                        class="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
                        :class="optionStyle(option, question)">
                        <div v-if="option.is_correct" class="rounded-full p-0.5" style="background-color: #DCEEE3">
                            <Check class="h-4 w-4" :stroke-width="2.5" style="color: #2F7A54" />
                        </div>
                        <div v-else-if="isSelected(option, question)" class="rounded-full p-0.5" style="background-color: #F6DEDD">
                            <X class="h-4 w-4" :stroke-width="2.5" style="color: #AA3C36" />
                        </div>
                        <div v-else class="h-5 w-5 shrink-0 rounded-full border-2" style="border-color: #D2D6DE"></div>
                        <span :class="option.is_correct ? 'font-medium' : ''">{{ option.option_text }}</span>
                        <span v-if="option.is_correct" class="ml-auto text-xs font-medium" style="color: #2F7A54">Correct answer</span>
                        <span v-else-if="isSelected(option, question)" class="ml-auto text-xs font-medium" style="color: #AA3C36">Your answer</span>
                    </div>
                </div>
            </div>
        </div>

</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ArrowLeft, Check, X } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
    attempt: any;
}>();

const page = usePage();
const flash = page.props.flash as any;

const questionsWithAnswers = computed(() => {
    return props.attempt.quiz.questions.map((q: any) => {
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
    return question.studentAnswer?.quiz_option_id === option.id;
}

function optionStyle(option: any, question: any): Record<string, boolean> {
    const selected = isSelected(option, question);
    return {
        'border-[#2F7A54] bg-[#DCEEE3]': option.is_correct,
        'border-[#AA3C36] bg-[#F6DEDD]': !option.is_correct && selected,
        'border-[#D2D6DE]': !option.is_correct && !selected,
    };
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>
