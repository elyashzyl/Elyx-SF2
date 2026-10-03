<template>
  <div class="attendance-page">
    <div v-if="!record" class="select-screen">
      <div class="dashboard-header">
        <div class="dashboard-header-left">
          <h1>Attendance Record</h1>
          <p>View daily attendance records by class and date.</p>
        </div>
        <div class="dashboard-header-actions">
          <div class="dashboard-date-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Daily Attendance</span>
          </div>
        </div>
      </div>

      <div class="form-card">
        <div v-if="auth.isSuperadmin" class="form-row" style="margin-bottom: 14px;">
          <div class="form-group" style="flex: 1;">
            <label>School *</label>
            <select v-model="selectedSchoolId" @change="onSchoolChange" required>
              <option value="" disabled>Select a school...</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">
                {{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}
              </option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input v-model="form.date" type="date" required />
          </div>
          <div class="form-group">
            <label>Grade</label>
            <select v-model="form.grade" @change="onGradeChange" required :disabled="auth.isTeacher && !!auth.user?.grade">
              <option value="" disabled v-if="!grades.length">{{ auth.isSuperadmin && !selectedSchoolId ? 'Select a school first' : 'No grade levels defined' }}</option>
              <option v-for="g in grades" :key="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Section</label>
            <select v-model="form.section" required :disabled="auth.isTeacher && !!auth.user?.section">
              <option value="" disabled>Select section</option>
              <option v-for="s in availableSections" :key="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Adviser</label>
            <input v-model="form.adviser" placeholder="Teacher name" :readonly="auth.isTeacher && !!auth.user?.name" />
          </div>
        </div>
        <button @click="openRecord" class="btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Loading...' : 'Open Attendance Sheet' }}
        </button>
        <p v-if="loadError" class="error-msg">{{ loadError }}</p>
      </div>

      <div v-if="savedRecords.length" class="table-card" style="margin-top: 18px;">
        <div class="table-toolbar">
          <div class="table-toolbar-left">
            <span class="show-wrap">Show
              <select v-model="recordsPageSize" @change="recordsPage = 1" class="show-select">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="25">25</option>
              </select>
            </span>
            <strong style="font-size: .9rem;">Recent Records</strong>
          </div>
          <div class="table-toolbar-right">
            <span class="tbl-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input v-model="recordsSearch" @input="recordsPage = 1" type="text" placeholder="Search records" />
            </span>
          </div>
        </div>
        <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th class="cell-id">ID</th>
              <th>Record</th>
              <th>Grade</th>
              <th>Issued Date</th>
              <th>Adviser</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in pagedRecords" :key="r.id">
              <td class="cell-id">#{{ (recordsPage - 1) * recordsPageSize + i + 1 }}</td>
              <td>
                <div class="cell-person">
                  <span class="status-dot status-dot--green">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                  </span>
                  <div style="min-width: 0;">
                    <div class="cell-main">{{ r.section }}</div>
                    <div class="cell-sub">{{ r.created_by_name || '—' }}<span v-if="r.locked && !r.reopened_at"> · Locked</span><span v-else-if="r.reopened_at"> · Reopened</span></div>
                  </div>
                </div>
              </td>
              <td>{{ r.grade }}</td>
              <td>{{ r.date }}</td>
              <td>{{ r.adviser }}</td>
              <td style="text-align: right;">
                <div class="row-actions">
                  <button @click="loadRecord(r)" class="icon-btn" title="Open">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button @click="openEditRecord(r)" class="icon-btn" title="Edit" :disabled="r.locked && !r.reopened_at">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button @click="deleteSavedRecord(r)" class="icon-btn icon-btn--danger" title="Delete" :disabled="r.locked && !r.reopened_at">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="table-footer">
          <span class="table-count">Showing {{ recordsShowingFrom }} to {{ recordsShowingTo }} of {{ filteredRecords.length }} entries</span>
          <div class="pager">
            <button class="pager-btn" @click="recordsPage > 1 && recordsPage--" :disabled="recordsPage === 1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Previous
            </button>
            <button class="pager-num active">{{ recordsPage }}</button>
            <button class="pager-btn" @click="recordsPage < recordsTotalPages && recordsPage++" :disabled="recordsPage === recordsTotalPages">
              Next
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="page-header screen-only">
        <h1>Daily Attendance Record</h1>
        <p>{{ record.grade }} - {{ record.section }} &middot; {{ record.date }} &middot; Adviser: {{ record.adviser }}</p>
      </div>
      <div class="sheet-container">
      <div class="sheet-header">
        <div class="school-info">
          <h1>{{ school.school_name }}</h1>
          <p>School ID: {{ school.school_id }}</p>
          <p v-if="school.school_address">{{ school.school_address }}</p>
        </div>
      </div>

      <div v-if="auth.isTeacher && !canEdit" class="readonly-banner">
        This record belongs to another advisory class ({{ record.grade }} — {{ record.section }}). Only its official adviser or a school administrator can record or edit daily entries.
      </div>
      <div v-if="record.locked && !record.reopened_at" class="readonly-banner">
        This attendance record is locked{{ record.locked_at ? ` since ${record.locked_at}` : '' }}.
        <button v-if="auth.isAdmin" @click="openReopenModal" class="btn-sm">Reopen Record</button>
      </div>
      <div v-else-if="record.reopened_at" class="readonly-banner">
        Reopened for correction: {{ record.reopen_reason }}
      </div>
      <div v-if="auth.isAdmin && !isOwner && !record.locked" class="readonly-banner">
        Recorded by {{ record.created_by_name || 'Unknown' }}
        <button @click="handleUnlock" class="btn-sm">Take Ownership</button>
      </div>

      <!-- Offline Status & Sync Queue Banner -->
      <div v-if="!isOnline || pendingSyncCount > 0" class="offline-sync-banner" :class="{ 'banner--offline': !isOnline, 'banner--pending': isOnline && pendingSyncCount > 0 }">
        <div class="offline-banner-content">
          <span class="offline-banner-icon">
            <svg v-if="!isOnline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>
            </svg>
          </span>
          <span v-if="!isOnline">
            <strong>Offline Mode:</strong> Internet connection unavailable. Roll call entries are saved locally and will auto-sync when online.
            <span v-if="pendingSyncCount > 0"> ({{ pendingSyncCount }} pending)</span>
          </span>
          <span v-else>
            <strong>Offline Queue Ready:</strong> {{ pendingSyncCount }} queued roll call change{{ pendingSyncCount > 1 ? 's' : '' }} ready to synchronize.
          </span>
        </div>
        <button
          v-if="isOnline && pendingSyncCount > 0"
          type="button"
          class="btn-sync-offline"
          :disabled="isSyncing"
          @click="handleManualSync"
        >
          <span v-if="isSyncing">Syncing…</span>
          <span v-else>Sync Queue ({{ pendingSyncCount }})</span>
        </button>
      </div>

      <!-- Quick Actions & Live Telemetry Strip -->
      <div class="daily-telemetry-bar">
        <div class="telemetry-stats">
          <div class="telemetry-chip">
            <span class="telemetry-label">Enrolled:</span>
            <strong>{{ totalLearnersCount }}</strong>
          </div>
          <div class="telemetry-chip telemetry-chip--success">
            <span class="telemetry-label">Present:</span>
            <strong>{{ livePresentCount }}</strong>
          </div>
          <div class="telemetry-chip telemetry-chip--warning">
            <span class="telemetry-label">Tardy:</span>
            <strong>{{ liveTardyCount }}</strong>
          </div>
          <div class="telemetry-chip telemetry-chip--danger">
            <span class="telemetry-label">Absent:</span>
            <strong>{{ liveAbsentCount }}</strong>
          </div>
        </div>

        <div class="telemetry-actions">
          <button v-if="canEdit" @click="quickMarkAllPresent" class="btn-sm btn-outline-teal" :disabled="bulkUpdating" title="Mark all enrolled learners as Present (E) for all AM and PM periods">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{{ bulkUpdating ? 'Updating…' : 'Mark All Present (E)' }}</span>
          </button>
          <button @click="openSummaryModal" class="btn-sm btn-outline-teal" title="View multi-dimensional attendance summaries and breakdowns">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Attendance Summary</span>
          </button>
        </div>
      </div>

      <div class="sheet-date">{{ record.date }}</div>
      <h2 class="sheet-title">DAILY ATTENDANCE RECORD</h2>
      <div class="sheet-info">
        <span class="sheet-info-left">Grade: {{ gradeNum(record.grade) }}</span>
        <span class="sheet-info-center">Section: {{ record.section }}</span>
        <span class="sheet-info-right">Adviser: {{ record.adviser }}</span>
      </div>
      <div class="table-wrapper">
        <table class="attendance-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2">NAMES</th>
              <th :colspan="visibleAmPeriods.length">AM</th>
              <th :colspan="visiblePmPeriods.length">PM</th>
              <th rowspan="2">Reason for Absence / Tardiness</th>
              <th rowspan="2">Excused</th>
              <th rowspan="2">Unexcused</th>
            </tr>
            <tr>
              <th v-for="pk in visibleAmPeriods" :key="pk">{{ pk.replace('am', '') }}</th>
              <th v-for="pk in visiblePmPeriods" :key="pk">{{ pk.replace('pm', '') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!record.entries || record.entries.length === 0">
              <td :colspan="colspan" class="empty">No students found. Add students in Student Management first.</td>
            </tr>
            <template v-else>
              <template v-for="(item, idx) in sortedEntries" :key="item.isSep ? 'sep-' + idx : item.studentId">
                <tr v-if="item.isSep" class="gender-sep-row"><td :colspan="colspan">{{ item.label }}</td></tr>
                <tr v-else :class="{ 'selected-row': selectedStudent?.studentId === item.studentId }">
                  <td>{{ item._num }}</td>
                  <td class="name-cell clickable" @click="selectStudent(item)">{{ item.name }}</td>
                  <td v-for="pk in visibleAmPeriods" :key="pk" class="period-cell">
                    <select :value="item.periods[pk] || ''" @change="updatePeriodCell(item, pk, $event.target.value)" class="period-select" :disabled="!canEdit">
                      <option value=""></option>
                      <option value="E">E</option>
                      <option value="T">T</option>
                      <option value="A">A</option>
                      <option value="E/T">E/T</option>
                      <option value="A/S">A/S</option>
                      <option value="NIPS">NIPS</option>
                      <option value="NIPU:White w/ print">NIPU:W/P</option>
                      <option value="NIPU:Polo w/o logo">NIPU:POL</option>
                      <option value="NIPU:No logo">NIPU:NOL</option>
                      <option value="NIPU:Make up (girls)">NIPU:MAK</option>
                      <option value="NIPHC">NIPHC</option>
                    </select>
                  </td>
                  <td v-for="pk in visiblePmPeriods" :key="pk" class="period-cell">
                    <select :value="item.periods[pk] || ''" @change="updatePeriodCell(item, pk, $event.target.value)" class="period-select" :disabled="!canEdit">
                      <option value=""></option>
                      <option value="E">E</option>
                      <option value="T">T</option>
                      <option value="A">A</option>
                      <option value="E/T">E/T</option>
                      <option value="A/S">A/S</option>
                      <option value="NIPS">NIPS</option>
                      <option value="NIPU:White w/ print">NIPU:W/P</option>
                      <option value="NIPU:Polo w/o logo">NIPU:POL</option>
                      <option value="NIPU:No logo">NIPU:NOL</option>
                      <option value="NIPU:Make up (girls)">NIPU:MAK</option>
                      <option value="NIPHC">NIPHC</option>
                    </select>
                  </td>
                  <td><input v-model="item.reason" @change="saveEntry(item)" class="reason-input" :disabled="!canEdit" /></td>
                  <td class="check-cell"><input type="checkbox" v-model="item.excused" @change="saveEntry(item)" :disabled="!canEdit" /></td>
                  <td class="check-cell"><input type="checkbox" v-model="item.unexcused" @change="saveEntry(item)" :disabled="!canEdit" /></td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <div class="legends">
        <h3>LEGENDS:</h3>
        <div class="legend-grid">
          <span><strong>E</strong> - Entered</span>
          <span><strong>T</strong> - Tardy</span>
          <span><strong>A</strong> - Absent</span>
          <span><strong>NIPS</strong> - Not in Proper Socks</span>
          <span><strong>NIPU</strong> - Not in Proper Uniform</span>
          <span><strong>E/T</strong> - Entered but Tardy</span>
          <span><strong>A/S</strong> - Suspended</span>
          <span><strong>NIPHC</strong> - Not in Proper Hair Cut</span>
        </div>
        <div class="nipu-subtypes">
          <p><strong>NIPU Subtypes:</strong></p>
          <p>White w/ print | Polo w/o logo | No logo | Make up (girls)</p>
        </div>
      </div>
      <div v-if="correctionHistory.length" class="correction-history">
        <h3>Correction History</h3>
        <p v-for="item in correctionHistory" :key="item.id">
          {{ item.created_at }} · {{ item.actor_name || item.actor_id }} changed {{ item.field }} from “{{ item.old_value }}” to “{{ item.new_value }}”
        </p>
      </div>
      <div v-if="record.created_by_name" class="created-by">Created by: {{ record.created_by_name }}</div>

      <!-- Teacher Notes & Exceptional Cases -->
      <div class="teacher-notes-card">
        <div class="teacher-notes-header">
          <div class="teacher-notes-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
            <strong>Teacher Notes &amp; Exceptional Cases</strong>
          </div>
          <span v-if="notesSavedStatus" class="notes-status-badge">{{ notesSavedStatus }}</span>
        </div>
        <p class="teacher-notes-desc">
          Document class-wide notices, weather suspensions, school activities, or individual student attendance explanations for this roll call.
        </p>
        <textarea
          v-model="record.teacher_notes"
          class="teacher-notes-textarea"
          rows="3"
          :disabled="!canEdit"
          placeholder="e.g., Heavy rain advisory in PM; 3 learners excused for regional science fair; class dismissed at 2:00 PM."
          @blur="handleSaveTeacherNotes"
        ></textarea>
        <div class="teacher-notes-footer">
          <small class="text-muted">Auto-saves on blur or click Save Notes.</small>
          <button
            type="button"
            class="btn-save-notes"
            :disabled="savingNotes || !canEdit"
            @click="handleSaveTeacherNotes"
          >
            <span v-if="savingNotes">Saving…</span>
            <span v-else>Save Notes</span>
          </button>
        </div>
      </div>

      <div class="sheet-actions">
        <button @click="printSheet" class="btn-primary">Print</button>
        <button @click="goBack" class="btn-secondary">Back</button>
      </div>
    </div>
    </div>

    <!-- Multi-Dimensional Attendance Summaries Modal -->
    <div v-if="showSummaryModal" class="modal-overlay" @click.self="showSummaryModal = false">
      <div class="form-card schedule-form" style="max-width: 760px;">
        <div class="modal-header-compact">
          <h3>Attendance Analytics &amp; Summaries</h3>
          <p class="modal-subtext">Multi-dimensional roll call metrics filtered by date range, gender, and student enrollment status.</p>
        </div>

        <!-- Filter Controls -->
        <div class="summary-filters-bar">
          <div class="filter-col">
            <label>Start Date</label>
            <input type="date" v-model="summaryFilters.startDate" @change="loadAttendanceSummaries" />
          </div>
          <div class="filter-col">
            <label>End Date</label>
            <input type="date" v-model="summaryFilters.endDate" @change="loadAttendanceSummaries" />
          </div>
          <div class="filter-col">
            <label>Gender</label>
            <select v-model="summaryFilters.gender" @change="loadAttendanceSummaries">
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div class="filter-col">
            <label>Status</label>
            <select v-model="summaryFilters.status" @change="loadAttendanceSummaries">
              <option value="all">All Learners</option>
              <option value="active">Active Only</option>
              <option value="withdrawn">Withdrawn Only</option>
            </select>
          </div>
        </div>

        <div v-if="summaryLoading" class="empty">Calculating attendance analytics…</div>
        <div v-else-if="summaryData">
          <!-- Overview Cards -->
          <div class="summary-kpi-grid">
            <div class="summary-kpi-card">
              <span>Overall Rate</span>
              <strong :style="{ color: summaryData.summary.attendanceRate >= 95 ? 'var(--success)' : 'var(--warning)' }">
                {{ summaryData.summary.attendanceRate }}%
              </strong>
              <small>{{ summaryData.summary.present }} of {{ summaryData.summary.present + summaryData.summary.absent }} days attended</small>
            </div>
            <div class="summary-kpi-card">
              <span>Sessions</span>
              <strong>{{ summaryData.summary.totalSessions }}</strong>
              <small>{{ summaryData.summary.studentsCount }} unique learners</small>
            </div>
            <div class="summary-kpi-card">
              <span>Absences</span>
              <strong style="color: var(--destructive);">{{ summaryData.summary.absent }}</strong>
              <small>{{ summaryData.summary.tardy }} tardy records</small>
            </div>
          </div>

          <!-- Gender Breakdown -->
          <div class="summary-breakdown-card">
            <h4>Gender Attendance Comparison</h4>
            <div class="gender-split-row">
              <div class="gender-split-col">
                <div class="gender-split-head">
                  <span>Male Learners ({{ summaryData.byGender.male.count }})</span>
                  <strong>{{ summaryData.byGender.male.rate }}%</strong>
                </div>
                <div class="ratio-track"><div class="ratio-bar bar--male" :style="{ width: `${summaryData.byGender.male.rate}%` }"></div></div>
                <small>{{ summaryData.byGender.male.present }} present · {{ summaryData.byGender.male.absent }} absent</small>
              </div>
              <div class="gender-split-col">
                <div class="gender-split-head">
                  <span>Female Learners ({{ summaryData.byGender.female.count }})</span>
                  <strong>{{ summaryData.byGender.female.rate }}%</strong>
                </div>
                <div class="ratio-track"><div class="ratio-bar bar--female" :style="{ width: `${summaryData.byGender.female.rate}%` }"></div></div>
                <small>{{ summaryData.byGender.female.present }} present · {{ summaryData.byGender.female.absent }} absent</small>
              </div>
            </div>
          </div>

          <!-- Section Breakdown (if multiple) -->
          <div v-if="summaryData.bySection.length > 1" class="summary-breakdown-card">
            <h4>Section Comparison</h4>
            <div class="preview-table-wrap">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Adviser</th>
                    <th>Learners</th>
                    <th>Sessions</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="sec in summaryData.bySection" :key="`${sec.grade}-${sec.section}`">
                    <td><strong>{{ sec.grade }} — {{ sec.section }}</strong></td>
                    <td>{{ sec.adviser || '—' }}</td>
                    <td>{{ sec.learnersCount }}</td>
                    <td>{{ sec.sessionsCount }}</td>
                    <td><strong>{{ sec.rate }}%</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Daily Trends -->
          <div v-if="summaryData.dailyTrends.length" class="summary-breakdown-card">
            <h4>Daily Attendance Timeline</h4>
            <div class="preview-table-wrap" style="max-height: 180px;">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in summaryData.dailyTrends" :key="d.date">
                    <td>{{ d.date }}</td>
                    <td>{{ d.present }}</td>
                    <td>{{ d.absent }}</td>
                    <td><strong>{{ d.rate }}%</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="form-actions" style="margin-top: 16px;">
          <button type="button" @click="showSummaryModal = false" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <div v-if="showReopenModal" class="modal-overlay" @click.self="closeReopenModal">
      <div class="form-card schedule-form">
        <h3>Reopen Attendance Record</h3>
        <p class="modal-help">Provide a reason before making a correction. This action is recorded in the audit history.</p>
        <form @submit.prevent="handleReopen">
          <div class="form-group">
            <label for="reopen-reason">Reason</label>
            <textarea id="reopen-reason" v-model="reopenReason" rows="4" required maxlength="1000" placeholder="Explain why this record needs correction"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="reopening || !reopenReason.trim()">{{ reopening ? 'Reopening...' : 'Reopen Record' }}</button>
            <button type="button" @click="closeReopenModal" class="btn-secondary" :disabled="reopening">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditRecord" class="modal-overlay" @click.self="closeEditRecord">
      <div class="form-card schedule-form">
        <h3>Edit Record Details</h3>
        <form @submit.prevent="handleSaveRecord">
          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input v-model="editRecordForm.date" type="date" required />
            </div>
            <div class="form-group">
              <label>Grade</label>
              <select v-model="editRecordForm.grade" required>
                <option v-for="g in grades" :key="g">{{ g }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Section</label>
              <select v-model="editRecordForm.section" required>
                <option v-for="s in sectionsByGrade[editRecordForm.grade] || []" :key="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Adviser</label>
              <input v-model="editRecordForm.adviser" required />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="savingRecord">{{ savingRecord ? 'Saving...' : 'Save' }}</button>
            <button type="button" @click="closeEditRecord" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAttendanceStore } from '../stores/attendance'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'
import { actorQs, actorBody } from '../composables/useActor'
import { useGradeLevels } from '../composables/useGradeLevels'
import { useActiveSchool } from '../composables/useActiveSchool'
import { loadPageState, savePageState } from '../composables/usePageState'
import { useOfflineAttendance } from '../composables/useOfflineAttendance'

const route = useRoute()
const store = useAttendanceStore()
const auth = useAuthStore()
const { notify } = useNotifications()
const { activeSchool, setActiveSchool } = useActiveSchool()
const { isOnline, isSyncing, pendingSyncCount, syncQueue } = useOfflineAttendance()

async function handleManualSync() {
  const result = await syncQueue()
  if (result.syncedCount > 0) {
    notify(`Successfully synchronized ${result.syncedCount} offline record${result.syncedCount > 1 ? 's' : ''}!`, 'success')
  }
}
const school = reactive({ school_name: '', school_id: '', school_address: '', school_short: '' })
const schools = ref([])
const loading = ref(false)
const { grades, sectionsByGrade, loadGradeLevels } = useGradeLevels()
const savedState = loadPageState(auth.user)
const selectedSchoolId = ref(activeSchool.value?.id || savedState?.school || '')
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || ''))
const availableSections = computed(() => sectionsByGrade.value[form.grade] || [])
const amPeriods = ['am1', 'am2', 'am3', 'am4', 'am5', 'am6']
const pmPeriods = ['pm1', 'pm2', 'pm3', 'pm4']

const visibleAmPeriods = computed(() => amPeriods)
const visiblePmPeriods = computed(() => pmPeriods)

// Teachers edit records of their advisory class; admins edit anything.
const canEdit = computed(() => {
  if (!record.value || (record.value.locked && !record.value.reopened_at)) return false
  if (auth.isAdmin) return true
  if (!auth.isTeacher) return false
  if (!auth.user?.grade || !auth.user?.section) return true
  return record.value.grade === auth.user.grade && record.value.section === auth.user.section
})
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const showSummaryModal = ref(false)
const summaryLoading = ref(false)
const summaryData = ref(null)
const summaryFilters = reactive({
  startDate: '',
  endDate: '',
  gender: '',
  status: 'all'
})

async function openSummaryModal() {
  if (record.value) {
    const parts = record.value.date.split('-')
    summaryFilters.startDate = `${parts[0]}-${parts[1]}-01`
    summaryFilters.endDate = record.value.date
  } else {
    const cur = new Date()
    summaryFilters.startDate = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-01`
    summaryFilters.endDate = cur.toISOString().split('T')[0]
  }
  showSummaryModal.value = true
  await loadAttendanceSummaries()
}

async function loadAttendanceSummaries() {
  summaryLoading.value = true
  try {
    const filters = {
      startDate: summaryFilters.startDate,
      endDate: summaryFilters.endDate,
      gender: summaryFilters.gender,
      status: summaryFilters.status,
      grade: record.value?.grade || form.grade || undefined,
      section: record.value?.section || form.section || undefined
    }
    const res = await store.fetchAttendanceSummaries(filters, effectiveSchoolId.value)
    summaryData.value = res
  } catch (err) {
    notify(err.message || 'Failed to load attendance summaries', 'error')
  } finally {
    summaryLoading.value = false
  }
}

function gradeNum(g) {
  return (g || '').replace('Grade ', '')
}

const now = new Date().toISOString().split('T')[0]
const form = reactive({
  date: route.query.date || savedState?.date || now,
  grade: route.query.grade || savedState?.grade || (auth.isTeacher && auth.user?.grade ? auth.user.grade : ''),
  section: route.query.section || savedState?.section || (auth.isTeacher && auth.user?.section ? auth.user.section : ''),
  adviser: savedState?.adviser || (auth.isTeacher && auth.user?.name ? auth.user.name : '')
})

function onGradeChange() {
  form.section = ''
}

async function onSchoolChange() {
  loadError.value = ''
  record.value = null
  selectedStudent.value = null
  form.grade = ''
  form.section = ''
  const chosen = schools.value.find(s => s.id === selectedSchoolId.value)
  if (chosen) {
    school.school_name = chosen.name || chosen.school_name || ''
    school.school_id = chosen.school_id || ''
    school.school_address = chosen.address || chosen.school_address || ''
    school.school_short = chosen.short || chosen.school_short || ''
    setActiveSchool(chosen)
  }
  await loadGradeLevels(selectedSchoolId.value || undefined)
  applyGradeDefaults()
  const all = await store.getAllRecords(selectedSchoolId.value || undefined)
  savedRecords.value = all.slice(-20).reverse()
}

function applyGradeDefaults() {
  if (route.query.grade) {
    form.grade = route.query.grade
    if (route.query.section) form.section = route.query.section
    if (route.query.date) form.date = route.query.date
    if (auth.user?.name && !form.adviser) form.adviser = auth.user.name
    return
  }
  if (auth.isTeacher && auth.user?.grade) {
    form.grade = auth.user.grade
    if (auth.user?.section) form.section = auth.user.section
    if (auth.user?.name) form.adviser = auth.user.name
  } else if (!form.grade && grades.value.length) {
    form.grade = grades.value[0]
  }
}

watch(
  () => [selectedSchoolId.value, form.date, form.grade, form.section, form.adviser],
  () => {
    if (auth.user) {
      savePageState(auth.user, {
        school: selectedSchoolId.value,
        date: form.date,
        grade: form.grade,
        section: form.section,
        adviser: form.adviser
      })
    }
  }
)

const record = ref(null)
const loadError = ref('')
const savedRecords = ref([])
const recordsSearch = ref('')
const recordsPage = ref(1)
const recordsPageSize = ref(5)

const displayRecords = computed(() => {
  if (auth.isTeacher && auth.user?.grade && auth.user?.section) {
    return savedRecords.value.filter(r => r.grade === auth.user.grade && r.section === auth.user.section)
  }
  return savedRecords.value
})

const filteredRecords = computed(() => {
  const q = recordsSearch.value.trim().toLowerCase()
  if (!q) return displayRecords.value
  return displayRecords.value.filter(r => [r.date, r.grade, r.section, r.adviser, r.created_by_name].filter(Boolean).join(' ').toLowerCase().includes(q))
})
const recordsTotalPages = computed(() => Math.max(1, Math.ceil(filteredRecords.value.length / recordsPageSize.value)))
const pagedRecords = computed(() => {
  const start = (recordsPage.value - 1) * recordsPageSize.value
  return filteredRecords.value.slice(start, start + recordsPageSize.value)
})
const recordsShowingFrom = computed(() => (filteredRecords.value.length ? (recordsPage.value - 1) * recordsPageSize.value + 1 : 0))
const recordsShowingTo = computed(() => Math.min(filteredRecords.value.length, recordsPage.value * recordsPageSize.value))
const isOwner = ref(true)
const selectedStudent = ref(null)
const correctionHistory = ref([])
const showReopenModal = ref(false)
const reopenReason = ref('')
const reopening = ref(false)
const studentGenderMap = ref({})
const showEditRecord = ref(false)
const savingRecord = ref(false)
const editRecordForm = reactive({ id: '', date: '', grade: '', section: '', adviser: '' })

const totalLearnersCount = computed(() => record.value?.entries?.length || 0)

const livePresentCount = computed(() => {
  if (!record.value?.entries) return 0
  return record.value.entries.filter(e => {
    const vals = Object.values(e.periods || {}).filter(Boolean)
    return vals.some(v => v === 'E' || v === 'E/T' || v === 'T') && !vals.includes('A') && !vals.includes('A/S') && !e.excused && !e.unexcused
  }).length
})

const liveTardyCount = computed(() => {
  if (!record.value?.entries) return 0
  return record.value.entries.filter(e => {
    const vals = Object.values(e.periods || {}).filter(Boolean)
    return vals.includes('T') || vals.includes('E/T')
  }).length
})

const liveAbsentCount = computed(() => {
  if (!record.value?.entries) return 0
  return record.value.entries.filter(e => {
    const vals = Object.values(e.periods || {}).filter(Boolean)
    return vals.includes('A') || vals.includes('A/S') || e.excused || e.unexcused
  }).length
})

const bulkUpdating = ref(false)
async function quickMarkAllPresent() {
  if (!record.value?.entries?.length || !canEdit.value) return
  if (!confirm('Mark all learners as Present (E) for all morning and afternoon periods? You can then adjust specific tardy or absent learners.')) return
  bulkUpdating.value = true
  try {
    const allPeriods = [...visibleAmPeriods.value, ...visiblePmPeriods.value]
    for (const entry of record.value.entries) {
      for (const pk of allPeriods) {
        if (!entry.periods[pk]) {
          entry.periods[pk] = 'E'
          await store.updateEntry(record.value.id, entry.studentId, `periods.${pk}`, 'E', auth.user?.id, auth.user?.role, effectiveSchoolId.value)
        }
      }
    }
    notify('All learners marked Present (E)', 'success')
  } catch (err) {
    notify('Failed to update entries: ' + err.message, 'error')
  } finally {
    bulkUpdating.value = false
  }
}



function openEditRecord(r) {
  editRecordForm.id = r.id
  editRecordForm.date = r.date
  editRecordForm.grade = r.grade
  editRecordForm.section = r.section
  editRecordForm.adviser = r.adviser
  showEditRecord.value = true
}

function closeEditRecord() {
  showEditRecord.value = false
}

async function handleSaveRecord() {
  savingRecord.value = true
  try {
    const res = await fetch('/api/attendance/' + editRecordForm.id + '?' + actorQs(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: actorBody({
        date: editRecordForm.date,
        grade: editRecordForm.grade,
        section: editRecordForm.section,
        adviser: editRecordForm.adviser,
        schoolId: effectiveSchoolId.value
      })
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Failed to save')
    notify('Record updated', 'success')
    closeEditRecord()
    const all = await store.getAllRecords(effectiveSchoolId.value || undefined)
    savedRecords.value = all.slice(-10).reverse()
  } catch (error) {
    notify(error.message || 'Failed to update record', 'error')
  } finally {
    savingRecord.value = false
  }
}

const colspan = computed(() => 4 + visibleAmPeriods.value.length + visiblePmPeriods.value.length)

const sortedEntries = computed(() => {
  if (!record.value?.entries) return []
  const withGender = record.value.entries.map(e => ({
    ...e,
    gender: studentGenderMap.value[e.studentId] || ''
  }))
  const boys = withGender.filter(e => e.gender === 'Male')
  const girls = withGender.filter(e => e.gender === 'Female')
  const unknown = withGender.filter(e => e.gender !== 'Male' && e.gender !== 'Female')
  let num = 0
  const flat = []
  if (boys.length) {
    flat.push({ isSep: true, label: 'BOYS' })
    for (const b of boys) { b._num = ++num; flat.push(b) }
  }
  if (girls.length) {
    flat.push({ isSep: true, label: 'GIRLS' })
    for (const g of girls) { g._num = ++num; flat.push(g) }
  }
  if (unknown.length) {
    flat.push({ isSep: true, label: 'OTHER' })
    for (const u of unknown) { u._num = ++num; flat.push(u) }
  }
  return flat
})

async function loadStudentGenderMap() {
  if (!record.value) return
  try {
    const students = await store.getStudents({ grade: record.value.grade, section: record.value.section }, effectiveSchoolId.value)
    const map = {}
    for (const s of students) map[s.id] = s.gender || ''
    studentGenderMap.value = map
  } catch {}
}



onMounted(async () => {
  if (auth.isSuperadmin) {
    try {
      schools.value = await auth.getSchools()
    } catch {}
    if (route.query.schoolId) {
      selectedSchoolId.value = String(route.query.schoolId)
    } else if (!selectedSchoolId.value && activeSchool.value?.id) {
      selectedSchoolId.value = activeSchool.value.id
    } else if (!selectedSchoolId.value && savedState?.school) {
      selectedSchoolId.value = savedState.school
    }
  }

  if (auth.isSuperadmin && selectedSchoolId.value) {
    const chosen = schools.value.find(s => s.id === selectedSchoolId.value)
    if (chosen) {
      school.school_name = chosen.name || chosen.school_name || ''
      school.school_id = chosen.school_id || ''
      school.school_address = chosen.address || chosen.school_address || ''
      school.school_short = chosen.short || chosen.school_short || ''
    }
  } else if (!auth.isSuperadmin) {
    try {
      const data = await auth.getSchoolInfo()
      if (data) Object.assign(school, data)
      else if (auth.user?.school) {
        school.school_name = auth.user.school.name || auth.user.school.school_name || ''
        school.school_id = auth.user.school.school_id || ''
        school.school_short = auth.user.school.short || auth.user.school.school_short || ''
        school.school_address = auth.user.school.address || auth.user.school.school_address || ''
      }
    } catch {}
  }

  await loadGradeLevels(effectiveSchoolId.value || undefined)
  applyGradeDefaults()

  const all = await store.getAllRecords(effectiveSchoolId.value || undefined)
  savedRecords.value = all.slice(-20).reverse()

  if (route.query.autoOpen === '1' || (route.query.grade && route.query.section)) {
    if (form.grade && form.section && form.date) {
      await openRecord()
    }
  }
})

async function openRecord() {
  if (auth.isSuperadmin && !selectedSchoolId.value) {
    loadError.value = 'Please select a school first'
    return
  }
  if (!form.date || !form.grade || !form.section) {
    loadError.value = 'Please fill in all fields'
    return
  }
  loadError.value = ''
  loading.value = true
  record.value = await store.getOrCreateRecord(
    form.date,
    form.grade,
    form.section,
    form.adviser || 'TBA',
    auth.user,
    effectiveSchoolId.value
  )
  loading.value = false
  if (!record.value) {
    loadError.value = 'Failed to load or create attendance record'
    return
  }
  updateCanEdit()
  await loadStudentGenderMap()
  await loadCorrectionHistory()
}

async function loadRecord(r) {
  if (auth.isSuperadmin && r.school_id && selectedSchoolId.value !== r.school_id) {
    selectedSchoolId.value = r.school_id
    const chosen = schools.value.find(s => s.id === r.school_id)
    if (chosen) {
      school.school_name = chosen.name || chosen.school_name || ''
      school.school_id = chosen.school_id || ''
      school.school_address = chosen.address || chosen.school_address || ''
      school.school_short = chosen.short || chosen.school_short || ''
      setActiveSchool(chosen)
    }
    await loadGradeLevels(r.school_id)
  }
  form.date = r.date
  form.grade = r.grade
  form.section = r.section
  form.adviser = r.adviser
  loading.value = true
  record.value = await store.getOrCreateRecord(
    r.date,
    r.grade,
    r.section,
    r.adviser,
    auth.user,
    r.school_id || effectiveSchoolId.value
  )
  loading.value = false
  updateCanEdit()
  await loadStudentGenderMap()
  await loadCorrectionHistory()
}

async function loadCorrectionHistory() {
  if (!record.value?.id) return
  try {
    correctionHistory.value = await store.getCorrections(record.value.id)
  } catch {
    correctionHistory.value = []
  }
}

function updateCanEdit() {
  if (!record.value) return
  isOwner.value = !record.value.created_by ||
    String(record.value.created_by) === String(auth.user?.id)
}

async function handleUnlock() {
  if (!record.value?.id) return
  try {
    const response = await fetch(`/api/attendance/${record.value.id}/unlock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: actorBody({ schoolId: effectiveSchoolId.value })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Failed to transfer ownership')
    record.value.created_by = auth.user?.id
    record.value.created_by_name = auth.user?.name
    isOwner.value = true
    notify('Ownership transferred to you', 'success')
  } catch (e) {
    notify(e.message, 'error')
  }
}

function openReopenModal() {
  reopenReason.value = ''
  showReopenModal.value = true
}

function closeReopenModal() {
  if (reopening.value) return
  showReopenModal.value = false
  reopenReason.value = ''
}

async function handleReopen() {
  if (!record.value?.id || !reopenReason.value.trim()) return
  reopening.value = true
  try {
    const reason = reopenReason.value.trim()
    const result = await store.reopenRecord(record.value.id, reason, effectiveSchoolId.value)
    Object.assign(record.value, result.record || {}, { reopened_at: result.record?.reopened_at, reopen_reason: reason })
    showReopenModal.value = false
    reopenReason.value = ''
    await loadCorrectionHistory()
    notify('Attendance record reopened', 'success')
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    reopening.value = false
  }
}

function goBack() {
  record.value = null
  selectedStudent.value = null
}

function selectStudent(entry) {
  selectedStudent.value = entry
}

async function deleteSavedRecord(r) {
  try {
    await store.deleteRecord(r.id, auth.user?.id, auth.user?.role, r.school_id || effectiveSchoolId.value)
    savedRecords.value = savedRecords.value.filter(x => x.id !== r.id)
    notify('Record deleted', 'success')
  } catch (e) {
    notify(e.message, 'error')
  }
}

async function updatePeriodCell(entry, periodKey, value) {
  const previous = entry.periods[periodKey] || ''
  entry.periods[periodKey] = value
  try {
    await store.updateEntry(record.value.id, entry.studentId, `periods.${periodKey}`, value, auth.user?.id, auth.user?.role, effectiveSchoolId.value)
  } catch (error) {
    entry.periods[periodKey] = previous
    notify(error.message, 'error')
  }
}

async function saveEntry(entry) {
  try {
    await store.updateEntry(record.value.id, entry.studentId, 'reason', entry.reason, auth.user?.id, auth.user?.role, effectiveSchoolId.value)
    await store.updateEntry(record.value.id, entry.studentId, 'excused', entry.excused, auth.user?.id, auth.user?.role, effectiveSchoolId.value)
    await store.updateEntry(record.value.id, entry.studentId, 'unexcused', entry.unexcused, auth.user?.id, auth.user?.role, effectiveSchoolId.value)
    if (record.value.reopened_at) await loadCorrectionHistory()
  } catch (error) {
    notify(error.message, 'error')
  }
}


const savingNotes = ref(false)
const notesSavedStatus = ref('')
let notesTimeout = null

async function handleSaveTeacherNotes() {
  if (!record.value?.id || !canEdit.value) return
  savingNotes.value = true
  try {
    const notes = record.value.teacher_notes || ''
    await store.updateTeacherNotes(record.value.id, notes, auth.user?.id, auth.user?.role, effectiveSchoolId.value)
    notesSavedStatus.value = 'Notes saved'
    if (notesTimeout) clearTimeout(notesTimeout)
    notesTimeout = setTimeout(() => { notesSavedStatus.value = '' }, 3000)
    if (record.value.reopened_at) await loadCorrectionHistory()
  } catch (error) {
    notify(error.message || 'Failed to save notes', 'error')
  } finally {
    savingNotes.value = false
  }
}

function printSheet() {
  window.print()
}
</script>

<style scoped>
/* Offline & Sync Banner */
.offline-sync-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-radius: var(--radius-md, 10px);
  margin-bottom: 14px;
  font-size: 0.82rem;
  border: 1px solid var(--border);
}

