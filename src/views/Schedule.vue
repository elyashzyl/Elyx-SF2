<template>
  <div class="schedule-page">
    <div class="page-header">
      <h1>{{ isAdmin ? (editingTeacher ? editingTeacher.name + '\'s Schedule' : 'Teacher Schedule') : 'My Schedule' }}</h1>
      <p>Manage your teaching schedule, view school events, and track important dates.</p>
      <div class="page-header-actions">
        <select v-if="isAdmin" v-model="editingTeacherId" @change="loadSchedule" class="teacher-select">
          <option value="">Select a teacher...</option>
          <option v-for="u in teachers" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
        <button @click="openAddForm" class="btn-primary">+ Add Entry</button>
        <button @click="showTimeEditor = true" class="btn-secondary">Set Period Times</button>
      </div>
    </div>

    <div v-if="showTimeEditor" class="modal-overlay" @click.self="cancelTimeEditor">
      <div class="form-card schedule-form time-editor-modal">
        <h3>Period Time Settings</h3>
        <p style="font-size:.82rem;color:var(--text-sub);margin-bottom:12px">Set the default time range for each period.</p>
        <div class="time-editor-grid">
          <div v-for="p in periodKeys" :key="p" class="time-editor-row">
            <span class="time-editor-label" :style="{ background: periodColor(p) }">{{ p.toUpperCase() }}</span>
            <input :value="timeVal(p, 'start')" @input="setTimeVal(p, 'start', $event.target.value)" type="time" class="time-editor-input" />
            <span class="time-editor-sep">to</span>
            <input :value="timeVal(p, 'end')" @input="setTimeVal(p, 'end', $event.target.value)" type="time" class="time-editor-input" />
          </div>
        </div>
        <div class="form-actions">
          <button @click="saveTimeSettings" class="btn-primary" :disabled="savingTimes">{{ savingTimes ? 'Saving...' : 'Save Times' }}</button>
          <button @click="cancelTimeEditor" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>

    <div class="schedule-sidebar-layout">
      <div class="card school-calendar-card">
        <div class="card-header">
          <h2>School Calendar</h2>
          <button v-if="isAdmin" @click="openEventForm" class="btn-sm btn-primary">+ Add Event</button>
        </div>
        <div class="month-cal">
            <div class="month-cal-header">
            <div class="month-cal-nav">
              <button @click="prevMonth" class="btn-sm btn-secondary">&lsaquo;</button>
              <button @click="nextMonth" class="btn-sm btn-secondary">&rsaquo;</button>
            </div>
            <span class="month-cal-title">{{ monthNames[calMonth] }} {{ calYear }}</span>
            <button @click="todayMonth" class="btn-sm btn-secondary today-btn">Today</button>
          </div>
          <div class="month-cal-grid">
            <div v-for="d in dayHeaders" :key="d" class="month-cal-day-header">{{ d }}</div>
            <div v-for="(day, i) in calendarDays" :key="i"
                 class="month-cal-day"
                 :class="{ 'month-other': day.other, 'month-today': day.today, 'month-has-events': day.events.length > 0 }">
              <span class="month-cal-day-num">{{ day.num }}</span>
              <div class="month-cal-day-entries">
                <div v-for="ev in day.events.slice(0, 2)" :key="ev.id"
                     class="month-cal-event"
                     :style="{ background: ev.color || eventTypeColor(ev.type) }"
                     @click.stop="isAdmin && openEventForm(ev)">
                  <span class="month-cal-event-title">{{ ev.title }}</span>
                </div>
                <div v-if="day.events.length > 2" class="month-cal-more">+{{ day.events.length - 2 }} more</div>
              </div>
            </div>
          </div>
        </div>
        <div class="cal-event-legend">
          <span v-for="t in eventTypes" :key="t.key" class="cal-event-legend-item">
            <span class="cal-event-dot" :style="{ background: t.color }"></span>
            {{ t.label }}
          </span>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>Schedule</h2></div>
        <div class="cal-grid">
          <div class="cal-header-row">
            <div class="cal-time-header"></div>
            <div v-for="day in daysOfWeek" :key="day" class="cal-day-header">{{ day }}</div>
          </div>
          <div v-for="p in periodsWithTime" :key="p.key" class="cal-body-row">
            <div class="cal-time-cell">
              <span class="cal-period-label">{{ p.key.toUpperCase() }}</span>
              <span class="cal-time-label">{{ p.time }}</span>
            </div>
            <div v-for="day in daysOfWeek" :key="day" class="cal-day-cell"
                 @click="openAddForm(day, p.key)">
              <div v-for="entry in getEntries(day, p.key)" :key="entry.id"
                   class="cal-entry-card"
                   :style="{ background: entryColor(entry) }"
                   @click.stop="openEditForm(entry)">
                <div class="cal-entry-subjects">
                  <span v-for="s in (entry.subject || '').split(',').map(x=>x.trim()).filter(Boolean)" :key="s" class="entry-subject-tag">{{ s }}</span>
                  <span v-if="!entry.subject" class="entry-subject-none">—</span>
                </div>
                <div class="cal-entry-detail">{{ entry.grade }}<span v-if="entry.grade && entry.section"> / </span>{{ entry.section }}</div>
                <div class="cal-entry-time">{{ to12h(entry.start_time) || '--:--' }} - {{ to12h(entry.end_time) || '--:--' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Important Dates</h2>
        <button v-if="isAdmin" @click="openQuarterlyForm" class="btn-sm btn-primary">+ Add Row</button>
      </div>
      <div class="table-wrapper">
        <table class="attendance-table quarterly-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>First Grading</th>
              <th>Second Grading</th>
              <th>Third Grading</th>
              <th>Fourth Grading</th>
              <th v-if="isAdmin" class="action-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in quarterlyEvents" :key="ev.id">
              <td><strong>{{ ev.event_name }}</strong></td>
              <td>{{ ev.first_grading }}</td>
              <td>{{ ev.second_grading }}</td>
              <td>{{ ev.third_grading }}</td>
              <td>{{ ev.fourth_grading }}</td>
              <td v-if="isAdmin" class="action-col">
                <button @click="openQuarterlyForm(ev)" class="btn-sm btn-secondary">Edit</button>
                <button @click="deleteQuarterly(ev.id)" class="btn-sm btn-danger">Delete</button>
              </td>
            </tr>
            <tr v-if="!quarterlyEvents.length">
              <td :colspan="isAdmin ? 6 : 5" style="text-align:center;color:var(--text-sub);padding:24px">No important dates set yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Schedule Entry Form -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="form-card schedule-form">
        <h3>{{ editingEntry ? 'Edit Entry' : 'Add Entry' }}</h3>
        <form @submit.prevent="handleSave">
          <div class="form-row">
            <div class="form-group">
              <label>Day</label>
              <select v-model="form.day" required>
                <option v-for="d in daysOfWeek" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Period</label>
              <select v-model="form.period" @change="onPeriodChange" required>
                <option v-for="p in periodKeys" :key="p" :value="p">{{ p.toUpperCase() }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Time</label>
              <input v-model="form.start_time" type="time" />
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input v-model="form.end_time" type="time" />
            </div>
          </div>
          <div class="form-group">
            <label>Subjects</label>
            <div class="tag-input">
              <span v-for="(s, i) in form.subjects" :key="i" class="tag-chip">
                {{ s }}
                <button type="button" @click="removeSubject(i)" class="tag-chip-remove">&times;</button>
              </span>
              <input v-model="subjectInput" @keydown.enter.prevent="addSubject" @keydown.,.prevent="addSubject" @blur="addSubject" placeholder="Type and press Enter or comma" class="tag-field" />
            </div>
          </div>
          <div class="form-group">
            <label>Grades</label>
            <div class="checkbox-group">
              <label v-for="g in grades" :key="g" class="checkbox-label" :class="{ active: form.grades.includes(g) }">
                <input type="checkbox" :value="g" v-model="form.grades" />
                {{ g }}
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Sections</label>
            <div class="checkbox-group">
              <label v-for="s in availableSections" :key="s" class="checkbox-label" :class="{ active: form.sections.includes(s) }">
                <input type="checkbox" :value="s" v-model="form.sections" />
                {{ s }}
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : (editingEntry ? 'Update' : 'Add') }}</button>
            <button type="button" @click="closeForm" class="btn-secondary">Cancel</button>
            <button type="button" v-if="editingEntry" @click="handleDelete" class="btn-sm btn-danger" style="margin-left:auto">Delete</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Calendar Event Form -->
    <div v-if="showEventForm" class="modal-overlay" @click.self="closeEventForm">
      <div class="form-card schedule-form">
        <h3>{{ editingEvent ? 'Edit Event' : 'Add Event' }}</h3>
        <form @submit.prevent="handleSaveEvent">
          <div class="form-group">
            <label>Title</label>
            <input v-model="eventForm.title" required placeholder="e.g. National Heroes Day" />
          </div>
          <div class="form-group">
            <label>Type</label>
            <select v-model="eventForm.type" required>
              <option v-for="t in eventTypes" :key="t.key" :value="t.key">{{ t.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input v-model="eventForm.event_date" type="date" required />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="savingEvent">{{ savingEvent ? 'Saving...' : (editingEvent ? 'Update' : 'Add') }}</button>
            <button type="button" @click="closeEventForm" class="btn-secondary">Cancel</button>
            <button type="button" v-if="editingEvent" @click="deleteEvent" class="btn-sm btn-danger" style="margin-left:auto">Delete</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Quarterly Event Form -->
    <div v-if="showQuarterlyForm" class="modal-overlay" @click.self="closeQuarterlyForm">
      <div class="form-card schedule-form">
        <h3>{{ editingQuarterly ? 'Edit Row' : 'Add Row' }}</h3>
        <form @submit.prevent="handleSaveQuarterly">
          <div class="form-group">
            <label>Event</label>
            <input v-model="quarterlyForm.event_name" required placeholder="e.g. Classroom Based Assessment" />
          </div>
          <div class="form-group">
            <label>First Grading</label>
            <input v-model="quarterlyForm.first_grading" placeholder="e.g. Jan 15-20, 2026" />
          </div>
          <div class="form-group">
            <label>Second Grading</label>
            <input v-model="quarterlyForm.second_grading" placeholder="e.g. Mar 15-20, 2026" />
          </div>
          <div class="form-group">
            <label>Third Grading</label>
            <input v-model="quarterlyForm.third_grading" placeholder="e.g. Jun 15-20, 2026" />
          </div>
          <div class="form-group">
            <label>Fourth Grading</label>
            <input v-model="quarterlyForm.fourth_grading" placeholder="e.g. Sep 15-20, 2026" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="savingQuarterly">{{ savingQuarterly ? 'Saving...' : (editingQuarterly ? 'Update' : 'Add') }}</button>
            <button type="button" @click="closeQuarterlyForm" class="btn-secondary">Cancel</button>
            <button type="button" v-if="editingQuarterly" @click="deleteQuarterly(editingQuarterly.id); closeQuarterlyForm()" class="btn-sm btn-danger" style="margin-left:auto">Delete</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="!isAdmin && !schedule.length && !loading" class="empty-state">
      <h3>No schedule yet</h3>
      <p>Add your teaching schedule to get started.</p>
      <button @click="openAddForm" class="btn-primary">Add Entry</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

const auth = useAuthStore()
const { addToast } = useToast()
const isAdmin = computed(() => auth.isAdmin)

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const periodKeys = ['am1', 'am2', 'am3', 'am4', 'am5', 'am6', 'pm1', 'pm2', 'pm3', 'pm4']
const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const sectionsByGrade = {
  'Grade 7': ['Pine', 'Molave'],
  'Grade 8': ['Cypress'],
  'Grade 9': ['Kamagong', 'Mahogany'],
  'Grade 10': ['Acacia', 'Yakal']
}

const periodColors = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#be123c', '#4f46e5']
const subjectColors = {}

const eventTypes = [
  { key: 'holiday', label: 'Holiday', color: '#ef4444' },
  { key: 'inset', label: 'Inset', color: '#f59e0b' },
  { key: 'co-curricular', label: 'Co-curricular', color: '#10b981' },
  { key: 'home-school', label: 'Home-School Collaboration', color: '#3b82f6' },
  { key: 'quarterly-exam', label: 'Quarterly Exam', color: '#8b5cf6' }
]

function eventTypeColor(type) {
  const t = eventTypes.find(e => e.key === type)
  return t ? t.color : '#6b7280'
}

function periodColor(p) {
  const idx = periodKeys.indexOf(p)
  return periodColors[idx] || '#6b7280'
}

function entryColor(entry) {
  const key = entry.subject || 'none'
  if (!subjectColors[key]) {
    const hue = (Object.keys(subjectColors).length * 47) % 360
    subjectColors[key] = `hsl(${hue}, 55%, 85%)`
  }
  return subjectColors[key]
}

const schedule = ref([])
const teachers = ref([])
const editingTeacherId = ref('')
const editingTeacher = ref(null)
const showForm = ref(false)
const editingEntry = ref(null)
const saving = ref(false)
const loading = ref(true)
const form = ref({ day: 'Monday', period: 'am1', start_time: '', end_time: '', subjects: [], grades: [], sections: [] })
const subjectInput = ref('')

function addSubject() {
  const val = subjectInput.value.trim().replace(/,+$/, '').trim()
  if (val && !form.value.subjects.includes(val)) {
    form.value.subjects.push(val)
  }
  subjectInput.value = ''
}

function removeSubject(i) {
  form.value.subjects.splice(i, 1)
}

const showTimeEditor = ref(false)
const timeSettings = ref({})
const savingTimes = ref(false)

const availableSections = computed(() => {
  const selected = form.value.grades
  if (!selected.length) return []
  const set = new Set()
  for (const g of selected) {
    for (const s of (sectionsByGrade[g] || [])) set.add(s)
  }
  return Array.from(set)
})

const teacherId = computed(() => isAdmin.value ? editingTeacherId.value : auth.user?.id)

function to12h(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return h12 + ':' + m + ' ' + ampm
}

const periodsWithTime = computed(() => {
  const s = timeSettings.value
  return periodKeys.map(p => {
    const start = s[p + '_start'] ?? '07:00'
    const end = s[p + '_end'] ?? '07:50'
    return { key: p, time: start && end ? to12h(start) + ' - ' + to12h(end) : '' }
  })
})

// Calendar
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const now = new Date()
const calMonth = ref(now.getMonth())
const calYear = ref(now.getFullYear())
const events = ref([])

function prevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else { calMonth.value-- }
}
function nextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else { calMonth.value++ }
}
function todayMonth() {
  const n = new Date()
  calMonth.value = n.getMonth()
  calYear.value = n.getFullYear()
}

const calendarDays = computed(() => {
  const year = calYear.value
  const month = calMonth.value
  const first = new Date(year, month, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const rows = []
  const pad = (n) => String(n).padStart(2, '0')

  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const dateStr = `${year}-${pad(month)}-${pad(d)}`
    const prevMonth = month - 1 < 0 ? 11 : month - 1
    const prevYear = month - 1 < 0 ? year - 1 : year
    const realDateStr = `${prevYear}-${pad(prevMonth + 1)}-${pad(d)}`
    rows.push({ num: d, other: true, today: false, events: getEventsForDate(realDateStr) })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
    rows.push({ num: d, other: false, today: dateStr === todayStr, events: getEventsForDate(dateStr) })
  }

  const remaining = 7 - (rows.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month + 1 > 11 ? 0 : month + 1
      const nextYear = month + 1 > 11 ? year + 1 : year
      const dateStr = `${nextYear}-${pad(nextMonth + 1)}-${pad(d)}`
      rows.push({ num: d, other: true, today: false, events: getEventsForDate(dateStr) })
    }
  }
  return rows
})

