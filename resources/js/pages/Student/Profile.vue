<template>
    <Head title="Profile" />

    <div
        class="fixed"
        style="
            top: 64px;
            left: 16rem;
            right: 0;
            bottom: 0;
            background: var(--gl-bg);
            overflow-y: auto;
        "
    >
        <div class="px-6 py-6" style="max-width: 80rem">
            <div
                v-if="flash?.success"
                class="gl-fade-in mb-6 rounded-xl px-4 py-3 text-sm"
                style="
                    background: var(--gl-success-bg);
                    color: var(--gl-success);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                "
            >
                {{ flash.success }}
            </div>

            <!-- Hero Banner -->
            <div
                class="gl-fade-in relative mb-8 overflow-hidden rounded-2xl p-8"
                style="
                    background: linear-gradient(
                        135deg,
                        rgba(59, 130, 246, 0.15),
                        rgba(124, 58, 237, 0.1)
                    );
                    border: 1px solid var(--gl-border);
                "
            >
                <div class="relative z-10 flex flex-wrap items-center gap-6">
                    <div
                        class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white"
                        style="
                            background: linear-gradient(
                                135deg,
                                var(--gl-primary),
                                var(--gl-secondary)
                            );
                            box-shadow: 0 0 24px var(--gl-primary-glow);
                        "
                    >
                        {{ user.name.charAt(0) }}
                    </div>
                    <div class="flex-1">
                        <div class="mb-1 flex flex-wrap items-center gap-2">
                            <h1
                                class="text-2xl font-bold"
                                style="color: var(--gl-text-primary)"
                            >
                                {{ user.name }}
                            </h1>
                            <span
                                class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style="
                                    background: rgba(59, 130, 246, 0.12);
                                    color: var(--gl-primary);
                                "
                                >Student</span
                            >
                        </div>
                        <p
                            class="text-sm"
                            style="color: var(--gl-text-secondary)"
                        >
                            {{ user.email }}
                        </p>
                        <div class="mt-2 flex flex-wrap items-center gap-3">
                            <span
                                class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                                style="
                                    background: linear-gradient(
                                        135deg,
                                        rgba(59, 130, 246, 0.15),
                                        rgba(124, 58, 237, 0.12)
                                    );
                                    color: var(--gl-primary);
                                "
                            >
                                <Badge class="h-3.5 w-3.5" :stroke-width="2" />
                                Level {{ userLevel }} · {{ levelTitle }}
                            </span>
                            <span
                                class="flex items-center gap-1 text-xs"
                                style="color: var(--gl-text-muted)"
                            >
                                <Star
                                    class="h-3.5 w-3.5"
                                    style="color: var(--gl-primary)"
                                    :stroke-width="2"
                                />
                                {{ totalPoints }} XP
                            </span>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="mb-1 flex justify-between text-xs">
                        <span style="color: var(--gl-text-secondary)"
                            >Level {{ userLevel }}</span
                        >
                        <span style="color: var(--gl-text-muted)"
                            >{{ xpProgress }} / {{ xpNextLevel }} XP</span
                        >
                    </div>
                    <div class="gl-xp-bar">
                        <div
                            class="gl-xp-bar-fill"
                            :style="{ width: xpProgressPct + '%' }"
                        ></div>
                    </div>
                    <p
                        class="mt-1.5 text-xs"
                        style="color: var(--gl-text-muted)"
                    >
                        {{ xpNextLevel - xpProgress }} XP until Level
                        {{ userLevel + 1 }}
                    </p>
                </div>
                <div
                    class="absolute -top-8 -right-8 h-40 w-40 rounded-full opacity-10"
                    style="
                        background: radial-gradient(
                            circle,
                            var(--gl-primary),
                            transparent 70%
                        );
                    "
                ></div>
                <div
                    class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
                    style="
                        background: radial-gradient(
                            circle,
                            var(--gl-secondary),
                            transparent 70%
                        );
                    "
                ></div>
            </div>

            <!-- Secret Rewards -->
            <div class="gl-glow-card mb-6 overflow-hidden p-0">
                <div
                    class="border-b px-6 py-4"
                    style="border-color: var(--gl-border)"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg"
                            style="background: rgba(251, 191, 36, 0.12)"
                        >
                            <Gift
                                class="h-4 w-4"
                                style="color: var(--gl-accent)"
                                :stroke-width="2"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-sm font-semibold"
                                style="color: var(--gl-text-primary)"
                            >
                                Secret Rewards
                            </h3>
                            <p
                                class="text-xs"
                                style="color: var(--gl-text-muted)"
                            >
                                Level up to unlock hidden rewards. What's behind
                                the next mystery?
                            </p>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <div
                        v-if="secretRewards.length"
                        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <div
                            v-for="r in secretRewards"
                            :key="r.level"
                            class="gl-reward-in relative overflow-hidden rounded-xl p-4"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    rgba(251, 191, 36, 0.1),
                                    rgba(59, 130, 246, 0.06)
                                );
                                border: 1px solid rgba(251, 191, 36, 0.2);
                            "
                        >
                            <div class="mb-2 flex items-center justify-between">
                                <div
                                    class="flex h-9 w-9 items-center justify-center rounded-lg"
                                    style="background: rgba(251, 191, 36, 0.18)"
                                >
                                    <Gift
                                        class="h-4.5 w-4.5"
                                        style="color: var(--gl-accent)"
                                        :stroke-width="2"
                                    />
                                </div>
                                <span
                                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                    style="
                                        background: rgba(59, 130, 246, 0.12);
                                        color: var(--gl-primary);
                                    "
                                    >Level {{ r.level }}</span
                                >
                            </div>
                            <p
                                class="text-sm font-semibold"
                                style="color: var(--gl-text-primary)"
                            >
                                {{ r.title }}
                            </p>
                            <p
                                class="mt-1 text-xs leading-relaxed"
                                style="color: var(--gl-text-secondary)"
                            >
                                {{ r.description }}
                            </p>
                        </div>
                    </div>
                    <div
                        v-else
                        class="mb-3 rounded-xl p-4 text-center text-sm"
                        style="color: var(--gl-text-secondary)"
                    >
                        No rewards unlocked yet — keep earning XP to begin your
                        journey.
                    </div>
                    <div
                        class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
                    >
                        <div
                            v-for="s in lockedSlots"
                            :key="s.level"
                            class="flex flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center"
                            style="
                                background: var(--gl-surface-2);
                                border-color: var(--gl-border);
                            "
                        >
                            <Lock
                                class="mb-1.5 h-5 w-5"
                                style="color: var(--gl-text-muted)"
                                :stroke-width="2"
                            />
                            <p
                                class="text-sm font-bold"
                                style="color: var(--gl-text-muted)"
                            >
                                ???
                            </p>
                            <p
                                class="mt-0.5 text-[10px]"
                                style="color: var(--gl-text-muted)"
                            >
                                Reach Level {{ s.level }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Form -->
            <div class="gl-glow-card mb-6 overflow-hidden p-0">
                <div
                    class="border-b px-6 py-4"
                    style="border-color: var(--gl-border)"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg"
                            style="background: rgba(59, 130, 246, 0.12)"
                        >
                            <User
                                class="h-4 w-4"
                                style="color: var(--gl-primary)"
                                :stroke-width="2"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-sm font-semibold"
                                style="color: var(--gl-text-primary)"
                            >
                                Profile Information
                            </h3>
                            <p
                                class="text-xs"
                                style="color: var(--gl-text-muted)"
                            >
                                Update your name and email address.
                            </p>
                        </div>
                    </div>
                </div>
                <form @submit.prevent="updateProfile" class="space-y-4 p-6">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="field-label"
                                style="color: var(--gl-text-secondary)"
                                >Name</label
                            >
                            <input
                                v-model="profileForm.name"
                                type="text"
                                required
                                class="w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            />
                            <p
                                v-if="profileForm.errors.name"
                                class="mt-1 text-xs"
                                style="color: var(--gl-danger)"
                            >
                                {{ profileForm.errors.name }}
                            </p>
                        </div>
                        <div>
                            <label
                                class="field-label"
                                style="color: var(--gl-text-secondary)"
                                >Email</label
                            >
                            <input
                                v-model="profileForm.email"
                                type="email"
                                required
                                class="w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            />
                            <p
                                v-if="profileForm.errors.email"
                                class="mt-1 text-xs"
                                style="color: var(--gl-danger)"
                            >
                                {{ profileForm.errors.email }}
                            </p>
                        </div>
                        <div>
                            <label
                                class="field-label"
                                style="color: var(--gl-text-secondary)"
                                >Gender</label
                            >
                            <select
                                v-model="profileForm.gender"
                                class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            <p
                                v-if="profileForm.errors.gender"
                                class="mt-1 text-xs"
                                style="color: var(--gl-danger)"
                            >
                                {{ profileForm.errors.gender }}
                            </p>
                        </div>
                        <div>
                            <label
                                class="field-label"
                                style="color: var(--gl-text-secondary)"
                                >Grade Level</label
                            >
                            <select
                                v-model="profileForm.grade_level_id"
                                class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            >
                                <option value="">—</option>
                                <option
                                    v-for="g in gradeLevels"
                                    :key="g.id"
                                    :value="g.id"
                                >
                                    {{ g.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label
                            class="field-label"
                            style="color: var(--gl-text-secondary)"
                            >Section</label
                        >
                        <select
                            v-model="profileForm.section_id"
                            class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                            style="
                                background: var(--gl-surface-2);
                                color: var(--gl-text-primary);
                                border-color: var(--gl-border);
                            "
                        >
                            <option value="">—</option>
                            <option
                                v-for="s in filteredSections"
                                :key="s.id"
                                :value="s.id"
                            >
                                {{ s.name }}
                            </option>
                        </select>
                    </div>

                    <div
                        v-if="mustVerifyEmail && !user.email_verified_at"
                        class="rounded-xl px-4 py-3 text-sm"
                        style="
                            background: var(--gl-warning-bg);
                            color: var(--gl-accent);
                            border: 1px solid rgba(251, 191, 36, 0.2);
                        "
                    >
                        <p>
                            Your email is unverified.
                            <button
                                type="button"
                                @click="resendVerification"
                                class="font-medium underline"
                                style="color: var(--gl-accent)"
                            >
                                Click here to re-send the verification email.
                            </button>
                        </p>
                        <p
                            v-if="status === 'verification-link-sent'"
                            class="mt-1 font-medium"
                            style="color: var(--gl-success)"
                        >
                            A new verification link has been sent.
                        </p>
                    </div>

                    <div class="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            :disabled="profileForm.processing"
                            class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    var(--gl-primary),
                                    var(--gl-secondary)
                                );
                                box-shadow: 0 0 12px var(--gl-primary-glow);
                            "
                        >
                            Save
                        </button>
                        <span
                            v-if="profileForm.recentlySuccessful"
                            class="text-sm"
                            style="color: var(--gl-success)"
                            >Saved.</span
                        >
                    </div>
                </form>
            </div>

            <!-- Password Form -->
            <div class="gl-glow-card mb-6 overflow-hidden p-0">
                <div
                    class="border-b px-6 py-4"
                    style="border-color: var(--gl-border)"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg"
                            style="background: rgba(124, 58, 237, 0.12)"
                        >
                            <Lock
                                class="h-4 w-4"
                                style="color: var(--gl-secondary)"
                                :stroke-width="2"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-sm font-semibold"
                                style="color: var(--gl-text-primary)"
                            >
                                Update Password
                            </h3>
                            <p
                                class="text-xs"
                                style="color: var(--gl-text-muted)"
                            >
                                Ensure your account is using a strong password.
                            </p>
                        </div>
                    </div>
                </div>
                <form @submit.prevent="updatePassword" class="space-y-4 p-6">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                class="field-label"
                                style="color: var(--gl-text-secondary)"
                                >Current password</label
                            >
                            <input
                                v-model="passwordForm.current_password"
                                type="password"
                                required
                                autocomplete="current-password"
                                class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            />
                            <p
                                v-if="passwordForm.errors.current_password"
                                class="mt-1 text-xs"
                                style="color: var(--gl-danger)"
                            >
                                {{ passwordForm.errors.current_password }}
                            </p>
                        </div>
                        <div>
                            <label
                                class="field-label"
                                style="color: var(--gl-text-secondary)"
                                >New password</label
                            >
                            <input
                                v-model="passwordForm.password"
                                type="password"
                                required
                                autocomplete="new-password"
                                class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            />
                            <p
                                v-if="passwordForm.errors.password"
                                class="mt-1 text-xs"
                                style="color: var(--gl-danger)"
                            >
                                {{ passwordForm.errors.password }}
                            </p>
                        </div>
                    </div>
                    <div>
                        <label
                            class="field-label"
                            style="color: var(--gl-text-secondary)"
                            >Confirm new password</label
                        >
                        <input
                            v-model="passwordForm.password_confirmation"
                            type="password"
                            required
                            autocomplete="new-password"
                            class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                            style="
                                background: var(--gl-surface-2);
                                color: var(--gl-text-primary);
                                border-color: var(--gl-border);
                            "
                        />
                    </div>
                    <div class="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            :disabled="passwordForm.processing"
                            class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    var(--gl-primary),
                                    var(--gl-secondary)
                                );
                                box-shadow: 0 0 12px var(--gl-primary-glow);
                            "
                        >
                            Save
                        </button>
                        <span
                            v-if="passwordForm.recentlySuccessful"
                            class="text-sm"
                            style="color: var(--gl-success)"
                            >Saved.</span
                        >
                    </div>
                </form>
            </div>

            <!-- Delete Account -->
            <div
                class="gl-glow-card mb-6 p-6"
                style="border-color: rgba(239, 68, 68, 0.2)"
            >
                <div class="mb-4 flex items-center gap-3">
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg"
                        style="background: var(--gl-danger-bg)"
                    >
                        <Trash2
                            class="h-4 w-4"
                            style="color: var(--gl-danger)"
                            :stroke-width="2"
                        />
                    </div>
                    <div>
                        <h3
                            class="text-sm font-semibold"
                            style="color: var(--gl-danger)"
                        >
                            Delete Account
                        </h3>
                        <p class="text-xs" style="color: var(--gl-text-muted)">
                            Permanently delete your account. This cannot be
                            undone.
                        </p>
                    </div>
                </div>
                <button
                    @click="showDelete = true"
                    class="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                    style="
                        background: var(--gl-danger-bg);
                        color: var(--gl-danger);
                        border: 1px solid rgba(239, 68, 68, 0.2);
                    "
                >
                    <Trash2 class="mr-1.5 inline h-4 w-4" :stroke-width="2" />
                    Delete account
                </button>
            </div>

            <!-- Delete Modal -->
            <Teleport to="body">
                <div
                    v-if="showDelete"
                    class="fixed inset-0 z-50 flex items-center justify-center"
                    style="
                        background: rgba(0, 0, 0, 0.5);
                        backdrop-filter: blur(2px);
                    "
                    @click.self="showDelete = false"
                >
                    <div
                        class="mx-4 w-full max-w-md rounded-2xl p-6"
                        style="
                            background: var(--gl-surface);
                            border: 1px solid var(--gl-border);
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                        "
                    >
                        <div
                            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                            style="background: var(--gl-danger-bg)"
                        >
                            <Trash2
                                class="h-7 w-7"
                                style="color: var(--gl-danger)"
                                :stroke-width="2"
                            />
                        </div>
                        <h3
                            class="mb-2 text-center text-base font-semibold"
                            style="color: var(--gl-text-primary)"
                        >
                            Delete Account
                        </h3>
                        <p
                            class="text-center text-sm"
                            style="color: var(--gl-text-secondary)"
                        >
                            Enter your password to confirm. This action cannot
                            be undone.
                        </p>
                        <form @submit.prevent="deleteAccount">
                            <div class="mt-4">
                                <input
                                    v-model="deleteForm.password"
                                    type="password"
                                    required
                                    autocomplete="current-password"
                                    placeholder="Password"
                                    class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                                    style="
                                        background: var(--gl-surface-2);
                                        color: var(--gl-text-primary);
                                        border-color: var(--gl-border);
                                    "
                                />
                                <p
                                    v-if="deleteForm.errors.password"
                                    class="mt-1 text-xs"
                                    style="color: var(--gl-danger)"
                                >
                                    {{ deleteForm.errors.password }}
                                </p>
                            </div>
                            <div
                                class="mt-5 flex items-center justify-center gap-3"
                            >
                                <button
                                    type="button"
                                    @click="showDelete = false"
                                    class="rounded-xl px-4 py-2.5 text-sm font-medium"
                                    style="
                                        background: var(--gl-surface-2);
                                        color: var(--gl-text-primary);
                                        border: 1px solid var(--gl-border);
                                    "
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    :disabled="deleteForm.processing"
                                    class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                                    style="background: var(--gl-danger)"
                                >
                                    {{
                                        deleteForm.processing
                                            ? 'Deleting...'
                                            : 'Delete'
                                    }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Teleport>

            <!-- Level-Up Secret Reward Reveal -->
            <Teleport to="body">
                <div
                    v-if="showReveal && levelUpReward"
                    class="fixed inset-0 z-[100] flex items-center justify-center"
                    style="
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                    "
                    @click.self="claimReward"
                >
                    <div
                        class="gl-reveal-pop gl-shine relative mx-4 w-full max-w-md overflow-hidden rounded-3xl p-8 text-center"
                        style="
                            background: linear-gradient(
                                160deg,
                                var(--gl-surface),
                                var(--gl-surface-2)
                            );
                            border: 1px solid rgba(251, 191, 36, 0.3);
                            box-shadow: 0 8px 48px rgba(0, 0, 0, 0.5);
                        "
                    >
                        <span
                            v-for="(s, i) in sparkles"
                            :key="i"
                            class="gl-sparkle absolute rounded-full"
                            :style="{
                                left: s.x + '%',
                                top: s.y + '%',
                                width: s.size + 'px',
                                height: s.size + 'px',
                                background: s.color,
                                animationDelay: s.delay + 's',
                            }"
                        ></span>
                        <div
                            class="gl-pulse-glow mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    var(--gl-accent),
                                    #f59e0b
                                );
                                box-shadow: 0 0 24px var(--gl-accent-glow);
                            "
                        >
                            <Gift
                                class="h-8 w-8 text-white"
                                :stroke-width="2"
                            />
                        </div>
                        <p
                            class="text-xs font-bold tracking-[0.2em] uppercase"
                            style="color: var(--gl-accent)"
                        >
                            Secret Reward Unlocked
                        </p>
                        <h2
                            class="mt-1 text-3xl font-extrabold"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    var(--gl-accent),
                                    var(--gl-primary)
                                );
                                -webkit-background-clip: text;
                                background-clip: text;
                                color: transparent;
                            "
                        >
                            LEVEL UP!
                        </h2>
                        <p
                            class="mt-2 text-sm font-semibold"
                            style="color: var(--gl-text-primary)"
                        >
                            You reached
                            <span
                                class="rounded-full px-2 py-0.5"
                                style="
                                    background: rgba(59, 130, 246, 0.12);
                                    color: var(--gl-primary);
                                "
                                >Level {{ levelUpReward.level }} ·
                                {{ titleForLevel(levelUpReward.level) }}</span
                            >
                        </p>
                        <div
                            class="mx-auto mt-4 max-w-sm rounded-2xl p-5"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    rgba(251, 191, 36, 0.12),
                                    rgba(59, 130, 246, 0.06)
                                );
                                border: 1px solid rgba(251, 191, 36, 0.25);
                            "
                        >
                            <p
                                class="text-base font-bold"
                                style="color: var(--gl-text-primary)"
                            >
                                {{ levelUpReward.title }}
                            </p>
                            <p
                                class="mt-1 text-sm leading-relaxed"
                                style="color: var(--gl-text-secondary)"
                            >
                                {{ levelUpReward.description }}
                            </p>
                        </div>
                        <button
                            @click="claimReward"
                            class="mt-6 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    var(--gl-primary),
                                    var(--gl-secondary)
                                );
                                box-shadow: 0 0 12px var(--gl-primary-glow);
                            "
                        >
                            Claim Reward
                        </button>
                    </div>
                </div>
            </Teleport>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, router, useForm, usePage } from '@inertiajs/vue3';
