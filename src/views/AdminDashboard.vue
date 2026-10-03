<template>
  <div class="dashboard admin-overview">
    <!-- Executive Header -->
    <header class="overview-header">
      <div class="overview-header-copy">
        <div class="overview-eyebrow">
          <span class="eyebrow-dot"></span>
          <span>Campus Administration · Operations &amp; SF2 Telemetry</span>
        </div>
        <h1>Executive Overview</h1>
        <p>
          Welcome back, <strong>{{ auth.user?.name }}</strong>. Real-time campus attendance rates, DepEd Form 2 compliance status, and proactive SARDO retention alerts.
        </p>
      </div>

      <div class="overview-header-actions">
        <!-- Superadmin Multi-School Switcher -->
        <div v-if="auth.isSuperadmin && schoolsList.length > 1" class="school-picker-wrap">
          <svg class="school-picker-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18M3 7v14M21 7v14M6 11h2M6 15h2M10 11h2M10 15h2M14 11h2M14 15h2M18 11h2M18 15h2M7 3h10l2 4H5z"/>
          </svg>
          <select 
            v-model="selectedSchoolId" 
            @change="loadStats" 
            class="school-picker-select"
            aria-label="Select School Scope"
          >
            <option value="">All Deployed Schools</option>
            <option v-for="s in schoolsList" :key="s.id" :value="s.id">{{ s.short || s.name }}</option>
          </select>
        </div>

        <div class="overview-date-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{{ currentDateStr }}</span>
        </div>

        <button @click="loadStats" class="overview-refresh-btn" :disabled="loading" title="Refresh Campus Statistics">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'spin-anim': loading }">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>{{ loading ? 'Syncing…' : 'Refresh' }}</span>
        </button>
      </div>
    </header>

    <!-- Executive KPI Metric Cards -->
    <section class="kpi-grid" aria-label="Key Performance Indicators">
      <!-- Card 1: Total Learners -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-tag">Campus Population</span>
          <div class="kpi-icon kpi-icon--teal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num">{{ Number(summary.students || 0).toLocaleString() }}</span>
          <span class="kpi-unit">Learners</span>
        </div>
        <div class="kpi-meta-split">
          <div class="mini-ratio-bar">
            <div class="mini-ratio-fill male-fill" :style="{ width: `${malePct}%` }" :title="`Male: ${malePct}%`"></div>
            <div class="mini-ratio-fill female-fill" :style="{ width: `${femalePct}%` }" :title="`Female: ${femalePct}%`"></div>
          </div>
          <div class="mini-ratio-legend">
            <span><strong>{{ summary.maleStudents }}</strong> Male ({{ malePct }}%)</span>
            <span>•</span>
            <span><strong>{{ summary.femaleStudents }}</strong> Female ({{ femalePct }}%)</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Attendance Rate & DepEd Standard -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span 
            class="kpi-tag"
            :class="summary.attendance.rate >= 95 ? 'kpi-tag--success' : summary.attendance.rate >= 90 ? 'kpi-tag--warning' : 'kpi-tag--danger'"
          >
            {{ summary.attendance.rate >= 95 ? 'DepEd Target Met' : summary.attendance.rate >= 90 ? 'Acceptable' : 'Attention Required' }}
          </span>
          <div class="kpi-icon kpi-icon--rate">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num">{{ summary.attendance.rate }}%</span>
          <span class="kpi-unit">Attendance Rate</span>
        </div>
        <div class="kpi-subtext">
          <span>DepEd DO 8 Standard: <strong>≥ 95%</strong></span>
          <span class="subtext-divider">•</span>
          <span><strong>{{ Number(summary.attendance.present || 0).toLocaleString() }}</strong> Present days</span>
        </div>
      </div>

      <!-- Card 3: Teaching Faculty & Advisers -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-tag">Classroom Faculty</span>
          <div class="kpi-icon kpi-icon--faculty">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num">{{ summary.teachers || 0 }}</span>
          <span class="kpi-unit">Faculty Members</span>
        </div>
        <div class="kpi-subtext">
          <span><strong>{{ summary.advisers || 0 }}</strong> Section Advisers Assigned</span>
          <span class="subtext-divider">•</span>
          <span><strong>100%</strong> Coverage</span>
        </div>
      </div>

      <!-- Card 4: DepEd SF2 Compliance -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-tag kpi-tag--success">Standard Compliance</span>
          <div class="kpi-icon kpi-icon--sf2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num">{{ summary.records || 0 }}</span>
          <span class="kpi-unit">SF2 Filed</span>
        </div>
        <div class="kpi-subtext">
          <span><strong>{{ Number(summary.entries || 0).toLocaleString() }}</strong> Learner-Month Records</span>
        </div>
      </div>
    </section>

    <!-- Today's Daily Attendance Roll Call Completion -->
    <section v-if="todayCompletion && todayCompletion.totalSections > 0" class="card-box rollcall-tracker-box">
      <div class="card-box-header">
        <div>
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Today's Daily Roll Call Completion ({{ todayCompletion.date }})</span>
          </h3>
          <p>{{ todayCompletion.submittedCount }} of {{ todayCompletion.totalSections }} active sections recorded attendance today</p>
        </div>
        <div class="rollcall-header-actions">
          <div class="rollcall-pct-badge" :class="todayCompletion.completionRate === 100 ? 'badge--complete' : 'badge--progress'">
            {{ todayCompletion.completionRate }}% Submitted
          </div>
          <router-link to="/attendance" class="view-all-link">
            <span>Daily Sheet →</span>
          </router-link>
        </div>
      </div>

      <div class="rollcall-progress-track">
        <div class="rollcall-progress-bar" :style="{ width: `${todayCompletion.completionRate}%` }"></div>
      </div>

      <div class="rollcall-sections-grid">
        <div
          v-for="sec in todayCompletion.sections"
          :key="`${sec.grade}-${sec.section}`"
          class="rollcall-section-chip"
          :class="sec.submitted ? 'chip--submitted' : 'chip--pending'"
        >
          <div class="chip-status-icon">
            <svg v-if="sec.submitted" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="chip-info">
            <span class="chip-name">{{ sec.grade }} — {{ sec.section }}</span>
            <small class="chip-adviser">{{ sec.adviser || 'No Adviser' }} · {{ sec.submitted ? 'Recorded' : 'Pending' }}</small>
          </div>
          <router-link
            :to="`/attendance?grade=${encodeURIComponent(sec.grade)}&section=${encodeURIComponent(sec.section)}&date=${todayCompletion.date}`"
            class="chip-action-btn"
            :title="sec.submitted ? 'Inspect roll call' : 'Record roll call'"
          >
            {{ sec.submitted ? 'View' : 'Take' }}
          </router-link>
        </div>
      </div>
    </section>

    <!-- Trajectory & Demographics Grid -->
    <div class="analytics-row-2">
      <!-- Attendance Trends Chart -->
      <section class="card-box chart-box">
        <div class="card-box-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <span>Monthly Attendance Trajectory</span>
            </h3>
            <p>Historical monthly attendance averages across all advisory classes</p>
          </div>

          <div class="chart-legend-badge">
            <span class="target-dash"></span>
            <span>95% DepEd Target</span>
          </div>
        </div>

        <div v-if="monthlyTrends.length" class="trend-chart-area">
          <div class="trend-bars-container">
            <!-- 95% Benchmark Threshold Line -->
            <div class="benchmark-line" title="DepEd 95% Target">
              <span class="benchmark-label">95%</span>
            </div>

            <div v-for="m in monthlyTrends" :key="m.month" class="trend-bar-column">
              <span class="trend-bar-pct">{{ m.rate }}%</span>
              <div class="trend-bar-track">
                <div 
                  class="trend-bar-fill" 
                  :class="{
                    'fill--good': m.rate >= 95,
                    'fill--fair': m.rate >= 90 && m.rate < 95,
                    'fill--warn': m.rate < 90
                  }"
                  :style="{ height: `${Math.min(100, m.rate)}%` }"
                ></div>
              </div>
              <span class="trend-bar-month">{{ m.monthName.slice(0, 3) }}</span>
            </div>
          </div>

          <div class="trend-summary-strip">
            <div class="trend-metric-pill">
              <span class="metric-pill-label">HIGHEST MONTH</span>
              <strong class="metric-pill-val">{{ highestMonth.month }} ({{ highestMonth.rate }}%)</strong>
            </div>
            <div class="trend-metric-pill">
              <span class="metric-pill-label">YEAR-TO-DATE AVERAGE</span>
              <strong class="metric-pill-val">{{ summary.attendance.rate }}%</strong>
            </div>
            <div class="trend-metric-pill">
              <span class="metric-pill-label">TOTAL LOGGED DAYS</span>
              <strong class="metric-pill-val">{{ Number(summary.attendance.present + summary.attendance.absent).toLocaleString() }}</strong>
            </div>
          </div>
        </div>

        <div v-else class="empty-chart-state">
          <p>No monthly SF2 records available to plot trends yet.</p>
        </div>
      </section>

      <!-- Gender Demographics -->
      <section class="card-box demographics-box">
        <div class="card-box-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
              </svg>
              <span>Learner Demographics</span>
            </h3>
            <p>Male and female learner population distribution</p>
          </div>
        </div>

        <div class="demographics-content">
          <div class="gender-bar-large">
            <div class="gender-fill gender-fill--male" :style="{ width: `${malePct}%` }">
              <span v-if="malePct >= 15">{{ malePct }}% Male</span>
            </div>
            <div class="gender-fill gender-fill--female" :style="{ width: `${femalePct}%` }">
              <span v-if="femalePct >= 15">{{ femalePct }}% Female</span>
            </div>
          </div>

          <div class="gender-cards-row">
            <div class="gender-stat-card gender-stat-card--male">
              <div class="gender-card-top">
                <span class="gender-label">Male Learners</span>
                <span class="gender-badge">{{ malePct }}%</span>
              </div>
              <div class="gender-num">{{ Number(summary.maleStudents || 0).toLocaleString() }}</div>
              <small>Enrolled male learners across all grade levels</small>
            </div>

            <div class="gender-stat-card gender-stat-card--female">
              <div class="gender-card-top">
                <span class="gender-label">Female Learners</span>
                <span class="gender-badge">{{ femalePct }}%</span>
              </div>
              <div class="gender-num">{{ Number(summary.femaleStudents || 0).toLocaleString() }}</div>
              <small>Enrolled female learners across all grade levels</small>
            </div>
          </div>

          <div class="demographic-balance-pill">
            <span>Population Balance Index:</span>
            <strong>{{ Math.abs(malePct - femalePct) <= 5 ? 'Balanced Distribution (≈ 1:1)' : 'Noticeable Demographic Skew' }}</strong>
          </div>
        </div>
      </section>
    </div>

    <!-- Grade Level & Section Performance -->
    <section class="card-box grade-performance-box">
      <div class="card-box-header">
        <div>
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>
            </svg>
            <span>Grade-Level Enrollment &amp; Attendance Performance</span>
          </h3>
          <p>Enrollment figures, gender breakdown, and attendance rate per grade level</p>
        </div>

        <div class="search-filter-wrap">
          <input 
            type="text" 
            v-model="sectionSearch" 
            placeholder="Filter grade or section…" 
            class="section-search-input"
          />
        </div>
      </div>

      <!-- Grade Level Summary Cards -->
      <div class="grade-cards-grid">
        <div v-for="g in grades" :key="g.grade" class="grade-stat-card">
          <div class="grade-card-topline">
            <span class="grade-title">{{ g.grade }}</span>
            <span 
              v-if="g.rate !== null" 
              class="grade-rate-badge" 
              :class="g.rate >= 95 ? 'rate--high' : g.rate >= 90 ? 'rate--mid' : 'rate--low'"
            >
              {{ g.rate }}% Att.
            </span>
            <span v-else class="grade-rate-badge rate--none">No logs</span>
          </div>

          <div class="grade-progress-track">
            <div 
              class="grade-progress-fill" 
              :class="g.rate >= 95 ? 'fill--good' : g.rate >= 90 ? 'fill--fair' : 'fill--warn'"
              :style="{ width: `${g.rate ? Math.min(100, g.rate) : 0}%` }"
            ></div>
          </div>

          <div class="grade-meta-row">
            <span><strong>{{ g.students }}</strong> Learners</span>
            <span>{{ g.male }} M · {{ g.female }} F</span>
            <span>{{ g.sections.length }} Section{{ g.sections.length > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Granular Sections Table -->
      <div class="sections-table-container">
        <div class="sections-table-header">
          <strong>Section Breakdown &amp; Advisory Assignment Matrix</strong>
        </div>

        <div class="table-responsive">
          <table class="overview-table">
            <thead>
              <tr>
                <th>Grade &amp; Section</th>
                <th>Class Adviser</th>
                <th style="text-align: center;">Learners</th>
                <th style="text-align: center;">Gender Ratio</th>
                <th style="text-align: center;">Attendance %</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="g in filteredGrades" :key="g.grade">
                <tr v-for="sec in g.sections" :key="`${g.grade}-${sec.section}`">
                  <td>
                    <strong>{{ g.grade }} — {{ sec.section }}</strong>
                  </td>
                  <td>
                    <span v-if="sec.adviser" class="adviser-name">{{ sec.adviser }}</span>
                    <span v-else class="unassigned-badge">Unassigned</span>
                  </td>
                  <td style="text-align: center; font-weight: 700;">
                    {{ sec.students }}
                  </td>
                  <td style="text-align: center; color: var(--muted-foreground); font-size: 0.78rem;">
                    {{ sec.male }} M · {{ sec.female }} F
                  </td>
                  <td style="text-align: center;">
                    <span v-if="sec.rate !== null" style="font-weight: 800; font-family: 'Manrope', sans-serif;">
                      {{ sec.rate }}%
                    </span>
                    <span v-else style="color: var(--muted-foreground);">—</span>
                  </td>
                  <td style="text-align: center;">
                    <span 
                      v-if="sec.rate !== null" 
                      class="status-pill" 
                      :class="sec.rate >= 95 ? 'status-pill--success' : sec.rate >= 90 ? 'status-pill--warning' : 'status-pill--danger'"
                    >
                      {{ sec.rate >= 95 ? '≥ 95% High' : sec.rate >= 90 ? '90-94% Normal' : '< 90% Alert' }}
                    </span>
                    <span v-else class="status-pill status-pill--neutral">No data</span>
                  </td>
                  <td style="text-align: right;">
                    <router-link :to="`/monthly?grade=${encodeURIComponent(g.grade)}&section=${encodeURIComponent(sec.section)}`" class="table-action-btn">
                      <span>View SF2</span>
                      <span class="action-arrow">→</span>
                    </router-link>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Bottom Row: SARDO Early Warning & Recent Filings -->
    <div class="analytics-row-2">
      <!-- SARDO Retention Early Warning -->
      <section class="card-box sardo-alert-box">
        <div class="card-box-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>SARDO Retention Watchlist</span>
            </h3>
            <p>Learners exceeding retention criteria ({{ sardoRules?.cumulative || 5 }}+ cumulative absences) requiring intervention</p>
          </div>
        </div>

        <div v-if="chronicAbsenteeism.length" class="sardo-list">
          <div v-for="st in chronicAbsenteeism" :key="st.studentId" class="sardo-item">
            <div class="sardo-item-info">
              <strong>{{ st.studentName }}</strong>
              <small>{{ st.grade }} — {{ st.section }} · {{ st.totalPresent }} days attended</small>
            </div>
            <div class="sardo-badge-group">
              <span class="sardo-absence-pill">
                {{ st.totalAbsences }} Absences
              </span>
              <span class="sardo-action-tag">Intervention Required</span>
            </div>
          </div>
        </div>

        <div v-else class="sardo-clean-state">
          <svg class="sardo-clean-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <strong>Zero Critical Retention Flags</strong>
          <small>All learners currently maintain regular attendance without chronic absence alerts.</small>
        </div>
      </section>

      <!-- Recent SF2 Reports Filed -->
      <section class="card-box recent-sf2-box">
        <div class="card-box-header">
          <div>
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span>Recent DepEd SF2 Filings</span>
            </h3>
            <p>Verified monthly attendance records submitted by section advisers</p>
          </div>
          <router-link to="/monthly" class="view-all-link">
            <span>View All Records</span>
            <span>→</span>
          </router-link>
        </div>

        <div v-if="recentRecords.length" class="table-responsive">
          <table class="overview-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Section</th>
                <th style="text-align: center;">ADA</th>
                <th style="text-align: center;">Attendance %</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in recentRecords" :key="r.id">
                <td>
                  <strong>{{ r.monthName }} {{ r.year }}</strong>
                </td>
                <td>
                  <span>{{ r.grade }} - {{ r.section }}</span>
                </td>
                <td style="text-align: center; font-weight: 700;">
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
                  <router-link :to="`/monthly?grade=${encodeURIComponent(r.grade)}&section=${encodeURIComponent(r.section)}`" class="table-action-btn">
                    <span>Open</span>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-records-state">
          <p>No monthly SF2 reports filed yet for this school year.</p>
        </div>
      </section>
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
const sectionSearch = ref('')

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
const sardoRules = ref({ consecutive: 3, cumulative: 5 })
const todayCompletion = ref(null)

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

const filteredGrades = computed(() => {
  if (!sectionSearch.value.trim()) return grades.value
  const q = sectionSearch.value.toLowerCase().trim()
  return grades.value
    .map(g => {
      const matchedSections = g.sections.filter(sec => 
        g.grade.toLowerCase().includes(q) || 
        sec.section.toLowerCase().includes(q) ||
        (sec.adviser && sec.adviser.toLowerCase().includes(q))
      )
      return { ...g, sections: matchedSections }
    })
    .filter(g => g.sections.length > 0)
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
      sardoRules.value = data.sardoRules || { consecutive: 3, cumulative: 5 }
      todayCompletion.value = data.todayAttendanceCompletion || null
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

<style scoped>
.admin-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ==========================================================================
   EXECUTIVE HEADER
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

.school-picker-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}

.school-picker-icon {
  color: var(--primary);
}

.school-picker-select {
  border: none;
  background: transparent;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--foreground);
  outline: none;
  cursor: pointer;
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

.kpi-tag--success {
  background: var(--success-bg);
  color: var(--success);
}

.kpi-tag--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.kpi-tag--danger {
  background: var(--red-bg);
  color: var(--destructive);
}

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

.mini-ratio-fill {
  height: 100%;
}

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

.mini-ratio-legend strong {
  color: var(--foreground);
}

.kpi-subtext {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.kpi-subtext strong {
  color: var(--foreground);
}

.subtext-divider {
  color: var(--border);
}

/* ==========================================================================
   2-COLUMN ANALYTICS ROWS
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

/* Chart Box */
.chart-legend-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--primary);
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--primary-bg);
}

.target-dash {
  width: 14px;
  height: 2px;
  background: var(--primary);
  border-top: 1px dashed var(--primary);
}

.trend-bars-container {
  position: relative;
  height: 160px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 12px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.benchmark-line {
  position: absolute;
  top: 5%;
  left: 0;
  right: 0;
  border-top: 1px dashed var(--border);
  pointer-events: none;
}

.benchmark-label {
  position: absolute;
  top: -16px;
  right: 4px;
  font-size: 0.62rem;
  font-weight: 800;
  color: var(--primary);
}

.trend-bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  justify-content: flex-end;
  flex: 1;
}

.trend-bar-pct {
  font-size: 0.66rem;
  font-weight: 800;
  color: var(--foreground);
}

.trend-bar-track {
  width: 100%;
  max-width: 36px;
  height: 110px;
  display: flex;
  align-items: flex-end;
  background: var(--secondary);
  border-radius: 6px 6px 0 0;
  overflow: hidden;
}

.trend-bar-fill {
  width: 100%;
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.fill--good { background: var(--success); }
.fill--fair { background: var(--warning); }
.fill--warn { background: var(--destructive); }

.trend-bar-month {
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
}

.trend-summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.trend-metric-pill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--muted);
  border: 1px solid var(--border);
}

