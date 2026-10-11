<template>
  <div class="class-record-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb no-print">
      <router-link to="/grading">Academic</router-link>
      <span class="sep">/</span>
      <router-link to="/grading">Grading &amp; SF9</router-link>
      <span class="sep">/</span>
      <span class="current">DepEd E-Class Record (Raw Scores)</span>
    </div>

    <!-- Header -->
    <div class="page-header class-record-header no-print">
      <div class="page-header-text">
        <div class="dashboard-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
            <line x1="9" y1="7" x2="15" y2="7"/>
            <line x1="9" y1="11" x2="15" y2="11"/>
            <line x1="9" y1="15" x2="13" y2="15"/>
          </svg>
        </div>
        <div>
          <h1>DepEd E-Class Record (Raw Scores)</h1>
          <p>Official DepEd Order No. 8, s. 2015 Electronic Class Record with adjustable component percentages, item-level raw scores, Percentage Scores (PS), Weighted Scores (WS), and live transmutation.</p>
        </div>
      </div>

      <div class="header-right-actions">
        <!-- Campus Badge & School Info -->
        <div class="campus-identity-pill" v-if="currentSchool">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h1M14 10h1M9 14h1M14 14h1M9 18h1M14 18h1"/>
          </svg>
          <span class="campus-name">{{ currentSchool.name }}</span>
          <span class="campus-badge" v-if="currentSchool.school_id">ID: {{ currentSchool.school_id }}</span>
          <span class="campus-badge badge-trimester" v-if="activeQuarterCount === 3">3 Quarters (Trimester)</span>
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

        <router-link to="/grading" class="btn-secondary link-to-sf9">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>Open SF9 (Form 138)</span>
        </router-link>
      </div>
    </div>

    <!-- License Lock Banner -->
    <div v-if="isLicenseLocked" class="license-locked-card no-print">
      <div class="lock-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div class="lock-copy">
        <h3>School Workspace Locked</h3>
        <p>This school's ElyTrack subscription license is currently {{ licenseStatus }}. Saving and modifying class records is temporarily restricted. Please contact your school administrator or ely.ashzyl@gmail.com to restore access.</p>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="card toolbar-card no-print">
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
          <select v-model="filter.section" @change="onSectionChange" class="form-select">
            <option value="">Select Section</option>
            <option v-for="s in availableSections" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Subject / Learning Area</label>
          <select v-model="filter.subjectId" @change="onSubjectChange" class="form-select">
            <option value="">Select Subject</option>
            <option v-for="sub in subjectList" :key="sub.id" :value="sub.id">
              {{ sub.subject_name }} ({{ sub.subject_code || 'SUB' }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Quarter / Term</label>
          <select v-model="filter.quarter" @change="onQuarterChange" class="form-select">
            <option v-for="q in availableQuarterOptions" :key="q.value" :value="q.value">
              {{ q.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>School Year</label>
          <input v-model="filter.schoolYear" @change="onSchoolYearChange" class="form-input" placeholder="e.g. 2026-2027" />
        </div>

        <div class="toolbar-actions">
          <button
            type="button"
            class="btn-primary load-btn"
            :disabled="loadingRecord || !filter.grade || !filter.section || !filter.subjectId"
            @click="loadClassRecord"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>{{ loadingRecord ? 'Loading…' : 'Load E-Class Record' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Class Record Loaded -->
    <div v-if="activeSubject && students.length" class="class-record-body">
      <!-- Printable DepEd Header (Visible only on Print) -->
      <div class="print-header-only">
        <div class="print-school-name">{{ currentSchool?.name || 'Department of Education' }}</div>
        <div class="print-school-sub">School ID: {{ currentSchool?.school_id || '—' }} &bull; S.Y. {{ filter.schoolYear }}</div>
        <h2 class="print-title">ELECTRONIC CLASS RECORD (DEPED ORDER NO. 8, S. 2015)</h2>
        <div class="print-meta-grid">
          <div><strong>Grade &amp; Section:</strong> {{ filter.grade }} - {{ filter.section }}</div>
          <div><strong>Subject / Learning Area:</strong> {{ activeSubject?.subject_name }} ({{ activeSubject?.subject_code || 'SUB' }})</div>
          <div><strong>Quarter:</strong> {{ filter.quarter }}</div>
          <div><strong>Weights:</strong> WW: {{ weights.ww }}% | PT: {{ weights.pt }}% | QA: {{ weights.qa }}%</div>
        </div>
      </div>

      <!-- Editable Assessment Weights & DepEd Presets Panel -->
      <div class="card weights-panel-card no-print">
        <div class="weights-panel-header">
          <div>
            <div class="weights-header-title-row">
              <h3>Assessment Weights &amp; Percentage Distribution</h3>
              <span class="deped-order-badge">DepEd Order No. 8, s. 2015</span>
            </div>
            <p class="sub-text">
              Teachers can adjust the component percentages for this class record. Total must equal <strong>100%</strong>.
            </p>
          </div>

          <div class="weights-header-right">
            <div class="weights-total-badge" :class="totalWeight === 100 ? 'total-valid' : 'total-invalid'">
              <span v-if="totalWeight === 100">Total: 100% ✓ Valid Weight</span>
              <span v-else>Total: {{ totalWeight }}% ⚠ Must equal 100%</span>
            </div>

            <div v-if="isModified" class="unsaved-badge" title="You have unsaved changes in raw scores or weights">
              <span class="dot-unsaved"></span>
              <span>Unsaved Changes</span>
            </div>
            <div v-else class="saved-badge">
              <span>✓ All saved</span>
            </div>
          </div>
        </div>

        <div class="weights-controls-row">
          <div class="weight-inputs-group">
            <div class="weight-field">
              <label>
                <span class="dot dot-ww"></span>
                Written Works (WW):
              </label>
              <div class="weight-input-wrap">
                <input
                  type="number"
                  min="0"
                  max="100"
                  v-model.number="weights.ww"
                  @input="onWeightInput"
                  class="weight-input"
                />
                <span class="unit">%</span>
              </div>
            </div>

            <div class="weight-field">
              <label>
                <span class="dot dot-pt"></span>
                Performance Tasks (PT):
              </label>
              <div class="weight-input-wrap">
                <input
                  type="number"
                  min="0"
                  max="100"
                  v-model.number="weights.pt"
                  @input="onWeightInput"
                  class="weight-input"
                />
                <span class="unit">%</span>
              </div>
            </div>

            <div class="weight-field">
              <label>
                <span class="dot dot-qa"></span>
                Quarterly Exam (QA):
              </label>
              <div class="weight-input-wrap">
                <input
                  type="number"
                  min="0"
                  max="100"
                  v-model.number="weights.qa"
                  @input="onWeightInput"
                  class="weight-input"
                />
                <span class="unit">%</span>
              </div>
            </div>
          </div>

          <!-- Presets -->
          <div class="presets-group">
            <span class="presets-label">DepEd Standard Presets:</span>
            <button
              type="button"
              class="preset-btn"
              :class="{ active: weights.ww === 30 && weights.pt === 50 && weights.qa === 20 }"
              @click="applyPreset(30, 50, 20)"
              title="Filipino, English, AP, EsP"
            >
              Languages / AP / EsP (30-50-20)
            </button>
            <button
              type="button"
              class="preset-btn"
              :class="{ active: weights.ww === 40 && weights.pt === 40 && weights.qa === 20 }"
              @click="applyPreset(40, 40, 20)"
              title="Mathematics, Science"
            >
              Math &amp; Science (40-40-20)
            </button>
            <button
              type="button"
              class="preset-btn"
              :class="{ active: weights.ww === 20 && weights.pt === 60 && weights.qa === 20 }"
              @click="applyPreset(20, 60, 20)"
              title="MAPEH, EPP, TLE"
            >
              MAPEH / TLE (20-60-20)
            </button>
          </div>
        </div>
      </div>

      <!-- DepEd Formula Reference Guide Card -->
      <div class="card deped-formula-card no-print">
        <div class="formula-card-header" @click="showFormulaGuide = !showFormulaGuide">
          <div class="formula-header-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h3>DepEd Order No. 8, s. 2015 Assessment Reference &amp; Computation Formulas</h3>
          </div>
          <button type="button" class="btn-xs btn-outline">{{ showFormulaGuide ? 'Hide Guide' : 'Show Guide' }}</button>
        </div>
        <div v-if="showFormulaGuide" class="formula-card-body">
          <div class="formula-box">
            <strong class="formula-box-title">1. Percentage Score (PS)</strong>
            <code>PS = (Learner Total Raw / HPS) &times; 100%</code>
            <p>Computed independently for Written Works, Performance Tasks, and Quarterly Exam.</p>
          </div>
          <div class="formula-box">
            <strong class="formula-box-title">2. Weighted Score (WS)</strong>
            <code>WS = PS &times; Component Weight (%)</code>
            <p>E.g., with 40% weight, 94.00% PS yields a Weighted Score of 37.60.</p>
          </div>
          <div class="formula-box">
            <strong class="formula-box-title">3. Initial &amp; Transmuted Grade</strong>
            <code>Initial Grade = WS(WW) + WS(PT) + WS(QA)</code>
            <p>Transmuted via official DepEd Order No. 8 Transmutation Table (60&ndash;100; passing grade is &ge; 75). Synchronizes with SF9.</p>
          </div>
        </div>
      </div>

      <!-- Item Columns Management Toolbar -->
      <div class="card items-setup-card no-print">
        <div class="items-setup-content">
          <div class="items-group-ctrl">
            <span class="ctrl-title">Written Works:</span>
            <span class="ctrl-count">{{ wwHps.length }} item(s)</span>
            <button type="button" @click="addWwItem(20)" class="btn-xs btn-outline" title="Add 1 Written Work item">
              + Add Item
            </button>
            <button type="button" @click="addMultipleWwItems(5, 20)" class="btn-xs btn-outline" title="Add 5 Written Work items at once">
              + 5 Items
            </button>
            <button type="button" @click="promptSetAllHps('ww')" class="btn-xs btn-outline" title="Set highest possible score for all Written Works">
              Set All HPS
            </button>
            <button type="button" @click="removeWwItem" :disabled="wwHps.length <= 1" class="btn-xs btn-outline text-danger" title="Remove last Written Work item">
              &minus; Remove Last
            </button>
          </div>

          <div class="items-divider"></div>

          <div class="items-group-ctrl">
            <span class="ctrl-title">Performance Tasks:</span>
            <span class="ctrl-count">{{ ptHps.length }} item(s)</span>
            <button type="button" @click="addPtItem(25)" class="btn-xs btn-outline" title="Add 1 Performance Task item">
              + Add Item
            </button>
            <button type="button" @click="addMultiplePtItems(5, 25)" class="btn-xs btn-outline" title="Add 5 Performance Task items at once">
              + 5 Items
            </button>
            <button type="button" @click="promptSetAllHps('pt')" class="btn-xs btn-outline" title="Set highest possible score for all Performance Tasks">
              Set All HPS
            </button>
            <button type="button" @click="removePtItem" :disabled="ptHps.length <= 1" class="btn-xs btn-outline text-danger" title="Remove last Performance Task item">
              &minus; Remove Last
            </button>
          </div>

          <div class="items-divider"></div>

          <div class="items-group-ctrl">
            <span class="ctrl-title">Quarterly Assessment:</span>
            <span class="ctrl-count">{{ qaHps.length }} item(s)</span>
            <button type="button" @click="addQaItem(50)" class="btn-xs btn-outline" title="Add 1 Exam item">
              + Add Item
            </button>
            <button type="button" @click="removeQaItem" :disabled="qaHps.length <= 1" class="btn-xs btn-outline text-danger" title="Remove last Exam item">
              &minus; Remove Last
            </button>
          </div>

          <div class="items-right-actions">
            <button type="button" class="btn-secondary btn-sm" @click="printClassRecord" title="Print DepEd Official Class Record">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Print</span>
            </button>
            <button type="button" class="btn-secondary btn-sm" @click="exportCsv" :disabled="exportingCsv">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              class="btn-primary btn-sm"
              @click="saveClassRecord"
              :disabled="savingRecord || totalWeight !== 100 || isLicenseLocked"
              :title="isLicenseLocked ? 'Workspace is locked' : (totalWeight !== 100 ? 'Weights must equal 100%' : 'Save and synchronize grades with Form 138')"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>{{ savingRecord ? 'Saving…' : 'Save E-Class Record' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Electronic Class Record Spreadsheet Table -->
      <div class="card table-card eclass-table-card">
        <div class="table-responsive eclass-table-container">
          <table class="data-table eclass-table">
            <thead>
              <!-- Header Row 1: Component Groups -->
              <tr class="header-group-row">
                <th rowspan="2" class="sticky-col col-idx">#</th>
                <th rowspan="2" class="sticky-col col-name">Learner's Full Name</th>
                <th rowspan="2" class="sticky-col col-lrn">DepEd LRN</th>
                <th rowspan="2" class="col-sex">Sex</th>

                <!-- Written Work Group -->
                <th :colspan="wwHps.length + 3" class="group-header group-ww">
                  <div class="group-header-inner">
                    <span>Written Works ({{ weights.ww }}%) &bull; {{ wwHps.length }} Items</span>
                    <button type="button" @click="addWwItem(20)" class="btn-group-add no-print" title="Add another Written Work item">+ Add WW</button>
                  </div>
                </th>

                <!-- Performance Tasks Group -->
                <th :colspan="ptHps.length + 3" class="group-header group-pt">
                  <div class="group-header-inner">
                    <span>Performance Tasks ({{ weights.pt }}%) &bull; {{ ptHps.length }} Items</span>
                    <button type="button" @click="addPtItem(25)" class="btn-group-add no-print" title="Add another Performance Task item">+ Add PT</button>
                  </div>
                </th>

                <!-- Quarterly Assessment Group -->
                <th :colspan="qaHps.length + 3" class="group-header group-qa">
                  <div class="group-header-inner">
                    <span>Quarterly Exam ({{ weights.qa }}%) &bull; {{ qaHps.length }} Item</span>
                    <button type="button" @click="addQaItem(50)" class="btn-group-add no-print" title="Add another Exam item">+ Add QA</button>
                  </div>
                </th>

                <th rowspan="2" class="col-init">Initial Grade</th>
                <th rowspan="2" class="col-trans">Quarter Grade</th>
                <th rowspan="2" class="col-remarks">Remarks</th>
                <th rowspan="2" class="col-actions no-print">Card</th>
              </tr>

              <!-- Header Row 2: Sub-columns -->
              <tr class="header-sub-row">
                <!-- WW Items -->
                <th v-for="(h, idx) in wwHps" :key="`ww-h-${idx}`" class="sub-col item-header-cell">
                  <div class="sub-col-title-wrap">
                    <span>WW{{ idx + 1 }}</span>
                    <div class="item-quick-actions no-print">
                      <button
                        type="button"
                        @click="quickFillPrompt('ww', idx)"
                        class="col-quick-btn"
                        :title="`Quick fill scores for WW${idx + 1}`"
                      >&darr;</button>
                      <button 
                        v-if="wwHps.length > 1" 
                        type="button" 
                        @click="removeWwItemAt(idx)" 
                        class="col-del-btn" 
                        :title="`Remove Written Work item WW${idx + 1}`"
                      >&times;</button>
                    </div>
                  </div>
                </th>
                <th class="sub-col col-sum">Total</th>
                <th class="sub-col col-ps">PS (%)</th>
                <th class="sub-col col-ws">WS ({{ weights.ww }}%)</th>

                <!-- PT Items -->
                <th v-for="(h, idx) in ptHps" :key="`pt-h-${idx}`" class="sub-col item-header-cell">
                  <div class="sub-col-title-wrap">
                    <span>PT{{ idx + 1 }}</span>
                    <div class="item-quick-actions no-print">
                      <button
                        type="button"
                        @click="quickFillPrompt('pt', idx)"
                        class="col-quick-btn"
                        :title="`Quick fill scores for PT${idx + 1}`"
                      >&darr;</button>
                      <button 
                        v-if="ptHps.length > 1" 
                        type="button" 
                        @click="removePtItemAt(idx)" 
                        class="col-del-btn" 
                        :title="`Remove Performance Task item PT${idx + 1}`"
                      >&times;</button>
                    </div>
                  </div>
                </th>
                <th class="sub-col col-sum">Total</th>
                <th class="sub-col col-ps">PS (%)</th>
                <th class="sub-col col-ws">WS ({{ weights.pt }}%)</th>

                <!-- QA Items -->
                <th v-for="(h, idx) in qaHps" :key="`qa-h-${idx}`" class="sub-col item-header-cell">
                  <div class="sub-col-title-wrap">
                    <span>QA{{ idx + 1 }}</span>
                    <div class="item-quick-actions no-print">
                      <button
                        type="button"
                        @click="quickFillPrompt('qa', idx)"
                        class="col-quick-btn"
                        :title="`Quick fill scores for QA${idx + 1}`"
                      >&darr;</button>
                      <button 
                        v-if="qaHps.length > 1" 
                        type="button" 
                        @click="removeQaItemAt(idx)" 
                        class="col-del-btn" 
                        :title="`Remove Quarterly Exam item QA${idx + 1}`"
                      >&times;</button>
                    </div>
                  </div>
                </th>
                <th class="sub-col col-sum">Total</th>
                <th class="sub-col col-ps">PS (%)</th>
                <th class="sub-col col-ws">WS ({{ weights.qa }}%)</th>
              </tr>

              <!-- Row 3: Highest Possible Score (HPS) Row -->
              <tr class="hps-row">
                <th class="sticky-col hps-label-cell" colspan="3">HIGHEST POSSIBLE SCORE (HPS)</th>
                <th></th>

                <!-- WW HPS Inputs -->
                <td v-for="(h, idx) in wwHps" :key="`ww-hps-${idx}`" class="hps-cell">
                  <input
                    type="number"
                    min="1"
                    v-model.number="wwHps[idx]"
                    @input="onHpsChange"
                    class="hps-input"
                    title="Edit HPS for this Written Work item"
                  />
                </td>
                <td class="hps-stat font-bold">{{ wwHpsTotal }}</td>
                <td class="hps-stat">100.00%</td>
                <td class="hps-stat font-bold text-teal">{{ Number(weights.ww).toFixed(2) }}</td>

                <!-- PT HPS Inputs -->
                <td v-for="(h, idx) in ptHps" :key="`pt-hps-${idx}`" class="hps-cell">
                  <input
                    type="number"
                    min="1"
                    v-model.number="ptHps[idx]"
                    @input="onHpsChange"
                    class="hps-input"
                    title="Edit HPS for this Performance Task item"
                  />
                </td>
                <td class="hps-stat font-bold">{{ ptHpsTotal }}</td>
                <td class="hps-stat">100.00%</td>
                <td class="hps-stat font-bold text-amber">{{ Number(weights.pt).toFixed(2) }}</td>

                <!-- QA HPS Inputs -->
                <td v-for="(h, idx) in qaHps" :key="`qa-hps-${idx}`" class="hps-cell">
                  <input
                    type="number"
                    min="1"
                    v-model.number="qaHps[idx]"
                    @input="onHpsChange"
                    class="hps-input"
                    title="Edit HPS for this Quarterly Exam item"
                  />
                </td>
                <td class="hps-stat font-bold">{{ qaHpsTotal }}</td>
                <td class="hps-stat">100.00%</td>
                <td class="hps-stat font-bold text-emerald">{{ Number(weights.qa).toFixed(2) }}</td>

                <!-- Final HPS -->
                <td class="hps-stat font-bold">100.00</td>
                <td class="hps-stat font-bold">100</td>
                <td class="hps-stat font-bold text-success">Passed</td>
                <td class="no-print"></td>
              </tr>
            </thead>

            <tbody>
              <!-- MALE LEARNERS SECTION -->
              <tr class="section-divider-row male-divider">
                <td :colspan="totalTableCols">
                  <span class="gender-section-tag tag-male">
                    Male Learners ({{ maleStudents.length }})
                  </span>
                </td>
              </tr>

              <tr
                v-for="(st, idx) in maleStudents"
                :key="st.id"
                :class="{ 'row-failed': st.transmuted_grade < 75 && st.transmuted_grade > 0 }"
              >
                <td class="sticky-col col-idx">{{ idx + 1 }}</td>
                <td class="sticky-col col-name font-bold" :title="st.name">{{ st.name }}</td>
                <td class="sticky-col col-lrn font-mono">{{ st.lrn || '—' }}</td>
                <td class="col-sex text-center">
                  <span class="sex-pill pill-m">M</span>
                </td>

                <!-- WW Raw Scores -->
                <td v-for="(h, itemIdx) in wwHps" :key="`m-ww-${itemIdx}`">
                  <input
                    type="number"
                    min="0"
                    :max="h"
                    step="any"
                    v-model.number="st.ww_scores[itemIdx]"
                    @input="onScoreInput(st)"
                    class="score-input"
                    :class="{ 'input-exceeded': Number(st.ww_scores[itemIdx]) > h }"
                    :title="`Score: ${st.ww_scores[itemIdx] || 0} / ${h}`"
                  />
                </td>
                <td class="stat-cell font-bold">{{ st.ww_total }}</td>
                <td class="stat-cell">{{ st.ww_ps.toFixed(2) }}%</td>
                <td class="stat-cell font-bold text-teal">{{ st.ww_ws.toFixed(2) }}</td>

                <!-- PT Raw Scores -->
                <td v-for="(h, itemIdx) in ptHps" :key="`m-pt-${itemIdx}`">
                  <input
                    type="number"
                    min="0"
                    :max="h"
                    step="any"
                    v-model.number="st.pt_scores[itemIdx]"
                    @input="onScoreInput(st)"
                    class="score-input"
                    :class="{ 'input-exceeded': Number(st.pt_scores[itemIdx]) > h }"
                    :title="`Score: ${st.pt_scores[itemIdx] || 0} / ${h}`"
                  />
                </td>
                <td class="stat-cell font-bold">{{ st.pt_total }}</td>
                <td class="stat-cell">{{ st.pt_ps.toFixed(2) }}%</td>
                <td class="stat-cell font-bold text-amber">{{ st.pt_ws.toFixed(2) }}</td>

                <!-- QA Raw Scores -->
                <td v-for="(h, itemIdx) in qaHps" :key="`m-qa-${itemIdx}`">
                  <input
                    type="number"
                    min="0"
                    :max="h"
                    step="any"
                    v-model.number="st.qa_scores[itemIdx]"
                    @input="onScoreInput(st)"
                    class="score-input"
                    :class="{ 'input-exceeded': Number(st.qa_scores[itemIdx]) > h }"
                    :title="`Score: ${st.qa_scores[itemIdx] || 0} / ${h}`"
                  />
                </td>
                <td class="stat-cell font-bold">{{ st.qa_total }}</td>
                <td class="stat-cell">{{ st.qa_ps.toFixed(2) }}%</td>
                <td class="stat-cell font-bold text-emerald">{{ st.qa_ws.toFixed(2) }}</td>

                <!-- Initial Grade -->
                <td class="stat-cell font-bold font-mono">{{ st.initial_grade.toFixed(2) }}</td>

                <!-- Transmuted Grade -->
                <td class="stat-cell">
                  <span class="grade-pill" :class="st.transmuted_grade >= 75 ? 'grade-passed' : 'grade-failed'">
                    {{ st.transmuted_grade }}
                  </span>
                </td>

                <!-- Remarks -->
                <td class="stat-cell">
                  <span class="status-badge" :class="st.transmuted_grade >= 75 ? 'badge-passed' : 'badge-failed'">
                    {{ st.remarks }}
                  </span>
                </td>

                <!-- Action: Open Card -->
                <td class="text-center no-print">
                  <button type="button" @click="goToForm138(st.id)" class="btn-xs btn-outline" title="Open DepEd Form 138 (SF9)">
                    SF9
                  </button>
                </td>
              </tr>

              <tr v-if="maleStudents.length === 0">
                <td :colspan="totalTableCols" class="empty-group-cell">
                  No male learners enrolled in this section.
                </td>
              </tr>

              <!-- Male Subtotal Summary Row -->
              <tr v-else class="subtotal-row male-subtotal-row">
                <td colspan="4" class="sticky-col subtotal-label-cell">
                  <strong>MALE SUB-AVERAGE</strong>
                </td>
                <td :colspan="wwHps.length + 3 + ptHps.length + 3 + qaHps.length + 3" class="subtotal-dash-cell">
                  <span>{{ maleStudents.length }} Learners</span>
                </td>
                <td class="stat-cell font-bold">{{ maleInitialAverage }}</td>
                <td class="stat-cell font-bold">
                  <span class="grade-pill" :class="maleAverageGrade >= 75 ? 'grade-passed' : 'grade-failed'">
                    {{ maleAverageGrade }}
                  </span>
                </td>
                <td class="stat-cell font-bold">
                  <span class="status-badge badge-info">{{ malePassingRate }}% Pass</span>
                </td>
                <td class="no-print"></td>
              </tr>

              <!-- FEMALE LEARNERS SECTION -->
              <tr class="section-divider-row female-divider">
                <td :colspan="totalTableCols">
                  <span class="gender-section-tag tag-female">
                    Female Learners ({{ femaleStudents.length }})
                  </span>
                </td>
              </tr>

              <tr
                v-for="(st, idx) in femaleStudents"
                :key="st.id"
                :class="{ 'row-failed': st.transmuted_grade < 75 && st.transmuted_grade > 0 }"
              >
                <td class="sticky-col col-idx">{{ idx + 1 }}</td>
                <td class="sticky-col col-name font-bold" :title="st.name">{{ st.name }}</td>
                <td class="sticky-col col-lrn font-mono">{{ st.lrn || '—' }}</td>
                <td class="col-sex text-center">
                  <span class="sex-pill pill-f">F</span>
                </td>

                <!-- WW Raw Scores -->
                <td v-for="(h, itemIdx) in wwHps" :key="`f-ww-${itemIdx}`">
                  <input
                    type="number"
                    min="0"
                    :max="h"
                    step="any"
                    v-model.number="st.ww_scores[itemIdx]"
                    @input="onScoreInput(st)"
                    class="score-input"
                    :class="{ 'input-exceeded': Number(st.ww_scores[itemIdx]) > h }"
                    :title="`Score: ${st.ww_scores[itemIdx] || 0} / ${h}`"
                  />
                </td>
                <td class="stat-cell font-bold">{{ st.ww_total }}</td>
                <td class="stat-cell">{{ st.ww_ps.toFixed(2) }}%</td>
                <td class="stat-cell font-bold text-teal">{{ st.ww_ws.toFixed(2) }}</td>

                <!-- PT Raw Scores -->
                <td v-for="(h, itemIdx) in ptHps" :key="`f-pt-${itemIdx}`">
                  <input
                    type="number"
                    min="0"
                    :max="h"
                    step="any"
                    v-model.number="st.pt_scores[itemIdx]"
                    @input="onScoreInput(st)"
                    class="score-input"
                    :class="{ 'input-exceeded': Number(st.pt_scores[itemIdx]) > h }"
                    :title="`Score: ${st.pt_scores[itemIdx] || 0} / ${h}`"
                  />
                </td>
                <td class="stat-cell font-bold">{{ st.pt_total }}</td>
                <td class="stat-cell">{{ st.pt_ps.toFixed(2) }}%</td>
                <td class="stat-cell font-bold text-amber">{{ st.pt_ws.toFixed(2) }}</td>

                <!-- QA Raw Scores -->
                <td v-for="(h, itemIdx) in qaHps" :key="`f-qa-${itemIdx}`">
                  <input
                    type="number"
                    min="0"
                    :max="h"
                    step="any"
                    v-model.number="st.qa_scores[itemIdx]"
                    @input="onScoreInput(st)"
                    class="score-input"
                    :class="{ 'input-exceeded': Number(st.qa_scores[itemIdx]) > h }"
                    :title="`Score: ${st.qa_scores[itemIdx] || 0} / ${h}`"
                  />
                </td>
                <td class="stat-cell font-bold">{{ st.qa_total }}</td>
                <td class="stat-cell">{{ st.qa_ps.toFixed(2) }}%</td>
                <td class="stat-cell font-bold text-emerald">{{ st.qa_ws.toFixed(2) }}</td>

                <!-- Initial Grade -->
                <td class="stat-cell font-bold font-mono">{{ st.initial_grade.toFixed(2) }}</td>

                <!-- Transmuted Grade -->
                <td class="stat-cell">
                  <span class="grade-pill" :class="st.transmuted_grade >= 75 ? 'grade-passed' : 'grade-failed'">
                    {{ st.transmuted_grade }}
                  </span>
                </td>

                <!-- Remarks -->
                <td class="stat-cell">
                  <span class="status-badge" :class="st.transmuted_grade >= 75 ? 'badge-passed' : 'badge-failed'">
                    {{ st.remarks }}
                  </span>
                </td>

                <!-- Action: Open Card -->
                <td class="text-center no-print">
                  <button type="button" @click="goToForm138(st.id)" class="btn-xs btn-outline" title="Open DepEd Form 138 (SF9)">
                    SF9
                  </button>
                </td>
              </tr>

              <tr v-if="femaleStudents.length === 0">
                <td :colspan="totalTableCols" class="empty-group-cell">
                  No female learners enrolled in this section.
                </td>
              </tr>

              <!-- Female Subtotal Summary Row -->
              <tr v-else class="subtotal-row female-subtotal-row">
                <td colspan="4" class="sticky-col subtotal-label-cell">
                  <strong>FEMALE SUB-AVERAGE</strong>
                </td>
                <td :colspan="wwHps.length + 3 + ptHps.length + 3 + qaHps.length + 3" class="subtotal-dash-cell">
                  <span>{{ femaleStudents.length }} Learners</span>
                </td>
                <td class="stat-cell font-bold">{{ femaleInitialAverage }}</td>
                <td class="stat-cell font-bold">
                  <span class="grade-pill" :class="femaleAverageGrade >= 75 ? 'grade-passed' : 'grade-failed'">
                    {{ femaleAverageGrade }}
                  </span>
                </td>
                <td class="stat-cell font-bold">
                  <span class="status-badge badge-info">{{ femalePassingRate }}% Pass</span>
                </td>
                <td class="no-print"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Performance KPI & Quick Summary Banner -->
      <div class="card summary-strip-card no-print">
        <div class="summary-kpis-wrap">
          <div class="summary-kpi">
            <span class="kpi-label">Total Learners</span>
            <strong class="kpi-val">{{ students.length }}</strong>
            <small class="kpi-sub">{{ maleStudents.length }} Male &bull; {{ femaleStudents.length }} Female</small>
          </div>

          <div class="summary-kpi">
            <span class="kpi-label">Class Average</span>
            <strong class="kpi-val text-primary">{{ classAverageGrade }}</strong>
            <small class="kpi-sub">Quarter Transmuted Rating</small>
          </div>

          <div class="summary-kpi">
            <span class="kpi-label">Passing Rate</span>
            <strong class="kpi-val text-success">{{ passingRate }}%</strong>
            <small class="kpi-sub">{{ passedLearnersCount }} Passed &bull; {{ failedLearnersCount }} Failed</small>
          </div>

          <div class="summary-kpi">
            <span class="kpi-label">Highest &bull; Lowest</span>
            <strong class="kpi-val">{{ highestGrade }} <span class="kpi-sep">/</span> {{ lowestGrade }}</strong>
            <small class="kpi-sub">Range across section</small>
          </div>
        </div>

        <div class="summary-actions">
          <button type="button" class="btn-secondary" @click="printClassRecord" title="Print DepEd Official Class Record">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print</span>
          </button>
          <button type="button" class="btn-secondary" @click="exportCsv" :disabled="exportingCsv">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            class="btn-primary"
            @click="saveClassRecord"
            :disabled="savingRecord || totalWeight !== 100 || isLicenseLocked"
            :title="isLicenseLocked ? 'Workspace is locked' : (totalWeight !== 100 ? 'Weights must equal 100%' : 'Save and synchronize grades with Form 138')"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>{{ savingRecord ? 'Saving…' : 'Save E-Class Record' }}</span>
          </button>
        </div>
      </div>

      <!-- Printable Signature Block (Only visible on Print) -->
      <div class="print-signatures-block">
        <div class="print-signature-box">
          <div class="print-sig-line"></div>
          <strong class="print-sig-name">{{ auth.user?.name || 'Class Subject Teacher' }}</strong>
          <span class="print-sig-role">Subject Teacher</span>
        </div>
        <div class="print-signature-box">
          <div class="print-sig-line"></div>
          <strong class="print-sig-name">{{ currentSchool?.principal_name || 'School Principal / Head' }}</strong>
          <span class="print-sig-role">School Principal / Academic Head</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loadingRecord" class="card empty-state-card no-print">
      <div class="empty-icon-wrap">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      </div>
      <h3>No Class Record Loaded</h3>
      <p>Select a Grade Level, Section, and Subject above, then click <strong>Load E-Class Record</strong> to start encoding raw scores with live DepEd Order No. 8 transmutation and Form 138 synchronization.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useGradeLevels } from '../composables/useGradeLevels'
import { useToast } from '../composables/useToast'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { addToast } = useToast()
const { grades, sectionsByGrade, loadGradeLevels } = useGradeLevels()

const schools = ref([])
const selectedSchoolId = ref(auth.schoolId || '')
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || ''))
const quarterTerms = ref([])
const configuredQuarterCount = ref(4)
const showFormulaGuide = ref(false)
const isModified = ref(false)

const licenseStatus = ref('active')
const isLicenseLocked = ref(false)

const currentSchool = computed(() => {
  if (schools.value.length) {
    const s = schools.value.find(x => x.id === effectiveSchoolId.value)
    if (s) return s
  }
  return auth.school || auth.user?.school || null
})

const activeQuarterCount = computed(() => {
  if (configuredQuarterCount.value) return configuredQuarterCount.value
  if (currentSchool.value?.quarter_count) {
    return Number(currentSchool.value.quarter_count) === 3 ? 3 : 4
  }
  return 4
})

const availableQuarterOptions = computed(() => {
  const count = activeQuarterCount.value
  const isTrimester = count === 3

  if (quarterTerms.value.length > 0) {
    const filtered = quarterTerms.value.filter(q => q.quarter_number <= count && (q.is_active === undefined || q.is_active === 1))
    if (filtered.length > 0) {
      return filtered.map(q => ({
        value: `Q${q.quarter_number}`,
        label: q.quarter_name ? `${q.quarter_name} (Q${q.quarter_number})` : (isTrimester ? `${q.quarter_number} Trimester` : `${q.quarter_number} Quarter`)
      }))
    }
  }

  const opts = [
    { value: 'Q1', label: isTrimester ? '1st Trimester (Q1)' : '1st Quarter (Q1)' },
    { value: 'Q2', label: isTrimester ? '2nd Trimester (Q2)' : '2nd Quarter (Q2)' },
    { value: 'Q3', label: isTrimester ? '3rd Trimester (Q3)' : '3rd Quarter (Q3)' }
  ]
  if (count === 4) {
    opts.push({ value: 'Q4', label: '4th Quarter (Q4)' })
  }
  return opts
})

// Filter
const filter = reactive({
  grade: auth.isTeacher && auth.user?.grade ? auth.user.grade : '',
  section: auth.isTeacher && auth.user?.section ? auth.user.section : '',
  subjectId: '',
  quarter: 'Q1',
  schoolYear: '2026-2027'
})

const availableSections = computed(() => sectionsByGrade.value[filter.grade] || [])
const subjectList = ref([])

// Active loaded record state
const activeSubject = ref(null)
const students = ref([])
const loadingRecord = ref(false)
const savingRecord = ref(false)
const exportingCsv = ref(false)

// Component weights (Teacher editable)
const weights = reactive({
  ww: 30,
  pt: 50,
  qa: 20
})

const totalWeight = computed(() => {
  return (Number(weights.ww) || 0) + (Number(weights.pt) || 0) + (Number(weights.qa) || 0)
})

// HPS arrays
const wwHps = ref([20, 20, 25, 20, 15])
const ptHps = ref([25, 25, 25, 25])
const qaHps = ref([50])

const wwHpsTotal = computed(() => wwHps.value.reduce((a, b) => a + (Math.max(1, Number(b)) || 1), 0))
const ptHpsTotal = computed(() => ptHps.value.reduce((a, b) => a + (Math.max(1, Number(b)) || 1), 0))
const qaHpsTotal = computed(() => qaHps.value.reduce((a, b) => a + (Math.max(1, Number(b)) || 1), 0))

const totalTableCols = computed(() => {
  return 4 + wwHps.value.length + 3 + ptHps.value.length + 3 + qaHps.value.length + 3 + 4
})

// DepEd Transmutation Table (0 - 100 -> 60 - 100)
function transmuteGrade(initial) {
  const val = Number(initial) || 0
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

function recalculateStudent(st) {
  // Ensure array lengths
  while (st.ww_scores.length < wwHps.value.length) st.ww_scores.push(0)
  while (st.pt_scores.length < ptHps.value.length) st.pt_scores.push(0)
  while (st.qa_scores.length < qaHps.value.length) st.qa_scores.push(0)

  // Written Works
  let wwSum = 0
  st.ww_scores.forEach((s, idx) => {
    const max = wwHps.value[idx] || 1
    const num = (s === '' || s === null || isNaN(s)) ? 0 : Number(s)
    const clamped = Math.max(0, Math.min(max, num))
    wwSum += clamped
  })
  st.ww_total = Math.round(wwSum * 100) / 100
  const wwHpsTot = wwHpsTotal.value || 1
  st.ww_ps = Math.round((st.ww_total / wwHpsTot) * 10000) / 100
  st.ww_ws = Math.round((st.ww_ps * (Number(weights.ww) || 0) / 100) * 100) / 100

  // Performance Tasks
  let ptSum = 0
  st.pt_scores.forEach((s, idx) => {
    const max = ptHps.value[idx] || 1
    const num = (s === '' || s === null || isNaN(s)) ? 0 : Number(s)
    const clamped = Math.max(0, Math.min(max, num))
    ptSum += clamped
  })
  st.pt_total = Math.round(ptSum * 100) / 100
  const ptHpsTot = ptHpsTotal.value || 1
  st.pt_ps = Math.round((st.pt_total / ptHpsTot) * 10000) / 100
  st.pt_ws = Math.round((st.pt_ps * (Number(weights.pt) || 0) / 100) * 100) / 100

  // Quarterly Assessment
  let qaSum = 0
  st.qa_scores.forEach((s, idx) => {
    const max = qaHps.value[idx] || 1
    const num = (s === '' || s === null || isNaN(s)) ? 0 : Number(s)
    const clamped = Math.max(0, Math.min(max, num))
    qaSum += clamped
  })
  st.qa_total = Math.round(qaSum * 100) / 100
  const qaHpsTot = qaHpsTotal.value || 1
  st.qa_ps = Math.round((st.qa_total / qaHpsTot) * 10000) / 100
  st.qa_ws = Math.round((st.qa_ps * (Number(weights.qa) || 0) / 100) * 100) / 100

  // Initial and Transmuted Grade
  st.initial_grade = Math.round((st.ww_ws + st.pt_ws + st.qa_ws) * 100) / 100
  st.transmuted_grade = transmuteGrade(st.initial_grade)
  st.remarks = st.transmuted_grade >= 75 ? 'Passed' : 'Failed'
}

function recalculateAll() {
  students.value.forEach(recalculateStudent)
}

function onScoreInput(st) {
  isModified.value = true
  recalculateStudent(st)
}

function onWeightInput() {
  isModified.value = true
  recalculateAll()
}

function onHpsChange() {
  isModified.value = true
  recalculateAll()
}

function applyPreset(ww, pt, qa) {
  weights.ww = ww
  weights.pt = pt
  weights.qa = qa
  isModified.value = true
  recalculateAll()
}

// Add/Remove item columns (no artificial limits - teachers can add as many as needed)
function addWwItem(defaultHps = 20) {
  wwHps.value.push(Number(defaultHps) || 20)
  students.value.forEach(s => {
    if (!Array.isArray(s.ww_scores)) s.ww_scores = []
    s.ww_scores.push(0)
  })
  isModified.value = true
  recalculateAll()
}

function addMultipleWwItems(count = 5, defaultHps = 20) {
  for (let i = 0; i < count; i++) {
    wwHps.value.push(Number(defaultHps) || 20)
    students.value.forEach(s => {
      if (!Array.isArray(s.ww_scores)) s.ww_scores = []
      s.ww_scores.push(0)
    })
  }
  isModified.value = true
  recalculateAll()
  addToast(`Added ${count} Written Work items (total: ${wwHps.value.length})`, 'info')
}

function removeWwItem() {
  if (wwHps.value.length > 1) {
    wwHps.value.pop()
    students.value.forEach(s => {
      if (Array.isArray(s.ww_scores)) s.ww_scores.pop()
    })
    isModified.value = true
    recalculateAll()
  }
}

function removeWwItemAt(index) {
  if (wwHps.value.length <= 1) return
  if (!confirm(`Remove Written Work item WW${index + 1}? Recorded scores for this column will be discarded.`)) return
  wwHps.value.splice(index, 1)
  students.value.forEach(s => {
    if (Array.isArray(s.ww_scores) && s.ww_scores.length > index) {
      s.ww_scores.splice(index, 1)
    }
  })
  isModified.value = true
  recalculateAll()
}

function addPtItem(defaultHps = 25) {
  ptHps.value.push(Number(defaultHps) || 25)
  students.value.forEach(s => {
    if (!Array.isArray(s.pt_scores)) s.pt_scores = []
    s.pt_scores.push(0)
  })
  isModified.value = true
  recalculateAll()
}

function addMultiplePtItems(count = 5, defaultHps = 25) {
  for (let i = 0; i < count; i++) {
    ptHps.value.push(Number(defaultHps) || 25)
    students.value.forEach(s => {
      if (!Array.isArray(s.pt_scores)) s.pt_scores = []
      s.pt_scores.push(0)
    })
  }
  isModified.value = true
  recalculateAll()
  addToast(`Added ${count} Performance Task items (total: ${ptHps.value.length})`, 'info')
}

function removePtItem() {
  if (ptHps.value.length > 1) {
    ptHps.value.pop()
    students.value.forEach(s => {
      if (Array.isArray(s.pt_scores)) s.pt_scores.pop()
    })
    isModified.value = true
    recalculateAll()
  }
}

function removePtItemAt(index) {
  if (ptHps.value.length <= 1) return
  if (!confirm(`Remove Performance Task item PT${index + 1}? Recorded scores for this column will be discarded.`)) return
  ptHps.value.splice(index, 1)
  students.value.forEach(s => {
    if (Array.isArray(s.pt_scores) && s.pt_scores.length > index) {
      s.pt_scores.splice(index, 1)
    }
  })
  isModified.value = true
  recalculateAll()
}

function addQaItem(defaultHps = 50) {
  qaHps.value.push(Number(defaultHps) || 50)
  students.value.forEach(s => {
    if (!Array.isArray(s.qa_scores)) s.qa_scores = []
    s.qa_scores.push(0)
  })
  isModified.value = true
  recalculateAll()
}

function removeQaItem() {
  if (qaHps.value.length > 1) {
    qaHps.value.pop()
    students.value.forEach(s => {
      if (Array.isArray(s.qa_scores)) s.qa_scores.pop()
    })
    isModified.value = true
    recalculateAll()
  }
}

function removeQaItemAt(index) {
  if (qaHps.value.length <= 1) return
  if (!confirm(`Remove Quarterly Exam item QA${index + 1}? Recorded scores for this column will be discarded.`)) return
  qaHps.value.splice(index, 1)
  students.value.forEach(s => {
    if (Array.isArray(s.qa_scores) && s.qa_scores.length > index) {
      s.qa_scores.splice(index, 1)
    }
  })
  isModified.value = true
  recalculateAll()
}

function promptSetAllHps(type) {
  const label = type === 'ww' ? 'Written Works' : 'Performance Tasks'
  const currentDefault = type === 'ww' ? (wwHps.value[0] || 20) : (ptHps.value[0] || 25)
  const input = prompt(`Enter highest possible score (HPS) for all ${label} items:`, String(currentDefault))
  if (input === null) return
  const val = Math.max(1, parseInt(input, 10) || currentDefault)
  if (type === 'ww') {
    wwHps.value = wwHps.value.map(() => val)
  } else {
    ptHps.value = ptHps.value.map(() => val)
  }
  isModified.value = true
  recalculateAll()
  addToast(`Updated all ${label} items to HPS = ${val}`, 'success')
}

// Quick fill helper for an entire column
function quickFillPrompt(type, index) {
  const label = type === 'ww' ? `WW${index + 1}` : (type === 'pt' ? `PT${index + 1}` : `QA${index + 1}`)
  const maxHps = type === 'ww' ? (wwHps.value[index] || 20) : (type === 'pt' ? (ptHps.value[index] || 25) : (qaHps.value[index] || 50))
  const input = prompt(`Quick fill all students for ${label} (Max: ${maxHps}):\nEnter score (or click Cancel):`, String(maxHps))
  if (input === null) return
  const val = Math.max(0, Math.min(maxHps, Number(input) || 0))

  students.value.forEach(st => {
    if (type === 'ww') st.ww_scores[index] = val
    else if (type === 'pt') st.pt_scores[index] = val
    else if (type === 'qa') st.qa_scores[index] = val
  })
  isModified.value = true
  recalculateAll()
  addToast(`Filled all learners with score ${val} for ${label}`, 'success')
}

// Group students by gender
const maleStudents = computed(() => students.value.filter(s => String(s.gender).toUpperCase() === 'MALE'))
const femaleStudents = computed(() => students.value.filter(s => String(s.gender).toUpperCase() !== 'MALE'))

// Summary KPIs
const classAverageGrade = computed(() => {
  if (!students.value.length) return 0
  const sum = students.value.reduce((acc, curr) => acc + (Number(curr.transmuted_grade) || 0), 0)
  return Math.round((sum / students.value.length) * 10) / 10
})

const passedLearnersCount = computed(() => students.value.filter(s => s.transmuted_grade >= 75).length)
const failedLearnersCount = computed(() => students.value.filter(s => s.transmuted_grade < 75 && s.transmuted_grade > 0).length)

const passingRate = computed(() => {
  if (!students.value.length) return 0
  return Math.round((passedLearnersCount.value / students.value.length) * 1000) / 10
})

const highestGrade = computed(() => {
  if (!students.value.length) return 0
  return Math.max(...students.value.map(s => Number(s.transmuted_grade) || 0))
})

const lowestGrade = computed(() => {
  if (!students.value.length) return 0
  const valid = students.value.map(s => Number(s.transmuted_grade) || 0).filter(g => g > 0)
  return valid.length ? Math.min(...valid) : 0
})

// Gender-specific subtotals
const maleAverageGrade = computed(() => {
  if (!maleStudents.value.length) return 0
  const sum = maleStudents.value.reduce((acc, curr) => acc + (Number(curr.transmuted_grade) || 0), 0)
  return Math.round((sum / maleStudents.value.length) * 10) / 10
})
const maleInitialAverage = computed(() => {
  if (!maleStudents.value.length) return 0
  const sum = maleStudents.value.reduce((acc, curr) => acc + (Number(curr.initial_grade) || 0), 0)
  return (sum / maleStudents.value.length).toFixed(2)
})
const malePassedCount = computed(() => maleStudents.value.filter(s => s.transmuted_grade >= 75).length)
const malePassingRate = computed(() => {
  if (!maleStudents.value.length) return 0
  return Math.round((malePassedCount.value / maleStudents.value.length) * 1000) / 10
})

const femaleAverageGrade = computed(() => {
  if (!femaleStudents.value.length) return 0
  const sum = femaleStudents.value.reduce((acc, curr) => acc + (Number(curr.transmuted_grade) || 0), 0)
  return Math.round((sum / femaleStudents.value.length) * 10) / 10
})
const femaleInitialAverage = computed(() => {
  if (!femaleStudents.value.length) return 0
  const sum = femaleStudents.value.reduce((acc, curr) => acc + (Number(curr.initial_grade) || 0), 0)
  return (sum / femaleStudents.value.length).toFixed(2)
})
const femalePassedCount = computed(() => femaleStudents.value.filter(s => s.transmuted_grade >= 75).length)
const femalePassingRate = computed(() => {
  if (!femaleStudents.value.length) return 0
  return Math.round((femalePassedCount.value / femaleStudents.value.length) * 1000) / 10
})

// Loading & saving methods
async function loadSchools() {
  if (!auth.isSuperadmin) return
  try {
    const data = await auth.api('/schools')
    if (data.schools) {
      schools.value = data.schools.filter(s => !s.archived_at)
      if (!selectedSchoolId.value && schools.value.length) {
        selectedSchoolId.value = schools.value[0].id
      }
    }
  } catch (err) {
    console.error('Error fetching schools:', err)
  }
}

async function checkLicense() {
  const sid = effectiveSchoolId.value
  if (!sid) return
  try {
    const res = await fetch(`/api/schools/${sid}/license`, {
      headers: auth.actorHeaders()
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.license) {
        licenseStatus.value = data.license.status || 'active'
        isLicenseLocked.value = data.license.status === 'suspended' || data.license.status === 'cancelled' || Boolean(data.license.is_expired)
      }
    }
  } catch {}
}

async function loadQuarterlyTerms() {
  try {
    const params = new URLSearchParams()
    if (effectiveSchoolId.value) params.set('schoolId', effectiveSchoolId.value)
    if (filter.schoolYear) params.set('schoolYear', filter.schoolYear)
    const res = await auth.api(`/quarterly/terms?${params.toString()}`)
    if (res?.quarters) {
      quarterTerms.value = res.quarters
    }
    if (res?.quarter_count) {
      configuredQuarterCount.value = Number(res.quarter_count) === 3 ? 3 : 4
    }
  } catch (err) {
    console.warn('Failed to load quarterly terms:', err)
  }
}

async function onSchoolChange() {
  await checkLicense()
  await loadGradeLevels(effectiveSchoolId.value || undefined)
  await loadQuarterlyTerms()
  await loadSubjects()
  students.value = []
  activeSubject.value = null
  isModified.value = false
}

async function loadSubjects() {
  try {
    let url = `/grading/subjects?schoolId=${encodeURIComponent(effectiveSchoolId.value)}`
    if (filter.grade) url += `&gradeLevel=${encodeURIComponent(filter.grade)}`
    const data = await auth.api(url)
    if (data.subjects) {
      subjectList.value = data.subjects
      if (data.subjects.length && (!filter.subjectId || !data.subjects.some(s => s.id === filter.subjectId))) {
        filter.subjectId = data.subjects[0].id
      }
    }
  } catch (err) {
    console.error('Error loading subjects:', err)
  }
}

async function onGradeChange() {
  if (availableSections.value.length) {
    filter.section = availableSections.value[0]
  } else {
    filter.section = ''
  }
  await loadSubjects()
  if (filter.grade && filter.section && filter.subjectId && !isModified.value) {
    await loadClassRecord()
  }
}

async function onSectionChange() {
  if (filter.grade && filter.section && filter.subjectId && !isModified.value) {
    await loadClassRecord()
  }
}

async function onSubjectChange() {
  if (filter.grade && filter.section && filter.subjectId && !isModified.value) {
    await loadClassRecord()
  }
}

async function onQuarterChange() {
  if (filter.grade && filter.section && filter.subjectId && !isModified.value) {
    await loadClassRecord()
  }
}

async function onSchoolYearChange() {
  if (filter.grade && filter.section && filter.subjectId && !isModified.value) {
    await loadClassRecord()
  }
}

async function loadClassRecord() {
  if (!filter.grade || !filter.section || !filter.subjectId) {
    addToast('Please select a Grade, Section, and Subject', 'warning')
    return
  }

  loadingRecord.value = true
  try {
    const queryParams = new URLSearchParams({
      schoolId: effectiveSchoolId.value,
      gradeLevel: filter.grade,
      section: filter.section,
      subjectId: filter.subjectId,
      quarter: filter.quarter,
      schoolYear: filter.schoolYear
    })

    const data = await auth.api(`/grading/class-record?${queryParams.toString()}`)

    if (!data.success) {
      throw new Error(data.error || 'Failed to load class record')
    }

    activeSubject.value = data.subject
    if (data.quarterCount) {
      configuredQuarterCount.value = Number(data.quarterCount) === 3 ? 3 : 4
    }

    if (data.config) {
      weights.ww = Number(data.config.weight_ww) || 30
      weights.pt = Number(data.config.weight_pt) || 50
      weights.qa = Number(data.config.weight_qa) || 20
      if (Array.isArray(data.config.ww_hps) && data.config.ww_hps.length) wwHps.value = [...data.config.ww_hps]
      if (Array.isArray(data.config.pt_hps) && data.config.pt_hps.length) ptHps.value = [...data.config.pt_hps]
      if (Array.isArray(data.config.qa_hps) && data.config.qa_hps.length) qaHps.value = [...data.config.qa_hps]
    }

    students.value = (data.students || []).map(st => {
      const ww = Array.isArray(st.ww_scores) ? [...st.ww_scores] : []
      while (ww.length < wwHps.value.length) ww.push(0)
      const pt = Array.isArray(st.pt_scores) ? [...st.pt_scores] : []
      while (pt.length < ptHps.value.length) pt.push(0)
      const qa = Array.isArray(st.qa_scores) ? [...st.qa_scores] : []
      while (qa.length < qaHps.value.length) qa.push(0)
      return {
        ...st,
        ww_scores: ww,
        pt_scores: pt,
        qa_scores: qa,
        initial_grade: Number(st.initial_grade) || 0,
        transmuted_grade: Number(st.transmuted_grade) || 0,
        remarks: st.remarks || ''
      }
    })

    recalculateAll()
    isModified.value = false
    addToast(`Loaded ${students.value.length} learners for ${data.subject.subject_name}`, 'success')
  } catch (err) {
    console.error('Error loading class record:', err)
    addToast(err.message || 'Failed to load class record', 'error')
  } finally {
    loadingRecord.value = false
  }
}

async function saveClassRecord() {
  if (isLicenseLocked.value) {
    addToast('Cannot save: Campus subscription license is restricted.', 'error')
    return
  }

  if (totalWeight.value !== 100) {
    addToast(`Assessment weights must total exactly 100% (currently ${totalWeight.value}%)`, 'warning')
    return
  }

  savingRecord.value = true
  try {
    const payload = {
      schoolId: effectiveSchoolId.value,
      gradeLevel: filter.grade,
      section: filter.section,
      subjectId: filter.subjectId,
      quarter: filter.quarter,
      schoolYear: filter.schoolYear,
      weightWw: weights.ww,
      weightPt: weights.pt,
      weightQa: weights.qa,
      wwHps: wwHps.value,
      ptHps: ptHps.value,
      qaHps: qaHps.value,
      learners: students.value.map(st => ({
        studentId: st.id,
        wwScores: st.ww_scores.map((s, idx) => Math.min(wwHps.value[idx] || 0, Math.max(0, Number(s) || 0))),
        ptScores: st.pt_scores.map((s, idx) => Math.min(ptHps.value[idx] || 0, Math.max(0, Number(s) || 0))),
        qaScores: st.qa_scores.map((s, idx) => Math.min(qaHps.value[idx] || 0, Math.max(0, Number(s) || 0))),
        isLocked: st.is_locked
      }))
    }

    const data = await auth.api('/grading/class-record/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    if (!data.success) {
      throw new Error(data.error || 'Failed to save class record')
    }

    isModified.value = false
    addToast(data.message || 'E-Class Record saved & synchronized with Form 138 (SF9)', 'success')
  } catch (err) {
    console.error('Error saving class record:', err)
    addToast(err.message || 'Failed to save class record', 'error')
  } finally {
    savingRecord.value = false
  }
}

function exportCsv() {
  const queryParams = new URLSearchParams({
    schoolId: effectiveSchoolId.value,
    gradeLevel: filter.grade,
    section: filter.section,
    subjectId: filter.subjectId,
    quarter: filter.quarter,
    schoolYear: filter.schoolYear
  })
  window.open(`/api/grading/class-record/export?${queryParams.toString()}`, '_blank')
}

function printClassRecord() {
  window.print()
}

function goToForm138(studentId) {
  router.push({
    path: '/grading',
    query: { tab: 'form138', studentId, schoolYear: filter.schoolYear, grade: filter.grade, section: filter.section }
  })
}

onMounted(async () => {
  await loadSchools()
  await checkLicense()
  await loadGradeLevels(effectiveSchoolId.value || undefined)
  if (currentSchool.value?.school_year) {
    filter.schoolYear = currentSchool.value.school_year
  }
  await loadQuarterlyTerms()

  // Apply route query params if provided (supports grade or gradeLevel)
  const incomingGrade = route.query?.grade || route.query?.gradeLevel
  if (route.query?.schoolYear) filter.schoolYear = String(route.query.schoolYear)
  if (route.query?.quarter) filter.quarter = String(route.query.quarter)
  if (incomingGrade) filter.grade = String(incomingGrade)
  else if (grades.value.length && !filter.grade) filter.grade = grades.value[0]

  if (route.query?.section) filter.section = String(route.query.section)
  else if (filter.grade && availableSections.value.length) filter.section = availableSections.value[0]

  await loadSubjects()
  if (route.query?.subjectId) filter.subjectId = String(route.query.subjectId)

  // Clamp quarter if 3 quarters
  if (activeQuarterCount.value === 3 && filter.quarter === 'Q4') {
    filter.quarter = 'Q3'
  }

  if (filter.grade && filter.section && filter.subjectId) {
    await loadClassRecord()
  }
})
</script>

<style scoped>
.class-record-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  margin-bottom: 2px;
}
.breadcrumb a {
  color: var(--muted-foreground);
  text-decoration: none;
  transition: color 0.15s ease;
}
.breadcrumb a:hover {
  color: var(--primary);
}
.breadcrumb .sep {
  opacity: 0.5;
}
.breadcrumb .current {
  color: var(--foreground);
  font-weight: 600;
}

.class-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header-text {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dashboard-header-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--primary-bg);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-header-text h1 {
  margin: 0 0 4px;
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.01em;
}

.page-header-text p {
  margin: 0;
  font-size: 0.82rem;
  color: var(--muted-foreground);
  max-width: 780px;
  line-height: 1.45;
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.campus-identity-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  background: var(--card);
  border: 1px solid var(--border);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--foreground);
}

.campus-name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.campus-badge {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--muted);
  color: var(--muted-foreground);
}

.badge-trimester {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning, #d97706);
}

.school-select-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.school-select-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.school-select {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--foreground);
}

.link-to-sf9 {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 7px 14px;
  text-decoration: none;
}

/* License Locked Card */
.license-locked-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: var(--destructive, #ef4444);
}
.license-locked-card .lock-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.license-locked-card .lock-copy h3 {
  margin: 0 0 2px;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--destructive);
}
.license-locked-card .lock-copy p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

/* Toolbar Card */
.toolbar-card {
  padding: 16px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.toolbar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  align-items: flex-end;
}

.toolbar-actions {
  display: flex;
  justify-content: flex-end;
}

.load-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Weights Panel Card */
.weights-panel-card {
  padding: 18px 22px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.weights-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.weights-header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.weights-panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--foreground);
}