import { Trash2, User, Lock, Star, Badge, Gift } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import {
    levelForPoints,
    titleForLevel,
    progressForLevel,
    nextLevelPoints,
    progressPct,
} from '@/lib/levels';
import { send } from '@/routes/verification';

const props = defineProps<{
    mustVerifyEmail?: boolean;
    status?: string;
    gradeLevels?: { id: number; name: string }[];
    sections?: { id: number; name: string; grade_level_id: number }[];
    secretRewards?: { level: number; title: string; description: string }[];
}>();

const REVEAL_KEY = 'edupulse:last-revealed-level';
const sparkleColors = ['#FBBF24', '#3B82F6', '#7C3AED', '#10B981', '#F59E0B'];

const page = usePage();
const flash = page.props.flash as any;
const user = computed(() => (page.props.auth as any).user);
const totalPoints = computed(() => user.value?.total_points ?? 0);
const userLevel = computed(() => levelForPoints(totalPoints.value));
const levelTitle = computed(() => titleForLevel(userLevel.value));
const xpNextLevel = computed(() => nextLevelPoints(totalPoints.value));
const xpProgress = computed(() => progressForLevel(totalPoints.value));
const xpProgressPct = computed(() => progressPct(totalPoints.value));
const showDelete = ref(false);

const secretRewards = computed(() => props.secretRewards || []);
const lockedSlots = computed(() =>
    Array.from({ length: 5 }, (_, i) => ({
        level: userLevel.value + 1 + i,
    })),
);

