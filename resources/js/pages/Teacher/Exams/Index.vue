<template>
    <Head title="Exams" />

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(59,130,246,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
                <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                    style="background: linear-gradient(135deg, var(--gl-secondary), var(--gl-primary)); box-shadow: 0 0 20px var(--gl-secondary-glow);">
                    <FileText class="h-6 w-6 text-white" :stroke-width="2" />
                </div>
                <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Exams</h1>
                <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                    Build comprehensive exams with question and practical sections.
                </p>
            </div>
            <button @click="showCreate = true"
                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style="background: linear-gradient(135deg, var(--gl-secondary), var(--gl-primary)); box-shadow: 0 0 12px var(--gl-secondary-glow);">
                <Plus class="h-4 w-4" :stroke-width="2" /> New Exam
            </button>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
    </div>

    <div v-if="!exams.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
            <FileQuestion class="h-6 w-6" style="color: var(--gl-text-muted);" :stroke-width="1.75" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No exams yet</p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">Create a composite exam with multiple sections.</p>
        <button @click="showCreate = true" class="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="background: linear-gradient(135deg, var(--gl-secondary), var(--gl-primary)); box-shadow: 0 0 12px var(--gl-secondary-glow);">
            <Plus class="h-4 w-4" :stroke-width="2" /> New Exam
        </button>
    </div>

    <div v-else class="gl-glow-card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Title</th>
                    <th class="px-6 py-3 font-medium">Grade</th>
                    <th class="px-6 py-3 font-medium">Status</th>
                    <th v-if="isSuperadmin" class="px-6 py-3 font-medium">Teacher</th>
                    <th class="px-6 py-3 font-medium">Sections</th>
                    <th class="px-6 py-3 font-medium">Attempts</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="e in exams" :key="e.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ e.title }}</td>
                    <td class="px-6 py-3 text-xs" style="color: #5A6376">{{ e.grade_levels ? e.grade_levels.map((g: any) => g.name).join(', ') : e.grade }}</td>
                    <td class="px-6 py-3"><Link :href="`/teacher/exams/${e.id}`"><StatusBadge :status="statusLabel(e)" /></Link></td>
                    <td v-if="isSuperadmin" class="px-6 py-3" style="color: #5A6376">{{ e.teacher?.name ?? '—' }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ e.sections_count }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ e.attempts_count }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-2">
                            <button v-if="isClosed(e)" @click="reopen(e)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #1D3557; border-color: #A8DADC" title="Reopen">
                                <RefreshCw class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <Link v-if="isClosed(e)" :href="`/teacher/exams/${e.id}`" class="rounded-lg border border-[#D2D6DE] px-2.5 py-1.5 text-xs font-medium hover:bg-[#F5F6F8] inline-block" style="color: #1D3557" title="View results">
                                Results
                            </Link>
                            <button v-if="!isClosed(e)" @click="togglePublish(e)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" :title="e.is_published ? 'Unpublish' : 'Publish'">
                                <UploadCloud class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <Link v-if="!isClosed(e)" :href="`/teacher/exams/${e.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="View">
                                <Eye class="h-4 w-4" :stroke-width="2" />
                            </Link>
                            <button @click="destroyE(e)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Delete">
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
            <div class="my-auto w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-base font-semibold" style="color: #1B2231">New exam</h3>
                    <button @click="showCreate = false" class="rounded-md p-1.5 hover:bg-[#E9EBEF]" style="color: #7C8598">
                        <X class="h-5 w-5" :stroke-width="2" />
                    </button>
                </div>

                <form @submit.prevent="submitForm" class="space-y-6">
                    <div class="rounded-lg border border-[#E9EBEF] p-4">
                        <h4 class="mb-3 text-sm font-semibold" style="color: #1B2231">Details</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="field-label">Title</label>
                                <input v-model="form.title" type="text" class="input-field" placeholder="e.g. Midterm Exam" required />
                            </div>
                            <div>
                                <label class="field-label">Grade levels</label>
                                <div class="flex flex-wrap gap-2">
                                    <button v-for="gl in gradeLevels" :key="gl.id" type="button"
                                        class="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
                                        :class="form.grade_level_ids.includes(gl.id) ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1D3557]' : 'border-[#D2D6DE] text-[#5A6376] hover:border-[#AEB4C0]'"
                                        @click="toggleGrade(gl.id)">
                                        <Check v-if="form.grade_level_ids.includes(gl.id)" class="-ml-0.5 mr-1.5 inline h-4 w-4" :stroke-width="2.5" />
                                        {{ gl.name }}
                                    </button>
                                </div>
                                <p v-if="form.errors.grade_level_ids" class="mt-1 text-xs" style="color: #AA3C36">{{ form.errors.grade_level_ids }}</p>
                            </div>
                            <div>
                                <label class="field-label">Instructions (optional)</label>
                                <textarea v-model="form.instructions" rows="2" class="input-field" placeholder="General instructions for the exam"></textarea>
                            </div>
                            <div>
                                <label class="field-label">Time limit (minutes, optional)</label>
                                <input v-model="form.time_limit_minutes" type="number" min="1" class="input-field" />
                            </div>
                            <div v-if="teachers?.length">
                                <label class="field-label">Assign to teacher</label>
                                <select v-model="form.teacher_id" class="input-field">
                                    <option :value="null">Select a teacher</option>
                                    <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-lg border border-[#E9EBEF] p-4">
                        <div class="mb-3 flex items-center justify-between">
                            <h4 class="text-sm font-semibold" style="color: #1B2231">Sections</h4>
                            <div class="flex gap-2">
                                <button type="button" @click="addSection('questions')" class="rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-xs font-medium hover:bg-[#F5F6F8]" style="color: #5A6376">+ Question section</button>
                                <button type="button" @click="addSection('practical')" class="rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-xs font-medium hover:bg-[#F5F6F8]" style="color: #5A6376">+ Practical section</button>
                            </div>
                        </div>

                        <div v-for="(sec, si) in form.sections" :key="si" class="mb-4 rounded-lg border border-[#D2D6DE] p-4">
                            <div class="mb-3 flex items-center justify-between">
                                <span class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style="color: #5A6376">
                                    <FileText v-if="sec.section_type === 'questions'" class="h-3.5 w-3.5" :stroke-width="2" />
                                    <ClipboardCheck v-else class="h-3.5 w-3.5" :stroke-width="2" />
                                    Section {{ si + 1 }} — {{ sec.section_type === 'questions' ? 'Questions' : 'Practical' }}
                                </span>
                                <button type="button" @click="form.sections.splice(si, 1)" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Remove section">
                                    <X class="h-4 w-4" :stroke-width="2" />
                                </button>
                            </div>

                            <div class="mb-3 grid grid-cols-2 gap-3">
                                <div>
                                    <label class="field-label text-xs">Title</label>
                                    <input v-model="sec.title" type="text" class="input-field" placeholder="e.g. Part I" required />
                                </div>
                                <div>
                                    <label class="field-label text-xs">Instructions (optional)</label>
                                    <input v-model="sec.instructions" type="text" class="input-field" placeholder="Section instructions" />
                                </div>
                            </div>

                            <template v-if="sec.section_type === 'questions'">
                                <div class="mb-2 flex items-center justify-between">
                                    <span class="text-xs font-medium" style="color: #5A6376">Questions</span>
                                    <button type="button" @click="addQuestion(si)" class="rounded-lg border border-[#D2D6DE] px-2.5 py-1 text-xs font-medium hover:bg-[#F5F6F8]" style="color: #5A6376">+ Add question</button>
                                </div>

                                <div v-for="(q, qi) in sec.questions" :key="qi" class="mb-2 rounded-lg border border-[#E9EBEF] p-3">
                                    <div class="mb-2 flex items-start justify-between gap-2">
                                        <div class="flex-1">
                                            <label class="field-label text-xs">Question {{ qi + 1 }}</label>
                                            <textarea v-model="q.question_text" rows="1" class="input-field" :placeholder="q.type === 'identification' ? 'e.g. What is the capital of France?' : 'Question text'" required></textarea>
                                        </div>
                                        <div class="flex items-center gap-2 shrink-0">
                                            <select v-model="q.type" class="rounded-lg border border-[#D2D6DE] px-2 py-1.5 text-xs outline-none" style="color: #1B2231">
                                                <option value="multiple_choice">Multiple Choice</option>
                                                <option value="true_false">True or False</option>
                                                <option value="identification">Identification</option>
                                                <option value="enumeration">Enumeration</option>
                                                <option value="matching">Matching</option>
                                            </select>
                                            <div class="w-14">
                                                <label class="field-label text-xs">Pts</label>
                                                <input v-model.number="q.points" type="number" min="1" class="w-full rounded-lg border border-[#D2D6DE] px-2 py-1.5 text-xs outline-none" />
                                            </div>
                                            <button type="button" @click="sec.questions.splice(qi, 1)" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Remove">
                                                <X class="h-3.5 w-3.5" :stroke-width="2" />
                                            </button>
                                        </div>
                                    </div>

                                    <template v-if="q.type === 'multiple_choice'">
                                        <label class="field-label text-xs">Options</label>
                                        <div v-for="(opt, oi) in q.options" :key="oi" class="mt-1 flex items-center gap-2">
                                            <input v-model="opt.option_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-2.5 py-1.5 text-xs outline-none" :placeholder="`Option ${oi + 1}`" required />
                                            <label class="flex shrink-0 items-center gap-1 text-xs" style="color: #5A6376">
                                                <input type="radio" :name="'mc-correct-' + si + '-' + qi" :checked="opt.is_correct" @change="setCorrectOption(sec.questions, qi, oi)" class="h-3.5 w-3.5" />
                                                Correct
                                            </label>
                                            <button v-if="q.options.length > 2" type="button" @click="q.options.splice(oi, 1)" class="rounded-md p-0.5 hover:bg-[#F6DEDD]" style="color: #AA3C36">
                                                <X class="h-3 w-3" :stroke-width="2" />
                                            </button>
                                        </div>
                                        <button type="button" @click="q.options.push({ option_text: '', is_correct: false })" class="mt-1 text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add option</button>
                                    </template>

                                    <template v-if="q.type === 'true_false'">
                                        <label class="field-label text-xs">Correct answer</label>
                                        <div class="mt-1 flex gap-3">
                                            <label class="flex items-center gap-1.5 text-xs" style="color: #1B2231">
                                                <input type="radio" :name="'tf-' + si + '-' + qi" value="true" v-model="q.correct_answer" class="h-3.5 w-3.5" /> True
                                            </label>
                                            <label class="flex items-center gap-1.5 text-xs" style="color: #1B2231">
                                                <input type="radio" :name="'tf-' + si + '-' + qi" value="false" v-model="q.correct_answer" class="h-3.5 w-3.5" /> False
                                            </label>
                                        </div>
                                    </template>

                                    <template v-if="q.type === 'identification'">
                                        <div>
                                            <label class="field-label text-xs">Answer</label>
                                            <input v-model="q.correct_answer" type="text" class="input-field" placeholder="Correct answer" />
                                        </div>
                                    </template>

                                    <template v-if="q.type === 'enumeration'">
                                        <div>
                                            <label class="field-label text-xs">Expected items</label>
                                            <div v-for="(item, ii) in q.enum_items" :key="ii" class="mt-1 flex items-center gap-2">
                                                <input v-model="q.enum_items[ii]" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-2.5 py-1.5 text-xs outline-none" :placeholder="`Item ${ii + 1}`" />
                                                <button v-if="q.enum_items.length > 1" type="button" @click="q.enum_items.splice(ii, 1)" class="rounded-md p-0.5 hover:bg-[#F6DEDD]" style="color: #AA3C36">
                                                    <X class="h-3 w-3" :stroke-width="2" />
                                                </button>
                                            </div>
                                            <button type="button" @click="q.enum_items.push('')" class="mt-1 text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add item</button>
                                        </div>
                                    </template>

                                    <template v-if="q.type === 'matching'">
                                        <div class="space-y-1.5">
                                            <div class="flex items-center justify-between">
                                                <label class="field-label text-xs">Matching pairs</label>
                                                <button type="button" @click="q.matching_pairs.push({ left_text: '', right_text: '' })" class="text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add pair</button>
                                            </div>
                                            <div v-for="(pair, pi) in q.matching_pairs" :key="pi" class="flex items-center gap-2">
                                                <input v-model="pair.left_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-2.5 py-1.5 text-xs outline-none" placeholder="Left item" />
                                                <span class="text-xs" style="color: #7C8598">→</span>
                                                <input v-model="pair.right_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-2.5 py-1.5 text-xs outline-none" placeholder="Right item" />
                                                <button v-if="q.matching_pairs.length > 2" type="button" @click="q.matching_pairs.splice(pi, 1)" class="rounded-md p-0.5 hover:bg-[#F6DEDD]" style="color: #AA3C36">
                                                    <X class="h-3 w-3" :stroke-width="2" />
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </template>

                            <template v-if="sec.section_type === 'practical'">
                                <div class="mb-2 flex items-center justify-between">
                                    <span class="text-xs font-medium" style="color: #5A6376">Rubric criteria</span>
                                    <button type="button" @click="addCriterion(si)" class="rounded-lg border border-[#D2D6DE] px-2.5 py-1 text-xs font-medium hover:bg-[#F5F6F8]" style="color: #5A6376">+ Add criterion</button>
                                </div>

                                <div v-for="(c, ci) in sec.criteria" :key="ci" class="mb-2 rounded-lg border border-[#E9EBEF] p-3">
                                    <div class="flex items-start justify-between gap-2">
                                        <div class="flex-1">
                                            <label class="field-label text-xs">Criterion {{ ci + 1 }}</label>
                                            <input v-model="c.criterion_name" type="text" class="input-field" placeholder="e.g. Accuracy" required />
                                        </div>
                                        <div class="flex items-center gap-2 shrink-0">
                                            <div class="w-16">
                                                <label class="field-label text-xs">Max pts</label>
                                                <input v-model.number="c.max_points" type="number" min="1" class="w-full rounded-lg border border-[#D2D6DE] px-2 py-1.5 text-xs outline-none" />
                                            </div>
                                            <button v-if="sec.criteria.length > 1" type="button" @click="sec.criteria.splice(ci, 1)" class="mt-4 rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Remove">
                                                <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                                            </button>
                                        </div>
                                    </div>
                                    <div class="mt-1">
                                        <label class="field-label text-xs">Description (optional)</label>
                                        <input v-model="c.description" type="text" class="input-field" placeholder="Describe what to assess" />
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-3 border-t border-[#E9EBEF] pt-4">
                        <button type="button" class="btn-secondary" @click="showCreate = false">Cancel</button>
                        <button type="submit" class="btn-primary" :disabled="form.processing">Create</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, Link, router, usePage, useForm } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { Plus, Eye, Trash2, UploadCloud, FileQuestion, FileText, ClipboardCheck, X, Check, RefreshCw } from '@lucide/vue';
import { ref } from 'vue';

defineProps<{ exams: any[]; isSuperadmin?: boolean; teachers?: any[]; gradeLevels: any[] }>();

const page = usePage();
const flash = page.props.flash as any;
const showCreate = ref(false);

interface Section {
    title: string;
    section_type: 'questions' | 'practical';
    instructions: string;
    questions: Question[];
    criteria: Criterion[];
}

interface Question {
    question_text: string;
    type: string;
    points: number;
    options: { option_text: string; is_correct: boolean }[];
    matching_pairs: { left_text: string; right_text: string }[];
    correct_answer: string;
    enum_items: string[];
}

interface Criterion {
    criterion_name: string;
    description: string;
    max_points: number;
}

function blankSection(type: 'questions' | 'practical'): Section {
    return {
        title: '',
        section_type: type,
        instructions: '',
        questions: type === 'questions' ? [blankQuestion()] : [],
        criteria: type === 'practical' ? [blankCriterion()] : [],
    };
}

function blankQuestion(): Question {
    return {
        question_text: '', type: 'multiple_choice', points: 1,
        options: [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }],
        matching_pairs: [{ left_text: '', right_text: '' }, { left_text: '', right_text: '' }, { left_text: '', right_text: '' }],
        correct_answer: 'true', enum_items: [''],
    };
}

