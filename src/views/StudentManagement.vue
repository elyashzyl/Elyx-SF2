<template>
  <div class="management-page">
    <div class="page-header">
      <div>
        <h1>Student Management</h1>
        <p>Manage student rosters, filter by grade and section, and configure gender assignments.</p>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="cancelForm">
      <div class="form-card" :style="editingStudent ? 'max-width: 680px;' : ''">
        <h3>{{ editingStudent ? 'Edit Student Profile & Demographics' : 'Add Student(s) to Roster' }}</h3>
        <form @submit.prevent="handleSave">
          <template v-if="editingStudent">
            <div class="form-row">
              <div class="form-group" style="flex: 2;">
                <label>Student Full Name <span class="required">*</span></label>
                <input v-model="form.name" required placeholder="LAST NAME, FIRST NAME, MIDDLE NAME" />
              </div>
              <div class="form-group" style="flex: 1;">
                <label>DepEd LRN (12 digits)</label>
                <input v-model="form.lrn" placeholder="e.g. 101234567890" maxlength="32" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Gender <span class="required">*</span></label>
                <select v-model="form.gender" required>
                  <option value="">— Select Gender —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div class="form-group">
                <label>Date of Birth</label>
                <input v-model="form.birth_date" type="date" />
              </div>
            </div>

            <div class="form-group">
              <label>Home Address</label>
              <input v-model="form.address" placeholder="Barangay, Municipality/City, Province" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Parent / Guardian Name</label>
                <input v-model="form.guardian_name" placeholder="Full name of parent or guardian" />
              </div>
              <div class="form-group">
                <label>Relationship</label>
                <select v-model="form.guardian_relationship">
                  <option value="">— Select Relationship —</option>
                  <option value="Parent">Parent</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Guardian Contact #</label>
                <input v-model="form.guardian_contact" placeholder="e.g. 0917-123-4567" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex: 2;">
                <label>Emergency Contact Person</label>
                <input v-model="form.emergency_contact_name" placeholder="Contact person if guardian unavailable" />
              </div>
              <div class="form-group" style="flex: 1;">
                <label>Emergency Number</label>
                <input v-model="form.emergency_contact_number" placeholder="e.g. 0918-765-4321" />
              </div>
            </div>

            <div class="form-row" style="margin-top: 10px; padding: 10px; background: var(--secondary); border-radius: var(--radius-md);">
              <label class="checkbox-label" style="font-size: 0.8rem; margin-bottom: 0;">
                <input type="checkbox" v-model="form.consent_data_sharing" />
                <span>DepEd Compliance Data Consent (Learner Information System)</span>
              </label>
              <label class="checkbox-label" style="font-size: 0.8rem; margin-bottom: 0; margin-left: 14px;">
                <input type="checkbox" v-model="form.consent_medical_emergency" />
                <span>Emergency Medical Treatment Authorization</span>
              </label>
            </div>
          </template>
          <template v-else>
            <div class="form-group">
              <label>Student Names</label>
              <span class="label-hint">One learner name per line</span>
              <textarea v-model="form.names" rows="5" required placeholder="Enter one learner name per line"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Grade Level</label>
                <select v-model="form.grade" @change="form.section = ''" required>
                  <option value="" disabled v-if="!grades.length">No grade levels defined</option>
                  <option v-for="g in grades" :key="g">{{ g }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Section</label>
                <select v-model="form.section" required>
                  <option value="" disabled>Select section</option>
                  <option v-for="s in availableSections" :key="s">{{ s }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Gender</label>
              <select v-model="form.gender">
                <option value="">— Select Gender —</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </template>
          <div class="form-actions" style="margin-top: 16px;">
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner" style="margin-right: 6px;"></span>
              {{ saving ? 'Saving...' : (editingStudent ? 'Update Profile' : 'Save Students') }}
            </button>
            <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEnrollmentModal" class="modal-overlay" @click.self="closeEnrollmentModal">
      <div class="form-card">
        <h3>{{ enrollmentStudent?.name }} — Enrollment Change</h3>
        <form @submit.prevent="saveEnrollmentEvent">
          <div class="form-group">
            <label>Action</label>
            <select v-model="enrollmentForm.eventType" required>
              <option value="transfer">Change Class</option>
              <option value="promote">Promote</option>
              <option value="reenroll">Re-enroll</option>
              <option value="withdraw">Withdraw</option>
              <option v-if="auth.isSuperadmin" value="transfer_school">Transfer to Another School</option>
            </select>
          </div>
          <div class="form-group" v-if="enrollmentForm.eventType === 'transfer_school'">
            <label>Destination School <span class="required">*</span></label>
            <select v-model="enrollmentForm.targetSchoolId" @change="onTransferSchoolChange" required>
              <option value="" disabled>Select target school</option>
              <option v-for="s in schools.filter(x => x.id !== enrollmentStudent?.school_id)" :key="s.id" :value="s.id">{{ s.name }} ({{ s.short || s.school_id }})</option>
            </select>
          </div>
          <div class="form-row" v-if="enrollmentForm.eventType !== 'withdraw'">
            <div class="form-group">
              <label>Grade Level</label>
              <select v-model="enrollmentForm.grade" @change="onEnrollmentGradeChange" required>
                <option v-for="g in (enrollmentForm.eventType === 'transfer_school' ? targetSchoolGrades : grades)" :key="g">{{ g }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Section</label>
              <select v-model="enrollmentForm.section" required>
                <option v-for="s in (enrollmentForm.eventType === 'transfer_school' ? (targetSchoolSections[enrollmentForm.grade] || []) : (sectionsByGrade[enrollmentForm.grade] || []))" :key="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Effective Date</label>
            <input v-model="enrollmentForm.effectiveOn" type="date" required />
          </div>
          <div class="form-group">
            <label>Reason</label>
            <textarea v-model="enrollmentForm.reason" rows="3" required placeholder="Explain this enrollment change"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="enrollmentSaving">{{ enrollmentSaving ? 'Saving...' : 'Save Change' }}</button>
            <button type="button" @click="closeEnrollmentModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
      <div class="form-card">
        <h3>{{ historyStudent?.name }} — Enrollment History</h3>
        <div v-if="historyLoading" class="empty">Loading history...</div>
        <div v-else-if="!history.length" class="empty">No enrollment history found.</div>
        <div v-else class="activity-list">
          <div v-for="item in history" :key="item.id" class="activity-item">
            <strong>{{ item.event_type }}</strong>
            <span>{{ item.effective_on }} · {{ item.grade }} · {{ item.section }}</span>
            <small>{{ item.reason }}</small>
          </div>
        </div>
        <div class="form-actions"><button type="button" @click="showHistoryModal = false" class="btn-secondary">Close</button></div>
      </div>
    </div>

    <!-- Bulk Roster Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
      <div class="form-card" style="max-width: 780px;">
        <div class="modal-header-compact">
          <h3>Bulk Import Student Roster</h3>
          <p class="modal-subtext">Import learners from Excel (.xlsx, .xls) or CSV files with live validation and preview.</p>
        </div>

        <!-- Step 1: Upload or Paste -->
        <div v-if="importStep === 1">
          <div class="import-tabs">
            <button
              type="button"
              class="import-tab-btn"
              :class="{ active: importTab === 'file' }"
              @click="importTab = 'file'"
            >
              Spreadsheet File (.xlsx / .csv)
            </button>
            <button
              type="button"
              class="import-tab-btn"
              :class="{ active: importTab === 'paste' }"
              @click="importTab = 'paste'"
            >
              Paste Text / TSV
            </button>
          </div>

          <div v-if="importTab === 'file'" class="import-file-area">
            <input
              type="file"
              ref="fileInputRef"
              accept=".xlsx, .xls, .csv"
              style="display: none;"
              @change="handleFileUpload"
            />
            <div class="file-dropzone" @click="fileInputRef?.click()">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <div v-if="importFileName">
                <strong>{{ importFileName }}</strong>
                <small>{{ parsedRawRows.length }} rows loaded. Click to select another file.</small>
              </div>
              <div v-else>
                <strong>Click to choose an Excel or CSV roster file</strong>
                <small>Supports .xlsx, .xls, and .csv formats</small>
              </div>
            </div>

            <div class="template-download-row">
              <span>Need a starting format?</span>
              <button type="button" class="btn-link" @click="downloadTemplate">
                Download Sample Excel Template (.xlsx) ↓
              </button>
            </div>
          </div>

          <div v-else class="import-paste-area">
            <label class="form-label" style="font-size: 0.78rem; font-weight: 700; color: var(--foreground); margin-bottom: 6px; display: block;">
              Paste tab-separated or comma-separated rows:
            </label>
            <textarea
              v-model="importText"
              rows="6"
              class="paste-textarea"
              placeholder="Name, Gender, Grade, Section&#10;Dela Cruz, Juan, Male, Grade 10, Rizal&#10;Santos, Maria Clara, Female, Grade 10, Rizal"
            ></textarea>
          </div>

          <!-- Fallback class selectors if file rows omit grade or section -->
          <div class="form-row" style="margin-top: 14px;">
            <div class="form-group">
              <label>Default Grade Level (fallback)</label>
              <select v-model="importDefaultGrade" @change="importDefaultSection = (sectionsByGrade[importDefaultGrade] || [])[0] || ''">
                <option value="">— Auto-detect from file rows —</option>
                <option v-for="g in grades" :key="g">{{ g }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Default Section (fallback)</label>
              <select v-model="importDefaultSection" :disabled="!importDefaultGrade">
                <option value="">— Auto-detect from file rows —</option>
                <option v-for="s in (sectionsByGrade[importDefaultGrade] || [])" :key="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div class="form-actions" style="margin-top: 20px;">
            <button
              type="button"
              class="btn-primary"
              :disabled="validatingRoster || (!parsedRawRows.length && !importText.trim())"
              @click="validateRoster"
            >
              <span v-if="validatingRoster">Validating Roster…</span>
              <span v-else>Proceed to Preview &amp; Validation →</span>
            </button>
            <button type="button" @click="closeImportModal" class="btn-secondary">Cancel</button>
          </div>
        </div>

        <!-- Step 2: Preview & Validation Results -->
        <div v-else-if="importStep === 2">
          <!-- Summary badges -->
          <div class="validation-summary-grid">
            <div class="val-summary-chip val--total">
              <span>Total Rows:</span>
              <strong>{{ validationResults?.summary.total || 0 }}</strong>
            </div>
            <div class="val-summary-chip val--valid">
              <span>Valid Learners:</span>
              <strong>{{ validationResults?.summary.validCount || 0 }}</strong>
            </div>
            <div class="val-summary-chip val--dup">
              <span>Existing in School:</span>
              <strong>{{ validationResults?.summary.duplicateCount || 0 }}</strong>
            </div>
            <div class="val-summary-chip val--err">
              <span>Errors / Incomplete:</span>
              <strong>{{ validationResults?.summary.errorCount || 0 }}</strong>
            </div>
          </div>

          <div v-if="validationResults?.summary.wouldExceed" class="validation-error-banner">
            ⚠️ <strong>License limit warning:</strong> Importing {{ validationResults.summary.validCount }} students would surpass your school's capacity of {{ validationResults.summary.maxStudents }} learners.
          </div>

          <!-- Preview Table -->
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>
                  <th style="width: 50px;">Row</th>
                  <th>Learner Name</th>
                  <th>Gender</th>
                  <th>Class</th>
                  <th>Validation Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in displayPreviewRows" :key="v.rowNumber">
                  <td>#{{ v.rowNumber }}</td>
                  <td><strong>{{ v.name || '—' }}</strong></td>
                  <td>{{ v.gender || '—' }}</td>
                  <td>{{ v.grade }} · {{ v.section }}</td>
                  <td>
                    <span v-if="v.status === 'valid'" class="status-pill status-pill--success">Ready to Import</span>
                    <span v-else-if="v.status === 'duplicate'" class="status-pill status-pill--warning">{{ v.warning }}</span>
                    <span v-else class="status-pill status-pill--danger">{{ v.error }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="import-options-row" v-if="validationResults?.duplicates.length">
            <label class="checkbox-label">
              <input type="checkbox" v-model="skipDuplicates" />
              <span>Skip duplicate learners already enrolled in school</span>
            </label>
          </div>

          <div class="form-actions" style="margin-top: 16px;">
            <button
              type="button"
              class="btn-primary"
              :disabled="importingRoster || eligibleImportRows.length === 0 || validationResults?.summary.wouldExceed"
              @click="confirmImport"
            >
              <span v-if="importingRoster">Importing Learners…</span>
              <span v-else>Import {{ eligibleImportRows.length }} Learners</span>
            </button>
            <button type="button" @click="importStep = 1" class="btn-secondary" :disabled="importingRoster">← Back to File</button>
            <button type="button" @click="closeImportModal" class="btn-secondary" :disabled="importingRoster">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Unified Bulk Action Modal -->
    <div v-if="showBulkModal" class="modal-overlay" @click.self="closeBulkModal">
      <div class="form-card" style="max-width: 520px;">
        <div class="modal-header-compact">
          <h3>{{ bulkModalTitle }}</h3>
          <p class="modal-subtext">{{ bulkModalSubtitle }}</p>
        </div>

        <form @submit.prevent="submitBulkAction">
          <!-- Destination School & Class Assignment for Cross-School Transfer -->
          <template v-if="bulkActionType === 'transfer_school'">
            <div class="form-group">
              <label>Destination School <span class="required">*</span></label>
              <select v-model="bulkForm.targetSchoolId" @change="onBulkTransferSchoolChange" required>
                <option value="" disabled>Select target school</option>
                <option v-for="s in schools.filter(x => x.id !== effectiveSchoolId)" :key="s.id" :value="s.id">{{ s.name }} ({{ s.short || s.school_id }})</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Target Grade Level <span class="required">*</span></label>
                <select v-model="bulkForm.grade" @change="onBulkTransferGradeChange" required>
                  <option value="" disabled>Select grade</option>
                  <option v-for="g in targetSchoolGrades" :key="g">{{ g }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Target Section <span class="required">*</span></label>
                <select v-model="bulkForm.section" required>
                  <option value="" disabled>Select section</option>
                  <option v-for="s in (targetSchoolSections[bulkForm.grade] || [])" :key="s">{{ s }}</option>
                </select>
              </div>
            </div>
          </template>

          <!-- Class Assignment for Transfer / Promote -->
          <div v-if="['transfer', 'promote'].includes(bulkActionType)" class="form-row">
            <div class="form-group">
              <label>Target Grade Level <span class="required">*</span></label>
              <select v-model="bulkForm.grade" @change="bulkForm.section = (sectionsByGrade[bulkForm.grade] || [])[0] || ''" required>
                <option value="" disabled>Select grade</option>
                <option v-for="g in grades" :key="g">{{ g }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Target Section <span class="required">*</span></label>
              <select v-model="bulkForm.section" required>
                <option value="" disabled>Select section</option>
                <option v-for="s in (sectionsByGrade[bulkForm.grade] || [])" :key="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <!-- Class Assignment for Re-enroll -->
          <template v-if="bulkActionType === 'reenroll'">
            <div class="form-group">
              <label>Class Assignment</label>
              <select v-model="bulkForm.reenrollMode">
                <option value="keep">Keep previous grade and section</option>
                <option value="assign">Assign to a new grade and section</option>
              </select>
            </div>
            <div class="form-row" v-if="bulkForm.reenrollMode === 'assign'">
              <div class="form-group">
                <label>Target Grade Level <span class="required">*</span></label>
                <select v-model="bulkForm.grade" @change="bulkForm.section = (sectionsByGrade[bulkForm.grade] || [])[0] || ''" required>
                  <option value="" disabled>Select grade</option>
                  <option v-for="g in grades" :key="g">{{ g }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Target Section <span class="required">*</span></label>
                <select v-model="bulkForm.section" required>
                  <option value="" disabled>Select section</option>
                  <option v-for="s in (sectionsByGrade[bulkForm.grade] || [])" :key="s">{{ s }}</option>
                </select>
              </div>
            </div>
          </template>

          <!-- Gender Assignment -->
          <div v-if="bulkActionType === 'gender'" class="form-group">
            <label>Learner Gender <span class="required">*</span></label>
            <select v-model="bulkForm.gender" required>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <!-- Withdrawal Reason Presets -->
          <template v-if="bulkActionType === 'withdraw'">
            <div class="form-group">
              <label>Common Withdrawal Reason</label>
              <select v-model="bulkForm.withdrawPreset" @change="onWithdrawPresetChange">
                <option value="Transferred out to another school">Transferred out to another school (T.O.)</option>
                <option value="Family relocation / moved residence">Family relocation / moved residence</option>
                <option value="Illness / medical leave">Illness / medical leave</option>
                <option value="Financial / employment reasons">Financial / employment reasons</option>
                <option value="Dropped out / personal reasons">Dropped out / personal reasons</option>
                <option value="Other">Other (enter custom reason below)</option>
              </select>
            </div>
          </template>

          <!-- Effective Date -->
          <div v-if="!['gender', 'permanent_delete'].includes(bulkActionType)" class="form-group">
            <label>Effective Date <span class="required">*</span></label>
            <input v-model="bulkForm.effectiveOn" type="date" required />
          </div>

          <!-- Reason / Notes Field -->
          <div v-if="!['gender', 'permanent_delete'].includes(bulkActionType)" class="form-group">
            <label>Reason / Notes <span class="required">*</span></label>
            <textarea v-model="bulkForm.reason" rows="2" required placeholder="Explain this change"></textarea>
          </div>

          <!-- Permanent Delete Confirmation Checkbox -->
          <div v-if="bulkActionType === 'permanent_delete'" class="form-group" style="margin-top: 10px;">
            <label class="tbl-check" style="color: var(--destructive); font-weight: 700;">
              <input v-model="bulkForm.confirmDelete" type="checkbox" required />
              I understand that this action permanently deletes these learners and all their attendance history.
            </label>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              :class="bulkActionType === 'withdraw' || bulkActionType === 'permanent_delete' ? 'btn-danger' : 'btn-primary'"
              :disabled="bulkSaving"
            >
              <span v-if="bulkSaving" class="spinner" style="margin-right: 6px;"></span>
              {{ bulkSubmitButtonLabel }}
            </button>
            <button type="button" @click="closeBulkModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Student Profile & Interventions Modal -->
    <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
      <div class="form-card" style="max-width: 840px;">
        <div class="modal-header-compact" style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <span class="cell-avatar" style="width: 44px; height: 44px; font-size: 1.1rem;">
              {{ (profileStudent?.name || '?').charAt(0).toUpperCase() }}
            </span>
            <div>
              <h3 style="margin: 0; font-size: 1.15rem;">{{ profileStudent?.name }}</h3>
              <p class="modal-subtext" style="margin: 2px 0 0 0;">
                <span v-if="profileStudent?.lrn" style="font-weight: 700; color: var(--primary);">LRN: {{ profileStudent.lrn }} &middot; </span>
                <span>{{ profileStudent?.grade }} — {{ profileStudent?.section }}</span>
                &middot;
                <span :class="['pill', profileStudent?.gender === 'Male' ? 'pill--blue' : 'pill--green']" style="font-size: 0.65rem; padding: 2px 6px;">
                  {{ profileStudent?.gender || 'Unspecified' }}
                </span>
                <span v-if="profileStudent?.enrollment_status === 'withdrawn'" class="pill pill--red" style="font-size: 0.65rem; margin-left: 6px;">
                  Withdrawn
                </span>
              </p>
            </div>
          </div>
          <button type="button" @click="showProfileModal = false" class="icon-btn" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Profile Tabs Header -->
        <div class="profile-tabs-nav">
          <button type="button" class="profile-tab-btn" :class="{ active: profileTab === 'overview' }" @click="profileTab = 'overview'">
            Profile Details
          </button>
          <button type="button" class="profile-tab-btn" :class="{ active: profileTab === 'interventions' }" @click="profileTab = 'interventions'">
            SARDO Interventions
            <span class="count-badge" v-if="profileDetails?.interventions?.length">{{ profileDetails.interventions.length }}</span>
          </button>
          <button type="button" class="profile-tab-btn" :class="{ active: profileTab === 'contacts' }" @click="profileTab = 'contacts'">
            Guardian Contacts
            <span class="count-badge" v-if="profileDetails?.contactHistory?.length">{{ profileDetails.contactHistory.length }}</span>
          </button>
          <button type="button" class="profile-tab-btn" :class="{ active: profileTab === 'history' }" @click="profileTab = 'history'">
            Enrollment Events
          </button>
        </div>

        <div v-if="profileLoading" style="padding: 30px; text-align: center; color: var(--muted-foreground);">
          <span class="spinner" style="margin-right: 8px;"></span> Loading learner records...
        </div>

        <div v-else>
          <!-- Tab 1: Profile Overview -->
          <div v-if="profileTab === 'overview'" class="profile-tab-content">
            <div class="profile-grid">
              <div class="profile-card">
                <h4>Demographics &amp; Identity</h4>
                <div class="profile-field-row"><span>DepEd LRN:</span><strong>{{ profileDetails?.lrn || 'Not assigned' }}</strong></div>
                <div class="profile-field-row"><span>Gender:</span><strong>{{ profileDetails?.gender || '—' }}</strong></div>
                <div class="profile-field-row"><span>Date of Birth:</span><strong>{{ profileDetails?.birth_date || '—' }}</strong></div>
                <div class="profile-field-row"><span>Home Address:</span><strong>{{ profileDetails?.address || '—' }}</strong></div>
                <div class="profile-field-row"><span>Enrollment:</span><strong>{{ profileDetails?.enrollment_status === 'withdrawn' ? 'Withdrawn' : 'Active Roster' }}</strong></div>
              </div>

              <div class="profile-card">
                <h4>Guardian Information</h4>
                <div class="profile-field-row"><span>Guardian Name:</span><strong>{{ profileDetails?.guardian_name || '—' }}</strong></div>
                <div class="profile-field-row"><span>Relationship:</span><strong>{{ profileDetails?.guardian_relationship || 'Parent / Guardian' }}</strong></div>
                <div class="profile-field-row"><span>Contact Number:</span><strong>{{ profileDetails?.guardian_contact || '—' }}</strong></div>
                <div class="profile-field-row" style="margin-top: 10px;"><span>Emergency Person:</span><strong>{{ profileDetails?.emergency_contact_name || '—' }}</strong></div>
                <div class="profile-field-row"><span>Emergency Phone:</span><strong>{{ profileDetails?.emergency_contact_number || '—' }}</strong></div>
              </div>
            </div>

            <div class="profile-card" style="margin-top: 14px;">
              <h4>Consent &amp; Authorization Tracking</h4>
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <div class="consent-pill" :class="profileDetails?.consent_data_sharing !== 0 ? 'consent--granted' : 'consent--denied'">
                  <span>{{ profileDetails?.consent_data_sharing !== 0 ? '✓ Granted' : '✕ Not Provided' }}</span>
                  <small>DepEd Data Sharing &amp; LIS Compliance</small>
                </div>
                <div class="consent-pill" :class="profileDetails?.consent_medical_emergency !== 0 ? 'consent--granted' : 'consent--denied'">
                  <span>{{ profileDetails?.consent_medical_emergency !== 0 ? '✓ Granted' : '✕ Not Provided' }}</span>
                  <small>Emergency Medical Treatment Authorization</small>
                </div>
              </div>
            </div>

            <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
              <button type="button" @click="editStudent(profileDetails || profileStudent)" class="btn-primary">
                Edit Learner Profile
              </button>
            </div>
          </div>

          <!-- Tab 2: Interventions -->
          <div v-if="profileTab === 'interventions'" class="profile-tab-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <p class="modal-subtext" style="margin: 0;">Formal counseling, home visitation, and SARDO retention actions.</p>
              <button type="button" @click="showNewInterventionForm = !showNewInterventionForm" class="btn-sm btn-primary">
                {{ showNewInterventionForm ? 'Cancel New Intervention' : '+ Log Intervention' }}
              </button>
            </div>

            <!-- New Intervention Form -->
            <form v-if="showNewInterventionForm" @submit.prevent="saveIntervention" class="inline-subform">
              <div class="form-row">
                <div class="form-group">
                  <label>Concern Type <span class="required">*</span></label>
                  <select v-model="newIntervention.concern_type" required>
                    <option value="attendance">Attendance / SARDO Early Warning</option>
                    <option value="academic">Academic Difficulty / Performance</option>
                    <option value="behavioral">Behavioral / Discipline</option>
                    <option value="health">Health / Medical Well-being</option>
                    <option value="other">Other School Counseling</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Follow-up Target Date</label>
                  <input v-model="newIntervention.follow_up_date" type="date" />
                </div>
                <div class="form-group">
                  <label>Initial Status</label>
                  <select v-model="newIntervention.resolution_status">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated to Guidance</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Action Taken <span class="required">*</span></label>
                <textarea v-model="newIntervention.action_taken" rows="2" required placeholder="Describe counseling conducted, parent notification, or home visitation outcome"></textarea>
              </div>

              <div class="form-group">
                <label>Additional Confidential Notes</label>
                <input v-model="newIntervention.notes" placeholder="Optional notes for counseling record" />
              </div>

              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" @click="showNewInterventionForm = false" class="btn-sm btn-secondary">Cancel</button>
                <button type="submit" class="btn-sm btn-primary" :disabled="savingIntervention">
                  {{ savingIntervention ? 'Saving...' : 'Save Intervention Record' }}
                </button>
              </div>
            </form>

            <!-- Interventions List -->
            <div v-if="profileDetails?.interventions?.length" class="intervention-list">
              <div v-for="inv in profileDetails.interventions" :key="inv.id" class="intervention-item-box">
                <div class="intervention-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span :class="['pill', inv.concern_type === 'attendance' ? 'pill--red' : 'pill--blue']" style="text-transform: capitalize;">
                      {{ inv.concern_type }}
                    </span>
                    <span :class="['status-pill', inv.resolution_status === 'resolved' ? 'status-pill--success' : (inv.resolution_status === 'in_progress' ? 'status-pill--warning' : 'status-pill--danger')]">
                      {{ inv.resolution_status.replace('_', ' ') }}
                    </span>
                    <small style="color: var(--muted-foreground);">{{ inv.created_at ? inv.created_at.slice(0, 10) : '' }}</small>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button v-if="inv.resolution_status !== 'resolved'" @click="updateInterventionStatus(inv, 'resolved')" class="btn-xs-reenroll" style="color: #10b981; border-color: rgba(16, 185, 129, 0.4);" title="Mark as resolved">
                      ✓ Resolve
                    </button>
                    <button v-if="inv.resolution_status === 'open'" @click="updateInterventionStatus(inv, 'in_progress')" class="btn-xs-reenroll" title="Mark as in progress">
                      In Progress
                    </button>
                    <button @click="removeIntervention(inv)" class="icon-btn icon-btn--danger" style="padding: 2px;" title="Delete record">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>

                <div class="intervention-body">
                  <strong>Action Taken:</strong> {{ inv.action_taken }}
                  <div v-if="inv.follow_up_date" style="margin-top: 4px; font-size: 0.76rem; color: var(--primary);">
                    📅 Follow-up target: {{ inv.follow_up_date }}
                  </div>
                  <div v-if="inv.notes" style="margin-top: 4px; font-size: 0.76rem; color: var(--muted-foreground);">
                    💬 Notes: {{ inv.notes }}
                  </div>
                  <div style="margin-top: 6px; font-size: 0.7rem; color: var(--muted-foreground);">
                    Logged by {{ inv.assigned_staff_name || inv.created_by_name || 'Staff' }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty" style="padding: 30px;">
              No intervention records filed for this learner yet.
            </div>
          </div>

          <!-- Tab 3: Guardian Contact Logs -->
          <div v-if="profileTab === 'contacts'" class="profile-tab-content">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <p class="modal-subtext" style="margin: 0;">Log calls, home visits, SMS, and conferences with parents.</p>
              <button type="button" @click="showNewContactForm = !showNewContactForm" class="btn-sm btn-primary">
                {{ showNewContactForm ? 'Cancel' : '+ Log Contact Event' }}
              </button>
            </div>

            <!-- New Contact Log Form -->
            <form v-if="showNewContactForm" @submit.prevent="saveContactLog" class="inline-subform">
              <div class="form-row">
                <div class="form-group">
                  <label>Contact Method <span class="required">*</span></label>
                  <select v-model="newContact.contact_method" required>
                    <option value="phone">Phone Call</option>
                    <option value="sms">SMS Text Message</option>
                    <option value="home_visit">Home Visitation</option>
                    <option value="in_person">In-Person Conference</option>
                    <option value="letter">Official Notice Letter</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Contact Date <span class="required">*</span></label>
                  <input v-model="newContact.contact_date" type="date" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Guardian Name</label>
                  <input v-model="newContact.guardian_name" :placeholder="profileDetails?.guardian_name || 'Guardian contacted'" />
                </div>
                <div class="form-group">
                  <label>Reason / Topic</label>
                  <input v-model="newContact.reason" placeholder="e.g. SARDO attendance check, health inquiry" />
                </div>
              </div>

              <div class="form-group">
                <label>Contact Outcome / Commitments <span class="required">*</span></label>
                <textarea v-model="newContact.outcome" rows="2" required placeholder="What was discussed and agreed upon with the parent/guardian?"></textarea>
              </div>

              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button type="button" @click="showNewContactForm = false" class="btn-sm btn-secondary">Cancel</button>
                <button type="submit" class="btn-sm btn-primary" :disabled="savingContact">
                  {{ savingContact ? 'Saving...' : 'Save Contact Log' }}
                </button>
              </div>
            </form>

            <div v-if="profileDetails?.contactHistory?.length" class="intervention-list">
              <div v-for="c in profileDetails.contactHistory" :key="c.id" class="intervention-item-box">
                <div class="intervention-header">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="pill pill--blue" style="text-transform: capitalize;">
                      {{ c.contact_method.replace('_', ' ') }}
                    </span>
                    <strong>{{ c.contact_date }}</strong>
                    <span style="font-size: 0.78rem; color: var(--muted-foreground);">&middot; {{ c.guardian_name || 'Parent' }}</span>
                  </div>
                  <button @click="removeContactLog(c)" class="icon-btn icon-btn--danger" style="padding: 2px;" title="Delete log">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div class="intervention-body" style="margin-top: 6px;">
                  <div v-if="c.reason" style="font-weight: 600; font-size: 0.82rem; margin-bottom: 2px;">
                    Topic: {{ c.reason }}
                  </div>
                  <div>{{ c.outcome }}</div>
                  <div style="margin-top: 6px; font-size: 0.7rem; color: var(--muted-foreground);">
                    Logged by {{ c.staff_name || 'Staff' }}
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty" style="padding: 30px;">
              No contact logs recorded for this learner yet.
            </div>
          </div>

          <!-- Tab 4: Enrollment Timeline -->
          <div v-if="profileTab === 'history'" class="profile-tab-content">
            <div v-if="profileDetails?.enrollmentHistory?.length" class="timeline">
              <div v-for="event in profileDetails.enrollmentHistory" :key="event.id" class="timeline-item">
                <div class="timeline-dot" :class="event.status === 'withdrawn' ? 'timeline-dot--danger' : 'timeline-dot--success'"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="timeline-badge" :class="event.event_type">{{ event.event_type.toUpperCase() }}</span>
                    <span class="timeline-date">{{ event.effective_on }}</span>
                  </div>
                  <p class="timeline-class">{{ event.grade }} &middot; {{ event.section }}</p>
                  <p v-if="event.reason" class="timeline-reason">{{ event.reason }}</p>
                  <p class="timeline-meta">Recorded by {{ event.actor_name || 'System' }}</p>
                </div>
              </div>
            </div>
            <div v-else class="empty" style="padding: 30px;">
              No enrollment events recorded.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Print Class Roster Modal -->
    <div v-if="showPrintRosterModal" class="modal-overlay print-modal-active" @click.self="showPrintRosterModal = false">
      <div class="form-card" style="max-width: 900px;">
        <div class="modal-header-compact screen-only" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3>Printable Class Masterlist &amp; Roster</h3>
            <p class="modal-subtext">Official DepEd School Form format with LRN, guardian details, and certification sign-offs.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" @click="triggerPrint" class="btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print Now
            </button>
            <button type="button" @click="showPrintRosterModal = false" class="btn-secondary">Close</button>
          </div>
        </div>

        <!-- Filter Controls (Screen Only) -->
        <div class="form-row screen-only" style="margin: 12px 0 16px;">
          <div class="form-group">
            <label>Select Grade Level</label>
            <select v-model="printGrade" @change="printSection = (sectionsByGrade[printGrade] ? sectionsByGrade[printGrade][0] : '')">
              <option v-for="g in grades" :key="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Select Section</label>
            <select v-model="printSection">
              <option v-for="s in (sectionsByGrade[printGrade] || [])" :key="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- Printable Roster Sheet Container -->
        <div class="printable-sheet">
          <div class="print-deped-header">
            <div style="font-size: 0.85rem; font-weight: 700; letter-spacing: 0.5px;">REPUBLIC OF THE PHILIPPINES · DEPARTMENT OF EDUCATION</div>
            <div style="font-size: 1.15rem; font-weight: 800; margin: 4px 0;">{{ currentSchoolName }}</div>
            <div style="font-size: 0.82rem; color: #555;">CLASS ROSTER &amp; LEARNER MASTERLIST</div>
            <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 0.82rem; border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 6px 0;">
              <span><strong>School ID:</strong> {{ currentSchoolDepedId || '—' }}</span>
              <span><strong>Grade &amp; Section:</strong> {{ printGrade }} — {{ printSection }}</span>
              <span><strong>School Year:</strong> {{ currentSchoolYear || '2026-2027' }}</span>
            </div>
          </div>

          <table class="print-roster-table" style="width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="border-bottom: 1.5px solid #222; background: #f8f8f8;">
                <th style="padding: 5px; width: 35px; text-align: center;">#</th>
                <th style="padding: 5px; width: 110px;">DepEd LRN</th>
                <th style="padding: 5px; text-align: left;">Learner's Full Name</th>
                <th style="padding: 5px; width: 55px; text-align: center;">Sex</th>
                <th style="padding: 5px; width: 85px;">Birth Date</th>
                <th style="padding: 5px;">Parent / Guardian</th>
                <th style="padding: 5px; width: 100px;">Contact #</th>
                <th style="padding: 5px; width: 80px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(st, idx) in printStudents" :key="st.id" style="border-bottom: 1px solid #ddd;">
                <td style="padding: 5px; text-align: center;">{{ idx + 1 }}</td>
                <td style="padding: 5px; font-family: monospace;">{{ st.lrn || '—' }}</td>
                <td style="padding: 5px; font-weight: 600;">{{ st.name }}</td>
                <td style="padding: 5px; text-align: center;">{{ st.gender === 'Male' ? 'M' : (st.gender === 'Female' ? 'F' : '—') }}</td>
                <td style="padding: 5px;">{{ st.birth_date || '—' }}</td>
                <td style="padding: 5px;">{{ st.guardian_name || '—' }}</td>
                <td style="padding: 5px;">{{ st.guardian_contact || st.emergency_contact_number || '—' }}</td>
                <td style="padding: 5px; text-align: center; text-transform: uppercase; font-size: 0.72rem;">{{ st.enrollment_status || 'ACTIVE' }}</td>
              </tr>
              <tr v-if="!printStudents.length">
                <td colspan="8" style="padding: 20px; text-align: center; color: #777;">No active learners enrolled in this section.</td>
              </tr>
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 0.82rem; padding: 8px 12px; background: #fdfdfd; border: 1px solid #e0e0e0;">
            <span><strong>Male Learners:</strong> {{ printMaleCount }}</span>
            <span><strong>Female Learners:</strong> {{ printFemaleCount }}</span>
            <span><strong>Total Active Enrollment:</strong> {{ printStudents.length }}</span>
          </div>

          <div class="print-signatures-row">
            <div class="sig-block">
              <div class="sig-line"></div>
              <span>Class Adviser</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span>School Head / Principal</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Print School Enrollment Summary Modal -->
    <div v-if="showPrintSummaryModal" class="modal-overlay print-modal-active" @click.self="showPrintSummaryModal = false">
      <div class="form-card" style="max-width: 820px;">
        <div class="modal-header-compact screen-only" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3>School Enrollment Master Summary</h3>
            <p class="modal-subtext">Summary breakdown by grade level, section, and gender.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" @click="triggerPrint" class="btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print Summary
            </button>
            <button type="button" @click="showPrintSummaryModal = false" class="btn-secondary">Close</button>
          </div>
        </div>

        <div class="printable-sheet">
          <div class="print-deped-header">
            <div style="font-size: 0.85rem; font-weight: 700;">REPUBLIC OF THE PHILIPPINES · DEPARTMENT OF EDUCATION</div>
            <div style="font-size: 1.15rem; font-weight: 800; margin: 4px 0;">{{ currentSchoolName }}</div>
            <div style="font-size: 0.82rem; color: #555;">ENROLLMENT &amp; POPULATION MASTER SUMMARY</div>
            <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 0.82rem; border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 6px 0;">
              <span><strong>School ID:</strong> {{ currentSchoolDepedId || '—' }}</span>
              <span><strong>As of Date:</strong> {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
            </div>
          </div>

          <table class="print-roster-table" style="width: 100%; margin-top: 14px; border-collapse: collapse; font-size: 0.82rem;">
            <thead>
              <tr style="border-bottom: 1.5px solid #222; background: #f8f8f8;">
                <th style="padding: 6px; text-align: left;">Grade Level</th>
                <th style="padding: 6px; text-align: left;">Section</th>
                <th style="padding: 6px; text-align: center;">Male</th>
                <th style="padding: 6px; text-align: center;">Female</th>
                <th style="padding: 6px; text-align: center;">Active Learners</th>
                <th style="padding: 6px; text-align: center;">Withdrawn</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in enrollmentSummaryRows" :key="row.key" style="border-bottom: 1px solid #ddd;">
                <td style="padding: 6px; font-weight: 600;">{{ row.grade }}</td>
                <td style="padding: 6px;">{{ row.section }}</td>
                <td style="padding: 6px; text-align: center;">{{ row.male }}</td>
                <td style="padding: 6px; text-align: center;">{{ row.female }}</td>
                <td style="padding: 6px; text-align: center; font-weight: 700;">{{ row.active }}</td>
                <td style="padding: 6px; text-align: center; color: #666;">{{ row.withdrawn }}</td>
              </tr>
              <tr style="border-top: 2px solid #222; background: #f4f4f4; font-weight: 800;">
                <td colspan="2" style="padding: 8px;">TOTAL SCHOOL POPULATION</td>
                <td style="padding: 8px; text-align: center;">{{ totalSummaryMale }}</td>
                <td style="padding: 8px; text-align: center;">{{ totalSummaryFemale }}</td>
                <td style="padding: 8px; text-align: center; color: var(--primary);">{{ totalSummaryActive }}</td>
                <td style="padding: 8px; text-align: center;">{{ totalSummaryWithdrawn }}</td>
              </tr>
            </tbody>
          </table>

          <div class="print-signatures-row">
            <div class="sig-block">
              <div class="sig-line"></div>
              <span>School Registrar / Records Officer</span>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <span>School Head / Principal</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <span class="show-wrap">Show
            <select v-model="pageSize" @change="onPageSizeChange" class="show-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </span>
          <button @click="openAddForm" class="btn-primary" :disabled="auth.isSuperadmin && !effectiveSchoolId">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Student(s)
          </button>
          <button @click="openImportModal" class="btn-secondary" :disabled="auth.isSuperadmin && !effectiveSchoolId" title="Bulk Import Roster from Excel (.xlsx) or CSV">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Import Roster (.xlsx / .csv)
          </button>
          <button @click="openPrintRosterModal" class="btn-secondary" title="Print DepEd Class Roster">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Roster
          </button>
          <button @click="openPrintSummaryModal" class="btn-secondary" title="Print School Enrollment Summary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Print Summary
          </button>
        </div>
        <div class="table-toolbar-right">
          <span class="tbl-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search student" />
          </span>
          <select v-if="auth.isSuperadmin" v-model="filterSchoolId" @change="onSchoolChange" class="tbl-filter">
            <option value="">None</option>
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}</option>
          </select>
          <select v-model="filterGrade" @change="filterSection = ''; currentPage = 1; loadStudents()" class="tbl-filter">
            <option value="">All Grades</option>
            <option v-for="g in grades" :key="g">{{ g }}</option>
          </select>
          <select v-model="filterSection" @change="currentPage = 1; loadStudents()" class="tbl-filter">
            <option value="">All Sections</option>
            <option v-for="s in filterSections" :key="s">{{ s }}</option>
          </select>
          <select v-model="filterGender" @change="currentPage = 1; loadStudents()" class="tbl-filter">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <label class="tbl-check"><input v-model="includeWithdrawn" @change="currentPage = 1; loadStudents()" type="checkbox" /> Include withdrawn</label>
        </div>
      </div>
      <div class="bulk-bar" v-if="selectedIds.size" style="margin: 12px 20px 0;">
        <div class="bulk-bar-left">
          <span>{{ selectedIds.size }} student{{ selectedIds.size > 1 ? 's' : '' }} selected</span>
          <span v-if="selectedWithdrawnCount > 0 && selectedActiveCount > 0" class="bulk-bar-sub">
            ({{ selectedActiveCount }} active, {{ selectedWithdrawnCount }} withdrawn)
          </span>
          <span v-else-if="selectedWithdrawnCount > 0" class="bulk-bar-sub">
            (all withdrawn)
          </span>
        </div>
        <div class="bulk-bar-right">
          <!-- Re-enroll Selected: always visible when students are selected -->
          <button @click="openBulkModal('reenroll')" class="btn-sm btn-success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
            </svg>
            Re-enroll Selected
          </button>

          <!-- Change Class / Transfer -->
          <button @click="openBulkModal('transfer')" class="btn-sm btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            Change Class
          </button>

          <!-- Promote -->
          <button @click="openBulkModal('promote')" class="btn-sm btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m18 15-6-6-6 6"/>
            </svg>
            Promote
          </button>

          <!-- Transfer School (Superadmin) -->
          <button v-if="auth.isSuperadmin" @click="openBulkModal('transfer_school')" class="btn-sm btn-secondary">
            Transfer School
          </button>

          <!-- Assign Gender -->
          <button @click="openBulkModal('gender')" class="btn-sm btn-secondary">
            Set Gender
          </button>

          <!-- Withdraw -->
          <button @click="openBulkModal('withdraw')" class="btn-sm btn-danger">
            Withdraw
          </button>

          <!-- Permanent Delete (admin/superadmin) -->
          <button v-if="auth.isAdmin" @click="openBulkModal('permanent_delete')" class="btn-sm btn-secondary" style="color: var(--destructive);" title="Permanently delete from database">
            Delete
          </button>

          <button @click="clearSelection" class="btn-sm btn-secondary">Clear</button>
        </div>
      </div>
      <div style="overflow-x: auto;">
      <table class="data-table" v-if="students.length">
        <thead>
          <tr>
            <th class="col-chk"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
            <th class="cell-id">ID</th>
            <th>Student</th>
            <th v-if="auth.isSuperadmin">School</th>
            <th>Gender</th>
            <th>Grade</th>
            <th>Section</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in pagedStudents" :key="s.id" :class="{ 'row-selected': selectedIds.has(s.id) }">
            <td class="col-chk"><input type="checkbox" :checked="selectedIds.has(s.id)" @change="toggleOne(s.id)" /></td>
            <td class="cell-id">#{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>
              <div class="cell-person">
                <span class="cell-avatar">{{ (s.name || '?').charAt(0).toUpperCase() }}</span>
                <div style="min-width: 0;">
                  <div class="cell-main cursor-pointer" @click="viewProfile(s)" :title="'View full profile & interventions for ' + s.name" style="cursor: pointer; text-decoration: underline dotted;">{{ s.name }}</div>
                  <div class="cell-sub"><span v-if="s.lrn" style="font-weight: 700; color: var(--primary);">LRN: {{ s.lrn }} &middot; </span>{{ s.grade }} &middot; {{ s.section }}</div>
                </div>
              </div>
            </td>
            <td v-if="auth.isSuperadmin">{{ schoolNameOf(s) }}</td>
            <td>
              <span v-if="s.gender" :class="['pill', s.gender === 'Male' ? 'pill--blue' : 'pill--green']">{{ s.gender }}</span>
              <span v-else style="color: var(--muted-foreground)">—</span>
            </td>
            <td>{{ s.grade }}</td>
            <td>
              {{ s.section }}
              <span v-if="s.enrollment_status === 'withdrawn'" class="pill pill--red">Withdrawn</span>
              <button
                v-if="s.enrollment_status === 'withdrawn'"
                @click="openReenrollModal(s)"
                class="btn-xs-reenroll"
                title="Re-enroll this student"
              >
                Re-enroll
              </button>
            </td>
            <td style="text-align: right;">
              <div class="row-actions">
                <button @click="viewProfile(s)" class="icon-btn" title="View profile, interventions & contacts">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 19a2 2 0 0 0-2-2h-1"/><path d="M16 11a4 4 0 0 0 1.5-.3"/></svg>
                </button>
                <button @click="viewHistory(s)" class="icon-btn" title="View enrollment history">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
                </button>
                <button @click="openEnrollmentModal(s)" class="icon-btn" title="Change enrollment">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18"/></svg>
                </button>
                <button @click="openReenrollModal(s)" class="icon-btn" :class="{ 'icon-btn--success': s.enrollment_status === 'withdrawn' }" title="Re-enroll student">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                </button>
                <button @click="editStudent(s)" class="icon-btn" title="Edit details">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button v-if="s.enrollment_status !== 'withdrawn'" @click="removeStudent(s)" class="icon-btn icon-btn--danger" title="Withdraw">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <p v-if="!students.length" class="empty">{{ auth.isSuperadmin && !effectiveSchoolId ? 'Select a school above to view its students.' : 'No students found matching your filters.' }}</p>
      <div class="table-footer" v-if="students.length">
        <span class="table-count">Showing {{ showingFrom }} to {{ showingTo }} of {{ students.length }} entries</span>
        <div class="pager">
          <button class="pager-btn" @click="prevPage" :disabled="currentPage === 1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Previous
          </button>
          <button v-for="p in pageNumbers" :key="p" class="pager-num" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
          <span v-if="totalPages > pageNumbers[pageNumbers.length - 1]" class="pager-dots">…</span>
          <button class="pager-btn" @click="nextPage" :disabled="currentPage === totalPages">
            Next
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { useAttendanceStore } from '../stores/attendance'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useGradeLevels } from '../composables/useGradeLevels'

const store = useAttendanceStore()
const auth = useAuthStore()
const { addToast } = useToast()
const { grades, sectionsByGrade, loadGradeLevels } = useGradeLevels()
const availableSections = computed(() => sectionsByGrade.value[form.value.grade] || [])
const filterSections = computed(() => filterGrade.value ? (sectionsByGrade.value[filterGrade.value] || []) : [])
const showForm = ref(false)
const editingStudent = ref(null)
const saving = ref(false)
const schools = ref([])
const filterSchoolId = ref('')
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (filterSchoolId.value || '') : (auth.schoolId || ''))
const filterGrade = ref('')
const filterSection = ref('')
const filterGender = ref('')
const includeWithdrawn = ref(false)
const searchQuery = ref('')
const students = ref([])
const form = ref({ names: '', name: '', grade: '', section: '', gender: '' })
const showEnrollmentModal = ref(false)
const enrollmentStudent = ref(null)
const enrollmentSaving = ref(false)
const enrollmentForm = ref({ eventType: 'transfer', effectiveOn: new Date().toISOString().slice(0, 10), grade: '', section: '', reason: '', targetSchoolId: '' })
const targetSchoolGrades = ref([])
const targetSchoolSections = ref({})
const showBulkModal = ref(false)
const bulkActionType = ref('transfer')
const bulkSaving = ref(false)
const bulkForm = ref({
  grade: '',
  section: '',
  gender: 'Male',
  effectiveOn: new Date().toISOString().slice(0, 10),
  reason: '',
  reenrollMode: 'keep',
  withdrawPreset: 'Transferred out to another school',
  confirmDelete: false
})
const showHistoryModal = ref(false)
const historyStudent = ref(null)
const history = ref([])
const historyLoading = ref(false)
const selectedIds = ref(new Set())
const pageSize = ref(10)
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(students.value.length / pageSize.value)))
const pagedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return students.value.slice(start, start + pageSize.value)
})
const showingFrom = computed(() => (students.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const showingTo = computed(() => Math.min(students.value.length, currentPage.value * pageSize.value))
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 4) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 2) return [1, 2, 3]
  if (cur >= total - 1) return [total - 2, total - 1, total]
  return [cur - 1, cur, cur + 1]
})
function goToPage(p) { currentPage.value = p }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function onPageSizeChange() { currentPage.value = 1 }

function applyGradeDefaults() {
  if (!grades.value.length) { form.value.grade = ''; form.value.section = ''; return }
  if (!grades.value.includes(form.value.grade)) {
    form.value.grade = grades.value[0]
    form.value.section = ''
  }
}

function schoolNameOf(s) {
  if (!s.school_id) return '—'
  const found = schools.value.find(x => x.id === s.school_id)
  return found ? (found.short ? `${found.name} (${found.short})` : found.name) : s.school_id
}

const selectedStudents = computed(() => students.value.filter(s => selectedIds.value.has(s.id)))
const selectedActiveCount = computed(() => selectedStudents.value.filter(s => s.enrollment_status !== 'withdrawn').length)
const selectedWithdrawnCount = computed(() => selectedStudents.value.filter(s => s.enrollment_status === 'withdrawn').length)

const allSelected = computed(() => students.value.length > 0 && students.value.every(s => selectedIds.value.has(s.id)))

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(students.value.map(s => s.id))
  }
}