.deped-order-badge {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--primary-bg);
  color: var(--primary);
  border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
}

.sub-text {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted-foreground);
}

.weights-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.weights-total-badge {
  font-size: 0.78rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
}

.total-valid {
  background: var(--success-bg, rgba(16, 185, 129, 0.1));
  color: var(--success, #10b981);
  border-color: color-mix(in srgb, var(--success) 35%, var(--border));
}

.total-invalid {
  background: var(--red-bg, rgba(239, 68, 68, 0.1));
  color: var(--destructive, #ef4444);
  border-color: color-mix(in srgb, var(--destructive) 35%, var(--border));
}

.unsaved-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.12);
  color: var(--warning, #d97706);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.dot-unsaved {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  display: inline-block;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.saved-badge {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.weights-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.weight-inputs-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.weight-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weight-field label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 0;
}

.weight-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.weight-input {
  width: 58px;
  height: 32px;
  padding: 2px 6px;
  text-align: center;
  font-weight: 800;
  border: 1px solid var(--input);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--foreground);
}

.weight-input:focus {
  border-color: var(--primary);
  outline: none;
}

.unit {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-ww { background: var(--info, #0284c7); }
.dot-pt { background: var(--warning, #f59e0b); }
.dot-qa { background: var(--success, #10b981); }

.presets-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.presets-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.preset-btn {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--muted);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-btn:hover {
  background: var(--secondary);
  border-color: var(--primary);
}

.preset-btn.active {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

/* Formula Guide Card */
.deped-formula-card {
  padding: 14px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.formula-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.formula-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary);
}

.formula-header-title h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--foreground);
}

.formula-card-body {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  font-size: 0.8rem;
}

.formula-box {
  padding: 12px 14px;
  background: var(--secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.formula-box-title {
  color: var(--primary);
  display: block;
  margin-bottom: 4px;
}

.formula-box code {
  font-size: 0.76rem;
  background: var(--card);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  color: var(--foreground);
  border: 1px solid var(--border);
}

.formula-box p {
  margin: 6px 0 0;
  color: var(--muted-foreground);
  font-size: 0.74rem;
}

/* Items Setup Card */
.items-setup-card {
  padding: 12px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.items-setup-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.items-group-ctrl {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ctrl-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--foreground);
}

.ctrl-count {
  font-size: 0.74rem;
  color: var(--muted-foreground);
  background: var(--muted);
  padding: 2px 6px;
  border-radius: 4px;
}

.items-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
}

.items-right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* E-Class Record Table Card */
.eclass-table-card {
  padding: 0;
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.eclass-table-container {
  overflow: auto;
  max-height: calc(100vh - 270px);
  min-height: 420px;
  position: relative;
}

.eclass-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.78rem;
}

.eclass-table th,
.eclass-table td {
  padding: 8px 10px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  text-align: center;
  background: var(--card);
  color: var(--foreground);
}

/* Sticky Rows */
.header-group-row th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--card);
}
.header-group-row th.sticky-col {
  z-index: 25;
}

.header-sub-row th {
  position: sticky;
  top: 35px;
  z-index: 10;
  background: var(--muted);
}
.header-sub-row th.sticky-col {
  z-index: 25;
}

.hps-row th,
.hps-row td {
  position: sticky;
  top: 67px;
  z-index: 10;
  background: var(--secondary) !important;
  border-bottom: 2px solid var(--border);
}
.hps-row th.sticky-col {
  z-index: 25;
  background: var(--secondary) !important;
}

/* Sticky Columns */
.sticky-col {
  position: sticky;
  background: var(--card);
  z-index: 5;
}

.col-idx {
  width: 44px;
  min-width: 44px;
  max-width: 44px;
  left: 0;
}

.col-name {
  width: 220px;
  min-width: 220px;
  max-width: 260px;
  left: 44px;
  text-align: left !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-lrn {
  width: 125px;
  min-width: 125px;
  max-width: 125px;
  left: 264px;
  box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.12);
}

.hps-label-cell {
  left: 0;
  width: 389px;
  min-width: 389px;
  text-align: left !important;
  padding-left: 14px !important;
  font-weight: 800;
  box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.12);
}

.col-sex {
  width: 42px;
  min-width: 42px;
}

.group-header {
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.group-header-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2px 6px;
}

.btn-group-add {
  background: var(--card);
  border: 1px solid currentColor;
  color: inherit;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.btn-group-add:hover {
  background: currentColor;
  color: var(--card);
}

.item-header-cell {
  position: relative;
  padding: 4px 4px !important;
  text-align: center;
}

.sub-col-title-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.item-quick-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.col-quick-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-size: 0.78rem;
  line-height: 1;
  padding: 1px 3px;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
}
.col-quick-btn:hover {
  color: var(--primary);
  background: var(--primary-bg);
}

.col-del-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-size: 0.82rem;
  line-height: 1;
  padding: 1px 3px;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
}
.col-del-btn:hover {
  color: var(--destructive);
  background: var(--red-bg);
}

.group-ww {
  background: rgba(2, 132, 199, 0.08) !important;
  color: var(--info, #0284c7) !important;
}

.group-pt {
  background: rgba(245, 158, 11, 0.08) !important;
  color: var(--warning, #d97706) !important;
}

.group-qa {
  background: rgba(16, 185, 129, 0.08) !important;
  color: var(--success, #10b981) !important;
}

.sub-col {
  font-size: 0.68rem;
  font-weight: 700;
  background: var(--muted);
  color: var(--muted-foreground);
  white-space: nowrap;
}

.col-sum, .col-ps, .col-ws {
  font-weight: 800;
  background: var(--secondary) !important;
}

.hps-input {
  width: 44px;
  height: 26px;
  padding: 2px;
  text-align: center;
  font-weight: 800;
  border: 1px solid var(--input);
  border-radius: 4px;
  background: var(--card);
  color: var(--foreground);
}

.hps-stat {
  font-size: 0.72rem;
}

.section-divider-row td {
  padding: 6px 14px;
  text-align: left;
  background: var(--secondary) !important;
  border-bottom: 1px solid var(--border);
}

.gender-section-tag {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border-radius: 4px;
}

.tag-male {
  background: rgba(2, 132, 199, 0.15);
  color: var(--info, #0284c7);
}

.tag-female {
  background: rgba(236, 72, 153, 0.15);
  color: #db2777;
}

.sex-pill {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.pill-m {
  background: rgba(2, 132, 199, 0.1);
  color: var(--info, #0284c7);
}

.pill-f {
  background: rgba(236, 72, 153, 0.1);
  color: #db2777;
}

.score-input {
  width: 46px;
  height: 28px;
  padding: 2px 4px;
  text-align: center;
  font-weight: 700;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--card);
  color: var(--foreground);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.score-input:focus {
  border-color: var(--primary);
  outline: none;
}

.input-exceeded {
  border-color: var(--destructive) !important;
  color: var(--destructive);
  background: var(--red-bg) !important;
}

.stat-cell {
  white-space: nowrap;
}

.text-teal { color: var(--info, #0284c7); }
.text-amber { color: var(--warning, #d97706); }
.text-emerald { color: var(--success, #10b981); }

.grade-pill {
  display: inline-block;
  padding: 3px 8px;
  font-size: 0.82rem;
  font-weight: 800;
  border-radius: 6px;
}

.grade-passed {
  background: var(--success-bg, rgba(16, 185, 129, 0.12));
  color: var(--success, #10b981);
}

.grade-failed {
  background: var(--red-bg, rgba(239, 68, 68, 0.12));
  color: var(--destructive, #ef4444);
}

.status-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-passed {
  background: var(--success-bg);
  color: var(--success);
}

.badge-failed {
  background: var(--red-bg);
  color: var(--destructive);
}

.badge-info {
  background: rgba(2, 132, 199, 0.12);
  color: var(--info, #0284c7);
}

.row-failed {
  background: rgba(239, 68, 68, 0.03);
}

.empty-group-cell {
  padding: 16px;
  text-align: center;
  color: var(--muted-foreground);
  font-style: italic;
}

/* Subtotal rows */
.subtotal-row td {
  background: var(--secondary) !important;
  border-bottom: 2px solid var(--border);
  padding: 6px 10px;
}

.subtotal-label-cell {
  left: 0;
  width: 389px;
  min-width: 389px;
  text-align: left !important;
  padding-left: 14px !important;
  font-size: 0.72rem;
  color: var(--foreground);
  box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.12);
}

.subtotal-dash-cell {
  font-size: 0.7rem;
  color: var(--muted-foreground);
  font-style: italic;
}

/* Summary Strip Card */
.summary-strip-card {
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.summary-kpis-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.summary-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--foreground);
}

.kpi-sep {
  font-size: 1.1rem;
  color: var(--muted-foreground);
  font-weight: 400;
}

.kpi-sub {
  font-size: 0.7rem;
  color: var(--muted-foreground);
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Empty State Card */
.empty-state-card {
  padding: 48px 24px;
  text-align: center;
  max-width: 540px;
  margin: 40px auto;
  border-radius: var(--radius-lg);
  background: var(--card);
  border: 1px solid var(--border);
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: var(--primary-bg);
  color: var(--primary);
}

.empty-state-card h3 {
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 800;
}

.empty-state-card p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted-foreground);
  line-height: 1.5;
}

/* Print Only Styling */
.print-header-only,
.print-signatures-block {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .class-record-page {
    padding: 0 !important;
    max-width: none !important;
    background: #fff !important;
    color: #000 !important;
  }

  .print-header-only {
    display: block !important;
    text-align: center;
    margin-bottom: 12px;
  }

  .print-school-name {
    font-size: 14pt;
    font-weight: 800;
    text-transform: uppercase;
  }

  .print-school-sub {
    font-size: 9pt;
    color: #333;
    margin-bottom: 6px;
  }

  .print-title {
    font-size: 11pt;
    font-weight: 800;
    margin: 4px 0 8px;
    letter-spacing: 0.05em;
  }

  .print-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    font-size: 8.5pt;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    padding: 6px 0;
    margin-bottom: 10px;
    text-align: left;
  }

  .eclass-table-card {
    border: none !important;
    box-shadow: none !important;
  }

  .eclass-table-container {
    max-height: none !important;
    overflow: visible !important;
  }

  .eclass-table {
    font-size: 7.5pt !important;
    border: 1px solid #000 !important;
  }

  .eclass-table th,
  .eclass-table td {
    border: 1px solid #000 !important;
    padding: 4px 5px !important;
    background: #fff !important;
    color: #000 !important;
  }

  .score-input, .hps-input {
    border: none !important;
    background: transparent !important;
    font-size: 7.5pt !important;
    width: auto !important;
    padding: 0 !important;
    color: #000 !important;
  }

  .print-signatures-block {
    display: flex !important;
    justify-content: space-around;
    margin-top: 40px;
    page-break-inside: avoid;
  }

  .print-signature-box {
    text-align: center;
    width: 240px;
  }

  .print-sig-line {
    border-bottom: 1px solid #000;
    height: 30px;
    margin-bottom: 6px;
  }

  .print-sig-name {
    display: block;
    font-size: 9pt;
    text-transform: uppercase;
  }

  .print-sig-role {
    display: block;
    font-size: 8pt;
    color: #333;
  }
}
</style>
