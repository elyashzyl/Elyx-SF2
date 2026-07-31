<template>
    <Head title="Quizzes" />

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(124,58,237,0.08)); border: 1px solid var(--gl-border);">
        <div class="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
                <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                    <FileQuestion class="h-6 w-6 text-white" :stroke-width="2" />
                </div>
                <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Quizzes</h1>
                <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                    Create interactive quizzes to challenge and assess your students.
                </p>
            </div>
            <button @click="openCreateModal"
                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
                <Plus class="h-4 w-4" :stroke-width="2" /> New Quiz
            </button>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <div v-if="!quizzes.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
            <FileQuestion class="h-6 w-6" style="color: var(--gl-text-muted);" :stroke-width="1.75" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No quizzes yet</p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">Create your first quiz to start assessing your students.</p>
        <button @click="openCreateModal" class="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
            <Plus class="h-4 w-4" :stroke-width="2" /> New Quiz
        </button>
    </div>

    <div v-else class="gl-glow-card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border);">
                    <th class="px-6 py-3 font-medium">Title</th>
                    <th class="px-6 py-3 font-medium">Status</th>
                    <th v-if="isSuperadmin" class="px-6 py-3 font-medium">Teacher</th>
                    <th class="px-6 py-3 font-medium">Target</th>
                    <th class="px-6 py-3 font-medium">Questions</th>
                    <th class="px-6 py-3 font-medium">Attempts</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y" style="border-color: var(--gl-border);">
                <tr v-for="quiz in quizzes" :key="quiz.id" class="hover:bg-[rgba(59,130,246,0.03)]">
                    <td class="px-6 py-3 font-medium" style="color: var(--gl-text-primary)">{{ quiz.title }}</td>
                    <td class="px-6 py-3"><StatusBadge :status="statusLabel(quiz)" /></td>
                    <td v-if="isSuperadmin" class="px-6 py-3" style="color: var(--gl-text-secondary)">{{ quiz.teacher?.name ?? '—' }}</td>
                    <td class="px-6 py-3 text-xs" style="color: var(--gl-text-secondary)">{{ quiz.grade_levels ? quiz.grade_levels.map((g: any) => g.name).join(', ') : quiz.grade }}<span v-if="quiz.sections?.length"> — {{ quiz.sections.map((s: any) => s.name).join(', ') }}</span></td>
                    <td class="px-6 py-3" style="color: var(--gl-text-secondary)">{{ quiz.questions_count }}</td>
                    <td class="px-6 py-3" style="color: var(--gl-text-secondary)">{{ quiz.attempts_count }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-1.5">
                            <button v-if="isClosed(quiz)" @click="reopen(quiz)" class="rounded-lg p-2 transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-primary); border: 1px solid var(--gl-border);" title="Reopen"><RefreshCw class="h-4 w-4" :stroke-width="2" /></button>
                            <Link v-if="isClosed(quiz)" :href="`/teacher/quizzes/${quiz.id}`" class="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-primary); border: 1px solid var(--gl-border);">Results</Link>
                            <button v-if="!isClosed(quiz)" @click="togglePublish(quiz)" class="rounded-lg p-2 transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" :title="quiz.is_published ? 'Unpublish' : 'Publish'"><UploadCloud class="h-4 w-4" :stroke-width="2" /></button>
                            <Link v-if="!isClosed(quiz)" :href="`/teacher/quizzes/${quiz.id}`" class="rounded-lg p-2 transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="View"><Eye class="h-4 w-4" :stroke-width="2" /></Link>
                            <button @click="destroyQuiz(quiz)" class="rounded-lg p-2 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-danger); border: 1px solid rgba(239,68,68,0.2);" title="Delete"><Trash2 class="h-4 w-4" :stroke-width="2" /></button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
        <div v-if="showCreate" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="showCreate = false">
            <div class="my-auto w-full max-w-2xl rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-base font-semibold" style="color: var(--gl-text-primary)">New quiz</h3>
                    <button @click="showCreate = false" class="rounded-lg p-1.5 transition-colors hover:bg-[var(--gl-surface-2)]" style="color: var(--gl-text-muted);"><X class="h-5 w-5" :stroke-width="2" /></button>
                </div>
                <form @submit.prevent="submitQuiz" class="space-y-6">
                    <div class="rounded-xl p-4" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                        <h4 class="mb-3 text-sm font-semibold" style="color: var(--gl-text-primary)">Quiz details</h4>
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div class="sm:col-span-2"><label class="field-label" style="color: var(--gl-text-secondary);">Title</label><input v-model="quizForm.title" type="text" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" placeholder="e.g. Photosynthesis Chapter Review" required /><p v-if="quizForm.errors?.title" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ quizForm.errors.title }}</p></div>
                            <div class="sm:col-span-2"><label class="field-label" style="color: var(--gl-text-secondary);">Description</label><textarea v-model="quizForm.description" rows="2" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" placeholder="Brief instructions for students"></textarea></div>
                            <div class="sm:col-span-2"><label class="field-label" style="color: var(--gl-text-secondary);">Grade levels</label><div class="flex flex-wrap gap-2"><button v-for="gl in gradeLevels" :key="gl.id" type="button" class="rounded-lg border px-3.5 py-2 text-sm font-medium transition-all" :class="quizForm.grade_level_ids.includes(gl.id) ? 'border-[var(--gl-primary)] bg-[rgba(59,130,246,0.1)] text-[var(--gl-primary)]' : 'border-[var(--gl-border)] text-[var(--gl-text-secondary)]'" @click="toggleGrade(gl.id)"><Check v-if="quizForm.grade_level_ids.includes(gl.id)" class="-ml-0.5 mr-1.5 inline h-4 w-4" :stroke-width="2.5" />{{ gl.name }}</button></div></div>
                            <div v-if="quizForm.grade_level_ids.length" class="sm:col-span-2"><label class="field-label" style="color: var(--gl-text-secondary);">Sections</label><div class="grid grid-cols-2 gap-2 sm:grid-cols-3"><button v-for="sec in filteredSections" :key="sec.id" type="button" class="flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all" :class="quizForm.section_ids.includes(sec.id) ? 'border-[var(--gl-primary)] bg-[rgba(59,130,246,0.1)] text-[var(--gl-primary)]' : 'border-[var(--gl-border)] text-[var(--gl-text-secondary)]'" @click="toggleSection(sec.id)"><div class="flex h-4 w-4 items-center justify-center rounded border" :class="quizForm.section_ids.includes(sec.id) ? 'border-[var(--gl-primary)] bg-[var(--gl-primary)]' : 'border-[var(--gl-border)]'"><Check v-if="quizForm.section_ids.includes(sec.id)" class="h-3 w-3 text-white" :stroke-width="3" /></div>{{ sec.name }}</button></div></div>
                            <div><label class="field-label" style="color: var(--gl-text-secondary);">Time limit (min)</label><input v-model="quizForm.time_limit_minutes" type="number" min="1" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" placeholder="e.g. 20" /></div>
                        </div>
                    </div>
                    <div class="rounded-xl p-4" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                        <div class="mb-3 flex items-center justify-between"><h4 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Questions</h4><button type="button" @click="addQuestion" class="rounded-lg p-1.5 transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="Add question"><Plus class="h-4 w-4" :stroke-width="2" /></button></div>
                        <div v-for="(q, qi) in quizForm.questions" :key="qi" class="mb-3 rounded-xl p-4" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                            <div class="mb-3 flex items-start justify-between gap-3">
                                <div class="flex-1"><label class="field-label" style="color: var(--gl-text-secondary);">Question {{ qi + 1 }}</label><input v-model="q.question_text" type="text" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" placeholder="Enter your question" required /></div>
                                <div class="flex items-center gap-2 shrink-0"><select v-model="q.type" class="rounded-lg border px-2 py-2 text-xs outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);"><option value="multiple_choice">Multiple Choice</option><option value="true_false">True/False</option></select><input v-model.number="q.points" type="number" min="1" class="w-16 rounded-lg border px-2 py-2 text-xs outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" placeholder="Pts" /><button v-if="quizForm.questions.length > 1" type="button" @click="removeQuestion(qi)" class="rounded-md p-1 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-danger);" title="Remove"><Trash2 class="h-3.5 w-3.5" :stroke-width="2" /></button></div>
                            </div>
                            <div class="space-y-2"><div v-for="(opt, oi) in q.options" :key="oi" class="flex items-center gap-2"><input :checked="opt.is_correct" @change="setCorrect(q, oi)" type="radio" :name="'correct_' + qi" class="h-4 w-4" style="accent-color: var(--gl-primary);" /><input v-model="opt.option_text" type="text" class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" :placeholder="q.type === 'true_false' ? (oi === 0 ? 'True' : 'False') : 'Option ' + (oi + 1)" :readonly="q.type === 'true_false'" required /><button v-if="q.type === 'multiple_choice' && q.options.length > 2" type="button" @click="removeOption(q, oi)" class="rounded-md p-1 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-danger);"><X class="h-3 w-3" :stroke-width="2" /></button></div><button v-if="q.type === 'multiple_choice'" type="button" @click="addOption(q)" class="mt-1 text-xs font-medium transition-colors hover:text-[var(--gl-text-primary)]" style="color: var(--gl-text-secondary);">+ Add option</button></div>
                        </div>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-4" style="border-top: 1px solid var(--gl-border);">
                        <button type="button" @click="showCreate = false" class="rounded-xl px-4 py-2.5 text-sm font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                        <button type="submit" :disabled="quizForm.processing" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50" style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">Create Quiz</button>
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

