<template>
  <div class="grading-page">
    <!-- Header -->
    <div class="page-header grading-header">
      <div class="page-header-text">
        <div class="dashboard-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div>
          <h1>Academic Grading &amp; SF9 (Form 138)</h1>
          <p>DepEd Order No. 8, s. 2015 compliant classroom assessment, live transmutation, class records, and official report cards.</p>
        </div>
      </div>

      <!-- Superadmin School Selector -->
      <div v-if="auth.isSuperadmin" class="school-select-wrapper">
        <label class="school-select-label">School:</label>
        <select v-model="selectedSchoolId" @change="onSchoolChange" class="form-select school-select">
          <option v-for="s in schools" :key="s.id" :value="s.id">
            {{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}
          </option>
        </select>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="grading-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'encoding' }"
        @click="activeTab = 'encoding'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Grade Encoding (Class Record)
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'subjects' }"
        @click="activeTab = 'subjects'; loadSubjects()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path>
        </svg>
        Subject &amp; Assessment Setup
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'form138' }"
        @click="activeTab = 'form138'; onSwitchToForm138()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        DepEd Form 138 (SF9 Card)
      </button>

      <button
        class="tab-btn"
        :class="{ active: activeTab === 'analytics' }"
        @click="activeTab = 'analytics'; loadAnalytics()"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        Analytics &amp; Honors
      </button>
    </div>

    <!-- ======================================================== -->
    <!-- TAB 1: GRADE ENCODING (CLASS RECORD) -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'encoding'" class="tab-content">
      <!-- Toolbar Filter Bar -->
      <div class="card toolbar-card">
        <div class="toolbar-grid">
          <div class="form-group">
            <label>Grade Level</label>
            <select v-model="filter.grade" @change="onGradeChange" class="form-select">
              <option value="">Select Grade</option>
              <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Section</label>
            <select v-model="filter.section" class="form-select">
              <option value="">Select Section</option>
              <option v-for="s in availableSections" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Subject</label>
            <select v-model="filter.subjectId" class="form-select">
              <option value="">Select Subject</option>
              <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
                {{ sub.subject_name }} ({{ sub.subject_code || 'SUB' }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Quarter</label>
            <select v-model="filter.quarter" class="form-select">
              <option value="Q1">1st Quarter (Q1)</option>
              <option value="Q2">2nd Quarter (Q2)</option>
              <option value="Q3">3rd Quarter (Q3)</option>
              <option value="Q4">4th Quarter (Q4)</option>
            </select>
          </div>

          <div class="form-group">
            <label>School Year</label>
            <input v-model="filter.schoolYear" class="form-input" placeholder="e.g. 2025-2026" />
          </div>

          <div class="toolbar-actions">
            <button
              type="button"
              class="btn-primary"
              :disabled="loadingSheet || !filter.grade || !filter.section || !filter.subjectId"
              @click="loadGradeSheet"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              {{ loadingSheet ? 'Loading…' : 'Load Class Record' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Subject Weight Badge & Notice -->
      <div v-if="activeSubject" class="subject-weights-banner">
        <div class="subject-meta">
          <span class="subject-title"><strong>{{ activeSubject.subject_name }}</strong> ({{ filter.quarter }})</span>
          <span class="badge badge-grade">{{ filter.grade }} - {{ filter.section }}</span>
          <span class="badge badge-sy">S.Y. {{ filter.schoolYear }}</span>
        </div>
        <div class="weight-pills">
          <span class="weight-pill pill-ww">Written Work: <strong>{{ activeSubject.weight_ww }}%</strong></span>
          <span class="weight-pill pill-pt">Performance Task: <strong>{{ activeSubject.weight_pt }}%</strong></span>
          <span class="weight-pill pill-qa">Quarterly Assessment: <strong>{{ activeSubject.weight_qa }}%</strong></span>
        </div>
      </div>

      <!-- Grade Sheet Table -->
      <div v-if="sheetLearners.length" class="card table-card">
        <div class="table-card-header">
          <div>
            <h3>Enrolled Learners ({{ sheetLearners.length }})</h3>
            <p class="sub-text">Enter raw scores. Initial grade and transmuted grade calculate automatically.</p>
          </div>
          <div class="card-header-actions">
            <button
              type="button"
              class="btn-primary"
              :disabled="savingSheet"
              @click="saveGradeSheet"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {{ savingSheet ? 'Saving…' : 'Save Grades' }}
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table grade-sheet-table">
            <thead>
              <tr>
                <th rowspan="2" class="col-num">#</th>
                <th rowspan="2" class="col-lrn">LRN</th>
                <th rowspan="2" class="col-name">Learner Name</th>
                <th rowspan="2" class="col-gender">Sex</th>
                <th colspan="2" class="group-header group-ww">
                  Written Work ({{ activeSubject?.weight_ww }}%)
                </th>
                <th colspan="2" class="group-header group-pt">
                  Performance Tasks ({{ activeSubject?.weight_pt }}%)
                </th>
                <th colspan="2" class="group-header group-qa">
                  Quarterly Exam ({{ activeSubject?.weight_qa }}%)
                </th>
                <th rowspan="2" class="col-init">Initial</th>
                <th rowspan="2" class="col-trans">Quarter Grade</th>
                <th rowspan="2" class="col-remarks">Remarks</th>
                <th rowspan="2" class="col-lock">Lock</th>
                <th rowspan="2" class="col-action">Card</th>
              </tr>
              <tr>
                <th class="sub-col">Score</th>
                <th class="sub-col">Total</th>
                <th class="sub-col">Score</th>
                <th class="sub-col">Total</th>
                <th class="sub-col">Score</th>
                <th class="sub-col">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(st, idx) in sheetLearners"
                :key="st.id"
                :class="{ 'row-locked': st.is_locked, 'row-failed': st.transmuted_grade < 75 && st.transmuted_grade > 0 }"
              >
                <td class="col-num">{{ idx + 1 }}</td>
                <td class="col-lrn font-mono">{{ st.lrn || '—' }}</td>
                <td class="col-name">
                  <strong>{{ st.name }}</strong>
                </td>
                <td class="col-gender">
                  <span class="gender-tag" :class="st.gender?.toUpperCase() === 'FEMALE' ? 'tag-female' : 'tag-male'">
                    {{ st.gender?.toUpperCase() === 'FEMALE' ? 'F' : 'M' }}
                  </span>
                </td>

                <!-- Written Work -->
                <td>
                  <input
                    type="number"
                    min="0"
                    :max="st.ww_total"
                    v-model.number="st.ww_score"
                    @input="recomputeLearner(st)"
                    :disabled="Boolean(st.is_locked && !auth.isAdmin)"
                    class="score-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    v-model.number="st.ww_total"
                    @input="recomputeLearner(st)"
                    :disabled="Boolean(st.is_locked && !auth.isAdmin)"
                    class="score-input total-input"
                  />
                </td>

                <!-- Performance Task -->
                <td>
                  <input
                    type="number"
                    min="0"
                    :max="st.pt_total"
                    v-model.number="st.pt_score"
                    @input="recomputeLearner(st)"
                    :disabled="Boolean(st.is_locked && !auth.isAdmin)"
                    class="score-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    v-model.number="st.pt_total"
                    @input="recomputeLearner(st)"
                    :disabled="Boolean(st.is_locked && !auth.isAdmin)"
                    class="score-input total-input"
                  />
                </td>

                <!-- Quarterly Assessment -->
                <td>
                  <input
                    type="number"
                    min="0"
                    :max="st.qa_total"
                    v-model.number="st.qa_score"
                    @input="recomputeLearner(st)"
                    :disabled="Boolean(st.is_locked && !auth.isAdmin)"
                    class="score-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    v-model.number="st.qa_total"
                    @input="recomputeLearner(st)"
                    :disabled="Boolean(st.is_locked && !auth.isAdmin)"
                    class="score-input total-input"
                  />
                </td>

                <!-- Initial Grade -->
                <td class="col-init font-mono">
                  {{ Number(st.initial_grade).toFixed(2) }}
                </td>

                <!-- Transmuted Final Quarter Grade -->
                <td class="col-trans">
                  <span
                    class="grade-pill"
                    :class="st.transmuted_grade >= 75 ? 'grade-passed' : 'grade-failed'"
                  >
                    {{ st.transmuted_grade }}
                  </span>
                </td>

                <!-- Remarks -->
                <td class="col-remarks">
                  <span
                    class="status-tag"
                    :class="st.transmuted_grade >= 75 ? 'tag-passed' : 'tag-failed'"
                  >
                    {{ st.transmuted_grade >= 75 ? 'Passed' : 'Failed' }}
                  </span>
                </td>

                <!-- Lock Status -->
                <td class="col-lock text-center">
                  <button
                    v-if="auth.isAdmin"
                    type="button"
                    class="btn-icon-lock"
                    :class="{ locked: st.is_locked }"
                    @click="st.is_locked = st.is_locked ? 0 : 1"
                    :title="st.is_locked ? 'Click to Unlock Grade' : 'Click to Lock Grade'"
                  >
                    <svg v-if="st.is_locked" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                    </svg>
                  </button>
                  <span v-else>
                    <svg v-if="st.is_locked" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                </td>

                <!-- SF9 View Action -->
                <td class="col-action">
                  <button
                    type="button"
                    class="btn-sm btn-outline"
                    @click="viewStudentForm138(st.id)"
                    title="View Form 138 / SF9 Report Card"
                  >
                    SF9
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="sheetLoaded" class="card empty-card">
        <p>No learners found enrolled in {{ filter.grade }} - {{ filter.section }}.</p>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB 2: SUBJECT & ASSESSMENT SETUP -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'subjects'" class="tab-content">
      <div class="card toolbar-card">
        <div class="subjects-toolbar">
          <div class="form-group" style="max-width: 260px;">
            <label>Filter by Grade Level</label>
            <select v-model="subjectFilterGrade" @change="loadSubjects" class="form-select">
              <option value="">All Grade Levels</option>
              <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="subjects-actions">
            <button
              v-if="auth.isAdmin"
              type="button"
              class="btn-secondary"
              :disabled="seedingDefaults"
              @click="seedDepEdDefaults"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              {{ seedingDefaults ? 'Seeding…' : 'Seed DepEd Default Subjects' }}
            </button>

            <button
              v-if="auth.isAdmin"
              type="button"
              class="btn-primary"
              @click="openAddSubjectModal"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Subject
            </button>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Grade Level</th>
                <th>Written Work</th>
                <th>Performance Tasks</th>
                <th>Quarterly Assessment</th>
                <th>Total Weight</th>
                <th v-if="auth.isAdmin" class="col-action">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!subjectList.length">
                <td :colspan="auth.isAdmin ? 8 : 7" class="text-center py-4 text-muted">
                  No subjects configured. Click "Seed DepEd Default Subjects" to populate standard curriculum areas.
                </td>
              </tr>
              <tr v-for="sub in subjectList" :key="sub.id">
                <td><strong>{{ sub.subject_name }}</strong></td>
                <td><span class="badge badge-code">{{ sub.subject_code || '—' }}</span></td>
                <td>{{ sub.grade_level }}</td>
                <td>{{ sub.weight_ww }}%</td>
                <td>{{ sub.weight_pt }}%</td>
                <td>{{ sub.weight_qa }}%</td>
                <td>
                  <span
                    class="badge"
                    :class="(sub.weight_ww + sub.weight_pt + sub.weight_qa === 100) ? 'badge-success' : 'badge-danger'"
                  >
                    {{ sub.weight_ww + sub.weight_pt + sub.weight_qa }}%
                  </span>
                </td>
                <td v-if="auth.isAdmin" class="col-action">
                  <div class="table-actions">
                    <button class="btn-icon" @click="openEditSubjectModal(sub)" title="Edit Subject">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon btn-icon-danger" @click="deleteSubject(sub.id)" title="Delete Subject">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB 3: DEPED FORM 138 (SF9 REPORT CARD) -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'form138'" class="tab-content">
      <!-- Selector bar -->
      <div class="card toolbar-card no-print">
        <div class="toolbar-grid">
          <div class="form-group">
            <label>Grade Level</label>
            <select v-model="form138Filter.grade" @change="onForm138GradeChange" class="form-select">
              <option value="">Select Grade</option>
              <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Section</label>
            <select v-model="form138Filter.section" @change="loadSectionStudentsFor138" class="form-select">
              <option value="">Select Section</option>
              <option v-for="s in form138Sections" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Student</label>
            <select v-model="form138Filter.studentId" class="form-select">
              <option value="">Select Student</option>
              <option v-for="st in form138StudentList" :key="st.id" :value="st.id">
                {{ st.name }} ({{ st.lrn || 'No LRN' }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>School Year</label>
            <input v-model="form138Filter.schoolYear" class="form-input" placeholder="2025-2026" />
          </div>

          <div class="toolbar-actions">
            <button
              type="button"
              class="btn-primary"
              :disabled="loadingForm138 || !form138Filter.studentId"
              @click="loadForm138(form138Filter.studentId)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              {{ loadingForm138 ? 'Loading…' : 'Generate Form 138' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty / Welcome state -->
      <div v-if="!form138Data && !loadingForm138" class="card empty-card sf9-welcome-card">
        <div class="sf9-welcome-icon">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <h3>DepEd Form 138 (SF9 Progress Report Card)</h3>
        <p>Select a Grade Level, Section, and Student above, then click <strong>Generate Form 138</strong> to view and print their official progress report card.</p>
      </div>

      <!-- Loading State -->
      <div v-if="loadingForm138" class="card empty-card">
        <div class="spinner" style="margin: 0 auto 12px;"></div>
        <p>Compiling Form 138 report card, learning progress ratings, and attendance record…</p>
      </div>

      <!-- Official DepEd Form 138 Document Container -->
      <div v-if="form138Data" class="sf9-workspace">
        <!-- Document Preview Toolbar -->
        <div class="sf9-preview-toolbar no-print">
          <div class="sf9-toolbar-left">
            <span class="sf9-doc-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              DepEd Form 138 (SF9)
            </span>
            <span class="sf9-student-tag">{{ form138Data.student?.name }}</span>
            <span v-if="form138Data.student?.lrn" class="sf9-lrn-tag">LRN: {{ form138Data.student.lrn }}</span>
          </div>

          <div class="sf9-toolbar-center">
            <div class="view-mode-pills">
              <button
                type="button"
                class="mode-pill"
                :class="{ active: form138ViewMode === 'all' }"
                @click="form138ViewMode = 'all'"
              >
                Two-Page Booklet
              </button>
              <button
                type="button"
                class="mode-pill"
                :class="{ active: form138ViewMode === 'p1' }"
                @click="form138ViewMode = 'p1'"
              >
                Page 1: Front &amp; Attendance
              </button>
              <button
                type="button"
                class="mode-pill"
                :class="{ active: form138ViewMode === 'p2' }"
                @click="form138ViewMode = 'p2'"
              >
                Page 2: Academic &amp; Values
              </button>
            </div>
          </div>

          <div class="sf9-toolbar-right">
            <div class="zoom-controls">
              <button type="button" class="btn-zoom" @click="form138Zoom = Math.max(70, form138Zoom - 10)" title="Zoom Out">−</button>
              <span class="zoom-level">{{ form138Zoom }}%</span>
              <button type="button" class="btn-zoom" @click="form138Zoom = Math.min(120, form138Zoom + 10)" title="Zoom In">+</button>
              <button type="button" class="btn-zoom btn-zoom-reset" @click="form138Zoom = 100" title="Reset Zoom">Reset</button>
            </div>
            <button
              type="button"
              class="btn-sig-toggle"
              :class="{ active: showSignatureEditor }"
              @click="showSignatureEditor = !showSignatureEditor"
              title="Edit Signatures for Report Card"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Signatures
            </button>
            <button type="button" class="btn-print-sf9" @click="printForm138">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print SF9 Card
            </button>
          </div>
        </div>

        <!-- Collapsible signature customizer -->
        <div v-if="showSignatureEditor" class="sf9-sig-drawer no-print">
          <div class="sig-drawer-grid">
            <div class="form-group">
              <label>Class Adviser (Signs Report Card)</label>
              <input v-model="customAdviser" class="form-input form-input-sm" placeholder="e.g. Maria Clara Santos, LPT" />
            </div>
            <div class="form-group">
              <label>School Principal / Head</label>
              <input v-model="customPrincipal" class="form-input form-input-sm" placeholder="e.g. Dr. Crisostomo Ibarra" />
            </div>
            <div class="sig-drawer-action">
              <button type="button" class="btn-sm btn-primary" @click="showSignatureEditor = false">Apply to Card</button>
            </div>
          </div>
        </div>

        <!-- Document Canvas / Desk Area -->
        <div class="sf9-canvas-viewport">
          <div
            class="sf9-document-wrapper sf9-print-zone"
            :class="`view-${form138ViewMode}`"
            :style="{ transform: form138Zoom !== 100 ? `scale(${form138Zoom / 100})` : 'none', transformOrigin: 'top center' }"
          >

            <!-- ========================================== -->
            <!-- PAGE 1: FRONT COVER & ATTENDANCE & VALUES  -->
            <!-- ========================================== -->
            <div v-show="form138ViewMode === 'all' || form138ViewMode === 'p1'" class="sf9-page sf9-page-front">
              <!-- Visual Sheet Indicator (preview only) -->
              <div class="sf9-sheet-banner no-print">
                <span class="sheet-number">PAGE 1 OF 2</span>
                <span class="sheet-title">Front Cover &bull; Attendance Record &bull; Certificate of Transfer</span>
              </div>

              <!-- Official DepEd Header with Dual Government Seals -->
              <div class="sf9-official-header">
                <!-- Left Crest: Republic of the Philippines -->
                <div class="header-seal seal-ph">
                  <svg class="official-crest-svg" viewBox="0 0 100 100" width="74" height="74" aria-label="Seal of the Republic of the Philippines">
                    <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#1e3a8a" stroke-width="2.5" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#b45309" stroke-width="1.2" stroke-dasharray="2,2" />
                    <path d="M30 32 L70 32 L70 54 Q70 74 50 82 Q30 74 30 54 Z" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" />
                    <path d="M30 32 L70 32 L70 42 L30 42 Z" fill="#fef3c7" stroke="#1e293b" stroke-width="1" />
                    <path d="M30 42 L50 42 L50 78 Q38 72 30 54 Z" fill="#1e40af" />
                    <path d="M50 42 L70 42 L70 54 Q70 72 50 78 Z" fill="#b91c1c" />
                    <circle cx="50" cy="54" r="6" fill="#f59e0b" stroke="#d97706" stroke-width="0.8" />
                    <line x1="50" y1="44" x2="50" y2="64" stroke="#f59e0b" stroke-width="1.5" />
                    <line x1="40" y1="54" x2="60" y2="54" stroke="#f59e0b" stroke-width="1.5" />
                    <line x1="43" y1="47" x2="57" y2="61" stroke="#f59e0b" stroke-width="1.5" />
                    <line x1="43" y1="61" x2="57" y2="47" stroke="#f59e0b" stroke-width="1.5" />
                    <polygon points="50,34 51.5,37.5 55,37.5 52,39.5 53.5,43 50,41 46.5,43 48,39.5 45,37.5 48.5,37.5" fill="#f59e0b" />
                    <polygon points="36,36 37,38.5 39.5,38.5 37.5,40 38.5,42.5 36,41 33.5,42.5 34.5,40 32.5,38.5 35,38.5" fill="#f59e0b" />
                    <polygon points="64,36 65,38.5 67.5,38.5 65.5,40 66.5,42.5 64,41 61.5,42.5 62.5,40 60.5,38.5 63,38.5" fill="#f59e0b" />
                    <text x="50" y="15" text-anchor="middle" font-size="6" font-weight="900" fill="#1e3a8a" font-family="'Times New Roman', serif" letter-spacing="0.5">REPUBLIKA NG PILIPINAS</text>
                  </svg>
                </div>

                <!-- Center: Official Hierarchy & Title -->
                <div class="header-center-info">
                  <p class="gov-line-1">REPUBLIC OF THE PHILIPPINES</p>
                  <p class="gov-line-2">DEPARTMENT OF EDUCATION</p>
                  <p class="gov-division">
                    {{ form138Data.school?.division ? 'Schools Division Office of ' + form138Data.school.division : 'Schools Division Office' }}
                  </p>
                  <p class="gov-school-name">{{ form138Data.school?.name || 'Elementary / Secondary School' }}</p>
                  <p class="gov-school-meta">
                    <span>School ID: <strong>{{ form138Data.school?.school_id || '—' }}</strong></span>
                    <span v-if="form138Data.school?.district">&bull; District: <strong>{{ form138Data.school?.district }}</strong></span>
                    <span v-if="form138Data.school?.address">&bull; {{ form138Data.school?.address }}</span>
                  </p>
                  <div class="sf9-title-banner">
                    <h3>LEARNER'S PROGRESS REPORT CARD (SF 9)</h3>
                    <p class="sf9-sub">DepEd Form 138 &bull; School Year <strong>{{ form138Data.schoolYear }}</strong></p>
                  </div>
                </div>

                <!-- Right Crest: Department of Education -->
                <div class="header-seal seal-deped">
                  <svg class="official-crest-svg" viewBox="0 0 100 100" width="74" height="74" aria-label="Official Seal of the Department of Education">
                    <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#1e3a8a" stroke-width="2.5" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#b45309" stroke-width="1.2" stroke-dasharray="2,2" />
                    <circle cx="50" cy="50" r="32" fill="#eff6ff" stroke="#3b82f6" stroke-width="1" />
                    <path d="M28 66 Q50 60 50 74 Q50 60 72 66 L70 75 Q50 70 50 80 Q50 70 30 75 Z" fill="#ffffff" stroke="#1e3a8a" stroke-width="1.2" />
                    <path d="M48 42 L52 42 L51 68 L49 68 Z" fill="#92400e" stroke="#78350f" stroke-width="0.8" />
                    <path d="M45 42 L55 42 L53 46 L47 46 Z" fill="#b45309" />
                    <path d="M50 25 Q56 32 53 38 Q50 42 50 42 Q50 42 47 38 Q44 32 50 25 Z" fill="#ea580c" />
                    <path d="M50 28 Q53 33 51 38 Q50 40 50 40 Q50 40 49 38 Q47 33 50 28 Z" fill="#facc15" />
                    <text x="50" y="15" text-anchor="middle" font-size="5.5" font-weight="900" fill="#1e3a8a" font-family="'Times New Roman', serif" letter-spacing="0.3">KAGAWARAN NG EDUKASYON</text>
                    <text x="50" y="93" text-anchor="middle" font-size="5.5" font-weight="700" fill="#1e3a8a" font-family="'Times New Roman', serif" letter-spacing="0.5">PILIPINAS</text>
                  </svg>
                </div>
              </div>

              <!-- Learner Profile Strip -->
              <div class="sf9-learner-profile">
                <div class="profile-col profile-col-main">
                  <div class="profile-entry">
                    <span class="label">LEARNER NAME:</span>
                    <strong class="val val-name">{{ form138Data.student?.name }}</strong>
                  </div>
                  <div class="profile-entry-group">
                    <div class="profile-entry">
                      <span class="label">AGE / BIRTHDATE:</span>
                      <span class="val">{{ form138Data.student?.birth_date || '—' }}</span>
                    </div>
                    <div class="profile-entry">
                      <span class="label">SEX:</span>
                      <span class="val">{{ form138Data.student?.gender || '—' }}</span>
                    </div>
                  </div>
                </div>

                <div class="profile-col profile-col-sub">
                  <div class="profile-entry">
                    <span class="label">LRN:</span>
                    <strong class="val val-lrn font-mono">{{ form138Data.student?.lrn || '—' }}</strong>
                  </div>
                  <div class="profile-entry-group">
                    <div class="profile-entry">
                      <span class="label">GRADE &amp; SECTION:</span>
                      <strong class="val">{{ form138Data.student?.grade }} &bull; {{ form138Data.student?.section }}</strong>
                    </div>
                    <div class="profile-entry">
                      <span class="label">CURRICULUM:</span>
                      <span class="val">K to 12 Basic Ed</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dear Parent Notification Box -->
              <div class="sf9-dear-parent-box">
                <h5 class="box-subtitle">DEAR PARENT / GUARDIAN:</h5>
                <p class="parent-text">
                  This report card shows the ability and progress your child has made in the different learning areas as well
                  as his/her core values. The school welcomes you should you desire to know more about your child's progress.
                </p>
                <div class="parent-signatures-inline">
                  <div class="inline-sig">
                    <span class="sig-line-text">{{ customAdviser || form138Data.adviserName || 'Class Adviser' }}</span>
                    <span class="sig-role">Teacher / Class Adviser</span>
                  </div>
                  <div class="inline-sig">
                    <span class="sig-line-text">{{ customPrincipal || form138Data.principalName || form138Data.school?.principal_name || 'School Principal / Head' }}</span>
                    <span class="sig-role">School Principal / Head</span>
                  </div>
                </div>
              </div>

              <!-- Full-Width REPORT ON ATTENDANCE -->
              <div class="sf9-panel-box sf9-attendance-box">
                <div class="panel-header">
                  <h4>REPORT ON ATTENDANCE</h4>
                </div>
                <div class="table-wrap">
                  <table class="sf9-grid-table sf9-attendance-table">
                    <thead>
                      <tr>
                        <th class="col-att-metric">Month</th>
                        <th v-for="m in attendanceMonths" :key="m.month">{{ m.monthName }}</th>
                        <th class="col-att-total">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="text-left font-medium">No. of School Days</td>
                        <td v-for="m in attendanceMonths" :key="'sd-'+m.month">{{ m.schoolDays ?? '—' }}</td>
                        <td class="font-bold cell-total">{{ attendanceTotals.schoolDays }}</td>
                      </tr>
                      <tr>
                        <td class="text-left font-medium">No. of Days Present</td>
                        <td v-for="m in attendanceMonths" :key="'dp-'+m.month">{{ m.daysPresent ?? '—' }}</td>
                        <td class="font-bold cell-total">{{ attendanceTotals.daysPresent }}</td>
                      </tr>
                      <tr>
                        <td class="text-left font-medium">No. of Days Absent</td>
                        <td v-for="m in attendanceMonths" :key="'da-'+m.month">{{ m.daysAbsent ?? '—' }}</td>
                        <td class="font-bold cell-total">{{ attendanceTotals.daysAbsent }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Balanced Side-by-Side: Parent Signatures & Certificate of Transfer -->
              <div class="sf9-page1-bottom-grid">
                <!-- Parent / Guardian's Signature Table -->
                <div class="sf9-panel-box sf9-parent-sig-box">
                  <div class="panel-header">
                    <h4>PARENT / GUARDIAN'S SIGNATURE</h4>
                  </div>
                  <table class="sf9-grid-table sf9-parent-sig-table">
                    <thead>
                      <tr>
                        <th style="width: 30%;">Quarter</th>
                        <th style="width: 32%;">Date</th>
                        <th style="width: 38%;">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="font-medium">1st Quarter</td>
                        <td class="dotted-underline"></td>
                        <td class="dotted-underline"></td>
                      </tr>
                      <tr>
                        <td class="font-medium">2nd Quarter</td>
                        <td class="dotted-underline"></td>
                        <td class="dotted-underline"></td>
                      </tr>
                      <tr>
                        <td class="font-medium">3rd Quarter</td>
                        <td class="dotted-underline"></td>
                        <td class="dotted-underline"></td>
                      </tr>
                      <tr>
                        <td class="font-medium">4th Quarter</td>
                        <td class="dotted-underline"></td>
                        <td class="dotted-underline"></td>
                      </tr>
                    </tbody>
                  </table>
                  <p class="sig-note-small">
                    <em>Please sign and return after examining each quarterly progress rating.</em>
                  </p>
                </div>

                <!-- Certificate of Transfer Box -->
                <div class="sf9-panel-box sf9-transfer-box">
                  <div class="panel-header">
                    <h4>CERTIFICATE OF TRANSFER</h4>
                  </div>
                  <div class="cert-transfer-subbox">
                    <div class="cert-lines">
                      <div class="cert-field-row">
                        <span class="cert-lbl">Admitted to Grade:</span>
                        <span class="cert-fill"></span>
                        <span class="cert-lbl">Section:</span>
                        <span class="cert-fill"></span>
                      </div>
                      <div class="cert-field-row">
                        <span class="cert-lbl">Eligibility for Admission:</span>
                        <span class="cert-fill"></span>
                      </div>
                      <div class="cert-signers">
                        <div class="cert-sig-block">
                          <span class="sig-line">{{ customAdviser || form138Data.adviserName || 'Class Adviser' }}</span>
                          <span class="sig-role">Teacher / Adviser</span>
                        </div>
                        <div class="cert-sig-block">
                          <span class="sig-line">{{ customPrincipal || form138Data.principalName || form138Data.school?.principal_name || 'School Principal / Head' }}</span>
                          <span class="sig-role">School Principal / Head</span>
                        </div>
                      </div>

                      <div class="cert-cancellation-block">
                        <h6 class="cert-sub-title">CANCELLATION OF ELIGIBILITY TO TRANSFER</h6>
                        <div class="cert-field-row">
                          <span class="cert-lbl">Admitted in:</span>
                          <span class="cert-fill"></span>
                        </div>
                        <div class="cert-field-row">
                          <span class="cert-lbl">Date:</span>
                          <span class="cert-fill" style="max-width: 100px;"></span>
                          <span class="cert-lbl">Principal:</span>
                          <span class="cert-fill"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ========================================== -->
            <!-- PAGE 2: ACADEMIC PROGRESS & CORE VALUES   -->
            <!-- ========================================== -->
            <div v-show="form138ViewMode === 'all' || form138ViewMode === 'p2'" class="sf9-page sf9-page-back">
              <!-- Visual Sheet Indicator (preview only) -->
              <div class="sf9-sheet-banner no-print">
                <span class="sheet-number">PAGE 2 OF 2</span>
                <span class="sheet-title">Learning Progress &bull; DepEd Core Values &bull; Signatures</span>
              </div>

              <!-- Academic Header -->
              <div class="sf9-academic-header">
                <h4>REPORT ON LEARNING PROGRESS AND ACHIEVEMENT</h4>
                <p class="deped-order-tag">DepEd Order No. 8, s. 2015 &bull; Policy Guidelines on Classroom Assessment</p>
              </div>

              <div class="sf9-page2-grid">
                <!-- Left Column: Academic Grades -->
                <div class="sf9-col-academic">
                  <table class="sf9-grid-table sf9-learning-areas-table">
                    <thead>
                      <tr>
                        <th rowspan="2" class="col-subject text-left">Learning Areas</th>
                        <th colspan="4" class="col-quarters">Quarterly Rating</th>
                        <th rowspan="2" class="col-final">Final Rating</th>
                        <th rowspan="2" class="col-remarks">Remarks</th>
                      </tr>
                      <tr>
                        <th class="sub-q">1</th>
                        <th class="sub-q">2</th>
                        <th class="sub-q">3</th>
                        <th class="sub-q">4</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="!learningAreasList.length">
                        <td colspan="7" class="text-center py-3 text-muted">
                          No subjects configured for this grade level.
                        </td>
                      </tr>
                      <tr v-for="la in learningAreasList" :key="la.subjectId">
                        <td class="text-left font-medium subject-name-cell">
                          {{ la.subjectName }}
                          <span v-if="la.subjectCode" class="sub-code-tiny">({{ la.subjectCode }})</span>
                        </td>
                        <td class="rating-cell">{{ la.q1 ?? '—' }}</td>
                        <td class="rating-cell">{{ la.q2 ?? '—' }}</td>
                        <td class="rating-cell">{{ la.q3 ?? '—' }}</td>
                        <td class="rating-cell">{{ la.q4 ?? '—' }}</td>
                        <td class="rating-cell font-bold final-cell">{{ la.finalRating ?? '—' }}</td>
                        <td class="remarks-cell">
                          <span :class="la.finalRating >= 75 ? 'tag-prom' : (la.finalRating !== null ? 'tag-fail' : '')">
                            {{ la.remarks || '—' }}
                          </span>
                        </td>
                      </tr>
                      <!-- General Average Row -->
                      <tr class="row-general-average">
                        <td class="text-left font-bold gen-avg-label">
                          GENERAL AVERAGE
                        </td>
                        <td colspan="4" class="gen-avg-blank"></td>
                        <td class="rating-cell font-black gen-avg-val">
                          {{ form138Data.generalAverage ?? '—' }}
                        </td>
                        <td class="remarks-cell font-bold">
                          <span
                            v-if="form138Data.generalAverage !== null"
                            :class="form138Data.generalAverage >= 75 ? 'status-promoted' : 'status-retained'"
                          >
                            {{ form138Data.generalAverage >= 75 ? 'PROMOTED' : 'RETAINED' }}
                          </span>
                          <span v-else>—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!-- Descriptors & Grading Scale Box -->
                  <div class="sf9-descriptors-box">
                    <div class="descriptors-title">DESCRIPTORS &amp; GRADING SCALE (DepEd Order 8, s. 2015)</div>
                    <div class="descriptors-grid">
                      <div class="desc-item"><span>Outstanding (O):</span> <strong>90–100</strong> <em class="pass">Passed</em></div>
                      <div class="desc-item"><span>Very Satisfactory (VS):</span> <strong>85–89</strong> <em class="pass">Passed</em></div>
                      <div class="desc-item"><span>Satisfactory (S):</span> <strong>80–84</strong> <em class="pass">Passed</em></div>
                      <div class="desc-item"><span>Fairly Satisfactory (FS):</span> <strong>75–79</strong> <em class="pass">Passed</em></div>
                      <div class="desc-item desc-fail"><span>Did Not Meet Expectations:</span> <strong>Below 75</strong> <em class="fail">Failed</em></div>
                    </div>
                  </div>

                  <!-- Honors Distinction Ribbon (if qualified) -->
                  <div v-if="form138Data.honors?.honorTitle" class="sf9-academic-honor-badge">
                    <div class="honor-laurel">★ ★ ★</div>
                    <div class="honor-content">
                      <span class="honor-heading">ACADEMIC EXCELLENCE AWARD</span>
                      <strong class="honor-title">{{ form138Data.honors.honorTitle }}</strong>
                      <span class="honor-deped-ref">Pursuant to DepEd Order No. 36, s. 2016 (Awards &amp; Recognition)</span>
                    </div>
                  </div>
                </div>

                <!-- Right Column: Observed Values (DepEd Core Values) -->
                <div class="sf9-col-values">
                  <div class="panel-header values-header">
                    <h4>REPORT ON LEARNER'S OBSERVED VALUES</h4>
                  </div>

                  <table class="sf9-grid-table sf9-values-table">
                    <thead>
                      <tr>
                        <th class="col-cv text-left">Core Values</th>
                        <th class="col-stmt text-left">Behavior Statements</th>
                        <th class="col-vq">Q1</th>
                        <th class="col-vq">Q2</th>
                        <th class="col-vq">Q3</th>
                        <th class="col-vq">Q4</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(cv, cvi) in observedValues" :key="cv.coreValue">
                        <tr v-for="(stmt, si) in cv.behaviorStatements" :key="si">
                          <td v-if="si === 0" :rowspan="cv.behaviorStatements.length" class="cell-cv-title text-left font-bold">
                            {{ cv.coreValue }}
                          </td>
                          <td class="text-left stmt-text">{{ stmt.text }}</td>
                          <td class="cell-rating" @click="toggleObservedValue(stmt, 'q1')" title="Click to toggle AO/SO/RO/NO">
                            <span class="rating-tag" :class="`rate-${stmt.q1}`">{{ stmt.q1 }}</span>
                          </td>
                          <td class="cell-rating" @click="toggleObservedValue(stmt, 'q2')" title="Click to toggle AO/SO/RO/NO">
                            <span class="rating-tag" :class="`rate-${stmt.q2}`">{{ stmt.q2 }}</span>
                          </td>
                          <td class="cell-rating" @click="toggleObservedValue(stmt, 'q3')" title="Click to toggle AO/SO/RO/NO">
                            <span class="rating-tag" :class="`rate-${stmt.q3}`">{{ stmt.q3 }}</span>
                          </td>
                          <td class="cell-rating" @click="toggleObservedValue(stmt, 'q4')" title="Click to toggle AO/SO/RO/NO">
                            <span class="rating-tag" :class="`rate-${stmt.q4}`">{{ stmt.q4 }}</span>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>

                  <!-- Marking Code Legend -->
                  <div class="sf9-marking-legend">
                    <div class="legend-header">OBSERVED VALUES MARKING CODE</div>
                    <div class="legend-items">
                      <div class="leg-item"><strong class="code code-ao">AO</strong> Always Observed <em>(Pinakikita Lagi &bull; 90-100%)</em></div>
                      <div class="leg-item"><strong class="code code-so">SO</strong> Sometimes Observed <em>(Paminsan-minsan &bull; 60-89%)</em></div>
                      <div class="leg-item"><strong class="code code-ro">RO</strong> Rarely Observed <em>(Bihira &bull; 30-59%)</em></div>
                      <div class="leg-item"><strong class="code code-no">NO</strong> Not Observed <em>(Hindi Kailanman &bull; &lt;30%)</em></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Signatures at base of Page 2 (Spans full width across bottom) -->
              <div class="sf9-page2-signatures">
                <div class="sig-col">
                  <div class="sig-line-wrap">
                    <span class="signer-name">{{ customAdviser || form138Data.adviserName || 'Class Adviser' }}</span>
                  </div>
                  <p class="signer-title">Teacher / Class Adviser</p>
                </div>
                <div class="sig-col">
                  <div class="sig-line-wrap">
                    <span class="signer-name">{{ customPrincipal || form138Data.principalName || form138Data.school?.principal_name || 'School Principal / Head' }}</span>
                  </div>
                  <p class="signer-title">School Principal / Head</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- TAB 4: ANALYTICS & HONORS -->
    <!-- ======================================================== -->
    <div v-if="activeTab === 'analytics'" class="tab-content">
      <!-- Toolbar -->
      <div class="card toolbar-card">
        <div class="toolbar-grid">
          <div class="form-group">
            <label>Grade Level</label>
            <select v-model="analyticsFilter.grade" @change="loadAnalytics" class="form-select">
              <option value="">All Grades</option>
              <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Quarter</label>
            <select v-model="analyticsFilter.quarter" @change="loadAnalytics" class="form-select">
              <option value="Q1">1st Quarter (Q1)</option>
              <option value="Q2">2nd Quarter (Q2)</option>
              <option value="Q3">3rd Quarter (Q3)</option>
              <option value="Q4">4th Quarter (Q4)</option>
            </select>
          </div>

          <div class="form-group">
            <label>School Year</label>
            <input v-model="analyticsFilter.schoolYear" @change="loadAnalytics" class="form-input" placeholder="2025-2026" />
          </div>

          <div class="toolbar-actions">
            <button type="button" class="btn-primary" @click="loadAnalytics" :disabled="loadingAnalytics">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              {{ loadingAnalytics ? 'Analyzing…' : 'Refresh Analytics' }}
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div v-if="analyticsData" class="stats-row">
        <div class="stat-card">
          <div class="stat-icon stat-icon--primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ analyticsData.totalGradesEvaluated }}</span>
            <span class="stat-label">Grades Evaluated</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ analyticsData.averageGrade }}</span>
            <span class="stat-label">Campus Average Grade</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ analyticsData.passingRate }}%</span>
            <span class="stat-label">Overall Passing Rate</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stat-icon--warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ analyticsData.honorCandidatesCount }}</span>
            <span class="stat-label">Honor Roll Candidates</span>
          </div>
        </div>
      </div>

      <!-- Grade Distribution Bars -->
      <div v-if="analyticsData" class="card distribution-card">
        <h3>DepEd Proficiency &amp; Grade Distribution</h3>
        <div class="distribution-bars">
          <div class="dist-row">
            <span class="dist-label">Outstanding (90 - 100)</span>
            <div class="dist-track">
              <div
                class="dist-fill fill-out"
                :style="{ width: getDistPct(analyticsData.distribution.outstanding) + '%' }"
              ></div>
            </div>
            <span class="dist-count">{{ analyticsData.distribution.outstanding }} ({{ getDistPct(analyticsData.distribution.outstanding) }}%)</span>
          </div>

          <div class="dist-row">
            <span class="dist-label">Very Satisfactory (85 - 89)</span>
            <div class="dist-track">
              <div
                class="dist-fill fill-vs"
                :style="{ width: getDistPct(analyticsData.distribution.verySatisfactory) + '%' }"
              ></div>
            </div>
            <span class="dist-count">{{ analyticsData.distribution.verySatisfactory }} ({{ getDistPct(analyticsData.distribution.verySatisfactory) }}%)</span>
          </div>

          <div class="dist-row">
            <span class="dist-label">Satisfactory (80 - 84)</span>
            <div class="dist-track">
              <div
                class="dist-fill fill-sat"
                :style="{ width: getDistPct(analyticsData.distribution.satisfactory) + '%' }"
              ></div>
            </div>
            <span class="dist-count">{{ analyticsData.distribution.satisfactory }} ({{ getDistPct(analyticsData.distribution.satisfactory) }}%)</span>
          </div>

          <div class="dist-row">
            <span class="dist-label">Fairly Satisfactory (75 - 79)</span>
            <div class="dist-track">
              <div
                class="dist-fill fill-fair"
                :style="{ width: getDistPct(analyticsData.distribution.fairlySatisfactory) + '%' }"
              ></div>
            </div>
            <span class="dist-count">{{ analyticsData.distribution.fairlySatisfactory }} ({{ getDistPct(analyticsData.distribution.fairlySatisfactory) }}%)</span>
          </div>

          <div class="dist-row">
            <span class="dist-label">Did Not Meet Expectations (&lt; 75)</span>
            <div class="dist-track">
              <div
                class="dist-fill fill-fail"
                :style="{ width: getDistPct(analyticsData.distribution.didNotMeet) + '%' }"
              ></div>
            </div>
            <span class="dist-count">{{ analyticsData.distribution.didNotMeet }} ({{ getDistPct(analyticsData.distribution.didNotMeet) }}%)</span>
          </div>
        </div>
      </div>

      <!-- Honors Roll Candidates Table -->
      <div v-if="analyticsData?.honorRoll?.length" class="card table-card">
        <div class="table-card-header">
          <div>
            <h3>Official DepEd Honors Roll ({{ analyticsFilter.quarter }})</h3>
            <p class="sub-text">Qualifying criteria: General Average &ge; 90 with no grade below 85.</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Learner Name</th>
                <th>Sex</th>
                <th>General Average</th>
                <th>Honor Distinction</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(h, idx) in analyticsData.honorRoll" :key="h.studentId">
                <td>#{{ idx + 1 }}</td>
                <td><strong>{{ h.name }}</strong></td>
                <td>{{ h.gender }}</td>
                <td><strong>{{ h.average }}</strong></td>
                <td>
                  <span class="badge badge-honor">{{ h.honorTitle }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- ADD / EDIT SUBJECT MODAL -->
    <!-- ======================================================== -->
    <div v-if="showSubjectModal" class="modal-overlay" @click.self="showSubjectModal = false">
      <div class="form-card modal-card">
        <h3>{{ subjectForm.id ? 'Edit Subject' : 'Add New Subject' }}</h3>
        <p class="sub-text">Assessment weights must sum up exactly to 100%.</p>

        <form @submit.prevent="submitSubjectForm" class="modal-form">
          <div class="form-group">
            <label>Subject Name</label>
            <input v-model="subjectForm.name" required class="form-input" placeholder="e.g. Mathematics" />
          </div>

          <div class="form-group">
            <label>Subject Code</label>
            <input v-model="subjectForm.code" class="form-input" placeholder="e.g. MATH" />
          </div>

          <div class="form-group">
            <label>Grade Level</label>
            <select v-model="subjectForm.gradeLevel" required class="form-select">
              <option value="">Select Grade Level</option>
              <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>

          <div class="form-row weights-row">
            <div class="form-group">
              <label>Written Work (%)</label>
              <input type="number" min="0" max="100" v-model.number="subjectForm.weightWw" required class="form-input" />
            </div>

            <div class="form-group">
              <label>Performance Tasks (%)</label>
              <input type="number" min="0" max="100" v-model.number="subjectForm.weightPt" required class="form-input" />
            </div>

            <div class="form-group">
              <label>Quarterly Exam (%)</label>
              <input type="number" min="0" max="100" v-model.number="subjectForm.weightQa" required class="form-input" />
            </div>
          </div>

          <div class="weight-total-indicator">
            <span>Total Weight:</span>
            <strong :class="subjectFormTotalWeight === 100 ? 'text-success' : 'text-danger'">
              {{ subjectFormTotalWeight }}%
            </strong>
            <small v-if="subjectFormTotalWeight !== 100" class="text-danger">
              (Must equal 100%)
            </small>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn-primary"
              :disabled="savingSubject || subjectFormTotalWeight !== 100"
            >
              {{ savingSubject ? 'Saving…' : (subjectForm.id ? 'Save Changes' : 'Create Subject') }}
            </button>
            <button type="button" class="btn-secondary" @click="showSubjectModal = false">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useGradeLevels } from '../composables/useGradeLevels'
import { useToast } from '../composables/useToast'

const auth = useAuthStore()
const { addToast } = useToast()
const notify = (msg, type = 'info') => addToast(msg, type)
const { grades, sectionsByGrade, loadGradeLevels } = useGradeLevels()

const activeTab = ref('encoding')
const schools = ref([])
const selectedSchoolId = ref(auth.schoolId || '')
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || ''))

