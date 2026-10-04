<template>
  <div class="public-auth-page">
    <header class="public-auth-header">
      <router-link to="/" class="public-auth-brand" aria-label="ElyTrack Home">
        <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="public-auth-brand-logo" />
        <span class="public-auth-brand-copy">
          <strong>ElyTrack</strong>
          <small>School Operations Platform</small>
        </span>
      </router-link>

      <button
        type="button"
        class="public-theme-toggle"
        @click="toggleTheme"
        :title="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
        :aria-label="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
      >
        <svg v-if="theme === 'light'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      </button>
    </header>

    <main class="public-auth-main">
      <section class="public-auth-card" aria-labelledby="accept-invitation-title">
        <div class="public-auth-card-header">
          <span class="public-auth-kicker">Invitation access</span>
          <h1 id="accept-invitation-title">Complete your ElyTrack account</h1>
        </div>

        <p v-if="loading" class="status-message muted" role="status">Checking invitation…</p>
        <template v-else-if="invitation">
          <p class="invitation-summary">You were invited as {{ invitation.role }}{{ invitation.email ? ` at ${invitation.email}` : '' }}.</p>
          <form @submit.prevent="submit">
            <label for="invitation-name">
              Full name
              <input id="invitation-name" v-model="form.name" required autocomplete="name" />
            </label>
            <label for="invitation-username">
              Username
              <input id="invitation-username" v-model="form.username" required autocomplete="username" />
            </label>
            <label for="invitation-password">
              Password
              <input id="invitation-password" v-model="form.password" type="password" required minlength="8" autocomplete="new-password" />
            </label>
            <label for="invitation-password-confirmation">
              Confirm password
              <input id="invitation-password-confirmation" v-model="form.password_confirmation" type="password" required minlength="8" autocomplete="new-password" />
            </label>
            <p v-if="error" class="status-message error" role="alert">{{ error }}</p>
            <button type="submit" :disabled="saving">{{ saving ? 'Creating account…' : 'Create account' }}</button>
          </form>
        </template>
        <p v-else class="status-message error" role="alert">{{ error || 'This invitation is invalid or expired.' }}</p>

        <router-link to="/login" class="public-auth-link">Return to sign in</router-link>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()
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
.public-auth-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  background: var(--background);
  color: var(--foreground);
}

.public-auth-page::before {
  content: '';
  position: fixed;
  top: -180px;
  left: -160px;
  z-index: 0;
  width: min(54vw, 560px);
  height: min(54vw, 560px);
  border-radius: 50%;
  background: var(--primary);
  filter: blur(80px);
  opacity: .08;
  pointer-events: none;
}

.public-auth-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px clamp(20px, 5vw, 48px);
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--background) 88%, transparent);
  backdrop-filter: blur(12px);
}

.public-auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.public-auth-brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 14px var(--primary-glow);
}

.public-auth-brand-copy {
  display: flex;
  flex-direction: column;
}

.public-auth-brand-copy strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.08rem;
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1.15;
}

.public-auth-brand-copy small {
  color: var(--muted-foreground);
  font-size: .72rem;
  letter-spacing: -.01em;
}

.public-theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}

.public-theme-toggle:hover {
  border-color: var(--ring);
  background: var(--secondary);
  color: var(--primary);
}

.public-auth-main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: grid;
  place-items: center;
  width: 100%;
  padding: clamp(32px, 7vh, 72px) clamp(20px, 5vw, 48px);
}

.public-auth-card {
  width: min(100%, 480px);
  padding: clamp(24px, 5vw, 36px);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--card);
  box-shadow: var(--shadow-lg);
}

.public-auth-card-header {
  display: grid;
  gap: 8px;
  margin-bottom: 24px;
}

.public-auth-kicker {
  color: var(--primary);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.public-auth-card h1 {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.55rem, 4vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -.035em;
}

.invitation-summary {
  color: var(--muted-foreground);
  line-height: 1.5;
}

.public-auth-card form {
  display: grid;
  gap: 16px;
  margin: 24px 0;
}

.public-auth-card label {
  display: grid;
  gap: 6px;
  color: var(--foreground);
  font-size: .84rem;
  font-weight: 700;
}

.public-auth-card input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--input);
  border-radius: var(--radius-sm);
  outline: none;
  background: var(--card);
  color: var(--foreground);
  transition: border-color .2s ease, box-shadow .2s ease;
}

.public-auth-card input:hover {
  border-color: var(--ring);
}

.public-auth-card input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.public-auth-card button:not(.public-theme-toggle) {
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--primary);
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: var(--primary-foreground);
  font-weight: 800;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, box-shadow .2s ease, transform .2s ease;
  box-shadow: 0 6px 14px var(--primary-glow);
}

.public-auth-card button:not(.public-theme-toggle):hover:not(:disabled) {
  border-color: var(--primary-hover);
  background: var(--primary-hover);
  box-shadow: 0 8px 18px var(--primary-glow);
  transform: translateY(-1px);
}

.public-auth-card button:disabled {
  cursor: wait;
  opacity: .6;
  box-shadow: none;
}

.public-auth-link {
  display: inline-flex;
  margin-top: 24px;
  color: var(--primary);
  font-size: .84rem;
  font-weight: 700;
  text-decoration: none;
}

.public-auth-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.status-message {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  font-size: .84rem;
  line-height: 1.45;
}

.muted {
  border-color: var(--border);
  background: var(--secondary);
  color: var(--muted-foreground);
}

.error {
  border-color: color-mix(in srgb, var(--destructive) 30%, var(--border));
  background: var(--red-bg);
  color: var(--destructive);
}

.public-auth-brand:focus-visible,
.public-theme-toggle:focus-visible,
.public-auth-link:focus-visible,
.public-auth-card button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--ring) 35%, transparent);
  outline-offset: 2px;
}

@media (max-width: 540px) {
  .public-auth-header {
    padding: 14px 18px;
  }

  .public-auth-main {
    padding: 32px 18px;
  }

  .public-auth-card {
    padding: 26px 20px;
  }
}

@media (max-width: 420px) {
  .public-auth-brand-copy small {
    display: none;
  }
}
</style>
