<template>
    <Head :title="teacher.name" />

    <button @click="window.history.back()" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" />
        Back
    </button>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <h2 class="text-lg font-semibold" style="color: #1B2231">{{ teacher.name }}</h2>
            <p class="text-sm" style="color: #5A6376">{{ teacher.email }} · {{ students.length }} student(s)</p>
        </div>
    </div>

    <div v-if="!students.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <Users class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No students yet</p>
        <p class="mt-1 text-sm" style="color: #7C8598">This teacher hasn't registered any students.</p>
    </div>

    <template v-else>
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

        <div class="card overflow-hidden">
            <table class="w-full text-sm">
                <thead>
                    <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                        <th class="px-6 py-3 font-medium">Name</th>
                        <th class="px-6 py-3 font-medium">Email</th>
                        <th class="px-6 py-3 font-medium">Grade</th>
                        <th class="px-6 py-3 font-medium">Section</th>
                        <th class="px-6 py-3 font-medium">Joined</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[#E9EBEF]">
                    <tr v-for="s in filteredStudents" :key="s.id" class="hover:bg-[#F9FAFB]">
                        <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ s.name }}</td>
                        <td class="px-6 py-3" style="color: #5A6376">{{ s.email }}</td>
                        <td class="px-6 py-3" style="color: #5A6376">{{ s.grade ?? '—' }}</td>
                        <td class="px-6 py-3" style="color: #5A6376">{{ s.section?.name ?? '—' }}</td>
                        <td class="px-6 py-3" style="color: #5A6376">{{ formatDate(s.created_at) }}</td>
                    </tr>
                </tbody>
            </table>
            <p v-if="!filteredStudents.length" class="px-6 py-8 text-center text-sm" style="color: #7C8598">No students match your filters.</p>
        </div>
    </template>
</template>

<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { ArrowLeft, Users, Search } from '@lucide/vue';
import { computed, ref } from 'vue';

const props = defineProps<{
    teacher: any;
    students: any[];
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
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>