// Filter for Grade Encoding
const filter = reactive({
  grade: auth.isTeacher && auth.user?.grade ? auth.user.grade : '',
  section: auth.isTeacher && auth.user?.section ? auth.user.section : '',
  subjectId: '',
  quarter: 'Q1',
  schoolYear: '2025-2026'
})

const availableSections = computed(() => sectionsByGrade.value[filter.grade] || [])

// Sheet data
const loadingSheet = ref(false)
const savingSheet = ref(false)
const sheetLoaded = ref(false)
const activeSubject = ref(null)
const sheetLearners = ref([])

// Subject Setup State
const subjectList = ref([])
const subjectFilterGrade = ref('')
const seedingDefaults = ref(false)
const showSubjectModal = ref(false)
const savingSubject = ref(false)
const subjectForm = reactive({
  id: '',
  name: '',
  code: '',
  gradeLevel: '',
  weightWw: 30,
  weightPt: 50,
  weightQa: 20
})

const subjectFormTotalWeight = computed(() => {
  return (Number(subjectForm.weightWw) || 0) + (Number(subjectForm.weightPt) || 0) + (Number(subjectForm.weightQa) || 0)
})

// Form 138 State
const form138Filter = reactive({
  grade: '',
  section: '',
  studentId: '',
  schoolYear: '2025-2026'
})
const form138Sections = computed(() => sectionsByGrade.value[form138Filter.grade] || [])
const form138StudentList = ref([])
const loadingForm138 = ref(false)
const form138Data = ref(null)

