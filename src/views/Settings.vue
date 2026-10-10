<template>
  <div class="management-page">
    <div class="settings-layout">

      <!-- Left Sidebar -->
      <aside class="settings-sidebar">
        <!-- Profile Card -->
        <div class="settings-profile-card">
          <div class="settings-avatar">
            <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url" alt="Profile avatar" />
            <span v-else>{{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          <h3 class="settings-profile-name">{{ auth.user?.name || 'User' }}</h3>
          <p class="settings-profile-email">{{ auth.user?.username || '' }}</p>
          <span class="settings-role-badge" :class="'badge-' + (auth.user?.role || 'teacher')">{{ roleLabel }}</span>
        </div>

        <!-- Navigation -->
        <nav class="settings-nav">
          <button
            class="settings-nav-item"
            :class="{ active: activeTab === 'profile' }"
            @click="activeTab = 'profile'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>My Profile</span>
          </button>
          <button
            class="settings-nav-item"
            :class="{ active: activeTab === 'appearance' }"
            @click="activeTab = 'appearance'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2"/><path d="M12 20v2"/>
              <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
              <path d="M2 12h2"/><path d="M20 12h2"/>
              <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
            <span>Appearance</span>
          </button>
          <button
            class="settings-nav-item"
            :class="{ active: activeTab === 'school' }"
            @click="activeTab = 'school'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>School Information</span>
          </button>
          <button
            class="settings-nav-item"
            :class="{ active: activeTab === 'academic' }"
            @click="activeTab = 'academic'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>School Year Configuration</span>
          </button>
          <button
            class="settings-nav-item"
            :class="{ active: activeTab === 'notifications' }"
            @click="activeTab = 'notifications'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
            </svg>
            <span>Notifications &amp; Alerts</span>
          </button>
          <button
            v-if="auth.isSuperadmin && schools.length > 1"
            class="settings-nav-item"
            :class="{ active: activeTab === 'switchschool' }"
            @click="activeTab = 'switchschool'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Switch School</span>
          </button>
        </nav>
      </aside>

      <!-- Right Content Area -->
      <main class="settings-content">
        <!-- Welcome Header -->
        <div class="settings-welcome">
          <h1>Welcome back, <strong>{{ auth.user?.name || 'User' }}</strong>!</h1>
          <p>Manage your account settings and preferences.</p>
        </div>

        <!-- Quick Stats -->
        <div class="settings-stats-row">
          <div class="settings-stat-card">
            <div class="settings-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              </svg>
            </div>
            <div>
              <div class="settings-stat-value">{{ roleLabel }}</div>
              <div class="settings-stat-label">Current Role</div>
            </div>
          </div>
          <div class="settings-stat-card">
            <div class="settings-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <div class="settings-stat-value">{{ form.school_short || form.school_name || '—' }}</div>
              <div class="settings-stat-label">School</div>
            </div>
          </div>
          <div
            class="settings-stat-card settings-stat-card-clickable"
            role="button"
            tabindex="0"
            @click="handleThemeCardClick"
            @keydown.enter.prevent="handleThemeCardClick"
            @keydown.space.prevent="handleThemeCardClick"
            :title="`Current: ${theme === 'dark' ? 'Dark' : 'Light'} mode (click to toggle)`"
          >
            <div class="settings-stat-icon">
              <svg v-if="theme === 'dark'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2"/><path d="M12 20v2"/>
                <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
                <path d="M2 12h2"/><path d="M20 12h2"/>
                <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div class="settings-stat-value">{{ theme === 'dark' ? 'Dark' : 'Light' }}</div>
              <div class="settings-stat-label">Theme <span class="theme-click-hint">· Toggle</span></div>
            </div>
            <span class="settings-stat-action" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>
              </svg>
            </span>
          </div>
        </div>

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="table-card">
          <div class="settings-panel-header">
            <h2>My Profile</h2>
            <p>Update your personal information and password.</p>
          </div>
          <form @submit.prevent="saveProfile" class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input v-model="profile.name" required />
              </div>
              <div class="form-group">
                <label>Username</label>
                <input v-model="profile.username" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email <span class="label-hint">Used for account recovery</span></label>
                <input v-model="profile.email" type="email" placeholder="name@example.com" autocomplete="email" />
              </div>
              <div class="form-group">
                <label>New Password <span class="label-hint">Leave blank to keep current</span></label>
                <input v-model="profile.password" type="password" placeholder="Enter new password" autocomplete="new-password" />
              </div>
              <div class="form-group">
                <label>Avatar URL <span class="label-hint">HTTPS or local path; leave blank for initials</span></label>
                <input v-model="profile.avatar_url" type="text" maxlength="2048" placeholder="https://example.com/avatar.jpg or /avatars/me.jpg" autocomplete="url" />
              </div>
              <div class="form-group">
                <label>Role</label>
                <input :value="roleLabel" disabled />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Assigned School <span class="label-hint">Managed by administrator</span></label>
                <input :value="assignedSchoolName" disabled />
              </div>
              <div class="form-group" v-if="auth.user?.role === 'teacher' || auth.user?.grade || auth.user?.section">
                <label>Advisory Class <span class="label-hint">Managed by administrator</span></label>
                <input :value="assignedClassLabel" disabled />
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="savingProfile">
                {{ savingProfile ? 'Saving...' : 'Save Profile' }}
              </button>
              <button v-if="profile.email && !auth.user?.email_verified_at" type="button" class="btn-secondary" @click="resendVerification" :disabled="sendingVerification">
                {{ sendingVerification ? 'Sending...' : 'Resend verification' }}
              </button>
            </div>
            <p v-if="profileError" class="error-msg">{{ profileError }}</p>
          </form>
        </div>

        <!-- Appearance Tab -->
        <div v-if="activeTab === 'appearance'" class="table-card">
          <div class="settings-panel-header">
            <h2>Appearance</h2>
            <p>Customize your visual experience.</p>
          </div>
          <div class="settings-theme-options">
            <button
              class="settings-theme-option"
              :class="{ active: theme === 'light' }"
              @click="setTheme('light')"
            >
              <div class="settings-theme-preview theme-light">
                <div class="theme-preview-bar"></div>
                <div class="theme-preview-content">
                  <div class="theme-preview-line" style="width:60%"></div>
                  <div class="theme-preview-line" style="width:40%"></div>
                </div>
              </div>
              <span>Light</span>
            </button>
            <button
              class="settings-theme-option"
              :class="{ active: theme === 'dark' }"
              @click="setTheme('dark')"
            >
              <div class="settings-theme-preview theme-dark">
                <div class="theme-preview-bar"></div>
                <div class="theme-preview-content">
                  <div class="theme-preview-line" style="width:60%"></div>
                  <div class="theme-preview-line" style="width:40%"></div>
                </div>
              </div>
              <span>Dark</span>
            </button>
          </div>
        </div>

        <!-- School Information Tab -->
        <div v-if="activeTab === 'school'" class="table-card">
          <div class="settings-panel-header">
            <h2>School Information</h2>
            <p>{{ canEditSchool ? 'Edit your school details.' : 'View school details.' }}</p>
          </div>

          <!-- Superadmin Multi-School Selector -->
          <div v-if="auth.isSuperadmin && schools.length > 1" class="form-group" style="max-width: 480px; margin-bottom: 20px;">
            <label style="font-weight: 700; color: var(--foreground); display: flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>Selected School to Manage</span>
            </label>
            <select v-model="selectedSchoolId" @change="onSchoolChange" class="form-select">
              <option value="">None Selected</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">
                {{ s.name }} {{ s.short ? `(${s.short})` : '' }} &bull; {{ Number(s.quarter_count) === 3 ? '3 Quarters' : '4 Quarters' }}
              </option>
            </select>
          </div>

          <!-- Superadmin Global School Year Broadcast Section -->
          <div v-if="auth.isSuperadmin" class="global-sy-box" style="margin-bottom: 24px; padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--muted-subtle, var(--card));">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 240px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <strong style="font-size: 0.95rem; color: var(--foreground);">Global School Year Broadcast</strong>
                </div>
                <p style="margin: 4px 0 0; font-size: 0.8rem; color: var(--muted-foreground);">
                  Apply an academic year to all registered schools at once. Each school retains its own independent Quarter system (3 Quarters vs 4 Quarters).
                </p>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <input
                  v-model="globalSchoolYearInput"
                  placeholder="e.g. 2026-2027"
                  style="width: 140px; padding: 7px 10px; font-size: 0.85rem;"
                  class="form-input"
                />
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="applyingGlobalSy || !globalSchoolYearInput"
                  @click="applyGlobalSchoolYear"
                >
                  <span v-if="applyingGlobalSy" class="spinner" style="margin-right: 6px;"></span>
                  {{ applyingGlobalSy ? 'Applying...' : 'Apply to All Schools' }}
                </button>
              </div>
            </div>
          </div>

          <form @submit.prevent="save" class="settings-form">
            <div class="form-row">
              <div class="form-group">
                <label>School Name</label>
                <input v-model="form.school_name" :disabled="!canEditSchool" />
              </div>
              <div class="form-group">
                <label>School ID</label>
                <input v-model="form.school_id" :disabled="!canEditSchool" placeholder="Enter school ID" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Short Name / Abbreviation</label>
                <input v-model="form.school_short" :disabled="!canEditSchool" placeholder="Enter short name" />
              </div>
              <div class="form-group">
                <label>Address</label>
                <input v-model="form.school_address" :disabled="!canEditSchool" placeholder="Enter school address" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Contact Email</label>
                <input v-model="form.contact_email" :disabled="!canEditSchool" type="email" placeholder="school@example.com" />
              </div>
              <div class="form-group">
                <label>Contact Phone</label>
                <input v-model="form.contact_phone" :disabled="!canEditSchool" placeholder="School contact number" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Division</label>
                <input v-model="form.division" :disabled="!canEditSchool" placeholder="Division" />
              </div>
              <div class="form-group">
                <label>District</label>
                <input v-model="form.district" :disabled="!canEditSchool" placeholder="District" />
              </div>
            </div>
            <div class="form-section-title" style="margin-top: 14px; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem; color: var(--foreground);">
              School Seal / Official Logo
            </div>
            <div class="logo-uploader-card" style="display: flex; gap: 16px; align-items: center; padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--card); margin-bottom: 16px; flex-wrap: wrap;">
              <div class="logo-preview-box" style="width: 72px; height: 72px; border-radius: 50%; border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; background: var(--muted); flex-shrink: 0;">
                <img v-if="form.logo_url" :src="form.logo_url" alt="School Logo" style="width: 100%; height: 100%; object-fit: cover;" />
                <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="color: var(--muted-foreground);">
                  <circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/>
                </svg>
              </div>
              <div class="logo-inputs-col" style="flex: 1; min-width: 200px;">
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <label v-if="canEditSchool" class="btn-sm btn-secondary" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" @change="handleLogoUpload" style="display: none;" />
                  </label>
                  <button v-if="form.logo_url && canEditSchool" type="button" class="btn-sm btn-secondary" @click="form.logo_url = ''" style="color: var(--destructive);">
                    Remove Logo
                  </button>
                </div>
                <div class="form-group" style="margin-top: 8px; margin-bottom: 0;">
                  <input v-model="form.logo_url" :disabled="!canEditSchool" placeholder="Or enter image URL (https://...)" style="font-size: 0.8rem;" />
                </div>
                <span class="label-hint" style="font-size: 0.72rem; color: var(--muted-foreground); display: block; margin-top: 4px;">
                  Displays on DepEd Form 138 (SF9 report card), SF2 sheets, and system branding. Recommended: PNG or JPG (square or circular).
                </span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Principal</label>
                <input v-model="form.principal_name" :disabled="!canEditSchool" placeholder="Principal name" />
              </div>
              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label>School Year</label>
                  <button
                    v-if="auth.isSuperadmin && form.school_year"
                    type="button"
                    class="btn-xs btn-outline"
                    style="font-size: 0.72rem; padding: 2px 8px; cursor: pointer;"
                    @click="applyFormSyToAll"
                    title="Apply this school year to all active schools"
                  >
                    Apply to All Schools
                  </button>
                </div>
                <input v-model="form.school_year" :disabled="!canEditSchool" placeholder="e.g. 2026-2027" />
                <span class="label-hint" style="font-size: 0.72rem; color: var(--muted-foreground); display: block; margin-top: 4px;">
                  Active school year for attendance, quarterly records, and Form 138 (SF9).
                </span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Current Grading Period</label>
                <input v-model="form.grading_period" :disabled="!canEditSchool" placeholder="e.g. First Grading" />
              </div>
              <div class="form-group">
                <label>Quarter / Term Setting</label>
                <select v-model.number="form.quarter_count" :disabled="!canEditSchool" class="form-select">
                  <option :value="4">4 Quarters (Standard DepEd Calendar)</option>
                  <option :value="3">3 Quarters (Trimester Academic Calendar)</option>
                </select>
                <span class="label-hint" style="font-size: 0.72rem; color: var(--muted-foreground); display: block; margin-top: 4px;">
                  Configure whether this school operates on standard 4 quarters or 3 trimesters. Adjusts quarterly consolidation and Form 138 (SF9).
                </span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Attendance Lock Cutoff <span class="label-hint">Optional; records on or before this date are locked</span></label>
                <input v-model="form.attendance_lock_cutoff" :disabled="!canEditSchool" type="date" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>SARDO Consecutive Absences Alert <span class="label-hint">Unexcused consecutive days to trigger early warning</span></label>
                <input v-model.number="form.sardo_consecutive_absences" :disabled="!canEditSchool" type="number" min="1" max="30" placeholder="Default: 3" />
              </div>
              <div class="form-group">
                <label>SARDO Cumulative Absences Alert <span class="label-hint">Total monthly absences to trigger retention alert</span></label>
                <input v-model.number="form.sardo_cumulative_absences" :disabled="!canEditSchool" type="number" min="1" max="100" placeholder="Default: 5" />
              </div>
            </div>
            <div class="form-actions" v-if="canEditSchool">
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save School Info' }}
              </button>
            </div>
            <p v-if="error" class="error-msg">{{ error }}</p>
          </form>
        </div>

        <!-- School Year Configuration Tab -->
        <div v-if="activeTab === 'academic'" class="table-card">
          <div class="settings-panel-header">
            <h2>School Year Configuration</h2>
            <p>Configure the system-wide active School Year applicable across all schools in ElyTrack.</p>
          </div>

          <!-- Active System Year Banner -->
          <div class="global-sy-summary-card" style="padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--muted-subtle, var(--card)); margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
              <div>
                <span class="badge badge-success" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; display: inline-block;">
                  System-Wide Active Academic Year
                </span>
                <div style="display: flex; align-items: baseline; gap: 12px; margin-top: 4px;">
                  <span style="font-size: 1.85rem; font-weight: 800; color: var(--foreground); letter-spacing: -0.5px;">
                    {{ globalSchoolYearInput || form.school_year || '2026-2027' }}
                  </span>
                  <span style="font-size: 0.85rem; color: var(--muted-foreground);">
                    Applicable to all registered schools
                  </span>
                </div>
                <p style="margin: 8px 0 0; font-size: 0.82rem; color: var(--muted-foreground); max-width: 600px; line-height: 1.5;">
                  Defines the active calendar year for daily attendance logs, Monthly SF2 generation, quarterly attendance records, and SF9 (Form 138) grading sheets.
                </p>
              </div>

              <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <div style="text-align: right; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 14px;">
                  <div style="font-size: 1.25rem; font-weight: 700; color: var(--foreground);">
                    {{ schools.filter(s => (s.school_year || globalSchoolYearInput) === (globalSchoolYearInput || '2026-2027') && !s.archived_at).length }} / {{ schools.filter(s => !s.archived_at).length }}
                  </div>
                  <div style="font-size: 0.72rem; color: var(--muted-foreground); text-transform: uppercase; font-weight: 600;">
                    Schools Synchronized
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Configuration Form (Superadmin) -->
          <div v-if="auth.isSuperadmin" class="pref-group-card">
            <h3 class="pref-group-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span>Update System School Year</span>
            </h3>
            <p class="pref-group-sub">
              Set the global academic year and broadcast it to all schools. Each school will preserve its independent 3-Quarter (Trimester) or 4-Quarter (Standard DepEd) setting.
            </p>

            <form @submit.prevent="saveGlobalSchoolYearConfig" style="margin-top: 16px;">
              <div class="form-row" style="margin-bottom: 14px;">
                <div class="form-group" style="flex: 1; min-width: 260px;">
                  <label style="font-weight: 600;">Academic School Year <span class="required">*</span></label>
                  <input
                    v-model="globalSchoolYearInput"
                    placeholder="e.g. 2026-2027"
                    class="form-input"
                    required
                  />
                  <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; align-items: center;">
                    <span style="font-size: 0.75rem; color: var(--muted-foreground);">Presets:</span>
                    <button
                      v-for="preset in ['2024-2025', '2025-2026', '2026-2027', '2027-2028']"
                      :key="preset"
                      type="button"
                      class="btn-xs btn-outline"
                      style="font-size: 0.72rem; padding: 2px 7px; cursor: pointer;"
                      @click="globalSchoolYearInput = preset"
                    >
                      {{ preset }}
                    </button>
                  </div>
                </div>

                <div class="form-group" style="flex: 1; min-width: 260px; justify-content: flex-end;">
                  <label class="custom-checkbox-label" style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; margin-top: 6px;">
                    <input type="checkbox" v-model="applySchoolYearToAllActive" style="margin-top: 3px;" />
                    <div>
                      <strong style="font-size: 0.85rem; color: var(--foreground); display: block;">Apply to All Registered Schools</strong>
                      <span style="font-size: 0.75rem; color: var(--muted-foreground); display: block; line-height: 1.35;">
                        Instantly updates the school year for all active campuses without touching their 3Q or 4Q quarter format.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div class="form-actions" style="margin-top: 16px;">
                <button type="submit" class="btn-primary" :disabled="savingGlobalSy || !globalSchoolYearInput">
                  <span v-if="savingGlobalSy" class="spinner" style="margin-right: 6px;"></span>
                  {{ savingGlobalSy ? 'Saving...' : 'Save & Apply School Year Configuration' }}
                </button>
              </div>
            </form>
          </div>

          <!-- All Registered Schools Status -->
          <div class="schools-sy-overview" style="margin-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div>
                <h3 style="font-size: 0.95rem; font-weight: 700; margin: 0; color: var(--foreground);">School Year by Campus</h3>
                <p style="font-size: 0.78rem; color: var(--muted-foreground); margin: 2px 0 0;">
                  Overview of current school year and quarter calendar structure for each school.
                </p>
              </div>
              <button
                v-if="auth.isSuperadmin && schools.length > 0"
                type="button"
                class="btn-sm btn-secondary"
                @click="syncAllSchoolsToActiveSy"
                :disabled="savingGlobalSy"
                title="Sync all schools to the active global school year"
              >
                Sync All Campuses to {{ globalSchoolYearInput || 'Active Year' }}
              </button>
            </div>

            <div class="table-responsive" style="border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden;">
              <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: var(--muted-subtle, var(--card)); border-bottom: 1px solid var(--border); text-align: left; font-size: 0.75rem; text-transform: uppercase;">
                    <th style="padding: 10px 14px;">School Name</th>
                    <th style="padding: 10px 14px;">School ID / Code</th>
                    <th style="padding: 10px 14px;">Current School Year</th>
                    <th style="padding: 10px 14px;">Quarter Calendar</th>
                    <th style="padding: 10px 14px; text-align: right;" v-if="auth.isSuperadmin">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in schools.filter(s => !s.archived_at)" :key="s.id" style="border-bottom: 1px solid var(--border); font-size: 0.85rem;">
                    <td style="padding: 12px 14px; font-weight: 600;">
                      {{ s.name }}
                    </td>
                    <td style="padding: 12px 14px; color: var(--muted-foreground);">
                      {{ s.school_id || s.short || '—' }}
                    </td>
                    <td style="padding: 12px 14px;">
                      <span class="badge" :class="(s.school_year || globalSchoolYearInput) === (globalSchoolYearInput || '2026-2027') ? 'badge-success' : 'badge-warning'">
                        {{ s.school_year || globalSchoolYearInput || '2026-2027' }}
                      </span>
                    </td>
                    <td style="padding: 12px 14px;">
                      <span class="badge" :class="Number(s.quarter_count) === 3 ? 'badge-warning' : 'badge-secondary'">
                        {{ Number(s.quarter_count) === 3 ? '3 Quarters (Trimester)' : '4 Quarters (DepEd)' }}
                      </span>
                    </td>
                    <td style="padding: 12px 14px; text-align: right;" v-if="auth.isSuperadmin">
                      <button
                        v-if="s.school_year !== globalSchoolYearInput"
                        type="button"
                        class="btn-xs btn-outline"
                        style="padding: 2px 8px; font-size: 0.72rem; cursor: pointer;"
                        @click="syncSingleSchoolSy(s.id)"
                        title="Set this school to global school year"
                      >
                        Sync Year
                      </button>
                      <span v-else style="font-size: 0.75rem; color: var(--success, #10b981); font-weight: 600;">
                        In Sync
                      </span>
                    </td>
                  </tr>
                  <tr v-if="schools.filter(s => !s.archived_at).length === 0">
                    <td colspan="5" style="text-align: center; padding: 24px; color: var(--muted-foreground);">
                      No active schools registered.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Switch School Tab (Superadmin) -->
        <div v-if="activeTab === 'switchschool'" class="table-card">
          <div class="settings-panel-header">
            <h2>Switch School</h2>
            <p>Select which school to manage.</p>
          </div>
          <div class="form-group" style="max-width: 480px;">
            <label>School</label>
            <select v-model="selectedSchoolId" @change="onSchoolChange">
              <option value="">None</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <!-- Notifications & Preferences Tab -->
        <div v-if="activeTab === 'notifications'" class="table-card">
          <div class="settings-panel-header">
            <h2>Notifications &amp; Alert Preferences</h2>
            <p>Configure email delivery and realtime notifications for your account.</p>
          </div>

          <form @submit.prevent="saveNotificationPreferences" class="settings-form">
            <div class="pref-group-card">
              <h3 class="pref-group-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>Email Notifications</span>
              </h3>
              <p class="pref-group-sub">Choose which activities trigger automated email notifications to your verified email.</p>

              <div class="pref-toggle-row">
                <div class="pref-toggle-info">
                  <strong>Inquiry &amp; Support Replies</strong>
                  <span>Receive an email when support staff replies to your ticket or sends a direct message</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="notificationPrefs.email_on_inquiry_reply" />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="pref-toggle-row">
                <div class="pref-toggle-info">
                  <strong>Campus &amp; Platform Announcements</strong>
                  <span>Receive email alerts for priority broadcasts, holiday announcements, and emergency notices</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="notificationPrefs.email_on_announcement" />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <div class="pref-toggle-row">
                <div class="pref-toggle-info">
                  <strong>Ticket Status Transitions</strong>
                  <span>Receive an email notification when your support request is resolved, closed, or reopened</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="notificationPrefs.email_on_status_change" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="pref-group-card">
              <h3 class="pref-group-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
                </svg>
                <span>In-App Telemetry &amp; Topbar Badges</span>
              </h3>
              <p class="pref-group-sub">Configure live alert notifications shown inside the workspace.</p>

              <div class="pref-toggle-row">
                <div class="pref-toggle-info">
                  <strong>In-App Unread Counter</strong>
                  <span>Display realtime badges and notification flyout in the header bar</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="notificationPrefs.in_app_notifications" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="savingNotificationPrefs">
                {{ savingNotificationPrefs ? 'Saving Preferences...' : 'Save Notification Preferences' }}
              </button>
            </div>
          </form>

          <!-- Superadmin Platform Support Email Configuration -->
          <div v-if="auth.isSuperadmin" class="pref-group-card" style="margin-top: 24px;">
            <h3 class="pref-group-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Platform Support Inbox Configuration</span>
            </h3>
            <p class="pref-group-sub">Official email address where new support tickets and licensing requests are automatically routed.</p>

            <form @submit.prevent="saveSupportEmail" class="settings-form">
              <div class="form-group" style="max-width: 440px;">
                <label>Platform Support Email</label>
                <input
                  v-model="supportEmail"
                  type="email"
                  placeholder="support@elytrack.com"
                  required
                />
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-secondary" :disabled="savingSupportEmail">
                  {{ savingSupportEmail ? 'Saving Support Email...' : 'Update Platform Support Email' }}
                </button>
              </div>
            </form>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import { useNotifications } from '../composables/useNotifications'
import { useActiveSchool } from '../composables/useActiveSchool'

const auth = useAuthStore()
const { notify } = useNotifications()
const { theme, setTheme, toggleTheme } = useTheme()
const { setActiveSchool, clearActiveSchool, noneSelected } = useActiveSchool()

function handleThemeCardClick() {
  toggleTheme()
  activeTab.value = 'appearance'
}

const activeTab = ref('profile')
const saving = ref(false)
const error = ref('')
const schools = ref([])
const selectedSchoolId = ref('')
const globalSchoolYearInput = ref('')
const applyingGlobalSy = ref(false)
const savingGlobalSy = ref(false)
const applySchoolYearToAllActive = ref(true)
const schoolYearConfig = ref({
  school_year: '',
  active_school_year: '',
  total_schools: 0,
  synced_schools: 0,
  schools: []
})
const form = reactive({
  school_name: '',
  school_id: '',
  school_short: '',
  school_address: '',
  contact_email: '',
  contact_phone: '',
  division: '',
  district: '',
  principal_name: '',
  school_year: '',
  grading_period: '',
  quarter_count: 4,
  logo_url: '',
  attendance_lock_cutoff: '',
  sardo_consecutive_absences: 3,
  sardo_cumulative_absences: 5
})
const profile = reactive({ name: '', username: '', email: '', password: '', avatar_url: '' })
const savingProfile = ref(false)
const sendingVerification = ref(false)
const profileError = ref('')

const canEditSchool = computed(() => auth.isSuperadmin || auth.user?.role === 'admin')
const roleLabel = computed(() => {
  const r = auth.user?.role
  return r === 'superadmin' ? 'Superadmin' : r === 'admin' ? 'Administrator' : 'Teacher'
})

const assignedSchoolName = computed(() => {
  return form.school_name || auth.user?.school?.name || auth.user?.school?.school_name || (auth.isSuperadmin ? 'All Schools (Superadmin)' : '—')
})

const assignedClassLabel = computed(() => {
  if (auth.user?.grade || auth.user?.section) {
    return `${auth.user?.grade || '—'} - ${auth.user?.section || '—'}`
  }
  return 'None assigned'
})

onMounted(async () => {
  profile.name = auth.user?.name || ''
  profile.username = auth.user?.username || ''
  profile.email = auth.user?.email || ''
  profile.avatar_url = auth.user?.avatar_url || ''
  if (auth.isSuperadmin) {
    schools.value = await auth.getSchools()
    selectedSchoolId.value = noneSelected.value ? '' : (auth.schoolId || schools.value[0]?.id || '')
    await loadPlatformSettings()
  } else {
    selectedSchoolId.value = auth.schoolId || ''
  }
  await loadSchool()
  await loadSchoolYearConfig()
  await loadNotificationPreferences()
})

async function onSchoolChange() {
  if (!selectedSchoolId.value) {
    form.school_name = ''
    form.school_id = ''
    form.school_short = ''
    form.school_address = ''
    form.contact_email = ''
    form.contact_phone = ''
    form.division = ''
    form.district = ''
    form.principal_name = ''
    form.school_year = ''
    form.grading_period = ''
    form.quarter_count = 4
    form.logo_url = ''
    form.attendance_lock_cutoff = ''
    form.sardo_consecutive_absences = 3
    form.sardo_cumulative_absences = 5
    clearActiveSchool()
    notify('No school selected', 'info')
    return
  }
  await loadSchool()
  const school = schools.value.find(s => s.id === selectedSchoolId.value)
  if (school) {
    setActiveSchool({
      id: school.id,
      name: school.name,
      school_name: school.name,
      short: school.short,
      school_short: school.short,
      school_id: school.school_id,
    })
    notify(`Switched to ${school.name || 'school'}`, 'success')
  }
}

async function loadSchool() {
  if (!selectedSchoolId.value) {
    form.school_name = ''
    form.school_id = ''
    form.school_short = ''
    form.school_address = ''
    form.contact_email = ''
    form.contact_phone = ''
    form.division = ''
    form.district = ''
    form.principal_name = ''
    form.school_year = ''
    form.grading_period = ''
    form.quarter_count = 4
    form.logo_url = ''
    form.attendance_lock_cutoff = ''
    form.sardo_consecutive_absences = 3
    form.sardo_cumulative_absences = 5
    return
  }
  const data = await auth.getSchoolInfo(auth.isSuperadmin ? selectedSchoolId.value : undefined)
  const fallback = auth.user?.school || null
  if (data || fallback) {
    form.school_name = data?.school_name || fallback?.name || fallback?.school_name || ''
    form.school_id = data?.school_id || fallback?.school_id || ''
    form.school_short = data?.school_short || fallback?.short || fallback?.school_short || ''
    form.school_address = data?.school_address || fallback?.address || fallback?.school_address || ''
    form.contact_email = data?.contact_email || fallback?.contact_email || ''
    form.contact_phone = data?.contact_phone || fallback?.contact_phone || ''
    form.division = data?.division || fallback?.division || ''
    form.district = data?.district || fallback?.district || ''
    form.principal_name = data?.principal_name || fallback?.principal_name || ''
    form.school_year = data?.school_year || fallback?.school_year || ''
    form.grading_period = data?.grading_period || fallback?.grading_period || ''
    form.quarter_count = Number(data?.quarter_count || fallback?.quarter_count || 4) === 3 ? 3 : 4
    form.logo_url = data?.logo_url || fallback?.logo_url || ''
    form.attendance_lock_cutoff = data?.attendance_lock_cutoff || fallback?.attendance_lock_cutoff || ''
    form.sardo_consecutive_absences = data?.sardo_consecutive_absences ?? fallback?.sardo_consecutive_absences ?? 3
    form.sardo_cumulative_absences = data?.sardo_cumulative_absences ?? fallback?.sardo_cumulative_absences ?? 5
  }
}

function handleLogoUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    notify('Please select an image file', 'error')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    notify('Image file must be under 2MB', 'error')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    form.logo_url = String(e.target?.result || '')
  }
  reader.readAsDataURL(file)
}

