<template>
    <Head :title="practical.title" />

    <!-- Back + Hero -->
    <Link href="/teacher/practicals" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--gl-text-primary)]" style="color: var(--gl-text-secondary);">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back to practicals
    </Link>

    <div class="relative mb-8 overflow-hidden rounded-2xl p-6 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(239,68,68,0.08), rgba(124,58,237,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="flex items-start gap-4">
                    <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style="background: linear-gradient(135deg, #EF4444, var(--gl-secondary)); box-shadow: 0 0 20px rgba(239,68,68,0.3);">
                        <FlaskConical class="h-6 w-6 text-white" :stroke-width="2" />
                    </div>
                    <div>
                        <div class="flex flex-wrap items-center gap-2 mb-1">
                            <h1 class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ practical.title }}</h1>
                            <StatusBadge :status="statusLabel" />
                        </div>
                        <p class="text-sm" style="color: var(--gl-text-secondary)">
                            <template v-if="practical.grade_levels">{{ practical.grade_levels.map((g: any) => g.name).join(', ') }}</template>
                            · {{ practical.criteria.length }} criteria · {{ totalMax }} pts max
                            <template v-if="practical.closes_at">
                                · <span :style="{ color: isClosed ? 'var(--gl-danger)' : 'var(--gl-success)' }">{{ isClosed ? 'Closed' : 'Closes ' + timeRemaining(practical.closes_at) }}</span>
                            </template>
                        </p>
                        <p v-if="practical.instructions" class="mt-2 text-sm whitespace-pre-wrap" style="color: var(--gl-text-muted)">{{ practical.instructions }}</p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5">
                    <button v-if="!isClosed" @click="togglePublish" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
                        <UploadCloud class="h-3.5 w-3.5" :stroke-width="2" /> {{ practical.is_published ? 'Unpublish' : 'Publish' }}
                    </button>
                    <button v-if="practical.is_published && !isClosed" @click="closeNow" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style="color: var(--gl-danger); border: 1px solid rgba(239,68,68,0.2); background: var(--gl-danger-bg);">
                        <Lock class="h-3.5 w-3.5" :stroke-width="2" /> Close now
                    </button>
                    <button v-if="isClosed" @click="toggleReopen" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style="background: var(--gl-surface-2); color: var(--gl-primary); border: 1px solid rgba(59,130,246,0.3);">
                        <RefreshCw class="h-3.5 w-3.5" :stroke-width="2" /> Reopen
                    </button>
                    <Link :href="`/teacher/practicals/${practical.id}/edit`" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
                        <Pencil class="h-3.5 w-3.5" :stroke-width="2" /> Edit
                    </Link>
                    <button @click="confirmDestroy" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style="color: var(--gl-danger); border: 1px solid rgba(239,68,68,0.2);">
                        <Trash2 class="h-3.5 w-3.5" :stroke-width="2" /> Delete
                    </button>
                </div>
            </div>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, #EF4444, transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Reassign -->
    <div v-if="teachers?.length" class="mb-6 gl-glow-card flex flex-wrap items-center gap-3 px-5 py-3">
        <span class="text-sm font-medium" style="color: var(--gl-text-secondary)">Assigned to:</span>
        <select ref="reassignSelect" class="rounded-lg border px-3 py-1.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option v-for="t in teachers" :key="t.id" :value="t.id" :selected="t.id === practical.teacher_id">{{ t.name }}</option>
        </select>
        <button @click="reassign" class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Reassign</button>
    </div>

    <!-- Rubric -->
    <div class="gl-glow-card mb-6 overflow-hidden p-0">
        <div class="px-5 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg" style="background: rgba(251,191,36,0.12);">
                    <Award class="h-4 w-4" style="color: var(--gl-accent);" :stroke-width="2" />
                </div>
                <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Scoring Rubric</h3>
            </div>
        </div>
        <div class="divide-y" style="border-color: var(--gl-border);">
            <div v-for="c in practical.criteria" :key="c.id" class="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[rgba(59,130,246,0.02)]">
                <div>
                    <p class="text-sm font-medium" style="color: var(--gl-text-primary)">{{ c.criterion_name }}</p>
                    <p v-if="c.description" class="text-xs mt-0.5" style="color: var(--gl-text-muted)">{{ c.description }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold" style="background: rgba(251,191,36,0.12); color: var(--gl-accent);">{{ c.max_points }} pts</span>
            </div>
        </div>
    </div>

    <!-- Attempts -->
    <div v-if="attempts.length">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-lg font-semibold" style="color: var(--gl-text-primary)">Submissions</h3>
            <div class="flex items-center gap-2">
                <div class="flex rounded-lg border text-xs overflow-hidden" style="border-color: var(--gl-border);">
                    <button @click="sortMode = 'alpha'" class="px-2.5 py-1.5 font-medium transition-colors" :style="sortMode === 'alpha' ? 'background: var(--gl-primary); color: #FFF;' : 'background: transparent; color: var(--gl-text-secondary);'">A-Z</button>
                    <button @click="sortMode = 'score'" class="px-2.5 py-1.5 font-medium transition-colors" :style="sortMode === 'score' ? 'background: var(--gl-primary); color: #FFF;' : 'background: transparent; color: var(--gl-text-secondary);'">Score</button>
                </div>
                <select v-model="scoreFilter" class="rounded-lg border px-3 py-1.5 text-xs outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                    <option value="">All scores</option>
                    <option value="ungraded">Not graded</option>
                    <option value="80-100">≥ 80%</option>
                    <option value="60-79">60–79%</option>
                    <option value="0-59">Below 60%</option>
                </select>
                <select v-model="sectionFilter" class="rounded-lg border px-3 py-1.5 text-xs outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                    <option value="">All sections</option>
                    <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
            </div>
        </div>

        <!-- Summary cards -->
        <div class="gl-glow-card mb-4 grid grid-cols-2 p-5 text-center" style="border-color: var(--gl-border);">
            <div>
                <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ filteredAttempts.length }}</p>
                <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Submissions</p>
            </div>
            <div>
                <p class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ sectionAvg }}</p>
                <p class="text-xs mt-0.5" style="color: var(--gl-text-muted)">Avg Score</p>
            </div>
        </div>

        <div class="gl-glow-card overflow-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border); background: var(--gl-surface-2);">
                        <th class="px-5 py-3 font-medium text-left whitespace-nowrap">Student</th>
                        <th class="px-5 py-3 font-medium text-left whitespace-nowrap">Grade</th>
                        <th class="px-5 py-3 font-medium text-left whitespace-nowrap">Attempt</th>
                        <th v-for="c in practical.criteria" :key="c.id" class="px-4 py-3 font-medium text-xs whitespace-nowrap">{{ c.criterion_name }}</th>
                        <th class="px-5 py-3 font-medium text-left whitespace-nowrap">Status</th>
                        <th class="px-5 py-3 font-medium text-left whitespace-nowrap">Total</th>
                        <th class="px-5 py-3 font-medium text-left whitespace-nowrap">Submission</th>
                        <th class="px-5 py-3 font-medium text-left whitespace-nowrap">Date</th>
                        <th class="px-5 py-3 font-medium text-right whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y" style="border-color: var(--gl-border);">
                    <tr v-for="a in filteredAttempts" :key="a.id" class="transition-colors hover:bg-[rgba(59,130,246,0.03)]">
                        <td class="px-5 py-3 font-medium whitespace-nowrap" style="color: var(--gl-text-primary)">{{ a.student?.name }}</td>
                        <td class="px-5 py-3 whitespace-nowrap" style="color: var(--gl-text-secondary)">{{ a.student?.grade ?? '—' }}</td>
                        <td class="px-5 py-3 text-xs">
                            <span class="rounded-full px-2 py-0.5 font-medium" style="background: rgba(59,130,246,0.1); color: var(--gl-primary);">{{ a.attempt_number }}/{{ practical.max_attempts }}</span>
                        </td>
                        <td v-for="c in practical.criteria" :key="c.id" class="px-4 py-3 whitespace-nowrap text-xs" style="color: var(--gl-text-secondary)">
                            {{ a.scores?.find((s: any) => s.criterion_id === c.id)?.score ?? '—' }}
                        </td>
                        <td class="px-5 py-3 whitespace-nowrap"><StatusBadge :status="a.status" /></td>
                        <td class="px-5 py-3 font-medium whitespace-nowrap" style="color: var(--gl-text-primary)">{{ a.status === 'submitted' ? a.total_score + ' / ' + totalMax : '—' }}</td>
                        <td class="px-5 py-3 whitespace-nowrap">
                            <div v-if="a.submission_file" class="flex items-center gap-2">
                                <img :src="a.submission_file_url" class="h-10 w-10 rounded object-cover cursor-pointer" style="border: 1px solid var(--gl-border);" @click="previewImg = a.submission_file_url" />
                                <span class="text-xs" style="color: var(--gl-text-muted)">{{ a.submission_file.endsWith('.txt') ? 'Text' : 'Image' }}</span>
                            </div>
                            <span v-else-if="a.submission_text" class="text-xs" style="color: var(--gl-text-secondary)">{{ a.submission_text.substring(0, 60) }}{{ a.submission_text.length > 60 ? '...' : '' }}</span>
                            <span v-else class="text-xs" style="color: var(--gl-text-muted)">—</span>
                        </td>
                        <td class="px-5 py-3 text-xs whitespace-nowrap" style="color: var(--gl-text-muted)">{{ a.submitted_at ? formatDate(a.submitted_at) : '—' }}</td>
                        <td class="px-5 py-3 whitespace-nowrap text-right">
                            <div class="flex items-center justify-end gap-1.5">
                                <Link :href="`/teacher/practicals/${practical.id}/grade/${a.id}`" class="rounded-lg p-2 transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="Grade"><ClipboardCheck class="h-3.5 w-3.5" :stroke-width="2" /></Link>
                                <Link :href="`/teacher/practicals/${practical.id}/recheck/${a.id}`" class="rounded-lg p-2 transition-colors hover:bg-[rgba(124,58,237,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="Recheck"><RefreshCw class="h-3.5 w-3.5" :stroke-width="2" /></Link>
                                <button v-if="a.status === 'submitted' && !a.closed_at" @click="closeAttempt(a)" class="rounded-lg p-2 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-text-muted); border: 1px solid var(--gl-border);" title="Close"><Lock class="h-3.5 w-3.5" :stroke-width="2" /></button>
                                <button @click="confirmDelete(a)" class="rounded-lg p-2 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-text-muted); border: 1px solid var(--gl-border);" title="Delete"><Trash2 class="h-3.5 w-3.5" :stroke-width="2" /></button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Image Preview Modal -->
    <Teleport to="body">
        <div v-if="previewImg" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);" @click.self="previewImg = null">
            <div class="relative max-w-3xl max-h-[90vh] p-4">
                <button @click="previewImg = null" class="absolute -top-2 -right-2 rounded-full p-1.5 transition-colors" style="background: var(--gl-surface); color: var(--gl-text-muted); border: 1px solid var(--gl-border);"><X class="h-4 w-4" :stroke-width="2" /></button>
                <img :src="previewImg" class="max-h-[85vh] rounded-xl" style="border: 1px solid var(--gl-border);" />
            </div>
        </div>

        <div v-if="deleting" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="deleting = null">
            <div class="mx-4 w-full max-w-sm rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <h3 class="mb-2 text-base font-semibold" style="color: var(--gl-text-primary)">Delete attempt?</h3>
                <p class="text-sm" style="color: var(--gl-text-secondary)">This will permanently delete <strong>{{ deleting?.student?.name }}</strong>'s attempt. They can retake.</p>
                <div class="mt-5 flex justify-end gap-3">
                    <button @click="deleting = null" class="rounded-xl px-4 py-2.5 text-sm font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                    <button @click="destroyAttempt" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style="background: var(--gl-danger);">Delete</button>
                </div>
            </div>
        </div>

        <div v-if="deletingPractical" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="deletingPractical = false">
            <div class="mx-4 w-full max-w-sm rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <h3 class="mb-2 text-base font-semibold" style="color: var(--gl-text-primary)">Delete practical?</h3>
                <p class="text-sm" style="color: var(--gl-text-secondary)">This will permanently delete <strong>{{ practical.title }}</strong> and all its attempts.</p>
                <div class="mt-5 flex justify-end gap-3">
                    <button @click="deletingPractical = false" class="rounded-xl px-4 py-2.5 text-sm font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                    <button @click="destroyPractical" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style="background: var(--gl-danger);">Delete</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { ArrowLeft, Pencil, ClipboardCheck, Lock, RefreshCw, Trash2, UploadCloud, X, FlaskConical, Award } from '@lucide/vue';

