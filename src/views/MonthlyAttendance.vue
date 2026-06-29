<template>
  <div class="monthly-page">
    <div v-if="!record" class="select-screen">
      <h1>Monthly Attendance</h1>
      <div class="form-card">
        <div class="form-row">
          <div class="form-group">
            <label>Month</label>
            <select v-model="form.month">
              <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Year</label>
            <select v-model="form.year">
              <option v-for="y in years" :key="y">{{ y }}</option>
            </select>
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
        </div>
        <button @click="openMonthly" class="btn-primary">Open Monthly Record</button>
        <p v-if="loadError" class="error-msg">{{ loadError }}</p>
      </div>
    </div>

    <div v-else class="sheet-container">
      <div class="sheet-header">
        <img src="/bphs-logo.jpg" alt="BPHS" class="school-logo" />
        <div class="school-info">
          <h1>BAGUIO PATRIOTIC HIGH SCHOOL</h1>
          <p>Baguio City</p>
        </div>
      </div>
      <div class="sheet-date">{{ months[form.month-1] }} {{ form.year }}</div>
      <h2 class="sheet-title">MONTHLY ATTENDANCE RECORD</h2>
      <div class="sheet-info">
        <span>Grade: {{ record.grade }}</span>
        <span>Section: {{ record.section }}</span>
        <span>Adviser: <input v-model="record.adviser" @change="saveSummary" class="adviser-input" /></span>
      </div>

      <div class="table-wrapper">
        <table class="attendance-table monthly-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2" class="name-col">NAME (Last Name, First Name, Middle Name)</th>
              <th v-for="d in daysInMonth" :key="d" :class="{ weekend: isWeekend(d), excluded: isExcluded(d) }">
                {{ d }}
                <button v-if="!isWeekend(d)" @click="toggleExcludeDate(d)" class="exclude-btn" :title="isExcluded(d) ? 'Restore date' : 'Remove date (no classes)'">
                  {{ isExcluded(d) ? '↺' : '✕' }}
                </button>
              </th>
              <th colspan="2">Total for the Month ({{ schoolDays }})</th>
              <th rowspan="2">Remarks</th>
            </tr>
            <tr>
              <th v-for="d in daysInMonth" :key="'d'+d" :class="{ weekend: isWeekend(d), excluded: isExcluded(d) }">
                <template v-if="isExcluded(d)">No classes</template>
                <template v-else>{{ dayLabels[(new Date(form.year, form.month - 1, d)).getDay()] }}</template>
              </th>
              <th>Present</th>
              <th>Absent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!record.entries || record.entries.length === 0">
              <td colspan="40" class="empty">No students found. Add students in Student Management first.</td>
            </tr>
            <template v-for="(group, gi) in genderGroups" :key="gi">
              <tr class="gender-sep-row">
                <td :colspan="totalCols">{{ group.label }}</td>
              </tr>
              <tr v-for="(entry, idx) in group.entries" :key="entry.studentId">
                <td>{{ startNum(gi) + idx }}</td>
                <td class="name-col">{{ entry.name }}</td>
                <td v-for="d in daysInMonth" :key="d"
                    :class="['day-cell', { weekend: isWeekend(d), excluded: isExcluded(d) }]">
                  <select v-if="!isDisabled(d)"
                          :value="entry.days[d] || ''"
                          @change="updateDay(entry, d, $event.target.value)"
                          class="day-select">
                    <option value=""></option>
                    <option value="A">x</option>
                    <option value="◤">◤</option>
                    <option value="◢">◢</option>
                    <option value="E">E</option>
                  </select>
                </td>
                <td class="total-cell present">{{ Math.round(entryPresent(entry) * 10) / 10 }}</td>
                <td class="total-cell absent">{{ entryAbsent(entry) }}</td>
                <td>
                  <input v-model="entry.remarks" @change="updateRemarks(entry)" class="remarks-input" />
                </td>
              </tr>
              <tr class="summary-row">
                <td colspan="2" class="summary-label">{{ group.label }} TOTAL</td>
                <td v-for="d in daysInMonth" :key="'s'+gi+'-'+d"
                    :class="['day-cell', { weekend: isWeekend(d), excluded: isExcluded(d) }]">
                  <span v-if="!isDisabled(d)" class="day-total">{{ group.total(d) }}</span>
                </td>
                <td class="total-cell present">{{ Math.round(group.sumPresent * 10) / 10 }}</td>
                <td class="total-cell absent">{{ group.sumAbsent }}</td>
                <td></td>
              </tr>
            </template>
            <tr class="summary-row combined" v-if="record.entries && record.entries.length">
              <td colspan="2" class="summary-label">COMBINED TOTAL</td>
              <td v-for="d in daysInMonth" :key="'c'+d"
                  :class="['day-cell', { weekend: isWeekend(d), excluded: isExcluded(d) }]">
                <span v-if="!isDisabled(d)" class="day-total">{{ dayTotal(record.entries, d, 'all') }}</span>
              </td>
              <td class="total-cell present">{{ Math.round((genderGroups.reduce((s, g) => s + g.sumPresent, 0)) * 10) / 10 }}</td>
              <td class="total-cell absent">{{ sumAbsent('all') }}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="summary-section" v-if="record.entries && record.entries.length">
        <h3>SUMMARY</h3>
        <table class="summary-table">
          <thead>
            <tr>
              <th></th>
              <th>M</th>
              <th>F</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="summary-label">Enrolment as of 1st Friday of the SY</td>
              <td><input type="number" v-model.number="summaryEdits.enr_m" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.enr_f" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.enr_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Late enrolment during the month</td>
              <td><input type="number" v-model.number="summaryEdits.late_m" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.late_f" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.late_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Registered Learners as of end of month</td>
              <td><input type="number" v-model.number="summaryEdits.reg_m" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.reg_f" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.reg_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Percentage of Enrolment</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_enr_m" @change="saveSummary" class="summary-input" />%</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_enr_f" @change="saveSummary" class="summary-input" />%</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_enr_t" @change="saveSummary" class="summary-input" />%</td>
            </tr>
            <tr>
              <td class="summary-label">Average Daily Attendance</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.ada_m" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.ada_f" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.ada_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Percentage of Attendance</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_m" @change="saveSummary" class="summary-input" />%</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_f" @change="saveSummary" class="summary-input" />%</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_t" @change="saveSummary" class="summary-input" />%</td>
            </tr>
            <tr>
              <td class="summary-label">Number of students absent for 5 consecutive days</td>
              <td><input type="number" v-model.number="summaryEdits.abs5_m" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.abs5_f" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.abs5_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">NLS</td>
              <td><input type="number" v-model.number="summaryEdits.nls_m" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.nls_f" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.nls_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Transferred out</td>
              <td><input type="number" v-model.number="summaryEdits.transfer_out_m" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.transfer_out_f" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.transfer_out_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Transferred in</td>
              <td><input type="number" v-model.number="summaryEdits.transfer_in_m" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.transfer_in_f" @change="saveSummary" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.transfer_in_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="legends">
        <h3>LEGENDS:</h3>
        <div class="legend-grid">
          <span><strong>(blank)</strong> - Present</span>
          <span><strong>x</strong> - Absent</span>
          <span><strong>◤</strong> - Tardy</span>
          <span><strong>◢</strong> - Half Day</span>
          <span><strong>E</strong> - Entered (days before are absent)</span>
        </div>
        <p class="legend-note">Weekend columns and dates with no classes are grayed out and disabled. Click ✕ on a date header to mark it as no classes.</p>
      </div>

      <div class="sheet-actions">
        <div class="export-group" v-if="record && availableSheets.length">
          <select v-if="availableSheets.length > 1" v-model="selectedSheet" class="sheet-select">
            <option value="" disabled>Select month sheet...</option>
            <option v-for="s in availableSheets" :key="s" :value="s">{{ s }}</option>
          </select>
          <button @click="exportToSF2" class="btn-primary" :disabled="!selectedSheet || exporting">
            {{ exporting ? 'Exporting...' : 'Export to SF2' }}
          </button>
        </div>
        <button @click="goBack" class="btn-secondary">Back</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAttendanceStore } from '../stores/attendance'
