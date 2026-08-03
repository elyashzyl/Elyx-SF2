<template>
    <Head title="Messenger" />

    <div v-if="!messengerEnabled" class="flex" style="background: var(--gl-bg); position: fixed; top: 64px; left: 0; right: 0; bottom: 0; align-items: center; justify-content: center;">
        <div class="text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style="background: var(--gl-surface-2);">
                <MessageCircle class="h-8 w-8" style="color: var(--gl-text-muted);" :stroke-width="1.5" />
            </div>
            <p class="text-lg font-semibold" style="color: var(--gl-text-primary)">Messenger Unavailable</p>
            <p class="text-sm mt-2" style="color: var(--gl-text-secondary)">The messenger has been disabled by the administrator.</p>
        </div>
    </div>

    <div v-else class="flex" style="background: var(--gl-bg); position: fixed; top: 64px; left: 16rem; right: 0; bottom: 0;">
        <!-- Conversation Sidebar -->
        <div class="flex w-80 shrink-0 flex-col" style="height: 100%; border-right: 1px solid var(--gl-border);">
            <!-- Sidebar Header -->
            <div class="shrink-0 px-4 py-4" style="border-bottom: 1px solid var(--gl-border);">
                <div class="flex items-center gap-3 mb-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                        style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">
                        <MessageCircle class="h-4.5 w-4.5 text-white" :stroke-width="2" />
                    </div>
                    <div>
                        <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">Messages</p>
                        <p class="text-xs" style="color: var(--gl-text-muted)">Stay connected</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="relative flex-1">
                        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" :stroke-width="2" style="color: var(--gl-text-muted)" />
                        <input v-model="search" type="text" placeholder="Search messages..."
                            class="w-full rounded-xl border px-3 py-2 pl-9 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                    </div>
                    <button @click="showNewModal = true"
                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
                        style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); color: white;"
                        title="New conversation">
                        <Plus class="h-4.5 w-4.5" :stroke-width="2" />
                    </button>
                </div>
            </div>

            <!-- Conversation List -->
            <div class="flex-1 overflow-y-auto py-1 messenger-scroll">
                <button v-for="c in filteredConversations" :key="c.id" @click="openConversation(c.id)"
                    class="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150"
                    :style="activeId === c.id
                        ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(124,58,237,0.06))', borderLeft: '2px solid var(--gl-primary)' }
                        : { borderLeft: '2px solid transparent' }">
                    <div class="relative shrink-0">
                        <div class="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
                            :style="{ background: 'linear-gradient(135deg, ' + avatarBg(c.other?.name ?? '') + ', ' + avatarBg2(c.other?.name ?? '') + ')' }">
                            {{ initials(c.other?.name ?? '?') }}
                        </div>
                        <span v-if="c.unread" class="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full gl-pulse-glow"
                            style="background: var(--gl-primary); border: 2px solid var(--gl-bg);"></span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-2">
                            <p class="truncate text-sm font-medium" :style="{ color: c.unread ? 'var(--gl-text-primary)' : 'var(--gl-text-secondary)' }">
                                {{ c.other?.name ?? 'Unknown' }}
                            </p>
                            <span class="shrink-0 text-[10px]" style="color: var(--gl-text-muted)">
                                {{ c.last_message_time ? formatTime(c.last_message_time) : '' }}
                            </span>
                        </div>
                        <p class="truncate text-xs mt-0.5" :style="{ color: c.unread ? 'var(--gl-text-secondary)' : 'var(--gl-text-muted)', fontWeight: c.unread ? '600' : '400' }">
                            {{ c.last_message || 'No messages yet' }}
                        </p>
                    </div>
                </button>
                <div v-if="!filteredConversations.length" class="flex flex-col items-center px-4 py-16 text-center">
                    <MessageCircle class="mb-3 h-8 w-8" style="color: var(--gl-text-muted);" :stroke-width="1.5" />
                    <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No conversations yet</p>
                    <p class="mt-1 text-xs" style="color: var(--gl-text-muted)">Click + to start messaging.</p>
                </div>
            </div>
        </div>

        <!-- Chat Area -->
        <div class="flex flex-1 flex-col" style="height: 100%;">
            <template v-if="activeConversation">
                <!-- Chat Header -->
                <div class="flex shrink-0 items-center gap-4 px-5 py-3" style="border-bottom: 1px solid var(--gl-border);">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        :style="{ background: 'linear-gradient(135deg, ' + avatarBg(activeConversation.other?.name ?? '') + ', ' + avatarBg2(activeConversation.other?.name ?? '') + ')' }">
                        {{ initials(activeConversation.other?.name ?? '?') }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <p class="truncate text-sm font-semibold" style="color: var(--gl-text-primary)">{{ activeConversation.other?.name }}</p>
                            <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                                :style="activeConversation.other?.role === 'teacher' || activeConversation.other?.role === 'superadmin'
                                    ? 'background: rgba(124,58,237,0.12); color: var(--gl-secondary);'
                                    : 'background: rgba(59,130,246,0.12); color: var(--gl-primary);'">
                                {{ activeConversation.other?.role }}
                            </span>
                        </div>
                        <p class="truncate text-xs mt-0.5" style="color: var(--gl-text-muted)">
                            <span class="inline-flex items-center gap-1">
                                <span class="h-1.5 w-1.5 rounded-full" style="background: var(--gl-success);"></span>
                                Online
                            </span>
                        </p>
                    </div>
                    <button @click="deleteConversation"
                        class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        style="color: var(--gl-text-muted);"
                        title="Delete conversation">
                        <Trash2 class="h-4 w-4" :stroke-width="2" />
                    </button>
                </div>

                <!-- Messages Area -->
                <div ref="messagesRef" class="flex-1 overflow-y-auto px-5 py-4 messenger-scroll" style="background: var(--gl-bg); min-height: 0;">
                    <div v-for="m in messages" :key="m.id" class="mb-2 flex gl-fade-in" :class="m.sender_id === userId ? 'justify-end' : 'justify-start'">
                        <!-- Received message: show avatar -->
                        <div v-if="m.sender_id !== userId" class="mr-2 shrink-0 self-end">
                            <div class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                                :style="{ background: avatarBg(activeConversation.other?.name ?? '') }">
                                {{ initials(activeConversation.other?.name ?? '?')[0] }}
                            </div>
                        </div>
                        <div class="max-w-[70%]">
                            <div class="px-3.5 py-2 text-sm leading-relaxed break-words"
                                :class="m.sender_id === userId ? 'text-white' : ''"
                                :style="m.sender_id === userId
                                    ? { background: 'linear-gradient(135deg, var(--gl-primary), var(--gl-secondary))', borderRadius: '18px 18px 4px 18px', boxShadow: '0 0 8px var(--gl-primary-glow)' }
                                    : { background: 'var(--gl-surface-2)', color: 'var(--gl-text-primary)', borderRadius: '18px 18px 18px 4px', border: '1px solid var(--gl-border)' }">
                                {{ m.body }}
                            </div>
                            <div class="mt-0.5 flex items-center gap-1.5 px-1"
                                :class="m.sender_id === userId ? 'justify-end' : 'justify-start'">
                                <p class="text-[10px]" style="color: var(--gl-text-muted)">{{ formatTime(m.created_at) }}</p>
                                <span v-if="m.sender_id === userId && isRead(m)" class="text-[10px]" style="color: var(--gl-success)">Seen</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="shrink-0 px-5 py-3" style="border-top: 1px solid var(--gl-border);">
                    <form @submit.prevent="sendMessage" class="flex items-center gap-3">
                        <input v-model="newMessage" type="text" placeholder="Type your message..."
                            class="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                        <button type="submit" :disabled="!newMessage.trim()"
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
                            <Send class="h-4.5 w-4.5" :stroke-width="2" />
                        </button>
                    </form>
                </div>
            </template>

            <!-- Empty State -->
            <div v-else class="flex flex-1 items-center justify-center" style="background: var(--gl-bg); min-height: 0;">
                <div class="text-center px-8">
                    <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(124,58,237,0.06));">
                        <MessageCircle class="h-10 w-10" :stroke-width="1.5" style="color: var(--gl-primary);" />
                    </div>
                    <p class="text-lg font-semibold" style="color: var(--gl-text-primary)">Your Messages</p>
                    <p class="mt-2 text-sm" style="color: var(--gl-text-secondary)">Select a conversation to start chatting.</p>
                    <p class="mt-1 text-xs" style="color: var(--gl-text-muted)">Stay connected with your classmates and teachers.</p>
                    <!-- Visual XP widget -->
                    <div class="mx-auto mt-6 max-w-xs rounded-xl p-4" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                        <div class="flex items-center gap-3 mb-2">
                            <Zap class="h-4 w-4" style="color: var(--gl-accent);" :stroke-width="2" />
                            <span class="text-xs font-medium" style="color: var(--gl-text-secondary)">Communication XP</span>
                        </div>
                        <div class="gl-xp-bar">
                            <div class="gl-xp-bar-fill" style="width: 40%;"></div>
                        </div>
                        <p class="text-xs mt-1.5" style="color: var(--gl-text-muted)">Message more to earn XP badges</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- New Conversation Modal -->
    <Teleport to="body">
        <div v-if="showNewModal" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="showNewModal = false">
            <div class="mx-4 w-full max-w-sm rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <div class="flex items-center gap-3 mb-5">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                        style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">
                        <Plus class="h-4.5 w-4.5 text-white" :stroke-width="2" />
                    </div>
                    <div>
                        <h3 class="text-base font-semibold" style="color: var(--gl-text-primary)">New Conversation</h3>
                        <p class="text-xs" style="color: var(--gl-text-muted)">Start a chat with someone</p>
                    </div>
                </div>
                <form @submit.prevent="startConversation" class="space-y-4">
                    <div>
                        <label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary)">Contact</label>
                        <select v-model="newRecipient" required
                            class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);">
                            <option value="">Select a contact...</option>
                            <optgroup v-if="teachers.length" label="Teachers">
                                <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                            </optgroup>
                            <optgroup v-if="students.length" label="Students">
                                <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary)">Message</label>
                        <textarea v-model="newMessageBody" rows="3" placeholder="Write your message..."
                            class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none resize-none transition-all"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" required></textarea>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" @click="showNewModal = false"
                            class="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                        <button type="submit"
                            class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">Send</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Delete Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="showDeleteModal = false">
            <div class="mx-4 w-full max-w-sm rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style="background: var(--gl-danger-bg);">
                    <Trash2 class="h-7 w-7" style="color: var(--gl-danger);" :stroke-width="2" />
                </div>
                <h3 class="mb-2 text-base font-semibold text-center" style="color: var(--gl-text-primary)">Delete conversation?</h3>
                <p class="text-sm text-center" style="color: var(--gl-text-secondary)">This will hide the conversation from your inbox. The other participant can still see it.</p>
                <div class="mt-5 flex items-center justify-center gap-3">
                    <button @click="showDeleteModal = false"
                        class="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                    <button @click="confirmDelete"
                        class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                        style="background: var(--gl-danger);">Delete</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Search, Plus, Send, MessageCircle, Trash2, Zap } from '@lucide/vue';
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

