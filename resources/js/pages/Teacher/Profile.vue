<template>
    <Head title="Profile" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background: var(--gl-bg); overflow-y: auto;">
        <div class="px-6 py-6" style="max-width: 80rem;">

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <!-- Hero Banner -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.08)); border: 1px solid var(--gl-border);">
        <div class="relative z-10 flex flex-wrap items-center gap-6">
            <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white"
                style="background: linear-gradient(135deg, var(--gl-secondary), var(--gl-primary)); box-shadow: 0 0 24px var(--gl-secondary-glow);">
                {{ user.name.charAt(0) }}
            </div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ user.name }}</h1>
                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        :style="user.role === 'superadmin' ? 'background: rgba(251,191,36,0.12); color: var(--gl-accent);' : 'background: rgba(124,58,237,0.12); color: var(--gl-secondary);'">
                        {{ user.role === 'superadmin' ? 'Superadmin' : 'Teacher' }}
                    </span>
                </div>
                <p class="text-sm" style="color: var(--gl-text-secondary)">{{ user.email }}</p>
            </div>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
    </div>

    <!-- Messenger Toggle -->
    <div class="gl-glow-card mb-6 overflow-hidden p-0">
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg" style="background: rgba(59,130,246,0.12);">
                    <MessageCircle class="h-4 w-4" style="color: var(--gl-primary);" :stroke-width="2" />
                </div>
                <div>
                    <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Messenger</h3>
                    <p class="text-xs" style="color: var(--gl-text-muted)">Enable or disable the messaging feature.</p>
                </div>
            </div>
        </div>
        <div class="p-4 flex items-center justify-between">
            <span class="text-sm" style="color: var(--gl-text-secondary)">Allow students to message you</span>
            <button @click="toggleMessenger" class="relative w-12 h-6 rounded-full transition-colors" :style="{ background: messengerEnabled ? 'var(--gl-success)' : '#475569' }">
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform" :style="{ transform: messengerEnabled ? 'translateX(24px)' : 'translateX(0)' }"></span>
            </button>
        </div>
    </div>

    <!-- Password Form -->
    <div class="gl-glow-card mb-6 overflow-hidden p-0">
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg" style="background: rgba(59,130,246,0.12);">
                    <Lock class="h-4 w-4" style="color: var(--gl-primary);" :stroke-width="2" />
                </div>
                <div>
                    <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Update Password</h3>
                    <p class="text-xs" style="color: var(--gl-text-muted)">Ensure your account is using a strong password.</p>
                </div>
            </div>
        </div>
        <form @submit.prevent="updatePassword" class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">Current password</label>
                    <input v-model="passwordForm.current_password" type="password" required autocomplete="current-password"
                        class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                        style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                    <p v-if="passwordForm.errors.current_password" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ passwordForm.errors.current_password }}</p>
                </div>
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">New password</label>
                    <input v-model="passwordForm.password" type="password" required autocomplete="new-password"
                        class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                        style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                    <p v-if="passwordForm.errors.password" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ passwordForm.errors.password }}</p>
                </div>
            </div>
            <div>
                <label class="field-label" style="color: var(--gl-text-secondary);">Confirm new password</label>
                <input v-model="passwordForm.password_confirmation" type="password" required autocomplete="new-password"
                    class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                    style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
            </div>
            <div class="flex items-center gap-3 pt-2">
                <button type="submit" :disabled="passwordForm.processing"
                    class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                    style="background: linear-gradient(135deg, var(--gl-secondary), var(--gl-primary)); box-shadow: 0 0 12px var(--gl-secondary-glow);">Save</button>
                <span v-if="passwordForm.recentlySuccessful" class="text-sm" style="color: var(--gl-success)">Saved.</span>
            </div>
        </form>
    </div>

    <!-- Delete Account -->
    <div class="gl-glow-card mb-6 p-6" style="border-color: rgba(239,68,68,0.2);">
        <div class="flex items-center gap-3 mb-4">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg" style="background: var(--gl-danger-bg);">
                <Trash2 class="h-4 w-4" style="color: var(--gl-danger);" :stroke-width="2" />
            </div>
            <div>
                <h3 class="text-sm font-semibold" style="color: var(--gl-danger)">Delete Account</h3>
                <p class="text-xs" style="color: var(--gl-text-muted)">Permanently delete your account. This cannot be undone.</p>
            </div>
        </div>
        <button @click="showDelete = true"
            class="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            style="background: var(--gl-danger-bg); color: var(--gl-danger); border: 1px solid rgba(239,68,68,0.2);">
            <Trash2 class="h-4 w-4 inline mr-1.5" :stroke-width="2" />
            Delete account
        </button>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
        <div v-if="showDelete" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="showDelete = false">
            <div class="mx-4 w-full max-w-md rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style="background: var(--gl-danger-bg);">
                    <Trash2 class="h-7 w-7" style="color: var(--gl-danger);" :stroke-width="2" />
                </div>
                <h3 class="mb-2 text-base font-semibold text-center" style="color: var(--gl-text-primary)">Delete Account</h3>
                <p class="text-sm text-center" style="color: var(--gl-text-secondary)">Enter your password to confirm. This action cannot be undone.</p>
                <form @submit.prevent="deleteAccount">
                    <div class="mt-4">
                        <input v-model="deleteForm.password" type="password" required autocomplete="current-password" placeholder="Password"
                            class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                        <p v-if="deleteForm.errors.password" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ deleteForm.errors.password }}</p>
                    </div>
                    <div class="mt-5 flex items-center justify-center gap-3">
                        <button type="button" @click="showDelete = false"
                            class="rounded-xl px-4 py-2.5 text-sm font-medium"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                        <button type="submit" :disabled="deleteForm.processing"
                            class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                            style="background: var(--gl-danger);">{{ deleteForm.processing ? 'Deleting...' : 'Delete' }}</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, router, useForm, usePage } from '@inertiajs/vue3';
import { Trash2, User, Lock, MessageCircle } from '@lucide/vue';
import { send } from '@/routes/verification';

const props = defineProps<{
    mustVerifyEmail?: boolean;
    status?: string;
    gradeLevels?: { id: number; name: string }[];
    sections?: { id: number; name: string; grade_level_id: number }[];
}>();

const page = usePage();
const flash = page.props.flash as any;
const user = computed(() => (page.props.auth as any).user);
const messengerEnabled = ref(user.value?.messenger_enabled != false);
const showDelete = ref(false);

function toggleMessenger() {
    router.patch('/teacher/profile/toggle-messenger', {}, { preserveScroll: true });
}

const profileForm = useForm({
    name: user.value.name,
    email: user.value.email,
    gender: user.value.gender || '',
    grade_level_id: user.value.grade_level_id ?? '',
    section_id: user.value.section_id ?? '',
});

const filteredSections = computed(() =>
    profileForm.grade_level_id
        ? (props.sections || []).filter(s => String(s.grade_level_id) === String(profileForm.grade_level_id))
        : (props.sections || [])
);

function updateProfile() {
    profileForm.patch('/settings/profile', { preserveScroll: true });
}

function resendVerification() {
    router.post(send.url());
}

const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
});

function updatePassword() {
    passwordForm.put('/settings/password', {
        preserveScroll: true,
        onSuccess: () => passwordForm.reset(),
    });
}

const deleteForm = useForm({ password: '' });

function deleteAccount() {
    deleteForm.delete('/settings/profile', {
        preserveScroll: true,
        onSuccess: () => { showDelete.value = false; },
    });
}
</script>