.banner--offline {
  background: var(--warning-bg);
  color: var(--warning);
  border-color: rgba(182, 131, 56, 0.35);
}

.banner--pending {
  background: var(--info-bg, rgba(85, 126, 155, 0.12));
  color: var(--info);
  border-color: rgba(85, 126, 155, 0.35);
}

.offline-banner-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.offline-banner-icon {
  display: inline-flex;
  align-items: center;
}

.btn-sync-offline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-sync-offline:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-sync-offline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.daily-telemetry-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 10px);
  padding: 12px 18px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.telemetry-stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.telemetry-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--secondary);
  border: 1px solid var(--border);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  color: var(--foreground);
}

.telemetry-label {
  color: var(--muted-foreground);
  font-weight: 500;
}

.telemetry-chip strong {
  font-weight: 800;
  font-family: 'Manrope', sans-serif;
}

.telemetry-chip--success {
  background: var(--success-bg);
  border-color: color-mix(in srgb, var(--success) 30%, transparent);
  color: var(--success);
}
.telemetry-chip--success .telemetry-label {
  color: var(--success);
}

.telemetry-chip--warning {
  background: var(--warning-bg);
  border-color: color-mix(in srgb, var(--warning) 30%, transparent);
  color: var(--warning);
}
.telemetry-chip--warning .telemetry-label {
  color: var(--warning);
}

