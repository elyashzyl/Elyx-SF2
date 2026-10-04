<template>
  <div class="landing-page">
    <!-- Sticky Glassmorphic Top Navigation -->
    <header class="landing-nav">
      <div class="landing-nav-inner">
        <router-link to="/" class="landing-brand" aria-label="ElyTrack Home">
          <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="landing-brand-logo" />
          <span class="landing-brand-text">
            <strong>ElyTrack</strong>
            <small>DepEd SF2 &amp; School OS</small>
          </span>
        </router-link>

        <!-- Desktop Navigation Links -->
        <!-- Desktop Nav Items -->
        <nav class="landing-nav-links" aria-label="Main Navigation">
          <button type="button" class="landing-nav-link" @click="scrollToSection('demo')">Demo Console</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('features')">Platform</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('process')">Process &amp; Cadence</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('sf2')">DepEd SF2</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('calculator')">Time Saved</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('pricing')">Licensing &amp; Pricing</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('payments')">Payments &amp; QR</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('faq')">FAQ</button>
        </nav>

        <!-- Navigation Actions -->
        <div class="landing-nav-actions">
          <router-link to="/login" class="landing-sign-in">
            <span>Sign In</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </router-link>

          <!-- Mobile Menu Trigger -->
          <button
            type="button"
            class="mobile-menu-toggle"
            @click="mobileNavOpen = !mobileNavOpen"
            :aria-expanded="mobileNavOpen"
            aria-label="Toggle navigation menu"
          >
            <svg v-if="!mobileNavOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      <div v-if="mobileNavOpen" class="mobile-nav-panel">
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('demo')">Demo Console</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('features')">Platform Features</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('process')">Process &amp; Operating Architecture</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('sf2')">DepEd SF2 Standard</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('calculator')">Time Saved Calculator</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('pricing')">Licensing &amp; Pricing</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('payments')">Official Payment Channels &amp; QR</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('faq')">Frequently Asked Questions</button>
        <router-link to="/login" class="mobile-sign-in-btn" @click="mobileNavOpen = false">
          <span>Sign In to School Workspace</span>
          <span>→</span>
        </router-link>
      </div>
    </header>

    <main>
      <!-- Hero Section -->
      <section class="landing-hero">
        <div class="landing-hero-backdrop"></div>
        <div class="landing-hero-radial"></div>

        <div class="landing-hero-inner">
          <!-- Hero Copy Column -->
          <div class="landing-hero-copy">
            <div class="landing-eyebrow">
              <span class="eyebrow-beacon"></span>
              <span>ElyTrack 2.0 · Verified DepEd SF2 Operating System</span>
            </div>

            <h1 class="landing-hero-title">
              School attendance, <br />
              <span class="hero-highlight">orchestrated with precision.</span>
            </h1>

            <p class="landing-hero-lede">
              The calm, verified operations platform designed for Philippine elementary and secondary schools. Record daily roll calls in under 90 seconds, automate official DepEd Form 2 monthly metrics, and detect SARDO dropout risks proactively.
            </p>

            <div class="landing-hero-actions">
              <router-link to="/login" class="landing-primary-btn">
                <span>Enter Workspace</span>
                <span class="btn-arrow">↗</span>
              </router-link>
              <button type="button" class="landing-secondary-btn" @click="scrollToSection('demo')">
                <span>Explore Live Simulator</span>
                <span class="btn-arrow">↓</span>
              </button>
            </div>

            <!-- Proof Points -->
            <div class="landing-proof-grid">
              <div class="proof-card">
                <span class="proof-num">&lt; 90s</span>
                <span class="proof-label">Section Daily Roll Call</span>
              </div>
              <div class="proof-card">
                <span class="proof-num">100%</span>
                <span class="proof-label">DepEd Form 2 Math Accuracy</span>
              </div>
              <div class="proof-card">
                <span class="proof-num">Zero</span>
                <span class="proof-label">Manual Excel Formula Crunch</span>
              </div>
            </div>
          </div>

          <!-- Hero Interactive Console Preview -->
          <div id="demo" class="landing-hero-visual" aria-label="Interactive ElyTrack Console Preview">
            <div class="hero-visual-glow"></div>

            <div class="hero-dashboard-card">
              <!-- Console Window Header -->
              <div class="console-window-header">
                <div class="window-controls">
                  <span class="win-dot win-dot--close"></span>
                  <span class="win-dot win-dot--min"></span>
                  <span class="win-dot win-dot--max"></span>
                </div>
                <div class="window-title">{{ activeSchool?.name || 'ElyTrack' }}</div>
                <div class="window-badge">Live System Preview</div>
              </div>

              <!-- Segmented Console Tabs -->
              <div class="console-tab-bar">
                <button
                  type="button"
                  class="console-tab"
                  :class="{ active: activeDemoTab === 'rollcall' }"
                  @click="activeDemoTab = 'rollcall'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 15h3M8 18h6" />
                  </svg>
                  <span>Daily Roll Call</span>
                </button>

                <button
                  type="button"
                  class="console-tab"
                  :class="{ active: activeDemoTab === 'sf2' }"
                  @click="activeDemoTab = 'sf2'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                  </svg>
                  <span>DepEd SF2 Monthly</span>
                </button>

                <button
                  type="button"
                  class="console-tab"
                  :class="{ active: activeDemoTab === 'sardo' }"
                  @click="activeDemoTab = 'sardo'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>SARDO Retention</span>
                </button>
              </div>

              <!-- TAB 1: Live Interactive Roll Call -->
              <div v-if="activeDemoTab === 'rollcall'" class="console-body">
                <div class="console-topline">
                  <div>
                    <span class="console-mini-label">{{ previewContextLabel }}</span>
                    <strong class="console-heading">Daily Roll Call — Active Session</strong>
                  </div>
                  <div class="console-rate-badge">
                    <span class="rate-pulse"></span>
                    <span>Present: <strong>{{ calculatedAttendanceRate }}%</strong></span>
                  </div>
                </div>

                <div v-if="demoStudents.length" class="demo-student-list">
                  <div
                    v-for="(st, idx) in demoStudents"
                    :key="st.id"
                    class="demo-student-row"
                    :class="{ 'demo-row--absent': st.status === 'Absent' }"
                  >
                    <span class="demo-st-num">#0{{ st.id }}</span>
                    <div class="demo-st-info">
                      <strong>{{ st.name }}</strong>
                      <small>{{ st.gender || 'Learner' }}<span v-if="st.lrn"> · LRN: {{ st.lrn }}</span></small>
                    </div>

                    <div class="demo-period-badges" title="Morning &amp; Afternoon Periods">
                      <span class="demo-period" :class="'p-' + st.am1.toLowerCase()">{{ st.am1 }}</span>
                      <span class="demo-period" :class="'p-' + st.am2.toLowerCase()">{{ st.am2 }}</span>
                      <span class="demo-period" :class="'p-' + st.am3.toLowerCase()">{{ st.am3 }}</span>
                      <span class="demo-period" :class="'p-' + st.am4.toLowerCase()">{{ st.am4 }}</span>
                    </div>

                    <button
                      type="button"
                      class="demo-toggle-btn"
                      :class="st.status === 'Present' ? 'btn-present' : 'btn-absent'"
                      @click="toggleStudentStatus(idx)"
                      :title="'Toggle ' + st.name + '\'s attendance mark'"
                    >
                      <span>{{ st.status }}</span>
                    </button>
                  </div>
                </div>
                <div v-else class="demo-empty-state">No learner records are available in the database.</div>

                <div class="demo-interactive-hint">
                  <span class="hint-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </span>
                  <span><strong>Interactive Simulator:</strong> Click any student badge to toggle status and watch section attendance recalculate immediately.</span>
                </div>
              </div>

              <!-- TAB 2: DepEd Form 2 Preview -->
              <div v-if="activeDemoTab === 'sf2'" class="console-body">
                <div class="console-topline">
                  <div>
                    <span class="console-mini-label">OFFICIAL DEPED FORM 2 (SF2) ENGINE</span>
                    <strong class="console-heading">Monthly Attendance Summary Matrix</strong>
                  </div>
                  <span class="sf2-deped-certified">DepEd Order No. 8, s. 2015</span>
                </div>

                <div class="sf2-metric-preview-grid">
                  <div class="sf2-preview-card">
                    <span class="sf2-label">Registered Learners</span>
                    <span class="sf2-val">{{ landingStats.totalStudents }}</span>
                    <small>{{ landingStats.maleStudents }} Male · {{ landingStats.femaleStudents }} Female</small>
                  </div>
                  <div class="sf2-preview-card sf2-preview-card--highlight">
                    <span class="sf2-label">Average Daily Attendance</span>
                    <span class="sf2-val">{{ landingStats.averageDailyAttendance }}</span>
                    <small>{{ landingStats.attendanceRate }}% Overall Attendance</small>
                  </div>
                  <div class="sf2-preview-card">
                    <span class="sf2-label">School Days in Month</span>
                    <span class="sf2-val">{{ landingStats.schoolDays }}</span>
                    <small>{{ landingStats.monthLabel }}</small>
                  </div>
                  <div class="sf2-preview-card">
                    <span class="sf2-label">SARDO Dropout Risk</span>
                    <span class="sf2-val sf2-val--clean">{{ landingStats.atRiskStudents }}</span>
                    <small>{{ landingStats.retentionLabel }}</small>
                  </div>
                </div>

                <div class="sf2-export-banner">
                  <div class="export-banner-copy">
                    <strong>1-Click DepEd Form 2 (.xlsx) Export</strong>
                    <p>Includes official DepEd headers, verified calculations, and standardized signatory footers.</p>
                  </div>
                  <router-link to="/login" class="sf2-demo-btn">
                    <span>Export Preview</span>
                    <span>→</span>
                  </router-link>
                </div>
              </div>

              <!-- TAB 3: SARDO Watchlist -->
              <div v-if="activeDemoTab === 'sardo'" class="console-body">
                <div class="console-topline">
                  <div>
                    <span class="console-mini-label">EARLY WARNING RETENTION RADAR</span>
                    <strong class="console-heading">Students At-Risk of Dropping Out</strong>
                  </div>
                  <span class="sardo-count-badge">{{ riskStudents.length }} Learners Monitored</span>
                </div>

                <div v-if="riskStudents.length" class="sardo-preview-list">
                  <div v-for="student in riskStudents" :key="student.id" class="sardo-preview-item">
                    <div class="sardo-dot" :class="student.risk === 'high' ? 'sardo-dot--high' : 'sardo-dot--mid'"></div>
                    <div class="sardo-info">
                      <strong>{{ student.name }}</strong>
                      <span>{{ student.grade }} - {{ student.section }} · {{ student.detail }}</span>
                    </div>
                    <span class="sardo-action-tag" :class="{ 'sardo-action-tag--mild': student.risk !== 'high' }">{{ student.action }}</span>
                  </div>
                </div>
                <div v-else class="demo-empty-state">No retention alerts are available in the database.</div>

                <div class="sardo-footer-note">
                  <span class="info-circle">i</span>
                  <span>Early alerts trigger automatically when 3 consecutive or 5 cumulative absences occur in a calendar month.</span>
                </div>
              </div>

              <!-- Console Bottom Telemetry -->
              <div class="console-card-footer">
                <div class="footer-profile">
                  <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="footer-avatar-img" />
                  <div>
                    <strong>{{ activeSchool?.name || 'School not configured' }}</strong>
                    <small v-if="activeSchool?.school_id">DepEd School ID: {{ activeSchool.school_id }} · Active Campus Node</small>
                    <small v-else>School details are configured by the administrator</small>
                  </div>
                </div>
                <div class="footer-tags">
                  <span class="badge-tag">DepEd Form 2</span>
                  <span class="badge-tag badge-tag--active">Synchronized</span>
                </div>
              </div>
            </div>

            <!-- Floating Telemetry Badges -->
            <div class="hero-float-card hero-float-card--top">
              <span class="hero-float-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <div>
                <strong>SF2 Auto-Calculated</strong>
                <small>Zero manual math errors</small>
              </div>
            </div>

            <div class="hero-float-card hero-float-card--bottom">
              <span class="hero-float-icon hero-float-icon--shield">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span>
              <div>
                <strong>Institutional Privacy</strong>
                <small>RA 10173 DPA Compliant</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Institutional Trust Ribbon -->
      <section class="trust-ribbon">
        <div class="trust-ribbon-inner">
          <span class="trust-lead">STANDARDIZED OPERATIONAL EXCELLENCE FOR PHILIPPINE SCHOOLS</span>
          <div class="trust-items">
            <div class="trust-badge">
              <span class="trust-badge-dot"></span>
              <span>DepEd Order No. 8, s. 2015 Compliant</span>
            </div>
            <div class="trust-badge">
              <span class="trust-badge-dot"></span>
              <span>Data Privacy Act of 2012 (RA 10173)</span>
            </div>
            <div class="trust-badge">
              <span class="trust-badge-dot"></span>
              <span>Standard Excel SF2 &amp; SF4 Exports</span>
            </div>
            <div class="trust-badge">
              <span class="trust-badge-dot"></span>
              <span>Role-Isolated School Security</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Bento Core Platform Features -->
      <section id="features" class="landing-section">
        <div class="landing-section-heading">
          <span class="landing-section-kicker">Core Operating Platform</span>
          <h2>Everything essential. Built specifically for Philippine schools.</h2>
          <p>
            ElyTrack eliminates paper pass-around slips and fragile spreadsheets, delivering an institutional-grade attendance and compliance engine.
          </p>
        </div>

        <div class="bento-grid">
          <!-- Bento Card 1: Period Matrix (Wide) -->
          <article class="bento-card bento-card--featured">
            <div class="bento-card-top">
              <div class="bento-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <span class="bento-tag">Classroom Operations</span>
            </div>
            <div class="bento-card-content">
              <h3>Period-by-Period Precision</h3>
              <p>
                Record attendance across morning and afternoon instructional blocks in seconds. Full support for official DepEd codes including Entered, Tardy, Excused Absence, Medical Suspension, and Uniform infractions.
              </p>
              <div class="bento-preview-chips">
                <span class="chip chip--e">E · Entered</span>
                <span class="chip chip--t">T · Tardy</span>
                <span class="chip chip--a">A · Absent</span>
                <span class="chip chip--nipu">NIPU · Uniform</span>
              </div>
            </div>
          </article>

          <!-- Bento Card 2: DepEd SF2 Compliance -->
          <article class="bento-card">
            <div class="bento-card-top">
              <div class="bento-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M8 7h8M8 11h8" />
                </svg>
              </div>
              <span class="bento-tag">Standardized</span>
            </div>
            <div class="bento-card-content">
              <h3>Automated Monthly SF2</h3>
              <p>
                Daily attendance records flow directly into the official DepEd Form 2 monthly table. ADA, attendance percentages, and monthly summaries compute with 100% mathematical accuracy.
              </p>
            </div>
          </article>

          <!-- Bento Card 3: SARDO Early Warning -->
          <article class="bento-card">
            <div class="bento-card-top">
              <div class="bento-icon bento-icon--radar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span class="bento-tag bento-tag--teal">Retention Radar</span>
            </div>
            <div class="bento-card-content">
              <h3>SARDO Early Alerts</h3>
              <p>
                Detect student absenteeism patterns and consecutive unexcused marks before dropout thresholds are reached. Empower counselors and advisers to deploy timely home visits.
              </p>
            </div>
          </article>

          <!-- Bento Card 4: Governance & Security (Wide) -->
          <article class="bento-card bento-card--featured">
            <div class="bento-card-top">
              <div class="bento-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m2 7 10-5 10 5-10 5L2 7Z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>
                </svg>
              </div>
              <span class="bento-tag">Governance</span>
            </div>
            <div class="bento-card-content">
              <h3>Role-Isolated Security &amp; Audit Telemetry</h3>
              <p>
                Built for individual schools and division-wide networks. Features dedicated permissions for Teachers, School Administrators, and Superadmins with complete operational audit logging.
              </p>
            </div>
          </article>
        </div>
      </section>

      <!-- Interactive Time & Overtime Calculator -->
      <section id="calculator" class="landing-section landing-calc-section">
        <div class="calc-card">
          <div class="calc-header">
            <span class="landing-section-kicker">Operational ROI Estimator</span>
            <h2>Calculate your school's faculty hours saved.</h2>
            <p>See how much overtime your teachers and school administrators recover every month by replacing manual paper tallies and fragile spreadsheets.</p>
          </div>

          <div class="calc-interactive-grid">
            <div class="calc-controls">
              <div class="calc-control-group">
                <div class="control-label-row">
                  <label for="sections-slider">Number of Advisory Sections</label>
                  <span class="control-value-pill">{{ sectionCount }} Sections</span>
                </div>
                <input
                  id="sections-slider"
                  type="range"
                  min="5"
                  max="75"
                  step="1"
                  v-model.number="sectionCount"
                  class="calc-slider"
                />
                <div class="slider-ticks">
                  <span>5 sections</span>
                  <span>35 sections</span>
                  <span>75 sections</span>
                </div>
              </div>

              <div class="calc-breakdown-box">
                <div class="calc-breakdown-row">
                  <span>Manual roll call &amp; pass-around tallying:</span>
                  <strong>{{ sectionCount * 12 }} hrs / mo</strong>
                </div>
                <div class="calc-breakdown-row">
                  <span>Month-end SF2 manual math &amp; verification:</span>
                  <strong>{{ sectionCount * 6 }} hrs / mo</strong>
                </div>
                <div class="calc-breakdown-row calc-breakdown-row--highlight">
                  <span>Time with ElyTrack automated engine:</span>
                  <strong>&lt; {{ Math.round(sectionCount * 0.8) }} hrs / mo</strong>
                </div>
              </div>
            </div>

            <div class="calc-result-display">
              <span class="result-badge">Monthly Faculty Savings</span>
              <div class="result-number-row">
                <span class="result-num">{{ hoursSavedMonthly }}</span>
                <span class="result-unit">Hours Saved / mo</span>
              </div>
              <p class="result-desc">
                That is <strong>{{ Math.round(hoursSavedMonthly / 8) }} workdays</strong> of faculty energy redirected back to instructional planning and student mentoring each month.
              </p>
              <button type="button" class="landing-primary-btn calc-cta-btn" @click="scrollToSection('pricing')">
                <span>Deploy ElyTrack for Your School</span>
                <span class="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- DepEd SF2 Comparison Section -->
      <section id="sf2" class="landing-section landing-compare-section">
        <div class="landing-section-heading">
          <span class="landing-section-kicker">Modernization Analysis</span>
          <h2>The end of broken spreadsheet formulas.</h2>
          <p>
            Traditional DepEd SF2 tracking relies on complex Excel templates prone to accidental formula overwrites, missing student rows, and tedious month-end tallying.
          </p>
        </div>

        <div class="comparison-grid">
          <div class="comparison-col comparison-col--old">
            <div class="compare-header">
              <span class="compare-badge">Legacy Process</span>
              <h3>Manual Excel &amp; Paper Slips</h3>
            </div>
            <ul class="compare-list">
              <li>
                <span class="compare-cross">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
                <div>
                  <strong>Fragile cell formulas</strong>
                  <p>Accidental edits corrupt ADA and percentage formulas, forcing manual recalculation.</p>
                </div>
              </li>
              <li>
                <span class="compare-cross">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
                <div>
                  <strong>Month-end crunch stress</strong>
                  <p>Advisers spend hours tallying tick marks across paper registers at the end of every month.</p>
                </div>
              </li>
              <li>
                <span class="compare-cross">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
                <div>
                  <strong>Delayed dropout signals</strong>
                  <p>Absenteeism patterns are frequently discovered only when the student has already dropped out.</p>
                </div>
              </li>
              <li>
                <span class="compare-cross">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
                <div>
                  <strong>No audit accountability</strong>
                  <p>Files pass across flash drives with zero change telemetry, audit logs, or version control.</p>
                </div>
              </li>
            </ul>
          </div>

          <div class="comparison-col comparison-col--new">
            <div class="compare-header">
              <span class="compare-badge compare-badge--highlight">ElyTrack Solution</span>
              <h3>Automated DepEd Operations</h3>
            </div>
            <ul class="compare-list">
              <li>
                <span class="compare-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <div>
                  <strong>Guaranteed mathematical accuracy</strong>
                  <p>DepEd SF2 formulas are locked into the database engine with 100% calculation consistency.</p>
                </div>
              </li>
              <li>
                <span class="compare-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <div>
                  <strong>1-Click Excel SF2 generation</strong>
                  <p>Generate compliant, formatted DepEd SF2 workbooks instantly at any time of the month.</p>
                </div>
              </li>
              <li>
                <span class="compare-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <div>
                  <strong>Proactive SARDO early alerts</strong>
                  <p>Automatic early warning radar identifies attendance deterioration early in the month.</p>
                </div>
              </li>
              <li>
                <span class="compare-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <div>
                  <strong>Role-based data security</strong>
                  <p>Every attendance submission, modification, and export is audited and securely backed up.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Institutional Process & Operating Architecture -->
      <section id="process" class="landing-process-section">
        <span id="workflow" class="anchor-target" aria-hidden="true"></span>
        <div class="landing-section">
          <div class="landing-section-heading">
            <span class="landing-section-kicker">Standardized Architecture</span>
            <h2>How ElyTrack Works: From Licensing to Division Submission</h2>
            <p>
              A verified, end-to-end operational framework built specifically for Philippine school heads, registrars, and advisory teachers.
            </p>

            <!-- Process Mode Switcher -->
            <div class="process-tab-switcher">
              <button
                type="button"
                class="process-tab-btn"
                :class="{ 'is-active': activeProcessTab === 'implementation' }"
                @click="activeProcessTab = 'implementation'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Institutional Implementation Lifecycle</span>
              </button>
              <button
                type="button"
                class="process-tab-btn"
                :class="{ 'is-active': activeProcessTab === 'cadence' }"
                @click="activeProcessTab = 'cadence'"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Daily Classroom &amp; Reporting Cadence</span>
              </button>
            </div>
          </div>

          <!-- TAB A: Institutional Implementation Lifecycle -->
          <div v-if="activeProcessTab === 'implementation'" class="process-lifecycle-grid">
            <div
              v-for="item in onboardingSteps"
              :key="item.step"
              class="process-lifecycle-card"
            >
              <div class="plc-header">
                <span class="plc-step-badge">{{ item.step }}</span>
                <span class="plc-phase-tag">{{ item.phase }}</span>
              </div>
              <h3 class="plc-title">{{ item.title }}</h3>
              <p class="plc-desc">{{ item.desc }}</p>
              <div class="plc-footer">
                <span class="plc-indicator-dot"></span>
                <span class="plc-indicator-text">{{ item.deliverable }}</span>
              </div>
            </div>
          </div>

          <!-- TAB B: Daily Classroom & Reporting Cadence -->
          <div v-else class="process-cadence-timeline">
            <div
              v-for="(item, idx) in dailyCadenceSteps"
              :key="item.time"
              class="cadence-timeline-item"
            >
              <div class="cadence-time-col">
                <span class="cadence-time-pill">{{ item.time }}</span>
                <span class="cadence-timeline-line" v-if="idx < dailyCadenceSteps.length - 1"></span>
              </div>
              <div class="cadence-card">
                <div class="cadence-card-head">
                  <span class="cadence-role-tag">{{ item.role }}</span>
                  <h4>{{ item.title }}</h4>
                </div>
                <p>{{ item.desc }}</p>
                <div class="cadence-card-highlight">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{{ item.guarantee }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Process Bottom Action Banner -->
          <div class="process-cta-banner">
            <div class="process-cta-text">
              <strong>Ready to modernize your school attendance infrastructure?</strong>
              <p>DepEd Order No. 8, s. 2015 certified calculations. Deployed and active in minutes.</p>
            </div>
            <div class="process-cta-actions">
              <router-link to="/login" class="landing-primary-btn">
                <span>Sign In to School Workspace</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </router-link>
              <button type="button" class="landing-secondary-btn" @click="scrollToSection('pricing')">
                <span>View Institutional Plans</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Formal Institutional Pricing & Licensing Matrix -->
      <section id="pricing" class="landing-pricing-section">
        <div class="landing-section">
          <div class="landing-section-heading landing-pricing-heading">
            <span class="landing-section-kicker">Institutional Investment</span>
            <h2>Predictable, transparent licensing for Philippine schools.</h2>
            <p>
              Database-backed school licenses with role isolation, DepEd Form 2 certification, and strict RA 10173 data privacy. No hidden setup fees or surprise charges.
            </p>

            <!-- Billing Toggle -->
            <div class="pricing-toggle-wrapper">
              <div class="pricing-toggle">
                <button
                  type="button"
                  class="pricing-toggle-btn"
                  :class="{ 'is-active': billingCycle === 'monthly' }"
                  @click="billingCycle = 'monthly'"
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  class="pricing-toggle-btn"
                  :class="{ 'is-active': billingCycle === 'annual' }"
                  @click="billingCycle = 'annual'"
                >
                  <span>Annual Institutional Term</span>
                  <span class="pricing-save-pill">2 Months Free</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Pricing Cards Grid -->
          <div class="pricing-grid">
            <div
              v-for="plan in formattedPlans"
              :key="plan.id"
              class="pricing-card"
              :class="{ 'pricing-card--featured': plan.is_featured }"
            >
              <div v-if="plan.is_featured && plan.badge" class="featured-ribbon">{{ plan.badge }}</div>

              <div class="pricing-card-header">
                <div class="tier-tag-row">
                  <span class="pricing-tier-tag" :class="{ 'pricing-tier-tag--featured': plan.is_featured }">{{ plan.tag }}</span>
                  <span v-if="plan.trial_days" class="trial-tag">{{ plan.trial_days }}-Day Evaluation Available</span>
                </div>
                <h3>{{ plan.name }}</h3>
                <p class="pricing-desc">{{ plan.description }}</p>
              </div>

              <div class="pricing-price-box">
                <div class="pricing-amount-row">
                  <span class="pricing-currency">₱</span>
                  <span class="pricing-number">
                    {{ billingCycle === 'annual' ? Number(plan.price_annual_monthly || 0).toLocaleString() : Number(plan.price_monthly || 0).toLocaleString() }}
                  </span>
                  <span class="pricing-per-month">/ month</span>
                </div>
                <span class="pricing-interval">
                  {{
                    billingCycle === 'annual'
                      ? `Billed ₱${Number(plan.billing_annual_total || 0).toLocaleString()} annually (${plan.billing_months || 10}-month academic term)`
                      : 'Billed monthly'
                  }}
                </span>
              </div>

              <a
                v-if="Number(plan.trial_days || 0) <= 0 && plan.cta_url && plan.cta_url.startsWith('mailto:')"
                :href="plan.cta_url"
                class="pricing-cta-btn"
                :class="plan.is_featured ? 'pricing-cta--primary' : 'pricing-cta--secondary'"
              >
                <span>{{ plan.cta_text || 'Inquire for Division SLA' }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </a>
              <router-link
                v-else
                :to="planCta(plan)"
                class="pricing-cta-btn"
                :class="plan.is_featured ? 'pricing-cta--primary' : 'pricing-cta--secondary'"
              >
                <span>{{ plan.cta_text || (Number(plan.trial_days || 0) > 0 ? 'Evaluate ' + plan.name : 'Request License') }}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </router-link>

              <button
                type="button"
                class="pricing-pay-shortcut"
                @click="scrollToSection('payments')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <span>Official Payment Options &amp; QR</span>
              </button>

              <div class="pricing-features">
                <span class="features-label">Included in {{ plan.name }}:</span>
                <ul>
                  <li v-for="(feat, fIdx) in plan.features" :key="fIdx">
                    <span class="check-icon" :class="{ 'check-icon--featured': plan.is_featured }">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                    <span>{{ feat }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Formal Institutional Capability Comparison Matrix Table -->
          <div class="pricing-matrix-wrap">
            <div class="pricing-matrix-header">
              <span class="landing-section-kicker">Comprehensive Capability Matrix</span>
              <h3>Compare institutional license tiers side-by-side.</h3>
              <p>Clear line-by-line comparison of classroom capacity, DepEd Form 2 automation, security controls, and procurement readiness.</p>
            </div>

            <div class="matrix-table-container">
              <table class="matrix-table">
                <thead>
                  <tr>
                    <th class="matrix-col-feature">Platform Capability</th>
                    <th class="matrix-col-tier">Adviser License<br /><small>₱249 / mo</small></th>
                    <th class="matrix-col-tier matrix-col-tier--featured">School Campus Pro<br /><small>₱1,490 / mo</small></th>
                    <th class="matrix-col-tier">Division Enterprise<br /><small>₱4,990 / mo</small></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="catGroup in matrixCategories" :key="catGroup.category">
                    <tr class="matrix-category-row">
                      <td colspan="4">{{ catGroup.category }}</td>
                    </tr>
                    <tr
                      v-for="row in catGroup.items"
                      :key="row.name"
                      class="matrix-data-row"
                    >
                      <td class="matrix-cell-feature">
                        <strong>{{ row.name }}</strong>
                        <small v-if="row.desc">{{ row.desc }}</small>
                      </td>
                      <td class="matrix-cell-val">
                        <span v-if="typeof row.adviser === 'boolean'">
                          <svg v-if="row.adviser" class="matrix-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                          <svg v-else class="matrix-dash" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </span>
                        <span v-else class="matrix-text-val">{{ row.adviser }}</span>
                      </td>
                      <td class="matrix-cell-val matrix-cell-val--featured">
                        <span v-if="typeof row.campus === 'boolean'">
                          <svg v-if="row.campus" class="matrix-check matrix-check--teal" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                          <svg v-else class="matrix-dash" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </span>
                        <span v-else class="matrix-text-val matrix-text-val--featured">{{ row.campus }}</span>
                      </td>
                      <td class="matrix-cell-val">
                        <span v-if="typeof row.division === 'boolean'">
                          <svg v-if="row.division" class="matrix-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                          <svg v-else class="matrix-dash" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </span>
                        <span v-else class="matrix-text-val">{{ row.division }}</span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Trust & Compliance Guarantee -->
          <div class="pricing-trust-row">
            <div class="pricing-trust-item">
              <span class="trust-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </span>
              <div>
                <strong>DepEd Order No. 8, s. 2015</strong>
                <p>Fully certified calculation engine matching official SF2 definitions and formats.</p>
              </div>
            </div>
            <div class="pricing-trust-item">
              <span class="trust-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <div>
                <strong>Data Privacy Act (RA 10173)</strong>
                <p>Strict confidentiality safeguards ensuring student attendance records remain private.</p>
              </div>
            </div>
            <div class="pricing-trust-item">
              <span class="trust-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5 3.5-3.5 2-2z"></path>
                  <path d="M15.5 7.5l-3 3"></path>
                  <circle cx="7.5" cy="16.5" r="5.5"></circle>
                </svg>
              </span>
              <div>
                <strong>Database-Backed Licenses</strong>
                <p>Every school is tied to a secure license record. Access locks automatically if suspended.</p>
              </div>
            </div>
            <div class="pricing-trust-item">
              <span class="trust-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <div>
                <strong>Official Receipts &amp; Invoicing</strong>
                <p>Government procurement ready: official receipts, purchase order documentation, and billing support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Official Payment Channels & QR Section -->
      <section id="payments" class="landing-payments-section">
        <div class="landing-section">
          <div class="landing-section-heading">
            <span class="landing-section-kicker">Payment Verification</span>
            <h2>Official Payment Channels &amp; Instant QR Codes</h2>
            <p>
              Direct settlement via GCash, Maya, QR Ph, and direct Philippine bank transfer. Scan or copy the credentials below to initiate your school deployment.
            </p>
          </div>

          <div class="landing-payment-grid">
            <div
              v-for="pm in paymentMethods"
              :key="pm.id"
              class="landing-payment-card"
            >
              <div class="lpc-header">
                <div class="lpc-badge-row">
                  <span class="lpc-type-badge">{{ formatPaymentType(pm.type) }}</span>
                  <span v-if="pm.qr_image_url" class="lpc-qr-available-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    QR Ready
                  </span>
                </div>
                <h3 class="lpc-bank-name">{{ pm.bank_name }}</h3>
              </div>

              <div class="lpc-body">
                <div v-if="pm.qr_image_url" class="lpc-qr-box">
                  <div class="lpc-qr-thumb-wrap" @click="openQrModal(pm)" title="Click to enlarge QR code">
                    <img :src="pm.qr_image_url" :alt="pm.bank_name + ' QR'" class="lpc-qr-thumb" />
                    <div class="lpc-qr-hover-overlay">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                      </svg>
                      <span>Enlarge QR</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="lpc-qr-btn"
                    @click="openQrModal(pm)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="11" y1="8" x2="11" y2="14"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    <span>Click to Enlarge &amp; Scan QR</span>
                  </button>
                </div>

                <div class="lpc-fields">
                  <div class="lpc-field">
                    <span class="lpc-field-label">Account Name</span>
                    <strong class="lpc-field-value">{{ pm.account_name || 'Not configured' }}</strong>
                  </div>

                  <div class="lpc-field">
                    <span class="lpc-field-label">Account / Mobile Number</span>
                    <div class="lpc-acc-row">
                      <code class="lpc-acc-num">{{ pm.account_number }}</code>
                      <button
                        type="button"
                        class="lpc-copy-btn"
                        @click="copyLandingAccount(pm)"
                        :title="'Copy ' + pm.account_number"
                      >
                        <svg v-if="copiedPaymentId !== pm.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>{{ copiedPaymentId === pm.id ? 'Copied!' : 'Copy' }}</span>
                      </button>
                    </div>
                  </div>

                  <div v-if="pm.instructions" class="lpc-instructions">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>{{ pm.instructions }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Submission Notice Banner -->
          <div class="landing-payment-notice">
            <div class="lpn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div class="lpn-content">
              <h4>Proof of Payment &amp; Instant Provisioning</h4>
              <p>
                After completing your payment, send your deposit slip, reference number, or transaction screenshot to
                <a href="mailto:ely.ashzyl@gmail.com?subject=ElyTrack%20Payment%20Reference" class="lpn-link">ely.ashzyl@gmail.com</a>
                or message us via the support chat in the bottom right corner. School licenses are activated immediately upon reference verification.
              </p>
            </div>
            <div class="lpn-action">
              <a href="mailto:ely.ashzyl@gmail.com?subject=ElyTrack%20Payment%20Reference" class="lpn-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>Send Reference via Email</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Frequently Asked Questions Section -->
      <section id="faq" class="landing-section landing-faq-section">
        <div class="landing-section-heading">
          <span class="landing-section-kicker">Frequently Asked Questions</span>
          <h2>Got questions? We have answers.</h2>
          <p>Everything you need to know about ElyTrack licensing, DepEd compliance, and institutional deployment.</p>
        </div>

        <div class="faq-grid">
          <div
            v-for="(item, idx) in faqItems"
            :key="idx"
            class="faq-card"
            :class="{ 'is-open': activeFaq === idx }"
            @click="toggleFaq(idx)"
          >
            <div class="faq-question">
              <strong>{{ item.q }}</strong>
              <span class="faq-toggle-icon">{{ activeFaq === idx ? '−' : '+' }}</span>
            </div>
            <p v-if="activeFaq === idx" class="faq-answer">
              {{ item.a }}
            </p>
          </div>
        </div>
      </section>

      <!-- Statement CTA Section -->
      <section class="landing-cta-section">
        <div class="landing-cta-card">
          <div class="cta-copy">
            <span class="landing-section-kicker">Institutional Deployment</span>
            <h2>Ready to bring calm, verified attendance to your school?</h2>
            <p>
              Sign in with your authorized school credentials, or contact our school deployment team to set up an active campus license.
            </p>
          </div>
          <div class="cta-actions">
            <router-link to="/login" class="landing-primary-btn landing-primary-btn--light">
              <span>Sign In to ElyTrack</span>
              <span>→</span>
            </router-link>
            <a href="mailto:ely.ashzyl@gmail.com" class="landing-secondary-btn cta-contact-btn">
              <span>Contact Deployment</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="landing-brand-logo landing-brand-logo--small" />
          <span>
            <strong>ElyTrack</strong>
            <small>Institutional School Operations</small>
          </span>
        </div>

        <div class="footer-links">
          <button type="button" class="footer-link-btn" @click="scrollToSection('demo')">Demo Console</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('features')">Platform</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('process')">Process &amp; Cadence</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('sf2')">DepEd SF2</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('calculator')">Time Saved</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('pricing')">Licensing &amp; Pricing</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('payments')">Payments &amp; QR</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('faq')">FAQ</button>
          <router-link to="/login">Sign In</router-link>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; {{ currentYear }} ElyTrack. Built for Philippine Schools. DepEd SF2 Verified.</span>
        <span>Confidential &amp; Verified Institutional Operations</span>
      </div>
    </footer>

    <!-- Enlarged QR Code Modal -->
    <div
      v-if="showQrModal && selectedQrMethod"
      class="landing-qr-overlay"
      @click.self="closeQrModal"
      role="dialog"
      aria-modal="true"
      :aria-label="selectedQrMethod.bank_name || 'Official Payment QR'"
    >
      <div class="landing-qr-modal">
        <button
          type="button"
          class="landing-qr-close"
          @click="closeQrModal"
          aria-label="Close QR Modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="lqm-header">
          <span class="lqm-badge">{{ formatPaymentType(selectedQrMethod.type) }}</span>
          <h3 class="lqm-title">{{ selectedQrMethod.bank_name }}</h3>
          <p class="lqm-subtitle">Scan via mobile banking app or e-wallet to settle payment</p>
        </div>

        <div class="lqm-qr-wrapper">
          <img
            :src="selectedQrMethod.qr_image_url"
            :alt="selectedQrMethod.bank_name + ' QR Code'"
            class="lqm-qr-img"
          />
        </div>

        <div class="lqm-details">
          <div class="lqm-detail-row">
            <span class="lqm-detail-label">Account Name:</span>
            <span class="lqm-detail-val">{{ selectedQrMethod.account_name || 'Not configured' }}</span>
          </div>
          <div class="lqm-detail-row">
            <span class="lqm-detail-label">Account Number:</span>
            <div class="lqm-copy-group">
              <span class="lqm-detail-val font-mono">{{ selectedQrMethod.account_number }}</span>
              <button
                type="button"
                class="lqm-copy-btn"
                @click="copyLandingAccount(selectedQrMethod)"
              >
                <svg v-if="copiedPaymentId !== selectedQrMethod.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{{ copiedPaymentId === selectedQrMethod.id ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
          </div>
          <p v-if="selectedQrMethod.instructions" class="lqm-instructions">
            {{ selectedQrMethod.instructions }}
          </p>
        </div>

        <div class="lqm-footer">
          <a
            :href="'mailto:ely.ashzyl@gmail.com?subject=' + encodeURIComponent('ElyTrack Payment Reference - ' + selectedQrMethod.bank_name)"
            class="lqm-action-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Email Payment Receipt</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const currentYear = new Date().getFullYear()
const billingCycle = ref('annual')
const activeDemoTab = ref('rollcall')
const activeProcessTab = ref('implementation')
const mobileNavOpen = ref(false)
const sectionCount = ref(0)
const activeFaq = ref(0)
// Pricing plans and payment channels are database-backed. Empty database
// results remain empty so deleted or unconfigured records never reappear.
const paymentMethods = ref([])
const copiedPaymentId = ref(null)
const showQrModal = ref(false)
const selectedQrMethod = ref(null)

const plans = ref([])
const activeSchool = ref(null)
const landingStats = ref({
  totalStudents: 0,
  maleStudents: 0,
  femaleStudents: 0,
  averageDailyAttendance: 0,
  attendanceRate: 0,
  schoolDays: 0,
  atRiskStudents: 0,
  retentionLabel: 'No attendance records',
  monthLabel: ''
})
const demoStudents = ref([])
const riskStudents = ref([])

const previewContextLabel = computed(() => {
  const student = demoStudents.value[0]
  if (!student?.grade && !student?.section) return 'DATABASE ATTENDANCE PREVIEW'
  return `${student.grade || 'GRADE'} · ${student.section || 'SECTION'} · ADVISORY`
})

let landingPaymentPollInterval = null

onMounted(async () => {
  await loadLandingData()
  landingPaymentPollInterval = setInterval(() => {
    void loadPublicPaymentMethods()
  }, 6000)
})

onUnmounted(() => {
  if (landingPaymentPollInterval) clearInterval(landingPaymentPollInterval)
})

async function loadPublicPaymentMethods() {
  try {
    const res = await fetch(`/api/payment-methods?_ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    })
    if (!res.ok) throw new Error(`Payment methods request failed (${res.status})`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Invalid payment methods response')
    paymentMethods.value = data
  } catch (err) {
    console.error('Failed to refresh public payment methods:', err)
  }
}

async function loadLandingData() {
  try {
    const res = await fetch('/api/licenses/landing-data')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.plans) && data.plans.length > 0) {
        plans.value = data.plans.map(p => ({
          ...p,
          features: Array.isArray(p.features)
            ? p.features
            : (typeof p.features === 'string' ? JSON.parse(p.features || '[]') : [])
        }))
      }
      if (data.school) {
        activeSchool.value = data.school
      }
      if (data.stats) {
        sectionCount.value = Number(data.stats.totalSections || 0)
        landingStats.value = {
          ...landingStats.value,
          ...data.stats,
          monthLabel: data.stats.monthLabel || ''
        }
      }
      demoStudents.value = Array.isArray(data.previewStudents) ? data.previewStudents.map(st => ({
        ...st,
        status: st.status || 'Present',
        am1: st.am1 || 'E',
        am2: st.am2 || 'E',
        am3: st.am3 || 'E',
        am4: st.am4 || 'E'
      })) : []
      riskStudents.value = Array.isArray(data.riskStudents) ? data.riskStudents : []
      if (Array.isArray(data.paymentMethods)) {
        // Assign [] as well: deleted/inactive payment methods must disappear.
        paymentMethods.value = data.paymentMethods
      } else {
        await loadPublicPaymentMethods()
      }
    }
  } catch (err) {
    console.error('Failed to load dynamic landing data:', err)
  }
}

function toggleStudentStatus(index) {
  const st = demoStudents.value[index]
  if (st.status === 'Present') {
    st.status = 'Absent'
    st.am1 = 'A'
    st.am2 = 'A'
    st.am3 = 'A'
    st.am4 = 'A'
  } else {
    st.status = 'Present'
    st.am1 = 'E'
    st.am2 = 'E'
    st.am3 = 'E'
    st.am4 = 'E'
  }
}

const calculatedAttendanceRate = computed(() => {
  if (!demoStudents.value.length) return 0
  const presentCount = demoStudents.value.filter(s => s.status === 'Present').length
  return Math.round((presentCount / demoStudents.value.length) * 100)
})

const hoursSavedMonthly = computed(() => {
  // Average 18 hours per section manual tallying and month-end SF2 crunch
  // ElyTrack reduces this to under 1 hour per section per month
  return Math.round(sectionCount.value * 17.2)
})

const defaultPlans = [
  {
    id: 'adviser',
    tier: 'adviser',
    name: 'Adviser License',
    tag: 'Individual Advisory Class',
    description: 'Designed for single section advisers to record classroom attendance, prevent SARDO risks, and generate certified monthly SF2.',
    price_monthly: 249,
    price_annual_monthly: 199,
    billing_annual_total: 1990,
    billing_months: 10,
    trial_days: 14,
    is_featured: false,
    badge: '14-Day Free Evaluation Available',
    features: [
      '1 Advisory Class (Up to 65 Learners)',
      'Automated DepEd SF2 (.xlsx) Export',
      'Period-by-period roll call under 90s',
      'SARDO absenteeism warning alerts',
      'Guardian contact & intervention logs',
      'Desktop and mobile responsive web access'
    ]
  },
  {
    id: 'campus',
    tier: 'campus',
    name: 'School Campus Pro',
    tag: 'Whole School Campus',
    description: 'Complete operational attendance management for Elementary, JHS, or SHS campuses with full school head administrative controls.',
    price_monthly: 1490,
    price_annual_monthly: 1190,
    billing_annual_total: 11900,
    billing_months: 10,
    trial_days: 14,
    is_featured: true,
    badge: 'Official DepEd School Choice',
    features: [
      'Unlimited Teachers & Advisory Classes',
      'Up to 1,500 Enrolled Learners',
      'Principal Telemetry & Audit Logs',
      '48-Hour Cutoff Locks & Relock Safeguards',
      'Bulk Student LRN CSV Import & Validation',
      'Cross-School Transfer In/Out Tracking',
      'School Calendar & Holiday Synchronization',
      'Database License Key with Instant Access Locks'
    ]
  },
  {
    id: 'division',
    tier: 'division',
    name: 'Division & Multi-Campus',
    tag: 'Multi-School Network',
    description: 'Tailored for DepEd Schools Division Offices, private school systems, and multi-campus clusters requiring consolidated oversight.',
    price_monthly: 4990,
    price_annual_monthly: 3990,
    billing_annual_total: 39900,
    billing_months: 10,
    trial_days: 0,
    is_featured: false,
    badge: 'Division & SDO Ready',
    features: [
      'Multi-Campus Consolidated Analytics',
      'Unlimited Campuses, Faculty & Learners',
      'Cross-School Comparative Section Rankings',
      'Custom DepEd Division Reporting Templates',
      'Dedicated Technical Account Manager & SLA',
      'On-site or Virtual Faculty Onboarding Session'
    ]
  }
]

const formattedPlans = computed(() => {
  if (plans.value && plans.value.length > 0) {
    return plans.value
  }
  return defaultPlans
})

const onboardingSteps = [
  {
    step: '01',
    phase: 'Procurement & Settlement',
    title: 'Select Institutional Plan & Settle via Official Channels',
    desc: 'Choose Adviser, School Campus, or Division license tier. Complete payment through verified GCash, Maya, Landbank, or submit a DepEd Purchase Order.',
    deliverable: 'Official Receipt & Verified License Invoice'
  },
  {
    step: '02',
    phase: 'License Key Issuance',
    title: 'Cryptographic License Key Provisioned in Database',
    desc: 'A secure, unique license record is created. Administrative access unlocks instantly with automated expiration tracking and cutoff protection.',
    deliverable: 'Instant School Head & Registrar Workspace'
  },
  {
    step: '03',
    phase: 'Cohort Onboarding',
    title: 'Ingest Student Roster via Bulk DepEd LRN CSV Import',
    desc: 'School admin uploads the learner masterlist. The system validates 12-digit LRNs, detects duplicates, and assigns learners to grade sections in minutes.',
    deliverable: 'Validated Learner Roster & Section Calendars'
  },
  {
    step: '04',
    phase: 'Faculty Activation',
    title: 'Advisers Sign In to Isolated School Workspace',
    desc: 'Class advisers receive invitations or credentials directly. No public registration is exposed; only verified, licensed school faculty gain access.',
    deliverable: 'Sub-90s Daily Roll Call with Cutoff Protection'
  }
]

const dailyCadenceSteps = [
  {
    time: '07:15 AM',
    role: 'Class Adviser',
    title: 'Morning Advisory Roll Call (< 90s)',
    desc: 'Advisers open their assigned section on any phone or desktop and record attendance with rapid status presets (Entered, Tardy, Absent, NIPU).',
    guarantee: 'Offline caching ensures roll call never drops'
  },
  {
    time: '11:30 AM',
    role: 'Automated Engine',
    title: 'Multi-Period Tardy & Half-Day Aggregation',
    desc: 'The engine processes period marks in real time, automatically flagging tardiness and half-day absences without any manual calculator work.',
    guarantee: '100% DepEd mathematical compliance'
  },
  {
    time: '04:30 PM',
    role: 'Principal & Head',
    title: 'School Head Telemetry & 48-Hour Auto-Relock',
    desc: 'Principals monitor live roll call completion rates. Submitted records lock within 48 hours; any subsequent correction requires administrative audit logging.',
    guarantee: 'Tamper-proof audit history on all changes'
  },
  {
    time: 'Month-End',
    role: 'Registrar & Head',
    title: '1-Click DepEd Form 2 Certified Excel Export',
    desc: 'Generate complete, division-ready DepEd SF2 workbooks with 100% verified mathematical precision matching DepEd Order No. 8, s. 2015.',
    guarantee: 'Standard DepEd Excel template with SHA-256'
  }
]

const matrixCategories = [
  {
    category: 'Institutional Scope & Capacity',
    items: [
      { name: 'Advisory Class Capacity', desc: 'Number of active grade/section advisory classes', adviser: '1 Section', campus: 'Unlimited Sections', division: 'Unlimited Campuses' },
      { name: 'Enrolled Learner Capacity', desc: 'Active student attendance tracking limit', adviser: 'Up to 65 Learners', campus: 'Up to 1,500 Learners', division: 'Unlimited Learners' },
      { name: 'Faculty & Administrative Accounts', desc: 'Role-scoped logins for teachers and school heads', adviser: '1 Adviser Account', campus: 'Unlimited Faculty & Staff', division: 'Unlimited Multi-School' }
    ]
  },
  {
    category: 'DepEd Form 2 Engine & Analytics',
    items: [
      { name: 'Automated SF2 (.xlsx) Export', desc: 'Official DepEd Form 2 workbook generation', adviser: true, campus: true, division: true },
      { name: 'DepEd Order No. 8, s. 2015 Math', desc: 'ADA, attendance % and monthly aggregation rules', adviser: true, campus: true, division: true },
      { name: 'Section Comparison & Ranking', desc: 'Comparative attendance rankings across sections', adviser: false, campus: true, division: true },
      { name: 'Division-Wide Rollup Analytics', desc: 'Consolidated reporting across multiple schools', adviser: false, campus: false, division: true }
    ]
  },
  {
    category: 'Classroom Operations & Reliability',
    items: [
      { name: 'Sub-90s Daily Roll Call', desc: 'Period-by-period marks with rapid status presets', adviser: true, campus: true, division: true },
      { name: 'Offline Classroom Sync', desc: 'Local caching during classroom Wi-Fi dropouts', adviser: true, campus: true, division: true },
      { name: '48-Hour Cutoff Auto-Relock', desc: 'Automatic integrity lock with audit trails', adviser: 'Adviser Level', campus: 'School Head Governed', division: 'Division Governed' }
    ]
  },
  {
    category: 'Student Retention & SARDO Interventions',
    items: [
      { name: 'SARDO Early Warning Radar', desc: 'Automatic alerts at 3 consecutive or 5 cumulative absences', adviser: 'Section Alerts', campus: 'Campus Alert Queue', division: 'Division Risk Matrix' },
      { name: 'Guardian Contact Logs', desc: 'Log phone calls, SMS notifications, and home visits', adviser: true, campus: true, division: true }
    ]
  },
  {
    category: 'Governance, Security & Procurement',
    items: [
      { name: 'Bulk Student LRN CSV Ingestion', desc: 'Bulk import with 12-digit LRN duplicate detection', adviser: false, campus: true, division: true },
      { name: 'Cross-School Transfer Tracking', desc: 'Paired Transfer-Out and Transfer-In historical records', adviser: false, campus: true, division: true },
      { name: 'School Head Dashboard & Telemetry', desc: 'Campus-wide roll call completion monitoring', adviser: false, campus: true, division: true },
      { name: 'Database License Access Control', desc: 'Automatic instant lockout if license is stopped', adviser: true, campus: true, division: true },
      { name: 'Official Receipts & Invoicing', desc: 'BIR registered receipt, PhilGEPS & PO documentation', adviser: true, campus: true, division: true },
      { name: 'Technical Support SLA', desc: 'Dedicated technical response and guidance', adviser: 'Standard Inquiries', campus: 'Priority Inquiries', division: 'Dedicated SLA & Manager' }
    ]
  }
]

const steps = [
  {
    time: '07:15 AM',
    title: 'Morning Advisory Roll Call',
    desc: 'Advisers open their assigned class and record attendance per period in under 90 seconds with rapid status presets.'
  },
  {
    time: '11:30 AM',
    title: 'Automated Half-Day & Tardy Aggregation',
    desc: 'The engine automatically tallies multi-period absences, applying accurate half-day flags without manual math.'
  },
  {
    time: '04:30 PM',
    title: 'Faculty Audit & School Head Verification',
    desc: 'School administrators inspect live campus telemetry, identifying unsubmitted advisory sections instantly.'
  },
  {
    time: 'End of Month',
    title: '1-Click DepEd Form 2 (SF2) Export',
    desc: 'Generate complete, error-free DepEd SF2 Excel workbooks formatted strictly to national DepEd standards.'
  }
]

const faqItems = [
  {
    q: 'Is ElyTrack officially compliant with DepEd Order No. 8, s. 2015?',
    a: 'Yes. ElyTrack adheres strictly to the official DepEd Form 2 guidelines, including standardized calculation rules for Average Daily Attendance (ADA), percentage of attendance for the month, and SARDO tracking.'
  },
  {
    q: 'How does the configured free trial work?',
    a: 'Trial duration, included modules, and account limits are configured in the database for each plan. Select a plan to see its current trial terms before creating a workspace.'
  },
  {
    q: 'Can we export directly into official DepEd Excel spreadsheets?',
    a: 'Yes. ElyTrack generates pre-formatted, DepEd-compliant Excel workbooks (.xlsx) with all formulas, headers, learner names, daily marks, and verified sign-off blocks intact.'
  },
  {
    q: 'What happens if our school license is suspended or expires?',
    a: 'ElyTrack features database-backed license enforcement. If a school license is suspended or expires without renewal, teacher workspaces are locked to prevent unauthorized modifications until the administrator reactivates the license.'
  },
  {
    q: 'How is student data protected under the Philippine Data Privacy Act (RA 10173)?',
    a: 'ElyTrack implements strict role-based access control, encrypted transmission, isolated school data scopes, and comprehensive audit logs for every operational change.'
  },
  {
    q: 'What payment channels and methods does ElyTrack support?',
    a: 'ElyTrack officially accepts GCash, Maya, QR Ph, and direct Philippine bank transfers (BDO, BPI, Landbank, UnionBank). You can view full account details and scan QR codes in the Payments & QR section above. After payment, send the confirmation reference to ely.ashzyl@gmail.com or our live support desk for immediate activation.'
  }
]

function planCta(plan) {
  if (Number(plan?.trial_days || 0) > 0) {
    return `/subscribe?plan=${encodeURIComponent(plan.tier || plan.id)}`
  }
  return plan?.cta_url || '/login'
}

function formatPaymentType(type) {
  switch (type) {
    case 'gcash_qr': return 'GCash'
    case 'maya_qr': return 'Maya'
    case 'qr_ph': return 'QR Ph'
    case 'bank_transfer': return 'Bank Transfer'
    case 'other': return 'Other'
    default: return 'Payment Channel'
  }
}

async function copyLandingAccount(pm) {
  if (!pm?.account_number) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(pm.account_number)
    } else {
      const input = document.createElement('input')
      input.value = pm.account_number
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    copiedPaymentId.value = pm.id
    setTimeout(() => {
      if (copiedPaymentId.value === pm.id) {
        copiedPaymentId.value = null
      }
    }, 2500)
  } catch (err) {
    console.error('Failed to copy account number:', err)
  }
}

function openQrModal(pm) {
  if (!pm?.qr_image_url) return
  selectedQrMethod.value = pm
  showQrModal.value = true
}

function closeQrModal() {
  showQrModal.value = false
  selectedQrMethod.value = null
}

function toggleFaq(idx) {
  activeFaq.value = activeFaq.value === idx ? -1 : idx
}

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

function handleMobileNav(id) {
  mobileNavOpen.value = false
  scrollToSection(id)
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: #ffffff;
  color: #080d0c;
  overflow-x: clip;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

/* ==========================================================================
   TARGET SECTIONS SCROLL ANCHORING
   ========================================================================== */
#demo,
#features,
#process,
#workflow,
#calculator,
#sf2,
#pricing,
#payments,
#faq {
  scroll-margin-top: 84px;
}

/* ==========================================================================
   NAVIGATION
   ========================================================================== */
.landing-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1000;
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 20px rgba(8, 13, 12, 0.03);
}

.landing-nav-inner {
  max-width: 1240px;
  min-height: 72px;
  padding: 0 32px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.landing-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #080d0c;
  text-decoration: none;
}

.landing-brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 14px rgba(12, 83, 87, 0.22);
}

.landing-brand-logo--small {
  width: 32px;
  height: 32px;
}

.landing-brand-text {
  display: flex;
  flex-direction: column;
}

.landing-brand-text strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.landing-brand-text small {
  color: #506160;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.landing-nav-links {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.4vw, 22px);
}

.landing-nav-link {
  color: #506160;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 4px;
  touch-action: manipulation;
  transition: color 0.1s ease;
}

.landing-nav-link:hover {
  color: #0c5357;
}

.landing-nav-link:active {
  color: #080d0c;
}

.landing-nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.landing-sign-in {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  background: #080d0c;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.12s ease, transform 0.1s ease, box-shadow 0.12s ease;
  box-shadow: 0 3px 10px rgba(8, 13, 12, 0.15);
}

.landing-sign-in:hover {
  background: #0c5357;
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(12, 83, 87, 0.25);
}

.landing-sign-in:active {
  transform: scale(0.97) !important;
}

.sign-in-arrow {
  font-size: 0.95em;
  transition: transform 0.15s ease;
}

.landing-sign-in:hover .sign-in-arrow {
  transform: translateX(3px);
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: 1px solid rgba(12, 83, 87, 0.15);
  border-radius: 8px;
  padding: 6px;
  color: #080d0c;
  cursor: pointer;
}

/* Mobile Dropdown Panel */
.mobile-nav-panel {
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
  background: #ffffff;
  border-bottom: 1px solid rgba(12, 83, 87, 0.15);
  gap: 8px;
  box-shadow: 0 12px 30px rgba(8, 13, 12, 0.08);
}

.mobile-nav-item {
  text-align: left;
  padding: 10px 12px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #080d0c;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.mobile-nav-item:hover {
  background: #f4f8f8;
  color: #0c5357;
}

.mobile-sign-in-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 12px 16px;
  background: #080d0c;
  color: #ffffff;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
}

/* ==========================================================================
   HERO SECTION
   ========================================================================== */
.landing-hero {
  position: relative;
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
  background: linear-gradient(180deg, #ffffff 0%, #f4f8f8 100%);
  overflow: hidden;
}

.landing-hero-backdrop {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(12, 83, 87, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

.landing-hero-radial {
  position: absolute;
  top: -120px;
  left: 30%;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(12, 83, 87, 0.08) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}

.landing-hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1240px;
  padding: 84px 32px 80px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(500px, 1.05fr);
  align-items: center;
  gap: 60px;
}

.landing-hero-copy {
  max-width: 560px;
}

.landing-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #e6f3f4;
  border: 1px solid rgba(12, 83, 87, 0.22);
  color: #0c5357;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.eyebrow-beacon {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0c5357;
  box-shadow: 0 0 0 3px rgba(12, 83, 87, 0.25);
  animation: pulse-beacon 2s infinite ease-in-out;
}

@keyframes pulse-beacon {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25); opacity: 0.75; }
}

.landing-hero-title {
  margin: 22px 0 20px;
  color: #080d0c;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2.8rem, 4.8vw, 4.4rem);
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.045em;
}

.hero-highlight {
  color: #0c5357;
  display: block;
}

.landing-hero-lede {
  color: #506160;
  font-size: 1.02rem;
  line-height: 1.65;
  margin: 0;
}

.landing-hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.landing-primary-btn {
  min-height: 48px;
  padding: 0 24px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  background: #080d0c;
  color: #ffffff;
  font-size: 0.86rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  box-shadow: 0 10px 24px rgba(8, 13, 12, 0.2);
  transition: background 0.12s ease, transform 0.1s ease, box-shadow 0.12s ease;
}

.landing-primary-btn:hover {
  background: #0c5357;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(12, 83, 87, 0.3);
}

.landing-primary-btn:active {
  transform: scale(0.97) !important;
}

.landing-secondary-btn {
  min-height: 48px;
  padding: 0 22px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border-radius: 10px;
  border: 1px solid rgba(12, 83, 87, 0.25);
  background: #ffffff;
  color: #080d0c;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.12s ease, border-color 0.12s ease, transform 0.1s ease;
}

.landing-secondary-btn:hover {
  border-color: #080d0c;
  background: #f4f8f8;
  transform: translateY(-1px);
}

.landing-secondary-btn:active {
  transform: scale(0.97) !important;
}

.btn-arrow {
  font-size: 1.05em;
}

/* Proof Grid */
.landing-proof-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid rgba(12, 83, 87, 0.14);
}

.proof-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(12, 83, 87, 0.12);
  border-radius: 8px;
}

.proof-num {
  color: #080d0c;
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.proof-label {
  color: #506160;
  font-size: 0.72rem;
  font-weight: 600;
}

/* ==========================================================================
   INTERACTIVE HERO CONSOLE
   ========================================================================== */
.landing-hero-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-visual-glow {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: rgba(12, 83, 87, 0.12);
  filter: blur(56px);
  pointer-events: none;
}

.hero-dashboard-card {
  position: relative;
  z-index: 1;
  width: min(100%, 560px);
  border: 1px solid rgba(12, 83, 87, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 28px 65px rgba(8, 13, 12, 0.12);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.console-window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f4f8f8;
  border-bottom: 1px solid rgba(12, 83, 87, 0.1);
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.win-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.win-dot--close { background: #ef4444; }
.win-dot--min { background: #f59e0b; }
.win-dot--max { background: #10b981; }

.window-title {
  font-family: monospace;
  font-size: 0.7rem;
  color: #506160;
}

.window-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  background: #e6f3f4;
  color: #0c5357;
}

.console-tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
  background: #eef5f5;
}

.console-tab {
  flex: 1;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #506160;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition: color 0.1s ease, background 0.1s ease, border-color 0.1s ease;
}

.console-tab:hover {
  color: #080d0c;
}

.console-tab:active {
  transform: scale(0.98);
}

.console-tab.active {
  color: #0c5357;
  border-bottom-color: #0c5357;
  background: #ffffff;
  font-weight: 800;
}

.console-body {
  padding: 22px;
}

.console-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(12, 83, 87, 0.1);
}

.console-mini-label {
  display: block;
  color: #506160;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 3px;
}

.console-heading {
  color: #080d0c;
  font-size: 0.95rem;
  letter-spacing: -0.02em;
}

.console-rate-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 999px;
  background: #e6f3f4;
  color: #0c5357;
  font-size: 0.72rem;
  font-weight: 700;
}

.rate-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0f767d;
}

/* Student List */
.demo-student-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-student-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 14px;
  border: 1px solid rgba(12, 83, 87, 0.12);
  border-radius: 10px;
  background: #ffffff;
  transition: all 0.18s ease;
}

.demo-student-row:hover {
  border-color: rgba(12, 83, 87, 0.28);
}

.demo-row--absent {
  background: #fff5f5;
  border-color: rgba(239, 68, 68, 0.25);
}

.demo-st-num {
  color: #506160;
  font-size: 0.7rem;
  font-weight: 800;
}

.demo-st-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.demo-st-info strong {
  font-size: 0.78rem;
  color: #080d0c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-st-info small {
  color: #506160;
  font-size: 0.65rem;
}

.demo-period-badges {
  display: flex;
  gap: 3px;
}

.demo-period {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 0.64rem;
  font-weight: 800;
}

.p-e { background: #e6f3f4; color: #0c5357; }
.p-t { background: #fef3c7; color: #b45309; }
.p-a { background: #fee2e2; color: #b91c1c; }

.demo-toggle-btn {
  min-height: 28px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.1s ease, color 0.1s ease, border-color 0.1s ease, transform 0.08s ease;
}

.demo-toggle-btn:active {
  transform: scale(0.95);
}

.btn-present {
  background: #e6f3f4;
  color: #0c5357;
  border-color: rgba(12, 83, 87, 0.25);
}

.btn-absent {
  background: #fee2e2;
  color: #b91c1c;
  border-color: rgba(185, 28, 28, 0.25);
}

.demo-interactive-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(12, 83, 87, 0.06);
  color: #0c5357;
  font-size: 0.72rem;
  line-height: 1.4;
}

.hint-icon {
  font-size: 1rem;
}

/* SF2 Preview */
.sf2-deped-certified {
  padding: 4px 10px;
  border-radius: 6px;
  background: #e6f3f4;
  color: #0c5357;
  font-size: 0.68rem;
  font-weight: 800;
}

.sf2-metric-preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.sf2-preview-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid rgba(12, 83, 87, 0.12);
  border-radius: 12px;
  background: #ffffff;
}

.sf2-preview-card--highlight {
  background: #e6f3f4;
  border-color: rgba(12, 83, 87, 0.28);
}

.sf2-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #506160;
  text-transform: uppercase;
}

.sf2-val {
  font-family: 'Manrope', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: #080d0c;
  letter-spacing: -0.04em;
}

.sf2-val--clean {
  color: #0c5357;
}

.sf2-preview-card small {
  color: #0c5357;
  font-size: 0.68rem;
}

.sf2-export-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #080d0c;
  color: #ffffff;
}

.export-banner-copy strong {
  display: block;
  font-size: 0.82rem;
  margin-bottom: 2px;
}

.export-banner-copy p {
  color: #a3b5b5;
  font-size: 0.7rem;
  margin: 0;
}

.sf2-demo-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  background: #ffffff;
  color: #080d0c;
  font-size: 0.74rem;
  font-weight: 800;
  text-decoration: none;
  flex-shrink: 0;
}

/* SARDO Preview */
.sardo-count-badge {
  padding: 4px 10px;
  border-radius: 6px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 0.68rem;
  font-weight: 800;
}

.sardo-preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sardo-preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(12, 83, 87, 0.12);
  border-radius: 10px;
  background: #ffffff;
}

.sardo-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sardo-dot--high { background: #ef4444; }
.sardo-dot--mid { background: #f59e0b; }

.sardo-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.sardo-info strong {
  font-size: 0.8rem;
  color: #080d0c;
}

.sardo-info span {
  font-size: 0.68rem;
  color: #506160;
}

.sardo-action-tag {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  background: #fee2e2;
  color: #b91c1c;
}

.sardo-action-tag--mild {
  background: #fef3c7;
  color: #b45309;
}

.sardo-footer-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f4f8f8;
  color: #506160;
  font-size: 0.68rem;
}

.info-circle {
  font-weight: 800;
  color: #0c5357;
}

.console-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #f4f8f8;
  border-top: 1px solid rgba(12, 83, 87, 0.1);
}

.footer-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-avatar-img {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}

.footer-profile strong {
  display: block;
  color: #080d0c;
  font-size: 0.74rem;
}

.footer-profile small {
  color: #506160;
  font-size: 0.64rem;
}

.footer-tags {
  display: flex;
  gap: 6px;
}

.badge-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: #e6f3f4;
  color: #0c5357;
}

.badge-tag--active {
  background: #080d0c;
  color: #ffffff;
}

/* Floating Badges */
.hero-float-card {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  padding: 12px 16px;
  border: 1px solid rgba(12, 83, 87, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 36px rgba(8, 13, 12, 0.08);
  backdrop-filter: blur(14px);
}

.hero-float-card--top {
  top: 36px;
  left: -24px;
}

.hero-float-card--bottom {
  right: -20px;
  bottom: 28px;
}

.hero-float-card strong {
  display: block;
  color: #080d0c;
  font-size: 0.76rem;
}

.hero-float-card small {
  color: #506160;
  font-size: 0.68rem;
}

.hero-float-icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #e6f3f4;
  color: #0c5357;
  font-size: 0.85rem;
  font-weight: 800;
  flex-shrink: 0;
}

.hero-float-icon--shield {
  font-size: 0.95rem;
}

/* ==========================================================================
   TRUST RIBBON
   ========================================================================== */
.trust-ribbon {
  background: #ffffff;
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
  padding: 24px 32px;
}

.trust-ribbon-inner {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}

.trust-lead {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #506160;
  text-transform: uppercase;
}

.trust-items {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0c5357;
}

.trust-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0c5357;
}

/* ==========================================================================
   SECTION COMMON LAYOUT
   ========================================================================== */
.landing-section {
  max-width: 1240px;
  padding: 96px 32px;
  margin: 0 auto;
}

.landing-section-heading {
  max-width: 680px;
  margin-bottom: 48px;
}

.landing-section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #0c5357;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.landing-section-heading h2 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2rem, 3.4vw, 2.9rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: #080d0c;
  margin: 0 0 14px;
}

.landing-section-heading p {
  color: #506160;
  font-size: 0.96rem;
  line-height: 1.65;
  margin: 0;
}

/* ==========================================================================
   BENTO GRID
   ========================================================================== */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.bento-card {
  padding: 32px;
  border: 1px solid rgba(12, 83, 87, 0.14);
  border-radius: 16px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(8, 13, 12, 0.02);
}

.bento-card:hover {
  transform: translateY(-4px);
  border-color: rgba(12, 83, 87, 0.32);
  box-shadow: 0 16px 36px rgba(12, 83, 87, 0.08);
}

.bento-card--featured {
  grid-column: span 2;
}

.bento-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bento-icon {
  width: 44px;
  height: 44px;
  border-radius: 11px;
  background: #e6f3f4;
  color: #0c5357;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bento-icon--radar {
  background: #e6f3f4;
  color: #0c5357;
}

.bento-tag {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 6px;
  background: #f4f8f8;
  color: #506160;
}

.bento-tag--teal {
  background: #e6f3f4;
  color: #0c5357;
}

.bento-card-content h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: #080d0c;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.bento-card-content p {
  color: #506160;
  font-size: 0.84rem;
  line-height: 1.6;
  margin: 0;
}

.bento-preview-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.chip {
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
}

.chip--e { background: #e6f3f4; color: #0c5357; }
.chip--t { background: #fef3c7; color: #b45309; }
.chip--a { background: #fee2e2; color: #b91c1c; }
.chip--nipu { background: #ede9fe; color: #6d28d9; }

/* ==========================================================================
   INTERACTIVE CALCULATOR
   ========================================================================== */
.landing-calc-section {
  padding-top: 20px;
}

.calc-card {
  padding: 48px;
  background: #080d0c;
  border-radius: 20px;
  border: 1px solid rgba(12, 83, 87, 0.35);
  box-shadow: 0 24px 60px rgba(8, 13, 12, 0.25);
  color: #ffffff;
}

.calc-header {
  max-width: 650px;
  margin-bottom: 40px;
}

.calc-header .landing-section-kicker {
  color: #38b2ac;
}

.calc-header h2 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.8rem, 3.2vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 12px;
}

.calc-header p {
  color: #a3b5b5;
  font-size: 0.94rem;
  line-height: 1.6;
  margin: 0;
}

.calc-interactive-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 40px;
  align-items: center;
}

.calc-controls {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.control-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.control-label-row label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #ffffff;
}

.control-value-pill {
  font-family: 'Manrope', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 999px;
  background: #0c5357;
  color: #ffffff;
}

.calc-slider {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.calc-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #38b2ac;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(56, 178, 172, 0.6);
  transition: transform 0.1s ease;
}

.calc-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.68rem;
  color: #7a8e8d;
}

.calc-breakdown-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.calc-breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #a3b5b5;
}

.calc-breakdown-row strong {
  color: #ffffff;
}

.calc-breakdown-row--highlight {
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: #38b2ac;
}

.calc-breakdown-row--highlight strong {
  color: #38b2ac;
  font-weight: 800;
}

.calc-result-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 36px 28px;
  border-radius: 16px;
  background: rgba(12, 83, 87, 0.2);
  border: 1px solid rgba(56, 178, 172, 0.3);
}

.result-badge {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #38b2ac;
  margin-bottom: 8px;
}

.result-number-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
}

.result-num {
  font-family: 'Manrope', sans-serif;
  font-size: 3.8rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: #ffffff;
  line-height: 1;
}

.result-unit {
  font-size: 0.9rem;
  font-weight: 700;
  color: #38b2ac;
}

.result-desc {
  font-size: 0.82rem;
  color: #a3b5b5;
  line-height: 1.5;
  margin-bottom: 24px;
}

.result-desc strong {
  color: #ffffff;
}

.calc-cta-btn {
  width: 100%;
  background: #38b2ac;
  color: #080d0c;
  box-shadow: 0 6px 18px rgba(56, 178, 172, 0.3);
}

.calc-cta-btn:hover {
  background: #ffffff;
  color: #080d0c;
}

/* ==========================================================================
   COMPARISON SECTION
   ========================================================================== */
.landing-compare-section {
  padding-top: 20px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.comparison-col {
  padding: 36px 32px;
  border-radius: 16px;
  border: 1px solid rgba(12, 83, 87, 0.14);
  background: #ffffff;
}

.comparison-col--old {
  background: #fafbfb;
}

.comparison-col--new {
  border-color: rgba(12, 83, 87, 0.35);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(12, 83, 87, 0.08);
}

.compare-header {
  margin-bottom: 24px;
}

.compare-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 6px;
  background: #eef4f4;
  color: #506160;
  margin-bottom: 8px;
}

.compare-badge--highlight {
  background: #e6f3f4;
  color: #0c5357;
}

.compare-header h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: #080d0c;
  margin: 0;
}

.compare-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.compare-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.compare-cross {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fee2e2;
  color: #b91c1c;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 2px;
}

.compare-check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e6f3f4;
  color: #0c5357;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 2px;
}

.compare-list strong {
  display: block;
  font-size: 0.85rem;
  color: #080d0c;
  margin-bottom: 2px;
}

.compare-list p {
  font-size: 0.78rem;
  color: #506160;
  line-height: 1.5;
  margin: 0;
}

/* ==========================================================================
   INSTITUTIONAL PROCESS & OPERATING ARCHITECTURE
   ========================================================================== */
.landing-process-section {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}

.process-tab-switcher {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  padding: 5px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  margin-top: 24px;
  gap: 6px;
}

.process-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #475569;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s ease;
}

.process-tab-btn:hover {
  color: #0f172a;
}

.process-tab-btn.is-active {
  background: #0d9488;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);
}

.process-lifecycle-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 48px;
}

.process-lifecycle-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.process-lifecycle-card:hover {
  transform: translateY(-4px);
  border-color: #0d9488;
  box-shadow: 0 14px 32px rgba(13, 148, 136, 0.1);
}

.plc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.plc-step-badge {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0d9488;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.plc-phase-tag {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 9px;
  border-radius: 6px;
}

.plc-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.35;
  margin: 0;
}

.plc-desc {
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.6;
  margin: 0;
}

.plc-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.plc-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0d9488;
  box-shadow: 0 0 8px rgba(13, 148, 136, 0.5);
}

.plc-indicator-text {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0f766e;
}

/* Cadence Timeline */
.process-cadence-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 880px;
  margin: 48px auto 0;
}

.cadence-timeline-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 28px;
  position: relative;
}

.cadence-time-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.cadence-time-pill {
  font-family: 'Manrope', sans-serif;
  font-size: 0.8rem;
  font-weight: 800;
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.cadence-timeline-line {
  position: absolute;
  top: 36px;
  left: 45px;
  bottom: -20px;
  width: 2px;
  background: #e2e8f0;
}

.cadence-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cadence-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cadence-role-tag {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0f766e;
  background: #f0fdfa;
  padding: 3px 8px;
  border-radius: 5px;
}

.cadence-card-head h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.cadence-card p {
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.55;
  margin: 0;
}

.cadence-card-highlight {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #0d9488;
  padding-top: 6px;
}

/* Process CTA Banner */
.process-cta-banner {
  margin-top: 56px;
  background: #0f172a;
  border-radius: 18px;
  padding: 32px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.15);
}

.process-cta-text strong {
  display: block;
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 4px;
}

.process-cta-text p {
  color: #94a3b8;
  font-size: 0.84rem;
  margin: 0;
}

.process-cta-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* ==========================================================================
   PRICING SECTION & CAPABILITY MATRIX
   ========================================================================== */
.landing-pricing-section {
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding-bottom: 100px;
}

.landing-pricing-heading {
  text-align: center;
  margin: 0 auto 48px;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pricing-toggle-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.pricing-toggle {
  display: inline-flex;
  align-items: center;
  padding: 5px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  gap: 4px;
}

.pricing-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #475569;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s ease;
}

.pricing-toggle-btn.is-active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.1);
}

.pricing-save-pill {
  display: inline-block;
  padding: 2px 8px;
  background: #0d9488;
  color: #ffffff;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
}

/* Pricing Grid */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  align-items: stretch;
}

.pricing-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 36px 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.pricing-card:hover {
  transform: translateY(-4px);
  border-color: #0d9488;
  box-shadow: 0 16px 40px rgba(13, 148, 136, 0.1);
}

.pricing-card--featured {
  border: 2px solid #0d9488;
  box-shadow: 0 14px 36px rgba(13, 148, 136, 0.14);
  transform: scale(1.02);
}

.pricing-card--featured:hover {
  transform: scale(1.02) translateY(-4px);
  box-shadow: 0 22px 52px rgba(13, 148, 136, 0.2);
}

.featured-ribbon {
  position: absolute;
  top: -13px;
  left: 50%;
  transform: translateX(-50%);
  background: #0d9488;
  color: #ffffff;
  font-family: 'Manrope', sans-serif;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);
  white-space: nowrap;
}

.pricing-card-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tier-tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.pricing-tier-tag {
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #475569;
  background: #f1f5f9;
  padding: 3px 9px;
  border-radius: 6px;
}

.pricing-tier-tag--featured {
  background: #f0fdfa;
  color: #0f766e;
  border: 1px solid #99f6e4;
}

.trial-tag {
  font-size: 0.68rem;
  font-weight: 700;
  color: #0f766e;
  background: #f0fdfa;
  padding: 3px 9px;
  border-radius: 6px;
  border: 1px solid #99f6e4;
}

.pricing-card-header h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 0;
}

.pricing-desc {
  font-size: 0.84rem;
  color: #475569;
  line-height: 1.5;
  margin: 0;
  min-height: 48px;
}

.pricing-price-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.pricing-amount-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: #0f172a;
}

.pricing-currency {
  font-family: 'Manrope', sans-serif;
  font-size: 1.45rem;
  font-weight: 800;
  color: #0d9488;
}

.pricing-number {
  font-family: 'Manrope', sans-serif;
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
}

.pricing-per-month {
  font-size: 0.88rem;
  color: #64748b;
  font-weight: 600;
}

.pricing-interval {
  font-size: 0.74rem;
  color: #64748b;
  line-height: 1.4;
}

.pricing-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.15s ease;
  text-align: center;
}

.pricing-cta--primary {
  background: #0d9488;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.3);
}

.pricing-cta--primary:hover {
  background: #0f766e;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(13, 148, 136, 0.4);
}

.pricing-cta--secondary {
  background: #f0fdfa;
  color: #0f766e;
  border: 1px solid #99f6e4;
}

.pricing-cta--secondary:hover {
  background: #ffffff;
  color: #0f172a;
  border-color: #0f172a;
  transform: translateY(-2px);
}

.pricing-pay-shortcut {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 10px;
  padding: 9px 14px;
  border-radius: 9px;
  border: 1px dashed #0d9488;
  background: #f0fdfa;
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pricing-pay-shortcut:hover {
  background: #ccfbf1;
  transform: translateY(-1px);
}

.pricing-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.features-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0f172a;
}

.pricing-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pricing-features li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.45;
}

.pricing-features li span:last-child {
  color: #0f172a;
}

.check-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f0fdfa;
  color: #0d9488;
  flex-shrink: 0;
  margin-top: 2px;
}

.check-icon--featured {
  background: #0d9488;
  color: #ffffff;
}

/* Institutional Capability Comparison Matrix Table */
.pricing-matrix-wrap {
  margin-top: 72px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 44px 36px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.04);
}

.pricing-matrix-header {
  text-align: center;
  max-width: 650px;
  margin: 0 auto 36px;
}

.pricing-matrix-header h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.7rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 8px 0 10px;
}

.pricing-matrix-header p {
  color: #475569;
  font-size: 0.88rem;
  line-height: 1.55;
  margin: 0;
}

.matrix-table-container {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.matrix-table th {
  padding: 16px 20px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  border-bottom: 2px solid #cbd5e1;
}

.matrix-col-feature {
  width: 40%;
}

.matrix-col-tier {
  width: 20%;
  text-align: center;
  line-height: 1.25;
}

.matrix-col-tier small {
  font-size: 0.74rem;
  color: #64748b;
  font-weight: 600;
}

.matrix-col-tier--featured {
  color: #0f766e;
  background: #f0fdfa;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.matrix-category-row td {
  padding: 16px 20px 10px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #0d9488;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.matrix-data-row {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.1s ease;
}

.matrix-data-row:hover {
  background: #f8fafc;
}

.matrix-cell-feature {
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.matrix-cell-feature strong {
  font-size: 0.86rem;
  font-weight: 700;
  color: #0f172a;
}

.matrix-cell-feature small {
  font-size: 0.74rem;
  color: #64748b;
  line-height: 1.4;
}

.matrix-cell-val {
  padding: 14px 20px;
  text-align: center;
  font-size: 0.82rem;
  color: #475569;
}

.matrix-cell-val--featured {
  background: rgba(240, 253, 250, 0.4);
}

.matrix-check {
  color: #0d9488;
  display: inline-block;
}

.matrix-check--teal {
  color: #0f766e;
}

.matrix-dash {
  color: #94a3b8;
  display: inline-block;
}

.matrix-text-val {
  font-weight: 700;
  color: #0f172a;
}

.matrix-text-val--featured {
  color: #0f766e;
}

/* Trust & Compliance Row */
.pricing-trust-row {
  margin-top: 56px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding-top: 40px;
  border-top: 1px solid #e2e8f0;
}

.pricing-trust-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.trust-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f0fdfa;
  color: #0d9488;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pricing-trust-item strong {
  display: block;
  font-size: 0.86rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 3px;
}

.pricing-trust-item p {
  font-size: 0.75rem;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}

/* ==========================================================================
   OFFICIAL PAYMENT CHANNELS & QR SECTION
   ========================================================================== */
.landing-payments-section {
  background: #f7fafb;
  border-top: 1px solid rgba(12, 83, 87, 0.08);
  border-bottom: 1px solid rgba(12, 83, 87, 0.08);
  padding: 80px 0;
}

.landing-payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.landing-payment-card {
  background: #ffffff;
  border: 1px solid rgba(12, 83, 87, 0.16);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 18px rgba(8, 13, 12, 0.04);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.landing-payment-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(12, 83, 87, 0.1);
  border-color: rgba(12, 83, 87, 0.32);
}

.lpc-header {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(12, 83, 87, 0.1);
}

.lpc-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.lpc-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(12, 83, 87, 0.1);
  color: #0c5357;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.lpc-qr-available-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e8f5e9;
  color: #1b5e20;
  font-size: 0.7rem;
  font-weight: 700;
}

.lpc-bank-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #080d0c;
  margin: 0;
  line-height: 1.3;
}

.lpc-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.lpc-qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px;
  background: #f4f8f8;
  border-radius: 12px;
  border: 1px solid rgba(12, 83, 87, 0.1);
}

.lpc-qr-thumb-wrap {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 8px;
  background: #ffffff;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  overflow: hidden;
}

.lpc-qr-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.lpc-qr-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(12, 83, 87, 0.85);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 0.72rem;
  font-weight: 700;
}

.lpc-qr-thumb-wrap:hover .lpc-qr-hover-overlay {
  opacity: 1;
}

.lpc-qr-btn {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: #0c5357;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
}

.lpc-qr-btn:hover {
  text-decoration: underline;
}

.lpc-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lpc-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lpc-field-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #506160;
}

.lpc-field-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #080d0c;
}

.lpc-acc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f4f8f8;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(12, 83, 87, 0.12);
}

.lpc-acc-num {
  font-family: monospace;
  font-size: 1rem;
  font-weight: 800;
  color: #0c5357;
  letter-spacing: 0.05em;
  word-break: break-all;
}

.lpc-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid rgba(12, 83, 87, 0.2);
  background: #ffffff;
  color: #0c5357;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.lpc-copy-btn:hover {
  background: #0c5357;
  color: #ffffff;
}

.lpc-instructions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.78rem;
  color: #506160;
  line-height: 1.4;
  padding: 10px;
  border-radius: 8px;
  background: rgba(12, 83, 87, 0.04);
}

.landing-payment-notice {
  margin-top: 36px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 22px 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0c5357 0%, #156d73 100%);
  color: #ffffff;
}

.lpn-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.lpn-content {
  flex: 1;
}

.lpn-content h4 {
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 6px;
  color: #ffffff;
}

.lpn-content p {
  font-size: 0.85rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.lpn-link {
  color: #99f6e4;
  text-decoration: underline;
  font-weight: 700;
}

.lpn-action {
  flex-shrink: 0;
}

.lpn-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 9px;
  background: #ffffff;
  color: #0c5357;
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.lpn-btn:hover {
  background: #e6f3f4;
  transform: translateY(-1px);
}

/* Enlarged QR Code Modal Overlay & Dialog */
.landing-qr-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(8, 13, 12, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.landing-qr-modal {
  position: relative;
  width: min(100%, 460px);
  background: #ffffff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: qrModalPop 0.2s ease-out;
}

@keyframes qrModalPop {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.landing-qr-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(12, 83, 87, 0.15);
  background: #f4f8f8;
  color: #506160;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.landing-qr-close:hover {
  background: #e2eeee;
  color: #080d0c;
}

.lqm-header {
  margin-bottom: 18px;
}

.lqm-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(12, 83, 87, 0.1);
  color: #0c5357;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.lqm-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #080d0c;
  margin: 0 0 6px;
}

.lqm-subtitle {
  font-size: 0.8rem;
  color: #506160;
  margin: 0;
}

.lqm-qr-wrapper {
  width: 240px;
  height: 240px;
  border-radius: 14px;
  background: #ffffff;
  padding: 10px;
  border: 2px solid rgba(12, 83, 87, 0.18);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  margin-bottom: 18px;
}

.lqm-qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.lqm-details {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f4f8f8;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(12, 83, 87, 0.1);
  margin-bottom: 18px;
}

.lqm-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.lqm-detail-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #506160;
}

.lqm-detail-val {
  font-size: 0.88rem;
  font-weight: 800;
  color: #080d0c;
}

.lqm-copy-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.lqm-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(12, 83, 87, 0.2);
  background: #ffffff;
  color: #0c5357;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.lqm-copy-btn:hover {
  background: #0c5357;
  color: #ffffff;
}

.lqm-instructions {
  font-size: 0.75rem;
  color: #506160;
  margin: 4px 0 0;
  line-height: 1.4;
  border-top: 1px dashed rgba(12, 83, 87, 0.15);
  padding-top: 8px;
}

.lqm-footer {
  width: 100%;
}

.lqm-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 18px;
  border-radius: 10px;
  background: #0c5357;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.2s ease;
}

.lqm-action-btn:hover {
  background: #094043;
}

/* ==========================================================================
   FAQ SECTION
   ========================================================================== */
.landing-faq-section {
  padding-top: 20px;
}

.faq-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 860px;
  margin: 0 auto;
}

.faq-card {
  padding: 20px 24px;
  border: 1px solid rgba(12, 83, 87, 0.15);
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.faq-card:hover {
  border-color: rgba(12, 83, 87, 0.35);
  background: #f8fafb;
}

.faq-card.is-open {
  border-color: #0c5357;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(12, 83, 87, 0.06);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.faq-question strong {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  color: #080d0c;
}

.faq-toggle-icon {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0c5357;
}

.faq-answer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(12, 83, 87, 0.1);
  font-size: 0.85rem;
  line-height: 1.6;
  color: #506160;
}

/* ==========================================================================
   STATEMENT CTA SECTION
   ========================================================================== */
.landing-cta-section {
  padding: 96px 32px;
  background: #f4f8f8;
}

.landing-cta-card {
  max-width: 1200px;
  padding: 60px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  border-radius: 20px;
  background: #080d0c;
  border: 1px solid rgba(12, 83, 87, 0.35);
  box-shadow: 0 24px 60px rgba(8, 13, 12, 0.25);
}

.landing-cta-card .landing-section-kicker {
  color: #38b2ac;
}

.landing-cta-card h2 {
  color: #ffffff;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.8rem, 3.2vw, 2.6rem);
  font-weight: 800;
  line-height: 1.15;
  margin: 10px 0 12px;
}

.landing-cta-card p {
  max-width: 540px;
  color: #a3b5b5;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.cta-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.landing-primary-btn--light {
  flex-shrink: 0;
  background: #ffffff;
  color: #080d0c;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.landing-primary-btn--light:hover {
  background: #e6f3f4;
  color: #0c5357;
}

.cta-contact-btn {
  border-color: rgba(255, 255, 255, 0.25);
  background: transparent;
  color: #ffffff;
}

.cta-contact-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: #ffffff;
}

/* ==========================================================================
   FOOTER
   ========================================================================== */
.landing-footer {
  max-width: 1240px;
  padding: 48px 32px 32px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.footer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-brand span {
  display: flex;
  flex-direction: column;
}

.footer-brand strong {
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: #080d0c;
}

.footer-brand small {
  font-size: 0.68rem;
  color: #506160;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.footer-links a,
.footer-link-btn {
  font-size: 0.8rem;
  font-weight: 600;
  color: #506160;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  touch-action: manipulation;
  transition: color 0.1s ease;
}

.footer-links a:hover,
.footer-link-btn:hover {
  color: #0c5357;
}

.footer-links a:active,
.footer-link-btn:active {
  color: #080d0c;
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.74rem;
  color: #7a8e8d;
}

/* ==========================================================================
   RESPONSIVE
   ========================================================================== */
@media (max-width: 1040px) {
  .landing-hero-inner {
    grid-template-columns: 1fr;
    gap: 48px;
    padding-top: 60px;
  }
  .landing-hero-copy {
    max-width: 100%;
  }
  .landing-hero-visual {
    width: 100%;
    max-width: 580px;
  }
  .bento-grid {
    grid-template-columns: 1fr 1fr;
  }
  .bento-card--featured {
    grid-column: span 2;
  }
  .calc-interactive-grid {
    grid-template-columns: 1fr;
  }
  .comparison-grid {
    grid-template-columns: 1fr;
  }
  .landing-workflow-inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }
  .pricing-grid {
    grid-template-columns: 1fr;
    max-width: 520px;
    margin: 0 auto;
  }
  .pricing-card--featured {
    transform: none;
  }
  .pricing-card--featured:hover {
    transform: translateY(-4px);
  }
  .pricing-trust-row {
    grid-template-columns: 1fr 1fr;
  }
  .process-lifecycle-grid {
    grid-template-columns: 1fr 1fr;
  }
  .process-cta-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 980px) {
  .landing-nav-links {
    display: none;
  }
  .mobile-menu-toggle {
    display: flex;
  }
}

@media (max-width: 768px) {
  .landing-nav-inner {
    min-height: 64px;
    padding: 0 18px;
  }
  .mobile-menu-toggle {
    display: flex;
  }
  .landing-hero-inner {
    padding: 48px 18px 56px;
  }
  .landing-hero-title {
    font-size: 2.5rem;
  }
  .landing-proof-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .hero-float-card {
    display: none;
  }
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .bento-card--featured {
    grid-column: span 1;
  }
  .calc-card {
    padding: 32px 20px;
  }
  .landing-section {
    padding: 68px 18px;
  }
  .pricing-trust-row {
    grid-template-columns: 1fr;
  }
  .process-lifecycle-grid {
    grid-template-columns: 1fr;
  }
  .cadence-timeline-item {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .cadence-timeline-line {
    display: none;
  }
  .process-tab-switcher {
    flex-direction: column;
    width: 100%;
    border-radius: 14px;
    padding: 6px;
  }
  .process-tab-btn {
    width: 100%;
    justify-content: center;
  }
  .pricing-matrix-wrap {
    padding: 24px 16px;
  }
  .landing-payment-grid {
    grid-template-columns: 1fr;
  }
  .landing-payment-notice {
    flex-direction: column;
    text-align: center;
    padding: 20px;
    gap: 16px;
  }
  .lpn-action {
    width: 100%;
  }
  .lpn-btn {
    width: 100%;
    justify-content: center;
  }
  .landing-cta-card {
    padding: 36px 24px;
    flex-direction: column;
    align-items: flex-start;
  }
  .footer-top {
    flex-direction: column;
    align-items: flex-start;
  }
  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
