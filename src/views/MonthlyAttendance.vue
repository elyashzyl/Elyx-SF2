<template>
  <div class="monthly-page">
    <div v-if="!record" class="select-screen">
      <div class="dashboard-header">
        <div class="dashboard-header-left">
          <h1>Monthly Attendance (SF2)</h1>
          <p>Select the class grade, section, and month to open or generate the monthly attendance sheet.</p>
        </div>
        <div class="dashboard-header-actions">
          <div class="dashboard-date-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>SF2 Report</span>
          </div>
        </div>
      </div>

      <div class="form-card" style="max-width: 860px;">
        <h3>Generate SF2</h3>
        <div class="form-group" v-if="auth.isSuperadmin">
          <label>School</label>
          <select v-model="selectedSchoolId" required @change="onSchoolChange">
            <option value="">None</option>
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Month</label>
            <select v-model="form.month">
              <option v-for="(m, i) in months" :key="i" :value="i+1">{{ m }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Year</label>
            <select v-model="form.year">
              <option v-for="y in years" :key="y">{{ y }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Grade Level</label>
            <select v-model="form.grade" @change="form.section = ''" required :disabled="auth.isTeacher">
              <option value="" disabled v-if="!grades.length">No grade levels defined</option>
              <option v-for="g in grades" :key="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Section</label>
            <select v-model="form.section" required :disabled="auth.isTeacher">
              <option value="" disabled>Select section</option>
              <option v-for="s in availableSections" :key="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          class="btn-secondary saturday-toggle"
          :class="{ active: form.includeSaturdays }"
          :aria-pressed="form.includeSaturdays"
          @click="form.includeSaturdays = !form.includeSaturdays"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="17" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="m8 15 2 2 5-5"/>
          </svg>
          {{ form.includeSaturdays ? 'Saturdays included' : 'Include Saturdays' }}
        </button>
        <p class="form-help">Sunday remains disabled. Existing reports keep their current setting.</p>
        <div class="form-actions">
          <button @click="openMonthly" class="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Generate SF2
          </button>
        </div>
        <p v-if="loadError" class="error-msg">{{ loadError }}</p>
      </div>
    </div>

    <div v-else class="sheet-container">
      <div class="sheet-header">
        <div class="school-info">
          <h1>{{ school.school_name }}</h1>
          <p>School ID: {{ school.school_id }}</p>
          <p v-if="school.school_address">{{ school.school_address }}</p>
        </div>
      </div>
      <div class="sheet-date">{{ months[form.month-1] }} {{ form.year }}</div>
      <h2 class="sheet-title">MONTHLY ATTENDANCE RECORD</h2>
      <div class="sheet-info">
        <span>Grade: {{ record.grade }}</span>
        <span>Section: {{ record.section }}</span>
        <button
          type="button"
          class="btn-secondary saturday-toggle sheet-setting"
          :class="{ active: record.include_saturdays }"
          :aria-pressed="record.include_saturdays"
          @click="updateIncludeSaturdays(!record.include_saturdays)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="17" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <path d="m8 15 2 2 5-5"/>
          </svg>
          {{ record.include_saturdays ? 'Saturdays included' : 'Include Saturdays' }}
        </button>
        <button
          type="button"
          class="btn-secondary sync-calendar-btn sheet-setting"
          :disabled="syncingCalendar"
          title="Import official school calendar holidays and suspensions into excluded school days"
          @click="handleSyncCalendar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21h5v-5"/>
          </svg>
          {{ syncingCalendar ? 'Syncing…' : 'Sync Calendar' }}
        </button>
        <button
          type="button"
          class="btn-secondary sync-roster-btn sheet-setting"
          :disabled="syncingRoster"
          title="Sync with school roster to automatically add missing learners without losing existing attendance marks"
          @click="handleSyncRoster"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          {{ syncingRoster ? 'Syncing…' : 'Sync Students' }}
        </button>
        <button
          type="button"
          class="btn-secondary delete-report-btn sheet-setting"
          :disabled="deletingReport"
          title="Delete this saved monthly SF2 report so you can generate a fresh report"
          @click="showDeleteConfirmModal = true"
          style="color: var(--destructive, #ef4444); border-color: rgba(239, 68, 68, 0.4);"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          {{ deletingReport ? 'Deleting…' : 'Delete / Reset Report' }}
        </button>
        <span>Adviser: <input v-model="record.adviser" @change="saveSummary" class="adviser-input" /></span>
        <span>School Head: <input v-model="record.schoolHead" @change="saveSummary" class="adviser-input" /></span>
      </div>

      <!-- School Calendar Events & Suspensions Strip -->
      <div v-if="record.calendar_events && record.calendar_events.length" class="calendar-events-strip">
        <div class="calendar-events-strip-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>School Calendar ({{ months[form.month-1] }} {{ form.year }}):</span>
        </div>
        <div class="calendar-event-pills">
          <span
            v-for="ev in record.calendar_events"
            :key="ev.id"
            class="calendar-event-pill"
            :class="{
              'pill--holiday': /holiday/i.test(ev.type),
              'pill--suspension': /suspension/i.test(ev.type),
              'pill--event': !/holiday|suspension/i.test(ev.type)
            }"
            :title="`${ev.type}: ${ev.title}`"
          >
            <strong>Day {{ ev.event_date.split('-')[2] }}</strong>: {{ ev.title }} ({{ ev.type }})
          </span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="attendance-table monthly-table">
          <thead>
            <tr>
              <th rowspan="2">No.</th>
              <th rowspan="2" class="name-col">NAME (Last Name, First Name, Middle Name)</th>
              <th v-for="d in daysInMonth" :key="d" :class="{ weekend: isWeekend(d), excluded: isExcluded(d) }">
                {{ d }}
                <button v-if="!isWeekend(d)" @click="toggleExcludeDate(d)" class="exclude-btn" :title="isExcluded(d) ? 'Restore date' : 'Remove date (no classes)'">
                  {{ isExcluded(d) ? '↺' : '✕' }}
                </button>
              </th>
              <th colspan="2">Total for the Month ({{ schoolDays }})</th>
              <th rowspan="2">Remarks</th>
            </tr>
            <tr>
              <th v-for="d in daysInMonth" :key="'d'+d" :class="{ weekend: isWeekend(d), excluded: isExcluded(d) }">
                <template v-if="isExcluded(d)">No classes</template>
                <template v-else>{{ dayLabels[(new Date(form.year, form.month - 1, d)).getDay()] }}</template>
              </th>
              <th>Present</th>
              <th>Absent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!record.entries || record.entries.length === 0">
              <td colspan="40" class="empty">No students found. Add students in Student Management first.</td>
            </tr>
            <template v-for="(group, gi) in genderGroups" :key="gi">
              <tr class="gender-sep-row">
                <td :colspan="totalCols">{{ group.label }}</td>
              </tr>
              <tr v-for="(entry, idx) in group.entries" :key="entry.studentId">
                <td>{{ startNum(gi) + idx }}</td>
                <td class="name-col">{{ entry.name }}</td>
                <td v-for="d in daysInMonth" :key="d"
                    :class="['day-cell', { weekend: isWeekend(d), excluded: isExcluded(d) }]">
                  <select v-if="!isDisabled(d)"
                          :value="dayDisplay(entry, d)"
                          @change="updateDay(entry, d, $event.target.value)"
                          class="day-select">
                    <option value=""></option>
                    <option value="A">x</option>
                    <option value="◤">◤</option>
                    <option value="◢">◢</option>
                    <option value="E">E</option>
                  </select>
                </td>
                <td class="total-cell present">{{ Math.round(entryPresent(entry) * 10) / 10 }}</td>
                <td class="total-cell absent">{{ entryAbsent(entry) }}</td>
                <td>
                  <input v-model="entry.remarks" @change="updateRemarks(entry)" class="remarks-input" />
                </td>
              </tr>
              <tr class="summary-row">
                <td colspan="2" class="summary-label">{{ group.label }} TOTAL</td>
                <td v-for="d in daysInMonth" :key="'s'+gi+'-'+d"
                    :class="['day-cell', { weekend: isWeekend(d), excluded: isExcluded(d) }]">
                  <span v-if="!isDisabled(d)" class="day-total">{{ group.total(d) }}</span>
                </td>
                <td class="total-cell present">{{ Math.round(group.sumPresent * 10) / 10 }}</td>
                <td class="total-cell absent">{{ group.sumAbsent }}</td>
                <td></td>
              </tr>
            </template>
            <tr class="summary-row combined" v-if="record.entries && record.entries.length">
              <td colspan="2" class="summary-label">COMBINED TOTAL</td>
              <td v-for="d in daysInMonth" :key="'c'+d"
                  :class="['day-cell', { weekend: isWeekend(d), excluded: isExcluded(d) }]">
                <span v-if="!isDisabled(d)" class="day-total">{{ dayTotal(record.entries, d, 'all') }}</span>
              </td>
              <td class="total-cell present">{{ sumPresent('all') }}</td>
              <td class="total-cell absent">{{ sumAbsent('all') }}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="summary-section" v-if="record.entries && record.entries.length">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <h3 style="margin: 0;">SUMMARY</h3>
          <button
            type="button"
            @click="recalculateSummary(true)"
            class="btn-secondary"
            style="padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;"
            title="Recalculate summary metrics from current learner roster and daily attendance marks"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            Recalculate Summary
          </button>
        </div>
        <table class="summary-table">
          <thead>
            <tr>
              <th></th>
              <th>M</th>
              <th>F</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="summary-label">Enrolment as of 1st Friday of the SY</td>
              <td><input type="number" v-model.number="summaryEdits.enr_m" @change="onSummaryChange('enr')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.enr_f" @change="onSummaryChange('enr')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.enr_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Late enrolment during the month</td>
              <td><input type="number" v-model.number="summaryEdits.late_m" @change="onSummaryChange('late')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.late_f" @change="onSummaryChange('late')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.late_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Registered Learners as of end of month</td>
              <td><input type="number" v-model.number="summaryEdits.reg_m" @change="onSummaryChange('reg')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.reg_f" @change="onSummaryChange('reg')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.reg_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Percentage of Enrolment</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_enr_m" @change="saveSummary" class="summary-input" />%</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_enr_f" @change="saveSummary" class="summary-input" />%</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_enr_t" @change="saveSummary" class="summary-input" />%</td>
            </tr>
            <tr>
              <td class="summary-label">Average Daily Attendance</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.ada_m" @change="onSummaryChange('ada')" class="summary-input" /></td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.ada_f" @change="onSummaryChange('ada')" class="summary-input" /></td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.ada_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Percentage of Attendance</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_m" @change="saveSummary" class="summary-input" />%</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_f" @change="saveSummary" class="summary-input" />%</td>
              <td><input type="number" step="0.1" v-model.number="summaryEdits.pct_t" @change="saveSummary" class="summary-input" />%</td>
            </tr>
            <tr>
              <td class="summary-label">Number of students absent for 5 consecutive days</td>
              <td><input type="number" v-model.number="summaryEdits.abs5_m" @change="onSummaryChange('abs5')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.abs5_f" @change="onSummaryChange('abs5')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.abs5_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">NLS</td>
              <td><input type="number" v-model.number="summaryEdits.nls_m" @change="onSummaryChange('nls')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.nls_f" @change="onSummaryChange('nls')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.nls_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Transferred out</td>
              <td><input type="number" v-model.number="summaryEdits.transfer_out_m" @change="onSummaryChange('transfer_out')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.transfer_out_f" @change="onSummaryChange('transfer_out')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.transfer_out_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
            <tr>
              <td class="summary-label">Transferred in</td>
              <td><input type="number" v-model.number="summaryEdits.transfer_in_m" @change="onSummaryChange('transfer_in')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.transfer_in_f" @change="onSummaryChange('transfer_in')" class="summary-input" /></td>
              <td><input type="number" v-model.number="summaryEdits.transfer_in_t" @change="saveSummary" class="summary-input" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="legends">
        <h3>LEGENDS:</h3>
        <div class="legend-grid">
          <span><strong>(blank)</strong> - Present</span>
          <span><strong>x</strong> - Absent</span>
          <span><strong>◤</strong> - Tardy</span>
          <span><strong>◢</strong> - Half Day</span>
          <span><strong>E</strong> - Entered (days before are absent)</span>
        </div>
        <p class="legend-note">Sunday is always disabled. Saturday is configurable for this report. Other dates with no classes are grayed out and disabled. Click ✕ on a date header to mark it as no classes.</p>
      </div>

      <div class="sheet-actions">
        <button @click="runPreExportValidation" class="btn-secondary" :disabled="validatingExport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          {{ validatingExport ? 'Validating…' : 'Validate Data' }}
        </button>
        <button @click="exportToSF2" class="btn-primary" :disabled="exporting">
          <span v-if="exporting" class="spinner" style="margin-right: 6px;"></span>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {{ exporting ? 'Exporting...' : 'Export to SF2 (Excel)' }}
        </button>
        <button @click="goBack" class="btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Selection
        </button>
      </div>
    </div>

    <!-- SF2 Export Validation Modal -->
    <div v-if="showValidationModal" class="modal-overlay" @click.self="showValidationModal = false">
      <div class="form-card" style="max-width: 520px;">
        <div class="modal-header-compact">
          <h3>SF2 Export Pre-Check Results</h3>
          <p class="modal-subtext">{{ record?.grade }} — {{ record?.section }} ({{ months[form.month-1] }} {{ form.year }})</p>
        </div>

        <div v-if="exportValidationResult" class="val-summary-pane" :class="exportValidationResult.valid ? 'pane-valid' : 'pane-warning'">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <span class="validation-status" :class="exportValidationResult.valid ? 'validation-status--valid' : 'validation-status--warning'">
              {{ exportValidationResult.valid ? '✓ Ready for Export' : '⚠ Warnings Found in Dataset' }}
            </span>
          </div>

          <div style="font-size: 0.82rem; margin-bottom: 12px; color: var(--muted-foreground);">
            Learners: <strong>{{ exportValidationResult.summary.totalLearners }}</strong> ({{ exportValidationResult.summary.maleCount }} Male, {{ exportValidationResult.summary.femaleCount }} Female)
          </div>

          <div v-if="exportValidationResult.errors.length" class="validation-message validation-message--error">
            <strong>Errors:</strong>
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              <li v-for="(e, i) in exportValidationResult.errors" :key="i">{{ e }}</li>
            </ul>
          </div>

          <div v-if="exportValidationResult.warnings.length" class="validation-message validation-message--warning">
            <strong>Advisories:</strong>
            <ul style="margin: 4px 0 0 16px; padding: 0;">
              <li v-for="(w, i) in exportValidationResult.warnings" :key="i">{{ w }}</li>
            </ul>
          </div>
        </div>

        <div class="form-actions" style="margin-top: 18px;">
          <button @click="showValidationModal = false; exportToSF2()" class="btn-primary" :disabled="exporting">
            Export SF2 Excel Now
          </button>
          <button @click="showValidationModal = false" class="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Monthly Report Modal -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click.self="showDeleteConfirmModal = false">
      <div class="form-card" style="max-width: 480px;">
        <h3 style="color: var(--destructive, #ef4444);">Delete Monthly SF2 Report?</h3>
        <p class="modal-subtext">
          Are you sure you want to delete the saved SF2 report for <strong>{{ months[form.month-1] }} {{ form.year }}</strong> ({{ record?.grade }} - {{ record?.section }})?
        </p>
        <p style="font-size: 13px; color: var(--muted-foreground); margin: 8px 0 16px;">
          This will remove the saved report and all its attendance marks for this month so you can generate a fresh report with the latest class roster.
        </p>
        <div class="form-actions">
          <button type="button" @click="handleDeleteReport" class="btn-primary" style="background: var(--destructive, #ef4444); border-color: var(--destructive, #ef4444);" :disabled="deletingReport">
            {{ deletingReport ? 'Deleting…' : 'Yes, Delete Report' }}
          </button>
          <button type="button" @click="showDeleteConfirmModal = false" class="btn-secondary" :disabled="deletingReport">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAttendanceStore } from '../stores/attendance'
