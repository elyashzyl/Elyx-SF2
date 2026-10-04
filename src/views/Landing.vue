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
                <div class="window-title">{{ activeSchool?.name || 'Philippine School Demonstration' }}</div>
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
                    <span class="sm-sub">{{ landingStats.monthLabel || 'Current Academic Month' }}</span>
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
                    <strong>{{ activeSchool?.name || 'Baguio Patriotic High School' }}</strong>
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
                min="5"
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
                <span class="discount-badge">2 Months Free</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Pricing Cards Grid -->
        <div class="pricing-cards-grid">
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
                    ? `Billed ₱${Number(plan.billing_annual_total || 0).toLocaleString()} annually (${plan.billing_months || 10}-month academic year)`
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
                  <th class="col-tier">Adviser License<br /><small>₱249 / mo</small></th>
                  <th class="col-tier col-tier--featured">School Campus Pro<br /><small>₱1,490 / mo</small></th>
                  <th class="col-tier">Division Enterprise<br /><small>₱4,990 / mo</small></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="catGroup in matrixCategories" :key="catGroup.category">
                  <tr class="cat-row">
                    <td colspan="4">{{ catGroup.category }}</td>
                  </tr>
                  <tr v-for="row in catGroup.items" :key="row.name" class="data-row">
                    <td class="cell-capability">
                      <strong>{{ row.name }}</strong>
                      <small v-if="row.desc">{{ row.desc }}</small>
                    </td>
                    <td class="cell-val">
                      <span v-if="typeof row.adviser === 'boolean'">
                        <svg v-if="row.adviser" class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        <span v-else class="dash-icon">—</span>
                      </span>
                      <span v-else class="text-val">{{ row.adviser }}</span>
                    </td>
                    <td class="cell-val cell-val--featured">
                      <span v-if="typeof row.campus === 'boolean'">
                        <svg v-if="row.campus" class="check-icon check-icon--teal" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        <span v-else class="dash-icon">—</span>
                      </span>
                      <span v-else class="text-val text-val--featured">{{ row.campus }}</span>
                    </td>
                    <td class="cell-val">
                      <span v-if="typeof row.division === 'boolean'">
                        <svg v-if="row.division" class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        <span v-else class="dash-icon">—</span>
                      </span>
                      <span v-else class="text-val">{{ row.division }}</span>
                    </td>
                  </tr>
                </template>
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
const sectionCount = ref(25)
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
        sectionCount.value = Number(data.stats.totalSections || 25)
        landingStats.value = {
          ...landingStats.value,
          ...data.stats,
          monthLabel: data.stats.monthLabel || ''
        }
      }
      demoStudents.value = Array.isArray(data.previewStudents) && data.previewStudents.length > 0
        ? data.previewStudents.map(st => ({
            ...st,
            status: st.status || 'Present',
            am1: st.am1 || 'E',
            am2: st.am2 || 'E',
            am3: st.am3 || 'E',
            am4: st.am4 || 'E'
          }))
        : [
            { id: 1, name: 'Abad, Juan Carlo M.', gender: 'Male', lrn: '109283746501', status: 'Present', am1: 'E', am2: 'E', am3: 'E', am4: 'E', grade: 'Grade 10', section: 'Rizal' },
            { id: 2, name: 'Bautista, Maria Elena S.', gender: 'Female', lrn: '109283746502', status: 'Present', am1: 'E', am2: 'E', am3: 'E', am4: 'E', grade: 'Grade 10', section: 'Rizal' },
            { id: 3, name: 'Dela Cruz, Mark Anthony P.', gender: 'Male', lrn: '109283746503', status: 'Absent', am1: 'A', am2: 'A', am3: 'A', am4: 'A', grade: 'Grade 10', section: 'Rizal' },
            { id: 4, name: 'Flores, Christine Joy B.', gender: 'Female', lrn: '109283746504', status: 'Present', am1: 'E', am2: 'T', am3: 'E', am4: 'E', grade: 'Grade 10', section: 'Rizal' },
            { id: 5, name: 'Santos, Joshua Miguel T.', gender: 'Male', lrn: '109283746505', status: 'Present', am1: 'E', am2: 'E', am3: 'E', am4: 'E', grade: 'Grade 10', section: 'Rizal' }
          ]
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

