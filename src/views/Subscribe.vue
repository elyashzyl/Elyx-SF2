<template>
  <div class="subscribe-page">
    <header class="subscribe-topbar">
      <router-link to="/" class="subscribe-brand" aria-label="ElyTrack Home">
        <img src="/elytrack-logo.png" alt="ElyTrack Logo" />
        <span><strong>ElyTrack</strong><small>School Operations Platform</small></span>
      </router-link>
      <router-link to="/login" class="subscribe-signin">Already have an account? Sign in</router-link>
    </header>

    <main class="subscribe-layout">
      <section class="subscribe-intro">
        <span class="subscribe-kicker">{{ selectedPlan?.trial_days || 0 }}-Day Free Trial</span>
        <h1>Set up your school workspace.</h1>
        <p>Start your trial without payment. Your school administrator account will be ready immediately after setup.</p>
        <div class="subscribe-benefits">
          <div v-for="benefit in benefits" :key="benefit">
            <span class="benefit-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <span>{{ benefit }}</span>
          </div>
        </div>
        <p class="subscribe-note">No payment details are requested for the free trial. Payment channels are available in the workspace before renewal.</p>
      </section>

      <section class="subscribe-card">
        <div class="subscribe-card-heading">
          <div>
            <span class="subscribe-card-label">Create workspace</span>
            <h2>Start your trial</h2>
          </div>
          <span class="plan-chip">{{ selectedPlan?.name || 'Selected plan' }}</span>
        </div>

        <div v-if="errorMessage" class="subscribe-alert subscribe-alert--error" role="alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="subscribe-alert subscribe-alert--success" role="status">{{ successMessage }}</div>

        <form class="subscribe-form" @submit.prevent="submitTrial" novalidate>
          <fieldset :disabled="loading">
            <legend>School information</legend>
            <label>
              School name <span>*</span>
              <input v-model.trim="form.school_name" type="text" required maxlength="255" autocomplete="organization" placeholder="Example Elementary School" />
            </label>
            <div class="subscribe-grid">
              <label>
                DepEd school ID
                <input v-model.trim="form.school_id" type="text" maxlength="64" placeholder="Optional" />
              </label>
              <label>
                School short name
                <input v-model.trim="form.short" type="text" maxlength="64" placeholder="Optional" />
              </label>
            </div>
            <label>
              School address
              <input v-model.trim="form.address" type="text" maxlength="255" autocomplete="street-address" placeholder="Municipality, province" />
            </label>

            <legend class="admin-legend">Administrator account</legend>
            <label>
              Full name <span>*</span>
              <input v-model.trim="form.admin_name" type="text" required maxlength="255" autocomplete="name" placeholder="School administrator" />
            </label>
            <label>
              Username <span>*</span>
              <input v-model.trim="form.admin_username" type="text" required minlength="3" maxlength="255" pattern="[A-Za-z0-9._-]+" autocomplete="username" placeholder="Choose a username" />
              <small>Use 3 or more letters, numbers, dots, underscores, or hyphens.</small>
            </label>
            <div class="subscribe-grid">
              <label>
                Password <span>*</span>
                <input v-model="form.admin_password" type="password" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters" />
              </label>
              <label>
                Confirm password <span>*</span>
                <input v-model="form.admin_password_confirmation" type="password" required minlength="8" autocomplete="new-password" placeholder="Repeat password" />
              </label>
            </div>
          </fieldset>

          <button class="subscribe-submit" type="submit" :disabled="loading">
            <span v-if="loading" class="subscribe-spinner" aria-hidden="true"></span>
            <span>{{ loading ? 'Creating workspace...' : 'Start free trial' }}</span>
            <svg v-if="!loading" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </form>
        <p class="subscribe-terms">By continuing, you create a school workspace and agree to use ElyTrack for authorized school operations.</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const plans = ref([])
const form = reactive({
  plan_tier: String(route.query.plan || '').trim().toLowerCase(),
  school_name: '',
  school_id: '',
  address: '',
  short: '',
  admin_name: '',
  admin_username: '',
  admin_password: '',
  admin_password_confirmation: ''
})

const selectedPlan = computed(() => plans.value.find(plan => plan.tier === form.plan_tier || plan.id === form.plan_tier) || {
  name: 'Selected plan',
  trial_days: 0,
  modules: {}
})
const benefits = computed(() => {
  const features = selectedPlan.value?.features
  if (Array.isArray(features) && features.length) return features.slice(0, 4)
  return []
})

onMounted(loadPlans)

async function loadPlans() {
  try {
    const response = await fetch('/api/licenses/plans', { cache: 'no-store' })
    if (!response.ok) return
    const data = await response.json()
    if (Array.isArray(data)) {
      plans.value = data
      const hasPlan = data.some(plan => plan.tier === form.plan_tier || plan.id === form.plan_tier)
      if (!hasPlan && data.length) form.plan_tier = data[0].tier || data[0].id
    }
  } catch {
    // The server validates the plan again when the form is submitted.
  }
}

