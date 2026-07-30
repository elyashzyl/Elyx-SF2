<template>
    <Head :title="seatwork.title" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background-color: #F4F5F7; overflow-y: auto;">
        <div class="px-6 py-6" style="max-width: 80rem;">
            <div v-if="flash?.info" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #E5F0FF; color: #1A56DB">
                {{ flash.info }}
            </div>

            <div v-if="restored" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #FFF8E1; color: #8D6E00">
                Progress restored from previous session.
            </div>

            <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div class="flex items-center gap-2.5">
                        <h2 class="text-lg font-semibold" style="color: #1B2231">{{ seatwork.title }}</h2>
                        <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs" style="color: #5A6376">Seatwork</span>
                    </div>
                    <p class="mt-1 text-sm" style="color: #5A6376">{{ answeredCount }} of {{ seatwork.questions.length }} answered</p>
                    <p v-if="seatwork.instructions" class="mt-2 text-sm" style="color: #404A5C">{{ seatwork.instructions }}</p>
                </div>
                <div v-if="remainingSeconds !== null" class="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium" :class="remainingSeconds < 60 ? 'border-[#F6DEDD] text-[#AA3C36]' : 'border-[#D2D6DE] text-[#404A5C]'" style="background-color: white">
                    <Clock class="h-4 w-4" :stroke-width="2" />
                    {{ formatTime(remainingSeconds) }}
                </div>
            </div>

            <form @submit.prevent="submit">
                <div v-for="(q, qi) in seatwork.questions" :key="q.id" class="mb-4 card p-5">
                    <p class="mb-3 text-sm font-medium" style="color: #1B2231">
                        {{ qi + 1 }}. {{ q.question_text }}
                        <span class="text-xs font-normal" style="color: #7C8598">({{ q.points }} pt{{ q.points > 1 ? 's' : '' }})</span>
                    </p>

                    <template v-if="q.type === 'multiple_choice'">
                        <div class="space-y-2">
                            <label v-for="opt in q.options" :key="opt.id" class="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors"
                                :class="answers[q.id] === opt.id ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1B2231]' : 'border-[#D2D6DE] text-[#5A6376] hover:bg-[#F5F6F8]'">
                                <input v-model="answers[q.id]" type="radio" :name="'q-' + q.id" :value="opt.id" class="h-4 w-4" />
                                {{ opt.option_text }}
                            </label>
                        </div>
                    </template>

                    <template v-if="q.type === 'true_false'">
                        <div class="space-y-2">
                            <label v-for="opt in q.options" :key="opt.id" class="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors"
                                :class="answers[q.id] === opt.id ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1B2231]' : 'border-[#D2D6DE] text-[#5A6376] hover:bg-[#F5F6F8]'">
                                <input v-model="answers[q.id]" type="radio" :name="'q-' + q.id" :value="opt.id" class="h-4 w-4" />
                                {{ opt.option_text }}
                            </label>
                        </div>
                    </template>

                    <template v-if="q.type === 'identification'">
                        <input v-model="answers[q.id]" type="text" class="input-field" placeholder="Type your answer..." />
                    </template>

                    <template v-if="q.type === 'enumeration'">
                        <div v-for="i in enumCount(q)" :key="i" class="mb-1.5 flex items-center gap-2">
                            <span class="text-xs" style="color: #7C8598">{{ i }}.</span>
                            <input v-model="enumAnswers[q.id][i - 1]" type="text" class="flex-1 rounded-lg border border-[#D2D6DE] px-2.5 py-1.5 text-sm outline-none" :placeholder="'Item ' + i" />
                        </div>
                        <button type="button" @click="addEnumItem(q.id)" class="mt-1 text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add item</button>
                    </template>

                    <template v-if="q.type === 'matching'">
                        <div class="mt-2 grid grid-cols-2 gap-4">
                            <div>
                                <p class="mb-1.5 text-xs font-medium" style="color: #5A6376">Items</p>
                                <div v-for="pair in q.matching_pairs" :key="pair.id" class="mb-1.5 rounded bg-[#F9FAFB] px-3 py-2 text-sm" style="color: #1B2231">{{ pair.left_text }}</div>
                            </div>
                            <div>
                                <p class="mb-1.5 text-xs font-medium" style="color: #5A6376">Matches</p>
                                <div v-for="pair in q.matching_pairs" :key="pair.id" class="mb-1.5">
                                    <select v-model="matchingAnswers[q.id][pair.id]" class="w-full rounded-lg border border-[#D2D6DE] px-2.5 py-2 text-sm outline-none">
                                        <option value="" disabled>Select match</option>
                                        <option v-for="p in shuffledRight(q)" :key="p.id" :value="p.right_text">{{ p.right_text }}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <div class="flex items-center justify-end gap-3 pt-2">
                    <button type="submit" class="btn-primary" :disabled="submitting">
                        <Send class="h-4 w-4" :stroke-width="2" />
                        {{ submitting ? 'Submitting...' : 'Submit seatwork' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, router, usePage } from '@inertiajs/vue3';
import { Clock, Send } from '@lucide/vue';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useAutoSave } from '@/composables/useAutoSave';