import { useAuthStore } from '../stores/auth'
import { useGradeLevels } from '../composables/useGradeLevels'
import { useToast } from '../composables/useToast'
import { loadPageState } from '../composables/usePageState'

const route = useRoute()
const store = useAttendanceStore()
const auth = useAuthStore()
const { addToast } = useToast()
const notify = (msg, type = 'info') => addToast(msg, type)
const { grades, sectionsByGrade, loadGradeLevels } = useGradeLevels()
const savedState = loadPageState(auth.user)
const school = reactive({ school_name: '', school_id: '', school_address: '', school_short: '' })

const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const availableSections = computed(() => sectionsByGrade.value[form.grade] || [])

const now = new Date()
const years = []
for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 2; y++) years.push(y)

const form = reactive({
  month: savedState?.month ?? (now.getMonth() + 1),
  year: savedState?.year ?? now.getFullYear(),
  grade: savedState?.grade ?? (auth.isTeacher && auth.user?.grade ? auth.user.grade : ''),
  section: savedState?.section ?? (auth.isTeacher && auth.user?.section ? auth.user.section : ''),
  includeSaturdays: false
})

function applyGradeDefaults() {
  if (!grades.value.length) { form.grade = ''; form.section = ''; return }
  if (auth.isTeacher && auth.user?.grade && grades.value.includes(auth.user.grade)) {
    form.grade = auth.user.grade
    const secs = sectionsByGrade.value[form.grade] || []
    form.section = secs.includes(auth.user.section) ? auth.user.section : ''
  } else if (!grades.value.includes(form.grade)) {
    form.grade = grades.value[0]
    form.section = ''
  }
}