.metric-pill-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--muted-foreground);
  letter-spacing: 0.06em;
}

.metric-pill-val {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--foreground);
}

/* Demographics Box */
.gender-bar-large {
  display: flex;
  height: 28px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.gender-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.74rem;
  font-weight: 800;
  color: #ffffff;
}

.gender-fill--male { background: var(--info); }
.gender-fill--female { background: var(--accent); }

.gender-cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

.gender-stat-card {
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--card);
}

.gender-stat-card--male { border-color: color-mix(in srgb, var(--info) 30%, var(--border)); }
.gender-stat-card--female { border-color: color-mix(in srgb, var(--accent) 30%, var(--border)); }

.gender-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gender-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.gender-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--secondary);
  color: var(--foreground);
}

.gender-num {
  font-family: 'Manrope', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1.1;
}

.gender-stat-card small {
  font-size: 0.68rem;
  color: var(--muted-foreground);
}

.demographic-balance-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--secondary);
  font-size: 0.74rem;
  color: var(--foreground);
  border: 1px solid var(--border);
}

/* ==========================================================================
   GRADE LEVEL PERFORMANCE
   ========================================================================== */
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

.grade-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.grade-stat-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grade-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.grade-title {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--foreground);
}

.grade-rate-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 4px;
}

.rate--high { background: var(--success-bg); color: var(--success); }
.rate--mid { background: var(--warning-bg); color: var(--warning); }
.rate--low { background: var(--red-bg); color: var(--destructive); }
.rate--none { background: var(--muted); color: var(--muted-foreground); }

