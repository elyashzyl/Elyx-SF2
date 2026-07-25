<template>
    <Head title="Quizzes" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>
    <div v-if="flash?.info" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #F5EBD8; color: #A5701A">
        {{ flash.info }}
    </div>

    <div class="mb-6">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Quizzes</h2>
        <p class="mt-1 text-sm" style="color: #5A6376">Available quizzes from your teachers.</p>
    </div>

    <div v-if="!quizzes.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <FileQuestion class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No quizzes available yet</p>
        <p class="mt-1 text-sm" style="color: #7C8598">Check back once your teacher publishes a quiz.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-for="quiz in quizzes" :key="quiz.id" class="card flex flex-col p-5">
            <div class="mb-2 flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold" style="color: #1B2231">{{ quiz.title }}</h3>
                <StatusBadge :status="quiz.status" />
            </div>
            <p v-if="quiz.description" class="mb-3 text-sm" style="color: #5A6376">{{ quiz.description }}</p>
            <div class="mb-4 flex flex-wrap gap-3 text-xs" style="color: #7C8598">
                <span class="flex items-center gap-1">
                    <FileQuestion class="h-3.5 w-3.5" :stroke-width="2" />
                    {{ quiz.questions_count }} questions
                </span>
                <span v-if="quiz.time_limit_minutes" class="flex items-center gap-1">
                    <Clock class="h-3.5 w-3.5" :stroke-width="2" />
                    {{ quiz.time_limit_minutes }} min
                </span>
            </div>
            <div class="mt-auto">
                <p v-if="quiz.status === 'submitted'" class="mb-3 text-sm font-medium" style="color: #404A5C">
                    Score: {{ quiz.score }}/{{ quiz.total_points }}
                </p>
                <Link v-if="quiz.status !== 'submitted'" :href="`/student/quizzes/${quiz.id}/take`" class="btn-primary w-full">
                    <PlayCircle class="h-4 w-4" :stroke-width="2" />
                    {{ quiz.status === 'in_progress' ? 'Continue quiz' : 'Start quiz' }}
                </Link>
                <Link v-else :href="`/student/quizzes/${quiz.attempt_id}/result`" class="btn-secondary w-full">
                    <Eye class="h-4 w-4" :stroke-width="2" />
                    View result
                </Link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import StatusBadge from '@/components/StatusBadge.vue';
import { FileQuestion, Clock, PlayCircle, Eye } from '@lucide/vue';

defineProps<{ quizzes: any[] }>();

const page = usePage();
const flash = page.props.flash as any;
</script>