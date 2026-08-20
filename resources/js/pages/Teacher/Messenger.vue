<template>
    <Head title="Messenger" />

    <div
        v-if="!messengerEnabled"
        class="flex"
        style="
            background: var(--gl-bg);
            position: fixed;
            top: 64px;
            left: 16rem;
            right: 0;
            bottom: 0;
            align-items: center;
            justify-content: center;
        "
    >
        <div class="text-center">
            <div
                class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style="background: var(--gl-surface-2)"
            >
                <MessageCircle
                    class="h-8 w-8"
                    style="color: var(--gl-text-muted)"
                    :stroke-width="1.5"
                />
            </div>
            <p
                class="text-lg font-semibold"
                style="color: var(--gl-text-primary)"
            >
                Messenger Unavailable
            </p>
            <p class="mt-2 text-sm" style="color: var(--gl-text-secondary)">
                The messenger has been disabled by the administrator.
            </p>
        </div>
    </div>

    <div
        v-else
        class="flex"
        style="
            background: var(--gl-bg);
            position: fixed;
            top: 64px;
            left: 16rem;
            right: 0;
            bottom: 0;
        "
    >
        <!-- Conversation Sidebar -->
        <div
            class="flex w-80 shrink-0 flex-col"
            style="
                height: 100%;
                background: var(--gl-surface);
                border-right: 1px solid var(--gl-border);
            "
        >
            <!-- Sidebar Header -->
            <div
                class="shrink-0 px-4 pt-4 pb-3"
                style="border-bottom: 1px solid var(--gl-border)"
            >
                <div class="mb-3 flex items-center justify-between">
                    <p
                        class="text-base font-bold"
                        style="color: var(--gl-text-primary)"
                    >
                        Chats
                    </p>
                    <button
                        @click="showNewModal = true"
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105"
                        style="
                            background: linear-gradient(
                                135deg,
                                var(--gl-primary),
                                var(--gl-secondary)
                            );
                            color: white;
                            box-shadow: 0 0 10px var(--gl-primary-glow);
                        "
                        title="New conversation"
                    >
                        <Plus class="h-4 w-4" :stroke-width="2.5" />
                    </button>
                </div>
                <div class="relative">
                    <Search
                        class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                        :stroke-width="2"
                        style="color: var(--gl-text-muted)"
                    />
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search Messenger..."
                        class="w-full rounded-full border px-4 py-2 pl-9 text-sm transition-all outline-none focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                        style="
                            background: var(--gl-surface-2);
                            color: var(--gl-text-primary);
                            border-color: var(--gl-border);
                        "
                    />
                </div>
            </div>

            <!-- Conversation List -->
            <div class="messenger-scroll flex-1 overflow-y-auto py-2">
                <button
                    v-for="c in filteredConversations"
                    :key="c.id"
                    @click="openConversation(c.id)"
                    class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150"
                    :style="
                        activeId === c.id
                            ? {
                                  background:
                                      'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.08))',
                              }
                            : { background: 'transparent' }
                    "
                >
                    <div class="relative shrink-0">
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                            :style="{
                                background:
                                    'linear-gradient(135deg, ' +
                                    avatarBg(c.other?.name ?? '') +
                                    ', ' +
                                    avatarBg2(c.other?.name ?? '') +
                                    ')',
                            }"
                        >
                            {{ initials(c.other?.name ?? '?') }}
                        </div>
                        <span
                            v-if="c.unread"
                            class="gl-pulse-glow absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2"
                            style="
                                background: var(--gl-primary);
                                border-color: var(--gl-surface);
                            "
                        ></span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-2">
                            <p
                                class="truncate text-sm font-semibold"
                                :style="{
                                    color: c.unread
                                        ? 'var(--gl-text-primary)'
                                        : 'var(--gl-text-secondary)',
                                }"
                            >
                                {{ c.other?.name ?? 'Unknown' }}
                            </p>
                            <span
                                class="shrink-0 text-[10px]"
                                style="color: var(--gl-text-muted)"
                            >
                                {{
                                    c.last_message_at
                                        ? formatTime(c.last_message_at)
                                        : ''
                                }}
                            </span>
                        </div>
                        <div
                            class="mt-0.5 flex items-center justify-between gap-2"
                        >
                            <p
                                class="truncate text-xs"
                                :style="{
                                    color: c.unread
                                        ? 'var(--gl-text-secondary)'
                                        : 'var(--gl-text-muted)',
                                }"
                            >
                                {{ c.last_message || 'No messages yet' }}
                            </p>
                            <span
                                v-if="c.unread"
                                class="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                                style="background: var(--gl-primary)"
                                >●</span
                            >
                        </div>
                    </div>
                </button>
                <div
                    v-if="!filteredConversations.length"
                    class="flex flex-col items-center px-4 py-16 text-center"
                >
                    <MessageCircle
                        class="mb-3 h-8 w-8"
                        style="color: var(--gl-text-muted)"
                        :stroke-width="1.5"
                    />
                    <p
                        class="text-sm font-medium"
                        style="color: var(--gl-text-secondary)"
                    >
                        No conversations yet
                    </p>
                    <p class="mt-1 text-xs" style="color: var(--gl-text-muted)">
                        Click + to start messaging.
                    </p>
                </div>
            </div>
        </div>

        <!-- Chat Area -->
        <div
            class="flex flex-1 flex-col"
            style="height: 100%; background: var(--gl-bg)"
        >
            <template v-if="activeConversation">
                <!-- Chat Header -->
                <div
                    class="flex shrink-0 items-center gap-3 px-5 py-3"
                    style="
                        background: var(--gl-surface);
                        border-bottom: 1px solid var(--gl-border);
                    "
                >
                    <div class="relative shrink-0">
                        <div
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                            :style="{
                                background:
                                    'linear-gradient(135deg, ' +
                                    avatarBg(
                                        activeConversation.other?.name ?? '',
                                    ) +
                                    ', ' +
                                    avatarBg2(
                                        activeConversation.other?.name ?? '',
                                    ) +
                                    ')',
                            }"
                        >
                            {{
                                initials(activeConversation.other?.name ?? '?')
                            }}
                        </div>
                        <span
                            class="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2"
                            style="
                                background: var(--gl-success);
                                border-color: var(--gl-surface);
                            "
                        ></span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <p
                            class="truncate text-sm font-bold"
                            style="color: var(--gl-text-primary)"
                        >
                            {{ activeConversation.other?.name }}
                        </p>
                        <p
                            class="truncate text-xs"
                            style="color: var(--gl-success)"
                        >
                            Active now
                        </p>
                    </div>
                    <button
                        @click="deleteConversation"
                        class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--gl-danger-bg)]"
                        style="color: var(--gl-text-muted)"
                        title="Delete conversation"
                    >
                        <Trash2 class="h-4 w-4" :stroke-width="2" />
                    </button>
                </div>

                <!-- Messages Area -->
                <div
                    ref="messagesRef"
                    class="messenger-scroll flex-1 overflow-y-auto px-4 py-4"
                    style="min-height: 0"
                >
                    <div
                        v-for="(item, i) in chatItems"
                        :key="
                            item.type === 'day'
                                ? 'day-' + i + '-' + item.label
                                : item.m.id
                        "
                    >
                        <!-- Day separator -->
                        <div
                            v-if="item.type === 'day'"
                            class="my-3 flex justify-center"
                        >
                            <span
                                class="rounded-full px-3 py-1 text-[10px] font-semibold"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-muted);
                                "
                            >
                                {{ item.label }}
                            </span>
                        </div>
                        <!-- Message -->
                        <div
                            v-else
                            class="gl-fade-in group mb-1.5 flex items-end gap-2"
                            :class="
                                item.m.sender_id === userId
                                    ? 'justify-end'
                                    : 'justify-start'
                            "
                        >
                            <div
                                v-if="item.m.sender_id !== userId"
                                class="w-7 shrink-0"
                            >
                                <div
                                    v-if="item.showAvatar"
                                    class="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                    :style="{
                                        background: avatarBg(
                                            activeConversation.other?.name ??
                                                '',
                                        ),
                                    }"
                                >
                                    {{
                                        initials(
                                            activeConversation.other?.name ??
                                                '?',
                                        )
                                    }}
                                </div>
                            </div>
                            <!-- Own message actions (edit / remove) -->
                            <div
                                v-if="
                                    item.m.sender_id === userId &&
                                    !item.m.deleted_at
                                "
                                class="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                            >
                                <button
                                    @click="startEdit(item.m)"
                                    class="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--gl-surface-2)]"
                                    style="color: var(--gl-text-muted)"
                                    title="Edit message"
                                >
                                    <Pencil class="h-3 w-3" :stroke-width="2" />
                                </button>
                                <button
                                    @click="askDeleteMessage(item.m)"
                                    class="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[var(--gl-danger-bg)]"
                                    style="color: var(--gl-text-muted)"
                                    title="Remove message"
                                >
                                    <Trash2 class="h-3 w-3" :stroke-width="2" />
                                </button>
                            </div>
                            <div class="flex max-w-[70%] flex-col">
                                <!-- Inline edit -->
                                <form
                                    v-if="editingId === item.m.id"
                                    @submit.prevent="submitEdit(item.m)"
                                    class="flex items-center gap-1.5"
                                >
                                    <input
                                        ref="editInputRef"
                                        v-model="editDraft"
                                        type="text"
                                        class="w-full rounded-2xl border px-3.5 py-2 text-sm outline-none"
                                        style="
                                            background: var(--gl-surface-2);
                                            color: var(--gl-text-primary);
                                            border-color: var(--gl-primary);
                                            box-shadow: 0 0 0 2px
                                                var(--gl-primary-glow);
                                        "
                                    />
                                    <button
                                        type="submit"
                                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-all hover:scale-105"
                                        style="
                                            background: linear-gradient(
                                                135deg,
                                                var(--gl-primary),
                                                var(--gl-secondary)
                                            );
                                        "
                                        title="Save"
                                    >
                                        <Check
                                            class="h-3.5 w-3.5"
                                            :stroke-width="2.5"
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        @click="cancelEdit"
                                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                                        style="
                                            background: var(--gl-surface-2);
                                            color: var(--gl-text-muted);
                                            border: 1px solid var(--gl-border);
                                        "
                                        title="Cancel"
                                    >
                                        <X
                                            class="h-3.5 w-3.5"
                                            :stroke-width="2.5"
                                        />
                                    </button>
                                </form>
                                <!-- Removed message placeholder -->
                                <div
                                    v-else-if="item.m.deleted_at"
                                    class="rounded-2xl border border-dashed px-3.5 py-2 text-sm italic"
                                    :class="
                                        item.m.sender_id === userId
                                            ? 'text-right'
                                            : ''
                                    "
                                    style="
                                        background: var(--gl-surface-2);
                                        color: var(--gl-text-muted);
                                        border-color: var(--gl-border);
                                    "
                                >
                                    {{
                                        item.m.sender_id === userId
                                            ? 'You removed this message'
                                            : 'This message was removed'
                                    }}
                                </div>
                                <!-- Bubble -->
                                <template v-else>
                                    <div
                                        class="px-3.5 py-2 text-sm leading-relaxed break-words"
                                        :class="
                                            item.m.sender_id === userId
                                                ? 'text-white'
                                                : ''
                                        "
                                        :style="
                                            item.m.sender_id === userId
                                                ? {
                                                      background:
                                                          'linear-gradient(135deg, var(--gl-primary), var(--gl-secondary))',
                                                      borderRadius:
                                                          '18px 18px 6px 18px',
                                                      boxShadow:
                                                          '0 2px 8px var(--gl-primary-glow)',
                                                  }
                                                : {
                                                      background:
                                                          'var(--gl-surface-2)',
                                                      color: 'var(--gl-text-primary)',
                                                      borderRadius:
                                                          '18px 18px 18px 6px',
                                                      border: '1px solid var(--gl-border)',
                                                  }
                                        "
                                    >
                                        {{ item.m.body }}
                                    </div>
                                    <div
                                        class="mt-0.5 flex items-center gap-1.5 px-1.5"
                                        :class="
                                            item.m.sender_id === userId
                                                ? 'justify-end'
                                                : 'justify-start'
                                        "
                                    >
                                        <p
                                            class="text-[10px]"
                                            style="color: var(--gl-text-muted)"
                                        >
                                            {{ formatTime(item.m.created_at) }}
                                        </p>
                                        <span
                                            v-if="item.m.edited_at"
                                            class="text-[10px]"
                                            style="color: var(--gl-text-muted)"
                                            >(edited)</span
                                        >
                                        <span
                                            v-if="
                                                item.m.sender_id === userId &&
                                                isRead(item.m)
                                            "
                                            class="text-[10px]"
                                            style="color: var(--gl-primary)"
                                            >✓✓ Seen</span
                                        >
                                        <span
                                            v-else-if="
                                                item.m.sender_id === userId
                                            "
                                            class="text-[10px]"
                                            style="color: var(--gl-text-muted)"
                                            >✓ Sent</span
                                        >
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div
                    class="shrink-0 px-4 py-3"
                    style="
                        background: var(--gl-surface);
                        border-top: 1px solid var(--gl-border);
                    "
                >
                    <form
                        @submit.prevent="sendMessage"
                        class="flex items-center gap-3"
                    >
                        <input
                            v-model="newMessage"
                            type="text"
                            placeholder="Type a message..."
                            class="flex-1 rounded-full border px-4 py-2.5 text-sm transition-all outline-none focus:shadow-[0_0_0_2px_var(--gl-primary-glow)]"
                            style="
                                background: var(--gl-surface-2);
                                color: var(--gl-text-primary);
                                border-color: var(--gl-border);
                            "
                        />
                        <button
                            type="submit"
                            :disabled="!newMessage.trim()"
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    var(--gl-primary),
                                    var(--gl-secondary)
                                );
                                box-shadow: 0 0 12px var(--gl-primary-glow);
                            "
                        >
                            <Send class="h-4.5 w-4.5" :stroke-width="2" />
                        </button>
                    </form>
                </div>
            </template>

            <!-- Empty State -->
            <div
                v-else
                class="flex flex-1 items-center justify-center"
                style="min-height: 0"
            >
                <div class="px-8 text-center">
                    <div
                        class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
                        style="
                            background: linear-gradient(
                                135deg,
                                rgba(59, 130, 246, 0.12),
                                rgba(124, 58, 237, 0.08)
                            );
                        "
                    >
                        <MessageCircle
                            class="h-10 w-10"
                            :stroke-width="1.5"
                            style="color: var(--gl-primary)"
                        />
                    </div>
                    <p
                        class="text-lg font-bold"
                        style="color: var(--gl-text-primary)"
                    >
                        Your Messages
                    </p>
                    <p
                        class="mt-2 text-sm"
                        style="color: var(--gl-text-secondary)"
                    >
                        Select a conversation to start chatting.
                    </p>
                    <p class="mt-1 text-xs" style="color: var(--gl-text-muted)">
                        Stay connected with your classmates and teachers.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- New Conversation Modal -->
    <Teleport to="body">
        <div
            v-if="showNewModal"
            class="fixed inset-0 z-50 flex items-center justify-center"
            style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(2px)"
            @click.self="showNewModal = false"
        >
            <div
                class="mx-4 w-full max-w-sm rounded-2xl p-6"
                style="
                    background: var(--gl-surface);
                    border: 1px solid var(--gl-border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                "
            >
                <div class="mb-5 flex items-center gap-3">
                    <div
                        class="flex h-9 w-9 items-center justify-center rounded-full"
                        style="
                            background: linear-gradient(
                                135deg,
                                var(--gl-primary),
                                var(--gl-secondary)
                            );
                        "
                    >
                        <Plus
                            class="h-4.5 w-4.5 text-white"
                            :stroke-width="2"
                        />
                    </div>
                    <div>
                        <h3
                            class="text-base font-bold"
                            style="color: var(--gl-text-primary)"
                        >
                            New Conversation
                        </h3>
                        <p class="text-xs" style="color: var(--gl-text-muted)">
                            Start a chat with someone
                        </p>
                    </div>
                </div>
                <form @submit.prevent="startConversation" class="space-y-4">
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-medium"
                            style="color: var(--gl-text-secondary)"
                            >Contact</label
                        >
                        <select
                            v-model="newRecipient"
                            required
                            class="w-full rounded-xl border px-4 py-2.5 text-sm transition-all outline-none"
                            style="
                                background: var(--gl-surface-2);
                                color: var(--gl-text-primary);
                                border-color: var(--gl-border);
                            "
                        >
                            <option value="">Select a contact...</option>
                            <optgroup v-if="teachers.length" label="Teachers">
                                <option
                                    v-for="t in teachers"
                                    :key="t.id"
                                    :value="t.id"
                                >
                                    {{ t.name }}
                                </option>
                            </optgroup>
                            <optgroup v-if="students.length" label="Students">
                                <option
                                    v-for="s in students"
                                    :key="s.id"
                                    :value="s.id"
                                >
                                    {{ s.name }}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-medium"
                            style="color: var(--gl-text-secondary)"
                            >Message</label
                        >
                        <textarea
                            v-model="newMessageBody"
                            rows="3"
                            placeholder="Write your message..."
                            class="w-full resize-none rounded-xl border px-4 py-2.5 text-sm transition-all outline-none"
                            style="
                                background: var(--gl-surface-2);
                                color: var(--gl-text-primary);
                                border-color: var(--gl-border);
                            "
                            required
                        ></textarea>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            @click="showNewModal = false"
                            class="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                            style="
                                background: var(--gl-surface-2);
                                color: var(--gl-text-primary);
                                border: 1px solid var(--gl-border);
                            "
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    var(--gl-primary),
                                    var(--gl-secondary)
                                );
                                box-shadow: 0 0 12px var(--gl-primary-glow);
                            "
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Delete Modal -->
        <div
            v-if="showDeleteModal"
            class="fixed inset-0 z-50 flex items-center justify-center"
            style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(2px)"
            @click.self="showDeleteModal = false"
        >
            <div
                class="mx-4 w-full max-w-sm rounded-2xl p-6"
                style="
                    background: var(--gl-surface);
                    border: 1px solid var(--gl-border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                "
            >
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style="background: var(--gl-danger-bg)"
                >
                    <Trash2
                        class="h-7 w-7"
                        style="color: var(--gl-danger)"
                        :stroke-width="2"
                    />
                </div>
                <h3
                    class="mb-2 text-center text-base font-semibold"
                    style="color: var(--gl-text-primary)"
                >
                    Delete conversation?
                </h3>
                <p
                    class="text-center text-sm"
                    style="color: var(--gl-text-secondary)"
                >
                    This will hide the conversation from your inbox. The other
                    participant can still see it.
                </p>
                <div class="mt-5 flex items-center justify-center gap-3">
                    <button
                        @click="showDeleteModal = false"
                        class="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        style="
                            background: var(--gl-surface-2);
                            color: var(--gl-text-primary);
                            border: 1px solid var(--gl-border);
                        "
                    >
                        Cancel
                    </button>
                    <button
                        @click="confirmDelete"
                        class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                        style="background: var(--gl-danger)"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <!-- Remove Message Modal -->
        <div
            v-if="deleteTarget"
            class="fixed inset-0 z-50 flex items-center justify-center"
            style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(2px)"
            @click.self="deleteTarget = null"
        >
            <div
                class="mx-4 w-full max-w-sm rounded-2xl p-6"
                style="
                    background: var(--gl-surface);
                    border: 1px solid var(--gl-border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                "
            >
                <div
                    class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style="background: var(--gl-danger-bg)"
                >
                    <Trash2
                        class="h-7 w-7"
                        style="color: var(--gl-danger)"
                        :stroke-width="2"
                    />
                </div>
                <h3
                    class="mb-2 text-center text-base font-semibold"
                    style="color: var(--gl-text-primary)"
                >
                    Remove message?
                </h3>
                <p
                    class="text-center text-sm"
                    style="color: var(--gl-text-secondary)"
                >
                    This message will be replaced with "removed" for both of
                    you.
                </p>
                <div class="mt-5 flex items-center justify-center gap-3">
                    <button
                        @click="deleteTarget = null"
                        class="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        style="
                            background: var(--gl-surface-2);
                            color: var(--gl-text-primary);
                            border: 1px solid var(--gl-border);
                        "
                    >
                        Cancel
                    </button>
                    <button
                        @click="confirmDeleteMessage"
                        class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                        style="background: var(--gl-danger)"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import {
    Search,
    Plus,
    Send,
    MessageCircle,
    Trash2,
    Pencil,
    Check,
    X,
} from '@lucide/vue';
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';

const page = usePage();
const messengerEnabled = ref(true);
onMounted(async () => {
    try {
        const r = await fetch('/api/messenger-status');

        if (r.ok) {
            const d = await r.json();
            messengerEnabled.value = d.enabled;
        }
    } catch {}

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
const editingId = ref<number | null>(null);
const editDraft = ref('');
const editInputRef = ref<HTMLElement | null>(null);
const deleteTarget = ref<any | null>(null);
const messages = ref<any[]>(props.conversation?.messages ?? []);
const otherLastReadAt = ref<string | null>(
    props.conversation?.other_last_read_at ?? null,
);
const messagesRef = ref<HTMLElement | null>(null);
let pollInterval: number | null = null;

function isRead(m: any) {
    if (m.sender_id !== userId) {
        return false;
    }

    if (!otherLastReadAt.value) {
        return false;
    }

    return new Date(m.created_at) <= new Date(otherLastReadAt.value);
}

function scrollToBottom(smooth = false) {
    if (!messagesRef.value) {
        return;
    }

    setTimeout(() => {
        if (messagesRef.value) {
            messagesRef.value.scrollTo({
                top: messagesRef.value.scrollHeight,
                behavior: smooth ? 'smooth' : 'instant',
            });
        }
    }, 10);
}

function isNearBottom() {
    if (!messagesRef.value) {
        return true;
    }

    const el = messagesRef.value;

    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
}

const teachers = computed(() =>
    props.contacts.filter(
        (c: any) => c.role === 'teacher' || c.role === 'superadmin',
    ),
);
const students = computed(() =>
    props.contacts.filter((c: any) => c.role === 'student'),
);

const activeConversation = computed(() => props.conversation ?? null);
const activeId = computed(() => activeConversation.value?.id ?? null);

const filteredConversations = computed(() => {
    if (!search.value) {
        return props.conversations;
    }

    const q = search.value.toLowerCase();

    return props.conversations.filter((c: any) =>
        c.other?.name?.toLowerCase().includes(q),
    );
});

function dayKey(date: string) {
    return new Date(date).toDateString();
}

function formatDay(date: string) {
    const d = new Date(date);
    const now = new Date();

    if (d.toDateString() === now.toDateString()) {
        return 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

const chatItems = computed(() => {
    const items: any[] = [];
    let lastDay = '';
    const msgs = messages.value;
    msgs.forEach((m: any, i: number) => {
        const dk = dayKey(m.created_at);

        if (dk !== lastDay) {
            items.push({ type: 'day', label: formatDay(m.created_at) });
            lastDay = dk;
        }

        const next = msgs[i + 1];
        const showAvatar =
            m.sender_id !== userId && !(next && next.sender_id === m.sender_id);
        items.push({ type: 'msg', m, showAvatar });
    });

    return items;
});

function initials(name: string) {
    return name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function avatarBg(name: string) {
    const colors = [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#7C3AED',
        '#EC4899',
        '#06B6D4',
        '#F97316',
    ];
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

function avatarBg2(name: string) {
    const colors = [
        '#2563EB',
        '#059669',
        '#D97706',
        '#DC2626',
        '#6D28D9',
        '#DB2777',
        '#0891B2',
        '#EA580C',
    ];
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 7) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

function formatTime(date: string) {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
        return d.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function openConversation(id: number) {
    router.get(
        `${prefix}/messenger/${id}`,
        {},
        { preserveScroll: true, preserveState: true },
    );
}

function sendMessage() {
    if (!newMessage.value.trim() || !activeConversation.value) {
        return;
    }

    router.post(
        `${prefix}/messenger/${activeConversation.value.id}/send`,
        { body: newMessage.value },
        {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                newMessage.value = '';
            },
        },
    );
}

function startConversation() {
    if (!newRecipient.value || !newMessageBody.value.trim()) {
        return;
    }

    router.post(
        `${prefix}/messenger/start`,
        { recipient_id: newRecipient.value, message: newMessageBody.value },
        {
            onSuccess: () => {
                showNewModal.value = false;
            },
        },
    );
}

function deleteConversation() {
    if (!activeConversation.value) {
        return;
    }

    showDeleteModal.value = true;
}

function confirmDelete() {
    showDeleteModal.value = false;
    router.delete(`${prefix}/messenger/${activeConversation.value.id}`, {
        preserveScroll: true,
    });
}

function startEdit(m: any) {
    editingId.value = m.id;
    editDraft.value = m.body;
    requestAnimationFrame(() => editInputRef.value?.focus());
}

function cancelEdit() {
    editingId.value = null;
    editDraft.value = '';
}

function submitEdit(m: any) {
    const body = editDraft.value.trim();

    if (!body || !activeConversation.value) {
        return;
    }

    router.patch(
        `${prefix}/messenger/${activeConversation.value.id}/messages/${m.id}`,
        { body },
        {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                cancelEdit();
            },
        },
    );
}

function askDeleteMessage(m: any) {
    deleteTarget.value = m;
}

function confirmDeleteMessage() {
    const m = deleteTarget.value;
    deleteTarget.value = null;

    if (!m || !activeConversation.value) {
        return;
    }

    router.delete(
        `${prefix}/messenger/${activeConversation.value.id}/messages/${m.id}`,
        { preserveScroll: true },
    );
}

async function pollMessages() {
    if (!activeConversation.value) {
        return;
    }

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
            const newOnes = data.messages.filter(
                (m: any) => !existingIds.has(m.id),
            );

            if (newOnes.length) {
                messages.value = [...messages.value, ...newOnes];
            }
        }
    } catch {}
}

watch(
    activeConversation,
    (val) => {
        messages.value = val?.messages ?? [];
        otherLastReadAt.value = val?.other_last_read_at ?? null;
        scrollToBottom(val?.messages?.length ? true : false);
    },
    { immediate: true },
);

watch(messages, () => {
    if (isNearBottom()) {
        scrollToBottom(true);
    }
});

onUnmounted(() => {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
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
.h-4\.5 {
    height: 1.125rem;
}
.w-4\.5 {
    width: 1.125rem;
}
</style>