async function resendVerification() {
  sendingVerification.value = true
  try {
    await auth.resendEmailVerification()
    notify('Verification email sent', 'success')
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    sendingVerification.value = false
  }
}

async function saveProfile() {
  savingProfile.value = true
  profileError.value = ''
  try {
    const payload = { name: profile.name.trim(), username: profile.username.trim(), email: profile.email.trim(), avatar_url: profile.avatar_url.trim() }
    if (profile.password && profile.password.trim()) payload.password = profile.password.trim()
    await auth.updateUser(auth.user.id, payload)
    profile.password = ''
    notify('Profile updated successfully', 'success')
  } catch (e) {
    profileError.value = e.message
    notify(e.message, 'error')
  } finally {
    savingProfile.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  if (auth.isSuperadmin && !selectedSchoolId.value) {
    saving.value = false
    error.value = 'Select a school first'
    return
  }
  try {
    await auth.saveSchoolInfo({ ...form }, auth.isSuperadmin ? (selectedSchoolId.value || undefined) : undefined)
    notify('School settings saved', 'success')
  } catch (e) {
    error.value = e.message
    notify(e.message, 'error')
  } finally {
    saving.value = false
  }
}

const notificationPrefs = reactive({
  email_on_inquiry_reply: true,
  email_on_announcement: true,
  email_on_status_change: true,
  in_app_notifications: true
})
const savingNotificationPrefs = ref(false)
const supportEmail = ref('')
const savingSupportEmail = ref(false)

async function loadNotificationPreferences() {
  try {
    const res = await fetch('/api/users/me/notification-preferences', {
      headers: auth.actorHeaders()
    })
    if (res.ok) {
      const data = await res.json()
      notificationPrefs.email_on_inquiry_reply = Boolean(data.email_on_inquiry_reply)
      notificationPrefs.email_on_announcement = Boolean(data.email_on_announcement)
      notificationPrefs.email_on_status_change = Boolean(data.email_on_status_change)
      notificationPrefs.in_app_notifications = Boolean(data.in_app_notifications)
    }
  } catch (err) {
    console.warn('Could not load notification preferences:', err)
  }
}

async function saveNotificationPreferences() {
  savingNotificationPrefs.value = true
  try {
    const res = await fetch('/api/users/me/notification-preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify({
        ...notificationPrefs,
        ...auth.actorParams()
      })
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Failed to save notification preferences')
    }
    notify('Notification preferences updated successfully', 'success')
  } catch (err) {
    notify(err.message, 'error')
  } finally {
    savingNotificationPrefs.value = false
  }
}

