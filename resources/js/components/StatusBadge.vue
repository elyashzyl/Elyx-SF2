<template>
    <span class="status-badge" :style="badgeStyle">
        <component :is="config.icon" class="status-badge-icon" :stroke-width="2.5" />
        {{ config.label }}
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle2, Circle, Clock, Award, Lock, Pencil } from '@lucide/vue';

const props = defineProps<{ status: string }>();

const map: Record<string, { label: string; bg: string; color: string; glow: string; border: string; icon: any }> = {
    published:  { label: 'Published',   bg: 'linear-gradient(135deg, #10B981, #059669)', color: '#ECFDF5', glow: '0 0 8px rgba(16,185,129,0.35)', border: 'rgba(16,185,129,0.35)', icon: CheckCircle2 },
    finished:   { label: 'Finished',    bg: 'linear-gradient(135deg, #3B82F6, #6366F1)',  color: '#FFF',     glow: '0 0 8px rgba(59,130,246,0.3)',   border: 'rgba(59,130,246,0.3)',   icon: Award },
    draft:      { label: 'Draft',       bg: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFF8EB', glow: '0 0 8px rgba(245,158,11,0.3)',  border: 'rgba(245,158,11,0.3)',  icon: Pencil },
    submitted:  { label: 'Submitted',   bg: 'linear-gradient(135deg, #10B981, #059669)', color: '#ECFDF5', glow: '0 0 8px rgba(16,185,129,0.35)', border: 'rgba(16,185,129,0.35)', icon: CheckCircle2 },
    in_progress:{ label: 'In progress', bg: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#FFF8EB', glow: '0 0 6px rgba(245,158,11,0.25)',  border: 'rgba(245,158,11,0.25)',  icon: Clock },
    not_started:{ label: 'Not started', bg: 'linear-gradient(135deg, #64748B, #475569)', color: '#F1F5F9', glow: 'none',                           border: 'rgba(100,116,139,0.3)',  icon: Circle },
    superadmin: { label: 'Superadmin',  bg: 'linear-gradient(135deg, #7C3AED, #6366F1)',  color: '#FFF',     glow: '0 0 8px rgba(124,58,237,0.3)',   border: 'rgba(124,58,237,0.3)',   icon: Award },
    teacher:    { label: 'Teacher',     bg: 'linear-gradient(135deg, #6366F1, #4F46E5)',  color: '#FFF',     glow: '0 0 6px rgba(99,102,241,0.25)',  border: 'rgba(99,102,241,0.25)',  icon: CheckCircle2 },
    student:    { label: 'Student',     bg: 'linear-gradient(135deg, #3B82F6, #2563EB)',  color: '#FFF',     glow: '0 0 6px rgba(59,130,246,0.25)',  border: 'rgba(59,130,246,0.25)',  icon: Circle },
};

const defaultBadge = map.draft;
const config = computed(() => map[props.status] ?? defaultBadge);

const badgeStyle = computed(() => ({
    background: config.value.bg,
    color: config.value.color,
    boxShadow: config.value.glow,
    border: `1px solid ${config.value.border}`,
}));
</script>

<style scoped>
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
    backdrop-filter: blur(12px);
    transition: all 0.25s ease;
    white-space: nowrap;
}
.status-badge:hover {
    transform: translateY(-1px);
}
.status-badge-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}
</style>
