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

      <div class="form-card generator-card">
        <div class="card-header-clean">
          <div class="card-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <h3>Generate SF2 Monthly Report</h3>
            <p class="card-subtitle">Select class grade, section, and month to view or generate the monthly attendance sheet.</p>
          </div>
        </div>
        <div class="form-group" v-if="auth.isSuperadmin">
          <label>School</label>
          <select v-model="selectedSchoolId" required @change="onSchoolChange">
            <option value="">None</option>
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}</option>
          </select>
        </div>
        <div class="form-row generator-form-row">
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
        <div class="calendar-config-card">
          <div class="calendar-config-row">
            <div class="calendar-config-info">
              <span class="calendar-config-title">Reporting Schedule</span>
              <span class="calendar-config-desc">Include Saturday columns if weekend sessions or make-up classes were held.</span>
            </div>
            <button
              type="button"
              class="sf2-btn sf2-btn--toggle saturday-toggle-btn"
              :class="{ 'is-active': form.includeSaturdays }"
              :aria-pressed="form.includeSaturdays"
              @click="form.includeSaturdays = !form.includeSaturdays"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="17" rx="2"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <span>Saturdays</span>
              <span class="toggle-status-badge" :class="{ 'is-on': form.includeSaturdays }">
                {{ form.includeSaturdays ? 'ON' : 'OFF' }}
              </span>
            </button>
          </div>
          <div class="calendar-note-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Sunday remains disabled. Existing reports keep their current setting.</span>
          </div>
        </div>
        <div class="form-actions">
          <button @click="openMonthly" class="sf2-btn sf2-btn--primary sf2-btn--lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <span>Generate SF2</span>
          </button>
        </div>
        <p v-if="loadError" class="error-msg">{{ loadError }}</p>
      </div>
    </div>

    <div v-else class="sheet-container">
      <div class="sheet-header">
        <div class="school-info">
          <h1>{{ school.school_name }}</h1>
          <div class="school-sub-row">
            <span class="school-id-badge">School ID: {{ school.school_id }}</span>
            <span v-if="school.school_address" class="school-address-badge">{{ school.school_address }}</span>
          </div>
        </div>
      </div>
      <div class="sheet-date-pill-wrap">
        <div class="sheet-date">{{ months[form.month-1] }} {{ form.year }}</div>
      </div>
      <h2 class="sheet-title">MONTHLY ATTENDANCE RECORD</h2>
      <!-- Metadata Bar -->
      <div class="sheet-info sheet-info-bar">
        <div class="sheet-meta-group">
          <span class="sheet-badge"><strong>Grade:</strong> {{ record.grade }}</span>
          <span class="sheet-badge"><strong>Section:</strong> {{ record.section }}</span>
          <span class="sheet-badge sheet-badge--muted"><strong>Month:</strong> {{ months[form.month-1] }} {{ form.year }}</span>
        </div>
        <div class="sheet-signatories-group">
          <label class="signatory-label">
            <span>Adviser:</span>
            <input v-model="record.adviser" @change="saveSummary" class="adviser-input" placeholder="Adviser name" />
          </label>
          <label class="signatory-label">
            <span>School Head:</span>
            <input v-model="record.schoolHead" @change="saveSummary" class="adviser-input" placeholder="School head name" />
          </label>
        </div>
      </div>

      <!-- Operational Toolbar (Screen only) -->
      <div class="sheet-toolbar screen-only">
        <div class="sheet-toolbar-left">
          <!-- Total School Days pill control -->
          <div class="school-days-pill">
            <div class="pill-label-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <label for="manual-school-days" class="school-days-label">School Days:</label>
            </div>
            <input
              id="manual-school-days"
              type="number"
              min="1"
              max="31"
              :value="customSchoolDays !== null ? customSchoolDays : schoolDays"
              @change="handleSchoolDaysChange($event.target.value)"
              class="school-days-input"
              title="Directly enter or override total school days for this month"
            />
            <button
              v-if="customSchoolDays !== null && customSchoolDays !== schoolDays"
              type="button"
              class="sf2-btn sf2-btn--xs sf2-btn--secondary btn-reset-days"
              @click="resetSchoolDays"
              title="Reset to calendar count"
            >
              Reset ({{ schoolDays }})
            </button>
          </div>

          <!-- Add Holiday / Suspension Button -->
          <button
            type="button"
            class="sf2-btn sf2-btn--secondary add-holiday-btn"
            @click="openAddHolidayModal()"
            title="Exclude a date as a holiday or class suspension"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>+ Holiday / Suspension</span>
          </button>

          <!-- Saturdays Toggle Button -->
          <button
            type="button"
            class="sf2-btn sf2-btn--toggle saturday-toggle-btn"
            :class="{ 'is-active': record.include_saturdays }"
            :aria-pressed="record.include_saturdays"
            @click="updateIncludeSaturdays(!record.include_saturdays)"
            title="Toggle Saturday reporting for make-up classes"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="17" rx="2"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <span>Saturdays</span>
            <span class="toggle-status-badge" :class="{ 'is-on': record.include_saturdays }">
              {{ record.include_saturdays ? 'ON' : 'OFF' }}
            </span>
          </button>
        </div>

        <div class="sheet-toolbar-right">
          <!-- Sync Calendar Button -->
          <button
            type="button"
            class="sf2-btn sf2-btn--secondary sync-calendar-btn"
            :disabled="syncingCalendar"
            title="Import official school calendar holidays and suspensions into excluded school days"
            @click="handleSyncCalendar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span>{{ syncingCalendar ? 'Syncing…' : 'Sync Calendar' }}</span>
          </button>

          <!-- Sync Students Button -->
          <button
            type="button"
            class="sf2-btn sf2-btn--secondary sync-roster-btn"
            :disabled="syncingRoster"
            title="Sync with school roster to automatically add missing learners without losing existing attendance marks"
            @click="handleSyncRoster"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            <span>{{ syncingRoster ? 'Syncing…' : 'Sync Students' }}</span>
          </button>

          <!-- Delete Report Button -->
          <button
            type="button"
            class="sf2-btn sf2-btn--danger delete-report-btn"
            :disabled="deletingReport"
            title="Delete this saved monthly SF2 report so you can generate a fresh report"
            @click="showDeleteConfirmModal = true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>{{ deletingReport ? 'Deleting…' : 'Delete Report' }}</span>
          </button>
        </div>
      </div>

      <!-- Schedule Settings Note Card -->
      <div class="sheet-settings-note-card">
        <div class="settings-note-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <div class="settings-note-text">
          <span>Sunday remains disabled. Existing reports keep their current setting.</span>
        </div>
      </div>

      <!-- School Calendar Events & Suspensions Strip -->
      <div v-if="(record.calendar_events && record.calendar_events.length) || hasCustomHolidays" class="calendar-events-strip">
        <div class="calendar-events-strip-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Holidays &amp; Suspensions ({{ months[form.month-1] }} {{ form.year }}):</span>
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
          <span
            v-for="(label, d) in customHolidayList"
            :key="'custom-'+d"
            class="calendar-event-pill pill--holiday custom-holiday-pill"
            :title="`Click to edit holiday or restore day: Day ${d}`"
            @click="openEditHolidayModal(Number(d))"
          >
            <strong>Day {{ d }}</strong>: {{ label }} (Holiday) ✎
          </span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="attendance-table monthly-table">
          <thead>
            <tr>
              <th rowspan="2" class="no-col">No.</th>
              <th rowspan="2" class="name-col">NAME (Last Name, First Name, Middle Name)</th>
              <th v-for="d in daysInMonth" :key="d" :class="{ weekend: isWeekend(d), excluded: isExcluded(d) }">
                <div class="date-cell-head">
                  <span class="date-num">{{ d }}</span>
                  <button
                    v-if="!isWeekend(d)"
                    @click="handleDateHeaderClick(d)"
                    class="exclude-btn"
                    :class="{ 'is-excluded': isExcluded(d) }"
                    :title="isExcluded(d) ? `Restore date or edit holiday (${holidayLabels[d] || 'No classes'})` : 'Mark as holiday / suspension'"
                    type="button"
                    :aria-label="isExcluded(d) ? `Restore date ${d}` : `Exclude date ${d}`"
                  >
                    <svg v-if="isExcluded(d)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    <svg v-else width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </th>
              <th colspan="2">Total for the Month ({{ effectiveSchoolDays }})</th>
              <th rowspan="2">Remarks</th>
            </tr>
            <tr>
              <th v-for="d in daysInMonth" :key="'d'+d" :class="{ weekend: isWeekend(d), excluded: isExcluded(d) }">
                <template v-if="isExcluded(d)">
                  <span class="holiday-col-title" :title="holidayLabels[d] || 'No classes'">{{ holidayLabels[d] || 'No classes' }}</span>
                </template>
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
                <td class="no-col">{{ startNum(gi) + idx }}</td>
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
        <div class="summary-header-row">
          <h3>SUMMARY</h3>
          <button
            type="button"
            @click="recalculateSummary(true)"
            class="sf2-btn sf2-btn--secondary sf2-btn--sm"
            title="Recalculate summary metrics from current learner roster and daily attendance marks"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span>Recalculate Summary</span>
          </button>
        </div>
        <div class="summary-table-wrap">
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
      </div>

      <div class="legends">
        <div class="legends-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <h3>LEGENDS &amp; CODES:</h3>
        </div>
        <div class="legend-grid">
          <div class="legend-chip">
            <span class="legend-symbol legend-symbol--blank"></span>
            <span class="legend-label"><strong>(blank)</strong> - Present</span>
          </div>
          <div class="legend-chip">
            <span class="legend-symbol legend-symbol--absent">✕</span>
            <span class="legend-label"><strong>x</strong> - Absent</span>
          </div>
          <div class="legend-chip">
            <span class="legend-symbol legend-symbol--tardy">◤</span>
            <span class="legend-label"><strong>◤</strong> - Tardy</span>
          </div>
          <div class="legend-chip">
            <span class="legend-symbol legend-symbol--half">◢</span>
            <span class="legend-label"><strong>◢</strong> - Half Day</span>
          </div>
          <div class="legend-chip">
            <span class="legend-symbol legend-symbol--entered">E</span>
            <span class="legend-label"><strong>E</strong> - Entered</span>
          </div>
        </div>
        <p class="legend-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>Sunday is always disabled. Saturday is configurable for this report. Other dates with no classes are grayed out and disabled. Click the exclude icon on a date header to mark it as a holiday or class suspension.</span>
        </p>
      </div>

      <div class="sheet-actions screen-only">
        <div class="sheet-actions-left">
          <button @click="goBack" class="sf2-btn sf2-btn--secondary sf2-btn--lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span>Back to Selection</span>
          </button>
        </div>
        <div class="sheet-actions-right">
          <button @click="runPreExportValidation" class="sf2-btn sf2-btn--secondary sf2-btn--lg" :disabled="validatingExport">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>{{ validatingExport ? 'Validating…' : 'Validate Data' }}</span>
          </button>
          <button @click="exportToSF2" class="sf2-btn sf2-btn--primary sf2-btn--lg" :disabled="exporting">
            <span v-if="exporting" class="spinner" style="margin-right: 6px;"></span>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>{{ exporting ? 'Exporting...' : 'Export to SF2 (Excel)' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- SF2 Export Validation Modal -->
    <div v-if="showValidationModal" class="modal-overlay" @click.self="showValidationModal = false">
      <div class="form-card modal-card" style="max-width: 520px;">
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
          <button @click="showValidationModal = false; exportToSF2()" class="sf2-btn sf2-btn--primary" :disabled="exporting">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export SF2 Excel Now</span>
          </button>
          <button @click="showValidationModal = false" class="sf2-btn sf2-btn--secondary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Monthly Report Modal -->
    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click.self="showDeleteConfirmModal = false">
      <div class="form-card modal-card" style="max-width: 480px;">
        <h3 style="color: var(--destructive, #ef4444);">Delete Monthly SF2 Report?</h3>
        <p class="modal-subtext">
          Are you sure you want to delete the saved SF2 report for <strong>{{ months[form.month-1] }} {{ form.year }}</strong> ({{ record?.grade }} - {{ record?.section }})?
        </p>
        <p style="font-size: 13px; color: var(--muted-foreground); margin: 8px 0 16px;">
          This will remove the saved report and all its attendance marks for this month so you can generate a fresh report with the latest class roster.
        </p>
        <div class="form-actions">
          <button type="button" @click="handleDeleteReport" class="sf2-btn sf2-btn--danger" :disabled="deletingReport">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>{{ deletingReport ? 'Deleting…' : 'Yes, Delete Report' }}</span>
          </button>
          <button type="button" @click="showDeleteConfirmModal = false" class="sf2-btn sf2-btn--secondary" :disabled="deletingReport">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Add / Edit Holiday / Suspension Modal -->
    <div v-if="showHolidayModal" class="modal-overlay" @click.self="showHolidayModal = false">
      <div class="form-card modal-card" style="max-width: 480px;">
        <div class="modal-header-compact">
          <h3>{{ holidayForm.isEditing ? 'Edit Holiday / Suspension' : 'Exclude Holiday or Class Suspension' }}</h3>
          <p class="modal-subtext">Exclude this date so it won't be counted in total school days or attendance calculation.</p>
        </div>

        <form @submit.prevent="submitHolidayModal" style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
          <div class="form-group">
            <label>Day of Month (1 - {{ daysInMonth }})</label>
            <select v-model.number="holidayForm.day" required :disabled="holidayForm.isEditing">
              <option v-for="d in daysInMonth" :key="d" :value="d">
                Day {{ d }} ({{ dayLabels[(new Date(form.year, form.month - 1, d)).getDay()] }}){{ isWeekend(d) ? ' - Weekend' : '' }}{{ isExcluded(d) ? ' (Currently Excluded)' : '' }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Holiday or Suspension Reason</label>
            <input
              type="text"
              v-model="holidayForm.label"
              placeholder="e.g. National Heroes Day, Typhoon Suspension"
              required
              class="holiday-label-input"
            />
          </div>

          <div class="form-actions" style="margin-top: 10px; display: flex; justify-content: space-between; gap: 8px;">
            <div style="display: flex; gap: 8px;">
              <button type="submit" class="sf2-btn sf2-btn--primary" :disabled="savingHoliday">
                <span>{{ savingHoliday ? 'Saving…' : (holidayForm.isEditing ? 'Update Holiday' : 'Exclude Date') }}</span>
              </button>
              <button
                v-if="holidayForm.isEditing"
                type="button"
                @click="removeHoliday(holidayForm.day)"
                class="sf2-btn sf2-btn--danger"
                :disabled="savingHoliday"
                title="Restore this date back to a regular school day"
              >
                <span>Restore Regular Day</span>
              </button>
            </div>
            <button type="button" @click="showHolidayModal = false" class="sf2-btn sf2-btn--secondary">
              Cancel
            </button>
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
const customSchoolDays = ref(null)
const holidayLabels = ref({})
const showHolidayModal = ref(false)
const savingHoliday = ref(false)
const holidayForm = reactive({ day: 1, label: '', isEditing: false })
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
    if (route.query.schoolId && auth.isSuperadmin) {
      selectedSchoolId.value = String(route.query.schoolId)
      await loadGradeLevels(selectedSchoolId.value)
      applyGradeDefaults()
    }
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
          schoolDays: effectiveSchoolDays.value,
          holiday_labels: holidayLabels.value,
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

const effectiveSchoolDays = computed(() => {
  if (customSchoolDays.value !== null && Number(customSchoolDays.value) > 0) {
    return Number(customSchoolDays.value)
  }
  return schoolDays.value
})

const hasCustomHolidays = computed(() => Object.keys(holidayLabels.value || {}).length > 0)
const customHolidayList = computed(() => holidayLabels.value || {})

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
  return Math.max(0, effectiveSchoolDays.value - entryAbsent(entry))
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
  const sd = effectiveSchoolDays.value || 1
  const mADA = Math.floor((mPresent / sd) * 100) / 100
  const fADA = Math.floor((fPresent / sd) * 100) / 100
  const tADA = Math.floor(((mPresent + fPresent) / sd) * 100) / 100
  const mInit = mCount - lateM
  const fInit = fCount - lateF
  const tInit = mInit + fInit
  const isTransferredOut = (r) => /transferred\s*out/i.test(String(r || ''))
  const mTransferredOut = boys ? boys.entries.filter(e => isTransferredOut(e.remarks)).length : 0
  const fTransferredOut = girls ? girls.entries.filter(e => isTransferredOut(e.remarks)).length : 0
  const otherTransferredOut = record.value.entries.filter(e => !['male', 'female'].includes(normalizeGender(e.gender)) && isTransferredOut(e.remarks)).length
  const tTransferredOut = mTransferredOut + fTransferredOut + otherTransferredOut
  const mReg = Math.max(0, mCount - mTransferredOut)
  const fReg = Math.max(0, fCount - fTransferredOut)
  const tReg = mReg + fReg

  return {
    enrollment: { m: mInit, f: fInit, total: tInit },
    lateEnrolment: {
      m: record.value.entries.filter(e => e.late_enrollee && normalizeGender(e.gender) === 'male').length,
      f: record.value.entries.filter(e => e.late_enrollee && normalizeGender(e.gender) === 'female').length,
      total: record.value.entries.filter(e => e.late_enrollee).length
    },
    transferredOut: { m: mTransferredOut, f: fTransferredOut, total: tTransferredOut },
    registeredLearners: { m: mReg, f: fReg, total: tReg },
    pctEnrolment: {
      m: mInit > 0 ? Math.round((mReg / mInit) * 1000) / 10 : (mReg > 0 ? 100 : 0),
      f: fInit > 0 ? Math.round((fReg / fInit) * 1000) / 10 : (fReg > 0 ? 100 : 0),
      total: tInit > 0 ? Math.round((tReg / tInit) * 1000) / 10 : (tReg > 0 ? 100 : 0)
    },
    avgDailyAttendance: { m: mADA, f: fADA, total: tADA },
    pctAttendance: {
      m: mReg ? Math.floor((mPresent / sd / mReg) * 100 * 100) / 100 : 0,
      f: fReg ? Math.floor((fPresent / sd / fReg) * 100 * 100) / 100 : 0,
      total: tReg ? Math.floor(((mPresent + fPresent) / sd / tReg) * 100 * 100) / 100 : 0
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
    const entries = record.value?.entries || []
    const mCount = entries.filter(e => normalizeGender(e.gender) === 'male').length
    const fCount = entries.filter(e => normalizeGender(e.gender) === 'female').length
    summaryEdits.reg_m = Math.max(0, mCount - (Number(summaryEdits.transfer_out_m) || 0))
    summaryEdits.reg_f = Math.max(0, fCount - (Number(summaryEdits.transfer_out_f) || 0))
    summaryEdits.reg_t = summaryEdits.reg_m + summaryEdits.reg_f
    summaryEdits.pct_enr_m = summaryEdits.enr_m > 0
      ? Math.round((summaryEdits.reg_m / summaryEdits.enr_m) * 1000) / 10
      : (summaryEdits.reg_m > 0 ? 100 : 0)
    summaryEdits.pct_enr_f = summaryEdits.enr_f > 0
      ? Math.round((summaryEdits.reg_f / summaryEdits.enr_f) * 1000) / 10
      : (summaryEdits.reg_f > 0 ? 100 : 0)
    summaryEdits.pct_enr_t = summaryEdits.enr_t > 0
      ? Math.round((summaryEdits.reg_t / summaryEdits.enr_t) * 1000) / 10
      : (summaryEdits.reg_t > 0 ? 100 : 0)
  } else if (field === 'transfer_in') {
    summaryEdits.transfer_in_t = (Number(summaryEdits.transfer_in_m) || 0) + (Number(summaryEdits.transfer_in_f) || 0)
  } else if (field === 'abs5') {
    summaryEdits.abs5_t = (Number(summaryEdits.abs5_m) || 0) + (Number(summaryEdits.abs5_f) || 0)
  } else if (field === 'ada') {
    summaryEdits.ada_t = Math.round(((Number(summaryEdits.ada_m) || 0) + (Number(summaryEdits.ada_f) || 0)) * 100) / 100
  }
  saveSummary()
}

function handleSchoolDaysChange(val) {
  const num = parseInt(val, 10)
  if (!isNaN(num) && num > 0 && num <= 31) {
    customSchoolDays.value = num
  } else if (!val || val === '') {
    customSchoolDays.value = null
  }
  refreshSummaryFromLive(true)
}

function resetSchoolDays() {
  customSchoolDays.value = null
  refreshSummaryFromLive(true)
}

function openAddHolidayModal(preferredDay) {
  holidayForm.isEditing = false
  holidayForm.day = preferredDay || 1
  holidayForm.label = ''
  showHolidayModal.value = true
}

function openEditHolidayModal(day) {
  holidayForm.isEditing = true
  holidayForm.day = day
  holidayForm.label = holidayLabels.value[day] || ''
  showHolidayModal.value = true
}

function handleDateHeaderClick(d) {
  if (isExcluded(d)) {
    openEditHolidayModal(d)
  } else {
    openAddHolidayModal(d)
  }
}

async function submitHolidayModal() {
  if (!record.value) return
  savingHoliday.value = true
  try {
    const day = Number(holidayForm.day)
    const label = (holidayForm.label || '').trim() || 'Holiday'
    const excluded = Array.from(new Set([...(record.value.excluded_dates || []), day])).sort((a, b) => a - b)

    holidayLabels.value[day] = label

    if (record.value.entries) {
      for (const entry of record.value.entries) {
        if (entry.days && entry.days[day]) {
          delete entry.days[day]
          await store.updateMonthlyEntry(record.value.id, entry.studentId, day, '', auth.user?.id, auth.user?.role)
        }
      }
    }

    const res = await fetch(`/api/monthly/${record.value.id}/excluded-dates`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: auth.user?.id || '',
        userRole: auth.user?.role || '',
        ...(effectiveSchoolId.value ? { schoolId: effectiveSchoolId.value } : {}),
        excluded_dates: excluded,
        holiday_labels: holidayLabels.value
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to save holiday')
    }

    const json = await res.json()
    record.value.excluded_dates = json.excluded_dates || excluded
    if (json.holiday_labels) {
      holidayLabels.value = { ...json.holiday_labels }
    }
    if (!record.value.summary_data) record.value.summary_data = {}
    record.value.summary_data.holiday_labels = { ...holidayLabels.value }

    const refreshed = await store.fetchMonthly(form.grade, form.section, form.month, form.year, effectiveSchoolId.value || undefined)
    if (refreshed) {
      for (const entry of refreshed.entries || []) {
        entry.gender = studentsLookup.value[entry.studentId] || entry.gender || ''
      }
      record.value = refreshed
    }

    showHolidayModal.value = false
    refreshSummaryFromLive(true)
    notify(`Day ${day} (${label}) excluded from school days.`, 'success')
  } catch (err) {
    notify(err.message || 'Failed to update holiday', 'error')
  } finally {
    savingHoliday.value = false
  }
}

async function removeHoliday(day) {
  if (!record.value) return
  savingHoliday.value = true
  try {
    const d = Number(day)
    const excluded = (record.value.excluded_dates || []).filter(x => Number(x) !== d)
    delete holidayLabels.value[d]

    const res = await fetch(`/api/monthly/${record.value.id}/excluded-dates`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: auth.user?.id || '',
        userRole: auth.user?.role || '',
        ...(effectiveSchoolId.value ? { schoolId: effectiveSchoolId.value } : {}),
        excluded_dates: excluded,
        holiday_labels: holidayLabels.value
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to restore day')
    }

    const json = await res.json()
    record.value.excluded_dates = json.excluded_dates || excluded
    if (json.holiday_labels) {
      holidayLabels.value = { ...json.holiday_labels }
    }
    if (!record.value.summary_data) record.value.summary_data = {}
    record.value.summary_data.holiday_labels = { ...holidayLabels.value }

    const refreshed = await store.fetchMonthly(form.grade, form.section, form.month, form.year, effectiveSchoolId.value || undefined)
    if (refreshed) {
      for (const entry of refreshed.entries || []) {
        entry.gender = studentsLookup.value[entry.studentId] || entry.gender || ''
      }
      record.value = refreshed
    }

    showHolidayModal.value = false
    refreshSummaryFromLive(true)
    notify(`Day ${d} restored as regular school day.`, 'success')
  } catch (err) {
    notify(err.message || 'Failed to restore day', 'error')
  } finally {
    savingHoliday.value = false
  }
}

function initSummaryEdits() {
  if (!record.value) return
  const sd = record.value.summary_data || {}
  const s = summaryData.value || {}

  if (sd.schoolDays !== undefined && sd.schoolDays !== null && Number(sd.schoolDays) > 0) {
    customSchoolDays.value = Number(sd.schoolDays)
  } else if (sd.school_days !== undefined && sd.school_days !== null && Number(sd.school_days) > 0) {
    customSchoolDays.value = Number(sd.school_days)
  } else {
    customSchoolDays.value = null
  }
  const hl = (sd.holiday_labels && typeof sd.holiday_labels === 'object')
    ? sd.holiday_labels
    : ((record.value.holiday_labels && typeof record.value.holiday_labels === 'object') ? record.value.holiday_labels : {})
  holidayLabels.value = { ...hl }

  const entries = record.value.entries || []
  const mCount = entries.filter(e => normalizeGender(e.gender) === 'male').length
  const fCount = entries.filter(e => normalizeGender(e.gender) === 'female').length
  const lateM = entries.filter(e => e.late_enrollee && normalizeGender(e.gender) === 'male').length
  const lateF = entries.filter(e => e.late_enrollee && normalizeGender(e.gender) === 'female').length

  const isTransferredOut = (r) => /transferred\s*out/i.test(String(r || ''))
  const mTransferredOut = entries.filter(e => isTransferredOut(e.remarks) && normalizeGender(e.gender) === 'male').length
  const fTransferredOut = entries.filter(e => isTransferredOut(e.remarks) && normalizeGender(e.gender) === 'female').length

  summaryEdits.transfer_out_m = Math.max(Number(sd.transfer_out_m) || 0, mTransferredOut)
  summaryEdits.transfer_out_f = Math.max(Number(sd.transfer_out_f) || 0, fTransferredOut)
  summaryEdits.transfer_out_t = (Number(summaryEdits.transfer_out_m) || 0) + (Number(summaryEdits.transfer_out_f) || 0)

  // Registered learners = class entries count minus transferred out
  summaryEdits.reg_m = Math.max(0, mCount - summaryEdits.transfer_out_m)
  summaryEdits.reg_f = Math.max(0, fCount - summaryEdits.transfer_out_f)
  summaryEdits.reg_t = summaryEdits.reg_m + summaryEdits.reg_f

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
        schoolDays: effectiveSchoolDays.value,
        holiday_labels: holidayLabels.value,
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
  if (s.transferredOut) {
    summaryEdits.transfer_out_m = Math.max(Number(summaryEdits.transfer_out_m) || 0, s.transferredOut.m)
    summaryEdits.transfer_out_f = Math.max(Number(summaryEdits.transfer_out_f) || 0, s.transferredOut.f)
    summaryEdits.transfer_out_t = summaryEdits.transfer_out_m + summaryEdits.transfer_out_f
  }
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
    delete holidayLabels.value[d]
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
      excluded_dates: excluded,
      holiday_labels: holidayLabels.value
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
    await openMonthly()
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
  try {
    const res = await store.updateMonthlyRemarks(record.value.id, entry.studentId, entry.remarks)
    if (res?.summary_data) {
      record.value.summary_data = res.summary_data
      initSummaryEdits()
      refreshSummaryFromLive(false)
    } else {
      refreshSummaryFromLive(true)
    }
    if (res?.withdrawn) {
      notify(`Learner "${entry.name}" marked TRANSFERRED OUT: status updated to Withdrawn and registered learners updated.`, 'success')
    }
  } catch (err) {
    notify(err.message || 'Failed to update remarks', 'error')
  }
}
</script>

<style scoped>
/* SF2 Generator Card */
.generator-card {
  max-width: 860px;
  margin: 0 auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 12px);
  background: var(--card);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.04));
  padding: clamp(18px, 3vw, 28px);
}

