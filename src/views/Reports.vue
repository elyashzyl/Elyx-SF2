<template>
  <div class="dashboard reports-view">
    <!-- Header -->
    <header class="overview-header">
      <div class="overview-header-copy">
        <div class="overview-eyebrow">
          <span class="eyebrow-dot"></span>
          <span>DepEd Form 2 Telemetry · Reports &amp; Consolidation Hub</span>
        </div>
        <h1>Reports &amp; Analytics</h1>
        <p>
          Consolidated school-wide attendance rankings, quarterly DepEd Form 2 summaries, pre-export validation, and operational data archives.
        </p>
      </div>

      <div class="overview-header-actions">
        <!-- Superadmin Multi-School Switcher -->
        <div v-if="auth.isSuperadmin && schoolsList.length > 1" class="school-picker-wrap">
          <select 
            v-model="selectedSchoolId" 
            @change="onSchoolChange" 
            class="school-picker-select"
            aria-label="Select School Scope"
          >
            <option value="">All Deployed Schools</option>
            <option v-for="s in schoolsList" :key="s.id" :value="s.id">{{ s.short || s.name }}</option>
          </select>
        </div>

        <button @click="loadActiveTab" class="overview-refresh-btn" :disabled="loading" title="Refresh Report Data">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'spin-anim': loading }">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>{{ loading ? 'Syncing…' : 'Refresh' }}</span>
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="report-error-banner" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ errorMessage }}</span>
      <button type="button" class="report-error-dismiss" @click="errorMessage = ''" aria-label="Dismiss error">×</button>
    </div>

    <!-- Navigation Tabs -->
    <div class="reports-tabs-bar">
      <button 
        class="report-tab-btn" 
        :class="{ active: activeTab === 'comparison' }" 
        @click="activeTab = 'comparison'; loadSectionComparison()"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Section Comparison</span>
      </button>

      <button 
        class="report-tab-btn" 
        :class="{ active: activeTab === 'quarterly' }" 
        @click="activeTab = 'quarterly'; loadQuarterlySummary()"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Quarterly Summary</span>
      </button>

      <button 
        class="report-tab-btn" 
        :class="{ active: activeTab === 'validation' }" 
        @click="activeTab = 'validation'; inspectTemplateVersion()"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>SF2 Export Pre-Check</span>
      </button>

      <button 
        class="report-tab-btn" 
        :class="{ active: activeTab === 'archive' }" 
        @click="activeTab = 'archive'; loadArchives()"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="5" x="1" y="3"/><line x1="10" y1="12" x2="14" y2="12"/>
        </svg>
        <span>Report Archive</span>
      </button>

      <button 
        class="report-tab-btn" 
        :class="{ active: activeTab === 'views' }" 
        @click="activeTab = 'views'; loadSavedViews()"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span>Saved Views</span>
      </button>
    </div>

    <!-- TAB 1: SECTION COMPARISON -->
    <div v-if="activeTab === 'comparison'" class="tab-content-pane">
      <div class="filter-action-toolbar card-box">
        <div class="toolbar-left">
          <!-- Search box -->
          <div class="filter-group">
            <label>Search Class</label>
            <div class="search-input-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Section or adviser..." 
                class="search-input"
              />
            </div>
          </div>

          <!-- Grade Level Filter -->
          <div class="filter-group">
            <label>Grade Level</label>
            <select v-model="filterGrade" @change="onFilterGradeChange">
              <option value="">All Grade Levels</option>
              <option v-for="g in availableGrades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <!-- Section Filter -->
          <div class="filter-group" v-if="filterGrade && (sectionsByGrade[filterGrade] || []).length">
            <label>Section</label>
            <select v-model="filterSection" @change="loadSectionComparison">
              <option value="">All Sections</option>
              <option v-for="s in (sectionsByGrade[filterGrade] || [])" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <!-- DepEd DO 8 Compliance Filter -->
          <div class="filter-group">
            <label>Compliance</label>
            <select v-model="complianceFilter">
              <option value="all">All Statuses</option>
              <option value="compliant">Compliant (≥95%)</option>
              <option value="below">Below Target (&lt;95%)</option>
              <option value="risk">SARDO Risk Alert (&gt;0)</option>
            </select>
          </div>

          <!-- Date Preset -->
          <div class="filter-group">
            <label>Date Filter</label>
            <select v-model="comparisonPreset" @change="onComparisonPresetChange">
              <option value="all">All Time / Cumulative</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <!-- Custom Date Range -->
          <div v-if="comparisonPreset === 'custom'" class="filter-group-range">
            <input type="date" v-model="startDate" @change="loadSectionComparison" class="date-input" />
            <span>to</span>
            <input type="date" v-model="endDate" @change="loadSectionComparison" class="date-input" />
          </div>

          <!-- Sort Order -->
          <div class="filter-group">
            <label>Sort By</label>
            <select v-model="sortBy">
              <option value="rank">DepEd Rank (#1 to last)</option>
              <option value="rate_desc">Attendance % (High → Low)</option>
              <option value="rate_asc">Attendance % (Low → High)</option>
              <option value="enrolled_desc">Learners Count</option>
              <option value="name_asc">Section Name (A → Z)</option>
            </select>
          </div>

          <!-- Reset Filter Button -->
          <button 
            v-if="hasActiveComparisonFilters" 
            @click="resetComparisonFilters" 
            class="btn-sm btn-secondary reset-filters-btn"
            title="Reset All Filters"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            <span>Reset</span>
          </button>
        </div>

        <div class="toolbar-right">
          <button @click="saveCurrentView('section_comparison')" class="btn-sm btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Save View</span>
          </button>
          <button @click="downloadCsv('section_comparison')" class="btn-sm btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export CSV</span>
          </button>
          <button @click="archiveCurrentReport('section_comparison')" class="btn-sm btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="5" x="1" y="3"/><line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            <span>Archive Report</span>
          </button>
        </div>
      </div>

      <!-- KPI Snapshot -->
      <div v-if="comparisonData" class="kpi-grid" style="margin-bottom: 20px;">
        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag">Sections Analyzed</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ filteredComparisonSummary.totalSections }}</span>
            <span class="kpi-unit">Active Classes</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag">Total Enrolment</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ filteredComparisonSummary.totalEnrolled }}</span>
            <span class="kpi-unit">Learners</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag" :class="filteredComparisonSummary.overallAttendanceRate >= 95 ? 'kpi-tag--success' : 'kpi-tag--warning'">
              {{ filteredComparisonSummary.overallAttendanceRate >= 95 ? 'DepEd Target Met' : 'Attention' }}
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ filteredComparisonSummary.overallAttendanceRate }}%</span>
            <span class="kpi-unit">Attendance Average</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag" :class="totalSardoAlerts > 0 ? 'kpi-tag--warning' : 'kpi-tag--success'">
              {{ totalSardoAlerts > 0 ? 'SARDO Watchlist' : 'SARDO Clear' }}
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num" :class="{ 'text-danger': totalSardoAlerts > 0 }">{{ totalSardoAlerts }}</span>
            <span class="kpi-unit">Chronic Risk Alerts</span>
          </div>
        </div>
      </div>

      <!-- Section Ranking Table -->
      <div class="card-box">
        <div class="table-count-banner" v-if="filteredSections.length">
          <span>Showing <strong>{{ filteredSections.length }}</strong> of {{ comparisonData?.sections?.length || 0 }} sections</span>
        </div>
        <div class="table-responsive">
          <table class="overview-table">
            <thead>
              <tr>
                <th style="width: 60px; text-align: center;">Rank</th>
                <th>Grade Level &amp; Section</th>
                <th>Class Adviser</th>
                <th style="text-align: center;">Learners (M/F)</th>
                <th style="width: 200px; text-align: center;">Attendance %</th>
                <th style="text-align: center;">Present</th>
                <th style="text-align: center;">Absent</th>
                <th style="text-align: center;">SARDO Risk</th>
                <th style="text-align: center;">Compliance</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody v-if="filteredSections.length">
              <tr v-for="s in filteredSections" :key="`${s.schoolId || ''}-${s.grade}-${s.section}`">
                <td style="text-align: center;">
                  <span class="rank-badge" :class="`rank-${s.rank}`">#{{ s.rank }}</span>
                </td>
                <td>
                  <strong>{{ s.grade }} — {{ s.section }}</strong>
                </td>
                <td>
                  <span v-if="s.adviser">{{ s.adviser }}</span>
                  <span v-else class="unassigned-badge">Unassigned</span>
                </td>
                <td style="text-align: center;">
                  <strong>{{ s.enrolled }}</strong>
                  <small style="color: var(--muted-foreground); display: block;">{{ s.male }} M · {{ s.female }} F</small>
                </td>
                <td style="text-align: center;">
                  <div class="rate-progress-wrap">
                    <div class="rate-track">
                      <div 
                        class="rate-fill" 
                        :class="s.attendanceRate >= 95 ? 'fill-teal' : s.attendanceRate >= 90 ? 'fill-amber' : 'fill-danger'"
                        :style="{ width: `${Math.min(s.attendanceRate, 100)}%` }"
                      ></div>
                    </div>
                    <strong :class="s.attendanceRate >= 95 ? 'text-teal' : s.attendanceRate >= 90 ? 'text-amber' : 'text-danger'">
                      {{ s.attendanceRate }}%
                    </strong>
                  </div>
                </td>
                <td style="text-align: center;">{{ Number(s.present).toLocaleString() }}</td>
                <td style="text-align: center;">{{ Number(s.absent).toLocaleString() }}</td>
                <td style="text-align: center;">
                  <span v-if="s.sardoAlerts > 0" class="badge-sardo-risk">{{ s.sardoAlerts }} at risk</span>
                  <span v-else class="badge-sardo-clear">None</span>
                </td>
                <td style="text-align: center;">
                  <span class="compliance-pill" :class="s.attendanceRate >= 95 ? 'compliance-met' : 'compliance-below'">
                    {{ s.attendanceRate >= 95 ? 'Compliant' : 'Below Target' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button @click="openMonthlyRecord(s.grade, s.section, s.schoolId)" class="btn-xs btn-secondary open-sheet-btn" title="Open monthly SF2 attendance sheet">
                    <span>SF2 Sheet</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="10" class="empty-cell">
                  <div class="empty-state-box">
                    <p>No section records match your current filter settings.</p>
                    <button v-if="hasActiveComparisonFilters" @click="resetComparisonFilters" class="btn-sm btn-primary">
                      Reset Filters
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: QUARTERLY CONSOLIDATION -->
    <div v-if="activeTab === 'quarterly'" class="tab-content-pane">
      <div class="filter-action-toolbar card-box">
        <div class="toolbar-left">
          <div class="filter-group">
            <label>DepEd Quarter</label>
            <select v-model="selectedQuarter" @change="loadQuarterlySummary">
              <option :value="1">Quarter 1 (August – October)</option>
              <option :value="2">Quarter 2 (November – January)</option>
              <option :value="3">Quarter 3 (February – March)</option>
              <option :value="4">Quarter 4 (April – May)</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Grade Filter</label>
            <select v-model="quarterlyGradeFilter">
              <option value="">All Grade Levels</option>
              <option v-for="g in availableGrades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Search Class</label>
            <div class="search-input-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                v-model="quarterlySearch" 
                placeholder="Section or adviser..." 
                class="search-input"
              />
            </div>
          </div>

          <div class="filter-group">
            <label>School Year</label>
            <select v-model="selectedSchoolYear" @change="loadQuarterlySummary">
              <option v-for="year in schoolYearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
        </div>

        <div class="toolbar-right">
          <button @click="saveCurrentView('quarterly_summary')" class="btn-sm btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>Save View</span>
          </button>
          <button @click="downloadCsv('quarterly_summary')" class="btn-sm btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export DepEd CSV</span>
          </button>
          <button @click="archiveCurrentReport('quarterly_summary')" class="btn-sm btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="21 8 21 21 3 21 3 8"/><rect width="22" height="5" x="1" y="3"/><line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            <span>Archive Report</span>
          </button>
        </div>
      </div>

      <!-- Quarterly Summary Cards -->
      <div v-if="quarterlyData" class="card-box" style="margin-bottom: 20px;">
        <div class="card-box-header">
          <div>
            <h3>School-Wide Quarter {{ quarterlyData.quarter }} Totals</h3>
            <p>School Year {{ quarterlyData.schoolYear }} · Reporting Months: {{ quarterlyData.monthsIncluded.join(', ') }}</p>
          </div>
          <div class="rollcall-pct-badge" :class="quarterlyData.grandTotal.attendanceRate >= 95 ? 'badge--complete' : 'badge--warning'">
            {{ filteredQuarterlySummary.attendanceRate }}% School Attendance Rate
          </div>
        </div>

        <div class="quarterly-stats-banner">
          <div class="stat-banner-item">
            <small>REGISTERED LEARNERS</small>
            <strong>{{ filteredQuarterlySummary.totalEnrolled }}</strong>
            <span>{{ filteredQuarterlySummary.maleEnrolled }} M / {{ filteredQuarterlySummary.femaleEnrolled }} F</span>
          </div>
          <div class="stat-banner-item">
            <small>AVERAGE DAILY ATTENDANCE (ADA)</small>
            <strong class="text-teal">{{ filteredQuarterlySummary.ada.total }}</strong>
            <span>{{ filteredQuarterlySummary.ada.male }} M / {{ filteredQuarterlySummary.ada.female }} F</span>
          </div>
          <div class="stat-banner-item">
            <small>REPORTING SCHOOL DAYS</small>
            <strong>{{ filteredQuarterlySummary.schoolDays }} Days</strong>
            <span>Quarterly Consolidated Total</span>
          </div>
        </div>
      </div>

      <!-- Granular Table -->
      <div class="card-box">
        <div class="table-responsive">
          <table class="overview-table">
            <thead>
              <tr>
                <th>Grade Level &amp; Section</th>
                <th>Class Adviser</th>
                <th style="text-align: center;">School Days</th>
                <th style="text-align: center;">Enrolment (M / F / Total)</th>
                <th style="text-align: center;">ADA (M / F / Total)</th>
                <th style="width: 220px; text-align: center;">Att. % (M / F / Total)</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody v-if="filteredQuarterlySections.length">
              <tr v-for="sec in filteredQuarterlySections" :key="`${sec.schoolId || ''}-${sec.grade}-${sec.section}`">
                <td><strong>{{ sec.grade }} — {{ sec.section }}</strong></td>
                <td>{{ sec.adviser || 'Unassigned' }}</td>
                <td style="text-align: center;">{{ sec.schoolDays }}</td>
                <td style="text-align: center;">
                  {{ sec.enrolment.male }} / {{ sec.enrolment.female }} / <strong>{{ sec.enrolment.total }}</strong>
                </td>
                <td style="text-align: center;">
                  {{ sec.ada.male }} / {{ sec.ada.female }} / <strong>{{ sec.ada.total }}</strong>
                </td>
                <td style="text-align: center;">
                  <div class="rate-progress-wrap">
                    <div class="rate-track">
                      <div 
                        class="rate-fill" 
                        :class="sec.attendanceRate.total >= 95 ? 'fill-teal' : sec.attendanceRate.total >= 90 ? 'fill-amber' : 'fill-danger'"
                        :style="{ width: `${Math.min(sec.attendanceRate.total, 100)}%` }"
                      ></div>
                    </div>
                    <span>{{ sec.attendanceRate.male }}% / {{ sec.attendanceRate.female }}% / <strong class="text-teal">{{ sec.attendanceRate.total }}%</strong></span>
                  </div>
                </td>
                <td style="text-align: right;">
                  <button @click="openMonthlyRecord(sec.grade, sec.section, sec.schoolId)" class="btn-xs btn-secondary open-sheet-btn" title="Open monthly SF2 attendance sheet">
                    <span>SF2 Sheet</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="7" class="empty-cell">No quarterly records match your selection.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: SF2 EXPORT PRE-CHECK & VALIDATION -->
    <div v-if="activeTab === 'validation'" class="tab-content-pane">
      <div class="card-box" style="margin-bottom: 20px;">
        <div class="card-box-header">
          <div>
            <h3>Active DepEd Form 2 Template Telemetry</h3>
            <p>Cryptographic hash verification and standard compliance monitoring</p>
          </div>
          <span class="compliance-pill compliance-met">DepEd Order No. 8 Verified</span>
        </div>

        <div v-if="templateVersion" class="template-info-grid">
          <div class="tpl-item">
            <span class="tpl-label">Active Template File</span>
            <strong class="tpl-val">{{ templateVersion.templateName }}</strong>
            <small>Source: {{ templateVersion.source }}</small>
          </div>
          <div class="tpl-item">
            <span class="tpl-label">Integrity Hash (SHA-256)</span>
            <code class="tpl-hash">{{ templateVersion.version }} ({{ templateVersion.hash.slice(0, 16) }}…)</code>
          </div>
          <div class="tpl-item">
            <span class="tpl-label">Template Sheets</span>
            <strong class="tpl-val">{{ templateVersion.sheetsCount }} Sheets Available</strong>
            <small>{{ templateVersion.sheets.join(', ') }}</small>
          </div>
          <div class="tpl-item">
            <span class="tpl-label">File Size</span>
            <strong class="tpl-val">{{ Math.round(templateVersion.fileSize / 1024) }} KB</strong>
          </div>
        </div>
      </div>

      <!-- Pre-flight Validator Form -->
      <div class="card-box">
        <div class="card-box-header">
          <div>
            <h3>Run Export Pre-Flight Checker</h3>
            <p>Validates student names, LRN numbers, attendance glyphs (◤, ◢, x), and date continuity before generation</p>
          </div>
        </div>

        <div class="validator-controls">
          <div class="filter-group">
            <label>Grade Level</label>
            <select v-model="validatorGrade" @change="onValidatorGradeChange">
              <option v-for="g in availableGrades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Section</label>
            <select v-model="validatorSection">
              <option v-for="s in (sectionsByGrade[validatorGrade] || [])" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Month</label>
            <select v-model="validatorMonth">
              <option v-for="(name, idx) in monthNamesList" :key="idx" :value="idx + 1">{{ name }}</option>
            </select>
          </div>

          <div class="validator-actions-wrap">
            <button @click="runValidationCheck" class="btn-sm btn-primary" :disabled="validating">
              {{ validating ? 'Validating Dataset…' : 'Run Pre-Flight Check' }}
            </button>
            <button 
              v-if="validatorGrade && validatorSection"
              @click="openMonthlyRecord(validatorGrade, validatorSection, effectiveSchoolId)"
              class="btn-sm btn-secondary" 
              title="Open this class in Monthly Attendance"
            >
              Open in Monthly SF2 →
            </button>
          </div>
        </div>

        <!-- Validation Results Display -->
        <div v-if="validationResult" class="validation-results-card" :class="validationResult.valid ? 'results--valid' : 'results--warning'">
          <div class="validation-status-banner">
            <div class="status-icon-wrap">
              <svg v-if="validationResult.valid" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h4>{{ validationResult.valid ? 'Roster & Attendance Dataset Ready for Export' : 'Attention: Warnings Detected in Dataset' }}</h4>
              <p>{{ validationResult.summary.totalLearners }} learners analyzed ({{ validationResult.summary.maleCount }} Male, {{ validationResult.summary.femaleCount }} Female)</p>
            </div>
          </div>

          <!-- Error List -->
          <div v-if="validationResult.errors.length" class="val-issue-block errors-block">
            <h5>Blocking Errors ({{ validationResult.errors.length }})</h5>
            <ul>
              <li v-for="(err, i) in validationResult.errors" :key="i">{{ err }}</li>
            </ul>
          </div>

          <!-- Warning List -->
          <div v-if="validationResult.warnings.length" class="val-issue-block warnings-block">
            <h5>Recommended Fixes &amp; Advisories ({{ validationResult.warnings.length }})</h5>
            <ul>
              <li v-for="(warn, i) in validationResult.warnings" :key="i">{{ warn }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: REPORT ARCHIVE -->
    <div v-if="activeTab === 'archive'" class="tab-content-pane">
      <div class="card-box">
        <div class="card-box-header">
          <div>
            <h3>Report Archive &amp; Snapshots</h3>
            <p>Historical audit repository of generated administrative filings and operational exports</p>
          </div>
        </div>

        <!-- Archive Toolbar -->
        <div class="filter-action-toolbar archive-toolbar">
          <div class="toolbar-left">
            <div class="filter-group">
              <label>Search Archives</label>
              <div class="search-input-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input 
                  type="text" 
                  v-model="archiveSearch" 
                  placeholder="Filter by report title..." 
                  class="search-input"
                />
              </div>
            </div>

            <div class="filter-group">
              <label>Report Type</label>
              <select v-model="archiveTypeFilter">
                <option value="all">All Report Types</option>
                <option value="section_comparison">Section Comparison</option>
                <option value="quarterly_summary">Quarterly Summary</option>
                <option value="custom_summary">Custom Summary</option>
              </select>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="overview-table">
            <thead>
              <tr>
                <th>Report Title</th>
                <th>Type</th>
                <th>Format</th>
                <th>Size</th>
                <th>Archived By</th>
                <th>Timestamp</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody v-if="filteredArchives.length">
              <tr v-for="a in filteredArchives" :key="a.id">
                <td><strong>{{ a.title }}</strong></td>
                <td><span class="report-type-badge">{{ a.report_type }}</span></td>
                <td><span class="format-pill">{{ (a.file_format || 'csv').toUpperCase() }}</span></td>
                <td>{{ a.file_size ? Math.round(a.file_size / 1024) + ' KB' : '—' }}</td>
                <td>{{ a.created_by_name || 'System' }}</td>
                <td>{{ new Date(a.created_at).toLocaleString() }}</td>
                <td style="text-align: right;">
                  <div class="row-actions">
                    <button @click="downloadArchive(a)" class="btn-xs btn-primary">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span>Download</span>
                    </button>
                    <button @click="deleteArchive(a.id)" class="btn-xs btn-secondary row-action-danger">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="7" class="empty-cell">No archived reports match your search criteria.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: SAVED VIEWS -->
    <div v-if="activeTab === 'views'" class="tab-content-pane">
      <div class="card-box">
        <div class="card-box-header">
          <div>
            <h3>Custom Saved Views</h3>
            <p>Manage your custom report filters, cohorts, and date-range views</p>
          </div>
        </div>

        <!-- Saved Views Toolbar -->
        <div class="filter-action-toolbar archive-toolbar">
          <div class="toolbar-left">
            <div class="filter-group">
              <label>Search Views</label>
              <div class="search-input-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input 
                  type="text" 
                  v-model="savedViewSearch" 
                  placeholder="Filter by view name..." 
                  class="search-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="overview-table">
            <thead>
              <tr>
                <th>View Name</th>
                <th>Report Type</th>
                <th>Saved Filter Parameters</th>
                <th>Last Updated</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody v-if="filteredSavedViews.length">
              <tr v-for="v in filteredSavedViews" :key="v.id">
                <td><strong>{{ v.name }}</strong></td>
                <td><span class="report-type-badge">{{ v.reportType }}</span></td>
                <td>
                  <div class="saved-filter-chips">
                    <span v-for="(val, key) in (v.filters || {})" :key="key" class="filter-chip">
                      <strong>{{ key }}:</strong> {{ val }}
                    </span>
                  </div>
                </td>
                <td>{{ new Date(v.updatedAt || v.createdAt).toLocaleDateString() }}</td>
                <td style="text-align: right;">
                  <div class="row-actions">
                    <button @click="applySavedView(v)" class="btn-xs btn-primary">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      <span>Load View</span>
                    </button>
                    <button @click="deleteSavedView(v.id)" class="btn-xs btn-secondary row-action-danger">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="5" class="empty-cell">No custom views saved yet. Save a view from the section comparison or quarterly tab.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const activeTab = ref('comparison')
const schoolsList = ref([])
const selectedSchoolId = ref(String(route.query.schoolId || ''))
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || ''))

// Section Comparison State & Filters
const comparisonData = ref(null)
const filterGrade = ref('')
const filterSection = ref('')
const searchQuery = ref('')
const complianceFilter = ref('all')
const sortBy = ref('rank')
const comparisonPreset = ref('all')
const startDate = ref('')
const endDate = ref('')
const availableGrades = ref([])
const sectionsByGrade = ref({})

// Quarterly State & Filters
const quarterlyData = ref(null)
const selectedQuarter = ref(1)
const selectedSchoolYear = ref('')
const quarterlyGradeFilter = ref('')
const quarterlySearch = ref('')

// Template & Validation State
const templateVersion = ref(null)
const validatorGrade = ref('')
const validatorSection = ref('')
const validatorMonth = ref(new Date().getMonth() + 1)
const validating = ref(false)
const validationResult = ref(null)
const monthNamesList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Archives & Saved Views State
const archives = ref([])
const archiveSearch = ref('')
const archiveTypeFilter = ref('all')
const savedViews = ref([])
const savedViewSearch = ref('')

function academicYearForDate(date = new Date()) {
  const year = date.getFullYear()
  return date.getMonth() + 1 >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

const schoolYearOptions = ref([])

// Computed: Total SARDO Alerts in Current Comparison Scope
const filteredComparisonSummary = computed(() => {
  const sections = filteredSections.value
  const totalPresent = sections.reduce((sum, s) => sum + Number(s.present || 0), 0)
  const totalAbsent = sections.reduce((sum, s) => sum + Number(s.absent || 0), 0)
  return {
    totalSections: sections.length,
    totalEnrolled: sections.reduce((sum, s) => sum + Number(s.enrolled || 0), 0),
    totalPresent,
    totalAbsent,
    overallAttendanceRate: totalPresent + totalAbsent > 0
      ? Number(((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(1))
      : 0
  }
})

const totalSardoAlerts = computed(() => filteredSections.value.reduce((acc, s) => acc + Number(s.sardoAlerts || 0), 0))

// Computed: Filtered & Sorted Sections for Section Comparison Tab
const filteredSections = computed(() => {
  if (!comparisonData.value?.sections) return []
  let list = [...comparisonData.value.sections]

  if (filterSection.value) {
    list = list.filter(s => s.section === filterSection.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(s => 
      s.section.toLowerCase().includes(q) ||
      s.grade.toLowerCase().includes(q) ||
      (s.adviser && s.adviser.toLowerCase().includes(q))
    )
  }

  if (complianceFilter.value === 'compliant') {
    list = list.filter(s => s.attendanceRate >= 95)
  } else if (complianceFilter.value === 'below') {
    list = list.filter(s => s.attendanceRate < 95)
  } else if (complianceFilter.value === 'risk') {
    list = list.filter(s => s.sardoAlerts > 0)
  }

  if (sortBy.value === 'rate_desc') {
    list.sort((a, b) => b.attendanceRate - a.attendanceRate)
  } else if (sortBy.value === 'rate_asc') {
    list.sort((a, b) => a.attendanceRate - b.attendanceRate)
  } else if (sortBy.value === 'enrolled_desc') {
    list.sort((a, b) => b.enrolled - a.enrolled)
  } else if (sortBy.value === 'name_asc') {
    list.sort((a, b) => a.section.localeCompare(b.section))
  } else {
    list.sort((a, b) => (a.rank || 0) - (b.rank || 0))
  }

  return list
})

const hasActiveComparisonFilters = computed(() => {
  return !!(
    filterGrade.value ||
    filterSection.value ||
    searchQuery.value.trim() ||
    complianceFilter.value !== 'all' ||
    comparisonPreset.value !== 'all' ||
    sortBy.value !== 'rank'
  )
})

function resetComparisonFilters() {
  filterGrade.value = ''
  filterSection.value = ''
  searchQuery.value = ''
  complianceFilter.value = 'all'
  comparisonPreset.value = 'all'
  startDate.value = ''
  endDate.value = ''
  sortBy.value = 'rank'
  loadSectionComparison()
}

// Computed: Filtered Sections for Quarterly Consolidation Tab
const filteredQuarterlySections = computed(() => {
  if (!quarterlyData.value?.sections) return []
  let list = [...quarterlyData.value.sections]

  if (quarterlyGradeFilter.value) {
    list = list.filter(s => s.grade === quarterlyGradeFilter.value)
  }

  if (quarterlySearch.value.trim()) {
    const q = quarterlySearch.value.trim().toLowerCase()
    list = list.filter(s =>
      s.section.toLowerCase().includes(q) ||
      s.grade.toLowerCase().includes(q) ||
      (s.adviser && s.adviser.toLowerCase().includes(q))
    )
  }

  return list
})

const filteredQuarterlySummary = computed(() => {
  const sections = filteredQuarterlySections.value
  const maleEnrolled = sections.reduce((sum, s) => sum + Number(s.enrolment?.male || 0), 0)
  const femaleEnrolled = sections.reduce((sum, s) => sum + Number(s.enrolment?.female || 0), 0)
  const totalEnrolled = maleEnrolled + femaleEnrolled
  const adaMale = sections.reduce((sum, s) => sum + Number(s.ada?.male || 0), 0)
  const adaFemale = sections.reduce((sum, s) => sum + Number(s.ada?.female || 0), 0)
  const attendanceRate = totalEnrolled > 0
    ? Number((sections.reduce((sum, s) => sum + Number(s.attendanceRate?.total || 0) * Number(s.enrolment?.total || 0), 0) / totalEnrolled).toFixed(1))
    : 0
  return {
    totalEnrolled,
    maleEnrolled,
    femaleEnrolled,
    ada: { male: Number(adaMale.toFixed(2)), female: Number(adaFemale.toFixed(2)), total: Number((adaMale + adaFemale).toFixed(2)) },
    attendanceRate,
    schoolDays: sections.reduce((max, s) => Math.max(max, Number(s.schoolDays || 0)), 0)
  }
})

// Computed: Filtered Archives
const filteredArchives = computed(() => {
  let list = archives.value || []
  if (archiveTypeFilter.value !== 'all') {
    list = list.filter(a => a.report_type === archiveTypeFilter.value)
  }
  if (archiveSearch.value.trim()) {
    const q = archiveSearch.value.trim().toLowerCase()
    list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.created_by_name && a.created_by_name.toLowerCase().includes(q))
    )
  }
  return list
})

// Computed: Filtered Saved Views
const filteredSavedViews = computed(() => {
  let list = savedViews.value || []
  if (savedViewSearch.value.trim()) {
    const q = savedViewSearch.value.trim().toLowerCase()
    list = list.filter(v => v.name.toLowerCase().includes(q))
  }
  return list
})

onMounted(async () => {
  if (auth.isSuperadmin) {
    try {
      schoolsList.value = await auth.getSchools()
    } catch (err) {
      errorMessage.value = err.message || 'Unable to load schools'
    }
  }
  await loadSchoolYears()
  if (!selectedSchoolYear.value) selectedSchoolYear.value = schoolYearOptions.value[0] || academicYearForDate()
  await loadGradeLevels()
  await loadSectionComparison()
})

async function onSchoolChange() {
  filterGrade.value = ''
  filterSection.value = ''
  quarterlyGradeFilter.value = ''
  await loadSchoolYears()
  if (!schoolYearOptions.value.includes(selectedSchoolYear.value)) {
    selectedSchoolYear.value = schoolYearOptions.value[0] || academicYearForDate()
  }
  await loadGradeLevels()
  loadActiveTab()
}

function loadActiveTab() {
  if (activeTab.value === 'comparison') loadSectionComparison()
  else if (activeTab.value === 'quarterly') loadQuarterlySummary()
  else if (activeTab.value === 'validation') inspectTemplateVersion()
  else if (activeTab.value === 'archive') loadArchives()
  else if (activeTab.value === 'views') loadSavedViews()
}

async function loadSchoolYears() {
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    const years = await auth.api(`/reports/school-years?${params.toString()}`)
    schoolYearOptions.value = Array.isArray(years) && years.length ? years : [academicYearForDate()]
  } catch (err) {
    schoolYearOptions.value = [academicYearForDate()]
    errorMessage.value = err.message || 'Failed to load school years'
  }
}

async function loadGradeLevels() {
  const sid = effectiveSchoolId.value || auth.schoolId
  if (!sid) {
    availableGrades.value = []
    sectionsByGrade.value = {}
    return
  }
  try {
    const res = await auth.api(`/schools/${sid}/grades`)
    const levels = Array.isArray(res) ? res : (res?.levels || [])
    availableGrades.value = levels.map(l => l.grade)
    const map = {}
    levels.forEach(l => { map[l.grade] = l.sections || [] })
    sectionsByGrade.value = map
    if (availableGrades.value.length) {
      if (!validatorGrade.value || !availableGrades.value.includes(validatorGrade.value)) {
        validatorGrade.value = availableGrades.value[0]
      }
      onValidatorGradeChange()
    }
  } catch (err) {
    errorMessage.value = err.message || 'Failed to load grade levels'
  }
}

function onFilterGradeChange() {
  filterSection.value = ''
  loadSectionComparison()
}

function onValidatorGradeChange() {
  const sects = sectionsByGrade.value[validatorGrade.value] || []
  if (!validatorSection.value || !sects.includes(validatorSection.value)) {
    validatorSection.value = sects[0] || ''
  }
}

function onComparisonPresetChange() {
  const p = comparisonPreset.value
  const now = new Date()
  if (p === 'this_week') {
    const day = now.getDay()
    const diffToMonday = now.getDate() - (day === 0 ? 6 : day - 1)
    const monday = new Date(now.setDate(diffToMonday))
    const friday = new Date(now.setDate(monday.getDate() + 4))
    startDate.value = monday.toISOString().slice(0, 10)
    endDate.value = friday.toISOString().slice(0, 10)
  } else if (p === 'this_month') {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
    startDate.value = `${y}-${m}-01`
    endDate.value = `${y}-${m}-${lastDay}`
  } else if (p === 'last_month') {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const y = prevMonthDate.getFullYear()
    const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(y, prevMonthDate.getMonth() + 1, 0).getDate()
    startDate.value = `${y}-${m}-01`
    endDate.value = `${y}-${m}-${lastDay}`
  } else if (p === 'all') {
    startDate.value = ''
    endDate.value = ''
  }
  loadSectionComparison()
}

async function loadSectionComparison() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (startDate.value && endDate.value && startDate.value > endDate.value) {
      throw new Error('The start date must be before or equal to the end date.')
    }
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    if (filterGrade.value) params.set('grade', filterGrade.value)
    if (filterSection.value) params.set('section', filterSection.value)
    if (startDate.value && endDate.value) {
      params.set('startDate', startDate.value)
      params.set('endDate', endDate.value)
    }
    comparisonData.value = await auth.api(`/reports/section-comparison?${params.toString()}`)
    if (!effectiveSchoolId.value && Array.isArray(comparisonData.value?.sections)) {
      const grades = [...new Set(comparisonData.value.sections.map(s => s.grade).filter(Boolean))]
      availableGrades.value = grades
      const map = {}
      for (const row of comparisonData.value.sections) {
        if (!map[row.grade]) map[row.grade] = []
        if (row.section && !map[row.grade].includes(row.section)) map[row.grade].push(row.section)
      }
      sectionsByGrade.value = map
    }
  } catch (err) {
    comparisonData.value = null
    errorMessage.value = err.message || 'Failed to load section comparison'
  } finally {
    loading.value = false
  }
}

