<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import TextLink from '@/components/TextLink.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { computed, ref, watch } from 'vue';
import { GraduationCap, School, Trophy, Star, Zap, ChevronDown } from '@lucide/vue';

defineOptions({
    layout: {
        title: 'Create an account',
        description: 'Enter your details below to create your account',
    },
});

const props = defineProps<{
    passwordRules: string;
    teachers: { id: number; name: string }[];
    gradeLevels: { id: number; name: string }[];
    sections: { id: number; name: string; grade_level_id: number }[];
}>();

const filteredSections = computed(() => {
    const gl = props.gradeLevels.find((g: any) => g.name === grade.value);
    return gl ? props.sections.filter((s: any) => s.grade_level_id === gl.id) : [];
});

const role = ref('student');
const teacherIds = ref<number[]>([]);
const grade = ref('');
const gradeLevelId = ref('');
const sectionId = ref('');

function toggleTeacher(id: number) {
    const idx = teacherIds.value.indexOf(id);
    if (idx === -1) {
        teacherIds.value.push(id);
    } else {
        teacherIds.value.splice(idx, 1);
    }
}

watch(grade, () => {
    sectionId.value = '';
    const gl = props.gradeLevels.find((g: any) => g.name === grade.value);
    gradeLevelId.value = gl ? String(gl.id) : '';
});
</script>