function toggleOne(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  selectedIds.value = next
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function bulkWithdraw() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) return
  const result = await store.deleteStudents(ids, effectiveSchoolId.value)
  selectedIds.value = new Set()
  await loadStudents()
  addToast(result.count + ' students withdrawn', 'success')
}

onMounted(async () => {
  if (auth.isSuperadmin) {
    try { schools.value = await auth.getSchools() } catch {}
  }
  await loadGradeLevels(effectiveSchoolId.value || undefined)
  applyGradeDefaults()
  await loadStudents()
})

async function onSchoolChange() {
  filterGrade.value = ''
  filterSection.value = ''
  selectedIds.value = new Set()
  currentPage.value = 1
  await loadGradeLevels(filterSchoolId.value || undefined)
  applyGradeDefaults()
  await loadStudents()
}

async function loadStudents() {
  const sid = effectiveSchoolId.value
  if (auth.isSuperadmin && !sid) { students.value = []; return }
  const params = {}
  if (sid) params.schoolId = sid
  if (filterGrade.value) params.grade = filterGrade.value
  if (filterSection.value) params.section = filterSection.value
  if (filterGender.value) params.gender = filterGender.value
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
  if (includeWithdrawn.value) params.includeWithdrawn = 'true'
  students.value = await store.getStudents(params)
  if (currentPage.value > totalPages.value) currentPage.value = 1
}

