<template>
    <Head :title="teacher.name" />

    <Link href="/teacher/teachers" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--gl-text-primary)]" style="color: var(--gl-text-secondary);">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" /> Back to teachers
    </Link>

    <!-- Hero -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-6 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, var(--gl-secondary), var(--gl-primary)); box-shadow: 0 0 20px var(--gl-secondary-glow);">
                <Users class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ teacher.name }}</h1>
            <p class="mt-2 text-sm" style="color: var(--gl-text-secondary)">{{ teacher.email }} · {{ students.length }} student(s)</p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
    </div>

    <div v-if="!students.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
            <Users class="h-6 w-6" style="color: var(--gl-text-muted);" :stroke-width="1.75" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No students yet</p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">This teacher hasn't registered any students.</p>
    </div>

    <template v-else>
        <div class="mb-4 flex flex-wrap items-center gap-3">
            <div class="relative flex-1 min-w-[200px]">
                <input v-model="search" type="text" placeholder="Search students..."
                    class="w-full rounded-xl border px-3 py-2.5 pl-9 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                    style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" :stroke-width="2" style="color: var(--gl-text-muted);" />
            </div>
            <select v-model="gradeFilter" class="rounded-xl border px-4 py-2.5 text-sm outline-none"
                style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                <option value="">All grades</option>
                <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
            </select>
            <select v-model="sectionFilter" class="rounded-xl border px-4 py-2.5 text-sm outline-none"
                style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                <option value="">All sections</option>
                <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
            </select>
        </div>

        <div class="gl-glow-card overflow-hidden">
            <table class="w-full text-sm">
                <thead>
                    <tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border); background: var(--gl-surface-2);">
                        <th class="px-5 py-3 font-medium">Name</th>
                        <th class="px-5 py-3 font-medium">Email</th>
                        <th class="px-5 py-3 font-medium">Grade</th>
                        <th class="px-5 py-3 font-medium">Section</th>
                        <th class="px-5 py-3 font-medium">Joined</th>
                    </tr>
                </thead>
                <tbody class="divide-y" style="border-color: var(--gl-border);">
                    <tr v-for="s in filteredStudents" :key="s.id" class="transition-colors hover:bg-[rgba(59,130,246,0.03)]">
                        <td class="px-5 py-3 font-medium" style="color: var(--gl-text-primary)">{{ s.name }}</td>
                        <td class="px-5 py-3" style="color: var(--gl-text-secondary)">{{ s.email }}</td>
                        <td class="px-5 py-3" style="color: var(--gl-text-secondary)">{{ s.grade ?? '—' }}</td>
                        <td class="px-5 py-3" style="color: var(--gl-text-secondary)">{{ s.section?.name ?? '—' }}</td>
                        <td class="px-5 py-3 text-xs" style="color: var(--gl-text-muted)">{{ formatDate(s.created_at) }}</td>
                    </tr>
                </tbody>
            </table>
            <p v-if="!filteredStudents.length" class="px-6 py-8 text-center text-sm" style="color: var(--gl-text-muted)">No students match your filters.</p>
        </div>
    </template>
</template>

<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { ArrowLeft, Users, Search } from '@lucide/vue';
import { computed, ref } from 'vue';

const props = defineProps<{ teacher: any; students: any[] }>();

const search = ref(''); const gradeFilter = ref(''); const sectionFilter = ref('');
const grades = computed(() => { const set = new Set<string>(); for (const s of props.students) if (s.grade) set.add(s.grade); return [...set].sort(); });
const sections = computed(() => { const set = new Set<string>(); for (const s of props.students) if (s.section?.name) set.add(s.section.name); return [...set].sort(); });
const filteredStudents = computed(() => props.students.filter((s) => {
    if (search.value) { const q = search.value.toLowerCase(); if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false; }
    if (gradeFilter.value && s.grade !== gradeFilter.value) return false;
    if (sectionFilter.value && s.section?.name !== sectionFilter.value) return false;
    return true;
}));

function formatDate(value: string): string { return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
</script>
