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
        <nav class="landing-nav-links" aria-label="Main Navigation">
          <button type="button" class="landing-nav-link" @click="scrollToSection('demo')">Demo Console</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('features')">Platform</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('sf2')">DepEd SF2</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('calculator')">Time Saved</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('workflow')">Daily Cadence</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('pricing')">Pricing</button>
          <button type="button" class="landing-nav-link" @click="scrollToSection('faq')">FAQ</button>
        </nav>

        <!-- Navigation Actions -->
        <div class="landing-nav-actions">
          <router-link to="/login" class="landing-sign-in">
            <span>Sign In</span>
            <span class="sign-in-arrow">→</span>
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
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('sf2')">DepEd SF2 Standard</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('calculator')">Time Saved Calculator</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('workflow')">Daily Cadence</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('pricing')">Licensing &amp; Pricing</button>
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
                <div class="window-title">elytrack.app/advisory/grade-8-narra</div>
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
                    <span class="console-mini-label">GRADE 8 · SECTION NARRA · ADVISORY</span>
                    <strong class="console-heading">Daily Roll Call — Active Session</strong>
                  </div>
                  <div class="console-rate-badge">
                    <span class="rate-pulse"></span>
                    <span>Present: <strong>{{ calculatedAttendanceRate }}%</strong></span>
                  </div>
                </div>

                <div class="demo-student-list">
                  <div
                    v-for="(st, idx) in demoStudents"
                    :key="st.id"
                    class="demo-student-row"
                    :class="{ 'demo-row--absent': st.status === 'Absent' }"
                  >
                    <span class="demo-st-num">#0{{ st.id }}</span>
                    <div class="demo-st-info">
                      <strong>{{ st.name }}</strong>
                      <small>{{ st.gender }} · LRN: 10482910{{ st.id }}</small>
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

                <div class="demo-interactive-hint">
                  <span class="hint-icon">⚡</span>
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
                    <span class="sf2-val">42</span>
                    <small>22 Male · 20 Female</small>
                  </div>
                  <div class="sf2-preview-card sf2-preview-card--highlight">
                    <span class="sf2-label">Average Daily Attendance</span>
                    <span class="sf2-val">40.8</span>
                    <small>97.1% Overall Attendance</small>
                  </div>
                  <div class="sf2-preview-card">
                    <span class="sf2-label">School Days in Month</span>
                    <span class="sf2-val">22</span>
                    <small>Academic Calendar 2026</small>
                  </div>
                  <div class="sf2-preview-card">
                    <span class="sf2-label">SARDO Dropout Risk</span>
                    <span class="sf2-val sf2-val--clean">0</span>
                    <small>100% Student Retention</small>
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
                  <span class="sardo-count-badge">2 Learners Monitored</span>
                </div>

                <div class="sardo-preview-list">
                  <div class="sardo-preview-item">
                    <div class="sardo-dot sardo-dot--high"></div>
                    <div class="sardo-info">
                      <strong>REYES, PEDRO B.</strong>
                      <span>Grade 8 - Narra · 3 consecutive unexcused absences (Health reason cited)</span>
                    </div>
                    <span class="sardo-action-tag">Home Visit Dispatched</span>
                  </div>

                  <div class="sardo-preview-item">
                    <div class="sardo-dot sardo-dot--mid"></div>
                    <div class="sardo-info">
                      <strong>CRUZ, ARNEL S.</strong>
                      <span>Grade 9 - Molave · 2 days chronic tardiness</span>
                    </div>
                    <span class="sardo-action-tag sardo-action-tag--mild">Adviser Counseling</span>
                  </div>
                </div>

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
                    <strong>Baguio Patriotic High School</strong>
                    <small>DepEd School ID: 406219 · Active Campus Node</small>
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
              <span class="hero-float-icon">✓</span>
              <div>
                <strong>SF2 Auto-Calculated</strong>
                <small>Zero manual math errors</small>
              </div>
            </div>

            <div class="hero-float-card hero-float-card--bottom">
              <span class="hero-float-icon hero-float-icon--shield">🛡️</span>
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
                <span class="compare-cross">✕</span>
                <div>
                  <strong>Fragile cell formulas</strong>
                  <p>Accidental edits corrupt ADA and percentage formulas, forcing manual recalculation.</p>
                </div>
              </li>
              <li>
                <span class="compare-cross">✕</span>
                <div>
                  <strong>Month-end crunch stress</strong>
                  <p>Advisers spend hours tallying tick marks across paper registers at the end of every month.</p>
                </div>
              </li>
              <li>
                <span class="compare-cross">✕</span>
                <div>
                  <strong>Delayed dropout signals</strong>
                  <p>Absenteeism patterns are frequently discovered only when the student has already dropped out.</p>
                </div>
              </li>
              <li>
                <span class="compare-cross">✕</span>
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
                <span class="compare-check">✓</span>
                <div>
                  <strong>Guaranteed mathematical accuracy</strong>
                  <p>DepEd SF2 formulas are locked into the database engine with 100% calculation consistency.</p>
                </div>
              </li>
              <li>
                <span class="compare-check">✓</span>
                <div>
                  <strong>1-Click Excel SF2 generation</strong>
                  <p>Generate compliant, formatted DepEd SF2 workbooks instantly at any time of the month.</p>
                </div>
              </li>
              <li>
                <span class="compare-check">✓</span>
                <div>
                  <strong>Proactive SARDO early alerts</strong>
                  <p>Automatic early warning radar identifies attendance deterioration early in the month.</p>
                </div>
              </li>
              <li>
                <span class="compare-check">✓</span>
                <div>
                  <strong>Role-based data security</strong>
                  <p>Every attendance submission, modification, and export is audited and securely backed up.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Daily Rhythm Workflow -->
      <section id="workflow" class="landing-workflow-section">
        <div class="landing-section landing-workflow-inner">
          <div class="landing-workflow-copy">
            <span class="landing-section-kicker">Operational Cadence</span>
            <h2>A seamless daily rhythm from first bell to month-end.</h2>
            <p>
              ElyTrack gives your administration and faculty a shared, predictable routine that removes operational friction every single school day.
            </p>
            <router-link to="/login" class="landing-outline-btn">
              <span>Sign In to Experience Workspace</span>
              <span>→</span>
            </router-link>
          </div>

          <div class="landing-steps">
            <div v-for="(step, index) in steps" :key="step.title" class="landing-step">
              <div class="step-badge-col">
                <span class="landing-step-number">0{{ index + 1 }}</span>
                <span class="step-time-pill">{{ step.time }}</span>
              </div>
              <div class="step-body">
                <h3>{{ step.title }}</h3>
                <p>{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section id="pricing" class="landing-pricing-section">
        <div class="landing-section">
          <div class="landing-section-heading landing-pricing-heading">
            <span class="landing-section-kicker">Institutional Investment</span>
            <h2>Predictable operational plans for every school.</h2>
            <p>
              Tailored specifically for Philippine public and private schools. Transparent pricing, DepEd Form 2 compliance, and institutional data privacy.
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
                  <span>School Year (10 mos)</span>
                  <span class="pricing-save-pill">Save 20%</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Pricing Cards Grid -->
          <div class="pricing-grid">
            <div
              v-for="plan in plans"
              :key="plan.id"
              class="pricing-card"
              :class="{ 'pricing-card--featured': plan.is_featured }"
            >
              <div v-if="plan.is_featured && plan.badge" class="featured-ribbon">{{ plan.badge }}</div>

              <div class="pricing-card-header">
                <div class="tier-tag-row">
                  <span class="pricing-tier-tag" :class="{ 'pricing-tier-tag--featured': plan.is_featured }">{{ plan.tag }}</span>
                  <span v-if="!plan.is_featured && plan.badge" class="trial-tag">{{ plan.badge }}</span>
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
                      ? `Billed ₱${Number(plan.billing_annual_total || 0).toLocaleString()} per 10-month school year${plan.trial_days ? ` (${plan.trial_days}-day trial)` : ''}`
                      : `Billed monthly${plan.tier === 'adviser' ? ' per advisory section' : ', cancel anytime'}`
                  }}
                </span>
              </div>

              <a
                v-if="plan.cta_url && plan.cta_url.startsWith('mailto:')"
                :href="plan.cta_url"
                class="pricing-cta-btn"
                :class="plan.is_featured ? 'pricing-cta--primary' : 'pricing-cta--secondary'"
              >
                <span>{{ plan.cta_text || 'Inquire for Deployment' }}</span>
                <span>↗</span>
              </a>
              <router-link
                v-else
                :to="plan.cta_url || '/login'"
                class="pricing-cta-btn"
                :class="plan.is_featured ? 'pricing-cta--primary' : 'pricing-cta--secondary'"
              >
                <span>{{ plan.cta_text || 'Start 14-Day Trial' }}</span>
                <span>→</span>
              </router-link>

              <div class="pricing-features">
                <span class="features-label">Included in {{ plan.name }}:</span>
                <ul>
                  <li v-for="(feat, fIdx) in plan.features" :key="fIdx">
                    <span class="check-icon" :class="{ 'check-icon--featured': plan.is_featured }">✓</span>
                    <span>{{ feat }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Trust & Compliance Guarantee -->
          <div class="pricing-trust-row">
            <div class="pricing-trust-item">
              <span class="trust-icon">📋</span>
              <div>
                <strong>DepEd Order No. 8, s. 2015</strong>
                <p>Fully certified calculation engine matching official SF2 definitions and formats.</p>
              </div>
            </div>
            <div class="pricing-trust-item">
              <span class="trust-icon">🔒</span>
              <div>
                <strong>Data Privacy Act (RA 10173)</strong>
                <p>Strict confidentiality safeguards ensuring student attendance records remain private.</p>
              </div>
            </div>
            <div class="pricing-trust-item">
              <span class="trust-icon">🔑</span>
              <div>
                <strong>Database-Backed Licenses</strong>
                <p>Every school is tied to a secure license record. Access locks automatically if suspended.</p>
              </div>
            </div>
            <div class="pricing-trust-item">
              <span class="trust-icon">⚡</span>
              <div>
                <strong>Rapid Roll Call</strong>
                <p>Designed for real classroom rhythms: finish section roll call in under 90 seconds.</p>
              </div>
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
            <a href="mailto:deploy@elytrack.ph" class="landing-secondary-btn cta-contact-btn">
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
          <button type="button" class="footer-link-btn" @click="scrollToSection('sf2')">DepEd SF2</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('calculator')">Time Saved</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('pricing')">Pricing</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('faq')">FAQ</button>
          <router-link to="/login">Sign In</router-link>
        </div>
      </div>

      <div class="footer-bottom">
        <span>&copy; 2026 ElyTrack. Built for Philippine Schools. DepEd SF2 Verified.</span>
        <span>Confidential &amp; Verified Institutional Operations</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const billingCycle = ref('annual')
const activeDemoTab = ref('rollcall')
const mobileNavOpen = ref(false)
const sectionCount = ref(24)
const activeFaq = ref(0)
const DEFAULT_PLANS = [
  {
    id: 'adviser',
    tier: 'adviser',
    name: 'Adviser License',
    tag: 'Dedicated',
    description: 'Dedicated single-adviser operational license with a 14-day full feature trial before payment.',
    price_monthly: 249,
    price_annual_monthly: 199,
    billing_annual_total: 1990,
    trial_days: 14,
    is_featured: 0,
    badge: '14-Day Free Trial',
    cta_text: 'Start 14-Day Trial',
    cta_url: '/login',
    features: [
      '14-Day Free Evaluation Trial',
      '1 Advisory section license key (up to 65 students)',
      '< 90-second rapid daily roll call',
      'Section-level monthly DepEd SF2 generation',
      'Consecutive absence & SARDO risk flags',
      'Standard printable PDF attendance register',
      'Online license key activation & renewal'
    ]
  },
  {
    id: 'campus',
    tier: 'campus',
    name: 'School Pro',
    tag: 'Campus',
    description: 'Institutional license for public & private high schools and elementary campuses.',
    price_monthly: 1490,
    price_annual_monthly: 1190,
    billing_annual_total: 11900,
    trial_days: 14,
    is_featured: 1,
    badge: 'DepEd SF2 Certified',
    cta_text: 'Inquire for School Deployment',
    cta_url: 'mailto:deploy@elytrack.ph?subject=ElyTrack%20School%20Pro%20Deployment%20Inquiry',
    features: [
      'Unlimited faculty, advisers & students',
      'School-wide consolidated DepEd SF2 (.xlsx export)',
      'Automated SARDO early-warning radar & logs',
      'Grade levels & sections configuration management',
      'Quarterly attendance analytics & trend forecasting',
      'Role-based access (Principal, Admin, Faculty)',
      'System audit logs & activity telemetry',
      'Priority faculty onboarding & DepEd updates'
    ]
  },
  {
    id: 'division',
    tier: 'division',
    name: 'Division & Multi-Campus',
    tag: 'Institutional',
    description: 'For School Division Offices (SDO), academy networks, and diocesan school clusters.',
    price_monthly: 4990,
    price_annual_monthly: 3990,
    billing_annual_total: 39900,
    trial_days: 0,
    is_featured: 0,
    badge: 'Network SDO',
    cta_text: 'Inquire for Division',
    cta_url: 'mailto:inquiries@elytrack.ph?subject=ElyTrack%20Division%20Inquiry',
    features: [
      'Multi-school governance console',
      'Division-wide attendance aggregation',
      'Centralized license provisioning & seat management',
      'Custom institutional security & SSO integration',
      'Dedicated account engineer & SLA guarantee',
      'Data Privacy Act (RA 10173) compliance verification'
    ]
  }
]
const plans = ref(DEFAULT_PLANS)
const activeSchool = ref(null)

const demoStudents = ref([
  { id: 1, name: 'DELA CRUZ, JUAN M.', gender: 'Male', am1: 'E', am2: 'E', am3: 'E', am4: 'E', status: 'Present' },
  { id: 2, name: 'SANTOS, MARIA A.', gender: 'Female', am1: 'E', am2: 'T', am3: 'E', am4: 'E', status: 'Present' },
  { id: 3, name: 'REYES, PEDRO B.', gender: 'Male', am1: 'A', am2: 'A', am3: 'A', am4: 'A', status: 'Absent' },
  { id: 4, name: 'AQUINO, BEA C.', gender: 'Female', am1: 'E', am2: 'E', am3: 'E', am4: 'E', status: 'Present' }
])

onMounted(async () => {
  await loadLandingData()
})

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
      if (data.stats?.totalSections) {
        sectionCount.value = Math.max(data.stats.totalSections, 4)
      }
      if (Array.isArray(data.previewStudents) && data.previewStudents.length > 0) {
        demoStudents.value = data.previewStudents.slice(0, 5).map((st, i) => ({
          id: i + 1,
          name: st.name,
          gender: st.gender || (i % 2 === 0 ? 'Male' : 'Female'),
          lrn: st.id ? `10482910${st.id}` : `10482910${i + 1}`,
          am1: i === 2 ? 'A' : 'E',
          am2: i === 1 ? 'T' : (i === 2 ? 'A' : 'E'),
          am3: i === 2 ? 'A' : 'E',
          am4: i === 2 ? 'A' : 'E',
          status: i === 2 ? 'Absent' : 'Present'
        }))
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
  const presentCount = demoStudents.value.filter(s => s.status === 'Present').length
  return Math.round((presentCount / demoStudents.value.length) * 100)
})