const defaultPlans = [
  {
    id: 'adviser',
    tier: 'adviser',
    name: 'Adviser License',
    tag: 'Single Advisory Section',
    description: 'Designed for individual class advisers to record daily attendance, monitor at-risk learners, and generate DepEd SF2 workbooks.',
    price_monthly: 249,
    price_annual_monthly: 199,
    billing_annual_total: 1990,
    billing_months: 10,
    trial_days: 14,
    is_featured: false,
    badge: '14-Day Free Evaluation Available',
    features: [
      '1 Advisory Section (Up to 65 Learners)',
      'Automated DepEd SF2 (.xlsx) Export',
      'Daily Roll Call under 90 Seconds',
      'SARDO Absenteeism Warning Alerts',
      'Guardian Contact & Intervention Logs',
      'Mobile and Desktop Web Access'
    ]
  },
  {
    id: 'campus',
    tier: 'campus',
    name: 'School Campus Pro',
    tag: 'Whole School Campus',
    description: 'Complete operational management for Elementary, JHS, or SHS campuses with full administrative controls and faculty accounts.',
    price_monthly: 1490,
    price_annual_monthly: 1190,
    billing_annual_total: 11900,
    billing_months: 10,
    trial_days: 14,
    is_featured: true,
    badge: 'Recommended for Philippine Schools',
    features: [
      'Unlimited Teachers & Advisory Classes',
      'Up to 1,500 Enrolled Learners',
      'School Head Telemetry & Audit Logs',
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
    name: 'Division Enterprise',
    tag: 'SDO & Multi-Campus Clusters',
    description: 'Tailored for DepEd Schools Division Offices, private school systems, and multi-campus clusters requiring unified oversight.',
    price_monthly: 4990,
    price_annual_monthly: 3990,
    billing_annual_total: 39900,
    billing_months: 10,
    trial_days: 0,
    is_featured: false,
    badge: 'Division & Cluster Ready',
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

const matrixCategories = [
  {
    category: 'Classroom Scope & Capacity',
    items: [
      { name: 'Advisory Section Limit', desc: 'Number of active grade/section advisory classes', adviser: '1 Section', campus: 'Unlimited Sections', division: 'Unlimited Campuses' },
      { name: 'Enrolled Learner Limit', desc: 'Active student attendance tracking capacity', adviser: 'Up to 65 Learners', campus: 'Up to 1,500 Learners', division: 'Unlimited Learners' },
      { name: 'Faculty & Admin Accounts', desc: 'Role-scoped logins for teachers and school heads', adviser: '1 Adviser Account', campus: 'Unlimited Faculty & Staff', division: 'Unlimited Multi-School' }
    ]
  },
  {
    category: 'DepEd Form 2 Engine & Automation',
    items: [
      { name: 'Automated SF2 (.xlsx) Export', desc: 'Official DepEd Form 2 workbook generation', adviser: true, campus: true, division: true },
      { name: 'DepEd Order No. 8, s. 2015 Math', desc: 'ADA, attendance % and monthly aggregation rules', adviser: true, campus: true, division: true },
      { name: 'Section Comparison & Ranking', desc: 'Comparative attendance rankings across campus sections', adviser: false, campus: true, division: true },
      { name: 'Division-Wide Rollup Analytics', desc: 'Consolidated reporting across multiple schools', adviser: false, campus: false, division: true }
    ]
  },
  {
    category: 'Classroom Operations & Reliability',
    items: [
      { name: 'Under 90-Second Roll Call', desc: 'Period marks with presets (E, T, A, NIPU)', adviser: true, campus: true, division: true },
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
      { name: 'Bulk Student LRN CSV Import', desc: 'Bulk import with 12-digit LRN duplicate detection', adviser: false, campus: true, division: true },
      { name: 'Cross-School Transfer Tracking', desc: 'Paired Transfer-Out and Transfer-In historical records', adviser: false, campus: true, division: true },
      { name: 'Principal Telemetry Dashboard', desc: 'Campus-wide roll call completion monitoring', adviser: false, campus: true, division: true },
      { name: 'Database License Access Control', desc: 'Instant access lock if license is stopped or suspended', adviser: true, campus: true, division: true },
      { name: 'PhilGEPS / Official Invoicing', desc: 'Official receipt and purchase order documentation', adviser: true, campus: true, division: true }
    ]
  }
]

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
  background: #ffffff;
  color: #090d16;
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid #e2e8f0;
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
  color: #090d16;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.landing-brand-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #0f766e;
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
  color: #475569;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.nav-item:hover {
  color: #0f766e;
  background: #f1f5f9;
}

.landing-nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-signin-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 8px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.15s ease;
}

.nav-signin-btn:hover {
  background: #0f766e;
  transform: translateY(-1px);
}

.mobile-menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  color: #0f172a;
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
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  gap: 8px;
}

.mobile-nav-item {
  text-align: left;
  background: transparent;
  border: none;
  padding: 12px 14px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  border-radius: 8px;
  cursor: pointer;
}

