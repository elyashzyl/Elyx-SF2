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

        <!-- Card 3: Days Tracked -->
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag">Daily Telemetry</span>
            <div class="kpi-icon kpi-icon--faculty">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ Number(teacherClass.attendance.present + teacherClass.attendance.absent).toLocaleString() }}</span>
            <span class="kpi-unit">Student Days</span>
          </div>
          <div class="kpi-subtext">
            <span><strong>{{ teacherClass.attendance.absent }}</strong> Absences</span>
            <span class="subtext-divider">•</span>
            <span><strong>{{ teacherClass.attendance.tardy }}</strong> Tardies</span>
          </div>
          <div class="kpi-card-action">
            <router-link :to="todayAttendanceUrl" class="kpi-action-link">
              <span>Take Today's Attendance</span>
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

onMounted(loadStats)
</script>

<style scoped>
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
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
}

.overview-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0c5357;
  margin-bottom: 4px;
}

.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0c5357;
}

.overview-header-copy h1 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #080d0c;
  margin: 0 0 6px;
}

.overview-header-copy p {
  color: #506160;
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
  background: #0c5357;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(12, 83, 87, 0.25);
  transition: all 0.15s ease;
}

.take-attendance-btn:hover {
  background: #083c3f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(12, 83, 87, 0.35);
  color: #ffffff;
}

.take-attendance-btn svg {
  flex-shrink: 0;
}

.kpi-card-action {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(12, 83, 87, 0.08);
}

.kpi-action-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 800;
  color: #0c5357;
  text-decoration: none;
  transition: all 0.12s ease;
}

.kpi-action-link:hover {
  color: #083c3f;
  gap: 8px;
}

.advisory-badge-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  background: #080d0c;
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 800;
}

.advisory-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.overview-date-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  background: #e6f3f4;
  color: #0c5357;
  font-size: 0.74rem;
  font-weight: 700;
  border: 1px solid rgba(12, 83, 87, 0.15);
}

.overview-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(12, 83, 87, 0.2);
  background: #ffffff;
  color: #080d0c;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.12s ease;
}

.overview-refresh-btn:hover:not(:disabled) {
  background: #f4f8f8;
  border-color: #0c5357;
  color: #0c5357;
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ==========================================================================
   COMMAND STRIP
   ========================================================================== */
.command-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.command-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(12, 83, 87, 0.15);
  background: #ffffff;
  color: #080d0c;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.14s ease;
  box-shadow: 0 2px 6px rgba(8, 13, 12, 0.02);
}

.command-pill:hover {
  border-color: #0c5357;
  background: #f4f8f8;
  transform: translateY(-1px);
  color: #0c5357;
}

.command-pill--primary {
  background: #080d0c;
  color: #ffffff;
  border-color: #080d0c;
}

.command-pill--primary:hover {
  background: #0c5357;
  border-color: #0c5357;
  color: #ffffff;
}

.command-pill--primary .command-icon {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.command-pill--primary .command-arrow {
  color: #ffffff;
}

.command-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #e6f3f4;
  color: #0c5357;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.command-arrow {
  margin-left: auto;
  color: #506160;
  font-weight: 700;
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
  border-radius: 14px;
  border: 1px solid rgba(12, 83, 87, 0.14);
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(8, 13, 12, 0.02);
  transition: all 0.15s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgba(12, 83, 87, 0.3);
  box-shadow: 0 8px 24px rgba(12, 83, 87, 0.06);
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
  background: #eef5f5;
  color: #506160;
}

