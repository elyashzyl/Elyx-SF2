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
          <div class="filter-group">
            <label>Grade Level</label>
            <select v-model="filterGrade" @change="loadSectionComparison">
              <option value="">All Grade Levels</option>
              <option v-for="g in availableGrades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Date Filter</label>
            <select v-model="comparisonPreset" @change="onComparisonPresetChange">
              <option value="all">All Time / Cumulative</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <div v-if="comparisonPreset === 'custom'" class="filter-group-range">
            <input type="date" v-model="startDate" @change="loadSectionComparison" class="date-input" />
            <span>to</span>
            <input type="date" v-model="endDate" @change="loadSectionComparison" class="date-input" />
          </div>
        </div>

        <div class="toolbar-right">
          <button @click="downloadCsv('section_comparison')" class="btn-sm btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export CSV</span>
          </button>
          <button @click="archiveCurrentReport('section_comparison')" class="btn-sm btn-secondary">
            Archive Report
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
            <span class="kpi-main-num">{{ comparisonData.summary.totalSections }}</span>
            <span class="kpi-unit">Active Classes</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag">Total Enrolment</span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ comparisonData.summary.totalEnrolled }}</span>
            <span class="kpi-unit">Learners</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header">
            <span class="kpi-tag" :class="comparisonData.summary.overallAttendanceRate >= 95 ? 'kpi-tag--success' : 'kpi-tag--warning'">
              {{ comparisonData.summary.overallAttendanceRate >= 95 ? 'DepEd Target Met' : 'Attention' }}
            </span>
          </div>
          <div class="kpi-value-row">
            <span class="kpi-main-num">{{ comparisonData.summary.overallAttendanceRate }}%</span>
            <span class="kpi-unit">Attendance Average</span>
          </div>
        </div>
      </div>

      <!-- Section Ranking Table -->
      <div class="card-box">
        <div class="table-responsive">
          <table class="overview-table">
            <thead>
              <tr>
                <th style="width: 60px; text-align: center;">Rank</th>
                <th>Grade Level &amp; Section</th>
                <th>Class Adviser</th>
                <th style="text-align: center;">Learners (M/F)</th>
                <th style="text-align: center;">Attendance %</th>
                <th style="text-align: center;">Present</th>
                <th style="text-align: center;">Absent</th>
                <th style="text-align: center;">SARDO Risk</th>
                <th style="text-align: center;">Standard Status</th>
              </tr>
            </thead>
            <tbody v-if="comparisonData && comparisonData.sections.length">
              <tr v-for="s in comparisonData.sections" :key="`${s.grade}-${s.section}`">
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
                  <strong :class="s.attendanceRate >= 95 ? 'text-teal' : s.attendanceRate >= 90 ? 'text-amber' : 'text-danger'">
                    {{ s.attendanceRate }}%
                  </strong>
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
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="9" class="empty-cell">No section records found for the selected scope.</td>
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
            <label>School Year</label>
            <input type="text" v-model="selectedSchoolYear" @change="loadQuarterlySummary" placeholder="2026-2027" class="text-input" style="width: 120px;" />
          </div>
        </div>

        <div class="toolbar-right">
          <button @click="downloadCsv('quarterly_summary')" class="btn-sm btn-primary">
            Export DepEd CSV
          </button>
          <button @click="archiveCurrentReport('quarterly_summary')" class="btn-sm btn-secondary">
            Archive Report
          </button>
        </div>
      </div>

      <!-- Quarterly Summary Cards -->
      <div v-if="quarterlyData" class="card-box" style="margin-bottom: 20px;">
        <div class="card-box-header">
          <div>
            <h3>School-Wide Quarter {{ quarterlyData.quarter }} Totals</h3>
            <p>School Year {{ quarterlyData.schoolYear }} · Months: {{ quarterlyData.monthsIncluded.join(', ') }}</p>
          </div>
          <div class="rollcall-pct-badge badge--complete">
            {{ quarterlyData.grandTotal.attendanceRate }}% School Attendance Rate
          </div>
        </div>

        <div class="quarterly-stats-banner">
          <div class="stat-banner-item">
            <small>REGISTERED LEARNERS</small>
            <strong>{{ quarterlyData.grandTotal.totalEnrolled }}</strong>
            <span>{{ quarterlyData.grandTotal.maleEnrolled }} M / {{ quarterlyData.grandTotal.femaleEnrolled }} F</span>
          </div>
          <div class="stat-banner-item">
            <small>AVERAGE DAILY ATTENDANCE (ADA)</small>
            <strong class="text-teal">{{ quarterlyData.grandTotal.ada.total }}</strong>
            <span>{{ quarterlyData.grandTotal.ada.male }} M / {{ quarterlyData.grandTotal.ada.female }} F</span>
          </div>
          <div class="stat-banner-item">
            <small>REPORTING SCHOOL DAYS</small>
            <strong>{{ quarterlyData.grandTotal.schoolDays }} Days</strong>
            <span>Quarterly Window</span>
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
                <th style="text-align: center;">Att. % (M / F / Total)</th>
              </tr>
            </thead>
            <tbody v-if="quarterlyData && quarterlyData.sections.length">
              <tr v-for="sec in quarterlyData.sections" :key="`${sec.grade}-${sec.section}`">
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
                  {{ sec.attendanceRate.male }}% / {{ sec.attendanceRate.female }}% / <strong class="text-teal">{{ sec.attendanceRate.total }}%</strong>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="6" class="empty-cell">No quarterly records filed for this period yet.</td>
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
            <select v-model="validatorGrade">
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

          <button @click="runValidationCheck" class="btn-sm btn-primary" :disabled="validating">
            {{ validating ? 'Validating Dataset…' : 'Run Pre-Flight Check' }}
          </button>
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
            <tbody v-if="archives.length">
              <tr v-for="a in archives" :key="a.id">
                <td><strong>{{ a.title }}</strong></td>
                <td><span class="report-type-badge">{{ a.report_type }}</span></td>
                <td><span class="format-pill">{{ (a.file_format || 'csv').toUpperCase() }}</span></td>
                <td>{{ a.file_size ? Math.round(a.file_size / 1024) + ' KB' : '—' }}</td>
                <td>{{ a.created_by_name || 'System' }}</td>
                <td>{{ new Date(a.created_at).toLocaleString() }}</td>
                <td style="text-align: right;">
                  <button @click="downloadArchive(a)" class="btn-xs btn-primary">
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="7" class="empty-cell">No reports archived for this school yet.</td>
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
            <tbody v-if="savedViews.length">
              <tr v-for="v in savedViews" :key="v.id">
                <td><strong>{{ v.name }}</strong></td>
                <td><span class="report-type-badge">{{ v.reportType }}</span></td>
                <td>
                  <code>{{ JSON.stringify(v.filters) }}</code>
                </td>
                <td>{{ new Date(v.updatedAt || v.createdAt).toLocaleDateString() }}</td>
                <td style="text-align: right;">
                  <button @click="applySavedView(v)" class="btn-xs btn-primary" style="margin-right: 8px;">
                    Load View
                  </button>
                  <button @click="deleteSavedView(v.id)" class="btn-xs btn-secondary" style="color: var(--destructive);">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td colspan="5" class="empty-cell">No custom views saved yet. Save a view from the dashboard or comparison tab.</td>
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
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const activeTab = ref('comparison')
const schoolsList = ref([])
const selectedSchoolId = ref('')
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || ''))

