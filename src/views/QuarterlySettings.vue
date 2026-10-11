<template>
  <div class="management-page quarterly-settings-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <div class="breadcrumb">
          <span>Academic Configuration</span>
          <span class="sep">/</span>
          <span class="current">Quarterly Terms</span>
        </div>
        <h1 class="page-title">Quarterly Terms &amp; Grading Periods</h1>
        <p class="page-subtitle">
          Configure academic quarters, reporting months, date ranges, and official grading period milestones for DepEd Form 2 summaries and Form 138 report cards.
        </p>
      </div>
      <div class="page-header-actions">
        <!-- Superadmin Multi-School Switcher -->
        <div v-if="auth.isSuperadmin && schoolsList.length > 1" class="school-picker-wrap">
          <svg class="school-picker-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
          </svg>
          <select 
            v-model="selectedSchoolId" 
            @change="onSchoolChange" 
            class="school-picker-select"
            aria-label="Select School Scope"
          >
            <option value="">Global / All Schools</option>
            <option v-for="s in schoolsList" :key="s.id" :value="s.id">{{ s.short || s.name }}</option>
          </select>
        </div>

        <button v-if="auth.isAdmin" @click="resetToDefaults" type="button" class="btn-secondary" :disabled="saving">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          <span>Reset to Defaults</span>
        </button>

        <button v-if="auth.isAdmin" @click="saveQuarters" type="button" class="btn-primary" :disabled="saving">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>{{ saving ? 'Saving…' : 'Save Quarters' }}</span>
        </button>
      </div>
    </div>

    <!-- Alert / Status Banner -->
    <transition name="fade">
      <div v-if="successMsg" class="alert-banner alert-banner--success">
        <div class="alert-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{{ successMsg }}</span>
        </div>
        <button @click="successMsg = ''" type="button" class="close-alert-btn" title="Dismiss">&times;</button>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorMsg" class="alert-banner alert-banner--danger">
        <div class="alert-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ errorMsg }}</span>
        </div>
        <button @click="errorMsg = ''" type="button" class="close-alert-btn" title="Dismiss">&times;</button>
      </div>
    </transition>

    <!-- Scope & School Year Control Bar -->
    <div class="card scope-control-bar">
      <div class="scope-info-group">
        <div class="scope-field">
          <label class="scope-label">School Year</label>
          <div class="select-with-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <select v-model="selectedSchoolYear" @change="loadQuarters" class="sy-select">
              <option v-for="sy in schoolYearOptions" :key="sy" :value="sy">{{ sy }}</option>
            </select>
          </div>
        </div>

        <div class="scope-field">
          <label class="scope-label">Term Structure</label>
          <div class="select-with-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <select v-model.number="selectedQuarterCount" @change="onQuarterCountChange" class="sy-select">
              <option :value="4">4 Quarters (Standard DepEd)</option>
              <option :value="3">3 Quarters (Trimester)</option>
            </select>
          </div>
        </div>

        <div class="scope-status">
          <span v-if="isCustomConfig" class="badge-custom-pill">
            <span class="status-dot-active"></span>
            Custom Configuration Active
          </span>
          <span v-else class="badge-default-pill">
            <span class="status-dot-neutral"></span>
            Using Standard DepEd Defaults
          </span>
        </div>
      </div>

      <div class="scope-quick-links">
        <router-link to="/reports?tab=quarterly" class="btn-xs btn-secondary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>Quarterly Reports</span>
        </router-link>
        <router-link to="/schedule" class="btn-xs btn-secondary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>School Calendar</span>
        </router-link>
      </div>
    </div>

    <!-- Section 1: Quarters Q1 - Q4 Configuration Cards -->
    <div class="quarters-grid">
      <div 
        v-for="q in quarters" 
        :key="q.quarter_number" 
        class="card quarter-card"
        :class="{ 'quarter-card--inactive': q.is_active === 0 }"
      >
        <div class="quarter-card-header">
          <div class="quarter-badge" :class="{ 'quarter-badge--disabled': q.is_active === 0 }">
            <span>Q{{ q.quarter_number }}</span>
          </div>
          <div class="quarter-header-info">
            <input 
              v-model="q.quarter_name" 
              type="text" 
              class="quarter-title-input" 
              placeholder="e.g. 1st Quarter"
              :disabled="!auth.isAdmin"
              required
            />
            <small class="quarter-sy-tag">SY {{ selectedSchoolYear }} · Quarter {{ q.quarter_number }}</small>
          </div>
          <label v-if="auth.isAdmin" class="toggle-active-label" title="Enable or disable this quarter">
            <input type="checkbox" v-model="q.is_active" :true-value="1" :false-value="0" class="toggle-checkbox" />
            <span class="active-badge" :class="q.is_active ? 'active-badge--on' : 'active-badge--off'">
              {{ q.is_active ? 'Active' : 'Disabled' }}
            </span>
          </label>
        </div>

        <div v-if="q.quarter_number === 4 && selectedQuarterCount === 3" class="quarter-trimester-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Disabled by 3-Quarter (Trimester) calendar configuration.</span>
        </div>

        <div class="quarter-card-body">
          <!-- Reporting Months Selector -->
          <div class="form-group months-selection-group">
            <div class="months-label-row">
              <label class="form-label">Reporting Months Included</label>
              <small class="helper-text">Consolidated in SF2 attendance</small>
            </div>
            <div class="months-pills-wrap">
              <button
                v-for="m in allMonths"
                :key="m.num"
                type="button"
                class="month-pill-btn"
                :class="{ 'active': (q.months || []).includes(m.num) }"
                :disabled="!auth.isAdmin || q.is_active === 0"
                @click="toggleMonth(q, m.num)"
              >
                {{ m.short }}
              </button>
            </div>
            <div class="selected-months-summary">
              <span v-if="(q.months || []).length" class="months-list-text">
                <span class="summary-label">Included:</span> {{ formatMonthsList(q.months) }}
              </span>
              <span v-else class="text-danger months-warning">
                Please select at least one reporting month for this quarter.
              </span>
            </div>
          </div>

          <!-- Date Range & Target School Days -->
          <div class="date-range-grid">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <DatePicker v-model="q.start_date" :disabled="!auth.isAdmin || q.is_active === 0" full-width />
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <DatePicker v-model="q.end_date" :disabled="!auth.isAdmin || q.is_active === 0" full-width />
            </div>
            <div class="form-group">
              <label class="form-label">Target School Days</label>
              <input v-model.number="q.target_days" type="number" min="1" max="100" class="form-input text-center" :disabled="!auth.isAdmin || q.is_active === 0" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Important Dates & Grading Milestones -->
    <div class="card milestones-section">
      <div class="card-box-header">
        <div>
          <h2 class="milestones-title">Important Dates &amp; Grading Milestones</h2>
          <p class="milestones-subtitle">
            Schedule examinations, card distributions, PTC meetings, and report submission deadlines across all grading periods.
          </p>
        </div>
        <div>
          <button v-if="auth.isAdmin" @click="openEventModal()" type="button" class="btn-xs btn-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Milestone Event</span>
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="overview-table">
          <thead>
            <tr>
              <th class="col-event">Event / Activity</th>
              <th class="col-period">1st Grading</th>
              <th class="col-period">2nd Grading</th>
              <th class="col-period">3rd Grading</th>
              <th v-if="selectedQuarterCount !== 3" class="col-period">4th Grading</th>
              <th v-if="auth.isAdmin" class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody v-if="events.length">
            <tr v-for="ev in events" :key="ev.id">
              <td class="col-event">
                <div class="event-title-wrap">
                  <svg class="event-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <strong class="event-name">{{ ev.event_name }}</strong>
                </div>
              </td>
              <td class="col-period">
                <span :class="ev.first_grading ? 'event-date' : 'event-empty'">{{ ev.first_grading || '—' }}</span>
              </td>
              <td class="col-period">
                <span :class="ev.second_grading ? 'event-date' : 'event-empty'">{{ ev.second_grading || '—' }}</span>
              </td>
              <td class="col-period">
                <span :class="ev.third_grading ? 'event-date' : 'event-empty'">{{ ev.third_grading || '—' }}</span>
              </td>
              <td v-if="selectedQuarterCount !== 3" class="col-period">
                <span :class="ev.fourth_grading ? 'event-date' : 'event-empty'">{{ ev.fourth_grading || '—' }}</span>
              </td>
              <td v-if="auth.isAdmin" class="col-actions">
                <div class="milestone-actions">
                  <button @click="openEventModal(ev)" type="button" class="btn-xs btn-secondary" title="Edit milestone">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button @click="deleteEvent(ev.id)" type="button" class="btn-xs btn-danger" title="Delete milestone">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="selectedQuarterCount === 3 ? 5 : 6" class="empty-cell">
                <div class="empty-state-box">
                  <div class="empty-icon-box">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <h4>No quarterly events or milestones recorded yet</h4>
                  <p>Add official examination dates, card distribution schedules, or PTC meetings.</p>
                  <button @click="openEventModal()" type="button" class="btn-xs btn-primary">
                    + Add Milestone Event
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Add / Edit Milestone Event -->
    <div v-if="showEventModal" class="modal-overlay" @click.self="showEventModal = false">
      <div class="card modal-card">
        <div class="modal-header">
          <div class="modal-header-text">
            <h3>{{ editingEventId ? 'Edit Milestone Event' : 'Add Milestone Event' }}</h3>
            <p class="modal-subtext">Record key dates for periodic grading exams, card distributions, and faculty milestones.</p>
          </div>
          <button @click="showEventModal = false" type="button" class="modal-close" aria-label="Close modal">&times;</button>
        </div>
        <form @submit.prevent="saveEvent">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Event Name / Activity <span class="required">*</span></label>
              <input 
                v-model="eventForm.event_name" 
                type="text" 
                placeholder="e.g. Periodic / Quarterly Examination" 
                class="form-input" 
                required 
              />
            </div>
            <div class="form-grid-2col">
              <div class="form-group">
                <label class="form-label">1st Grading Date / Details</label>
                <input v-model="eventForm.first_grading" type="text" placeholder="e.g. Oct 24-25, 2025" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">2nd Grading Date / Details</label>
                <input v-model="eventForm.second_grading" type="text" placeholder="e.g. Jan 15-16, 2026" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">3rd Grading Date / Details</label>
                <input v-model="eventForm.third_grading" type="text" placeholder="e.g. Mar 19-20, 2026" class="form-input" />
              </div>
              <div v-if="selectedQuarterCount !== 3" class="form-group">
                <label class="form-label">4th Grading Date / Details</label>
                <input v-model="eventForm.fourth_grading" type="text" placeholder="e.g. May 21-22, 2026" class="form-input" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showEventModal = false" type="button" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="savingEvent">
              {{ savingEvent ? 'Saving…' : 'Save Event' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import DatePicker from '../components/DatePicker.vue'

const auth = useAuthStore()

const allMonths = [
  { num: 1, name: 'January', short: 'Jan' },
  { num: 2, name: 'February', short: 'Feb' },
  { num: 3, name: 'March', short: 'Mar' },
  { num: 4, name: 'April', short: 'Apr' },
  { num: 5, name: 'May', short: 'May' },
  { num: 6, name: 'June', short: 'Jun' },
  { num: 7, name: 'July', short: 'Jul' },
  { num: 8, name: 'August', short: 'Aug' },
  { num: 9, name: 'September', short: 'Sep' },
  { num: 10, name: 'October', short: 'Oct' },
  { num: 11, name: 'November', short: 'Nov' },
  { num: 12, name: 'December', short: 'Dec' }
]

const schoolsList = ref([])
const selectedSchoolId = ref('')
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || ''))

