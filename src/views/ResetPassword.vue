<template>
  <div class="public-auth-page"><section class="public-auth-card">
    <h1>Reset your password</h1><p v-if="username">Resetting the password for {{ username }}.</p>
    <p v-if="loading">Checking reset link…</p>
    <form v-else @submit.prevent="submit">
      <label>New password<input v-model="password" type="password" required minlength="8" autocomplete="new-password" /></label>
      <label>Confirm password<input v-model="confirmation" type="password" required minlength="8" autocomplete="new-password" /></label>
      <p v-if="error" class="error">{{ error }}</p><p v-if="success" class="success">Password reset. You can now sign in.</p>
      <button :disabled="saving || success">{{ saving ? 'Saving…' : 'Reset password' }}</button>
    </form><router-link to="/login">Return to sign in</router-link>
  </section></div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const route = useRoute(); const router = useRouter(); const auth = useAuthStore(); const token = String(route.query.token || '')
const loading = ref(true); const saving = ref(false); const username = ref(''); const password = ref(''); const confirmation = ref(''); const error = ref(''); const success = ref(false)
onMounted(async () => { try { const data = await auth.inspectPasswordReset(token); username.value = data?.username || '' } catch (err) { error.value = err.message } finally { loading.value = false } })
async function submit() { saving.value = true; error.value = ''; try { await auth.resetPassword({ token, password: password.value, password_confirmation: confirmation.value }); success.value = true; setTimeout(() => router.push('/login'), 1200) } catch (err) { error.value = err.message } finally { saving.value = false } }
</script>
<style scoped>
.public-auth-page { min-height:100vh; display:grid; place-items:center; padding:24px; background:var(--background); color:var(--foreground); }.public-auth-card { width:min(100%,480px); padding:32px; border:1px solid var(--border); border-radius:16px; background:var(--card); }.public-auth-card form { display:grid; gap:16px; margin:24px 0; }.public-auth-card label { display:grid; gap:6px; font-weight:600; }.public-auth-card input { padding:11px 12px; border:1px solid var(--border); border-radius:8px; background:var(--background); color:var(--foreground); }.public-auth-card button { padding:12px; border:0; border-radius:8px; background:var(--primary); color:#fff; }.error { color:var(--destructive,#b42318); }.success { color:var(--success,#147d42); }.public-auth-card a { color:var(--primary); }
</style>
