<template>
    <Head :title="'Edit ' + seatwork.title" />

    <button @click="window.history.back()" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" />
        Back
    </button>

    <form class="space-y-6" @submit.prevent="submit">
        <div class="card p-6">
            <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Details</h3>
            <div class="space-y-3">
                <div>
                    <label class="field-label">Title</label>
                    <input v-model="form.title" type="text" class="input-field" required />
                </div>
                <div>
                    <label class="field-label">Instructions (optional)</label>
                    <textarea v-model="form.instructions" rows="2" class="input-field"></textarea>
                </div>
                <div>
                    <label class="field-label">Time limit (minutes, optional)</label>
                    <input v-model="form.time_limit_minutes" type="number" min="1" class="input-field" />
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
                <div v-if="teachers?.length">
                    <label class="field-label">Assign to teacher</label>
                    <select v-model="form.teacher_id" class="input-field">
                        <option :value="null">Select a teacher</option>
                        <option v-for="t in teachers" :key="t.id" :value="t.id" :selected="t.id === seatwork.teacher_id">{{ t.name }}</option>
                    </select>
                </div>
            </div>
        </div>

        <div v-for="(q, qi) in form.questions" :key="qi" class="card p-6">
            <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm font-semibold" style="color: #1B2231">
                    Question {{ qi + 1 }}
                </div>
                <button v-if="form.questions.length > 1" type="button" class="rounded-md p-1.5" style="color: #AA3C36" @click="removeQ(qi)">
                    <Trash2 class="h-4 w-4" :stroke-width="2" />
                </button>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="field-label">Question text</label>
                    <textarea v-model="q.question_text" rows="2" class="input-field" required></textarea>
                </div>

                <div class="flex flex-wrap items-end gap-4">
                    <div>
                        <label class="field-label">Type</label>
                        <div class="flex rounded-lg border border-[#D2D6DE] p-1" style="background-color: #F5F6F8">
                            <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="q.type === 'identification' ? 'bg-white shadow-sm text-[#1D3557]' : 'text-[#5A6376]'" @click="setType(q, 'identification')">ID</button>
                            <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="q.type === 'enumeration' ? 'bg-white shadow-sm text-[#1D3557]' : 'text-[#5A6376]'" @click="setType(q, 'enumeration')">Enum</button>
                            <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="q.type === 'true_false' ? 'bg-white shadow-sm text-[#1D3557]' : 'text-[#5A6376]'" @click="setType(q, 'true_false')">T/F</button>
                            <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="q.type === 'multiple_choice' ? 'bg-white shadow-sm text-[#1D3557]' : 'text-[#5A6376]'" @click="setType(q, 'multiple_choice')">MC</button>
                            <button type="button" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="q.type === 'matching' ? 'bg-white shadow-sm text-[#1D3557]' : 'text-[#5A6376]'" @click="setType(q, 'matching')">Match</button>
                        </div>
                    </div>
                    <div class="w-28">
                        <label class="field-label">Points</label>
                        <input v-model.number="q.points" type="number" min="1" class="input-field" required />
                    </div>
                </div>

                <template v-if="q.type === 'identification'">
                    <div>
                        <label class="field-label">Correct answer</label>
                        <input v-model="q.correct_answer" type="text" class="input-field" />
                    </div>
                </template>

                <template v-if="q.type === 'enumeration'">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <label class="field-label mb-0">Expected answers</label>
                            <button type="button" class="text-xs font-medium hover:text-[#152743]" style="color: #1D3557" @click="q.enum_items.push('')">+ Add item</button>
                        </div>
                        <div v-for="(item, ei) in q.enum_items" :key="ei" class="flex items-center gap-2">
                            <span class="text-xs" style="color: #7C8598">{{ ei + 1 }}.</span>
                            <input v-model="q.enum_items[ei]" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]" />
                            <button v-if="q.enum_items.length > 1" type="button" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" @click="q.enum_items.splice(ei, 1)"><X class="h-3 w-3" :stroke-width="2" /></button>
                        </div>
                    </div>
                </template>

                <template v-if="q.type === 'true_false' || q.type === 'multiple_choice'">
                    <div>
                        <div class="mb-2 flex items-center justify-between">
                            <label class="field-label mb-0">Options</label>
                            <button v-if="q.type === 'multiple_choice'" type="button" class="text-xs font-medium hover:text-[#152743]" style="color: #1D3557" @click="q.options.push({ option_text: '', is_correct: false })">+ Add option</button>
                        </div>
                        <div v-for="(opt, oi) in q.options" :key="oi" class="mb-2 flex items-center gap-2">
                            <input type="radio" :name="'opt_' + qi" :checked="opt.is_correct" class="h-4 w-4 shrink-0" style="color: #1D3557" @change="setCorrect(q, oi)" />
                            <input v-model="opt.option_text" type="text" class="input-field" :readonly="q.type === 'true_false'" :placeholder="q.type === 'true_false' ? (oi === 0 ? 'True' : 'False') : 'Option ' + (oi + 1)" required />
                            <button v-if="q.type === 'multiple_choice' && q.options.length > 2" type="button" class="shrink-0 rounded-md p-2 hover:bg-[#E9EBEF]" style="color: #7C8598" @click="q.options.splice(oi, 1)">
                                <Trash2 class="h-4 w-4" :stroke-width="2" />
                            </button>
                        </div>
                    </div>
                </template>

                <template v-if="q.type === 'matching'">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <label class="field-label mb-0">Matching pairs</label>
                            <button type="button" class="text-xs font-medium hover:text-[#152743]" style="color: #1D3557" @click="q.matching_pairs.push({ left_text: '', right_text: '' })">+ Add pair</button>
                        </div>
                        <div v-for="(pair, pi) in q.matching_pairs" :key="pi" class="flex items-center gap-2">
                            <input v-model="pair.left_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]" placeholder="Left" />
                            <span class="text-xs" style="color: #7C8598">→</span>
                            <input v-model="pair.right_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]" placeholder="Right" />
                            <button v-if="q.matching_pairs.length > 2" type="button" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" @click="q.matching_pairs.splice(pi, 1)"><X class="h-3 w-3" :stroke-width="2" /></button>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <button type="button" class="btn-secondary w-full justify-center border-dashed" @click="addQ">
            <Plus class="h-4 w-4" :stroke-width="2" />
            Add another question
        </button>

        <div class="flex items-center justify-end gap-3 border-t border-[#E9EBEF] pt-6">
            <Link :href="`/teacher/seatworks/${seatwork.id}`" class="btn-secondary">Cancel</Link>
            <button type="submit" class="btn-primary" :disabled="form.processing">Update seatwork</button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { Plus, Trash2, ArrowLeft, X, Check } from '@lucide/vue';