.grade-progress-track {
  height: 6px;
  border-radius: 999px;
  background: var(--muted);
  overflow: hidden;
}

.grade-progress-fill {
  height: 100%;
  border-radius: 999px;
}

.grade-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.grade-meta-row strong {
  color: var(--foreground);
}

/* Sections Table */
.sections-table-container {
  border-top: 1px solid var(--border);
  padding-top: 18px;
}

.sections-table-header {
  margin-bottom: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--foreground);
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

.adviser-name {
  font-weight: 600;
}

.unassigned-badge {
  font-size: 0.68rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--red-bg);
  color: var(--destructive);
  font-weight: 700;
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

.table-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--secondary);
  color: var(--foreground);
  font-size: 0.7rem;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid var(--border);
  transition: all 0.12s ease;
}

.table-action-btn:hover {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

/* ==========================================================================
   SARDO & RECENT SF2 FILINGS
   ========================================================================== */
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
  border: 1px solid color-mix(in srgb, var(--destructive) 25%, var(--border));
  background: var(--red-bg);
}

.sardo-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.sardo-item-info strong {
  display: block;
  font-size: 0.8rem;
  color: var(--foreground);
}

.sardo-item-info small {
  color: var(--muted-foreground);
  font-size: 0.68rem;
}

.sardo-badge-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.sardo-absence-pill {
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--card);
  color: var(--destructive);
  font-size: 0.68rem;
  font-weight: 800;
  border: 1px solid color-mix(in srgb, var(--destructive) 30%, transparent);
}

