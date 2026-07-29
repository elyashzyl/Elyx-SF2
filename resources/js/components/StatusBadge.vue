<template>
    <span class="badge" :class="config.classes">
        <component :is="config.icon" class="h-3.5 w-3.5" :stroke-width="2" />
        {{ config.label }}
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle2, Circle, Clock } from '@lucide/vue';

const props = defineProps<{
    status: string;
}>();

const map: Record<string, { label: string; classes: string; icon: any }> = {
    published: { label: 'Published', classes: 'bg-[#DCEEE3] text-[#2F7A54]', icon: CheckCircle2 },
    draft: { label: 'Draft', classes: 'bg-[#E9EBEF] text-[#5A6376]', icon: Circle },
    finished: { label: 'Finished', classes: 'bg-[#E0E7F1] text-[#1D3557]', icon: CheckCircle2 },
    submitted: { label: 'Submitted', classes: 'bg-[#DCEEE3] text-[#2F7A54]', icon: CheckCircle2 },
    in_progress: { label: 'In progress', classes: 'bg-[#F5EBD8] text-[#A5701A]', icon: Clock },
    not_started: { label: 'Not started', classes: 'bg-[#E9EBEF] text-[#7C8598]', icon: Circle },
    superadmin: { label: 'Superadmin', classes: 'bg-[#E0E7F1] text-[#1D3557]', icon: CheckCircle2 },
    teacher: { label: 'Teacher', classes: 'bg-[#DCEEE3] text-[#2F7A54]', icon: CheckCircle2 },
    student: { label: 'Student', classes: 'bg-[#E9EBEF] text-[#5A6376]', icon: Circle },
};

const config = computed(() => map[props.status] ?? map.draft);
</script>
