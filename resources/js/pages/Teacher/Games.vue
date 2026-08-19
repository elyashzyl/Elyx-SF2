<template>
    <Head title="Games" />

    <div
        v-if="flash?.success"
        class="gl-fade-in mb-6 rounded-xl px-4 py-3 text-sm"
        style="
            background: var(--gl-success-bg);
            color: var(--gl-success);
            border: 1px solid rgba(16, 185, 129, 0.2);
        "
    >
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h2 class="text-xl font-bold" style="color: var(--gl-text-primary)">
                Learning Games
            </h2>
            <p class="text-sm" style="color: var(--gl-text-secondary)">
                Create and manage flashcard games for your students.
            </p>
        </div>
        <button
            @click="openCreate"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="
                background: linear-gradient(135deg, #10b981, var(--gl-primary));
                box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
            "
        >
            <Plus class="h-4 w-4" :stroke-width="2" /> New Game
        </button>
    </div>

    <div
        v-if="!games.length"
        class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center"
    >
        <div
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style="background: var(--gl-surface-2)"
        >
            <Gamepad2
                class="h-6 w-6"
                style="color: var(--gl-text-muted)"
                :stroke-width="1.75"
            />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">
            No games yet
        </p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">
            Create your first flashcard game for students.
        </p>
        <button
            @click="openCreate"
            class="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="
                background: linear-gradient(135deg, #10b981, var(--gl-primary));
                box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
            "
        >
            <Plus class="h-4 w-4" :stroke-width="2" /> New Game
        </button>
    </div>

    <div v-else class="gl-glow-card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr
                    style="
                        color: var(--gl-text-muted);
                        border-bottom: 1px solid var(--gl-border);
                        background: var(--gl-surface-2);
                    "
                >
                    <th class="px-5 py-3 font-medium">Title</th>
                    <th class="px-5 py-3 font-medium">Subject</th>
                    <th class="px-5 py-3 font-medium">Grade</th>
                    <th class="px-5 py-3 font-medium">Cards</th>
                    <th class="px-5 py-3 font-medium">XP</th>
                    <th class="w-12 px-5 py-3 font-medium">Visible</th>
                    <th class="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y" style="border-color: var(--gl-border)">
                <tr
                    v-for="g in games"
                    :key="g.id"
                    class="transition-colors hover:bg-[rgba(59,130,246,0.03)]"
                >
                    <td
                        class="px-5 py-3 font-medium"
                        style="color: var(--gl-text-primary)"
                    >
                        {{ g.title }}
                    </td>
                    <td
                        class="px-5 py-3"
                        style="color: var(--gl-text-secondary)"
                    >
                        {{ g.subject }}
                    </td>
                    <td
                        class="px-5 py-3"
                        style="color: var(--gl-text-secondary)"
                    >
                        {{ g.grade || 'All' }}
                    </td>
                    <td
                        class="px-5 py-3"
                        style="color: var(--gl-text-secondary)"
                    >
                        {{ g.cards?.length ?? 0 }}
                    </td>
                    <td class="px-5 py-3">
                        <span
                            class="rounded-full px-2 py-0.5 text-xs font-medium"
                            style="
                                background: rgba(251, 191, 36, 0.1);
                                color: var(--gl-accent);
                            "
                            >{{ g.xp_reward }} XP</span
                        >
                    </td>
                    <td class="px-5 py-3">
                        <button
                            @click="toggleHidden(g)"
                            class="rounded-full p-1 transition-colors"
                            :style="
                                g.hidden
                                    ? 'color: var(--gl-text-muted);'
                                    : 'color: var(--gl-success);'
                            "
                            :title="g.hidden ? 'Show' : 'Hide'"
                        >
                            <Eye
                                v-if="!g.hidden"
                                class="h-4 w-4"
                                :stroke-width="2"
                            />
                            <EyeOff v-else class="h-4 w-4" :stroke-width="2" />
                        </button>
                    </td>
                    <td class="px-5 py-3 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            <button
                                @click="openEdit(g)"
                                class="rounded-lg p-2 transition-colors hover:bg-[rgba(59,130,246,0.08)]"
                                style="
                                    color: var(--gl-text-secondary);
                                    border: 1px solid var(--gl-border);
                                "
                                title="Edit"
                            >
                                <Pencil class="h-3.5 w-3.5" :stroke-width="2" />
                            </button>
                            <button
                                @click="confirmDelete(g)"
                                class="rounded-lg p-2 transition-colors hover:bg-[var(--gl-danger-bg)]"
                                style="
                                    color: var(--gl-text-muted);
                                    border: 1px solid var(--gl-border);
                                "
                                title="Delete"
                            >
                                <Trash2 class="h-3.5 w-3.5" :stroke-width="2" />
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
        <div
            v-if="showForm"
            class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8"
            style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(2px)"
            @click.self="showForm = false"
        >
            <div
                class="my-auto w-full max-w-2xl rounded-2xl p-6"
                style="
                    background: var(--gl-surface);
                    border: 1px solid var(--gl-border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                "
            >
                <div class="mb-4 flex items-center justify-between">
                    <h3
                        class="text-base font-semibold"
                        style="color: var(--gl-text-primary)"
                    >
                        {{ editingId ? 'Edit' : 'New' }} Game
                    </h3>
                    <button
                        @click="showForm = false"
                        class="rounded-lg p-1.5 transition-colors hover:bg-[var(--gl-surface-2)]"
                        style="color: var(--gl-text-muted)"
                    >
                        <X class="h-5 w-5" :stroke-width="2" />
                    </button>
                </div>
                <form @submit.prevent="save" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-medium"
                                style="color: var(--gl-text-secondary)"
                                >Title</label
                            ><input
                                v-model="form.title"
                                type="text"
                                required
                                class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-medium"
                                style="color: var(--gl-text-secondary)"
                                >Subject</label
                            ><input
                                v-model="form.subject"
                                type="text"
                                required
                                class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-medium"
                                style="color: var(--gl-text-secondary)"
                                >Grade (optional)</label
                            ><input
                                v-model="form.grade"
                                type="text"
                                class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-medium"
                                style="color: var(--gl-text-secondary)"
                                >XP Reward</label
                            ><input
                                v-model.number="form.xp_reward"
                                type="number"
                                min="1"
                                required
                                class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            />
                        </div>
                        <div>
                            <label
                                class="mb-1.5 block text-xs font-medium"
                                style="color: var(--gl-text-secondary)"
                                >Game Type</label
                            ><select
                                v-model="form.type"
                                class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border-color: var(--gl-border);
                                "
                            >
                                <option value="flashcard">Flashcard</option>
                                <option value="quiz">Multiple Choice</option>
                                <option value="fillblank">
                                    Fill in the Blank
                                </option>
                                <option value="truefalse">True / False</option>
                                <option value="wordjumble">Word Jumble</option>
                                <option value="colorharmony">
                                    Color Harmony
                                </option>
                                <option value="memorymatch">
                                    Memory Match
                                </option>
                                <option value="hangman">Hangman</option>
                                <option value="speedquiz">Speed Quiz</option>
                                <option value="dragdrop">
                                    Drag &amp; Drop Matching
                                </option>
                                <option value="ordering">
                                    Order the Steps
                                </option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label
                            class="mb-1.5 block text-xs font-medium"
                            style="color: var(--gl-text-secondary)"
                            >Description</label
                        ><textarea
                            v-model="form.description"
                            rows="2"
                            class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                            style="
                                background: var(--gl-surface-2);
                                color: var(--gl-text-primary);
                                border-color: var(--gl-border);
                            "
                        ></textarea>
                    </div>

                    <div
                        class="rounded-xl p-4"
                        style="
                            background: var(--gl-surface-2);
                            border: 1px solid var(--gl-border);
                        "
                    >
                        <div class="mb-3 flex items-center justify-between">
                            <span
                                class="text-xs font-semibold"
                                style="color: var(--gl-text-primary)"
                                >Flashcards</span
                            >
                            <button
                                type="button"
                                @click="addCard"
                                class="rounded-lg px-2.5 py-1 text-xs font-medium text-white transition-all"
                                style="
                                    background: linear-gradient(
                                        135deg,
                                        var(--gl-primary),
                                        var(--gl-secondary)
                                    );
                                "
                            >
                                <Plus class="inline h-3 w-3" /> Add Card
                            </button>
                        </div>
                        <div
                            v-for="(c, i) in form.cards"
                            :key="i"
                            class="mb-3 flex flex-col gap-1.5 pb-3"
                            :style="{
                                borderBottom:
                                    i < form.cards.length - 1
                                        ? '1px solid var(--gl-border)'
                                        : 'none',
                            }"
                        >
                            <div class="flex items-start gap-2">
                                <span
                                    class="mt-2.5 text-xs"
                                    style="color: var(--gl-text-muted)"
                                    >{{ i + 1 }}.</span
                                >
                                <input
                                    v-model="c.question"
                                    type="text"
                                    :placeholder="
                                        form.type === 'ordering'
                                            ? 'Step text (in correct order)'
                                            : form.type === 'memorymatch' ||
                                                form.type === 'dragdrop'
                                              ? 'Term / Question'
                                              : 'Question'
                                    "
                                    class="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none"
                                    style="
                                        background: var(--gl-surface-2);
                                        color: var(--gl-text-primary);
                                        border-color: var(--gl-border);
                                    "
                                />
                                <input
                                    v-if="
                                        form.type !== 'quiz' &&
                                        form.type !== 'speedquiz' &&
                                        form.type !== 'truefalse' &&
                                        form.type !== 'colorharmony'
                                    "
                                    v-model="c.answer"
                                    type="text"
                                    :placeholder="
                                        form.type === 'wordjumble' ||
                                        form.type === 'hangman'
                                            ? 'Answer (single word)'
                                            : form.type === 'memorymatch'
                                              ? 'Answer (matching card text)'
                                              : form.type === 'dragdrop'
                                                ? 'Definition (match)'
                                                : form.type === 'ordering'
                                                  ? 'Step label (optional)'
                                                  : 'Answer'
                                    "
                                    class="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none"
                                    style="
                                        background: var(--gl-surface-2);
                                        color: var(--gl-text-primary);
                                        border-color: var(--gl-border);
                                    "
                                />
                                <template v-else-if="form.type === 'truefalse'">
                                    <div class="flex items-center gap-3">
                                        <label
                                            class="flex items-center gap-1.5 text-xs"
                                            style="
                                                color: var(--gl-text-secondary);
                                            "
                                            ><input
                                                type="radio"
                                                :name="'tf_' + i"
                                                :checked="c.answer === 'True'"
                                                @change="c.answer = 'True'"
                                            />
                                            True</label
                                        >
                                        <label
                                            class="flex items-center gap-1.5 text-xs"
                                            style="
                                                color: var(--gl-text-secondary);
                                            "
                                            ><input
                                                type="radio"
                                                :name="'tf_' + i"
                                                :checked="c.answer === 'False'"
                                                @change="c.answer = 'False'"
                                            />
                                            False</label
                                        >
                                    </div>
                                </template>
                                <button
                                    v-if="form.cards.length > 1"
                                    type="button"
                                    @click="form.cards.splice(i, 1)"
                                    class="mt-1.5 rounded-lg p-1 transition-colors hover:bg-[var(--gl-danger-bg)]"
                                    style="color: var(--gl-danger)"
                                >
                                    <X class="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <template
                                v-if="
                                    form.type === 'quiz' ||
                                    form.type === 'speedquiz'
                                "
                            >
                                <div class="ml-6 space-y-1">
                                    <div
                                        class="flex flex-wrap items-center gap-2"
                                    >
                                        <span
                                            class="text-[10px]"
                                            style="color: var(--gl-text-muted)"
                                            >Options:</span
                                        >
                                        <div
                                            v-for="(opt, oi) in c.options || []"
                                            :key="oi"
                                            class="flex items-center gap-1"
                                        >
                                            <input
                                                v-model="c.options[oi]"
                                                type="text"
                                                placeholder="Option {{ oi + 1 }}"
                                                class="w-32 rounded-lg border px-2 py-1 text-[10px] outline-none"
                                                style="
                                                    background: var(
                                                        --gl-surface-2
                                                    );
                                                    color: var(
                                                        --gl-text-primary
                                                    );
                                                    border-color: var(
                                                        --gl-border
                                                    );
                                                "
                                            />
                                            <label
                                                class="flex items-center gap-0.5 text-[10px]"
                                                style="
                                                    color: var(--gl-text-muted);
                                                "
                                                ><input
                                                    type="radio"
                                                    :name="'correct_' + i"
                                                    :checked="
                                                        c.answer ===
                                                        c.options[oi]
                                                    "
                                                    @change="
                                                        c.answer = c.options[oi]
                                                    "
                                                />
                                                Correct</label
                                            >
                                            <button
                                                v-if="c.options.length > 2"
                                                @click="
                                                    c.options.splice(oi, 1);
                                                    if (c.answer === opt)
                                                        c.answer = '';
                                                "
                                                class="text-[10px]"
                                                style="color: var(--gl-danger)"
                                            >
                                                <X class="inline h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        v-if="(c.options?.length || 0) < 4"
                                        @click="
                                            if (!c.options) c.options = [];
                                            c.options.push('');
                                        "
                                        class="text-[10px] font-medium"
                                        style="color: var(--gl-primary)"
                                    >
                                        + Add option
                                    </button>
                                </div>
                            </template>
                            <template v-else-if="form.type === 'colorharmony'">
                                <div
                                    class="mt-1.5 ml-6 flex items-center gap-3"
                                >
                                    <label
                                        class="flex items-center gap-2 text-[10px]"
                                        style="color: var(--gl-text-muted)"
                                    >
                                        <span class="font-semibold">Base:</span>
                                        <input
                                            type="color"
                                            v-model="c.color"
                                            class="h-7 w-10 cursor-pointer rounded-md border"
                                            style="
                                                border-color: var(--gl-border);
                                                padding: 1px;
                                            "
                                        />
                                        <span class="font-mono">{{
                                            c.color
                                        }}</span>
                                    </label>
                                    <button
                                        type="button"
                                        @click="generatePalette(c)"
                                        class="rounded-lg px-2 py-1 text-[10px] font-medium transition-colors"
                                        style="
                                            background: rgba(
                                                139,
                                                92,
                                                246,
                                                0.12
                                            );
                                            color: var(--gl-secondary);
                                        "
                                    >
                                        Auto-generate palette
                                    </button>
                                </div>
                                <div class="mt-2 ml-6 space-y-1">
                                    <span
                                        class="text-[10px]"
                                        style="color: var(--gl-text-muted)"
                                        >Choices (mark the correct one):</span
                                    >
                                    <div
                                        v-for="(opt, oi) in c.options || []"
                                        :key="oi"
                                        class="flex items-center gap-2"
                                    >
                                        <input
                                            type="color"
                                            v-model="c.options[oi]"
                                            class="h-6 w-9 cursor-pointer rounded-md border"
                                            style="
                                                border-color: var(--gl-border);
                                                padding: 1px;
                                            "
                                        />
                                        <span
                                            class="font-mono text-[10px]"
                                            style="color: var(--gl-text-muted)"
                                            >{{ c.options[oi] }}</span
                                        >
                                        <label
                                            class="flex items-center gap-1 text-[10px]"
                                            style="color: var(--gl-text-muted)"
                                            ><input
                                                type="radio"
                                                :name="'ch_' + i"
                                                :checked="
                                                    c.answer === c.options[oi]
                                                "
                                                @change="
                                                    c.answer = c.options[oi]
                                                "
                                            />
                                            Correct</label
                                        >
                                        <button
                                            v-if="c.options.length > 2"
                                            @click="
                                                c.options.splice(oi, 1);
                                                if (c.answer === opt)
                                                    c.answer =
                                                        c.options[0] || '';
                                            "
                                            class="text-[10px]"
                                            style="color: var(--gl-danger)"
                                        >
                                            <X class="inline h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                    <button
                                        v-if="(c.options?.length || 0) < 6"
                                        type="button"
                                        @click="
                                            if (!c.options) c.options = [];
                                            c.options.push(randomHex());
                                        "
                                        class="text-[10px] font-medium"
                                        style="color: var(--gl-secondary)"
                                    >
                                        + Add choice
                                    </button>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div
                        class="flex items-center justify-end gap-3 pt-4"
                        style="border-top: 1px solid var(--gl-border)"
                    >
                        <button
                            type="button"
                            @click="showForm = false"
                            class="rounded-xl px-4 py-2.5 text-sm font-medium"
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
                            :disabled="saving"
                            class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                            style="
                                background: linear-gradient(
                                    135deg,
                                    var(--gl-primary),
                                    var(--gl-secondary)
                                );
                            "
                        >
                            {{ editingId ? 'Update' : 'Create' }} Game
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Plus, Pencil, Trash2, X, Gamepad2, Eye, EyeOff } from '@lucide/vue';
import { reactive, ref, watch } from 'vue';

defineProps<{ games: any[] }>();
const page = usePage();
const flash = page.props.flash as any;

const showForm = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);

