<template>
    <Head title="Students" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-6">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Enrolled students</h2>
        <p class="text-sm" style="color: #5A6376">
            <template v-if="isSuperadmin && !selectedTeacher">All users in the system.</template>
            <template v-else-if="isSuperadmin && selectedTeacher">Showing students for the selected teacher.</template>
            <template v-else>Students who registered under your account.</template>
        </p>
    </div>

    <div class="mb-4 flex items-center gap-4">
        <div class="relative flex-1">
            <input v-model="search" type="text" placeholder="Search students..." class="w-full rounded-lg border border-[#D2D6DE] px-3 py-2 pl-9 text-sm outline-none focus:border-[#1D3557]" style="color: #1B2231" />
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" :stroke-width="2" style="color: #7C8598" />
        </div>
        <select v-model="gradeFilter" class="rounded-lg border border-[#D2D6DE] px-3 py-2 text-sm outline-none focus:border-[#1D3557]" style="color: #1B2231">
            <option value="">All grades</option>
            <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
        </select>
        <select v-model="sectionFilter" class="rounded-lg border border-[#D2D6DE] px-3 py-2 text-sm outline-none focus:border-[#1D3557]" style="color: #1B2231">
            <option value="">All sections</option>
            <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
        </select>
    </div>

    <div v-if="!filteredStudents.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <Users class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No students match your filters.</p>
    </div>

    <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Name</th>
                    <th class="px-6 py-3 font-medium">Email</th>
                    <th class="px-6 py-3 font-medium">Grade</th>
                    <th class="px-6 py-3 font-medium">Section</th>
                    <th class="px-6 py-3 font-medium">Quizzes</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="s in filteredStudents" :key="s.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ s.name }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ s.email }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ s.grade ?? '—' }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ s.section?.name ?? '—' }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ s.completed_quizzes_count ?? 0 }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-2">
                            <button @click="viewScores(s)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" title="View scores">
                                <Eye class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <button @click="openEdit(s)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" title="Edit">
                                <Pencil class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <button @click="confirmRemove(s)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Remove">
                                <X class="h-4 w-4" :stroke-width="2" />
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <Teleport to="body">
        <div v-if="viewingScores" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="viewingScores = null">
            <div class="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg max-h-[80vh] overflow-y-auto">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-semibold" style="color: #1B2231">{{ viewingScores.name }}</h3>
                        <p class="text-sm" style="color: #5A6376">{{ viewingScores.email }} — Quiz scores</p>
                    </div>
                    <button @click="viewingScores = null" class="rounded-md p-1.5 hover:bg-[#E9EBEF]" style="color: #7C8598">
                        <X class="h-5 w-5" :stroke-width="2" />
                    </button>
                </div>
                <div v-if="scoresLoading" class="flex items-center justify-center py-12">
                    <div class="flex items-center gap-2 text-sm" style="color: #7C8598">
                        <div class="h-5 w-5 animate-spin rounded-full border-2 border-[#D2D6DE] border-t-[#1D3557]"></div>
                        Loading scores...
                    </div>
                </div>
                <div v-else-if="!scoresData.length" class="py-8 text-center text-sm" style="color: #7C8598">
                    No quiz attempts yet.
                </div>
                <table v-else class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                            <th class="px-4 py-2.5 font-medium">Quiz</th>
                            <th class="px-4 py-2.5 font-medium">Score</th>
                            <th class="px-4 py-2.5 font-medium">Status</th>
                            <th class="px-4 py-2.5 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[#E9EBEF]">
                        <tr v-for="a in scoresData" :key="a.id">
                            <td class="px-4 py-2.5" style="color: #1B2231">{{ a.quiz?.title ?? '—' }}</td>
                            <td class="px-4 py-2.5" style="color: #5A6376">{{ a.score }} / {{ a.total_points }}</td>
                            <td class="px-4 py-2.5"><StatusBadge :status="a.status" /></td>
                            <td class="px-4 py-2.5" style="color: #7C8598">{{ formatDate(a.created_at) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </Teleport>

    <Teleport to="body">
        <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="editing = null">
            <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <h3 class="mb-4 text-base font-semibold" style="color: #1B2231">Edit student</h3>
                <form @submit.prevent="saveEdit" class="space-y-4">
                    <div>
                        <label class="field-label">Name</label>
                        <input v-model="editForm.name" type="text" class="input-field" required />
                        <p v-if="editError.name" class="mt-1 text-xs" style="color: #AA3C36">{{ editError.name }}</p>
                    </div>
                    <div>
                        <label class="field-label">Email</label>
                        <input v-model="editForm.email" type="email" class="input-field" required />
                        <p v-if="editError.email" class="mt-1 text-xs" style="color: #AA3C36">{{ editError.email }}</p>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" class="btn-secondary" @click="editing = null">Cancel</button>
                        <button type="submit" class="btn-primary">Save</button>
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

const props = defineProps<{
    students: any[];
    isSuperadmin?: boolean;
}>();

const search = ref('');
const gradeFilter = ref('');
const sectionFilter = ref('');

const grades = computed(() => {
    const set = new Set<string>();
    for (const s of props.students) {
        if (s.grade) set.add(s.grade);
    }
    return [...set].sort();
});

const sections = computed(() => {
    const set = new Set<string>();
    for (const s of props.students) {
        if (s.section?.name) set.add(s.section.name);
    }
    return [...set].sort();
});

const filteredStudents = computed(() => {
    return props.students.filter((s) => {
        if (search.value) {
            const q = search.value.toLowerCase();
            if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
        }
        if (gradeFilter.value && s.grade !== gradeFilter.value) return false;
        if (sectionFilter.value && s.section?.name !== sectionFilter.value) return false;
        return true;
    });
});

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const viewingScores = ref<any>(null);
const scoresLoading = ref(false);
const scoresData = ref<any[]>([]);

async function viewScores(s: any) {
    viewingScores.value = s;
    scoresLoading.value = true;
    scoresData.value = [];
    try {
        const res = await fetch(`/teacher/students/${s.id}/scores`);
        const data = await res.json();
        scoresData.value = data.attempts;
    } catch {
        scoresData.value = [];
    } finally {
        scoresLoading.value = false;
    }
}

const editing = ref<any>(null);
const editForm = ref({ name: '', email: '' });
const editError = ref<any>({});

function openEdit(s: any) {
    editForm.value = { name: s.name, email: s.email };
    editError.value = {};
    editing.value = s;
}

function saveEdit() {
    editError.value = {};
    router.put(`/teacher/students/${editing.value.id}`, editForm.value, {
        preserveScroll: true,
        onSuccess: () => { editing.value = null; },
        onError: (errors) => { editError.value = errors; },
    });
}

function confirmRemove(s: any) {
    if (confirm(`Remove "${s.name}" from your class? Their account will remain but they'll need to re-register under a teacher.`)) {
        router.delete(`/teacher/students/${s.id}/remove`, { preserveScroll: true });
    }
}
</script>