const hoursSavedMonthly = computed(() => {
  // Average 18 hours per section manual tallying and month-end SF2 crunch
  // ElyTrack reduces this to under 1 hour per section per month
  return Math.round(sectionCount.value * 17.2)
})

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
    q: 'How does the Adviser 14-day free trial work?',
    a: 'Advisers can evaluate the full system for 14 days with zero upfront payment. During the trial, you can record daily attendance, generate monthly SF2 reports, and test student retention flags.'
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
  }
]

function toggleFaq(idx) {
  activeFaq.value = activeFaq.value === idx ? -1 : idx
}

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const navHeight = 76
  const top = el.getBoundingClientRect().top + window.pageYOffset - navHeight
  window.scrollTo({
    top,
    behavior: 'smooth'
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
#calculator,
#sf2,
#workflow,
#pricing,
#faq {
  scroll-margin-top: 80px;
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
  gap: 24px;
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
   WORKFLOW SECTION
   ========================================================================== */
.landing-workflow-section {
  background: #f4f8f8;
  border-top: 1px solid rgba(12, 83, 87, 0.12);
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
}

.landing-workflow-inner {
  display: grid;
  grid-template-columns: 0.88fr 1.12fr;
  align-items: center;
  gap: 80px;
}

.landing-workflow-copy {
  max-width: 460px;
}

.landing-workflow-copy h2 {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(2rem, 3.2vw, 2.7rem);
  font-weight: 800;
  color: #080d0c;
  line-height: 1.12;
  margin: 12px 0 14px;
}

.landing-workflow-copy p {
  color: #506160;
  font-size: 0.95rem;
  line-height: 1.65;
  margin: 0;
}

.landing-outline-btn {
  min-height: 44px;
  padding: 0 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 26px;
  border: 1px solid rgba(12, 83, 87, 0.25);
  border-radius: 8px;
  background: #ffffff;
  color: #080d0c;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease, transform 0.1s ease;
}

.landing-outline-btn:hover {
  border-color: #080d0c;
  transform: translateY(-2px);
}

.landing-outline-btn:active {
  transform: scale(0.97) !important;
}

.landing-steps {
  display: flex;
  flex-direction: column;
}

.landing-step {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 20px;
  padding: 22px 0;
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
}

.landing-step:first-child { padding-top: 0; }
.landing-step:last-child { border-bottom: 0; padding-bottom: 0; }

.step-badge-col {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.landing-step-number {
  color: #0c5357;
  font-family: 'Manrope', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
}

.step-time-pill {
  font-size: 0.65rem;
  font-weight: 700;
  color: #0c5357;
  background: #e6f3f4;
  padding: 3px 7px;
  border-radius: 4px;
  align-self: flex-start;
}

.step-body h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  color: #080d0c;
  margin: 0 0 5px;
}

.step-body p {
  color: #506160;
  font-size: 0.82rem;
  line-height: 1.55;
  margin: 0;
}

/* ==========================================================================
   PRICING SECTION
   ========================================================================== */
.landing-pricing-section {
  background: #ffffff;
  border-top: 1px solid rgba(12, 83, 87, 0.12);
}

.landing-pricing-heading {
  text-align: center;
  margin: 0 auto 48px;
  max-width: 680px;
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
  padding: 4px;
  background: #e6f3f4;
  border: 1px solid rgba(12, 83, 87, 0.18);
  border-radius: 999px;
  gap: 4px;
}

.pricing-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #506160;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.12s ease, color 0.12s ease, box-shadow 0.12s ease;
}

.pricing-toggle-btn:active {
  transform: scale(0.97);
}

.pricing-toggle-btn.is-active {
  background: #ffffff;
  color: #080d0c;
  box-shadow: 0 2px 8px rgba(8, 13, 12, 0.12);
}

.pricing-save-pill {
  display: inline-block;
  padding: 2px 7px;
  background: #0c5357;
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
  gap: 24px;
  align-items: stretch;
}

.pricing-card {
  position: relative;
  background: #ffffff;
  border: 1px solid rgba(12, 83, 87, 0.16);
  border-radius: 16px;
  padding: 36px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  transition: all 0.25s ease;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(12, 83, 87, 0.08);
}

.pricing-card--featured {
  border-color: #0c5357;
  box-shadow: 0 12px 32px rgba(12, 83, 87, 0.15);
  transform: scale(1.02);
}

.pricing-card--featured:hover {
  transform: scale(1.02) translateY(-4px);
  box-shadow: 0 20px 48px rgba(12, 83, 87, 0.2);
}

.featured-ribbon {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #0c5357;
  color: #ffffff;
  font-family: 'Manrope', sans-serif;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 14px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(12, 83, 87, 0.25);
  white-space: nowrap;
}

.pricing-card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tier-tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pricing-tier-tag {
  align-self: flex-start;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #506160;
  background: #eef5f5;
  padding: 3px 8px;
  border-radius: 5px;
}

.pricing-tier-tag--featured {
  background: #e6f3f4;
  color: #0c5357;
}

.trial-tag {
  font-size: 0.68rem;
  font-weight: 700;
  color: #0c5357;
  background: #e6f3f4;
  padding: 3px 8px;
  border-radius: 5px;
}

.deped-verified-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #ffffff;
  background: #080d0c;
  padding: 3px 8px;
  border-radius: 5px;
}

