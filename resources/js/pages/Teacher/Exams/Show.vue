<template>
    <Head :title="exam.title" />
    <Link href="/teacher/exams" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back to exams
    </Link>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <div class="flex items-center gap-2.5">
                <h2 class="text-lg font-semibold" style="color: #1B2231">{{ exam.title }}</h2>
                <StatusBadge :status="statusLabel" />
            </div>
            <p class="mt-1 text-sm" style="color: #5A6376">
                <template v-if="exam.grade_levels">{{ exam.grade_levels.map((g: any) => g.name).join(', ') }}</template>
                · {{ exam.sections.length }} sections · {{ exam.max_score }} points max
                <template v-if="exam.closes_at">
                    · <span :style="{ color: isClosed ? '#AA3C36' : '#2B9348' }">{{ isClosed ? 'Closed' : 'Closes ' + timeRemaining(exam.closes_at) }}</span>
                </template>
            </p>
            <p v-if="exam.instructions" class="mt-2 text-sm" style="color: #404A5C">{{ exam.instructions }}</p>
        </div>
        <div class="flex items-center gap-2">
            <button v-if="!isClosed" @click="togglePublish" class="btn-secondary">
                <UploadCloud class="h-4 w-4" :stroke-width="2" />
                {{ exam.is_published ? 'Unpublish' : 'Publish' }}
            </button>
            <button v-if="isClosed" @click="toggleReopen" class="btn-secondary" style="color: #1D3557; border-color: #A8DADC">
                <RefreshCw class="h-4 w-4" :stroke-width="2" />
                Reopen
            </button>
        </div>
    </div>

    <div v-if="teachers?.length" class="mb-6 card flex flex-wrap items-center gap-3 px-5 py-3">
        <span class="text-sm font-medium" style="color: #404A5C">Assigned to:</span>
        <select ref="reassignSelect" class="rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]">
            <option v-for="t in teachers" :key="t.id" :value="t.id" :selected="t.id === exam.teacher_id">{{ t.name }}</option>
        </select>
        <button @click="reassign" class="btn-secondary text-xs">Reassign</button>
    </div>

    <div v-for="(sec, si) in exam.sections" :key="sec.id" class="mb-6 card">
        <div class="mb-3 flex items-center gap-2">
            <FileText v-if="sec.section_type === 'questions'" class="h-4 w-4" :stroke-width="2" style="color: #5A6376" />
            <ClipboardCheck v-else class="h-4 w-4" :stroke-width="2" style="color: #5A6376" />
            <h3 class="text-sm font-semibold" style="color: #1B2231">{{ sec.title }}</h3>
            <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs" style="color: #5A6376">Section {{ si + 1 }}</span>
            <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs capitalize" style="color: #5A6376">{{ sec.section_type }}</span>
        </div>
        <p v-if="sec.instructions" class="mb-3 text-sm" style="color: #5A6376">{{ sec.instructions }}</p>

        <template v-if="sec.section_type === 'questions' && sec.questions.length">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                        <th class="px-4 py-2 font-medium">#</th>
                        <th class="px-4 py-2 font-medium">Question</th>
                        <th class="px-4 py-2 font-medium">Type</th>
                        <th class="px-4 py-2 font-medium">Points</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#E9EBEF]">
                    <tr v-for="(q, qi) in sec.questions" :key="q.id" class="hover:bg-[#F9FAFB]">
                        <td class="px-4 py-2 text-xs" style="color: #7C8598">{{ qi + 1 }}</td>
                        <td class="px-4 py-2 max-w-md" style="color: #1B2231">
                            <p class="truncate">{{ q.question_text }}</p>
                            <div v-if="q.type === 'multiple_choice' || q.type === 'true_false'" class="mt-1 space-y-0.5">
                                <div v-for="o in q.options" :key="o.id" class="flex items-center gap-1.5">
                                    <span class="inline-block h-1.5 w-1.5 rounded-full" :class="o.is_correct ? 'bg-[#2F7A54]' : 'bg-[#D2D6DE]'"></span>
                                    <span class="text-xs" :class="o.is_correct ? 'font-medium text-[#2F7A54]' : 'text-[#7C8598]'">{{ o.option_text }}</span>
                                </div>
                            </div>
                            <div v-if="q.type === 'matching'" class="mt-1 space-y-0.5">
                                <div v-for="p in q.matching_pairs" :key="p.id" class="flex gap-2 text-xs" style="color: #5A6376">
                                    <span>{{ p.left_text }}</span>
                                    <span style="color: #7C8598">→</span>
                                    <span class="font-medium text-[#2F7A54]">{{ p.right_text }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-2 text-xs capitalize" style="color: #5A6376">{{ q.type.replace('_', ' ') }}</td>
                        <td class="px-4 py-2 text-xs" style="color: #5A6376">{{ q.points }}</td>
                    </tr>
                </tbody>
            </table>
        </template>

        <template v-if="sec.section_type === 'practical' && sec.criteria.length">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                        <th class="px-4 py-2 font-medium">Criterion</th>
                        <th class="px-4 py-2 font-medium">Description</th>
                        <th class="px-4 py-2 font-medium">Max points</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#E9EBEF]">
                    <tr v-for="c in sec.criteria" :key="c.id" class="hover:bg-[#F9FAFB]">
                        <td class="px-4 py-2 text-sm font-medium" style="color: #1B2231">{{ c.criterion_name }}</td>
                        <td class="px-4 py-2 text-xs" style="color: #5A6376">{{ c.description ?? '—' }}</td>
                        <td class="px-4 py-2 text-xs" style="color: #5A6376">{{ c.max_points }}</td>
                    </tr>
                </tbody>
            </table>
        </template>
    </div>

    <div v-if="attempts.length">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Attempts</h3>
        <div class="card overflow-hidden">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                        <th class="px-6 py-3 font-medium">Student</th>
                        <th class="px-6 py-3 font-medium">Grade</th>
                        <th class="px-6 py-3 font-medium">Total</th>
                        <th class="px-6 py-3 font-medium">Submitted</th>
                        <th class="px-6 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#E9EBEF]">
                    <tr v-for="a in attempts" :key="a.id" class="hover:bg-[#F9FAFB]">
                        <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ a.student?.name }}</td>
                        <td class="px-6 py-3" style="color: #5A6376">{{ a.student?.grade ?? '—' }}</td>
                        <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ a.total_score }} / {{ exam.max_score }}</td>
                        <td class="px-6 py-3 text-xs" style="color: #7C8598">{{ formatDate(a.submitted_at) }}</td>
                        <td class="px-6 py-3">
                            <Link :href="`/teacher/exams/${exam.id}/attempts`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Recheck">
                                <Eye class="h-3.5 w-3.5" :stroke-width="2" />
                            </Link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { ArrowLeft, Eye, FileText, ClipboardCheck, UploadCloud, RefreshCw } from '@lucide/vue';
import { computed, ref } from 'vue';

const props = defineProps<{ exam: any; attempts: any[]; teachers?: any[] }>();

const isClosed = computed(() => {
    if (!props.exam.closes_at) return false;
    return new Date(props.exam.closes_at) < new Date();
});

const statusLabel = computed(() => {
    if (!props.exam.is_published) return 'draft';
    if (isClosed.value) return 'finished';
    return 'published';
});

const reassignSelect = ref<HTMLSelectElement | null>(null);

function reassign() {
    if (!reassignSelect.value) return;
    router.patch(`/teacher/exams/${props.exam.id}/reassign`, {
        teacher_id: reassignSelect.value.value,
    }, { preserveScroll: true });
}

function formatDate(v: string): string {
    return v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function timeRemaining(dt: string): string {
    const diff = new Date(dt).getTime() - Date.now();
    if (diff <= 0) return 'now';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `in ${h}h ${m}m`;
}

function togglePublish() {
    router.patch(`/teacher/exams/${props.exam.id}/publish`, {}, { preserveScroll: true });
}

function toggleReopen() {
    router.patch(`/teacher/exams/${props.exam.id}/reopen`, {}, { preserveScroll: true });
}
</script>
