<template>
    <div class="flex min-h-screen" style="background: var(--gl-bg); color: var(--gl-text-primary);">
        <aside class="flex h-screen w-64 shrink-0 flex-col sticky top-0" style="background: var(--gl-sidebar-bg); border-right: 1px solid var(--gl-border); backdrop-filter: blur(12px);">
            <!-- Logo -->
            <div class="relative flex h-16 items-center gap-3 px-5 border-b overflow-hidden" style="border-color: var(--gl-border);">
                <div class="absolute inset-0 opacity-5" style="background: radial-gradient(circle at 30% 50%, var(--gl-primary), transparent 70%), radial-gradient(circle at 70% 50%, var(--gl-secondary), transparent 70%);"></div>
                <div class="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl"
                    style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 20px var(--gl-primary-glow);">
                    <GraduationCap class="h-5 w-5 text-white" :stroke-width="2" />
                </div>
                <div class="relative z-10">
                    <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">EduPulse</p>
                    <p class="text-xs" style="color: var(--gl-text-muted)">Level Up Learning</p>
                </div>
            </div>

            <!-- Nav -->
            <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-3 messenger-scroll">
                <template v-for="link in nav" :key="link.name">
                    <div v-if="link.label" class="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider" style="color: var(--gl-text-muted)">
                        {{ link.label }}
                    </div>
                    <Link v-else :href="link.href"
                        class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
                        :style="link.active ? {
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.1))',
                            color: 'var(--gl-text-primary)',
                            boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.2)',
                        } : {
                            color: 'var(--gl-text-secondary)',
                        }">
                        <span v-if="link.active" class="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full"
                            style="background: var(--gl-primary); box-shadow: 0 0 6px var(--gl-primary-glow);"></span>
                        <component :is="link.icon" :size="18" :stroke-width="2"
                            :style="{ color: link.active ? 'var(--gl-primary)' : 'var(--gl-text-muted)' }" />
                        <span class="flex-1">{{ link.name }}</span>
                        <span v-if="link.name === 'Messenger' && messengerUnread > 0"
                            class="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white"
                            style="background: var(--gl-danger);">{{ messengerUnread }}</span>
                    </Link>
                </template>
            </nav>

            <!-- Profile Card -->
            <div class="p-3" style="border-top: 1px solid var(--gl-border);">
                <div class="rounded-xl p-3" style="background: var(--gl-surface-2);">
                    <Link href="/teacher/profile" class="flex items-center gap-3">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">
                            {{ user.name.charAt(0) }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium" style="color: var(--gl-text-primary)">{{ user.name }}</p>
                            <p class="truncate text-xs" style="color: var(--gl-text-secondary)">{{ user.role === 'superadmin' ? 'Superadmin' : 'Teacher' }}</p>
                        </div>
                        <button @click="logout" class="shrink-0 rounded-lg p-1.5 transition-all hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--gl-danger)]" style="color: var(--gl-text-muted);" title="Sign out">
                            <LogOut :size="16" :stroke-width="2" />
                        </button>
                    </Link>
                </div>
            </div>
        </aside>

        <div class="flex min-h-screen flex-1 flex-col" style="min-width: 0">
            <header class="sticky top-0 z-20 flex h-16 items-center gap-4 px-6"
                :style="{ background: 'var(--gl-header-bg)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--gl-border)' }">
                <div v-if="isImpersonating" class="flex w-full items-center gap-3 text-sm" style="color: var(--gl-accent)">
                    <UserCheck class="h-4 w-4" :stroke-width="2" />
                    <span class="font-medium">Impersonating {{ user.name }}</span>
                    <button @click="stopImpersonating" class="ml-auto rounded-lg px-3 py-1 text-xs font-semibold"
                        style="background: var(--gl-accent); color: #0F172A;">Stop</button>
                </div>
                <div v-else class="flex w-full items-center gap-4">
                    <h1 class="flex-1 text-base font-semibold" style="color: var(--gl-text-primary)">
                        <slot name="title" />
                    </h1>
                    <ThemeToggle />
                    <NotificationBell role="teacher" />
                </div>
            </header>

            <main class="flex flex-1 flex-col min-h-0 px-6 py-6" style="background: var(--gl-bg);">
                <div class="mr-auto flex min-h-0 flex-1 flex-col w-full" style="max-width: 80rem">
                    <slot />
                </div>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Link, usePage, router } from '@inertiajs/vue3';