.card-header-clean {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.card-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm, 8px);
  background: var(--primary-bg, rgba(12, 83, 87, 0.1));
  color: var(--primary);
  flex-shrink: 0;
}

.card-header-clean h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1.2;
}

.card-subtitle {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: var(--muted-foreground);
}

.generator-form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

/* School Header Badges */
.school-sub-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.school-id-badge,
.school-address-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--muted);
  color: var(--muted-foreground);
  border: 1px solid var(--border);
}

.sheet-date-pill-wrap {
  display: flex;
  justify-content: center;
  margin: 8px 0 12px;
}

.sheet-date-pill-wrap .sheet-date {
  display: inline-flex;
  align-items: center;
  padding: 4px 16px;
  border-radius: 999px;
  background: var(--primary-bg, rgba(12, 83, 87, 0.08));
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
}

/* SF2 Design System Buttons */
.sf2-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-sm, 8px);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  box-sizing: border-box;
  transition: all 0.15s ease;
  user-select: none;
  line-height: 1;
}

.sf2-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.sf2-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.sf2-btn--primary {
  background: var(--primary);
  border: 1px solid var(--primary);
  color: var(--primary-foreground, #ffffff);
  box-shadow: 0 2px 6px var(--primary-glow, rgba(12, 83, 87, 0.2));
}

.sf2-btn--primary:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--primary-glow, rgba(12, 83, 87, 0.25));
}