.pricing-card-header h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.45rem;
  font-weight: 800;
  color: #080d0c;
  letter-spacing: -0.03em;
  margin: 0;
}

.pricing-desc {
  font-size: 0.84rem;
  color: #506160;
  line-height: 1.45;
  margin: 0;
  min-height: 42px;
}

.pricing-price-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 0;
  border-top: 1px solid rgba(12, 83, 87, 0.12);
  border-bottom: 1px solid rgba(12, 83, 87, 0.12);
}

.pricing-amount-row {
  display: flex;
  align-items: baseline;
  gap: 3px;
  color: #080d0c;
}

.pricing-currency {
  font-family: 'Manrope', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0c5357;
}

.pricing-number {
  font-family: 'Manrope', sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
}

.pricing-per-month {
  font-size: 0.88rem;
  color: #506160;
  font-weight: 600;
}

.pricing-interval {
  font-size: 0.74rem;
  color: #506160;
  line-height: 1.35;
}

.pricing-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease, transform 0.1s ease, box-shadow 0.12s ease;
  text-align: center;
}

.pricing-cta-btn:active {
  transform: scale(0.97) !important;
}

.pricing-cta--primary {
  background: #0c5357;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(12, 83, 87, 0.25);
}

.pricing-cta--primary:hover {
  background: #073a3c;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(12, 83, 87, 0.35);
}