const form138ViewMode = ref('all') // 'all', 'p1', 'p2'
const form138Zoom = ref(100)
const customAdviser = ref('')
const customPrincipal = ref('')
const showSignatureEditor = ref(false)
const observedValues = ref([])

const attendanceMonths = computed(() => {
  if (!form138Data.value?.attendanceSummary) return []
  if (Array.isArray(form138Data.value.attendanceSummary)) {
    return form138Data.value.attendanceSummary
  }
  return form138Data.value.attendanceSummary.months || []
})

const attendanceTotals = computed(() => {
  if (!form138Data.value?.attendanceSummary) return { schoolDays: 0, daysPresent: 0, daysAbsent: 0 }
  if (form138Data.value.totalAttendance) return form138Data.value.totalAttendance
  return {
    schoolDays: form138Data.value.attendanceSummary.totalSchoolDays || 0,
    daysPresent: form138Data.value.attendanceSummary.totalPresent || 0,
    daysAbsent: form138Data.value.attendanceSummary.totalAbsent || 0
  }
})

const learningAreasList = computed(() => {
  if (!form138Data.value) return []
  return form138Data.value.learningAreas || form138Data.value.subjects || []
})

function toggleObservedValue(stmt, quarterKey) {
  const sequence = ['AO', 'SO', 'RO', 'NO']
  const current = stmt[quarterKey] || 'AO'
  const nextIdx = (sequence.indexOf(current) + 1) % sequence.length
  stmt[quarterKey] = sequence[nextIdx]
}