.sf2-btn--secondary {
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--foreground);
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.sf2-btn--secondary:hover:not(:disabled) {
  background: var(--secondary);
  border-color: var(--primary);
  color: var(--primary);
}

.sf2-btn--danger {
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--destructive) 40%, var(--border));
  color: var(--destructive);
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.sf2-btn--danger:hover:not(:disabled) {
  background: var(--red-bg, rgba(217, 67, 59, 0.09));
  border-color: var(--destructive);
  color: var(--destructive-hover, #b8332c);
}

.sf2-btn--toggle {
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--muted-foreground);
  padding: 0 10px;
  gap: 8px;
}

.sf2-btn--toggle:hover:not(:disabled) {
  background: var(--secondary);
  color: var(--foreground);
}

.sf2-btn--toggle.is-active {
  background: var(--secondary);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary-glow, rgba(12, 83, 87, 0.15));
}

.toggle-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
  background: var(--muted);
  color: var(--muted-foreground);
  transition: all 0.15s ease;
}

.toggle-status-badge.is-on {
  background: var(--primary);
  color: #ffffff;
}

.sf2-btn--xs {
  min-height: 24px;
  padding: 0 6px;
  font-size: 0.68rem;
  border-radius: var(--radius-xs, 4px);
  gap: 4px;
}

