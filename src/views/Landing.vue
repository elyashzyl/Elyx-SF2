<template>
  <div class="landing-page">
    <!-- Top Navigation Bar -->
    <header class="landing-nav">
      <div class="landing-nav-inner">
        <router-link to="/" class="landing-brand" aria-label="ElyTrack Home">
          <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="landing-brand-logo" />
          <div class="landing-brand-meta">
            <span class="landing-brand-name">ElyTrack</span>
            <span class="landing-brand-tag">DepEd SF2 &amp; School OS</span>
          </div>
        </router-link>

        <!-- Desktop Navigation Links -->
        <nav class="landing-nav-links" aria-label="Main Navigation">
          <button type="button" class="nav-item" @click="scrollToSection('demo')">Live Simulator</button>
          <button type="button" class="nav-item" @click="scrollToSection('features')">Platform</button>
          <button type="button" class="nav-item" @click="scrollToSection('sf2')">DepEd SF2</button>
          <button type="button" class="nav-item" @click="scrollToSection('calculator')">Time Saved</button>
          <button type="button" class="nav-item" @click="scrollToSection('pricing')">Licensing &amp; Plans</button>
          <button type="button" class="nav-item" @click="scrollToSection('faq')">FAQ</button>
        </nav>

        <!-- Navigation Actions -->
        <div class="landing-nav-actions">
          <button
            type="button"
            class="nav-theme-btn"
            @click="toggleTheme"
            :title="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
            :aria-label="theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'"
          >
            <svg v-if="theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </button>

          <router-link to="/login" class="nav-signin-btn">
            <span>Sign In</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('demo')">Live Simulator</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('features')">Platform Capabilities</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('sf2')">DepEd SF2 Standard</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('calculator')">Time Saved Calculator</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('pricing')">Licensing &amp; Plans</button>
        <button type="button" class="mobile-nav-item" @click="handleMobileNav('faq')">Frequently Asked Questions</button>
        <button type="button" class="mobile-nav-item mobile-theme-item" @click="toggleTheme">
          <svg v-if="theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
          <span>{{ theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode' }}</span>
        </button>
        <router-link to="/login" class="mobile-sign-in-btn" @click="mobileNavOpen = false">
          <span>Sign In to School Workspace</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </router-link>
      </div>
    </header>

    <main>
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-content">
            <div class="hero-pill">
              <span class="pill-dot"></span>
              <span>DepEd Order No. 8, s. 2015 Verified &amp; Standardized</span>
            </div>

            <h1 class="hero-headline">
              School attendance and DepEd Form 2, <br class="hero-br" />
              <span class="hero-accent">accurate and effortless.</span>
            </h1>

            <p class="hero-description">
              ElyTrack replaces slow paper registers and broken spreadsheet templates with a purpose-built system for Philippine elementary and secondary schools. Record class attendance in 60 seconds, automate monthly SF2 reports with 100% mathematical accuracy, and spot dropout risks before it is too late.
            </p>

            <div class="hero-cta-group">
              <button type="button" class="btn-primary" @click="scrollToSection('pricing')">
                <span>View School Plans</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <button type="button" class="btn-secondary" @click="scrollToSection('demo')">
                <span>Explore Live Simulator</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <!-- Trust Bar / Key Guarantees -->
            <div class="hero-proof-bar">
              <div class="proof-unit">
                <span class="proof-val">&lt; 90s</span>
                <span class="proof-desc">Daily Class Roll Call</span>
              </div>
              <div class="proof-divider"></div>
              <div class="proof-unit">
                <span class="proof-val">100%</span>
                <span class="proof-desc">DepEd SF2 Math Compliance</span>
              </div>
              <div class="proof-divider"></div>
              <div class="proof-unit">
                <span class="proof-val">1-Click</span>
                <span class="proof-desc">Certified Excel Export</span>
              </div>
            </div>
          </div>

          <!-- Interactive Simulator Console -->
          <div id="demo" class="hero-demo-col">
            <div class="demo-window">
              <!-- Window Chrome -->
              <div class="demo-header">
                <div class="window-buttons">
                  <span class="dot dot--red"></span>
                  <span class="dot dot--yellow"></span>
                  <span class="dot dot--green"></span>
                </div>
                <div class="window-title">{{ activeSchool?.name || 'Database school preview' }}</div>
                <span class="window-badge">Interactive Demo</span>
              </div>

              <!-- Simulator Tabs -->
              <div class="demo-tabs">
                <button
                  type="button"
                  class="demo-tab-btn"
                  :class="{ 'is-active': activeDemoTab === 'rollcall' }"
                  @click="activeDemoTab = 'rollcall'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span>Class Roll Call</span>
                </button>
                <button
                  type="button"
                  class="demo-tab-btn"
                  :class="{ 'is-active': activeDemoTab === 'sf2' }"
                  @click="activeDemoTab = 'sf2'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                  </svg>
                  <span>DepEd SF2 Summary</span>
                </button>
                <button
                  type="button"
                  class="demo-tab-btn"
                  :class="{ 'is-active': activeDemoTab === 'sardo' }"
                  @click="activeDemoTab = 'sardo'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>SARDO Retention</span>
                </button>
              </div>

              <!-- TAB 1: Live Interactive Roll Call -->
              <div v-if="activeDemoTab === 'rollcall'" class="demo-screen">
                <div class="screen-topline">
                  <div>
                    <span class="screen-kicker">{{ previewContextLabel }}</span>
                    <h3 class="screen-heading">Advisory Daily Roll Call</h3>
                  </div>
                  <div class="attendance-pill">
                    <span class="pulse-indicator"></span>
                    <span>Present: <strong>{{ calculatedAttendanceRate }}%</strong></span>
                  </div>
                </div>

                <div v-if="demoStudents.length" class="student-roster">
                  <div
                    v-for="(st, idx) in demoStudents"
                    :key="st.id"
                    class="roster-row"
                    :class="{ 'roster-row--absent': st.status === 'Absent' }"
                  >
                    <span class="roster-index">#{{ idx + 1 }}</span>
                    <div class="roster-info">
                      <strong>{{ st.name }}</strong>
                      <small>{{ st.gender || 'Learner' }}<span v-if="st.lrn"> · LRN: {{ st.lrn }}</span></small>
                    </div>

                    <div class="period-slots" title="Morning and Afternoon Sessions">
                      <span class="slot" :class="'slot--' + st.am1.toLowerCase()">{{ st.am1 }}</span>
                      <span class="slot" :class="'slot--' + st.am2.toLowerCase()">{{ st.am2 }}</span>
                      <span class="slot" :class="'slot--' + st.am3.toLowerCase()">{{ st.am3 }}</span>
                      <span class="slot" :class="'slot--' + st.am4.toLowerCase()">{{ st.am4 }}</span>
                    </div>

                    <button
                      type="button"
                      class="status-toggle-btn"
                      :class="st.status === 'Present' ? 'is-present' : 'is-absent'"
                      @click="toggleStudentStatus(idx)"
                      :title="'Toggle ' + st.name + '\'s attendance mark'"
                    >
                      <span>{{ st.status }}</span>
                    </button>
                  </div>
                </div>
                <div v-else class="demo-empty-notice">Learner roster is loaded directly from the database.</div>

                <div class="demo-tip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Click any student status badge above to toggle Present/Absent and see real-time section calculations update.</span>
                </div>
              </div>

              <!-- TAB 2: DepEd Form 2 Preview -->
              <div v-if="activeDemoTab === 'sf2'" class="demo-screen">
                <div class="screen-topline">
                  <div>
                    <span class="screen-kicker">OFFICIAL DEPED FORM 2 (SF2) ENGINE</span>
                    <h3 class="screen-heading">Monthly Attendance Metrics</h3>
                  </div>
                  <span class="certified-tag">DO 8, s. 2015</span>
                </div>

                <div class="sf2-metrics-grid">
                  <div class="sf2-metric-box">
                    <span class="sm-label">Enrolled Learners</span>
                    <span class="sm-val">{{ landingStats.totalStudents }}</span>
                    <span class="sm-sub">{{ landingStats.maleStudents }} Male · {{ landingStats.femaleStudents }} Female</span>
                  </div>
                  <div class="sf2-metric-box sf2-metric-box--highlight">
                    <span class="sm-label">Average Daily Attendance</span>
                    <span class="sm-val">{{ landingStats.averageDailyAttendance }}</span>
                    <span class="sm-sub">{{ landingStats.attendanceRate }}% Monthly Attendance</span>
                  </div>
                  <div class="sf2-metric-box">
                    <span class="sm-label">School Days in Month</span>
                    <span class="sm-val">{{ landingStats.schoolDays }}</span>
                    <span class="sm-sub">{{ landingStats.monthLabel || 'No month selected' }}</span>
                  </div>
                  <div class="sf2-metric-box">
                    <span class="sm-label">SARDO Watchlist</span>
                    <span class="sm-val">{{ landingStats.atRiskStudents }}</span>
                    <span class="sm-sub">{{ landingStats.retentionLabel }}</span>
                  </div>
                </div>

                <div class="sf2-download-preview">
                  <div class="dp-copy">
                    <strong>Standard DepEd Form 2 Excel (.xlsx)</strong>
                    <p>Pre-populated with student names, 12-digit LRNs, daily session marks, and verified summary totals.</p>
                  </div>
                  <router-link to="/login" class="dp-btn">
                    <span>Export Preview</span>
                    <span>→</span>
                  </router-link>
                </div>
              </div>

              <!-- TAB 3: SARDO Watchlist -->
              <div v-if="activeDemoTab === 'sardo'" class="demo-screen">
                <div class="screen-topline">
                  <div>
                    <span class="screen-kicker">DROPOUT PREVENTION RADAR</span>
                    <h3 class="screen-heading">Students At Risk of Dropping Out</h3>
                  </div>
                  <span class="sardo-count">{{ riskStudents.length }} Learners Flagged</span>
                </div>

                <div v-if="riskStudents.length" class="sardo-list">
                  <div v-for="student in riskStudents" :key="student.id" class="sardo-item">
                    <div class="sardo-marker" :class="'marker--' + student.risk"></div>
                    <div class="sardo-meta">
                      <strong>{{ student.name }}</strong>
                      <span>{{ student.grade }} - {{ student.section }} · {{ student.detail }}</span>
                    </div>
                    <span class="sardo-action-pill">{{ student.action }}</span>
                  </div>
                </div>
                <div v-else class="demo-empty-notice">No retention risks currently flagged in the database.</div>

                <div class="sardo-notice">
                  <span>Adviser alert: Automatic notifications trigger at 3 consecutive or 5 cumulative absences in a month to initiate home visitation protocols.</span>
                </div>
              </div>

              <!-- Console Bottom Context -->
              <div class="demo-footer">
                <div class="footer-school-info">
                  <img src="/elytrack-logo.png" alt="Logo" class="fsi-logo" />
                  <div>
                    <strong>{{ activeSchool?.name || 'Database school workspace' }}</strong>
                    <small v-if="activeSchool?.school_id">DepEd School ID: {{ activeSchool.school_id }} · Institutional Node</small>
                    <small v-else>Active School Workspace</small>
                  </div>
                </div>
                <div class="fsi-status">
                  <span class="status-badge">DepEd Certified</span>
                  <span class="status-badge status-badge--active">Online &amp; Synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Trust & Standards Strip -->
      <section class="standards-strip">
        <div class="standards-inner">
          <span class="standards-kicker">STANDARDIZED OPERATIONAL EXCELLENCE FOR PHILIPPINE SCHOOLS</span>
          <div class="standards-row">
            <div class="standard-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <span>DepEd Order No. 8, s. 2015 Compliant</span>
            </div>
            <div class="standard-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Philippine Data Privacy Act (RA 10173)</span>
            </div>
            <div class="standard-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <span>1-Click Certified Excel SF2 Generation</span>
            </div>
            <div class="standard-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Role-Isolated School Database Scopes</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Core Features Grid -->
      <section id="features" class="landing-section">
        <div class="section-header">
          <span class="section-kicker">Core System Capabilities</span>
          <h2>Built for the reality of Philippine classrooms.</h2>
          <p>
            No fluff, no bloated menus. ElyTrack focuses strictly on solving the real daily attendance and monthly reporting pain points experienced by teachers and school administrators.
          </p>
        </div>

        <div class="features-grid">
          <!-- Feature 1: Fast Roll Call -->
          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3>Under 90-Second Daily Roll Call</h3>
            <p>
              Advisers can record morning and afternoon sessions rapidly on mobile phones or laptops. Standard presets support Entered, Tardy, Excused Absence, and Not in Prescribed Uniform (NIPU) codes.
            </p>
            <div class="feature-badge-row">
              <span class="f-code f-code--e">E · Present</span>
              <span class="f-code f-code--t">T · Tardy</span>
              <span class="f-code f-code--a">A · Absent</span>
              <span class="f-code f-code--n">NIPU · Uniform</span>
            </div>
          </div>

          <!-- Feature 2: Automated SF2 -->
          <div class="feature-card feature-card--featured">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Automated DepEd Form 2 Calculations</h3>
            <p>
              Average Daily Attendance (ADA), percentage of attendance, and daily tallies calculate automatically in real time without corrupted formulas or broken Excel cells.
            </p>
            <div class="feature-highlight-box">
              <span>DepEd Order No. 8, s. 2015 Mathematical Rules Fully Enforced</span>
            </div>
          </div>

          <!-- Feature 3: SARDO Intervention -->
          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <h3>SARDO Early Dropout Prevention</h3>
            <p>
              Automated alerts detect students reaching 3 consecutive or 5 cumulative absences in a month. Enables prompt home visits, parent communication, and guidance intervention before students drop out.
            </p>
          </div>

          <!-- Feature 4: Administrative Governance -->
          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3>48-Hour Cutoff Locks &amp; Audit Logs</h3>
            <p>
              Attendance records lock 48 hours after submission to guarantee historical data integrity. Reopening requires principal justification and creates a permanent, auditable correction trail.
            </p>
          </div>

          <!-- Feature 5: Bulk Import -->
          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <h3>Bulk Learner Masterlist Ingestion</h3>
            <p>
              Upload your school masterlist via CSV. Validates 12-digit Learner Reference Numbers (LRN), filters duplicates, and assigns students to sections in minutes.
            </p>
          </div>

          <!-- Feature 6: Isolated Scopes -->
          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3>Isolated Campus Workspaces</h3>
            <p>
              Strict database tenancy ensures each school's student attendance and faculty records are completely isolated and confidential under RA 10173 (Data Privacy Act).
            </p>
          </div>
        </div>
      </section>

      <!-- DepEd Form 2 Comparison: Excel vs ElyTrack -->
      <section id="sf2" class="landing-section sf2-comparison-section">
        <div class="section-header">
          <span class="section-kicker">The Modern Standard</span>
          <h2>The end of broken spreadsheet templates.</h2>
          <p>
            Traditional DepEd SF2 preparation relies on circulating complex Excel files between teachers. A single overwritten cell formula or missing student row corrupts the entire month-end submission.
          </p>
        </div>

        <div class="comparison-container">
          <div class="compare-card compare-card--legacy">
            <div class="cc-header">
              <span class="cc-tag">Traditional Method</span>
              <h3>Manual Paper Slips &amp; Excel Templates</h3>
            </div>
            <ul class="cc-list">
              <li>
                <div class="cc-bullet cc-bullet--cross">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <strong>Fragile Excel formulas</strong>
                  <p>Accidental typing overwrites formulas for ADA and percentage of attendance, forcing tedious manual re-checks.</p>
                </div>
              </li>
              <li>
                <div class="cc-bullet cc-bullet--cross">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <strong>End-of-month panic</strong>
                  <p>Advisers spend 4 to 8 hours counting tick marks and reconciling conflicting numbers on the deadline date.</p>
                </div>
              </li>
              <li>
                <div class="cc-bullet cc-bullet--cross">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <strong>Late dropout detection</strong>
                  <p>Unexcused absences stay hidden in teacher registers until the monthly tally is completed, when it is too late to intervene.</p>
                </div>
              </li>
              <li>
                <div class="cc-bullet cc-bullet--cross">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </div>
                <div>
                  <strong>Zero change audit trail</strong>
                  <p>Thumb-drives and emailed spreadsheets lack timestamped logs of who modified an attendance record or why.</p>
                </div>
              </li>
            </ul>
          </div>

          <div class="compare-card compare-card--elytrack">
            <div class="cc-header">
              <span class="cc-tag cc-tag--teal">ElyTrack Engine</span>
              <h3>Verified Institutional Automation</h3>
            </div>
            <ul class="cc-list">
              <li>
                <div class="cc-bullet cc-bullet--check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <strong>Protected database math</strong>
                  <p>Calculations adhere strictly to DepEd Order No. 8, s. 2015. Zero accidental formula deletions or corrupted cells.</p>
                </div>
              </li>
              <li>
                <div class="cc-bullet cc-bullet--check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <strong>1-Click official Excel export</strong>
                  <p>Generate division-ready DepEd SF2 Excel workbooks with official headers and signature blocks in seconds.</p>
                </div>
              </li>
              <li>
                <div class="cc-bullet cc-bullet--check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <strong>Real-time SARDO alerts</strong>
                  <p>Automated alerts notify advisers and guidance counselors as soon as a learner reaches attendance warning thresholds.</p>
                </div>
              </li>
              <li>
                <div class="cc-bullet cc-bullet--check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <strong>Tamper-proof audit logs</strong>
                  <p>48-hour submission cutoff locks records automatically. Any administrative edit requires a reason and is permanently logged.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Time Saved Calculator -->
      <section id="calculator" class="landing-section calculator-section">
        <div class="calculator-card">
          <div class="calc-copy">
            <span class="section-kicker">Faculty Productivity</span>
            <h2>Estimate hours returned to teaching.</h2>
            <p>
              See how many faculty hours your school recovers each month by moving from paper tallies and manual Excel crunching to ElyTrack.
            </p>
          </div>

          <div class="calc-widget">
            <div class="calc-slider-box">
              <div class="calc-label-row">
                <label for="sections-slider">Number of Advisory Sections:</label>
                <span class="calc-val-pill">{{ sectionCount }} Sections</span>
              </div>
              <input
                id="sections-slider"
                type="range"
                min="0"
                max="80"
                step="1"
                v-model.number="sectionCount"
                class="calc-slider"
              />
              <div class="calc-ticks">
                <span>5 sections (Small School)</span>
                <span>40 sections</span>
                <span>80 sections (Large Campus)</span>
              </div>

              <div class="calc-facts">
                <div class="cf-row">
                  <span>Manual roll call &amp; monthly manual math:</span>
                  <strong>{{ sectionCount * 18 }} hrs / mo</strong>
                </div>
                <div class="cf-row cf-row--highlight">
                  <span>With ElyTrack automated platform:</span>
                  <strong>&lt; {{ Math.round(sectionCount * 0.8) }} hrs / mo</strong>
                </div>
              </div>
            </div>

            <div class="calc-result-box">
              <span class="cr-badge">Total Faculty Hours Saved</span>
              <div class="cr-stat">
                <span class="cr-number">{{ hoursSavedMonthly }}</span>
                <span class="cr-unit">Hours / month</span>
              </div>
              <p class="cr-desc">
                Equivalent to approximately <strong>{{ Math.round(hoursSavedMonthly / 8) }} full workdays</strong> of teacher time returned every month to student mentorship and lesson planning.
              </p>
              <button type="button" class="btn-primary" @click="scrollToSection('pricing')">
                <span>View School Licensing Plans</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Institutional Pricing Section -->
      <section id="pricing" class="landing-section pricing-section">
        <div class="section-header">
          <span class="section-kicker">Institutional Pricing</span>
          <h2>Simple, predictable licensing for Philippine schools.</h2>
          <p>
            Transparent plans backed by secure database licenses. Access locks automatically if suspended. No hidden setup fees or per-student microtransactions.
          </p>

          <!-- Billing Cycle Switcher -->
          <div class="billing-toggle-wrap">
            <div class="billing-toggle">
              <button
                type="button"
                class="toggle-btn"
                :class="{ 'is-active': billingCycle === 'monthly' }"
                @click="billingCycle = 'monthly'"
              >
                Monthly Billing
              </button>
              <button
                type="button"
                class="toggle-btn"
                :class="{ 'is-active': billingCycle === 'annual' }"
                @click="billingCycle = 'annual'"
              >
                <span>Annual Term</span>
                <span v-if="annualSavingsLabel" class="discount-badge">{{ annualSavingsLabel }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Pricing Cards Grid -->
        <div v-if="formattedPlans.length" class="pricing-cards-grid">
          <div
            v-for="plan in formattedPlans"
            :key="plan.id"
            class="pricing-card"
            :class="{ 'pricing-card--popular': plan.is_featured }"
          >
            <div v-if="plan.is_featured && plan.badge" class="popular-ribbon">{{ plan.badge }}</div>

            <div class="pricing-card-top">
              <div class="plan-header-row">
                <span class="plan-tier-tag">{{ plan.tag }}</span>
                <span v-if="Number(plan.trial_days || 0) > 0" class="plan-trial-badge">{{ plan.trial_days }}-Day Evaluation Available</span>
              </div>
              <h3 class="plan-name">{{ plan.name }}</h3>
              <p class="plan-description">{{ plan.description }}</p>
            </div>

            <div class="pricing-card-rate">
              <div class="rate-amount-row">
                <span class="currency">₱</span>
                <span class="amount">
                  {{ billingCycle === 'annual' ? Number(plan.price_annual_monthly || 0).toLocaleString() : Number(plan.price_monthly || 0).toLocaleString() }}
                </span>
                <span class="interval">/ month</span>
              </div>
              <span class="billing-subtext">
                {{
                  billingCycle === 'annual'
                    ? `Billed ₱${Number(plan.billing_annual_total || 0).toLocaleString()} annually${plan.billing_months ? ` (${plan.billing_months}-month academic year)` : ''}`
                    : 'Billed monthly'
                }}
              </span>
            </div>

            <!-- CTA Button -->
            <a
              v-if="Number(plan.trial_days || 0) <= 0 && plan.cta_url && plan.cta_url.startsWith('mailto:')"
              :href="plan.cta_url"
              class="plan-cta-btn"
              :class="plan.is_featured ? 'plan-cta-btn--featured' : ''"
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
              class="plan-cta-btn"
              :class="plan.is_featured ? 'plan-cta-btn--featured' : ''"
            >
              <span>{{ getPlanCtaLabel(plan) }}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </router-link>

            <!-- Features List -->
            <div class="plan-features">
              <span class="features-heading">Plan Capabilities:</span>
              <ul>
                <li v-for="(feat, fIdx) in plan.features" :key="fIdx">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="feat-check">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{{ feat }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div v-else class="pricing-empty-state">
          <strong>Licensing plans are being configured.</strong>
          <span>Plan pricing and trial availability will appear here once published by the platform administrator.</span>
        </div>

        <!-- Capability Comparison Table -->
        <div class="pricing-matrix-wrap">
          <div class="matrix-header">
            <h3>Detailed Feature Comparison</h3>
            <p>Comprehensive side-by-side comparison of capacity, compliance, and governance features.</p>
          </div>

          <div class="matrix-scroll-wrap">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="col-capability">Feature &amp; Capability</th>
                  <th
                    v-for="plan in matrixPlans"
                    :key="plan.id"
                    class="col-tier"
                    :class="{ 'col-tier--featured': plan.is_featured }"
                  >
                    {{ plan.name }}<br /><small>{{ planPriceLabel(plan) }}</small>
                  </th>
                </tr>
              </thead>
              <tbody v-if="matrixRows.length">
                <tr class="cat-row">
                  <td :colspan="matrixColumnCount">Plan capabilities</td>
                </tr>
                <tr v-for="row in matrixRows" :key="row.name" class="data-row">
                  <td class="cell-capability">
                    <strong>{{ row.name }}</strong>
                    <small>{{ row.desc }}</small>
                  </td>
                  <td
                    v-for="plan in matrixPlans"
                    :key="`${row.name}-${plan.id}`"
                    class="cell-val"
                    :class="{ 'cell-val--featured': plan.is_featured }"
                  >
                    <svg v-if="row.planIds.includes(plan.id)" class="check-icon" :class="{ 'check-icon--teal': plan.is_featured }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-label="Included"><polyline points="20 6 9 17 4 12" /></svg>
                    <span v-else class="dash-icon">—</span>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td :colspan="matrixColumnCount" class="matrix-empty-cell">Plan capabilities will appear when database plans are published.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Trust & Procurement Guarantees -->
        <div class="trust-guarantees">
          <div class="tg-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            <div>
              <strong>DepEd Order No. 8, s. 2015</strong>
              <p>Standardized formulas matching national DepEd guidelines for ADA and monthly summaries.</p>
            </div>
          </div>
          <div class="tg-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <div>
              <strong>Data Privacy Act (RA 10173)</strong>
              <p>Role-scoped database architecture protecting student and learner confidentiality.</p>
            </div>
          </div>
          <div class="tg-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 14 14"></polyline>
            </svg>
            <div>
              <strong>Database-Backed Licenses</strong>
              <p>Secure license verification. Subscriptions can be reviewed, renewed, or upgraded at any time.</p>
            </div>
          </div>
          <div class="tg-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
            <div>
              <strong>Official Invoicing &amp; Receipts</strong>
              <p>PhilGEPS and DepEd MOOE procurement ready. Official billing invoices available upon settlement.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Frequently Asked Questions -->
      <section id="faq" class="landing-section faq-section">
        <div class="section-header">
          <span class="section-kicker">Common Inquiries</span>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about ElyTrack deployment, DepEd compliance, and workspace licensing.</p>
        </div>

        <div class="faq-accordion">
          <div
            v-for="(item, idx) in faqItems"
            :key="idx"
            class="faq-card"
            :class="{ 'is-expanded': activeFaq === idx }"
            @click="toggleFaq(idx)"
          >
            <div class="faq-question-row">
              <strong>{{ item.q }}</strong>
              <span class="faq-icon" aria-hidden="true">{{ activeFaq === idx ? '−' : '+' }}</span>
            </div>
            <p v-if="activeFaq === idx" class="faq-answer-text">
              {{ item.a }}
            </p>
          </div>
        </div>
      </section>

      <!-- Bottom Statement Banner -->
      <section class="landing-statement-section">
        <div class="statement-card">
          <div class="sc-content">
            <span class="statement-kicker">Modernize Your School</span>
            <h2>Bring verified attendance and calm operations to your faculty.</h2>
            <p>
              Sign in with your authorized school credentials, or register your school workspace to begin your evaluation.
            </p>
          </div>
          <div class="sc-actions">
            <router-link to="/login" class="btn-primary btn-primary--light">
              <span>Sign In to School Workspace</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </router-link>
            <a href="mailto:ely.ashzyl@gmail.com" class="btn-secondary btn-secondary--transparent">
              <span>Contact Deployment Team</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-brand-col">
          <div class="footer-brand-header">
            <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="footer-logo" />
            <div>
              <strong>ElyTrack</strong>
              <small>DepEd SF2 &amp; School Operations Platform</small>
            </div>
          </div>
          <p class="footer-bio">
            Built specifically for Philippine public and private schools. Standardized calculations matching DepEd Order No. 8, s. 2015.
          </p>
        </div>

        <div class="footer-nav-col">
          <span class="footer-nav-title">Navigation</span>
          <button type="button" class="footer-link-btn" @click="scrollToSection('demo')">Live Simulator</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('features')">Platform</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('sf2')">DepEd SF2 Standard</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('calculator')">Time Saved Calculator</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('pricing')">Licensing &amp; Plans</button>
          <button type="button" class="footer-link-btn" @click="scrollToSection('faq')">FAQ</button>
          <router-link to="/login" class="footer-link">Sign In</router-link>
        </div>
      </div>

      <div class="footer-legal">
        <span>&copy; {{ currentYear }} ElyTrack. Built for Philippine Schools. DepEd Form 2 Certified.</span>
        <span>Strict RA 10173 Data Privacy Compliance</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()

const currentYear = new Date().getFullYear()
const billingCycle = ref('annual')
const activeDemoTab = ref('rollcall')
const mobileNavOpen = ref(false)
const sectionCount = ref(0)
const activeFaq = ref(0)

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
  if (!student?.grade && !student?.section) return 'PHILIPPINE CLASSROOM SIMULATOR'
  return `${student.grade || 'GRADE'} · ${student.section || 'SECTION'} · ADVISORY CLASS`
})

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
      if (data.stats) {
        sectionCount.value = Number(data.stats.totalSections || 0)
        landingStats.value = {
          ...landingStats.value,
          ...data.stats,
          monthLabel: data.stats.monthLabel || ''
        }
      }
      demoStudents.value = Array.isArray(data.previewStudents)
        ? data.previewStudents.map(st => ({
            ...st,
            status: st.status || 'Unmarked',
            am1: st.am1 || '',
            am2: st.am2 || '',
            am3: st.am3 || '',
            am4: st.am4 || ''
          }))
        : []
      riskStudents.value = Array.isArray(data.riskStudents) ? data.riskStudents : []
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
  return Math.round(sectionCount.value * 17.2)
})

