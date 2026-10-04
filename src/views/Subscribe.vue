<template>
  <div class="subscribe-page">
    <header class="subscribe-topbar">
      <router-link to="/" class="subscribe-brand" aria-label="ElyTrack Home">
        <img src="/elytrack-logo.png" alt="ElyTrack Logo" />
        <span><strong>ElyTrack</strong><small>School Operations Platform</small></span>
      </router-link>
      <div class="subscribe-topbar-actions">
        <button
          type="button"
          class="subscribe-theme-btn"
          @click="toggleTheme"
          :title="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
          :aria-label="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
          :aria-pressed="theme === 'dark'"
        >
          <svg v-if="theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </button>
        <router-link to="/login" class="subscribe-signin">Already have an account? Sign in</router-link>
      </div>
    </header>

    <main class="subscribe-layout" :class="{ 'subscribe-layout--submitted': submitted }">
      <!-- STATE 1: REGISTRATION / TRIAL SETUP FORM -->
      <template v-if="!submitted">
        <section class="subscribe-intro">
          <span class="subscribe-kicker">
            {{ Number(selectedPlan?.trial_days || 0) > 0 ? `${selectedPlan.trial_days}-Day Free Trial` : 'Institutional License' }}
          </span>
          <h1>Set up your school workspace.</h1>
          <p>
            Start your evaluation without upfront payment. Your school administrator account and official payment options will be ready immediately after registration.
          </p>
          <div class="subscribe-benefits">
            <div v-for="benefit in benefits" :key="benefit">
              <span class="benefit-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>{{ benefit }}</span>
            </div>
          </div>
          <p class="subscribe-note">
            Official settlement accounts and instant QR codes will unlock immediately once your school workspace details are saved.
          </p>
        </section>

        <section class="subscribe-card">
          <div class="subscribe-card-heading">
            <div>
              <span class="subscribe-card-label">Create Workspace</span>
              <h2>{{ Number(selectedPlan?.trial_days || 0) > 0 ? 'Start your trial' : 'Register workspace' }}</h2>
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
                <input v-model.trim="form.school_name" type="text" required maxlength="255" autocomplete="organization" placeholder="e.g. Baguio Patriotic High School" />
              </label>
              <div class="subscribe-grid">
                <label>
                  DepEd school ID
                  <input v-model.trim="form.school_id" type="text" maxlength="64" placeholder="e.g. 406219" />
                </label>
                <label>
                  School short name
                  <input v-model.trim="form.short" type="text" maxlength="64" placeholder="e.g. BPHS" />
                </label>
              </div>
              <label>
                School address
                <input v-model.trim="form.address" type="text" maxlength="255" autocomplete="street-address" placeholder="e.g. Baguio City, Benguet" />
              </label>

              <legend class="admin-legend">Administrator account</legend>
              <label>
                Full name <span>*</span>
                <input v-model.trim="form.admin_name" type="text" required maxlength="255" autocomplete="name" placeholder="e.g. Principal Maria Santos" />
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
              <span>
                {{ loading ? 'Creating workspace...' : (Number(selectedPlan?.trial_days || 0) > 0 ? `Start ${selectedPlan.trial_days}-Day Free Trial` : 'Create Workspace & View Payment Options') }}
              </span>
              <svg v-if="!loading" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
          <p class="subscribe-terms">By continuing, you create a school workspace and agree to use ElyTrack for authorized educational operations under RA 10173.</p>
        </section>
      </template>

      <!-- STATE 2: UNLOCKED OFFICIAL PAYMENT OPTIONS & WORKSPACE CONFIRMATION -->
      <template v-else>
        <section class="subscribe-success-panel">
          <!-- Workspace Provisioned Confirmation Banner -->
          <div class="success-banner-card">
            <div class="sbc-icon-col">
              <span class="sbc-success-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </div>
            <div class="sbc-body-col">
              <span class="sbc-status-pill">School Workspace Successfully Created</span>
              <h2>Welcome, {{ createdUser?.name || form.admin_name }}!</h2>
              <p>
                Your school administration workspace is active and registered. Your official payment settlement channels and instant QR codes are unlocked below.
              </p>

              <div class="sbc-meta-grid">
                <div class="sbc-meta-item">
                  <span class="sbc-meta-label">School / Institution</span>
                  <strong>{{ createdSchool?.name || form.school_name }}</strong>
                </div>
                <div class="sbc-meta-item">
                  <span class="sbc-meta-label">School ID</span>
                  <strong>{{ createdSchool?.school_id || form.school_id || 'Not specified' }}</strong>
                </div>
                <div class="sbc-meta-item">
                  <span class="sbc-meta-label">Administrator Account</span>
                  <strong>@{{ createdUser?.username || form.admin_username }}</strong>
                </div>
                <div class="sbc-meta-item">
                  <span class="sbc-meta-label">License Reference Code</span>
                  <code class="sbc-ref-code">{{ licenseOrderRef || 'Pending assignment' }}</code>
                </div>
              </div>

              <div class="sbc-actions-row">
                <button type="button" class="sbc-enter-btn" @click="enterWorkspace">
                  <span>Enter School Workspace</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <a
                  :href="'mailto:ely.ashzyl@gmail.com?subject=' + encodeURIComponent('ElyTrack Payment Reference - ' + (createdSchool?.name || form.school_name) + ' [' + licenseOrderRef + ']')"
                  class="sbc-email-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>Email Payment Receipt</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Official School Payment Options & QR Section -->
          <div class="subscribe-payments-container">
            <div class="spc-heading">
              <span class="spc-kicker">Official Settlement Channels</span>
              <h3>Official School Payment Options &amp; Instant QR Codes</h3>
              <p>
                Settle via GCash, Maya, QR Ph, or direct Philippine bank transfer below. Use reference code <code>{{ licenseOrderRef || 'the assigned license reference' }}</code> when remitting.
              </p>
            </div>

            <div v-if="paymentMethods.length === 0" class="spc-empty">
              <p>Payment options are being loaded from the administrative database.</p>
              <button type="button" class="sbc-enter-btn" @click="enterWorkspace">
                <span>Proceed to Workspace</span>
              </button>
            </div>

            <div v-else class="subscribe-payment-grid">
              <div
                v-for="pm in paymentMethods"
                :key="pm.id"
                class="subscribe-payment-card"
                :class="'sp-card--' + pm.type"
              >
                <div class="sp-card-header">
                  <div class="sp-badge-row">
                    <span class="sp-type-badge">{{ formatPaymentType(pm.type) }}</span>
                    <span v-if="pm.qr_image_url" class="sp-qr-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Instant QR Ready
                    </span>
                  </div>
                  <h4 class="sp-bank-name">{{ pm.bank_name }}</h4>
                </div>

                <div class="sp-card-body">
                  <div v-if="pm.qr_image_url" class="sp-qr-box">
                    <div class="sp-qr-thumb-wrap" @click="openQrModal(pm)" title="Click to enlarge QR code">
                      <img :src="pm.qr_image_url" :alt="pm.bank_name + ' QR'" class="sp-qr-thumb" />
                      <div class="sp-qr-overlay">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <span>Enlarge QR</span>
                      </div>
                    </div>
                    <button type="button" class="sp-qr-btn" @click="openQrModal(pm)">
                      <span>Click to Enlarge &amp; Scan</span>
                    </button>
                  </div>

                  <div class="sp-details">
                    <div class="sp-field">
                      <span class="sp-field-label">Account Name</span>
                      <strong class="sp-field-val">{{ pm.account_name || 'Not configured' }}</strong>
                    </div>

                    <div class="sp-field">
                      <span class="sp-field-label">Account / Mobile Number</span>
                      <div class="sp-acc-row">
                        <code class="sp-acc-code">{{ pm.account_number }}</code>
                        <button
                          type="button"
                          class="sp-copy-btn"
                          @click="copyPaymentAccount(pm)"
                          :title="'Copy ' + pm.account_number"
                        >
                          <svg v-if="copiedPaymentId !== pm.id" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>{{ copiedPaymentId === pm.id ? 'Copied' : 'Copy' }}</span>
                        </button>
                      </div>
                    </div>

                    <div v-if="pm.instructions" class="sp-instructions">
                      <span>{{ pm.instructions }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Confirmation & Proceed Banner -->
            <div class="spc-footer-banner">
              <div>
                <strong>Need immediate verification or official receipt?</strong>
                <p>Send your deposit slip, reference number, or transaction screenshot to ely.ashzyl@gmail.com.</p>
              </div>
              <button type="button" class="sbc-enter-btn" @click="enterWorkspace">
                <span>Enter Workspace Now</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- Enlarged QR Code Modal -->
    <div
      v-if="showQrModal && selectedQrMethod"
      class="subscribe-qr-overlay"
      @click.self="closeQrModal"
      role="dialog"
      aria-modal="true"
      :aria-label="selectedQrMethod.bank_name || 'Official Payment QR'"
    >
      <div class="subscribe-qr-modal">
        <button
          type="button"
          class="subscribe-qr-close"
          @click="closeQrModal"
          aria-label="Close QR Modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="sqm-header">
          <span class="sqm-badge">{{ formatPaymentType(selectedQrMethod.type) }}</span>
          <h3 class="sqm-title">{{ selectedQrMethod.bank_name }}</h3>
          <p class="sqm-subtitle">Scan to transfer or settle official license subscription</p>
        </div>

        <div class="sqm-image-box">
          <img :src="selectedQrMethod.qr_image_url" :alt="selectedQrMethod.bank_name + ' QR Code'" class="sqm-image" />
        </div>

        <div class="sqm-details">
          <div class="sqm-row">
            <span class="sqm-label">Account Name:</span>
            <strong>{{ selectedQrMethod.account_name || 'Not configured' }}</strong>
          </div>
          <div class="sqm-row">
            <span class="sqm-label">Account Number:</span>
            <div class="sqm-acc-copy">
              <code>{{ selectedQrMethod.account_number }}</code>
              <button
                type="button"
                class="sqm-copy-btn"
                @click="copyPaymentAccount(selectedQrMethod)"
              >
                <span>{{ copiedPaymentId === selectedQrMethod.id ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
          </div>
          <p v-if="selectedQrMethod.instructions" class="sqm-instructions">
            {{ selectedQrMethod.instructions }}
          </p>
        </div>

        <div class="sqm-footer">
          <a
            :href="'mailto:ely.ashzyl@gmail.com?subject=' + encodeURIComponent('ElyTrack Payment Reference - ' + selectedQrMethod.bank_name + ' [' + licenseOrderRef + ']')"
            class="sqm-action-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Email Payment Receipt</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { theme, toggleTheme } = useTheme()
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

const submitted = ref(false)
const createdSchool = ref(null)
const createdUser = ref(null)
const licenseOrderRef = ref('')

const paymentMethods = ref([])
const copiedPaymentId = ref(null)
const showQrModal = ref(false)
const selectedQrMethod = ref(null)

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

onMounted(() => {
  void loadPlans()
})

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
  } catch {}
}

async function loadPaymentMethods() {
  try {
    const response = await fetch(`/api/payment-methods?_ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (!response.ok) return
    const data = await response.json()
    if (Array.isArray(data)) {
      paymentMethods.value = data
    }
  } catch (err) {
    console.error('Failed to load payment methods:', err)
  }
}

function formatPaymentType(type) {
  switch (type) {
    case 'gcash_qr': return 'GCash'
    case 'maya_qr': return 'Maya'
    case 'qr_ph': return 'QR Ph'
    case 'bank_transfer': return 'Bank Transfer'
    case 'other': return 'Other'
    default: return 'Payment Channel'
  }
}

async function copyPaymentAccount(pm) {
  if (!pm?.account_number) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(pm.account_number)
    } else {
      const input = document.createElement('input')
      input.value = pm.account_number
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    copiedPaymentId.value = pm.id
    setTimeout(() => {
      if (copiedPaymentId.value === pm.id) {
        copiedPaymentId.value = null
      }
    }, 2500)
  } catch (err) {
    console.error('Failed to copy account number:', err)
  }
}

const copyAccount = copyPaymentAccount

function openQrModal(pm) {
  if (!pm?.qr_image_url) return
  selectedQrMethod.value = pm
  showQrModal.value = true
}

function closeQrModal() {
  showQrModal.value = false
  selectedQrMethod.value = null
}

function enterWorkspace() {
  const destination = createdUser.value?.role === 'admin' ? '/admin' : '/teacher'
  router.push(destination)
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

    createdSchool.value = data.school || { name: form.school_name, school_id: form.school_id }
    createdUser.value = data.user
    licenseOrderRef.value = data.license?.license_key || ''

    submitted.value = true
    await loadPaymentMethods()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    errorMessage.value = error.message || 'Unable to start the trial. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.subscribe-page {
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  font-family: 'DM Sans', sans-serif;
}

.subscribe-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px clamp(20px, 5vw, 72px);
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--card) 95%, transparent);
  box-shadow: var(--shadow-sm);
}

.subscribe-topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.subscribe-theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--secondary);
  color: var(--secondary-foreground);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.subscribe-theme-btn:hover {
  border-color: var(--ring);
  background: var(--primary-bg);
  color: var(--primary);
}

.subscribe-theme-btn:focus-visible,
.subscribe-signin:focus-visible,
.subscribe-submit:focus-visible,
.sbc-enter-btn:focus-visible,
.sbc-email-btn:focus-visible,
.sp-qr-btn:focus-visible,
.sp-copy-btn:focus-visible,
.subscribe-qr-close:focus-visible,
.sqm-copy-btn:focus-visible,
.sqm-action-btn:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.subscribe-brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: inherit;
  text-decoration: none;
}

.subscribe-brand img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
}

.subscribe-brand span {
  display: flex;
  flex-direction: column;
}

.subscribe-brand strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subscribe-brand small {
  color: var(--muted-foreground);
  font-size: 0.72rem;
  font-weight: 600;
}

.subscribe-signin {
  color: var(--primary);
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: color 0.12s ease;
}

.subscribe-signin:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

/* Layout */
.subscribe-layout {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: clamp(36px, 6vw, 72px) 0;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(440px, 1.1fr);
  gap: clamp(34px, 6vw, 72px);
  align-items: start;
}

.subscribe-layout--submitted {
  grid-template-columns: 1fr;
  max-width: 960px;
}

.subscribe-intro {
  padding-top: 15px;
}

.subscribe-kicker,
.subscribe-card-label {
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.subscribe-intro h1 {
  margin: 14px 0 16px;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: var(--foreground);
}

.subscribe-intro > p {
  max-width: 480px;
  color: var(--muted-foreground);
  font-size: 0.98rem;
  line-height: 1.65;
}

.subscribe-benefits {
  display: grid;
  gap: 14px;
  margin: 28px 0;
}

.subscribe-benefits > div {
  display: flex;
  gap: 12px;
  align-items: center;
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--foreground);
}

.benefit-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  color: var(--primary);
  background: var(--primary-bg);
  border: 1px solid color-mix(in srgb, var(--primary) 24%, var(--border));
  border-radius: 50%;
}

.subscribe-note {
  font-size: 0.82rem;
  color: var(--muted-foreground);
  line-height: 1.5;
}

/* Card */
.subscribe-card {
  padding: clamp(24px, 4vw, 38px);
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--card);
  box-shadow: var(--shadow-lg);
}

.subscribe-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.subscribe-card h2 {
  margin: 6px 0 0;
  font-family: 'Manrope', sans-serif;
  font-size: 1.7rem;
  letter-spacing: -0.03em;
  color: var(--card-foreground);
}

.plan-chip {
  padding: 6px 12px;
  color: var(--secondary-foreground);
  background: var(--primary-bg);
  border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--border));
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
}

.subscribe-alert {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 9px;
  font-size: 0.86rem;
  line-height: 1.45;
}

.subscribe-alert--error {
  color: var(--destructive);
  background: var(--red-bg);
  border: 1px solid color-mix(in srgb, var(--destructive) 30%, var(--border));
}

.subscribe-alert--success {
  color: var(--success);
  background: var(--success-bg);
  border: 1px solid color-mix(in srgb, var(--success) 30%, var(--border));
}

.subscribe-form fieldset {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  border: 0;
}

.subscribe-form legend {
  width: 100%;
  margin: 4px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
  color: var(--card-foreground);
  font-family: 'Manrope', sans-serif;
  font-size: 0.9rem;
  font-weight: 800;
}

.subscribe-form .admin-legend {
  margin-top: 14px;
}

.subscribe-form label {
  display: grid;
  gap: 6px;
  color: var(--card-foreground);
  font-size: 0.82rem;
  font-weight: 700;
}

.subscribe-form label > span {
  color: var(--destructive);
}

.subscribe-form input {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--input);
  border-radius: 8px;
  background: var(--card);
  color: var(--foreground);
  font: inherit;
  font-size: 0.88rem;
  outline: 0;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.subscribe-form input::placeholder {
  color: var(--muted-foreground);
  opacity: 0.8;
}

.subscribe-form input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 18%, transparent);
}

.subscribe-form label small {
  margin-top: -2px;
  color: var(--muted-foreground);
  font-size: 0.72rem;
  font-weight: 500;
}

.subscribe-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
}

.subscribe-submit {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  padding: 13px 18px;
  border: 0;
  border-radius: 9px;
  background: var(--primary);
  color: var(--primary-foreground);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent);
  transition: background 0.15s ease, transform 0.12s ease;
}

.subscribe-submit:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.subscribe-submit:disabled {
  cursor: wait;
  opacity: 0.7;
}

.subscribe-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: subscribe-spin 0.7s linear infinite;
}

.subscribe-terms {
  margin: 15px 0 0;
  color: var(--muted-foreground);
  font-size: 0.74rem;
  line-height: 1.5;
  text-align: center;
}

@keyframes subscribe-spin {
  to { transform: rotate(360deg); }
}

/* STATE 2: POST-REGISTRATION SUCCESS & PAYMENTS */
.subscribe-success-panel {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.success-banner-card {
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--border));
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 10px 32px color-mix(in srgb, var(--primary) 12%, transparent);
  display: flex;
  gap: 24px;
}

.sbc-icon-col {
  flex-shrink: 0;
}

.sbc-success-circle {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--primary) 35%, transparent);
}

.sbc-body-col {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sbc-status-pill {
  display: inline-block;
  align-self: flex-start;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--success);
  background: var(--success-bg);
  border: 1px solid color-mix(in srgb, var(--success) 30%, var(--border));
  padding: 4px 10px;
  border-radius: 6px;
}

.sbc-body-col h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--card-foreground);
  letter-spacing: -0.03em;
  margin: 0;
}

.sbc-body-col p {
  color: var(--muted-foreground);
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0;
}

.sbc-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px 20px;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-top: 6px;
}

.sbc-meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sbc-meta-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
}

.sbc-meta-item strong {
  overflow-wrap: anywhere;
  font-size: 0.88rem;
  color: var(--card-foreground);
}

.sbc-ref-code {
  font-family: monospace;
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--primary);
  background: var(--primary-bg);
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
}

.sbc-actions-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.sbc-enter-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 9px;
  border: none;
  background: var(--primary);
  color: var(--primary-foreground);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent);
  transition: all 0.15s ease;
}

.sbc-enter-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--primary) 40%, transparent);
}

.sbc-email-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 9px;
  border: 1px solid var(--input);
  background: var(--card);
  color: var(--card-foreground);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
}

.sbc-email-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}

/* Payments Container */
.subscribe-payments-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.spc-heading {
  max-width: 650px;
}

.spc-kicker {
  color: var(--primary);
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.spc-heading h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.02em;
  margin: 6px 0 6px;
}

.spc-heading p {
  color: var(--muted-foreground);
  font-size: 0.86rem;
  line-height: 1.55;
  margin: 0;
}

.spc-heading code {
  font-family: monospace;
  background: var(--muted);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--primary);
  font-weight: 700;
}

.spc-empty {
  text-align: center;
  padding: 40px;
  background: var(--card);
  border: 1px dashed var(--input);
  border-radius: 14px;
  color: var(--muted-foreground);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.subscribe-payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.subscribe-payment-card {
  min-width: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 22px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.subscribe-payment-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
  box-shadow: 0 10px 26px color-mix(in srgb, var(--primary) 14%, transparent);
}

.sp-card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.sp-badge-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.sp-type-badge {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 5px;
  background: var(--muted);
  color: var(--muted-foreground);
}

.sp-qr-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--success);
  background: var(--success-bg);
  border: 1px solid color-mix(in srgb, var(--success) 30%, var(--border));
  padding: 3px 7px;
  border-radius: 999px;
}

.sp-bank-name {
  overflow-wrap: anywhere;
  font-family: 'Manrope', sans-serif;
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--card-foreground);
  margin: 0;
}

.sp-card-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sp-qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: var(--muted);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.sp-qr-thumb-wrap {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 8px;
  background: var(--card);
  padding: 6px;
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  overflow: hidden;
  border: 1px solid var(--border);
}

.sp-qr-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.sp-qr-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--sidebar) 88%, transparent);
  color: var(--sidebar-foreground);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
  font-size: 0.72rem;
  font-weight: 700;
}

.sp-qr-thumb-wrap:hover .sp-qr-overlay {
  opacity: 1;
}

.sp-qr-btn {
  margin-top: 8px;
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  padding: 3px 6px;
}

.sp-qr-btn:hover {
  text-decoration: underline;
}

.sp-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sp-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sp-field-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
}

.sp-field-val {
  overflow-wrap: anywhere;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--card-foreground);
}

.sp-acc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--muted);
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.sp-acc-code {
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: 0.05em;
  word-break: break-all;
}

.sp-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--input);
  background: var(--card);
  color: var(--card-foreground);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.sp-copy-btn:hover {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.sp-instructions {
  font-size: 0.74rem;
  color: var(--muted-foreground);
  line-height: 1.45;
  padding: 8px 10px;
  border-radius: 7px;
  background: var(--muted);
}

.spc-footer-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 28px;
  border-radius: 14px;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  box-shadow: var(--shadow-lg);
  margin-top: 10px;
}

.spc-footer-banner strong {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--sidebar-foreground);
  margin-bottom: 4px;
}

.spc-footer-banner p {
  color: color-mix(in srgb, var(--sidebar-foreground) 68%, transparent);
  font-size: 0.82rem;
  margin: 0;
}

/* Enlarged QR Modal */
.subscribe-qr-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: color-mix(in srgb, var(--sidebar) 78%, transparent);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.subscribe-qr-modal {
  position: relative;
  width: min(100%, 440px);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: var(--popover);
  color: var(--popover-foreground);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 28px;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.subscribe-qr-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--muted);
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s ease;
}

.subscribe-qr-close:hover {
  background: var(--primary);
  color: var(--primary-foreground);
}

.sqm-header {
  text-align: center;
  margin-bottom: 16px;
}

.sqm-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 5px;
  background: var(--primary-bg);
  color: var(--primary);
  border: 1px solid color-mix(in srgb, var(--primary) 30%, var(--border));
  margin-bottom: 6px;
}

.sqm-title {
  overflow-wrap: anywhere;
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--popover-foreground);
  margin: 0 0 4px;
}

.sqm-subtitle {
  color: var(--muted-foreground);
  font-size: 0.78rem;
  margin: 0;
}

.sqm-image-box {
  width: 240px;
  height: 240px;
  border-radius: 12px;
  background: var(--card);
  padding: 10px;
  border: 1px solid var(--input);
  box-shadow: var(--shadow-md);
  margin-bottom: 18px;
}

.sqm-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sqm-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: var(--muted);
  border-radius: 12px;
  border: 1px solid var(--border);
  margin-bottom: 18px;
}

.sqm-row {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.82rem;
}

.sqm-label {
  color: var(--muted-foreground);
  font-weight: 600;
}

.sqm-row strong {
  overflow-wrap: anywhere;
  color: var(--popover-foreground);
  text-align: right;
}

.sqm-acc-copy {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.sqm-acc-copy code {
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--primary);
}

.sqm-copy-btn {
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid var(--input);
  background: var(--card);
  color: var(--card-foreground);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.sqm-copy-btn:hover {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.sqm-instructions {
  font-size: 0.74rem;
  color: var(--muted-foreground);
  margin: 4px 0 0;
  padding-top: 6px;
  border-top: 1px solid var(--border);
}

.sqm-footer {
  width: 100%;
}

.sqm-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 18px;
  border-radius: 9px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.86rem;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.15s ease;
}

.sqm-action-btn:hover {
  background: var(--primary-hover);
}

@media (max-width: 800px) {
  .subscribe-layout {
    grid-template-columns: 1fr;
    padding-top: 30px;
  }
  .subscribe-intro {
    padding-top: 0;
  }
  .sbc-meta-grid {
    grid-template-columns: 1fr 1fr;
  }
  .success-banner-card {
    flex-direction: column;
  }
  .spc-footer-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 520px) {
  .subscribe-topbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .subscribe-topbar-actions {
    width: 100%;
    justify-content: space-between;
  }
  .subscribe-signin {
    font-size: 0.82rem;
  }
  .subscribe-layout {
    width: min(100% - 24px, 620px);
  }
  .subscribe-card {
    padding: 22px 18px;
  }
  .subscribe-grid {
    grid-template-columns: 1fr;
  }
  .subscribe-card-heading {
    flex-direction: column;
  }
  .sbc-meta-grid {
    grid-template-columns: 1fr;
  }
  .sbc-actions-row > * {
    width: 100%;
    justify-content: center;
  }
  .spc-footer-banner .sbc-enter-btn {
    width: 100%;
    justify-content: center;
  }
  .sqm-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .sqm-row strong {
    text-align: left;
  }
  .sqm-acc-copy {
    width: 100%;
    justify-content: space-between;
  }
  .subscribe-qr-modal {
    padding: 22px;
  }
  .sqm-image-box {
    width: min(240px, 70vw);
    height: min(240px, 70vw);
  }
}
</style>