const form = reactive({
    title: '',
    subject: '',
    grade: '',
    description: '',
    xp_reward: 10,
    type: 'flashcard',
    cards: [{ question: '', answer: '', color: '', options: [] as string[] }],
});

function randomHex() {
    return (
        '#' +
        Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, '0')
            .toUpperCase()
    );
}
function hexToHsl(hex: string): [number, number, number] {
    const hx = hex.replace('#', '');
    const r = parseInt(hx.slice(0, 2), 16) / 255,
        g = parseInt(hx.slice(2, 4), 16) / 255,
        b = parseInt(hx.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h = 0,
        s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
        }

        h *= 60;
    }

    return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let rgb: [number, number, number];

    if (h < 60) {
        rgb = [c, x, 0];
    } else if (h < 120) {
        rgb = [x, c, 0];
    } else if (h < 180) {
        rgb = [0, c, x];
    } else if (h < 240) {
        rgb = [0, x, c];
    } else if (h < 300) {
        rgb = [x, 0, c];
    } else {
        rgb = [c, 0, x];
    }

    const toHex = (v: number) =>
        Math.round((v + m) * 255)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase();

    return '#' + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
}
function shuffleArray(arr: string[]) {
    const a = [...arr];

    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}
function generatePalette(c: any) {
    if (!c.color || !/^#[0-9A-Fa-f]{6}$/.test(c.color)) {
        c.color = randomHex();
    }

    const [h, s, l] = hexToHsl(c.color);
    const candidates = [
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 30) % 360, Math.min(0.85, s + 0.12), l),
        hslToHex((h - 30 + 360) % 360, Math.min(0.85, s + 0.12), l),
        hslToHex((h + 120) % 360, s, l),
        hslToHex(h, s, Math.min(0.85, l + 0.18)),
    ];
    const unique = [...new Set(candidates)];
    c.options = shuffleArray(unique);
    c.answer = c.options[Math.floor(Math.random() * c.options.length)];
}
function addCard() {
    if (form.type === 'colorharmony') {
        const c: any = {
            question: '',
            answer: '',
            color: randomHex(),
            options: [],
        };
        generatePalette(c);
        form.cards.push(c);
    } else {
        form.cards.push({
            question: '',
            answer: '',
            color: '',
            options: [] as string[],
        });
    }
}