.telemetry-chip--danger {
  background: var(--red-bg);
  border-color: color-mix(in srgb, var(--destructive) 30%, transparent);
  color: var(--destructive);
}
.telemetry-chip--danger .telemetry-label {
  color: var(--destructive);
}

.telemetry-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-outline-teal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  border-radius: var(--radius-md, 7px);
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-outline-teal:hover:not(:disabled) {
  background: var(--primary);
  color: var(--primary-foreground);
}

.btn-outline-teal:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Teacher Notes Card */
.teacher-notes-card {
  margin-top: 18px;
  padding: 16px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 10px);
  box-shadow: var(--shadow-sm);
}

.teacher-notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.teacher-notes-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--foreground);
  font-size: 0.95rem;
}

.notes-status-badge {
  display: inline-flex;
  align-items: center;
  background: var(--success-bg);
  color: var(--success);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(79, 149, 97, 0.25);
}

.teacher-notes-desc {
  margin: 0 0 10px 0;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  line-height: 1.4;
}

.teacher-notes-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--input, var(--border));
  border-radius: var(--radius-sm, 8px);
  font-family: inherit;
  font-size: 0.85rem;
  resize: vertical;
  line-height: 1.45;
  outline: none;
  transition: border-color 0.15s ease;
}

.teacher-notes-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

