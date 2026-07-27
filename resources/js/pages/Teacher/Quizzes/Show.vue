<template>
    <Head :title="quiz.title" />

        <button @click="window.history.back()" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            Back
        </button>

        <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
                <div class="flex items-center gap-2.5">
                    <h2 class="text-lg font-semibold" style="color: #1B2231">{{ quiz.title }}</h2>
                    <StatusBadge :status="quiz.is_published ? 'published' : 'draft'" />
                </div>
                <p class="mt-1 text-sm" style="color: #5A6376">
                    <template v-if="quiz.grade_levels">{{ quiz.grade_levels.map((g: any) => g.name).join(', ') }}</template>
                    —
                    <template v-if="quiz.sections">{{ quiz.sections.map((s: any) => s.name).join(', ') }}</template>
                    · {{ quiz.questions.length }} questions · {{ totalPoints }} points total
                </p>
                <p v-if="quiz.description" class="mt-2 max-w-2xl text-sm" style="color: #404A5C">{{ quiz.description }}</p>
            </div>
            <div class="flex items-center gap-2">
                <Link v-if="!quiz.is_published" :href="`/teacher/quizzes/${quiz.id}/edit`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Edit quiz">
                    <PenSquare class="h-4 w-4" :stroke-width="2" />
                </Link>
            </div>
        </div>

        <div v-if="teachers?.length" class="mb-6 card flex flex-wrap items-center gap-3 px-5 py-3">
            <span class="text-sm font-medium" style="color: #404A5C">Assigned to:</span>
            <select ref="reassignSelect" class="rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]">
                <option v-for="t in teachers" :key="t.id" :value="t.id" :selected="t.id === quiz.teacher_id">{{ t.name }}</option>
            </select>
            <button @click="reassign" class="btn-secondary text-xs">Reassign</button>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div class="space-y-4 lg:col-span-3">
                <h3 class="text-sm font-semibold" style="color: #1B2231">Questions</h3>
                <div v-for="(question, index) in quiz.questions" :key="question.id" class="card p-5">
                    <p class="text-sm font-medium" style="color: #1B2231">{{ index + 1 }}. {{ question.question_text }}</p>
                    <p class="mb-3 mt-0.5 text-xs" style="color: #7C8598">{{ question.points }} point{{ question.points === 1 ? '' : 's' }}</p>
                    <ul class="space-y-1.5">
                        <li v-for="option in question.options" :key="option.id" class="flex items-center gap-2 rounded-md px-3 py-2 text-sm" :class="option.is_correct ? 'bg-[#DCEEE3] text-[#2F7A54]' : 'bg-[#F5F6F8] text-[#5A6376]'">
                            <CheckCircle2 v-if="option.is_correct" class="h-4 w-4 shrink-0" :stroke-width="2" />
                            <XCircle v-else class="h-4 w-4 shrink-0" :stroke-width="2" style="color: #AEB4C0" />
                            {{ option.option_text }}
                        </li>
                    </ul>
                </div>
            </div>

            <div class="lg:col-span-2">
                <div class="mb-4 flex items-center justify-between gap-3">
                    <h3 class="text-sm font-semibold" style="color: #1B2231">Results</h3>
                    <div class="flex items-center gap-2">
                        <div class="flex rounded-lg border border-[#D2D6DE] text-xs overflow-hidden">
                            <button @click="sortMode = 'alpha'" class="px-2.5 py-1.5 font-medium transition-colors" :class="sortMode === 'alpha' ? 'bg-[#1D3557] text-white' : 'bg-white text-[#5A6376] hover:bg-[#F5F6F8]'">A-Z</button>
                            <button @click="sortMode = 'score'" class="px-2.5 py-1.5 font-medium transition-colors" :class="sortMode === 'score' ? 'bg-[#1D3557] text-white' : 'bg-white text-[#5A6376] hover:bg-[#F5F6F8]'">Score</button>
                        </div>
                        <select v-model="sectionFilter" class="rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-xs outline-none focus:border-[#1D3557]" style="color: #1B2231">
                            <option value="">All sections</option>
                            <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                    </div>
                </div>

                <div class="card mb-4 grid grid-cols-2 divide-x divide-[#E9EBEF] p-5 text-center">
                    <div>
                        <p class="text-2xl font-semibold" style="color: #1B2231">{{ filteredAttempts.length }}</p>
                        <p class="text-xs" style="color: #7C8598">Submissions</p>
                    </div>
                    <div>
                        <p class="text-2xl font-semibold" style="color: #1B2231">{{ sectionAvg }}</p>
                        <p class="text-xs" style="color: #7C8598">Average score</p>
                    </div>
                </div>

                <div class="card">
                    <div v-if="!filteredAttempts.length" class="flex flex-col items-center justify-center px-6 py-12 text-center">
                        <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#E9EBEF]">
                            <Users class="h-5 w-5" :stroke-width="1.75" style="color: #7C8598" />
                        </div>
                        <p class="text-sm font-medium" style="color: #404A5C">No submissions yet</p>
                        <p class="mt-1 text-xs" style="color: #7C8598">{{ sectionFilter ? 'No students from this section have submitted.' : 'Results will appear here once students complete the quiz.' }}</p>
                    </div>
                    <ul v-else class="divide-y divide-[#E9EBEF]">
                        <li v-for="(attempt, index) in filteredAttempts" :key="attempt.id" class="flex items-center justify-between gap-3 px-5 py-3.5">
                            <div class="flex items-center gap-3">
                            <div v-if="sortMode === 'score'" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" :class="index === 0 ? 'bg-[#F5EBD8]' : 'bg-[#E9EBEF]'">
                                <Award v-if="index === 0" class="h-4 w-4" :stroke-width="2" style="color: #A5701A" />
                                <span v-else class="text-xs font-semibold text-[#5A6376]">{{ index + 1 }}</span>
                            </div>
                                <div>
                                    <p class="text-sm font-medium" style="color: #1B2231">{{ attempt.student.name }}</p>
                                    <p class="text-xs" style="color: #7C8598">{{ attempt.student.grade }}{{ attempt.student.section ? ' — ' + attempt.student.section.name : '' }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <p class="text-sm font-semibold" style="color: #1B2231">{{ attempt.score }}/{{ attempt.total_points }}</p>
                                <button @click="autoRecheck(attempt.id)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Auto recheck">
                                    <RotateCw class="h-3.5 w-3.5" :stroke-width="2" />
                                </button>
                                <Link :href="`/teacher/quizzes/${quiz.id}/recheck/${attempt.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Recheck">
                                    <Eye class="h-3.5 w-3.5" :stroke-width="2" />
                                </Link>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

</template>

<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { ArrowLeft, CheckCircle2, XCircle, Users, Award, PenSquare, Eye, RotateCw } from '@lucide/vue';
import { computed, ref } from 'vue';

const props = defineProps<{
    quiz: any;
    attempts: any[];
    totalPoints: number;
    teachers?: any[];
}>();

const sectionFilter = ref('');
const sortMode = ref<'alpha' | 'score'>('alpha');

const sections = computed(() => {
    const seen = new Set<number>();
    return props.attempts
        .map((a: any) => a.student?.section)
        .filter((s: any) => s && !seen.has(s.id) && seen.add(s.id));
});

const filteredAttempts = computed(() => {
    const list = sectionFilter.value
        ? props.attempts.filter((a: any) => a.student?.section_id === Number(sectionFilter.value))
        : [...props.attempts];
    if (sortMode.value === 'alpha') {
        return list.sort((a: any, b: any) => a.student?.name?.localeCompare(b.student?.name));
    }
    return list.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));
});

const sectionAvg = computed(() => {
    if (!filteredAttempts.value.length) return 0;
    const sum = filteredAttempts.value.reduce((acc: number, a: any) => acc + a.score, 0);
    return Math.round((sum / filteredAttempts.value.length) * 10) / 10;
});

const reassignSelect = ref<HTMLSelectElement | null>(null);

function reassign() {
    if (!reassignSelect.value) return;
    router.patch(`/teacher/quizzes/${props.quiz.id}/reassign`, {
        teacher_id: reassignSelect.value.value,
    }, { preserveScroll: true });
}

function autoRecheck(attemptId: number) {
    router.put(`/teacher/quizzes/${props.quiz.id}/auto-recheck/${attemptId}`, {}, { preserveScroll: true });
}
</script>