// Analytics State
const analyticsFilter = reactive({
  grade: '',
  quarter: 'Q1',
  schoolYear: '2025-2026'
})
const loadingAnalytics = ref(false)
const analyticsData = ref(null)

onMounted(async () => {
  if (auth.isSuperadmin) {
    try {
      schools.value = await auth.getSchools()
      if (schools.value.length && !selectedSchoolId.value) {
        selectedSchoolId.value = schools.value[0].id
      }
    } catch {}
  }
  await loadGradeLevels(effectiveSchoolId.value || undefined)
  if (grades.value.length && !filter.grade) {
    filter.grade = grades.value[0]
  }
  await loadSubjects()
})

async function onSchoolChange() {
  await loadGradeLevels(effectiveSchoolId.value || undefined)
  await loadSubjects()
}

async function onGradeChange() {
  await loadSubjects()
}

// -------------------------------------------------------------------
// CLIENT-SIDE TRANSMUTATION & INITIAL GRADE HELPERS
// -------------------------------------------------------------------
function transmuteGrade(initialGrade) {
  const val = Number(initialGrade) || 0
  if (val >= 100) return 100
  if (val >= 98.40) return 99
  if (val >= 96.80) return 98
  if (val >= 95.20) return 97
  if (val >= 93.60) return 96
  if (val >= 92.00) return 95
  if (val >= 90.40) return 94
  if (val >= 88.80) return 93
  if (val >= 87.20) return 92
  if (val >= 85.60) return 91
  if (val >= 84.00) return 90
  if (val >= 82.40) return 89
  if (val >= 80.80) return 88
  if (val >= 79.20) return 87
  if (val >= 77.60) return 86
  if (val >= 76.00) return 85
  if (val >= 74.40) return 84
  if (val >= 72.80) return 83
  if (val >= 71.20) return 82
  if (val >= 69.60) return 81
  if (val >= 68.00) return 80
  if (val >= 66.40) return 79
  if (val >= 64.80) return 78
  if (val >= 63.20) return 77
  if (val >= 61.60) return 76
  if (val >= 60.00) return 75
  if (val >= 56.00) return 74
  if (val >= 52.00) return 73
  if (val >= 48.00) return 72
  if (val >= 44.00) return 71
  if (val >= 40.00) return 70
  if (val >= 36.00) return 69
  if (val >= 32.00) return 68
  if (val >= 28.00) return 67
  if (val >= 24.00) return 66
  if (val >= 20.00) return 65
  if (val >= 16.00) return 64
  if (val >= 12.00) return 63
  if (val >= 8.00) return 62
  if (val >= 4.00) return 61
  return 60
}