async function loadPlatformSettings() {
  if (!auth.isSuperadmin) return
  try {
    const res = await fetch('/api/settings', {
      headers: auth.actorHeaders()
    })
    if (res.ok) {
      const data = await res.json()
      supportEmail.value = data.support_email || ''
      if (data.school_year || data.active_school_year) {
        globalSchoolYearInput.value = data.school_year || data.active_school_year || ''
      }
    }
  } catch {}
}

async function loadSchoolYearConfig() {
  try {
    const res = await fetch('/api/settings/school-year', {
      headers: auth.actorHeaders()
    })
    if (res.ok) {
      const data = await res.json()
      schoolYearConfig.value = data
      if (data.school_year && !globalSchoolYearInput.value) {
        globalSchoolYearInput.value = data.school_year
      }
    }
  } catch (err) {
    console.error('Failed to load school year config:', err)
  }
}

async function saveGlobalSchoolYearConfig() {
  const sy = String(globalSchoolYearInput.value || '').trim()
  if (!sy) {
    notify('Please enter a valid school year', 'error')
    return
  }
  savingGlobalSy.value = true
  try {
    const res = await auth.updateSchoolYearConfig(sy, applySchoolYearToAllActive.value)
    notify(`Academic school year "${sy}" saved${applySchoolYearToAllActive.value ? ` and applied to ${res?.updatedSchoolsCount || schools.value.length} schools!` : '!'}`, 'success')
    schools.value = await auth.getSchools()
    await loadSchool()
    await loadSchoolYearConfig()
  } catch (err) {
    notify(err.message || 'Failed to save school year configuration', 'error')
  } finally {
    savingGlobalSy.value = false
  }
}