function academicYearForDate(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

const selectedSchoolYear = ref(academicYearForDate())
const schoolYearOptions = ref([academicYearForDate()])

const quarters = ref([])
const selectedQuarterCount = ref(4)
const isCustomConfig = ref(false)
const events = ref([])

const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

// Milestone modal
const showEventModal = ref(false)
const editingEventId = ref(null)
const savingEvent = ref(false)
const eventForm = reactive({
  event_name: '',
  first_grading: '',
  second_grading: '',
  third_grading: '',
  fourth_grading: ''
})

function formatMonthsList(months) {
  if (!months || !months.length) return 'None'
  return months
    .map(m => allMonths.find(x => x.num === m)?.name || m)
    .join(', ')
}

function toggleMonth(quarter, monthNum) {
  if (!Array.isArray(quarter.months)) quarter.months = []
  const idx = quarter.months.indexOf(monthNum)
  if (idx >= 0) {
    quarter.months.splice(idx, 1)
  } else {
    quarter.months.push(monthNum)
    quarter.months.sort((a, b) => a - b)
  }
}

function onQuarterCountChange() {
  if (selectedQuarterCount.value === 3) {
    const q4 = quarters.value.find(q => q.quarter_number === 4)
    if (q4) q4.is_active = 0
  } else if (selectedQuarterCount.value === 4) {
    const q4 = quarters.value.find(q => q.quarter_number === 4)
    if (q4 && q4.is_active === 0) q4.is_active = 1
  }
}

async function loadSchoolYears() {
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    const years = await auth.api(`/reports/school-years?${params.toString()}`)
    if (Array.isArray(years) && years.length) {
      schoolYearOptions.value = years
      if (!schoolYearOptions.value.includes(selectedSchoolYear.value)) {
        selectedSchoolYear.value = years[0]
      }
    } else {
      schoolYearOptions.value = [academicYearForDate()]
    }
  } catch (err) {
    schoolYearOptions.value = [academicYearForDate()]
  }
}