.pricing-cta--secondary {
  background: #e6f3f4;
  color: #0c5357;
  border: 1px solid rgba(12, 83, 87, 0.2);
}

.pricing-cta--secondary:hover {
  background: #ffffff;
  color: #080d0c;
  border-color: #080d0c;
  transform: translateY(-2px);
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
  color: #080d0c;
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
  color: #506160;
  line-height: 1.4;
}

.pricing-features li span:last-child {
  color: #080d0c;
}

.check-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e6f3f4;
  color: #0c5357;
  font-size: 0.68rem;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 1px;
}

.check-icon--featured {
  background: #e6f3f4;
  color: #0c5357;
}

/* Trust & Compliance Row */
.pricing-trust-row {
  margin-top: 56px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding-top: 40px;
  border-top: 1px solid rgba(12, 83, 87, 0.12);
}

.pricing-trust-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.trust-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.pricing-trust-item strong {
  display: block;
  font-size: 0.84rem;
  font-weight: 700;
  color: #080d0c;
  margin-bottom: 2px;
}

.pricing-trust-item p {
  font-size: 0.74rem;
  color: #506160;
  line-height: 1.45;
  margin: 0;
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
}

@media (max-width: 768px) {
  .landing-nav-inner {
    min-height: 64px;
    padding: 0 18px;
  }
  .landing-nav-links {
    display: none;
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
