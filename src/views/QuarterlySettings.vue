<template>
  <div class="management-page quarterly-settings-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <div class="dashboard-header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
          </svg>
        </div>
        <div>
          <h1>Quarterly Terms &amp; Grading Periods</h1>
          <p>
            Configure academic quarters, reporting months, date ranges, and official grading period milestones so DepEd Form 2 summaries and attendance tracking are customized to your academic calendar.
          </p>
        </div>
      </div>
      <div class="page-header-actions">
        <!-- Superadmin Multi-School Switcher -->
        <div v-if="auth.isSuperadmin && schoolsList.length > 1" class="school-picker-wrap">
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

        <button @click="resetToDefaults" type="button" class="btn-secondary" :disabled="saving">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset to DepEd Defaults
        </button>

        <button @click="saveQuarters" type="button" class="btn-primary" :disabled="saving">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {{ saving ? 'Saving…' : 'Save Quarters' }}
        </button>
      </div>
    </div>

    <!-- Alert / Status Banner -->
    <div v-if="successMsg" class="alert-banner alert-banner--success">
      <span>{{ successMsg }}</span>
      <button @click="successMsg = ''" type="button" class="close-alert-btn">&times;</button>
    </div>
    <div v-if="errorMsg" class="alert-banner alert-banner--danger">
      <span>{{ errorMsg }}</span>
      <button @click="errorMsg = ''" type="button" class="close-alert-btn">&times;</button>
    </div>

    <!-- Scope & School Year Control Bar -->
    <div class="card-box scope-control-bar">
      <div class="scope-info-group">
        <span class="scope-label">School Year:</span>
        <select v-model="selectedSchoolYear" @change="loadQuarters" class="sy-select">
          <option v-for="sy in schoolYearOptions" :key="sy" :value="sy">{{ sy }}</option>
        </select>
        <span v-if="isCustomConfig" class="badge-custom-pill">Custom Configuration Active</span>
        <span v-else class="badge-default-pill">Using Standard DepEd Defaults</span>
      </div>

      <div class="scope-quick-links">
        <router-link to="/reports?tab=quarterly" class="btn-xs btn-secondary">
          <span>View Quarterly Reports →</span>
        </router-link>
        <router-link to="/schedule" class="btn-xs btn-secondary">
          <span>Schedule &amp; Calendar →</span>
        </router-link>
      </div>
    </div>

    <!-- Section 1: Quarters Q1 - Q4 Configuration Cards -->
    <div class="quarters-grid">
      <div 
        v-for="q in quarters" 
        :key="q.quarter_number" 
        class="card-box quarter-card"
        :class="{ 'quarter-card--inactive': q.is_active === 0 }"
      >
        <div class="quarter-card-header">
          <div class="quarter-badge">
            <span>Q{{ q.quarter_number }}</span>
          </div>
          <div class="quarter-header-info">
            <input 
              v-model="q.quarter_name" 
              type="text" 
              class="quarter-title-input" 
              placeholder="e.g. 1st Quarter"
              required
            />
            <small class="quarter-sy-tag">Academic Year: {{ selectedSchoolYear }}</small>
          </div>
          <label class="toggle-active-label" title="Enable or disable this quarter">
            <input type="checkbox" v-model="q.is_active" :true-value="1" :false-value="0" />
            <span class="active-text">{{ q.is_active ? 'Active' : 'Disabled' }}</span>
          </label>
        </div>

        <div class="quarter-card-body">
          <!-- Reporting Months Selector -->
          <div class="form-group months-selection-group">
            <label class="form-label">
              <span>Reporting Months Included</span>
              <small class="helper-text">Select months consolidated in this quarter's DepEd Form 2 report</small>
            </label>
            <div class="months-pills-wrap">
              <button
                v-for="m in allMonths"
                :key="m.num"
                type="button"
                class="month-pill-btn"
                :class="{ 'active': (q.months || []).includes(m.num) }"
                @click="toggleMonth(q, m.num)"
              >
                {{ m.short }}
              </button>
            </div>
            <div class="selected-months-summary">
              <span v-if="(q.months || []).length">
                Active months: <strong>{{ formatMonthsList(q.months) }}</strong>
              </span>
              <span v-else class="text-danger">
                Please select at least one month for this quarter.
              </span>
            </div>
          </div>

          <!-- Date Range & Target School Days -->
          <div class="form-row date-range-row">
            <div class="form-group">
              <label class="form-label">Quarter Start Date</label>
              <input v-model="q.start_date" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Quarter End Date</label>
              <input v-model="q.end_date" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Target School Days</label>
              <input v-model.number="q.target_days" type="number" min="1" max="100" class="form-input" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Important Dates & Grading Milestones -->
    <div class="card-box milestones-section" style="margin-top: 24px;">
      <div class="card-box-header">
        <div>
          <h2>Important Dates &amp; Grading Milestones</h2>
          <p>
            Schedule examinations, card distributions, PTC meetings, and report submission deadlines across all four quarters.
          </p>
        </div>
        <div>
          <button @click="openEventModal()" type="button" class="btn-sm btn-primary">
            + Add Milestone Event
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="overview-table">
          <thead>
            <tr>
              <th>Event / Activity</th>
              <th>1st Grading</th>
              <th>2nd Grading</th>
              <th>3rd Grading</th>
              <th>4th Grading</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody v-if="events.length">
            <tr v-for="ev in events" :key="ev.id">
              <td><strong>{{ ev.event_name }}</strong></td>
              <td>{{ ev.first_grading || '—' }}</td>
              <td>{{ ev.second_grading || '—' }}</td>
              <td>{{ ev.third_grading || '—' }}</td>
              <td>{{ ev.fourth_grading || '—' }}</td>
              <td style="text-align: right;">
                <button @click="openEventModal(ev)" type="button" class="btn-xs btn-secondary" style="margin-right: 6px;">
                  Edit
                </button>
                <button @click="deleteEvent(ev.id)" type="button" class="btn-xs btn-danger">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="6" class="empty-cell">
                <div class="empty-state-box">
                  <p>No quarterly events or milestones recorded yet.</p>
                  <button @click="openEventModal()" type="button" class="btn-sm btn-primary">
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
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editingEventId ? 'Edit Milestone Event' : 'Add Milestone Event' }}</h3>
          <button @click="showEventModal = false" type="button" class="modal-close">&times;</button>
        </div>
        <form @submit.prevent="saveEvent">
          <div class="modal-body" style="padding: 20px;">
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Event Name / Activity</label>
              <input 
                v-model="eventForm.event_name" 
                type="text" 
                placeholder="e.g. Periodic / Quarterly Examination" 
                class="form-input" 
                required 
              />
            </div>
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">1st Grading Date / Details</label>
              <input v-model="eventForm.first_grading" type="text" placeholder="e.g. Oct 24-25, 2025" class="form-input" />
            </div>
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">2nd Grading Date / Details</label>
              <input v-model="eventForm.second_grading" type="text" placeholder="e.g. Jan 15-16, 2026" class="form-input" />
            </div>
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">3rd Grading Date / Details</label>
              <input v-model="eventForm.third_grading" type="text" placeholder="e.g. Mar 19-20, 2026" class="form-input" />
            </div>
            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">4th Grading Date / Details</label>
              <input v-model="eventForm.fourth_grading" type="text" placeholder="e.g. May 21-22, 2026" class="form-input" />
            </div>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px;">
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
        quarters: quarters.value
      })
    })

    successMsg.value = 'Quarterly terms saved successfully!'
    isCustomConfig.value = true
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
  padding: 24px;
  max-width: 1300px;
  margin: 0 auto;
}

