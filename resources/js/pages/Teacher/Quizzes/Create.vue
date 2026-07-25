<template>
    <Head title="Create Quiz" />

        <Link href="/teacher/dashboard" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
            <ArrowLeft class="h-4 w-4" :stroke-width="2" />
            Back to dashboard
        </Link>

        <form class="space-y-6" @submit.prevent="submit">
            <div class="card p-6">
                <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Quiz details</h3>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="sm:col-span-2">
                        <label class="field-label">Title</label>
                        <input v-model="form.title" type="text" class="input-field" placeholder="e.g. Photosynthesis Chapter Review" required />
                        <p v-if="form.errors.title" class="mt-1 text-xs" style="color: #AA3C36">{{ form.errors.title }}</p>
                    </div>
                    <div class="sm:col-span-2">
                        <label class="field-label">Description (optional)</label>
                        <textarea v-model="form.description" rows="2" class="input-field" placeholder="Brief instructions for students"></textarea>
                    </div>
                    <div class="sm:col-span-2">
                        <label class="field-label">Grade levels</label>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="gl in gradeLevels" :key="gl.id" type="button"
                                class="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
                                :class="form.grade_level_ids.includes(gl.id) ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1D3557]' : 'border-[#D2D6DE] text-[#5A6376] hover:border-[#AEB4C0]'"
                                @click="toggleGrade(gl.id)"
                            >
                                <Check v-if="form.grade_level_ids.includes(gl.id)" class="-ml-0.5 mr-1.5 inline h-4 w-4" :stroke-width="2.5" />
                                {{ gl.name }}
                            </button>
                        </div>
                        <p v-if="form.errors.grade_level_ids" class="mt-1 text-xs" style="color: #AA3C36">{{ form.errors.grade_level_ids }}</p>
                    </div>
                    <div v-if="form.grade_level_ids.length" class="sm:col-span-2">
                        <label class="field-label">Sections</label>
                        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                            <button
                                v-for="sec in filteredSections" :key="sec.id" type="button"
                                class="flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors"
                                :class="form.section_ids.includes(sec.id) ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1D3557]' : 'border-[#D2D6DE] text-[#5A6376] hover:border-[#AEB4C0]'"
                                @click="toggleSection(sec.id)"
                            >
                                <div class="flex h-4.5 w-4.5 items-center justify-center rounded border" :class="form.section_ids.includes(sec.id) ? 'border-[#1D3557] bg-[#1D3557]' : 'border-[#D2D6DE]'">
                                    <Check v-if="form.section_ids.includes(sec.id)" class="h-3 w-3 text-white" :stroke-width="3" />
                                </div>
                                {{ sec.name }}
                            </button>
                        </div>
                        <p v-if="form.errors.section_ids" class="mt-1 text-xs" style="color: #AA3C36">{{ form.errors.section_ids }}</p>
                    </div>
                    <div>
                        <label class="field-label">Time limit in minutes (optional)</label>
                        <input v-model="form.time_limit_minutes" type="number" min="1" class="input-field" placeholder="e.g. 20" />
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

            <div v-for="(question, qIndex) in form.questions" :key="qIndex" class="card p-6">
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-sm font-semibold" style="color: #1B2231">
                        <GripVertical class="h-4 w-4" :stroke-width="2" style="color: #AEB4C0" />
                        Question {{ qIndex + 1 }}
                    </div>
                    <button v-if="form.questions.length > 1" type="button" class="rounded-md p-1.5" style="color: #AA3C36" @click="removeQuestion(qIndex)">
                        <Trash2 class="h-4 w-4" :stroke-width="2" />
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="field-label">Question text</label>
                        <textarea v-model="question.question_text" rows="2" class="input-field" required></textarea>
                        <p v-if="form.errors[`questions.${qIndex}.question_text`]" class="mt-1 text-xs" style="color: #AA3C36">
                            {{ form.errors[`questions.${qIndex}.question_text`] }}
                        </p>
                    </div>

                    <div class="flex flex-wrap items-end gap-4">
                        <div>
                            <label class="field-label">Question type</label>
                            <div class="flex rounded-lg border border-[#D2D6DE] p-1" style="background-color: #F5F6F8">
                                <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="question.type === 'multiple_choice' ? 'bg-white shadow-sm text-[#1D3557]' : 'text-[#5A6376]'" @click="setType(question, 'multiple_choice')">
                                    Multiple choice
                                </button>
                                <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="question.type === 'true_false' ? 'bg-white shadow-sm text-[#1D3557]' : 'text-[#5A6376]'" @click="setType(question, 'true_false')">
                                    True / False
                                </button>
                            </div>
                        </div>
                        <div class="w-28">
                            <label class="field-label">Points</label>
                            <input v-model.number="question.points" type="number" min="1" class="input-field" required />
                        </div>
                    </div>

                    <div>
                        <div class="mb-2 flex items-center justify-between">
                            <label class="field-label mb-0 flex items-center gap-1.5">
                                <ListChecks class="h-4 w-4" :stroke-width="2" />
                                Answer options — select the correct one
                            </label>
                            <button v-if="question.type === 'multiple_choice'" type="button" class="text-xs font-medium hover:text-[#152743]" style="color: #1D3557" @click="addOption(question)">
                                + Add option
                            </button>
                        </div>

                        <div class="space-y-2">
                            <div v-for="(option, oIndex) in question.options" :key="oIndex" class="flex items-center gap-2">
                                <input type="radio" :name="`correct-${qIndex}`" :checked="option.is_correct" class="h-4 w-4 shrink-0" style="color: #1D3557" @change="markCorrect(question, oIndex)" />
                                <input v-model="option.option_text" type="text" class="input-field" :disabled="question.type === 'true_false'" :placeholder="`Option ${oIndex + 1}`" required />
                                <button v-if="question.type === 'multiple_choice' && question.options.length > 2" type="button" class="shrink-0 rounded-md p-2 hover:bg-[#E9EBEF]" style="color: #7C8598" @click="removeOption(question, oIndex)">
                                    <Trash2 class="h-4 w-4" :stroke-width="2" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button type="button" class="btn-secondary w-full justify-center border-dashed" @click="addQuestion">
                <Plus class="h-4 w-4" :stroke-width="2" />
                Add another question
            </button>

            <div class="flex items-center justify-end gap-3 border-t border-[#E9EBEF] pt-6">
                <Link href="/teacher/dashboard" class="btn-secondary">Cancel</Link>
                <button type="submit" class="btn-primary" :disabled="form.processing">
                    Save quiz as draft
                </button>
            </div>
        </form>

