<template>
  <div class="auth-page">
    <div class="auth-backdrop auth-backdrop--one"></div>
    <div class="auth-backdrop auth-backdrop--two"></div>

    <!-- Top Navigation Bar -->
    <header class="auth-topbar">
      <router-link to="/" class="auth-brand" aria-label="ElyTrack Home">
        <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="auth-brand-logo" />
        <span class="auth-brand-text">
          <strong>ElyTrack</strong>
          <small>School Operations Platform</small>
        </span>
      </router-link>

      <div class="auth-topbar-actions">
        <button
          type="button"
          class="auth-theme-btn"
          @click="toggleTheme"
          :title="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
          :aria-label="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
        >
          <svg v-if="theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </button>

        <router-link to="/" class="auth-home-link">
          <span>Back to overview</span>
          <span class="auth-link-arrow">↗</span>
        </router-link>
      </div>
    </header>

    <!-- Main Content Layout -->
    <main class="auth-layout">
      <!-- Left Hero & Operations Showcase -->
      <section class="auth-intro">
        <div class="auth-intro-pill">
          <span class="intro-pill-dot"></span>
          <span>DepEd SF2 Automated Operations</span>
        </div>

        <h1 class="auth-intro-title">
          School attendance, <br />
          <em>verified and calm.</em>
        </h1>

        <p class="auth-intro-lede">
          ElyTrack standardizes daily roll call, automates monthly DepEd Form 2 calculations, and flags attendance health risks before they become dropouts.
        </p>

        <!-- Operational Feature Cards -->
        <div class="auth-features-list">
          <div class="auth-feature-item">
            <div class="auth-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div class="auth-feature-content">
              <strong>90-Second Daily Roll Call</strong>
              <p>Advisers record attendance with instant keyboard and touch-first presets.</p>
            </div>
          </div>

          <div class="auth-feature-item">
            <div class="auth-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              </svg>
            </div>
            <div class="auth-feature-content">
              <strong>DepEd SF2 Monthly Automation</strong>
              <p>Zero manual tallying. Accurate ADA, percentage of attendance, and dropout counts.</p>
            </div>
          </div>

          <div class="auth-feature-item">
            <div class="auth-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div class="auth-feature-content">
              <strong>Multi-Role School Security</strong>
              <p>Isolated workspaces for classroom teachers, school administrators, and divisions.</p>
            </div>
          </div>
        </div>

        <!-- Active School Telemetry Badge -->
        <div class="auth-school-badge" v-if="activeSchool.name || activeSchool.school_name">
          <div class="school-badge-header">
            <span class="school-badge-dot"></span>
            <span class="school-badge-label">Active School Node</span>
          </div>
          <div class="school-badge-body">
            <strong>{{ activeSchool.name || activeSchool.school_name }}</strong>
            <small v-if="activeSchool.school_id">DepEd School ID: {{ activeSchool.school_id }} · {{ activeSchool.address || activeSchool.school_address || 'Connected' }}</small>
          </div>
        </div>
      </section>

      <!-- Right Form Card: Dedicated Sign In -->
      <section class="auth-card-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-kicker">Authorized Personnel Portal</div>
            <h2>Sign in to ElyTrack</h2>
            <p>Enter your assigned credentials to access your classroom or school records.</p>
          </div>

          <!-- Provisioning Notice Banner -->
          <div class="provisioning-notice">
            <span class="notice-icon">🛡️</span>
            <div>
              <strong>Institutional Deployment</strong>
              <p>Accounts are provisioned upon school subscription. If you need access, please contact your school administrator.</p>
            </div>
          </div>

          <!-- Quick Demo Credentials Helper -->
          <div class="demo-credentials-box">
            <div class="demo-header">
              <span class="demo-icon">⚡</span>
              <span class="demo-title">Quick Demo Logins:</span>
            </div>
            <div class="demo-chips">
              <button
                type="button"
                class="demo-chip"
                @click="fillDemo('admin', 'ElyTrack2026!')"
                title="Superadmin credentials"
              >
                <span class="demo-role-badge badge-super">Superadmin</span>
                <code>admin</code>
              </button>
              <button
                type="button"
                class="demo-chip"
                @click="fillDemo('msantos', 'teacher123')"
                title="Teacher Ms. Santos (Grade 7 - Pine)"
              >
                <span class="demo-role-badge badge-teacher">Teacher</span>
                <code>msantos</code>
              </button>
              <button
                type="button"
                class="demo-chip"
                @click="fillDemo('jdelacruz', 'teacher123')"
                title="Teacher Mr. Dela Cruz (Grade 8 - Narra)"
              >
                <span class="demo-role-badge badge-teacher">Teacher</span>
                <code>jdelacruz</code>
              </button>
            </div>
          </div>

          <!-- Sign In Form -->
          <form @submit.prevent="handleLogin" class="auth-form" novalidate>
            <div class="form-group">
              <label for="login-username">Username</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  id="login-username"
                  v-model="loginUsername"
                  type="text"
                  required
                  placeholder="e.g. msantos or admin"
                  autocomplete="username"
                  autofocus
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="login-password">Password</label>
                <span class="label-hint">Case sensitive</span>
              </div>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="login-password"
                  v-model="loginPassword"
                  :type="showLoginPassword ? 'text' : 'password'"
                  required
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  :disabled="loading"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showLoginPassword = !showLoginPassword"
                  :aria-label="showLoginPassword ? 'Hide password' : 'Show password'"
                >
                  <svg v-if="showLoginPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.1 4.1M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a10.5 10.5 0 0 0 3.5-.6"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Error Box -->
            <div v-if="loginError" class="auth-alert auth-alert--error" role="alert">
              <span class="alert-icon">!</span>
              <span>{{ loginError }}</span>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="auth-submit-btn" :disabled="loading">
              <span v-if="loading" class="btn-spinner"></span>
              <span>{{ loading ? 'Authenticating…' : 'Sign in to workspace' }}</span>
              <span v-if="!loading" class="btn-arrow">→</span>
            </button>
          </form>

          <div class="auth-card-footnote">
            <span>Need school access or forgot credentials?</span>
            <a href="mailto:deploy@elytrack.ph?subject=ElyTrack%20Access%20Assistance" class="auth-support-link">
              Contact school deployment support
            </a>
          </div>
        </div>
      </section>
    </main>

    <!-- Page Footer -->
    <footer class="auth-footer">
      <span>ElyTrack 2.0 · DepEd Automated School Operations</span>
      <span>Confidential &amp; Verified School System</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