const props = defineProps<{ quizzes: any[]; gradeLevels: any[]; allSections: any[]; isSuperadmin?: boolean }>();
const page = usePage();
const flash = page.props.flash as any;

interface Option { option_text: string; is_correct: boolean }
interface Question { question_text: string; type: string; points: number; options: Option[] }
function newOption(isCorrect = false): Option { return { option_text: '', is_correct: isCorrect }; }
function newQuestion(): Question { return { question_text: '', type: 'multiple_choice', points: 1, options: [newOption(true), newOption(), newOption(), newOption()] }; }

const showCreate = ref(false);
const quizForm = useForm({ title: '', description: '', grade_level_ids: [] as number[], section_ids: [] as number[], time_limit_minutes: '', questions: [newQuestion()] });

function openCreateModal() { quizForm.reset(); quizForm.questions = [newQuestion()]; showCreate.value = true; }
const filteredSections = computed(() => props.allSections.filter((s: any) => quizForm.grade_level_ids.includes(s.grade_level_id)));
function toggleGrade(id: number) { const idx = quizForm.grade_level_ids.indexOf(id); if (idx === -1) quizForm.grade_level_ids.push(id); else quizForm.grade_level_ids.splice(idx, 1); quizForm.section_ids = quizForm.section_ids.filter(sid => filteredSections.value.some((s: any) => s.id === sid)); }
function toggleSection(id: number) { const idx = quizForm.section_ids.indexOf(id); if (idx === -1) quizForm.section_ids.push(id); else quizForm.section_ids.splice(idx, 1); }
function setCorrect(q: Question, oi: number) { q.options.forEach((o, i) => { o.is_correct = i === oi; }); }
function addQuestion() { quizForm.questions.push(newQuestion()); }
function removeQuestion(i: number) { quizForm.questions.splice(i, 1); }
function addOption(q: Question) { q.options.push(newOption()); }
function removeOption(q: Question, i: number) { q.options.splice(i, 1); }
function submitQuiz() { quizForm.post('/teacher/quizzes', { preserveScroll: true, onSuccess: () => { showCreate.value = false; } }); }
function togglePublish(quiz: any) { router.patch(`/teacher/quizzes/${quiz.id}/publish`, {}, { preserveScroll: true }); }
function isClosed(quiz: any): boolean { if (!quiz.closes_at) return false; return new Date(quiz.closes_at) < new Date(); }
function statusLabel(a: any): string { if (!a.is_published) return 'draft'; if (a.closes_at && new Date(a.closes_at) < new Date()) return 'finished'; return 'published'; }
function reopen(quiz: any) { router.patch(`/teacher/quizzes/${quiz.id}/reopen`, {}, { preserveScroll: true }); }
function destroyQuiz(quiz: any) { if (confirm(`Delete "${quiz.title}"? This cannot be undone.`)) router.delete(`/teacher/quizzes/${quiz.id}`, { preserveScroll: true }); }
</script>
