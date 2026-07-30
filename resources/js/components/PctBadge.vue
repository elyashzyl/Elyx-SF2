<template>
    <span v-if="value === null" class="text-xs" style="color: var(--gl-text-muted)">—</span>
    <span v-else class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
        :class="badgeClass">
        {{ value }}%
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ value: number | null }>();

const badgeClass = computed(() => {
    if (props.value === null) return '';
    if (props.value >= 80) return 'bg-[rgba(16,185,129,0.12)] text-[#10B981]';
    if (props.value >= 60) return 'bg-[rgba(251,191,36,0.12)] text-[#FBBF24]';
    return 'bg-[rgba(239,68,68,0.12)] text-[#EF4444]';
});
</script>