const record = ref(null)
const loadError = ref('')
const studentsLookup = ref({})
const schools = ref([])
const selectedSchoolId = ref(savedState?.school || '')
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || ''))
const summaryEdits = reactive({ enr_m: 0, enr_f: 0, enr_t: 0, late_m: 0, late_f: 0, late_t: 0, reg_m: 0, reg_f: 0, reg_t: 0, pct_enr_m: 0, pct_enr_f: 0, pct_enr_t: 0, ada_m: 0, ada_f: 0, ada_t: 0, pct_m: 0, pct_f: 0, pct_t: 0, abs5_m: 0, abs5_f: 0, abs5_t: 0, nls_m: 0, nls_f: 0, nls_t: 0, transfer_out_m: 0, transfer_out_f: 0, transfer_out_t: 0, transfer_in_m: 0, transfer_in_f: 0, transfer_in_t: 0 })

async function onSchoolChange() {
  await loadGradeLevels(selectedSchoolId.value || undefined)
  applyGradeDefaults()
}

const exporting = ref(false)
const sheetName = ref('')
const validatingExport = ref(false)
const showValidationModal = ref(false)
const exportValidationResult = ref(null)

async function runPreExportValidation() {
  if (!record.value?.entries) return
  validatingExport.value = true
  try {
    const res = await fetch('/api/export/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: auth.user?.id || '',
        userRole: auth.user?.role || '',
        schoolId: effectiveSchoolId.value || '',
        grade: form.grade,
        section: form.section,
        month: form.month,
        year: form.year,
        entries: record.value.entries
      })
    })
    exportValidationResult.value = await res.json()
    showValidationModal.value = true
  } catch (err) {
    alert('Validation error: ' + err.message)
  } finally {
    validatingExport.value = false
  }
}