async function loadQuarters() {
  try {
    errorMsg.value = ''
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    if (selectedSchoolYear.value) params.set('schoolYear', selectedSchoolYear.value)

    const res = await auth.api(`/quarterly/terms?${params.toString()}`)
    quarters.value = res.quarters || []
    if (res.quarter_count) selectedQuarterCount.value = Number(res.quarter_count) === 3 ? 3 : 4
    isCustomConfig.value = !!res.is_custom
  } catch (err) {
    errorMsg.value = err.message || 'Failed to load quarterly terms'
  }
}

async function saveQuarters() {
  try {
    saving.value = true
    errorMsg.value = ''
    successMsg.value = ''

    await auth.api('/quarterly/terms', {
      method: 'PUT',
      body: JSON.stringify({
        schoolId: effectiveSchoolId.value,
        schoolYear: selectedSchoolYear.value,
        quarterCount: selectedQuarterCount.value,
        quarters: quarters.value
      })
    })

    successMsg.value = 'Quarterly terms saved successfully!'
    isCustomConfig.value = true
    await auth.refreshCurrentSchool()
    setTimeout(() => { successMsg.value = '' }, 4000)
  } catch (err) {
    errorMsg.value = err.message || 'Failed to save quarterly terms'
  } finally {
    saving.value = false
  }
}