async function syncAllSchoolsToActiveSy() {
  const sy = String(globalSchoolYearInput.value || form.school_year || '2026-2027').trim()
  if (!confirm(`Apply School Year "${sy}" to all active schools? Each school retains its independent Quarter setting.`)) {
    return
  }
  savingGlobalSy.value = true
  try {
    const res = await auth.bulkUpdateSchoolYear(sy)
    notify(`Applied School Year "${sy}" across all active schools (${res?.updatedCount || schools.value.length})!`, 'success')
    schools.value = await auth.getSchools()
    await loadSchool()
    await loadSchoolYearConfig()
  } catch (err) {
    notify(err.message || 'Failed to sync school year', 'error')
  } finally {
    savingGlobalSy.value = false
  }
}

async function syncSingleSchoolSy(schoolId) {
  const sy = String(globalSchoolYearInput.value || '2026-2027').trim()
  try {
    await auth.updateSchool(schoolId, { school_year: sy })
    notify(`Updated school year to "${sy}"`, 'success')
    schools.value = await auth.getSchools()
    await loadSchool()
    await loadSchoolYearConfig()
  } catch (err) {
    notify(err.message || 'Failed to update school year', 'error')
  }
}

async function applyGlobalSchoolYear() {
  const sy = String(globalSchoolYearInput.value || '').trim()
  if (!sy) {
    notify('Please enter a valid school year', 'error')
    return
  }
  if (!confirm(`Are you sure you want to broadcast School Year "${sy}" to all registered schools? Each school's 3-quarter or 4-quarter configuration will be preserved.`)) {
    return
  }
  applyingGlobalSy.value = true
  try {
    const res = await auth.applyGlobalSchoolYear(sy)
    notify(`Applied School Year "${sy}" across all ${res?.updatedSchoolsCount || schools.value.length} active schools!`, 'success')
    // Refresh school data
    schools.value = await auth.getSchools()
    await loadSchool()
    await loadSchoolYearConfig()
  } catch (err) {
    notify(err.message || 'Failed to apply school year globally', 'error')
  } finally {
    applyingGlobalSy.value = false
  }
}