onMounted(async () => {
  if (auth.isSuperadmin) {
    try { schools.value = await auth.getSchools() } catch {}
  }
  await loadGradeLevels(effectiveSchoolId.value || undefined)
  applyGradeDefaults()
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
  try {
    const res = await fetch('/api/export/sheets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const data = await res.json()
    if (data.sheets?.length) {
      sheetName.value = data.sheets[0]
    }
  } catch {}
  try {
    if (route.query.grade && route.query.section) {
      form.grade = String(route.query.grade)
      form.section = String(route.query.section)
      if (route.query.month) form.month = Number(route.query.month)
      if (route.query.year) form.year = Number(route.query.year)
      await openMonthly()
    } else {
      const saved = localStorage.getItem('monthlyAttendance')
      if (saved) {
        const p = JSON.parse(saved)
        form.month = p.month
        form.year = p.year
        form.grade = p.grade
        form.section = p.section
        await openMonthly()
      }
    }
  } catch {}
})

async function exportToSF2() {
  if (!record.value?.entries) return
  exporting.value = true
  try {
    const res = await fetch('/api/export/sf2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: auth.user?.id || '',
        userRole: auth.user?.role || '',
        schoolId: effectiveSchoolId.value || '',
        sheetName: sheetName.value || 'Sheet1',
        entries: record.value.entries,
        month: form.month,
        year: form.year,
        grade: form.grade,
        section: form.section,
        includeSaturdays: Boolean(record.value.include_saturdays),
        adviser: record.value.adviser || '',
        schoolHead: record.value.schoolHead || '',
        summary_data: {
          enr_m: summaryEdits.enr_m,
          enr_f: summaryEdits.enr_f,
          enr_t: summaryEdits.enr_t,
          late_m: summaryEdits.late_m,
          late_f: summaryEdits.late_f,
          late_t: summaryEdits.late_t,
          reg_m: summaryEdits.reg_m,
          reg_f: summaryEdits.reg_f,
          reg_t: summaryEdits.reg_t,
          pct_enr_m: summaryEdits.pct_enr_m,
          pct_enr_f: summaryEdits.pct_enr_f,
          pct_enr_t: summaryEdits.pct_enr_t,
          ada_m: summaryEdits.ada_m,
          ada_f: summaryEdits.ada_f,
          ada_t: summaryEdits.ada_t,
          pct_m: summaryEdits.pct_m,
          pct_f: summaryEdits.pct_f,
          pct_t: summaryEdits.pct_t,
          abs5_m: summaryEdits.abs5_m,
          abs5_f: summaryEdits.abs5_f,
          abs5_t: summaryEdits.abs5_t,
          nls_m: summaryEdits.nls_m,
          nls_f: summaryEdits.nls_f,
          nls_t: summaryEdits.nls_t,
          transfer_out_m: summaryEdits.transfer_out_m,
          transfer_out_f: summaryEdits.transfer_out_f,
          transfer_out_t: summaryEdits.transfer_out_t,
          transfer_in_m: summaryEdits.transfer_in_m,
          transfer_in_f: summaryEdits.transfer_in_f,
          transfer_in_t: summaryEdits.transfer_in_t
        },
        excluded_dates: record.value.excluded_dates || []
      })
    })
    if (!res.ok) {
      const err = await res.json()
      alert('Export failed: ' + (err.error || 'Unknown error'))
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SF2_${record.value.grade}_${record.value.section}_${months[form.month-1]}_${form.year}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    alert('Export failed: ' + err.message)
  } finally {
    exporting.value = false
  }
}

const daysInMonth = computed(() => {
  return new Date(form.year, form.month, 0).getDate()
})

function isWeekend(d) {
  const day = new Date(form.year, form.month - 1, d).getDay()
  if (day === 0) return true
  return day === 6 && !Boolean(record.value?.include_saturdays)
}

function isExcluded(d) {
  return record.value?.excluded_dates?.includes(d) ?? false
}

function isDisabled(d) {
  return isWeekend(d) || isExcluded(d)
}

const schoolDays = computed(() => {
  let count = 0
  for (let d = 1; d <= daysInMonth.value; d++) {
    if (!isDisabled(d)) count++
  }
  return count
})

const totalCols = computed(() => daysInMonth.value + 5)

function normalizeGender(g) {
  if (!g) return ''
  const str = String(g).trim().toLowerCase()
  if (str === 'male' || str === 'm' || str === 'boy' || str === 'boys') return 'male'
  if (str === 'female' || str === 'f' || str === 'girl' || str === 'girls') return 'female'
  return ''
}

function entriesByGender(gender) {
  if (!record.value?.entries) return []
  if (gender === 'all') return record.value.entries
  return record.value.entries.filter(e => normalizeGender(e.gender) === gender)
}

function dayTotal(entries, day, gender) {
  if (!entries || !entries.length) return 0
  const filtered = gender === 'all' ? entries : entries.filter(e => normalizeGender(e.gender) === gender)
  if (!filtered.length) return 0
  let count = 0
  for (const e of filtered) {
    const enrollDay = enrollmentDay(e)
    if (enrollDay !== null && day < enrollDay) continue
    const s = e.days ? e.days[String(day)] : null
    if (!s || s === '◤' || s === 'T' || s === 'E') count++
    else if (s === '◢' || s === 'H') count += 0.5
  }
  return count
}

function enrollmentDay(entry) {
  const eDates = Object.keys(entry.days || {}).filter(d => entry.days[d] === 'E')
  return eDates.length ? Math.min(...eDates.map(Number)) : null
}

function dayDisplay(entry, d) {
  const enrollDay = enrollmentDay(entry)
  if (enrollDay !== null && d < enrollDay) return 'x'
  return entry.days[String(d)] || ''
}

function entryAbsent(entry) {
  const enrollDay = enrollmentDay(entry)
  let count = 0
  for (let d = 1; d <= daysInMonth.value; d++) {
    if (isDisabled(d)) continue
    if (enrollDay !== null && d < enrollDay) { count++; continue }
    const s = entry.days ? entry.days[String(d)] : null
    if (s === 'A') count++
    else if (s === '◢' || s === 'H') count += 0.5
  }
  return count
}

function entryPresent(entry) {
  return Math.max(0, schoolDays.value - entryAbsent(entry))
}

function sumPresent(gender) {
  const entries = entriesByGender(gender)
  const total = entries.reduce((sum, e) => sum + entryPresent(e), 0)
  return Math.round(total * 10) / 10
}

function sumAbsent(gender) {
  const entries = entriesByGender(gender)
  const total = entries.reduce((sum, e) => sum + entryAbsent(e), 0)
  return total
}

const genderGroups = computed(() => {
  if (!record.value?.entries) return []
  const sortAlpha = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  const boys = [...record.value.entries.filter(e => normalizeGender(e.gender) === 'male')].sort(sortAlpha)
  const girls = [...record.value.entries.filter(e => normalizeGender(e.gender) === 'female')].sort(sortAlpha)
  const unassigned = [...record.value.entries.filter(e => !normalizeGender(e.gender))].sort(sortAlpha)
  const groups = []

  // Always include BOYS
  groups.push({
    label: 'BOYS',
    entries: boys,
    total: (d) => dayTotal(boys, d, 'all'),
    sumPresent: boys.reduce((s, e) => s + entryPresent(e), 0),
    sumAbsent: boys.reduce((s, e) => s + entryAbsent(e), 0)
  })

  // Always include GIRLS
  groups.push({
    label: 'GIRLS',
    entries: girls,
    total: (d) => dayTotal(girls, d, 'all'),
    sumPresent: girls.reduce((s, e) => s + entryPresent(e), 0),
    sumAbsent: girls.reduce((s, e) => s + entryAbsent(e), 0)
  })

  // If any unassigned gender learners exist, keep them visible so totals are never lost
  if (unassigned.length) {
    groups.push({
      label: 'UNASSIGNED GENDER',
      entries: unassigned,
      total: (d) => dayTotal(unassigned, d, 'all'),
      sumPresent: unassigned.reduce((s, e) => s + entryPresent(e), 0),
      sumAbsent: unassigned.reduce((s, e) => s + entryAbsent(e), 0)
    })
  }

  return groups
})

