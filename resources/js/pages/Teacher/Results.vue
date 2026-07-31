<template>
    <Head title="All Results" />

    <!-- Hero Header -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(124,58,237,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                <ClipboardCheck class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">All Results</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Every submitted activity across all students.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Stats -->
    <div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="gl-glow-card p-4 flex items-center gap-3">
            <div class="gl-stat-icon blue"><ClipboardCheck class="h-5 w-5" style="color: var(--gl-primary);" :stroke-width="2" /></div>
            <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ activities.length }}</p><p class="text-xs" style="color: var(--gl-text-muted)">Total Results</p></div>
        </div>
        <div class="gl-glow-card p-4 flex items-center gap-3">
            <div class="gl-stat-icon green"><Target class="h-5 w-5" style="color: var(--gl-success);" :stroke-width="2" /></div>
            <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ avgScore }}<span class="text-sm" style="color: var(--gl-text-muted)">%</span></p><p class="text-xs" style="color: var(--gl-text-muted)">Average Score</p></div>
        </div>
        <div class="gl-glow-card p-4 flex items-center gap-3">
            <div class="gl-stat-icon gold"><Trophy class="h-5 w-5" style="color: var(--gl-accent);" :stroke-width="2" /></div>
            <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ topScore }}<span class="text-sm" style="color: var(--gl-text-muted)">%</span></p><p class="text-xs" style="color: var(--gl-text-muted)">Highest Score</p></div>
        </div>
        <div class="gl-glow-card p-4 flex items-center gap-3">
            <div class="gl-stat-icon purple"><Users class="h-5 w-5" style="color: var(--gl-secondary);" :stroke-width="2" /></div>
            <div><p class="text-xl font-bold" style="color: var(--gl-text-primary)">{{ studentCount }}</p><p class="text-xs" style="color: var(--gl-text-muted)">Unique Students</p></div>
        </div>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px]">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" :stroke-width="2" style="color: var(--gl-text-muted);" />
            <input v-model="search" type="text" placeholder="Search by student or activity..."
                class="w-full rounded-xl border px-3 py-2.5 pl-9 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
        </div>
        <select v-model="teacherFilter" class="rounded-xl border px-4 py-2.5 text-sm outline-none"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option value="">All teachers</option>
            <option v-for="t in teachersList" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <select v-model="typeFilter" class="rounded-xl border px-4 py-2.5 text-sm outline-none"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option value="">All types</option>
            <option value="Quiz">Quizzes</option>
            <option value="Exam">Exams</option>
            <option value="Seatwork">Seatworks</option>
            <option value="Practical">Practicals</option>
        </select>
        <select v-model="gradeFilter" class="rounded-xl border px-4 py-2.5 text-sm outline-none"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option value="">All grades</option>
            <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <select v-model="sectionFilter" class="rounded-xl border px-4 py-2.5 text-sm outline-none"
            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
            <option value="">All sections</option>
            <option v-for="s in filteredSections" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
    </div>

    <div v-if="!filtered.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
            <ClipboardCheck class="h-6 w-6" style="color: var(--gl-text-muted);" :stroke-width="1.75" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No results found</p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">No submitted activities match your filters.</p>
    </div>

    <div v-else class="gl-glow-card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Student</th>
                    <th class="px-6 py-3 font-medium">Teacher</th>
                    <th class="px-6 py-3 font-medium">Type</th>
                    <th class="px-6 py-3 font-medium">Activity</th>
                    <th class="px-6 py-3 font-medium">Score</th>
                    <th class="px-6 py-3 font-medium">Date</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="item in filtered" :key="item.type + item.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3">
                        <div>
                            <p class="font-medium" style="color: #1B2231">{{ item.student_name }}</p>
                            <p class="text-xs" style="color: #7C8598">{{ item.student_grade }}</p>
                        </div>
                    </td>
                    <td class="px-6 py-3 text-sm" style="color: #5A6376">{{ item.teacher_name ?? '—' }}</td>
                    <td class="px-6 py-3">
                        <span class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium" :class="badgeClass(item.type)">
                            <component :is="typeIcon(item.type)" class="h-3.5 w-3.5" :stroke-width="2" />
                            {{ item.type }}
                        </span>
                    </td>
                    <td class="px-6 py-3" style="color: #1B2231">{{ item.title }}</td>
                    <td class="px-6 py-3">
                        <span class="font-medium" style="color: #1B2231">{{ item.score }}/{{ item.total }}</span>
                        <span class="ml-1.5 text-xs font-medium" :style="item.percentage >= 50 ? 'color: #2F7A54' : 'color: #AA3C36'">({{ item.percentage }}%)</span>
                    </td>
                    <td class="px-6 py-3 text-xs" style="color: #7C8598">{{ formatDate(item.submitted_at) }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-1.5">
                            <button v-if="item.type === 'Quiz' || item.type === 'Seatwork'" @click="autoRecheck(item)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="Auto recheck">
                                <RotateCw class="h-3.5 w-3.5" :stroke-width="2" />
                            </button>
                            <Link :href="recheckUrl(item)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" :title="item.type === 'Practical' ? 'Recheck' : 'View'">
                                <ClipboardCheck v-if="item.type === 'Practical'" class="h-3.5 w-3.5" :stroke-width="2" />
                                <Eye v-else class="h-3.5 w-3.5" :stroke-width="2" />
                            </Link>
                            <button @click="confirmDelete(item)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-red-50 inline-block" style="color: #AA3C36" title="Delete attempt">
                                <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <Teleport to="body">
        <div v-if="deleteItem" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="deleteItem = null">
            <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
                <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style="background-color: #FDE8E8">
                    <Trash2 class="h-7 w-7" style="color: #AA3C36" :stroke-width="2.5" />
                </div>
                <h3 class="mb-1 text-lg font-semibold" style="color: #1B2231">Delete attempt?</h3>
                <p class="mb-6 text-sm" style="color: #5A6376">
                    This will remove <strong>{{ deleteItem?.student_name }}</strong>'s attempt on <strong>{{ deleteItem?.title }}</strong>. The student can then retake it.
                </p>
                <div class="flex gap-3">
                    <button @click="deleteItem = null" class="btn-secondary flex-1">Cancel</button>
                    <button @click="deleteAttempt" class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white" style="background-color: #AA3C36">Delete</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { ClipboardCheck, Search, Eye, RotateCw, FileQuestion, FileText, ClipboardList, FlaskConical, Trash2, Target, Trophy, Users } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{ activities: any[]; teachersList: any[]; gradeLevels: any[]; sections: any[] }>();

const avgScore = computed(() => { if (!props.activities.length) return 0; return Math.round(props.activities.reduce((a, i) => a + i.percentage, 0) / props.activities.length); });
const topScore = computed(() => { if (!props.activities.length) return 0; return Math.max(...props.activities.map(i => i.percentage)); });
const studentCount = computed(() => new Set(props.activities.map(i => i.student_name)).size);

const rk = 'results_' + window.location.pathname;
const search = ref(sessionStorage.getItem(rk + '_search') ?? '');
const teacherFilter = ref(sessionStorage.getItem(rk + '_teacher') ?? '');
const typeFilter = ref(sessionStorage.getItem(rk + '_type') ?? '');
const gradeFilter = ref(sessionStorage.getItem(rk + '_grade') ?? '');
const sectionFilter = ref(sessionStorage.getItem(rk + '_section') ?? '');

watch(gradeFilter, () => { sectionFilter.value = ''; });
watch([search, teacherFilter, typeFilter, gradeFilter, sectionFilter], () => {
    sessionStorage.setItem(rk + '_search', search.value);
    sessionStorage.setItem(rk + '_teacher', teacherFilter.value);
    sessionStorage.setItem(rk + '_type', typeFilter.value);
    sessionStorage.setItem(rk + '_grade', gradeFilter.value);
    sessionStorage.setItem(rk + '_section', sectionFilter.value);
});

const filteredSections = computed(() => {
    if (!gradeFilter.value) return props.sections;
    return props.sections.filter((s: any) => s.grade_level_id === Number(gradeFilter.value));
});

const filtered = computed(() => {
    return props.activities.filter((a: any) => {
        if (search.value) {
            const q = search.value.toLowerCase();
            if (!a.title.toLowerCase().includes(q) && !a.student_name.toLowerCase().includes(q)) return false;
        }
        if (teacherFilter.value && a.teacher_id !== Number(teacherFilter.value)) return false;
        if (typeFilter.value && a.type !== typeFilter.value) return false;
        if (gradeFilter.value && a.grade_level_id !== Number(gradeFilter.value)) return false;
        if (sectionFilter.value && a.section_id !== Number(sectionFilter.value)) return false;
        return true;
    });
});

function typeIcon(type: string) {
    const icons: Record<string, any> = { Quiz: FileQuestion, Exam: FileText, Seatwork: ClipboardList, Practical: FlaskConical };
    return icons[type] ?? ClipboardCheck;
}

function badgeClass(type: string) {
    const classes: Record<string, string> = {
        Quiz: 'bg-[#EEF2F7] text-[#1D3557]',
        Exam: 'bg-[#F5EBD8] text-[#A5701A]',
        Seatwork: 'bg-[#DCEEE3] text-[#2F7A54]',
        Practical: 'bg-[#E9EBEF] text-[#5A6376]',
    };
    return classes[type] ?? 'bg-[#E9EBEF] text-[#5A6376]';
}

function autoRecheck(item: any) {
    const routes: Record<string, string> = {
        Quiz: `/teacher/quizzes/${item.activity_id}/auto-recheck/${item.id}`,
        Seatwork: `/teacher/seatworks/${item.activity_id}/auto-recheck/${item.id}`,
    };
    const url = routes[item.type];
    if (url) router.put(url, {}, { preserveScroll: true });
}

function recheckUrl(item: any): string {
    const routes: Record<string, string> = {
        Quiz: `/teacher/quizzes/${item.activity_id}/recheck/${item.id}`,
        Seatwork: `/teacher/seatworks/${item.activity_id}/recheck/${item.id}`,
        Practical: `/teacher/practicals/${item.activity_id}/recheck/${item.id}`,
        Exam: `/teacher/exams/${item.activity_id}/attempts`,
    };
    return routes[item.type] ?? '#';
}

const deleteItem = ref<any>(null);

function confirmDelete(item: any) {
    deleteItem.value = item;
}

function deleteAttempt() {
    if (!deleteItem.value) return;
    router.delete('/teacher/results/attempt', {
        data: { type: deleteItem.value.type, id: deleteItem.value.id },
        preserveScroll: true,
        onSuccess: () => { deleteItem.value = null; },
    });
}

function formatDate(value: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>