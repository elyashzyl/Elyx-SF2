<template>
    <Head title="Grade Levels" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex items-center justify-between gap-4">
        <div>
            <h2 class="text-lg font-semibold" style="color: #1B2231">Grade Levels</h2>
            <p class="text-sm" style="color: #5A6376">Manage grade levels and their sections.</p>
        </div>
        <button @click="openAddModal" class="btn-primary">
            <Plus class="h-4 w-4" :stroke-width="2" />
            Add Grade Level
        </button>
    </div>

    <div class="card">
        <div v-if="!gradeLevels.length" class="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
                <Layers class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
            </div>
            <p class="text-sm font-medium" style="color: #404A5C">No grade levels yet</p>
            <p class="mt-1 text-sm" style="color: #7C8598">Create a grade level to get started.</p>
            <button @click="openAddModal" class="btn-primary mt-4">
                <Plus class="h-4 w-4" :stroke-width="2" />
                Add Grade Level
            </button>
        </div>

        <ul v-else class="divide-y divide-[#E9EBEF]">
            <li v-for="level in gradeLevels" :key="level.id">
                <div class="flex items-center justify-between gap-4 px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg" :class="level.is_active ? 'bg-[#EEF2F7]' : 'bg-[#F5F6F8]'">
                            <Layers class="h-4.5 w-4.5" :stroke-width="2" :style="{ color: level.is_active ? '#1D3557' : '#7C8598' }" />
                        </div>
                        <div>
                            <p class="text-sm font-medium" style="color: #1B2231">{{ level.name }}</p>
                            <p class="text-xs" style="color: #7C8598">
                                {{ level.sections.length }} section{{ level.sections.length !== 1 ? 's' : '' }}
                                <span v-if="!level.is_active" class="ml-2 italic">(inactive)</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="btn-secondary" @click="toggleSectionForm(level)">
                            <Plus class="h-4 w-4" :stroke-width="2" />
                            Add Section
                        </button>
                        <button @click="openEdit(level)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" title="Edit">
                            <Pencil class="h-4 w-4" :stroke-width="2" />
                        </button>
                        <button class="rounded-lg border border-[#D2D6DE] p-2.5 hover:bg-[#F6DEDD]" style="color: #AA3C36" @click="destroyLevel(level)" title="Delete">
                            <Trash2 class="h-4 w-4" :stroke-width="2" />
                        </button>
                    </div>
                </div>

                <div v-if="openSectionForm === level.id" class="border-t border-[#E9EBEF] bg-[#F5F6F8] px-6 py-4">
                    <form class="flex items-end gap-3" @submit.prevent="addSection(level)">
                        <div class="flex-1">
                            <label class="field-label">Section name</label>
                            <input v-model="sectionName" type="text" class="input-field" placeholder="e.g. Rizal" required />
                        </div>
                        <button type="submit" class="btn-primary" :disabled="!sectionName.trim()">
                            <Check class="h-4 w-4" :stroke-width="2" />
                            Save
                        </button>
                        <button type="button" class="btn-secondary" @click="closeSectionForm">
                            <X class="h-4 w-4" :stroke-width="2" />
                        </button>
                    </form>
                </div>

                <div v-if="level.sections.length" class="border-t border-[#E9EBEF]">
                    <div v-for="sec in level.sections" :key="sec.id" class="flex items-center justify-between gap-4 px-14 py-3 text-sm">
                        <div class="flex items-center gap-2">
                            <div class="h-1.5 w-1.5 rounded-full" :class="sec.is_active ? 'bg-[#2F7A54]' : 'bg-[#AEB4C0]'"></div>
                            <span :class="!sec.is_active ? 'italic text-[#7C8598]' : ''">{{ sec.name }}</span>
                        </div>
                        <button class="rounded-md p-1 hover:bg-[#F6DEDD]" style="color: #AA3C36" @click="destroySection(level, sec)" title="Delete section">
                            <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                        </button>
                    </div>
                </div>
            </li>
        </ul>
    </div>

    <Teleport to="body">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showModal = false">
            <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <h3 class="mb-4 text-base font-semibold" style="color: #1B2231">{{ editingLevel ? 'Edit grade level' : 'New grade level' }}</h3>
                <form @submit.prevent="submitGradeLevel" class="space-y-4">
                    <div>
                        <label class="field-label">Name</label>
                        <input v-model="glForm.name" type="text" class="input-field" placeholder="e.g. Grade 10" required />
                        <p v-if="glFormError.name" class="mt-1 text-xs" style="color: #AA3C36">{{ glFormError.name }}</p>
                    </div>
                    <div>
                        <label class="field-label">Display order</label>
                        <input v-model.number="glForm.display_order" type="number" min="0" class="input-field" placeholder="e.g. 10" />
                    </div>
                    <div class="flex items-center gap-2">
                        <input id="gl_is_active" v-model="glForm.is_active" type="checkbox" class="h-4 w-4 rounded border-[#D2D6DE]" style="color: #1D3557" />
                        <label for="gl_is_active" class="text-sm font-medium" style="color: #404A5C">Active</label>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" class="btn-secondary" @click="showModal = false">Cancel</button>
                        <button type="submit" class="btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Plus, Layers, Pencil, Trash2, Check, X } from '@lucide/vue';
import { ref } from 'vue';

defineProps<{
    gradeLevels: any[];
}>();

const page = usePage();
const flash = page.props.flash as any;

const openSectionForm = ref<number | null>(null);
const sectionName = ref('');

const showModal = ref(false);
const editingLevel = ref<any>(null);
const glForm = ref({ name: '', display_order: 0, is_active: true });
const glFormError = ref<any>({});

function openAddModal() {
    editingLevel.value = null;
    glForm.value = { name: '', display_order: 0, is_active: true };
    glFormError.value = {};
    showModal.value = true;
}

function openEdit(level: any) {
    editingLevel.value = level;
    glForm.value = { name: level.name, display_order: level.display_order, is_active: level.is_active };
    glFormError.value = {};
    showModal.value = true;
}

function submitGradeLevel() {
    glFormError.value = {};
    if (editingLevel.value) {
        router.patch(`/teacher/grade-levels/${editingLevel.value.id}`, glForm.value, {
            preserveScroll: true,
            onSuccess: () => { showModal.value = false; },
            onError: (errors) => { glFormError.value = errors; },
        });
    } else {
        router.post('/teacher/grade-levels', glForm.value, {
            preserveScroll: true,
            onSuccess: () => { showModal.value = false; },
            onError: (errors) => { glFormError.value = errors; },
        });
    }
}

function toggleSectionForm(level: any) {
    if (openSectionForm.value === level.id) {
        closeSectionForm();
    } else {
        openSectionForm.value = level.id;
        sectionName.value = '';
    }
}

function closeSectionForm() {
    openSectionForm.value = null;
    sectionName.value = '';
}

function addSection(level: any) {
    if (!sectionName.value.trim()) return;
    router.post(`/teacher/grade-levels/${level.id}/sections`, { name: sectionName.value }, {
        preserveScroll: true,
        onSuccess: () => { closeSectionForm(); },
    });
}

function destroyLevel(level: any) {
    if (confirm(`Delete "${level.name}" and all its sections? This cannot be undone.`)) {
        router.delete(`/teacher/grade-levels/${level.id}`, { preserveScroll: true });
    }
}

function destroySection(level: any, section: any) {
    if (confirm(`Delete section "${section.name}"?`)) {
        router.delete(`/teacher/grade-levels/${level.id}/sections/${section.id}`, { preserveScroll: true });
    }
}
</script>