function recomputeLearner(st) {
  if (!activeSubject.value) return
  const wwPct = st.ww_total > 0 ? (Math.min(st.ww_score || 0, st.ww_total) / st.ww_total) * 100 : 0
  const ptPct = st.pt_total > 0 ? (Math.min(st.pt_score || 0, st.pt_total) / st.pt_total) * 100 : 0
  const qaPct = st.qa_total > 0 ? (Math.min(st.qa_score || 0, st.qa_total) / st.qa_total) * 100 : 0

  const wwWeight = Number(activeSubject.value.weight_ww) || 30
  const ptWeight = Number(activeSubject.value.weight_pt) || 50
  const qaWeight = Number(activeSubject.value.weight_qa) || 20
  const totalWeight = wwWeight + ptWeight + qaWeight || 100

  const weightedWW = (wwPct * wwWeight) / totalWeight
  const weightedPT = (ptPct * ptWeight) / totalWeight
  const weightedQA = (qaPct * qaWeight) / totalWeight

  const initial = Math.round((weightedWW + weightedPT + weightedQA) * 100) / 100
  st.initial_grade = initial
  st.transmuted_grade = transmuteGrade(initial)
  st.remarks = st.transmuted_grade >= 75 ? 'Passed' : 'Failed'
}

// -------------------------------------------------------------------
// TAB 1: GRADE ENCODING HANDLERS
// -------------------------------------------------------------------
async function loadSubjects() {
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    if (activeTab.value === 'encoding' && filter.grade) {
      params.set('gradeLevel', filter.grade)
    } else if (activeTab.value === 'subjects' && subjectFilterGrade.value) {
      params.set('gradeLevel', subjectFilterGrade.value)
    }
    const res = await fetch(`/api/grading/subjects?${params.toString()}`)
    const data = await res.json()
    if (data.success) {
      subjectList.value = data.subjects || []
      if (!filter.subjectId && subjectList.value.length) {
        filter.subjectId = subjectList.value[0].id
      }
    }
  } catch (err) {
    console.error('Failed to load subjects:', err)
  }
}

