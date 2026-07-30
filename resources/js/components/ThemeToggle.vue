<template>
    <button @click="toggle"
        class="rounded-xl p-2.5 transition-all duration-200"
        style="color: var(--gl-text-secondary);"
        title="Toggle theme">
        <Moon v-if="isDark" class="h-5 w-5" :stroke-width="2" />
        <Sun v-else class="h-5 w-5" :stroke-width="2" />
    </button>
</template>

<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue';
import { ref } from 'vue';

const isDark = ref(localStorage.getItem('dark-mode') !== 'light');

function toggle() {
    isDark.value = !isDark.value;
    localStorage.setItem('dark-mode', isDark.value ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', isDark.value);
}

// Initialize on mount
if (isDark.value) {
    document.documentElement.classList.add('dark-mode');
} else {
    document.documentElement.classList.remove('dark-mode');
}
</script>
