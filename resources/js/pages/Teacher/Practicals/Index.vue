<template>
    <Head title="Practicals" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h2 class="text-lg font-semibold" style="color: #1B2231">Practicals</h2>
            <p class="text-sm" style="color: #5A6376">Manage practical activities.</p>
        </div>
        <button @click="showCreate = true" class="btn-primary">
            <Plus class="h-4 w-4" :stroke-width="2" />
            New Practical
        </button>
    </div>

    <div v-if="!practicals.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <FlaskConical class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No practicals yet</p>
        <p class="mt-1 text-sm" style="color: #7C8598">Create a practical activity with rubric criteria.</p>
        <button @click="showCreate = true" class="btn-primary mt-4">
            <Plus class="h-4 w-4" :stroke-width="2" />
            New Practical
        </button>
    </div>

    <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Title</th>
                    <th class="px-6 py-3 font-medium">Status</th>
                    <th v-if="isSuperadmin" class="px-6 py-3 font-medium">Teacher</th>
                    <th class="px-6 py-3 font-medium">Criteria</th>
                    <th class="px-6 py-3 font-medium">Attempts</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="p in practicals" :key="p.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ p.title }}</td>
                    <td class="px-6 py-3"><StatusBadge :status="p.is_published ? 'published' : 'draft'" /></td>
                    <td v-if="isSuperadmin" class="px-6 py-3" style="color: #5A6376">{{ p.teacher?.name ?? '—' }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ p.criteria_count }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ p.attempts_count }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-2">
                            <button @click="togglePublish(p)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" :title="p.is_published ? 'Unpublish' : 'Publish'">
                                <UploadCloud class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <Link :href="`/teacher/practicals/${p.id}/edit`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Edit">
                                <Pencil class="h-4 w-4" :stroke-width="2" />
                            </Link>
                            <Link :href="`/teacher/practicals/${p.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="View">
                                <Eye class="h-4 w-4" :stroke-width="2" />
                            </Link>
                            <button @click="destroyP(p)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Delete">
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
                    <h3 class="text-base font-semibold" style="color: #1B2231">New practical</h3>
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
                                <input v-model="form.title" type="text" class="input-field" placeholder="e.g. Lab Activity 1" required />
                            </div>
                            <div>
                                <label class="field-label">Instructions (optional)</label>
                                <textarea v-model="form.instructions" rows="2" class="input-field" placeholder="Instructions for students"></textarea>
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

                    <div class="rounded-lg border border-[#E9EBEF] p-4">
                        <div class="mb-3 flex items-center justify-between">
                            <h4 class="text-sm font-semibold" style="color: #1B2231">Rubric criteria</h4>
                            <button type="button" @click="addCriterion" class="rounded-lg border border-[#D2D6DE] p-1.5 hover:bg-[#F5F6F8]" style="color: #5A6376" title="Add criterion">
                                <Plus class="h-4 w-4" :stroke-width="2" />
                            </button>
                        </div>

                        <div v-for="(c, ci) in form.criteria" :key="ci" class="mb-3 rounded-lg border border-[#E9EBEF] p-4">
                            <div class="mb-3 flex items-start justify-between gap-3">
                                <div class="flex-1">
                                    <label class="field-label">Criterion {{ ci + 1 }}</label>
                                    <input v-model="c.criterion_name" type="text" class="input-field" placeholder="e.g. Accuracy" required />
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    <div class="w-20">
                                        <label class="field-label text-xs">Max pts</label>
                                        <input v-model.number="c.max_points" type="number" min="1" class="w-full rounded-lg border border-[#D2D6DE] px-2 py-1.5 text-xs outline-none" />
                                    </div>
                                    <button v-if="form.criteria.length > 1" type="button" @click="form.criteria.splice(ci, 1)" class="mt-5 rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Remove">
                                        <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="field-label text-xs">Description (optional)</label>
                                <input v-model="c.description" type="text" class="input-field" placeholder="Describe what to assess" />
                            </div>
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
import { Plus, Eye, Pencil, Trash2, UploadCloud, FlaskConical, X } from '@lucide/vue';
import { ref } from 'vue';

defineProps<{ practicals: any[]; isSuperadmin?: boolean; teachers?: any[] }>();

const page = usePage();
const flash = page.props.flash as any;

const showCreate = ref(false);

const form = useForm({
    title: '', instructions: '', time_limit_minutes: '', max_score: 100, teacher_id: null as number | null,
    criteria: [{ criterion_name: '', description: '', max_points: 10 }],
});

function addCriterion() { form.criteria.push({ criterion_name: '', description: '', max_points: 10 }); }

function submitForm() { form.post('/teacher/practicals', { preserveScroll: true, onSuccess: () => { showCreate.value = false; } }); }

function togglePublish(p: any) { router.patch(`/teacher/practicals/${p.id}/publish`, {}, { preserveScroll: true }); }

function destroyP(p: any) {
    if (confirm(`Delete "${p.title}"?`)) router.delete(`/teacher/practicals/${p.id}`, { preserveScroll: true });
}
</script>