// State
const loading = ref(false)
const theme = ref(localStorage.getItem('theme') || 'light')

// Login fields
const loginUsername = ref('')
const loginPassword = ref('')
const showLoginPassword = ref(false)
const loginError = ref('')

// Active School Info
const activeSchool = reactive({ name: '', school_id: '', address: '', school_name: '', school_address: '' })

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

function fillDemo(username, password) {
  loginUsername.value = username
  loginPassword.value = password
  loginError.value = ''
}

function redirectAfterAuth(role) {
  if (role === 'superadmin') router.push('/schools')
  else if (role === 'admin') router.push('/admin')
  else router.push('/teacher')
}

async function handleLogin() {
  loginError.value = ''
  if (!loginUsername.value || !loginPassword.value) {
    loginError.value = 'Please enter both username and password.'
    return
  }
  loading.value = true
  try {
    const success = await auth.login(loginUsername.value.trim(), loginPassword.value)
    if (success) {
      redirectAfterAuth(auth.user?.role)
    } else {
      loginError.value = 'The username or password you entered is incorrect.'
    }
  } catch (err) {
    loginError.value = err.message || 'Unable to connect to server. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  document.documentElement.setAttribute('data-theme', theme.value)
  try {
    const res = await fetch('/api/settings/school')
    const data = await res.json()
    if (data) Object.assign(activeSchool, data)
  } catch {}
})
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  color: var(--foreground);
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
}

/* Subtle background glowing circles */
.auth-backdrop {
  position: fixed;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.12;
  z-index: 0;
}

.auth-backdrop--one {
  width: 500px;
  height: 500px;
  top: -100px;
  left: -100px;
  background: var(--primary);
}

.auth-backdrop--two {
  width: 600px;
  height: 600px;
  bottom: -150px;
  right: -100px;
  background: var(--accent);
}

/* Top Navigation Bar */
.auth-topbar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px;
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(10px);
  background: rgba(var(--background), 0.85);
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.auth-brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 14px rgba(12, 83, 87, 0.28);
}

.auth-brand-text {
  display: flex;
  flex-direction: column;
}

.auth-brand-text strong {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.08rem;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.auth-brand-text small {
  font-size: 0.72rem;
  color: var(--muted-foreground);
  letter-spacing: -0.01em;
}

.auth-topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-theme-btn:hover {
  background: var(--secondary);
  border-color: var(--ring);
}

.auth-home-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-decoration: none;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.auth-home-link:hover {
  color: var(--foreground);
  background: var(--secondary);
  border-color: var(--border);
}

.auth-link-arrow {
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.auth-home-link:hover .auth-link-arrow {
  transform: translate(2px, -2px);
}

/* Main Layout: Split Screen */
.auth-layout {
  position: relative;
  z-index: 5;
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 32px;
  gap: 64px;
  align-items: center;
}

/* Left Hero Intro */
.auth-intro {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-intro-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--secondary);
  border: 1px solid var(--border);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.intro-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
}

.auth-intro-title {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 2.75rem;
  line-height: 1.12;
  letter-spacing: -0.04em;
  color: var(--foreground);
  margin: 0;
}

.auth-intro-title em {
  font-style: italic;
  font-weight: 600;
  color: var(--primary);
}

.auth-intro-lede {
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--muted-foreground);
  margin: 0;
  max-width: 480px;
}