.sf2-btn--sm {
  min-height: 28px;
  padding: 0 10px;
  font-size: 0.72rem;
  border-radius: var(--radius-xs, 4px);
  gap: 5px;
}

.sf2-btn--lg {
  min-height: 40px;
  padding: 0 18px;
  font-size: 0.82rem;
  border-radius: var(--radius-sm, 8px);
}

.calendar-config-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  margin: 10px 0 16px;
}

.calendar-config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.calendar-config-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.calendar-config-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--foreground);
}

.calendar-config-desc {
  font-size: 0.78rem;
  color: var(--muted-foreground);
}

.calendar-note-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-xs, 4px);
  background: var(--muted);
  border: 1px solid var(--border);
  font-size: 0.78rem;
  color: var(--muted-foreground);
}

.calendar-note-box svg {
  flex-shrink: 0;
  color: var(--primary);
}

.sheet-settings-note-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  margin: 8px 0 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--muted-foreground);
  box-shadow: var(--shadow-xs);
}

.settings-note-icon {
  display: flex;
  align-items: center;
  color: var(--primary);
}

/* Metadata Bar */
.sheet-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 8px);
  background: var(--muted);
}

.sheet-meta-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.sheet-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-xs, 4px);
  background: var(--card);
  border: 1px solid var(--border);
  font-size: 0.74rem;
  color: var(--foreground);
}

