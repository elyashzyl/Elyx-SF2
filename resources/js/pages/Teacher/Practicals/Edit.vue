<template>
    <Head :title="'Edit ' + practical.title" />

    <Link :href="`/teacher/practicals/${practical.id}`" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" />
        Back to practical
    </Link>

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
                <div class="sm:col-span-2">
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
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="field-label">Time limit (minutes, optional)</label>
                        <input v-model="form.time_limit_minutes" type="number" min="1" class="input-field" />
                    </div>
                    <div>
                        <label class="field-label">Max score</label>
                        <input v-model.number="form.max_score" type="number" min="1" class="input-field" />
                    </div>
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

        <div class="card p-6">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-sm font-semibold" style="color: #1B2231">Rubric criteria</h3>
                <button type="button" class="rounded-lg border border-[#D2D6DE] p-1.5 hover:bg-[#F5F6F8]" style="color: #5A6376" title="Add criterion" @click="addCriterion">
                    <Plus class="h-4 w-4" :stroke-width="2" />
                </button>
            </div>

            <div v-for="(c, ci) in form.criteria" :key="ci" class="mb-4 rounded-lg border border-[#E9EBEF] p-4">
                <div class="mb-3 flex items-start justify-between gap-3">
                    <div class="flex-1">
                        <label class="field-label">Criterion {{ ci + 1 }}</label>
                        <input v-model="c.criterion_name" type="text" class="input-field" required />
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <div class="w-20">
                            <label class="field-label text-xs">Max pts</label>
                            <input v-model.number="c.max_points" type="number" min="1" class="w-full rounded-lg border border-[#D2D6DE] px-2 py-1.5 text-xs outline-none" />
                        </div>
                        <button v-if="form.criteria.length > 1" type="button" class="mt-5 rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Remove" @click="form.criteria.splice(ci, 1)">
                            <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                        </button>
                    </div>
                </div>
                <div>
                    <label class="field-label text-xs">Description (optional)</label>
                    <input v-model="c.description" type="text" class="input-field" />
                </div>
            </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-[#E9EBEF] pt-6">
            <Link :href="`/teacher/practicals/${practical.id}`" class="btn-secondary">Cancel</Link>
            <button type="submit" class="btn-primary" :disabled="form.processing">Update practical</button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { Plus, Trash2, ArrowLeft, Check } from '@lucide/vue';

const props = defineProps<{ practical: any; teachers?: any[]; gradeLevels: any[] }>();

function mapPracticalToForm(p: any) {
    return {
        title: p.title,
        instructions: p.instructions ?? '',
        time_limit_minutes: p.time_limit_minutes ?? '',
        max_score: p.max_score ?? 100,
        teacher_id: p.teacher_id ?? null,
        grade_level_ids: p.grade_levels ? p.grade_levels.map((g: any) => g.id) : [],
        criteria: p.criteria.map((c: any) => ({
            criterion_name: c.criterion_name,
            description: c.description ?? '',
            max_points: c.max_points,
        })),
    };
}

const form = useForm(mapPracticalToForm(props.practical));

function toggleGrade(id: number) {
    const idx = form.grade_level_ids.indexOf(id);
    if (idx >= 0) { form.grade_level_ids.splice(idx, 1); }
    else { form.grade_level_ids.push(id); }
}

function addCriterion() {
    form.criteria.push({ criterion_name: '', description: '', max_points: 10 });
}

function submit() {
    form.put(`/teacher/practicals/${props.practical.id}`);
}
</script>