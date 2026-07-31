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
                Learn through interactive games — practice your skills, earn XP, and have fun while mastering your subjects.
            </p>
        </div>
        <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10" style="background: radial-gradient(circle, #10B981, transparent 70%);"></div>
        <div class="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>
    </div>

    <!-- Grade-specific game cards -->
    <div v-if="games.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <a v-for="game in games" :key="game.title" :href="game.url" target="_blank" rel="noopener"
            class="gl-glow-card group flex flex-col p-5 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2)]">
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
                <span class="flex items-center gap-1 text-xs" style="color: var(--gl-accent);">
                    <Zap class="h-3.5 w-3.5" :stroke-width="2" /> {{ game.xp }} XP
                </span>
                <span class="text-xs font-medium transition-colors group-hover:text-[var(--gl-primary)]" style="color: var(--gl-text-muted);">
                    Play <ArrowRight class="inline h-3.5 w-3.5 ml-0.5" :stroke-width="2" />
                </span>
            </div>
        </a>
    </div>

    <!-- Empty -->
    <div v-else class="gl-glow-card flex flex-col items-center justify-center px-8 py-16 text-center">
        <div class="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl" style="background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05));">
            <Gamepad2 class="h-10 w-10" style="color: var(--gl-primary);" :stroke-width="1.5" />
        </div>
        <p class="text-lg font-semibold" style="color: var(--gl-text-primary)">No Games Available</p>
        <p class="mt-2 text-sm" style="color: var(--gl-text-secondary)">Games for your grade level will appear here soon.</p>
    </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';
import { Gamepad2, Code, Image, Monitor, Server, Film, Palette, Terminal, Zap, ArrowRight, Layout } from '@lucide/vue';

const page = usePage();
const user = (page.props.auth as any).user;
const grade = user?.grade;

interface Game {
    title: string;
    subject: string;
    desc: string;
    url: string;
    xp: number;
    icon: any;
    bg: string;
    color: string;
    badge: string;
}

const grade8Games: Game[] = [
    {
        title: 'Python Code Runner', subject: 'Python Programming',
        desc: 'Write and run Python code in an interactive playground. Practice loops, functions, and algorithms with instant feedback.',
        url: 'https://www.online-python.com/',
        xp: 15, icon: Terminal, bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', badge: 'rgba(59,130,246,0.1)',
    },
    {
        title: 'Python Challenge Quest', subject: 'Python Programming',
        desc: 'Solve coding puzzles and challenges to level up your Python skills. Complete missions to unlock achievements.',
        url: 'https://www.codewars.com/?language=python',
        xp: 20, icon: Code, bg: 'rgba(16,185,129,0.12)', color: '#10B981', badge: 'rgba(16,185,129,0.1)',
    },
    {
        title: 'CapCut Video Editor', subject: 'CapCut',
        desc: 'Learn video editing with interactive tutorials. Create stunning videos with effects, transitions, and music.',
        url: 'https://www.capcut.com/editor',
        xp: 15, icon: Film, bg: 'rgba(124,58,237,0.12)', color: '#7C3AED', badge: 'rgba(124,58,237,0.1)',
    },
    {
        title: 'CapCut Template Lab', subject: 'CapCut',
        desc: 'Explore and customize trending CapCut templates. Learn how effects and animations work behind the scenes.',
        url: 'https://www.capcut.com/templates',
        xp: 10, icon: Layout, bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', badge: 'rgba(251,191,36,0.1)',
    },
];

const grade10Games: Game[] = [
    {
        title: 'Canva Design Studio', subject: 'Graphic Design',
        desc: 'Create professional graphics, posters, and social media content. Master color theory, typography, and layout.',
        url: 'https://www.canva.com/',
        xp: 15, icon: Palette, bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', badge: 'rgba(251,191,36,0.1)',
    },
    {
        title: 'Design Principles Quiz', subject: 'Graphic Design',
        desc: 'Test your knowledge of design principles, color theory, and typography through interactive quiz challenges.',
        url: 'https://www.canva.com/designschool/',
        xp: 10, icon: Image, bg: 'rgba(16,185,129,0.12)', color: '#10B981', badge: 'rgba(16,185,129,0.1)',
    },
    {
        title: 'Computer Hardware Sim', subject: 'CSS',
        desc: 'Interactive computer hardware simulator — learn to identify components, troubleshoot issues, and build a PC.',
        url: 'https://pcpartpicker.com/list/',
        xp: 20, icon: Monitor, bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', badge: 'rgba(59,130,246,0.1)',
    },
    {
        title: 'Networking Basics Lab', subject: 'CSS',
        desc: 'Learn network fundamentals through interactive simulations. Configure routers, set up LANs, and troubleshoot connectivity.',
        url: 'https://www.cisco.com/c/en/us/training-events/networking-academy.html',
        xp: 20, icon: Server, bg: 'rgba(124,58,237,0.12)', color: '#7C3AED', badge: 'rgba(124,58,237,0.1)',
    },
];

const games = computed<Game[]>(() => {
    if (grade === 'Grade 10' || grade?.includes('10')) return grade10Games;
    if (grade === 'Grade 8' || grade?.includes('8')) return grade8Games;
    return grade10Games; // default fallback
});
</script>