async function applyFormSyToAll() {
  const sy = String(form.school_year || '').trim()
  if (!sy) {
    notify('School year field is empty', 'error')
    return
  }
  if (!confirm(`Apply School Year "${sy}" to all active schools? Each school retains its independent Quarter setting.`)) {
    return
  }
  globalSchoolYearInput.value = sy
  await applyGlobalSchoolYear()
}

async function saveSupportEmail() {
  if (!supportEmail.value || !supportEmail.value.includes('@')) {
    notify('A valid support email is required', 'error')
    return
  }
  savingSupportEmail.value = true
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify({
        settings: { support_email: supportEmail.value.trim() },
        ...auth.actorParams()
      })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to update support email')
    }
    notify('Platform support email updated', 'success')
  } catch (err) {
    notify(err.message, 'error')
  } finally {
    savingSupportEmail.value = false
  }
}
</script>

<style scoped>
.pref-group-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}
.pref-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 4px 0;
}
.pref-group-sub {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  margin: 0 0 16px 0;
}
.pref-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid var(--border);
}
.pref-toggle-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.pref-toggle-info strong {
  font-size: 0.9rem;
  color: var(--foreground);
}
.pref-toggle-info span {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--input);
  transition: .3s;
  border-radius: 24px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--card);
  transition: .3s;
  border-radius: 50%;
}
input:checked + .toggle-slider {
  background-color: var(--primary);
}
input:checked + .toggle-slider:before {
  transform: translateX(20px);
}
.toggle-switch input:focus-visible + .toggle-slider {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
}

@media (max-width: 600px) {
  .pref-toggle-row {
    align-items: flex-start;
    gap: 14px;
  }
  .pref-toggle-info span {
    line-height: 1.45;
  }
}
</style>
