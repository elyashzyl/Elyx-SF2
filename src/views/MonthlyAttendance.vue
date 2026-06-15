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
        <span>Adviser: {{ record.adviser }}</span>
      </div>

      <div class="table-wrapper">
        <table class="attendance-table monthly-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2" class="name-col">NAME (Last Name, First Name, Middle Name)</th>
              <th v-for="d in daysInMonth" :key="d" :class="{ weekend: isWeekend(d) }">
                {{ d }}
              </th>
              <th colspan="2">Total for the Month ({{ schoolDays }})</th>
              <th rowspan="2">Remarks</th>
            </tr>
            <tr>
              <th v-for="d in daysInMonth" :key="'d'+d" :class="{ weekend: isWeekend(d) }">
                {{ dayLabels[(new Date(form.year, form.month - 1, d)).getDay()] }}
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
                    :class="['day-cell', { weekend: isWeekend(d) }]">
                  <select v-if="!isWeekend(d)"
                          :value="entry.days[d] || ''"
                          @change="updateDay(entry, d, $event.target.value)"
                          class="day-select">
                    <option value=""></option>
                    <option value="E">E</option>
                    <option value="A">A</option>
                    <option value="◤">◤</option>
                    <option value="◢">◢</option>
                  </select>
                </td>
                <td class="total-cell present">{{ Math.round((schoolDays - (entry.absent || 0)) * 10) / 10 }}</td>
                <td class="total-cell absent">{{ entry.absent || 0 }}</td>
                <td>
                  <input v-model="entry.remarks" @change="updateRemarks(entry)" class="remarks-input" />
                </td>
              </tr>
              <tr class="summary-row">
                <td colspan="2" class="summary-label">{{ group.label }} TOTAL</td>
                <td v-for="d in daysInMonth" :key="'s'+gi+'-'+d"
                    :class="['day-cell', { weekend: isWeekend(d) }]">
                  <span v-if="!isWeekend(d)" class="day-total">{{ group.total(d) }}</span>
                </td>
                <td class="total-cell present">{{ Math.round(group.sumPresent * 10) / 10 }}</td>
                <td class="total-cell absent">{{ group.sumAbsent }}</td>
                <td></td>
              </tr>
            </template>
            <tr class="summary-row combined" v-if="record.entries && record.entries.length">
              <td colspan="2" class="summary-label">COMBINED TOTAL</td>
              <td v-for="d in daysInMonth" :key="'c'+d"
                  :class="['day-cell', { weekend: isWeekend(d) }]">
                <span v-if="!isWeekend(d)" class="day-total">{{ dayTotal(record.entries, d, 'all') }}</span>
              </td>
              <td class="total-cell present">{{ Math.round((genderGroups.reduce((s, g) => s + g.sumPresent, 0)) * 10) / 10 }}</td>
              <td class="total-cell absent">{{ sumAbsent('all') }}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="legends">
        <h3>LEGENDS:</h3>
        <div class="legend-grid">
          <span><strong>E</strong> - Entered (Present)</span>
          <span><strong>A</strong> - Absent</span>
          <span><strong>◤</strong> - Tardy</span>
          <span><strong>◢</strong> - Half Day</span>
        </div>
        <p class="legend-note">Weekend columns are grayed out and disabled.</p>
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
  'Grade 8': ['Cypress'],
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
        section: form.section
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

const schoolDays = computed(() => {
  let count = 0
  for (let d = 1; d <= daysInMonth.value; d++) {
    if (!isWeekend(d)) count++
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
    const s = e.days[String(day)]
    if (s === 'E') count++
    else if (s === '◤' || s === '◢' || s === 'T' || s === 'H') count += 0.5
  }
  return count || ''
}

function sumPresent(gender) {
  const entries = entriesByGender(gender)
  const total = entries.reduce((sum, e) => sum + (schoolDays - (e.absent || 0)), 0)
  return Math.round(total * 10) / 10
}

function sumAbsent(gender) {
  const entries = entriesByGender(gender)
  const total = entries.reduce((sum, e) => sum + (e.absent || 0), 0)
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
      sumPresent: boys.reduce((s, e) => s + (schoolDays - (e.absent || 0)), 0),
      sumAbsent: boys.reduce((s, e) => s + (e.absent || 0), 0)
    })
  }
  if (girls.length) {
    groups.push({
      label: 'GIRLS',
      entries: girls,
      total: (d) => dayTotal(girls, d, 'all'),
      sumPresent: girls.reduce((s, e) => s + (schoolDays - (e.absent || 0)), 0),
      sumAbsent: girls.reduce((s, e) => s + (e.absent || 0), 0)
    })
  }
  return groups
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
      remarks: ''
    }))
    data = { month: form.month, year: form.year, grade: form.grade, section: form.section, adviser: auth.user?.name || '', entries }
    const result = await store.saveMonthly(data, auth.user)
    if (result) data.id = result.id
  } else {
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
          remarks: ''
        })
      }
      await store.saveMonthly(data, auth.user)
    }
  }
  record.value = data
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
}

async function updateRemarks(entry) {
  await store.updateMonthlyRemarks(record.value.id, entry.studentId, entry.remarks)
}
</script>
