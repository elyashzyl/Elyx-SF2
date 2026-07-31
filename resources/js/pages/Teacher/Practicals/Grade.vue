<template>
    <Head :title="'Grade — ' + attempt.student.name" />

    <Link :href="`/teacher/practicals/${practical.id}`" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--gl-text-primary)]" style="color: var(--gl-text-secondary);">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back to practical
    </Link>

    <!-- Hero -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-6 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(124,58,237,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary)); box-shadow: 0 0 20px rgba(239,68,68,0.3);">
                <ClipboardCheck class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Mission Evaluation</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">Reviewing submission for <strong>{{ practical.title }}</strong></p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, #EF4444, transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Two-column -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Left: Submission Preview -->
        <div class="lg:col-span-3 space-y-6">
            <!-- Student Info -->
            <div class="gl-glow-card p-5">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                        style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary));">{{ attempt.student.name.charAt(0) }}</div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">{{ attempt.student.name }}</p>
                        <p class="text-xs" style="color: var(--gl-text-muted)">{{ attempt.student.grade }} · Submitted {{ formatDate(attempt.submitted_at) }}</p>
                    </div>
                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" style="background: rgba(16,185,129,0.1); color: var(--gl-success);">Submitted</span>
                </div>
            </div>

            <!-- Submission -->
            <div v-if="attempt.submission_text || attempt.submission_file" class="gl-glow-card overflow-hidden p-0">
                <div class="px-5 py-3 border-b flex items-center gap-2" style="border-color: var(--gl-border);">
                    <div class="flex h-7 w-7 items-center justify-center rounded-lg" style="background: rgba(59,130,246,0.1);">
                        <FileCode class="h-3.5 w-3.5" style="color: var(--gl-primary);" :stroke-width="2" />
                    </div>
                    <span class="text-sm font-semibold" style="color: var(--gl-text-primary);">Submission</span>
                    <span class="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium" style="background: rgba(59,130,246,0.1); color: var(--gl-primary);">{{ attempt.submission_text ? 'Code' : 'Image' }}</span>
                </div>
                <div v-if="attempt.submission_text">
                    <div class="rounded-t-xl overflow-hidden" style="border: 1px solid var(--gl-border); margin: 1rem;">
                        <div class="flex items-center gap-1.5 px-4 py-2" style="background: var(--gl-surface-2); border-bottom: 1px solid var(--gl-border);">
                            <span class="h-2.5 w-2.5 rounded-full" style="background:#EF4444;"></span>
                            <span class="h-2.5 w-2.5 rounded-full" style="background:#FBBF24;"></span>
                            <span class="h-2.5 w-2.5 rounded-full" style="background:#10B981;"></span>
                            <span class="ml-2 text-[10px]" style="color: var(--gl-text-muted);">submission.txt</span>
                        </div>
                        <pre class="p-4 text-sm font-mono whitespace-pre-wrap" style="background: #0d1117; color: #e6edf3; max-height: 500px; overflow-y: auto;">{{ attempt.submission_text }}</pre>
                    </div>
                </div>
                <div v-if="attempt.submission_file" class="p-4">
                    <img :src="'/storage/' + attempt.submission_file" class="max-h-96 rounded-xl cursor-pointer" style="border: 1px solid var(--gl-border);" @click="previewImg = '/storage/' + attempt.submission_file" />
                </div>
            </div>
            <div v-else class="gl-glow-card p-5 text-center">
                <p class="text-sm" style="color: var(--gl-text-muted)">No submission provided.</p>
            </div>
        </div>

        <!-- Right: Evaluation Panel -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Summary -->
            <div class="gl-glow-card p-5">
                <div class="flex items-center gap-2 mb-3">
                    <Target class="h-4 w-4" style="color: var(--gl-primary);" :stroke-width="2" />
                    <span class="text-sm font-semibold" style="color: var(--gl-text-primary);">Running Score</span>
                </div>
                <p class="text-3xl font-bold" style="color: var(--gl-text-primary)">{{ totalComputed }} <span class="text-lg font-normal" style="color: var(--gl-text-muted);">/ {{ totalMax }}</span></p>
                <div class="gl-xp-bar mt-2">
                    <div class="gl-xp-bar-fill" :style="{ width: scorePct + '%' }"></div>
                </div>
                <p class="text-xs mt-1.5" style="color: var(--gl-text-muted)">{{ scorePct }}% complete</p>
            </div>

            <!-- Rubric -->
            <div class="gl-glow-card p-5">
                <div class="flex items-center gap-2 mb-4">
                    <div class="flex h-7 w-7 items-center justify-center rounded-lg" style="background: rgba(251,191,36,0.12);">
                        <Award class="h-3.5 w-3.5" style="color: var(--gl-accent);" :stroke-width="2" />
                    </div>
                    <span class="text-sm font-semibold" style="color: var(--gl-text-primary);">Rubric Criteria</span>
                </div>
                <div v-for="(c, ci) in practical.criteria" :key="c.id" class="mb-3 rounded-xl p-4" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                    <div class="flex items-start justify-between gap-3 mb-2">
                        <div>
                            <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ ci + 1 }}. {{ c.criterion_name }}</p>
                            <p v-if="c.description" class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ c.description }}</p>
                        </div>
                        <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" style="background: rgba(251,191,36,0.12); color: var(--gl-accent);">{{ c.max_points }} pts</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <input v-model.number="form.scores[c.id]" type="number" min="0" :max="c.max_points"
                            class="w-20 rounded-lg border px-3 py-1.5 text-sm text-center outline-none"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                        <input v-model="form.comments[c.id]" type="text" placeholder="Feedback..."
                            class="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                    </div>
                </div>

                <div class="flex items-center justify-between gap-3 pt-4" style="border-top: 1px solid var(--gl-border);">
                    <Link :href="`/teacher/practicals/${practical.id}`" class="rounded-xl px-4 py-2.5 text-sm font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</Link>
                    <button @click="save" :disabled="saving" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                        style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
                        <Save class="h-4 w-4 inline mr-1" :stroke-width="2" /> {{ saving ? 'Saving...' : 'Save Grades' }}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Image Preview Modal -->
    <Teleport to="body">
        <div v-if="previewImg" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);" @click.self="previewImg = null">
            <div class="relative max-w-3xl max-h-[90vh] p-4">
                <button @click="previewImg = null" class="absolute -top-2 -right-2 rounded-full p-1.5" style="background: var(--gl-surface); color: var(--gl-text-muted); border: 1px solid var(--gl-border);"><X class="h-4 w-4" :stroke-width="2" /></button>
                <img :src="previewImg" class="max-h-[85vh] rounded-xl" style="border: 1px solid var(--gl-border);" />
            </div>
        </div>
        <div v-if="showSaved" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="showSaved = false">
            <div class="mx-4 w-full max-w-sm rounded-2xl p-6 text-center" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style="background: var(--gl-success-bg);">
                    <Check class="h-7 w-7" style="color: var(--gl-success);" :stroke-width="2.5" />
                </div>
                <h3 class="mb-1 text-lg font-semibold" style="color: var(--gl-text-primary)">Grades Saved</h3>
                <p class="mb-4 text-sm" style="color: var(--gl-text-secondary)">The scores have been updated successfully.</p>
                <button @click="showSaved = false" class="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">Done</button>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { ArrowLeft, Save, X, Check, ClipboardCheck, Target, Award, FileCode } from '@lucide/vue';

const previewImg = ref<string | null>(null);
const showSaved = ref(false);

const props = defineProps<{ practical: any; attempt: any }>();

const totalMax = computed(() => props.practical.criteria.reduce((s: number, c: any) => s + c.max_points, 0));
const scorePct = computed(() => totalMax.value ? Math.round((totalComputed.value / totalMax.value) * 100) : 0);

onMounted(() => {
    const page = usePage();
    if ((page.props.flash as any)?.saved) showSaved.value = true;
});

const form = reactive<{ scores: Record<number, number>; comments: Record<number, string> }>({ scores: {}, comments: {} });
for (const c of props.practical.criteria) {
    const existing = props.attempt.scores?.find((s: any) => s.criterion_id === c.id);
    form.scores[c.id] = existing?.score ?? 0;
    form.comments[c.id] = existing?.comment ?? '';
}

const totalComputed = computed(() => {
    let total = 0;
    for (const c of props.practical.criteria) total += Math.min(form.scores[c.id] ?? 0, c.max_points);
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

function formatDate(v: string): string {
    return v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}
</script>
