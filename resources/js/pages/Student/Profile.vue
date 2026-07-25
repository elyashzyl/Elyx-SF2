<template>
    <Head title="Profile" />

    <div v-if="page.props.flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ page.props.flash.success }}
    </div>

    <div class="mb-8">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Profile</h2>
        <p class="mt-1 text-sm" style="color: #5A6376">Manage your account settings and password.</p>
    </div>

    <div class="mb-6 card p-6">
        <h3 class="mb-1 text-sm font-semibold" style="color: #1B2231">Profile information</h3>
        <p class="mb-5 text-sm" style="color: #7C8598">Update your name and email address.</p>
        <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
                <label class="field-label">Name</label>
                <input v-model="profileForm.name" type="text" class="input-field" required />
                <p v-if="profileForm.errors.name" class="mt-1 text-xs" style="color: #AA3C36">{{ profileForm.errors.name }}</p>
            </div>
            <div>
                <label class="field-label">Email</label>
                <input v-model="profileForm.email" type="email" class="input-field" required />
                <p v-if="profileForm.errors.email" class="mt-1 text-xs" style="color: #AA3C36">{{ profileForm.errors.email }}</p>
            </div>
            <div>
                <label class="field-label">Gender</label>
                <select v-model="profileForm.gender" class="input-field">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
                <p v-if="profileForm.errors.gender" class="mt-1 text-xs" style="color: #AA3C36">{{ profileForm.errors.gender }}</p>
            </div>

            <div v-if="mustVerifyEmail && !user.email_verified_at" class="rounded-lg px-4 py-3 text-sm" style="background-color: #FFF3E0;">
                <p style="color: #B76E00">
                    Your email address is unverified.
                    <button type="button" @click="resendVerification" class="underline hover:no-underline font-medium" style="color: #B76E00">Click here to re-send the verification email.</button>
                </p>
                <p v-if="status === 'verification-link-sent'" class="mt-1 font-medium" style="color: #2F7A54">
                    A new verification link has been sent.
                </p>
            </div>

            <div class="flex items-center gap-3 pt-2">
                <button type="submit" class="btn-primary" :disabled="profileForm.processing">Save</button>
                <span v-if="profileForm.recentlySuccessful" class="text-sm" style="color: #2F7A54">Saved.</span>
            </div>
        </form>
    </div>

    <div class="mb-6 card p-6">
        <h3 class="mb-1 text-sm font-semibold" style="color: #1B2231">Update password</h3>
        <p class="mb-5 text-sm" style="color: #7C8598">Ensure your account is using a strong password.</p>
        <form @submit.prevent="updatePassword" class="space-y-4">
            <div>
                <label class="field-label">Current password</label>
                <input v-model="passwordForm.current_password" type="password" class="input-field" required autocomplete="current-password" />
                <p v-if="passwordForm.errors.current_password" class="mt-1 text-xs" style="color: #AA3C36">{{ passwordForm.errors.current_password }}</p>
            </div>
            <div>
                <label class="field-label">New password</label>
                <input v-model="passwordForm.password" type="password" class="input-field" required autocomplete="new-password" />
                <p v-if="passwordForm.errors.password" class="mt-1 text-xs" style="color: #AA3C36">{{ passwordForm.errors.password }}</p>
            </div>
            <div>
                <label class="field-label">Confirm new password</label>
                <input v-model="passwordForm.password_confirmation" type="password" class="input-field" required autocomplete="new-password" />
            </div>
            <div class="flex items-center gap-3 pt-2">
                <button type="submit" class="btn-primary" :disabled="passwordForm.processing">Save</button>
                <span v-if="passwordForm.recentlySuccessful" class="text-sm" style="color: #2F7A54">Saved.</span>
            </div>
        </form>
    </div>

    <div class="card p-6" style="border-color: #E5B8B5">
        <h3 class="mb-1 text-sm font-semibold" style="color: #AA3C36">Delete account</h3>
        <p class="mb-5 text-sm" style="color: #7C8598">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button @click="showDelete = true" class="btn-secondary" style="border-color: #E5B8B5; color: #AA3C36; background-color: #FFF5F5;">
            <Trash2 class="h-4 w-4" :stroke-width="2" />
            Delete account
        </button>
    </div>

    <Teleport to="body">
        <div v-if="showDelete" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showDelete = false">
            <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <h3 class="mb-2 text-base font-semibold" style="color: #1B2231">Delete account</h3>
                <p class="mb-4 text-sm" style="color: #5A6376">Enter your password to confirm account deletion. This action cannot be undone.</p>
                <form @submit.prevent="deleteAccount">
                    <div class="mb-4">
                        <label class="field-label">Password</label>
                        <input v-model="deleteForm.password" type="password" class="input-field" required autocomplete="current-password" />
                        <p v-if="deleteForm.errors.password" class="mt-1 text-xs" style="color: #AA3C36">{{ deleteForm.errors.password }}</p>
                    </div>
                    <div class="flex items-center justify-end gap-3">
                        <button type="button" class="btn-secondary" @click="showDelete = false">Cancel</button>
                        <button type="submit" class="btn-secondary" :disabled="deleteForm.processing" style="background-color: #F6DEDD; color: #AA3C36; border-color: #E5B8B5">
                            <Trash2 class="h-4 w-4" :stroke-width="2" />
                            {{ deleteForm.processing ? 'Deleting...' : 'Delete' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, router, useForm, usePage } from '@inertiajs/vue3';
import { Trash2 } from '@lucide/vue';
import { computed, ref } from 'vue';
import { send } from '@/routes/verification';

const props = defineProps<{
    mustVerifyEmail?: boolean;
    status?: string;
}>();

const page = usePage();
const user = computed(() => (page.props.auth as any).user);
const showDelete = ref(false);

const profileForm = useForm({
    name: user.value.name,
    email: user.value.email,
    gender: user.value.gender || '',
});

function updateProfile() {
    profileForm.patch('/settings/profile', {
        preserveScroll: true,
    });
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

const deleteForm = useForm({
    password: '',
});

function deleteAccount() {
    deleteForm.delete('/settings/profile', {
        preserveScroll: true,
        onSuccess: () => { showDelete.value = false; },
    });
}
</script>