const previewImg = ref<string | null>(null);
const deleting = ref<any | null>(null);
const deletingPractical = ref(false);

const props = defineProps<{ practical: any; attempts: any[]; teachers?: any[] }>();

const storageKey = 'practical_show_' + window.location.pathname;
const sectionFilter = ref(sessionStorage.getItem(storageKey + '_section') ?? '');
const scoreFilter = ref(sessionStorage.getItem(storageKey + '_score') ?? '');
const sortMode = ref<('alpha' | 'score')>((sessionStorage.getItem(storageKey + '_sort') as 'alpha' | 'score') ?? 'alpha');
function persistState() { sessionStorage.setItem(storageKey + '_section', sectionFilter.value); sessionStorage.setItem(storageKey + '_score', scoreFilter.value); sessionStorage.setItem(storageKey + '_sort', sortMode.value); }
watch([sectionFilter, scoreFilter, sortMode], persistState);

const totalMax = computed(() => props.practical.criteria.reduce((s: number, c: any) => s + c.max_points, 0));
const isClosed = computed(() => { if (!props.practical.closes_at) return false; return new Date(props.practical.closes_at) < new Date(); });
const statusLabel = computed(() => { if (!props.practical.is_published) return 'draft'; if (isClosed.value) return 'finished'; return 'published'; });