.sheet-badge--muted {
  color: var(--muted-foreground);
}

.sheet-signatories-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.signatory-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--foreground);
}

.adviser-input {
  padding: 4px 8px;
  font-size: 0.76rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs, 4px);
  background: var(--card);
  color: var(--foreground);
  min-width: 130px;
  box-sizing: border-box;
}

/* Operational Toolbar */
.sheet-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 8px);
  box-shadow: var(--shadow-xs, 0 1px 3px rgba(0, 0, 0, 0.03));
}

.sheet-toolbar-left,
.sheet-toolbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

/* School Days Pill */
.school-days-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 8px);
  padding: 3px 8px;
  min-height: 36px;
  box-sizing: border-box;
}

.pill-label-wrap {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted-foreground);
}

.school-days-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--muted-foreground);
  margin: 0;
}

.school-days-input {
  width: 44px;
  padding: 3px 4px;
  text-align: center;
  font-weight: 700;
  font-size: 0.82rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs, 4px);
  background: var(--card);
  color: var(--foreground);
  box-sizing: border-box;
}

.btn-reset-days {
  color: var(--primary);
  border-color: var(--primary);
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

.custom-holiday-pill {
  cursor: pointer;
  transition: transform 0.12s ease;
}

.custom-holiday-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Table Header Date Cell */
.date-cell-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 30px;
  position: relative;
  box-sizing: border-box;
}

