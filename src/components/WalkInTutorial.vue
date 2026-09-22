<template>
  <Transition name="tutorial-fade">
    <div v-if="show" class="tutorial-overlay" @click.self="handleOverlayClick" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div class="tutorial-modal">
        <!-- Modal Top Bar -->
        <div class="tutorial-header">
          <div class="tutorial-brand">
            <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="tutorial-logo-img" />
            <div>
              <span class="tutorial-brand-title">ElyTrack Onboarding</span>
              <span class="tutorial-step-counter">Step {{ currentStep + 1 }} of {{ totalSteps }}</span>
            </div>
          </div>

          <div class="tutorial-header-controls">
            <!-- Progress Dots -->
            <div class="tutorial-dots" role="tablist" aria-label="Walkthrough steps">
              <button
                v-for="(step, index) in steps"
                :key="index"
                class="tutorial-dot"
                :class="{ active: currentStep === index, completed: currentStep > index }"
                :title="step.shortTitle"
                :aria-label="`Go to step ${index + 1}: ${step.shortTitle}`"
                @click="goToStep(index)"
              ></button>
            </div>

            <button @click="closeTutorial" class="tutorial-close-btn" title="Close tutorial (Esc)" aria-label="Close tutorial">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Slide Progress Bar -->
        <div class="tutorial-progress-track">
          <div class="tutorial-progress-bar" :style="{ width: `${((currentStep + 1) / totalSteps) * 100}%` }"></div>
        </div>

        <!-- Slide Content Area -->
        <div class="tutorial-body">
          <!-- Slide 1: Workspace & Role Overview -->
          <div v-if="currentStep === 0" class="tutorial-slide">
            <div class="slide-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
              <span>Platform Foundation</span>
            </div>
            <h2 id="tutorial-title" class="slide-title">Welcome to ElyTrack SF2</h2>
            <p class="slide-subtitle">
              Engineered specifically for Philippine basic education institutions to streamline daily attendance, automate DepEd Form 2 compliance, and identify learners at risk of dropping out.
            </p>

            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon icon-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>Unified Navigation</strong>
                  <p>Seamlessly switch between daily roll call, monthly SF2 filing, school rosters, and class schedules via the responsive workspace sidebar.</p>
                </div>
              </div>

              <div class="feature-card">
                <div class="feature-icon icon-emerald">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>Strict Role Segregation</strong>
                  <p>Advisory teachers work within designated grade &amp; sections, administrators oversee faculty and seat capacity, and superadmins manage institutional keys.</p>
                </div>
              </div>

              <div class="feature-card">
                <div class="feature-icon icon-teal">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V22h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 17a1.7 1.7 0 0 0-1.56-1.03H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 12a1.7 1.7 0 0 0-.34-1.88L8 10.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V7h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 12c.2.64.8 1.03 1.46 1.03h.24v2.4h-.24c-.66 0-1.26.39-1.46 1.03Z"/>
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>User Profile &amp; Credentials</strong>
                  <p>Easily update your username, password, and display name in Settings without disrupting your assigned school or advisory class linkage.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Slide 2: Daily Roll Call & Period Codes -->
          <div v-if="currentStep === 1" class="tutorial-slide">
            <div class="slide-badge slide-badge--teal">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Daily Attendance Operations</span>
            </div>
            <h2 class="slide-title">Precision Daily Roll Call</h2>
            <p class="slide-subtitle">
              Record period-level attendance for AM and PM class sessions with DepEd standard marks, live telemetry KPIs, and rapid batch actions.
            </p>

            <div class="legend-box">
              <div class="legend-box-title">Official Roll Call Marks &amp; Codes</div>
              <div class="code-chips-grid">
                <div class="code-chip">
                  <span class="chip-code code-present">E</span>
                  <div class="chip-desc">
                    <strong>Present</strong>
                    <small>Enrolled and physically in class</small>
                  </div>
                </div>
                <div class="code-chip">
                  <span class="chip-code code-tardy">T</span>
                  <div class="chip-desc">
                    <strong>Tardy / Late</strong>
                    <small>Arrived past official grace period</small>
                  </div>
                </div>
                <div class="code-chip">
                  <span class="chip-code code-absent">A</span>
                  <div class="chip-desc">
                    <strong>Absent</strong>
                    <small>Full session non-attendance</small>
                  </div>
                </div>
                <div class="code-chip">
                  <span class="chip-code code-half">E/T</span>
                  <div class="chip-desc">
                    <strong>Partial Day</strong>
                    <small>Present morning, tardy or absent PM</small>
                  </div>
                </div>
                <div class="code-chip">
                  <span class="chip-code code-excused">A/S</span>
                  <div class="chip-desc">
                    <strong>School Sanctioned</strong>
                    <small>Competitions, medical, or official duty</small>
                  </div>
                </div>
                <div class="code-chip">
                  <span class="chip-code code-nip">NIP*</span>
                  <div class="chip-desc">
                    <strong>Not in Period</strong>
                    <small>Transferred out or specially excused</small>
                  </div>
                </div>
              </div>
            </div>

            <div class="highlight-callout">
              <div class="callout-icon">⚡</div>
              <div class="callout-body">
                <strong>1-Click Batch Quick Fill</strong>
                <p>Teaching a full class today? Use the <em>"Mark All Present (E)"</em> quick action to populate all enrolled learners across all periods in one click, then adjust any absences individually.</p>
              </div>
            </div>
          </div>

          <!-- Slide 3: Monthly DepEd SF2 Compliance -->
          <div v-if="currentStep === 2" class="tutorial-slide">
            <div class="slide-badge slide-badge--emerald">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>Automated Compliance</span>
            </div>
            <h2 class="slide-title">Official Monthly DepEd SF2</h2>
            <p class="slide-subtitle">
              Eliminate manual mathematical errors. ElyTrack aggregates daily records into the official DepEd School Form 2 template ready for submission.
            </p>

            <div class="metrics-preview-row">
              <div class="metric-preview-card">
                <span class="metric-label">ADA Formula</span>
                <span class="metric-formula">Total Daily Attendance ÷ School Days</span>
                <p>Calculated live per month without rounding discrepancies</p>
              </div>
              <div class="metric-preview-card">
                <span class="metric-label">DepEd Attendance %</span>
                <span class="metric-formula">(ADA ÷ Registered Learners) × 100</span>
                <p>Automatically flags if class falls below 95% threshold</p>
              </div>
            </div>

            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon icon-teal">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>DepEd Gender Segregation</strong>
                  <p>Male and Female rosters are automatically segregated, sorted alphabetically, and totaled separately as mandated by national DepEd guidelines.</p>
                </div>
              </div>

              <div class="feature-card">
                <div class="feature-icon icon-emerald">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <div class="feature-content">
                  <strong>1-Click Excel Export (.xlsx)</strong>
                  <p>Download exact DepEd SF2 spreadsheets formatted with school headers, summary tables, and signature blocks ready for Division submission.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Slide 4: SARDO Early-Warning Radar -->
          <div v-if="currentStep === 3" class="tutorial-slide">
            <div class="slide-badge slide-badge--danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Early Warning System</span>
            </div>
            <h2 class="slide-title">SARDO Early-Warning Radar</h2>
            <p class="slide-subtitle">
              Catch chronic absenteeism before it leads to student dropout. ElyTrack tracks consecutive and intermittent unexcused absences in real time.
            </p>

            <div class="sardo-indicator-cards">
              <div class="sardo-indicator-card sardo-warning">
                <div class="sardo-status-badge badge-warning">Warning · 2-4 Absences</div>
                <h4>Early Advisory Counseling</h4>
                <p>Flagged for class adviser inquiry to identify health, transportation, or family circumstances before habits solidify.</p>
              </div>

              <div class="sardo-indicator-card sardo-danger">
                <div class="sardo-status-badge badge-danger">Critical · 5+ Absences</div>
                <h4>DepEd Intervention Protocol</h4>
                <p>Formal SARDO alert triggering guidance counselor referral, home visitation, and parent-teacher conference documentation.</p>
              </div>
            </div>

            <div class="highlight-callout highlight-callout--subtle">
              <div class="callout-icon">🔍</div>
              <div class="callout-body">
                <strong>Advisory Class Attendance Matrix</strong>
                <p>Both the Teacher and Admin dashboards provide full-roster standing breakdown (Regular, Warning, At Risk) with instant search filtering.</p>
              </div>
            </div>
          </div>

          <!-- Slide 5: Role-Specific Institutional Operations -->
          <div v-if="currentStep === 4" class="tutorial-slide">
            <!-- Admin / Superadmin View -->
            <template v-if="auth.isAdmin || auth.isSuperadmin">
              <div class="slide-badge slide-badge--primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Institutional Governance</span>
              </div>
              <h2 class="slide-title">Campus &amp; Faculty Administration</h2>
              <p class="slide-subtitle">
                As a School Administrator, you configure school sections, link faculty advisory assignments, and monitor institutional seat capacities.
              </p>

              <div class="feature-grid">
                <div class="feature-card">
                  <div class="feature-icon icon-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div class="feature-content">
                    <strong>Advisory Teacher Assignment</strong>
                    <p>Assign each faculty member to their official Grade and Section in <em>User accounts</em>. The teacher's daily attendance will lock directly to their class.</p>
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon icon-teal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div class="feature-content">
                    <strong>Institutional Seat Capacity</strong>
                    <p>View your school's active subscription tier, enrolled student quota, and renewal cycles in <em>License &amp; Plans</em> (read-only for campus admins).</p>
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon icon-emerald">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/><path d="M8 7h8M8 11h8M8 15h5"/>
                    </svg>
                  </div>
                  <div class="feature-content">
                    <strong>Curriculum &amp; Sections Directory</strong>
                    <p>Add grade levels and sections to match your campus organization so advisers and student rosters match your physical classrooms.</p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Teacher View -->
            <template v-else>
              <div class="slide-badge slide-badge--teal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Teacher Operations</span>
              </div>
              <h2 class="slide-title">Advisory Class Scoping &amp; Privacy</h2>
              <p class="slide-subtitle">
                Your faculty account is linked directly to your designated advisory class, eliminating manual configuration and preventing cross-class record mixing.
              </p>

              <div class="feature-grid">
                <div class="feature-card">
                  <div class="feature-icon icon-teal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  </div>
                  <div class="feature-content">
                    <strong>Auto-Loaded Class Parameters</strong>
                    <p>Opening Daily Attendance automatically selects your assigned Grade, Section, and Adviser name so you can start roll call immediately.</p>
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon icon-emerald">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div class="feature-content">
                    <strong>Class Record Protection</strong>
                    <p>Attendance records are protected: teachers can only record and edit sessions belonging to their assigned section, safeguarding your official logs.</p>
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon icon-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div class="feature-content">
                    <strong>Direct Overview Shortcuts</strong>
                    <p>Use the prominent <em>"Take Today's Attendance"</em> button directly in your Classroom Overview header or Telemetry card to open today's sheet in 1 click.</p>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Slide 6: Ready to Roll -->
          <div v-if="currentStep === 5" class="tutorial-slide">
            <div class="slide-badge slide-badge--emerald">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Onboarding Complete</span>
            </div>
            <h2 class="slide-title">You're All Set to Begin!</h2>
            <p class="slide-subtitle">
              You now have all the tools needed to record daily attendance, generate compliant DepEd SF2 reports, and safeguard student retention.
            </p>

            <div class="quick-jump-box">
              <div class="quick-jump-label">Where would you like to start?</div>
              <div class="quick-jump-buttons">
                <!-- Teacher Actions -->
                <template v-if="auth.isTeacher">
                  <button @click="navigateAndClose('/attendance')" class="jump-action-btn jump-action--primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span>Take Daily Attendance</span>
                  </button>
                  <button @click="navigateAndClose('/monthly')" class="jump-action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>Open Monthly SF2</span>
                  </button>
                  <button @click="navigateAndClose('/teacher')" class="jump-action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    <span>Classroom Overview</span>
                  </button>
                </template>

                <!-- Admin Actions -->
                <template v-else>
                  <button @click="navigateAndClose('/admin')" class="jump-action-btn jump-action--primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    <span>School Overview</span>
                  </button>
                  <button @click="navigateAndClose('/students')" class="jump-action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                    <span>Manage Students</span>
                  </button>
                  <button @click="navigateAndClose('/users')" class="jump-action-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    </svg>
                    <span>Manage Faculty</span>
                  </button>
                </template>
              </div>
            </div>

            <div class="completion-note">
              <label class="remember-checkbox-label">
                <input type="checkbox" v-model="dontShowAgain" />
                <span>Don't show this walkthrough automatically when signing in</span>
              </label>
              <small>You can reopen this tutorial at any time by clicking the <strong>Tutorial (?)</strong> icon in the top navigation bar.</small>
            </div>
          </div>
        </div>

        <!-- Modal Bottom Navigation Controls -->
        <div class="tutorial-footer">
          <button
            v-if="currentStep > 0"
            @click="prevStep"
            class="tutorial-nav-btn btn-secondary"
            title="Go to previous step (Left Arrow)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Back</span>
          </button>
          <div v-else></div>

          <div class="tutorial-footer-right">
            <button
              v-if="currentStep < totalSteps - 1"
              @click="closeTutorial"
              class="tutorial-text-btn"
              title="Skip remaining steps"
            >
              Skip guide
            </button>

            <button
              v-if="currentStep < totalSteps - 1"
              @click="nextStep"
              class="tutorial-nav-btn btn-primary"
              title="Go to next step (Right Arrow)"
            >
              <span>Next</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            <button
              v-else
              @click="finishTutorial"
              class="tutorial-nav-btn btn-primary btn-success-finish"
            >
              <span>Get Started</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'update:show'])