</template>

<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { Plus, Trash2, GripVertical, ArrowLeft, ListChecks, Check } from '@lucide/vue';
import { computed } from 'vue';

interface Option {
    option_text: string;
    is_correct: boolean;
}

interface Question {
    question_text: string;
    type: string;
    points: number;
    options: Option[];
}

function newOption(isCorrect = false): Option {
    return { option_text: '', is_correct: isCorrect };
}

function newQuestion(): Question {
    return {
        question_text: '',
        type: 'multiple_choice',
        points: 1,
        options: [newOption(true), newOption(), newOption(), newOption()],
    };
}

const props = defineProps<{
    sections: any[];
    gradeLevels: any[];
    allSections: any[];
    teachers?: any[];
}>();

const filteredSections = computed(() => {
    return props.allSections.filter((s: any) => form.grade_level_ids.includes(s.grade_level_id));
});

const form = useForm({
    title: '',
    description: '',
    grade_level_ids: [] as number[],
    section_ids: [] as number[],
    time_limit_minutes: '',
    teacher_id: null as number | null,
    questions: [newQuestion()],
});

function toggleGrade(id: number) {
    const idx = form.grade_level_ids.indexOf(id);
    if (idx >= 0) {
        form.grade_level_ids.splice(idx, 1);
        form.section_ids = form.section_ids.filter((sid: number) => {
            const sec = props.allSections.find((s: any) => s.id === sid);
            return sec && sec.grade_level_id !== id;
        });
    } else {
        form.grade_level_ids.push(id);
    }
}

function toggleSection(id: number) {
    const idx = form.section_ids.indexOf(id);
    if (idx >= 0) {
        form.section_ids.splice(idx, 1);
    } else {
        form.section_ids.push(id);
    }
}

function addQuestion() {
    form.questions.push(newQuestion());
}

function removeQuestion(index: number) {
    if (form.questions.length > 1) {
        form.questions.splice(index, 1);
    }
}

function setType(question: Question, type: string) {
    question.type = type;
    if (type === 'true_false') {
        question.options = [
            { option_text: 'True', is_correct: true },
            { option_text: 'False', is_correct: false },
        ];
    } else if (question.options.length < 2) {
        question.options = [newOption(true), newOption()];
    }
}

function addOption(question: Question) {
    question.options.push(newOption());
}

function removeOption(question: Question, index: number) {
    if (question.options.length > 2) {
        question.options.splice(index, 1);
    }
}

function markCorrect(question: Question, index: number) {
    question.options.forEach((opt, i) => (opt.is_correct = i === index));
}

function submit() {
    form.post('/teacher/quizzes');
}
</script>