import { useAuthStore } from '../stores/auth'

const store = useAttendanceStore()
const auth = useAuthStore()

const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const sectionsByGrade = {
  'Grade 7': ['Pine', 'Molave'],
  'Grade 8': ['Cypress', 'Narra'],
  'Grade 9': ['Kamagong', 'Mahogany'],
  'Grade 10': ['Acacia', 'Yakal']
}
const availableSections = computed(() => sectionsByGrade[form.grade] || [])

const now = new Date()
const years = []
for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 2; y++) years.push(y)

const form = reactive({
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  grade: 'Grade 7',
  section: ''
})

const record = ref(null)
const loadError = ref('')
const studentsLookup = ref({})
const summaryEdits = reactive({ enr_m: 0, enr_f: 0, enr_t: 0, late_m: 0, late_f: 0, late_t: 0, reg_m: 0, reg_f: 0, reg_t: 0, pct_enr_m: 0, pct_enr_f: 0, pct_enr_t: 0, ada_m: 0, ada_f: 0, ada_t: 0, pct_m: 0, pct_f: 0, pct_t: 0, abs5_m: 0, abs5_f: 0, abs5_t: 0, nls_m: 0, nls_f: 0, nls_t: 0, transfer_out_m: 0, transfer_out_f: 0, transfer_out_t: 0, transfer_in_m: 0, transfer_in_f: 0, transfer_in_t: 0 })

