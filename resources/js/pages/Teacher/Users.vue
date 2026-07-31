<template>
    <Head title="Users" />

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <div v-if="isImpersonating" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-warning-bg); color: var(--gl-accent); border: 1px solid rgba(251,191,36,0.2);">
        <span class="font-medium">Impersonating {{ page.props.auth.user.name }}</span>
        <button @click="leaveImpersonation" class="ml-auto rounded-lg px-3 py-1 text-xs font-semibold"
            style="background: var(--gl-accent); color: #0F172A;">Stop impersonating</button>
    </div>

    <!-- System Messenger Toggle -->
    <div v-if="(page.props.auth as any)?.user?.role === 'superadmin'" class="gl-glow-card mb-4 p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <MessageCircle class="h-5 w-5" style="color: var(--gl-primary);" :stroke-width="2" />
            <div>
                <span class="text-sm font-medium" style="color: var(--gl-text-primary)">System Messenger</span>
                <span class="text-xs ml-2" style="color: var(--gl-text-muted)">{{ systemMessengerEnabled ? 'Enabled for all users' : 'Disabled for all users' }}</span>
            </div>
        </div>
        <button @click="toggleSystemMessenger" class="relative w-12 h-6 rounded-full transition-colors" :style="{ background: systemMessengerEnabled ? 'var(--gl-success)' : '#475569' }">
            <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform" :style="{ transform: systemMessengerEnabled ? 'translateX(24px)' : 'translateX(0)' }"></span>
        </button>
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h2 class="text-xl font-bold" style="color: var(--gl-text-primary)">Users</h2>
            <p class="text-sm" style="color: var(--gl-text-secondary)">Manage all users in the system.</p>
        </div>
        <button @click="openAddUser"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
            <Plus class="h-4 w-4" :stroke-width="2" /> Add User
        </button>
    </div>

    <div class="mb-4">
        <div class="relative">
            <input v-model="search" type="text" placeholder="Search by name or email..."
                class="w-full rounded-xl border px-3 py-2.5 pl-9 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" :stroke-width="2" style="color: var(--gl-text-muted);" />
        </div>
    </div>

    <div class="gl-glow-card overflow-hidden">
        <table class="w-full text-sm" v-if="filteredUsers.length">
            <thead>
                <tr class="border-b border-[#E9EBEF] text-left" style="color: #5A6376">
                    <th class="px-6 py-3 font-medium">Name</th>
                    <th class="px-6 py-3 font-medium">Email</th>
                    <th class="px-6 py-3 font-medium">Gender</th>
                    <th class="px-6 py-3 font-medium">Role</th>
                    <th class="px-6 py-3 font-medium">Grade</th>
                    <th class="px-6 py-3 font-medium">Section</th>
                    <th class="px-6 py-3 font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-[#E9EBEF]">
                <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-[#F9FAFB]">
                    <td class="px-6 py-3 font-medium" style="color: #1B2231">{{ u.name }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ u.email }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ u.gender || '—' }}</td>
                    <td class="px-6 py-3">
                        <StatusBadge :status="u.role" />
                    </td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ u.gradeLevel?.name ?? u.grade ?? '—' }}</td>
                    <td class="px-6 py-3" style="color: #5A6376">{{ u.section?.name ?? '—' }}</td>
                    <td class="px-6 py-3">
                        <div class="flex items-center gap-2">
                            <button @click="openEdit(u)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F5F6F8]" style="color: #5A6376" title="Edit">
                                <Pencil class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <button v-if="u.id !== page.props.auth.user.id && !isImpersonating" @click="confirmDelete(u)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#F6DEDD]" style="color: #AA3C36" title="Delete">
                                <Trash2 class="h-4 w-4" :stroke-width="2" />
                            </button>
                            <button v-if="u.id !== page.props.auth.user.id && page.props.auth.user.is_superadmin && !isImpersonating" @click="impersonate(u)" class="rounded-lg border border-[#D2D6DE] p-2 hover:bg-[#EEF2F7]" style="color: #1D3557" title="Impersonate">
                                <UserCheck class="h-4 w-4" :stroke-width="2" />
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        <div v-else class="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
                <Users class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
            </div>
            <p class="text-sm font-medium" style="color: #404A5C">No users found</p>
            <p class="mt-1 text-sm" style="color: #7C8598">Try a different search term.</p>
        </div>
    </div>

    <Teleport to="body">
        <div v-if="showAddUser" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showAddUser = false">
            <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <h3 class="mb-4 text-base font-semibold" style="color: #1B2231">Add user</h3>
                <form @submit.prevent="submitAddUser" class="space-y-4">
                    <div>
                        <label class="field-label">Name</label>
                        <input v-model="addForm.name" type="text" class="input-field" required />
                        <p v-if="addError.name" class="mt-1 text-xs" style="color: #AA3C36">{{ addError.name }}</p>
                    </div>
                    <div>
                        <label class="field-label">Email</label>
                        <input v-model="addForm.email" type="email" class="input-field" required />
                        <p v-if="addError.email" class="mt-1 text-xs" style="color: #AA3C36">{{ addError.email }}</p>
                    </div>
                    <div>
                        <label class="field-label">Gender</label>
                        <select v-model="addForm.gender" class="input-field">
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label class="field-label">Role</label>
                        <select v-model="addForm.role" class="input-field">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="superadmin">Superadmin</option>
                        </select>
                    </div>
                    <div>
                        <label class="field-label">Grade Level</label>
                        <select v-model="addForm.grade_level_id" class="input-field">
                            <option value="">—</option>
                            <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="field-label">Section</label>
                        <select v-model="addForm.section_id" class="input-field">
                            <option value="">—</option>
                            <option v-for="s in addSections" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="field-label">Password</label>
                        <input v-model="addForm.password" type="password" class="input-field" required />
                        <p v-if="addError.password" class="mt-1 text-xs" style="color: #AA3C36">{{ addError.password }}</p>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" class="btn-secondary" @click="showAddUser = false">Cancel</button>
                        <button type="submit" class="btn-primary">Create</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <Teleport to="body">
        <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="editing = null">
            <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <h3 class="mb-4 text-base font-semibold" style="color: #1B2231">Edit user</h3>
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
                    <div>
                        <label class="field-label">Gender</label>
                        <select v-model="editForm.gender" class="input-field">
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label class="field-label">Role</label>
                        <select v-model="editForm.role" class="input-field">
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="superadmin">Superadmin</option>
                        </select>
                    </div>
                    <div>
                        <label class="field-label">Grade Level</label>
                        <select v-model="editForm.grade_level_id" class="input-field">
                            <option value="">—</option>
                            <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="field-label">Section</label>
                        <select v-model="editForm.section_id" class="input-field">
                            <option value="">—</option>
                            <option v-for="s in editSections" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="field-label">New Password <span class="text-gray-400 text-xs">(leave blank to keep current)</span></label>
                        <input v-model="editForm.password" type="password" class="input-field" autocomplete="new-password" />
                        <p v-if="editError.password" class="mt-1 text-xs" style="color: #AA3C36">{{ editError.password }}</p>
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
import { Pencil, Trash2, Plus, UserCheck, Search, Users, MessageCircle } from '@lucide/vue';
import { computed, ref } from 'vue';

