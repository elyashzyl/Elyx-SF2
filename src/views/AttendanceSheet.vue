<template>
  <div class="attendance-page">
    <div v-if="!record" class="select-screen">
      <h1>Daily Attendance Record</h1>
      <div class="form-card">
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="form-group">
            <label>Grade</label>
            <select v-model="form.grade" required>
              <option v-for="g in grades" :key="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Section</label>
            <input v-model="form.section" required placeholder="e.g. St. John" />
          </div>
          <div class="form-group">
            <label>Adviser</label>
            <input v-model="form.adviser" placeholder="Teacher name" />
          </div>
        </div>
        <button @click="openRecord" class="btn-primary">Open Attendance Sheet</button>
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
              <td><button @click="loadRecord(r)" class="btn-sm">Open</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="sheet-container">
      <div class="sheet-header">
        <div class="logo-placeholder">[Logo]</div>
        <div class="school-info">
          <h1>BACOOR PARAÑAQUE HIGH SCHOOL</h1>
          <p>Bacoor, Parañaque City</p>
        </div>
      </div>

      <div v-if="!isOwner" class="readonly-banner">
        Read Only — Recorded by {{ record.created_by_name || 'Unknown' }}
        <button v-if="auth.isAdmin" @click="handleUnlock" class="btn-sm">Take Ownership</button>
      </div>

      <div class="sheet-date">Date: {{ record.date }}</div>
      <h2 class="sheet-title">DAILY ATTENDANCE RECORD</h2>
      <div class="sheet-info">
        <span>Grade: {{ record.grade }}</span>
        <span>Section: {{ record.section }}</span>
        <span>Adviser: {{ record.adviser }}</span>
        <span v-if="record.created_by_name" class="created-by">Created by: {{ record.created_by_name }}</span>
      </div>

      <div class="table-wrapper">
        <table class="attendance-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2">NAMES</th>
              <th colspan="6">AM</th>
              <th colspan="4">PM</th>
              <th rowspan="2">Reason for Absence / Tardiness</th>
              <th rowspan="2">Excused</th>
              <th rowspan="2">Unexcused</th>
              <th rowspan="2">HD</th>
            </tr>
            <tr>
              <th v-for="p in 6" :key="'am'+p">{{ p }}</th>
              <th v-for="p in 4" :key="'pm'+p">{{ p }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, idx) in record.entries" :key="entry.studentId"
                :class="{ 'selected-row': selectedStudent?.studentId === entry.studentId }">
              <td>{{ idx + 1 }}</td>
              <td class="name-cell clickable"
                  @click="selectStudent(entry)">
                {{ entry.name }}
              </td>
              <td v-for="pk in amPeriods" :key="pk" class="period-cell">
                <select :value="entry.periods[pk] || ''" @change="updatePeriodCell(entry, pk, $event.target.value)" class="period-select">
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
              <td v-for="pk in pmPeriods" :key="pk" class="period-cell">
                <select :value="entry.periods[pk] || ''" @change="updatePeriodCell(entry, pk, $event.target.value)" class="period-select">
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
              <td>
                <input v-model="entry.reason" @change="saveEntry(entry)"
                       class="reason-input" />
              </td>
              <td class="check-cell">
                <input type="checkbox" v-model="entry.excused"
                       @change="saveEntry(entry)" />
              </td>
              <td class="check-cell">
                <input type="checkbox" v-model="entry.unexcused"
                       @change="saveEntry(entry)" />
              </td>
              <td class="hd-cell">{{ isHalfDay(entry) ? '✓' : '' }}</td>
            </tr>
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
          <span><strong>HD</strong> - Half Day (2+ absent in AM)</span>
        </div>
        <div class="nipu-subtypes">
          <p><strong>NIPU Subtypes:</strong></p>
          <p>White w/ print | Polo w/o logo | No logo | Make up (girls)</p>
        </div>
      </div>

      <div class="sheet-actions">
        <button @click="printSheet" class="btn-primary">Print</button>
        <button @click="goBack" class="btn-secondary">Back</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAttendanceStore } from '../stores/attendance'
import { useAuthStore } from '../stores/auth'

const store = useAttendanceStore()
const auth = useAuthStore()
const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const amPeriods = ['am1', 'am2', 'am3', 'am4', 'am5', 'am6']
const pmPeriods = ['pm1', 'pm2', 'pm3', 'pm4']
const allPeriods = [...amPeriods, ...pmPeriods]

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
  record.value = await store.getOrCreateRecord(
    form.date,
    form.grade,
    form.section,
    form.adviser || 'TBA',
    auth.user
  )
  updateCanEdit()
}

async function loadRecord(r) {
  form.date = r.date
  form.grade = r.grade
  form.section = r.section
  form.adviser = r.adviser
  record.value = await store.getOrCreateRecord(r.date, r.grade, r.section, r.adviser, auth.user)
  updateCanEdit()
}

function updateCanEdit() {
  if (!record.value) return
  isOwner.value = auth.isAdmin ||
    !record.value.created_by ||
    String(record.value.created_by) === String(auth.user?.id)
}

async function handleUnlock() {
  if (!record.value?.id) return
  try {
    await store.unlockRecord(record.value.id, auth.user?.id, auth.user?.role)
    record.value.created_by = auth.user?.id
    record.value.created_by_name = auth.user?.name
    isOwner.value = true
  } catch (e) {
    alert(e.message)
  }
}

function goBack() {
  record.value = null
  selectedStudent.value = null
}

function selectStudent(entry) {
  selectedStudent.value = entry
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

function isHalfDay(entry) {
  const absentCount = amPeriods.filter(pk => {
    const val = entry.periods[pk] || ''
    return val === 'A'
  }).length
  return absentCount >= 2
}

function printSheet() {
  window.print()
}
</script>
