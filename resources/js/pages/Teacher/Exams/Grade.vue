<template>
    <Head :title="'Grade - ' + exam.title" />
    <button @click="window.history.back()" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back
    </button>

    <h2 class="mb-6 text-lg font-semibold" style="color: #1B2231">Grade Practical Sections — {{ exam.title }}</h2>

    <div v-for="a in attempts" :key="a.id" class="mb-6 card">
        <div class="mb-4 flex items-center justify-between">
            <div>
                <h3 class="text-sm font-semibold" style="color: #1B2231">{{ a.student?.name }}</h3>
                <p class="text-xs" style="color: #5A6376">Grade {{ a.student?.grade ?? '—' }} · Total: {{ a.total_score ?? 0 }} / {{ exam.max_score }}</p>
            </div>
        </div>

        <template v-for="sec in practicalSections" :key="sec.id">
            <h4 class="mb-2 text-xs font-semibold uppercase tracking-wide" style="color: #5A6376">{{ sec.title }}</h4>
            <div v-for="c in sec.criteria" :key="c.id" class="mb-3 rounded-lg border border-[#E9EBEF] p-3">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                        <p class="text-sm font-medium" style="color: #1B2231">{{ c.criterion_name }}</p>
                        <p v-if="c.description" class="text-xs" style="color: #5A6376">{{ c.description }}</p>
                    </div>
                    <div class="w-64 shrink-0 space-y-1.5">
                        <div class="flex items-center gap-2">
                            <label class="text-xs shrink-0" style="color: #5A6376">Score (max {{ c.max_points }})</label>
                            <input type="number" :min="0" :max="c.max_points"
                                :value="getScore(a, c.id)"
                                @input="setScore(a.id, c.id, ($event.target as HTMLInputElement).value)"
                                class="w-20 rounded-lg border border-[#D2D6DE] px-2 py-1.5 text-xs outline-none" />
                        </div>
                        <div>
                            <label class="text-xs" style="color: #5A6376">Comment</label>
                            <input type="text"
                                :value="getComment(a, c.id)"
                                @input="setComment(a.id, c.id, ($event.target as HTMLInputElement).value)"
                                class="w-full rounded-lg border border-[#D2D6DE] px-2 py-1.5 text-xs outline-none" />
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <button @click="saveGrades(a)" class="btn-primary mt-2 text-xs" :disabled="saving">
            Save Grades
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { ArrowLeft } from '@lucide/vue';

const props = defineProps<{ exam: any; attempts: any[] }>();

const practicalSections = computed(() => props.exam.sections.filter((s: any) => s.section_type === 'practical'));

const grades = ref<Record<number, { scores: Record<number, number>; comments: Record<number, string> }>>({});

function getScore(attempt: any, criterionId: number): number {
    const g = grades.value[attempt.id];
    if (g?.scores[criterionId] !== undefined) return g.scores[criterionId];
    const existing = attempt.section_scores?.find((s: any) => s.exam_criterion_id === criterionId);
    return existing?.score ?? 0;
}

function setScore(attemptId: number, criterionId: number, value: string) {
    if (!grades.value[attemptId]) grades.value[attemptId] = { scores: {}, comments: {} };
    grades.value[attemptId].scores[criterionId] = parseInt(value) || 0;
}

function getComment(attempt: any, criterionId: number): string {
    const g = grades.value[attempt.id];
    if (g?.comments[criterionId] !== undefined) return g.comments[criterionId];
    const existing = attempt.section_scores?.find((s: any) => s.exam_criterion_id === criterionId);
    return existing?.comment ?? '';
}

function setComment(attemptId: number, criterionId: number, value: string) {
    if (!grades.value[attemptId]) grades.value[attemptId] = { scores: {}, comments: {} };
    grades.value[attemptId].comments[criterionId] = value;
}

const saving = ref(false);

function saveGrades(attempt: any) {
    const g = grades.value[attempt.id];
    if (!g) return;

    saving.value = true;
    router.post(`/teacher/exams/attempts/${attempt.id}/grade`, {
        scores: g.scores,
        comments: g.comments,
    }, {
        preserveScroll: true,
        onFinish: () => { saving.value = false; },
    });
}
</script>