const formattedPlans = computed(() => plans.value)
const matrixPlans = computed(() => formattedPlans.value)
const matrixColumnCount = computed(() => matrixPlans.value.length + 1)
const matrixRows = computed(() => {
  const rows = new Map()
  for (const plan of matrixPlans.value) {
    const features = Array.isArray(plan.features) ? plan.features : []
    for (const feature of features) {
      const name = typeof feature === 'string' ? feature.trim() : String(feature?.name || '').trim()
      if (!name) continue
      const current = rows.get(name) || { name, desc: '', planIds: [] }
      if (typeof feature === 'object' && feature?.description && !current.desc) current.desc = feature.description
      if (!current.planIds.includes(plan.id)) current.planIds.push(plan.id)
      rows.set(name, current)
    }
  }
  return Array.from(rows.values())
})
const annualSavingsLabel = computed(() => {
  const savings = matrixPlans.value
    .map(plan => {
      const monthly = Number(plan.price_monthly || 0)
      const annual = Number(plan.billing_annual_total || 0)
      const months = Number(plan.billing_months || 12)
      return monthly > 0 && annual > 0 ? (monthly * months) - annual : 0
    })
    .filter(value => value > 0)
  if (!savings.length) return ''
  return 'Save on annual billing'
})

function planPriceLabel(plan) {
  const amount = billingCycle.value === 'annual' ? plan.price_annual_monthly : plan.price_monthly
  return amount ? `₱${Number(amount).toLocaleString()} / mo` : 'Price configured in database'
}

