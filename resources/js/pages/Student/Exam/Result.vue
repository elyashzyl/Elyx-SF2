<template>
    <Head :title="'Result - ' + attempt.exam.title" />

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
                    style="background: linear-gradient(135deg, var(--gl-secondary), var(--gl-primary));">
                    <FileText class="h-5 w-5 text-white" :stroke-width="2" />
                </div>
                <div>
                    <h2 class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ attempt.exam.title }}</h2>
                    <p class="text-sm" style="color: var(--gl-text-secondary)">Exam Results</p>
                </div>
            </div>
            <p v-if="attempt.exam.instructions" class="mt-2 text-sm" style="color: var(--gl-text-muted)">{{ attempt.exam.instructions }}</p>
        </div>
        <Link href="/student/results" class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            Back to results
        </Link>
    </div>

    <div v-for="(sec, si) in attempt.exam.sections" :key="sec.id" class="gl-glow-card mb-6 overflow-hidden p-0">
        <div class="px-5 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-2">
                <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">{{ sec.title }}</h3>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                    style="background: rgba(124,58,237,0.12); color: var(--gl-secondary);">{{ sec.section_type }}</span>
            </div>
        </div>

        <template v-if="sec.section_type === 'questions' && sec.questions.length">
            <div v-for="(q, qi) in sec.questions" :key="q.id" class="px-5 py-4 border-b" style="border-color: var(--gl-border);">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                        <p class="text-sm font-medium" style="color: var(--gl-text-primary)">
                            {{ qi + 1 }}. {{ q.question_text }}
                            <span class="text-xs font-normal" style="color: var(--gl-text-muted)">({{ q.points }} pt{{ q.points > 1 ? 's' : '' }})</span>
                        </p>

                        <template v-if="q.type === 'multiple_choice' || q.type === 'true_false'">
                            <div class="mt-2 space-y-1">
                                <div v-for="opt in q.options" :key="opt.id" class="flex items-center gap-1.5 text-sm"
                                    :style="{ color: opt.is_correct ? 'var(--gl-success)' : (isSelected(attempt, q.id, opt.id) && !opt.is_correct ? 'var(--gl-danger)' : 'var(--gl-text-secondary)') }">
                                    <CheckCircle v-if="opt.is_correct" class="h-3.5 w-3.5 shrink-0" :stroke-width="2" />
                                    <XCircle v-else-if="isSelected(attempt, q.id, opt.id)" class="h-3.5 w-3.5 shrink-0" :stroke-width="2" />
                                    <span v-else class="inline-block h-3.5 w-3.5 shrink-0 rounded-full" style="border: 1px solid var(--gl-border);"></span>
                                    {{ opt.option_text }}
                                </div>
                            </div>
                        </template>

                        <template v-if="q.type === 'identification'">
                            <div class="mt-2 text-sm rounded-xl p-3" style="background: var(--gl-surface-2);">
                                <p style="color: var(--gl-text-secondary)">Your answer:
                                    <span class="font-medium" :style="{ color: getAnswer(attempt, q.id)?.is_correct ? 'var(--gl-success)' : 'var(--gl-danger)' }">{{ getAnswer(attempt, q.id)?.answer_text ?? '—' }}</span>
                                </p>
                            </div>
                        </template>

                        <template v-if="q.type === 'enumeration'">
                            <div class="mt-2 text-sm rounded-xl p-3" style="background: var(--gl-surface-2);">
                                <p style="color: var(--gl-text-secondary)">Your answer: <span class="font-medium" style="color: var(--gl-text-primary)">{{ getAnswer(attempt, q.id)?.answer_text ?? '—' }}</span></p>
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
                                        :style="{ background: (getAnswer(attempt, q.id)?.matching_answers?.[pair.id] === pair.right_text) ? 'var(--gl-success-bg)' : 'var(--gl-danger-bg)' }">
                                        <CheckCircle v-if="getAnswer(attempt, q.id)?.matching_answers?.[pair.id] === pair.right_text" class="h-3.5 w-3.5 shrink-0" style="color: var(--gl-success)" :stroke-width="2" />
                                        <XCircle v-else class="h-3.5 w-3.5 shrink-0" style="color: var(--gl-danger)" :stroke-width="2" />
                                        <span class="text-xs" style="color: var(--gl-text-primary)">{{ getAnswer(attempt, q.id)?.matching_answers?.[pair.id] ?? '—' }}</span>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    <div class="shrink-0 text-center">
                        <div class="rounded-xl px-4 py-2"
                            :style="{ background: getAnswer(attempt, q.id)?.is_correct ? 'var(--gl-success-bg)' : 'var(--gl-danger-bg)' }">
                            <p class="text-xs font-semibold" :style="{ color: getAnswer(attempt, q.id)?.is_correct ? 'var(--gl-success)' : 'var(--gl-danger)' }">
                                {{ getAnswer(attempt, q.id)?.is_correct ? '+' + q.points : '0' }}
                            </p>
                            <p class="text-xs" style="color: var(--gl-text-muted)">/ {{ q.points }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template v-if="sec.section_type === 'practical' && sec.criteria.length">
            <div class="p-5">
                <div class="grid grid-cols-1 gap-3">
                    <div v-for="c in sec.criteria" :key="c.id"
                        class="rounded-xl p-4" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ c.criterion_name }}</p>
                                <p v-if="getSectionComment(attempt, c.id)" class="text-xs italic mt-0.5" style="color: var(--gl-text-secondary)">{{ getSectionComment(attempt, c.id) }}</p>
                            </div>
                            <span class="shrink-0 rounded-full px-3 py-1 text-sm font-semibold"
                                :style="{ background: getSectionScore(attempt, c.id) > 0 ? 'var(--gl-success-bg)' : 'var(--gl-danger-bg)', color: getSectionScore(attempt, c.id) > 0 ? 'var(--gl-success)' : 'var(--gl-danger)' }">
                                {{ getSectionScore(attempt, c.id) }} / {{ c.max_points }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { ArrowLeft, CheckCircle, XCircle, FileText } from '@lucide/vue';

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