.mobile-nav-item:hover {
  background: #f1f5f9;
  color: #0f766e;
}

.mobile-sign-in-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 14px 18px;
  background: #0f766e;
  color: #ffffff;
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
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-bottom: 1px solid #f1f5f9;
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
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 20px;
}

.pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0d9488;
}

.hero-headline {
  font-size: clamp(2.2rem, 3.8vw, 3.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: #090d16;
  margin: 0 0 20px;
}

.hero-accent {
  color: #0d9488;
}

.hero-description {
  font-size: 1.05rem;
  line-height: 1.65;
  color: #475569;
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
  background: #0d9488;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover {
  background: #0f766e;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.35);
}

.btn-primary--light {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.btn-primary--light:hover {
  background: #f1f5f9;
  color: #0f766e;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 22px;
  border-radius: 9px;
  background: #ffffff;
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.btn-secondary--transparent {
  background: transparent;
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-secondary--transparent:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #ffffff;
}

/* Proof Bar */
.hero-proof-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.proof-unit {
  display: flex;
  flex-direction: column;
}

.proof-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: #090d16;
  line-height: 1.2;
}

.proof-desc {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
}

.proof-divider {
  width: 1px;
  height: 28px;
  background: #e2e8f0;
}

/* ==========================================================================
   SIMULATOR CONSOLE
   ========================================================================== */
.hero-demo-col {
  width: 100%;
}

.demo-window {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.demo-header {
  height: 48px;
  padding: 0 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
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

.dot--red { background: #f87171; }
.dot--yellow { background: #fbbf24; }
.dot--green { background: #34d399; }

.window-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.window-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #0f766e;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  padding: 2px 8px;
  border-radius: 999px;
}

.demo-tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
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
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease;
}

.demo-tab-btn:hover {
  color: #0f766e;
}

.demo-tab-btn.is-active {
  color: #0f766e;
  border-bottom-color: #0d9488;
  background: #f0fdfa;
}

.demo-screen {
  padding: 20px 22px;
  background: #ffffff;
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
  color: #0f766e;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.screen-heading {
  font-size: 1.05rem;
  font-weight: 800;
  color: #090d16;
  margin: 0;
}

.attendance-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  font-size: 0.78rem;
  color: #0f766e;
}

.pulse-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0d9488;
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
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  transition: all 0.12s ease;
}

.roster-row--absent {
  background: #fef2f2;
  border-color: #fee2e2;
}

.roster-index {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
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
  color: #0f172a;
}

.roster-info small {
  font-size: 0.72rem;
  color: #64748b;
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
  background: #f1f5f9;
  color: #475569;
}

.slot--e { background: #dcfce7; color: #166534; }
.slot--t { background: #fef3c7; color: #92400e; }
.slot--a { background: #fee2e2; color: #991b1b; }

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
  background: #0d9488;
  color: #ffffff;
}

.status-toggle-btn.is-absent {
  background: #e11d48;
  color: #ffffff;
}

.demo-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 8px 12px;
  border-radius: 7px;
  background: #f0fdfa;
  border: 1px solid #ccfbf1;
  font-size: 0.74rem;
  color: #0f766e;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.sf2-metric-box--highlight {
  background: #f0fdfa;
  border-color: #99f6e4;
}

.sm-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
}

.sm-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: #090d16;
}

.sm-sub {
  font-size: 0.7rem;
  color: #0f766e;
  font-weight: 600;
  margin-top: 2px;
}

.sf2-download-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #0f172a;
  color: #ffffff;
  border-radius: 8px;
}

.dp-copy strong {
  display: block;
  font-size: 0.84rem;
  margin-bottom: 2px;
}

.dp-copy p {
  font-size: 0.72rem;
  color: #94a3b8;
  margin: 0;
}

.dp-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: #0d9488;
  color: #ffffff;
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
  border: 1px solid #fecdd3;
  background: #fff1f2;
  border-radius: 8px;
}

.sardo-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e11d48;
}

.sardo-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sardo-meta strong {
  font-size: 0.85rem;
  color: #0f172a;
}

.sardo-meta span {
  font-size: 0.72rem;
  color: #64748b;
}

.sardo-action-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #fca5a5;
  color: #be123c;
}

.sardo-notice {
  font-size: 0.74rem;
  color: #64748b;
  line-height: 1.45;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8fafc;
}

.demo-empty-notice {
  padding: 24px;
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
}

/* Console Footer */
.demo-footer {
  padding: 12px 18px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
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
  color: #0f172a;
  line-height: 1.2;
}

