<template>
    <Head title="Quizzes" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h2 class="text-lg font-semibold" style="color: #1B2231">Quizzes</h2>
            <p class="text-sm" style="color: #5A6376">Manage your quizzes.</p>
        </div>
        <button @click="openCreateModal" class="btn-primary">
            <Plus class="h-4 w-4" :stroke-width="2" />
            New Quiz
        </button>
    </div>

    <div v-if="!quizzes.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <FileQuestion class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No quizzes yet</p>
        <p class="mt-1 text-sm" style="color: #7C8598">Create your first quiz to start assessing your students.</p>
        <button @click="openCreateModal" class="btn-primary mt-4">
            <Plus class="h-4 w-4" :stroke-width="2" />
            New Quiz
        </button>
    </div>

    <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Title</th>
                    <th class="px-6 py-3 font-medium">Status</th>
                    <th v-if="isSuperadmin" class="px-6 py-3 font-medium">Teacher</th>
                    <th class="px-6 py-3 font-medium">Target</th>
                    <th class="px-6 py-3 font-medium">Questions</th>
                    <th class="px-6 py-3 font-medium">Attempts</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="quiz in quizzes" :key="quiz.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ quiz.title }}</td>
                    <td class="px-6 py-3"><StatusBadge :status="statusLabel(quiz)" /></td>
                    <td v-if="isSuperadmin" class="px-6 py-3" style="color: #5A6376">{{ quiz.teacher?.name ?? '—' }}</td>
                    <td class="px-6 py-3 text-xs" style="color: #5A6376">
                        {{ quiz.grade_levels ? quiz.grade_levels.map((g: any) => g.name).join(', ') : quiz.grade }}
                        <span v-if="quiz.sections?.length"> — {{ quiz.sections.map((s: any) => s.name).join(', ') }}</span>
                    </td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ quiz.questions_count }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ quiz.attempts_count }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-2">
                            <button v-if="isClosed(quiz)" @click="reopen(quiz)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #1D3557; border-color: #A8DADC" title="Reopen">
                                <RefreshCw class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <Link v-if="isClosed(quiz)" :href="`/teacher/quizzes/${quiz.id}`" class="rounded-lg border border-[#D2D6DE] px-2.5 py-1.5 text-xs font-medium hover:bg-[#F5F6F8] inline-block" style="color: #1D3557" title="View results">
                                Results
                            </Link>
                            <button v-if="!isClosed(quiz)" @click="togglePublish(quiz)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" :title="quiz.is_published ? 'Unpublish' : 'Publish'">
                                <UploadCloud class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <Link v-if="!isClosed(quiz)" :href="`/teacher/quizzes/${quiz.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="View">
                                <Eye class="h-4 w-4" :stroke-width="2" />
                            </Link>
                            <button @click="destroyQuiz(quiz)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Delete quiz">
                                <Trash2 class="h-4 w-4" :stroke-width="2" />
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <Teleport to="body">
        <div v-if="showCreate" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 py-8" @click.self="showCreate = false">
            <div class="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-base font-semibold" style="color: #1B2231">New quiz</h3>
                    <button @click="showCreate = false" class="rounded-md p-1.5 hover:bg-[#E9EBEF]" style="color: #7C8598">
                        <X class="h-5 w-5" :stroke-width="2" />
                    </button>
                </div>

                <form @submit.prevent="submitQuiz" class="space-y-6">
                    <div class="rounded-lg border border-[#E9EBEF] p-4">
                        <h4 class="mb-3 text-sm font-semibold" style="color: #1B2231">Quiz details</h4>
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div class="sm:col-span-2">
                                <label class="field-label">Title</label>
                                <input v-model="quizForm.title" type="text" class="input-field" placeholder="e.g. Photosynthesis Chapter Review" required />
                                <p v-if="quizForm.errors?.title" class="mt-1 text-xs" style="color: #AA3C36">{{ quizForm.errors.title }}</p>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="field-label">Description (optional)</label>
                                <textarea v-model="quizForm.description" rows="2" class="input-field" placeholder="Brief instructions for students"></textarea>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="field-label">Grade levels</label>
                                <div class="flex flex-wrap gap-2">
                                    <button v-for="gl in gradeLevels" :key="gl.id" type="button"
                                        class="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
                                        :class="quizForm.grade_level_ids.includes(gl.id) ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1D3557]' : 'border-[#D2D6DE] text-[#5A6376] hover:border-[#AEB4C0]'"
                                        @click="toggleGrade(gl.id)">
                                        <Check v-if="quizForm.grade_level_ids.includes(gl.id)" class="-ml-0.5 mr-1.5 inline h-4 w-4" :stroke-width="2.5" />
                                        {{ gl.name }}
                                    </button>
                                </div>
                                <p v-if="quizForm.errors?.grade_level_ids" class="mt-1 text-xs" style="color: #AA3C36">{{ quizForm.errors.grade_level_ids }}</p>
                            </div>
                            <div v-if="quizForm.grade_level_ids.length" class="sm:col-span-2">
                                <label class="field-label">Sections</label>
                                <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                    <button v-for="sec in filteredSections" :key="sec.id" type="button"
                                        class="flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors"
                                        :class="quizForm.section_ids.includes(sec.id) ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1D3557]' : 'border-[#D2D6DE] text-[#5A6376] hover:border-[#AEB4C0]'"
                                        @click="toggleSection(sec.id)">
                                        <div class="flex h-4.5 w-4.5 items-center justify-center rounded border" :class="quizForm.section_ids.includes(sec.id) ? 'border-[#1D3557] bg-[#1D3557]' : 'border-[#D2D6DE]'">
                                            <Check v-if="quizForm.section_ids.includes(sec.id)" class="h-3 w-3 text-white" :stroke-width="3" />
                                        </div>
                                        {{ sec.name }}
                                    </button>
                                </div>
                                <p v-if="quizForm.errors?.section_ids" class="mt-1 text-xs" style="color: #AA3C36">{{ quizForm.errors.section_ids }}</p>
                            </div>
                            <div>
                                <label class="field-label">Time limit (minutes, optional)</label>
                                <input v-model="quizForm.time_limit_minutes" type="number" min="1" class="input-field" placeholder="e.g. 20" />
                            </div>
                        </div>
                    </div>

                    <div class="rounded-lg border border-[#E9EBEF] p-4">
                        <div class="mb-3 flex items-center justify-between">
                            <h4 class="text-sm font-semibold" style="color: #1B2231">Questions</h4>
                            <button type="button" @click="addQuestion" class="rounded-lg border border-[#D2D6DE] p-1.5 hover:bg-[#F5F6F8]" style="color: #5A6376" title="Add question">
                                <Plus class="h-4 w-4" :stroke-width="2" />
                            </button>
                        </div>

                        <div v-for="(q, qi) in quizForm.questions" :key="qi" class="mb-3 rounded-lg border border-[#E9EBEF] p-4">
                            <div class="mb-3 flex items-start justify-between gap-3">
                                <div class="flex-1">
                                    <label class="field-label">Question {{ qi + 1 }}</label>
                                    <input v-model="q.question_text" type="text" class="input-field" placeholder="Enter your question" required />
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    <select v-model="q.type" class="rounded-lg border border-[#D2D6DE] px-2 py-2 text-xs outline-none" style="color: #404A5C">
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="true_false">True/False</option>
                                    </select>
                                    <input v-model.number="q.points" type="number" min="1" class="w-16 rounded-lg border border-[#D2D6DE] px-2 py-2 text-xs outline-none" placeholder="Pts" />
                                    <button v-if="quizForm.questions.length > 1" type="button" @click="removeQuestion(qi)" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Remove question">
                                        <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                                    </button>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <div v-for="(opt, oi) in q.options" :key="oi" class="flex items-center gap-2">
                                    <input :checked="opt.is_correct" @change="setCorrect(q, oi)" type="radio" :name="'correct_' + qi" class="h-4 w-4" style="color: #1D3557" />
                                    <input v-model="opt.option_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]" :placeholder="q.type === 'true_false' ? (oi === 0 ? 'True' : 'False') : 'Option ' + (oi + 1)" :readonly="q.type === 'true_false'" required />
                                    <button v-if="q.type === 'multiple_choice' && q.options.length > 2" type="button" @click="removeOption(q, oi)" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36">
                                        <X class="h-3 w-3" :stroke-width="2" />
                                    </button>
                                </div>
                                <button v-if="q.type === 'multiple_choice'" type="button" @click="addOption(q)" class="mt-1 text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add option</button>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-3 border-t border-[#E9EBEF] pt-4">
                        <button type="button" class="btn-secondary" @click="showCreate = false">Cancel</button>
                        <button type="submit" class="btn-primary" :disabled="quizForm.processing">Create Quiz</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, Link, router, usePage, useForm } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { Plus, Eye, Trash2, UploadCloud, FileQuestion, Check, X, RefreshCw } from '@lucide/vue';