async function submitTrial() {
  errorMessage.value = ''
  successMessage.value = ''
  if (form.admin_password !== form.admin_password_confirmation) {
    errorMessage.value = 'Passwords do not match.'
    return
  }
  if (!selectedPlan.value?.tier && !selectedPlan.value?.id) {
    errorMessage.value = 'No subscription plan is available. Ask a superadmin to configure a plan first.'
    return
  }
  if (form.admin_password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }
  loading.value = true
  try {
    const response = await fetch('/api/auth/trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Unable to start the trial.')
    auth.setUser(data.user)
    successMessage.value = `Workspace created. Your ${data.trial_days || selectedPlan.value.trial_days}-day trial is active.`
    const destination = data.user?.role === 'admin' ? '/admin' : '/teacher'
    setTimeout(() => router.push(destination), 700)
  } catch (error) {
    errorMessage.value = error.message || 'Unable to start the trial. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.subscribe-page { min-height: 100vh; background: var(--background); color: var(--foreground); font-family: 'DM Sans', sans-serif; }
.subscribe-topbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px clamp(20px, 5vw, 72px); border-bottom: 1px solid var(--border); background: var(--card); }
.subscribe-brand { display: inline-flex; align-items: center; gap: 11px; color: inherit; text-decoration: none; }
.subscribe-brand img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.subscribe-brand span { display: flex; flex-direction: column; }
.subscribe-brand strong { font-family: 'Manrope', sans-serif; font-size: 1.1rem; }
.subscribe-brand small { color: var(--muted-foreground); font-size: .72rem; }
.subscribe-signin { color: var(--primary); font-weight: 700; font-size: .9rem; text-decoration: none; }
.subscribe-layout { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: clamp(42px, 8vw, 92px) 0; display: grid; grid-template-columns: minmax(0, .9fr) minmax(440px, 1.1fr); gap: clamp(34px, 7vw, 90px); align-items: start; }
.subscribe-intro { padding-top: 25px; }
.subscribe-kicker, .subscribe-card-label { color: var(--accent); font-size: .76rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.subscribe-intro h1 { margin: 16px 0 18px; font-family: 'Manrope', sans-serif; font-size: clamp(2.25rem, 5vw, 4.5rem); line-height: 1.03; letter-spacing: -.055em; }
.subscribe-intro > p { max-width: 510px; color: var(--muted-foreground); font-size: 1.08rem; line-height: 1.75; }
.subscribe-benefits { display: grid; gap: 14px; margin: 34px 0; }
.subscribe-benefits > div { display: flex; gap: 11px; align-items: center; font-weight: 600; }
.benefit-icon { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; flex: 0 0 26px; color: var(--primary); background: var(--primary-bg); border-radius: 50%; }
.subscribe-note { font-size: .9rem !important; }
.subscribe-card { padding: clamp(24px, 4vw, 40px); border: 1px solid var(--border); border-radius: 20px; background: var(--card); box-shadow: var(--shadow-lg); }
.subscribe-card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 26px; }
.subscribe-card h2 { margin: 7px 0 0; font-family: 'Manrope', sans-serif; font-size: 1.9rem; letter-spacing: -.035em; }
.plan-chip { max-width: 155px; padding: 8px 11px; color: var(--secondary-foreground); background: var(--secondary); border-radius: 999px; font-size: .76rem; font-weight: 800; text-align: center; }
.subscribe-alert { margin-bottom: 18px; padding: 12px 14px; border-radius: 9px; font-size: .9rem; line-height: 1.45; }
.subscribe-alert--error { color: var(--destructive); background: var(--red-bg); }
.subscribe-alert--success { color: var(--success); background: var(--success-bg); }
.subscribe-form fieldset { display: grid; gap: 15px; margin: 0; padding: 0; border: 0; }
.subscribe-form legend { width: 100%; margin: 5px 0 1px; padding-bottom: 8px; border-bottom: 1px solid var(--border); color: var(--foreground); font-weight: 800; }
.subscribe-form .admin-legend { margin-top: 13px; }
.subscribe-form label { display: grid; gap: 7px; color: var(--foreground); font-size: .86rem; font-weight: 700; }
.subscribe-form label > span { color: var(--accent); }
.subscribe-form input { width: 100%; padding: 12px 13px; border: 1px solid var(--input); border-radius: 8px; background: var(--background); color: var(--foreground); font: inherit; outline: 0; }
.subscribe-form input:focus { border-color: var(--ring); box-shadow: 0 0 0 3px var(--primary-bg); }
.subscribe-form label small { margin-top: -2px; color: var(--muted-foreground); font-size: .73rem; font-weight: 500; }
.subscribe-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.subscribe-submit { display: inline-flex; width: 100%; align-items: center; justify-content: center; gap: 10px; margin-top: 23px; padding: 14px 18px; border: 0; border-radius: 9px; background: var(--primary); color: var(--primary-foreground); font: inherit; font-weight: 800; cursor: pointer; }
.subscribe-submit:disabled { cursor: wait; opacity: .7; }
.subscribe-spinner { width: 15px; height: 15px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: subscribe-spin .7s linear infinite; }
.subscribe-terms { margin: 15px 0 0; color: var(--muted-foreground); font-size: .74rem; line-height: 1.5; text-align: center; }
@keyframes subscribe-spin { to { transform: rotate(360deg); } }
@media (max-width: 800px) { .subscribe-layout { grid-template-columns: 1fr; padding-top: 34px; } .subscribe-intro { padding-top: 0; } }
@media (max-width: 520px) { .subscribe-topbar { align-items: flex-start; flex-direction: column; } .subscribe-signin { font-size: .82rem; } .subscribe-layout { width: min(100% - 24px, 620px); } .subscribe-card { padding: 22px 17px; } .subscribe-grid { grid-template-columns: 1fr; } .subscribe-card-heading { flex-direction: column; } }
</style>
