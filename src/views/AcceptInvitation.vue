<template>
  <div class="public-auth-page">
    <section class="public-auth-card">
      <h1>Complete your ElyTrack account</h1>
      <p v-if="loading">Checking invitation…</p>
      <template v-else-if="invitation">
        <p class="muted">You were invited as {{ invitation.role }}{{ invitation.email ? ` at ${invitation.email}` : '' }}.</p>
        <form @submit.prevent="submit">
          <label>Full name<input v-model="form.name" required autocomplete="name" /></label>
          <label>Username<input v-model="form.username" required autocomplete="username" /></label>
          <label>Password<input v-model="form.password" type="password" required minlength="8" autocomplete="new-password" /></label>
          <label>Confirm password<input v-model="form.password_confirmation" type="password" required minlength="8" autocomplete="new-password" /></label>
          <p v-if="error" class="error">{{ error }}</p>
          <button :disabled="saving">{{ saving ? 'Creating account…' : 'Create account' }}</button>
        </form>
      </template>
      <p v-else class="error">{{ error || 'This invitation is invalid or expired.' }}</p>
      <router-link to="/login">Return to sign in</router-link>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const token = String(route.query.token || '')
const loading = ref(true)
const saving = ref(false)
const invitation = ref(null)
const error = ref('')
const form = reactive({ name: '', username: '', password: '', password_confirmation: '' })

onMounted(async () => {
  try {
    const data = await auth.inspectInvitation(token)
    invitation.value = data?.invitation || null
    if (invitation.value) {
      form.name = invitation.value.name || ''
      form.username = invitation.value.username || ''
    }
  } catch (err) { error.value = err.message }
  finally { loading.value = false }
})

async function submit() {
  saving.value = true
  error.value = ''
  try {
    const data = await auth.acceptInvitation({ token, ...form })
    auth.setUser(data.user)
    router.push(data.user.role === 'superadmin' ? '/schools' : data.user.role === 'admin' ? '/admin' : '/teacher')
  } catch (err) { error.value = err.message }
  finally { saving.value = false }
}
</script>

<style scoped>
.public-auth-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--background); color: var(--foreground); }
.public-auth-card { width: min(100%, 480px); padding: 32px; border: 1px solid var(--border); border-radius: 16px; background: var(--card); box-shadow: 0 16px 40px rgba(0,0,0,.12); }
.public-auth-card h1 { margin: 0 0 8px; }.muted { color: var(--muted-foreground); }
.public-auth-card form { display: grid; gap: 16px; margin: 24px 0; }.public-auth-card label { display: grid; gap: 6px; font-weight: 600; }
.public-auth-card input { padding: 11px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: var(--foreground); }
.public-auth-card button { padding: 12px; border: 0; border-radius: 8px; background: var(--primary); color: white; cursor: pointer; }.public-auth-card button:disabled { opacity: .6; cursor: wait; }
.error { color: var(--destructive, #b42318); }.public-auth-card a { color: var(--primary); }
</style>