.date-num {
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}

.exclude-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted-foreground);
  padding: 0;
  cursor: pointer;
  transition: all 0.12s ease;
  opacity: 0.65;
  box-sizing: border-box;
}

.exclude-btn:hover {
  opacity: 1;
  background: var(--muted);
  color: var(--destructive);
}

.exclude-btn.is-excluded {
  opacity: 1;
  color: var(--warning, #b45309);
  background: var(--warning-bg, #fef3c7);
  border-color: color-mix(in srgb, var(--warning) 35%, transparent);
}

.holiday-col-title {
  display: block;
  font-size: 0.65rem;
  line-height: 1.1;
  max-width: 38px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  color: var(--destructive, #ef4444);
}

.holiday-label-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs, 4px);
  background: var(--background);
  color: var(--foreground);
  font-size: 0.88rem;
}

/* Sticky Column 1 & 2 Fix for Monthly Table */
.monthly-table th.no-col,
.monthly-table td.no-col {
  position: sticky;
  left: 0;
  width: 44px;
  min-width: 44px;
  max-width: 44px;
  z-index: 2;
  background: var(--card) !important;
  text-align: center;
  box-sizing: border-box;
  font-size: 0.72rem;
  font-weight: 700;
}

.monthly-table th.name-col,
.monthly-table td.name-col {
  position: sticky;
  left: 44px !important; /* Offset by column 1 width to fix overlap bug */
  min-width: 220px;
  max-width: 260px;
  z-index: 2;
  background: var(--card) !important;
  box-sizing: border-box;
  border-right: 2px solid var(--border) !important;
}

/* Corner Headers (sticky top AND sticky left) */
.monthly-table thead th.no-col {
  top: 0;
  left: 0;
  z-index: 6 !important;
  background: var(--muted) !important;
}

.monthly-table thead th.name-col {
  top: 0;
  left: 44px !important;
  z-index: 6 !important;
  background: var(--muted) !important;
  border-right: 2px solid var(--border) !important;
}

/* Sticky cell hover effect */
.monthly-table tbody tr:hover td.no-col,
.monthly-table tbody tr:hover td.name-col {
  background: var(--secondary) !important;
}

/* Summary rows: pinned label spanning cols 1 & 2 */
.monthly-table .summary-row .summary-label {
  position: sticky;
  left: 0;
  z-index: 3;
  background: var(--muted) !important;
  text-align: left;
  padding-left: 14px;
  border-right: 2px solid var(--border) !important;
  font-weight: 800;
}

/* Monthly Table Cells & Inputs */
.day-cell {
  padding: 2px 3px !important;
  min-width: 28px;
  width: 28px;
  text-align: center;
}

.day-select {
  width: 26px;
  height: 26px;
  padding: 0;
  text-align: center;
  text-align-last: center;
  border: 1px solid transparent;
  border-radius: var(--radius-xs, 4px);
  background: transparent;
  color: var(--foreground);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.day-select:hover {
  background: var(--muted);
  border-color: var(--border);
}

.day-select:focus {
  background: var(--card);
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--primary-bg);
}

.total-cell {
  min-width: 44px;
  font-weight: 700;
  font-size: 0.74rem;
}

.total-cell.present {
  color: var(--primary);
}

.total-cell.absent {
  color: var(--destructive);
}

.remarks-input {
  min-width: 130px;
  width: 100%;
  padding: 4px 8px;
  font-size: 0.74rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs, 4px);
  background: var(--card);
  color: var(--foreground);
  outline: none;
}