async function loadQuarterlySummary() {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    params.set('quarter', selectedQuarter.value)
    params.set('schoolYear', selectedSchoolYear.value)
    quarterlyData.value = await auth.api(`/reports/quarterly-summary?${params.toString()}`)
  } catch (err) {
    quarterlyData.value = null
    errorMessage.value = err.message || 'Failed to load quarterly summary'
  } finally {
    loading.value = false
  }
}

function openMonthlyRecord(grade, section, schoolId = '') {
  router.push({
    path: '/monthly',
    query: {
      grade,
      section,
      ...(schoolId || effectiveSchoolId.value ? { schoolId: schoolId || effectiveSchoolId.value } : {})
    }
  })
}

async function inspectTemplateVersion() {
  try {
    templateVersion.value = await auth.api('/export/template/version')
  } catch (err) {
    console.error('Failed to inspect template:', err)
  }
}

async function runValidationCheck() {
  if (!validatorGrade.value || !validatorSection.value) return
  validating.value = true
  validationResult.value = null
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    const year = new Date().getFullYear()
    let entries = []

    // Fetch existing monthly sheet entries first
    try {
      const mRes = await auth.api(`/monthly?schoolId=${sid}&grade=${encodeURIComponent(validatorGrade.value)}&section=${encodeURIComponent(validatorSection.value)}&month=${validatorMonth.value}&year=${year}`)
      if (mRes && Array.isArray(mRes.entries) && mRes.entries.length > 0) {
        entries = mRes.entries
      }
    } catch {}

    // Fall back to class roster if no monthly sheet generated yet
    if (!entries.length) {
      try {
        const rosterRes = await auth.api(`/monthly/roster?schoolId=${sid}&grade=${encodeURIComponent(validatorGrade.value)}&section=${encodeURIComponent(validatorSection.value)}`)
        if (Array.isArray(rosterRes) && rosterRes.length > 0) {
          entries = rosterRes.map(s => ({
            student_id: s.id,
            name: s.name,
            gender: s.gender,
            lrn: s.lrn,
            days: {}
          }))
        }
      } catch {}
    }

    if (!entries.length) {
      validationResult.value = {
        valid: false,
        errors: ['No learners enrolled or found in this section. Please enroll students first.'],
        warnings: [],
        summary: { totalLearners: 0, maleCount: 0, femaleCount: 0 }
      }
      return
    }

    validationResult.value = await auth.api('/export/validate', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: sid,
        grade: validatorGrade.value,
        section: validatorSection.value,
        month: validatorMonth.value,
        year,
        entries
      })
    })
  } catch (err) {
    console.error('Validation error:', err)
    validationResult.value = {
      valid: false,
      errors: [err.message || 'Validation request failed'],
      warnings: [],
      summary: { totalLearners: 0, maleCount: 0, femaleCount: 0 }
    }
  } finally {
    validating.value = false
  }
}

