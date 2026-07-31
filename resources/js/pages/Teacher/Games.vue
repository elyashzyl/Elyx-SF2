<template>
    <Head title="Games" />

    <div v-if="flash?.success" class="mb-6 rounded-xl px-4 py-3 text-sm gl-fade-in"
        style="background: var(--gl-success-bg); color: var(--gl-success); border: 1px solid rgba(16,185,129,0.2);">
        {{ flash.success }}
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h2 class="text-xl font-bold" style="color: var(--gl-text-primary)">Learning Games</h2>
            <p class="text-sm" style="color: var(--gl-text-secondary)">Create and manage flashcard games for your students.</p>
        </div>
        <button @click="openCreate"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="background: linear-gradient(135deg, #10B981, var(--gl-primary)); box-shadow: 0 0 12px rgba(16,185,129,0.3);">
            <Plus class="h-4 w-4" :stroke-width="2" /> New Game
        </button>
    </div>

    <div v-if="!games.length" class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style="background: var(--gl-surface-2);">
            <Gamepad2 class="h-6 w-6" style="color: var(--gl-text-muted);" :stroke-width="1.75" />
        </div>
        <p class="text-sm font-medium" style="color: var(--gl-text-secondary)">No games yet</p>
        <p class="mt-1 text-sm" style="color: var(--gl-text-muted)">Create your first flashcard game for students.</p>
        <button @click="openCreate" class="mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style="background: linear-gradient(135deg, #10B981, var(--gl-primary)); box-shadow: 0 0 12px rgba(16,185,129,0.3);">
            <Plus class="h-4 w-4" :stroke-width="2" /> New Game
        </button>
    </div>

    <div v-else class="gl-glow-card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr style="color: var(--gl-text-muted); border-bottom: 1px solid var(--gl-border); background: var(--gl-surface-2);">
                    <th class="px-5 py-3 font-medium">Title</th>
                    <th class="px-5 py-3 font-medium">Subject</th>
                    <th class="px-5 py-3 font-medium">Grade</th>
                    <th class="px-5 py-3 font-medium">Cards</th>
                    <th class="px-5 py-3 font-medium">XP</th>
                    <th class="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y" style="border-color: var(--gl-border);">
                <tr v-for="g in games" :key="g.id" class="transition-colors hover:bg-[rgba(59,130,246,0.03)]">
                    <td class="px-5 py-3 font-medium" style="color: var(--gl-text-primary)">{{ g.title }}</td>
                    <td class="px-5 py-3" style="color: var(--gl-text-secondary)">{{ g.subject }}</td>
                    <td class="px-5 py-3" style="color: var(--gl-text-secondary)">{{ g.grade || 'All' }}</td>
                    <td class="px-5 py-3" style="color: var(--gl-text-secondary)">{{ g.cards?.length ?? 0 }}</td>
                    <td class="px-5 py-3"><span class="rounded-full px-2 py-0.5 text-xs font-medium" style="background: rgba(251,191,36,0.1); color: var(--gl-accent);">{{ g.xp_reward }} XP</span></td>
                    <td class="px-5 py-3 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                            <button @click="openEdit(g)" class="rounded-lg p-2 transition-colors hover:bg-[rgba(59,130,246,0.08)]" style="color: var(--gl-text-secondary); border: 1px solid var(--gl-border);" title="Edit"><Pencil class="h-3.5 w-3.5" :stroke-width="2" /></button>
                            <button @click="confirmDelete(g)" class="rounded-lg p-2 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-text-muted); border: 1px solid var(--gl-border);" title="Delete"><Trash2 class="h-3.5 w-3.5" :stroke-width="2" /></button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
        <div v-if="showForm" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8" style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);" @click.self="showForm = false">
            <div class="my-auto w-full max-w-2xl rounded-2xl p-6" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-base font-semibold" style="color: var(--gl-text-primary)">{{ editingId ? 'Edit' : 'New' }} Game</h3>
                    <button @click="showForm = false" class="rounded-lg p-1.5 transition-colors hover:bg-[var(--gl-surface-2)]" style="color: var(--gl-text-muted);"><X class="h-5 w-5" :stroke-width="2" /></button>
                </div>
                <form @submit.prevent="save" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">Title</label><input v-model="form.title" type="text" required class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" /></div>
                        <div><label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">Subject</label><input v-model="form.subject" type="text" required class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" /></div>
                        <div><label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">Grade (optional)</label><input v-model="form.grade" type="text" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" /></div>
                    <div><label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">XP Reward</label><input v-model.number="form.xp_reward" type="number" min="1" required class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" /></div>
                    <div><label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">Game Type</label><select v-model="form.type" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);"><option value="flashcard">Flashcard</option><option value="quiz">Multiple Choice</option><option value="fillblank">Fill in the Blank</option></select></div>
                </div>
                    <div><label class="block mb-1.5 text-xs font-medium" style="color: var(--gl-text-secondary);">Description</label><textarea v-model="form.description" rows="2" class="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);"></textarea></div>

                    <div class="rounded-xl p-4" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border);">
                        <div class="mb-3 flex items-center justify-between">
                            <span class="text-xs font-semibold" style="color: var(--gl-text-primary);">Flashcards</span>
                            <button type="button" @click="form.cards.push({question:'',answer:''})" class="rounded-lg px-2.5 py-1 text-xs font-medium text-white transition-all" style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));"><Plus class="h-3 w-3 inline" /> Add Card</button>
                        </div>
                        <div v-for="(c, i) in form.cards" :key="i" class="flex flex-col gap-1.5 mb-3 pb-3" :style="{ borderBottom: i < form.cards.length - 1 ? '1px solid var(--gl-border)' : 'none' }">
                            <div class="flex items-start gap-2">
                                <span class="text-xs mt-2.5" style="color: var(--gl-text-muted)">{{ i + 1 }}.</span>
                                <input v-model="c.question" type="text" placeholder="Question" class="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                                <input v-if="form.type !== 'quiz'" v-model="c.answer" type="text" placeholder="Answer" class="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                                <button v-if="form.cards.length > 1" type="button" @click="form.cards.splice(i,1)" class="rounded-lg p-1 mt-1.5 transition-colors hover:bg-[var(--gl-danger-bg)]" style="color: var(--gl-danger);"><X class="h-3.5 w-3.5" /></button>
                            </div>
                            <template v-if="form.type === 'quiz'">
                                <div class="ml-6 space-y-1">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <span class="text-[10px]" style="color: var(--gl-text-muted);">Options:</span>
                                        <div v-for="(opt, oi) in (c.options || [])" :key="oi" class="flex items-center gap-1">
                                            <input v-model="c.options[oi]" type="text" placeholder="Option {{ oi + 1 }}" class="w-32 rounded-lg border px-2 py-1 text-[10px] outline-none" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);" />
                                            <label class="flex items-center gap-0.5 text-[10px]" style="color: var(--gl-text-muted)"><input type="radio" :name="'correct_'+i" :checked="c.answer === c.options[oi]" @change="c.answer = c.options[oi]" /> Correct</label>
                                            <button v-if="c.options.length > 2" @click="c.options.splice(oi,1); if(c.answer === opt) c.answer=''" class="text-[10px]" style="color: var(--gl-danger);"><X class="h-2.5 w-2.5 inline" /></button>
                                        </div>
                                    </div>
                                    <button v-if="(c.options?.length || 0) < 4" @click="if(!c.options) c.options=[]; c.options.push('')" class="text-[10px] font-medium" style="color: var(--gl-primary);">+ Add option</button>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4" style="border-top: 1px solid var(--gl-border);">
                        <button type="button" @click="showForm = false" class="rounded-xl px-4 py-2.5 text-sm font-medium" style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">Cancel</button>
                        <button type="submit" :disabled="saving" class="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50" style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">{{ editingId ? 'Update' : 'Create' }} Game</button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Plus, Pencil, Trash2, X, Gamepad2 } from '@lucide/vue';
