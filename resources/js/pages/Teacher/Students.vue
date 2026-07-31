<template>
    <Head title="Students" />

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <!-- Hero -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(124,58,237,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                <GraduationCap class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Student Academy</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Manage your enrolled students, monitor their learning journey, track their XP, achievements, and classroom progress.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Stat Cards -->
    <div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="gl-glow-card p-4 flex items-center gap-3">
            <div class="gl-stat-icon blue"><Users class="h-5 w-5" style="color: var(--gl-primary);" :stroke-width="2" /></div>
            <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ students.length }}</p><p class="text-xs" style="color: var(--gl-text-muted)">Total Students</p></div>
        </div>
        <div class="gl-glow-card p-4 flex items-center gap-3">
            <div class="gl-stat-icon gold"><Zap class="h-5 w-5" style="color: var(--gl-accent);" :stroke-width="2" /></div>
            <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ totalXp }}</p><p class="text-xs" style="color: var(--gl-text-muted)">Total XP</p></div>
        </div>
        <div class="gl-glow-card p-4 flex items-center gap-3">
            <div class="gl-stat-icon green"><ClipboardCheck class="h-5 w-5" style="color: var(--gl-success);" :stroke-width="2" /></div>
            <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ totalQuizzes }}</p><p class="text-xs" style="color: var(--gl-text-muted)">Quizzes Done</p></div>
        </div>
        <div class="gl-glow-card p-4 flex items-center gap-3">
            <div class="gl-stat-icon purple"><Flame class="h-5 w-5" style="color: var(--gl-secondary);" :stroke-width="2" /></div>
            <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ activeCount }}</p><p class="text-xs" style="color: var(--gl-text-muted)">Active Learners</p></div>
        </div>
    </div>

    <!-- Toolbar -->
    <div class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl p-4" style="background: var(--gl-surface); border: 1px solid var(--gl-border);">
        <div class="relative flex-1 min-w-[200px]">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" :stroke-width="2" style="color: var(--gl-text-muted);" />
            <input v-model="search" type="text" placeholder="Search students..."
                class="w-full rounded-xl border px-3 py-2.5 pl-9 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
        </div>
        <select v-model="gradeFilter" class="rounded-xl border px-4 py-2.5 text-sm outline-none min-w-[120px]"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option value="">🎓 All grades</option>
            <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
        </select>
        <select v-model="sectionFilter" class="rounded-xl border px-4 py-2.5 text-sm outline-none min-w-[130px]"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option value="">🏫 All sections</option>
            <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
        </select>
    </div>

    <!-- Empty -->
    <div v-if="!filteredStudents.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-20 text-center">
        <div class="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl"
            style="background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(124,58,237,0.05));">
            <GraduationCap class="h-10 w-10" style="color: var(--gl-primary);" :stroke-width="1.5" />
        </div>
        <p class="text-lg font-semibold" style="color: var(--gl-text-primary)">No Students Yet</p>
        <p class="mt-2 text-sm max-w-md" style="color: var(--gl-text-secondary)">
            Students will appear here after they register under your account. Invite them to begin their learning adventure.
        </p>
    </div>

    <!-- Player Cards -->
    <div v-else class="space-y-2">
        <div v-for="s in filteredStudents" :key="s.id"
            class="gl-glow-card group flex flex-wrap items-center gap-4 p-4 transition-all duration-200 hover:scale-[1.005] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2)]">
            <!-- Avatar + Info -->
            <div class="flex items-center gap-3 min-w-0" style="flex: 2 1 200px;">
                <div class="relative shrink-0">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                        :style="{ background: 'linear-gradient(135deg, ' + avatarColor(s.name) + ', ' + avatarColor2(s.name) + ')' }">
                        {{ initials(s.name) }}
                    </div>
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-semibold truncate" style="color: var(--gl-text-primary)">{{ s.name }}</p>
                        <span class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style="background: rgba(59,130,246,0.1); color: var(--gl-primary);">
                            Lv.{{ levelOf(s) }}
                        </span>
                    </div>
                    <p class="text-xs truncate" style="color: var(--gl-text-muted)">{{ s.email }}</p>
                    <div class="gl-xp-bar mt-1.5" style="height: 3px; width: 80px;">
                        <div class="gl-xp-bar-fill" :style="{ width: xpPctOf(s) + '%', borderRadius: '2px' }"></div>
                    </div>
                </div>
            </div>
            <!-- Badges -->
            <div class="flex items-center gap-2 shrink-0" style="flex: 1.5 1 auto;">
                <span v-if="s.grade" class="rounded-full px-2.5 py-1 text-[11px] font-medium" style="background: rgba(59,130,246,0.1); color: var(--gl-primary);">🎓 {{ s.grade }}</span>
                <span v-if="s.section?.name" class="rounded-full px-2.5 py-1 text-[11px] font-medium" style="background: rgba(124,58,237,0.1); color: var(--gl-secondary);">🏫 {{ s.section.name }}</span>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-medium" style="background: rgba(251,191,36,0.1); color: var(--gl-accent);">⭐ {{ s.total_points ?? 0 }} XP</span>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-medium" style="background: rgba(16,185,129,0.1); color: var(--gl-success);">🏆 {{ s.completed_quizzes_count ?? 0 }} quizzes</span>
            </div>
            <!-- Actions -->
            <div class="flex items-center gap-1.5 shrink-0">
                <button @click="openXpModal(s)" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[rgba(251,191,36,0.08)]" style="color: var(--gl-accent); border: 1px solid rgba(251,191,36,0.2);" title="Add XP"><Zap class="h-3.5 w-3.5" :stroke-width="2" /> <span class="hidden sm:inline">XP</span></button>
                <button @click="viewScores(s)" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="View scores"><Eye class="h-3.5 w-3.5" :stroke-width="2" /> <span class="hidden sm:inline">View</span></button>
                <button @click="openEdit(s)" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[rgba(124,58,237,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="Edit"><Pencil class="h-3.5 w-3.5" :stroke-width="2" /> <span class="hidden sm:inline">Edit</span></button>
                <button @click="confirmRemove(s)" class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-danger); border: 1px solid rgba(239,68,68,0.2);" title="Remove"><X class="h-3.5 w-3.5" :stroke-width="2" /></button>
            </div>
        </div>
    </div>

    <!-- Scores Modal -->
    <Teleport to="body">
        <div v-if="viewingScores" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="viewingScores = null">
            <div class="w-full max-w-2xl rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <div class="mb-4 flex items-center justify-between"><div><h3 class="text-base font-semibold" style="color: var(--gl-text-primary)">{{ viewingScores.name }}</h3><p class="text-sm" style="color: var(--gl-text-secondary)">Quiz scores</p></div><button @click="viewingScores = null" class="rounded-lg p-1.5 transition-colors hover:bg-[var(--gl-surface-2)]" style="color: var(--gl-text-muted);"><X class="h-5 w-5" :stroke-width="2" /></button></div>
                <div v-if="scoresLoading" class="flex justify-center py-12"><div class="h-5 w-5 animate-spin rounded-full border-2" style="border-color: var(--gl-surface-2); border-top-color: var(--gl-primary);"></div></div>
                <div v-else-if="!scoresData.length" class="py-8 text-center text-sm" style="color: var(--gl-text-muted)">No quiz attempts yet.</div>
                <table v-else class="w-full text-sm"><thead><tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border);"><th class="px-4 py-2.5 font-medium">Quiz</th><th class="px-4 py-2.5 font-medium">Score</th><th class="px-4 py-2.5 font-medium">Status</th><th class="px-4 py-2.5 font-medium">Date</th></tr></thead>
                <tbody class="divide-y" style="border-color: var(--gl-border);"><tr v-for="a in scoresData" :key="a.id" class="hover:bg-[rgba(59,130,246,0.03)]"><td class="px-4 py-2.5" style="color: var(--gl-text-primary)">{{ a.quiz?.title ?? '—' }}</td><td class="px-4 py-2.5" style="color: var(--gl-text-secondary)">{{ a.score }} / {{ a.total_points }}</td><td class="px-4 py-2.5"><StatusBadge :status="a.status" /></td><td class="px-4 py-2.5 text-xs" style="color: var(--gl-text-muted)">{{ formatDate(a.created_at) }}</td></tr></tbody></table>
            </div>
        </div>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
        <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="editing = null">
            <div class="w-full max-w-md rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <h3 class="mb-4 text-base font-semibold" style="color: var(--gl-text-primary)">Edit Student</h3>
                <form @submit.prevent="saveEdit" class="space-y-4">
                    <div><label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">Name</label><input v-model="editForm.name" type="text" required class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" /><p v-if="editError.name" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ editError.name }}</p></div>
                    <div><label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">Email</label><input v-model="editForm.email" type="email" required class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" /><p v-if="editError.email" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ editError.email }}</p></div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" @click="editing = null" class="rounded-xl px-4 py-2.5 text-sm font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                        <button type="submit" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <!-- Add XP Modal -->
    <Teleport to="body">
        <div v-if="xpStudent" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="xpStudent = null">
            <div class="w-full max-w-sm rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <h3 class="mb-4 text-base font-semibold" style="color: var(--gl-text-primary)">Award XP to {{ xpStudent.name }}</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">XP Amount</label>
                        <input v-model.number="xpAmount" type="number" min="1" max="1000" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" placeholder="e.g. 50" />
                    </div>
                    <div>
                        <label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">Reason (optional)</label>
                        <input v-model="xpReason" type="text" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" placeholder="e.g. Class participation" />
                    </div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button @click="xpStudent = null" class="rounded-xl px-4 py-2.5 text-sm font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                        <button @click="awardXp" :disabled="!xpAmount || xpSaving" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                            style="background: linear-gradient(135deg, var(--gl-accent), #F59E0B); box-shadow: 0 0 12px rgba(251,191,36,0.3);">
                            <Zap class="h-4 w-4 inline mr-1" :stroke-width="2" /> {{ xpSaving ? 'Awarding...' : 'Award XP' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { Users, Search, Eye, Pencil, X, GraduationCap, Zap, ClipboardCheck, Flame } from '@lucide/vue';

const page = usePage();
const flash = page.props.flash as any;

const props = defineProps<{ students: any[]; isSuperadmin?: boolean }>();
const search = ref('');
const gradeFilter = ref('');
const sectionFilter = ref('');

const grades = computed(() => { const set = new Set<string>(); for (const s of props.students) if (s.grade) set.add(s.grade); return [...set].sort(); });
const sections = computed(() => { const set = new Set<string>(); for (const s of props.students) if (s.section?.name) set.add(s.section.name); return [...set].sort(); });

const filteredStudents = computed(() => props.students.filter((s) => {
    if (search.value) { const q = search.value.toLowerCase(); if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false; }
    if (gradeFilter.value && s.grade !== gradeFilter.value) return false;
    if (sectionFilter.value && s.section?.name !== sectionFilter.value) return false;
    return true;
}));

const totalXp = computed(() => props.students.reduce((a, s) => a + (s.total_points ?? 0), 0));
const totalQuizzes = computed(() => props.students.reduce((a, s) => a + (s.completed_quizzes_count ?? 0), 0));
const activeCount = computed(() => props.students.filter(s => (s.completed_quizzes_count ?? 0) > 0).length);

function levelOf(s: any) { return Math.floor((s.total_points ?? 0) / 100) + 1; }
function xpPctOf(s: any) { const xp = (s.total_points ?? 0) % 100; const max = levelOf(s) * 100; return max > 0 ? Math.min(100, Math.round((xp / max) * 100)) : 0; }
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function avatarColor(name: string) { const c = ['#3B82F6','#10B981','#F59E0B','#EF4444','#7C3AED','#EC4899','#06B6D4']; let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return c[Math.abs(h) % c.length]; }
function avatarColor2(name: string) { const c = ['#2563EB','#059669','#D97706','#DC2626','#6D28D9','#DB2777','#0891B2']; let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 7) - h); return c[Math.abs(h) % c.length]; }
function formatDate(value: string): string { return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const viewingScores = ref<any>(null); const scoresLoading = ref(false); const scoresData = ref<any[]>([]);
async function viewScores(s: any) { viewingScores.value = s; scoresLoading.value = true; scoresData.value = []; try { const res = await fetch(`/teacher/students/${s.id}/scores`); const data = await res.json(); scoresData.value = data.attempts; } catch { scoresData.value = []; } finally { scoresLoading.value = false; } }

const editing = ref<any>(null); const editForm = ref({ name: '', email: '' }); const editError = ref<any>({});
function openEdit(s: any) { editForm.value = { name: s.name, email: s.email }; editError.value = {}; editing.value = s; }
function saveEdit() { editError.value = {}; router.put(`/teacher/students/${editing.value.id}`, editForm.value, { preserveScroll: true, onSuccess: () => { editing.value = null; }, onError: (errors) => { editError.value = errors; } }); }
function confirmRemove(s: any) { if (confirm(`Remove "${s.name}" from your class?`)) router.delete(`/teacher/students/${s.id}/remove`, { preserveScroll: true }); }

const xpStudent = ref<any>(null); const xpAmount = ref<number>(0); const xpReason = ref(''); const xpSaving = ref(false);
function openXpModal(s: any) { xpStudent.value = s; xpAmount.value = 10; xpReason.value = ''; }
async function awardXp() {
    if (!xpStudent.value || !xpAmount.value) return;
    xpSaving.value = true;
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        const res = await fetch(`/teacher/students/${xpStudent.value.id}/add-xp`, {
            method: 'POST', headers: { 'X-CSRF-TOKEN': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ xp: xpAmount.value, reason: xpReason.value }),
        });
        if (res.ok) {
            const data = await res.json();
            xpStudent.value.total_points = data.total_points;
            xpStudent.value = null;
        }
    } catch {} finally { xpSaving.value = false; }
}
</script>
