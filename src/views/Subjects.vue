<template>
  <div class="management-page subjects-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <div class="breadcrumb">
          <span>Academic Configuration</span>
          <span class="sep">/</span>
          <span class="current">Subjects &amp; Curriculum</span>
        </div>
        <div class="dashboard-header-title-row">
          <div class="dashboard-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 class="page-title">Subjects &amp; Curriculum</h1>
            <p class="page-subtitle">
              Manage official DepEd learning areas, subject codes, grade levels, and assessment weights (DepEd Order No. 8, s. 2015: Written Works, Performance Tasks, Quarterly Assessment).
            </p>
          </div>
        </div>
      </div>

      <div class="page-header-actions">
        <!-- Campus Identity Badge -->
        <div class="campus-identity-pill" v-if="activeSchoolInfo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h1M14 10h1M9 14h1M14 14h1M9 18h1M14 18h1"/>
          </svg>
          <span class="campus-name">{{ activeSchoolInfo.name }}</span>
          <span class="campus-badge" v-if="activeSchoolInfo.school_id">ID: {{ activeSchoolInfo.school_id }}</span>
          <span class="campus-badge" :class="licenseBadgeClass">{{ licenseStatusText }}</span>
        </div>

        <!-- Superadmin Multi-School Switcher -->
        <div v-if="auth.isSuperadmin && schoolsList.length > 1" class="school-picker-wrap">
          <svg class="school-picker-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
          </svg>
          <select 
            v-model="selectedSchoolId" 
            @change="onSchoolChange" 
            class="school-picker-select"
            aria-label="Select School Scope"
          >
            <option v-for="s in schoolsList" :key="s.id" :value="s.id">
              {{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}
            </option>
          </select>
        </div>

        <!-- Action Buttons -->
        <button 
          v-if="auth.isAdmin" 
          @click="openSeedModal" 
          type="button" 
          class="btn-secondary header-action-btn"
          :disabled="isLicenseLocked"
          title="Seed DepEd K-12 standard learning areas"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Seed DepEd Defaults</span>
        </button>

        <button 
          v-if="auth.isAdmin" 
          @click="openAddModal" 
          type="button" 
          class="btn-primary header-action-btn"
          :disabled="isLicenseLocked"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add Subject</span>
        </button>
      </div>
    </div>

    <!-- License Lock Banner -->
    <div v-if="isLicenseLocked" class="license-locked-card">
      <div class="lock-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div class="lock-copy">
        <h3>School Workspace Locked</h3>
        <p>This school's ElyTrack subscription license is currently {{ licenseStatus }}. Curriculum and grading modifications are temporarily restricted. Please contact your administrator or ely.ashzyl@gmail.com to restore access.</p>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon--primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ subjects.length }}</span>
          <span class="stat-label">Total Subjects</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
            <path d="M6 6h10"/>
            <path d="M6 10h10"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ coveredGradesCount }}</span>
          <span class="stat-label">Covered Grade Levels</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ compliantWeightsCount }} / {{ subjects.length }}</span>
          <span class="stat-label">100% DepEd Compliant</span>
        </div>
      </div>

      <div class="stat-card stat-card-link" @click="$router.push('/class-record')">
        <div class="stat-icon stat-icon--warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value link-text">E-Class Record &rarr;</span>
          <span class="stat-label">DepEd Raw Score Grading</span>
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="form-card subjects-filter-card">
      <div class="filter-row">
        <!-- Search Input -->
        <div class="form-group search-group">
          <label>Search Subjects</label>
          <div class="search-input-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              class="form-input search-input" 
              placeholder="Search by subject name or code (e.g. Math, ENG, FIL)..."
            />
            <button 
              v-if="searchQuery" 
              type="button" 
              class="search-clear-btn" 
              @click="searchQuery = ''" 
              aria-label="Clear search"
            >
              &times;
            </button>
          </div>
        </div>

        <!-- Grade Level Filter -->
        <div class="form-group grade-filter-group">
          <label>Filter by Grade Level</label>
          <select v-model="filterGradeLevel" class="form-select">
            <option value="">All Grade Levels</option>
            <option v-for="g in schoolGradeOptions" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>

        <!-- Clear Filters Button -->
        <div class="filter-actions-group" v-if="searchQuery || filterGradeLevel">
          <button @click="clearFilters" type="button" class="btn-secondary btn-sm">
            Clear Filters
          </button>
        </div>

        <div class="filter-count-badge">
          Showing {{ filteredSubjects.length }} of {{ subjects.length }} subjects
        </div>
      </div>
    </div>

    <!-- Subjects Data Table Card -->
    <div class="form-card subjects-table-card">
      <div class="table-card-header">
        <div class="table-card-header-title">
          <h3>Curriculum Learning Areas</h3>
          <span class="subject-counter-chip">{{ filteredSubjects.length }} {{ filteredSubjects.length === 1 ? 'subject' : 'subjects' }}</span>
        </div>
        <div class="table-card-header-hint" v-if="filterGradeLevel">
          Filtered by {{ filterGradeLevel }}
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading subjects and curriculum...</p>
      </div>

      <div v-else-if="!subjects.length" class="empty-state">
        <div class="empty-state-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <h3>No subjects configured yet</h3>
        <p>Populate standard DepEd K-12 learning areas or add custom subjects to enable class records and Form 138 report cards.</p>
        <div class="empty-state-actions" v-if="auth.isAdmin">
          <button @click="openSeedModal" type="button" class="btn-primary" :disabled="isLicenseLocked">
            Seed DepEd Defaults
          </button>
          <button @click="openAddModal" type="button" class="btn-secondary" :disabled="isLicenseLocked">
            + Add First Subject
          </button>
        </div>
      </div>

      <div v-else-if="!filteredSubjects.length" class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h3>No matching subjects found</h3>
        <p>No subjects match your filter "{{ filterGradeLevel || searchQuery }}".</p>
        <button @click="clearFilters" type="button" class="btn-secondary btn-sm">
          Reset Filters
        </button>
      </div>

      <div v-else class="table-container">
        <table class="table subjects-table">
          <thead>
            <tr>
              <th style="min-width: 220px;">Learning Area / Subject</th>
              <th style="width: 100px;">Code</th>
              <th style="width: 130px;">Grade Level</th>
              <th class="text-center" style="width: 105px;">WW (%)</th>
              <th class="text-center" style="width: 105px;">PT (%)</th>
              <th class="text-center" style="width: 105px;">QA (%)</th>
              <th class="text-center" style="width: 140px;">Weight Status</th>
              <th class="text-center" style="width: 70px;">Order</th>
              <th class="text-center" style="width: 180px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredSubjects" :key="s.id" class="subject-row">
              <td class="subject-name-cell">
                <div class="subject-name-wrap">
                  <div class="subject-icon-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                    </svg>
                  </div>
                  <span class="subject-name-text">{{ s.subject_name }}</span>
                </div>
              </td>
              <td>
                <span class="badge badge-code">{{ s.subject_code || '—' }}</span>
              </td>
              <td>
                <span class="badge badge-grade">{{ s.grade_level || 'General' }}</span>
              </td>
              <td class="text-center">
                <span class="weight-chip chip-ww" title="Written Works">{{ s.weight_ww }}%</span>
              </td>
              <td class="text-center">
                <span class="weight-chip chip-pt" title="Performance Tasks">{{ s.weight_pt }}%</span>
              </td>
              <td class="text-center">
                <span class="weight-chip chip-qa" title="Quarterly Assessment">{{ s.weight_qa }}%</span>
              </td>
              <td class="text-center">
                <span 
                  v-if="s.weight_ww + s.weight_pt + s.weight_qa === 100" 
                  class="badge badge-success"
                  title="Total equals 100% (DepEd Order No. 8, s. 2015 compliant)"
                >
                  ✓ 100% Valid
                </span>
                <span 
                  v-else 
                  class="badge badge-danger"
                  :title="`Total is ${s.weight_ww + s.weight_pt + s.weight_qa}% (Must equal 100%)`"
                >
                  ⚠ {{ s.weight_ww + s.weight_pt + s.weight_qa }}% Total
                </span>
              </td>
              <td class="text-center text-muted">
                {{ s.display_order ?? 0 }}
              </td>
              <td class="text-center">
                <div class="table-action-group">
                  <button 
                    v-if="auth.isAdmin" 
                    @click="openEditModal(s)" 
                    type="button" 
                    class="action-btn action-btn--edit"
                    title="Edit Subject"
                    :disabled="isLicenseLocked"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    </svg>
                    <span>Edit</span>
                  </button>

                  <router-link 
                    :to="`/class-record?subjectId=${s.id}&gradeLevel=${encodeURIComponent(s.grade_level || '')}`" 
                    class="action-btn action-btn--record"
                    title="Open DepEd E-Class Record"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                    </svg>
                    <span>Scores</span>
                  </router-link>

                  <button 
                    v-if="auth.isAdmin" 
                    @click="confirmDeleteSubject(s)" 
                    type="button" 
                    class="action-btn action-btn--danger"
                    title="Delete Subject"
                    :disabled="isLicenseLocked"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Add / Edit Subject -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card subject-modal-card">
        <div class="modal-header">
          <div class="modal-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <div>
            <h3>{{ editingSubjectId ? 'Edit Curriculum Subject' : 'Add Curriculum Subject' }}</h3>
            <p>{{ editingSubjectId ? 'Update learning area details and assessment weights.' : 'Create a new subject and configure DepEd assessment weights.' }}</p>
          </div>
          <button @click="closeModal" type="button" class="modal-close-btn" aria-label="Close modal">&times;</button>
        </div>

        <form @submit.prevent="saveSubject" class="modal-body">
          <div class="form-row">
            <div class="form-group flex-2">
              <label>Subject / Learning Area Name <span class="required">*</span></label>
              <input 
                v-model="form.subjectName" 
                type="text" 
                class="form-input" 
                placeholder="e.g. Mathematics, English, Science, Araling Panlipunan"
                required
              />
            </div>
            <div class="form-group flex-1">
              <label>Subject Code</label>
              <input 
                v-model="form.subjectCode" 
                type="text" 
                class="form-input" 
                placeholder="e.g. MATH, ENG"
                @input="form.subjectCode = form.subjectCode.toUpperCase()"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-2">
              <label>Grade Level <span class="required">*</span></label>
              <select v-if="schoolGradeOptions.length" v-model="form.gradeLevel" class="form-select" required>
                <option value="" disabled>Select grade level</option>
                <option v-for="g in schoolGradeOptions" :key="g" :value="g">{{ g }}</option>
              </select>
              <input 
                v-else 
                v-model="form.gradeLevel" 
                type="text" 
                class="form-input" 
                placeholder="e.g. Grade 7" 
                required
              />
            </div>
            <div class="form-group flex-1">
              <label>Display Order</label>
              <input 
                v-model.number="form.displayOrder" 
                type="number" 
                min="0" 
                class="form-input" 
                placeholder="0"
              />
            </div>
          </div>

          <!-- DepEd Weight Presets and Configuration -->
          <div class="weights-section">
            <div class="weights-header">
              <label class="weights-title">
                DepEd Order No. 8, s. 2015 Assessment Weights (%)
              </label>
              <span 
                class="weight-sum-pill" 
                :class="{ 'pill-valid': weightSum === 100, 'pill-invalid': weightSum !== 100 }"
              >
                <template v-if="weightSum === 100">✓ Total: 100% Compliant</template>
                <template v-else>⚠ Total: {{ weightSum }}% (Must equal 100%)</template>
              </span>
            </div>

            <div class="preset-buttons-row">
              <span class="preset-label">Standard Presets:</span>
              <button 
                type="button" 
                class="preset-btn" 
                @click="applyPreset(30, 50, 20)"
                title="Languages, Araling Panlipunan, and EsP"
              >
                Languages / AP / EsP (30-50-20)
              </button>
              <button 
                type="button" 
                class="preset-btn" 
                @click="applyPreset(40, 40, 20)"
                title="Mathematics and Science"
              >
                Math / Science (40-40-20)
              </button>
              <button 
                type="button" 
                class="preset-btn" 
                @click="applyPreset(20, 60, 20)"
                title="MAPEH and TLE / EPP"
              >
                MAPEH / TLE (20-60-20)
              </button>
            </div>

            <div class="weights-inputs-grid">
              <div class="weight-input-box">
                <div class="weight-box-header">
                  <span class="weight-box-title">Written Works (WW)</span>
                  <span class="weight-box-val">{{ form.weightWw }}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5" 
                  v-model.number="form.weightWw" 
                  class="weight-slider"
                />
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  v-model.number="form.weightWw" 
                  class="form-input text-center weight-num-input"
                />
              </div>

              <div class="weight-input-box">
                <div class="weight-box-header">
                  <span class="weight-box-title">Performance Tasks (PT)</span>
                  <span class="weight-box-val">{{ form.weightPt }}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5" 
                  v-model.number="form.weightPt" 
                  class="weight-slider"
                />
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  v-model.number="form.weightPt" 
                  class="form-input text-center weight-num-input"
                />
              </div>

              <div class="weight-input-box">
                <div class="weight-box-header">
                  <span class="weight-box-title">Quarterly Assessment (QA)</span>
                  <span class="weight-box-val">{{ form.weightQa }}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5" 
                  v-model.number="form.weightQa" 
                  class="weight-slider"
                />
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  v-model.number="form.weightQa" 
                  class="form-input text-center weight-num-input"
                />
              </div>
            </div>
          </div>

          <div v-if="modalError" class="modal-error-banner">
            {{ modalError }}
          </div>

          <div class="modal-footer">
            <button @click="closeModal" type="button" class="btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="savingSubject || weightSum !== 100 || !form.subjectName.trim()"
            >
              {{ savingSubject ? 'Saving…' : (editingSubjectId ? 'Update Subject' : 'Create Subject') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Seed DepEd Defaults -->
    <div v-if="showSeedModal" class="modal-overlay" @click.self="showSeedModal = false">
      <div class="modal-card seed-modal-card">
        <div class="modal-header">
          <div class="modal-header-icon modal-header-icon--success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <h3>Seed DepEd K-12 Standard Subjects</h3>
            <p>Populate official DepEd Order No. 8, s. 2015 curriculum learning areas and standard assessment weights.</p>
          </div>
          <button @click="showSeedModal = false" type="button" class="modal-close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Target Grade Level</label>
            <select v-model="seedTargetGrade" class="form-select">
              <option value="all">All School Grade Levels</option>
              <option v-for="g in schoolGradeOptions" :key="g" :value="g">{{ g }}</option>
            </select>
            <p class="form-hint">
              {{ seedTargetGrade === 'all' 
                ? 'Standard subjects will be populated across all configured school grade levels.' 
                : `Standard subjects will be populated specifically for ${seedTargetGrade}.` }}
            </p>
          </div>

          <div class="deped-preview-box">
            <div class="preview-title">Standard Learning Areas to be Created:</div>
            <ul class="preview-list">
              <li><strong>Filipino</strong> (FIL) &mdash; 30% WW, 50% PT, 20% QA</li>
              <li><strong>English</strong> (ENG) &mdash; 30% WW, 50% PT, 20% QA</li>
              <li><strong>Mathematics</strong> (MATH) &mdash; 40% WW, 40% PT, 20% QA</li>
              <li><strong>Science</strong> (SCI) &mdash; 40% WW, 40% PT, 20% QA</li>
              <li><strong>Araling Panlipunan</strong> (AP) &mdash; 30% WW, 50% PT, 20% QA</li>
              <li><strong>Edukasyon sa Pagpapakatao</strong> (ESP) &mdash; 30% WW, 50% PT, 20% QA</li>
              <li><strong>MAPEH</strong> (MAPEH) &mdash; 20% WW, 60% PT, 20% QA</li>
              <li><strong>Technology &amp; Livelihood Education</strong> (TLE) &mdash; 20% WW, 60% PT, 20% QA</li>
            </ul>
            <p class="preview-note">Note: Existing subjects with the same name are preserved to prevent duplicates.</p>
          </div>

          <div class="modal-footer">
            <button @click="showSeedModal = false" type="button" class="btn-secondary">
              Cancel
            </button>
            <button 
              @click="runSeedDefaults" 
              type="button" 
              class="btn-primary" 
              :disabled="seedingDefaults || isLicenseLocked"
            >
              {{ seedingDefaults ? 'Seeding Subjects…' : 'Seed Standard Subjects' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'
import { loadPageState, savePageState } from '../composables/usePageState'

const auth = useAuthStore()
const route = useRoute()
const { notify } = useNotifications()

const loading = ref(false)
const subjects = ref([])
const schoolsList = ref([])
const savedState = loadPageState(auth.user)
const selectedSchoolId = ref(savedState?.school || '')
const schoolGradeOptions = ref([])

const searchQuery = ref('')
const filterGradeLevel = ref('')

const showModal = ref(false)
const editingSubjectId = ref(null)
const savingSubject = ref(false)
const modalError = ref('')

const showSeedModal = ref(false)
const seedTargetGrade = ref('all')
const seedingDefaults = ref(false)

const licenseStatus = ref('active')
const isLicenseLocked = ref(false)

const form = ref({
  subjectName: '',
  subjectCode: '',
  gradeLevel: '',
  weightWw: 30,
  weightPt: 50,
  weightQa: 20,
  displayOrder: 0
})

function effectiveSchoolId() {
  return auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || '')
}

const activeSchoolInfo = computed(() => {
  const sid = effectiveSchoolId()
  if (!sid) return null
  return schoolsList.value.find(s => s.id === sid) || auth.school || null
})

const licenseStatusText = computed(() => {
  if (isLicenseLocked.value) return 'Locked'
  if (licenseStatus.value === 'trial') return 'Trial'
  if (licenseStatus.value === 'active') return 'Licensed'
  return licenseStatus.value || 'Active'
})

const licenseBadgeClass = computed(() => {
  if (isLicenseLocked.value) return 'badge-locked'
  if (licenseStatus.value === 'trial') return 'badge-trial'
  return 'badge-active'
})

const coveredGradesCount = computed(() => {
  const set = new Set(subjects.value.map(s => String(s.grade_level || '').trim()).filter(Boolean))
  return set.size
})

const compliantWeightsCount = computed(() => {
  return subjects.value.filter(s => (s.weight_ww + s.weight_pt + s.weight_qa) === 100).length
})

const weightSum = computed(() => {
  return (Number(form.value.weightWw) || 0) + (Number(form.value.weightPt) || 0) + (Number(form.value.weightQa) || 0)
})

const filteredSubjects = computed(() => {
  let list = subjects.value
  if (filterGradeLevel.value) {
    const target = filterGradeLevel.value.toLowerCase().trim()
    list = list.filter(s => String(s.grade_level || '').toLowerCase().trim() === target)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(s => 
      String(s.subject_name || '').toLowerCase().includes(q) ||
      String(s.subject_code || '').toLowerCase().includes(q) ||
      String(s.grade_level || '').toLowerCase().includes(q)
    )
  }
  return list
})

function clearFilters() {
  searchQuery.value = ''
  filterGradeLevel.value = ''
}

function applyPreset(ww, pt, qa) {
  form.value.weightWw = ww
  form.value.weightPt = pt
  form.value.weightQa = qa
}

async function loadSchoolGrades() {
  const sid = effectiveSchoolId()
  if (!sid) {
    schoolGradeOptions.value = []
    return
  }
  try {
    const params = new URLSearchParams({
      userId: auth.user?.id || '',
      userRole: auth.user?.role || ''
    })
    const res = await fetch(`/api/schools/${sid}/grades?${params}`)
    const data = await res.json()
    const grades = Array.isArray(data) ? data.map(g => g.grade).filter(Boolean) : []
    schoolGradeOptions.value = grades
  } catch (err) {
    console.error('Failed to load school grade levels:', err)
    schoolGradeOptions.value = []
  }
}

async function loadSubjects() {
  const sid = effectiveSchoolId()
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (sid) params.set('schoolId', sid)
    
    const res = await fetch(`/api/grading/subjects?${params.toString()}`, {
      headers: auth.actorHeaders()
    })

    if (res.status === 402) {
      isLicenseLocked.value = true
      const data = await res.json()
      licenseStatus.value = data.licenseStatus || 'locked'
      subjects.value = []
      return
    }

    const data = await res.json()
    if (data.success) {
      subjects.value = Array.isArray(data.subjects) ? data.subjects : []
      isLicenseLocked.value = false
    } else {
      subjects.value = []
    }
  } catch (err) {
    console.error('Failed to load grading subjects:', err)
    notify('Failed to load subjects', 'error')
    subjects.value = []
  } finally {
    loading.value = false
  }
}

async function checkLicense() {
  const sid = effectiveSchoolId()
  if (!sid) return
  try {
    const res = await fetch(`/api/schools/${sid}/license`, {
      headers: auth.actorHeaders()
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.license) {
        licenseStatus.value = data.license.status
        isLicenseLocked.value = data.license.status === 'suspended' || data.license.status === 'cancelled' || Boolean(data.license.is_expired)
      }
    }
  } catch {}
}

async function onSchoolChange() {
  if (auth.user) savePageState(auth.user, { school: selectedSchoolId.value })
  await loadSchoolGrades()
  await checkLicense()
  await loadSubjects()
}

function openAddModal() {
  editingSubjectId.value = null
  modalError.value = ''
  form.value = {
    subjectName: '',
    subjectCode: '',
    gradeLevel: filterGradeLevel.value || schoolGradeOptions.value[0] || '',
    weightWw: 30,
    weightPt: 50,
    weightQa: 20,
    displayOrder: subjects.value.length + 1
  }
  showModal.value = true
}

function openEditModal(sub) {
  editingSubjectId.value = sub.id
  modalError.value = ''
  form.value = {
    subjectName: sub.subject_name || '',
    subjectCode: sub.subject_code || '',
    gradeLevel: sub.grade_level || '',
    weightWw: sub.weight_ww ?? 30,
    weightPt: sub.weight_pt ?? 50,
    weightQa: sub.weight_qa ?? 20,
    displayOrder: sub.display_order ?? 0
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingSubjectId.value = null
  modalError.value = ''
}

async function saveSubject() {
  modalError.value = ''
  if (!form.value.subjectName.trim()) {
    modalError.value = 'Subject name is required.'
    return
  }
  if (weightSum.value !== 100) {
    modalError.value = `Assessment weights must total exactly 100% (currently ${weightSum.value}%).`
    return
  }

  const sid = effectiveSchoolId()
  savingSubject.value = true
  try {
    const isEdit = Boolean(editingSubjectId.value)
    const url = isEdit ? `/api/grading/subjects/${editingSubjectId.value}` : '/api/grading/subjects'
    const method = isEdit ? 'PUT' : 'POST'

    const payload = {
      schoolId: sid,
      gradeLevel: form.value.gradeLevel.trim(),
      subjectName: form.value.subjectName.trim(),
      subjectCode: (form.value.subjectCode || form.value.subjectName.slice(0, 6)).toUpperCase().trim(),
      weightWw: form.value.weightWw,
      weightPt: form.value.weightPt,
      weightQa: form.value.weightQa,
      displayOrder: form.value.displayOrder
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to save subject')

    notify(isEdit ? 'Subject updated successfully' : 'Subject created successfully', 'success')
    closeModal()
    await loadSubjects()
  } catch (err) {
    modalError.value = err.message || 'Error saving subject'
    notify(err.message, 'error')
  } finally {
    savingSubject.value = false
  }
}

async function confirmDeleteSubject(sub) {
  if (!confirm(`Are you sure you want to delete subject "${sub.subject_name}" (${sub.grade_level})?`)) return
  try {
    const res = await fetch(`/api/grading/subjects/${sub.id}`, {
      method: 'DELETE',
      headers: auth.actorHeaders()
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete subject')
    notify(`Subject ${sub.subject_name} deleted`, 'success')
    await loadSubjects()
  } catch (err) {
    notify(err.message, 'error')
  }
}

function openSeedModal() {
  seedTargetGrade.value = filterGradeLevel.value || 'all'
  showSeedModal.value = true
}

async function runSeedDefaults() {
  const sid = effectiveSchoolId()
  seedingDefaults.value = true
  try {
    const res = await fetch('/api/grading/subjects/seed-defaults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify({
        schoolId: sid,
        gradeLevel: seedTargetGrade.value
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to seed subjects')
    notify(data.message || `Standard DepEd subjects seeded successfully!`, 'success')
    showSeedModal.value = false
    await loadSubjects()
  } catch (err) {
    notify(err.message, 'error')
  } finally {
    seedingDefaults.value = false
  }
}

onMounted(async () => {
  if (auth.isSuperadmin) {
    schoolsList.value = await auth.getSchools()
    selectedSchoolId.value = auth.schoolId || schoolsList.value[0]?.id || ''
  } else {
    selectedSchoolId.value = auth.schoolId || ''
    schoolsList.value = auth.school ? [auth.school] : []
  }

  // Check incoming route query for grade
  if (route.query.gradeLevel) {
    filterGradeLevel.value = String(route.query.gradeLevel)
  }

  await loadSchoolGrades()
  await checkLicense()
  await loadSubjects()
})

watch(() => route.query.gradeLevel, (newGrade) => {
  if (newGrade) {
    filterGradeLevel.value = String(newGrade)
  }
})
</script>

<style scoped>
.subjects-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dashboard-header-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: var(--primary-bg);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  margin-bottom: 4px;
}

.breadcrumb .sep {
  opacity: 0.5;
}

.breadcrumb .current {
  color: var(--foreground);
  font-weight: 600;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
  max-width: 170px;
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

.badge-active {
  background: var(--success-bg);
  color: var(--success);
}

.badge-trial {
  background: var(--warning-bg);
  color: var(--warning);
}

.badge-locked {
  background: var(--red-bg);
  color: var(--destructive);
}

.school-picker-wrap {
  display: flex;
  align-items: center;
  position: relative;
}

.school-picker-icon {
  position: absolute;
  left: 10px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.school-picker-select {
  padding: 7px 12px 7px 32px;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--foreground);
  cursor: pointer;
  outline: none;
}

.header-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 600;
}

/* License Locked Card */
.license-locked-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 24px;
  background: var(--red-bg);
  border: 1px solid color-mix(in srgb, var(--destructive) 25%, transparent);
  border-radius: var(--radius-lg);
  color: var(--foreground);
}

.lock-icon {
  color: var(--destructive);
  padding-top: 2px;
}

.lock-copy h3 {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--destructive);
}

.lock-copy p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--muted-foreground);
  line-height: 1.45;
}

/* Stats Row */
.subjects-page .stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  margin-bottom: 20px;
}

@media (max-width: 1024px) {
  .subjects-page .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .subjects-page .stats-row {
    grid-template-columns: 1fr;
  }
}

.stat-card-link {
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.stat-card-link:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
}

.link-text {
  color: var(--primary) !important;
}

/* Filters & Search */
.subjects-page .subjects-filter-card {
  max-width: 100% !important;
  width: 100%;
  padding: 22px 24px;
  box-sizing: border-box;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.search-group {
  flex: 2;
  min-width: 240px;
  margin-bottom: 0;
}

.grade-filter-group {
  flex: 1;
  min-width: 180px;
  margin-bottom: 0;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.search-input {
  padding-left: 36px;
  padding-right: 32px;
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 2px 6px;
}

.filter-count-badge {
  margin-left: auto;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted-foreground);
  padding-bottom: 8px;
}

/* Table Card */
.subjects-page .subjects-table-card {
  max-width: 100% !important;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  box-shadow: var(--shadow-xs);
  box-sizing: border-box;
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border);
  background: var(--card);
  flex-wrap: wrap;
  gap: 10px;
}

.table-card-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-card-header-title h3 {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
}

.subject-counter-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--secondary);
  color: var(--muted-foreground);
}