import { computed, ref } from 'vue';

const props = defineProps<{
    quizzes: any[];
    gradeLevels: any[];
    allSections: any[];
    isSuperadmin?: boolean;
}>();

const page = usePage();
const flash = page.props.flash as any;

interface Option { option_text: string; is_correct: boolean }
interface Question { question_text: string; type: string; points: number; options: Option[] }

function newOption(isCorrect = false): Option {
    return { option_text: '', is_correct: isCorrect };
}

function newQuestion(): Question {
    return {
        question_text: '', type: 'multiple_choice', points: 1,
        options: [newOption(true), newOption(), newOption(), newOption()],
    };
}

const showCreate = ref(false);

const quizForm = useForm({
    title: '', description: '', grade_level_ids: [] as number[], section_ids: [] as number[],
    time_limit_minutes: '', questions: [newQuestion()],
});

function openCreateModal() {
    quizForm.reset();
    quizForm.questions = [newQuestion()];
    showCreate.value = true;
}

const filteredSections = computed(() =>
    props.allSections.filter((s: any) => quizForm.grade_level_ids.includes(s.grade_level_id))
);

function toggleGrade(id: number) {
    const idx = quizForm.grade_level_ids.indexOf(id);
    if (idx === -1) { quizForm.grade_level_ids.push(id); }
    else { quizForm.grade_level_ids.splice(idx, 1); }
    quizForm.section_ids = quizForm.section_ids.filter((sid) =>
        filteredSections.value.some((s: any) => s.id === sid)
    );
}

