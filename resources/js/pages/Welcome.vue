<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { login, register } from '@/routes';
</script>

<template>
    <Head title="Welcome" />
    <div class="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFC] p-6 dark:bg-[#0a0a0a]">
        <div class="flex w-full max-w-sm flex-col items-center gap-8">
            <div class="space-y-2 text-center">
                <h1 class="text-4xl font-bold tracking-tight" style="color: #1D3557">
                    <span style="color: #E63946">Edu</span>Pulse
                </h1>
                <p class="text-sm" style="color: #7C8598">Empowering education through quizzes and assessments</p>
            </div>

            <div class="flex w-full flex-col gap-3">
                    <Link
                        :href="login()"
                        class="inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
                        style="background-color: #1D3557"
                    >
                        Log in
                    </Link>
                    <Link
                        :href="register()"
                        class="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
                        style="border-color: #D2D6DE; color: #1B2231"
                    >
                        Create an account
                    </Link>
            </div>
        </div>
    </div>
</template>
