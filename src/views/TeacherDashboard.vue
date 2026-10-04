<template>
  <div class="dashboard teacher-overview">
    <!-- Header -->
    <header class="overview-header">
      <div class="overview-header-copy">
        <div class="overview-eyebrow">
          <span class="eyebrow-dot"></span>
          <span>Adviser Operations · DepEd Form 2 &amp; Daily Roll Call</span>
        </div>
        <h1>Classroom Overview</h1>
        <p v-if="teacherClass?.hasAdvisory">
          Welcome back, <strong>{{ auth.user?.name }}</strong>. 
          Adviser overview and live attendance tracking for <strong>{{ teacherClass.grade }} — {{ teacherClass.section }}</strong>.
        </p>
        <p v-else>
          Welcome back, <strong>{{ auth.user?.name }}</strong>. 
          Faculty attendance overview &amp; class records.
        </p>
      </div>

      <div class="overview-header-actions">
        <router-link 
          v-if="teacherClass?.hasAdvisory" 
          :to="todayAttendanceUrl" 
          class="take-attendance-btn" 
          title="Open Daily Attendance Sheet for Today"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>Take Today's Attendance</span>
        </router-link>

        <div v-if="teacherClass?.hasAdvisory" class="advisory-badge-chip">
          <span class="advisory-dot"></span>
          <span>{{ teacherClass.grade }} — {{ teacherClass.section }}</span>
        </div>

        <div class="overview-date-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{{ currentDateStr }}</span>
        </div>

        <button @click="loadStats" class="overview-refresh-btn" :disabled="loading" title="Refresh Class Statistics">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'spin-anim': loading }">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>{{ loading ? 'Syncing…' : 'Refresh' }}</span>
        </button>
      </div>
    </header>

    <!-- If Assigned Advisory Class -->
    <template v-if="teacherClass?.hasAdvisory">
      <!-- Campus Announcements for Teacher -->
      <section v-if="announcements.length > 0" class="announcements-bar card-box">
        <div class="announcement-banner-header">
          <div class="banner-title-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
            </svg>
            <h3>Faculty &amp; Campus Announcements</h3>
            <span class="ann-count-badge">{{ announcements.length }}</span>
          </div>
        </div>

        <div class="announcements-list-grid">
          <div
            v-for="ann in announcements"
            :key="ann.id"
            class="announcement-card"
            :class="['ann-priority--' + ann.priority, { 'ann-read': ann.is_read }]"
          >
            <div class="ann-card-top">
              <span class="ann-priority-pill" :class="'pill--' + ann.priority">{{ ann.priority.toUpperCase() }}</span>
              <span class="ann-date">{{ formatDate(ann.created_at) }}</span>
            </div>
            <h4 class="ann-title">{{ ann.title }}</h4>
            <p class="ann-content">{{ ann.content }}</p>
            <div class="ann-footer">
              <small>Posted by <strong>{{ ann.author_name || 'Administration' }}</strong></small>
              <button v-if="!ann.is_read" @click="markAnnouncementRead(ann.id)" class="btn-read-sm" type="button">Mark as Read</button>
              <span v-else class="read-indicator">✓ Read</span>
            </div>
          </div>
        </div>
      </section>

      <!-- KPI Metric Cards -->
      <section class="kpi-grid" aria-label="Advisory Performance Indicators">
        <!-- Card 1: Class Enrollment -->
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag">{{ teacherClass.grade }} — {{ teacherClass.section }}</span>
            <div class="kpi-icon kpi-icon--teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ teacherClass.students.total }}</span>
            <span class="kpi-unit">Enrolled Learners</span>
          </div>
          <div class="kpi-meta-split">
            <div class="mini-ratio-bar">
              <div 
                class="mini-ratio-fill male-fill" 
                :style="{ width: `${classMalePct}%` }" 
                :title="`Male: ${teacherClass.students.male}`"
              ></div>
              <div 
                class="mini-ratio-fill female-fill" 
                :style="{ width: `${classFemalePct}%` }" 
                :title="`Female: ${teacherClass.students.female}`"
              ></div>
            </div>
            <div class="mini-ratio-legend">
              <span><strong>{{ teacherClass.students.male }}</strong> Male</span>
              <span>•</span>
              <span><strong>{{ teacherClass.students.female }}</strong> Female</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Attendance Rate -->
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span 
              class="kpi-tag"
              :class="teacherClass.attendance.rate >= 95 ? 'kpi-tag--success' : teacherClass.attendance.rate >= 90 ? 'kpi-tag--warning' : 'kpi-tag--danger'"
            >
              {{ teacherClass.attendance.rate >= 95 ? 'Target Standard Met' : teacherClass.attendance.rate >= 90 ? 'Acceptable' : 'Needs Focus' }}
            </span>
            <div class="kpi-icon kpi-icon--rate">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ teacherClass.attendance.rate }}%</span>
            <span class="kpi-unit">Attendance Rate</span>
          </div>
          <div class="kpi-subtext">
            <span>DepEd Standard: <strong>≥ 95%</strong></span>
            <span class="subtext-divider">•</span>
            <span><strong>{{ teacherClass.attendance.present }}</strong> Present</span>
          </div>
        </div>

        <!-- Card 3: Today's Roll Call Status -->
        <div class="kpi-card" :class="teacherClass.todayAttendance?.submitted ? 'kpi-card--submitted' : 'kpi-card--pending'">
          <div class="kpi-card-header">
            <span class="kpi-tag" :class="teacherClass.todayAttendance?.submitted ? 'kpi-tag--success' : 'kpi-tag--warning'">
              {{ teacherClass.todayAttendance?.submitted ? "Today's Roll Call: Recorded" : "Today: Roll Call Pending" }}
            </span>
            <div class="kpi-icon" :class="teacherClass.todayAttendance?.submitted ? 'kpi-icon--success' : 'kpi-icon--faculty'">
              <svg v-if="teacherClass.todayAttendance?.submitted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num" style="font-size: 1.5rem;">
              {{ teacherClass.todayAttendance?.submitted ? 'Completed' : 'Pending' }}
            </span>
            <span class="kpi-unit">{{ teacherClass.todayAttendance?.date || 'Today' }}</span>
          </div>
          <div class="kpi-subtext">
            <span v-if="teacherClass.todayAttendance?.submitted">
              Daily sheet verified · {{ Number(teacherClass.attendance.present + teacherClass.attendance.absent).toLocaleString() }} student-days total
            </span>
            <span v-else style="color: var(--warning); font-weight: 600;">
              Roll call has not been recorded yet for today
            </span>
          </div>
          <div class="kpi-card-action">
            <router-link :to="todayAttendanceUrl" class="kpi-action-link">
              <span>{{ teacherClass.todayAttendance?.submitted ? "Review Today's Sheet" : "Take Today's Attendance" }}</span>
              <span>→</span>
            </router-link>
          </div>
        </div>

        <!-- Card 4: Monthly Reports -->
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag kpi-tag--success">DepEd SF2</span>
            <div class="kpi-icon kpi-icon--sf2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ teacherClass.records.length }}</span>
            <span class="kpi-unit">SF2 Filed</span>
          </div>
          <div class="kpi-subtext">
            <span>Current School Year Submissions</span>
          </div>
        </div>
      </section>

      <!-- 2-Column Row: Monthly SF2 Filings & Class SARDO Watchlist -->
      <div class="analytics-row-2">
        <!-- Monthly SF2 Reports Table -->
        <section class="card-box">
          <div class="card-box-header">
            <div>
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>My Class Monthly SF2 Reports</span>
              </h3>
              <p>Submitted attendance sheets for {{ teacherClass.grade }} - {{ teacherClass.section }}</p>
            </div>
            <router-link :to="`/monthly?grade=${encodeURIComponent(teacherClass.grade)}&section=${encodeURIComponent(teacherClass.section)}`" class="view-all-link">
              <span>Open Monthly SF2</span>
              <span>→</span>
            </router-link>
          </div>

          <div v-if="teacherClass.records.length" class="table-responsive">
            <table class="overview-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th style="text-align: center;">Enrolled</th>
                  <th style="text-align: center;">ADA</th>
                  <th style="text-align: center;">Attendance %</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in teacherClass.records" :key="r.id">
                  <td>
                    <strong>{{ r.monthName }} {{ r.year }}</strong>
                  </td>
                  <td style="text-align: center; font-weight: 600;">
                    {{ r.enrolled ?? teacherClass.students.total }}
                  </td>
                  <td style="text-align: center; font-weight: 600;">
                    {{ r.ada ?? '—' }}
                  </td>
                  <td style="text-align: center;">
                    <span 
                      v-if="r.attendanceRate !== null" 
                      class="status-pill"
                      :class="r.attendanceRate >= 95 ? 'status-pill--success' : r.attendanceRate >= 90 ? 'status-pill--warning' : 'status-pill--danger'"
                    >
                      {{ r.attendanceRate }}%
                    </span>
                    <span v-else style="color: var(--muted-foreground);">—</span>
                  </td>
                  <td style="text-align: right;">
                    <router-link :to="`/monthly?grade=${encodeURIComponent(teacherClass.grade)}&section=${encodeURIComponent(teacherClass.section)}&month=${r.month}&year=${r.year}`" class="table-action-btn">
                      <span>View SF2</span>
                      <span class="action-arrow">→</span>
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-records-state">
            <p>No monthly SF2 reports filed yet for your class.</p>
          </div>
        </section>

        <!-- SARDO & Attendance Watchlist -->
        <section class="card-box">
          <div class="card-box-header">
            <div>
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Class SARDO Alert Watchlist</span>
              </h3>
              <p>Students with unexcused absences requiring adviser intervention</p>
            </div>
          </div>

          <div v-if="filteredAtRisk.length" class="sardo-list">
            <div v-for="st in filteredAtRisk" :key="st.studentId" class="sardo-item">
              <div class="sardo-item-info">
                <strong>{{ st.studentName }}</strong>
                <small>{{ st.totalPresent }} days present · {{ st.totalTardy }} tardy marks</small>
              </div>
              <div class="sardo-badge-group">
                <span class="sardo-absence-pill">
                  {{ st.totalAbsent }} Absences
                </span>
                <span class="sardo-action-tag">
                  {{ st.totalAbsent >= 3 ? 'Intervention' : 'Counseling' }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="sardo-clean-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <strong>All Learners Attending Regularly</strong>
            <small>No students in your advisory section currently trigger chronic absence warnings.</small>
          </div>
        </section>
      </div>

      <!-- Advisory Class Complete Roster & Attendance Matrix -->
      <section class="card-box">
        <div class="card-box-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Advisory Class Roster &amp; Attendance Matrix</span>
            </h3>
            <p>Individual learner attendance totals, tardiness records, and DepEd standing</p>
          </div>

          <div class="search-filter-wrap">
            <input 
              type="text" 
              v-model="rosterSearch" 
              placeholder="Search learner name…" 
              class="section-search-input"
            />
          </div>
        </div>

        <div v-if="filteredRoster.length" class="table-responsive">
          <table class="overview-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Learner Name</th>
                <th style="text-align: center;">Gender</th>
                <th style="text-align: center;">Present</th>
                <th style="text-align: center;">Absent</th>
                <th style="text-align: center;">Tardy</th>
                <th style="text-align: center;">Half-Day</th>
                <th style="text-align: center;">Attendance %</th>
                <th style="text-align: center;">Standing</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(student, idx) in filteredRoster" :key="student.id">
                <td style="color: var(--muted-foreground); font-size: 0.72rem; font-weight: 700;">
                  #{{ idx + 1 }}
                </td>
                <td>
                  <strong>{{ student.name }}</strong>
                </td>
                <td style="text-align: center;">
                  <span class="gender-pill" :class="student.gender?.toLowerCase() === 'male' ? 'gender-pill--m' : 'gender-pill--f'">
                    {{ student.gender?.toLowerCase() === 'male' ? 'M' : 'F' }}
                  </span>
                </td>
                <td style="text-align: center; font-weight: 700; color: #0c5357;">
                  {{ student.present }}
                </td>
                <td style="text-align: center;">
                  <span v-if="student.absent > 0" class="absence-num-pill">{{ student.absent }}</span>
                  <span v-else style="color: var(--muted-foreground);">0</span>
                </td>
                <td style="text-align: center;">
                  <span v-if="student.tardy > 0" class="tardy-num-pill">{{ student.tardy }}</span>
                  <span v-else style="color: var(--muted-foreground);">0</span>
                </td>
                <td style="text-align: center;">
                  <span v-if="student.half_day > 0" class="halfday-num-pill">{{ student.half_day }}</span>
                  <span v-else style="color: var(--muted-foreground);">0</span>
                </td>
                <td style="text-align: center; font-family: 'Manrope', sans-serif; font-weight: 800;">
                  <span v-if="student.present + student.absent > 0">
                    {{ Math.round((student.present / (student.present + student.absent)) * 100) }}%
                  </span>
                  <span v-else style="color: var(--muted-foreground);">—</span>
                </td>
                <td style="text-align: center;">
                  <template v-if="student.present + student.absent > 0">
                    <span 
                      class="status-pill"
                      :class="((student.present / (student.present + student.absent)) * 100) >= 95 ? 'status-pill--success' : ((student.present / (student.present + student.absent)) * 100) >= 90 ? 'status-pill--warning' : 'status-pill--danger'"
                    >
                      {{ ((student.present / (student.present + student.absent)) * 100) >= 95 ? 'Regular' : ((student.present / (student.present + student.absent)) * 100) >= 90 ? 'Warning' : 'At Risk' }}
                    </span>
                  </template>
                  <span v-else class="status-pill status-pill--neutral">No logs</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-records-state">
          <p>No learners found matching your search filter.</p>
        </div>
      </section>
    </template>

    <!-- If No Advisory Class Assigned -->
    <template v-else>
      <div class="unassigned-hero-card">
        <div class="unassigned-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2>No Advisory Section Linked</h2>
        <p>
          Your faculty account is currently not assigned as the official class adviser for any grade level and section.
          Please coordinate with your school administrator to link your account to your advisory section in the ElyTrack school directory.
        </p>
        <router-link to="/monthly" class="landing-primary-btn">
          <span>View Campus Monthly SF2</span>
          <span>→</span>
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const teacherClass = ref(null)
const rosterSearch = ref('')
const announcements = ref([])

function formatDate(val) {
  if (!val) return ''
  try {
    const d = new Date(val)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return val
  }
}

async function loadAnnouncements() {
  try {
    const params = new URLSearchParams(auth.actorParams())
    const res = await fetch(`/api/announcements?${params}`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) announcements.value = data
    }
  } catch (err) {
    console.warn('Error loading announcements:', err)
  }
}

