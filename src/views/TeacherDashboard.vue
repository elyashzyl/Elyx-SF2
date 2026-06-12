<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {{ auth.user.name }}. Manage your schedule and attendance records.</p>
    </div>
    <div class="dash-cards">
      <router-link to="/attendance" class="dash-card">
        <h3>Take Attendance</h3>
        <p>Record daily attendance for your class</p>
      </router-link>
      <router-link to="/schedule" class="dash-card">
        <h3>My Schedule</h3>
        <p>View and manage your teaching schedule</p>
      </router-link>
    </div>

    <div class="schedule-sidebar-layout" style="margin-top:24px">
      <div class="card school-calendar-card">
        <div class="card-header"><h2>School Calendar</h2></div>
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
                     :style="{ background: ev.color || eventTypeColor(ev.type) }">
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
        <div class="card-header"><h2>My Weekly Schedule</h2></div>
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
            <div v-for="day in daysOfWeek" :key="day" class="cal-day-cell">
              <div v-for="entry in getEntries(day, p.key)" :key="entry.id"
                   class="cal-entry-card"
                   :style="{ background: entryColor(entry) }">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const periodKeys = ['am1', 'am2', 'am3', 'am4', 'am5', 'am6', 'pm1', 'pm2', 'pm3', 'pm4']
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

function to12h(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return h12 + ':' + m + ' ' + ampm
}

const schedule = ref([])
const loading = ref(true)
const timeSettings = ref({})

const periodsWithTime = computed(() => {
  const s = timeSettings.value
  return periodKeys.map(p => {
    const start = s[p + '_start'] ?? '07:00'
    const end = s[p + '_end'] ?? '07:50'
    return { key: p, time: start && end ? to12h(start) + ' - ' + to12h(end) : '' }
  })
})

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
  const pad = (n) => String(n).padStart(2, '0')
  const rows = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = daysInPrev - i; const pm = month - 1 < 0 ? 11 : month - 1; const py = month - 1 < 0 ? year - 1 : year
    rows.push({ num: d, other: true, today: false, events: getEventsForDate(`${py}-${pad(pm + 1)}-${pad(d)}`) })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${pad(month + 1)}-${pad(d)}`
    rows.push({ num: d, other: false, today: ds === todayStr, events: getEventsForDate(ds) })
  }
  const remaining = 7 - (rows.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nm = month + 1 > 11 ? 0 : month + 1; const ny = month + 1 > 11 ? year + 1 : year
      rows.push({ num: d, other: true, today: false, events: getEventsForDate(`${ny}-${pad(nm + 1)}-${pad(d)}`) })
    }
  }
  return rows
})

function getEventsForDate(dateStr) {
  return events.value.filter(e => e.event_date === dateStr)
}

function getEntries(day, period) {
  return schedule.value.filter(e => e.day_of_week === day && e.period === period)
}

onMounted(async () => {
  await loadTimeSettings()
  await loadSchedule()
  await loadEvents()
  loading.value = false
})

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
    for (const p of periodKeys) { next[p + '_start'] = ''; next[p + '_end'] = '' }
    timeSettings.value = next
  }
}

async function loadSchedule() {
  if (!auth.user?.id) { schedule.value = []; return }
  try {
    const res = await fetch('/api/schedules/' + auth.user.id)
    schedule.value = await res.json()
  } catch { schedule.value = [] }
}

async function loadEvents() {
  try {
    const res = await fetch('/api/events/calendar')
    events.value = await res.json()
  } catch { events.value = [] }
}
</script>