.kpi-tag--success { background: #e6f3f4; color: #0c5357; }
.kpi-tag--warning { background: #fef3c7; color: #b45309; }
.kpi-tag--danger { background: #fee2e2; color: #b91c1c; }

.kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon--teal { background: #e6f3f4; color: #0c5357; }
.kpi-icon--rate { background: #e6f3f4; color: #0c5357; }
.kpi-icon--faculty { background: #eef5f5; color: #0c5357; }
.kpi-icon--sf2 { background: #e6f3f4; color: #0c5357; }

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
  color: #080d0c;
  line-height: 1;
}

.kpi-unit {
  font-size: 0.78rem;
  color: #506160;
  font-weight: 600;
}

.mini-ratio-bar {
  display: flex;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: #f0f4f4;
  margin-bottom: 6px;
}

.mini-ratio-fill { height: 100%; }
.male-fill { background: #0c5357; }
.female-fill { background: #d97706; }

.mini-ratio-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  color: #506160;
}

.mini-ratio-legend strong { color: #080d0c; }

.kpi-subtext {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #506160;
}

.kpi-subtext strong { color: #080d0c; }
.subtext-divider { color: #a3b5b5; }

/* ==========================================================================
   2-COLUMN LAYOUT
   ========================================================================== */
.analytics-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.card-box {
  border: 1px solid rgba(12, 83, 87, 0.14);
  border-radius: 16px;
  background: #ffffff;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(8, 13, 12, 0.02);
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
  color: #080d0c;
  margin: 0 0 4px;
}

.card-box-header p {
  font-size: 0.76rem;
  color: #506160;
  margin: 0;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  font-weight: 700;
  color: #0c5357;
  text-decoration: none;
}

.section-search-input {
  height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(12, 83, 87, 0.2);
  border-radius: 8px;
  font-size: 0.76rem;
  outline: none;
  min-width: 220px;
}

.section-search-input:focus {
  border-color: #0c5357;
  box-shadow: 0 0 0 3px rgba(12, 83, 87, 0.1);
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
  background: #f4f8f8;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #506160;
  border-bottom: 1px solid rgba(12, 83, 87, 0.1);
  text-align: left;
}

.overview-table td {
  padding: 11px 14px;
  border-bottom: 1px solid rgba(12, 83, 87, 0.08);
  color: #080d0c;
}

.overview-table tbody tr:hover {
  background: #f8fafb;
}

.status-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 800;
}

.status-pill--success { background: #e6f3f4; color: #0c5357; }
.status-pill--warning { background: #fef3c7; color: #b45309; }
.status-pill--danger { background: #fee2e2; color: #b91c1c; }
.status-pill--neutral { background: #eef5f5; color: #7a8e8d; }

.gender-pill {
  font-size: 0.66rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.gender-pill--m { background: #e6f3f4; color: #0c5357; }
.gender-pill--f { background: #fef3c7; color: #b45309; }

.absence-num-pill {
  padding: 2px 6px;
  border-radius: 4px;
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 800;
  font-size: 0.74rem;
}

.tardy-num-pill {
  padding: 2px 6px;
  border-radius: 4px;
  background: #fef3c7;
  color: #b45309;
  font-weight: 800;
  font-size: 0.74rem;
}

.halfday-num-pill {
  padding: 2px 6px;
  border-radius: 4px;
  background: #eef5f5;
  color: #506160;
  font-weight: 700;
  font-size: 0.74rem;
}

.table-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  background: #f4f8f8;
  color: #0c5357;
  font-size: 0.7rem;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid rgba(12, 83, 87, 0.15);
  transition: all 0.12s ease;
}

.table-action-btn:hover {
  background: #0c5357;
  color: #ffffff;
  border-color: #0c5357;
}

/* SARDO Watchlist */
.sardo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sardo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: #fffafa;
}

.sardo-item-info strong {
  display: block;
  font-size: 0.8rem;
  color: #080d0c;
}

.sardo-item-info small {
  color: #506160;
  font-size: 0.68rem;
}

.sardo-badge-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sardo-absence-pill {
  padding: 3px 8px;
  border-radius: 4px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 0.68rem;
  font-weight: 800;
}

.sardo-action-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 4px;
  background: #fef3c7;
  color: #b45309;
}

.sardo-clean-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 32px 20px;
}

.sardo-clean-state strong {
  font-size: 0.95rem;
  color: #080d0c;
}

.sardo-clean-state small {
  font-size: 0.76rem;
  color: #506160;
  max-width: 320px;
}

.empty-records-state {
  padding: 32px;
  text-align: center;
  color: #7a8e8d;
  font-size: 0.82rem;
}

/* Unassigned Hero Card */
.unassigned-hero-card {
  padding: 56px 28px;
  text-align: center;
  border: 1px solid rgba(12, 83, 87, 0.18);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(8, 13, 12, 0.04);
  max-width: 620px;
  margin: 32px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.unassigned-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fef3c7;
  color: #b45309;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.unassigned-hero-card h2 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: #080d0c;
  margin: 0 0 10px;
}

.unassigned-hero-card p {
  font-size: 0.88rem;
  color: #506160;
  line-height: 1.6;
  margin: 0 0 24px;
}

/* ==========================================================================
   RESPONSIVE
   ========================================================================== */
@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .command-strip {
    grid-template-columns: 1fr;
  }
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