async function markAnnouncementRead(id) {
  try {
    await fetch(`/api/announcements/${id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams())
    })
    const item = announcements.value.find(a => a.id === id)
    if (item) item.is_read = true
  } catch {}
}

const todayIso = computed(() => new Date().toISOString().split('T')[0])
const todayAttendanceUrl = computed(() => {
  if (teacherClass.value?.grade && teacherClass.value?.section) {
    return `/attendance?grade=${encodeURIComponent(teacherClass.value.grade)}&section=${encodeURIComponent(teacherClass.value.section)}&date=${todayIso.value}&autoOpen=1`
  }
  return `/attendance?date=${todayIso.value}&autoOpen=1`
})

const currentDateStr = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const classMalePct = computed(() => {
  const total = teacherClass.value?.students?.total || 0
  if (!total) return 0
  return Math.round(((teacherClass.value?.students?.male || 0) / total) * 100)
})

const classFemalePct = computed(() => {
  const total = teacherClass.value?.students?.total || 0
  if (!total) return 0
  return Math.round(((teacherClass.value?.students?.female || 0) / total) * 100)
})

const filteredAtRisk = computed(() => {
  if (!teacherClass.value?.atRisk) return []
  return teacherClass.value.atRisk.filter(st => st.totalAbsent > 0)
})

const filteredRoster = computed(() => {
  if (!teacherClass.value?.roster) return []
  if (!rosterSearch.value.trim()) return teacherClass.value.roster
  const q = rosterSearch.value.toLowerCase().trim()
  return teacherClass.value.roster.filter(st => st.name.toLowerCase().includes(q))
})

async function loadStats() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      userId: auth.user?.id || '',
      userRole: auth.user?.role || '',
      ...(auth.schoolId ? { schoolId: auth.schoolId } : {})
    })

    const res = await fetch(`/api/dashboard/stats?${params}`)
    const data = await res.json()

    if (data && data.teacherClass) {
      teacherClass.value = data.teacherClass
    }
  } catch (err) {
    console.error('Error loading teacher stats:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadStats()
  await loadAnnouncements()
})
</script>

<style scoped>
/* Announcements */
.announcements-bar {
  padding: 16px 20px;
  margin-bottom: 24px;
}
.announcement-banner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.banner-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.banner-title-wrap h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--foreground);
}
.ann-count-badge {
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
}
.announcements-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.announcement-card {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border);
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.announcement-card.ann-priority--urgent {
  border-left-color: #ef4444;
  background: color-mix(in srgb, #ef4444 4%, var(--bg-surface, #ffffff));
}
.announcement-card.ann-priority--important {
  border-left-color: #f59e0b;
}
.announcement-card.ann-read {
  opacity: 0.75;
}
.ann-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ann-priority-pill {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
}
.pill--normal { background: #e2e8f0; color: #475569; }
.pill--important { background: #fef3c7; color: #92400e; }
.pill--urgent { background: #fee2e2; color: #b91c1c; }
.ann-date {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}
.ann-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--foreground);
}
.ann-content {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted-foreground);
  line-height: 1.4;
}
.ann-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 0.72rem;
  color: var(--muted-foreground);
}
.btn-read-sm {
  background: var(--primary-bg, #f0fdfa);
  border: 1px solid var(--border);
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
}
.read-indicator {
  font-size: 0.7rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.teacher-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ==========================================================================
   HEADER
   ========================================================================== */
.overview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.overview-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 4px;
}

.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
}

.overview-header-copy h1 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--foreground);
  margin: 0 0 6px;
}

.overview-header-copy p {
  color: var(--muted-foreground);
  font-size: 0.84rem;
  line-height: 1.5;
  margin: 0;
  max-width: 680px;
}

.overview-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.take-attendance-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 2px 8px var(--primary-glow);
  transition: all 0.15s ease;
}

.take-attendance-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--primary-glow);
  color: var(--primary-foreground);
}

.take-attendance-btn svg {
  flex-shrink: 0;
}

.kpi-card-action {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.kpi-action-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--primary);
  text-decoration: none;
  transition: all 0.12s ease;
}

.kpi-action-link:hover {
  color: var(--primary-hover);
  gap: 8px;
}

.advisory-badge-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  background: var(--card);
  color: var(--foreground);
  font-size: 0.76rem;
  font-weight: 800;
  border: 1px solid var(--border);
}

.advisory-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}

.overview-date-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  background: var(--secondary);
  color: var(--secondary-foreground);
  font-size: 0.74rem;
  font-weight: 700;
  border: 1px solid var(--border);
}

.overview-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.12s ease;
}

.overview-refresh-btn:hover:not(:disabled) {
  background: var(--secondary);
  border-color: var(--primary);
  color: var(--primary);
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ==========================================================================
   KPI STAT CARDS
   ========================================================================== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  border-radius: var(--radius-lg, 14px);
  border: 1px solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-sm);
  min-width: 0;
  overflow: hidden;
  transition: all 0.15s ease;
}

.kpi-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
  box-shadow: var(--shadow-md);
}

.kpi-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.kpi-tag {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 5px;
  background: var(--muted);
  color: var(--muted-foreground);
}

.kpi-tag--success { background: var(--success-bg); color: var(--success); }
.kpi-tag--warning { background: var(--warning-bg); color: var(--warning); }
.kpi-tag--danger { background: var(--red-bg); color: var(--destructive); }

.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon--teal { background: var(--primary-bg); color: var(--primary); }
.kpi-icon--rate { background: var(--info-bg); color: var(--info); }
.kpi-icon--faculty { background: var(--secondary); color: var(--secondary-foreground); }
.kpi-icon--sf2 { background: var(--success-bg); color: var(--success); }

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 10px;
}

.kpi-main-num {
  font-family: 'Manrope', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: var(--foreground);
  line-height: 1;
}

.kpi-unit {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.mini-ratio-bar {
  display: flex;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--muted);
  margin-bottom: 6px;
}

.mini-ratio-fill { height: 100%; }
.male-fill { background: var(--info); }
.female-fill { background: var(--accent); }

.mini-ratio-legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 0.68rem;
  color: var(--muted-foreground);
}

.mini-ratio-legend strong { color: var(--foreground); }

.kpi-subtext {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.kpi-subtext strong { color: var(--foreground); }
.subtext-divider { color: var(--border); }

/* ==========================================================================
   2-COLUMN LAYOUT
   ========================================================================== */
.analytics-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card-box {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.card-box-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.card-box-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0 0 4px;
}

.card-box-header p {
  font-size: 0.76rem;
  color: var(--muted-foreground);
  margin: 0;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
}

.section-search-input {
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--input);
  border-radius: 8px;
  font-size: 0.76rem;
  outline: none;
  min-width: 220px;
  background: var(--card);
  color: var(--foreground);
}

.section-search-input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px var(--primary-bg);
}

.table-responsive {
  overflow-x: auto;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
}

.overview-table th {
  padding: 10px 14px;
  background: var(--muted);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.overview-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--foreground);
}

.overview-table tbody tr:hover {
  background: var(--secondary);
}

.status-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 800;
}

.status-pill--success { background: var(--success-bg); color: var(--success); }
.status-pill--warning { background: var(--warning-bg); color: var(--warning); }
.status-pill--danger { background: var(--red-bg); color: var(--destructive); }
.status-pill--neutral { background: var(--muted); color: var(--muted-foreground); }

.gender-pill {
  font-size: 0.66rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.gender-pill--male { background: var(--info-bg); color: var(--info); }
.gender-pill--female { background: var(--warning-bg); color: var(--orange); }

.gender-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.gender-dot--male { background: var(--info); }
.gender-dot--female { background: var(--accent); }

.at-risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.at-risk-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--red-bg);
  border: 1px solid color-mix(in srgb, var(--destructive) 25%, var(--border));
}

.at-risk-info strong {
  display: block;
  font-size: 0.78rem;
  color: var(--foreground);
}

.at-risk-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.absence-badge {
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--card);
  color: var(--destructive);
  font-size: 0.68rem;
  font-weight: 800;
  border: 1px solid color-mix(in srgb, var(--destructive) 30%, transparent);
}

.tardy-badge {
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--warning-bg);
  color: var(--warning);
  font-size: 0.68rem;
  font-weight: 800;
}

.at-risk-clean-state,
.empty-table-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--muted-foreground);
  font-size: 0.78rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.empty-advisory-hero {
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 16px;
  background: var(--card);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-hero-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--secondary);
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.empty-advisory-hero h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
}

.empty-advisory-hero p {
  color: var(--muted-foreground);
  font-size: 0.82rem;
  max-width: 440px;
  margin: 0;
  line-height: 1.5;
}

/* ==========================================================================
   RESPONSIVE
   ========================================================================== */
@media (max-width: 1240px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1100px) {
  .analytics-row-2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
