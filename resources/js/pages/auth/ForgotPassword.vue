<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Key, Mail, ArrowLeft } from '@lucide/vue';

defineOptions({
    layout: {
        title: 'Forgot password',
        description: 'Enter your email to receive a password reset link',
    },
});

defineProps<{
    status?: string;
}>();
</script>

<template>
    <Head title="Forgot password" />

    <div class="fixed inset-0 flex login-dark items-center justify-center" style="background: #0F172A;">
        <!-- Ambient bg -->
        <div class="absolute inset-0" style="background: radial-gradient(circle at 30% 50%, rgba(59,130,246,0.06), transparent 50%), radial-gradient(circle at 70% 50%, rgba(124,58,237,0.06), transparent 50%);"></div>

        <div class="relative z-10 w-full max-w-md px-6">
            <!-- Card -->
            <div class="rounded-3xl p-8" style="background: #1E293B; border: 1px solid #273449; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                <div class="mb-6 text-center">
                    <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, #3B82F6, #7C3AED); box-shadow: 0 0 24px rgba(59,130,246,0.3);">
                        <Key class="h-8 w-8 text-white" :stroke-width="1.5" />
                    </div>
                    <h2 class="text-xl font-bold" style="color: #F8FAFC;">Recover Your Adventure</h2>
                    <p class="text-sm mt-2" style="color: #CBD5E1;">Don't worry — your progress is safe. Enter your email and we'll send you a recovery link.</p>
                </div>

                <div v-if="status" class="mb-6 rounded-2xl px-4 py-3 text-sm text-center"
                    style="background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.2);">
                    {{ status }}
                </div>

                <Form v-bind="email.form()" v-slot="{ errors, processing }">
                    <div class="grid gap-2 mb-6">
                        <Label for="email" style="color: #CBD5E1;">Email address</Label>
                        <Input id="email" type="email" name="email" autocomplete="off" autofocus placeholder="email@example.com" />
                        <InputError :message="errors.email" />
                    </div>

                    <Button class="w-full mb-4" :disabled="processing">
                        <Spinner v-if="processing" />
                        <Mail v-else class="h-4 w-4 mr-1.5" :stroke-width="2" />
                        Send Recovery Link
                    </Button>
                </Form>

                <div class="text-center">
                    <TextLink :href="login()" class="inline-flex items-center gap-1 text-sm">
                        <ArrowLeft class="h-3.5 w-3.5" :stroke-width="2" />
                        Back to log in
                    </TextLink>
                </div>
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