const faqItems = [
  {
    q: 'Is ElyTrack officially compliant with DepEd Order No. 8, s. 2015?',
    a: 'Yes. ElyTrack implements the exact formulas required by the Department of Education for Average Daily Attendance (ADA), monthly percentage of attendance, and SARDO monitoring.'
  },
  {
    q: 'Can we download the official DepEd Form 2 as an Excel spreadsheet?',
    a: 'Yes. ElyTrack generates standard, pre-formatted DepEd Form 2 (.xlsx) files with all headers, student rows, monthly session marks, formulas, and verified sign-off blocks intact and ready for printing.'
  },
  {
    q: 'How does the free trial work?',
    a: 'Trial duration and student capacity are configured per plan in our database. You can start an evaluation immediately without upfront payment to set up your school workspace and test daily roll calls.'
  },
  {
    q: 'What happens if a school license expires or is suspended?',
    a: 'ElyTrack features database-backed license enforcement. If a school license is suspended or expires without renewal, faculty workspaces lock safely to preserve historical data until reactivated.'
  },
  {
    q: 'How is student data protected under the Philippine Data Privacy Act (RA 10173)?',
    a: 'ElyTrack isolates each school into independent database scopes. Data is encrypted in transit and at rest, and all edits after the 48-hour submission cutoff require administrative justification and audit logging.'
  },
  {
    q: 'What payment channels are supported for official subscriptions?',
    a: 'ElyTrack accepts GCash, Maya, QR Ph, and direct Philippine bank transfers (BDO, BPI, Landbank, UnionBank). Account details and instant QR codes are revealed immediately after creating your school workspace.'
  }
]