async function loadArchives() {
  errorMessage.value = ''
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    const params = new URLSearchParams()
    if (sid) params.set('schoolId', sid)
    archives.value = await auth.api(`/reports/archive?${params.toString()}`)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to load report archives'
  }
}

async function downloadArchive(a) {
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    const params = new URLSearchParams()
    if (sid) params.set('schoolId', sid)
    const res = await fetch(`/api/reports/archive/${a.id}/download?${params.toString()}`, {
      headers: auth.actorHeaders(),
      credentials: 'same-origin'
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to download report archive')
    }
    const blob = await res.blob()
    const filename = `${a.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.${a.file_format || 'csv'}`
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    alert(err.message || 'Download failed')
  }
}

async function deleteArchive(id) {
  if (!confirm('Are you sure you want to delete this archived report?')) return
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    await auth.api(`/reports/archive/${id}?schoolId=${sid}`, { method: 'DELETE' })
    await loadArchives()
  } catch (err) {
    alert(err.message || 'Failed to delete report archive')
  }
}

async function loadSavedViews() {
  errorMessage.value = ''
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    const params = new URLSearchParams()
    if (sid) params.set('schoolId', sid)
    savedViews.value = await auth.api(`/reports/saved-views?${params.toString()}`)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to load saved views'
  }
}