.remarks-input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--primary-bg);
}

/* Summary Header */
.summary-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-header-row h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--foreground);
}

/* Summary Section & Table Wrapper */
.summary-section {
  padding: clamp(16px, 2.5vw, 24px);
  margin-top: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 12px);
  background: var(--card);
  box-shadow: var(--shadow-xs, 0 1px 3px rgba(0, 0, 0, 0.03));
}

.summary-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 8px);
  background: var(--card);
}

.summary-table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  color: var(--foreground);
  font-size: 0.74rem;
}

.summary-table th,
.summary-table td {
  padding: 8px 12px;
  border: 1px solid var(--border);
  vertical-align: middle;
}

.summary-table th {
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

.summary-label {
  font-weight: 600;
  color: var(--foreground);
  font-size: 0.74rem;
}

.summary-input {
  width: 72px;
  padding: 4px 6px;
  text-align: center;
  font-weight: 700;
  font-size: 0.78rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs, 4px);
  background: var(--card);
  color: var(--foreground);
  outline: none;
  transition: all 0.15s ease;
}

.summary-input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--primary-bg);
}

/* Modern Legends Chips */
.legends {
  padding: 16px 20px;
  margin-top: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 12px);
  background: var(--muted);
}

.legends-header {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
  color: var(--foreground);
}

