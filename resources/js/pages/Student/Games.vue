<template>
    <Head title="Learning Games" />

    <div
        class="fixed"
        style="
            top: 64px;
            left: 16rem;
            right: 0;
            bottom: 0;
            background: var(--gl-bg);
            overflow-y: auto;
        "
    >
        <div class="px-6 py-6">
            <!-- Hero -->
            <div
                class="gl-fade-in relative mb-8 overflow-hidden rounded-2xl p-8"
                style="
                    background: linear-gradient(
                        135deg,
                        rgba(16, 185, 129, 0.1),
                        rgba(59, 130, 246, 0.06)
                    );
                    border: 1px solid var(--gl-border);
                "
            >
                <div class="relative z-10">
                    <div
                        class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                        style="
                            background: linear-gradient(
                                135deg,
                                #10b981,
                                var(--gl-primary)
                            );
                            box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
                        "
                    >
                        <Gamepad2
                            class="h-6 w-6 text-white"
                            :stroke-width="2"
                        />
                    </div>
                    <h1
                        class="text-2xl font-bold"
                        style="color: var(--gl-text-primary)"
                    >
                        Learning Games
                    </h1>
                    <p
                        class="mt-2 max-w-lg text-sm"
                        style="color: var(--gl-text-secondary)"
                    >
                        Play review games, test your knowledge, track your
                        progress, and earn XP.
                    </p>
                </div>
                <div
                    class="absolute -top-8 -right-8 h-40 w-40 rounded-full opacity-10"
                    style="
                        background: radial-gradient(
                            circle,
                            #10b981,
                            transparent 70%
                        );
                    "
                ></div>
                <div
                    class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10"
                    style="
                        background: radial-gradient(
                            circle,
                            var(--gl-primary),
                            transparent 70%
                        );
                    "
                ></div>
            </div>

            <!-- Games Grid -->
            <div
                v-if="!games.length"
                class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center"
            >
                <div
                    class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
                    style="
                        background: linear-gradient(
                            135deg,
                            rgba(16, 185, 129, 0.15),
                            rgba(59, 130, 246, 0.1)
                        );
                    "
                >
                    <Gamepad2
                        class="h-10 w-10"
                        style="color: var(--gl-primary)"
                        :stroke-width="1.5"
                    />
                </div>
                <h3
                    class="text-lg font-semibold"
                    style="color: var(--gl-text-primary)"
                >
                    No Games Available Yet
                </h3>
                <p
                    class="mt-2 max-w-md text-sm"
                    style="color: var(--gl-text-secondary)"
                >
                    Your teacher hasn't published any learning games yet. Check
                    back later to play and earn XP.
                </p>
            </div>

            <div
                v-else
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                <button
                    v-for="game in games"
                    :key="game.id"
                    @click="openGame(game)"
                    :disabled="game.progress?.completed"
                    class="gl-glow-card group relative flex flex-col p-5 text-left transition-all duration-200"
                    :class="
                        game.progress?.completed
                            ? 'cursor-not-allowed'
                            : 'hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2)]'
                    "
                >
                    <span
                        v-if="game.progress?.completed"
                        class="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style="
                            background: var(--gl-success-bg);
                            color: var(--gl-success);
                            border: 1px solid rgba(16, 185, 129, 0.25);
                        "
                    >
                        <Lock class="h-3 w-3" :stroke-width="2" /> Completed
                    </span>
                    <div class="mb-3 flex items-start gap-4">
                        <div
                            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                            :style="{ background: game.bg }"
                        >
                            <component
                                :is="game.icon"
                                class="h-6 w-6"
                                :style="{ color: game.color }"
                                :stroke-width="2"
                            />
                        </div>
                        <div>
                            <h3
                                class="text-sm font-semibold"
                                style="color: var(--gl-text-primary)"
                            >
                                {{ game.title }}
                            </h3>
                            <span
                                class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                                :style="{
                                    background: game.badge,
                                    color: game.color,
                                }"
                                >{{ game.subject }}</span
                            >
                        </div>
                    </div>
                    <p
                        class="mb-4 text-xs"
                        style="color: var(--gl-text-secondary)"
                    >
                        {{ game.desc }}
                    </p>
                    <div class="mt-auto space-y-1.5">
                        <div class="flex items-center justify-between">
                            <span
                                class="text-xs"
                                style="color: var(--gl-text-muted)"
                            >
                                <template v-if="game.progress?.completed"
                                    ><CheckCircle2
                                        class="mr-1 inline h-3.5 w-3.5"
                                        style="color: var(--gl-success)"
                                    />Completed</template
                                >
                                <template
                                    v-else-if="
                                        game.progress &&
                                        game.progress.done_count > 0
                                    "
                                    >{{ game.progress.done_count }}/{{
                                        game.cards.length
                                    }}
                                    done</template
                                >
                                <template v-else
                                    >{{ game.cards.length }} items</template
                                >
                            </span>
                            <span
                                class="flex items-center gap-1 text-xs"
                                style="color: var(--gl-accent)"
                            >
                                <Zap class="h-3.5 w-3.5" :stroke-width="2" />
                                {{ game.xp }} XP
                            </span>
                        </div>
                        <div
                            v-if="
                                game.progress &&
                                !game.progress.completed &&
                                game.progress.done_count > 0
                            "
                            class="gl-xp-bar"
                            style="height: 4px; border-radius: 2px"
                        >
                            <div
                                class="gl-xp-bar-fill"
                                :style="{
                                    width:
                                        Math.min(
                                            100,
                                            Math.round(
                                                (game.progress.done_count /
                                                    game.cards.length) *
                                                    100,
                                            ),
                                        ) + '%',
                                    borderRadius: '2px',
                                }"
                            ></div>
                        </div>
                    </div>
                </button>
            </div>

            <!-- Game Modal -->
            <Teleport to="body">
                <div
                    v-if="currentGame"
                    class="fixed inset-0 z-50 flex flex-col items-center justify-center"
                    style="
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(2px);
                        user-select: none;
                        -webkit-user-select: none;
                    "
                    @click.self="closeGame"
                >
                    <div
                        v-if="tabWarning && leaveCount < 3"
                        class="gl-fade-in mb-4 flex flex-col items-center gap-1 rounded-2xl px-5 py-3"
                        style="
                            background: rgba(251, 191, 36, 0.12);
                            border: 1px solid rgba(251, 191, 36, 0.35);
                            color: var(--gl-accent);
                            max-width: 28rem;
                            text-align: center;
                        "
                    >
                        <span
                            class="flex items-center gap-1.5 text-sm font-bold"
                            ><ShieldAlert class="h-4 w-4" :stroke-width="2.5" />
                            Don't leave the game</span
                        >
                        <span
                            class="text-xs"
                            style="color: var(--gl-text-secondary)"
                            >Changing tabs or windows is not allowed. This is
                            warning {{ leaveCount }} of 3.</span
                        >
                    </div>
                    <div
                        v-if="leaveCount >= 3"
                        class="gl-fade-in mb-4 rounded-2xl px-5 py-3 text-sm font-bold"
                        style="
                            background: var(--gl-danger-bg);
                            border: 1px solid rgba(239, 68, 68, 0.35);
                            color: var(--gl-danger);
                        "
                    >
                        Game closed after multiple warnings.
                    </div>
                    <div
                        class="gl-fade-in mx-4 w-full max-w-lg overflow-hidden rounded-2xl"
                        style="
                            background: var(--gl-surface);
                            border: 1px solid var(--gl-border);
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                        "
                    >
                        <!-- Game Header -->
                        <div
                            class="flex items-center justify-between border-b px-6 py-4"
                            style="border-color: var(--gl-border)"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex h-9 w-9 items-center justify-center rounded-lg"
                                    :style="{ background: currentGame.bg }"
                                >
                                    <component
                                        :is="currentGame.icon"
                                        class="h-4.5 w-4.5"
                                        :style="{ color: currentGame.color }"
                                        :stroke-width="2"
                                    />
                                </div>
                                <div>
                                    <p
                                        class="text-sm font-semibold"
                                        style="color: var(--gl-text-primary)"
                                    >
                                        {{ currentGame.title }}
                                    </p>
                                    <p
                                        class="text-[10px]"
                                        style="color: var(--gl-text-muted)"
                                    >
                                        {{ currentCard + 1 }} /
                                        {{ currentGame.cards.length }}
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    v-if="
                                        currentGame.progress &&
                                        currentGame.progress.done_count > 0 &&
                                        !currentGame.progress.completed
                                    "
                                    class="rounded-full px-2 py-1 text-[10px] font-medium"
                                    style="
                                        background: rgba(59, 130, 246, 0.1);
                                        color: var(--gl-primary);
                                    "
                                    >Resumed</span
                                >
                                <span
                                    v-if="
                                        answered &&
                                        correctOnLast &&
                                        currentGame.type !== 'flashcard'
                                    "
                                    data-xp-chip
                                    class="gl-xp-chip flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                                    style="
                                        background: rgba(16, 185, 129, 0.15);
                                        color: var(--gl-success);
                                    "
                                >
                                    <Zap class="h-3 w-3" :stroke-width="2" /> +1
                                    XP
                                </span>
                                <button
                                    @click="closeGame"
                                    class="rounded-lg p-1.5 transition-colors hover:bg-[var(--gl-surface-2)]"
                                    style="color: var(--gl-text-muted)"
                                >
                                    <X class="h-4.5 w-4.5" :stroke-width="2" />
                                </button>
                            </div>
                        </div>

                        <!-- Flashcard - flip style -->
                        <div
                            v-if="currentGame.type === 'flashcard'"
                            class="p-6"
                            style="min-height: 280px"
                        >
                            <div
                                class="relative h-52 cursor-pointer"
                                @click="flipped = !flipped"
                                style="perspective: 1000px"
                            >
                                <div
                                    class="absolute inset-0 transition-transform duration-500"
                                    :style="{
                                        transform: flipped
                                            ? 'rotateY(180deg)'
                                            : 'rotateY(0deg)',
                                        transformStyle: 'preserve-3d',
                                    }"
                                >
                                    <div
                                        class="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
                                        style="
                                            background: var(--gl-surface-2);
                                            border: 1px solid var(--gl-border);
                                            backface-visibility: hidden;
                                        "
                                    >
                                        <div
                                            class="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                                            style="
                                                background: rgba(
                                                    59,
                                                    130,
                                                    246,
                                                    0.1
                                                );
                                            "
                                        >
                                            <HelpCircle
                                                class="h-6 w-6"
                                                style="color: var(--gl-primary)"
                                                :stroke-width="2"
                                            />
                                        </div>
                                        <p
                                            class="mb-1 text-sm font-medium"
                                            style="color: var(--gl-text-muted)"
                                        >
                                            Question
                                        </p>
                                        <p
                                            class="text-base font-semibold"
                                            style="
                                                color: var(--gl-text-primary);
                                            "
                                        >
                                            {{
                                                currentGame.cards[currentCard]
                                                    ?.question
                                            }}
                                        </p>
                                        <p
                                            class="mt-4 text-xs"
                                            style="color: var(--gl-text-muted)"
                                        >
                                            Tap to reveal answer
                                        </p>
                                    </div>
                                    <div
                                        class="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
                                        style="
                                            background: linear-gradient(
                                                135deg,
                                                rgba(16, 185, 129, 0.08),
                                                rgba(59, 130, 246, 0.04)
                                            );
                                            border: 1px solid
                                                rgba(16, 185, 129, 0.2);
                                            backface-visibility: hidden;
                                            transform: rotateY(180deg);
                                        "
                                    >
                                        <div
                                            class="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                                            style="
                                                background: rgba(
                                                    16,
                                                    185,
                                                    129,
                                                    0.1
                                                );
                                            "
                                        >
                                            <CheckCircle2
                                                class="h-6 w-6"
                                                style="color: var(--gl-success)"
                                                :stroke-width="2"
                                            />
                                        </div>
                                        <p
                                            class="mb-1 text-sm font-medium"
                                            style="color: var(--gl-success)"
                                        >
                                            Answer
                                        </p>
                                        <p
                                            class="text-base font-semibold"
                                            style="
                                                color: var(--gl-text-primary);
                                            "
                                        >
                                            {{
                                                currentGame.cards[currentCard]
                                                    ?.answer
                                            }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Quiz - multiple choice -->
                        <div
                            v-else-if="currentGame.type === 'quiz'"
                            class="p-6"
                            style="min-height: 280px"
                        >
                            <div class="mb-6 text-center">
                                <span class="gl-eyebrow">Multiple Choice</span>
                                <div class="gl-q-row">
                                    <span class="gl-q-num">{{
                                        currentCard + 1
                                    }}</span>
                                    <span class="gl-q-sep">/</span>
                                    <span class="gl-q-total">{{
                                        currentGame.cards.length
                                    }}</span>
                                </div>
                                <h3 class="gl-question">
                                    {{
                                        currentGame.cards[currentCard]?.question
                                    }}
                                </h3>
                            </div>
                            <div v-if="!answered" class="space-y-2.5">
                                <button
                                    v-for="(opt, oi) in currentGame.cards[
                                        currentCard
                                    ]?.options || []"
                                    :key="oi"
                                    @click="checkAnswer(opt)"
                                    class="w-full rounded-xl border px-4 py-3 text-left text-sm transition-all hover:bg-[rgba(59,130,246,0.04)]"
                                    :style="
                                        selectedOption === opt &&
                                        opt !==
                                            currentGame.cards[currentCard]
                                                ?.answer
                                            ? 'border-color: var(--gl-danger); background: var(--gl-danger-bg); color: var(--gl-text-primary);'
                                            : selectedOption === opt &&
                                                opt ===
                                                    currentGame.cards[
                                                        currentCard
                                                    ]?.answer
                                              ? 'border-color: var(--gl-success); background: var(--gl-success-bg); color: var(--gl-text-primary);'
                                              : 'border-color: var(--gl-border); color: var(--gl-text-secondary);'
                                    "
                                >
                                    {{ opt }}
                                </button>
                            </div>
                            <div v-else class="text-center">
                                <span
                                    class="gl-feedback"
                                    :class="
                                        selectedOption ===
                                        currentGame.cards[currentCard]?.answer
                                            ? 'correct'
                                            : 'wrong'
                                    "
                                >
                                    <CheckCircle2
                                        v-if="
                                            selectedOption ===
                                            currentGame.cards[currentCard]
                                                ?.answer
                                        "
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    <X
                                        v-else
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    {{
                                        selectedOption ===
                                        currentGame.cards[currentCard]?.answer
                                            ? 'Correct!'
                                            : 'Wrong!'
                                    }}
                                </span>
                                <p class="gl-answer-reveal">
                                    The correct answer is:
                                    <strong style="color: var(--gl-success)">{{
                                        currentGame.cards[currentCard]?.answer
                                    }}</strong>
                                </p>
                            </div>
                        </div>

                        <!-- Fill in the Blank -->
                        <div
                            v-else-if="currentGame.type === 'fillblank'"
                            class="p-6"
                            style="min-height: 280px"
                        >
                            <div class="mb-6 text-center">
                                <span class="gl-eyebrow"
                                    >Fill in the Blank</span
                                >
                                <div class="gl-q-row">
                                    <span class="gl-q-num">{{
                                        currentCard + 1
                                    }}</span>
                                    <span class="gl-q-sep">/</span>
                                    <span class="gl-q-total">{{
                                        currentGame.cards.length
                                    }}</span>
                                </div>
                                <h3 class="gl-question">
                                    {{
                                        currentGame.cards[currentCard]?.question
                                    }}
                                </h3>
                            </div>
                            <div v-if="!answered">
                                <input
                                    v-model="typedAnswer"
                                    type="text"
                                    placeholder="Type your answer..."
                                    class="w-full rounded-xl border px-4 py-3 text-center text-sm outline-none"
                                    style="
                                        background: var(--gl-surface-2);
                                        color: var(--gl-text-primary);
                                        border-color: var(--gl-border);
                                    "
                                    @keyup.enter="checkFillBlank"
                                />
                                <button
                                    @click="checkFillBlank"
                                    class="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
                                    style="
                                        background: linear-gradient(
                                            135deg,
                                            var(--gl-primary),
                                            var(--gl-secondary)
                                        );
                                    "
                                >
                                    Submit
                                </button>
                            </div>
                            <div v-else class="text-center">
                                <span
                                    class="gl-feedback"
                                    :class="fillCorrect ? 'correct' : 'wrong'"
                                >
                                    <CheckCircle2
                                        v-if="fillCorrect"
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    <X
                                        v-else
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    {{ fillCorrect ? 'Correct!' : 'Not quite' }}
                                </span>
                                <p class="gl-answer-reveal">
                                    Answer:
                                    <strong style="color: var(--gl-success)">{{
                                        currentGame.cards[currentCard]?.answer
                                    }}</strong>
                                </p>
                            </div>
                        </div>

                        <!-- True / False -->
                        <div
                            v-else-if="currentGame.type === 'truefalse'"
                            class="p-6"
                            style="min-height: 280px"
                        >
                            <div class="mb-6 text-center">
                                <span class="gl-eyebrow">True or False</span>
                                <div class="gl-q-row">
                                    <span class="gl-q-num">{{
                                        currentCard + 1
                                    }}</span>
                                    <span class="gl-q-sep">/</span>
                                    <span class="gl-q-total">{{
                                        currentGame.cards.length
                                    }}</span>
                                </div>
                                <h3 class="gl-question">
                                    {{
                                        currentGame.cards[currentCard]?.question
                                    }}
                                </h3>
                            </div>
                            <div v-if="!answered" class="flex gap-3">
                                <button
                                    @click="checkTrueFalse(true)"
                                    class="flex-1 rounded-xl py-3 text-sm font-semibold transition-all hover:scale-[1.02]"
                                    style="
                                        background: rgba(16, 185, 129, 0.1);
                                        color: var(--gl-success);
                                        border: 1px solid var(--gl-border);
                                    "
                                >
                                    True
                                </button>
                                <button
                                    @click="checkTrueFalse(false)"
                                    class="flex-1 rounded-xl py-3 text-sm font-semibold transition-all hover:scale-[1.02]"
                                    style="
                                        background: rgba(239, 68, 68, 0.1);
                                        color: var(--gl-danger);
                                        border: 1px solid var(--gl-border);
                                    "
                                >
                                    False
                                </button>
                            </div>
                            <div v-else class="text-center">
                                <span
                                    class="gl-feedback"
                                    :class="answerResult ? 'correct' : 'wrong'"
                                >
                                    <CheckCircle2
                                        v-if="answerResult"
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    <X
                                        v-else
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    {{ answerResult ? 'Correct!' : 'Wrong!' }}
                                </span>
                                <p class="gl-answer-reveal">
                                    Answer:
                                    <strong style="color: var(--gl-success)">{{
                                        currentGame.cards[currentCard]?.answer
                                    }}</strong>
                                </p>
                            </div>
                        </div>

                        <!-- Word Jumble -->
                        <div
                            v-else-if="currentGame.type === 'wordjumble'"
                            class="p-6"
                            style="min-height: 280px"
                        >
                            <div class="mb-6 text-center">
                                <span class="gl-eyebrow">Word Unscramble</span>
                                <div class="gl-q-row">
                                    <span class="gl-q-num">{{
                                        currentCard + 1
                                    }}</span>
                                    <span class="gl-q-sep">/</span>
                                    <span class="gl-q-total">{{
                                        currentGame.cards.length
                                    }}</span>
                                </div>
                                <h3 class="gl-question">
                                    {{
                                        currentGame.cards[currentCard]?.question
                                    }}
                                </h3>
                            </div>
                            <template v-if="!answered">
                                <div
                                    class="mb-4 flex min-h-[2.5rem] flex-wrap items-center justify-center gap-2 rounded-xl p-2"
                                    style="
                                        background: var(--gl-surface-2);
                                        border: 1px dashed var(--gl-border);
                                    "
                                >
                                    <span
                                        v-if="!jumbleAnswer.length"
                                        class="text-xs"
                                        style="color: var(--gl-text-muted)"
                                        >Tap letters below to unscramble the
                                        answer</span
                                    >
                                    <span
                                        v-for="(l, li) in jumbleAnswer"
                                        :key="li"
                                        @click="removeJumbleLetter(li)"
                                        class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-bold uppercase transition-all"
                                        style="
                                            background: var(--gl-surface-2);
                                            color: var(--gl-primary);
                                            border-color: var(--gl-primary);
                                        "
                                        >{{ l }}</span
                                    >
                                </div>
                                <div
                                    class="flex flex-wrap justify-center gap-2"
                                >
                                    <button
                                        v-for="(l, li) in jumbleLetters"
                                        :key="li"
                                        @click="addJumbleLetter(l)"
                                        class="rounded-lg border px-3 py-1.5 text-sm font-bold uppercase transition-all hover:scale-105"
                                        style="
                                            background: var(--gl-surface-2);
                                            color: var(--gl-text-primary);
                                            border-color: var(--gl-border);
                                        "
                                    >
                                        {{ l }}
                                    </button>
                                </div>
                                <button
                                    @click="checkWordJumble"
                                    :disabled="!jumbleAnswer.length"
                                    class="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                                    style="
                                        background: linear-gradient(
                                            135deg,
                                            var(--gl-primary),
                                            var(--gl-secondary)
                                        );
                                    "
                                >
                                    Check
                                </button>
                            </template>
                            <div v-else class="text-center">
                                <span
                                    class="gl-feedback"
                                    :class="answerResult ? 'correct' : 'wrong'"
                                >
                                    <CheckCircle2
                                        v-if="answerResult"
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    <X
                                        v-else
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    {{
                                        answerResult ? 'Correct!' : 'Not quite'
                                    }}
                                </span>
                                <p class="gl-answer-reveal">
                                    Answer:
                                    <strong style="color: var(--gl-success)">{{
                                        currentGame.cards[currentCard]?.answer
                                    }}</strong>
                                </p>
                            </div>
                        </div>

                        <!-- Color Harmony -->
                        <div
                            v-else-if="currentGame.type === 'colorharmony'"
                            class="p-6"
                            style="min-height: 280px"
                        >
                            <div class="mb-5 text-center">
                                <span class="gl-eyebrow">Color Harmony</span>
                                <div class="gl-q-row">
                                    <span class="gl-q-num">{{
                                        currentCard + 1
                                    }}</span>
                                    <span class="gl-q-sep">/</span>
                                    <span class="gl-q-total">{{
                                        currentGame.cards.length
                                    }}</span>
                                </div>
                                <h3 class="gl-question mb-4">
                                    {{
                                        currentGame.cards[currentCard]?.question
                                    }}
                                </h3>
                                <div class="flex flex-col items-center gap-1.5">
                                    <span
                                        class="text-[10px] font-semibold tracking-widest uppercase"
                                        style="color: var(--gl-text-muted)"
                                        >Reference Color</span
                                    >
                                    <div
                                        class="h-16 w-16 rounded-2xl border-2"
                                        :style="{
                                            background:
                                                currentGame.cards[currentCard]
                                                    ?.color,
                                            borderColor: 'var(--gl-border)',
                                            boxShadow:
                                                '0 6px 18px rgba(0,0,0,0.15)',
                                        }"
                                    ></div>
                                </div>
                            </div>
                            <div
                                v-if="!answered"
                                class="flex flex-wrap justify-center gap-2.5"
                            >
                                <button
                                    v-for="(opt, oi) in currentGame.cards[
                                        currentCard
                                    ]?.options || []"
                                    :key="oi"
                                    @click="checkAnswer(opt)"
                                    class="flex flex-col items-center gap-1 rounded-xl p-2 transition-all hover:scale-105"
                                    :style="
                                        selectedOption === opt
                                            ? 'border: 1px solid var(--gl-primary); box-shadow: 0 0 0 2px var(--gl-primary-glow); background: var(--gl-surface-2);'
                                            : 'border: 1px solid var(--gl-border); background: var(--gl-surface-2);'
                                    "
                                >
                                    <span
                                        class="h-11 w-14 rounded-lg border"
                                        :style="{
                                            background: opt,
                                            borderColor: 'rgba(0,0,0,0.08)',
                                        }"
                                    ></span>
                                    <span
                                        class="font-mono text-[9px] uppercase"
                                        style="color: var(--gl-text-muted)"
                                        >{{ opt }}</span
                                    >
                                </button>
                            </div>
                            <div v-else class="text-center">
                                <span
                                    class="gl-feedback"
                                    :class="
                                        selectedOption ===
                                        currentGame.cards[currentCard]?.answer
                                            ? 'correct'
                                            : 'wrong'
                                    "
                                >
                                    <CheckCircle2
                                        v-if="
                                            selectedOption ===
                                            currentGame.cards[currentCard]
                                                ?.answer
                                        "
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    <X
                                        v-else
                                        class="h-4 w-4"
                                        :stroke-width="2.5"
                                    />
                                    {{
                                        selectedOption ===
                                        currentGame.cards[currentCard]?.answer
                                            ? 'Correct!'
                                            : 'Wrong!'
                                    }}
                                </span>
                                <p class="gl-answer-reveal">
                                    Correct color:
                                    <strong style="color: var(--gl-success)">{{
                                        currentGame.cards[currentCard]?.answer
                                    }}</strong>
                                </p>
                            </div>
                        </div>

                        <!-- Controls -->
                        <div
                            class="flex items-center justify-between gap-3 p-6 pt-0"
                        >
                            <button
                                @click="
                                    flipped = false;
                                    prevCard();
                                "
                                :disabled="currentCard === 0"
                                class="rounded-xl px-4 py-2 text-xs font-medium transition-all disabled:opacity-30"
                                style="
                                    background: var(--gl-surface-2);
                                    color: var(--gl-text-primary);
                                    border: 1px solid var(--gl-border);
                                "
                            >
                                <ArrowLeft
                                    class="mr-1 inline h-3.5 w-3.5"
                                    :stroke-width="2"
                                />
                                Previous
                            </button>
                            <span
                                v-if="currentGame.type === 'flashcard'"
                                class="text-xs font-semibold"
                                style="color: var(--gl-text-primary)"
                                >Card {{ currentCard + 1 }} of
                                {{ currentGame.cards.length }}</span
                            >
                            <span
                                v-else
                                class="text-xs font-semibold"
                                style="color: var(--gl-text-primary)"
                                >{{ correctCount }} /
                                {{ gradedCount }} correct</span
                            >
                            <button
                                v-if="
                                    currentCard < currentGame.cards.length - 1
                                "
                                @click="
                                    flipped = false;
                                    nextCard();
                                "
                                class="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
                                style="
                                    background: linear-gradient(
                                        135deg,
                                        var(--gl-primary),
                                        var(--gl-secondary)
                                    );
                                    box-shadow: 0 0 12px var(--gl-primary-glow);
                                "
                            >
                                Next
                                <ArrowRight
                                    class="ml-1 inline h-3.5 w-3.5"
                                    :stroke-width="2"
                                />
                            </button>
                            <button
                                v-else
                                @click="finishGame"
                                class="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
                                style="
                                    background: linear-gradient(
                                        135deg,
                                        var(--gl-success),
                                        #059669
                                    );
                                    box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
                                "
                            >
                                Finish
                                <Trophy
                                    class="ml-1 inline h-3.5 w-3.5"
                                    :stroke-width="2"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </Teleport>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import {
    Gamepad2,
    HelpCircle,
    CheckCircle2,
    X,
    Zap,
    ArrowRight,
    ArrowLeft,
    Trophy,
    Code,
    Palette,
    ShieldCheck,
    Shuffle,
    SwatchBook,
    Lock,
    ShieldAlert,
} from '@lucide/vue';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{ games: any[] }>();