const showReveal = ref(false);
const levelUpReward = ref<{
    level: number;
    title: string;
    description: string;
} | null>(null);

const sparkles = computed(() =>
    Array.from({ length: 12 }, (_, i) => ({
        x: 8 + ((i * 37) % 84),
        y: 4 + ((i * 53) % 82),
        size: 4 + ((i * 7) % 9),
        color: sparkleColors[i % sparkleColors.length],
        delay: (i % 6) * 0.15,
    })),
);

function revealOnLevelUp() {
    const rewards = secretRewards.value;

    if (!rewards.length) {
        return;
    }

    const maxUnlockedLevel = Math.max(...rewards.map((r) => r.level));
    let lastSeen = 0;

    try {
        lastSeen = Number(localStorage.getItem(REVEAL_KEY) || 0);
    } catch {
        /* ignore */
    }

    if (maxUnlockedLevel <= lastSeen) {
        return;
    }

    const newest = rewards.find((r) => r.level === maxUnlockedLevel);

    if (!newest) {
        return;
    }

    levelUpReward.value = newest;
    showReveal.value = true;

    try {
        localStorage.setItem(REVEAL_KEY, String(maxUnlockedLevel));
    } catch {
        /* ignore */
    }
}

function claimReward() {
    showReveal.value = false;
    levelUpReward.value = null;
}

onMounted(() => {
    revealOnLevelUp();
});

const profileForm = useForm({
    name: user.value.name,
    email: user.value.email,
    gender: user.value.gender || '',
    grade_level_id: user.value.grade_level_id ?? '',
    section_id: user.value.section_id ?? '',
});

const filteredSections = computed(() =>
    profileForm.grade_level_id
        ? (props.sections || []).filter(
              (s) =>
                  String(s.grade_level_id) ===
                  String(profileForm.grade_level_id),
          )
        : props.sections || [],
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
        onSuccess: () => {
            showDelete.value = false;
        },
    });
}
</script>
