<template>
  <div class="subscribe-page">
    <header class="subscribe-topbar">
      <router-link to="/" class="subscribe-brand" aria-label="ElyTrack Home">
        <img src="/elytrack-logo.png" alt="ElyTrack Logo" />
        <span><strong>ElyTrack</strong><small>School Operations Platform</small></span>
      </router-link>
      <router-link to="/login" class="subscribe-signin">Already have an account? Sign in</router-link>
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
                  <code class="sbc-ref-code">{{ licenseOrderRef }}</code>
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
                Settle via GCash, Maya, QR Ph, or direct Philippine bank transfer below. Use reference code <code>{{ licenseOrderRef }}</code> when remitting.
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
  void loadPaymentMethods()
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
    licenseOrderRef.value = data.license?.license_key || ('ELY-' + Math.random().toString(36).substring(2, 8).toUpperCase())

    submitted.value = true
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
  background: #f8fafc;
  color: #0f172a;
  font-family: 'DM Sans', sans-serif;
}

.subscribe-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px clamp(20px, 5vw, 72px);
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
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
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 600;
}

.subscribe-signin {
  color: #0d9488;
  font-weight: 700;
  font-size: 0.88rem;
  text-decoration: none;
  transition: color 0.12s ease;
}

.subscribe-signin:hover {
  color: #0f766e;
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
  color: #0d9488;
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
  color: #0f172a;
}

.subscribe-intro > p {
  max-width: 480px;
  color: #475569;
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
  color: #1e293b;
}

.benefit-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  color: #0d9488;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  border-radius: 50%;
}

.subscribe-note {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.5;
}

/* Card */
.subscribe-card {
  padding: clamp(24px, 4vw, 38px);
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 32px rgba(15, 23, 42, 0.05);
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
  color: #0f172a;
}

.plan-chip {
  padding: 6px 12px;
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
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
  color: #e11d48;
  background: #ffe4e6;
  border: 1px solid #fecdd3;
}

.subscribe-alert--success {
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
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
  border-bottom: 1px solid #f1f5f9;
  color: #0f172a;
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
  color: #1e293b;
  font-size: 0.82rem;
  font-weight: 700;
}

.subscribe-form label > span {
  color: #e11d48;
}

.subscribe-form input {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-size: 0.88rem;
  outline: 0;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.subscribe-form input:focus {
  border-color: #0d9488;
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}

.subscribe-form label small {
  margin-top: -2px;
  color: #64748b;
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
  background: #0d9488;
  color: #ffffff;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);
  transition: background 0.15s ease, transform 0.12s ease;
}

.subscribe-submit:hover:not(:disabled) {
  background: #0f766e;
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
  color: #64748b;
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
  background: #ffffff;
  border: 1px solid #99f6e4;
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 10px 32px rgba(13, 148, 136, 0.08);
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
  background: #0d9488;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(13, 148, 136, 0.35);
}

.sbc-body-col {
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
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  padding: 4px 10px;
  border-radius: 6px;
}

.sbc-body-col h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.7rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 0;
}

.sbc-body-col p {
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0;
}

.sbc-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
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
  color: #64748b;
}

.sbc-meta-item strong {
  font-size: 0.88rem;
  color: #0f172a;
}

.sbc-ref-code {
  font-family: monospace;
  font-size: 0.92rem;
  font-weight: 800;
  color: #0d9488;
  background: #ccfbf1;
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
  background: #0d9488;
  color: #ffffff;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);
  transition: all 0.15s ease;
}

.sbc-enter-btn:hover {
  background: #0f766e;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(13, 148, 136, 0.4);
}

.sbc-email-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 9px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
}

.sbc-email-btn:hover {
  border-color: #0d9488;
  color: #0d9488;
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
  color: #0d9488;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.spc-heading h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 6px 0 6px;
}

.spc-heading p {
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.55;
  margin: 0;
}

.spc-heading code {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #0d9488;
  font-weight: 700;
}

.spc-empty {
  text-align: center;
  padding: 40px;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  color: #64748b;
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.subscribe-payment-card:hover {
  transform: translateY(-3px);
  border-color: #0d9488;
  box-shadow: 0 10px 26px rgba(13, 148, 136, 0.1);
}

.sp-card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.sp-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sp-type-badge {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 5px;
  background: #f1f5f9;
  color: #475569;
}

.sp-qr-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  padding: 3px 7px;
  border-radius: 999px;
}

.sp-bank-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.12rem;
  font-weight: 800;
  color: #0f172a;
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
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.sp-qr-thumb-wrap {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 8px;
  background: #ffffff;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  overflow: hidden;
  border: 1px solid #e2e8f0;
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
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
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
  color: #0d9488;
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
  color: #64748b;
}

.sp-field-val {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
}

.sp-acc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: #f8fafc;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.sp-acc-code {
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0d9488;
  letter-spacing: 0.05em;
  word-break: break-all;
}

.sp-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.sp-copy-btn:hover {
  background: #0d9488;
  color: #ffffff;
  border-color: #0d9488;
}

.sp-instructions {
  font-size: 0.74rem;
  color: #475569;
  line-height: 1.45;
  padding: 8px 10px;
  border-radius: 7px;
  background: #f1f5f9;
}

.spc-footer-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 28px;
  border-radius: 14px;
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
  margin-top: 10px;
}

.spc-footer-banner strong {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 0.98rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 4px;
}

.spc-footer-banner p {
  color: #94a3b8;
  font-size: 0.82rem;
  margin: 0;
}

/* Enlarged QR Modal */
.subscribe-qr-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.subscribe-qr-modal {
  position: relative;
  width: min(100%, 440px);
  background: #ffffff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
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
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s ease;
}

.subscribe-qr-close:hover {
  background: #0f172a;
  color: #ffffff;
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
  background: #f0fdfa;
  color: #0f766e;
  border: 1px solid #ccfbf1;
  margin-bottom: 6px;
}

.sqm-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
}

.sqm-subtitle {
  color: #64748b;
  font-size: 0.78rem;
  margin: 0;
}

.sqm-image-box {
  width: 240px;
  height: 240px;
  border-radius: 12px;
  background: #ffffff;
  padding: 10px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
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
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 18px;
}

.sqm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.82rem;
}

.sqm-label {
  color: #64748b;
  font-weight: 600;
}

.sqm-row strong {
  color: #0f172a;
}

.sqm-acc-copy {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sqm-acc-copy code {
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0d9488;
}

.sqm-copy-btn {
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.sqm-copy-btn:hover {
  background: #0d9488;
  color: #ffffff;
  border-color: #0d9488;
}

.sqm-instructions {
  font-size: 0.74rem;
  color: #64748b;
  margin: 4px 0 0;
  padding-top: 6px;
  border-top: 1px solid #e2e8f0;
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
  background: #0d9488;
  color: #ffffff;
  font-size: 0.86rem;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.15s ease;
}

.sqm-action-btn:hover {
  background: #0f766e;
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
}
</style>