import { reactive, ref } from 'vue';

defineProps<{ games: any[] }>();
const page = usePage();
const flash = page.props.flash as any;

const showForm = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);

const form = reactive({ title: '', subject: '', grade: '', description: '', xp_reward: 10, type: 'flashcard', cards: [{ question: '', answer: '', options: [] as string[] }] });

function openCreate() {
    editingId.value = null;
    form.title = ''; form.subject = ''; form.grade = ''; form.description = ''; form.xp_reward = 10; form.type = 'flashcard'; form.cards = [{ question: '', answer: '', options: [] }];
    showForm.value = true;
}

function openEdit(g: any) {
    editingId.value = g.id;
    form.title = g.title; form.subject = g.subject; form.grade = g.grade ?? ''; form.description = g.description ?? ''; form.xp_reward = g.xp_reward; form.type = g.type || 'flashcard';
    form.cards = (g.cards || []).map((c: any) => ({ question: c.question, answer: c.answer, options: c.options || [] }));
    showForm.value = true;
}

function save() {
    saving.value = true;
    const method = editingId.value ? 'put' : 'post';
    const url = editingId.value ? `/teacher/games/${editingId.value}` : '/teacher/games';
    router[method](url, form as any, { preserveScroll: true, onFinish: () => { saving.value = false; showForm.value = false; } });
}

function confirmDelete(g: any) {
    if (confirm(`Delete "${g.title}"?`)) router.delete(`/teacher/games/${g.id}`, { preserveScroll: true });
}
</script>