/* Features list */
.auth-features-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.auth-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.auth-feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--secondary);
  color: var(--primary);
  border: 1px solid var(--border);
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-feature-content strong {
  display: block;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 2px;
}

.auth-feature-content p {
  font-size: 0.82rem;
  color: var(--muted-foreground);
  line-height: 1.4;
  margin: 0;
}

/* Active School Telemetry Badge */
.auth-school-badge {
  margin-top: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.school-badge-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.school-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}

.school-badge-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-foreground);
}

.school-badge-body strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--foreground);
}

.school-badge-body small {
  font-size: 0.78rem;
  color: var(--muted-foreground);
}

/* Right Auth Card Wrapper */
.auth-card-wrapper {
  display: flex;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* Auth Header */
.auth-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-kicker {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary);
}

.auth-header h2 {
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1.65rem;
  letter-spacing: -0.03em;
  margin: 0;
  color: var(--foreground);
}

.auth-header p {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  margin: 0;
  line-height: 1.45;
}

/* Provisioning Notice */
.provisioning-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(48, 75, 57, 0.07);
  border: 1px solid rgba(48, 75, 57, 0.15);
}

.notice-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.provisioning-notice strong {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 2px;
}

.provisioning-notice p {
  font-size: 0.72rem;
  color: var(--muted-foreground);
  line-height: 1.35;
  margin: 0;
}

/* Demo Credentials Box */
.demo-credentials-box {
  background: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.demo-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.demo-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--foreground);
}

.demo-chip:hover {
  background: var(--secondary);
  border-color: var(--primary);
  transform: translateY(-1px);
}

.demo-role-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge-super {
  background: rgba(198, 106, 77, 0.15);
  color: var(--accent);
}

.badge-teacher {
  background: rgba(48, 75, 57, 0.15);
  color: var(--primary);
}

.demo-chip code {
  font-family: monospace;
  font-weight: 600;
}

/* Forms */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--foreground);
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label-hint {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.input-wrap input {
  width: 100%;
  padding: 11px 12px 11px 36px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 9px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  color: var(--foreground);
  transition: all 0.2s ease;
  outline: none;
}

.input-wrap input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(48, 75, 57, 0.12);
}

.input-wrap input::placeholder {
  color: var(--muted-foreground);
  opacity: 0.6;
}

.password-toggle {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.15s ease;
}

.password-toggle:hover {
  color: var(--foreground);
}

/* Alert Box */
.auth-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  line-height: 1.4;
}

.auth-alert--error {
  background: var(--red-bg);
  border: 1px solid rgba(196, 84, 78, 0.3);
  color: var(--destructive);
}

.alert-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--destructive);
  color: #fff;
  font-weight: 800;
  font-size: 0.75rem;
  flex-shrink: 0;
}

/* Submit Button */
.auth-submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(48, 75, 57, 0.25);
}

.auth-submit-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(48, 75, 57, 0.3);
}

.auth-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-arrow {
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.auth-submit-btn:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
}

/* Card Footnote */
.auth-card-footnote {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  margin-top: 4px;
  border-top: 1px solid var(--border);
  padding-top: 14px;
}

.auth-support-link {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  text-decoration: underline;
}

.auth-support-link:hover {
  color: var(--primary-hover);
}

/* Page Footer */
.auth-footer {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  border-top: 1px solid var(--border);
  font-size: 0.76rem;
  color: var(--muted-foreground);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .auth-layout {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 30px 20px;
  }

  .auth-intro {
    text-align: center;
    align-items: center;
  }

  .auth-intro-title {
    font-size: 2.2rem;
  }

  .auth-features-list {
    display: none;
  }

  .auth-school-badge {
    width: 100%;
    max-width: 480px;
  }
}

@media (max-width: 540px) {
  .auth-topbar {
    padding: 14px 18px;
  }

  .auth-card {
    padding: 26px 20px;
    border-radius: 16px;
  }

  .auth-footer {
    flex-direction: column;
    gap: 6px;
    text-align: center;
    padding: 16px;
  }
}
</style>
