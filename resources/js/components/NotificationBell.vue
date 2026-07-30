<template>
    <div class="relative" ref="containerRef">
        <button @click="toggle" class="relative rounded-md p-2 hover:bg-[#F5F6F8] transition-colors" style="color: #5A6376" title="Notifications">
            <Bell class="h-5 w-5" :stroke-width="2" />
            <span v-if="count > 0" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white" style="background-color: #AA3C36; font-size: 9px;">
                {{ count > 99 ? '99+' : count }}
            </span>
        </button>

        <div v-if="open" class="fixed inset-0 z-40" @click="close"></div>
        <div v-if="open" class="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[#E9EBEF] bg-white shadow-xl" style="right: 0">
            <div class="border-b border-[#E9EBEF] px-4 py-3">
                <p class="text-sm font-semibold" style="color: #1B2231">Notifications</p>
            </div>

            <div class="max-h-80 overflow-y-auto">
                <div v-if="loading" class="flex items-center justify-center py-8">
                    <div class="h-5 w-5 animate-spin rounded-full border-2 border-[#D2D6DE] border-t-[#1D3557]"></div>
                </div>

                <template v-else-if="notifications.length">
                    <Link v-for="n in notifications" :key="n.id" :href="n.link" @click="close"
                        class="flex flex-col gap-0.5 border-b border-[#E9EBEF] px-4 py-3 transition-colors hover:bg-[#F9FAFB] last:border-b-0">
                        <div class="flex items-center gap-2">
                            <component :is="iconMap[n.type] || Bell" class="h-3.5 w-3.5 shrink-0" style="color: #7C8598" :stroke-width="2" />
                            <p class="text-sm font-medium leading-tight" style="color: #1B2231">{{ n.title }}</p>
                        </div>
                        <p class="pl-5.5 text-xs leading-tight" style="color: #5A6376">{{ n.body }}</p>
                        <p class="pl-5.5 text-[10px]" style="color: #AEB4C0">{{ timeAgo(n.time) }}</p>
                    </Link>
                </template>

                <div v-else class="py-8 text-center">
                    <Bell class="mx-auto mb-2 h-6 w-6" style="color: #D2D6DE" :stroke-width="2" />
                    <p class="text-sm" style="color: #7C8598">No notifications</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Bell, ClipboardList, ClipboardCheck, FlaskConical, FileQuestion } from '@lucide/vue';
import { Link } from '@inertiajs/vue3';
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{ role: 'teacher' | 'student' }>();

const iconMap: Record<string, any> = {
    practical: FlaskConical,
    quiz: ClipboardList,
    seatwork: ClipboardCheck,
    exam: FileQuestion,
};

const containerRef = ref<HTMLElement | null>(null);
const open = ref(false);
const notifications = ref<any[]>([]);
const count = ref(0);
const loading = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;

function toggle() {
    open.value = !open.value;
    if (open.value) fetchNotifications();
}

function close() {
    open.value = false;
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
