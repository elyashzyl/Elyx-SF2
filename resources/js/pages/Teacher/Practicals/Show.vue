<template>
    <Head :title="practical.title" />
    <Link href="/teacher/practicals" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back to practicals
    </Link>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <div class="flex items-center gap-2.5">
                <h2 class="text-lg font-semibold" style="color: #1B2231">{{ practical.title }}</h2>
                <StatusBadge :status="practical.is_published ? 'published' : 'draft'" />
            </div>
            <p class="mt-1 text-sm" style="color: #5A6376">{{ practical.criteria.length }} criteria · {{ totalMax }} points max</p>
            <p v-if="practical.instructions" class="mt-2 text-sm" style="color: #404A5C">{{ practical.instructions }}</p>
        </div>
        <div class="flex items-center gap-2">
            <Link :href="`/teacher/practicals/${practical.id}/edit`" class="btn-secondary">
                <Pencil class="h-4 w-4" :stroke-width="2" />
                Edit
            </Link>

        </div>
    </div>

    <div v-if="teachers?.length" class="mb-6 card flex flex-wrap items-center gap-3 px-5 py-3">
        <span class="text-sm font-medium" style="color: #404A5C">Assigned to:</span>
        <select ref="reassignSelect" class="rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]">
            <option v-for="t in teachers" :key="t.id" :value="t.id" :selected="t.id === practical.teacher_id">{{ t.name }}</option>
        </select>
        <button @click="reassign" class="btn-secondary text-xs">Reassign</button>
    </div>

    <div class="mb-6 card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Criterion</th>
                    <th class="px-6 py-3 font-medium">Description</th>
                    <th class="px-6 py-3 font-medium">Max points</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="c in practical.criteria" :key="c.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ c.criterion_name }}</td>
                    <td class="px-6 py-3 text-xs" style="color: #5A6376">{{ c.description ?? '—' }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ c.max_points }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div v-if="attempts.length">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Attempts</h3>
        <div class="card overflow-hidden">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                        <th class="px-6 py-3 font-medium">Student</th>
                        <th class="px-6 py-3 font-medium">Grade</th>
                        <th v-for="c in practical.criteria" :key="c.id" class="px-6 py-3 font-medium text-xs">{{ c.criterion_name }}</th>
                        <th class="px-6 py-3 font-medium">Status</th>
                        <th class="px-6 py-3 font-medium">Total</th>
                        <th class="px-6 py-3 font-medium">Submission</th>
                        <th class="px-6 py-3 font-medium">Submitted</th>
                        <th class="px-6 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#E9EBEF]">
                    <tr v-for="a in attempts" :key="a.id" class="hover:bg-[#F9FAFB]">
                        <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ a.student?.name }}</td>
                        <td class="px-6 py-3" style="color: #5A6376">{{ a.student?.grade ?? '—' }}</td>
                        <td v-for="c in practical.criteria" :key="c.id" class="px-6 py-3" style="color: #5A6376">
                            {{ a.scores?.find((s: any) => s.criterion_id === c.id)?.score ?? '—' }}
                        </td>
                        <td class="px-6 py-3"><StatusBadge :status="a.status" /></td>
                        <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ a.status === 'submitted' ? a.total_score + ' / ' + totalMax : '—' }}</td>
                        <td class="px-6 py-3">
                            <div v-if="a.submission_file" class="flex items-center gap-2">
                                <img :src="'/storage/' + a.submission_file" class="h-10 w-10 rounded object-cover border border-[#E9EBEF]" @click="previewImg = '/storage/' + a.submission_file" style="cursor:pointer" />
                                <span class="text-xs" style="color: #7C8598">Image</span>
                            </div>
                            <span v-else-if="a.submission_text" class="text-xs" style="color: #5A6376">{{ a.submission_text.substring(0, 60) }}{{ a.submission_text.length > 60 ? '...' : '' }}</span>
                            <span v-else class="text-xs" style="color: #7C8598">—</span>
                        </td>
                        <td class="px-6 py-3 text-xs" style="color: #7C8598">{{ a.submitted_at ? formatDate(a.submitted_at) : '—' }}</td>
                        <td class="px-6 py-3">
                            <div class="flex items-center gap-2">
                                <Link :href="`/teacher/practicals/${practical.id}/grade/${a.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Grade">
                                    <Eye class="h-3.5 w-3.5" :stroke-width="2" />
                                </Link>
                                <Link :href="`/teacher/practicals/${practical.id}/recheck/${a.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Recheck">
                                    <ClipboardCheck class="h-3.5 w-3.5" :stroke-width="2" />
                                </Link>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <Teleport to="body">
        <div v-if="previewImg" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="previewImg = null">
            <div class="relative max-w-3xl max-h-[90vh] p-4">
                <button @click="previewImg = null" class="absolute -top-2 -right-2 rounded-full bg-white p-1.5 shadow-md hover:bg-gray-100" style="color: #5A6376">
                    <X class="h-4 w-4" :stroke-width="2" />
                </button>
                <img :src="previewImg" class="max-h-[85vh] rounded-lg shadow-2xl" />
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { ArrowLeft, Pencil, Eye, ClipboardCheck, X } from '@lucide/vue';

const previewImg = ref<string | null>(null);

const props = defineProps<{ practical: any; attempts: any[]; teachers?: any[] }>();

const totalMax = computed(() => props.practical.criteria.reduce((s: number, c: any) => s + c.max_points, 0));

const reassignSelect = ref<HTMLSelectElement | null>(null);

function reassign() {
    if (!reassignSelect.value) return;
    router.patch(`/teacher/practicals/${props.practical.id}/reassign`, {
        teacher_id: reassignSelect.value.value,
    }, { preserveScroll: true });
}

function formatDate(v: string): string {
    return v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

</script>
