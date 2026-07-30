<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import { ref } from 'vue';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';
import { Shield, Lock } from '@lucide/vue';

defineOptions({
    layout: {
        title: 'Reset password',
        description: 'Please enter your new password below',
    },
});

const props = defineProps<{
    token: string;
    email: string;
    passwordRules: string;
}>();

const inputEmail = ref(props.email);
</script>

<template>
    <Head title="Reset password" />

    <div class="fixed inset-0 flex login-dark items-center justify-center" style="background: #0F172A;">
        <div class="absolute inset-0" style="background: radial-gradient(circle at 30% 50%, rgba(59,130,246,0.06), transparent 50%), radial-gradient(circle at 70% 50%, rgba(124,58,237,0.06), transparent 50%);"></div>

        <div class="relative z-10 w-full max-w-md px-6">
            <div class="rounded-3xl p-8" style="background: #1E293B; border: 1px solid #273449; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                <div class="mb-6 text-center">
                    <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, #7C3AED, #3B82F6); box-shadow: 0 0 24px rgba(124,58,237,0.3);">
                        <Shield class="h-8 w-8 text-white" :stroke-width="1.5" />
                    </div>
                    <h2 class="text-xl font-bold" style="color: #F8FAFC;">Create a Strong Password</h2>
                    <p class="text-sm mt-2" style="color: #CBD5E1;">Secure your account and continue your learning adventure.</p>
                </div>

                <Form
                    v-bind="update.form()"
                    :transform="(data) => ({ ...data, token, email })"
                    :reset-on-success="['password', 'password_confirmation']"
                    v-slot="{ errors, processing }"
                >
                    <div class="grid gap-5">
                        <div class="grid gap-2">
                            <Label for="email" style="color: #CBD5E1;">Email</Label>
                            <Input id="email" type="email" name="email" autocomplete="email" v-model="inputEmail" readonly />
                            <InputError :message="errors.email" />
                        </div>

                        <div class="grid gap-2">
                            <Label for="password" style="color: #CBD5E1;">New password</Label>
                            <PasswordInput id="password" name="password" autocomplete="new-password" autofocus placeholder="Password" :passwordrules="passwordRules" />
                            <InputError :message="errors.password" />
                        </div>

                        <div class="grid gap-2">
                            <Label for="password_confirmation" style="color: #CBD5E1;">Confirm password</Label>
                            <PasswordInput id="password_confirmation" name="password_confirmation" autocomplete="new-password" placeholder="Confirm password" :passwordrules="passwordRules" />
                            <InputError :message="errors.password_confirmation" />
                        </div>

                        <Button type="submit" class="w-full" :disabled="processing" data-test="reset-password-button">
                            <Spinner v-if="processing" />
                            <Lock v-else class="h-4 w-4 mr-1.5" :stroke-width="2" />
                            Reset password
                        </Button>
                    </div>
                </Form>
            </div>

            <p class="text-center text-xs mt-6" style="color: #94A3B8;">Learn. Play. Achieve.</p>
        </div>
    </div>
</template>

<style>
.login-dark {
  --background: #0F172A; --foreground: #F8FAFC; --card: #1E293B; --card-foreground: #F8FAFC;
  --border: #273449; --input: #273449; --muted-foreground: #94A3B8; --muted: #263348;
  --primary: #3B82F6; --primary-foreground: #FFF; --secondary: #263348; --secondary-foreground: #F8FAFC;
  --accent: #1E293B; --accent-foreground: #F8FAFC; --ring: #3B82F6;
  --gl-text-primary: #F8FAFC; --gl-text-secondary: #CBD5E1; --gl-text-muted: #94A3B8;
  --gl-primary: #3B82F6; --gl-secondary: #7C3AED; --gl-accent: #FBBF24; --gl-success: #10B981;
  --gl-primary-glow: rgba(59,130,246,0.25); --gl-secondary-glow: rgba(124,58,237,0.25);
  --gl-surface-2: #1E293B; --gl-border: #273449;
  color-scheme: dark;
}
.login-dark input::placeholder { color: #64748B !important; }
.login-dark [data-slot="input"] { background: #1E293B !important; border-color: #273449 !important; color: #F8FAFC !important; }
.login-dark [data-slot="button"] { background: linear-gradient(135deg, #3B82F6, #7C3AED) !important; color: #FFF !important; box-shadow: 0 0 12px rgba(59,130,246,0.3); }
.login-dark [data-slot="label"], .login-dark label { color: #CBD5E1 !important; }
.login-dark a { color: #60A5FA; }
.login-dark span { color: #CBD5E1; }
</style>
