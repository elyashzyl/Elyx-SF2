<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { login, register } from '@/routes';
import {
  GraduationCap, Rocket, Trophy, Star, Zap, BookOpen, Flame, MessageCircle,
  ChartBar, ArrowRight, CheckCircle2, Sparkles, Shield, Award, Medal, Gem,
  Users, Target, BarChart3, Globe, Lock, Smartphone, ClipboardCheck,
  TrendingUp, Gift,
} from '@lucide/vue';

const stats = [
    { value: '10,000+', label: 'Students', icon: Users },
    { value: '500+', label: 'Teachers', icon: GraduationCap },
    { value: '150+', label: 'Schools', icon: Globe },
    { value: '1M+', label: 'XP Earned', icon: Zap },
    { value: '250K+', label: 'Activities', icon: ClipboardCheck },
    { value: '50K+', label: 'Achievements', icon: Trophy },
];

const features = [
    { icon: Star, title: 'XP & Level System', desc: 'Earn XP for every activity. Watch your level rise as you master new skills.', bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
    { icon: Award, title: 'Achievement Badges', desc: 'Unlock collectible badges for milestones, perfect scores, and learning streaks.', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
    { icon: Rocket, title: 'Interactive Quizzes', desc: 'Engaging quizzes with instant feedback keep students motivated to learn more.', bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
    { icon: Flame, title: 'Daily Streaks', desc: 'Build consistent study habits and earn bonus rewards for maintaining your streak.', bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
    { icon: Trophy, title: 'Leaderboards', desc: 'Compete with classmates, track your rank, and climb to the top of your section.', bg: 'rgba(124,58,237,0.12)', color: '#7C3AED' },
    { icon: MessageCircle, title: 'Built-in Messenger', desc: 'Stay connected with teachers and classmates through real-time messaging.', bg: 'rgba(6,182,212,0.12)', color: '#06B6D4' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Comprehensive analytics for teachers to track student progress at a glance.', bg: 'rgba(249,115,22,0.12)', color: '#F97316' },
    { icon: Shield, title: 'Teacher Tools', desc: 'Create, publish, grade, and manage all your learning activities from one place.', bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
];

const steps = [
    { icon: GraduationCap, title: 'Create Account', desc: 'Join EduPulse and set up your student or teacher profile.', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
    { icon: BookOpen, title: 'Complete Missions', desc: 'Take quizzes, practicals, and exams designed by your teachers.', bg: 'rgba(124,58,237,0.12)', color: '#7C3AED' },
    { icon: Zap, title: 'Earn XP & Rewards', desc: 'Get experience points for every completed activity and submission.', bg: 'rgba(251,191,36,0.12)', color: '#FBBF24' },
    { icon: Trophy, title: 'Unlock Achievements', desc: 'Collect badges for perfect scores, streaks, and special milestones.', bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
    { icon: TrendingUp, title: 'Become a Champion', desc: 'Climb the leaderboard and become the top learner in your section.', bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
];

const testimonials = [
    { name: 'Sarah Chen', role: 'Student, Grade 10', text: 'EduPulse made learning fun again. I love checking my XP after every quiz and seeing my level go up!' },
    { name: 'James Rodriguez', role: 'Teacher', text: 'My students are more engaged than ever. The leaderboard has created healthy competition in my classroom.' },
    { name: 'Aiko Tanaka', role: 'Student, Grade 8', text: 'The achievement badges are so satisfying to collect. I studied extra just to get the Perfect Score badge!' },
];
</script>

<template>
    <Head title="EduPulse — Level Up Your Learning" />
    <div class="welcome-page" style="background: #0F172A; color: #F8FAFC; overflow-x: hidden;">

    <!-- ════════════ NAV ════════════ -->
    <nav class="sticky top-0 z-30 px-6 py-3 flex items-center justify-between transition-all"
        style="background: rgba(15,23,42,0.9); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(148,163,184,0.08);">
        <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg"
                style="background: linear-gradient(135deg, #3B82F6, #7C3AED); box-shadow: 0 0 12px rgba(59,130,246,0.3);">
                <GraduationCap class="h-5 w-5 text-white" :stroke-width="2" />
            </div>
            <div>
                <span class="text-lg font-bold tracking-tight">
                    <span style="color: #3B82F6;">Edu</span><span style="color: #F8FAFC;">Pulse</span>
                </span>
                <span class="hidden sm:inline text-[10px] ml-2 px-1.5 py-0.5 rounded" style="color: #94A3B8; background: rgba(148,163,184,0.1);">Learn · Play · Achieve</span>
            </div>
        </div>
        <div class="hidden md:flex items-center gap-6 text-sm" style="color: #94A3B8;">
            <a href="#features" class="hover:text-white transition-colors">Features</a>
            <a href="#how" class="hover:text-white transition-colors">How It Works</a>
            <Link :href="login()" class="hover:text-white transition-colors">Log in</Link>
            <Link :href="register()"
                class="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                style="background: linear-gradient(135deg, #3B82F6, #7C3AED); box-shadow: 0 0 16px rgba(59,130,246,0.3);">
                Start Learning
            </Link>
        </div>
        <Link :href="register()" class="md:hidden rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style="background: linear-gradient(135deg, #3B82F6, #7C3AED);">Start</Link>
    </nav>

    <!-- ════════════ HERO ════════════ -->
    <section class="relative px-6 pt-16 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div class="absolute -top-60 -right-60 h-[700px] w-[700px] rounded-full opacity-8"
            style="background: radial-gradient(circle, #3B82F6, transparent 70%);"></div>
        <div class="absolute -bottom-60 -left-60 h-[600px] w-[600px] rounded-full opacity-8"
            style="background: radial-gradient(circle, #7C3AED, transparent 70%);"></div>
        <div class="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-4"
            style="background: radial-gradient(circle, #FBBF24, transparent 70%);"></div>

        <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            <!-- Left -->
            <div>
                <div class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
                    style="background: rgba(59,130,246,0.1); color: #3B82F6; border: 1px solid rgba(59,130,246,0.18);">
                    <Sparkles class="h-3.5 w-3.5" :stroke-width="2" /> Gamified Learning Platform
                </div>
                <h1 class="text-4xl md:text-6xl font-extrabold leading-[1.1] mb-6">
                    <span>Learn.</span><br />
                    <span style="background: linear-gradient(135deg, #3B82F6, #7C3AED, #FBBF24); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Play. Achieve.</span>
                </h1>
                <p class="text-base md:text-lg max-w-lg mb-8" style="color: #94A3B8; line-height: 1.7;">
                    Turn every lesson into an exciting adventure where students earn XP, unlock achievements, complete challenges, and climb the leaderboard.
                </p>
                <div class="flex flex-wrap items-center gap-3 mb-8">
                    <Link :href="register()"
                        class="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-all hover:scale-105"
                        style="background: linear-gradient(135deg, #3B82F6, #7C3AED); box-shadow: 0 0 24px rgba(59,130,246,0.4);">
                        <Rocket class="h-5 w-5" :stroke-width="2" /> Start Learning Free
                    </Link>
                    <Link :href="login()"
                        class="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-medium transition-all border"
                        style="color: #F8FAFC; border-color: #334155; background: rgba(30,41,59,0.4);">
                        <ArrowRight class="h-5 w-5" :stroke-width="2" /> I have an account
                    </Link>
                </div>
                <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-xs" style="color: #64748B;">
                    <div class="flex items-center gap-1.5"><CheckCircle2 class="h-3.5 w-3.5" style="color: #10B981;" :stroke-width="2" /> Gamified Learning</div>
                    <div class="flex items-center gap-1.5"><CheckCircle2 class="h-3.5 w-3.5" style="color: #10B981;" :stroke-width="2" /> Teacher Friendly</div>
                    <div class="flex items-center gap-1.5"><CheckCircle2 class="h-3.5 w-3.5" style="color: #10B981;" :stroke-width="2" /> Student Focused</div>
                    <div class="flex items-center gap-1.5"><CheckCircle2 class="h-3.5 w-3.5" style="color: #10B981;" :stroke-width="2" /> Modern LMS</div>
                </div>
            </div>
            <!-- Right: Dashboard Mockup -->
            <div class="hidden md:block relative">
                <div class="rounded-2xl p-5 relative" style="background: #1E293B; border: 1px solid #273449; transform: perspective(800px) rotateY(-4deg) rotateX(2deg); box-shadow: 0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.1);">
                    <!-- Mock header -->
                    <div class="flex items-center gap-2 mb-4 pb-3" style="border-bottom: 1px solid #273449;">
                        <div class="flex gap-1.5"><span class="h-2.5 w-2.5 rounded-full" style="background:#EF4444;"></span><span class="h-2.5 w-2.5 rounded-full" style="background:#FBBF24;"></span><span class="h-2.5 w-2.5 rounded-full" style="background:#10B981;"></span></div>
                        <span class="text-[10px] ml-2" style="color: #64748B;">EduPulse Dashboard</span>
                    </div>
                    <!-- Mock cards -->
                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div class="rounded-lg p-3" style="background: #263348;"><div class="h-1.5 w-12 rounded mb-2" style="background: #3B82F6;"></div><div class="h-3 w-16 rounded mb-1" style="background: #334155;"></div><div class="h-2 w-10 rounded" style="background: #1E293B;"></div></div>
                        <div class="rounded-lg p-3" style="background: #263348;"><div class="flex items-center gap-1.5 mb-2"><Trophy class="h-3.5 w-3.5" style="color:#FBBF24;" :stroke-width="2"/><div class="h-1.5 w-8 rounded" style="background: #FBBF24;"></div></div><div class="h-3 w-20 rounded" style="background: #334155;"></div></div>
                    </div>
                    <div class="rounded-lg p-4 mb-3" style="background: #263348;">
                        <div class="flex justify-between items-center mb-2"><div class="h-2 w-16 rounded" style="background: #334155;"></div><div class="h-2 w-8 rounded" style="background: #3B82F6;"></div></div>
                        <div class="h-2 w-full rounded-full mb-1.5" style="background: #1E293B;"><div class="h-2 rounded-full" style="width:68%; background:linear-gradient(90deg, #3B82F6, #7C3AED);"></div></div>
                        <div class="h-1.5 w-24 rounded" style="background: #334155;"></div>
                    </div>
                    <div class="flex gap-2">
                        <div class="flex-1 rounded-lg p-2.5" style="background: #263348;"><div class="h-1.5 w-10 rounded mb-1.5" style="background: #10B981;"></div><div class="h-2 w-14 rounded" style="background: #334155;"></div></div>
                        <div class="flex-1 rounded-lg p-2.5" style="background: #263348;"><div class="h-1.5 w-10 rounded mb-1.5" style="background: #7C3AED;"></div><div class="h-2 w-14 rounded" style="background: #334155;"></div></div>
                    </div>
                </div>
                <!-- Floating badge -->
                <div class="absolute -bottom-3 -right-3 rounded-xl px-3 py-2 text-xs font-bold"
                    style="background: linear-gradient(135deg, #FBBF24, #F59E0B); color: #0F172A; box-shadow: 0 4px 12px rgba(251,191,36,0.3);">
                    Level 24
                </div>
            </div>
        </div>
    </section>

    <!-- ════════════ STATS ════════════ -->
    <section class="px-6 py-14" style="border-top: 1px solid rgba(148,163,184,0.06); border-bottom: 1px solid rgba(148,163,184,0.06);">
        <div class="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div v-for="s in stats" :key="s.label" class="text-center group">
                <component :is="s.icon" class="h-5 w-5 mx-auto mb-2 transition-all group-hover:scale-110" style="color: #3B82F6;" :stroke-width="2" />
                <p class="text-2xl md:text-3xl font-bold transition-all" style="color: #F8FAFC;">{{ s.value }}</p>
                <p class="text-xs mt-0.5" style="color: #64748B;">{{ s.label }}</p>
            </div>
        </div>
    </section>

    <!-- ════════════ FEATURES ════════════ -->
    <section id="features" class="px-6 py-24">
        <div class="max-w-6xl mx-auto text-center mb-16">
            <div class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-4"
                style="background: rgba(124,58,237,0.1); color: #7C3AED; border: 1px solid rgba(124,58,237,0.2);">
                <Sparkles class="h-3.5 w-3.5" :stroke-width="2" /> Built for Success
            </div>
            <h2 class="text-3xl md:text-4xl font-bold mb-3">Everything You Need<br /><span style="color: #3B82F6;">to Succeed</span></h2>
            <p class="text-sm max-w-xl mx-auto" style="color: #94A3B8;">A complete gamified learning platform with all the tools teachers and students need.</p>
        </div>
        <div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="f in features" :key="f.title"
                class="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5"
                style="background: linear-gradient(180deg, rgba(30,41,59,0.8), rgba(30,41,59,0.4)); border: 1px solid rgba(148,163,184,0.08);">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl mb-4 transition-all group-hover:scale-110" :style="{ background: f.bg }">
                    <component :is="f.icon" class="h-5 w-5" :style="{ color: f.color }" :stroke-width="2" />
                </div>
                <h3 class="text-sm font-semibold mb-1.5">{{ f.title }}</h3>
                <p class="text-xs leading-relaxed" style="color: #94A3B8;">{{ f.desc }}</p>
            </div>
        </div>
    </section>

    <!-- ════════════ JOURNEY ════════════ -->
    <section id="how" class="px-6 py-24" style="background: rgba(59,130,246,0.02); border-top: 1px solid rgba(148,163,184,0.06); border-bottom: 1px solid rgba(148,163,184,0.06);">
        <div class="max-w-6xl mx-auto text-center mb-16">
            <div class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-4"
                style="background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.18);">
                <Zap class="h-3.5 w-3.5" :stroke-width="2" /> Your Learning Adventure
            </div>
            <h2 class="text-3xl md:text-4xl font-bold mb-3">How It <span style="color: #7C3AED;">Works</span></h2>
            <p class="text-sm max-w-xl mx-auto" style="color: #94A3B8;">Five simple steps to transform your educational experience.</p>
        </div>
        <div class="max-w-4xl mx-auto relative">
            <!-- Connecting line -->
            <div class="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5" style="background: linear-gradient(90deg, #3B82F6, #7C3AED, #FBBF24, #10B981, #EF4444); opacity: 0.3;"></div>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div v-for="(h, i) in steps" :key="h.title" class="relative text-center group">
                    <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold transition-all group-hover:scale-110 relative z-10"
                        :style="{ background: h.bg, color: h.color }">
                        <component :is="h.icon" class="h-6 w-6" :stroke-width="2" />
                    </div>
                    <h4 class="text-sm font-semibold mb-1">{{ h.title }}</h4>
                    <p class="text-xs" style="color: #94A3B8;">{{ h.desc }}</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ════════════ TESTIMONIALS ════════════ -->
    <section class="px-6 py-24">
        <div class="max-w-6xl mx-auto text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold mb-3">Loved by <span style="color: #FBBF24;">Students & Teachers</span></h2>
            <p class="text-sm max-w-xl mx-auto" style="color: #94A3B8;">See what our community has to say about EduPulse.</p>
        </div>
        <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            <div v-for="t in testimonials" :key="t.name"
                class="rounded-2xl p-6 text-center transition-all hover:-translate-y-1"
                style="background: #1E293B; border: 1px solid #273449;">
                <div class="flex justify-center gap-0.5 mb-3">
                    <Star v-for="i in 5" :key="i" class="h-3.5 w-3.5 fill-current" style="color: #FBBF24;" :stroke-width="1" />
                </div>
                <p class="text-sm italic mb-4 leading-relaxed" style="color: #CBD5E1;">"{{ t.text }}"</p>
                <div class="flex h-9 w-9 mx-auto mb-2 items-center justify-center rounded-full text-xs font-bold text-white"
                    style="background: linear-gradient(135deg, #3B82F6, #7C3AED);">{{ t.name.charAt(0) }}</div>
                <p class="text-sm font-semibold">{{ t.name }}</p>
                <p class="text-xs" style="color: #94A3B8;">{{ t.role }}</p>
            </div>
        </div>
    </section>

    <!-- ════════════ CTA ════════════ -->
    <section class="relative px-6 py-28 overflow-hidden">
        <div class="absolute inset-0" style="background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(124,58,237,0.08));"></div>
        <div class="absolute top-10 left-10 h-32 w-32 rounded-full opacity-6" style="background: radial-gradient(circle, #FBBF24, transparent 70%);"></div>
        <div class="absolute bottom-10 right-10 h-40 w-40 rounded-full opacity-6" style="background: radial-gradient(circle, #3B82F6, transparent 70%);"></div>
        <div class="max-w-2xl mx-auto text-center relative z-10">
            <div class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
                style="background: rgba(251,191,36,0.1); color: #FBBF24; border: 1px solid rgba(251,191,36,0.18);">
                <Gift class="h-3.5 w-3.5" :stroke-width="2" /> Start Your Journey Today
            </div>
            <h2 class="text-3xl md:text-5xl font-extrabold mb-4">Ready to Begin Your<br />Learning Adventure?</h2>
            <p class="text-sm md:text-base max-w-lg mx-auto mb-8" style="color: #94A3B8;">Join thousands of students who are learning, playing, and achieving every single day.</p>
            <div class="flex flex-wrap items-center justify-center gap-4">
                <Link :href="register()"
                    class="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white transition-all hover:scale-105"
                    style="background: linear-gradient(135deg, #3B82F6, #7C3AED); box-shadow: 0 0 32px rgba(59,130,246,0.5);">
                    <Rocket class="h-5 w-5" :stroke-width="2" /> Create Free Account
                </Link>
                <Link :href="login()"
                    class="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold transition-all border"
                    style="color: #F8FAFC; border-color: #334155; background: rgba(30,41,59,0.4);">
                    Sign In
                </Link>
            </div>
        </div>
    </section>

    <!-- ════════════ FOOTER ════════════ -->
    <footer class="px-6 py-14" style="border-top: 1px solid rgba(148,163,184,0.08); background: #0A0F1A;">
        <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg" style="background: linear-gradient(135deg, #3B82F6, #7C3AED);">
                            <GraduationCap class="h-4 w-4 text-white" :stroke-width="2" />
                        </div>
                        <span class="font-bold"><span style="color:#3B82F6;">Edu</span><span style="color:#F8FAFC;">Pulse</span></span>
                    </div>
                    <p class="text-xs leading-relaxed" style="color: #64748B;">The gamified learning management system that makes education fun.</p>
                </div>
                <div>
                    <p class="text-xs font-semibold mb-3" style="color: #F8FAFC;">Platform</p>
                    <div class="space-y-2 text-xs" style="color: #64748B;">
                        <p>Quizzes</p><p>Exams</p><p>Practicals</p><p>Leaderboard</p>
                    </div>
                </div>
                <div>
                    <p class="text-xs font-semibold mb-3" style="color: #F8FAFC;">Company</p>
                    <div class="space-y-2 text-xs" style="color: #64748B;">
                        <p>About</p><p>Features</p><p>Contact</p><p>Privacy</p>
                    </div>
                </div>
                <div>
                    <p class="text-xs font-semibold mb-3" style="color: #F8FAFC;">Connect</p>
                    <div class="space-y-2 text-xs" style="color: #64748B;">
                        <p>Twitter</p><p>Facebook</p><p>Discord</p><p>Email</p>
                    </div>
                </div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-4 pt-8 text-xs" style="color: #64748B; border-top: 1px solid rgba(148,163,184,0.06);">
                <p>&copy; 2026 EduPulse. All rights reserved.</p>
                <p style="color: #3B82F6;">Learn &bull; Play &bull; Achieve</p>
            </div>
        </div>
    </footer>

    </div>
</template>

<style>
.welcome-page { font-family: 'Instrument Sans', 'Inter', system-ui, sans-serif; }
.welcome-page a { text-decoration: none; }
.welcome-page * { scroll-behavior: smooth; }
.welcome-page ::selection { background: rgba(59,130,246,0.3); color: #F8FAFC; }
</style>
