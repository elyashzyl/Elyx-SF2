<template>
    <Head title="Messenger" />

    <div class="mb-6">
        <h2 class="text-lg font-semibold" style="color: #1B2231">Messenger</h2>
        <p class="text-sm" style="color: #5A6376">Chat with your students and teachers.</p>
    </div>

    <div class="card flex overflow-hidden" style="height: calc(100vh - 200px); min-height: 400px;">
        <div class="flex w-72 shrink-0 flex-col border-r border-[#E9EBEF]">
            <div class="flex items-center gap-2 border-b border-[#E9EBEF] p-3">
                <div class="relative flex-1">
                    <input v-model="search" type="text" placeholder="Search..." class="w-full rounded-lg border border-[#D2D6DE] px-3 py-1.5 pl-8 text-xs outline-none focus:border-[#1D3557]" style="color: #1B2231" />
                    <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" :stroke-width="2" style="color: #7C8598" />
                </div>
                <button @click="showNewModal = true" class="rounded-lg border border-[#D2D6DE] p-1.5 hover:bg-[#F5F6F8]" style="color: #1D3557" title="New conversation">
                    <Plus class="h-4 w-4" :stroke-width="2" />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto">
                <button v-for="c in filteredConversations" :key="c.id" @click="openConversation(c.id)" class="flex w-full items-center gap-3 border-b border-[#E9EBEF] px-3 py-3 text-left transition-colors hover:bg-[#F9FAFB]" :class="activeId === c.id ? 'bg-[#EEF2F7]' : ''">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" :style="{ backgroundColor: avatarBg(c.other?.name ?? '') }">
                        {{ initials(c.other?.name ?? '?') }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <p class="truncate text-sm" :class="c.unread ? 'font-semibold' : 'font-medium'" style="color: #1B2231">{{ c.other?.name ?? 'Unknown' }}</p>
                            <span v-if="c.unread" class="h-2 w-2 shrink-0 rounded-full" style="background-color: #1D3557"></span>
                        </div>
                        <p class="truncate text-xs" style="color: #7C8598">{{ c.last_message || 'No messages yet' }}</p>
                    </div>
                </button>
                <div v-if="!filteredConversations.length" class="flex flex-col items-center px-4 py-12 text-center">
                    <p class="text-sm font-medium" style="color: #7C8598">No conversations</p>
                    <p class="mt-1 text-xs" style="color: #AEB4C0">Click + to start a new chat.</p>
                </div>
            </div>
        </div>

        <div class="flex flex-1 flex-col">
            <template v-if="activeConversation">
                <div class="flex items-center gap-3 border-b border-[#E9EBEF] px-5 py-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" :style="{ backgroundColor: avatarBg(activeConversation.other?.name ?? '') }">
                        {{ initials(activeConversation.other?.name ?? '?') }}
                    </div>
                    <div>
                        <p class="text-sm font-medium" style="color: #1B2231">{{ activeConversation.other?.name }}</p>
                        <p class="text-xs" style="color: #7C8598">{{ activeConversation.other?.role }}</p>
                    </div>
                </div>

                <div ref="messagesRef" class="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                    <div v-for="m in messages" :key="m.id" class="flex" :class="m.sender_id === userId ? 'justify-end' : 'justify-start'">
                        <div class="max-w-md rounded-lg px-4 py-2 text-sm" :class="m.sender_id === userId ? 'text-white' : 'border border-[#E9EBEF]'" :style="m.sender_id === userId ? { backgroundColor: '#1D3557' } : { backgroundColor: '#F9FAFB', color: '#1B2231' }">
                            <p>{{ m.body }}</p>
                            <p class="mt-1 text-xs" :class="m.sender_id === userId ? 'text-white/60' : 'text-[#AEB4C0]'">{{ formatTime(m.created_at) }}</p>
                        </div>
                    </div>
                </div>

                <div class="border-t border-[#E9EBEF] p-4">
                    <form @submit.prevent="sendMessage" class="flex gap-3">
                        <input v-model="newMessage" type="text" placeholder="Type a message..." class="flex-1 rounded-lg border border-[#D2D6DE] px-4 py-2 text-sm outline-none focus:border-[#1D3557]" style="color: #1B2231" />
                        <button type="submit" :disabled="!newMessage.trim()" class="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style="background-color: #1D3557">
                            <Send class="h-4 w-4" :stroke-width="2" />
                        </button>
                    </form>
                </div>
            </template>

            <div v-else class="flex flex-1 items-center justify-center">
                <div class="text-center">
                    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9EBEF]">
                        <MessageCircle class="h-7 w-7" :stroke-width="1.75" style="color: #7C8598" />
                    </div>
                    <p class="text-sm font-medium" style="color: #5A6376">Select a conversation</p>
                    <p class="mt-1 text-xs" style="color: #AEB4C0">Choose a chat from the left or start a new one.</p>
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
    </Teleport>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Search, Plus, Send, MessageCircle } from '@lucide/vue';
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';

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
const messagesRef = ref<HTMLElement | null>(null);
const messages = ref<any[]>(props.conversation?.messages ?? []);
let pollInterval: number | null = null;

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
    const colors = ['#1D3557', '#2F7A54', '#A5701A', '#AA3C36', '#4A6FA5', '#7B4F9B', '#C77D31', '#3D7E7E'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
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

async function pollMessages() {
    if (!activeConversation.value) return;
    const since = messages.value.length
        ? messages.value[messages.value.length - 1].created_at
        : null;
    try {
        const url = `${prefix}/messenger/${activeConversation.value.id}/poll${since ? `?since=${encodeURIComponent(since)}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
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
    nextTick(() => {
        if (messagesRef.value) {
            messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
        }
    });
}, { immediate: true });

onMounted(() => {
    pollInterval = window.setInterval(pollMessages, 3000);
});

onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
});
</script>