// Section Comparison State
const comparisonData = ref(null)
const filterGrade = ref('')
const comparisonPreset = ref('all')
const startDate = ref('')
const endDate = ref('')
const availableGrades = ref([])
const sectionsByGrade = ref({})

// Quarterly State
const quarterlyData = ref(null)
const selectedQuarter = ref(1)
const selectedSchoolYear = ref('2026-2027')

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
const savedViews = ref([])

onMounted(async () => {
  if (auth.isSuperadmin) {
    try { schoolsList.value = await auth.getSchools() } catch {}
  }
  await loadGradeLevels()
  await loadSectionComparison()
})

async function onSchoolChange() {
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

async function loadGradeLevels() {
  const sid = effectiveSchoolId.value
  try {
    const res = await auth.api(`/schools/${sid || auth.schoolId}/grades`)
    const levels = res.levels || []
    availableGrades.value = levels.map(l => l.grade)
    const map = {}
    levels.forEach(l => { map[l.grade] = l.sections || [] })
    sectionsByGrade.value = map
    if (availableGrades.value.length && !validatorGrade.value) {
      validatorGrade.value = availableGrades.value[0]
      validatorSection.value = (sectionsByGrade.value[validatorGrade.value] || [])[0] || ''
    }
  } catch {}
}

function onComparisonPresetChange() {
  const p = comparisonPreset.value
  const now = new Date()
  if (p === 'this_month') {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
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
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    if (filterGrade.value) params.set('grade', filterGrade.value)
    if (startDate.value && endDate.value) {
      params.set('startDate', startDate.value)
      params.set('endDate', endDate.value)
    }
    comparisonData.value = await auth.api(`/reports/section-comparison?${params.toString()}`)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadQuarterlySummary() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    params.set('quarter', selectedQuarter.value)
    params.set('schoolYear', selectedSchoolYear.value)
    quarterlyData.value = await auth.api(`/reports/quarterly-summary?${params.toString()}`)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function inspectTemplateVersion() {
  try {
    templateVersion.value = await auth.api('/export/template/version')
  } catch {}
}

async function runValidationCheck() {
  validating.value = true
  try {
    // Fetch month entries for selected class
    const sid = effectiveSchoolId.value || auth.schoolId
    const res = await auth.api(`/attendance/summaries?schoolId=${sid}&grade=${encodeURIComponent(validatorGrade.value)}&section=${encodeURIComponent(validatorSection.value)}`)
    const entries = res.bySection?.[0]?.students || []
    
    validationResult.value = await auth.api('/export/validate', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: sid,
        grade: validatorGrade.value,
        section: validatorSection.value,
        month: validatorMonth.value,
        year: new Date().getFullYear(),
        entries
      })
    })
  } catch (err) {
    console.error(err)
  } finally {
    validating.value = false
  }
}