.table-card-header-hint {
  font-size: 0.74rem;
  color: var(--primary);
  font-weight: 600;
}

.table-container {
  overflow-x: auto;
}

.subjects-table {
  width: 100%;
  border-collapse: collapse;
}

.subjects-table th {
  background: var(--muted);
  padding: 13px 20px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.subjects-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 0.84rem;
  color: var(--foreground);
}

.subject-row:hover {
  background: color-mix(in srgb, var(--secondary) 50%, var(--card));
}

.subject-name-cell {
  font-weight: 600;
}

.subject-name-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.subject-icon-pill {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--primary-bg);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.subject-name-text {
  font-weight: 700;
  color: var(--foreground);
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 4px;
}

.badge-code {
  background: var(--muted);
  color: var(--foreground);
  font-family: monospace;
  font-size: 0.75rem;
}

.badge-grade {
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
}

.badge-success {
  background: var(--success-bg);
  color: var(--success);
}

.badge-danger {
  background: var(--red-bg);
  color: var(--destructive);
}

.weight-chip {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.76rem;
}

.chip-ww {
  background: var(--info-bg);
  color: var(--info);
  border: 1px solid color-mix(in srgb, var(--info) 20%, transparent);
}

.chip-pt {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid color-mix(in srgb, var(--warning) 20%, transparent);
}