function getPlanCtaLabel(plan) {
  const trialDays = Number(plan?.trial_days || 0)
  if (trialDays > 0) {
    return `Start ${trialDays}-Day Free Trial`
  }
  if (plan?.cta_url && plan.cta_url.startsWith('mailto:')) {
    return plan.cta_text || 'Inquire for Division SLA'
  }
  return billingCycle.value === 'annual' ? 'Subscribe Annually' : 'Subscribe Monthly'
}

function planCta(plan) {
  const cycleParam = billingCycle.value === 'annual' ? '&billing=annual' : '&billing=monthly'
  if (Number(plan?.trial_days || 0) > 0) {
    return `/subscribe?plan=${encodeURIComponent(plan.tier || plan.id)}` + cycleParam
  }
  if (plan?.cta_url && plan.cta_url.startsWith('mailto:')) {
    return plan.cta_url
  }
  return `/subscribe?plan=${encodeURIComponent(plan.tier || plan.id)}` + cycleParam
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
/* ==========================================================================
   BASE & RESET
   ========================================================================== */
.landing-page {
  min-height: 100vh;
  background: var(--landing-paper);
  color: var(--foreground);
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
}

#demo,
#features,
#sf2,
#calculator,
#pricing,
#faq {
  scroll-margin-top: 88px;
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
  background: color-mix(in srgb, var(--landing-paper) 95%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.landing-nav-inner {
  max-width: 1240px;
  height: 72px;
  padding: 0 28px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.landing-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.landing-brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.landing-brand-meta {
  display: flex;
  flex-direction: column;
}

.landing-brand-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.landing-brand-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--primary);
}

.landing-nav-links {
  display: none;
  align-items: center;
  gap: 8px;
}

@media (min-width: 960px) {
  .landing-nav-links {
    display: flex;
  }
}

.nav-item {
  background: transparent;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.nav-item:hover {
  color: var(--primary-hover);
  background: var(--muted);
}

.landing-nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--secondary);
  color: var(--foreground);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.nav-theme-btn:hover {
  background: var(--muted);
  border-color: var(--primary-hover);
  color: var(--primary-hover);
  transform: translateY(-1px);
}

.nav-theme-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.nav-signin-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 8px;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.15s ease;
}