const games = computed(() =>
    (props.games || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        subject: g.subject,
        desc: g.description || 'Game for ' + g.subject,
        xp: g.xp_reward,
        type: g.type || 'flashcard',
        icon:
            g.type === 'quiz'
                ? HelpCircle
                : g.type === 'fillblank'
                  ? Code
                  : g.type === 'truefalse'
                    ? ShieldCheck
                    : g.type === 'wordjumble'
                      ? Shuffle
                      : g.type === 'colorharmony'
                        ? SwatchBook
                        : Palette,
        bg: 'rgba(59,130,246,0.12)',
        color: '#3B82F6',
        badge: 'rgba(59,130,246,0.1)',
        progress: g.progress ?? null,
        cards: (g.cards || []).map((c: any) => ({
            id: c.id,
            question: c.question,
            answer: c.answer,
            color: c.color || '',
            options: c.options || [],
        })),
    })),
);

const currentGame = ref<any>(null);
const currentCard = ref(0);
const flipped = ref(false);
const correctCount = ref(0);
const gradedState = ref<(null | boolean)[]>([]);
const answered = ref(false);
const selectedOption = ref('');
const typedAnswer = ref('');
const fillCorrect = ref(false);
const answerResult = ref<boolean | null>(null);
const correctOnLast = ref(false);
const jumbleLetters = ref<string[]>([]);
const jumbleAnswer = ref<string[]>([]);