async function deleteSavedView(id) {
  if (!confirm('Are you sure you want to remove this saved view?')) return
  try {
    await auth.api(`/reports/saved-views/${id}`, { method: 'DELETE' })
    await loadSavedViews()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to delete saved view'
  }
}

async function saveCurrentView(type) {
  const defaultName = type === 'section_comparison'
    ? `Comparison — ${filterGrade.value || 'All Grades'} (${comparisonPreset.value})`
    : `Quarter ${selectedQuarter.value} (${selectedSchoolYear.value})`
  const name = prompt('Enter a name for this saved view:', defaultName)
  if (!name) return
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    const filters = type === 'section_comparison'
      ? { grade: filterGrade.value, section: filterSection.value, startDate: startDate.value, endDate: endDate.value, preset: comparisonPreset.value }
      : { quarter: selectedQuarter.value, schoolYear: selectedSchoolYear.value, grade: quarterlyGradeFilter.value }
    await auth.api('/reports/saved-views', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: sid,
        name,
        reportType: type,
        filters
      })
    })
    alert(`Saved view "${name}" stored successfully`)
    if (activeTab.value === 'views') await loadSavedViews()
  } catch (err) {
    alert(err.message || 'Failed to save view')
  }
}

function applySavedView(v) {
  if (v.reportType === 'section_comparison') {
    activeTab.value = 'comparison'
    if (v.filters?.grade !== undefined) filterGrade.value = v.filters.grade
    if (v.filters?.section !== undefined) filterSection.value = v.filters.section
    if (v.filters?.startDate !== undefined) startDate.value = v.filters.startDate
    if (v.filters?.endDate !== undefined) endDate.value = v.filters.endDate
    if (v.filters?.preset) comparisonPreset.value = v.filters.preset
    loadSectionComparison()
  } else if (v.reportType === 'dashboard') {
    router.push({ path: '/', query: { ...(effectiveSchoolId.value ? { schoolId: effectiveSchoolId.value } : {}), ...(v.filters?.startDate ? { startDate: v.filters.startDate } : {}), ...(v.filters?.endDate ? { endDate: v.filters.endDate } : {}) } })
  } else if (v.reportType === 'quarterly_summary') {
    activeTab.value = 'quarterly'
    if (v.filters?.quarter) selectedQuarter.value = v.filters.quarter
    if (v.filters?.schoolYear) selectedSchoolYear.value = v.filters.schoolYear
    if (v.filters?.grade !== undefined) quarterlyGradeFilter.value = v.filters.grade
    loadQuarterlySummary()
  }
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function downloadCsv(type) {
  try {
    let headers
    let rows
    let filename

    if (type === 'section_comparison') {
      headers = ['Rank', 'Grade', 'Section', 'Class Adviser', 'Total Learners', 'Male', 'Female', 'Present', 'Absent', 'Attendance %', 'SARDO Alerts', 'DepEd Compliance Status']
      rows = filteredSections.value.map(s => [
        s.rank, s.grade, s.section, s.adviser || 'Unassigned', s.enrolled, s.male, s.female,
        s.present, s.absent, `${s.attendanceRate}%`, s.sardoAlerts,
        s.attendanceRate >= 95 ? 'Compliant (DepEd DO 8 Met)' : 'Below Target'
      ])
      const summary = filteredComparisonSummary.value
      rows.push(['Total', '', '', `${summary.totalSections} sections`, summary.totalEnrolled, '', '', summary.totalPresent, summary.totalAbsent, `${summary.overallAttendanceRate}%`, '', summary.overallAttendanceRate >= 95 ? 'DepEd Target Met' : 'Attention Needed'])
      filename = `section-comparison-${new Date().toISOString().slice(0, 10)}.csv`
    } else {
      headers = ['Grade Level', 'Section', 'Class Adviser', 'School Days', 'Enrolled Male', 'Enrolled Female', 'Enrolled Total', 'ADA Male', 'ADA Female', 'ADA Total', 'Att % Male', 'Att % Female', 'Att % Total']
      rows = filteredQuarterlySections.value.map(s => [
        s.grade, s.section, s.adviser || 'Unassigned', s.schoolDays,
        s.enrolment.male, s.enrolment.female, s.enrolment.total,
        s.ada.male, s.ada.female, s.ada.total,
        `${s.attendanceRate.male}%`, `${s.attendanceRate.female}%`, `${s.attendanceRate.total}%`
      ])
      const summary = filteredQuarterlySummary.value
      rows.push(['Grand Total', '', '', summary.schoolDays, summary.maleEnrolled, summary.femaleEnrolled, summary.totalEnrolled, summary.ada.male, summary.ada.female, summary.ada.total, '', '', `${summary.attendanceRate}%`])
      filename = `deped-quarter-${selectedQuarter.value}-summary-${new Date().toISOString().slice(0, 10)}.csv`
    }

    const content = '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    errorMessage.value = err.message || 'CSV download failed'
  }
}

async function archiveCurrentReport(type) {
  const title = prompt('Enter a title to archive this report:', `${type === 'quarterly_summary' ? 'Quarter ' + selectedQuarter.value : 'Section Comparison'} — ${new Date().toLocaleDateString()}`)
  if (!title) return
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    let contentData = ''

    if (type === 'section_comparison' && filteredSections.value.length) {
      const headers = ['Rank', 'Grade', 'Section', 'Adviser', 'Total Enrolled', 'Male', 'Female', 'Present', 'Absent', 'Attendance %', 'SARDO Alerts', 'Status']
      const rows = filteredSections.value.map(s => [
        s.rank, `"${s.grade}"`, `"${s.section}"`, `"${s.adviser || 'Unassigned'}"`, s.enrolled, s.male, s.female, s.present, s.absent, `"${s.attendanceRate}%"`, s.sardoAlerts, `"${s.attendanceRate >= 95 ? 'Compliant' : 'Below Target'}"`
      ])
      const summaryRow = ['Total', '""', '""', `"${filteredComparisonSummary.value.totalSections} sections"`, filteredComparisonSummary.value.totalEnrolled, '', '', filteredComparisonSummary.value.totalPresent, filteredComparisonSummary.value.totalAbsent, `"${filteredComparisonSummary.value.overallAttendanceRate}%"`, '', `"${filteredComparisonSummary.value.overallAttendanceRate >= 95 ? 'DepEd Target Met' : 'Attention Needed'}"`]
      contentData = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')].join('\r\n')
    } else if (type === 'quarterly_summary' && filteredQuarterlySections.value.length) {
      const headers = ['Grade Level', 'Section', 'Adviser', 'School Days', 'Enrolled Male', 'Enrolled Female', 'Total Enrolled', 'ADA Male', 'ADA Female', 'ADA Total', 'Att % Male', 'Att % Female', 'Att % Total']
      const rows = filteredQuarterlySections.value.map(s => [
        `"${s.grade}"`, `"${s.section}"`, `"${s.adviser || 'Unassigned'}"`, s.schoolDays, s.enrolment.male, s.enrolment.female, s.enrolment.total, s.ada.male, s.ada.female, s.ada.total, `"${s.attendanceRate.male}%"`, `"${s.attendanceRate.female}%"`, `"${s.attendanceRate.total}%"`
      ])
      const grandTotalRow = ['"Grand Total"', '""', '""', filteredQuarterlySummary.value.schoolDays, filteredQuarterlySummary.value.maleEnrolled, filteredQuarterlySummary.value.femaleEnrolled, filteredQuarterlySummary.value.totalEnrolled, filteredQuarterlySummary.value.ada.male, filteredQuarterlySummary.value.ada.female, filteredQuarterlySummary.value.ada.total, '', '', `"${filteredQuarterlySummary.value.attendanceRate}%"`]
      contentData = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(',')), grandTotalRow.join(',')].join('\r\n')
    } else {
      contentData = `Report: ${title}\nGenerated on: ${new Date().toISOString()}`
    }

    await auth.api('/reports/archive', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: sid,
        reportType: type,
        title,
        parameters: { quarter: selectedQuarter.value, grade: filterGrade.value },
        fileFormat: 'csv',
        contentData
      })
    })
    alert('Report archived successfully')
    await loadArchives()
  } catch (err) {
    errorMessage.value = err.message || 'Archiving failed'
  }
}
</script>

