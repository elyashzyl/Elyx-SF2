<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="dashboard-header-left">
        <h1>Admin Dashboard</h1>
        <p>
          Welcome back, <strong>{{ auth.user?.name }}</strong>. 
          Real-time enrollment statistics, attendance analytics, and SF2 compliance records.
        </p>
      </div>

      <div class="dashboard-header-actions">
        <!-- Superadmin school picker -->
        <select 
          v-if="auth.isSuperadmin && schoolsList.length > 1" 
          v-model="selectedSchoolId" 
          @change="loadStats" 
          class="dashboard-school-select"
        >
          <option value="">All Schools</option>
          <option v-for="s in schoolsList" :key="s.id" :value="s.id">{{ s.short || s.name }}</option>
        </select>

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

    <!-- Top KPI Stat Cards -->
    <div class="stats-grid">
      <!-- Total Students -->
      <div class="stat-card-expanded">
        <div class="stat-card-top">
          <div class="stat-icon stat-icon-students">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/>
            </svg>
          </div>
          <span class="stat-pill stat-pill--info">Active Roster</span>
        </div>
        <div>
          <div class="stat-value">{{ summary.students }}</div>
          <div class="stat-label">Total Students Enrolled</div>
          <div class="stat-subtext">
            <span><strong>{{ summary.maleStudents }}</strong> Male</span>
            <span>•</span>
            <span><strong>{{ summary.femaleStudents }}</strong> Female</span>
          </div>
        </div>
      </div>

      <!-- Attendance Rate -->
      <div class="stat-card-expanded">
        <div class="stat-card-top">
          <div class="stat-icon stat-icon-records">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span 
            class="stat-pill" 
            :class="summary.attendance.rate >= 95 ? 'stat-pill--success' : summary.attendance.rate >= 90 ? 'stat-pill--warning' : 'stat-pill--danger'"
          >
            {{ summary.attendance.rate >= 95 ? 'DepEd Target Met' : summary.attendance.rate >= 90 ? 'Acceptable' : 'Needs Focus' }}
          </span>
        </div>
        <div>
          <div class="stat-value">{{ summary.attendance.rate }}%</div>
          <div class="stat-label">Average Attendance Rate</div>
          <div class="stat-subtext">
            <span>DepEd Standard: <strong>≥ 95%</strong></span>
          </div>
        </div>
      </div>

      <!-- Teachers & Faculty -->
      <div class="stat-card-expanded">
        <div class="stat-card-top">
          <div class="stat-icon stat-icon-teachers">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span class="stat-pill stat-pill--info">Faculty</span>
        </div>
        <div>
          <div class="stat-value">{{ summary.teachers }}</div>
          <div class="stat-label">Teaching Staff</div>
          <div class="stat-subtext">
            <span><strong>{{ summary.advisers }}</strong> Advisory Classes Assigned</span>
          </div>
        </div>
      </div>

      <!-- Monthly SF2 Records -->
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
          <div class="stat-value">{{ summary.records }}</div>
          <div class="stat-label">Monthly SF2 Reports Filed</div>
          <div class="stat-subtext">
            <span><strong>{{ summary.entries }}</strong> Student Month Entries</span>
          </div>
        </div>
      </div>

      <!-- Days Tracked -->
      <div class="stat-card-expanded">
        <div class="stat-card-top">
          <div class="stat-icon stat-icon-records">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>
            </svg>
          </div>
          <span class="stat-pill stat-pill--info">Total Logs</span>
        </div>
        <div>
          <div class="stat-value">{{ Number(summary.attendance.present + summary.attendance.absent).toLocaleString() }}</div>
          <div class="stat-label">Student Days Logged</div>
          <div class="stat-subtext">
            <span><strong>{{ Number(summary.attendance.present).toLocaleString() }}</strong> Present</span>
            <span>•</span>
            <span><strong>{{ Number(summary.attendance.absent).toLocaleString() }}</strong> Absent</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics Row 1: Monthly Attendance Trend & Demographics -->
    <div class="dashboard-grid-2">
      <!-- Monthly Trend Bar Chart -->
      <div class="widget-card">
        <div class="widget-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span>Monthly Attendance Performance</span>
            </h3>
            <p>School Form 2 average attendance percentage per recorded month</p>
          </div>
        </div>

        <div v-if="monthlyTrends.length" class="trend-chart-container">
          <div class="trend-bars">
            <!-- 95% Benchmark Line -->
            <div class="trend-target-line" style="bottom: 95%;">
              <span class="trend-target-label">95% DepEd Target</span>
            </div>

            <div v-for="m in monthlyTrends" :key="`${m.year}-${m.month}`" class="trend-col">
              <span class="trend-val">{{ m.rate }}%</span>
              <div class="trend-bar-track" :title="`${m.monthName} ${m.year}: ${m.rate}% (${m.present} Present, ${m.absent} Absent)`">
                <div 
                  class="trend-bar-fill" 
                  :class="{ 'trend-bar-fill--high': m.rate >= 95 }" 
                  :style="{ height: `${Math.min(100, Math.max(10, m.rate))}%` }"
                ></div>
              </div>
              <span class="trend-month-label">{{ m.monthName.slice(0, 3) }}</span>
            </div>
          </div>

          <div class="trend-summary-row">
            <div class="trend-summary-item">
              <span>Recorded Months</span>
              <span>{{ monthlyTrends.length }}</span>
            </div>
            <div class="trend-summary-item">
              <span>Highest Month</span>
              <span style="color: var(--success)">{{ highestMonth.month }} ({{ highestMonth.rate }}%)</span>
            </div>
            <div class="trend-summary-item">
              <span>Overall Average</span>
              <span>{{ summary.attendance.rate }}%</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state-card">
          No monthly attendance records submitted yet.
        </div>
      </div>

      <!-- Gender Demographics -->
      <div class="widget-card">
        <div class="widget-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M9.17 14.83l-4.24 4.24"/>
              </svg>
              <span>Enrollment & Gender Demographics</span>
            </h3>
            <p>Student population balance and comparative attendance breakdown</p>
          </div>
        </div>

        <div class="gender-bar-wrap">
          <!-- Split Progress Bar -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; margin-bottom: 6px;">
              <span style="color: #2563eb;">Male: {{ malePct }}%</span>
              <span style="color: #db2777;">Female: {{ femalePct }}%</span>
            </div>
            <div class="gender-split-bar">
              <div class="gender-split-male" :style="{ width: `${malePct}%` }" :title="`Male: ${summary.maleStudents} (${malePct}%)`"></div>
              <div class="gender-split-female" :style="{ width: `${femalePct}%` }" :title="`Female: ${summary.femaleStudents} (${femalePct}%)`"></div>
            </div>
          </div>

          <!-- Cards Row -->
          <div class="gender-cards-row">
            <div class="gender-stat-box gender-stat-box--male">
              <div class="gender-stat-header gender-stat-header--male">
                <span>Male Students</span>
                <span>{{ malePct }}%</span>
              </div>
              <div class="gender-stat-num">{{ summary.maleStudents }}</div>
              <div class="gender-stat-sub">Enrolled male students across all grade levels</div>
            </div>

            <div class="gender-stat-box gender-stat-box--female">
              <div class="gender-stat-header gender-stat-header--female">
                <span>Female Students</span>
                <span>{{ femalePct }}%</span>
              </div>
              <div class="gender-stat-num">{{ summary.femaleStudents }}</div>
              <div class="gender-stat-sub">Enrolled female students across all grade levels</div>
            </div>
          </div>

          <div style="padding: 12px 14px; background: var(--secondary); border-radius: var(--radius-md); border: 1px solid var(--border); font-size: 0.8rem; color: var(--muted-foreground); display: flex; justify-content: space-between; align-items: center;">
            <span>Gender Distribution Balance</span>
            <strong style="color: var(--foreground);">{{ Math.abs(malePct - femalePct) <= 5 ? 'Balanced Population (≈ 1:1)' : 'Moderate Disparity' }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Grade Level Overview Cards -->
    <div class="widget-card">
      <div class="widget-header">
        <div>
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>
            </svg>
            <span>Grade-Level Enrollment & Performance</span>
          </h3>
          <p>Enrollment numbers, gender distribution, and attendance rate per grade level</p>
        </div>
      </div>

      <div class="grade-cards-grid">
        <div v-for="g in grades" :key="g.grade" class="grade-card">
          <div class="grade-card-top">
            <span class="grade-card-title">{{ g.grade }}</span>
            <span 
              v-if="g.rate !== null" 
              class="grade-card-rate" 
              :style="{ color: g.rate >= 95 ? 'var(--success)' : g.rate >= 90 ? 'var(--warning)' : 'var(--destructive)' }"
            >
              {{ g.rate }}% Att.
            </span>
            <span v-else class="grade-card-rate" style="color: var(--muted-foreground);">No records</span>
          </div>

          <div class="progress-bar-track">
            <div 
              class="progress-bar-fill" 
              :class="g.rate >= 95 ? 'progress-bar-fill--green' : g.rate >= 90 ? 'progress-bar-fill--yellow' : 'progress-bar-fill--blue'"
              :style="{ width: `${g.rate ? Math.min(100, g.rate) : 0}%` }"
            ></div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--muted-foreground);">
            <span><strong>{{ g.students }}</strong> Students</span>
            <span>{{ g.male }} M · {{ g.female }} F</span>
            <span>{{ g.sections.length }} Section{{ g.sections.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Granular Sections Table -->
      <div style="margin-top: 10px;">
        <div style="font-size: 0.88rem; font-weight: 700; margin-bottom: 12px; color: var(--foreground);">
          Section Breakdown & Advisory Status
        </div>
        <div class="table-wrapper">
          <table class="widget-table">
            <thead>
              <tr>
                <th>Grade & Section</th>
                <th>Class Adviser</th>
                <th style="text-align: center;">Enrolled</th>
                <th style="text-align: center;">Male / Female</th>
                <th style="text-align: center;">Attendance Rate</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="g in grades" :key="g.grade">
                <tr v-for="sec in g.sections" :key="`${g.grade}-${sec.section}`">
                  <td>
                    <strong>{{ g.grade }} — {{ sec.section }}</strong>
                  </td>
                  <td>
                    <span v-if="sec.adviser" style="font-weight: 500;">{{ sec.adviser }}</span>
                    <span v-else style="color: var(--muted-foreground); font-style: italic;">Unassigned</span>
                  </td>
                  <td style="text-align: center; font-weight: 700;">
                    {{ sec.students }}
                  </td>
                  <td style="text-align: center; color: var(--muted-foreground); font-size: 0.8rem;">
                    {{ sec.male }} M · {{ sec.female }} F
                  </td>
                  <td style="text-align: center;">
                    <span v-if="sec.rate !== null" style="font-weight: 700;">
                      {{ sec.rate }}%
                    </span>
                    <span v-else style="color: var(--muted-foreground); font-size: 0.8rem;">—</span>
                  </td>
                  <td style="text-align: center;">
                    <span 
                      v-if="sec.rate !== null" 
                      class="rate-pill" 
                      :class="sec.rate >= 95 ? 'rate-pill--high' : sec.rate >= 90 ? 'rate-pill--mid' : 'rate-pill--low'"
                    >
                      {{ sec.rate >= 95 ? '≥ 95% High' : sec.rate >= 90 ? '90-94% Normal' : '< 90% Alert' }}
                    </span>
                    <span v-else class="rate-pill rate-pill--mid">No data</span>
                  </td>
                  <td style="text-align: right;">
                    <router-link :to="`/monthly?grade=${encodeURIComponent(g.grade)}&section=${encodeURIComponent(sec.section)}`" class="table-action-btn">
                      <span>View SF2</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </router-link>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Analytics Row 3: Recent SF2 Filings & High Absence Watchlist -->
    <div class="dashboard-grid-2">
      <!-- Recent SF2 Reports -->
      <div class="widget-card">
        <div class="widget-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Recent SF2 Monthly Reports</span>
            </h3>
            <p>Latest official DepEd School Form 2 filings across classes</p>
          </div>
        </div>

        <div v-if="recentRecords.length" class="table-wrapper">
          <table class="widget-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Class</th>
                <th>Adviser</th>
                <th style="text-align: center;">ADA</th>
                <th style="text-align: center;">Att. %</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rec in recentRecords" :key="rec.id">
                <td>
                  <strong>{{ rec.monthName }} {{ rec.year }}</strong>
                </td>
                <td>
                  {{ rec.grade }} — {{ rec.section }}
                </td>
                <td style="font-size: 0.8rem; color: var(--muted-foreground);">
                  {{ rec.adviser || '—' }}
                </td>
                <td style="text-align: center; font-weight: 600;">
                  {{ rec.ada ?? '—' }}
                </td>
                <td style="text-align: center;">
                  <span 
                    v-if="rec.attendanceRate !== null" 
                    class="rate-pill"
                    :class="rec.attendanceRate >= 95 ? 'rate-pill--high' : rec.attendanceRate >= 90 ? 'rate-pill--mid' : 'rate-pill--low'"
                  >
                    {{ rec.attendanceRate }}%
                  </span>
                  <span v-else style="color: var(--muted-foreground);">—</span>
                </td>
                <td style="text-align: right;">
                  <router-link :to="`/monthly?month=${rec.month}&year=${rec.year}&grade=${encodeURIComponent(rec.grade)}&section=${encodeURIComponent(rec.section)}`" class="table-action-btn">
                    Open
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state-card">
          No monthly SF2 reports filed yet.
        </div>
      </div>

      <!-- SARDO / Chronic Absenteeism Watchlist -->
      <div class="widget-card">
        <div class="widget-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--destructive);">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Attendance Watchlist (SARDO Alert)</span>
            </h3>
            <p>Students with 3 or more absences requiring monitoring & intervention</p>
          </div>
        </div>

        <div v-if="chronicAbsenteeism.length" class="risk-list">
          <div v-for="st in chronicAbsenteeism" :key="st.studentId" class="risk-item">
            <div class="risk-item-info">
              <span class="risk-item-name">{{ st.studentName }}</span>
              <span class="risk-item-class">{{ st.grade }} — {{ st.section }} · {{ st.totalPresent }} days attended</span>
            </div>
            <span class="risk-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ st.totalAbsences }} Absences</span>
            </span>
          </div>
        </div>

        <div v-else class="empty-state-card">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <strong>Zero Chronic Absenteeism</strong>
            <span style="font-size: 0.78rem;">All students currently maintain regular attendance without critical absence flags.</span>
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
const loading = ref(false)
const selectedSchoolId = ref(auth.schoolId || '')
const schoolsList = ref([])

const stats = ref({
  students: 0,
  teachers: 0,
  records: 0,
  entries: 0
})

const summary = ref({
  students: 0,
  maleStudents: 0,
  femaleStudents: 0,
  teachers: 0,
  advisers: 0,
  records: 0,
  entries: 0,
  attendance: {
    present: 0,
    absent: 0,
    tardy: 0,
    rate: 0,
    studentsTracked: 0
  }
})

const grades = ref([])
const monthlyTrends = ref([])
const recentRecords = ref([])
const chronicAbsenteeism = ref([])

const currentDateStr = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const malePct = computed(() => {
  const total = summary.value.students || 0
  if (!total) return 0
  return Math.round(((summary.value.maleStudents || 0) / total) * 100)
})

const femalePct = computed(() => {
  const total = summary.value.students || 0
  if (!total) return 0
  return Math.round(((summary.value.femaleStudents || 0) / total) * 100)
})

const highestMonth = computed(() => {
  if (!monthlyTrends.value.length) return { month: '—', rate: 0 }
  const sorted = [...monthlyTrends.value].sort((a, b) => b.rate - a.rate)
  return {
    month: sorted[0].monthName,
    rate: sorted[0].rate
  }
})

async function loadSchools() {
  if (!auth.isSuperadmin) return
  try {
    schoolsList.value = await auth.getSchools()
  } catch {}
}

async function loadStats() {
  loading.value = true
  try {
    const sid = selectedSchoolId.value || auth.schoolId || ''
    const params = new URLSearchParams({
      userId: auth.user?.id || '',
      userRole: auth.user?.role || '',
      ...(sid ? { schoolId: sid } : {})
    })

    const res = await fetch(`/api/dashboard/stats?${params}`)
    const data = await res.json()

    if (data) {
      stats.value = {
        students: data.students || 0,
        teachers: data.teachers || 0,
        records: data.records || 0,
        entries: data.entries || 0
      }
      if (data.summary) summary.value = data.summary
      grades.value = data.grades || []
      monthlyTrends.value = data.monthlyTrends || []
      recentRecords.value = data.recentRecords || []
      chronicAbsenteeism.value = data.chronicAbsenteeism || []
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadSchools()
  await loadStats()
})
</script>