const gradedCount = computed(
    () => gradedState.value.filter((v) => v !== null).length,
);

const leaveCount = ref(0);
const tabWarning = ref(false);
let warningTimer: any = null;

function blockGesture(e: Event) {
    if (currentGame.value) {
        e.preventDefault();
    }
}

function tabSwitched() {
    if (!currentGame.value) {
        return;
    }

    leaveCount.value++;
    tabWarning.value = true;

    if (leaveCount.value >= 3) {
        closeGame();
    } else if (warningTimer) {
        clearTimeout(warningTimer);
        warningTimer = setTimeout(() => {
            tabWarning.value = false;
        }, 3500);
    }
}

function onVisChange() {
    if (!currentGame.value) {
        return;
    }

    if (document.hidden) {
        tabSwitched();
    } else if (warningTimer) {
        clearTimeout(warningTimer);
        warningTimer = setTimeout(() => {
            tabWarning.value = false;
        }, 2500);
    }
}

function onWindowBlur() {
    if (!currentGame.value) {
        return;
    }

    if (!document.hasFocus()) {
        tabSwitched();
    }
}

onMounted(() => {
    window.addEventListener('contextmenu', blockGesture);
    window.addEventListener('copy', blockGesture);
    window.addEventListener('cut', blockGesture);
    window.addEventListener('paste', blockGesture);
    document.addEventListener('dragstart', blockGesture);
    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('blur', onWindowBlur);
});

