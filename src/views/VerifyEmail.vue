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
      <section class="public-auth-card" aria-labelledby="verify-email-title">
        <div class="public-auth-card-header">
          <span class="public-auth-kicker">Email confirmation</span>
          <h1 id="verify-email-title">Email verification</h1>
        </div>

        <p v-if="loading" class="status-message muted" role="status">Verifying your email…</p>
        <p v-else :class="['status-message', success ? 'success' : 'error']" :role="success ? 'status' : 'alert'">{{ message }}</p>
        <router-link to="/login" class="public-auth-link">Return to sign in</router-link>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()
const route = useRoute(); const auth = useAuthStore(); const loading = ref(true); const success = ref(false); const message = ref('')
onMounted(async () => { try { await auth.verifyEmail(String(route.query.token || '')); success.value = true; message.value = 'Your email has been verified.' } catch (err) { message.value = err.message } finally { loading.value = false } })
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

.status-message {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  font-size: .88rem;
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

.success {
  border-color: color-mix(in srgb, var(--success) 30%, var(--border));
  background: var(--success-bg);
  color: var(--success);
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

.public-auth-brand:focus-visible,
.public-theme-toggle:focus-visible,
.public-auth-link:focus-visible {
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
