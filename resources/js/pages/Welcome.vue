<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { login, register } from '@/routes';
import {
  GraduationCap, Rocket, Trophy, Star, Zap, Shield, BookOpen,
  Users, Target, Award, Medal, Gem, Flame, MessageCircle,
  ChartBar, ArrowRight, CheckCircle2, Sparkles,
} from '@lucide/vue';

const stats = [
    { value: '10,000+', label: 'Students' },
    { value: '500+', label: 'Teachers' },
    { value: '50K+', label: 'Achievements' },
    { value: '1M+', label: 'XP Earned' },
    { value: '25K+', label: 'Activities' },
];

const features = [
    { icon: Star, title: 'XP & Leveling', desc: 'Earn experience points for every completed activity and watch your level grow.', bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
    { icon: Award, title: 'Achievement Badges', desc: 'Unlock collectible badges for milestones, perfect scores, and learning streaks.', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
    { icon: BookOpen, title: 'Interactive Learning', desc: 'Quizzes, seatworks, practicals, and exams designed to challenge and engage.', bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
    { icon: Flame, title: 'Daily Streaks', desc: 'Build consistent study habits and earn bonus rewards for maintaining your streak.', bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
    { icon: Trophy, title: 'Leaderboards', desc: 'Compete with classmates, track your rank, and climb to the top of your section.', bg: 'rgba(124,58,237,0.12)', color: '#7C3AED' },
    { icon: MessageCircle, title: 'Built-in Messenger', desc: 'Connect with teachers and classmates in real time through the messaging hub.', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
];

const steps = [
    { title: 'Join', desc: 'Create your profile', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
    { title: 'Learn', desc: 'Complete activities', bg: 'rgba(124,58,237,0.12)', color: '#7C3AED' },
    { title: 'Earn XP', desc: 'Get rewards & badges', bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
    { title: 'Level Up', desc: 'Climb the rankings', bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
];
</script>

<template>
    <Head title="EduPulse — Level Up Your Learning" />
    <div class="welcome-page" style="background: #0F172A; color: #F8FAFC; overflow-x: hidden;">

    <!-- ── NAV ────────────────────────────── -->
    <nav class="sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between"
        style="background: rgba(15,23,42,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(148,163,184,0.1);">
        <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                style="background: linear-gradient(135deg, #3B82F6, #7C3AED);">
                <GraduationCap class="h-5 w-5 text-white" :stroke-width="2" />
            </div>
            <span class="text-lg font-bold tracking-tight">
                <span style="color: #3B82F6;">Edu</span><span style="color: #F8FAFC;">Pulse</span>
            </span>
        </div>
        <div class="hidden md:flex items-center gap-8 text-sm" style="color: #94A3B8;">
            <a href="#features" class="hover:text-white transition-colors">Features</a>
            <a href="#how" class="hover:text-white transition-colors">How It Works</a>
            <Link :href="login()" class="hover:text-white transition-colors">Log in</Link>
            <Link :href="register()"
                class="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                style="background: linear-gradient(135deg, #3B82F6, #7C3AED); box-shadow: 0 0 16px rgba(59,130,246,0.3);">
                Start Learning
            </Link>
        </div>
        <Link :href="register()" class="md:hidden rounded-xl px-4 py-2 text-sm font-semibold text-white"
            style="background: linear-gradient(135deg, #3B82F6, #7C3AED);">Start</Link>
    </nav>

    <!-- ── HERO ────────────────────────────── -->
    <section class="relative px-6 py-20 md:py-32 overflow-hidden">
        <div class="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full opacity-10"
            style="background: radial-gradient(circle, #3B82F6, transparent 70%);"></div>
        <div class="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-10"
            style="background: radial-gradient(circle, #7C3AED, transparent 70%);"></div>
        <div class="max-w-5xl mx-auto text-center relative z-10">
            <div class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
                style="background: rgba(59,130,246,0.1); color: #3B82F6; border: 1px solid rgba(59,130,246,0.2);">
                <Sparkles class="h-3.5 w-3.5" :stroke-width="2" />
                Gamified Learning Management System
            </div>
            <h1 class="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                Level Up Your<br />
                <span style="background: linear-gradient(135deg, #3B82F6, #7C3AED, #FBBF24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Learning Experience</span>
            </h1>
            <p class="text-lg max-w-2xl mx-auto mb-8" style="color: #94A3B8;">
                EduPulse transforms traditional education into an exciting adventure. Earn XP, unlock achievements, compete on leaderboards, and level up your skills.
            </p>
            <div class="flex flex-wrap items-center justify-center gap-4">
                <Link :href="register()"
                    class="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-all hover:scale-105"
                    style="background: linear-gradient(135deg, #3B82F6, #7C3AED); box-shadow: 0 0 20px rgba(59,130,246,0.4);">
                    <Rocket class="h-5 w-5" :stroke-width="2" />
                    Start Learning Free
                </Link>
                <Link :href="login()"
                    class="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-medium transition-all border"
                    style="color: #F8FAFC; border-color: #273449; background: rgba(30,41,59,0.5);">
                    <ArrowRight class="h-5 w-5" :stroke-width="2" />
                    I have an account
                </Link>
            </div>
        </div>
    </section>

    <!-- ── STATS ───────────────────────────── -->
    <section class="px-6 py-16">
        <div class="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6">
            <div v-for="s in stats" :key="s.label" class="text-center">
                <p class="text-3xl md:text-4xl font-bold" style="color: #3B82F6;">{{ s.value }}</p>
                <p class="text-xs mt-1" style="color: #94A3B8;">{{ s.label }}</p>
            </div>
        </div>
    </section>

    <!-- ── FEATURES ────────────────────────── -->
    <section id="features" class="px-6 py-20">
        <div class="max-w-5xl mx-auto text-center mb-14">
            <h2 class="text-3xl font-bold mb-3">Built for <span style="color: #3B82F6;">Engaged Learning</span></h2>
            <p class="text-sm max-w-xl mx-auto" style="color: #94A3B8;">Everything you need to make education exciting, rewarding, and competitive.</p>
        </div>
        <div class="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div v-for="f in features" :key="f.title"
                class="group rounded-2xl p-6 transition-all hover:-translate-y-1"
                style="background: #1E293B; border: 1px solid #273449;">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl mb-4" :style="{ background: f.bg }">
                    <component :is="f.icon" class="h-5 w-5" :style="{ color: f.color }" :stroke-width="2" />
                </div>
                <h3 class="text-base font-semibold mb-1.5">{{ f.title }}</h3>
                <p class="text-sm" style="color: #94A3B8;">{{ f.desc }}</p>
            </div>
        </div>
    </section>

    <!-- ── HOW IT WORKS ────────────────────── -->
    <section id="how" class="px-6 py-20" style="background: rgba(59,130,246,0.03);">
        <div class="max-w-5xl mx-auto text-center mb-14">
            <h2 class="text-3xl font-bold mb-3">How It <span style="color: #7C3AED;">Works</span></h2>
            <p class="text-sm max-w-xl mx-auto" style="color: #94A3B8;">Four simple steps to transform your learning journey.</p>
        </div>
        <div class="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
            <div v-for="(h, i) in steps" :key="h.title" class="text-center">
                <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold"
                    :style="{ background: h.bg, color: h.color }">{{ i + 1 }}</div>
                <h4 class="text-sm font-semibold mb-1">{{ h.title }}</h4>
                <p class="text-xs" style="color: #94A3B8;">{{ h.desc }}</p>
            </div>
        </div>
    </section>

    <!-- ── CTA ─────────────────────────────── -->
    <section class="relative px-6 py-24 overflow-hidden">
        <div class="absolute inset-0 opacity-5"
            style="background: linear-gradient(135deg, #3B82F6, #7C3AED);"></div>
        <div class="max-w-2xl mx-auto text-center relative z-10">
            <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to Begin Your<br />Learning Adventure?</h2>
            <p class="text-sm mb-8" style="color: #94A3B8;">Join thousands of students already leveling up their education.</p>
            <div class="flex flex-wrap items-center justify-center gap-4">
                <Link :href="register()"
                    class="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white transition-all hover:scale-105"
                    style="background: linear-gradient(135deg, #3B82F6, #7C3AED); box-shadow: 0 0 24px rgba(59,130,246,0.5);">
                    <Rocket class="h-5 w-5" :stroke-width="2" />
                    Create Free Account
                </Link>
                <Link :href="login()"
                    class="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium transition-all border"
                    style="color: #F8FAFC; border-color: #273449;">
                    Sign In
                </Link>
            </div>
        </div>
    </section>

    <!-- ── FOOTER ──────────────────────────── -->
    <footer class="px-6 py-12 text-center text-xs" style="color: #64748B; border-top: 1px solid #273449;">
        <div class="flex items-center justify-center gap-2 mb-3">
            <GraduationCap class="h-4 w-4" style="color: #3B82F6;" :stroke-width="2" />
            <span class="font-semibold" style="color: #F8FAFC;">EduPulse</span>
        </div>
        <p>Learn &bull; Play &bull; Achieve</p>
    </footer>

    </div>
</template>

<style>
.welcome-page { font-family: 'Instrument Sans', 'Inter', system-ui, sans-serif; }
.welcome-page a { text-decoration: none; }
.welcome-page * { scroll-behavior: smooth; }
.welcome-page ::selection { background: rgba(59,130,246,0.3); }
</style>