async function loadArchives() {
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    archives.value = await auth.api(`/reports/archive?schoolId=${sid}`)
  } catch {}
}

async function downloadArchive(a) {
  window.open(`${auth.apiUrl || '/api'}/reports/archive/${a.id}/download?schoolId=${effectiveSchoolId.value || auth.schoolId}`, '_blank')
}

async function loadSavedViews() {
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    savedViews.value = await auth.api(`/reports/saved-views?schoolId=${sid}`)
  } catch {}
}

async function deleteSavedView(id) {
  if (!confirm('Are you sure you want to remove this saved view?')) return
  try {
    await auth.api(`/reports/saved-views/${id}`, { method: 'DELETE' })
    await loadSavedViews()
  } catch {}
}

function applySavedView(v) {
  if (v.reportType === 'section_comparison') {
    activeTab.value = 'comparison'
    if (v.filters?.grade) filterGrade.value = v.filters.grade
    if (v.filters?.startDate) startDate.value = v.filters.startDate
    if (v.filters?.endDate) endDate.value = v.filters.endDate
    loadSectionComparison()
  } else if (v.reportType === 'quarterly_summary') {
    activeTab.value = 'quarterly'
    if (v.filters?.quarter) selectedQuarter.value = v.filters.quarter
    loadQuarterlySummary()
  }
}

function downloadCsv(type) {
  const sid = effectiveSchoolId.value || auth.schoolId
  const url = `${auth.apiUrl || '/api'}/reports/export/csv?type=${type}&schoolId=${sid}&quarter=${selectedQuarter.value}&grade=${encodeURIComponent(filterGrade.value)}`
  window.open(url, '_blank')
}

async function archiveCurrentReport(type) {
  const title = prompt('Enter a title to archive this report:', `${type === 'quarterly_summary' ? 'Quarter ' + selectedQuarter.value : 'Section Comparison'} — ${new Date().toLocaleDateString()}`)
  if (!title) return
  try {
    const sid = effectiveSchoolId.value || auth.schoolId
    await auth.api('/reports/archive', {
      method: 'POST',
      body: JSON.stringify({
        schoolId: sid,
        reportType: type,
        title,
        parameters: { quarter: selectedQuarter.value, grade: filterGrade.value },
        fileFormat: 'csv',
        contentData: 'Report: ' + title
      })
    })
    alert('Report archived successfully')
  } catch (err) {
    alert(err.message)
  }
}
</script>

<style scoped>
.reports-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reports-tabs-bar {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  overflow-x: auto;
}

.report-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted-foreground);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.report-tab-btn:hover {
  color: var(--foreground);
  background: var(--muted);
}

.report-tab-btn.active {
  color: var(--primary);
  background: var(--card);
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
}

.filter-action-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 14px 18px;
  margin-bottom: 20px;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
}

.filter-group select, .text-input, .date-input {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--foreground);
  font-size: 0.85rem;
}

.filter-group-range {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--muted-foreground);
  margin-top: 18px;
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

.rank-1 { background: var(--primary-bg); color: var(--primary); font-weight: 800; }
.rank-2 { background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); }
.rank-3 { background: color-mix(in srgb, var(--primary) 6%, transparent); color: var(--primary); }

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

.quarterly-stats-banner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 20px;
  background: var(--muted);
  border-radius: var(--radius-sm);
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

.text-teal { color: var(--primary); }
.text-amber { color: var(--warning); }
.text-danger { color: var(--destructive); }
</style>
