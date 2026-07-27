<template>
    <Head :title="isEditing ? 'Edit Grade Level' : 'New Grade Level'" />

    <Link href="/teacher/grade-levels" class="mb-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#2B3444]" style="color: #5A6376">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" />
        Back to grade levels
    </Link>

        <form class="max-w-lg" @submit.prevent="submit">
            <div class="card p-6">
                <h3 class="mb-4 text-sm font-semibold" style="color: #1B2231">
                    {{ isEditing ? 'Edit grade level' : 'Create a new grade level' }}
                </h3>

                <div class="space-y-4">
                    <div>
                        <label class="field-label">Name</label>
                        <input v-model="form.name" type="text" class="input-field" placeholder="e.g. Grade 10" required />
                        <p v-if="form.errors.name" class="mt-1 text-xs" style="color: #AA3C36">{{ form.errors.name }}</p>
                    </div>

                    <div>
                        <label class="field-label">Display order</label>
                        <input v-model.number="form.display_order" type="number" min="0" class="input-field" placeholder="e.g. 10" />
                        <p v-if="form.errors.display_order" class="mt-1 text-xs" style="color: #AA3C36">{{ form.errors.display_order }}</p>
                    </div>

                    <div class="flex items-center gap-2">
                        <input id="is_active" v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-[#D2D6DE]" style="color: #1D3557" />
                        <label for="is_active" class="text-sm font-medium" style="color: #404A5C">Active</label>
                    </div>
                </div>

                <div class="mt-6 flex items-center justify-end gap-3 border-t border-[#E9EBEF] pt-6">
                    <Link href="/teacher/grade-levels" class="btn-secondary">Cancel</Link>
                    <button type="submit" class="btn-primary" :disabled="form.processing">
                        {{ isEditing ? 'Update' : 'Create' }}
                    </button>
                </div>
            </div>
        </form>

</template>

<script setup lang="ts">
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ArrowLeft } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
    gradeLevel: any;
}>();

const isEditing = computed(() => !!props.gradeLevel);

const form = useForm({
    name: props.gradeLevel?.name ?? '',
    display_order: props.gradeLevel?.display_order ?? 0,
    is_active: props.gradeLevel?.is_active ?? true,
});

function submit() {
    if (isEditing.value) {
        form.patch(`/teacher/grade-levels/${props.gradeLevel.id}`);
    } else {
        form.post('/teacher/grade-levels');
    }
}
</script>