onBeforeUnmount(() => {
    window.removeEventListener('contextmenu', blockGesture);
    window.removeEventListener('copy', blockGesture);
    window.removeEventListener('cut', blockGesture);
    window.removeEventListener('paste', blockGesture);
    document.removeEventListener('dragstart', blockGesture);
    document.removeEventListener('visibilitychange', onVisChange);
    window.removeEventListener('blur', onWindowBlur);

    if (warningTimer) {
        clearTimeout(warningTimer);
    }
});

function shuffleArray(arr: any[]) {
    const a = [...arr];

    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}

function shuffleCards(cards: any[]) {
    return shuffleArray(cards || []).map((c: any) => ({
        ...c,
        options: c.options?.length ? shuffleArray(c.options) : [],
    }));
}

function openGame(game: any) {
    if (game.progress?.completed) {
        return;
    }

    leaveCount.value = 0;
    tabWarning.value = false;
    const saved = game.progress;
    const cards = game.cards || [];
    const savedOrderArr = Array.isArray(saved?.card_order)
        ? saved.card_order
        : String(saved?.card_order || '')
              .split(',')
              .map(Number)
              .filter((n) => n > 0);
    const hasStoredOrder =
        savedOrderArr.length === cards.length &&
        savedOrderArr.every((id: number) =>
            cards.some((c: any) => c.id === id),
        );
    let orderedCards: any[];

    if (hasStoredOrder) {
        const byId = new Map(cards.map((c: any) => [c.id, c]));
        orderedCards = savedOrderArr
            .map((id: number) => byId.get(id))
            .filter(Boolean)
            .map((c: any) => ({
                ...c,
                options: c.options?.length ? c.options : [],
            }));
    } else {
        orderedCards = shuffleCards(cards);
    }

    currentGame.value = { ...game, cards: orderedCards };

    let restoredGraded: (null | boolean)[] | null = null;

    if (saved && !saved.completed && saved.graded) {
        try {
            const parsed =
                typeof saved.graded === 'string'
                    ? JSON.parse(saved.graded)
                    : saved.graded;

            if (Array.isArray(parsed)) {
                restoredGraded = parsed.map((g: any) =>
                    g === true || g === false
                        ? !!g
                        : g === 1
                          ? true
                          : g === 0
                            ? false
                            : null,
                );
            }
        } catch {
            /* malformed graded payload */
        }
    }

    gradedState.value = restoredGraded ?? [];
    correctCount.value = gradedState.value.filter((v) => v === true).length;

    currentCard.value =
        saved && !saved.completed && saved.current_card > 0
            ? Math.min(saved.current_card, cards.length - 1)
            : 0;
    flipped.value = false;
    answered.value = false;
    selectedOption.value = '';
    typedAnswer.value = '';
    fillCorrect.value = false;
    answerResult.value = null;
    correctOnLast.value = false;
    jumbleAnswer.value = [];

    if (currentGame.value.type === 'wordjumble') {
        scrambleFor(currentGame.value.cards[currentCard.value]);
    }

    if (!hasStoredOrder) {
        saveProgress(false);
    }
}