function getEventsForDate(dateStr) {
  return events.value.filter(e => e.event_date === dateStr)
}

const quarterlyEvents = ref([])

// Event form
const showEventForm = ref(false)
const editingEvent = ref(null)
const savingEvent = ref(false)
const eventForm = ref({ title: '', type: 'holiday', event_date: '' })

function openEventForm(ev) {
  if (ev) {
    editingEvent.value = ev
    eventForm.value = { title: ev.title, type: ev.type, event_date: ev.event_date }
  } else {
    editingEvent.value = null
    eventForm.value = { title: '', type: 'holiday', event_date: '' }
  }
  showEventForm.value = true
}

function closeEventForm() {
  showEventForm.value = false
  editingEvent.value = null
}

async function handleSaveEvent() {
  savingEvent.value = true
  try {
    const payload = { title: eventForm.value.title, type: eventForm.value.type, event_date: eventForm.value.event_date }
    if (editingEvent.value) {
      await fetch('/api/events/calendar/' + editingEvent.value.id, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      addToast('Event updated', 'success')
    } else {
      await fetch('/api/events/calendar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      addToast('Event added', 'success')
    }
    closeEventForm()
    await loadEvents()
  } catch {
    addToast('Failed to save event', 'error')
  } finally {
    savingEvent.value = false
  }
}

async function deleteEvent() {
  if (!editingEvent.value) return
  try {
    await fetch('/api/events/calendar/' + editingEvent.value.id, { method: 'DELETE' })
    addToast('Event deleted', 'success')
    closeEventForm()
    await loadEvents()
  } catch {
    addToast('Failed to delete event', 'error')
  }
}

// Quarterly form
const showQuarterlyForm = ref(false)
const editingQuarterly = ref(null)
const savingQuarterly = ref(false)
const quarterlyForm = ref({ event_name: '', first_grading: '', second_grading: '', third_grading: '', fourth_grading: '' })

function openQuarterlyForm(ev) {
  if (ev) {
    editingQuarterly.value = ev
    quarterlyForm.value = {
      event_name: ev.event_name,
      first_grading: ev.first_grading || '',
      second_grading: ev.second_grading || '',
      third_grading: ev.third_grading || '',
      fourth_grading: ev.fourth_grading || ''
    }
  } else {
    editingQuarterly.value = null
    quarterlyForm.value = { event_name: '', first_grading: '', second_grading: '', third_grading: '', fourth_grading: '' }
  }
  showQuarterlyForm.value = true
}

function closeQuarterlyForm() {
  showQuarterlyForm.value = false
  editingQuarterly.value = null
}

async function handleSaveQuarterly() {
  savingQuarterly.value = true
  try {
    const payload = { ...quarterlyForm.value }
    if (editingQuarterly.value) {
      await fetch('/api/events/quarterly/' + editingQuarterly.value.id, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      addToast('Updated', 'success')
    } else {
      await fetch('/api/events/quarterly', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      addToast('Added', 'success')
    }
    closeQuarterlyForm()
    await loadQuarterly()
  } catch {
    addToast('Failed to save', 'error')
  } finally {
    savingQuarterly.value = false
  }
}

async function deleteQuarterly(id) {
  try {
    await fetch('/api/events/quarterly/' + id, { method: 'DELETE' })
    addToast('Deleted', 'success')
    await loadQuarterly()
  } catch {
    addToast('Failed to delete', 'error')
  }
}

onMounted(async () => {
  await loadTimeSettings()
  if (isAdmin.value) {
    const all = await auth.getUsers()
    teachers.value = all.filter(u => u.role === 'teacher')
  }
  await loadSchedule()
  await loadEvents()
  await loadQuarterly()
  loading.value = false
})

async function loadEvents() {
  try {
    const res = await fetch('/api/events/calendar')
    events.value = await res.json()
  } catch { events.value = [] }
}

async function loadQuarterly() {
  try {
    const res = await fetch('/api/events/quarterly')
    quarterlyEvents.value = await res.json()
  } catch { quarterlyEvents.value = [] }
}

async function loadTimeSettings() {
  try {
    const res = await fetch('/api/settings')
    const data = await res.json()
    const next = {}
    for (const p of periodKeys) {
      const val = data['period_' + p]
      if (val) {
        const parts = val.split('-')
        next[p + '_start'] = parts[0] || ''
        next[p + '_end'] = parts[1] || ''
      } else {
        next[p + '_start'] = ''
        next[p + '_end'] = ''
      }
    }
    timeSettings.value = next
  } catch {
    const next = {}
    for (const p of periodKeys) {
      next[p + '_start'] = ''
      next[p + '_end'] = ''
    }
    timeSettings.value = next
  }
}

function timeVal(p, side) {
  return (timeSettings.value || {})[p + '_' + side] || ''
}

function setTimeVal(p, side, val) {
  timeSettings.value[p + '_' + side] = val
}

function cancelTimeEditor() {
  showTimeEditor.value = false
  loadTimeSettings()
}

async function saveTimeSettings() {
  savingTimes.value = true
  try {
    const settings = {}
    for (const p of periodKeys) {
      const start = timeSettings.value[p + '_start'] || ''
      const end = timeSettings.value[p + '_end'] || ''
      settings['period_' + p] = start && end ? start + '-' + end : ''
    }
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    })
    await loadTimeSettings()
    addToast('Period times saved', 'success')
    showTimeEditor.value = false
  } catch {
    addToast('Failed to save times', 'error')
  } finally {
    savingTimes.value = false
  }
}

async function loadSchedule() {
  if (!teacherId.value) {
    schedule.value = []
    return
  }
  try {
    const res = await fetch('/api/schedules/' + teacherId.value)
    schedule.value = await res.json()
    if (isAdmin.value) {
      const t = teachers.value.find(u => u.id === teacherId.value)
      editingTeacher.value = t || null
    }
  } catch {
    schedule.value = []
  }
}

function getEntries(day, period) {
  return schedule.value.filter(e => e.day_of_week === day && e.period === period)
}

function resetForm() {
  form.value = { day: 'Monday', period: 'am1', start_time: '', end_time: '', subjects: [], grades: [], sections: [] }
  subjectInput.value = ''
  editingEntry.value = null
}

function onPeriodChange() {
  if (!editingEntry.value) {
    form.value.start_time = timeSettings.value[form.value.period + '_start'] || ''
    form.value.end_time = timeSettings.value[form.value.period + '_end'] || ''
  }
}

function openAddForm(day, period) {
  resetForm()
  if (day) form.value.day = day
  if (period) form.value.period = period
  form.value.start_time = timeSettings.value[period + '_start'] || ''
  form.value.end_time = timeSettings.value[period + '_end'] || ''
  showForm.value = true
}

function openEditForm(entry) {
  editingEntry.value = entry
  form.value = {
    day: entry.day_of_week,
    period: entry.period,
    start_time: entry.start_time || '',
    end_time: entry.end_time || '',
    subjects: (entry.subject || '').split(',').map(s => s.trim()).filter(Boolean),
    grades: (entry.grade || '').split(',').map(s => s.trim()).filter(Boolean),
    sections: (entry.section || '').split(',').map(s => s.trim()).filter(Boolean)
  }
  subjectInput.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

async function handleSave() {
  saving.value = true
  try {
    const payload = {
      day_of_week: form.value.day,
      period: form.value.period,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      subject: form.value.subjects.join(', '),
      grade: form.value.grades.join(', '),
      section: form.value.sections.join(', ')
    }
    const tid = teacherId.value
    if (!tid) { addToast('No teacher selected', 'error'); return }

    if (editingEntry.value) {
      await fetch(`/api/schedules/${tid}/${editingEntry.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      addToast('Entry updated', 'success')
    } else {
      await fetch(`/api/schedules/${tid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      addToast('Entry added', 'success')
    }
    closeForm()
    await loadSchedule()
  } catch {
    addToast('Failed to save entry', 'error')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!editingEntry.value) return
  try {
    await fetch(`/api/schedules/${teacherId.value}/${editingEntry.value.id}`, { method: 'DELETE' })
    addToast('Entry deleted', 'success')
    closeForm()
    await loadSchedule()
  } catch {
    addToast('Failed to delete entry', 'error')
  }
}
</script>