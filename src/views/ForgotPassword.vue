<template>
  <div class="public-auth-page"><section class="public-auth-card">
    <h1>Forgot your password?</h1>
    <p>Enter your username or email. If an account matches, reset instructions will be sent.</p>
    <form @submit.prevent="submit">
      <label>Username or email<input v-model="identifier" required autocomplete="username" /></label>
      <p v-if="error" class="error">{{ error }}</p><p v-if="message" class="success">{{ message }}</p>
      <button :disabled="loading">{{ loading ? 'Sending…' : 'Send reset instructions' }}</button>
    </form><router-link to="/login">Return to sign in</router-link>
  </section></div>
</template>
<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore(); const identifier = ref(''); const loading = ref(false); const error = ref(''); const message = ref('')
async function submit() { loading.value = true; error.value = ''; message.value = ''; try { const data = await auth.requestPasswordReset(identifier.value.trim()); message.value = data?.message || 'If an account matches the supplied details, password reset instructions will be sent.' } catch (err) { error.value = err.message } finally { loading.value = false } }
</script>
<style scoped>
.public-auth-page { min-height:100vh; display:grid; place-items:center; padding:24px; background:var(--background); color:var(--foreground); }.public-auth-card { width:min(100%,480px); padding:32px; border:1px solid var(--border); border-radius:16px; background:var(--card); }.public-auth-card form { display:grid; gap:16px; margin:24px 0; }.public-auth-card label { display:grid; gap:6px; font-weight:600; }.public-auth-card input { padding:11px 12px; border:1px solid var(--border); border-radius:8px; background:var(--background); color:var(--foreground); }.public-auth-card button { padding:12px; border:0; border-radius:8px; background:var(--primary); color:#fff; }.error { color:var(--destructive,#b42318); }.success { color:var(--success,#147d42); }.public-auth-card a { color:var(--primary); }
</style>