.chip-qa {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid color-mix(in srgb, var(--success) 20%, transparent);
}

.table-action-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--secondary);
}

.action-btn--edit:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.action-btn--record:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.action-btn--danger {
  padding: 4px 6px;
}

.action-btn--danger:hover {
  background: var(--red-bg);
  border-color: var(--destructive);
  color: var(--destructive);
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 11, 12, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(6px);
}

.subject-modal-card {
  max-width: 580px;
  width: 100%;
}

.seed-modal-card {
  max-width: 540px;
  width: 100%;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 22px 26px;
  border-bottom: 1px solid var(--border);
}

.modal-header-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--primary-bg);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-header-icon--success {
  background: var(--success-bg);
  color: var(--success);
}

.modal-header h3 {
  margin: 0 0 3px 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.modal-header p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.modal-close-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 1.4rem;
  line-height: 1;
  color: var(--muted-foreground);
  cursor: pointer;
}

.modal-body {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.required {
  color: var(--destructive);
}

.weights-section {
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weights-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.weights-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--foreground);
}

.weight-sum-pill {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
}

.pill-valid {
  background: var(--success-bg);
  color: var(--success);
}

.pill-invalid {
  background: var(--red-bg);
  color: var(--destructive);
}

.preset-buttons-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 0.74rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.preset-btn {
  padding: 3px 7px;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-btn:hover {
  background: var(--primary-bg);
  color: var(--primary);
  border-color: var(--primary);
}

.weights-inputs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.weight-input-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weight-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.weight-box-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted-foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weight-box-val {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--primary);
}

.weight-slider {
  width: 100%;
  accent-color: var(--primary);
  cursor: pointer;
}

.weight-num-input {
  font-weight: 700;
  font-size: 0.82rem;
  padding: 4px;
}

.modal-error-banner {
  background: var(--red-bg);
  border: 1px solid color-mix(in srgb, var(--destructive) 25%, transparent);
  color: var(--destructive);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

/* Seed Preview Box */
.deped-preview-box {
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px 20px;
}

.preview-title {
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--foreground);
}

.preview-list {
  margin: 0;
  padding-left: 18px;
  font-size: 0.78rem;
  color: var(--foreground);
  line-height: 1.6;
}

.preview-note {
  margin: 10px 0 0 0;
  font-size: 0.74rem;
  color: var(--muted-foreground);
  font-style: italic;
}

.loading-state,
.empty-state {
  padding: 48px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--secondary);
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.empty-state p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--muted-foreground);
  max-width: 420px;
}

.empty-state-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-header-actions {
    width: 100%;
  }

  .header-action-btn {
    flex: 1 1 0;
  }

  .form-row {
    flex-direction: column;
  }

  .weights-inputs-grid {
    grid-template-columns: 1fr;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-count-badge {
    margin-left: 0;
  }
}
</style>
