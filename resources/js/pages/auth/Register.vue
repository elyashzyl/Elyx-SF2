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
import { GraduationCap, School } from '@lucide/vue';

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

    <Form
        v-bind="store.form()"
        :reset-on-success="['password', 'password_confirmation']"
        v-slot="{ errors, processing }"
        class="flex flex-col gap-6"
    >
        <div class="grid gap-2">
            <Label for="name">Full name</Label>
            <Input id="name" type="text" required autofocus autocomplete="name" name="name" placeholder="Full name" />
            <InputError :message="errors.name" />
        </div>

        <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" required autocomplete="email" name="email" placeholder="email@example.com" />
            <InputError :message="errors.email" />
        </div>

        <div class="grid grid-cols-2 gap-2 rounded-lg border p-1" style="background-color: #F5F6F8; border-color: #D2D6DE">
            <button
                type="button"
                class="flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors"
                :class="role === 'teacher' ? 'bg-white text-[#1D3557] shadow-sm' : 'text-[#5A6376]'"
                @click="role = 'teacher'"
            >
                <GraduationCap class="h-4 w-4" :stroke-width="2" />
                Teacher
            </button>
            <button
                type="button"
                class="flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors"
                :class="role === 'student' ? 'bg-white text-[#1D3557] shadow-sm' : 'text-[#5A6376]'"
                @click="role = 'student'"
            >
                <School class="h-4 w-4" :stroke-width="2" />
                Student
            </button>
        </div>

        <input type="hidden" name="role" :value="role" />

        <template v-if="role === 'student'">
            <div class="grid gap-2">
                <Label>Teachers</Label>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="teacher in teachers"
                        :key="teacher.id"
                        type="button"
                        @click="toggleTeacher(teacher.id)"
                        class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                        :class="teacherIds.includes(teacher.id) ? 'border-[#1D3557] bg-[#EEF2F7] text-[#1D3557]' : 'border-[#D2D6DE] bg-white text-[#5A6376] hover:border-[#B0B6C4]'"
                    >
                        {{ teacher.name }}
                    </button>
                </div>
                <input v-for="id in teacherIds" :key="id" type="hidden" name="teacher_ids[]" :value="id" />
                <InputError :message="errors.teacher_ids" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label for="grade">Grade level</Label>
                    <div class="relative">
                        <select id="grade" v-model="grade" name="grade"
                            class="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="" disabled>Select grade</option>
                            <option v-for="gl in gradeLevels" :key="gl.id" :value="gl.name">{{ gl.name }}</option>
                        </select>
                        <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style="color: #7C8598" />
                    </div>
                    <input type="hidden" name="grade_level_id" :value="gradeLevelId" />
                    <InputError :message="errors.grade" />
                </div>
                <div class="grid gap-2">
                    <Label for="section">Section</Label>
                    <div class="relative">
                        <select id="section_id" v-model="sectionId" name="section_id"
                            class="flex h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="" disabled>Select section</option>
                            <option v-for="sec in filteredSections" :key="sec.id" :value="sec.id">{{ sec.name }}</option>
                        </select>
                        <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style="color: #7C8598" />
                    </div>
                    <InputError :message="errors.section_id" />
                </div>
            </div>
        </template>

        <div class="grid gap-2">
            <Label for="password">Password</Label>
            <PasswordInput id="password" required :tabindex="role === 'student' ? 6 : 3" autocomplete="new-password" name="password" placeholder="Password" :passwordrules="passwordRules" />
            <InputError :message="errors.password" />
        </div>

        <div class="grid gap-2">
            <Label for="password_confirmation">Confirm password</Label>
            <PasswordInput id="password_confirmation" required :tabindex="role === 'student' ? 7 : 4" autocomplete="new-password" name="password_confirmation" placeholder="Confirm password" :passwordrules="passwordRules" />
            <InputError :message="errors.password_confirmation" />
        </div>

        <Button type="submit" class="mt-2 w-full" :disabled="processing">
            <Spinner v-if="processing" />
            Create account
        </Button>

        <p class="text-center text-sm" style="color: #7C8598">
            Already have an account?
            <TextLink :href="login()">Log in</TextLink>
        </p>
    </Form>
</template>