const summaryData = computed(() => {
  if (!record.value?.entries) return null
  const groups = genderGroups.value
  const boys = groups.find(g => g.label === 'BOYS')
  const girls = groups.find(g => g.label === 'GIRLS')
  const mCount = boys ? boys.entries.length : 0
  const fCount = girls ? girls.entries.length : 0
  const lateM = summaryEdits.late_m || 0
  const lateF = summaryEdits.late_f || 0
  const mPresent = boys ? boys.sumPresent : 0
  const fPresent = girls ? girls.sumPresent : 0
  const sd = schoolDays.value || 1
  const mADA = Math.floor((mPresent / sd) * 100) / 100
  const fADA = Math.floor((fPresent / sd) * 100) / 100
  const tADA = Math.floor(((mPresent + fPresent) / sd) * 100) / 100
  const mInit = mCount - lateM
  const fInit = fCount - lateF
  const tInit = mInit + fInit
  return {
    enrollment: { m: mInit, f: fInit, total: tInit },
    lateEnrolment: {
      m: record.value.entries.filter(e => e.late_enrollee && normalizeGender(e.gender) === 'male').length,
      f: record.value.entries.filter(e => e.late_enrollee && normalizeGender(e.gender) === 'female').length,
      total: record.value.entries.filter(e => e.late_enrollee).length
    },
    registeredLearners: { m: mCount, f: fCount, total: mCount + fCount },
    pctEnrolment: {
      m: mCount > 0 ? Math.round((mCount - lateM) / mCount * 100) : 0,
      f: fCount > 0 ? Math.round((fCount - lateF) / fCount * 100) : 0,
      total: (mCount + fCount) > 0 ? Math.round(((mCount + fCount - lateM - lateF) / (mCount + fCount)) * 100) : 0
    },
    avgDailyAttendance: { m: mADA, f: fADA, total: tADA },
    pctAttendance: {
      m: mCount ? Math.floor((mPresent / sd / mCount) * 100 * 100) / 100 : 0,
      f: fCount ? Math.floor((fPresent / sd / fCount) * 100 * 100) / 100 : 0,
      total: (mCount + fCount) ? Math.floor(((mPresent + fPresent) / sd / (mCount + fCount)) * 100 * 100) / 100 : 0
    },
    absent5: {
      m: boys ? boys.entries.filter(e => entryAbsent(e) >= 5).length : 0,
      f: girls ? girls.entries.filter(e => entryAbsent(e) >= 5).length : 0,
      total: record.value.entries.filter(e => entryAbsent(e) >= 5).length
    }
  }
})

function startNum(gi) {
  let n = 1
  for (let i = 0; i < gi; i++) {
    n += genderGroups.value[i].entries.length
  }
  return n
}