async function resetToDefaults() {
  if (!confirm('Are you sure you want to reset quarterly terms to standard DepEd defaults?')) return
  try {
    saving.value = true
    errorMsg.value = ''
    successMsg.value = ''

    await auth.api('/quarterly/terms/reset', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: effectiveSchoolId.value,
        schoolYear: selectedSchoolYear.value
      })
    })

    successMsg.value = 'Quarterly terms reset to DepEd defaults.'
    await loadQuarters()
    setTimeout(() => { successMsg.value = '' }, 4000)
  } catch (err) {
    errorMsg.value = err.message || 'Failed to reset quarterly terms'
  } finally {
    saving.value = false
  }
}

async function loadEvents() {
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    const res = await auth.api(`/quarterly/events?${params.toString()}`)
    events.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.error('Failed to load quarterly events:', err)
  }
}

function openEventModal(event = null) {
  if (event) {
    editingEventId.value = event.id
    eventForm.event_name = event.event_name || ''
    eventForm.first_grading = event.first_grading || ''
    eventForm.second_grading = event.second_grading || ''
    eventForm.third_grading = event.third_grading || ''
    eventForm.fourth_grading = event.fourth_grading || ''
  } else {
    editingEventId.value = null
    eventForm.event_name = ''
    eventForm.first_grading = ''
    eventForm.second_grading = ''
    eventForm.third_grading = ''
    eventForm.fourth_grading = ''
  }
  showEventModal.value = true
}

