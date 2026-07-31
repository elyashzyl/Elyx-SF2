<template>
    <Head title="Learning Games" />

    <div class="fixed" style="top: 64px; left: 16rem; right: 0; bottom: 0; background: var(--gl-bg); overflow-y: auto;">
        <div class="px-6 py-6">

    <!-- Hero -->
    <div class="relative mb-8 overflow-hidden rounded-2xl p-8 gl-fade-in"
        style="background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.06)); border: 1px solid var(--gl-border);">
        <div class="relative z-10">
            <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style="background: linear-gradient(135deg, #10B981, var(--gl-primary)); box-shadow: 0 0 20px rgba(16,185,129,0.3);">
                <Gamepad2 class="h-6 w-6 text-white" :stroke-width="2" />
            </div>
            <h1 class="text-2xl font-bold" style="color: var(--gl-text-primary)">Learning Games</h1>
            <p class="mt-2 max-w-lg text-sm" style="color: var(--gl-text-secondary)">
                Master your subjects with interactive flashcards — flip cards, test your knowledge, and earn XP.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, #10B981, transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
    </div>

    <!-- Games Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="game in games" :key="game.title" @click="openGame(game)"
            class="gl-glow-card group flex flex-col p-5 text-left transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2)]">
            <div class="flex items-start gap-4 mb-3">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" :style="{ background: game.bg }">
                    <component :is="game.icon" class="h-6 w-6" :style="{ color: game.color }" :stroke-width="2" />
                </div>
                <div>
                    <h3 class="text-sm font-semibold" style="color: var(--gl-text-primary)">{{ game.title }}</h3>
                    <span class="rounded-full px-2 py-0.5 text-[10px] font-medium mt-1 inline-block" :style="{ background: game.badge, color: game.color }">{{ game.subject }}</span>
                </div>
            </div>
            <p class="text-xs mb-4" style="color: var(--gl-text-secondary)">{{ game.desc }}</p>
            <div class="mt-auto flex items-center justify-between">
                <span class="text-xs" style="color: var(--gl-text-muted)">{{ game.cards.length }} flashcards</span>
                <span class="flex items-center gap-1 text-xs" style="color: var(--gl-accent);">
                    <Zap class="h-3.5 w-3.5" :stroke-width="2" /> {{ game.xp }} XP
                </span>
            </div>
        </button>
    </div>

    <!-- Flashcard Game Modal -->
    <Teleport to="body">
        <div v-if="currentGame" class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);" @click.self="closeGame">
            <div class="mx-4 w-full max-w-lg rounded-2xl overflow-hidden gl-fade-in" style="background: var(--gl-surface); border: 1px solid var(--gl-border); box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <!-- Game Header -->
                <div class="px-6 py-4 border-b flex items-center justify-between" style="border-color: var(--gl-border);">
                    <div class="flex items-center gap-3">
                        <div class="flex h-9 w-9 items-center justify-center rounded-lg" :style="{ background: currentGame.bg }">
                            <component :is="currentGame.icon" class="h-4.5 w-4.5" :style="{ color: currentGame.color }" :stroke-width="2" />
                        </div>
                        <div>
                            <p class="text-sm font-semibold" style="color: var(--gl-text-primary)">{{ currentGame.title }}</p>
                            <p class="text-[10px]" style="color: var(--gl-text-muted)">{{ currentCard + 1 }} / {{ currentGame.cards.length }}</p>
                        </div>
                    </div>
                    <button @click="closeGame" class="rounded-lg p-1.5 transition-colors hover:bg-[var(--gl-surface-2)]" style="color: var(--gl-text-muted);"><X class="h-4.5 w-4.5" :stroke-width="2" /></button>
                </div>

                <!-- Flashcard - flip style -->
                <div v-if="currentGame.type === 'flashcard'" class="p-6" style="min-height: 280px;">
                    <div class="relative h-52 cursor-pointer" @click="flipped = !flipped" style="perspective: 1000px;">
                        <div class="absolute inset-0 transition-transform duration-500" :style="{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transformStyle: 'preserve-3d' }">
                            <div class="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center" style="background: var(--gl-surface-2); border: 1px solid var(--gl-border); backface-visibility: hidden;">
                                <div class="flex h-12 w-12 items-center justify-center rounded-full mb-3" style="background: rgba(59,130,246,0.1);">
                                    <HelpCircle class="h-6 w-6" style="color: var(--gl-primary);" :stroke-width="2" />
                                </div>
                                <p class="text-sm font-medium mb-1" style="color: var(--gl-text-muted)">Question</p>
                                <p class="text-base font-semibold" style="color: var(--gl-text-primary)">{{ currentGame.cards[currentCard]?.question }}</p>
                                <p class="text-xs mt-4" style="color: var(--gl-text-muted)">Tap to reveal answer</p>
                            </div>
                            <div class="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center" style="background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.04)); border: 1px solid rgba(16,185,129,0.2); backface-visibility: hidden; transform: rotateY(180deg);">
                                <div class="flex h-12 w-12 items-center justify-center rounded-full mb-3" style="background: rgba(16,185,129,0.1);">
                                    <CheckCircle2 class="h-6 w-6" style="color: var(--gl-success);" :stroke-width="2" />
                                </div>
                                <p class="text-sm font-medium mb-1" style="color: var(--gl-success)">Answer</p>
                                <p class="text-base font-semibold" style="color: var(--gl-text-primary)">{{ currentGame.cards[currentCard]?.answer }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quiz - multiple choice -->
                <div v-else-if="currentGame.type === 'quiz'" class="p-6" style="min-height: 280px;">
                    <div class="text-center mb-6">
                        <p class="text-xs mb-2" style="color: var(--gl-text-muted)">Question {{ currentCard + 1 }} of {{ currentGame.cards.length }}</p>
                        <p class="text-base font-semibold" style="color: var(--gl-text-primary)">{{ currentGame.cards[currentCard]?.question }}</p>
                    </div>
                    <div v-if="!answered" class="space-y-2.5">
                        <button v-for="(opt, oi) in (currentGame.cards[currentCard]?.options || [])" :key="oi" @click="checkAnswer(opt)"
                            class="w-full rounded-xl border px-4 py-3 text-sm text-left transition-all hover:bg-[rgba(59,130,246,0.04)]"
                            :style="selectedOption === opt && opt !== currentGame.cards[currentCard]?.answer ? 'border-color: var(--gl-danger); background: var(--gl-danger-bg); color: var(--gl-text-primary);' : selectedOption === opt && opt === currentGame.cards[currentCard]?.answer ? 'border-color: var(--gl-success); background: var(--gl-success-bg); color: var(--gl-text-primary);' : 'border-color: var(--gl-border); color: var(--gl-text-secondary);'">
                            {{ opt }}
                        </button>
                    </div>
                    <div v-else class="text-center">
                        <div class="flex items-center justify-center gap-2 mb-3">
                            <span class="text-lg font-bold" :style="{ color: selectedOption === currentGame.cards[currentCard]?.answer ? 'var(--gl-success)' : 'var(--gl-danger)' }">
                                {{ selectedOption === currentGame.cards[currentCard]?.answer ? 'Correct!' : 'Wrong!' }}
                            </span>
                        </div>
                        <p class="text-sm" style="color: var(--gl-text-secondary)">The correct answer is: <strong style="color: var(--gl-success);">{{ currentGame.cards[currentCard]?.answer }}</strong></p>
                    </div>
                </div>

                <!-- Fill in the Blank -->
                <div v-else-if="currentGame.type === 'fillblank'" class="p-6" style="min-height: 280px;">
                    <div class="text-center mb-6">
                        <p class="text-xs mb-2" style="color: var(--gl-text-muted)">Question {{ currentCard + 1 }} of {{ currentGame.cards.length }}</p>
                        <p class="text-base font-semibold mb-4" style="color: var(--gl-text-primary)">{{ currentGame.cards[currentCard]?.question }}</p>
                    </div>
                    <div v-if="!answered">
                        <input v-model="typedAnswer" type="text" placeholder="Type your answer..."
                            class="w-full rounded-xl border px-4 py-3 text-sm text-center outline-none"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border-color: var(--gl-border);"
                            @keyup.enter="checkFillBlank" />
                        <button @click="checkFillBlank"
                            class="w-full mt-4 rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
                            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary));">Submit</button>
                    </div>
                    <div v-else class="text-center">
                        <p class="text-lg font-bold mb-2" :style="{ color: fillCorrect ? 'var(--gl-success)' : 'var(--gl-danger)' }">
                            {{ fillCorrect ? 'Correct!' : 'Not quite' }}
                        </p>
                        <p class="text-sm" style="color: var(--gl-text-secondary)">Answer: <strong style="color: var(--gl-success);">{{ currentGame.cards[currentCard]?.answer }}</strong></p>
                    </div>
                </div>

                    <!-- Controls -->
                    <div class="flex items-center justify-between gap-3 mt-4">
                        <button @click="flipped = false; prevCard()" :disabled="currentCard === 0"
                            class="rounded-xl px-4 py-2 text-xs font-medium transition-all disabled:opacity-30"
                            style="background: var(--gl-surface-2); color: var(--gl-text-primary); border: 1px solid var(--gl-border);">
                            <ArrowLeft class="h-3.5 w-3.5 inline mr-1" :stroke-width="2" /> Previous
                        </button>
                        <span class="text-xs font-semibold" style="color: var(--gl-text-primary)">{{ correctCount }} / {{ currentCard + 1 }} correct</span>
                        <button v-if="currentCard < currentGame.cards.length - 1" @click="flipped = false; nextCard()"
                            class="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
                            style="background: linear-gradient(135deg, var(--gl-primary), var(--gl-secondary)); box-shadow: 0 0 12px var(--gl-primary-glow);">
                            Next <ArrowRight class="h-3.5 w-3.5 inline ml-1" :stroke-width="2" />
                        </button>
                        <button v-else @click="finishGame" class="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
                            style="background: linear-gradient(135deg, var(--gl-success), #059669); box-shadow: 0 0 12px rgba(16,185,129,0.3);">
                            Finish <Trophy class="h-3.5 w-3.5 inline ml-1" :stroke-width="2" />
                        </button>
                    </div>
            </div>
        </div>
    </Teleport>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';