watch(
    () => form.type,
    (t) => {
        if (t === 'flashcard' && !editingId.value && form.xp_reward === 10) {
            form.xp_reward = 2;
        }

        if (t === 'colorharmony') {
            form.cards = form.cards.map((c: any) => {
                if (!c.color || !/^#[0-9A-Fa-f]{6}$/.test(c.color)) {
                    c.color = randomHex();
                }

                if (!c.options || !c.options.length) {
                    const [h, s, l] = hexToHsl(c.color);
                    c.options = shuffleArray([
                        hslToHex((h + 180) % 360, s, l),
                        hslToHex((h + 120) % 360, s, l),
                        hslToHex(h, s, Math.min(0.85, l + 0.18)),
                        hslToHex((h + 60) % 360, Math.min(0.85, s + 0.12), l),
                    ]);
                }

                if (!c.answer) {
                    c.answer = c.options[0];
                }

                return c;
            });
        }
    },
);

function openCreate() {
    editingId.value = null;
    form.title = '';
    form.subject = '';
    form.grade = '';
    form.description = '';
    form.xp_reward = 10;
    form.type = 'flashcard';
    form.cards = [{ question: '', answer: '', color: '', options: [] }];
    form.xp_reward = 2;
    showForm.value = true;
}

function openEdit(g: any) {
    editingId.value = g.id;
    form.title = g.title;
    form.subject = g.subject;
    form.grade = g.grade ?? '';
    form.description = g.description ?? '';
    form.xp_reward = g.xp_reward;
    form.type = g.type || 'flashcard';
    form.cards = (g.cards || []).map((c: any) => ({
        question: c.question,
        answer: c.answer,
        color: c.color || randomHex(),
        options: c.options || [],
    }));

    if (form.type === 'colorharmony') {
        form.cards = form.cards.map((c: any) => {
            if (!/^#[0-9A-Fa-f]{6}$/.test(c.color)) {
                c.color = randomHex();
            }

            c.options =
                c.options && c.options.length
                    ? c.options
                    : [randomHex(), randomHex(), randomHex(), randomHex()];

            if (!c.answer) {
                c.answer = c.options[0];
            }

            return c;
        });
    }

    showForm.value = true;
}

function save() {
    saving.value = true;
    const method = editingId.value ? 'put' : 'post';
    const url = editingId.value
        ? `/teacher/games/${editingId.value}`
        : '/teacher/games';
    router[method](url, form as any, {
        preserveScroll: true,
        onFinish: () => {
            saving.value = false;
            showForm.value = false;
        },
    });
}

function confirmDelete(g: any) {
    if (confirm(`Delete "${g.title}"?`)) {
        router.delete(`/teacher/games/${g.id}`, { preserveScroll: true });
    }
}

function toggleHidden(g: any) {
    router.patch(
        `/teacher/games/${g.id}/toggle-hidden`,
        {},
        { preserveScroll: true },
    );
}
</script>