const availableSheets = ref([])
const selectedSheet = ref('')
const exporting = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('/api/export/sheets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const data = await res.json()
    if (data.sheets) {
      availableSheets.value = data.sheets
      if (data.sheets.length === 1) selectedSheet.value = data.sheets[0]
    }
  } catch {}
})

async function exportToSF2() {
  if (!selectedSheet.value || !record.value?.entries) return
  exporting.value = true
  try {
    const res = await fetch('/api/export/sf2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetName: selectedSheet.value,
        entries: record.value.entries,
        month: form.month,
        year: form.year,
        grade: form.grade,
        section: form.section,
        adviser: record.value.adviser || '',
        summary_data: {
          enr_m: summaryEdits.enr_m,
          enr_f: summaryEdits.enr_f,
          enr_t: summaryEdits.enr_t,
          late_m: summaryEdits.late_m,
          late_f: summaryEdits.late_f,
          late_t: summaryEdits.late_t,
          reg_m: summaryEdits.reg_m,
          reg_f: summaryEdits.reg_f,
          reg_t: summaryEdits.reg_t,
          pct_enr_m: summaryEdits.pct_enr_m,
          pct_enr_f: summaryEdits.pct_enr_f,
          pct_enr_t: summaryEdits.pct_enr_t,
          ada_m: summaryEdits.ada_m,
          ada_f: summaryEdits.ada_f,
          ada_t: summaryEdits.ada_t,
          pct_m: summaryEdits.pct_m,
          pct_f: summaryEdits.pct_f,
          pct_t: summaryEdits.pct_t,
          abs5_m: summaryEdits.abs5_m,
          abs5_f: summaryEdits.abs5_f,
          abs5_t: summaryEdits.abs5_t,
          nls_m: summaryEdits.nls_m,
          nls_f: summaryEdits.nls_f,
          nls_t: summaryEdits.nls_t,
          transfer_out_m: summaryEdits.transfer_out_m,
          transfer_out_f: summaryEdits.transfer_out_f,
          transfer_out_t: summaryEdits.transfer_out_t,
          transfer_in_m: summaryEdits.transfer_in_m,
          transfer_in_f: summaryEdits.transfer_in_f,
          transfer_in_t: summaryEdits.transfer_in_t
        },
        excluded_dates: record.value.excluded_dates || []
      })
    })
    if (!res.ok) {
      const err = await res.json()
      alert('Export failed: ' + (err.error || 'Unknown error'))
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SF2_${selectedSheet.value}_${form.year}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    alert('Export failed: ' + err.message)
  } finally {
    exporting.value = false
  }
}

const daysInMonth = computed(() => {
  return new Date(form.year, form.month, 0).getDate()
})

function isWeekend(d) {
  const day = new Date(form.year, form.month - 1, d).getDay()
  return day === 0 || day === 6
}

function isExcluded(d) {
  return record.value?.excluded_dates?.includes(d) ?? false
}

function isDisabled(d) {
  return isWeekend(d) || isExcluded(d)
}

const schoolDays = computed(() => {
  let count = 0
  for (let d = 1; d <= daysInMonth.value; d++) {
    if (!isDisabled(d)) count++
  }
  return count
})

const totalCols = computed(() => daysInMonth.value + 5)

function entriesByGender(gender) {
  if (!record.value?.entries) return []
  if (gender === 'all') return record.value.entries
  return record.value.entries.filter(e => (e.gender || '').toLowerCase() === gender)
}

function dayTotal(entries, day, gender) {
  const filtered = gender === 'all' ? entries : entries.filter(e => (e.gender || '').toLowerCase() === gender)
  let count = 0
  for (const e of filtered) {
    const enrollDay = enrollmentDay(e)
    if (enrollDay !== null && day < enrollDay) continue
    const s = e.days[String(day)]
    if (!s || s === '◤' || s === 'T') count++
    else if (s === '◢' || s === 'H') count += 0.5
  }
  return count || ''
}