async function loadGradeSheet() {
  if (!filter.subjectId || !filter.grade || !filter.section) return
  loadingSheet.value = true
  sheetLoaded.value = false
  try {
    const params = new URLSearchParams({
      gradeLevel: filter.grade,
      section: filter.section,
      subjectId: filter.subjectId,
      quarter: filter.quarter,
      schoolYear: filter.schoolYear
    })
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)

    const res = await fetch(`/api/grading/sheet?${params.toString()}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load grade sheet')

    activeSubject.value = data.subject
    sheetLearners.value = (data.students || []).map(st => ({
      ...st,
      ww_score: Number(st.ww_score) || 0,
      ww_total: Number(st.ww_total) || 100,
      pt_score: Number(st.pt_score) || 0,
      pt_total: Number(st.pt_total) || 100,
      qa_score: Number(st.qa_score) || 0,
      qa_total: Number(st.qa_total) || 50,
      initial_grade: Number(st.initial_grade) || 0,
      transmuted_grade: Number(st.transmuted_grade) || 0,
      is_locked: Number(st.is_locked) || 0
    }))
    sheetLoaded.value = true
    notify(`Loaded class record for ${filter.grade} - ${filter.section}.`, 'success')
  } catch (err) {
    notify(err.message || 'Error loading grade sheet', 'error')
  } finally {
    loadingSheet.value = false
  }
}

async function saveGradeSheet() {
  if (!activeSubject.value || !sheetLearners.value.length) return
  savingSheet.value = true
  try {
    const payload = {
      schoolId: effectiveSchoolId.value || undefined,
      subjectId: activeSubject.value.id,
      quarter: filter.quarter,
      schoolYear: filter.schoolYear,
      grades: sheetLearners.value.map(st => ({
        studentId: st.id,
        wwScore: st.ww_score,
        wwTotal: st.ww_total,
        ptScore: st.pt_score,
        ptTotal: st.pt_total,
        qaScore: st.qa_score,
        qaTotal: st.qa_total,
        isLocked: st.is_locked
      }))
    }

    const res = await fetch('/api/grading/sheet/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to save grades')

    notify(`Successfully saved ${data.savedCount} student grade records!`, 'success')
    await loadGradeSheet()
  } catch (err) {
    notify(err.message || 'Error saving grade records', 'error')
  } finally {
    savingSheet.value = false
  }
}

// -------------------------------------------------------------------
// TAB 2: SUBJECT SETUP HANDLERS
// -------------------------------------------------------------------
function openAddSubjectModal() {
  subjectForm.id = ''
  subjectForm.name = ''
  subjectForm.code = ''
  subjectForm.gradeLevel = subjectFilterGrade.value || (grades.value[0] || '')
  subjectForm.weightWw = 30
  subjectForm.weightPt = 50
  subjectForm.weightQa = 20
  showSubjectModal.value = true
}

function openEditSubjectModal(sub) {
  subjectForm.id = sub.id
  subjectForm.name = sub.subject_name
  subjectForm.code = sub.subject_code || ''
  subjectForm.gradeLevel = sub.grade_level
  subjectForm.weightWw = sub.weight_ww
  subjectForm.weightPt = sub.weight_pt
  subjectForm.weightQa = sub.weight_qa
  showSubjectModal.value = true
}

async function submitSubjectForm() {
  if (subjectFormTotalWeight.value !== 100) {
    notify('Weights must sum up to exactly 100%', 'error')
    return
  }
  savingSubject.value = true
  try {
    const isEdit = Boolean(subjectForm.id)
    const url = isEdit ? `/api/grading/subjects/${subjectForm.id}` : '/api/grading/subjects'
    const method = isEdit ? 'PUT' : 'POST'

    const body = {
      schoolId: effectiveSchoolId.value || undefined,
      subjectName: subjectForm.name,
      subjectCode: subjectForm.code,
      gradeLevel: subjectForm.gradeLevel,
      weightWw: subjectForm.weightWw,
      weightPt: subjectForm.weightPt,
      weightQa: subjectForm.weightQa
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to save subject')

    notify(isEdit ? 'Subject updated' : 'Subject created', 'success')
    showSubjectModal.value = false
    await loadSubjects()
  } catch (err) {
    notify(err.message || 'Error saving subject', 'error')
  } finally {
    savingSubject.value = false
  }
}

async function deleteSubject(id) {
  if (!confirm('Are you sure you want to delete this subject?')) return
  try {
    const res = await fetch(`/api/grading/subjects/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete subject')
    notify('Subject deleted', 'success')
    await loadSubjects()
  } catch (err) {
    notify(err.message || 'Error deleting subject', 'error')
  }
}

async function seedDepEdDefaults() {
  seedingDefaults.value = true
  try {
    const res = await fetch('/api/grading/subjects/seed-defaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: effectiveSchoolId.value || undefined,
        gradeLevel: subjectFilterGrade.value || undefined
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to seed subjects')
    notify(`Seeded ${data.createdCount} standard DepEd subjects!`, 'success')
    await loadSubjects()
  } catch (err) {
    notify(err.message || 'Error seeding subjects', 'error')
  } finally {
    seedingDefaults.value = false
  }
}

// -------------------------------------------------------------------
// TAB 3: FORM 138 HANDLERS
// -------------------------------------------------------------------
function onSwitchToForm138() {
  if (!form138Filter.grade && grades.value.length) {
    form138Filter.grade = grades.value[0]
  }
  if (!form138Filter.section && form138Sections.value.length) {
    form138Filter.section = form138Sections.value[0]
  }
  loadSectionStudentsFor138()
}

function onForm138GradeChange() {
  form138Filter.section = form138Sections.value.length ? form138Sections.value[0] : ''
  loadSectionStudentsFor138()
}

async function loadSectionStudentsFor138() {
  if (!form138Filter.grade || !form138Filter.section) {
    form138StudentList.value = []
    return
  }
  try {
    const params = new URLSearchParams({
      grade: form138Filter.grade,
      section: form138Filter.section
    })
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)

    const res = await fetch(`/api/students?${params.toString()}`)
    const data = await res.json()
    form138StudentList.value = data.students || (Array.isArray(data) ? data : [])
    if (form138StudentList.value.length && !form138Filter.studentId) {
      form138Filter.studentId = form138StudentList.value[0].id
    }
  } catch (err) {
    console.error('Error loading students for Form 138:', err)
  }
}

async function loadForm138(studentId) {
  if (!studentId) return
  loadingForm138.value = true
  try {
    const params = new URLSearchParams()
    if (form138Filter.schoolYear) params.set('schoolYear', form138Filter.schoolYear)

    const res = await fetch(`/api/grading/form138/${studentId}?${params.toString()}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load Form 138')

    form138Data.value = data
    customAdviser.value = data.adviserName || ''
    customPrincipal.value = data.principalName || data.school?.principal_name || ''
    observedValues.value = (data.coreValues || []).map(cv => ({
      coreValue: cv.coreValue,
      behaviorStatements: (cv.behaviorStatements || []).map(stmt => ({
        text: typeof stmt === 'string' ? stmt : (stmt.text || ''),
        q1: 'AO',
        q2: 'AO',
        q3: 'AO',
        q4: 'AO'
      }))
    }))
    notify(`Loaded Form 138 for ${data.student?.name}`, 'success')
  } catch (err) {
    notify(err.message || 'Error loading Form 138', 'error')
  } finally {
    loadingForm138.value = false
  }
}

function viewStudentForm138(studentId) {
  form138Filter.grade = filter.grade
  form138Filter.section = filter.section
  form138Filter.studentId = studentId
  activeTab.value = 'form138'
  loadForm138(studentId)
}

function printForm138() {
  window.print()
}

// -------------------------------------------------------------------
// TAB 4: ANALYTICS HANDLERS
// -------------------------------------------------------------------
async function loadAnalytics() {
  loadingAnalytics.value = true
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    if (analyticsFilter.grade) params.set('gradeLevel', analyticsFilter.grade)
    if (analyticsFilter.quarter) params.set('quarter', analyticsFilter.quarter)
    if (analyticsFilter.schoolYear) params.set('schoolYear', analyticsFilter.schoolYear)

    const res = await fetch(`/api/grading/analytics?${params.toString()}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load analytics')

    analyticsData.value = data
  } catch (err) {
    notify(err.message || 'Error loading analytics', 'error')
  } finally {
    loadingAnalytics.value = false
  }
}

function getDistPct(count) {
  if (!analyticsData.value?.totalGradesEvaluated) return 0
  return Math.round((Number(count || 0) / analyticsData.value.totalGradesEvaluated) * 100)
}
</script>

<style scoped>
.grading-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.grading-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.school-select-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.school-select-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.school-select {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--foreground);
}

/* Tabs */
.grading-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted-foreground);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--foreground);
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Cards & Toolbars */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.toolbar-card {
  padding: 16px 20px;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  align-items: flex-end;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.form-select, .form-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.88rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--foreground);
}

/* Subject Weights Banner */
.subject-weights-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 18px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.subject-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.subject-title {
  font-size: 1rem;
  color: var(--foreground);
}

.weight-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.weight-pill {
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  background: var(--card);
}

.pill-ww { border-color: rgba(3, 105, 161, 0.3); color: var(--info); }
.pill-pt { border-color: rgba(180, 83, 9, 0.3); color: var(--warning); }
.pill-qa { border-color: rgba(21, 128, 61, 0.3); color: var(--success); }

