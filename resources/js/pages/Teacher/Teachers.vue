<template>
    <Head title="Teachers" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>

    <div class="mb-6">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Teachers</h2>
        <p class="text-sm" style="color: #5A6376">All registered teachers in the system.</p>
    </div>

    <div v-if="!teachers.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <Users class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No teachers yet</p>
    </div>

    <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Name</th>
                    <th class="px-6 py-3 font-medium">Email</th>
                    <th class="px-6 py-3 font-medium">Students</th>
                    <th class="px-6 py-3 font-medium">Quizzes</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="t in teachers" :key="t.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ t.name }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ t.email }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ t.students_count }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ t.quizzes_count }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-2">
                            <Link :href="`/teacher/teachers/${t.id}`" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8] inline-block" style="color: #5A6376" title="View">
                                <Eye class="h-4 w-4" :stroke-width="2" />
                            </Link>
                            <button @click="openEdit(t)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" title="Edit">
                                <Pencil class="h-4 w-4" :stroke-width="2" />
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <Teleport to="body">
        <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="editing = null">
            <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <h3 class="mb-4 text-base font-semibold" style="color: #1B2231">Edit teacher</h3>
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
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { Users, Eye, Pencil } from '@lucide/vue';
import { ref } from 'vue';

const page = usePage();
const flash = page.props.flash as any;

defineProps<{
    teachers: any[];
}>();

const editing = ref<any>(null);
const editForm = ref({ name: '', email: '' });
const editError = ref<any>({});

function openEdit(t: any) {
    editForm.value = { name: t.name, email: t.email };
    editError.value = {};
    editing.value = t;
}

function saveEdit() {
    editError.value = {};
    router.put(`/teacher/teachers/${editing.value.id}`, editForm.value, {
        preserveScroll: true,
        onSuccess: () => { editing.value = null; },
        onError: (errors) => { editError.value = errors; },
    });
}
</script>