function enrollmentDay(entry) {
  const eDates = Object.keys(entry.days || {}).filter(d => entry.days[d] === 'E')
  return eDates.length ? Math.min(...eDates.map(Number)) : null
}

function entryAbsent(entry) {
  const enrollDay = enrollmentDay(entry)
  let count = 0
  for (const d of Object.keys(entry.days || {})) {
    const dayNum = parseInt(d, 10)
    if (isDisabled(dayNum)) continue
    if (enrollDay !== null && dayNum < enrollDay) { count++; continue }
    const s = entry.days[d]
    if (s === 'A') count++
    else if (s === '◢' || s === 'H') count += 0.5
  }
  return count
}

function entryPresent(entry) {
  return Math.max(0, schoolDays.value - entryAbsent(entry))
}

function sumPresent(gender) {
  const entries = entriesByGender(gender)
  const total = entries.reduce((sum, e) => sum + entryPresent(e), 0)
  return Math.round(total * 10) / 10
}

function sumAbsent(gender) {
  const entries = entriesByGender(gender)
  const total = entries.reduce((sum, e) => sum + entryAbsent(e), 0)
  return total
}

const genderGroups = computed(() => {
  if (!record.value?.entries) return []
  const boys = record.value.entries.filter(e => (e.gender || '').toLowerCase() === 'male')
  const girls = record.value.entries.filter(e => (e.gender || '').toLowerCase() === 'female')
  const groups = []
  if (boys.length) {
    groups.push({
      label: 'BOYS',
      entries: boys,
      total: (d) => dayTotal(boys, d, 'all'),
      sumPresent: boys.reduce((s, e) => s + entryPresent(e), 0),
      sumAbsent: boys.reduce((s, e) => s + entryAbsent(e), 0)
    })
  }
  if (girls.length) {
    groups.push({
      label: 'GIRLS',
      entries: girls,
      total: (d) => dayTotal(girls, d, 'all'),
      sumPresent: girls.reduce((s, e) => s + entryPresent(e), 0),
      sumAbsent: girls.reduce((s, e) => s + entryAbsent(e), 0)
    })
  }
  return groups
})

const summaryData = computed(() => {
  if (!record.value?.entries) return null
  const groups = genderGroups.value
  const boys = groups.find(g => g.label === 'BOYS')
  const girls = groups.find(g => g.label === 'GIRLS')
  const mCount = boys ? boys.entries.length : 0
  const fCount = girls ? girls.entries.length : 0
  const lateM = summaryEdits.late_m
  const lateF = summaryEdits.late_f
  const mPresent = boys ? boys.sumPresent : 0
  const fPresent = girls ? girls.sumPresent : 0
  const sd = schoolDays.value || 1
  const mADA = Math.round((mPresent / sd) * 10) / 10
  const fADA = Math.round((fPresent / sd) * 10) / 10
  const tADA = Math.round(((mPresent + fPresent) / sd) * 10) / 10
  const mInit = mCount - lateM
  const fInit = fCount - lateF
  const tInit = mInit + fInit
  return {
    enrollment: { m: mInit, f: fInit, total: tInit },
    lateEnrolment: {
      m: record.value.entries.filter(e => e.late_enrollee && (e.gender || '').toLowerCase() === 'male').length,
      f: record.value.entries.filter(e => e.late_enrollee && (e.gender || '').toLowerCase() === 'female').length,
      total: record.value.entries.filter(e => e.late_enrollee).length
    },
    registeredLearners: { m: mCount, f: fCount, total: mCount + fCount },
    pctEnrolment: {
      m: mInit > 0 ? Math.round(mCount / mInit * 100) : 0,
      f: fInit > 0 ? Math.round(fCount / fInit * 100) : 0,
      total: tInit > 0 ? Math.round((mCount + fCount) / tInit * 100) : 0
    },
    avgDailyAttendance: { m: mADA, f: fADA, total: tADA },
    pctAttendance: {
      m: mCount ? Math.round((mPresent / sd / mCount) * 100) : 0,
      f: fCount ? Math.round((fPresent / sd / fCount) * 100) : 0,
      total: (mCount + fCount) ? Math.round(((mPresent + fPresent) / sd / (mCount + fCount)) * 100) : 0
    },
    absent5: { m: 0, f: 0, total: 0 }
  }
})

