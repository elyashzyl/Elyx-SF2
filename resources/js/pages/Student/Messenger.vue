<template>
    <Messenger :conversations="conversations" :contacts="contacts" :conversation="conversation" />
</template>

<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Messenger from '@/pages/Teacher/Messenger.vue';

defineProps<{
    conversations: any[];
    contacts: any[];
    conversation?: any;
}>();
</script>