.nav-signin-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.mobile-menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  color: var(--foreground);
  cursor: pointer;
}

@media (min-width: 960px) {
  .mobile-menu-toggle {
    display: none;
  }
}

.mobile-nav-panel {
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  gap: 8px;
}

.mobile-nav-item {
  text-align: left;
  background: transparent;
  border: none;
  padding: 12px 14px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--foreground);
  border-radius: 8px;
  cursor: pointer;
}

.mobile-nav-item:hover {
  background: var(--muted);
  color: var(--primary-hover);
}

.mobile-theme-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-sign-in-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 14px 18px;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 9px;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
}

/* ==========================================================================
   HERO SECTION
   ========================================================================== */
.hero-section {
  padding: 64px 28px 80px;
  background: linear-gradient(180deg, var(--landing-paper-deep) 0%, var(--landing-paper) 100%);
  border-bottom: 1px solid var(--border);
}

.hero-container {
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
  align-items: center;
}

@media (min-width: 1040px) {
  .hero-container {
    grid-template-columns: 1.05fr 1fr;
    gap: 56px;
  }
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--landing-teal-light);
  border: 1px solid var(--landing-line-strong);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 20px;
}

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
}

.hero-headline {
  font-size: clamp(2.2rem, 3.8vw, 3.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--foreground);
  margin: 0 0 20px;
}