function startNum(gi) {
  let n = 1
  for (let i = 0; i < gi; i++) {
    n += genderGroups.value[i].entries.length
  }
  return n
}

async function openMonthly() {
  if (!form.grade || !form.section) {
    loadError.value = 'Please fill in all fields'
    return
  }
  loadError.value = ''
  const students = await store.getStudents({ grade: form.grade, section: form.section })
  const lookup = {}
  for (const s of students) lookup[s.id] = s.gender || ''
  studentsLookup.value = lookup
  let data = await store.fetchMonthly(form.grade, form.section, form.month, form.year)
  if (!data) {
    const entries = students.map(s => ({
      studentId: s.id,
      name: s.name,
      gender: s.gender || '',
      days: {},
      present: 0,
      absent: 0,
      remarks: '',
      late_enrollee: 0
    }))
    data = { month: form.month, year: form.year, grade: form.grade, section: form.section, adviser: auth.user?.name || '', entries }
    const result = await store.saveMonthly(data, auth.user)
    if (result) data.id = result.id
  } else {
    const currentIds = new Set(students.map(s => s.id))
    data.entries = data.entries.filter(e => currentIds.has(e.studentId))
    for (const e of data.entries) {
      e.gender = studentsLookup.value[e.studentId] || ''
    }
    const existingIds = new Set(data.entries.map(e => e.studentId))
    const missing = students.filter(s => !existingIds.has(s.id))
    if (missing.length > 0) {
      for (const s of missing) {
        data.entries.push({
          studentId: s.id,
          name: s.name,
          gender: s.gender || '',
          days: {},
          present: 0,
          absent: 0,
          remarks: '',
          late_enrollee: 1
        })
      }
      await store.saveMonthly(data, auth.user)
    }
  }
  record.value = data
  initSummaryEdits()
}

function initSummaryEdits() {
  if (!record.value) return
  const sd = record.value.summary_data || {}
  summaryEdits.ada_m = summaryData.value?.avgDailyAttendance?.m ?? 0
  summaryEdits.ada_f = summaryData.value?.avgDailyAttendance?.f ?? 0
  summaryEdits.ada_t = summaryData.value?.avgDailyAttendance?.total ?? 0
  summaryEdits.pct_m = summaryData.value?.pctAttendance?.m ?? 0
  summaryEdits.pct_f = summaryData.value?.pctAttendance?.f ?? 0
  summaryEdits.pct_t = summaryData.value?.pctAttendance?.total ?? 0
  summaryEdits.abs5_m = sd.abs5_m != null ? sd.abs5_m : 0
  summaryEdits.abs5_f = sd.abs5_f != null ? sd.abs5_f : 0
  summaryEdits.abs5_t = sd.abs5_t != null ? sd.abs5_t : 0
  summaryEdits.nls_m = sd.nls_m ?? 0
  summaryEdits.nls_f = sd.nls_f ?? 0
  summaryEdits.nls_t = sd.nls_t ?? 0
  summaryEdits.transfer_out_m = sd.transfer_out_m ?? 0
  summaryEdits.transfer_out_f = sd.transfer_out_f ?? 0
  summaryEdits.transfer_out_t = sd.transfer_out_t ?? 0
  summaryEdits.transfer_in_m = sd.transfer_in_m ?? 0
  summaryEdits.transfer_in_f = sd.transfer_in_f ?? 0
  summaryEdits.transfer_in_t = sd.transfer_in_t ?? 0
  const entries = record.value.entries || []
  const lateM = entries.filter(e => e.late_enrollee && (e.gender || '').toLowerCase() === 'male').length
  const lateF = entries.filter(e => e.late_enrollee && (e.gender || '').toLowerCase() === 'female').length
  summaryEdits.late_m = sd.late_m != null ? sd.late_m : lateM
  summaryEdits.late_f = sd.late_f != null ? sd.late_f : lateF
  summaryEdits.late_t = sd.late_t != null ? sd.late_t : (lateM + lateF)
  summaryEdits.enr_m = sd.enr_m ?? (summaryData.value?.enrollment?.m ?? 0)
  summaryEdits.enr_f = sd.enr_f ?? (summaryData.value?.enrollment?.f ?? 0)
  summaryEdits.enr_t = sd.enr_t ?? (summaryData.value?.enrollment?.total ?? 0)
  summaryEdits.reg_m = sd.reg_m ?? (summaryData.value?.registeredLearners?.m ?? 0)
  summaryEdits.reg_f = sd.reg_f ?? (summaryData.value?.registeredLearners?.f ?? 0)
  summaryEdits.reg_t = sd.reg_t ?? (summaryData.value?.registeredLearners?.total ?? 0)
  summaryEdits.pct_enr_m = sd.pct_enr_m ?? (summaryData.value?.pctEnrolment?.m ?? 0)
  summaryEdits.pct_enr_f = sd.pct_enr_f ?? (summaryData.value?.pctEnrolment?.f ?? 0)
  summaryEdits.pct_enr_t = sd.pct_enr_t ?? (summaryData.value?.pctEnrolment?.total ?? 0)
}