<style scoped>
.report-error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--destructive) 35%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--destructive) 8%, var(--card));
  color: var(--destructive);
  font-size: 0.85rem;
}

.report-error-dismiss {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}

.reports-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Keep Reports & Analytics visually consistent with the dashboard shell. */
.reports-view .overview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.reports-view .overview-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
  color: var(--primary);
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.reports-view .eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
}

.reports-view .overview-header-copy h1 {
  margin: 0 0 6px;
  color: var(--foreground);
  font-family: 'Manrope', sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -.04em;
}

.reports-view .overview-header-copy p {
  max-width: 680px;
  margin: 0;
  color: var(--muted-foreground);
  font-size: .84rem;
  line-height: 1.5;
}

.reports-view .overview-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.reports-view .school-picker-wrap {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
}

.reports-view .school-picker-select {
  min-width: 170px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--foreground);
  font-size: .76rem;
  font-weight: 700;
  cursor: pointer;
}

.reports-view .overview-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--foreground);
  font-size: .74rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .12s ease, border-color .12s ease, color .12s ease;
}

.reports-view .overview-refresh-btn:hover:not(:disabled) {
  border-color: var(--primary);
  background: var(--secondary);
  color: var(--primary);
}

.reports-view .btn-primary,
.reports-view .btn-secondary,
.reports-view .btn-sm,
.reports-view .btn-xs {
  min-height: 36px;
  border-radius: 9px;
  font-size: .68rem;
  font-weight: 800;
}