function closeGame() {
    if (currentGame.value) {
        saveProgress(false);
    }

    currentGame.value = null;
}

function setGraded(correct: boolean) {
    const wasGraded =
        gradedState.value[currentCard.value] !== null &&
        gradedState.value[currentCard.value] !== undefined;

    if (!wasGraded) {
        gradedState.value[currentCard.value] = correct;

        if (correct) {
            correctCount.value++;
        }

        if (correct) {
            awardCorrect();
        }
    }

    answered.value = true;
    answerResult.value = correct;
    correctOnLast.value = correct;
}

function scrambleFor(card: any) {
    const letters = (card?.answer || '').replace(/\s+/g, '').split('');

    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    jumbleLetters.value = letters;
    jumbleAnswer.value = [];
}

function nextCard() {
    if (
        currentGame.value &&
        currentCard.value < currentGame.value.cards.length - 1
    ) {
        currentCard.value++;
        flipped.value = false;
        answered.value = false;
        selectedOption.value = '';
        typedAnswer.value = '';
        fillCorrect.value = false;
        answerResult.value = null;
        correctOnLast.value = false;
        jumbleAnswer.value = [];

        if (currentGame.value.type === 'wordjumble') {
            scrambleFor(currentGame.value.cards[currentCard.value]);
        }

        saveProgress(false);
    }
}