interface Opt { option_text: string; is_correct: boolean }
interface Q { question_text: string; type: string; points: number; options: Opt[]; matching_pairs: { left_text: string; right_text: string }[]; correct_answer: string; enum_items: string[] }

const props = defineProps<{ seatwork: any; teachers?: any[]; gradeLevels: any[] }>();

function mapSeatworkToForm(sw: any) {
    return {
        title: sw.title,
        instructions: sw.instructions ?? '',
        time_limit_minutes: sw.time_limit_minutes ?? '',
        teacher_id: sw.teacher_id ?? null,
        grade_level_ids: sw.grade_levels ? sw.grade_levels.map((g: any) => g.id) : [],
        questions: sw.questions.map((q: any) => {
            const base: Q = {
                question_text: q.question_text,
                type: q.type,
                points: q.points,
                options: q.options?.map((o: any) => ({ option_text: o.option_text, is_correct: o.is_correct })) ?? [],
                matching_pairs: q.matching_pairs?.map((p: any) => ({ left_text: p.left_text, right_text: p.right_text })) ?? [],
                correct_answer: '',
                enum_items: [''],
            };
            if (q.type === 'identification') {
                base.correct_answer = q.options?.[0]?.option_text ?? '';
            }
            if (q.type === 'enumeration') {
                base.enum_items = q.options?.map((o: any) => o.option_text) ?? [''];
            }
            return base;
        }),
    };
}

const form = useForm(mapSeatworkToForm(props.seatwork));

function blankQ(): Q {
    return {
        question_text: '', type: 'identification', points: 1,
        options: [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }],
        matching_pairs: [{ left_text: '', right_text: '' }, { left_text: '', right_text: '' }, { left_text: '', right_text: '' }],
        correct_answer: '', enum_items: [''],
    };
}

function addQ() { form.questions.push(blankQ()); }
function removeQ(i: number) { form.questions.splice(i, 1); }

function setType(q: Q, type: string) {
    q.type = type;
    if (type === 'true_false') {
        q.options = [{ option_text: 'True', is_correct: true }, { option_text: 'False', is_correct: false }];
    } else if (type === 'multiple_choice') {
        q.options = [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }];
    }
}

function setCorrect(q: Q, oi: number) { q.options.forEach((o, i) => { o.is_correct = i === oi; }); }

function toggleGrade(id: number) {
    const idx = form.grade_level_ids.indexOf(id);
    if (idx >= 0) { form.grade_level_ids.splice(idx, 1); }
    else { form.grade_level_ids.push(id); }
}

function submit() {
    form.put(`/teacher/seatworks/${props.seatwork.id}`);
}
</script>