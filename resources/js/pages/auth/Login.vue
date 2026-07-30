<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { GraduationCap, Trophy, Star, Zap, Sparkles } from '@lucide/vue';

defineOptions({
    layout: {
        title: 'Log in',
        description: 'Enter your email and password to log in',
    },
});

defineProps<{
    status?: string;
    canResetPassword: boolean;
}>();
</script>

<template>
    <Head title="Log in" />

    <div class="fixed inset-0 flex login-dark" style="background: #0F172A;">
        <!-- Left: Hero Section -->
        <div class="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col items-center justify-center">
            <!-- Ambient background -->
            <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95));"></div>
            <div class="absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-10"
                style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
            <div class="absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-10"
                style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
            <div class="absolute top-20 right-20 h-64 w-64 rounded-full opacity-5"
                style="background: radial-gradient(circle, var(--gl-accent), transparent 70%);"></div>

            <!-- Content -->
            <div class="relative z-10 max-w-md text-center">
                <div class="mb-8 flex justify-center">
                    <div class="flex h-20 w-20 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 40px var(--gl-primary-glow);">
                        <GraduationCap class="h-10 w-10 text-white" :stroke-width="1.5" />
                    </div>
                </div>
                <h1 class="text-4xl font-bold mb-3" style="color: #F8FAFC;">
                    <span style="color: var(--gl-primary);">Edu</span>Pulse
                </h1>
                <p class="text-lg font-semibold mb-2" style="color: var(--gl-text-primary);">Level Up Your Learning</p>
                <p class="text-sm mb-10" style="color: var(--gl-text-secondary);">
                    Complete challenges, earn XP, unlock achievements, and become a top learner.
                </p>

                <!-- Feature Cards -->
                <div class="grid grid-cols-3 gap-3">
                    <div class="rounded-xl p-4 text-center transition-all hover:scale-105"
                        style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);">
                        <Trophy class="h-6 w-6 mx-auto mb-1.5" style="color: var(--gl-accent);" :stroke-width="2" />
                        <p class="text-xs font-semibold" style="color: var(--gl-text-primary);">Earn XP</p>
                        <p class="text-[10px] mt-0.5" style="color: var(--gl-text-muted);">Level up</p>
                    </div>
                    <div class="rounded-xl p-4 text-center transition-all hover:scale-105"
                        style="background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.15);">
                        <Star class="h-6 w-6 mx-auto mb-1.5" style="color: var(--gl-secondary);" :stroke-width="2" />
                        <p class="text-xs font-semibold" style="color: var(--gl-text-primary);">Achievements</p>
                        <p class="text-[10px] mt-0.5" style="color: var(--gl-text-muted);">Collect badges</p>
                    </div>
                    <div class="rounded-xl p-4 text-center transition-all hover:scale-105"
                        style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15);">
                        <Zap class="h-6 w-6 mx-auto mb-1.5" style="color: var(--gl-success);" :stroke-width="2" />
                        <p class="text-xs font-semibold" style="color: var(--gl-text-primary);">Leaderboard</p>
                        <p class="text-[10px] mt-0.5" style="color: var(--gl-text-muted);">Compete</p>
                    </div>
                </div>
            </div>

            <!-- Floating sparkles -->
            <div class="absolute top-1/4 left-1/4 text-xs opacity-20" style="color: var(--gl-accent);">✦</div>
            <div class="absolute top-1/3 right-1/3 text-xs opacity-30" style="color: var(--gl-primary);">✦</div>
            <div class="absolute bottom-1/4 left-1/2 text-xs opacity-15" style="color: var(--gl-secondary);">✦</div>
        </div>

        <!-- Right: Login Form -->
        <div class="flex flex-1 items-center justify-center p-8 lg:p-0">
            <div class="w-full max-w-sm">
                <div v-if="status" class="mb-6 rounded-xl px-4 py-3 text-sm text-center"
                    style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
                    {{ status }}
                </div>

                <!-- Welcome -->
                <div class="text-center mb-8">
                    <h2 class="text-2xl font-bold mb-1" style="color: var(--gl-text-primary);">Welcome Back</h2>
                    <p class="text-sm" style="color: var(--gl-text-secondary);">Continue your learning journey</p>
                </div>

                <Form
                    v-bind="store.form()"
                    :reset-on-success="['password']"
                    v-slot="{ errors, processing }"
                    class="flex flex-col gap-5"
                >
                    <div class="grid gap-1.5">
                        <Label for="email" style="color: var(--gl-text-secondary);">Email</Label>
                        <Input id="email" type="email" name="email" required autofocus autocomplete="email" placeholder="email@example.com" />
                        <InputError :message="errors.email" />
                    </div>

                    <div class="grid gap-1.5">
                        <div class="flex items-center justify-between">
                            <Label for="password" style="color: var(--gl-text-secondary);">Password</Label>
                            <TextLink v-if="canResetPassword" :href="request()" class="text-sm">Forgot password?</TextLink>
                        </div>
                        <PasswordInput id="password" name="password" required autocomplete="current-password" placeholder="Password" />
                        <InputError :message="errors.password" />
                    </div>

                    <Label for="remember" class="flex items-center gap-3">
                        <Checkbox id="remember" name="remember" />
                        <span class="text-sm" style="color: var(--gl-text-secondary);">Remember me</span>
                    </Label>

                    <Button type="submit" class="mt-2 w-full" :disabled="processing">
                        <Spinner v-if="processing" />
                        <Sparkles v-else class="h-4 w-4 mr-1.5" :stroke-width="2" />
                        Sign In
                    </Button>

                    <p class="text-center text-sm" style="color: var(--gl-text-secondary);">
                        Don't have an account?
                        <TextLink :href="register()">Sign up</TextLink>
                    </p>
                </Form>

                <p class="text-center text-xs mt-8" style="color: var(--gl-text-muted);">
                    Learn. Play. Achieve.
                </p>
            </div>
        </div>
    </div>
</template>

<style>
.login-dark {
  --background: #0F172A;
  --foreground: #F8FAFC;
  --card: #1E293B;
  --card-foreground: #F8FAFC;
  --border: #273449;
  --input: #273449;
  --muted-foreground: #94A3B8;
  --muted: #263348;
  --primary: #3B82F6;
  --primary-foreground: #FFF;
  --secondary: #263348;
  --secondary-foreground: #F8FAFC;
  --accent: #1E293B;
  --accent-foreground: #F8FAFC;
  --ring: #3B82F6;
  --gl-text-primary: #F8FAFC;
  --gl-text-secondary: #CBD5E1;
  --gl-text-muted: #94A3B8;
  --gl-primary: #3B82F6;
  --gl-secondary: #7C3AED;
  --gl-accent: #FBBF24;
  --gl-success: #10B981;
  --gl-primary-glow: rgba(59,130,246,0.25);
  --gl-secondary-glow: rgba(124,58,237,0.25);
  --gl-surface-2: #1E293B;
  --gl-border: #273449;
  color-scheme: dark;
}
.login-dark input::placeholder { color: #64748B !important; }
.login-dark [data-slot="input"] { background: #1E293B !important; border-color: #273449 !important; color: #F8FAFC !important; }
.login-dark [data-slot="button"] { background: linear-gradient(135deg, #3B82F6, #7C3AED) !important; color: #FFF !important; box-shadow: 0 0 12px rgba(59,130,246,0.3); }
.login-dark [data-slot="label"], .login-dark label { color: #CBD5E1 !important; }
.login-dark a { color: #60A5FA; }
.login-dark span { color: #CBD5E1; }
</style>