const sections = computed(() => { const seen = new Set<number>(); return props.attempts.map((a: any) => a.student?.section).filter((s: any) => s && !seen.has(s.id) && seen.add(s.id)); });

const filteredAttempts = computed(() => {
    let list = sectionFilter.value ? props.attempts.filter((a: any) => a.student?.section_id === Number(sectionFilter.value)) : [...props.attempts];
    if (scoreFilter.value === 'ungraded') { list = list.filter((a: any) => a.status !== 'submitted'); }
    else if (scoreFilter.value === '80-100') { list = list.filter((a: any) => a.status === 'submitted' && a.total_score !== null && a.total_score / totalMax.value >= 0.8); }
    else if (scoreFilter.value === '60-79') { list = list.filter((a: any) => a.status === 'submitted' && a.total_score !== null && a.total_score / totalMax.value >= 0.6 && a.total_score / totalMax.value < 0.8); }
    else if (scoreFilter.value === '0-59') { list = list.filter((a: any) => a.status === 'submitted' && a.total_score !== null && a.total_score / totalMax.value < 0.6); }
    if (sortMode.value === 'alpha') return list.sort((a: any, b: any) => a.student?.name?.localeCompare(b.student?.name));
    return list.sort((a: any, b: any) => (b.total_score ?? 0) - (a.total_score ?? 0));
});