const page = usePage();
const messengerEnabled = ref(true);
onMounted(async () => {
    try { const r = await fetch('/api/messenger-status'); if (r.ok) { const d = await r.json(); messengerEnabled.value = d.enabled; } } catch {}
    pollInterval = window.setInterval(pollMessages, 3000);
});

const props = defineProps<{
    conversations: any[];
    contacts: any[];
    conversation?: any;
}>();

const userId = (page.props.auth as any).user.id;
const isStudent = (page.props.auth as any).user.role === 'student';
const prefix = isStudent ? '/student' : '/teacher';
const search = ref('');
const newMessage = ref('');
const showNewModal = ref(false);
const newRecipient = ref('');
const newMessageBody = ref('');
const showDeleteModal = ref(false);
const messages = ref<any[]>(props.conversation?.messages ?? []);
const otherLastReadAt = ref<string | null>(props.conversation?.other_last_read_at ?? null);
const messagesRef = ref<HTMLElement | null>(null);
let pollInterval: number | null = null;

function isRead(m: any) {
    if (m.sender_id !== userId) return false;
    if (!otherLastReadAt.value) return false;
    return new Date(m.created_at) <= new Date(otherLastReadAt.value);
}

function scrollToBottom(smooth = false) {
    if (!messagesRef.value) return;
    setTimeout(() => {
        if (messagesRef.value) {
            messagesRef.value.scrollTo({ top: messagesRef.value.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
        }
    }, 10);
}

function isNearBottom() {
    if (!messagesRef.value) return true;
    const el = messagesRef.value;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
}

const teachers = computed(() => props.contacts.filter((c: any) => c.role === 'teacher' || c.role === 'superadmin'));
const students = computed(() => props.contacts.filter((c: any) => c.role === 'student'));

const activeConversation = computed(() => props.conversation ?? null);
const activeId = computed(() => activeConversation.value?.id ?? null);

const filteredConversations = computed(() => {
    if (!search.value) return props.conversations;
    const q = search.value.toLowerCase();
    return props.conversations.filter((c: any) =>
        c.other?.name?.toLowerCase().includes(q)
    );
});

function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarBg(name: string) {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#EC4899', '#06B6D4', '#F97316'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function avatarBg2(name: string) {
    const colors = ['#2563EB', '#059669', '#D97706', '#DC2626', '#6D28D9', '#DB2777', '#0891B2', '#EA580C'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 7) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function formatTime(date: string) {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function openConversation(id: number) {
    router.get(`${prefix}/messenger/${id}`, {}, { preserveScroll: true, preserveState: true });
}

function sendMessage() {
    if (!newMessage.value.trim() || !activeConversation.value) return;
    router.post(`${prefix}/messenger/${activeConversation.value.id}/send`, { body: newMessage.value }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => { newMessage.value = ''; },
    });
}

function startConversation() {
    if (!newRecipient.value || !newMessageBody.value.trim()) return;
    router.post(`${prefix}/messenger/start`, { recipient_id: newRecipient.value, message: newMessageBody.value }, {
        onSuccess: () => { showNewModal.value = false; },
    });
}

function deleteConversation() {
    if (!activeConversation.value) return;
    showDeleteModal.value = true;
}

function confirmDelete() {
    showDeleteModal.value = false;
    router.delete(`${prefix}/messenger/${activeConversation.value.id}`, {
        preserveScroll: true,
    });
}

async function pollMessages() {
    if (!activeConversation.value) return;
    const since = messages.value.length
        ? messages.value[messages.value.length - 1].created_at
        : null;
    try {
        const url = `${prefix}/messenger/${activeConversation.value.id}/poll${since ? `?since=${encodeURIComponent(since)}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.other_last_read_at !== undefined) {
            otherLastReadAt.value = data.other_last_read_at;
        }
        if (data.messages?.length) {
            const existingIds = new Set(messages.value.map((m: any) => m.id));
            const newOnes = data.messages.filter((m: any) => !existingIds.has(m.id));
            if (newOnes.length) {
                messages.value = [...messages.value, ...newOnes];
            }
        }
    } catch {}
}

watch(activeConversation, (val) => {
    messages.value = val?.messages ?? [];
    otherLastReadAt.value = val?.other_last_read_at ?? null;
    scrollToBottom(val?.messages?.length ? true : false);
}, { immediate: true });

watch(messages, () => {
    if (isNearBottom()) scrollToBottom(true);
});

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
});
</script>

<style>
.messenger-scroll::-webkit-scrollbar { display: none; }
.messenger-scroll { -ms-overflow-style: none; scrollbar-width: none; }
.h-4\.5 { height: 1.125rem; }
.w-4\.5 { width: 1.125rem; }
</style>