function prevCard() {
    if (currentCard.value > 0) {
        currentCard.value--;
        flipped.value = false;
        answered.value = false;
        selectedOption.value = '';
        typedAnswer.value = '';
        fillCorrect.value = false;
        answerResult.value = null;
        correctOnLast.value = false;
        jumbleAnswer.value = [];

        if (currentGame.value.type === 'wordjumble') {
            scrambleFor(currentGame.value.cards[currentCard.value]);
        }

        saveProgress(false);
    }
}

function checkAnswer(opt: string) {
    selectedOption.value = opt;
    const correct = opt === currentGame.value?.cards[currentCard.value]?.answer;
    setGraded(correct);
}

function checkFillBlank() {
    const c = currentGame.value?.cards[currentCard.value];
    fillCorrect.value =
        typedAnswer.value.trim().toLowerCase() ===
        (c?.answer || '').trim().toLowerCase();
    setGraded(fillCorrect.value);
}

function checkTrueFalse(value: boolean) {
    const c = currentGame.value?.cards[currentCard.value];
    const correct = String(value) === (c?.answer || '').trim().toLowerCase();
    setGraded(correct);
}

function addJumbleLetter(l: string) {
    const idx = jumbleLetters.value.indexOf(l);

    if (idx === -1) {
        return;
    }

    jumbleLetters.value.splice(idx, 1);
    jumbleAnswer.value.push(l);
}