.reports-view .btn-sm {
  min-height: 36px;
  padding: 0 12px;
}

.reports-view .btn-xs {
  min-height: 32px;
  padding: 0 10px;
}

.reports-view .btn-primary {
  box-shadow: 0 5px 12px var(--primary-glow);
}

.reports-view .btn-primary svg,
.reports-view .btn-secondary svg,
.reports-view .btn-sm svg,
.reports-view .btn-xs svg {
  flex: 0 0 auto;
}

.reports-tabs-bar {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  overflow-x: auto;
}

.tab-content-pane {
  min-width: 0;
}

.card-box-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 18px;
}

.card-box-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--foreground);
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 800;
}

.card-box-header p {
  margin-top: 5px;
  color: var(--muted-foreground);
  font-size: .72rem;
  line-height: 1.5;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  box-shadow: var(--shadow-xs);
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}

.kpi-card:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.kpi-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.kpi-tag {
  padding: 3px 8px;
  border-radius: 5px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: .64rem;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.kpi-tag--success {
  background: var(--success-bg);
  color: var(--success);
}

.kpi-tag--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.kpi-main-num {
  color: var(--foreground);
  font-family: 'Manrope', sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -.05em;
  line-height: 1;
}

.kpi-unit {
  color: var(--muted-foreground);
  font-size: .7rem;
  font-weight: 600;
}

.rollcall-pct-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: .7rem;
  font-weight: 800;
  white-space: nowrap;
}