<template>
    <Head title="Sign up" />

    <div class="fixed inset-0 flex login-dark" style="background: #0F172A;">
        <!-- Left: Form -->
        <div class="flex flex-1 flex-col items-center justify-center overflow-y-auto lg:w-[45%]" style="padding: 1.5rem 2rem;">
            <div class="w-full max-w-sm">
                <div class="text-center mb-4">
                    <h2 class="text-xl font-bold mb-0.5" style="color: var(--gl-text-primary);">Join EduPulse</h2>
                    <p class="text-xs" style="color: var(--gl-text-secondary);">Start your learning adventure</p>
                </div>

                <Form
                    v-bind="store.form()"
                    :reset-on-success="['password', 'password_confirmation']"
                    v-slot="{ errors, processing }"
                    class="flex flex-col gap-3.5"
                >
                    <div class="grid gap-1.5">
                        <Label for="name" style="color: var(--gl-text-secondary);">Full name</Label>
                        <Input id="name" type="text" required autofocus autocomplete="name" name="name" placeholder="Full name" />
                        <InputError :message="errors.name" />
                    </div>

                    <div class="grid gap-1.5">
                        <Label for="email" style="color: var(--gl-text-secondary);">Email</Label>
                        <Input id="email" type="email" required autocomplete="email" name="email" placeholder="email@example.com" />
                        <InputError :message="errors.email" />
                    </div>

                    <!-- Role Toggle -->
                    <div class="grid grid-cols-2 gap-1 rounded-xl p-1" style="background: #1E293B; border: 1px solid #273449;">
                        <button type="button"
                            class="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all"
                            :style="role === 'teacher' ? { background: 'linear-gradient(135deg, var(--gl-primary), var(--gl-secondary))', color: '#FFF' } : { color: 'var(--gl-text-muted)' }"
                            @click="role = 'teacher'">
                            <GraduationCap class="h-4 w-4" :stroke-width="2" />
                            Teacher
                        </button>
                        <button type="button"
                            class="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all"
                            :style="role === 'student' ? { background: 'linear-gradient(135deg, var(--gl-primary), var(--gl-secondary))', color: '#FFF' } : { color: 'var(--gl-text-muted)' }"
                            @click="role = 'student'">
                            <School class="h-4 w-4" :stroke-width="2" />
                            Student
                        </button>
                    </div>

                    <input type="hidden" name="role" :value="role" />

                    <template v-if="role === 'student'">
                        <div class="grid gap-1.5">
                            <Label style="color: var(--gl-text-secondary);">Teachers</Label>
                            <div class="flex flex-wrap gap-2">
                                <button v-for="teacher in teachers" :key="teacher.id" type="button"
                                    @click="toggleTeacher(teacher.id)"
                                    class="rounded-lg border px-3 py-2 text-sm font-medium transition-all"
                                    :style="teacherIds.includes(teacher.id)
                                        ? { background: 'rgba(59,130,246,0.12)', borderColor: 'var(--gl-primary)', color: 'var(--gl-primary)' }
                                        : { background: '#1E293B', borderColor: '#273449', color: 'var(--gl-text-secondary)' }">
                                    {{ teacher.name }}
                                </button>
                            </div>
                            <input v-for="id in teacherIds" :key="id" type="hidden" name="teacher_ids[]" :value="id" />
                            <InputError :message="errors.teacher_ids" />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="grid gap-1.5">
                                <Label for="grade" style="color: var(--gl-text-secondary);">Grade level</Label>
                                <div class="relative">
                                    <select id="grade" v-model="grade" name="grade"
                                        class="flex h-10 w-full appearance-none rounded-lg border px-3 py-2 pr-10 text-sm outline-none"
                                        style="background: #1E293B; border-color: #273449; color: #F8FAFC;">
                                        <option value="" disabled>Select grade</option>
                                        <option v-for="gl in gradeLevels" :key="gl.id" :value="gl.name">{{ gl.name }}</option>
                                    </select>
                                    <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style="color: #94A3B8" />
                                </div>
                                <input type="hidden" name="grade_level_id" :value="gradeLevelId" />
                                <InputError :message="errors.grade" />
                            </div>
                            <div class="grid gap-1.5">
                                <Label for="section" style="color: var(--gl-text-secondary);">Section</Label>
                                <div class="relative">
                                    <select id="section_id" v-model="sectionId" name="section_id"
                                        class="flex h-10 w-full appearance-none rounded-lg border px-3 py-2 pr-10 text-sm outline-none"
                                        style="background: #1E293B; border-color: #273449; color: #F8FAFC;">
                                        <option value="" disabled>Select section</option>
                                        <option v-for="sec in filteredSections" :key="sec.id" :value="sec.id">{{ sec.name }}</option>
                                    </select>
                                    <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style="color: #94A3B8" />
                                </div>
                                <InputError :message="errors.section_id" />
                            </div>
                        </div>
                    </template>

                    <div class="grid gap-1.5">
                        <Label for="password" style="color: var(--gl-text-secondary);">Password</Label>
                        <PasswordInput id="password" required :tabindex="role === 'student' ? 6 : 3" autocomplete="new-password" name="password" placeholder="Password" :passwordrules="passwordRules" />
                        <InputError :message="errors.password" />
                    </div>

                    <div class="grid gap-1.5">
                        <Label for="password_confirmation" style="color: var(--gl-text-secondary);">Confirm password</Label>
                        <PasswordInput id="password_confirmation" required :tabindex="role === 'student' ? 7 : 4" autocomplete="new-password" name="password_confirmation" placeholder="Confirm password" :passwordrules="passwordRules" />
                        <InputError :message="errors.password_confirmation" />
                    </div>

                    <Button type="submit" class="mt-2 w-full" :disabled="processing">
                        <Spinner v-if="processing" />
                        <Zap v-else class="h-4 w-4 mr-1.5" :stroke-width="2" />
                        Create account
                    </Button>

                    <p class="text-center text-sm" style="color: var(--gl-text-secondary);">
                        Already have an account?
                        <TextLink :href="login()">Log in</TextLink>
                    </p>
                </Form>

                <p class="text-center text-xs mt-4" style="color: var(--gl-text-muted);">
                    Learn. Play. Achieve.
                </p>
            </div>
        </div>

        <!-- Right: Hero -->
        <div class="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col items-center justify-center">
            <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95));"></div>
            <div class="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10"
                style="background: radial-gradient(circle, var(--gl-secondary), transparent 70%);"></div>
            <div class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10"
                style="background: radial-gradient(circle, var(--gl-primary), transparent 70%);"></div>

            <div class="relative z-10 max-w-md text-center">
                <div class="mb-8 flex justify-center">
                    <div class="flex h-20 w-20 items-center justify-center rounded-2xl"
                        style="background: linear-gradient(135deg, var(--gl-secondary), var(--gl-primary)); box-shadow: 0 0 40px var(--gl-secondary-glow);">
                        <Trophy class="h-10 w-10 text-white" :stroke-width="1.5" />
                    </div>
                </div>
                <h2 class="text-3xl font-bold mb-3" style="color: var(--gl-text-primary);">Begin Your Journey</h2>
                <p class="text-sm mb-10" style="color: var(--gl-text-secondary);">
                    Create your account and start earning XP, unlocking achievements, and climbing the leaderboard.
                </p>

                <div class="grid grid-cols-3 gap-3">
                    <div class="rounded-xl p-4 text-center transition-all hover:scale-105"
                        style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15);">
                        <Trophy class="h-6 w-6 mx-auto mb-1.5" style="color: var(--gl-success);" :stroke-width="2" />
                        <p class="text-xs font-semibold" style="color: var(--gl-text-primary);">Complete Tasks</p>
                    </div>
                    <div class="rounded-xl p-4 text-center transition-all hover:scale-105"
                        style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.15);">
                        <Star class="h-6 w-6 mx-auto mb-1.5" style="color: var(--gl-accent);" :stroke-width="2" />
                        <p class="text-xs font-semibold" style="color: var(--gl-text-primary);">Earn Rewards</p>
                    </div>
                    <div class="rounded-xl p-4 text-center transition-all hover:scale-105"
                        style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);">
                        <Zap class="h-6 w-6 mx-auto mb-1.5" style="color: var(--gl-primary);" :stroke-width="2" />
                        <p class="text-xs font-semibold" style="color: var(--gl-text-primary);">Level Up</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.login-dark {
  --background: #0F172A;
  --foreground: #F8FAFC;
  --card: #1E293B;
  --card-foreground: #F8FAFC;
  --border: #273449;
  --input: #273449;
  --muted-foreground: #94A3B8;
  --muted: #263348;
  --primary: #3B82F6;
  --primary-foreground: #FFF;
  --secondary: #263348;
  --secondary-foreground: #F8FAFC;
  --accent: #1E293B;
  --accent-foreground: #F8FAFC;
  --ring: #3B82F6;
  --gl-text-primary: #F8FAFC;
  --gl-text-secondary: #CBD5E1;
  --gl-text-muted: #94A3B8;
  --gl-primary: #3B82F6;
  --gl-secondary: #7C3AED;
  --gl-accent: #FBBF24;
  --gl-success: #10B981;
  --gl-primary-glow: rgba(59,130,246,0.25);
  --gl-secondary-glow: rgba(124,58,237,0.25);
  --gl-surface-2: #1E293B;
  --gl-border: #273449;
  color-scheme: dark;
}
.login-dark input::placeholder { color: #64748B !important; }
.login-dark [data-slot="input"] { background: #1E293B !important; border-color: #273449 !important; color: #F8FAFC !important; height: 2.5rem !important; font-size: 0.875rem !important; }
.login-dark [data-slot="button"] { background: linear-gradient(135deg, #3B82F6, #7C3AED) !important; color: #FFF !important; box-shadow: 0 0 12px rgba(59,130,246,0.3); height: 2.5rem !important; }
.login-dark [data-slot="label"], .login-dark label { color: #CBD5E1 !important; font-size: 0.8rem !important; }
.login-dark a { color: #60A5FA; }
.login-dark span { color: #CBD5E1; }
.login-dark select { background: #1E293B !important; border-color: #273449 !important; color: #F8FAFC !important; }
.login-dark select option { background: #1E293B !important; }
</style>