const sectionAvg = computed(() => { const submitted = filteredAttempts.value.filter((a: any) => a.status === 'submitted'); if (!submitted.length) return 0; const sum = submitted.reduce((acc: number, a: any) => acc + (a.total_score ?? 0), 0); return Math.round((sum / submitted.length) * 10) / 10; });

const reassignSelect = ref<HTMLSelectElement | null>(null);
function reassign() { if (!reassignSelect.value) return; router.patch(`/teacher/practicals/${props.practical.id}/reassign`, { teacher_id: reassignSelect.value.value }, { preserveScroll: true }); }
function formatDate(v: string): string { return v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; }
function timeRemaining(dt: string): string { const diff = new Date(dt).getTime() - Date.now(); if (diff <= 0) return 'now'; const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); return `in ${h}h ${m}m`; }
function confirmDelete(attempt: any) { deleting.value = attempt; }
function destroyAttempt() { if (!deleting.value) return; router.delete(`/teacher/practicals/${props.practical.id}/attempt/${deleting.value.id}`, { preserveScroll: true, onSuccess: () => { deleting.value = null; } }); }
function togglePublish() { router.patch(`/teacher/practicals/${props.practical.id}/publish`, {}, { preserveScroll: true }); }
function toggleReopen() { router.patch(`/teacher/practicals/${props.practical.id}/reopen`, {}, { preserveScroll: true }); }
function closeNow() { router.patch(`/teacher/practicals/${props.practical.id}/close-now`, {}, { preserveScroll: true }); }
function closeAttempt(a: any) { router.patch(`/teacher/practicals/${props.practical.id}/close-attempt/${a.id}`, {}, { preserveScroll: true }); }
function confirmDestroy() { deletingPractical.value = true; }
function destroyPractical() { router.delete(`/teacher/practicals/${props.practical.id}`, { onSuccess: () => { deletingPractical.value = false; } }); }
</script>