.hero-accent {
  color: var(--primary);
}

.hero-description {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--muted-foreground);
  max-width: 580px;
  margin: 0 0 32px;
}

.hero-cta-group {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 24px;
  border-radius: 9px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 25%, transparent);
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--primary) 35%, transparent);
}

.btn-primary--light {
  background: var(--landing-card);
  color: var(--foreground);
  box-shadow: var(--shadow-lg);
}

.btn-primary--light:hover {
  background: var(--muted);
  color: var(--primary-hover);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 22px;
  border-radius: 9px;
  background: var(--card);
  color: var(--foreground);
  font-size: 0.95rem;
  font-weight: 700;
  border: 1px solid var(--border);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--muted);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-secondary--transparent {
  background: transparent;
  color: var(--sidebar-foreground);
  border-color: color-mix(in srgb, var(--sidebar-foreground) 30%, transparent);
}

.btn-secondary--transparent:hover {
  background: color-mix(in srgb, var(--sidebar-foreground) 10%, transparent);
  border-color: var(--sidebar-foreground);
}

/* Proof Bar */
.hero-proof-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.proof-unit {
  display: flex;
  flex-direction: column;
}

.proof-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1.2;
}

.proof-desc {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.proof-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
}

/* ==========================================================================
   SIMULATOR CONSOLE
   ========================================================================== */
.hero-demo-col {
  width: 100%;
}

.demo-window {
  background: var(--landing-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.demo-header {
  height: 48px;
  padding: 0 18px;
  background: var(--muted);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.window-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot--red { background: var(--destructive); }
.dot--yellow { background: var(--warning); }
.dot--green { background: var(--success); }

.window-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--muted-foreground);
}

.window-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary);
  background: var(--landing-teal-light);
  border: 1px solid var(--landing-line-strong);
  padding: 2px 8px;
  border-radius: 999px;
}

.demo-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: var(--landing-card);
}

.demo-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted-foreground);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease;
}

.demo-tab-btn:hover {
  color: var(--primary);
}

.demo-tab-btn.is-active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  background: var(--landing-teal-light);
}

.demo-screen {
  padding: 20px 22px;
  background: var(--card);
}

.screen-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.screen-kicker {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--primary);
  text-transform: uppercase;
  margin-bottom: 2px;
}

.screen-heading {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
}

.attendance-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--landing-teal-light);
  border: 1px solid var(--landing-line-strong);
  font-size: 0.78rem;
  color: var(--primary);
}

.pulse-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary);
}

/* Roster Rows */
.student-roster {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.roster-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.12s ease;
}

.roster-row--absent {
  background: color-mix(in srgb, var(--destructive) 10%, transparent);
  border-color: color-mix(in srgb, var(--destructive) 28%, transparent);
}

.roster-index {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted-foreground);
  min-width: 24px;
}

.roster-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.roster-info strong {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--foreground);
}

.roster-info small {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.period-slots {
  display: flex;
  align-items: center;
  gap: 4px;
}

.slot {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 800;
  background: var(--muted);
  color: var(--muted-foreground);
}

.slot--e { background: var(--success-bg); color: var(--success); }
.slot--t { background: var(--warning-bg); color: var(--warning); }
.slot--a { background: color-mix(in srgb, var(--destructive) 12%, transparent); color: var(--destructive); }

.status-toggle-btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.status-toggle-btn:hover {
  transform: scale(1.04);
}

.status-toggle-btn.is-present {
  background: var(--primary);
  color: var(--primary-foreground);
}

.status-toggle-btn.is-absent {
  background: var(--destructive);
  color: var(--destructive-foreground);
}

.demo-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 8px 12px;
  border-radius: 7px;
  background: var(--landing-teal-light);
  border: 1px solid var(--landing-line-strong);
  font-size: 0.74rem;
  color: var(--primary);
  line-height: 1.4;
}

/* SF2 Metrics Grid */
.sf2-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.sf2-metric-box {
  padding: 12px 14px;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.sf2-metric-box--highlight {
  background: var(--landing-teal-light);
  border-color: var(--landing-line-strong);
}

.sm-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted-foreground);
  margin-bottom: 4px;
}

.sm-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--foreground);
}

.sm-sub {
  font-size: 0.7rem;
  color: var(--primary);
  font-weight: 600;
  margin-top: 2px;
}

.sf2-download-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  border-radius: 8px;
}

.dp-copy strong {
  display: block;
  font-size: 0.84rem;
  margin-bottom: 2px;
}

