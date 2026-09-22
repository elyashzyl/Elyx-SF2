<template>
  <div class="management-page">
    <div class="page-header">
      <div class="header-left">
        <h2>License &amp; Subscription Management</h2>
        <p class="subtitle">Control institutional seat capacity, DepEd SF2 modules, renewal cycles, and subscription keys.</p>
      </div>
      <div class="header-actions">
        <div v-if="!auth.isSuperadmin" class="read-only-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Read-Only License View</span>
        </div>
        <button v-if="auth.isSuperadmin" class="btn btn-secondary" @click="openIssueModal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Issue License</span>
        </button>
        <button v-if="auth.isSuperadmin" class="btn btn-primary" @click="openActivateModal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Activate License Key</span>
        </button>
      </div>
    </div>

    <!-- Active License Hero Card (For School Admin / Selected School) -->
    <div v-if="activeLicense" class="license-hero-card" :class="[ 'tier--' + activeLicense.plan_tier, { 'is-expired': activeLicense.is_expired } ]">
      <div class="hero-top-row">
        <div class="tier-identity">
          <span class="tier-pill">{{ planTierName(activeLicense.plan_tier) }}</span>
          <span class="status-indicator" :class="'status--' + activeLicense.status">
            <span class="dot"></span>
            <span>{{ activeLicense.status.toUpperCase() }}</span>
          </span>
          <span v-if="activeLicense.is_trial" class="trial-pill">14-Day Free Trial</span>
        </div>

        <div class="license-meta-keys">
          <span class="key-label">Active License Key:</span>
          <code class="license-key-code">{{ activeLicense.license_key }}</code>
          <button type="button" class="copy-key-btn" @click="copyKey(activeLicense.license_key)" title="Copy Key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="hero-metrics-grid">
        <div class="metric-block">
          <span class="metric-title">Validity &amp; Expiry</span>
          <div class="metric-value-row">
            <span class="metric-primary-num">{{ activeLicense.days_remaining }}</span>
            <span class="metric-unit">days left</span>
          </div>
          <small class="metric-foot">Valid until {{ formatDate(activeLicense.expires_at) }}</small>
        </div>

        <div class="metric-block">
          <span class="metric-title">Faculty Advisers Capacity</span>
          <div class="metric-value-row">
            <span class="metric-primary-num">{{ usage.teachers || 0 }}</span>
            <span class="metric-capacity">/ {{ activeLicense.max_teachers }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(100, ((usage.teachers || 0) / activeLicense.max_teachers) * 100) + '%' }"></div>
          </div>
        </div>

        <div class="metric-block">
          <span class="metric-title">Student Population Cap</span>
          <div class="metric-value-row">
            <span class="metric-primary-num">{{ usage.students || 0 }}</span>
            <span class="metric-capacity">/ {{ activeLicense.max_students }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(100, ((usage.students || 0) / activeLicense.max_students) * 100) + '%' }"></div>
          </div>
        </div>

        <div class="metric-block">
          <span class="metric-title">DepEd Module Access</span>
          <div class="modules-chip-list">
            <span class="module-chip" :class="{ enabled: activeLicense.features?.sf2_export }">✓ SF2 Automated</span>
            <span class="module-chip" :class="{ enabled: activeLicense.features?.sardo_radar }">✓ SARDO Radar</span>
            <span class="module-chip" :class="{ enabled: activeLicense.features?.analytics }">✓ Trend Forecaster</span>
            <span class="module-chip" :class="{ enabled: activeLicense.features?.audit_logs }">✓ Audit Telemetry</span>
          </div>
        </div>
      </div>

      <div class="hero-actions-bar">
        <div class="hero-school-name">
          <span class="school-icon">🏫</span>
          <strong>{{ currentSchool?.name || 'School Node' }}</strong>
          <span v-if="currentSchool?.school_id">· DepEd ID: {{ currentSchool.school_id }}</span>
        </div>

        <div v-if="auth.isSuperadmin" class="hero-btns">
          <button v-if="activeLicense.is_trial" class="btn btn-sm btn-secondary" @click="extendTrial">
            <span>Extend 14 Days</span>
          </button>
          <button v-if="activeLicense.status === 'active'" class="btn btn-sm btn-danger" @click="suspendLicense(activeLicense.id)">
            <span>Stop / Suspend License</span>
          </button>
          <button v-if="activeLicense.status === 'suspended'" class="btn btn-sm btn-success" @click="resumeLicense(activeLicense.id)">
            <span>Resume License</span>
          </button>
          <button class="btn btn-sm btn-primary" @click="openRenewModal">
            <span>Renew Subscription (10 Months)</span>
          </button>
        </div>
        <div v-else class="hero-readonly-note">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>License terms, renewals, and key activations are managed centrally by the platform superadmin.</span>
        </div>
      </div>
    </div>

    <!-- Database Subscription Plans Table -->
    <div v-if="auth.isAdmin" class="card" style="margin-top: 24px;">
      <div class="card-header-row">
        <div>
          <h3>Database Subscription Plans &amp; Pricing Tiers</h3>
          <p class="desc">Real-time subscription quotas, pricing, and feature modules directly from the database.</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Plan Tier</th>
              <th>Name</th>
              <th>Monthly Price</th>
              <th>School Year Rate</th>
              <th>Max Teachers</th>
              <th>Max Students</th>
              <th>Trial</th>
              <th v-if="auth.isSuperadmin">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in availablePlans" :key="p.id">
              <td><code>{{ p.tier }}</code></td>
              <td>
                <strong>{{ p.name }}</strong>
                <small v-if="p.tag" style="display: block; color: var(--muted-foreground);">Tag: {{ p.tag }}</small>
              </td>
              <td>₱{{ Number(p.price_monthly || 0).toLocaleString() }} / mo</td>
              <td>
                <strong>₱{{ Number(p.price_annual_monthly || 0).toLocaleString() }} / mo</strong>
                <small style="display: block; color: var(--muted-foreground);">₱{{ Number(p.billing_annual_total || 0).toLocaleString() }} / 10-mo yr</small>
              </td>
              <td>{{ p.max_teachers }}</td>
              <td>{{ p.max_students }}</td>
              <td>{{ p.trial_days }} days</td>
              <td v-if="auth.isSuperadmin">
                <div class="table-actions">
                  <button class="btn-icon" @click="openEditPlanModal(p)" title="Edit Plan Details in Database">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" style="color: var(--destructive);" @click="deletePlan(p)" title="Delete Subscription Plan">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: EDIT PLAN (Superadmin) -->
    <div v-if="auth.isSuperadmin && showEditPlanModal" class="modal-overlay" @click.self="showEditPlanModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Edit Plan (Database): {{ editPlanForm.tier }}</h3>
          <button class="modal-close" @click="showEditPlanModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleSavePlan">
          <div class="modal-body">
            <div class="form-group">
              <label>Plan Name</label>
              <input v-model="editPlanForm.name" type="text" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <input v-model="editPlanForm.description" type="text" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Monthly Price (₱)</label>
                <input v-model.number="editPlanForm.price_monthly" type="number" min="0" required />
              </div>
              <div class="form-group">
                <label>School Year Rate / Month (₱)</label>
                <input v-model.number="editPlanForm.price_annual_monthly" type="number" min="0" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Annual Total (₱)</label>
                <input v-model.number="editPlanForm.billing_annual_total" type="number" min="0" required />
              </div>
              <div class="form-group">
                <label>Trial Days</label>
                <input v-model.number="editPlanForm.trial_days" type="number" min="0" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Max Teachers</label>
                <input v-model.number="editPlanForm.max_teachers" type="number" min="1" required />
              </div>
              <div class="form-group">
                <label>Max Students</label>
                <input v-model.number="editPlanForm.max_students" type="number" min="1" required />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditPlanModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving…' : 'Save Changes to Database' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="auth.isSuperadmin" class="card" style="margin-top: 24px;">
      <div class="card-header-row">
        <div>
          <h3>All Institutional Licenses (Superadmin)</h3>
          <p class="desc">Master directory of deployed campus contracts, active seats, and license expirations.</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>License Key</th>
              <th>Plan Tier</th>
              <th>Status</th>
              <th>Advisers</th>
              <th>Students</th>
              <th>Expires At</th>
              <th>Days Left</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lic in allLicenses" :key="lic.id">
              <td>
                <strong>{{ lic.school_name || 'Unassigned Node' }}</strong>
                <small v-if="lic.school_short" style="display: block; color: var(--muted-foreground);">{{ lic.school_short }}</small>
              </td>
              <td><code>{{ lic.license_key }}</code></td>
              <td>
                <span class="tier-badge" :class="'tier--' + lic.plan_tier">{{ planTierName(lic.plan_tier) }}</span>
              </td>
              <td>
                <span class="status-indicator" :class="'status--' + lic.status">
                  <span class="dot"></span>
                  <span>{{ lic.status }}</span>
                </span>
              </td>
              <td>{{ lic.teacher_count || 0 }} / {{ lic.max_teachers }}</td>
              <td>{{ lic.student_count || 0 }} / {{ lic.max_students }}</td>
              <td>{{ formatDate(lic.expires_at) }}</td>
              <td>
                <span :class="{ 'text-danger': lic.days_remaining <= 15 }">{{ lic.days_remaining }} days</span>
              </td>
              <td>
                <div class="table-actions">
                  <button v-if="lic.status === 'active'" class="btn-icon" style="color: var(--destructive);" @click="suspendLicense(lic.id)" title="Stop / Suspend License">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  </button>
                  <button v-else-if="lic.status === 'suspended'" class="btn-icon" style="color: var(--success);" @click="resumeLicense(lic.id)" title="Resume License">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </button>
                  <button class="btn-icon" @click="editLicense(lic)" title="Modify License">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" @click="quickRenew(lic)" title="Quick Add 10 Months">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                  </button>
                  <button class="btn-icon" style="color: var(--destructive);" @click="deleteLicense(lic)" title="Delete License Permanently">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!allLicenses.length">
              <td colspan="9" style="text-align: center; padding: 32px; color: var(--muted-foreground);">
                No license records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: ACTIVATE LICENSE KEY -->
    <div v-if="auth.isSuperadmin && showActivateModal" class="modal-overlay" @click.self="showActivateModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Activate License Key</h3>
          <button class="modal-close" @click="showActivateModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleActivateKey">
          <div class="modal-body">
            <p style="font-size: 0.85rem; color: var(--muted-foreground); margin-bottom: 16px;">
              Enter the subscription license key provided with your institutional deployment contract or teacher registration receipt.
            </p>
            <div class="form-group">
              <label for="activate-key">License Key *</label>
              <input
                id="activate-key"
                v-model="activateKeyInput"
                type="text"
                placeholder="e.g. ELY-CAMPUS-2026-ABCD"
                required
                style="text-transform: uppercase; font-family: monospace; font-size: 1rem; font-weight: 700;"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showActivateModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Activating…' : 'Activate License' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: ISSUE NEW LICENSE (Superadmin) -->
    <div v-if="auth.isSuperadmin && showIssueModal" class="modal-overlay" @click.self="showIssueModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Issue New School License</h3>
          <button class="modal-close" @click="showIssueModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleIssueLicense">
          <div class="modal-body">
            <div class="form-group">
              <label for="issue-school">Target School *</label>
              <select id="issue-school" v-model="issueForm.school_id" required>
                <option value="" disabled>Select school…</option>
                <option v-for="s in schoolsList" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.short || s.school_id || 'Campus' }})
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="issue-tier">Plan Tier *</label>
                <select id="issue-tier" v-model="issueForm.plan_tier" @change="onTierChange">
                  <option v-for="p in availablePlans" :key="p.tier" :value="p.tier">
                    {{ p.name }} (₱{{ Number(p.price_annual_monthly || 0).toLocaleString() }}/mo)
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="issue-cycle">Billing Cycle</label>
                <select id="issue-cycle" v-model="issueForm.billing_cycle">
                  <option value="annual">School Year (10 Months)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="issue-teachers">Max Teachers/Advisers</label>
                <input id="issue-teachers" v-model.number="issueForm.max_teachers" type="number" min="1" required />
              </div>
              <div class="form-group">
                <label for="issue-students">Max Students</label>
                <input id="issue-students" v-model.number="issueForm.max_students" type="number" min="1" required />
              </div>
            </div>

            <div class="form-group">
              <label for="issue-notes">Contract / DepEd Procurement Notes</label>
              <input id="issue-notes" v-model="issueForm.notes" type="text" placeholder="e.g. MOA Contract Ref # 2026-BPHS-01" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showIssueModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Issuing…' : 'Generate & Issue License' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: RENEW / EXTEND -->
    <div v-if="auth.isSuperadmin && showRenewModal" class="modal-overlay" @click.self="showRenewModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Extend Subscription Term</h3>
          <button class="modal-close" @click="showRenewModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleRenew">
          <div class="modal-body">
            <p style="font-size: 0.85rem; color: var(--muted-foreground); margin-bottom: 16px;">
              Extend this campus's operational validity for another academic term.
            </p>
            <div class="form-group">
              <label for="renew-duration">Extension Period *</label>
              <select id="renew-duration" v-model.number="renewMonths">
                <option :value="10">Full School Year (10 Months)</option>
                <option :value="12">1 Calendar Year (12 Months)</option>
                <option :value="5">1 Semester (5 Months)</option>
                <option :value="1">1 Month Extension</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showRenewModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Extending…' : 'Confirm Renewal' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