async function openMonthly() {
  // A teacher's advisory class is authoritative. This also clears stale
  // values restored from a previous page state or URL.
  if (auth.isTeacher) {
    form.grade = auth.user?.grade || ''
    form.section = auth.user?.section || ''
  }
  if (!form.grade || !form.section) {
    loadError.value = 'Please fill in all fields'
    return
  }
  if (auth.isSuperadmin && !selectedSchoolId.value) {
    loadError.value = 'Please select a school'
    return
  }

  loadError.value = ''
  try {
    const sid = effectiveSchoolId.value
    const lastDay = new Date(form.year, form.month, 0).getDate()
    const monthEnd = `${form.year}-${String(form.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // 1. Fetch unified class roster, current class roster, historical roster, and existing monthly record concurrently
    const [unifiedRoster, currentStudents, historicalStudents, existingData] = await Promise.all([
      store.getClassRoster(form.grade, form.section, sid || undefined).catch(() => []),
      store.getStudents(
        { grade: form.grade, section: form.section, includeWithdrawn: 'true' },
        sid || undefined
      ).catch(() => []),
      store.getStudents(
        { grade: form.grade, section: form.section, includeWithdrawn: 'true', asOf: monthEnd },
        sid || undefined
      ).catch(() => []),
      store.fetchMonthly(form.grade, form.section, form.month, form.year, sid || undefined, { throwOnError: true })
    ])

    // Combine rosters: any student belonging to this class across all sources is retained
    const studentMap = new Map()
    for (const s of (unifiedRoster || [])) {
      if (s?.id) studentMap.set(String(s.id), s)
    }
    for (const s of (currentStudents || [])) {
      if (s?.id && !studentMap.has(String(s.id))) {
        studentMap.set(String(s.id), s)
      }
    }
    for (const s of (historicalStudents || [])) {
      if (s?.id && !studentMap.has(String(s.id))) {
        studentMap.set(String(s.id), s)
      }
    }
    const students = Array.from(studentMap.values())

    // Build lookup for gender from all available sources (by ID and by Name)
    const lookup = {}
    const lookupByName = {}
    for (const s of (unifiedRoster || [])) {
      if (s.gender) { lookup[s.id] = s.gender; lookupByName[(s.name || '').trim().toLowerCase()] = s.gender }
    }
    for (const s of (currentStudents || [])) {
      if (s.gender) { lookup[s.id] = s.gender; lookupByName[(s.name || '').trim().toLowerCase()] = s.gender }
    }
    for (const s of (historicalStudents || [])) {
      if (s.gender) { lookup[s.id] = s.gender; lookupByName[(s.name || '').trim().toLowerCase()] = s.gender }
    }
    if (existingData?.entries) {
      for (const e of existingData.entries) {
        if (e.gender) {
          if (!lookup[e.studentId]) lookup[e.studentId] = e.gender
          lookupByName[(e.name || '').trim().toLowerCase()] = e.gender
        }
      }
    }
    studentsLookup.value = lookup

    let data = existingData
    if (!data) {
      // Sort new entries: Boys first, then Girls, alphabetically by name
      const sortedStudents = [...students].sort((a, b) => {
        const gA = normalizeGender(lookup[a.id] || lookupByName[(a.name || '').trim().toLowerCase()] || a.gender) === 'female' ? 1 : 0
        const gB = normalizeGender(lookup[b.id] || lookupByName[(b.name || '').trim().toLowerCase()] || b.gender) === 'female' ? 1 : 0
        if (gA !== gB) return gA - gB
        return (a.name || '').localeCompare(b.name || '')
      })
      const entries = sortedStudents.map(s => ({
        studentId: s.id,
        name: s.name,
        gender: lookup[s.id] || lookupByName[(s.name || '').trim().toLowerCase()] || s.gender || '',
        days: {},
        present: 0,
        absent: 0,
        remarks: '',
        late_enrollee: 0
      }))
      data = {
        month: form.month,
        year: form.year,
        grade: form.grade,
        section: form.section,
        adviser: auth.user?.name || '',
        include_saturdays: Boolean(form.includeSaturdays),
        entries
      }
      const result = await store.saveMonthly(data, auth.user, sid || undefined)
      if (result) data.id = result.id
    } else {
      // PRESERVE ALL EXISTING ENTRIES! Never filter or delete saved students!
      for (const e of data.entries) {
        const gen = lookup[e.studentId] || lookupByName[(e.name || '').trim().toLowerCase()]
        if (gen && !e.gender) {
          e.gender = gen
        }
      }

      // Add missing students from the roster as late enrollees
      const existingIds = new Set(data.entries.map(e => String(e.studentId || '')))
      const existingNames = new Set(data.entries.map(e => (e.name || '').trim().toLowerCase()))
      const missing = students.filter(s => !existingIds.has(String(s.id)) && !existingNames.has((s.name || '').trim().toLowerCase()))
      if (missing.length > 0) {
        for (const s of missing) {
          data.entries.push({
            studentId: s.id,
            name: s.name,
            gender: lookup[s.id] || lookupByName[(s.name || '').trim().toLowerCase()] || s.gender || '',
            days: {},
            present: 0,
            absent: 0,
            remarks: '',
            late_enrollee: 1
          })
        }
        await store.saveMonthly(data, auth.user, sid || undefined)
      }
    }

    data.include_saturdays = data.include_saturdays === true || Number(data.include_saturdays) === 1
    form.includeSaturdays = data.include_saturdays
    record.value = data
    try {
      localStorage.setItem('monthlyAttendance', JSON.stringify({
        month: form.month,
        year: form.year,
        grade: form.grade,
        section: form.section,
        includeSaturdays: form.includeSaturdays
      }))
    } catch {}
    initSummaryEdits()
    refreshSummaryFromLive(true)
  } catch (error) {
    record.value = null
    loadError.value = error?.message || 'Unable to generate the monthly SF2 report'
  }
}

function onSummaryChange(field) {
  if (field === 'enr' || field === 'reg') {
    summaryEdits.enr_t = (Number(summaryEdits.enr_m) || 0) + (Number(summaryEdits.enr_f) || 0)
    summaryEdits.reg_t = (Number(summaryEdits.reg_m) || 0) + (Number(summaryEdits.reg_f) || 0)
    summaryEdits.pct_enr_m = summaryEdits.enr_m > 0
      ? Math.round((summaryEdits.reg_m / summaryEdits.enr_m) * 1000) / 10
      : (summaryEdits.reg_m > 0 ? 100 : 0)
    summaryEdits.pct_enr_f = summaryEdits.enr_f > 0
      ? Math.round((summaryEdits.reg_f / summaryEdits.enr_f) * 1000) / 10
      : (summaryEdits.reg_f > 0 ? 100 : 0)
    summaryEdits.pct_enr_t = summaryEdits.enr_t > 0
      ? Math.round((summaryEdits.reg_t / summaryEdits.enr_t) * 1000) / 10
      : (summaryEdits.reg_t > 0 ? 100 : 0)
  } else if (field === 'late') {
    summaryEdits.late_t = (Number(summaryEdits.late_m) || 0) + (Number(summaryEdits.late_f) || 0)
  } else if (field === 'nls') {
    summaryEdits.nls_t = (Number(summaryEdits.nls_m) || 0) + (Number(summaryEdits.nls_f) || 0)
  } else if (field === 'transfer_out') {
    summaryEdits.transfer_out_t = (Number(summaryEdits.transfer_out_m) || 0) + (Number(summaryEdits.transfer_out_f) || 0)
  } else if (field === 'transfer_in') {
    summaryEdits.transfer_in_t = (Number(summaryEdits.transfer_in_m) || 0) + (Number(summaryEdits.transfer_in_f) || 0)
  } else if (field === 'abs5') {
    summaryEdits.abs5_t = (Number(summaryEdits.abs5_m) || 0) + (Number(summaryEdits.abs5_f) || 0)
  } else if (field === 'ada') {
    summaryEdits.ada_t = Math.round(((Number(summaryEdits.ada_m) || 0) + (Number(summaryEdits.ada_f) || 0)) * 100) / 100
  }
  saveSummary()
}

function initSummaryEdits() {
  if (!record.value) return
  const sd = record.value.summary_data || {}
  const s = summaryData.value || {}

  const entries = record.value.entries || []
  const mCount = entries.filter(e => normalizeGender(e.gender) === 'male').length
  const fCount = entries.filter(e => normalizeGender(e.gender) === 'female').length
  const lateM = entries.filter(e => e.late_enrollee && normalizeGender(e.gender) === 'male').length
  const lateF = entries.filter(e => e.late_enrollee && normalizeGender(e.gender) === 'female').length

  // Registered learners always matches current class entries count
  summaryEdits.reg_m = mCount
  summaryEdits.reg_f = fCount
  summaryEdits.reg_t = mCount + fCount

  summaryEdits.late_m = Math.max(Number(sd.late_m) || 0, lateM)
  summaryEdits.late_f = Math.max(Number(sd.late_f) || 0, lateF)
  summaryEdits.late_t = (Number(summaryEdits.late_m) || 0) + (Number(summaryEdits.late_f) || 0)

  const defaultEnrM = Math.max(0, mCount - summaryEdits.late_m)
  const defaultEnrF = Math.max(0, fCount - summaryEdits.late_f)
  summaryEdits.enr_m = (sd.enr_m !== undefined && sd.enr_m !== null && Number(sd.enr_m) > 0)
    ? Number(sd.enr_m)
    : defaultEnrM
  summaryEdits.enr_f = (sd.enr_f !== undefined && sd.enr_f !== null && Number(sd.enr_f) > 0)
    ? Number(sd.enr_f)
    : defaultEnrF
  summaryEdits.enr_t = (Number(summaryEdits.enr_m) || 0) + (Number(summaryEdits.enr_f) || 0)

  summaryEdits.pct_enr_m = summaryEdits.enr_m > 0
    ? Math.round((summaryEdits.reg_m / summaryEdits.enr_m) * 1000) / 10
    : (summaryEdits.reg_m > 0 ? 100 : 0)
  summaryEdits.pct_enr_f = summaryEdits.enr_f > 0
    ? Math.round((summaryEdits.reg_f / summaryEdits.enr_f) * 1000) / 10
    : (summaryEdits.reg_f > 0 ? 100 : 0)
  summaryEdits.pct_enr_t = summaryEdits.enr_t > 0
    ? Math.round((summaryEdits.reg_t / summaryEdits.enr_t) * 1000) / 10
    : (summaryEdits.reg_t > 0 ? 100 : 0)

  summaryEdits.ada_m = s.avgDailyAttendance?.m ?? 0
  summaryEdits.ada_f = s.avgDailyAttendance?.f ?? 0
  summaryEdits.ada_t = s.avgDailyAttendance?.total ?? Math.round(((Number(summaryEdits.ada_m) || 0) + (Number(summaryEdits.ada_f) || 0)) * 100) / 100

  summaryEdits.pct_m = s.pctAttendance?.m ?? 0
  summaryEdits.pct_f = s.pctAttendance?.f ?? 0
  summaryEdits.pct_t = s.pctAttendance?.total ?? 0

  summaryEdits.abs5_m = s.absent5?.m ?? 0
  summaryEdits.abs5_f = s.absent5?.f ?? 0
  summaryEdits.abs5_t = s.absent5?.total ?? ((Number(summaryEdits.abs5_m) || 0) + (Number(summaryEdits.abs5_f) || 0))

  summaryEdits.nls_m = Number(sd.nls_m) || 0
  summaryEdits.nls_f = Number(sd.nls_f) || 0
  summaryEdits.nls_t = (Number(summaryEdits.nls_m) || 0) + (Number(summaryEdits.nls_f) || 0)

  summaryEdits.transfer_out_m = Number(sd.transfer_out_m) || 0
  summaryEdits.transfer_out_f = Number(sd.transfer_out_f) || 0
  summaryEdits.transfer_out_t = (Number(summaryEdits.transfer_out_m) || 0) + (Number(summaryEdits.transfer_out_f) || 0)

  summaryEdits.transfer_in_m = Number(sd.transfer_in_m) || 0
  summaryEdits.transfer_in_f = Number(sd.transfer_in_f) || 0
  summaryEdits.transfer_in_t = (Number(summaryEdits.transfer_in_m) || 0) + (Number(summaryEdits.transfer_in_f) || 0)
}

async function updateIncludeSaturdays(includeSaturdays) {
  if (!record.value?.id) return
  try {
    const result = await store.updateMonthlySettings(record.value.id, includeSaturdays, auth.user?.id, auth.user?.role, effectiveSchoolId.value || undefined)
    record.value.include_saturdays = result?.include_saturdays === true || Number(result?.include_saturdays) === 1 || includeSaturdays
    form.includeSaturdays = record.value.include_saturdays
    const refreshed = await store.fetchMonthly(form.grade, form.section, form.month, form.year, effectiveSchoolId.value || undefined, { throwOnError: true })
    if (refreshed) {
      for (const entry of refreshed.entries || []) entry.gender = studentsLookup.value[entry.studentId] || entry.gender || ''
      record.value = { ...refreshed, include_saturdays: refreshed.include_saturdays === true || Number(refreshed.include_saturdays) === 1 }
      form.includeSaturdays = record.value.include_saturdays
      initSummaryEdits()
      refreshSummaryFromLive()
    }
  } catch (error) {
    alert(error?.message || 'Unable to update Saturday setting')
  }
}

async function saveSummary() {
  if (!record.value?.id) return
  await fetch(`/api/monthly/${record.value.id}/summary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: auth.user?.id || '',
      userRole: auth.user?.role || '',
      ...(effectiveSchoolId.value ? { schoolId: effectiveSchoolId.value } : {}),
      adviser: record.value.adviser,
      schoolHead: record.value.schoolHead,
      summary_data: {
        enr_m: summaryEdits.enr_m,
        enr_f: summaryEdits.enr_f,
        enr_t: summaryEdits.enr_t,
        late_m: summaryEdits.late_m,
        late_f: summaryEdits.late_f,
        late_t: summaryEdits.late_t,
        reg_m: summaryEdits.reg_m,
        reg_f: summaryEdits.reg_f,
        reg_t: summaryEdits.reg_t,
        pct_enr_m: summaryEdits.pct_enr_m,
        pct_enr_f: summaryEdits.pct_enr_f,
        pct_enr_t: summaryEdits.pct_enr_t,
        ada_m: summaryEdits.ada_m,
        ada_f: summaryEdits.ada_f,
        ada_t: summaryEdits.ada_t,
        pct_m: summaryEdits.pct_m,
        pct_f: summaryEdits.pct_f,
        pct_t: summaryEdits.pct_t,
        abs5_m: summaryEdits.abs5_m,
        abs5_f: summaryEdits.abs5_f,
        abs5_t: summaryEdits.abs5_t,
        nls_m: summaryEdits.nls_m,
        nls_f: summaryEdits.nls_f,
        nls_t: summaryEdits.nls_t,
        transfer_out_m: summaryEdits.transfer_out_m,
        transfer_out_f: summaryEdits.transfer_out_f,
        transfer_out_t: summaryEdits.transfer_out_t,
        transfer_in_m: summaryEdits.transfer_in_m,
        transfer_in_f: summaryEdits.transfer_in_f,
        transfer_in_t: summaryEdits.transfer_in_t
      }
    })
  })
}