import { GraduationCap, LayoutDashboard, Users, ClipboardList, ClipboardCheck, Shield, LogOut, FileQuestion, Trophy, UserCheck, MessageCircle, Gamepad2 } from '@lucide/vue';
import NotificationBell from '@/components/NotificationBell.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const page = usePage();
const user = page.props.auth.user;
const path = computed(() => usePage().url);
const isImpersonating = computed(() => !!(page.props as any).impersonated_by);
const messengerSystemEnabled = computed(() => {
    const val = (page.props as any).messenger_system_enabled;
    return val !== false && val !== 'false' && val !== 0;
});

const isSuperadmin = user.role === 'superadmin';

const messengerUnread = ref(0);
let messengerTimer: ReturnType<typeof setInterval> | null = null;

async function fetchMessengerUnread() {
    if (!messengerSystemEnabled.value || user.messenger_enabled == false) { messengerUnread.value = 0; return; }
    try {
        const res = await fetch('/teacher/messenger/unread-count');
        if (res.ok) {
            const data = await res.json();
            messengerUnread.value = data.count;
        }
    } catch { /* silent */ }
}

onMounted(() => {
    fetchMessengerUnread();
    messengerTimer = setInterval(fetchMessengerUnread, 3000);
});

onUnmounted(() => {
    if (messengerTimer) clearInterval(messengerTimer);
});

const nav = computed(() => [
    { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard, active: path.value === '/teacher/dashboard' },
    { label: 'MANAGE' },
    { name: 'Students', href: '/teacher/students', icon: Users, active: path.value.startsWith('/teacher/students') },
    ...(isSuperadmin ? [
        { name: 'Teachers', href: '/teacher/teachers', icon: Users, active: path.value.startsWith('/teacher/teachers') },
        { name: 'Users', href: '/teacher/users', icon: Shield, active: path.value.startsWith('/teacher/users') },
    ] : []),
    { label: 'ACTIVITIES' },
    { name: 'Quizzes', href: '/teacher/quizzes', icon: ClipboardList, active: path.value.startsWith('/teacher/quizzes') },
    { name: 'Seatworks', href: '/teacher/seatworks', icon: ClipboardCheck, active: path.value.startsWith('/teacher/seatworks') },
    { name: 'Practicals', href: '/teacher/practicals', icon: ClipboardCheck, active: path.value.startsWith('/teacher/practicals') },
    { name: 'Exams', href: '/teacher/exams', icon: FileQuestion, active: path.value.startsWith('/teacher/exams') },
    { label: 'COMMUNITY' },
    { name: 'Results', href: '/teacher/results', icon: ClipboardCheck, active: path.value.startsWith('/teacher/results') },
    ...(user.messenger_enabled != false && messengerSystemEnabled ? [
        { name: 'Messenger', href: '/teacher/messenger', icon: MessageCircle, active: path.value.startsWith('/teacher/messenger') },
    ] : []),
    { name: 'Leaderboard', href: '/teacher/leaderboard', icon: Trophy, active: path.value.startsWith('/teacher/leaderboard') },
    { name: 'Games', href: '/teacher/games', icon: Gamepad2, active: path.value.startsWith('/teacher/games') },
]);

function logout() {
    router.post('/logout');
}

function stopImpersonating() {
    router.post('/leave-impersonation', {}, {
        onSuccess: () => { window.location.reload(); },
    });
}
</script>