function blankCriterion(): Criterion {
    return { criterion_name: '', description: '', max_points: 10 };
}

const form = useForm({
    title: '', instructions: '', time_limit_minutes: '', teacher_id: null as number | null,
    grade_level_ids: [] as number[],
    sections: [] as any[],
});

function addSection(type: 'questions' | 'practical') {
    form.sections.push(blankSection(type));
}

function addQuestion(si: number) {
    form.sections[si].questions.push(blankQuestion());
}

function addCriterion(si: number) {
    form.sections[si].criteria.push(blankCriterion());
}

function toggleGrade(id: number) {
    const idx = form.grade_level_ids.indexOf(id);
    if (idx >= 0) { form.grade_level_ids.splice(idx, 1); }
    else { form.grade_level_ids.push(id); }
}

function setCorrectOption(questions: Question[], qi: number, oi: number) {
    questions[qi].options.forEach((o, i) => { o.is_correct = i === oi; });
}

function submitForm() {
    const payload: any = {
        title: form.title,
        grade_level_ids: form.grade_level_ids,
        instructions: form.instructions,
        time_limit_minutes: form.time_limit_minutes || null,
        sections: form.sections.map(sec => {
            const base: any = {
                title: sec.title,
                section_type: sec.section_type,
                instructions: sec.instructions || null,
            };
            if (sec.section_type === 'questions') {
                base.questions = sec.questions.map(q => {
                    const qb: any = {
                        question_text: q.question_text,
                        type: q.type,
                        points: q.points || 1,
                    };
                    if (q.type === 'multiple_choice') {
                        qb.options = q.options;
                    }
                    if (q.type === 'true_false') {
                        qb.options = [
                            { option_text: 'True', is_correct: q.correct_answer === 'true' },
                            { option_text: 'False', is_correct: q.correct_answer === 'false' },
                        ];
                    }
                    if (q.type === 'matching') {
                        qb.matching_pairs = q.matching_pairs;
                    }
                    return qb;
                });
            }
            if (sec.section_type === 'practical') {
                base.criteria = sec.criteria;
            }
            return base;
        }),
    };

    form.transform(() => payload).post('/teacher/exams', {
        preserveScroll: true,
        onSuccess: () => { showCreate.value = false; },
    });
}

function togglePublish(e: any) { router.patch(`/teacher/exams/${e.id}/publish`, {}, { preserveScroll: true }); }

function isClosed(e: any): boolean {
    if (!e.closes_at) return false;
    return new Date(e.closes_at) < new Date();
}

function statusLabel(a: any): string {
    if (!a.is_published) return 'draft';
    if (a.closes_at && new Date(a.closes_at) < new Date()) return 'finished';
    return 'published';
}

function reopen(e: any) { router.patch(`/teacher/exams/${e.id}/reopen`, {}, { preserveScroll: true }); }

function destroyE(e: any) {
    if (confirm(`Delete "${e.title}"?`)) router.delete(`/teacher/exams/${e.id}`, { preserveScroll: true });
}
</script>