import { Gamepad2, HelpCircle, CheckCircle2, X, Zap, ArrowRight, ArrowLeft, Trophy, Palette, Film, Code, Monitor, Layout, Image } from '@lucide/vue';

interface Card { question: string; answer: string; }
interface Game { title: string; subject: string; desc: string; xp: number; icon: any; bg: string; color: string; badge: string; cards: Card[]; }

const page = usePage();
const user = (page.props.auth as any).user;
const grade = user?.grade;

interface Card { question: string; answer: string; }

const photoshopGames: Game[] = [
    {
        title: 'Digital Graphics Basics', subject: 'Photoshop',
        desc: 'Learn about pixels, resolution, vector vs raster, and file formats in digital imaging.',
        xp: 10, icon: Image, bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', badge: 'rgba(59,130,246,0.1)',
        cards: [
            { question: 'What is a pixel?', answer: 'The smallest unit of a digital image, representing a single color point on a grid.' },
            { question: 'What does DPI stand for?', answer: 'Dots Per Inch — a measure of image resolution for print output.' },
            { question: 'What is the difference between raster and vector graphics?', answer: 'Raster uses pixels (resolution-dependent), vector uses mathematical paths (scalable without quality loss).' },
            { question: 'What file format supports transparency?', answer: 'PNG (Portable Network Graphics) supports transparency. GIF also supports simple transparency.' },
            { question: 'What file format is best for printing?', answer: 'TIFF (Tagged Image File Format) is preferred for high-quality print output.' },
        ],
    },
    {
        title: 'Photoshop Interface', subject: 'Photoshop',
        desc: 'Navigate the Adobe Photoshop workspace, panels, tools, and menus like a pro.',
        xp: 10, icon: Layout, bg: 'rgba(124,58,237,0.12)', color: '#7C3AED', badge: 'rgba(124,58,237,0.1)',
        cards: [
            { question: 'What is the default workspace layout called?', answer: 'Essentials workspace — the default panel arrangement in Photoshop.' },
            { question: 'What is the toolbar?', answer: 'The vertical panel on the left containing all selection, painting, and editing tools.' },
            { question: 'What is the Options Bar?', answer: 'The horizontal bar at the top that shows settings for the currently selected tool.' },
            { question: 'What are panels?', answer: 'Floating or docked windows (like Layers, Color, History) that provide controls and information.' },
            { question: 'How do you reset the workspace?', answer: 'Go to Window > Workspace > Reset Essentials to restore the default panel layout.' },
        ],
    },
    {
        title: 'Selection Tools', subject: 'Photoshop',
        desc: 'Master the Marquee, Lasso, Quick Selection, and Magic Wand tools for precise selections.',
        xp: 10, icon: Monitor, bg: 'rgba(249,115,22,0.12)', color: '#F97316', badge: 'rgba(249,115,22,0.1)',
        cards: [
            { question: 'What does the Marquee tool do?', answer: 'Creates rectangular, elliptical, single-row, or single-column selections by dragging.' },
            { question: 'What does the Lasso tool do?', answer: 'Allows freehand selection by drawing around the desired area with the mouse or stylus.' },
            { question: 'What is the Quick Selection tool?', answer: 'Paints a selection by detecting edges — brush over an area and Photoshop automatically finds boundaries.' },
            { question: 'What does the Magic Wand do?', answer: 'Selects areas of similar color with a single click, controlled by the Tolerance setting.' },
            { question: 'What is feathering a selection?', answer: 'Softening the edges of a selection by a specified pixel amount for smoother transitions.' },
        ],
    },
    {
        title: 'Layer Management', subject: 'Photoshop',
        desc: 'Understand layers, layer masks, blending modes, and opacity for non-destructive editing.',
        xp: 10, icon: Code, bg: 'rgba(16,185,129,0.12)', color: '#10B981', badge: 'rgba(16,185,129,0.1)',
        cards: [
            { question: 'What is a layer?', answer: 'A transparent sheet that stacks on top of others, each containing separate image content for non-destructive editing.' },
            { question: 'What is a layer mask?', answer: 'A grayscale attachment to a layer that hides (black) or reveals (white) parts without deleting pixels.' },
            { question: 'What does Opacity control?', answer: 'The transparency level of a layer — from 0% (completely invisible) to 100% (completely opaque).' },
            { question: 'What is the Multiply blending mode?', answer: 'Multiplies the colors of the blend layer with the base layer, resulting in a darker image — good for shadows.' },
            { question: 'What is the Screen blending mode?', answer: 'Inverts both layers, multiplies, then inverts again — results in a lighter image, good for highlights and glow effects.' },
        ],
    },
    {
        title: 'Typography & Text', subject: 'Photoshop',
        desc: 'Learn font selection, text formatting, character and paragraph panels, and text effects.',
        xp: 10, icon: Film, bg: 'rgba(236,72,153,0.12)', color: '#EC4899', badge: 'rgba(236,72,153,0.1)',
        cards: [
            { question: 'What is kerning?', answer: 'Adjusting the space between two individual characters for better visual spacing.' },
            { question: 'What is tracking?', answer: 'Adjusting the spacing uniformly across a range of selected characters in a text block.' },
            { question: 'What is leading?', answer: 'The vertical space between lines of text, measured from baseline to baseline.' },
            { question: 'What are serif and sans-serif fonts?', answer: 'Serif fonts have small decorative strokes at the ends of letters (e.g., Times New Roman); sans-serif fonts do not (e.g., Arial).' },
            { question: 'How do you warp text in Photoshop?', answer: 'Select the text layer, click the Create Warped Text button in the Options Bar, and choose a warp style like Arc or Flag.' },
        ],
    },
    {
        title: 'Color Theory', subject: 'Photoshop',
        desc: 'Understand color harmony, RGB vs CMYK, complementary colors, and the Color Wheel.',
        xp: 10, icon: Palette, bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', badge: 'rgba(251,191,36,0.1)',
        cards: [
            { question: 'What does RGB stand for?', answer: 'Red, Green, Blue — the additive color model used for digital screens and web design.' },
            { question: 'What does CMYK stand for?', answer: 'Cyan, Magenta, Yellow, Key (Black) — the subtractive color model used for print.' },
            { question: 'What are complementary colors?', answer: 'Colors opposite each other on the color wheel (e.g., blue and orange) that create high contrast.' },
            { question: 'What are analogous colors?', answer: 'Colors that sit next to each other on the color wheel (e.g., blue, teal, and green) that create harmony.' },
            { question: 'What is color temperature?', answer: 'Warm colors (red, orange, yellow) evoke energy; cool colors (blue, green, purple) evoke calmness.' },
        ],
    },
    {
        title: 'Image Enhancement', subject: 'Photoshop',
        desc: 'Adjust brightness, contrast, levels, curves, and use filters to enhance photos.',
        xp: 10, icon: Image, bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', badge: 'rgba(59,130,246,0.1)',
        cards: [
            { question: 'What does Auto Tone do?', answer: 'Automatically adjusts the brightness and contrast to improve tonal range in a single click.' },
            { question: 'What does the Levels adjustment do?', answer: 'Adjusts shadows (black point), midtones (gamma), and highlights (white point) using a histogram.' },
            { question: 'What does the Curves adjustment do?', answer: 'Provides precise control over brightness and contrast by adjusting points along a tonal curve.' },
            { question: 'What is the Sharpen filter used for?', answer: 'Enhances edge contrast to make images appear crisper and more defined.' },
            { question: 'What is noise reduction?', answer: 'Smoothing out grain or speckles (noise) in an image, commonly used for low-light photos taken at high ISO.' },
        ],
    },
];
const props = defineProps<{ games: any[] }>();

