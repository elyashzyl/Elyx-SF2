<template>
    <Head :title="'Result - ' + attempt.exam.title" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <div class="flex items-center gap-2.5">
                <h2 class="text-lg font-semibold" style="color: #1B2231">{{ attempt.exam.title }}</h2>
                <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs" style="color: #5A6376">Result</span>
            </div>
            <p v-if="attempt.exam.instructions" class="mt-2 text-sm" style="color: #5A6376">{{ attempt.exam.instructions }}</p>
        </div>
        <div class="rounded-lg border border-[#D2D6DE] px-6 py-3 text-center">
            <p class="text-xs" style="color: #5A6376">Total Score</p>
            <p :style="{ color: '#1B2231' }" class="text-2xl font-bold">{{ attempt.total_score ?? '—' }} <span class="text-sm font-normal" style="color: #7C8598">/ {{ attempt.exam.max_score }}</span></p>
        </div>
    </div>

    <div v-for="(sec, si) in attempt.exam.sections" :key="sec.id" class="mb-6 card">
        <div class="mb-3 flex items-center gap-2">
            <h3 class="text-sm font-semibold" style="color: #1B2231">{{ sec.title }}</h3>
            <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs capitalize" style="color: #5A6376">{{ sec.section_type }}</span>
        </div>

        <template v-if="sec.section_type === 'questions' && sec.questions.length">
            <div v-for="(q, qi) in sec.questions" :key="q.id" class="mb-3 rounded-lg border border-[#E9EBEF] p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                        <p class="text-sm font-medium" style="color: #1B2231">
                            {{ qi + 1 }}. {{ q.question_text }}
                            <span class="text-xs font-normal" style="color: #7C8598">({{ q.points }} pt{{ q.points > 1 ? 's' : '' }})</span>
                        </p>

                        <template v-if="q.type === 'multiple_choice' || q.type === 'true_false'">
                            <div class="mt-2 space-y-1">
                                <div v-for="opt in q.options" :key="opt.id" class="flex items-center gap-1.5 text-sm" :style="{ color: opt.is_correct ? '#2F7A54' : (isSelected(attempt, q.id, opt.id) && !opt.is_correct ? '#AA3C36' : '#5A6376') }">
                                    <CheckCircle v-if="opt.is_correct" class="h-3.5 w-3.5 shrink-0" :stroke-width="2" />
                                    <XCircle v-else-if="isSelected(attempt, q.id, opt.id)" class="h-3.5 w-3.5 shrink-0" :stroke-width="2" />
                                    <span v-else class="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-[#D2D6DE]"></span>
                                    {{ opt.option_text }}
                                </div>
                            </div>
                        </template>

                        <template v-if="q.type === 'identification'">
                            <div class="mt-2 space-y-1 text-sm">
                                <p style="color: #5A6376">Your answer: <span class="font-medium" :style="{ color: getAnswer(attempt, q.id)?.is_correct ? '#2F7A54' : '#AA3C36' }">{{ getAnswer(attempt, q.id)?.answer_text ?? '—' }}</span></p>
                            </div>
                        </template>

                        <template v-if="q.type === 'enumeration'">
                            <div class="mt-2 space-y-1 text-sm">
                                <p style="color: #5A6376">Your answer: <span class="font-medium">{{ getAnswer(attempt, q.id)?.answer_text ?? '—' }}</span></p>
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
                                        :style="{ backgroundColor: (getAnswer(attempt, q.id)?.matching_answers?.[pair.id] === pair.right_text) ? '#DCEEE3' : '#F6DEDD' }">
                                        <CheckCircle v-if="getAnswer(attempt, q.id)?.matching_answers?.[pair.id] === pair.right_text" class="h-3.5 w-3.5 shrink-0" style="color: #2F7A54" :stroke-width="2" />
                                        <XCircle v-else class="h-3.5 w-3.5 shrink-0" style="color: #AA3C36" :stroke-width="2" />
                                        <span class="text-xs">{{ getAnswer(attempt, q.id)?.matching_answers?.[pair.id] ?? '—' }}</span>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>

                    <div class="shrink-0 text-center">
                        <div class="rounded-lg px-4 py-2" :style="{ backgroundColor: getAnswer(attempt, q.id)?.is_correct ? '#DCEEE3' : '#F6DEDD' }">
                            <p class="text-xs" :style="{ color: getAnswer(attempt, q.id)?.is_correct ? '#2F7A54' : '#AA3C36' }">
                                {{ getAnswer(attempt, q.id)?.is_correct ? '+' + q.points : '0' }}
                            </p>
                            <p class="text-xs" style="color: #7C8598">/ {{ q.points }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template v-if="sec.section_type === 'practical' && sec.criteria.length">
            <div class="rounded-lg border border-[#E9EBEF] p-4">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                            <th class="px-3 py-2 font-medium">Criterion</th>
                            <th class="px-3 py-2 font-medium">Score</th>
                            <th class="px-3 py-2 font-medium">Comment</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#E9EBEF]">
                        <tr v-for="c in sec.criteria" :key="c.id" class="hover:bg-[#F9FAFB]">
                            <td class="px-3 py-2" style="color: #1B2231">{{ c.criterion_name }}</td>
                            <td class="px-3 py-2">
                                <span class="font-medium" :style="{ color: getSectionScore(attempt, c.id) > 0 ? '#2F7A54' : '#AA3C36' }">
                                    {{ getSectionScore(attempt, c.id) }} / {{ c.max_points }}
                                </span>
                            </td>
                            <td class="px-3 py-2 text-xs" style="color: #5A6376">{{ getSectionComment(attempt, c.id) ?? '—' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { Head, usePage } from '@inertiajs/vue3';
import { CheckCircle, XCircle } from '@lucide/vue';

defineProps<{ attempt: any }>();

const page = usePage();
const flash = page.props.flash as any;

function getAnswer(attempt: any, questionId: number): any {
    return attempt.answers?.find((a: any) => a.exam_question_id === questionId);
}

function isSelected(attempt: any, questionId: number, optionId: number): boolean {
    return getAnswer(attempt, questionId)?.selected_option_id === optionId;
}

function getSectionScore(attempt: any, criterionId: number): number {
    return attempt.section_scores?.find((s: any) => s.exam_criterion_id === criterionId)?.score ?? 0;
}

function getSectionComment(attempt: any, criterionId: number): string | null {
    return attempt.section_scores?.find((s: any) => s.exam_criterion_id === criterionId)?.comment ?? null;
}
</script>