.dp-copy p {
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--sidebar-foreground) 72%, transparent);
  margin: 0;
}

.dp-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

/* SARDO Watchlist */
.sardo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.sardo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--destructive);
  background: color-mix(in srgb, var(--destructive) 10%, transparent);
  border-radius: 8px;
}

.sardo-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--destructive);
}

.sardo-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sardo-meta strong {
  font-size: 0.85rem;
  color: var(--foreground);
}

.sardo-meta span {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.sardo-action-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--landing-card);
  border: 1px solid var(--destructive);
  color: var(--destructive);
}

.sardo-notice {
  font-size: 0.74rem;
  color: var(--muted-foreground);
  line-height: 1.45;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--muted);
}

.demo-empty-notice {
  padding: 24px;
  text-align: center;
  color: var(--muted-foreground);
  font-size: 0.85rem;
}

/* Console Footer */
.demo-footer {
  padding: 12px 18px;
  background: var(--muted);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.footer-school-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fsi-logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.footer-school-info strong {
  display: block;
  font-size: 0.82rem;
  color: var(--foreground);
  line-height: 1.2;
}

.footer-school-info small {
  font-size: 0.7rem;
  color: var(--muted-foreground);
}

.fsi-status {
  display: flex;
  gap: 6px;
}

.status-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--muted);
  color: var(--muted-foreground);
}

.status-badge--active {
  background: var(--success-bg);
  color: var(--success);
}

/* ==========================================================================
   STANDARDS STRIP
   ========================================================================== */
.standards-strip {
  padding: 28px 24px;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
}

.standards-inner {
  max-width: 1240px;
  margin: 0 auto;
}

.standards-kicker {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--primary);
  text-align: center;
  margin-bottom: 16px;
}

.standards-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
}

.standard-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--sidebar-foreground) 82%, transparent);
}

.standard-item svg {
  color: var(--primary);
}

/* ==========================================================================
   SECTION COMMON STYLES
   ========================================================================== */
.landing-section {
  padding: 80px 28px;
  max-width: 1240px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 52px;
}

.section-kicker {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 8px;
}

.section-header h2 {
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--foreground);
  margin: 0 0 14px;
  line-height: 1.2;
}

.section-header p {
  font-size: 0.98rem;
  line-height: 1.6;
  color: var(--muted-foreground);
  margin: 0;
}

/* ==========================================================================
   FEATURES GRID
   ========================================================================== */
.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 720px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1040px) {
  .features-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feature-card {
  padding: 28px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  transition: all 0.15s ease;
}

.feature-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.feature-card--featured {
  background: var(--landing-teal-light);
  border-color: var(--landing-line-strong);
}

.feature-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--muted);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.feature-card--featured .feature-icon-wrap {
  background: var(--landing-teal-light);
}

.feature-card h3 {
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0 0 10px;
}

.feature-card p {
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--muted-foreground);
  margin: 0;
}

.feature-badge-row {
  display: flex;
  gap: 6px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.f-code {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 5px;
}

.f-code--e { background: var(--success-bg); color: var(--success); }
.f-code--t { background: var(--warning-bg); color: var(--warning); }
.f-code--a { background: color-mix(in srgb, var(--destructive) 12%, transparent); color: var(--destructive); }
.f-code--n { background: var(--muted); color: var(--muted-foreground); }

.feature-highlight-box {
  margin-top: 18px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--landing-teal-light);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
}

/* ==========================================================================
   SF2 COMPARISON
   ========================================================================== */
.sf2-comparison-section {
  background: var(--muted);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  max-width: 100%;
}

.comparison-container {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
}

@media (min-width: 860px) {
  .comparison-container {
    grid-template-columns: 1fr 1fr;
  }
}

.compare-card {
  padding: 32px;
  border-radius: 16px;
  background: var(--landing-card);
  border: 1px solid var(--border);
}

.compare-card--legacy {
  border-color: var(--destructive);
  background: var(--card);
}

.compare-card--elytrack {
  border-color: var(--primary);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 8%, transparent);
}

.cc-header {
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.cc-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--destructive);
  margin-bottom: 6px;
}

.cc-tag--teal {
  color: var(--primary);
}

.cc-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
}

.cc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cc-list li {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.cc-bullet {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 2px;
}

.cc-bullet--cross {
  background: color-mix(in srgb, var(--destructive) 12%, transparent);
  color: var(--destructive);
}

.cc-bullet--check {
  background: var(--success-bg);
  color: var(--success);
}

.cc-list strong {
  display: block;
  font-size: 0.92rem;
  color: var(--foreground);
  margin-bottom: 2px;
}

.cc-list p {
  font-size: 0.82rem;
  color: var(--muted-foreground);
  line-height: 1.45;
  margin: 0;
}

/* ==========================================================================
   CALCULATOR
   ========================================================================== */
.calculator-card {
  background: var(--landing-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow-lg);
}

.calc-copy {
  text-align: center;
  max-width: 620px;
  margin: 0 auto 36px;
}

.calc-copy h2 {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 6px 0 10px;
}

.calc-copy p {
  font-size: 0.92rem;
  color: var(--muted-foreground);
  margin: 0;
}

.calc-widget {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  align-items: center;
}

@media (min-width: 860px) {
  .calc-widget {
    grid-template-columns: 1.1fr 1fr;
  }
}

.calc-slider-box {
  display: flex;
  flex-direction: column;
}

.calc-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.calc-label-row label {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--foreground);
}

.calc-val-pill {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--primary);
  background: var(--landing-teal-light);
  padding: 4px 10px;
  border-radius: 6px;
}

.calc-slider {
  width: 100%;
  accent-color: var(--primary);
  height: 6px;
  cursor: pointer;
}

.calc-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--muted-foreground);
  margin-top: 6px;
  margin-bottom: 24px;
}

.calc-facts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--muted);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.cf-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--muted-foreground);
}

.cf-row strong {
  color: var(--foreground);
}

.cf-row--highlight {
  color: var(--primary);
  font-weight: 700;
}

.cf-row--highlight strong {
  color: var(--primary);
}

.calc-result-box {
  padding: 32px;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cr-badge {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--primary);
  margin-bottom: 12px;
}

.cr-stat {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.cr-number {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  color: var(--sidebar-foreground);
}

.cr-unit {
  font-size: 1rem;
  color: color-mix(in srgb, var(--sidebar-foreground) 72%, transparent);
  font-weight: 600;
}

.cr-desc {
  font-size: 0.85rem;
  line-height: 1.55;
  color: color-mix(in srgb, var(--sidebar-foreground) 72%, transparent);
  margin: 0 0 24px;
}

/* ==========================================================================
   PRICING
   ========================================================================== */
.pricing-section {
  padding-bottom: 40px;
}

.billing-toggle-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.billing-toggle {
  display: inline-flex;
  padding: 4px;
  background: var(--muted);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 7px;
  border: none;
  background: transparent;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-btn.is-active {
  background: var(--landing-card);
  color: var(--foreground);
  box-shadow: var(--shadow-sm);
}

.discount-badge {
  font-size: 0.7rem;
  font-weight: 800;
  background: var(--success-bg);
  color: var(--success);
  padding: 2px 6px;
  border-radius: 4px;
}

.pricing-empty-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  padding: 28px 20px;
  border: 1px dashed var(--border);
  border-radius: 14px;
  background: var(--muted);
  color: var(--muted-foreground);
  font-size: .84rem;
  text-align: center;
}
.pricing-empty-state strong { color: var(--foreground); font-size: .92rem; }

.pricing-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 40px;
}