/* Grade Sheet Table */
.table-card {
  padding: 0;
  overflow: hidden;
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.table-card-header h3 {
  margin: 0;
  font-size: 1.05rem;
}

.sub-text {
  font-size: 0.8rem;
  color: var(--muted-foreground);
  margin: 2px 0 0;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th, .data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table thead th {
  background: var(--muted);
  font-weight: 700;
  color: var(--foreground);
  text-align: center;
}

.group-header {
  border-bottom: 1px solid var(--border);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.group-ww { background: rgba(3, 105, 161, 0.08) !important; color: var(--info); }
.group-pt { background: rgba(180, 83, 9, 0.08) !important; color: var(--warning); }
.group-qa { background: rgba(21, 128, 61, 0.08) !important; color: var(--success); }

.sub-col {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.col-num { width: 36px; text-align: center; }
.col-lrn { width: 110px; font-size: 0.78rem; }
.col-name { min-width: 180px; text-align: left !important; }
.col-gender { width: 45px; text-align: center; }
.col-init { width: 65px; text-align: center; font-weight: 600; }
.col-trans { width: 75px; text-align: center; }
.col-remarks { width: 85px; text-align: center; }
.col-lock { width: 50px; text-align: center; }
.col-action { width: 70px; text-align: center; }

.score-input {
  width: 54px;
  padding: 4px 6px;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs, 4px);
  background: var(--card);
  color: var(--foreground);
  font-size: 0.88rem;
  font-weight: 600;
}

.total-input {
  width: 46px;
  color: var(--muted-foreground);
  background: var(--muted);
}

.font-mono { font-family: ui-monospace, monospace; }

.gender-tag {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 4px;
}
.tag-male { background: rgba(3, 105, 161, 0.12); color: var(--info); }
.tag-female { background: rgba(217, 67, 59, 0.12); color: var(--destructive); }

.grade-pill {
  display: inline-block;
  padding: 3px 8px;
  font-size: 0.88rem;
  font-weight: 800;
  border-radius: 6px;
}
.grade-passed { background: var(--success-bg); color: var(--success); }
.grade-failed { background: var(--red-bg); color: var(--destructive); }

.status-tag {
  display: inline-block;
  padding: 2px 7px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 4px;
}
.tag-passed { background: var(--success-bg); color: var(--success); }
.tag-failed { background: var(--red-bg); color: var(--destructive); }

.btn-icon-lock {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px;
  color: var(--muted-foreground);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-icon-lock.locked {
  background: rgba(217, 67, 59, 0.1);
  color: var(--destructive);
  border-color: rgba(217, 67, 59, 0.3);
}

.btn-sm {
  padding: 3px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--foreground);
}
.btn-outline:hover {
  background: var(--secondary);
}

/* Subjects View */
.subjects-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}
.subjects-actions {
  display: flex;
  gap: 10px;
}

.table-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
}
.btn-icon {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
  color: var(--foreground);
}
.btn-icon-danger:hover {
  color: var(--destructive);
  border-color: var(--destructive);
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 4px;
}
.badge-code { background: var(--muted); color: var(--foreground); }
.badge-success { background: var(--success-bg); color: var(--success); }
.badge-danger { background: var(--red-bg); color: var(--destructive); }
.badge-grade { background: var(--secondary); color: var(--secondary-foreground); }
.badge-sy { background: var(--muted); color: var(--muted-foreground); }
.badge-honor { background: var(--warning-bg); color: var(--warning); font-weight: 800; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal-card {
  max-width: 500px;
  width: 100%;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.weight-total-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  padding: 8px 12px;
  background: var(--muted);
  border-radius: var(--radius-sm);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

/* ======================================================== */
/* FORM 138 (SF9) OFFICIAL PRINTABLE LAYOUT */
/* ======================================================== */
.sf9-welcome-card {
  padding: 40px 24px;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}
.sf9-welcome-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--primary-bg);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
.sf9-welcome-card h3 {
  margin: 0 0 8px;
  font-size: 1.15rem;
}
.sf9-welcome-card p {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.88rem;
  line-height: 1.5;
}

.sf9-workspace {
  margin-bottom: 30px;
}

.sf9-preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 18px;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: var(--shadow-sm);
}

.sf9-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sf9-doc-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  font-size: 0.82rem;
  color: var(--primary);
  background: var(--primary-bg);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.sf9-student-tag {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--foreground);
}

.sf9-lrn-tag {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  background: var(--muted);
  padding: 2px 7px;
  border-radius: 4px;
}

.sf9-toolbar-center {
  display: flex;
  justify-content: center;
}

.view-mode-pills {
  display: flex;
  gap: 4px;
  background: var(--muted);
  padding: 3px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.mode-pill {
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-pill.active {
  background: var(--card);
  color: var(--foreground);
  box-shadow: var(--shadow-xs);
  font-weight: 700;
}

.sf9-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px 5px;
}

.btn-zoom {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: var(--secondary);
  color: var(--foreground);
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-zoom-reset {
  width: auto;
  padding: 0 6px;
  font-size: 0.72rem;
}

.zoom-level {
  font-size: 0.76rem;
  font-weight: 700;
  min-width: 38px;
  text-align: center;
  color: var(--foreground);
}

.btn-print-sf9 {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  background: #1e3a8a;
  color: #ffffff;
  border: 1px solid #1e3a8a;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
}

.btn-print-sf9:hover {
  background: #1d4ed8;
}

.btn-sig-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--foreground);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-sig-toggle:hover {
  background: var(--muted);
}

.btn-sig-toggle.active {
  background: var(--primary-bg);
  color: var(--primary);
  border-color: var(--primary);
}

.sf9-sig-drawer {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 18px;
  margin-bottom: 18px;
  box-shadow: var(--shadow-sm);
}

.sig-drawer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 16px;
  align-items: flex-end;
}

.sig-drawer-grid .form-group {
  margin-bottom: 0;
}

.sig-drawer-grid label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 4px;
  display: block;
}

.sig-drawer-action {
  display: flex;
  align-items: flex-end;
}

.sf9-sheet-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 5px 12px;
  background: #f1f5f9;
  border-left: 3px solid #1e3a8a;
  border-radius: 4px;
  font-size: 0.72rem;
  color: #334155;
}

.sheet-number {
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #1e3a8a;
}

.sheet-title {
  color: #475569;
}

.sf9-canvas-viewport {
  background: var(--muted);
  padding: 28px 20px;
  border-radius: var(--radius);
  border: 1px dashed var(--border);
  overflow-x: auto;
  min-height: 600px;
  display: flex;
  justify-content: center;
}

.sf9-document-wrapper {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  max-width: 860px;
}

.sf9-page {
  background: #ffffff;
  color: #0f172a;
  padding: 34px 38px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  position: relative;
}

.sf9-official-header {
  display: grid;
  grid-template-columns: 80px 1fr 80px;
  align-items: center;
  gap: 16px;
  text-align: center;
  border-bottom: 2px solid #0f172a;
  padding-bottom: 12px;
  margin-bottom: 14px;
}