async function saveEvent() {
  try {
    savingEvent.value = true
    errorMsg.value = ''

    if (editingEventId.value) {
      await auth.api(`/quarterly/events/${editingEventId.value}`, {
        method: 'PUT',
        body: JSON.stringify(eventForm)
      })
    } else {
      await auth.api('/quarterly/events', {
        method: 'POST',
        body: JSON.stringify({
          ...eventForm,
          schoolId: effectiveSchoolId.value
        })
      })
    }

    showEventModal.value = false
    await loadEvents()
    successMsg.value = 'Milestone event saved successfully!'
    setTimeout(() => { successMsg.value = '' }, 4000)
  } catch (err) {
    errorMsg.value = err.message || 'Failed to save event'
  } finally {
    savingEvent.value = false
  }
}

async function deleteEvent(id) {
  if (!confirm('Are you sure you want to delete this quarterly milestone event?')) return
  try {
    await auth.api(`/quarterly/events/${id}`, {
      method: 'DELETE'
    })
    await loadEvents()
  } catch (err) {
    errorMsg.value = err.message || 'Failed to delete event'
  }
}

async function onSchoolChange() {
  await loadSchoolYears()
  await loadQuarters()
  await loadEvents()
}

onMounted(async () => {
  if (auth.isSuperadmin) {
    try {
      schoolsList.value = await auth.getSchools()
    } catch {}
  }
  await loadSchoolYears()
  await loadQuarters()
  await loadEvents()
})
</script>

<style scoped>
.quarterly-settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: var(--muted-foreground);
  margin-bottom: 4px;
}

.breadcrumb .sep {
  opacity: 0.5;
}

.breadcrumb .current {
  color: var(--foreground);
  font-weight: 600;
}

.page-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.25;
}

.page-subtitle {
  font-size: 0.82rem;
  color: var(--muted-foreground);
  max-width: 760px;
  margin: 4px 0 0 0;
  line-height: 1.5;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

/* Superadmin School Switcher */
.school-picker-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.school-picker-icon {
  position: absolute;
  left: 10px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.school-picker-select {
  height: 35px;
  padding: 0 12px 0 30px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--foreground);
  transition: all 0.14s ease;
}

.school-picker-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

/* Alert Banners */
.alert-banner {
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-banner--success {
  background: var(--success-bg);
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
  color: var(--success);
}

.alert-banner--danger {
  background: var(--red-bg);
  border: 1px solid color-mix(in srgb, var(--destructive) 30%, transparent);
  color: var(--destructive);
}

.close-alert-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: currentColor;
  opacity: 0.75;
  padding: 0 4px;
}

.close-alert-btn:hover {
  opacity: 1;
}

/* Scope & School Year Control Bar */
.scope-control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 22px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.scope-info-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.scope-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scope-label {
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted-foreground);
}

.select-with-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.select-with-icon svg {
  position: absolute;
  left: 9px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.sy-select {
  height: 34px;
  padding: 0 10px 0 28px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  font-weight: 600;
  font-size: 0.8rem;
  transition: all 0.14s ease;
}

.sy-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.scope-status {
  display: flex;
  align-items: center;
}

.badge-custom-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--success-bg);
  color: var(--success);
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
}

.badge-default-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid var(--border);
}

.status-dot-active {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}

.status-dot-neutral {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--muted-foreground);
}

.scope-quick-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Quarters Grid */
.quarters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
}

.quarter-card {
  padding: 22px 24px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-sm);
  transition: all 0.16s ease;
  display: flex;
  flex-direction: column;
}

.quarter-card:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
  box-shadow: var(--shadow-md);
}

.quarter-card--inactive {
  opacity: 0.65;
  background: color-mix(in srgb, var(--card) 85%, var(--muted));
}

.quarter-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 14px;
}

.quarter-badge {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: var(--primary-bg);
  color: var(--primary);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
}

.quarter-badge--disabled {
  background: var(--muted);
  color: var(--muted-foreground);
  border-color: var(--border);
}

.quarter-header-info {
  flex: 1;
  min-width: 0;
}

.quarter-title-input {
  width: 100%;
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  border: 1px solid transparent;
  background: transparent;
  color: var(--foreground);
  padding: 2px 6px;
  border-radius: 6px;
  transition: all 0.14s ease;
}

