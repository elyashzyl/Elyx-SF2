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
        style="background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.1)); border: 1px solid var(--gl-border);">
        <div class="relative z-10 flex flex-wrap items-center gap-6">
            <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white"
                style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 24px var(--gl-primary-glow);">
                {{ user.name.charAt(0) }}
            </div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">{{ user.name }}</h1>
                    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style="background: rgba(59,130,246,0.12); color: var(--gl-primary);">Student</span>
                </div>
                <p class="text-sm" style="color: var(--gl-text-secondary)">{{ user.email }}</p>
                <div class="flex flex-wrap items-center gap-3 mt-2">
                    <span class="flex items-center gap-1 text-xs" style="color: var(--gl-text-muted);">
                        <Award class="h-3.5 w-3.5" style="color: var(--gl-accent);" :stroke-width="2" />
                        Level {{ userLevel }}
                    </span>
                    <span class="flex items-center gap-1 text-xs" style="color: var(--gl-text-muted);">
                        <Star class="h-3.5 w-3.5" style="color: var(--gl-primary);" :stroke-width="2" />
                        {{ totalPoints }} XP
                    </span>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <div class="flex justify-between text-xs mb-1">
                <span style="color: var(--gl-text-secondary)">Level {{ userLevel }}</span>
                <span style="color: var(--gl-text-muted)">{{ xpProgress }} / {{ xpNextLevel }} XP</span>
            </div>
            <div class="gl-xp-bar">
                <div class="gl-xp-bar-fill" :style="{ width: xpProgressPct + '%' }"></div>
            </div>
            <p class="text-xs mt-1.5" style="color: var(--gl-text-muted)">
                {{ xpNextLevel - xpProgress }} XP until Level {{ userLevel + 1 }}
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
            style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
    </div>

    <!-- Profile Form -->
    <div class="gl-glow-card mb-6 overflow-hidden p-0">
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg" style="background: rgba(59,130,246,0.12);">
                    <User class="h-4 w-4" style="color: var(--gl-primary);" :stroke-width="2" />
                </div>
                <div>
                    <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">Profile Information</h3>
                    <p class="text-xs" style="color: var(--gl-text-muted)">Update your name and email address.</p>
                </div>
            </div>
        </div>
        <form @submit.prevent="updateProfile" class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">Name</label>
                    <input v-model="profileForm.name" type="text" required
                        class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                        style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                    <p v-if="profileForm.errors.name" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ profileForm.errors.name }}</p>
                </div>
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">Email</label>
                    <input v-model="profileForm.email" type="email" required
                        class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                        style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                    <p v-if="profileForm.errors.email" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ profileForm.errors.email }}</p>
                </div>
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">Gender</label>
                    <select v-model="profileForm.gender"
                        class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                        style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    <p v-if="profileForm.errors.gender" class="mt-1 text-xs" style="color: var(--gl-danger)">{{ profileForm.errors.gender }}</p>
                </div>
                <div>
                    <label class="field-label" style="color: var(--gl-text-secondary);">Grade Level</label>
                    <select v-model="profileForm.grade_level_id"
                        class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                        style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                        <option value="">—</option>
                        <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="field-label" style="color: var(--gl-text-secondary);">Section</label>
                <select v-model="profileForm.section_id"
                    class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                    style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                    <option value="">—</option>
                    <option v-for="s in filteredSections" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
            </div>

            <div v-if="mustVerifyEmail && !user.email_verified_at" class="rounded-xl px-4 py-3 text-sm"
                style="background: var(--gl-warning-bg); color: var(--gl-accent); border: 1px solid rgba(251,191,36,0.2);">
                <p>Your email is unverified.
                    <button type="button" @click="resendVerification" class="underline font-medium" style="color: var(--gl-accent);">Click here to re-send the verification email.</button>
                </p>
                <p v-if="status === 'verification-link-sent'" class="mt-1 font-medium" style="color: var(--gl-success)">
                    A new verification link has been sent.
                </p>
            </div>

            <div class="flex items-center gap-3 pt-2">
                <button type="submit" :disabled="profileForm.processing"
                    class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">Save</button>
                <span v-if="profileForm.recentlySuccessful" class="text-sm" style="color: var(--gl-success)">Saved.</span>
            </div>
        </form>
    </div>

    <!-- Password Form -->
    <div class="gl-glow-card mb-6 overflow-hidden p-0">
        <div class="px-6 py-4 border-b" style="border-color: var(--gl-border);">
            <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg" style="background: rgba(124,58,237,0.12);">
                    <Lock class="h-4 w-4" style="color: var(--gl-secondary);" :stroke-width="2" />
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
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">Save</button>
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
import { Trash2, User, Lock, Award, Star } from '@lucide/vue';
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
const totalPoints = computed(() => user.value?.total_points ?? 0);
const userLevel = computed(() => Math.floor(totalPoints.value / 100) + 1);
const xpNextLevel = computed(() => userLevel.value * 100);
const xpProgress = computed(() => totalPoints.value % 100);
const xpProgressPct = computed(() => Math.min(100, Math.round((xpProgress.value / xpNextLevel.value) * 100)));
const showDelete = ref(false);

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