const page = usePage();
const flash = page.props.flash as any;

const props = defineProps<{
    users: any[];
    gradeLevels: { id: number; name: string }[];
    sections: { id: number; name: string; grade_level_id: number }[];
}>();

const editing = ref<any>(null);
const editForm = ref({ name: '', email: '', gender: '', role: '', grade_level_id: '', section_id: '', password: '' });
const editError = ref<any>({});

const showAddUser = ref(false);
const addForm = ref({ name: '', email: '', gender: '', role: 'student', grade_level_id: '', section_id: '', password: '' });
const addError = ref<any>({});

const addSections = computed(() =>
    addForm.value.grade_level_id
        ? props.sections.filter(s => String(s.grade_level_id) === String(addForm.value.grade_level_id))
        : props.sections
);

const editSections = computed(() =>
    editForm.value.grade_level_id
        ? props.sections.filter(s => String(s.grade_level_id) === String(editForm.value.grade_level_id))
        : props.sections
);

const search = ref('');

const filteredUsers = computed(() => {
    if (!search.value) return props.users;
    const q = search.value.toLowerCase();
    return props.users.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
});

function openAddUser() {
    addForm.value = { name: '', email: '', gender: '', role: 'student', grade_level_id: '', section_id: '', password: '' };
    addError.value = {};
    showAddUser.value = true;
}

function submitAddUser() {
    addError.value = {};
    router.post('/teacher/users', addForm.value, {
        preserveScroll: true,
        onSuccess: () => { showAddUser.value = false; },
        onError: (errors) => { addError.value = errors; },
    });
}

function openEdit(u: any) {
    editForm.value = {
        name: u.name, email: u.email, gender: u.gender || '',
        role: u.role, grade_level_id: u.grade_level_id ?? '',
        section_id: u.section_id ?? '', password: ''
    };
    editError.value = {};
    editing.value = u;
}

function saveEdit() {
    editError.value = {};
    router.put(`/teacher/users/${editing.value.id}`, editForm.value, {
        preserveScroll: true,
        onSuccess: () => { editing.value = null; },
        onError: (errors) => { editError.value = errors; },
    });
}

function confirmDelete(u: any) {
    if (confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) {
        router.delete(`/teacher/users/${u.id}`, { preserveScroll: true });
    }
}

const isImpersonating = computed(() => !!(page.props as any).impersonated_by);
const systemMessengerEnabled = computed(() => (page.props as any).messenger_system_enabled !== false);

function impersonate(u: any) {
    router.post(`/teacher/users/${u.id}/impersonate`, {}, {
        preserveScroll: true,
        onSuccess: () => { window.location.reload(); },
    });
}

function leaveImpersonation() {
    router.post('/leave-impersonation', {}, {
        preserveScroll: true,
        onSuccess: () => { window.location.reload(); },
    });
}

function toggleSystemMessenger() {
    router.patch('/teacher/users/toggle-system-messenger', {}, { preserveScroll: true });
}
</script>