.badge--complete {
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
  background: var(--success-bg);
  color: var(--success);
}

.badge--warning,
.badge--progress {
  border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
  background: var(--warning-bg);
  color: var(--warning);
}

.report-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: .72rem;
  font-weight: 800;
  cursor: pointer;
  transition: background .12s ease, border-color .12s ease, color .12s ease, transform .08s ease;
  white-space: nowrap;
}

.report-tab-btn:focus-visible,
.reports-view button:focus-visible,
.reports-view select:focus-visible,
.reports-view input:focus-visible {
  outline: 3px solid var(--primary-bg);
  outline-offset: 1px;
}

.report-tab-btn:active {
  transform: scale(.97);
}

.report-tab-btn:hover {
  color: var(--foreground);
  background: var(--muted);
}

.report-tab-btn.active {
  color: var(--secondary-foreground);
  background: var(--secondary);
  border-color: var(--border);
  box-shadow: var(--shadow-xs);
}

.filter-action-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 18px;
  margin-bottom: 20px;
}

.reports-view .card-box {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-right {
  margin-left: auto;
}

.archive-toolbar {
  padding: 0 0 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
  box-shadow: none;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.row-action-danger {
  color: var(--destructive) !important;
}

.row-action-danger:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--destructive) 30%, var(--border));
  background: var(--red-bg);
  color: var(--destructive) !important;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.filter-group select, .text-input, .date-input {
  width: 100%;
  min-width: 132px;
  height: 39px;
  padding: 0 11px;
  border: 1px solid var(--input);
  border-radius: 9px;
  outline: none;
  background: var(--card);
  color: var(--foreground);
  font-size: .76rem;
  transition: border-color .17s ease, box-shadow .17s ease, background .17s ease;
}