function toggleSection(id: number) {
    const idx = quizForm.section_ids.indexOf(id);
    if (idx === -1) { quizForm.section_ids.push(id); }
    else { quizForm.section_ids.splice(idx, 1); }
}

function setCorrect(q: Question, oi: number) {
    q.options.forEach((o, i) => { o.is_correct = i === oi; });
}

function addQuestion() { quizForm.questions.push(newQuestion()); }

function removeQuestion(i: number) { quizForm.questions.splice(i, 1); }

function addOption(q: Question) { q.options.push(newOption()); }

function removeOption(q: Question, i: number) { q.options.splice(i, 1); }

function submitQuiz() {
    quizForm.post('/teacher/quizzes', {
        preserveScroll: true,
        onSuccess: () => { showCreate.value = false; },
    });
}

function togglePublish(quiz: any) {
    router.patch(`/teacher/quizzes/${quiz.id}/publish`, {}, { preserveScroll: true });
}

function isClosed(quiz: any): boolean {
    if (!quiz.closes_at) return false;
    return new Date(quiz.closes_at) < new Date();
}

function statusLabel(a: any): string {
    if (!a.is_published) return 'draft';
    if (a.closes_at && new Date(a.closes_at) < new Date()) return 'finished';
    return 'published';
}

function reopen(quiz: any) { router.patch(`/teacher/quizzes/${quiz.id}/reopen`, {}, { preserveScroll: true }); }

function destroyQuiz(quiz: any) {
    if (confirm(`Delete "${quiz.title}"? This cannot be undone.`)) {
        router.delete(`/teacher/quizzes/${quiz.id}`, { preserveScroll: true });
    }
}
</script>