async function saveSummary() {
  if (!record.value?.id) return
  await fetch(`/api/monthly/${record.value.id}/summary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adviser: record.value.adviser,
      summary_data: {
        enr_m: summaryEdits.enr_m,
        enr_f: summaryEdits.enr_f,
        enr_t: summaryEdits.enr_t,
        late_m: summaryEdits.late_m,
        late_f: summaryEdits.late_f,
        late_t: summaryEdits.late_t,
        reg_m: summaryEdits.reg_m,
        reg_f: summaryEdits.reg_f,
        reg_t: summaryEdits.reg_t,
        pct_enr_m: summaryEdits.pct_enr_m,
        pct_enr_f: summaryEdits.pct_enr_f,
        pct_enr_t: summaryEdits.pct_enr_t,
        ada_m: summaryEdits.ada_m,
        ada_f: summaryEdits.ada_f,
        ada_t: summaryEdits.ada_t,
        pct_m: summaryEdits.pct_m,
        pct_f: summaryEdits.pct_f,
        pct_t: summaryEdits.pct_t,
        abs5_m: summaryEdits.abs5_m,
        abs5_f: summaryEdits.abs5_f,
        abs5_t: summaryEdits.abs5_t,
        nls_m: summaryEdits.nls_m,
        nls_f: summaryEdits.nls_f,
        nls_t: summaryEdits.nls_t,
        transfer_out_m: summaryEdits.transfer_out_m,
        transfer_out_f: summaryEdits.transfer_out_f,
        transfer_out_t: summaryEdits.transfer_out_t,
        transfer_in_m: summaryEdits.transfer_in_m,
        transfer_in_f: summaryEdits.transfer_in_f,
        transfer_in_t: summaryEdits.transfer_in_t
      }
    })
  })
}

function goBack() {
  record.value = null
}

async function updateDay(entry, day, status) {
  entry.days[day] = status
  await store.updateMonthlyEntry(record.value.id, entry.studentId, day, status, auth.user?.id, auth.user?.role)
  const res = await store.fetchMonthly(form.grade, form.section, form.month, form.year)
  if (res) {
    const updated = res.entries.find(e => e.studentId === entry.studentId)
    if (updated) {
      entry.present = updated.present
      entry.absent = updated.absent
    }
  }
  refreshSummaryFromLive()
}

function refreshSummaryFromLive() {
  const s = summaryData.value
  if (!s) return
  summaryEdits.pct_m = s.pctAttendance.m
  summaryEdits.pct_f = s.pctAttendance.f
  summaryEdits.pct_t = s.pctAttendance.total
  summaryEdits.ada_m = s.avgDailyAttendance.m
  summaryEdits.ada_f = s.avgDailyAttendance.f
  summaryEdits.ada_t = s.avgDailyAttendance.total
  saveSummary()
}

async function toggleExcludeDate(d) {
  if (!record.value) return
  const excluded = record.value.excluded_dates || []
  const idx = excluded.indexOf(d)
  if (idx >= 0) {
    excluded.splice(idx, 1)
  } else {
    excluded.push(d)
    for (const entry of record.value.entries) {
      if (entry.days[d]) {
        delete entry.days[d]
        await store.updateMonthlyEntry(record.value.id, entry.studentId, d, '', auth.user?.id, auth.user?.role)
      }
    }
  }
  await fetch(`/api/monthly/${record.value.id}/excluded-dates`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ excluded_dates: excluded })
  })
  const res = await store.fetchMonthly(form.grade, form.section, form.month, form.year)
  if (res) {
    record.value = res
    initSummaryEdits()
    refreshSummaryFromLive()
  }
}

async function updateRemarks(entry) {
  await store.updateMonthlyRemarks(record.value.id, entry.studentId, entry.remarks)
}
</script>
