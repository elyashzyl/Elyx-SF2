<template>
    <div class="flex min-h-screen" style="background-color: #F4F5F7">
        <aside class="flex h-screen w-64 shrink-0 flex-col border-r border-[#E9EBEF] bg-white sticky top-0">
            <div class="flex h-16 items-center gap-2.5 border-b border-[#E9EBEF] px-6">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg" style="background-color: #1D3557">
                    <GraduationCap class="h-5 w-5 text-white" :stroke-width="2" />
                </div>
                <div>
                    <p class="text-sm font-semibold" style="color: #1B2231">EduPulse</p>
                    <p class="text-xs" style="color: #7C8598">Teacher Portal</p>
                </div>
            </div>

            <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <Link v-for="link in nav" :key="link.name" :href="link.href" class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors" :class="link.active ? 'bg-[#EEF2F7] text-[#1D3557]' : 'text-[#5A6376] hover:bg-[#F5F6F8] hover:text-[#2B3444]'">
                    <component :is="link.icon" :size="18" :stroke-width="2" />
                    <span class="flex-1">{{ link.name }}</span>
                    <span v-if="link.name === 'Messenger' && messengerUnread > 0" class="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white" style="background-color: #AA3C36;">{{ messengerUnread }}</span>
                </Link>
            </nav>

            <div class="border-t border-[#E9EBEF] p-3">
                <div class="flex items-center gap-3 rounded-lg px-3 py-2">
                    <Link href="/teacher/profile" class="flex items-center gap-3 flex-1 min-w-0 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-[#F5F6F8]">
                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E9EBEF] text-sm font-semibold text-[#5A6376]">
                            {{ user.name.charAt(0) }}
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-medium" style="color: #1B2231">{{ user.name }}</p>
                            <p class="truncate text-xs" style="color: #7C8598">{{ user.email }}</p>
                        </div>
                    </Link>
                    <button @click="logout" class="rounded-md p-1.5 hover:bg-[#E9EBEF]" style="color: #7C8598" title="Sign out">
                        <LogOut :size="16" :stroke-width="2" />
                    </button>
                </div>
            </div>
        </aside>

        <div class="flex min-h-screen flex-1 flex-col" style="min-width: 0">
            <header class="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[#E9EBEF] bg-white/80 px-6 backdrop-blur">
                <div v-if="isImpersonating" class="flex w-full items-center gap-3 text-sm" style="color: #A5701A">
                    <UserCheck class="h-4 w-4" :stroke-width="2" />
                    <span class="font-medium">Impersonating {{ user.name }}</span>
                    <button @click="stopImpersonating" class="ml-auto rounded-md px-3 py-1 text-xs font-semibold text-white" style="background-color: #A5701A">Stop</button>
                </div>
                <div v-else class="flex w-full items-center gap-4">
                    <h1 class="flex-1 text-base font-semibold" style="color: #1B2231">
                        <slot name="title" />
                    </h1>
                    <NotificationBell role="teacher" />
                </div>
            </header>

            <main class="flex flex-1 flex-col min-h-0" :class="path.startsWith('/teacher/messenger') ? '' : 'px-6 py-6'">
                <div v-if="path.startsWith('/teacher/messenger')" class="flex min-h-0 flex-1 flex-col">
                    <slot />
                </div>
                <div v-else class="mx-auto flex min-h-0 flex-1 flex-col" style="max-width: 80rem">
                    <slot />
                </div>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Link, usePage, router } from '@inertiajs/vue3';
import { GraduationCap, LayoutDashboard, Users, ClipboardList, ClipboardCheck, Shield, LogOut, FileQuestion, Trophy, CalendarCheck, UserCheck, MessageCircle } from '@lucide/vue';
import NotificationBell from '@/components/NotificationBell.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const page = usePage();
const user = page.props.auth.user;
const path = computed(() => usePage().url);
const isImpersonating = computed(() => !!(page.props as any).impersonated_by);

const isSuperadmin = user.role === 'superadmin';

const messengerUnread = ref(0);
let messengerTimer: ReturnType<typeof setInterval> | null = null;

async function fetchMessengerUnread() {
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
    messengerTimer = setInterval(fetchMessengerUnread, 5000);
});

onUnmounted(() => {
    if (messengerTimer) clearInterval(messengerTimer);
});

const nav = computed(() => [
    { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard, active: path.value === '/teacher/dashboard' },
    { name: 'Students', href: '/teacher/students', icon: Users, active: path.value.startsWith('/teacher/students') },
    ...(isSuperadmin ? [
        { name: 'Teachers', href: '/teacher/teachers', icon: Users, active: path.value.startsWith('/teacher/teachers') },
        { name: 'Users', href: '/teacher/users', icon: Shield, active: path.value.startsWith('/teacher/users') },
    ] : []),
    { name: 'Quizzes', href: '/teacher/quizzes', icon: ClipboardList, active: path.value.startsWith('/teacher/quizzes') },
    { name: 'Seatworks', href: '/teacher/seatworks', icon: ClipboardCheck, active: path.value.startsWith('/teacher/seatworks') },
    { name: 'Practicals', href: '/teacher/practicals', icon: ClipboardCheck, active: path.value.startsWith('/teacher/practicals') },
    { name: 'Exams', href: '/teacher/exams', icon: FileQuestion, active: path.value.startsWith('/teacher/exams') },
    { name: 'Results', href: '/teacher/results', icon: ClipboardCheck, active: path.value.startsWith('/teacher/results') },
    { name: 'Messenger', href: '/teacher/messenger', icon: MessageCircle, active: path.value.startsWith('/teacher/messenger') },
    { name: 'Leaderboard', href: '/teacher/leaderboard', icon: Trophy, active: path.value.startsWith('/teacher/leaderboard') },
    { name: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck, active: path.value.startsWith('/teacher/attendance') },
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
