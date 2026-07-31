<template>
    <Head :title="'Edit ' + practical.title" />

    <Link :href="`/teacher/practicals/${practical.id}`" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--gl-text-primary)]" style="color: var(--gl-text-secondary);">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back to practical
    </Link>

    <!-- Hero -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-6 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(124,58,237,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary)); box-shadow: 0 0 20px rgba(239,68,68,0.3);">
                <Pencil class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Edit Mission</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">Update {{ practical.title }} — adjust rubric criteria, scoring, and settings.</p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, #EF4444, transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <form class="space-y-6" @submit.prevent="submit">
        <!-- Details -->
        <div class="gl-glow-card p-6">
            <h3 class="mb-4 text-sm font-semibold" style="color: var(--gl-text-primary)">Mission Details</h3>
            <div class="space-y-4">
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">Title</label>
                    <input v-model="form.title" type="text" class="input-field" required />
                </div>
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">Instructions</label>
                    <textarea v-model="form.instructions" rows="2" class="input-field"></textarea>
                </div>
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">Grade levels</label>
                    <div class="flex flex-wrap gap-2">
                        <button v-for="gl in gradeLevels" :key="gl.id" type="button"
                            class="rounded-lg border px-3.5 py-2 text-sm font-medium transition-all"
                            :style="form.grade_level_ids.includes(gl.id) ? { background: 'rgba(59,130,246,0.1)', borderColor: 'var(--gl-primary)', color: 'var(--gl-primary)' } : { borderColor: 'var(--gl-border)', color: 'var(--gl-text-secondary)' }"
                            @click="toggleGrade(gl.id)">
                            <Check v-if="form.grade_level_ids.includes(gl.id)" class="-ml-0.5 mr-1.5 inline h-4 w-4" :stroke-width="2.5" />
                            {{ gl.name }}
                        </button>
                    </div>
                    <p v-if="form.errors.grade_level_ids" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ form.errors.grade_level_ids }}</p>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="field-label" style="color: var(--gl-text-secondary);">Time limit (min)</label>
                        <input v-model="form.time_limit_minutes" type="number" min="1" class="input-field" />
                    </div>
                    <div>
                        <label class="field-label" style="color: var(--gl-text-secondary);">Max score</label>
                        <input v-model.number="form.max_score" type="number" min="1" class="input-field" />
                    </div>
                    <div>
                        <label class="field-label" style="color: var(--gl-text-secondary);">Max attempts</label>
                        <input v-model.number="form.max_attempts" type="number" min="1" max="10" class="input-field" />
                    </div>
                </div>
                <div v-if="teachers?.length">
                    <label class="field-label" style="color: var(--gl-text-secondary);">Assign to teacher</label>
                    <select v-model="form.teacher_id" class="input-field">
                        <option :value="null">Select a teacher</option>
                        <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Rubric -->
        <div class="gl-glow-card p-6">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Rubric Criteria</h3>
                <button type="button" @click="addCriterion"
                    class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all text-white"
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">
                    <Plus class="h-3.5 w-3.5" :stroke-width="2" /> Add Criterion
                </button>
            </div>

            <div v-for="(c, ci) in form.criteria" :key="ci" class="mb-4 rounded-xl p-4" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                <div class="mb-3 flex items-start justify-between gap-3">
                    <div class="flex-1">
                        <label class="field-label" style="color: var(--gl-text-secondary);">Criterion {{ ci + 1 }}</label>
                        <input v-model="c.criterion_name" type="text" class="input-field" required />
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <div class="w-20">
                            <label class="block mb-1 text-xs font-medium" style="color: var(--gl-text-secondary);">Max pts</label>
                            <input v-model.number="c.max_points" type="number" min="1"
                                class="w-full rounded-lg border px-2 py-1.5 text-xs outline-none"
                                style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                        </div>
                        <button v-if="form.criteria.length > 1" type="button" class="mt-5 rounded-lg p-1.5 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-danger);" title="Remove" @click="form.criteria.splice(ci, 1)">
                            <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block mb-1 text-xs font-medium" style="color: var(--gl-text-secondary);">Description</label>
                    <input v-model="c.description" type="text" class="input-field" />
                </div>
            </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-6" style="border-top: 1px solid var(--gl-border);">
            <Link :href="`/teacher/practicals/${practical.id}`" class="rounded-xl px-4 py-2.5 text-sm font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</Link>
            <button type="submit" :disabled="form.processing" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">Update Practical</button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { Plus, Trash2, ArrowLeft, Check, Pencil } from '@lucide/vue';

const props = defineProps<{ practical: any; teachers?: any[]; gradeLevels: any[] }>();

function mapPracticalToForm(p: any) {
    return {
        title: p.title, instructions: p.instructions ?? '', time_limit_minutes: p.time_limit_minutes ?? '',
        max_score: p.max_score ?? 100, max_attempts: p.max_attempts ?? 3,
        teacher_id: p.teacher_id ?? null,
        grade_level_ids: p.grade_levels ? p.grade_levels.map((g: any) => g.id) : [],
        criteria: p.criteria.map((c: any) => ({ criterion_name: c.criterion_name, description: c.description ?? '', max_points: c.max_points })),
    };
}

const form = useForm(mapPracticalToForm(props.practical));

function toggleGrade(id: number) { const idx = form.grade_level_ids.indexOf(id); if (idx >= 0) form.grade_level_ids.splice(idx, 1); else form.grade_level_ids.push(id); }
function addCriterion() { form.criteria.push({ criterion_name: '', description: '', max_points: 10 }); }
function submit() { form.put(`/teacher/practicals/${props.practical.id}`); }
</script>
