<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="dashboard-header-left">
        <h1>Teacher Dashboard</h1>
        <p v-if="teacherClass?.hasAdvisory">
          Welcome back, <strong>{{ auth.user?.name }}</strong>. 
          Adviser overview & attendance tracking for <strong>{{ teacherClass.grade }} — {{ teacherClass.section }}</strong>.
        </p>
        <p v-else>
          Welcome back, <strong>{{ auth.user?.name }}</strong>. 
          Faculty attendance overview & class records.
        </p>
      </div>

      <div class="dashboard-header-actions">
        <div class="dashboard-date-badge">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{{ currentDateStr }}</span>
        </div>

        <button @click="loadStats" class="btn-refresh" :disabled="loading" title="Refresh Statistics">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'spinner': loading }">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>{{ loading ? 'Updating…' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- If Assigned Advisory Class -->
    <template v-if="teacherClass?.hasAdvisory">
      <!-- Top KPI Cards -->
      <div class="stats-grid">
        <!-- Class Enrollment -->
        <div class="stat-card-expanded">
          <div class="stat-card-top">
            <div class="stat-icon stat-icon-students">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/>
              </svg>
            </div>
            <span class="stat-pill stat-pill--info">{{ teacherClass.grade }} - {{ teacherClass.section }}</span>
          </div>
          <div>
            <div class="stat-value">{{ teacherClass.students.total }}</div>
            <div class="stat-label">Advisory Class Students</div>
            <div class="stat-subtext">
              <span><strong>{{ teacherClass.students.male }}</strong> Male</span>
              <span>•</span>
              <span><strong>{{ teacherClass.students.female }}</strong> Female</span>
            </div>
          </div>
        </div>

        <!-- Class Attendance Rate -->
        <div class="stat-card-expanded">
          <div class="stat-card-top">
            <div class="stat-icon stat-icon-records">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span 
              class="stat-pill" 
              :class="teacherClass.attendance.rate >= 95 ? 'stat-pill--success' : teacherClass.attendance.rate >= 90 ? 'stat-pill--warning' : 'stat-pill--danger'"
            >
              {{ teacherClass.attendance.rate >= 95 ? 'Target Met' : teacherClass.attendance.rate >= 90 ? 'Acceptable' : 'Needs Focus' }}
            </span>
          </div>
          <div>
            <div class="stat-value">{{ teacherClass.attendance.rate }}%</div>
            <div class="stat-label">Class Attendance Rate</div>
            <div class="stat-subtext">
              <span>Target Standard: <strong>≥ 95%</strong></span>
            </div>
          </div>
        </div>

        <!-- Class Days Tracked -->
        <div class="stat-card-expanded">
          <div class="stat-card-top">
            <div class="stat-icon stat-icon-teachers">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>
              </svg>
            </div>
            <span class="stat-pill stat-pill--info">Daily Logs</span>
          </div>
          <div>
            <div class="stat-value">{{ Number(teacherClass.attendance.present + teacherClass.attendance.absent).toLocaleString() }}</div>
            <div class="stat-label">Total Days Logged</div>
            <div class="stat-subtext">
              <span><strong>{{ Number(teacherClass.attendance.present).toLocaleString() }}</strong> Present</span>
              <span>•</span>
              <span><strong>{{ Number(teacherClass.attendance.absent).toLocaleString() }}</strong> Absent</span>
            </div>
          </div>
        </div>

        <!-- Monthly SF2 Reports -->
        <div class="stat-card-expanded">
          <div class="stat-card-top">
            <div class="stat-icon stat-icon-entries">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span class="stat-pill stat-pill--success">DepEd SF2</span>
          </div>
          <div>
            <div class="stat-value">{{ teacherClass.records.length }}</div>
            <div class="stat-label">Monthly SF2 Sheets Filed</div>
            <div class="stat-subtext">
              <span>Current School Year Records</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Analytics Row: Monthly Records & Class Watchlist -->
      <div class="dashboard-grid-2">
        <!-- Monthly SF2 Records List -->
        <div class="widget-card">
          <div class="widget-header">
            <div>
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>My Class Monthly SF2 Reports</span>
              </h3>
              <p>Submitted attendance sheets for {{ teacherClass.grade }} - {{ teacherClass.section }}</p>
            </div>
            <router-link :to="`/monthly?grade=${encodeURIComponent(teacherClass.grade)}&section=${encodeURIComponent(teacherClass.section)}`" class="table-action-btn">
              <span>Open Monthly View</span>
            </router-link>
          </div>

          <div v-if="teacherClass.records.length" class="table-wrapper">
            <table class="widget-table">
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
                      class="rate-pill"
                      :class="r.attendanceRate >= 95 ? 'rate-pill--high' : r.attendanceRate >= 90 ? 'rate-pill--mid' : 'rate-pill--low'"
                    >
                      {{ r.attendanceRate }}%
                    </span>
                    <span v-else style="color: var(--muted-foreground);">—</span>
                  </td>
                  <td style="text-align: right;">
                    <router-link 
                      :to="`/monthly?month=${r.month}&year=${r.year}&grade=${encodeURIComponent(teacherClass.grade)}&section=${encodeURIComponent(teacherClass.section)}`" 
                      class="table-action-btn"
                    >
                      Open Sheet
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-state-card">
            No monthly attendance records filed for your section yet.
          </div>
        </div>

        <!-- Class Watchlist (SARDO Alert) -->
        <div class="widget-card">
          <div class="widget-header">
            <div>
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--destructive);">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Class Attendance Watchlist</span>
              </h3>
              <p>Students in your advisory class with highest absences</p>
            </div>
          </div>

          <div v-if="filteredAtRisk.length" class="risk-list">
            <div v-for="st in filteredAtRisk" :key="st.student_id" class="risk-item">
              <div class="risk-item-info">
                <span class="risk-item-name">{{ st.student_name }}</span>
                <span class="risk-item-class">{{ st.total_present }} days present · {{ st.total_tardy || 0 }} tardy</span>
              </div>
              <span class="risk-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{{ st.total_absent }} Absences</span>
              </span>
            </div>
          </div>

          <div v-else class="empty-state-card">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <strong>Good Attendance Standing</strong>
              <span style="font-size: 0.78rem;">No students in your advisory class have recorded significant absences.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Class Roster Attendance Performance -->
      <div class="widget-card">
        <div class="widget-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Advisory Class Student Roster & Attendance Status</span>
            </h3>
            <p>Individual student attendance totals and attendance health for {{ teacherClass.grade }} - {{ teacherClass.section }}</p>
          </div>
        </div>

        <div v-if="teacherClass.roster?.length" class="table-wrapper">
          <table class="widget-table">
            <thead>
              <tr>
                <th style="width: 45px;">#</th>
                <th>Student Name</th>
                <th style="text-align: center;">Gender</th>
                <th style="text-align: center;">Days Present</th>
                <th style="text-align: center;">Days Absent</th>
                <th style="text-align: center;">Tardy</th>
                <th style="text-align: center;">Half Day</th>
                <th style="text-align: center;">Attendance Rate</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(student, idx) in teacherClass.roster" :key="student.id">
                <td style="color: var(--muted-foreground); font-size: 0.78rem;">{{ idx + 1 }}</td>
                <td>
                  <strong>{{ student.name }}</strong>
                </td>
                <td style="text-align: center; color: var(--muted-foreground); font-size: 0.8rem;">
                  {{ student.gender || '—' }}
                </td>
                <td style="text-align: center; font-weight: 600; color: var(--success);">
                  {{ student.present }}
                </td>
                <td style="text-align: center; font-weight: 600;" :style="{ color: student.absent > 0 ? 'var(--destructive)' : 'var(--muted-foreground)' }">
                  {{ student.absent }}
                </td>
                <td style="text-align: center;">
                  <span v-if="student.tardy > 0" class="pill--amber">{{ student.tardy }}</span>
                  <span v-else style="color: var(--muted-foreground); font-size: 0.8rem;">0</span>
                </td>
                <td style="text-align: center;">
                  <span v-if="student.half_day && student.half_day > 0" class="pill--neutral">{{ student.half_day }}</span>
                  <span v-else style="color: var(--muted-foreground); font-size: 0.8rem;">0</span>
                </td>
                <td style="text-align: center;">
                  <span v-if="student.present + student.absent > 0" style="font-weight: 700;">
                    {{ Math.round((student.present / (student.present + student.absent)) * 100) }}%
                  </span>
                  <span v-else style="color: var(--muted-foreground); font-size: 0.8rem;">—</span>
                </td>
                <td style="text-align: center;">
                  <template v-if="student.present + student.absent > 0">
                    <span 
                      class="rate-pill"
                      :class="((student.present / (student.present + student.absent)) * 100) >= 95 ? 'rate-pill--high' : ((student.present / (student.present + student.absent)) * 100) >= 90 ? 'rate-pill--mid' : 'rate-pill--low'"
                    >
                      {{ ((student.present / (student.present + student.absent)) * 100) >= 95 ? 'Regular' : ((student.present / (student.present + student.absent)) * 100) >= 90 ? 'Warning' : 'At Risk' }}
                    </span>
                  </template>
                  <span v-else class="rate-pill rate-pill--mid">No logs</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state-card">
          No students found enrolled in your advisory class.
        </div>
      </div>
    </template>

    <!-- If No Advisory Class Assigned -->
    <template v-else>
      <div class="empty-state-card" style="padding: 48px 24px; max-width: 650px; margin: 20px auto;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: var(--warning); margin-bottom: 12px;">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--foreground); margin: 0 0 8px 0;">No Advisory Class Assigned</h3>
        <p style="font-size: 0.88rem; color: var(--muted-foreground); line-height: 1.5; margin: 0 0 16px 0;">
          Your teacher account is currently not assigned as an adviser to any grade and section. 
          Please contact your school administrator to link your account to your advisory section.
        </p>
        <router-link to="/monthly" class="btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
          <span>View Monthly Attendance</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
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

const currentDateStr = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const filteredAtRisk = computed(() => {
  if (!teacherClass.value?.atRisk) return []
  return teacherClass.value.atRisk.filter(st => st.total_absent > 0)
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