let searchTimer = null
function onSearchInput() {
  currentPage.value = 1
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadStudents(), 300)
}

function openAddForm() {
  editingStudent.value = null
  form.value = {
    names: '', name: '', grade: grades.value[0] || '', section: '', gender: '',
    lrn: '', birth_date: '', address: '', guardian_name: '', guardian_relationship: '',
    guardian_contact: '', emergency_contact_name: '', emergency_contact_number: '',
    consent_data_sharing: true, consent_medical_emergency: true
  }
  showForm.value = true
}

function resetForm() {
  form.value = {
    names: '', name: '', grade: grades.value[0] || '', section: '', gender: '',
    lrn: '', birth_date: '', address: '', guardian_name: '', guardian_relationship: '',
    guardian_contact: '', emergency_contact_name: '', emergency_contact_number: '',
    consent_data_sharing: true, consent_medical_emergency: true
  }
  editingStudent.value = null
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

function capitalizeName(name) {
  return name.toUpperCase()
}

function parseNames(text) {
  return text.split('\n').map(n => n.trim().replace(/\r$/, '')).filter(Boolean).map(capitalizeName)
}

async function handleSave() {
  saving.value = true
  try {
    const sid = effectiveSchoolId.value
    if (auth.isSuperadmin && !sid) throw new Error('Select a school first')
    if (editingStudent.value) {
      await store.updateStudent(editingStudent.value.id, {
        name: capitalizeName(form.value.name),
        gender: form.value.gender,
        lrn: form.value.lrn,
        birth_date: form.value.birth_date,
        address: form.value.address,
        guardian_name: form.value.guardian_name,
        guardian_relationship: form.value.guardian_relationship,
        guardian_contact: form.value.guardian_contact,
        emergency_contact_name: form.value.emergency_contact_name,
        emergency_contact_number: form.value.emergency_contact_number,
        consent_data_sharing: form.value.consent_data_sharing,
        consent_medical_emergency: form.value.consent_medical_emergency
      }, effectiveSchoolId.value)
      addToast('Student profile updated', 'success')
      await loadStudents()
      if (profileStudent.value?.id === editingStudent.value.id) {
        await viewProfile(editingStudent.value)
      }
      cancelForm()
    } else {
      const names = parseNames(form.value.names)
      if (names.length === 0) {
        addToast('No names provided', 'error')
        return
      }
      if (names.length === 1) {
        await store.addStudent({
          ...(sid ? { schoolId: sid } : {}),
          name: names[0],
          grade: form.value.grade,
          section: form.value.section,
          gender: form.value.gender,
          lrn: form.value.lrn,
          birth_date: form.value.birth_date,
          address: form.value.address,
          guardian_name: form.value.guardian_name,
          guardian_relationship: form.value.guardian_relationship,
          guardian_contact: form.value.guardian_contact,
          emergency_contact_name: form.value.emergency_contact_name,
          emergency_contact_number: form.value.emergency_contact_number,
          consent_data_sharing: form.value.consent_data_sharing,
          consent_medical_emergency: form.value.consent_medical_emergency
        })
        addToast('Student added', 'success')
      } else {
        const result = await store.addStudents({ ...(sid ? { schoolId: sid } : {}), names, grade: form.value.grade, section: form.value.section, gender: form.value.gender })
        const added = result.count
        const skipped = result.skipped || []
        if (skipped.length) addToast(added + ' added, ' + skipped.length + ' skipped (duplicates)', 'warning')
        else addToast(added + ' students added', 'success')
      }
      form.value.names = ''
      await loadStudents()
      saving.value = false
      return
    }
  } catch (e) {
    addToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

function editStudent(s) {
  editingStudent.value = s
  form.value = {
    names: '',
    name: s.name,
    grade: s.grade,
    section: s.section,
    gender: s.gender || '',
    lrn: s.lrn || '',
    birth_date: s.birth_date || '',
    address: s.address || '',
    guardian_name: s.guardian_name || '',
    guardian_relationship: s.guardian_relationship || '',
    guardian_contact: s.guardian_contact || '',
    emergency_contact_name: s.emergency_contact_name || '',
    emergency_contact_number: s.emergency_contact_number || '',
    consent_data_sharing: s.consent_data_sharing !== 0,
    consent_medical_emergency: s.consent_medical_emergency !== 0
  }
  showForm.value = true
}

function openEnrollmentModal(student) {
  enrollmentStudent.value = student
  enrollmentForm.value = {
    eventType: student.enrollment_status === 'withdrawn' ? 'reenroll' : 'transfer',
    effectiveOn: new Date().toISOString().slice(0, 10),
    grade: student.grade,
    section: student.section,
    reason: '',
    targetSchoolId: ''
  }
  targetSchoolGrades.value = []
  targetSchoolSections.value = {}
  showEnrollmentModal.value = true
}

async function onTransferSchoolChange() {
  const sid = enrollmentForm.value.targetSchoolId
  if (!sid) {
    targetSchoolGrades.value = []
    targetSchoolSections.value = {}
    return
  }
  try {
    const res = await auth.api(`/schools/${sid}/grades`)
    const levels = res.levels || []
    targetSchoolGrades.value = levels.map(l => l.grade)
    const map = {}
    levels.forEach(l => { map[l.grade] = l.sections || [] })
    targetSchoolSections.value = map
    if (targetSchoolGrades.value.length) {
      enrollmentForm.value.grade = targetSchoolGrades.value[0]
      enrollmentForm.value.section = (targetSchoolSections.value[enrollmentForm.value.grade] || [])[0] || ''
    }
  } catch (err) {
    addToast('Failed to load target school grade levels: ' + err.message, 'error')
  }
}

function onEnrollmentGradeChange() {
  const map = enrollmentForm.value.eventType === 'transfer_school' ? targetSchoolSections.value : sectionsByGrade.value
  enrollmentForm.value.section = (map[enrollmentForm.value.grade] || [])[0] || ''
}

async function onBulkTransferSchoolChange() {
  const sid = bulkForm.value.targetSchoolId
  if (!sid) {
    targetSchoolGrades.value = []
    targetSchoolSections.value = {}
    return
  }
  try {
    const res = await auth.api(`/schools/${sid}/grades`)
    const levels = res.levels || []
    targetSchoolGrades.value = levels.map(l => l.grade)
    const map = {}
    levels.forEach(l => { map[l.grade] = l.sections || [] })
    targetSchoolSections.value = map
    if (targetSchoolGrades.value.length) {
      bulkForm.value.grade = targetSchoolGrades.value[0]
      bulkForm.value.section = (targetSchoolSections.value[bulkForm.value.grade] || [])[0] || ''
    }
  } catch (err) {
    addToast('Failed to load destination school grade levels: ' + err.message, 'error')
  }
}

function onBulkTransferGradeChange() {
  bulkForm.value.section = (targetSchoolSections.value[bulkForm.value.grade] || [])[0] || ''
}

function openReenrollModal(student) {
  enrollmentStudent.value = student
  const defaultGrade = student.grade || (grades.value[0] || '')
  enrollmentForm.value = {
    eventType: 'reenroll',
    effectiveOn: new Date().toISOString().slice(0, 10),
    grade: defaultGrade,
    section: student.section || (sectionsByGrade.value[defaultGrade]?.[0] || ''),
    reason: student.enrollment_status === 'withdrawn' ? 'Re-enrolled after withdrawal' : 'Re-enrolled'
  }
  showEnrollmentModal.value = true
}

function openBulkModal(action) {
  bulkActionType.value = action
  const defaultGrade = filterGrade.value || grades.value[0] || ''
  const defaultSec = filterSection.value || (sectionsByGrade.value[defaultGrade] || [])[0] || ''

  bulkForm.value = {
    grade: defaultGrade,
    section: defaultSec,
    gender: 'Male',
    effectiveOn: new Date().toISOString().slice(0, 10),
    reason: '',
    reenrollMode: 'keep',
    withdrawPreset: 'Transferred out to another school',
    confirmDelete: false
  }

  if (action === 'transfer') {
    bulkForm.value.reason = 'Class section transfer'
  } else if (action === 'promote') {
    bulkForm.value.reason = 'Promoted to next grade level'
  } else if (action === 'transfer_school') {
    bulkForm.value.reason = 'Transferred to another school'
    targetSchoolGrades.value = []
    targetSchoolSections.value = {}
  } else if (action === 'reenroll') {
    bulkForm.value.reason = 'Re-enrolled after withdrawal'
  } else if (action === 'withdraw') {
    bulkForm.value.reason = 'Transferred out to another school'
  }

  showBulkModal.value = true
}

function closeBulkModal() {
  showBulkModal.value = false
}

function onWithdrawPresetChange() {
  if (bulkForm.value.withdrawPreset !== 'Other') {
    bulkForm.value.reason = bulkForm.value.withdrawPreset
  }
}

const bulkModalTitle = computed(() => {
  const count = selectedIds.value.size
  switch (bulkActionType.value) {
    case 'transfer':
      return `Change Class for ${selectedActiveCount.value || count} Student${(selectedActiveCount.value || count) > 1 ? 's' : ''}`
    case 'promote':
      return `Promote ${selectedActiveCount.value || count} Student${(selectedActiveCount.value || count) > 1 ? 's' : ''}`
    case 'transfer_school':
      return `Transfer ${selectedActiveCount.value || count} Student${(selectedActiveCount.value || count) > 1 ? 's' : ''} to Another School`
    case 'reenroll':
      return `Re-enroll ${count} Student${count > 1 ? 's' : ''}`
    case 'withdraw':
      return `Withdraw ${selectedActiveCount.value || count} Student${(selectedActiveCount.value || count) > 1 ? 's' : ''}`
    case 'gender':
      return `Set Gender for ${count} Student${count > 1 ? 's' : ''}`
    case 'permanent_delete':
      return `Permanently Delete ${count} Student${count > 1 ? 's' : ''}`
    default:
      return 'Bulk Student Action'
  }
})

const bulkModalSubtitle = computed(() => {
  switch (bulkActionType.value) {
    case 'transfer':
      return 'Move selected active learners to another grade level and section. An enrollment transfer event will be recorded.'
    case 'promote':
      return 'Advance selected active learners to their next grade level and section.'
    case 'transfer_school':
      return 'Move selected active learners to another school and assign them to a destination class. Paired transfer-out and transfer-in events will be recorded.'
    case 'reenroll':
      return 'Restore selected learners back to active enrollment status and record a re-enrollment event.'
    case 'withdraw':
      return 'Mark learners as withdrawn. Their historical attendance and monthly SF2 filings will remain preserved.'
    case 'gender':
      return 'Batch assign learner gender (Male / Female) for official DepEd SF2 attendance reporting.'
    case 'permanent_delete':
      return 'Completely remove selected students and all associated attendance entries from the database.'
    default:
      return ''
  }
})

const bulkSubmitButtonLabel = computed(() => {
  if (bulkSaving.value) return 'Processing...'
  switch (bulkActionType.value) {
    case 'transfer': return 'Apply Class Change'
    case 'promote': return 'Promote Students'
    case 'transfer_school': return 'Transfer to School'
    case 'reenroll': return 'Re-enroll Students'
    case 'withdraw': return 'Confirm Withdrawal'
    case 'gender': return 'Update Gender'
    case 'permanent_delete': return 'Permanently Delete'
    default: return 'Confirm'
  }
})

async function submitBulkAction() {
  const allIds = Array.from(selectedIds.value)
  if (!allIds.length) return

  let targetIds = allIds
  if (['transfer', 'promote', 'transfer_school'].includes(bulkActionType.value)) {
    const active = selectedStudents.value.filter(s => s.enrollment_status !== 'withdrawn').map(s => s.id)
    if (!active.length) {
      addToast('No active students selected for this action. Please re-enroll withdrawn students first.', 'warning')
      return
    }
    targetIds = active
  } else if (bulkActionType.value === 'withdraw') {
    const active = selectedStudents.value.filter(s => s.enrollment_status !== 'withdrawn').map(s => s.id)
    if (!active.length) {
      addToast('Selected students are already withdrawn', 'warning')
      return
    }
    targetIds = active
  } else if (bulkActionType.value === 'reenroll') {
    targetIds = allIds
  }

  if (bulkActionType.value === 'permanent_delete' && !bulkForm.value.confirmDelete) {
    addToast('Please check the confirmation box to permanently delete students', 'error')
    return
  }

  if (['transfer', 'promote', 'transfer_school'].includes(bulkActionType.value)) {
    if (bulkActionType.value === 'transfer_school' && !bulkForm.value.targetSchoolId) {
      addToast('Please select a destination school', 'error')
      return
    }
    if (!bulkForm.value.grade || !bulkForm.value.section) {
      addToast('Please select both grade and section', 'error')
      return
    }
  }

  if (bulkActionType.value === 'reenroll' && bulkForm.value.reenrollMode === 'assign') {
    if (!bulkForm.value.grade || !bulkForm.value.section) {
      addToast('Please select both grade and section', 'error')
      return
    }
  }

  bulkSaving.value = true
  try {
    const payload = {
      ids: targetIds,
      action: bulkActionType.value,
      effectiveOn: bulkForm.value.effectiveOn,
      reason: bulkForm.value.reason
    }

    if (['transfer', 'promote'].includes(bulkActionType.value)) {
      payload.grade = bulkForm.value.grade
      payload.section = bulkForm.value.section
    } else if (bulkActionType.value === 'transfer_school') {
      payload.targetSchoolId = bulkForm.value.targetSchoolId
      payload.grade = bulkForm.value.grade
      payload.section = bulkForm.value.section
    } else if (bulkActionType.value === 'reenroll' && bulkForm.value.reenrollMode === 'assign') {
      payload.grade = bulkForm.value.grade
      payload.section = bulkForm.value.section
    } else if (bulkActionType.value === 'gender') {
      payload.gender = bulkForm.value.gender
    }

    const result = await store.bulkStudentAction(payload, effectiveSchoolId.value)
    closeBulkModal()
    selectedIds.value = new Set()
    await loadStudents()

    const actionLabels = {
      transfer: 'transferred',
      promote: 'promoted',
      transfer_school: 'transferred across schools',
      reenroll: 're-enrolled',
      withdraw: 'withdrawn',
      gender: 'gender updated for',
      permanent_delete: 'permanently deleted'
    }

    if (result.count) {
      addToast(`${result.count} student${result.count > 1 ? 's' : ''} ${actionLabels[bulkActionType.value] || 'updated'} successfully`, 'success')
    }
    if (result.skipped?.length) {
      addToast(`${result.skipped.length} student${result.skipped.length > 1 ? 's' : ''} skipped: ${result.skipped[0]?.reason}`, 'warning')
    }
  } catch (err) {
    addToast(err.message, 'error')
  } finally {
    bulkSaving.value = false
  }
}

function closeEnrollmentModal() {
  showEnrollmentModal.value = false
  enrollmentStudent.value = null
}

async function saveEnrollmentEvent() {
  if (!enrollmentStudent.value) return
  enrollmentSaving.value = true
  try {
    if (enrollmentForm.value.eventType === 'reenroll') {
      await store.reenrollStudent(enrollmentStudent.value.id, enrollmentForm.value, effectiveSchoolId.value)
    } else if (enrollmentForm.value.eventType === 'transfer_school') {
      await store.transferStudentSchool(enrollmentStudent.value.id, enrollmentForm.value, effectiveSchoolId.value)
    } else {
      await store.createEnrollmentEvent(enrollmentStudent.value.id, enrollmentForm.value, effectiveSchoolId.value)
    }
    addToast('Enrollment updated', 'success')
    closeEnrollmentModal()
    await loadStudents()
  } catch (e) {
    addToast(e.message, 'error')
  } finally {
    enrollmentSaving.value = false
  }
}

async function viewHistory(student) {
  historyStudent.value = student
  history.value = []
  historyLoading.value = true
  showHistoryModal.value = true
  try { history.value = await store.getEnrollmentHistory(student.id, effectiveSchoolId.value) } catch (e) { addToast(e.message, 'error') }
  finally { historyLoading.value = false }
}

async function removeStudent(student) {
  try {
    await store.deleteStudent(student.id, effectiveSchoolId.value)
    await loadStudents()
    addToast('Student withdrawn', 'success')
  } catch (e) {
    addToast(e.message, 'error')
  }
}

// Bulk Roster Import State & Methods
const showImportModal = ref(false)
const importStep = ref(1)
const importTab = ref('file')
const fileInputRef = ref(null)
const importFileName = ref('')
const parsedRawRows = ref([])
const importText = ref('')
const importDefaultGrade = ref('')
const importDefaultSection = ref('')
const importEffectiveOn = ref(new Date().toISOString().slice(0, 10))
const importReason = ref('Bulk roster import')
const skipDuplicates = ref(true)
const validatingRoster = ref(false)
const importingRoster = ref(false)
const validationResults = ref(null)

function openImportModal() {
  importStep.value = 1
  importTab.value = 'file'
  importFileName.value = ''
  parsedRawRows.value = []
  importText.value = ''
  importDefaultGrade.value = filterGrade.value || (grades.value[0] || '')
  importDefaultSection.value = filterSection.value || (sectionsByGrade.value[importDefaultGrade.value]?.[0] || '')
  validationResults.value = null
  showImportModal.value = true
}

function closeImportModal() {
  showImportModal.value = false
  validationResults.value = null
}

function downloadTemplate() {
  const sampleData = [
    { Name: 'Dela Cruz, Juan M.', Gender: 'Male', Grade: 'Grade 10', Section: 'Rizal' },
    { Name: 'Santos, Maria Clara P.', Gender: 'Female', Grade: 'Grade 10', Section: 'Rizal' },
    { Name: 'Reyes, Gabriel T.', Gender: 'Male', Grade: 'Grade 10', Section: 'Bonifacio' },
    { Name: 'Aquino, Teresa S.', Gender: 'Female', Grade: 'Grade 10', Section: 'Bonifacio' }
  ]
  const ws = XLSX.utils.json_to_sheet(sampleData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Learners')
  XLSX.writeFile(wb, 'ElyTrack_Learner_Roster_Template.xlsx')
}

function handleFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  importFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (evt) => {
    try {
      const data = new Uint8Array(evt.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      parsedRawRows.value = json
    } catch (err) {
      addToast('Failed to parse file: ' + err.message, 'error')
    }
  }
  reader.readAsArrayBuffer(file)
}

function parsePastedRows(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const rows = []
  for (const line of lines) {
    const parts = line.includes('\t') ? line.split('\t') : line.split(',')
    if (parts.length >= 1) {
      rows.push({
        name: parts[0]?.trim() || '',
        gender: parts[1]?.trim() || '',
        grade: parts[2]?.trim() || '',
        section: parts[3]?.trim() || ''
      })
    }
  }
  return rows
}

function mapRowKeys(r) {
  let name = ''
  for (const k of ['name', 'Name', 'learner name', 'Learner Name', 'student name', 'Student Name', 'full name', 'Full Name']) {
    if (r[k]) { name = String(r[k]).trim(); break }
  }
  if (!name && (r['Last Name'] || r['last_name'] || r['LastName'])) {
    const l = r['Last Name'] || r['last_name'] || r['LastName'] || ''
    const f = r['First Name'] || r['first_name'] || r['FirstName'] || ''
    const m = r['Middle Name'] || r['middle_name'] || r['MiddleName'] || ''
    name = `${l}, ${f}${m ? ' ' + m : ''}`.trim()
  }

  let gender = ''
  for (const k of ['gender', 'Gender', 'sex', 'Sex', 'GENDER', 'SEX']) {
    if (r[k]) { gender = String(r[k]).trim(); break }
  }

  let grade = ''
  for (const k of ['grade', 'Grade', 'grade level', 'Grade Level', 'GRADE']) {
    if (r[k]) { grade = String(r[k]).trim(); break }
  }

  let section = ''
  for (const k of ['section', 'Section', 'SECTION']) {
    if (r[k]) { section = String(r[k]).trim(); break }
  }

  return { name, gender, grade, section }
}

async function validateRoster() {
  let rowsToValidate = []
  if (importTab.value === 'file') {
    rowsToValidate = parsedRawRows.value.map(mapRowKeys)
  } else {
    rowsToValidate = parsePastedRows(importText.value)
  }

  if (!rowsToValidate.length) {
    addToast('Please provide at least one student row', 'error')
    return
  }

  validatingRoster.value = true
  try {
    const res = await store.bulkValidateStudents(
      rowsToValidate,
      importDefaultGrade.value,
      importDefaultSection.value,
      effectiveSchoolId.value
    )
    validationResults.value = res
    importStep.value = 2
  } catch (err) {
    addToast(err.message || 'Validation failed', 'error')
  } finally {
    validatingRoster.value = false
  }
}

const displayPreviewRows = computed(() => {
  if (!validationResults.value) return []
  const list = []
  for (const v of validationResults.value.valid || []) {
    list.push({ ...v, status: 'valid' })
  }
  for (const d of validationResults.value.duplicates || []) {
    list.push({ ...d, status: 'duplicate' })
  }
  for (const e of validationResults.value.errors || []) {
    list.push({ ...e, name: e.raw?.name || 'Incomplete', grade: e.raw?.grade || '—', section: e.raw?.section || '—', status: 'error' })
  }
  return list.sort((a, b) => a.rowNumber - b.rowNumber)
})

const eligibleImportRows = computed(() => {
  if (!validationResults.value) return []
  const valids = validationResults.value.valid || []
  if (skipDuplicates.value) return valids
  const dups = validationResults.value.duplicates || []
  return [...valids, ...dups]
})

async function confirmImport() {
  const toImport = eligibleImportRows.value
  if (!toImport.length) return

  importingRoster.value = true
  try {
    const res = await store.bulkImportStudents(
      toImport,
      importEffectiveOn.value,
      importReason.value,
      effectiveSchoolId.value
    )
    if (res?.success) {
      addToast(`Successfully enrolled ${res.count} learners!`, 'success')
      closeImportModal()
      await loadStudents()
    }
  } catch (err) {
    addToast(err.message || 'Import failed', 'error')
  } finally {
    importingRoster.value = false
  }
}

// Student Profile, Interventions, and Contact Logs State & Handlers
const showProfileModal = ref(false)
const profileStudent = ref(null)
const profileTab = ref('overview')
const profileLoading = ref(false)
const profileDetails = ref(null)

const showNewInterventionForm = ref(false)
const newIntervention = ref({
  concern_type: 'attendance',
  action_taken: '',
  follow_up_date: '',
  resolution_status: 'open',
  notes: ''
})
const savingIntervention = ref(false)

const showNewContactForm = ref(false)
const newContact = ref({
  contact_date: new Date().toISOString().slice(0, 10),
  contact_method: 'phone',
  guardian_name: '',
  guardian_contact: '',
  reason: '',
  outcome: ''
})
const savingContact = ref(false)

async function viewProfile(student) {
  profileStudent.value = student
  profileTab.value = 'overview'
  showProfileModal.value = true
  profileLoading.value = true
  showNewInterventionForm.value = false
  showNewContactForm.value = false
  try {
    const data = await store.getStudentProfile(student.id, effectiveSchoolId.value)
    profileDetails.value = data
  } catch (err) {
    addToast('Failed to load learner profile: ' + err.message, 'error')
  } finally {
    profileLoading.value = false
  }
}

async function saveIntervention() {
  if (!newIntervention.value.action_taken.trim()) {
    addToast('Action taken description is required', 'error')
    return
  }
  savingIntervention.value = true
  try {
    await store.createIntervention(profileStudent.value.id, newIntervention.value, effectiveSchoolId.value)
    addToast('Intervention recorded', 'success')
    newIntervention.value = { concern_type: 'attendance', action_taken: '', follow_up_date: '', resolution_status: 'open', notes: '' }
    showNewInterventionForm.value = false
    const data = await store.getStudentProfile(profileStudent.value.id, effectiveSchoolId.value)
    profileDetails.value = data
  } catch (err) {
    addToast(err.message, 'error')
  } finally {
    savingIntervention.value = false
  }
}

async function updateInterventionStatus(inv, status) {
  try {
    await store.updateIntervention(profileStudent.value.id, inv.id, { resolution_status: status }, effectiveSchoolId.value)
    addToast(`Intervention marked as ${status.replace('_', ' ')}`, 'success')
    const data = await store.getStudentProfile(profileStudent.value.id, effectiveSchoolId.value)
    profileDetails.value = data
  } catch (err) {
    addToast(err.message, 'error')
  }
}

async function removeIntervention(inv) {
  if (!confirm('Are you sure you want to delete this intervention record?')) return
  try {
    await store.deleteIntervention(profileStudent.value.id, inv.id, effectiveSchoolId.value)
    addToast('Intervention deleted', 'success')
    const data = await store.getStudentProfile(profileStudent.value.id, effectiveSchoolId.value)
    profileDetails.value = data
  } catch (err) {
    addToast(err.message, 'error')
  }
}

async function saveContactLog() {
  if (!newContact.value.outcome.trim() && !newContact.value.reason.trim()) {
    addToast('Reason or outcome note is required', 'error')
    return
  }
  savingContact.value = true
  try {
    await store.logGuardianContact(profileStudent.value.id, {
      ...newContact.value,
      guardian_name: newContact.value.guardian_name || profileDetails.value?.guardian_name || '',
      guardian_contact: newContact.value.guardian_contact || profileDetails.value?.guardian_contact || ''
    }, effectiveSchoolId.value)
    addToast('Guardian contact logged', 'success')
    newContact.value = {
      contact_date: new Date().toISOString().slice(0, 10),
      contact_method: 'phone',
      guardian_name: '',
      guardian_contact: '',
      reason: '',
      outcome: ''
    }
    showNewContactForm.value = false
    const data = await store.getStudentProfile(profileStudent.value.id, effectiveSchoolId.value)
    profileDetails.value = data
  } catch (err) {
    addToast(err.message, 'error')
  } finally {
    savingContact.value = false
  }
}

async function removeContactLog(c) {
  if (!confirm('Are you sure you want to delete this contact log entry?')) return
  try {
    await store.deleteGuardianContact(profileStudent.value.id, c.id, effectiveSchoolId.value)
    addToast('Contact log deleted', 'success')
    const data = await store.getStudentProfile(profileStudent.value.id, effectiveSchoolId.value)
    profileDetails.value = data
  } catch (err) {
    addToast(err.message, 'error')
  }
}

// Printable Class Roster & Enrollment Summary State & Handlers
const showPrintRosterModal = ref(false)
const showPrintSummaryModal = ref(false)
const printGrade = ref('')
const printSection = ref('')

const currentSchoolName = computed(() => {
  const sid = effectiveSchoolId.value
  const found = schools.value.find(s => s.id === sid)
  return found?.name || auth.user?.school?.name || auth.user?.school?.school_name || 'Baguio Patriotic High School'
})

const currentSchoolDepedId = computed(() => {
  const sid = effectiveSchoolId.value
  const found = schools.value.find(s => s.id === sid)
  return found?.school_id || auth.user?.school?.school_id || ''
})

const currentSchoolYear = computed(() => {
  const sid = effectiveSchoolId.value
  const found = schools.value.find(s => s.id === sid)
  return found?.school_year || auth.user?.school?.school_year || '2026-2027'
})

const printStudents = computed(() => {
  if (!printGrade.value || !printSection.value) return students.value.filter(s => s.enrollment_status !== 'withdrawn')
  return students.value.filter(s => s.grade === printGrade.value && s.section === printSection.value && s.enrollment_status !== 'withdrawn')
})

const printMaleCount = computed(() => printStudents.value.filter(s => s.gender === 'Male').length)
const printFemaleCount = computed(() => printStudents.value.filter(s => s.gender === 'Female').length)

const enrollmentSummaryRows = computed(() => {
  const map = new Map()
  for (const s of students.value) {
    const key = `${s.grade}__${s.section}`
    if (!map.has(key)) {
      map.set(key, { key, grade: s.grade, section: s.section, male: 0, female: 0, active: 0, withdrawn: 0 })
    }
    const row = map.get(key)
    if (s.enrollment_status === 'withdrawn') {
      row.withdrawn++
    } else {
      row.active++
      if (s.gender === 'Male') row.male++
      else if (s.gender === 'Female') row.female++
    }
  }
  return Array.from(map.values()).sort((a, b) => a.grade.localeCompare(b.grade) || a.section.localeCompare(b.section))
})

const totalSummaryMale = computed(() => enrollmentSummaryRows.value.reduce((acc, r) => acc + r.male, 0))
const totalSummaryFemale = computed(() => enrollmentSummaryRows.value.reduce((acc, r) => acc + r.female, 0))
const totalSummaryActive = computed(() => enrollmentSummaryRows.value.reduce((acc, r) => acc + r.active, 0))
const totalSummaryWithdrawn = computed(() => enrollmentSummaryRows.value.reduce((acc, r) => acc + r.withdrawn, 0))

function openPrintRosterModal() {
  printGrade.value = filterGrade.value || grades.value[0] || ''
  printSection.value = filterSection.value || (sectionsByGrade.value[printGrade.value] ? sectionsByGrade.value[printGrade.value][0] : '')
  showPrintRosterModal.value = true
}

function openPrintSummaryModal() {
  showPrintSummaryModal.value = true
}

function triggerPrint() {
  window.print()
}
</script>

<style scoped>
.profile-tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  margin-top: 14px;
  margin-bottom: 16px;
}
.profile-tab-btn {
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted-foreground);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}
.profile-tab-btn:hover {
  color: var(--foreground);
}
.profile-tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.count-badge {
  background: var(--secondary);
  color: var(--secondary-foreground);
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;
}
.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.profile-card {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--card);
}
.profile-card h4 {
  font-size: 0.88rem;
  margin: 0 0 10px;
  color: var(--foreground);
}
.profile-field-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.8rem;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}
.profile-field-row:last-child {
  border-bottom: none;
}
.profile-field-row span {
  color: var(--muted-foreground);
}
.profile-field-row strong {
  color: var(--foreground);
  text-align: right;
}
.consent-pill {
  display: flex;
  flex-direction: column;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  font-size: 0.8rem;
}
.consent--granted {
  border-color: color-mix(in srgb, var(--success) 35%, var(--border));
  background: var(--success-bg);
  color: var(--success);
}
.consent--denied {
  border-color: color-mix(in srgb, var(--destructive) 35%, var(--border));
  background: var(--red-bg);
  color: var(--destructive);
}
.consent-pill small {
  color: var(--muted-foreground);
  font-size: 0.72rem;
  margin-top: 2px;
}
.inline-subform {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--secondary);
  margin-bottom: 16px;
}
.intervention-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
}
.intervention-item-box {
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
}
.intervention-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.intervention-body {
  font-size: 0.82rem;
  margin-top: 8px;
  line-height: 1.45;
}
.printable-sheet {
  padding: 20px;
  background: #ffffff;
  color: #111111;
  border-radius: 4px;
}
.print-deped-header {
  text-align: center;
}
.print-signatures-row {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding: 0 40px;
}
.sig-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
}
.sig-line {
  width: 100%;
  border-top: 1.5px solid #222;
  margin-bottom: 6px;
}
.sig-block span {
  font-size: 0.78rem;
  font-weight: 600;
  color: #333;
}

@media print {
  body * {
    visibility: hidden;
  }
  .print-modal-active,
  .print-modal-active .printable-sheet,
  .print-modal-active .printable-sheet * {
    visibility: visible;
  }
  .print-modal-active {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: #fff !important;
    padding: 0 !important;
    margin: 0 !important;
    z-index: 999999;
  }
  .print-modal-active .form-card {
    max-width: 100% !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
  }
  .screen-only {
    display: none !important;
  }
}
</style>
