<template>
  <div class="attendance-page">
    <div v-if="!record" class="select-screen">
      <div class="dashboard-header">
        <div class="dashboard-header-left">
          <h1>Attendance Record</h1>
          <p>View daily attendance records by class and date.</p>
        </div>
        <div class="dashboard-header-actions">
          <div class="dashboard-date-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Daily Attendance</span>
          </div>
        </div>
      </div>

      <div class="form-card">
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="form-group">
            <label>Grade</label>
            <select v-model="form.grade" @change="form.section = ''" required>
              <option value="" disabled v-if="!grades.length">No grade levels defined</option>
              <option v-for="g in grades" :key="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Section</label>
            <select v-model="form.section" required>
              <option value="" disabled>Select section</option>
              <option v-for="s in availableSections" :key="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Adviser</label>
            <input v-model="form.adviser" placeholder="Teacher name" />
          </div>
        </div>
        <button @click="openRecord" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Loading...' : 'Open Attendance Sheet' }}
        </button>
        <p v-if="loadError" class="error-msg">{{ loadError }}</p>
      </div>

      <div v-if="savedRecords.length" class="table-card" style="margin-top: 18px;">
        <div class="table-toolbar">
          <div class="table-toolbar-left">
            <span class="show-wrap">Show
              <select v-model="recordsPageSize" @change="recordsPage = 1" class="show-select">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="25">25</option>
              </select>
            </span>
            <strong style="font-size: .9rem;">Recent Records</strong>
          </div>
          <div class="table-toolbar-right">
            <span class="tbl-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input v-model="recordsSearch" @input="recordsPage = 1" type="text" placeholder="Search records" />
            </span>
          </div>
        </div>
        <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th class="cell-id">ID</th>
              <th>Record</th>
              <th>Grade</th>
              <th>Issued Date</th>
              <th>Adviser</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in pagedRecords" :key="r.id">
              <td class="cell-id">#{{ (recordsPage - 1) * recordsPageSize + i + 1 }}</td>
              <td>
                <div class="cell-person">
                  <span class="status-dot status-dot--green">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                  </span>
                  <div style="min-width: 0;">
                    <div class="cell-main">{{ r.section }}</div>
                    <div class="cell-sub">{{ r.created_by_name || '—' }}</div>
                  </div>
                </div>
              </td>
              <td>{{ r.grade }}</td>
              <td>{{ r.date }}</td>
              <td>{{ r.adviser }}</td>
              <td style="text-align: right;">
                <div class="row-actions">
                  <button @click="loadRecord(r)" class="icon-btn" title="Open">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button @click="openEditRecord(r)" class="icon-btn" title="Edit">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button @click="deleteSavedRecord(r)" class="icon-btn icon-btn--danger" title="Delete">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="table-footer">
          <span class="table-count">Showing {{ recordsShowingFrom }} to {{ recordsShowingTo }} of {{ filteredRecords.length }} entries</span>
          <div class="pager">
            <button class="pager-btn" @click="recordsPage > 1 && recordsPage--" :disabled="recordsPage === 1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Previous
            </button>
            <button class="pager-num active">{{ recordsPage }}</button>
            <button class="pager-btn" @click="recordsPage < recordsTotalPages && recordsPage++" :disabled="recordsPage === recordsTotalPages">
              Next
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="page-header screen-only">
        <h1>Daily Attendance Record</h1>
        <p>{{ record.grade }} - {{ record.section }} &middot; {{ record.date }} &middot; Adviser: {{ record.adviser }}</p>
      </div>
      <div class="sheet-container">
      <div class="sheet-header">
        <div class="school-info">
          <h1>{{ school.school_name }}</h1>
          <p>School ID: {{ school.school_id }}</p>
          <p v-if="school.school_address">{{ school.school_address }}</p>
        </div>
      </div>

      <div v-if="auth.isTeacher && !isOwner" class="readonly-banner">
        This record belongs to another class. Only its advisory teacher or an admin can edit it.
      </div>
      <div v-if="auth.isAdmin && !isOwner" class="readonly-banner">
        Recorded by {{ record.created_by_name || 'Unknown' }}
        <button @click="handleUnlock" class="btn-sm">Take Ownership</button>
      </div>

      <div class="sheet-date">{{ record.date }}</div>
      <h2 class="sheet-title">DAILY ATTENDANCE RECORD</h2>
      <div class="sheet-info">
        <span class="sheet-info-left">Grade: {{ gradeNum(record.grade) }}</span>
        <span class="sheet-info-center">Section: {{ record.section }}</span>
        <span class="sheet-info-right">Adviser: {{ record.adviser }}</span>
      </div>
      <div class="table-wrapper">
        <table class="attendance-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2">NAMES</th>
              <th :colspan="visibleAmPeriods.length">AM</th>
              <th :colspan="visiblePmPeriods.length">PM</th>
              <th rowspan="2">Reason for Absence / Tardiness</th>
              <th rowspan="2">Excused</th>
              <th rowspan="2">Unexcused</th>
            </tr>
            <tr>
              <th v-for="pk in visibleAmPeriods" :key="pk">{{ pk.replace('am', '') }}</th>
              <th v-for="pk in visiblePmPeriods" :key="pk">{{ pk.replace('pm', '') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!record.entries || record.entries.length === 0">
              <td :colspan="colspan" class="empty">No students found. Add students in Student Management first.</td>
            </tr>
            <template v-else>
              <template v-for="(item, idx) in sortedEntries" :key="item.isSep ? 'sep-' + idx : item.studentId">
                <tr v-if="item.isSep" class="gender-sep-row"><td :colspan="colspan">{{ item.label }}</td></tr>
                <tr v-else :class="{ 'selected-row': selectedStudent?.studentId === item.studentId }">
                  <td>{{ item._num }}</td>
                  <td class="name-cell clickable" @click="selectStudent(item)">{{ item.name }}</td>
                  <td v-for="pk in visibleAmPeriods" :key="pk" class="period-cell">
                    <select :value="item.periods[pk] || ''" @change="updatePeriodCell(item, pk, $event.target.value)" class="period-select" :disabled="!canEdit">
                      <option value=""></option>
                      <option value="E">E</option>
                      <option value="T">T</option>
                      <option value="A">A</option>
                      <option value="E/T">E/T</option>
                      <option value="A/S">A/S</option>
                      <option value="NIPS">NIPS</option>
                      <option value="NIPU:White w/ print">NIPU:W/P</option>
                      <option value="NIPU:Polo w/o logo">NIPU:POL</option>
                      <option value="NIPU:No logo">NIPU:NOL</option>
                      <option value="NIPU:Make up (girls)">NIPU:MAK</option>
                      <option value="NIPHC">NIPHC</option>
                    </select>
                  </td>
                  <td v-for="pk in visiblePmPeriods" :key="pk" class="period-cell">
                    <select :value="item.periods[pk] || ''" @change="updatePeriodCell(item, pk, $event.target.value)" class="period-select" :disabled="!canEdit">
                      <option value=""></option>
                      <option value="E">E</option>
                      <option value="T">T</option>
                      <option value="A">A</option>
                      <option value="E/T">E/T</option>
                      <option value="A/S">A/S</option>
                      <option value="NIPS">NIPS</option>
                      <option value="NIPU:White w/ print">NIPU:W/P</option>
                      <option value="NIPU:Polo w/o logo">NIPU:POL</option>
                      <option value="NIPU:No logo">NIPU:NOL</option>
                      <option value="NIPU:Make up (girls)">NIPU:MAK</option>
                      <option value="NIPHC">NIPHC</option>
                    </select>
                  </td>
                  <td><input v-model="item.reason" @change="saveEntry(item)" class="reason-input" /></td>
                  <td class="check-cell"><input type="checkbox" v-model="item.excused" @change="saveEntry(item)" /></td>
                  <td class="check-cell"><input type="checkbox" v-model="item.unexcused" @change="saveEntry(item)" /></td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <div class="legends">
        <h3>LEGENDS:</h3>
        <div class="legend-grid">
          <span><strong>E</strong> - Entered</span>
          <span><strong>T</strong> - Tardy</span>
          <span><strong>A</strong> - Absent</span>
          <span><strong>NIPS</strong> - Not in Proper Socks</span>
          <span><strong>NIPU</strong> - Not in Proper Uniform</span>
          <span><strong>E/T</strong> - Entered but Tardy</span>
          <span><strong>A/S</strong> - Suspended</span>
          <span><strong>NIPHC</strong> - Not in Proper Hair Cut</span>
        </div>
        <div class="nipu-subtypes">
          <p><strong>NIPU Subtypes:</strong></p>
          <p>White w/ print | Polo w/o logo | No logo | Make up (girls)</p>
        </div>
      </div>
      <div v-if="record.created_by_name" class="created-by">Created by: {{ record.created_by_name }}</div>

      <div class="sheet-actions">
        <button @click="printSheet" class="btn-primary">Print</button>
        <button @click="goBack" class="btn-secondary">Back</button>
      </div>
    </div>
    </div>

    <div v-if="showEditRecord" class="modal-overlay" @click.self="closeEditRecord">
      <div class="form-card schedule-form">
        <h3>Edit Record Details</h3>
        <form @submit.prevent="handleSaveRecord">
          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input v-model="editRecordForm.date" type="date" required />
            </div>
            <div class="form-group">
              <label>Grade</label>
              <select v-model="editRecordForm.grade" required>
                <option v-for="g in grades" :key="g">{{ g }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Section</label>
              <select v-model="editRecordForm.section" required>
                <option v-for="s in sectionsByGrade[editRecordForm.grade] || []" :key="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Adviser</label>
              <input v-model="editRecordForm.adviser" required />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="savingRecord">{{ savingRecord ? 'Saving...' : 'Save' }}</button>
            <button type="button" @click="closeEditRecord" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAttendanceStore } from '../stores/attendance'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'
import { actorQs, actorBody } from '../composables/useActor'
import { useGradeLevels } from '../composables/useGradeLevels'
import { loadPageState, savePageState } from '../composables/usePageState'

const store = useAttendanceStore()
const auth = useAuthStore()
const { notify } = useNotifications()
const school = reactive({ school_name: '', school_id: '', school_address: '', school_short: '' })
const loading = ref(false)
const { grades, sectionsByGrade, loadGradeLevels } = useGradeLevels()
const savedState = loadPageState(auth.user)
const availableSections = computed(() => sectionsByGrade.value[form.grade] || [])
const amPeriods = ['am1', 'am2', 'am3', 'am4', 'am5', 'am6']
const pmPeriods = ['pm1', 'pm2', 'pm3', 'pm4']

const visibleAmPeriods = computed(() => amPeriods)
const visiblePmPeriods = computed(() => pmPeriods)

// Teachers edit records of their advisory class; admins edit anything.
const canEdit = computed(() => {
  if (!record.value) return false
  if (auth.isAdmin) return true
  if (!auth.isTeacher) return false
  if (!auth.user?.grade || !auth.user?.section) return true
  return record.value.grade === auth.user.grade && record.value.section === auth.user.section
})
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function gradeNum(g) {
  return (g || '').replace('Grade ', '')
}

const now = new Date().toISOString().split('T')[0]
const form = reactive({
  date: savedState?.date ?? now,
  grade: savedState?.grade ?? '',
  section: savedState?.section ?? '',
  adviser: savedState?.adviser ?? ''
})

watch(
  () => [form.date, form.grade, form.section, form.adviser],
  () => {
    if (auth.user) {
      savePageState(auth.user, { date: form.date, grade: form.grade, section: form.section, adviser: form.adviser })
    }
  }
)

const record = ref(null)
const loadError = ref('')
const savedRecords = ref([])
const recordsSearch = ref('')
const recordsPage = ref(1)
const recordsPageSize = ref(5)
const filteredRecords = computed(() => {
  const q = recordsSearch.value.trim().toLowerCase()
  if (!q) return savedRecords.value
  return savedRecords.value.filter(r => [r.date, r.grade, r.section, r.adviser, r.created_by_name].filter(Boolean).join(' ').toLowerCase().includes(q))
})
const recordsTotalPages = computed(() => Math.max(1, Math.ceil(filteredRecords.value.length / recordsPageSize.value)))
const pagedRecords = computed(() => {
  const start = (recordsPage.value - 1) * recordsPageSize.value
  return filteredRecords.value.slice(start, start + recordsPageSize.value)
})
const recordsShowingFrom = computed(() => (filteredRecords.value.length ? (recordsPage.value - 1) * recordsPageSize.value + 1 : 0))
const recordsShowingTo = computed(() => Math.min(filteredRecords.value.length, recordsPage.value * recordsPageSize.value))
const isOwner = ref(true)
const selectedStudent = ref(null)
const studentGenderMap = ref({})
const showEditRecord = ref(false)
const savingRecord = ref(false)
const editRecordForm = reactive({ id: '', date: '', grade: '', section: '', adviser: '' })



function openEditRecord(r) {
  editRecordForm.id = r.id
  editRecordForm.date = r.date
  editRecordForm.grade = r.grade
  editRecordForm.section = r.section
  editRecordForm.adviser = r.adviser
  showEditRecord.value = true
}

function closeEditRecord() {
  showEditRecord.value = false
}

async function handleSaveRecord() {
  savingRecord.value = true
  try {
    const res = await fetch('/api/attendance/' + editRecordForm.id + '?' + actorQs(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: actorBody({
        date: editRecordForm.date,
        grade: editRecordForm.grade,
        section: editRecordForm.section,
        adviser: editRecordForm.adviser
      })
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Failed to save')
    notify('Record updated', 'success')
    closeEditRecord()
    const all = await store.getAllRecords()
    savedRecords.value = all.slice(-10).reverse()
  } catch {
    notify('Failed to update record', 'error')
  } finally {
    savingRecord.value = false
  }
}

const colspan = computed(() => 4 + visibleAmPeriods.value.length + visiblePmPeriods.value.length)

const sortedEntries = computed(() => {
  if (!record.value?.entries) return []
  const withGender = record.value.entries.map(e => ({
    ...e,
    gender: studentGenderMap.value[e.studentId] || ''
  }))
  const boys = withGender.filter(e => e.gender === 'Male')
  const girls = withGender.filter(e => e.gender === 'Female')
  const unknown = withGender.filter(e => e.gender !== 'Male' && e.gender !== 'Female')
  let num = 0
  const flat = []
  if (boys.length) {
    flat.push({ isSep: true, label: 'BOYS' })
    for (const b of boys) { b._num = ++num; flat.push(b) }
  }
  if (girls.length) {
    flat.push({ isSep: true, label: 'GIRLS' })
    for (const g of girls) { g._num = ++num; flat.push(g) }
  }
  if (unknown.length) {
    flat.push({ isSep: true, label: 'OTHER' })
    for (const u of unknown) { u._num = ++num; flat.push(u) }
  }
  return flat
})

async function loadStudentGenderMap() {
  if (!record.value) return
  try {
    const students = await store.getStudents({ grade: record.value.grade, section: record.value.section })
    const map = {}
    for (const s of students) map[s.id] = s.gender || ''
    studentGenderMap.value = map
  } catch {}
}



onMounted(async () => {
  await loadGradeLevels()
  if (!form.grade && grades.value.length) form.grade = grades.value[0]
  try {
    const data = await auth.getSchoolInfo()
    if (data) Object.assign(school, data)
    else if (auth.user?.school) {
      school.school_name = auth.user.school.name || auth.user.school.school_name || ''
      school.school_id = auth.user.school.school_id || ''
      school.school_short = auth.user.school.short || auth.user.school.school_short || ''
      school.school_address = auth.user.school.address || auth.user.school.school_address || ''
    }
  } catch {}
  const all = await store.getAllRecords()
  savedRecords.value = all.slice(-10).reverse()
})

async function openRecord() {
  if (!form.date || !form.grade || !form.section) {
    loadError.value = 'Please fill in all fields'
    return
  }
  loadError.value = ''
  loading.value = true
  record.value = await store.getOrCreateRecord(
    form.date,
    form.grade,
    form.section,
    form.adviser || 'TBA',
    auth.user
  )
  loading.value = false
  updateCanEdit()
  await loadStudentGenderMap()
}

async function loadRecord(r) {
  form.date = r.date
  form.grade = r.grade
  form.section = r.section
  form.adviser = r.adviser
  loading.value = true
  record.value = await store.getOrCreateRecord(r.date, r.grade, r.section, r.adviser, auth.user)
  loading.value = false
  updateCanEdit()
  await loadStudentGenderMap()
}

function updateCanEdit() {
  if (!record.value) return
  isOwner.value = !record.value.created_by ||
    String(record.value.created_by) === String(auth.user?.id)
}

async function handleUnlock() {
  if (!record.value?.id) return
  try {
    await store.unlockRecord(record.value.id, auth.user?.id, auth.user?.role)
    record.value.created_by = auth.user?.id
    record.value.created_by_name = auth.user?.name
    isOwner.value = true
    notify('Ownership transferred to you', 'success')
  } catch (e) {
    notify(e.message, 'error')
  }
}

function goBack() {
  record.value = null
  selectedStudent.value = null
}

function selectStudent(entry) {
  selectedStudent.value = entry
}

async function deleteSavedRecord(r) {
  try {
    await store.deleteRecord(r.id, auth.user?.id, auth.user?.role)
    savedRecords.value = savedRecords.value.filter(x => x.id !== r.id)
    notify('Record deleted', 'success')
  } catch (e) {
    notify(e.message, 'error')
  }
}

async function updatePeriodCell(entry, periodKey, value) {
  entry.periods[periodKey] = value
  await store.updateEntry(record.value.id, entry.studentId, `periods.${periodKey}`, value, auth.user?.id, auth.user?.role)
}

async function saveEntry(entry) {
  await store.updateEntry(record.value.id, entry.studentId, 'reason', entry.reason, auth.user?.id, auth.user?.role)
  await store.updateEntry(record.value.id, entry.studentId, 'excused', entry.excused, auth.user?.id, auth.user?.role)
  await store.updateEntry(record.value.id, entry.studentId, 'unexcused', entry.unexcused, auth.user?.id, auth.user?.role)
}


function printSheet() {
  window.print()
}
</script>