interface Card { question: string; answer: string; }

const dbGames = computed(() => (props.games || []).map((g: any) => ({
    title: g.title,
    subject: g.subject,
    desc: g.description || 'Game for ' + g.subject,
    xp: g.xp_reward,
    type: g.type || 'flashcard',
    icon: g.type === 'quiz' ? HelpCircle : g.type === 'fillblank' ? Code : Palette,
    bg: 'rgba(59,130,246,0.12)',
    color: '#3B82F6',
    badge: 'rgba(59,130,246,0.1)',
    cards: (g.cards || []).map((c: any) => ({
        question: c.question,
        answer: c.answer,
        options: c.options || [],
    })),
})));

const games = computed(() => {
    if (dbGames.value.length) return dbGames.value;
    return photoshopGames;
});

const currentGame = ref<any>(null);
const currentCard = ref(0);
const flipped = ref(false);
const correctCount = ref(0);
const answered = ref(false);
const selectedOption = ref('');
const typedAnswer = ref('');
const fillCorrect = ref(false);

function openGame(game: any) {
    currentGame.value = game;
    currentCard.value = 0;
    flipped.value = false;
    correctCount.value = 0;
    answered.value = false;
    selectedOption.value = '';
    typedAnswer.value = '';
    fillCorrect.value = false;
}

function closeGame() {
    currentGame.value = null;
}

function nextCard() {
    if (currentGame.value && currentCard.value < currentGame.value.cards.length - 1) {
        currentCard.value++;
        flipped.value = false;
        answered.value = false;
        selectedOption.value = '';
        typedAnswer.value = '';
        fillCorrect.value = false;
        correctCount.value++;
    }
}

function prevCard() {
    if (currentCard.value > 0) currentCard.value--;
    flipped.value = false;
    answered.value = false;
    selectedOption.value = '';
    typedAnswer.value = '';
    fillCorrect.value = false;
}

function checkAnswer(opt: string) {
    selectedOption.value = opt;
    answered.value = true;
}

function checkFillBlank() {
    answered.value = true;
    const c = currentGame.value?.cards[currentCard.value];
    fillCorrect.value = typedAnswer.value.trim().toLowerCase() === (c?.answer || '').trim().toLowerCase();
}

function finishGame() {
    correctCount.value++;
    closeGame();
}
</script>

<style scoped>
.h-4\.5 { height: 1.125rem; }
.w-4\.5 { width: 1.125rem; }
</style>