function removeJumbleLetter(idx: number) {
    const l = jumbleAnswer.value.splice(idx, 1)[0];

    if (l) {
        jumbleLetters.value.push(l);
    }
}

function checkWordJumble() {
    const c = currentGame.value?.cards[currentCard.value];
    const guess = jumbleAnswer.value.join('').toLowerCase();
    const correct =
        guess === (c?.answer || '').replace(/\s+/g, '').toLowerCase();
    setGraded(correct);
}

async function awardCorrect() {
    const g = currentGame.value;

    if (!g || !g.id) {
        return;
    }

    try {
        const token =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '';
        const card = currentGame.value?.cards[currentCard.value];

        if (!card?.id) {
            return;
        }

        const res = await fetch(`/student/games/${g.id}/answer`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ card_id: card.id }),
        });

        if (res.ok) {
            const data = await res.json();

            if (data.awarded) {
                const chip = document.querySelector('[data-xp-chip]');

                if (chip) {
                    chip.classList.add('gl-pop');
                    setTimeout(() => chip.classList.remove('gl-pop'), 700);
                }
            }
        }
    } catch {
        /* silent */
    }
}

async function saveProgress(completed = false) {
    const g = currentGame.value;

    if (!g || !g.id) {
        return;
    }

    const isFlash = g.type === 'flashcard';
    const done = isFlash
        ? Math.max(0, currentCard.value)
        : gradedState.value.filter((v) => v !== null).length;
    const score = isFlash ? 0 : correctCount.value;
    const cardOrder = (g.cards || []).map((c: any) => c.id).join(',');
    const graded = g.type !== 'flashcard' ? gradedState.value : null;

    try {
        const token =
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? '';
        const res = await fetch(`/student/games/${g.id}/progress`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                current_card: currentCard.value,
                done_count: done,
                score,
                completed,
                card_order: cardOrder,
                graded,
            }),
        });

        if (res.ok) {
            const data = await res.json();

            if (data.progress) {
                g.progress = data.progress;
            }
        }
    } catch {
        /* silent */
    }
}

async function finishGame() {
    await saveProgress(true);
    currentGame.value = null;
}
</script>

<style scoped>
.h-4\.5 {
    height: 1.125rem;
}
.w-4\.5 {
    width: 1.125rem;
}
</style>
