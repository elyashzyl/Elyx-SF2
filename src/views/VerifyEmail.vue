<template>
  <div class="public-auth-page"><section class="public-auth-card">
    <h1>Email verification</h1><p v-if="loading">Verifying your email…</p><p v-else :class="success ? 'success' : 'error'">{{ message }}</p><router-link to="/login">Return to sign in</router-link>
  </section></div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const route = useRoute(); const auth = useAuthStore(); const loading = ref(true); const success = ref(false); const message = ref('')
onMounted(async () => { try { await auth.verifyEmail(String(route.query.token || '')); success.value = true; message.value = 'Your email has been verified.' } catch (err) { message.value = err.message } finally { loading.value = false } })
</script>
<style scoped>
.public-auth-page { min-height:100vh; display:grid; place-items:center; padding:24px; background:var(--background); color:var(--foreground); }.public-auth-card { width:min(100%,480px); padding:32px; border:1px solid var(--border); border-radius:16px; background:var(--card); }.success { color:var(--success,#147d42); }.error { color:var(--destructive,#b42318); }.public-auth-card a { color:var(--primary); }
</style>