.teacher-notes-textarea:disabled {
  opacity: 0.6;
  background: var(--muted);
  cursor: not-allowed;
}

.teacher-notes-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  gap: 12px;
}

.btn-save-notes {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-save-notes:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-save-notes:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Multi-dimensional Summary Modal Styles */
.summary-filters-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
  background: var(--secondary);
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.filter-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-col label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-col input,
.filter-col select {
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  border: 1px solid var(--input);
  background: var(--card);
  color: var(--foreground);
  font-size: 0.78rem;
  outline: none;
}

.summary-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.summary-kpi-card {
  padding: 12px;
  border-radius: var(--radius-sm);
  background: var(--card);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-kpi-card span {
  font-size: 0.7rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  font-weight: 700;
}

.summary-kpi-card strong {
  font-size: 1.3rem;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
}

.summary-kpi-card small {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.summary-breakdown-card {
  margin-bottom: 14px;
  padding: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.summary-breakdown-card h4 {
  margin: 0 0 10px;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--foreground);
}

.gender-split-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.gender-split-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gender-split-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--foreground);
}

.ratio-track {
  width: 100%;
  height: 6px;
  background: var(--secondary);
  border-radius: 999px;
  overflow: hidden;
}

.ratio-bar {
  height: 100%;
  border-radius: 999px;
}

.bar--male { background: var(--info, #557e9b); }
.bar--female { background: var(--accent, #c66a4d); }

.gender-split-col small {
  font-size: 0.7rem;
  color: var(--muted-foreground);
}

@media (max-width: 600px) {
  .summary-filters-bar { grid-template-columns: 1fr 1fr; }
  .summary-kpi-grid { grid-template-columns: 1fr; }
  .gender-split-row { grid-template-columns: 1fr; }
}
</style>