.scope-control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
}

.scope-info-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.scope-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.sy-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  font-weight: 600;
  font-size: 0.9rem;
}

.badge-custom-pill {
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-default-pill {
  padding: 4px 10px;
  border-radius: 9999px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--border);
}

.scope-quick-links {
  display: flex;
  gap: 8px;
}

.quarters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.quarter-card {
  padding: 20px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.quarter-card--inactive {
  opacity: 0.6;
}

.quarter-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.quarter-badge {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.quarter-header-info {
  flex: 1;
  min-width: 0;
}

.quarter-title-input {
  width: 100%;
  font-size: 1rem;
  font-weight: 700;
  border: 1px solid transparent;
  background: transparent;
  color: var(--foreground);
  padding: 4px 6px;
  border-radius: 4px;
  transition: border-color 0.2s, background 0.2s;
}

.quarter-title-input:focus {
  border-color: var(--primary);
  background: var(--background);
}

.quarter-sy-tag {
  display: block;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  margin-left: 6px;
  margin-top: 2px;
}

.toggle-active-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

.months-selection-group {
  margin-bottom: 16px;
}

.months-pills-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.month-pill-btn {
  padding: 5px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.15s ease;
}

.month-pill-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.month-pill-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.selected-months-summary {
  font-size: 0.8rem;
  color: var(--muted-foreground);
  margin-top: 8px;
}

.date-range-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.helper-text {
  display: block;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  font-weight: normal;
  margin-top: 2px;
}

.alert-banner {
  padding: 12px 18px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-banner--success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid #10b981;
  color: #065f46;
}

.alert-banner--danger {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #991b1b;
}

.close-alert-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: currentColor;
}
</style>
