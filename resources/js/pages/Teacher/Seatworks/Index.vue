<template>
    <Head title="Seatworks" />

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h2 class="text-xl font-bold" style="color: var(--gl-text-primary)">Seatworks</h2>
            <p class="text-sm" style="color: var(--gl-text-secondary)">Manage seatwork activities.</p>
        </div>
        <button @click="openCreate"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="background: linear-gradient(135deg, #10B981, var(--gl-secondary)); box-shadow: 0 0 12px rgba(16,185,129,0.3);">
            <Plus class="h-4 w-4" :stroke-width="2" /> New Seatwork
        </button>
    </div>

    <div v-if="!seatworks.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
            <ClipboardCheck class="h-6 w-6" style="color: var(--gl-text-muted);" :stroke-width="1.75" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No seatworks yet</p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">Create your first seatwork activity.</p>
        <button @click="openCreate" class="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="background: linear-gradient(135deg, #10B981, var(--gl-secondary)); box-shadow: 0 0 12px rgba(16,185,129,0.3);">
            <Plus class="h-4 w-4" :stroke-width="2" /> New Seatwork
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
                    <th class="px-6 py-3 font-medium">Questions</th>
                    <th class="px-6 py-3 font-medium">Attempts</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="sw in seatworks" :key="sw.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ sw.title }}</td>
                    <td class="px-6 py-3 text-xs" style="color: #5A6376">{{ sw.grade_levels ? sw.grade_levels.map((g: any) => g.name).join(', ') : sw.grade }}</td>
                    <td class="px-6 py-3"><Link :href="`/teacher/seatworks/${sw.id}`"><StatusBadge :status="statusLabel(sw)" /></Link></td>
                    <td v-if="isSuperadmin" class="px-6 py-3" style="color: #5A6376">{{ sw.teacher?.name ?? '—' }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ sw.questions_count }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ sw.attempts_count }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-2">
                            <button v-if="isClosed(sw)" @click="reopen(sw)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #1D3557; border-color: #A8DADC" title="Reopen">
                                <RefreshCw class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <Link v-if="isClosed(sw)" :href="`/teacher/seatworks/${sw.id}`" class="rounded-lg border border-[#D2D6DE] px-2.5 py-1.5 text-xs font-medium hover:bg-[#F5F6F8] inline-block" style="color: #1D3557" title="View results">
                                Results
                            </Link>
                            <button v-if="!isClosed(sw)" @click="togglePublish(sw)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" :title="sw.is_published ? 'Unpublish' : 'Publish'">
                                <UploadCloud class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <Link v-if="!isClosed(sw)" :href="`/teacher/seatworks/${sw.id}/edit`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Edit">
                                <Pencil class="h-4 w-4" :stroke-width="2" />
                            </Link>
                            <Link v-if="!isClosed(sw)" :href="`/teacher/seatworks/${sw.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="View">
                                <Eye class="h-4 w-4" :stroke-width="2" />
                            </Link>
                            <button @click="destroySw(sw)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Delete">
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
                    <h3 class="text-base font-semibold" style="color: #1B2231">New seatwork</h3>
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
                                <input v-model="form.title" type="text" class="input-field" placeholder="e.g. Chapter 1 Seatwork" required />
                            </div>
                            <div>
                                <label class="field-label">Instructions (optional)</label>
                                <textarea v-model="form.instructions" rows="2" class="input-field" placeholder="Instructions for students"></textarea>
                            </div>
                            <div>
                                <label class="field-label">Time limit (minutes, optional)</label>
                                <input v-model="form.time_limit_minutes" type="number" min="1" class="input-field" placeholder="e.g. 20" />
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
                                    <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-lg border border-[#E9EBEF] p-4">
                        <div class="mb-3 flex items-center justify-between">
                            <h4 class="text-sm font-semibold" style="color: #1B2231">Questions</h4>
                            <button type="button" @click="addQ" class="rounded-lg border border-[#D2D6DE] p-1.5 hover:bg-[#F5F6F8]" style="color: #5A6376" title="Add question">
                                <Plus class="h-4 w-4" :stroke-width="2" />
                            </button>
                        </div>

                        <div v-for="(q, qi) in form.questions" :key="qi" class="mb-3 rounded-lg border border-[#E9EBEF] p-4">
                            <div class="mb-3 flex items-start justify-between gap-3">
                                <div class="flex-1">
                                    <label class="field-label">Question {{ qi + 1 }}</label>
                                    <input v-model="q.question_text" type="text" class="input-field" placeholder="Enter your question" required />
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    <select v-model="q.type" @change="onTypeChange(q)" class="rounded-lg border border-[#D2D6DE] px-2 py-2 text-xs outline-none" style="color: #404A5C">
                                        <option value="identification">Identification</option>
                                        <option value="enumeration">Enumeration</option>
                                        <option value="true_false">True/False</option>
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="matching">Matching Type</option>
                                    </select>
                                    <input v-model.number="q.points" type="number" min="1" class="w-16 rounded-lg border border-[#D2D6DE] px-2 py-2 text-xs outline-none" placeholder="Pts" />
                                    <button v-if="form.questions.length > 1" type="button" @click="removeQ(qi)" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Remove">
                                        <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                                    </button>
                                </div>
                            </div>

                            <template v-if="q.type === 'identification'">
                                <div>
                                    <label class="field-label text-xs">Correct answer</label>
                                    <input v-model="q.correct_answer" type="text" class="input-field" placeholder="Expected answer" />
                                </div>
                            </template>

                            <template v-if="q.type === 'enumeration'">
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <label class="field-label text-xs">Expected answers</label>
                                        <button type="button" @click="q.enum_items.push('')" class="text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add item</button>
                                    </div>
                                    <div v-for="(item, ei) in q.enum_items" :key="ei" class="flex items-center gap-2">
                                        <span class="text-xs" style="color: #7C8598">{{ ei + 1 }}.</span>
                                        <input v-model="q.enum_items[ei]" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]" placeholder="Answer {{ ei + 1 }}" />
                                        <button v-if="q.enum_items.length > 1" type="button" @click="q.enum_items.splice(ei, 1)" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36"><X class="h-3 w-3" :stroke-width="2" /></button>
                                    </div>
                                </div>
                            </template>

                            <template v-if="q.type === 'true_false' || q.type === 'multiple_choice'">
                                <div class="space-y-2">
                                    <label class="field-label text-xs">Options</label>
                                    <div v-for="(opt, oi) in q.options" :key="oi" class="flex items-center gap-2">
                                        <input :checked="opt.is_correct" @change="setCorrect(q, oi)" type="radio" :name="'opt_' + qi" class="h-4 w-4" style="color: #1D3557" />
                                        <input v-model="opt.option_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]"
                                            :placeholder="q.type === 'true_false' ? (oi === 0 ? 'True' : 'False') : 'Option ' + (oi + 1)"
                                            :readonly="q.type === 'true_false'" required />
                                        <button v-if="q.type === 'multiple_choice' && q.options.length > 2" type="button" @click="q.options.splice(oi, 1)" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36"><X class="h-3 w-3" :stroke-width="2" /></button>
                                    </div>
                                    <button v-if="q.type === 'multiple_choice'" type="button" @click="q.options.push({ option_text: '', is_correct: false })" class="mt-1 text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add option</button>
                                </div>
                            </template>

                            <template v-if="q.type === 'matching'">
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <label class="field-label text-xs">Matching pairs</label>
                                        <button type="button" @click="q.matching_pairs.push({ left_text: '', right_text: '' })" class="text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add pair</button>
                                    </div>
                                    <div v-for="(pair, pi) in q.matching_pairs" :key="pi" class="flex items-center gap-2">
                                        <input v-model="pair.left_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]" placeholder="Left item" />
                                        <span class="text-xs" style="color: #7C8598">→</span>
                                        <input v-model="pair.right_text" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]" placeholder="Right item" />
                                        <button v-if="q.matching_pairs.length > 2" type="button" @click="q.matching_pairs.splice(pi, 1)" class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36"><X class="h-3 w-3" :stroke-width="2" /></button>
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
import { Plus, Eye, Pencil, Trash2, UploadCloud, ClipboardCheck, Check, X, RefreshCw } from '@lucide/vue';
import { ref } from 'vue';