.footer-school-info small {
  font-size: 0.7rem;
  color: #64748b;
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
  background: #f1f5f9;
  color: #475569;
}

.status-badge--active {
  background: #dcfce7;
  color: #166534;
}

/* ==========================================================================
   STANDARDS STRIP
   ========================================================================== */
.standards-strip {
  padding: 28px 24px;
  background: #0f172a;
  color: #ffffff;
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
  color: #2dd4bf;
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
  color: #cbd5e1;
}

.standard-item svg {
  color: #2dd4bf;
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
  color: #0f766e;
  margin-bottom: 8px;
}

.section-header h2 {
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #090d16;
  margin: 0 0 14px;
  line-height: 1.2;
}

.section-header p {
  font-size: 0.98rem;
  line-height: 1.6;
  color: #475569;
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  transition: all 0.15s ease;
}

.feature-card:hover {
  border-color: #0d9488;
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.feature-card--featured {
  background: #f0fdfa;
  border-color: #99f6e4;
}

.feature-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #0f766e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.feature-card--featured .feature-icon-wrap {
  background: #ccfbf1;
}

.feature-card h3 {
  font-size: 1.12rem;
  font-weight: 800;
  color: #090d16;
  margin: 0 0 10px;
}

.feature-card p {
  font-size: 0.88rem;
  line-height: 1.55;
  color: #475569;
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

.f-code--e { background: #dcfce7; color: #166534; }
.f-code--t { background: #fef3c7; color: #92400e; }
.f-code--a { background: #fee2e2; color: #991b1b; }
.f-code--n { background: #f1f5f9; color: #475569; }

.feature-highlight-box {
  margin-top: 18px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #ccfbf1;
  color: #0f766e;
  font-size: 0.75rem;
  font-weight: 700;
}

/* ==========================================================================
   SF2 COMPARISON
   ========================================================================== */
.sf2-comparison-section {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.compare-card--legacy {
  border-color: #fecdd3;
  background: #ffffff;
}

.compare-card--elytrack {
  border-color: #0d9488;
  box-shadow: 0 12px 32px rgba(13, 148, 136, 0.08);
}

.cc-header {
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
}

.cc-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #e11d48;
  margin-bottom: 6px;
}

.cc-tag--teal {
  color: #0f766e;
}

.cc-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #090d16;
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
  background: #fee2e2;
  color: #b91c1c;
}

.cc-bullet--check {
  background: #dcfce7;
  color: #15803d;
}

.cc-list strong {
  display: block;
  font-size: 0.92rem;
  color: #090d16;
  margin-bottom: 2px;
}

.cc-list p {
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0;
}

/* ==========================================================================
   CALCULATOR
   ========================================================================== */
.calculator-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.calc-copy {
  text-align: center;
  max-width: 620px;
  margin: 0 auto 36px;
}

.calc-copy h2 {
  font-size: 1.85rem;
  font-weight: 800;
  color: #090d16;
  margin: 6px 0 10px;
}

.calc-copy p {
  font-size: 0.92rem;
  color: #475569;
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
  color: #0f172a;
}

.calc-val-pill {
  font-size: 0.82rem;
  font-weight: 800;
  color: #0f766e;
  background: #f0fdfa;
  padding: 4px 10px;
  border-radius: 6px;
}

.calc-slider {
  width: 100%;
  accent-color: #0d9488;
  height: 6px;
  cursor: pointer;
}

.calc-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 6px;
  margin-bottom: 24px;
}

.calc-facts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.cf-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #475569;
}

.cf-row strong {
  color: #090d16;
}

.cf-row--highlight {
  color: #0f766e;
  font-weight: 700;
}

.cf-row--highlight strong {
  color: #0f766e;
}

.calc-result-box {
  padding: 32px;
  background: #0f172a;
  color: #ffffff;
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
  color: #2dd4bf;
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
  color: #ffffff;
}

.cr-unit {
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 600;
}

.cr-desc {
  font-size: 0.85rem;
  line-height: 1.55;
  color: #cbd5e1;
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
  background: #f1f5f9;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
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
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toggle-btn.is-active {
  background: #ffffff;
  color: #090d16;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.discount-badge {
  font-size: 0.7rem;
  font-weight: 800;
  background: #dcfce7;
  color: #15803d;
  padding: 2px 6px;
  border-radius: 4px;
}

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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.15s ease;
}

.pricing-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.pricing-card--popular {
  border-color: #0d9488;
  box-shadow: 0 12px 32px rgba(13, 148, 136, 0.12);
}

.popular-ribbon {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #0d9488;
  color: #ffffff;
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
  color: #0f766e;
  background: #f0fdfa;
  padding: 3px 8px;
  border-radius: 6px;
}

.plan-trial-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  padding: 2px 7px;
  border-radius: 4px;
}

.plan-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: #090d16;
  margin: 0 0 8px;
}