.official-crest-svg {
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.header-center-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gov-line-1 {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
  color: #1e293b;
  font-family: 'Georgia', 'Times New Roman', serif;
}

.gov-line-2 {
  font-size: 1.12rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 2px 0 3px;
  color: #1e3a8a;
  font-family: 'Georgia', 'Times New Roman', serif;
}

.gov-division {
  font-size: 0.82rem;
  font-weight: 700;
  margin: 0 0 2px;
  color: #334155;
}

.gov-school-name {
  font-size: 1.02rem;
  font-weight: 800;
  margin: 2px 0;
  color: #0f172a;
}

.gov-school-meta {
  font-size: 0.75rem;
  color: #475569;
  margin: 2px 0 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.sf9-title-banner {
  background: #f1f5f9;
  border-top: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  padding: 5px 16px;
  width: 100%;
  border-radius: 4px;
}

.sf9-title-banner h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: #0f172a;
}

.sf9-sub {
  margin: 2px 0 0;
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
}

.sf9-learner-profile {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px 16px;
  margin-bottom: 16px;
  font-size: 0.82rem;
}

.profile-entry {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.profile-entry .label {
  font-size: 0.72rem;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
}

.profile-entry .val {
  color: #0f172a;
  font-size: 0.84rem;
}

.val-name {
  font-size: 0.95rem !important;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
}

.val-lrn {
  font-weight: 800;
  letter-spacing: 0.06em;
  background: #e2e8f0;
  padding: 1px 6px;
  border-radius: 4px;
  color: #0f172a;
}

.profile-entry-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.sf9-dear-parent-box {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 6px;
  padding: 12px 18px;
  margin-bottom: 18px;
  font-size: 0.8rem;
}

.box-subtitle {
  font-size: 0.78rem;
  font-weight: 900;
  margin: 0 0 6px;
  color: #1e3a8a;
  letter-spacing: 0.03em;
}

.parent-text {
  margin: 0 0 12px;
  line-height: 1.5;
  color: #1e293b;
  font-style: italic;
}

.parent-signatures-inline {
  display: flex;
  justify-content: space-around;
  gap: 24px;
  border-top: 1px dashed #cbd5e1;
  padding-top: 10px;
  margin-top: 8px;
}

.inline-sig {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sig-line-text {
  font-weight: 800;
  font-size: 0.84rem;
  color: #0f172a;
  border-bottom: 1px solid #334155;
  padding-bottom: 2px;
  min-width: 180px;
  text-align: center;
}

.sig-role {
  font-size: 0.72rem;
  color: #475569;
  margin-top: 3px;
  font-weight: 600;
}

.sf9-panel-box {
  border: 1px solid #334155;
  border-radius: 4px;
  overflow: hidden;
  background: #ffffff;
}

.panel-header {
  background: #f1f5f9;
  border-bottom: 1px solid #334155;
  padding: 6px 12px;
  text-align: center;
}

.panel-header h4 {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  color: #0f172a;
  text-transform: uppercase;
}

.sf9-grid-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
}

.sf9-grid-table th, .sf9-grid-table td {
  border: 1px solid #475569;
  padding: 5px 6px;
  text-align: center;
  color: #0f172a;
}

.sf9-grid-table thead th {
  background: #f8fafc;
  font-weight: 800;
  font-size: 0.74rem;
  color: #0f172a;
}

/* Attendance Full-Width Box */
.sf9-attendance-box {
  margin-bottom: 18px;
  width: 100%;
}

.sf9-attendance-table {
  width: 100%;
  table-layout: fixed;
}

.sf9-attendance-table th,
.sf9-attendance-table td {
  padding: 5px 3px;
  font-size: 0.73rem;
  text-align: center;
}

.sf9-attendance-table th.col-att-metric,
.sf9-attendance-table td:first-child {
  width: 140px;
  text-align: left !important;
  padding-left: 8px;
}

.sf9-attendance-table th.col-att-total,
.sf9-attendance-table td.col-att-total {
  width: 52px;
}

.col-att-metric {
  width: 140px;
  text-align: left !important;
  font-weight: 700;
}

.col-att-total {
  font-weight: 800;
  background: #f1f5f9;
}

.cell-total {
  background: #f8fafc;
  font-weight: 800;
}

/* Bottom Grid: Parent Signatures & Certificate of Transfer */
.sf9-page1-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.sf9-parent-sig-box {
  display: flex;
  flex-direction: column;
}

.sf9-parent-sig-table {
  flex: 1;
}

.sf9-parent-sig-table th {
  padding: 4px 6px;
  font-size: 0.72rem;
}

.sf9-parent-sig-table td {
  height: 28px;
  padding: 3px 6px;
  font-size: 0.72rem;
}

.dotted-underline {
  border-bottom: 1px dotted #94a3b8 !important;
}

.sig-note-small {
  margin: 6px 8px 4px;
  font-size: 0.68rem;
  color: #64748b;
  text-align: center;
}

.sf9-transfer-box {
  display: flex;
  flex-direction: column;
}

.cert-transfer-subbox {
  padding: 10px 14px;
  background: #fafafa;
  font-size: 0.74rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.cert-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cert-field-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  font-size: 0.72rem;
  line-height: 1.3;
}

.cert-lbl {
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
  font-size: 0.72rem;
}

.cert-fill {
  flex: 1;
  border-bottom: 1px solid #475569;
  min-height: 14px;
  display: inline-block;
}

.cert-signers {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  padding-top: 6px;
  text-align: center;
}

.cert-sig-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cert-sig-block .sig-line {
  border-bottom: 1px solid #334155;
  font-weight: 800;
  font-size: 0.74rem;
  color: #0f172a;
  min-width: 110px;
  padding-bottom: 1px;
  text-align: center;
}

.cert-sig-block .sig-role {
  font-size: 0.68rem;
  color: #64748b;
  margin-top: 2px;
}

.cert-cancellation-block {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #cbd5e1;
}

.cert-sub-title {
  margin: 0 0 6px;
  font-size: 0.68rem;
  font-weight: 900;
  text-align: center;
  color: #334155;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Page 2 */
.sf9-academic-header {
  text-align: center;
  border-bottom: 2px solid #0f172a;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.sf9-academic-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: #0f172a;
  text-transform: uppercase;
}

.deped-order-tag {
  margin: 2px 0 0;
  font-size: 0.74rem;
  font-weight: 600;
  color: #475569;
}

.sf9-page2-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 20px;
}

.sf9-learning-areas-table {
  margin-bottom: 14px;
}

.subject-name-cell {
  padding-left: 8px !important;
}

.sub-code-tiny {
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 600;
  margin-left: 3px;
}

.rating-cell {
  font-size: 0.8rem;
}

.final-cell {
  font-size: 0.84rem;
  background: #f8fafc;
}

.remarks-cell {
  font-size: 0.76rem;
  font-weight: 700;
}

.tag-prom {
  color: #15803d;
  font-weight: 800;
}

.tag-fail {
  color: #b91c1c;
  font-weight: 800;
}

.row-general-average td {
  background: #f1f5f9;
  border-top: 2px solid #0f172a;
  border-bottom: 2px solid #0f172a;
  padding: 7px 6px;
}

.gen-avg-label {
  font-size: 0.84rem;
  font-weight: 900;
  color: #0f172a;
}

.gen-avg-val {
  font-size: 0.95rem;
  font-weight: 900;
  color: #1e3a8a;
}

.status-promoted {
  color: #15803d;
  font-weight: 900;
  letter-spacing: 0.03em;
}

.status-retained {
  color: #b91c1c;
  font-weight: 900;
  letter-spacing: 0.03em;
}

.sf9-descriptors-box {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 0.74rem;
  margin-bottom: 12px;
}

.descriptors-title {
  font-weight: 900;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #334155;
  margin-bottom: 6px;
  text-align: center;
}

.descriptors-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.desc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px dashed #e2e8f0;
  padding-bottom: 2px;
}

.desc-item span {
  color: #334155;
}

.desc-item strong {
  color: #0f172a;
}

.desc-item .pass {
  font-style: normal;
  font-weight: 700;
  color: #166534;
  font-size: 0.7rem;
}

.desc-item .fail {
  font-style: normal;
  font-weight: 700;
  color: #991b1b;
  font-size: 0.7rem;
}

.sf9-academic-honor-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1.5px solid #d97706;
  border-radius: 6px;
  padding: 10px 14px;
  margin-top: 12px;
  box-shadow: 0 2px 5px rgba(217, 119, 6, 0.15);
}

.honor-laurel {
  font-size: 1.3rem;
  color: #b45309;
  letter-spacing: 0.1em;
  flex-shrink: 0;
}

.honor-content {
  display: flex;
  flex-direction: column;
}

.honor-heading {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #92400e;
}

.honor-title {
  font-size: 1rem;
  font-weight: 900;
  color: #78350f;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.honor-deped-ref {
  font-size: 0.65rem;
  color: #92400e;
  margin-top: 2px;
}

.cell-cv-title {
  background: #f8fafc;
  font-size: 0.76rem;
  width: 110px;
}

.stmt-text {
  font-size: 0.72rem;
  line-height: 1.35;
  padding: 6px 8px !important;
}

.col-vq {
  width: 38px;
}

.cell-rating {
  cursor: pointer;
  user-select: none;
  transition: background 0.12s ease;
}

.cell-rating:hover {
  background: #f1f5f9;
}

.rating-tag {
  display: inline-block;
  padding: 2px 5px;
  font-size: 0.72rem;
  font-weight: 800;
  border-radius: 3px;
  min-width: 24px;
}

.rate-AO {
  background: #dcfce7;
  color: #166534;
}

.rate-SO {
  background: #e0f2fe;
  color: #0369a1;
}

.rate-RO {
  background: #fef3c7;
  color: #92400e;
}

.rate-NO {
  background: #fee2e2;
  color: #991b1b;
}

.sf9-marking-legend {
  margin-top: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  padding: 8px 12px;
  background: #fafafa;
  font-size: 0.72rem;
}

.legend-header {
  font-weight: 900;
  font-size: 0.7rem;
  color: #475569;
  letter-spacing: 0.04em;
  margin-bottom: 5px;
  text-transform: uppercase;
  text-align: center;
}

.legend-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 10px;
}

.leg-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
}

.leg-item .code {
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.68rem;
  min-width: 22px;
  text-align: center;
}

.code-ao {
  background: #dcfce7;
  color: #166534;
}

.code-so {
  background: #e0f2fe;
  color: #0369a1;
}

.code-ro {
  background: #fef3c7;
  color: #92400e;
}

.code-no {
  background: #fee2e2;
  color: #991b1b;
}

.sf9-page2-signatures {
  display: flex;
  justify-content: space-around;
  margin-top: 28px;
  gap: 24px;
  padding-top: 12px;
}

.sig-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sig-line-wrap {
  border-bottom: 1px solid #1e293b;
  min-width: 190px;
  padding-bottom: 3px;
}

.signer-name {
  font-weight: 800;
  font-size: 0.84rem;
  color: #0f172a;
  text-transform: uppercase;
}

.signer-title {
  font-size: 0.72rem;
  color: #475569;
  margin: 3px 0 0;
  font-weight: 600;
}

/* Analytics */
.distribution-card {
  padding: 20px;
}
.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.dist-row {
  display: grid;
  grid-template-columns: 240px 1fr 90px;
  align-items: center;
  gap: 14px;
  font-size: 0.85rem;
}
.dist-track {
  height: 16px;
  background: var(--muted);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.dist-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
.fill-out { background: var(--success); }
.fill-vs { background: #2dd4bf; }
.fill-sat { background: var(--info); }
.fill-fair { background: var(--warning); }
.fill-fail { background: var(--destructive); }
.dist-count {
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--foreground);
  text-align: right;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: var(--primary-foreground);
  border: 1px solid var(--primary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-secondary:hover:not(:disabled) {
  background: var(--secondary-hover);
}

.empty-card {
  padding: 32px;
  text-align: center;
  color: var(--muted-foreground);
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.stat-icon--primary { background: var(--primary-bg); color: var(--primary); }
.stat-icon--info { background: var(--info-bg); color: var(--info); }
.stat-icon--success { background: var(--success-bg); color: var(--success); }
.stat-icon--warning { background: var(--warning-bg); color: var(--warning); }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 1.4rem; font-weight: 800; color: var(--foreground); line-height: 1.2; }
.stat-label { font-size: 0.78rem; color: var(--muted-foreground); font-weight: 600; }

/* Print styling */
@media print {
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  :global(.app-sidebar),
  :global(.sidebar),
  :global(.sidebar-scrim),
  :global(.top-nav),
  :global(.navbar),
  :global(header),
  :global(nav),
  .page-header,
  .grading-header,
  .grading-tabs,
  .tab-nav,
  .toolbar-card,
  .sf9-preview-toolbar,
  .sf9-sig-drawer,
  .sf9-sheet-banner,
  .no-print,
  button {
    display: none !important;
  }

  :global(html),
  :global(body),
  :global(#app),
  :global(.app-body),
  :global(.main-with-sidebar),
  .grading-page,
  .tab-content,
  .sf9-workspace,
  .sf9-canvas-viewport {
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    min-height: 0 !important;
    overflow: visible !important;
    display: block !important;
    width: 100% !important;
  }

  .sf9-document-wrapper {
    max-width: 100% !important;
    width: 100% !important;
    transform: none !important;
    gap: 0 !important;
    display: block !important;
  }

  .sf9-page {
    background: #ffffff !important;
    color: #0f172a !important;
    border: 1.5px solid #0f172a !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 22px 26px !important;
    margin: 0 0 20px 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .sf9-page-front {
    page-break-after: always !important;
    break-after: page !important;
  }

  .sf9-page-back {
    page-break-before: always !important;
    break-before: page !important;
  }

  .view-p1 .sf9-page-back {
    display: none !important;
  }

  .view-p2 .sf9-page-front {
    display: none !important;
  }

  .view-p1 .sf9-page-front,
  .view-p2 .sf9-page-back {
    page-break-after: auto !important;
    break-after: auto !important;
    page-break-before: auto !important;
    break-before: auto !important;
  }
}

@media (max-width: 900px) {
  .sf9-sections-grid {
    grid-template-columns: 1fr;
  }
  .dist-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