defineProps<{ seatworks: any[]; isSuperadmin?: boolean; teachers?: any[]; gradeLevels: any[] }>();

const page = usePage();
const flash = page.props.flash as any;

interface Opt { option_text: string; is_correct: boolean }
interface Q { question_text: string; type: string; points: number; options: Opt[]; matching_pairs: { left_text: string; right_text: string }[]; correct_answer: string; enum_items: string[] }

function blankQ(): Q {
    return {
        question_text: '', type: 'identification', points: 1,
        options: [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }],
        matching_pairs: [{ left_text: '', right_text: '' }, { left_text: '', right_text: '' }, { left_text: '', right_text: '' }],
        correct_answer: '', enum_items: [''],
    };
}

function onTypeChange(q: Q) {
    if (q.type === 'true_false') { q.options = [{ option_text: 'True', is_correct: true }, { option_text: 'False', is_correct: false }]; }
    else if (q.type === 'multiple_choice') { q.options = [{ option_text: '', is_correct: true }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }, { option_text: '', is_correct: false }]; }
}

function setCorrect(q: Q, oi: number) { q.options.forEach((o, i) => { o.is_correct = i === oi; }); }

const showCreate = ref(false);

const form = useForm({ title: '', instructions: '', time_limit_minutes: '', teacher_id: null as number | null, grade_level_ids: [] as number[], questions: [blankQ()] });

function openCreate() {
    form.reset();
    form.questions = [blankQ()];
    showCreate.value = true;
}

function toggleGrade(id: number) {
    const idx = form.grade_level_ids.indexOf(id);
    if (idx >= 0) { form.grade_level_ids.splice(idx, 1); }
    else { form.grade_level_ids.push(id); }
}

function addQ() { form.questions.push(blankQ()); }
function removeQ(i: number) { form.questions.splice(i, 1); }

function submitForm() {
    form.post('/teacher/seatworks', {
        preserveScroll: true,
        onSuccess: () => { showCreate.value = false; },
    });
}

function togglePublish(sw: any) { router.patch(`/teacher/seatworks/${sw.id}/publish`, {}, { preserveScroll: true }); }

function isClosed(sw: any): boolean {
    if (!sw.closes_at) return false;
    return new Date(sw.closes_at) < new Date();
}

function statusLabel(a: any): string {
    if (!a.is_published) return 'draft';
    if (a.closes_at && new Date(a.closes_at) < new Date()) return 'finished';
    return 'published';
}

function reopen(sw: any) { router.patch(`/teacher/seatworks/${sw.id}/reopen`, {}, { preserveScroll: true }); }
function destroySw(sw: any) {
    if (confirm(`Delete "${sw.title}"?`)) router.delete(`/teacher/seatworks/${sw.id}`, { preserveScroll: true });
}
</script>