@media (min-width: 900px) {
  .pricing-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pricing-card {
  position: relative;
  padding: 32px 28px;
  background: var(--landing-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.15s ease;
}

.pricing-card:hover {
  transform: translateY(-2px);
  border-color: var(--border);
}

.pricing-card--popular {
  border-color: var(--primary);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--primary) 12%, transparent);
}

.popular-ribbon {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.plan-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-tier-tag {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--primary);
  background: var(--landing-teal-light);
  padding: 3px 8px;
  border-radius: 6px;
}

.plan-trial-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--warning);
  background: var(--warning-bg);
  padding: 2px 7px;
  border-radius: 4px;
}

.plan-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0 0 8px;
}

.plan-description {
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--muted-foreground);
  margin: 0 0 24px;
  min-height: 48px;
}

.pricing-card-rate {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.rate-amount-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.currency {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--foreground);
}

.amount {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1;
}

.interval {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.billing-subtext {
  display: block;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  margin-top: 6px;
}

.plan-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 18px;
  border-radius: 9px;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
  margin-bottom: 28px;
}

.plan-cta-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.plan-cta-btn--featured {
  background: var(--primary);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 25%, transparent);
}

.plan-cta-btn--featured:hover {
  background: var(--primary-hover);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--primary) 35%, transparent);
}

.plan-features {
  display: flex;
  flex-direction: column;
}

.features-heading {
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--foreground);
  margin-bottom: 12px;
}

.plan-features ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan-features li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--foreground);
}

.feat-check {
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 2px;
}

/* Detailed Comparison Matrix */
.pricing-matrix-wrap {
  margin-top: 56px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 36px 32px;
}

.matrix-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 32px;
}

.matrix-header h3 {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0 0 6px;
}

.matrix-header p {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  margin: 0;
}

.matrix-scroll-wrap {
  overflow-x: auto;
}
.matrix-empty-cell {
  padding: 28px 18px;
  color: var(--muted-foreground);
  text-align: center;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.matrix-table th {
  padding: 14px 18px;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--foreground);
  border-bottom: 2px solid var(--border);
}

.col-capability { width: 40%; }
.col-tier { width: 20%; text-align: center; }
.col-tier small { font-size: 0.75rem; color: var(--muted-foreground); font-weight: 600; }
.col-tier--featured { background: var(--landing-teal-light); color: var(--primary); }

.cat-row td {
  padding: 14px 18px 8px;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--primary);
  background: var(--muted);
  border-top: 1px solid var(--border);
}

.data-row {
  border-bottom: 1px solid var(--border);
}

.cell-capability {
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
}

.cell-capability strong {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--foreground);
}

.cell-capability small {
  font-size: 0.74rem;
  color: var(--muted-foreground);
}

.cell-val {
  padding: 12px 18px;
  text-align: center;
  font-size: 0.82rem;
  color: var(--muted-foreground);
}

.cell-val--featured {
  background: color-mix(in srgb, var(--landing-teal-light) 40%, transparent);
}

.check-icon {
  color: var(--primary);
  display: inline-block;
}

.check-icon--teal {
  color: var(--primary);
}

.dash-icon {
  color: var(--muted-foreground);
  font-weight: 700;
}

.text-val {
  font-weight: 700;
  color: var(--foreground);
}

.text-val--featured {
  color: var(--primary);
}

/* Trust Guarantees */
.trust-guarantees {
  margin-top: 48px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding-top: 36px;
  border-top: 1px solid var(--border);
}

@media (min-width: 720px) {
  .trust-guarantees {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1040px) {
  .trust-guarantees {
    grid-template-columns: repeat(4, 1fr);
  }
}

.tg-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tg-item svg {
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.tg-item strong {
  display: block;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--foreground);
  margin-bottom: 2px;
}

.tg-item p {
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--muted-foreground);
  margin: 0;
}

/* ==========================================================================
   FAQ
   ========================================================================== */
.faq-section {
  padding-top: 20px;
}

.faq-accordion {
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faq-card {
  padding: 18px 22px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  cursor: pointer;
  transition: all 0.15s ease;
}

.faq-card:hover {
  border-color: var(--border);
}

.faq-card.is-expanded {
  border-color: var(--primary);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 6%, transparent);
}

.faq-question-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.faq-question-row strong {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--foreground);
}

.faq-icon {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
}

.faq-answer-text {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--muted-foreground);
}

/* ==========================================================================
   STATEMENT BANNER
   ========================================================================== */
.landing-statement-section {
  padding: 80px 28px;
  background: var(--muted);
}

.statement-card {
  max-width: 1100px;
  margin: 0 auto;
  padding: 56px 48px;
  background: var(--sidebar);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 36px;
  flex-wrap: wrap;
}

.statement-kicker {
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--landing-teal-vivid);
  margin-bottom: 8px;
}

.sc-content h2 {
  font-size: clamp(1.6rem, 2.8vw, 2.2rem);
  font-weight: 800;
  color: var(--sidebar-foreground);
  margin: 0 0 10px;
  line-height: 1.2;
}

.sc-content p {
  font-size: 0.92rem;
  color: color-mix(in srgb, var(--sidebar-foreground) 72%, transparent);
  max-width: 520px;
  margin: 0;
  line-height: 1.55;
}

.sc-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ==========================================================================
   FOOTER
   ========================================================================== */
.landing-footer {
  max-width: 1240px;
  margin: 0 auto;
  padding: 56px 28px 32px;
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--border);
}

.footer-brand-col {
  max-width: 380px;
}

.footer-brand-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.footer-logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.footer-brand-header strong {
  display: block;
  font-size: 1.05rem;
  color: var(--foreground);
}

.footer-brand-header small {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.footer-bio {
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--muted-foreground);
  margin: 0;
}

.footer-nav-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-nav-title {
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--foreground);
  margin-bottom: 4px;
}

.footer-link-btn,
.footer-link {
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  font-size: 0.82rem;
  color: var(--muted-foreground);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.12s ease;
}

.footer-link-btn:hover,
.footer-link:hover {
  color: var(--primary-hover);
}

.footer-legal {
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  flex-wrap: wrap;
  gap: 12px;
}
</style>