const auth = useAuthStore()
const { showSuccess, showError } = useToast()

const activeLicense = ref(null)
const usage = reactive({ teachers: 0, students: 0 })
const currentSchool = ref(null)
const allLicenses = ref([])
const schoolsList = ref([])
const availablePlans = ref([])

const showActivateModal = ref(false)
const activateKeyInput = ref('')
const showIssueModal = ref(false)
const showRenewModal = ref(false)
const renewMonths = ref(10)
const submitting = ref(false)

const showEditPlanModal = ref(false)
const editPlanForm = reactive({
  id: '',
  tier: '',
  name: '',
  description: '',
  price_monthly: 0,
  price_annual_monthly: 0,
  billing_annual_total: 0,
  trial_days: 14,
  max_teachers: 1,
  max_students: 65
})

const issueForm = reactive({
  school_id: '',
  plan_tier: 'campus',
  billing_cycle: 'annual',
  max_teachers: 60,
  max_students: 2500,
  notes: ''
})

function planTierName(tier) {
  const p = availablePlans.value.find(x => x.tier === tier)
  if (p) return p.name
  if (tier === 'adviser') return 'Adviser Dedicated'
  if (tier === 'division') return 'Division Enterprise'
  return 'School Pro Campus'
}

function formatDate(d) {
  if (!d) return '—'
  try {
    const date = new Date(d)
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}

async function copyKey(key) {
  try {
    await navigator.clipboard.writeText(key)
    showSuccess('License key copied to clipboard!')
  } catch {
    showSuccess(`Copied: ${key}`)
  }
}

function onTierChange() {
  const p = availablePlans.value.find(x => x.tier === issueForm.plan_tier)
  if (p) {
    issueForm.max_teachers = p.max_teachers
    issueForm.max_students = p.max_students
  } else {
    if (issueForm.plan_tier === 'adviser') {
      issueForm.max_teachers = 1
      issueForm.max_students = 65
    } else if (issueForm.plan_tier === 'division') {
      issueForm.max_teachers = 500
      issueForm.max_students = 25000
    } else {
      issueForm.max_teachers = 60
      issueForm.max_students = 2500
    }
  }
}

async function loadPlans() {
  try {
    const res = await fetch('/api/licenses/plans')
    if (res.ok) {
      availablePlans.value = await res.json()
      if (availablePlans.value.length > 0 && !issueForm.school_id) {
        onTierChange()
      }
    }
  } catch (err) {
    console.error('Failed to load plans:', err)
  }
}

function openEditPlanModal(plan) {
  if (!auth.isSuperadmin) return
  Object.assign(editPlanForm, {
    id: plan.id,
    tier: plan.tier,
    name: plan.name,
    description: plan.description,
    price_monthly: plan.price_monthly,
    price_annual_monthly: plan.price_annual_monthly,
    billing_annual_total: plan.billing_annual_total,
    trial_days: plan.trial_days,
    max_teachers: plan.max_teachers,
    max_students: plan.max_students
  })
  showEditPlanModal.value = true
}

async function handleSavePlan() {
  if (!auth.isSuperadmin) return
  submitting.value = true
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/licenses/plans/${editPlanForm.id}?${qs}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify(auth.actorParams(editPlanForm))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update plan')
    showSuccess(`Plan "${editPlanForm.name}" updated in database!`)
    showEditPlanModal.value = false
    await loadPlans()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function deletePlan(plan) {
  if (!auth.isSuperadmin) return
  if (!confirm(`Are you sure you want to delete the "${plan.name}" (${plan.tier}) plan? This action cannot be undone.`)) return
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/licenses/plans/${plan.id}?${qs}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete plan')
    showSuccess(`Plan "${plan.name}" deleted successfully!`)
    await loadPlans()
  } catch (err) {
    showError(err.message)
  }
}

async function loadLicenseData() {
  try {
    const res = await fetch('/api/licenses?' + new URLSearchParams(auth.actorParams()))
    const data = await res.json()
    if (Array.isArray(data)) {
      allLicenses.value = data
      if (data.length > 0) {
        activeLicense.value = data[0]
        usage.teachers = data[0].teacher_count || 0
        usage.students = data[0].student_count || 0
      }
    } else {
      activeLicense.value = data.license
      Object.assign(usage, data.usage || {})
      currentSchool.value = data.school
    }
  } catch (err) {
    console.error('Failed to load license data:', err)
  }
}

async function loadSchoolsList() {
  if (!auth.isSuperadmin) return
  try {
    schoolsList.value = (await auth.getSchools()) || []
  } catch {}
}

function openActivateModal() {
  if (!auth.isSuperadmin) return
  activateKeyInput.value = ''
  showActivateModal.value = true
}

function openIssueModal() {
  if (!auth.isSuperadmin) return
  issueForm.school_id = schoolsList.value[0]?.id || ''
  showIssueModal.value = true
}

function openRenewModal() {
  if (!auth.isSuperadmin) return
  showRenewModal.value = true
}

async function handleActivateKey() {
  if (!auth.isSuperadmin) return
  if (!activateKeyInput.value.trim()) return
  submitting.value = true
  try {
    const res = await fetch('/api/licenses/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({
        licenseKey: activateKeyInput.value.trim(),
        schoolId: auth.schoolId
      }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to activate key')
    showSuccess('License successfully activated!')
    showActivateModal.value = false
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function handleIssueLicense() {
  if (!auth.isSuperadmin) return
  submitting.value = true
  try {
    const res = await fetch('/api/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams(issueForm))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to issue license')
    showSuccess(`Issued license ${data.license.license_key}!`)
    showIssueModal.value = false
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function handleRenew() {
  if (!auth.isSuperadmin) return
  submitting.value = true
  try {
    const res = await fetch('/api/licenses/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({
        schoolId: auth.schoolId,
        months: renewMonths.value
      }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Renewal failed')
    showSuccess('Subscription renewed successfully!')
    showRenewModal.value = false
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function extendTrial() {
  if (!auth.isSuperadmin) return
  try {
    const res = await fetch('/api/licenses/start-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({ schoolId: auth.schoolId }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not extend trial')
    showSuccess('14-Day Free Trial extended!')
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

async function suspendLicense(id) {
  if (!auth.isSuperadmin) return
  if (!confirm('Are you sure you want to stop/suspend this license? When suspended, all accounts in this school will be locked out immediately.')) return
  try {
    const res = await fetch(`/api/licenses/${id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams())
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to suspend license')
    showSuccess('License has been suspended. School workspace accounts are now locked.')
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

async function resumeLicense(id) {
  if (!auth.isSuperadmin) return
  try {
    const res = await fetch(`/api/licenses/${id}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams())
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to resume license')
    showSuccess('License has been reactivated. School workspace accounts restored.')
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

async function deleteLicense(lic) {
  if (!auth.isSuperadmin) return
  if (!confirm(`Are you sure you want to PERMANENTLY delete license "${lic.license_key}"? This action cannot be undone.`)) return
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/licenses/${lic.id}?${qs}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete license')
    showSuccess(`License "${lic.license_key}" deleted successfully.`)
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

async function quickRenew(lic) {
  if (!auth.isSuperadmin) return
  try {
    const res = await fetch('/api/licenses/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({ schoolId: lic.school_id, months: 10 }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Renewal failed')
    showSuccess(`Renewed license for ${lic.school_name || 'school'}!`)
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

function editLicense(lic) {
  if (!auth.isSuperadmin) return
  openRenewModal()
}

let licensePollInterval = null

onMounted(async () => {
  await Promise.all([
    loadLicenseData(),
    loadSchoolsList(),
    loadPlans()
  ])
  // Real-time polling every 6 seconds to keep license status and capacity synchronized across tabs/devices
  licensePollInterval = setInterval(() => {
    loadLicenseData()
  }, 6000)
})

onUnmounted(() => {
  if (licensePollInterval) clearInterval(licensePollInterval)
})
</script>

<style scoped>
.license-hero-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.tier-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tier-pill {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--foreground);
}

.trial-pill {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e6f3f4;
  color: #0c5357;
  text-transform: uppercase;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status--active {
  background: var(--success-bg);
  color: var(--success);
}
.status--active .dot { background: var(--success); }

.status--trial {
  background: #e6f3f4;
  color: #0c5357;
}
.status--trial .dot { background: #0c5357; }

.status--expired {
  background: var(--red-bg);
  color: var(--destructive);
}
.status--expired .dot { background: var(--destructive); }

.license-meta-keys {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--secondary);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 8px;
}

.key-label {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.license-key-code {
  font-family: monospace;
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--primary);
}

.copy-key-btn {
  background: transparent;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s ease;
}

.copy-key-btn:hover {
  color: var(--foreground);
}

/* Metrics Grid */
.hero-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 24px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-title {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-primary-num {
  font-family: 'Manrope', sans-serif;
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1;
}

.metric-capacity {
  font-size: 0.95rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.metric-unit {
  font-size: 0.85rem;
  color: var(--primary);
  font-weight: 700;
}

.metric-foot {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--secondary);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.modules-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.module-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--secondary);
  color: var(--muted-foreground);
}

.module-chip.enabled {
  background: #e6f3f4;
  color: #0c5357;
}

/* Actions bar */
.hero-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.hero-school-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
}

.read-only-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.hero-readonly-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--muted-foreground);
  background: var(--muted);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.hero-btns {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tier-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 5px;
  background: var(--secondary);
  color: var(--foreground);
}

.tier--adviser { background: #e6f3f4; color: #0c5357; }
.tier--campus { background: rgba(12, 83, 87, 0.12); color: #0c5357; }
.tier--division { background: #080d0c; color: #ffffff; }

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(8, 13, 12, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 520px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--muted-foreground);
  cursor: pointer;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--secondary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 900px) {
  .hero-metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .hero-metrics-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
