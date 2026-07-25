<template>
    <Head title="Seatworks" />

    <div v-if="flash?.success" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #DCEEE3; color: #2F7A54">
        {{ flash.success }}
    </div>
    <div v-if="flash?.info" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #F5EBD8; color: #A5701A">
        {{ flash.info }}
    </div>

    <div class="mb-6">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Seatworks</h2>
        <p class="mt-1 text-sm" style="color: #5A6376">Available seatwork activities from your teachers.</p>
    </div>

    <div v-if="!seatworks.length" class="card flex flex-col items-center justify-center px-6 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9EBEF]">
            <ClipboardList class="h-6 w-6" :stroke-width="1.75" style="color: #7C8598" />
        </div>
        <p class="text-sm font-medium" style="color: #404A5C">No seatworks available yet</p>
        <p class="mt-1 text-sm" style="color: #7C8598">Check back once your teacher publishes a seatwork.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div v-for="sw in seatworks" :key="sw.id" class="card flex flex-col p-5">
            <div class="mb-2 flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold" style="color: #1B2231">{{ sw.title }}</h3>
                <StatusBadge :status="sw.status" />
            </div>
            <div class="mb-4 flex flex-wrap gap-3 text-xs" style="color: #7C8598">
                <span class="flex items-center gap-1">
                    <ClipboardList class="h-3.5 w-3.5" :stroke-width="2" />
                    {{ sw.questions_count }} questions
                </span>
                <span v-if="sw.time_limit_minutes" class="flex items-center gap-1">
                    <Clock class="h-3.5 w-3.5" :stroke-width="2" />
                    {{ sw.time_limit_minutes }} min
                </span>
            </div>
            <div class="mt-auto">
                <p v-if="sw.status === 'submitted'" class="mb-3 text-sm font-medium" style="color: #404A5C">
                    Score: {{ sw.score }}/{{ sw.total_points }}
                </p>
                <Link v-if="sw.status !== 'submitted'" :href="`/student/seatworks/${sw.id}/take`" class="btn-primary w-full">
                    <PlayCircle class="h-4 w-4" :stroke-width="2" />
                    {{ sw.status === 'in_progress' ? 'Continue seatwork' : 'Start seatwork' }}
                </Link>
                <Link v-else :href="`/student/seatworks/${sw.attempt_id}/result`" class="btn-secondary w-full">
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
import { ClipboardList, Clock, PlayCircle, Eye } from '@lucide/vue';

defineProps<{ seatworks: any[] }>();

const page = usePage();
const flash = page.props.flash as any;
</script>