.quarter-title-input:hover:not(:disabled) {
  border-color: var(--border);
  background: var(--background);
}

.quarter-title-input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--background);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.quarter-sy-tag {
  display: block;
  font-size: 0.72rem;
  color: var(--muted-foreground);
  margin-left: 6px;
  margin-top: 1px;
}

.toggle-active-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.toggle-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.active-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: all 0.14s ease;
}

.active-badge--on {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
}

.active-badge--off {
  background: var(--muted);
  color: var(--muted-foreground);
  border: 1px solid var(--border);
}

.quarter-trimester-note {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 14px 0;
  padding: 8px 12px;
  background: var(--warning-bg);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--warning);
  border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
}

.quarter-card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.months-selection-group {
  margin-bottom: 0;
}

.months-label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.form-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.helper-text {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.months-pills-wrap {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 5px;
}

.month-pill-btn {
  height: 28px;
  padding: 0 4px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.12s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-pill-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-bg);
}

.month-pill-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground, #ffffff);
  box-shadow: 0 2px 6px var(--primary-glow);
}

.month-pill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-months-summary {
  font-size: 0.74rem;
  margin-top: 6px;
}

.months-list-text {
  color: var(--foreground);
}

.summary-label {
  color: var(--muted-foreground);
  font-weight: 600;
}

.months-warning {
  font-size: 0.72rem;
  font-weight: 600;
}

.date-range-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-input {
  height: 35px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--background);
  color: var(--foreground);
  font-size: 0.78rem;
  font-weight: 500;
  transition: all 0.14s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.text-center {
  text-align: center;
}

/* Milestones Section */
.milestones-section {
  padding: 0;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--card);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.card-box-header {
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid var(--border);
}

.milestones-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
  line-height: 1.25;
}

.milestones-subtitle {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  margin: 2px 0 0 0;
}

.table-responsive {
  overflow-x: auto;
  width: 100%;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.overview-table th {
  padding: 12px 18px;
  background: var(--muted);
  border-bottom: 1px solid var(--border);
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-foreground);
  text-align: left;
  white-space: nowrap;
}

.overview-table td {
  padding: 13px 18px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--foreground);
}

.overview-table tbody tr:hover {
  background: color-mix(in srgb, var(--secondary) 50%, transparent);
}

.overview-table tbody tr:last-child td {
  border-bottom: none;
}

.col-event {
  min-width: 220px;
}

.event-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.event-name {
  color: var(--foreground);
  font-weight: 700;
}

.col-period {
  min-width: 130px;
}

.event-date {
  color: var(--foreground);
  font-weight: 500;
}

.event-empty {
  color: var(--muted-foreground);
  opacity: 0.6;
}

.col-actions {
  width: 140px;
  text-align: right;
  white-space: nowrap;
}

.milestone-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.empty-cell {
  text-align: center;
  padding: 44px 16px;
}

.empty-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  max-width: 360px;
  margin: 0 auto;
}

.empty-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--muted);
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.empty-state-box h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0;
}

.empty-state-box p {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  margin: 0 0 10px 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 17, 18, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 540px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  animation: modalIn 0.18s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-header-text h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
}

.modal-subtext {
  font-size: 0.76rem;
  color: var(--muted-foreground);
  margin: 2px 0 0 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.4rem;
  line-height: 1;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 2px;
}

.modal-close:hover {
  color: var(--destructive);
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--muted);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.required {
  color: var(--destructive);
}

/* Responsive */
@media (max-width: 1000px) {
  .quarters-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-actions {
    justify-content: flex-start;
  }

  .scope-control-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .scope-info-group {
    flex-direction: column;
    align-items: stretch;
  }

  .scope-field {
    justify-content: space-between;
  }

  .scope-quick-links {
    justify-content: flex-start;
  }

  .date-range-grid {
    grid-template-columns: 1fr 1fr;
  }

  .form-grid-2col {
    grid-template-columns: 1fr;
  }

  .months-pills-wrap {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .date-range-grid {
    grid-template-columns: 1fr;
  }

  .months-pills-wrap {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .overview-table {
    min-width: 640px;
  }
}
</style>