.legends-header h3 {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.legend-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, 6px);
  font-size: 0.74rem;
  color: var(--foreground);
  box-shadow: var(--shadow-xs);
}

.legend-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-xs, 4px);
  font-weight: 800;
  font-size: 0.72rem;
  line-height: 1;
}

.legend-symbol--blank {
  background: var(--muted);
  border: 1px dashed var(--border);
}

.legend-symbol--absent {
  background: var(--red-bg);
  color: var(--destructive);
}

.legend-symbol--tardy,
.legend-symbol--half {
  background: var(--warning-bg);
  color: var(--warning);
}

.legend-symbol--entered {
  background: var(--primary-bg);
  color: var(--primary);
}

.legend-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.72rem;
  line-height: 1.4;
}

.legend-note svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--primary);
}

/* Modal Responsiveness */
.modal-card {
  width: 100%;
  max-width: min(520px, calc(100vw - 32px)) !important;
  box-sizing: border-box;
}

/* Print Overrides to ensure clean output */
@media print {
  .monthly-table th.no-col,
  .monthly-table td.no-col,
  .monthly-table th.name-col,
  .monthly-table td.name-col,
  .monthly-table .summary-row .summary-label {
    position: static !important;
  }
}

/* Bottom Sheet Actions */
.sheet-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.sheet-actions-left,
.sheet-actions-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
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

@media (max-width: 768px) {
  .sheet-info-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .sheet-meta-group,
  .sheet-signatories-group {
    width: 100%;
    justify-content: flex-start;
  }

  .sheet-signatories-group {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .signatory-label {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .adviser-input {
    flex: 1;
    max-width: 240px;
  }

  .sheet-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .sheet-toolbar-left,
  .sheet-toolbar-right {
    width: 100%;
    justify-content: flex-start;
  }

  .sheet-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .sheet-actions-left,
  .sheet-actions-right {
    width: 100%;
    justify-content: stretch;
  }

  .sheet-actions-left > .sf2-btn,
  .sheet-actions-right > .sf2-btn {
    flex: 1 1 100%;
  }

  .calendar-events-strip-title,
  .calendar-event-pills {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .generator-card {
    padding: 16px;
  }

  .generator-form-row {
    grid-template-columns: 1fr;
  }

  .school-days-pill {
    width: 100%;
    justify-content: space-between;
  }

  .sheet-toolbar-left > .sf2-btn,
  .sheet-toolbar-right > .sf2-btn {
    flex: 1 1 calc(50% - 4px);
  }

  .sheet-header h1 {
    font-size: 1.15rem;
  }

  .summary-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .summary-header-row > .sf2-btn {
    width: 100%;
  }

  .legend-chip {
    flex: 1 1 calc(50% - 4px);
  }

  .sheet-info > span {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>