const props = defineProps<{ seatwork: any; startedAt: string }>();

const page = usePage();
const flash = page.props.flash as any;

const answers = reactive<Record<number, any>>({});
const enumAnswers = reactive<Record<number, string[]>>({});
const matchingAnswers = reactive<Record<number, Record<number, string>>>({});
const submitting = ref(false);
const restored = ref(false);
let autoSave: ReturnType<typeof useAutoSave> | null = null;

props.seatwork.questions.forEach((q: any) => {
    if (q.type === 'enumeration') {
        enumAnswers[q.id] = [''];
    } else if (q.type === 'matching') {
        matchingAnswers[q.id] = {};
    } else {
        answers[q.id] = q.type === 'identification' ? '' : null;
    }
});

function enumCount(q: any): number {
    const arr = enumAnswers[q.id];
    return arr ? arr.length : 0;
}

function addEnumItem(qId: number) {
    if (!enumAnswers[qId]) enumAnswers[qId] = [''];
    enumAnswers[qId].push('');
}

const rightTexts = ref<Record<number, any[]>>({});

function shuffledRight(q: any): any[] {
    if (!rightTexts.value[q.id]) {
        rightTexts.value[q.id] = [...q.matching_pairs].sort(() => Math.random() - 0.5);
    }
    return rightTexts.value[q.id];
}

const answeredCount = computed(() => {
    const answered = props.seatwork.questions.filter((q: any) => {
        if (q.type === 'enumeration') return (enumAnswers[q.id] || []).some((i: string) => i.trim());
        if (q.type === 'matching') return Object.values(matchingAnswers[q.id] || {}).some((v) => v);
        return answers[q.id] !== null && answers[q.id] !== undefined && answers[q.id] !== '';
    });
    return answered.length;
});

const remainingSeconds = ref<number | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

function formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function tick() {
    if (remainingSeconds.value === null) return;
    remainingSeconds.value -= 1;
    if (remainingSeconds.value <= 0) { if (timer) clearInterval(timer); submit(); }
}

onMounted(() => {
    const savedKey = 'autosave-seatwork-' + props.seatwork.id;
    autoSave = useAutoSave(savedKey, () => ({
        answers: { ...answers },
        enumAnswers: Object.fromEntries(Object.entries(enumAnswers).map(([k, v]) => [k, [...v]])),
        matchingAnswers: Object.fromEntries(Object.entries(matchingAnswers).map(([k, v]) => [k, { ...v }])),
    }));

    const saved = autoSave.load();
    if (saved) {
        if (saved.answers) Object.assign(answers, saved.answers);
        if (saved.enumAnswers) Object.assign(enumAnswers, saved.enumAnswers);
        if (saved.matchingAnswers) Object.assign(matchingAnswers, saved.matchingAnswers);
        restored.value = true;
    }

    autoSave.start();

    if (props.seatwork.time_limit_minutes && props.startedAt) {
        const start = new Date(props.startedAt).getTime();
        const deadline = start + props.seatwork.time_limit_minutes * 60 * 1000;
        remainingSeconds.value = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
        timer = setInterval(tick, 1000);
    }
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
    if (autoSave) autoSave.stop();
});

function submit() {
    if (!confirm('Submit seatwork? This cannot be undone.')) return;
    submitting.value = true;
    if (autoSave) autoSave.clear();
    const payload: Record<string, any> = {};
    props.seatwork.questions.forEach((q: any) => {
        if (q.type === 'enumeration') {
            const items = (enumAnswers[q.id] || []).filter((i: string) => i.trim());
            payload['answers[' + q.id + ']'] = items;
        } else if (q.type === 'matching') {
            payload['answers[' + q.id + ']'] = matchingAnswers[q.id] || {};
        } else {
            const val = answers[q.id];
            if (val !== undefined && val !== null && val !== '') {
                payload['answers[' + q.id + ']'] = val;
            }
        }
    });
    router.post('/student/seatworks/' + props.seatwork.id + '/submit', payload, {
        preserveScroll: true,
        onFinish: () => { submitting.value = false; },
    });
}
</script>