.sardo-action-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 4px;
  background: var(--warning-bg);
  color: var(--warning);
}

.sardo-clean-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 32px 20px;
}

.sardo-clean-icon {
  color: var(--success);
}

.sardo-clean-state strong {
  font-size: 0.95rem;
  color: var(--foreground);
}

.sardo-clean-state small {
  font-size: 0.76rem;
  color: var(--muted-foreground);
  max-width: 320px;
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

.empty-records-state,
.empty-chart-state {
  padding: 32px;
  text-align: center;
  color: var(--muted-foreground);
  font-size: 0.82rem;
}

/* ==========================================================================
   RESPONSIVE OVERRIDES
   ========================================================================== */
/* ==========================================================================
   DAILY ROLL CALL TRACKER
   ========================================================================== */
.rollcall-tracker-box {
  margin-top: 20px;
  padding: 20px 22px;
}

.rollcall-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rollcall-pct-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.76rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 999px;
}

.badge--complete {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(79, 149, 97, 0.3);
}

.badge--progress {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid rgba(182, 131, 56, 0.3);
}

.rollcall-progress-track {
  width: 100%;
  height: 7px;
  background: var(--secondary);
  border-radius: 999px;
  overflow: hidden;
  margin: 14px 0 16px;
}

.rollcall-progress-bar {
  height: 100%;
  background: var(--primary);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.rollcall-sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.rollcall-section-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid var(--border);
  background: var(--card);
  transition: all 0.12s ease;
}

.chip--submitted {
  border-left: 3.5px solid var(--success);
}

.chip--pending {
  border-left: 3.5px solid var(--warning);
  background: var(--card);
}

.chip-status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chip--submitted .chip-status-icon {
  background: var(--success-bg);
  color: var(--success);
}

.chip--pending .chip-status-icon {
  background: var(--warning-bg);
  color: var(--warning);
}

.chip-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.chip-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-adviser {
  font-size: 0.7rem;
  color: var(--muted-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
  text-decoration: none;
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.chip-action-btn:hover {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

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
  .gender-cards-row {
    grid-template-columns: 1fr;
  }
  .trend-summary-strip {
    grid-template-columns: 1fr;
  }
}
</style>