const router = useRouter()
const auth = useAuthStore()

const currentStep = ref(0)
const dontShowAgain = ref(true)

const steps = [
  { shortTitle: 'Platform Overview' },
  { shortTitle: 'Daily Roll Call' },
  { shortTitle: 'Monthly DepEd SF2' },
  { shortTitle: 'SARDO Radar' },
  { shortTitle: 'Institutional Scoping' },
  { shortTitle: 'Ready to Roll' }
]

const totalSteps = steps.length

function goToStep(idx) {
  if (idx >= 0 && idx < totalSteps) {
    currentStep.value = idx
  }
}

function nextStep() {
  if (currentStep.value < totalSteps - 1) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function finishTutorial() {
  if (dontShowAgain.value) {
    localStorage.setItem('elytrack_tutorial_seen', '1')
  }
  closeTutorial()
}

function closeTutorial() {
  emit('update:show', false)
  emit('close')
}

function handleOverlayClick() {
  // Allow dismissing on backdrop click
  closeTutorial()
}

function navigateAndClose(path) {
  finishTutorial()
  router.push(path)
}

function handleKeyDown(e) {
  if (!props.show) return
  if (e.key === 'Escape') {
    closeTutorial()
  } else if (e.key === 'ArrowRight' && currentStep.value < totalSteps - 1) {
    nextStep()
  } else if (e.key === 'ArrowLeft' && currentStep.value > 0) {
    prevStep()
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      currentStep.value = 0
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* Modal overlay & backdrop */
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(8, 13, 12, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

/* Modal container */
.tutorial-modal {
  width: 100%;
  max-width: 780px;
  background: var(--card, #ffffff);
  border: 1px solid var(--border, rgba(12, 83, 87, 0.15));
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 20px 48px rgba(8, 13, 12, 0.28);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Header */
.tutorial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border, rgba(12, 83, 87, 0.1));
  background: var(--card, #ffffff);
}

.tutorial-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tutorial-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.tutorial-brand-title {
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--foreground, #223027);
  font-family: 'Manrope', sans-serif;
  letter-spacing: -0.02em;
}

.tutorial-step-counter {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted-foreground, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tutorial-header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Stepper progress dots */
.tutorial-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tutorial-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--border, rgba(12, 83, 87, 0.2));
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tutorial-dot.active {
  width: 22px;
  background: var(--primary, #0c5357);
}

.tutorial-dot.completed {
  background: #10b981;
}

.tutorial-close-btn {
  background: transparent;
  border: none;
  color: var(--muted-foreground, #64748b);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.tutorial-close-btn:hover {
  color: var(--foreground, #080d0c);
  background: var(--secondary, #edf2ec);
}

/* Progress track line */
.tutorial-progress-track {
  width: 100%;
  height: 3px;
  background: var(--secondary, #edf2ec);
}

.tutorial-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #0c5357, #10b981);
  transition: width 0.3s ease;
}

/* Slide Body */
.tutorial-body {
  padding: 26px 32px;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}

.tutorial-slide {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideIn 0.25s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #e6f3f4;
  color: #0c5357;
}

.slide-badge--teal {
  background: #e6f3f4;
  color: #0c5357;
}

.slide-badge--emerald {
  background: #ecfdf5;
  color: #059669;
}

.slide-badge--danger {
  background: #fef2f2;
  color: #dc2626;
}

.slide-badge--primary {
  background: rgba(12, 83, 87, 0.12);
  color: #0c5357;
}

.slide-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--foreground, #080d0c);
  margin: 0;
  letter-spacing: -0.03em;
}

.slide-subtitle {
  font-size: 0.88rem;
  color: var(--muted-foreground, #64748b);
  line-height: 1.55;
  margin: 0;
}

/* Feature grid */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 4px;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 16px;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border, rgba(12, 83, 87, 0.12));
  background: var(--card, #ffffff);
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-primary {
  background: rgba(12, 83, 87, 0.12);
  color: #0c5357;
}

.icon-teal {
  background: #e6f3f4;
  color: #0c5357;
}

.icon-emerald {
  background: #ecfdf5;
  color: #059669;
}

.feature-content strong {
  display: block;
  font-size: 0.86rem;
  color: var(--foreground, #080d0c);
  margin-bottom: 2px;
}

.feature-content p {
  font-size: 0.8rem;
  color: var(--muted-foreground, #64748b);
  line-height: 1.45;
  margin: 0;
}

/* Period Code Chips */
.legend-box {
  background: var(--secondary, #edf2ec);
  border: 1px solid var(--border, rgba(12, 83, 87, 0.12));
  border-radius: var(--radius-md, 10px);
  padding: 14px 16px;
}

.legend-box-title {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground, #64748b);
  margin-bottom: 10px;
}

.code-chips-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.code-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card, #ffffff);
  border: 1px solid var(--border, rgba(12, 83, 87, 0.1));
  padding: 8px 10px;
  border-radius: 8px;
}

.chip-code {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-family: 'Manrope', sans-serif;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.code-present {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.code-tardy {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.code-absent {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.code-half {
  background: #e0f2fe;
  color: #0284c7;
  border: 1px solid rgba(2, 132, 199, 0.3);
}

.code-excused {
  background: #f3e8ff;
  color: #7e22ce;
  border: 1px solid rgba(126, 34, 206, 0.3);
}

.code-nip {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.chip-desc strong {
  display: block;
  font-size: 0.78rem;
  color: var(--foreground, #080d0c);
}

.chip-desc small {
  display: block;
  font-size: 0.68rem;
  color: var(--muted-foreground, #64748b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Callout */
.highlight-callout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md, 10px);
  background: #e6f3f4;
  border: 1px solid rgba(12, 83, 87, 0.2);
  color: #0c5357;
}

.highlight-callout--subtle {
  background: var(--secondary, #edf2ec);
  border-color: var(--border, rgba(12, 83, 87, 0.12));
  color: var(--foreground, #080d0c);
}

.callout-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.callout-body strong {
  display: block;
  font-size: 0.82rem;
  margin-bottom: 2px;
}

.callout-body p {
  font-size: 0.78rem;
  line-height: 1.45;
  margin: 0;
  opacity: 0.9;
}

/* Metrics preview */
.metrics-preview-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.metric-preview-card {
  padding: 14px 16px;
  border-radius: var(--radius-md, 10px);
  background: var(--secondary, #edf2ec);
  border: 1px solid var(--border, rgba(12, 83, 87, 0.12));
}

.metric-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0c5357;
  margin-bottom: 4px;
}

.metric-formula {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-weight: 800;
  font-size: 0.92rem;
  color: var(--foreground, #080d0c);
  margin-bottom: 4px;
}

.metric-preview-card p {
  font-size: 0.74rem;
  color: var(--muted-foreground, #64748b);
  margin: 0;
}

/* SARDO cards */
.sardo-indicator-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.sardo-indicator-card {
  padding: 16px;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border);
  background: var(--card, #ffffff);
}

.sardo-warning {
  border-color: rgba(245, 158, 11, 0.3);
  background: #fffdf5;
}

.sardo-danger {
  border-color: rgba(239, 68, 68, 0.3);
  background: #fff8f8;
}

.sardo-status-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 999px;
  margin-bottom: 8px;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}

.sardo-indicator-card h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 0.92rem;
  font-weight: 800;
  margin: 0 0 6px;
  color: var(--foreground, #080d0c);
}

.sardo-indicator-card p {
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--muted-foreground, #64748b);
  margin: 0;
}

/* Quick jump box (Slide 6) */
.quick-jump-box {
  background: var(--secondary, #edf2ec);
  border: 1px solid var(--border, rgba(12, 83, 87, 0.12));
  border-radius: var(--radius-md, 12px);
  padding: 18px 20px;
}

.quick-jump-label {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground, #64748b);
  margin-bottom: 12px;
}

.quick-jump-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.jump-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--border, rgba(12, 83, 87, 0.18));
  background: var(--card, #ffffff);
  color: var(--foreground, #080d0c);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.jump-action-btn:hover {
  border-color: #0c5357;
  color: #0c5357;
  background: #f4f8f8;
  transform: translateY(-1px);
}

.jump-action--primary {
  background: #0c5357;
  color: #ffffff;
  border-color: #0c5357;
}

.jump-action--primary:hover {
  background: #083c3f;
  color: #ffffff;
}

/* Completion checkbox */
.completion-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.remember-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--foreground, #080d0c);
  cursor: pointer;
}

.remember-checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #0c5357;
  cursor: pointer;
}

.completion-note small {
  font-size: 0.74rem;
  color: var(--muted-foreground, #64748b);
  margin-left: 24px;
}

/* Modal Footer */
.tutorial-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--border, rgba(12, 83, 87, 0.1));
  background: var(--card, #ffffff);
}

.tutorial-footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tutorial-text-btn {
  background: transparent;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted-foreground, #64748b);
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.tutorial-text-btn:hover {
  color: var(--foreground, #080d0c);
  background: var(--secondary, #edf2ec);
}

.tutorial-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-secondary {
  background: var(--secondary, #edf2ec);
  color: var(--foreground, #080d0c);
  border: 1px solid var(--border, rgba(12, 83, 87, 0.15));
}

.btn-secondary:hover {
  background: #e2e8e3;
  color: var(--foreground, #080d0c);
}

.btn-primary {
  background: #0c5357;
  color: #ffffff;
}

.btn-primary:hover {
  background: #083c3f;
}

.btn-success-finish {
  background: #059669;
}

.btn-success-finish:hover {
  background: #047857;
}

/* Transitions */
.tutorial-fade-enter-active,
.tutorial-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tutorial-fade-enter-from,
.tutorial-fade-leave-to {
  opacity: 0;
}

@media (max-width: 680px) {
  .tutorial-modal {
    max-height: 92vh;
  }
  .tutorial-body {
    padding: 20px;
    min-height: auto;
  }
  .code-chips-grid {
    grid-template-columns: 1fr;
  }
  .metrics-preview-row,
  .sardo-indicator-cards,
  .quick-jump-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