function goBack() {
  record.value = null
}

async function updateDay(entry, day, status) {
  // If setting E mark, auto-set x on all prior school days
  if (status === 'E') {
    for (let d = 1; d < day; d++) {
      if (isDisabled(d)) continue
      if (!entry.days[String(d)]) {
        entry.days[String(d)] = 'A'
        await store.updateMonthlyEntry(record.value.id, entry.studentId, d, 'A', auth.user?.id, auth.user?.role)
      }
    }
  }
  entry.days[day] = status
  await store.updateMonthlyEntry(record.value.id, entry.studentId, day, status, auth.user?.id, auth.user?.role)
  const res = await store.fetchMonthly(form.grade, form.section, form.month, form.year, effectiveSchoolId.value || undefined)
  if (res) {
    const updated = res.entries.find(e => e.studentId === entry.studentId)
    if (updated) {
      entry.present = updated.present
      entry.absent = updated.absent
    }
  }
  refreshSummaryFromLive()
}

function refreshSummaryFromLive(shouldSave = true) {
  const s = summaryData.value
  if (!s) return
  summaryEdits.reg_m = s.registeredLearners.m
  summaryEdits.reg_f = s.registeredLearners.f
  summaryEdits.reg_t = s.registeredLearners.total
  summaryEdits.late_m = s.lateEnrolment.m
  summaryEdits.late_f = s.lateEnrolment.f
  summaryEdits.late_t = s.lateEnrolment.total
  summaryEdits.pct_enr_m = s.pctEnrolment.m
  summaryEdits.pct_enr_f = s.pctEnrolment.f
  summaryEdits.pct_enr_t = s.pctEnrolment.total
  summaryEdits.pct_m = s.pctAttendance.m
  summaryEdits.pct_f = s.pctAttendance.f
  summaryEdits.pct_t = s.pctAttendance.total
  summaryEdits.ada_m = s.avgDailyAttendance.m
  summaryEdits.ada_f = s.avgDailyAttendance.f
  summaryEdits.ada_t = s.avgDailyAttendance.total
  summaryEdits.abs5_m = s.absent5.m
  summaryEdits.abs5_f = s.absent5.f
  summaryEdits.abs5_t = s.absent5.total
  if (shouldSave) saveSummary()
}

function recalculateSummary(showToast = false) {
  initSummaryEdits()
  refreshSummaryFromLive(true)
  if (showToast) {
    notify('Summary table recalculated and updated from class roster.', 'success')
  }
}

async function toggleExcludeDate(d) {
  if (!record.value) return
  const excluded = record.value.excluded_dates || []
  const idx = excluded.indexOf(d)
  if (idx >= 0) {
    excluded.splice(idx, 1)
  } else {
    excluded.push(d)
    for (const entry of record.value.entries) {
      if (entry.days[d]) {
        delete entry.days[d]
        await store.updateMonthlyEntry(record.value.id, entry.studentId, d, '', auth.user?.id, auth.user?.role)
      }
    }
  }
  await fetch(`/api/monthly/${record.value.id}/excluded-dates`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: auth.user?.id || '',
      userRole: auth.user?.role || '',
      ...(effectiveSchoolId.value ? { schoolId: effectiveSchoolId.value } : {}),
      excluded_dates: excluded
    })
  })
  const res = await store.fetchMonthly(form.grade, form.section, form.month, form.year, effectiveSchoolId.value || undefined)
  if (res) {
    if (res.entries) {
      for (const e of res.entries) {
        e.gender = studentsLookup.value[e.studentId] || e.gender || ''
      }
    }
    record.value = res
    initSummaryEdits()
    refreshSummaryFromLive()
  }
}

