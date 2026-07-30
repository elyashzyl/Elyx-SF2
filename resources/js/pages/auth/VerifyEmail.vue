<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Mail, CheckCircle2 } from '@lucide/vue';

defineOptions({
    layout: {
        title: 'Email verification',
        description: 'Please verify your email address by clicking on the link we just emailed to you.',
    },
});

defineProps<{
    status?: string;
}>();
</script>

<template>
    <Head title="Email verification" />

    <div class="fixed inset-0 flex login-dark items-center justify-center" style="background: #0F172A;">
        <div class="absolute inset-0" style="background: radial-gradient(circle at 30% 50%, rgba(59,130,246,0.06), transparent 50%), radial-gradient(circle at 70% 50%, rgba(16,185,129,0.06), transparent 50%);"></div>

        <div class="relative z-10 w-full max-w-md px-6">
            <div class="rounded-3xl p-8 text-center" style="background: #1E293B; border: 1px solid #273449; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style="background: linear-gradient(135deg, #10B981, #3B82F6); box-shadow: 0 0 24px rgba(16,185,129,0.3);">
                    <Mail class="h-8 w-8 text-white" :stroke-width="1.5" />
                </div>
                <h2 class="text-xl font-bold" style="color: #F8FAFC;">Verify Your Account</h2>
                <p class="text-sm mt-2" style="color: #CBD5E1;">Confirm your email to unlock your learning adventure. Check your inbox for the verification link we just sent.</p>

                <div v-if="status === 'verification-link-sent'" class="mt-5 rounded-2xl px-4 py-3 text-sm"
                    style="background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.2);">
                    <CheckCircle2 class="inline h-4 w-4 mr-1" :stroke-width="2" />
                    A new verification link has been sent to your email.
                </div>

                <Form v-bind="send.form()" class="mt-6" v-slot="{ processing }">
                    <Button :disabled="processing" variant="secondary">
                        <Spinner v-if="processing" />
                        <Mail v-else class="h-4 w-4 mr-1.5" :stroke-width="2" />
                        Resend verification email
                    </Button>
                </Form>

                <div class="mt-5">
                    <TextLink :href="logout()" as="button" class="text-sm">
                        Log out
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
.login-dark [data-slot="input"] { background: #1E293B !important; border-color: #273449 !important; color: #F8FAFC !important; }
.login-dark [data-slot="button"] { background: linear-gradient(135deg, #3B82F6, #7C3AED) !important; color: #FFF !important; box-shadow: 0 0 12px rgba(59,130,246,0.3); }
.login-dark [data-slot="label"], .login-dark label { color: #CBD5E1 !important; }
.login-dark a { color: #60A5FA; }
</style>
