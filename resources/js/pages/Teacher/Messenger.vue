<template>
    <Head title="Messenger" />

    <div class="flex min-h-0 flex-1" style="background-color: #FFFFFF">
        <div class="flex w-80 shrink-0 flex-col min-h-0 border-r border-[#E4E6EB]">
            <div class="flex shrink-0 items-center gap-2 border-b border-[#E4E6EB] px-4 py-3">
                <div class="relative flex-1">
                    <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" :stroke-width="2" style="color: #7C8598" />
                    <input v-model="search" type="text" placeholder="Search Messenger" class="w-full rounded-full bg-[#F0F2F5] px-3 py-2 pl-9 text-sm outline-none placeholder:text-[#7C8598]" style="color: #1B2231" />
                </div>
                <button @click="showNewModal = true" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] transition-colors" style="color: #1B2231" title="New conversation">
                    <Plus class="h-5 w-5" :stroke-width="2" />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto py-1 min-h-0 messenger-scroll">
                <button v-for="c in filteredConversations" :key="c.id" @click="openConversation(c.id)" class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F0F2F5]" :class="activeId === c.id ? 'bg-[#E7F3FF]' : ''">
                    <div class="relative shrink-0">
                        <div class="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" :style="{ backgroundColor: avatarBg(c.other?.name ?? '') }">
                            {{ initials(c.other?.name ?? '?') }}
                        </div>
                        <span v-if="c.unread" class="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white" style="background-color: #1B74E4"></span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                            <p class="truncate text-sm font-medium" style="color: #1B2231">{{ c.other?.name ?? 'Unknown' }}</p>
                        </div>
                        <p class="truncate text-xs" :class="c.unread ? 'font-semibold' : ''" style="color: #7C8598">{{ c.last_message || 'No messages yet' }}</p>
                    </div>
                </button>
                <div v-if="!filteredConversations.length" class="flex flex-col items-center px-4 py-12 text-center">
                    <p class="text-sm font-medium" style="color: #7C8598">No conversations</p>
                    <p class="mt-1 text-xs" style="color: #AEB4C0">Click + to start a new chat.</p>
                </div>
            </div>
        </div>

        <div class="flex min-h-0 flex-1 flex-col">
            <template v-if="activeConversation">
                <div class="flex shrink-0 items-center gap-3 border-b border-[#E4E6EB] px-4 py-2.5">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" :style="{ backgroundColor: avatarBg(activeConversation.other?.name ?? '') }">
                        {{ initials(activeConversation.other?.name ?? '?') }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold" style="color: #1B2231">{{ activeConversation.other?.name }}</p>
                        <p class="truncate text-xs" style="color: #7C8598">{{ activeConversation.other?.role }}</p>
                    </div>
                    <button @click="deleteConversation" class="flex h-8 w-8 items-center justify-center rounded-full text-[#7C8598] hover:bg-[#F0F2F5] hover:text-[#AA3C36] transition-colors" title="Delete conversation">
                        <Trash2 class="h-4 w-4" :stroke-width="2" />
                    </button>
                </div>

                <div ref="messagesRef" class="min-h-0 flex-1 overflow-y-auto px-4 py-3 messenger-scroll" style="background-color: #F0F2F5">
                    <div v-for="m in messages" :key="m.id" class="mb-1.5 flex" :class="m.sender_id === userId ? 'justify-end' : 'justify-start'">
                        <div :class="m.sender_id === userId ? 'order-1' : 'order-1'">
                            <div class="max-w-md px-3 py-1.5 text-sm leading-relaxed" :class="m.sender_id === userId ? 'text-white' : 'text-[#1B2231]'" :style="m.sender_id === userId ? { backgroundColor: '#1B74E4', borderBottomRightRadius: '4px' } : { backgroundColor: '#FFFFFF', borderBottomLeftRadius: '4px' }" style="border-radius: 16px">
                                <p class="whitespace-pre-wrap break-words">{{ m.body }}</p>
                            </div>
                            <div class="mt-px flex items-center gap-1 px-1" :class="m.sender_id === userId ? 'justify-end' : 'justify-start'">
                                <p class="text-[10px]" style="color: #8A8D91">{{ formatTime(m.created_at) }}</p>
                                <span v-if="m.sender_id === userId && isRead(m)" class="text-[10px]" style="color: #79C2C5">Seen</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="shrink-0 border-t border-[#E4E6EB] px-4 py-2.5" style="background-color: #FFFFFF">
                    <form @submit.prevent="sendMessage" class="flex items-center gap-2">
                        <input v-model="newMessage" type="text" placeholder="Aa" class="flex-1 rounded-full bg-[#F0F2F5] px-4 py-2 text-sm outline-none placeholder:text-[#7C8598]" style="color: #1B2231" />
                        <button type="submit" :disabled="!newMessage.trim()" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-30" :style="{ backgroundColor: '#1B74E4' }">
                            <Send class="h-4 w-4" :stroke-width="2" />
                        </button>
                    </form>
                </div>
            </template>

            <div v-else class="flex min-h-0 flex-1 items-center justify-center" style="background-color: #F0F2F5">
                <div class="text-center">
                    <div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full" style="background-color: #E4E6EB">
                        <MessageCircle class="h-7 w-7" :stroke-width="1.5" style="color: #7C8598" />
                    </div>
                    <p class="text-base font-semibold" style="color: #1B2231">Your messages</p>
                    <p class="mt-1 text-sm" style="color: #7C8598">Select a conversation to start chatting.</p>
                </div>
            </div>
        </div>
    </div>

    <Teleport to="body">
        <div v-if="showNewModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showNewModal = false">
            <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
                <h3 class="mb-4 text-base font-semibold" style="color: #1B2231">New conversation</h3>
                <form @submit.prevent="startConversation" class="space-y-4">
                    <div>
                        <label class="field-label">Contact</label>
                        <select v-model="newRecipient" class="input-field" required>
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
                        <label class="field-label">Message</label>
                        <textarea v-model="newMessageBody" rows="3" class="input-field" placeholder="Write your message..." required></textarea>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" class="btn-secondary" @click="showNewModal = false">Cancel</button>
                        <button type="submit" class="btn-primary">Send</button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showDeleteModal = false">
            <div class="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
                <h3 class="mb-4 text-base font-semibold" style="color: #1B2231">Delete conversation?</h3>
                <p class="text-sm" style="color: #5A6376">This will hide the conversation from your inbox. The other participant can still see it.</p>
                <div class="mt-6 flex items-center justify-end gap-3">
                    <button type="button" class="btn-secondary" @click="showDeleteModal = false">Cancel</button>
                    <button type="button" class="btn-primary" style="background-color: #AA3C36" @click="confirmDelete">Delete</button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Search, Plus, Send, MessageCircle, Trash2 } from '@lucide/vue';
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

const page = usePage();
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
    const colors = ['#1B74E4', '#2F7A54', '#A5701A', '#AA3C36', '#4A6FA5', '#7B4F9B', '#C77D31', '#3D7E7E'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
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

onMounted(() => {
    pollInterval = window.setInterval(pollMessages, 3000);
});

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
});
</script>

<style>
.messenger-scroll::-webkit-scrollbar {
    display: none;
}
.messenger-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>