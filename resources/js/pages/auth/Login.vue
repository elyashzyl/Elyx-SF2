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

    <div v-if="status" class="mb-4 text-center text-sm font-medium text-green-600">
        {{ status }}
    </div>

    <Form
        v-bind="store.form()"
        :reset-on-success="['password']"
        v-slot="{ errors, processing }"
        class="flex flex-col gap-6"
    >
        <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" name="email" required autofocus autocomplete="email" placeholder="email@example.com" />
            <InputError :message="errors.email" />
        </div>

        <div class="grid gap-2">
            <div class="flex items-center justify-between">
                <Label for="password">Password</Label>
                <TextLink v-if="canResetPassword" :href="request()" class="text-sm">Forgot password?</TextLink>
            </div>
            <PasswordInput id="password" name="password" required autocomplete="current-password" placeholder="Password" />
            <InputError :message="errors.password" />
        </div>

        <Label for="remember" class="flex items-center gap-3">
            <Checkbox id="remember" name="remember" />
            <span class="text-sm">Remember me</span>
        </Label>

        <Button type="submit" class="mt-2 w-full" :disabled="processing">
            <Spinner v-if="processing" />
            Log in
        </Button>

        <p class="text-center text-sm" style="color: #7C8598">
            Don't have an account?
            <TextLink :href="register()">Sign up</TextLink>
        </p>
    </Form>
</template>
