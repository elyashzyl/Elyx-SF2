<template>
  <div class="landing-page">
    <!-- Nav -->
    <nav class="landing-nav">
      <div class="landing-nav-inner">
        <div class="landing-nav-brand">
          <span class="landing-nav-icon">E</span>
          <span class="landing-nav-name">Elyx Studio</span>
        </div>
        <router-link to="/login" class="landing-nav-login">Sign In</router-link>
      </div>
    </nav>

    <!-- Hero -->
    <section class="landing-hero">
      <div class="landing-hero-bg">
        <div class="hero-orb hero-orb--1"></div>
        <div class="hero-orb hero-orb--2"></div>
        <div class="hero-orb hero-orb--3"></div>
      </div>
      <div class="landing-hero-content">
        <div class="hero-badge">School Attendance System</div>
        <h1>Track Attendance<br/><span class="hero-accent">Effortlessly</span></h1>
        <p class="hero-subtitle">
          A modern attendance management platform built for schools.
          Monitor daily and monthly records, generate SF2 compliance reports,
          and keep students on track — all in one place.
        </p>
        <div class="hero-actions">
          <router-link to="/login" class="hero-btn hero-btn--primary">
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </router-link>
          <a href="#features" class="hero-btn hero-btn--secondary">Learn More</a>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="landing-features">
      <div class="landing-section-inner">
        <div class="section-header">
          <span class="section-label">Features</span>
          <h2>Everything You Need</h2>
          <p>From daily check-ins to monthly compliance reports, Elyx Studio covers the full attendance workflow.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card" v-for="f in features" :key="f.title">
            <div class="feature-icon" v-html="f.icon"></div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="landing-steps">
      <div class="landing-section-inner">
        <div class="section-header">
          <span class="section-label">How It Works</span>
          <h2>Simple as 1-2-3</h2>
        </div>
        <div class="steps-grid">
          <div class="step-card" v-for="(s, i) in steps" :key="i">
            <div class="step-num">{{ i + 1 }}</div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="landing-cta">
      <div class="landing-section-inner">
        <div class="cta-card">
          <h2>Ready to Go Digital?</h2>
          <p>Start managing attendance the smart way. Sign in to your school portal now.</p>
          <router-link to="/login" class="hero-btn hero-btn--primary">
            Sign In to Your Account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="landing-footer-inner">
        <span class="footer-brand">Elyx Studio</span>
        <span class="footer-copy">&copy; {{ new Date().getFullYear() }} All rights reserved.</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
const features = [
  {
    title: 'Daily Attendance',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>',
    desc: 'Record present, absent, and late entries for each student every school day with real-time saving.'
  },
  {
    title: 'Monthly Records (SF2)',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    desc: 'Generate DepEd-compliant School Form 2 monthly attendance summaries, exportable to Excel.'
  },
  {
    title: 'Student Management',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    desc: 'Manage student rosters by grade level and section. Bulk import names in one go.'
  },
  {
    title: 'Role-Based Access',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>',
    desc: 'Superadmin, admin, and teacher roles — each sees only what they need.'
  },
  {
    title: 'Dashboard Analytics',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    desc: 'Visualize enrollment stats, attendance rates, and monthly trends at a glance.'
  },
  {
    title: 'Multi-School Support',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 10-5 10 5-10 5L2 7Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/></svg>',
    desc: 'Manage multiple schools under one system. Switch between them seamlessly.'
  }
]

const steps = [
  {
    title: 'Set Up Your School',
    desc: 'Register your school, define grade levels, and add sections.'
  },
  {
    title: 'Add Students & Teachers',
    desc: 'Import student names and assign teachers to their advisory classes.'
  },
  {
    title: 'Track & Report',
    desc: 'Log daily attendance, generate monthly SF2 reports, and export to Excel.'
  }
]
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', system-ui, sans-serif;
}

