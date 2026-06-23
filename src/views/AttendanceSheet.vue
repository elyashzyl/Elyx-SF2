<template>
  <div class="attendance-page">
    <div v-if="!record" class="select-screen">
      <div class="page-header">
        <h1>Attendance Record</h1>
        <p>View daily attendance records.</p>
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

      <div v-if="savedRecords.length" class="saved-records">
        <h3>Recent Records</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Grade</th>
              <th>Section</th>
              <th>Adviser</th>
              <th>Created By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in savedRecords" :key="r.id">
              <td>{{ r.date }}</td>
              <td>{{ r.grade }}</td>
              <td>{{ r.section }}</td>
              <td>{{ r.adviser }}</td>
              <td>{{ r.created_by_name || '—' }}</td>
              <td>
                <button @click="loadRecord(r)" class="btn-sm">Open</button>
                <button @click="openEditRecord(r)" class="btn-sm btn-secondary">Edit</button>
                <button @click="deleteSavedRecord(r)" class="btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else>
      <div class="page-header screen-only">
        <h1>Daily Attendance Record</h1>
        <p>{{ record.grade }} - {{ record.section }} &middot; {{ record.date }} &middot; Adviser: {{ record.adviser }}</p>
      </div>
      <div class="sheet-container">
      <div class="sheet-header">
        <img src="/bphs-logo.jpg" alt="BPHS" class="school-logo" />
        <div class="school-info">
          <h1>BAGUIO PATRIOTIC HIGH SCHOOL</h1>
          <p>#21 Harrison Road, Baguio City, Philippines</p>
        </div>
      </div>

      <div v-if="auth.isTeacher && !isOwner" class="readonly-banner">
        You can only edit your assigned period(s) for this date.
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
                    <select :value="item.periods[pk] || ''" @change="updatePeriodCell(item, pk, $event.target.value)" class="period-select" :disabled="!canEditPeriod(pk)">
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
                    <select :value="item.periods[pk] || ''" @change="updatePeriodCell(item, pk, $event.target.value)" class="period-select" :disabled="!canEditPeriod(pk)">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useAttendanceStore } from '../stores/attendance'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

const store = useAttendanceStore()
const auth = useAuthStore()
const { addToast } = useToast()
const loading = ref(false)
const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const sectionsByGrade = {
  'Grade 7': ['Pine', 'Molave'],
  'Grade 8': ['Cypress'],
  'Grade 9': ['Kamagong', 'Mahogany'],
  'Grade 10': ['Acacia', 'Yakal']
}
const availableSections = computed(() => sectionsByGrade[form.grade] || [])
const amPeriods = ['am1', 'am2', 'am3', 'am4', 'am5', 'am6']
const pmPeriods = ['pm1', 'pm2', 'pm3', 'pm4']
const dayPeriods = ref([])

const visibleAmPeriods = computed(() => amPeriods)
const visiblePmPeriods = computed(() => pmPeriods)

function canEditPeriod(pk) {
  if (auth.isAdmin) return true
  if (!dayPeriods.value.length) return false
  return dayPeriods.value.includes(pk)
}
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function gradeNum(g) {
  return (g || '').replace('Grade ', '')
}

function getDayOfWeek(dateStr) {
  return daysOfWeek[new Date(dateStr + 'T00:00:00').getDay()]
}

const form = reactive({
  date: new Date().toISOString().split('T')[0],
  grade: 'Grade 7',
  section: '',
  adviser: ''
})

const record = ref(null)
const loadError = ref('')
const savedRecords = ref([])
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
    const res = await fetch('/api/attendance/' + editRecordForm.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: editRecordForm.date,
        grade: editRecordForm.grade,
        section: editRecordForm.section,
        adviser: editRecordForm.adviser
      })
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Failed to save')
    addToast('Record updated', 'success')
    closeEditRecord()
    const all = await store.getAllRecords()
    savedRecords.value = all.slice(-10).reverse()
  } catch {
    addToast('Failed to update record', 'error')
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

async function loadDaySchedule() {
  dayPeriods.value = []
  if (!auth.isTeacher || !auth.user?.id || !record.value) return
  try {
    const res = await fetch('/api/schedules/' + auth.user.id)
    const sched = await res.json()
    const today = getDayOfWeek(record.value.date)
    dayPeriods.value = sched.filter(s => s.day_of_week === today).map(s => s.period)
  } catch {}
}

onMounted(async () => {
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
  await loadDaySchedule()
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
  await loadDaySchedule()
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
    addToast('Ownership transferred to you', 'success')
  } catch (e) {
    addToast(e.message, 'error')
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
    addToast('Record deleted', 'success')
  } catch (e) {
    addToast(e.message, 'error')
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
