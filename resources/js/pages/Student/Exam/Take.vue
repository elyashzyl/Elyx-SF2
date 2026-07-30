<template>
    <Head :title="exam.title" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background-color: #F4F5F7; overflow-y: auto;">
        <div class="px-6 py-6" style="max-width: 80rem;">
            <div v-if="flash?.info" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #E5F0FF; color: #1A56DB">
                {{ flash.info }}
            </div>

            <div v-if="restored" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #FFF8E1; color: #8D6E00">
                Progress restored from previous session.
            </div>

            <div class="mb-6">
                <div class="flex items-center gap-2.5">
                    <h2 class="text-lg font-semibold" style="color: #1B2231">{{ exam.title }}</h2>
                    <span v-if="exam.time_limit_minutes" class="flex items-center gap-1 rounded bg-[#FFF3E0] px-2 py-0.5 text-xs" style="color: #B76E00">
                        <Clock class="h-3.5 w-3.5" :stroke-width="2" />
                        {{ exam.time_limit_minutes }} min
                    </span>
                </div>
                <p v-if="exam.instructions" class="mt-2 text-sm" style="color: #5A6376">{{ exam.instructions }}</p>
            </div>

            <form @submit.prevent="submitExam">
                <div v-for="(sec, si) in exam.sections" :key="sec.id" class="mb-6 card">
                    <div class="mb-3 flex items-center gap-2">
                        <h3 class="text-sm font-semibold" style="color: #1B2231">{{ sec.title }}</h3>
                        <span class="rounded bg-[#E9EBEF] px-2 py-0.5 text-xs capitalize" style="color: #5A6376">{{ sec.section_type }}</span>
                    </div>
                    <p v-if="sec.instructions" class="mb-3 text-sm" style="color: #5A6376">{{ sec.instructions }}</p>

                    <template v-if="sec.section_type === 'questions'">
                        <div v-for="(q, qi) in sec.questions" :key="q.id" class="mb-4 rounded-lg border border-[#E9EBEF] p-4">
                            <p class="mb-2 text-sm font-medium" style="color: #1B2231">
                                {{ qi + 1 }}. {{ q.question_text }}
                                <span class="text-xs font-normal" style="color: #7C8598">({{ q.points }} pt{{ q.points > 1 ? 's' : '' }})</span>
                            </p>

                            <template v-if="q.type === 'multiple_choice'">
                                <div v-for="opt in q.options" :key="opt.id" class="mb-1.5 flex items-center gap-2">
                                    <input type="radio" :name="'q-' + q.id" :value="opt.id" v-model="answers[q.id]" class="h-4 w-4" />
                                    <label class="text-sm" style="color: #404A5C">{{ opt.option_text }}</label>
                                </div>
                            </template>

                            <template v-if="q.type === 'true_false'">
                                <div v-for="opt in q.options" :key="opt.id" class="mb-1.5 flex items-center gap-2">
                                    <input type="radio" :name="'q-' + q.id" :value="opt.id" v-model="answers[q.id]" class="h-4 w-4" />
                                    <label class="text-sm" style="color: #404A5C">{{ opt.option_text }}</label>
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
                                <button type="button" @click="addEnumItem(q.id)" class="text-xs font-medium hover:text-[#2B3444]" style="color: #5A6376">+ Add item</button>
                            </template>

                            <template v-if="q.type === 'matching'">
                                <div class="mt-2 space-y-2">
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <p class="mb-1.5 text-xs font-medium" style="color: #5A6376">Items</p>
                                            <div v-for="(pair, pi) in q.matching_pairs" :key="pair.id" class="mb-1.5 rounded bg-[#F9FAFB] px-3 py-2 text-sm" style="color: #1B2231">
                                                {{ pair.left_text }}
                                            </div>
                                        </div>
                                        <div>
                                            <p class="mb-1.5 text-xs font-medium" style="color: #5A6376">Matches</p>
                                            <div v-for="(pair, pi) in q.matching_pairs" :key="pair.id" class="mb-1.5">
                                                <select v-model="matchingAnswers[q.id][pair.id]" class="w-full rounded-lg border border-[#D2D6DE] px-2.5 py-2 text-sm outline-none">
                                                    <option value="" disabled>Select match</option>
                                                    <option v-for="p in shuffledRight(q)" :key="p.id" :value="p.right_text">{{ p.right_text }}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </template>

                    <template v-if="sec.section_type === 'practical'">
                        <div class="rounded-lg border border-[#E9EBEF] p-4">
                            <p class="text-sm" style="color: #5A6376">This section will be graded by your teacher. Submit your exam to proceed.</p>
                        </div>
                    </template>
                </div>

                <div class="flex items-center justify-end gap-3">
                    <button type="submit" class="btn-primary" :disabled="submitting">
                        {{ submitting ? 'Submitting...' : 'Submit Exam' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import { Clock } from '@lucide/vue';
import { useAutoSave } from '@/composables/useAutoSave';

const props = defineProps<{ exam: any; startedAt: string }>();

const page = usePage();
const flash = page.props.flash as any;

const answers = reactive<Record<number, any>>({});
const enumAnswers = reactive<Record<number, string[]>>({});
const matchingAnswers = reactive<Record<number, Record<number, string>>>({});

const submitting = ref(false);
const restored = ref(false);
let autoSave: ReturnType<typeof useAutoSave> | null = null;

// Initialize
props.exam.sections.forEach((sec: any) => {
    if (sec.section_type === 'questions') {
        sec.questions.forEach((q: any) => {
            if (q.type === 'enumeration') {
                enumAnswers[q.id] = [''];
            }
            if (q.type === 'matching') {
                matchingAnswers[q.id] = {};
            }
        });
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
        const shuffled = [...q.matching_pairs].sort(() => Math.random() - 0.5);
        rightTexts.value[q.id] = shuffled;
    }
    return rightTexts.value[q.id];
}

onMounted(() => {
    const savedKey = 'autosave-exam-' + props.exam.id;
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
});

onUnmounted(() => {
    if (autoSave) autoSave.stop();
});

function submitExam() {
    if (!confirm('Submit exam? This action cannot be undone.')) return;
    submitting.value = true;
    if (autoSave) autoSave.clear();

    const payload: Record<string, any> = {};

    props.exam.sections.forEach((sec: any) => {
        if (sec.section_type === 'questions') {
            sec.questions.forEach((q: any) => {
                if (q.type === 'enumeration') {
                    const items = (enumAnswers[q.id] || []).filter((i: string) => i.trim());
                    payload['answers[' + q.id + ']'] = JSON.stringify(items);
                } else if (q.type === 'matching') {
                    payload['answers[' + q.id + ']'] = matchingAnswers[q.id] || {};
                } else {
                    const val = answers[q.id];
                    if (val !== undefined && val !== null && val !== '') {
                        payload['answers[' + q.id + ']'] = val;
                    }
                }
            });
        }
    });

    router.post(`/student/exams/${props.exam.id}/submit`, payload, {
        preserveScroll: true,
        onFinish: () => { submitting.value = false; },
    });
}
</script>