const syncingCalendar = ref(false)

async function handleSyncCalendar() {
  if (!record.value?.id) return
  syncingCalendar.value = true
  try {
    const res = await store.syncMonthlyCalendar(
      record.value.id,
      auth.user?.id,
      auth.user?.role,
      effectiveSchoolId.value || undefined
    )
    if (res?.success) {
      const refreshed = await store.fetchMonthly(
        form.grade,
        form.section,
        form.month,
        form.year,
        effectiveSchoolId.value || undefined,
        { throwOnError: true }
      )
      if (refreshed) {
        for (const entry of refreshed.entries || []) {
          entry.gender = studentsLookup.value[entry.studentId] || entry.gender || ''
        }
        record.value = refreshed
      }
      notify(`Calendar events synced (${res.synced_events?.length || 0} holidays/suspensions excluded)`, 'success')
    }
  } catch (err) {
    notify(err.message || 'Failed to sync calendar events', 'error')
  } finally {
    syncingCalendar.value = false
  }
}

const showDeleteConfirmModal = ref(false)
const deletingReport = ref(false)
const syncingRoster = ref(false)

async function handleDeleteReport() {
  if (!record.value?.id) return
  deletingReport.value = true
  try {
    const sid = effectiveSchoolId.value
    await store.deleteMonthly(record.value.id, sid || undefined)
    notify(`Monthly SF2 report for ${months[form.month - 1]} ${form.year} deleted.`, 'success')
    showDeleteConfirmModal.value = false
    record.value = null
    await loadRecord()
  } catch (err) {
    notify(err.message || 'Failed to delete monthly report', 'error')
  } finally {
    deletingReport.value = false
  }
}

async function handleSyncRoster() {
  if (!record.value?.id) return
  syncingRoster.value = true
  try {
    const sid = effectiveSchoolId.value
    const lastDay = new Date(form.year, form.month, 0).getDate()
    const monthEnd = `${form.year}-${String(form.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const [unifiedRoster, currentStudents, historicalStudents] = await Promise.all([
      store.getClassRoster(form.grade, form.section, sid || undefined).catch(() => []),
      store.getStudents({ grade: form.grade, section: form.section, includeWithdrawn: 'true' }, sid || undefined).catch(() => []),
      store.getStudents({ grade: form.grade, section: form.section, includeWithdrawn: 'true', asOf: monthEnd }, sid || undefined).catch(() => [])
    ])

    const studentMap = new Map()
    for (const s of (unifiedRoster || [])) if (s?.id) studentMap.set(String(s.id), s)
    for (const s of (currentStudents || [])) if (s?.id && !studentMap.has(String(s.id))) studentMap.set(String(s.id), s)
    for (const s of (historicalStudents || [])) if (s?.id && !studentMap.has(String(s.id))) studentMap.set(String(s.id), s)

    const allStudents = Array.from(studentMap.values())
    const existingIds = new Set((record.value.entries || []).map(e => String(e.studentId || '')))
    const existingNames = new Set((record.value.entries || []).map(e => (e.name || '').trim().toLowerCase()))

    const missing = allStudents.filter(s => !existingIds.has(String(s.id)) && !existingNames.has((s.name || '').trim().toLowerCase()))

    if (missing.length === 0) {
      notify('All learners are already included in this report.', 'info')
      return
    }

    const lookup = studentsLookup.value || {}
    for (const s of missing) {
      record.value.entries.push({
        studentId: s.id,
        name: s.name,
        gender: s.gender || lookup[s.id] || '',
        days: {},
        present: 0,
        absent: 0,
        remarks: '',
        late_enrollee: 1
      })
    }

    const sortAlpha = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    const bList = record.value.entries.filter(e => normalizeGender(e.gender) === 'male').sort(sortAlpha)
    const gList = record.value.entries.filter(e => normalizeGender(e.gender) === 'female').sort(sortAlpha)
    const uList = record.value.entries.filter(e => !normalizeGender(e.gender)).sort(sortAlpha)
    record.value.entries = [...bList, ...gList, ...uList]

    await store.saveMonthly(record.value, auth.user, sid || undefined)
    const refreshed = await store.fetchMonthly(form.grade, form.section, form.month, form.year, sid || undefined)
    if (refreshed) {
      record.value = refreshed
      initSummaryEdits()
      refreshSummaryFromLive(true)
    }
    notify(`Added ${missing.length} learner${missing.length > 1 ? 's' : ''} to this monthly report.`, 'success')
  } catch (err) {
    notify(err.message || 'Failed to sync learners', 'error')
  } finally {
    syncingRoster.value = false
  }
}

async function updateRemarks(entry) {
  await store.updateMonthlyRemarks(record.value.id, entry.studentId, entry.remarks)
}
</script>

<style scoped>
.saturday-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.saturday-toggle.active {
  border-color: var(--primary);
  color: var(--primary);
}

.sheet-setting {
  margin: 0;
}

.sync-calendar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
}

/* Calendar Events Strip */
.calendar-events-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 16px;
  margin: 12px 0 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs);
}

.calendar-events-strip-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.calendar-event-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.calendar-event-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  border: 1px solid var(--border);
  background: var(--secondary);
  color: var(--secondary-foreground);
}

.pill--holiday {
  background: var(--warning-bg);
  color: var(--warning);
  border-color: color-mix(in srgb, var(--warning) 30%, var(--border));
}

.pill--suspension {
  background: var(--red-bg);
  color: var(--destructive);
  border-color: color-mix(in srgb, var(--destructive) 30%, var(--border));
}

.pill--event {
  background: var(--info-bg);
  color: var(--info);
  border-color: color-mix(in srgb, var(--info) 30%, var(--border));
}
.validation-status {
  font-weight: 800;
}

.validation-status--valid {
  color: var(--success);
}

.validation-status--warning {
  color: var(--warning);
}

.validation-message {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.validation-message--error {
  background: var(--red-bg);
  color: var(--destructive);
}

.validation-message--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

@media (max-width: 720px) {
  .sheet-info {
    align-items: stretch;
  }

  .sheet-info > span,
  .sheet-info > .sheet-setting {
    max-width: 100%;
  }

  .sheet-setting,
  .sync-calendar-btn {
    justify-content: center;
    width: 100%;
  }

  .adviser-input {
    max-width: 100%;
  }

  .calendar-events-strip-title,
  .calendar-event-pills {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .form-card[style*="max-width"] {
    max-width: none !important;
  }

  .sheet-info > span {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .summary-filters-bar {
    grid-template-columns: 1fr;
  }
}
</style>
