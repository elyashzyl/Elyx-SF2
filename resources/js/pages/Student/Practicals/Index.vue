<template>
    <Head title="Practicals" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>
    <div v-if="flash?.info" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #F5EBD8; color: #A5701A">
        {{ flash.info }}
    </div>

    <div class="mb-6">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Practicals</h2>
        <p class="mt-1 text-sm" style="color: #5A6376">Available practical activities from your teachers.</p>
    </div>

    <div v-if="!practicals.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <FlaskConical class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No practicals available yet</p>
        <p class="mt-1 text-sm" style="color: #7C8598">Check back once your teacher publishes a practical.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-for="pr in practicals" :key="pr.id" class="card flex flex-col p-5">
            <div class="mb-2 flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold" style="color: #1B2231">{{ pr.title }}</h3>
                <StatusBadge :status="pr.status" />
            </div>
            <div class="mb-4 flex flex-wrap gap-3 text-xs" style="color: #7C8598">
                <span class="flex items-center gap-1">
                    <FlaskConical class="h-3.5 w-3.5" :stroke-width="2" />
                    {{ pr.criteria_count }} criteria
                </span>
                <span v-if="pr.time_limit_minutes" class="flex items-center gap-1">
                    <Clock class="h-3.5 w-3.5" :stroke-width="2" />
                    {{ pr.time_limit_minutes }} min
                </span>
            </div>
            <div class="mt-auto">
                <p v-if="pr.status === 'submitted'" class="mb-3 text-sm font-medium" style="color: #404A5C">
                    Score: {{ pr.score }}/{{ pr.max_score }}
                </p>
                <Link v-if="pr.status !== 'submitted'" :href="`/student/practicals/${pr.id}/take`" class="btn-primary w-full">
                    <PlayCircle class="h-4 w-4" :stroke-width="2" />
                    {{ pr.status === 'in_progress' ? 'Continue practical' : 'Start practical' }}
                </Link>
                <Link v-else :href="`/student/practicals/${pr.attempt_id}/result`" class="btn-secondary w-full">
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
import { FlaskConical, Clock, PlayCircle, Eye } from '@lucide/vue';

defineProps<{ practicals: any[] }>();

const page = usePage();
const flash = page.props.flash as any;
</script>