<template>
    <span v-if="value === null" class="text-xs" style="color: #AEB4C0">—</span>
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
    if (props.value >= 80) return 'bg-[#DCEEE3] text-[#2F7A54]';
    if (props.value >= 60) return 'bg-[#FFF3D6] text-[#A5701A]';
    return 'bg-[#F6DEDD] text-[#AA3C36]';
});
</script>
