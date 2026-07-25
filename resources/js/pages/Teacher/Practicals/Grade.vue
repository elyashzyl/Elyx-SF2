<template>
    <Head :title="'Grade — ' + attempt.student.name" />

    <Link :href="`/teacher/practicals/${practical.id}`" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back to practical
    </Link>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <h2 class="text-lg font-semibold" style="color: #1B2231">{{ practical.title }}</h2>
            <p class="text-sm" style="color: #5A6376">Grading <span class="font-medium" style="color: #404A5C">{{ attempt.student.name }}</span> — {{ attempt.student.grade }}</p>
        </div>
    </div>

    <div v-if="attempt.submission_text || attempt.submission_file" class="card mb-6">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Student submission</h3>
        <div v-if="attempt.submission_text" class="mb-4">
            <p class="mb-2 text-xs font-medium" style="color: #5A6376">Code / Text:</p>
            <pre class="rounded-lg border border-[#E9EBEF] bg-[#F9FAFB] p-4 text-sm font-mono whitespace-pre-wrap" style="color: #1B2231; max-height: 400px; overflow-y: auto;">{{ attempt.submission_text }}</pre>
        </div>
        <div v-if="attempt.submission_file">
            <p class="mb-2 text-xs font-medium" style="color: #5A6376">Uploaded image:</p>
            <img :src="'/storage/' + attempt.submission_file" class="max-h-96 rounded-lg border border-[#E9EBEF]" />
        </div>
    </div>
    <div v-else class="card mb-6">
        <p class="py-4 text-center text-sm" style="color: #7C8598">No submission provided.</p>
    </div>

    <div class="card">
        <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">Rubric scoring</h3>
        <div v-for="(c, ci) in practical.criteria" :key="c.id" class="mb-4 rounded-lg border border-[#E9EBEF] p-4">
            <div class="mb-2 flex items-start justify-between">
                <div>
                    <p class="text-sm font-medium" style="color: #1B2231">{{ ci + 1 }}. {{ c.criterion_name }}</p>
                    <p v-if="c.description" class="text-xs" style="color: #5A6376">{{ c.description }}</p>
                </div>
                <span class="shrink-0 rounded bg-[#E9EBEF] px-2 py-0.5 text-xs font-medium" style="color: #5A6376">{{ c.max_points }} pts</span>
            </div>
            <div class="flex flex-wrap items-center gap-4">
                <div>
                    <label class="text-xs font-medium" style="color: #404A5C">Score</label>
                    <input v-model.number="form.scores[c.id]" type="number" min="0" :max="c.max_points" class="mt-1 w-24 rounded-lg border border-[#D2D6DE] px-3 py-2 text-sm outline-none focus:border-[#1D3557]" style="color: #1B2231" />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label class="text-xs font-medium" style="color: #404A5C">Comment (optional)</label>
                    <input v-model="form.comments[c.id]" type="text" class="mt-1 w-full rounded-lg border border-[#D2D6DE] px-3 py-2 text-sm outline-none focus:border-[#1D3557]" style="color: #1B2231" placeholder="Feedback..." />
                </div>
            </div>
        </div>

        <div class="flex items-center justify-between border-t border-[#E9EBEF] pt-4">
            <div>
                <p class="text-sm font-medium" style="color: #1B2231">Total: <span class="text-lg font-semibold">{{ totalComputed }}</span> / {{ totalMax }}</p>
            </div>
            <div class="flex items-center gap-3">
                <Link :href="`/teacher/practicals/${practical.id}`" class="btn-secondary">Cancel</Link>
                <button @click="save" class="btn-primary" :disabled="saving">
                    <Save class="h-4 w-4" :stroke-width="2" />
                    {{ saving ? 'Saving...' : 'Save grades' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { ArrowLeft, Save } from '@lucide/vue';

const props = defineProps<{ practical: any; attempt: any }>();

const totalMax = computed(() => props.practical.criteria.reduce((s: number, c: any) => s + c.max_points, 0));

const form = reactive<{ scores: Record<number, number>; comments: Record<number, string> }>({
    scores: {},
    comments: {},
});

for (const c of props.practical.criteria) {
    const existing = props.attempt.scores?.find((s: any) => s.criterion_id === c.id);
    form.scores[c.id] = existing?.score ?? 0;
    form.comments[c.id] = existing?.comment ?? '';
}

const totalComputed = computed(() => {
    let total = 0;
    for (const c of props.practical.criteria) {
        total += Math.min(form.scores[c.id] ?? 0, c.max_points);
    }
    return total;
});

const saving = ref(false);

function save() {
    saving.value = true;
    router.put(`/teacher/practicals/${props.practical.id}/grade/${props.attempt.id}`, form, {
        preserveScroll: true,
        onFinish: () => { saving.value = false; },
    });
}
</script>