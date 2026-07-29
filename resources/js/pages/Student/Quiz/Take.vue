<template>
    <Head :title="quiz.title" />

    <div v-if="restored" class="mb-6 rounded-lg px-4 py-3 text-sm" style="background-color: #FFF8E1; color: #8D6E00">
        Progress restored from previous session.
    </div>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
            <h2 class="text-lg font-semibold" style="color: #1B2231">{{ quiz.title }}</h2>
            <p class="text-sm" style="color: #5A6376">{{ answeredCount }} of {{ quiz.questions.length }} answered</p>
        </div>
        <div v-if="remainingSeconds !== null" class="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium" :class="remainingSeconds < 60 ? 'border-[#F6DEDD] text-[#AA3C36]' : 'border-[#D2D6DE] text-[#404A5C]'" style="background-color: white">
            <Clock class="h-4 w-4" :stroke-width="2" />
            {{ formatTime(remainingSeconds) }}
        </div>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
        <div v-for="(question, index) in quiz.questions" :key="question.id" class="card p-5">
            <p class="mb-4 text-sm font-medium" style="color: #1B2231">{{ index + 1 }}. {{ question.question_text }}</p>
            <div class="space-y-2">
                <label
                    v-for="option in question.options"
                    :key="option.id"
                    class="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors"
                    :class="answers[question.id] === option.id ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1B2231]' : 'border-[#D2D6DE] text-[#5A6376] hover:bg-[#F5F6F8]'"
                >
                    <input
                        v-model="answers[question.id]"
                        type="radio"
                        :name="`question-${question.id}`"
                        :value="option.id"
                        class="h-4 w-4"
                        style="color: #1D3557"
                    />
                    {{ option.option_text }}
                </label>
            </div>
        </div>

        <div class="flex justify-end">
            <button type="submit" class="btn-primary">
                <Send class="h-4 w-4" :stroke-width="2" />
                Submit quiz
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3';
import { Clock, Send } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAutoSave } from '@/composables/useAutoSave';

const props = defineProps<{
    quiz: any;
    startedAt: string;
}>();

const answers = ref<Record<number, number | null>>({});
const restored = ref(false);
let autoSave: ReturnType<typeof useAutoSave> | null = null;

props.quiz.questions.forEach((q: any) => {
    answers.value[q.id] = null;
});

const form = useForm({
    answers: answers.value,
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
    if (remainingSeconds.value <= 0) {
        if (timer) clearInterval(timer);
        submit();
    }
}

onMounted(() => {
    const savedKey = 'autosave-quiz-' + props.quiz.id;
    autoSave = useAutoSave(savedKey, () => ({ answers: answers.value }));

    const saved = autoSave.load();
    if (saved?.answers) {
        Object.assign(answers.value, saved.answers);
        restored.value = true;
    }

    autoSave.start();

    if (props.quiz.time_limit_minutes && props.startedAt) {
        const start = new Date(props.startedAt).getTime();
        const deadline = start + props.quiz.time_limit_minutes * 60 * 1000;
        remainingSeconds.value = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
        timer = setInterval(tick, 1000);
    }
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
    if (autoSave) autoSave.stop();
});

const answeredCount = computed(() => Object.values(form.answers).filter((v) => v !== null).length);

function submit() {
    if (autoSave) autoSave.clear();
    form.answers = answers.value;
    form.post(`/student/quizzes/${props.quiz.id}/submit`);
}
</script>