.filter-group select:hover, .text-input:hover, .date-input:hover {
  border-color: color-mix(in srgb, var(--primary) 45%, var(--input));
}

.filter-group select:focus, .text-input:focus, .date-input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px var(--primary-bg);
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrap svg {
  position: absolute;
  left: 10px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.search-input {
  width: 190px;
  height: 39px;
  padding: 0 11px 0 32px;
  border: 1px solid var(--input);
  border-radius: 9px;
  outline: none;
  background: var(--card);
  color: var(--foreground);
  font-size: .76rem;
}

.search-input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px var(--primary-bg);
}

.filter-group-range {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.reset-filters-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 10px;
  color: var(--muted-foreground);
}

.reset-filters-btn:hover {
  color: var(--foreground);
}

.table-count-banner {
  padding: 0 22px 12px;
  font-size: .7rem;
  color: var(--muted-foreground);
}

.table-responsive {
  overflow-x: auto;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .74rem;
}

.overview-table th {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: .64rem;
  font-weight: 800;
  letter-spacing: .06em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.overview-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--foreground);
  vertical-align: middle;
}

.overview-table tbody tr {
  transition: background .12s ease;
}

.overview-table tbody tr:hover {
  background: var(--secondary);
}

.overview-table tbody tr:last-child td {
  border-bottom: 0;
}

.empty-cell {
  padding: 0 !important;
}

.unassigned-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border: 1px solid color-mix(in srgb, var(--destructive) 20%, transparent);
  border-radius: 6px;
  background: var(--red-bg);
  color: var(--destructive);
  font-size: .66rem;
  font-weight: 800;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  background: var(--muted);
  color: var(--muted-foreground);
}

.rank-1 { background: var(--primary-bg); color: var(--primary); font-weight: 800; border: 1px solid var(--primary); }
.rank-2 { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
.rank-3 { background: color-mix(in srgb, var(--primary) 7%, transparent); color: var(--primary); }

.rate-progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 140px;
  margin: 0 auto;
}

.rate-track {
  width: 100%;
  height: 6px;
  background: var(--muted);
  border-radius: 9999px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.fill-teal { background: var(--primary); }
.fill-amber { background: var(--warning); }
.fill-danger { background: var(--destructive); }

.open-sheet-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge-sardo-risk {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--red-bg);
  color: var(--destructive);
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-sardo-clear {
  color: var(--muted-foreground);
  font-size: 0.8rem;
}

.compliance-pill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.compliance-met {
  background: var(--success-bg);
  color: var(--success);
}

.compliance-below {
  background: var(--warning-bg);
  color: var(--warning);
}

.empty-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  color: var(--muted-foreground);
}

.quarterly-stats-banner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--muted);
  margin-top: 14px;
}

.stat-banner-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-banner-item small {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted-foreground);
  letter-spacing: 0.05em;
}

.stat-banner-item strong {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--foreground);
}

.stat-banner-item span {
  font-size: 0.78rem;
  color: var(--muted-foreground);
}

.template-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.tpl-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tpl-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
}

.tpl-val {
  font-size: 0.95rem;
  color: var(--foreground);
}

.tpl-hash {
  font-size: 0.75rem;
  background: var(--muted);
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  word-break: break-all;
}

.validator-controls {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.validator-actions-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.validation-results-card {
  padding: 18px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.results--valid {
  background: color-mix(in srgb, var(--success) 4%, transparent);
  border-color: color-mix(in srgb, var(--success) 25%, var(--border));
}

.results--warning {
  background: color-mix(in srgb, var(--warning) 4%, transparent);
  border-color: color-mix(in srgb, var(--warning) 25%, var(--border));
}

.validation-status-banner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.status-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  color: var(--primary);
  flex-shrink: 0;
}

.validation-status-banner h4 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  color: var(--foreground);
}

.validation-status-banner p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.val-issue-block {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
}

.errors-block {
  background: var(--red-bg);
  color: var(--destructive);
}

.warnings-block {
  background: var(--warning-bg);
  color: var(--warning);
}

.val-issue-block h5 {
  margin: 0 0 6px 0;
  font-size: 0.82rem;
  font-weight: 700;
}

.val-issue-block ul {
  margin: 0;
  padding-left: 18px;
  font-size: 0.82rem;
}

.report-type-badge {
  font-size: 0.75rem;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--muted);
  color: var(--foreground);
}

.format-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--primary-bg);
  color: var(--primary);
}

.saved-filter-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  font-size: 0.74rem;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--muted);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.text-teal { color: var(--primary); }
.text-amber { color: var(--warning); }
.text-danger { color: var(--destructive); }

@media (max-width: 1100px) {
  .reports-view .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .reports-view .overview-header {
    flex-direction: column;
  }

  .reports-view .overview-header-actions {
    justify-content: flex-start;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .toolbar-right {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .reports-view {
    gap: 16px;
  }

  .reports-view .overview-header-copy h1 {
    font-size: 1.55rem;
  }

  .reports-tabs-bar {
    gap: 5px;
    padding-bottom: 6px;
  }

  .report-tab-btn {
    min-height: 35px;
    padding: 0 10px;
    font-size: .66rem;
  }

  .filter-action-toolbar {
    align-items: stretch;
    padding: 14px;
  }

  .toolbar-left,
  .toolbar-right,
  .filter-group,
  .filter-group-range,
  .validator-controls,
  .validator-actions-wrap {
    width: 100%;
  }

  .filter-group select,
  .search-input,
  .date-input,
  .toolbar-right .btn-sm,
  .validator-actions-wrap .btn-sm {
    width: 100%;
  }

  .filter-group-range {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .filter-group-range span {
    display: none;
  }

  .toolbar-right,
  .validator-actions-wrap {
    flex-direction: column;
    align-items: stretch;
  }

  .row-actions {
    justify-content: flex-start;
  }

  .reports-view .card-box {
    padding: 16px;
  }

  .reports-view .kpi-grid {
    grid-template-columns: 1fr;
  }

  .reports-view .card-box-header {
    flex-direction: column;
    gap: 10px;
  }

  .overview-table {
    min-width: 860px;
  }
}
</style>
