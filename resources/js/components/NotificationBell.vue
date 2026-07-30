<template>
    <div class="relative" ref="containerRef">
        <button @click="toggle"
            class="relative rounded-xl p-2.5 transition-all duration-200"
            :style="{ color: open ? 'var(--gl-primary)' : 'var(--gl-text-secondary)', background: open ? 'var(--gl-surface-2)' : 'transparent' }"
            title="Notifications">
            <Bell class="h-5 w-5" :stroke-width="2" />
            <span v-if="count > 0"
                class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
                :class="count > 0 ? 'gl-pulse-glow' : ''"
                style="background: var(--gl-danger); font-size: 9px;">
                {{ count > 99 ? '99+' : count }}
            </span>
        </button>

        <div v-if="open" class="fixed inset-0 z-40" @click="close" style="background: rgba(0,0,0,0.3); backdrop-filter: blur(2px);"></div>
        <div v-if="open"
            class="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl overflow-hidden gl-fade-in"
            style="background: var(--gl-surface); border: 1px solid var(--gl-border); right: 0; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
            <!-- Header -->
            <div class="px-5 py-4 border-b" style="border-color: var(--gl-border); background: linear-gradient(135deg, rgba(59,130,246,0.04), rgba(124,58,237,0.02));">
                <div class="flex items-center gap-3 mb-1">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg"
                        style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">
                        <Bell class="h-4 w-4 text-white" :stroke-width="2" />
                    </div>
                    <div>
                        <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Notifications</p>
                        <p class="text-xs" style="color: var(--gl-text-muted)">Stay updated with your progress</p>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            <div class="max-h-80 overflow-y-auto">
                <div v-if="loading" class="flex items-center justify-center py-10">
                    <div class="h-5 w-5 animate-spin rounded-full border-2" style="border-color: var(--gl-surface-2); border-top-color: var(--gl-primary);"></div>
                </div>

                <!-- Notifications List -->
                <template v-else-if="notifications.length">
                    <Link v-for="n in notifications" :key="n.id" :href="n.link" @click="close"
                        class="flex gap-3 px-4 py-3.5 transition-all duration-150 border-b last:border-b-0 group"
                        style="border-color: var(--gl-border);"
                        :style="{ background: hoveredId === n.id ? 'rgba(59,130,246,0.03)' : 'transparent' }"
                        @mouseenter="hoveredId = n.id" @mouseleave="hoveredId = null">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            :style="{ background: typeColor(n.type).bg }">
                            <component :is="iconMap[n.type] || Bell" class="h-4 w-4" :style="{ color: typeColor(n.type).fg }" :stroke-width="2" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <p class="text-sm font-medium leading-tight truncate" style="color: var(--gl-text-primary)">{{ n.title }}</p>
                                <span class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                                    :style="{ background: typeColor(n.type).badge, color: typeColor(n.type).fg }">
                                    {{ typeLabel(n.type) }}
                                </span>
                            </div>
                            <p class="text-xs leading-tight mt-0.5" style="color: var(--gl-text-secondary)">{{ n.body }}</p>
                            <p class="text-[10px] mt-1" style="color: var(--gl-text-muted)">{{ timeAgo(n.time) }}</p>
                        </div>
                    </Link>
                </template>

                <!-- Empty -->
                <div v-else class="py-10 text-center">
                    <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(124,58,237,0.05));">
                        <Trophy class="h-7 w-7" style="color: var(--gl-primary);" :stroke-width="1.5" />
                    </div>
                    <p class="text-sm font-medium" style="color: var(--gl-text-primary)">All caught up!</p>
                    <p class="text-xs mt-1" style="color: var(--gl-text-muted)">No new notifications.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Bell, ClipboardList, ClipboardCheck, FlaskConical, FileQuestion, Trophy, MessageCircle, Award, Calendar } from '@lucide/vue';
import { Link } from '@inertiajs/vue3';
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{ role: 'teacher' | 'student' }>();

const iconMap: Record<string, any> = {
    practical: FlaskConical,
    quiz: ClipboardList,
    seatwork: ClipboardCheck,
    exam: FileQuestion,
    practical_result: FlaskConical,
    quiz_result: ClipboardList,
    seatwork_result: ClipboardCheck,
    exam_result: FileQuestion,
};

const containerRef = ref<HTMLElement | null>(null);
const open = ref(false);
const notifications = ref<any[]>([]);
const count = ref(0);
const loading = ref(true);
const hoveredId = ref<number | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

function typeColor(type: string) {
    const colors: Record<string, { bg: string; fg: string; badge: string }> = {
        practical:       { bg: 'rgba(124,58,237,0.12)',  fg: '#7C3AED', badge: 'rgba(124,58,237,0.12)' },
        practical_result:{ bg: 'rgba(124,58,237,0.12)',  fg: '#7C3AED', badge: 'rgba(124,58,237,0.12)' },
        quiz:            { bg: 'rgba(59,130,246,0.12)',  fg: '#3B82F6', badge: 'rgba(59,130,246,0.12)' },
        quiz_result:     { bg: 'rgba(59,130,246,0.12)',  fg: '#3B82F6', badge: 'rgba(59,130,246,0.12)' },
        seatwork:        { bg: 'rgba(16,185,129,0.12)',  fg: '#10B981', badge: 'rgba(16,185,129,0.12)' },
        seatwork_result: { bg: 'rgba(16,185,129,0.12)',  fg: '#10B981', badge: 'rgba(16,185,129,0.12)' },
        exam:            { bg: 'rgba(239,68,68,0.12)',   fg: '#EF4444', badge: 'rgba(239,68,68,0.12)' },
        exam_result:     { bg: 'rgba(239,68,68,0.12)',   fg: '#EF4444', badge: 'rgba(239,68,68,0.12)' },
    };
    return colors[type] ?? { bg: 'rgba(148,163,184,0.12)', fg: '#94A3B8', badge: 'rgba(148,163,184,0.12)' };
}

function typeLabel(type: string): string {
    const labels: Record<string, string> = {
        practical: 'Practical', practical_result: 'Practical',
        quiz: 'Quiz', quiz_result: 'Quiz',
        seatwork: 'Seatwork', seatwork_result: 'Seatwork',
        exam: 'Exam', exam_result: 'Exam',
    };
    return labels[type] ?? type;
}

function toggle() {
    open.value = !open.value;
    if (open.value) {
        fetchNotifications();
        markRead();
    }
}

function close() {
    open.value = false;
    markRead();
}

async function markRead() {
    try {
        const prefix = window.location.pathname.startsWith('/student') ? 'student' : 'teacher';
        await fetch(`/${prefix}/notifications/read`, { method: 'POST' });
    } catch { /* silent */ }
}

function timeAgo(value: string): string {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

async function fetchNotifications() {
    try {
        const prefix = window.location.pathname.startsWith('/student') ? 'student' : 'teacher';
        const res = await fetch(`/${prefix}/notifications`);
        if (!res.ok) return;
        const data = await res.json();
        notifications.value = data.notifications;
        count.value = data.count;
    } catch {
        // silent
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchNotifications();
    timer = setInterval(fetchNotifications, 10000);
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});
</script>
