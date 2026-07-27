<template>
    <Head :title="`Recheck: ${attempt.student.name}`" />

        <Link :href="`/teacher/quizzes/${quiz.id}`" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            Back to quiz
        </Link>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <h2 class="text-lg font-semibold" style="color: #1B2231">Recheck: {{ quiz.title }}</h2>
            <p class="mt-1 text-sm" style="color: #5A6376">Student: <span class="font-medium" style="color: #1B2231">{{ attempt.student.name }}</span> &middot; {{ attempt.student.grade }}</p>
        </div>
        <div class="flex items-center gap-3 text-sm">
            <span class="font-medium" style="color: #1B2231">Score: <span :style="{ color: scoreColor }">{{ computedScore }}</span> / {{ totalPoints }}</span>
            <span class="rounded-full px-3 py-1 text-xs font-medium" :style="{ backgroundColor: scoreBg, color: scoreColor }">{{ Math.round(computedScore / totalPoints * 100) || 0 }}%</span>
        </div>
    </div>

    <form @submit.prevent="save">
        <div v-for="(q, idx) in questions" :key="q.id" class="card mb-4 overflow-hidden p-0">
            <div class="flex items-center gap-2 border-b border-[#E9EBEF] px-5 py-3 text-sm font-medium" style="color: #1B2231">
                Question {{ idx + 1 }}
                <span class="ml-auto text-xs font-normal" style="color: #7C8598">{{ q.points }} pt{{ q.points !== 1 ? 's' : '' }}</span>
            </div>
            <div class="px-5 py-4">
                <p class="mb-3 text-sm" style="color: #1B2231">{{ q.question_text }}</p>
                <div class="space-y-2">
                    <div v-for="opt in q.options" :key="opt.id"
                        class="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
                        :class="optionClass(opt, q)">
                        <Check v-if="opt.is_correct" class="h-4 w-4 shrink-0" :stroke-width="2.5" style="color: #2F7A54" />
                        <X v-else-if="isSelected(opt, q)" class="h-4 w-4 shrink-0" :stroke-width="2.5" style="color: #AA3C36" />
                        <div v-else class="h-4 w-4 shrink-0 rounded-full border-2" style="border-color: #D2D6DE"></div>
                        <span :class="opt.is_correct ? 'font-medium' : ''">{{ opt.option_text }}</span>
                        <span v-if="opt.is_correct" class="ml-auto text-xs font-medium" style="color: #2F7A54">Correct answer</span>
                        <span v-else-if="isSelected(opt, q)" class="ml-auto text-xs font-medium" style="color: #AA3C36">Student's answer</span>
                    </div>
                </div>
                <div class="mt-3 flex items-center gap-2 border-t border-[#E9EBEF] pt-3">
                    <label class="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" :checked="answerMap[q.id]?.is_correct" @change="toggleCorrect(q.id)" class="h-4 w-4 rounded border-[#D2D6DE] text-[#1D3557] focus:ring-[#1D3557]" />
                        <span :class="answerMap[q.id]?.is_correct ? 'font-medium text-[#2F7A54]' : 'text-[#AA3C36]'">
                            {{ answerMap[q.id]?.is_correct ? 'Marked correct' : 'Marked incorrect' }}
                        </span>
                    </label>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <button type="submit" class="btn-primary" :disabled="saving">
                <LoaderCircle v-if="saving" class="h-4 w-4 animate-spin" :stroke-width="2" />
                {{ saving ? 'Saving...' : 'Save recheck' }}
            </button>
            <button type="button" class="btn-secondary" @click="autoRecheck" :disabled="saving">
                <RotateCw class="h-4 w-4" :stroke-width="2" />
                Auto recheck
            </button>
            <Link :href="`/teacher/quizzes/${quiz.id}`" class="btn-secondary">Cancel</Link>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { ArrowLeft, Check, RotateCw, X, LoaderCircle } from '@lucide/vue';
import { computed, ref } from 'vue';

const props = defineProps<{ quiz: any; attempt: any }>();

const totalPoints = computed(() => props.quiz.questions.reduce((s: number, q: any) => s + q.points, 0));
const saving = ref(false);

interface AnswerDatum { id: number; is_correct: boolean }
const answerData = ref<AnswerDatum[]>(
    props.attempt.answers.map((a: any) => ({ id: a.id, is_correct: a.is_correct }))
);

const answerMap = computed(() => {
    const map: Record<number, any> = {};
    props.attempt.answers.forEach((a: any) => { map[a.question_id] = a; });
    return map;
});

const questions = computed(() => {
    return props.quiz.questions.map((q: any) => {
        const answer = answerMap.value[q.id];
        return { ...q, studentAnswer: answer || null };
    });
});

const computedScore = computed(() => {
    let s = 0;
    props.quiz.questions.forEach((q: any) => {
        const entry = answerData.value.find((d: AnswerDatum) => {
            const ans = props.attempt.answers.find((a: any) => a.question_id === q.id);
            return ans && d.id === ans.id;
        });
        if (entry?.is_correct) s += q.points;
    });
    return s;
});

const scoreColor = computed(() => {
    const pct = totalPoints.value ? (computedScore.value / totalPoints.value) * 100 : 0;
    if (pct >= 80) return '#2F7A54';
    if (pct >= 60) return '#A5701A';
    return '#AA3C36';
});

const scoreBg = computed(() => {
    const pct = totalPoints.value ? (computedScore.value / totalPoints.value) * 100 : 0;
    if (pct >= 80) return '#DCEEE3';
    if (pct >= 60) return '#FFF3D6';
    return '#F6DEDD';
});

function isSelected(opt: any, question: any): boolean {
    return question.studentAnswer?.quiz_option_id === opt.id;
}

function optionClass(opt: any, question: any): Record<string, boolean> {
    const selected = isSelected(opt, question);
    return {
        'border-[#2F7A54] bg-[#DCEEE3]': opt.is_correct,
        'border-[#AA3C36] bg-[#F6DEDD]': !opt.is_correct && selected,
        'border-[#D2D6DE]': !opt.is_correct && !selected,
    };
}

function toggleCorrect(questionId: number) {
    const ans = props.attempt.answers.find((a: any) => a.question_id === questionId);
    if (!ans) return;
    const entry = answerData.value.find((d: AnswerDatum) => d.id === ans.id);
    if (entry) entry.is_correct = !entry.is_correct;
}

function autoRecheck() {
    answerData.value.forEach((d: AnswerDatum) => {
        const ans = props.attempt.answers.find((a: any) => a.id === d.id);
        if (!ans) return;
        const question = props.quiz.questions.find((q: any) => q.id === ans.question_id);
        if (!question) return;
        const correctOption = question.options.find((o: any) => o.is_correct);
        d.is_correct = correctOption ? ans.quiz_option_id === correctOption.id : false;
    });
}

function save() {
    saving.value = true;
    router.put(`/teacher/quizzes/${props.quiz.id}/recheck/${props.attempt.id}`, {
        answers: answerData.value,
    }, { preserveScroll: true, onFinish: () => { saving.value = false; } });
}
</script>
