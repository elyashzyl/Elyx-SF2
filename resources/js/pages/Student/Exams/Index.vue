<template>
    <Head title="Exams" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>
    <div v-if="flash?.info" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #F5EBD8; color: #A5701A">
        {{ flash.info }}
    </div>

    <div class="mb-6">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Exams</h2>
        <p class="mt-1 text-sm" style="color: #5A6376">Available exams from your teachers.</p>
    </div>

    <div v-if="!exams.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <FileText class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No exams available yet</p>
        <p class="mt-1 text-sm" style="color: #7C8598">Check back once your teacher publishes an exam.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-for="exam in exams" :key="exam.id" class="card flex flex-col p-5">
            <div class="mb-2 flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold" style="color: #1B2231">{{ exam.title }}</h3>
                <StatusBadge :status="exam.status" />
            </div>
            <p v-if="exam.instructions" class="mb-3 text-sm" style="color: #5A6376">{{ exam.instructions }}</p>
            <div class="mb-4 flex flex-wrap gap-3 text-xs" style="color: #7C8598">
                <span class="flex items-center gap-1">
                    <FileText class="h-3.5 w-3.5" :stroke-width="2" />
                    {{ exam.sections_count }} sections
                </span>
                <span v-if="exam.time_limit_minutes" class="flex items-center gap-1">
                    <Clock class="h-3.5 w-3.5" :stroke-width="2" />
                    {{ exam.time_limit_minutes }} min
                </span>
            </div>
            <div class="mt-auto">
                <p v-if="exam.status === 'submitted'" class="mb-3 text-sm font-medium" style="color: #404A5C">
                    Score: {{ exam.score }}/{{ exam.max_score }}
                </p>
                <Link v-if="exam.status !== 'submitted'" :href="`/student/exams/${exam.id}/take`" class="btn-primary w-full">
                    <PlayCircle class="h-4 w-4" :stroke-width="2" />
                    {{ exam.status === 'in_progress' ? 'Continue exam' : 'Start exam' }}
                </Link>
                <Link v-else :href="`/student/exams/${exam.attempt_id}/result`" class="btn-secondary w-full">
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
import { FileText, Clock, PlayCircle, Eye } from '@lucide/vue';

defineProps<{ exams: any[] }>();

const page = usePage();
const flash = page.props.flash as any;
</script>