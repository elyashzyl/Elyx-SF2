<template>
    <Head :title="seatwork.title" />
    <button @click="window.history.back()" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back
    </button>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <div class="flex items-center gap-2.5">
                <h2 class="text-lg font-semibold" style="color: #1B2231">{{ seatwork.title }}</h2>
                <StatusBadge :status="seatwork.is_published ? 'published' : 'draft'" />
            </div>
            <p class="mt-1 text-sm" style="color: #5A6376">
                <template v-if="seatwork.grade_levels">{{ seatwork.grade_levels.map((g: any) => g.name).join(', ') }} · </template>
                {{ seatwork.questions.length }} questions · {{ totalPoints }} points
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Link :href="`/teacher/seatworks/${seatwork.id}/edit`" class="btn-secondary">
                <Pencil class="h-4 w-4" :stroke-width="2" />
                Edit
            </Link>
        </div>
    </div>

    <div v-if="teachers?.length" class="mb-6 card flex flex-wrap items-center gap-3 px-5 py-3">
        <span class="text-sm font-medium" style="color: #404A5C">Assigned to:</span>
        <select ref="reassignSelect" class="rounded-lg border border-[#D2D6DE] px-3 py-1.5 text-sm outline-none focus:border-[#1D3557]">
            <option v-for="t in teachers" :key="t.id" :value="t.id" :selected="t.id === seatwork.teacher_id">{{ t.name }}</option>
        </select>
        <button @click="reassign" class="btn-secondary text-xs">Reassign</button>
    </div>

    <div class="space-y-3">
        <div v-for="(q, qi) in seatwork.questions" :key="q.id" class="card p-4">
            <div class="mb-2 flex items-center gap-2">
                <span class="text-xs font-semibold uppercase tracking-wider" style="color: #7C8598">{{ qi + 1 }}. {{ typeLabel(q.type) }}</span>
                <span class="text-xs" style="color: #5A6376">{{ q.points }} pt{{ q.points !== 1 ? 's' : '' }}</span>
            </div>
            <p class="text-sm font-medium" style="color: #1B2231">{{ q.question_text }}</p>

            <div v-if="q.type === 'identification'" class="mt-2 text-xs" style="color: #5A6376">Answer: {{ q.options?.[0]?.option_text ?? '—' }}</div>

            <div v-if="q.type === 'enumeration'" class="mt-2 space-y-0.5 text-xs" style="color: #5A6376">
                <div v-for="(opt, oi) in q.options" :key="oi">{{ oi + 1 }}. {{ opt.option_text }}</div>
            </div>

            <div v-if="q.type === 'true_false' || q.type === 'multiple_choice'" class="mt-2 space-y-1">
                <div v-for="(opt, oi) in q.options" :key="oi" class="flex items-center gap-2 text-xs">
                    <span :class="opt.is_correct ? 'font-semibold text-[#2F7A54]' : 'text-[#5A6376]'">
                        {{ opt.is_correct ? '✓' : '○' }} {{ opt.option_text }}
                    </span>
                </div>
            </div>

            <div v-if="q.type === 'matching'" class="mt-2 grid grid-cols-2 gap-2 text-xs" style="color: #5A6376">
                <div v-for="(p, pi) in q.matching_pairs" :key="pi" class="flex items-center gap-2 border-b border-[#E9EBEF] py-1">
                    <span>{{ p.left_text }}</span>
                    <span class="text-[#7C8598]">→</span>
                    <span class="font-medium" style="color: #2F7A54">{{ p.right_text }}</span>
                </div>
            </div>
        </div>
    </div>

    <div v-if="attempts.length" class="mt-8">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Attempts</h3>
        <div class="card overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Student</th><th class="px-6 py-3 font-medium">Grade</th>
                    <th class="px-6 py-3 font-medium">Score</th><th class="px-6 py-3 font-medium">Submitted</th><th class="px-6 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody class="divide-y divide-[#E9EBEF]">
                    <tr v-for="a in attempts" :key="a.id" class="hover:bg-[#F9FAFB]">
                        <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ a.student?.name }}</td>
                        <td class="px-6 py-3" style="color: #5A6376">{{ a.student?.grade ?? '—' }}</td>
                        <td class="px-6 py-3" style="color: #5A6376">{{ a.score }} / {{ a.total_points }}</td>
                        <td class="px-6 py-3 text-xs" style="color: #7C8598">{{ formatDate(a.submitted_at) }}</td>
                        <td class="px-6 py-3">
                            <div class="flex items-center gap-1.5">
                                <button @click="autoRecheck(a.id)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Auto recheck">
                                    <RotateCw class="h-3.5 w-3.5" :stroke-width="2" />
                                </button>
                                <Link :href="`/teacher/seatworks/${seatwork.id}/recheck/${a.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Recheck">
                                    <Eye class="h-3.5 w-3.5" :stroke-width="2" />
                                </Link>
                            </div>
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
import { ArrowLeft, Eye, Pencil, RotateCw } from '@lucide/vue';
import { ref } from 'vue';

const props = defineProps<{ seatwork: any; attempts: any[]; totalPoints: number; teachers?: any[] }>();

const reassignSelect = ref<HTMLSelectElement | null>(null);

function reassign() {
    if (!reassignSelect.value) return;
    router.patch(`/teacher/seatworks/${props.seatwork.id}/reassign`, {
        teacher_id: reassignSelect.value.value,
    }, { preserveScroll: true });
}

function typeLabel(t: string): string {
    const labels: Record<string, string> = {
        identification: 'Identification', enumeration: 'Enumeration', true_false: 'True/False',
        multiple_choice: 'Multiple Choice', matching: 'Matching Type',
    };
    return labels[t] ?? t;
}

function formatDate(v: string): string {
    return v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function autoRecheck(attemptId: number) {
    router.put(`/teacher/seatworks/${props.seatwork.id}/auto-recheck/${attemptId}`, {}, { preserveScroll: true });
}
</script>
