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
                <Users class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Enrolled Students</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Manage your learners, monitor their progress, and guide them through their learning journey.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Search & Filters -->
    <div class="mb-6 flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px]">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" :stroke-width="2" style="color: var(--gl-text-muted);" />
            <input v-model="search" type="text" placeholder="Search students by name or email..."
                class="w-full rounded-xl border px-3 py-2.5 pl-9 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
        </div>
        <select v-model="gradeFilter"
            class="rounded-xl border px-4 py-2.5 text-sm outline-none"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option value="">All grades</option>
            <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
        </select>
        <select v-model="sectionFilter"
            class="rounded-xl border px-4 py-2.5 text-sm outline-none"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option value="">All sections</option>
            <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
        </select>
    </div>

    <!-- Empty -->
    <div v-if="!filteredStudents.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style="background: var(--gl-surface-2);">
            <Users class="h-7 w-7" style="color: var(--gl-text-muted);" :stroke-width="1.5" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No students match your filters.</p>
    </div>

    <!-- Table -->
    <div v-else class="gl-glow-card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border); background: var(--gl-surface-2);">
                    <th class="px-6 py-3 font-medium text-left">Student</th>
                    <th class="px-6 py-3 font-medium text-left">Email</th>
                    <th class="px-6 py-3 font-medium text-left">Grade</th>
                    <th class="px-6 py-3 font-medium text-left">Section</th>
                    <th class="px-6 py-3 font-medium text-center">Quizzes</th>
                    <th class="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y" style="border-color: var(--gl-border);">
                <tr v-for="s in filteredStudents" :key="s.id" class="transition-colors hover:bg-[rgba(59,130,246,0.03)]">
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-3">
                            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                :style="{ background: 'linear-gradient(135deg, ' + avatarColor(s.name) + ', ' + avatarColor2(s.name) + ')' }">
                                {{ initials(s.name) }}
                            </div>
                            <span class="font-medium" style="color: var(--gl-text-primary)">{{ s.name }}</span>
                        </div>
                    </td>
                    <td class="px-6 py-3" style="color: var(--gl-text-secondary)">{{ s.email }}</td>
                    <td class="px-6 py-3">
                        <span v-if="s.grade" class="rounded-full px-2.5 py-0.5 text-xs font-medium" style="background: rgba(59,130,246,0.1); color: var(--gl-primary);">{{ s.grade }}</span>
                        <span v-else style="color: var(--gl-text-muted)">—</span>
                    </td>
                    <td class="px-6 py-3">
                        <span v-if="s.section?.name" class="rounded-full px-2.5 py-0.5 text-xs font-medium" style="background: rgba(124,58,237,0.1); color: var(--gl-secondary);">{{ s.section.name }}</span>
                        <span v-else style="color: var(--gl-text-muted)">—</span>
                    </td>
                    <td class="px-6 py-3 text-center">
                        <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" style="background: rgba(16,185,129,0.1); color: var(--gl-success);">{{ s.completed_quizzes_count ?? 0 }}</span>
                    </td>
                    <td class="px-6 py-3">
                        <div class="flex items-center justify-end gap-1.5">
                            <button @click="viewScores(s)" class="rounded-lg p-2 transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="View scores"><Eye class="h-4 w-4" :stroke-width="2" /></button>
                            <button @click="openEdit(s)" class="rounded-lg p-2 transition-colors hover:bg-[rgba(124,58,237,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="Edit"><Pencil class="h-4 w-4" :stroke-width="2" /></button>
                            <button @click="confirmRemove(s)" class="rounded-lg p-2 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-danger); border: 1px solid rgba(239,68,68,0.2);" title="Remove"><X class="h-4 w-4" :stroke-width="2" /></button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Scores Modal -->
    <Teleport to="body">
        <div v-if="viewingScores" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="viewingScores = null">
            <div class="w-full max-w-2xl rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-semibold" style="color: var(--gl-text-primary)">{{ viewingScores.name }}</h3>
                        <p class="text-sm" style="color: var(--gl-text-secondary)">Quiz scores</p>
                    </div>
                    <button @click="viewingScores = null" class="rounded-lg p-1.5 transition-colors hover:bg-[var(--gl-surface-2)]" style="color: var(--gl-text-muted);"><X class="h-5 w-5" :stroke-width="2" /></button>
                </div>
                <div v-if="scoresLoading" class="flex items-center justify-center py-12"><div class="h-5 w-5 animate-spin rounded-full border-2" style="border-color: var(--gl-surface-2); border-top-color: var(--gl-primary);"></div></div>
                <div v-else-if="!scoresData.length" class="py-8 text-center text-sm" style="color: var(--gl-text-muted)">No quiz attempts yet.</div>
                <table v-else class="w-full text-sm">
                    <thead><tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border);"><th class="px-4 py-2.5 font-medium">Quiz</th><th class="px-4 py-2.5 font-medium">Score</th><th class="px-4 py-2.5 font-medium">Status</th><th class="px-4 py-2.5 font-medium">Date</th></tr></thead>
                    <tbody class="divide-y" style="border-color: var(--gl-border);">
                        <tr v-for="a in scoresData" :key="a.id" class="hover:bg-[rgba(59,130,246,0.03)]"><td class="px-4 py-2.5" style="color: var(--gl-text-primary)">{{ a.quiz?.title ?? '—' }}</td><td class="px-4 py-2.5" style="color: var(--gl-text-secondary)">{{ a.score }} / {{ a.total_points }}</td><td class="px-4 py-2.5"><StatusBadge :status="a.status" /></td><td class="px-4 py-2.5 text-xs" style="color: var(--gl-text-muted)">{{ formatDate(a.created_at) }}</td></tr>
                    </tbody>
                </table>
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
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { Users, Search, Eye, Pencil, X } from '@lucide/vue';
import { computed, ref } from 'vue';

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

function initials(name: string) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function avatarColor(name: string) { const c = ['#3B82F6','#10B981','#F59E0B','#EF4444','#7C3AED','#EC4899','#06B6D4']; let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return c[Math.abs(h) % c.length]; }
function avatarColor2(name: string) { const c = ['#2563EB','#059669','#D97706','#DC2626','#6D28D9','#DB2777','#0891B2']; let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 7) - h); return c[Math.abs(h) % c.length]; }

function formatDate(value: string): string { return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const viewingScores = ref<any>(null);
const scoresLoading = ref(false);
const scoresData = ref<any[]>([]);
async function viewScores(s: any) { viewingScores.value = s; scoresLoading.value = true; scoresData.value = []; try { const res = await fetch(`/teacher/students/${s.id}/scores`); const data = await res.json(); scoresData.value = data.attempts; } catch { scoresData.value = []; } finally { scoresLoading.value = false; } }

const editing = ref<any>(null);
const editForm = ref({ name: '', email: '' });
const editError = ref<any>({});
function openEdit(s: any) { editForm.value = { name: s.name, email: s.email }; editError.value = {}; editing.value = s; }
function saveEdit() { editError.value = {}; router.put(`/teacher/students/${editing.value.id}`, editForm.value, { preserveScroll: true, onSuccess: () => { editing.value = null; }, onError: (errors) => { editError.value = errors; } }); }
function confirmRemove(s: any) { if (confirm(`Remove "${s.name}" from your class?`)) router.delete(`/teacher/students/${s.id}/remove`, { preserveScroll: true }); }
</script>