.plan-description {
  font-size: 0.84rem;
  line-height: 1.5;
  color: #64748b;
  margin: 0 0 24px;
  min-height: 48px;
}

.pricing-card-rate {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.rate-amount-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.currency {
  font-size: 1.25rem;
  font-weight: 800;
  color: #090d16;
}

.amount {
  font-size: 2.2rem;
  font-weight: 800;
  color: #090d16;
  line-height: 1;
}

.interval {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.billing-subtext {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
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
  background: #0f172a;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
  margin-bottom: 28px;
}

.plan-cta-btn:hover {
  background: #0f766e;
  transform: translateY(-1px);
}

.plan-cta-btn--featured {
  background: #0d9488;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.25);
}

.plan-cta-btn--featured:hover {
  background: #0f766e;
  box-shadow: 0 6px 18px rgba(13, 148, 136, 0.35);
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
  color: #090d16;
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
  color: #334155;
}

.feat-check {
  color: #0d9488;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Detailed Comparison Matrix */
.pricing-matrix-wrap {
  margin-top: 56px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
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
  color: #090d16;
  margin: 0 0 6px;
}

.matrix-header p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.matrix-scroll-wrap {
  overflow-x: auto;
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
  color: #090d16;
  border-bottom: 2px solid #cbd5e1;
}

.col-capability { width: 40%; }
.col-tier { width: 20%; text-align: center; }
.col-tier small { font-size: 0.75rem; color: #64748b; font-weight: 600; }
.col-tier--featured { background: #f0fdfa; color: #0f766e; }

.cat-row td {
  padding: 14px 18px 8px;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0f766e;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.data-row {
  border-bottom: 1px solid #f1f5f9;
}

.cell-capability {
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
}

.cell-capability strong {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.cell-capability small {
  font-size: 0.74rem;
  color: #64748b;
}

.cell-val {
  padding: 12px 18px;
  text-align: center;
  font-size: 0.82rem;
  color: #475569;
}

.cell-val--featured {
  background: rgba(240, 253, 250, 0.4);
}

.check-icon {
  color: #0d9488;
  display: inline-block;
}

.check-icon--teal {
  color: #0f766e;
}

.dash-icon {
  color: #94a3b8;
  font-weight: 700;
}

.text-val {
  font-weight: 700;
  color: #090d16;
}

.text-val--featured {
  color: #0f766e;
}

/* Trust Guarantees */
.trust-guarantees {
  margin-top: 48px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding-top: 36px;
  border-top: 1px solid #e2e8f0;
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
  color: #0d9488;
  flex-shrink: 0;
  margin-top: 2px;
}

.tg-item strong {
  display: block;
  font-size: 0.85rem;
  font-weight: 800;
  color: #090d16;
  margin-bottom: 2px;
}

.tg-item p {
  font-size: 0.76rem;
  line-height: 1.45;
  color: #64748b;
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
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.faq-card:hover {
  border-color: #cbd5e1;
}

.faq-card.is-expanded {
  border-color: #0d9488;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.06);
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
  color: #090d16;
}

.faq-icon {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f766e;
}

.faq-answer-text {
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #475569;
}

/* ==========================================================================
   STATEMENT BANNER
   ========================================================================== */
.landing-statement-section {
  padding: 80px 28px;
  background: #f8fafc;
}

.statement-card {
  max-width: 1100px;
  margin: 0 auto;
  padding: 56px 48px;
  background: #0f172a;
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
  color: #2dd4bf;
  margin-bottom: 8px;
}

.sc-content h2 {
  font-size: clamp(1.6rem, 2.8vw, 2.2rem);
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 10px;
  line-height: 1.2;
}

.sc-content p {
  font-size: 0.92rem;
  color: #94a3b8;
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
  border-bottom: 1px solid #e2e8f0;
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
  color: #090d16;
}

.footer-brand-header small {
  font-size: 0.72rem;
  color: #64748b;
}

.footer-bio {
  font-size: 0.82rem;
  line-height: 1.5;
  color: #64748b;
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
  color: #090d16;
  margin-bottom: 4px;
}

.footer-link-btn,
.footer-link {
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  font-size: 0.82rem;
  color: #64748b;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.12s ease;
}

.footer-link-btn:hover,
.footer-link:hover {
  color: #0f766e;
}

.footer-legal {
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #94a3b8;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