/* NAV */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--card) 80%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.landing-nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.landing-nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.landing-nav-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  font-family: 'Lora', serif;
}
.landing-nav-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--foreground);
}
.landing-nav-login {
  padding: 8px 20px;
  border-radius: 10px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.landing-nav-login:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* HERO */
.landing-hero {
  position: relative;
  overflow: hidden;
  padding: 140px 24px 100px;
  text-align: center;
}
.landing-hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}
.hero-orb--1 {
  width: 500px;
  height: 500px;
  top: -15%;
  left: 10%;
  background: var(--primary);
  opacity: 0.08;
}
.hero-orb--2 {
  width: 400px;
  height: 400px;
  top: 20%;
  right: 5%;
  background: var(--accent);
  opacity: 0.06;
}
.hero-orb--3 {
  width: 300px;
  height: 300px;
  bottom: -10%;
  left: 40%;
  background: var(--primary);
  opacity: 0.05;
}
.landing-hero-content {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 auto;
}
.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 9999px;
  background: var(--secondary);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: 24px;
  border: 1px solid var(--border);
}
.landing-hero h1 {
  font-size: 3.2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 20px;
  color: var(--foreground);
}
.hero-accent {
  color: var(--primary);
}
.hero-subtitle {
  font-size: 1.1rem;
  color: var(--muted-foreground);
  line-height: 1.7;
  margin: 0 auto 36px;
  max-width: 540px;
}
.hero-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
}
.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  font-family: inherit;
}
.hero-btn--primary {
  background: var(--primary);
  color: var(--primary-foreground);
  box-shadow: 0 2px 12px rgba(108, 21, 36, 0.25);
}
.hero-btn--primary:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 21, 36, 0.3);
}
.hero-btn--secondary {
  background: var(--card);
  color: var(--foreground);
  border: 1px solid var(--border);
}
.hero-btn--secondary:hover {
  background: var(--secondary);
  transform: translateY(-1px);
}

/* SECTIONS */
.landing-section-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}
.section-header {
  text-align: center;
  margin-bottom: 48px;
}
.section-label {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 9999px;
  background: var(--secondary);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 14px;
}
.section-header h2 {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.section-header p {
  font-size: 1rem;
  color: var(--muted-foreground);
  margin: 0;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

/* FEATURES */
.landing-features {
  padding: 80px 0;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.feature-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 28px 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.feature-card h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 8px;
}
.feature-card p {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  line-height: 1.6;
  margin: 0;
}

/* STEPS */
.landing-steps {
  padding: 80px 0;
  background: var(--secondary);
}
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.step-card {
  text-align: center;
  padding: 32px 24px;
}
.step-num {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 auto 18px;
  box-shadow: 0 2px 8px rgba(108, 21, 36, 0.2);
}
.step-card h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 8px;
}
.step-card p {
  font-size: 0.88rem;
  color: var(--muted-foreground);
  margin: 0;
  line-height: 1.6;
}

/* CTA */
.landing-cta {
  padding: 80px 0;
}
.cta-card {
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 20px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(108, 21, 36, 0.25);
}
.cta-card h2 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 12px;
}
.cta-card p {
  font-size: 1rem;
  opacity: 0.85;
  margin: 0 auto 32px;
  max-width: 420px;
}
.cta-card .hero-btn--primary {
  background: #fff;
  color: var(--primary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}
.cta-card .hero-btn--primary:hover {
  background: var(--secondary);
  transform: translateY(-2px);
}

/* FOOTER */
.landing-footer {
  border-top: 1px solid var(--border);
  padding: 24px 0;
}
.landing-footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-brand {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--foreground);
}
.footer-copy {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .landing-hero h1 {
    font-size: 2.2rem;
  }
  .hero-subtitle {
    font-size: 0.95rem;
  }
  .features-grid,
  .steps-grid {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin: 0 auto;
  }
  .section-header h2 {
    font-size: 1.6rem;
  }
  .cta-card {
    padding: 40px 24px;
  }
  .cta-card h2 {
    font-size: 1.5rem;
  }
  .landing-footer-inner {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
