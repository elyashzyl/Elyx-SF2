<template>
  <aside
    id="app-sidebar"
    class="sidebar"
    :class="{
      'is-collapsed': isCollapsed && !isMobile,
      'is-open': openMobile && isMobile
    }"
    :aria-expanded="isMobile ? openMobile : !isCollapsed"
    aria-label="Application navigation"
  >
    <!-- Sidebar Header / Branding in Rail Mode -->
    <div class="sidebar-header" v-if="!isMobile">
      <div class="sidebar-header-brand" v-if="!isCollapsed">
        <span class="sidebar-header-badge">ElyTrack</span>
        <span class="sidebar-header-sub">Workspace</span>
      </div>
      <button
        type="button"
        class="sidebar-collapse-trigger"
        :title="isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="toggleSidebar"
      >
        <svg v-if="isCollapsed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <line x1="9" x2="9" y1="3" y2="21"/>
          <path d="m14 9 3 3-3 3"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <line x1="9" x2="9" y1="3" y2="21"/>
          <path d="m16 15-3-3 3-3"/>
        </svg>
      </button>
    </div>

    <!-- Navigation Scroll Area -->
    <nav class="sidebar-scroll" aria-label="Main navigation">
      <!-- Section: Workspace -->
      <div class="sidebar-group">
        <div class="sidebar-group-label" v-if="!isCollapsed || isMobile">Workspace</div>
        <div class="sidebar-group-divider" v-else aria-hidden="true"></div>
        <div class="sidebar-menu">
          <!-- Overview (Admin) -->
          <router-link v-if="auth.isAdmin" to="/admin" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Overview</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Overview</span>
          </router-link>

          <!-- Overview (Teacher) -->
          <router-link v-if="auth.isTeacher" to="/teacher" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Overview</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Overview</span>
          </router-link>

          <!-- Daily Attendance -->
          <router-link to="/attendance" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 15h3M8 18h6" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Daily attendance</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Daily attendance</span>
          </router-link>

          <!-- Monthly SF2 -->
          <router-link to="/monthly" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M8 7h8M8 11h8" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Monthly SF2</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Monthly SF2</span>
          </router-link>

          <!-- Reports & Analytics (Admin) -->
          <router-link v-if="auth.isAdmin" to="/reports" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Reports &amp; Analytics</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Reports &amp; Analytics</span>
          </router-link>

          <!-- Schedule & Calendar -->
          <router-link to="/schedule" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Schedule &amp; Calendar</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Schedule &amp; Calendar</span>
          </router-link>

          <!-- Academic Grading (SF9) -->
          <router-link to="/grading" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Academic Grading (SF9)</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Academic Grading (SF9)</span>
          </router-link>

          <!-- E-Class Record (Raw Scores) -->
          <router-link to="/class-record" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
                <line x1="9" y1="7" x2="15" y2="7"/>
                <line x1="9" y1="11" x2="15" y2="11"/>
                <line x1="9" y1="15" x2="13" y2="15"/>
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">E-Class Record (Raw Scores)</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">E-Class Record (Raw Scores)</span>
          </router-link>
        </div>
      </div>

      <!-- Section: People (Admin) -->
      <div v-if="auth.isAdmin" class="sidebar-group">
        <div class="sidebar-group-label" v-if="!isCollapsed || isMobile">People</div>
        <div class="sidebar-group-divider" v-else aria-hidden="true"></div>
        <div class="sidebar-menu">
          <router-link to="/students" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Students</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Students</span>
          </router-link>
          <router-link to="/users" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">User accounts</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">User accounts</span>
          </router-link>
        </div>
      </div>

      <!-- Section: Configuration (Admin) -->
      <div v-if="auth.isAdmin" class="sidebar-group">
        <div class="sidebar-group-label" v-if="!isCollapsed || isMobile">Configuration</div>
        <div class="sidebar-group-divider" v-else aria-hidden="true"></div>
        <div class="sidebar-menu">
          <router-link to="/grade-levels" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" /><path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Grades &amp; sections</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Grades &amp; sections</span>
          </router-link>

          <router-link to="/subjects" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Subjects &amp; curriculum</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Subjects &amp; curriculum</span>
          </router-link>

          <router-link to="/quarterly" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Quarterly terms</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Quarterly terms</span>
          </router-link>

          <router-link to="/licenses" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">License &amp; Plans</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">License &amp; Plans</span>
          </router-link>

          <router-link to="/errors" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Incident &amp; error logs</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Incident &amp; error logs</span>
          </router-link>
        </div>
      </div>

      <!-- Section: Support -->
      <div class="sidebar-group">
        <div class="sidebar-group-label" v-if="!isCollapsed || isMobile">Support</div>
        <div class="sidebar-group-divider" v-else aria-hidden="true"></div>
        <div class="sidebar-menu">
          <router-link to="/inquiries" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M8 9h8M8 13h5" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Helpdesk &amp; Inquiries</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Helpdesk &amp; Inquiries</span>
          </router-link>
        </div>
      </div>

      <!-- Section: Platform (Superadmin) -->
      <div v-if="auth.isSuperadmin" class="sidebar-group">
        <div class="sidebar-group-label" v-if="!isCollapsed || isMobile">Platform</div>
        <div class="sidebar-group-divider" v-else aria-hidden="true"></div>
        <div class="sidebar-menu">
          <router-link to="/schools" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2 7 10-5 10 5-10 5L2 7Z" /><path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Schools</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Schools</span>
          </router-link>

          <router-link to="/logs" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" />
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Activity logs</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Activity logs</span>
          </router-link>

          <router-link to="/errors" class="sidebar-menu-button" @click="handleNavClick">
            <span class="sidebar-menu-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <span class="sidebar-menu-label" v-if="!isCollapsed || isMobile">Error management</span>
            <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Error management</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Sidebar Footer / Bottom: Profile Card & Logout -->
    <div class="sidebar-footer">
      <router-link
        to="/settings"
        class="sidebar-profile-card"
        :class="{ 'is-collapsed-profile': isCollapsed && !isMobile }"
        @click="handleNavClick"
        title="User Profile &amp; Settings"
      >
        <div class="sidebar-profile-avatar-wrap">
          <div class="sidebar-profile-avatar">
            <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url" alt="Profile avatar" />
            <span v-else>{{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          <span class="sidebar-status-dot" title="Account active"></span>
        </div>

        <div class="sidebar-profile-info" v-if="!isCollapsed || isMobile">
          <span class="sidebar-profile-name">{{ auth.user?.name || 'User' }}</span>
          <span class="sidebar-profile-role">{{ roleLabel }} · Settings</span>
        </div>

        <span class="sidebar-settings-icon" v-if="!isCollapsed || isMobile" title="Settings" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V22h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 17a1.7 1.7 0 0 0-1.56-1.03H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 12a1.7 1.7 0 0 0-.34-1.88L8 10.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V7h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 12c.2.64.8 1.03 1.46 1.03h.24v2.4h-.24c-.66 0-1.26.39-1.46 1.03Z" />
          </svg>
        </span>

        <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Profile &amp; Settings</span>
      </router-link>

      <button
        type="button"
        @click="$emit('logout')"
        class="sidebar-logout-btn"
        :class="{ 'is-collapsed-logout': isCollapsed && !isMobile }"
        title="Sign out"
        aria-label="Sign out"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        </svg>
        <span class="sidebar-tooltip" v-if="isCollapsed && !isMobile">Sign out</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSidebar } from '../composables/useSidebar'

defineEmits(['logout'])

const auth = useAuthStore()
const { isCollapsed, isMobile, openMobile, toggleSidebar, closeSidebar } = useSidebar()

const roleLabel = computed(() => {
  const map = { superadmin: 'Superadmin', admin: 'Administrator', teacher: 'Teacher' }
  return map[auth.user?.role] || 'Member'
})

function handleNavClick() {
  if (isMobile.value) {
    closeSidebar()
  }
}
</script>

<style scoped>
/* ==========================================================================
   Shadcn-Vue Modern Sidebar Component
   ========================================================================== */
.sidebar {
  position: sticky;
  top: var(--header-height, 70px);
  z-index: 50;
  width: var(--sidebar-width, 256px);
  min-width: var(--sidebar-width, 256px);
  height: calc(100vh - var(--header-height, 70px));
  max-height: calc(100vh - var(--header-height, 70px));
  display: flex;
  flex-direction: column;
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  border-right: 1px solid var(--sidebar-border);
  transition: width .2s cubic-bezier(0.4, 0, 0.2, 1), transform .22s ease;
  will-change: width, transform;
  contain: layout style;
}

.sidebar.is-collapsed {
  --sidebar-width: 68px;
  width: 68px;
  min-width: 68px;
}

/* Sidebar Top Rail Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  min-height: 48px;
}

.sidebar.is-collapsed .sidebar-header {
  justify-content: center;
  padding: 10px 0;
}

.sidebar-header-brand {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}

.sidebar-header-badge {
  font-family: 'Manrope', sans-serif;
  font-size: .84rem;
  font-weight: 800;
  color: var(--sidebar-foreground);
  letter-spacing: -.02em;
}

.sidebar-header-sub {
  font-size: .62rem;
  font-weight: 600;
  color: var(--sidebar-foreground);
  opacity: .5;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.sidebar-collapse-trigger {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  background: var(--sidebar-accent);
  color: var(--sidebar-foreground);
  cursor: pointer;
  opacity: .75;
  transition: opacity .15s ease, background .15s ease, color .15s ease, transform .15s ease;
}

.sidebar-collapse-trigger:hover {
  opacity: 1;
  background: rgba(255, 255, 255, .12);
  color: var(--sidebar-primary);
  transform: scale(1.04);
}

/* Scrollable Nav Area */
.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 10px;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, .15) transparent;
}

.sidebar.is-collapsed .sidebar-scroll {
  padding: 12px 6px;
}

.sidebar-group {
  margin-bottom: 20px;
}

.sidebar.is-collapsed .sidebar-group {
  margin-bottom: 14px;
}

.sidebar-group-label {
  padding: 0 10px 8px;
  color: var(--sidebar-foreground);
  opacity: .45;
  font-size: .59rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.sidebar-group-divider {
  height: 1px;
  background: var(--sidebar-border);
  margin: 6px 6px 10px;
  opacity: .6;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Menu Button */
.sidebar-menu-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 40px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 9px;
  color: var(--sidebar-foreground);
  opacity: .72;
  font-size: .73rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background .16s ease, color .16s ease, opacity .16s ease, transform .16s ease, border-color .16s ease;
}

.sidebar.is-collapsed .sidebar-menu-button {
  justify-content: center;
  padding: 0;
  width: 44px;
  height: 40px;
  margin: 0 auto;
}

.sidebar-menu-button:hover {
  opacity: 1;
  background: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
  transform: translateX(2px);
}

.sidebar.is-collapsed .sidebar-menu-button:hover {
  transform: none;
}

.sidebar-menu-button.router-link-active {
  opacity: 1;
  background: var(--sidebar-accent);
  border-color: rgba(255, 255, 255, .1);
  color: var(--sidebar-accent-foreground);
  box-shadow: inset 3px 0 0 var(--sidebar-primary);
}

.sidebar.is-collapsed .sidebar-menu-button.router-link-active {
  box-shadow: inset 2px 0 0 var(--sidebar-primary);
  border-color: rgba(45, 212, 191, .35);
  background: rgba(45, 212, 191, .12);
  color: var(--sidebar-primary);
}

.sidebar-menu-button.router-link-active::after {
  content: '';
  position: absolute;
  right: 12px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--sidebar-primary);
}

.sidebar.is-collapsed .sidebar-menu-button.router-link-active::after {
  display: none;
}

.sidebar-menu-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: currentColor;
}

.sidebar-menu-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Shadcn-Style Hover Tooltip in Collapsed Mode */
.sidebar-tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  border: 1px solid var(--sidebar-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, .35);
  padding: 5px 11px;
  border-radius: 6px;
  font-size: .72rem;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity .15s ease, visibility .15s ease, transform .15s ease;
  z-index: 999;
}

.sidebar.is-collapsed .sidebar-menu-button:hover .sidebar-tooltip,
.sidebar.is-collapsed .sidebar-profile-card:hover .sidebar-tooltip,
.sidebar.is-collapsed .sidebar-logout-btn:hover .sidebar-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(3px);
}

/* Sidebar Footer */
.sidebar-footer {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 10px;
  border-top: 1px solid var(--sidebar-border);
  background: var(--sidebar);
  flex-shrink: 0;
}

.sidebar.is-collapsed .sidebar-footer {
  flex-direction: column;
  padding: 10px 6px;
  gap: 8px;
}

.sidebar-profile-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 9px;
  color: var(--sidebar-foreground);
  text-decoration: none;
  cursor: pointer;
  transition: background .14s ease, border-color .14s ease;
}

.sidebar-profile-card.is-collapsed-profile {
  flex: 0 0 auto;
  justify-content: center;
  padding: 4px;
}

.sidebar-profile-card:hover {
  background: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}

.sidebar-profile-card.router-link-active {
  background: var(--sidebar-accent);
  border-color: rgba(255, 255, 255, .12);
  color: var(--sidebar-accent-foreground);
  box-shadow: inset 3px 0 0 var(--sidebar-primary);
}

.sidebar-profile-avatar-wrap {
  position: relative;
  flex: 0 0 auto;
}

.sidebar-profile-avatar {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 9px;
  background: var(--sidebar-accent);
  color: var(--sidebar-foreground);
  font-size: .78rem;
  font-weight: 800;
}

.sidebar-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-status-dot {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px var(--sidebar);
}

.sidebar-profile-info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.sidebar-profile-name {
  overflow: hidden;
  color: var(--sidebar-foreground);
  font-size: .74rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-profile-role {
  overflow: hidden;
  color: var(--sidebar-foreground);
  opacity: .58;
  font-size: .61rem;
  text-transform: capitalize;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-settings-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: var(--sidebar-foreground);
  opacity: .42;
  transition: opacity .14s ease, transform .14s ease;
}

.sidebar-profile-card:hover .sidebar-settings-icon {
  opacity: .95;
  transform: rotate(30deg);
}

.sidebar-logout-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--sidebar-foreground);
  opacity: .65;
  cursor: pointer;
  transition: background .14s ease, color .14s ease, opacity .14s ease, border-color .14s ease;
}

.sidebar-logout-btn:hover {
  opacity: 1;
  background: rgba(239, 68, 68, .15);
  border-color: rgba(239, 68, 68, .28);
  color: #f87171;
}

.sidebar-menu-button:focus-visible,
.sidebar-profile-card:focus-visible,
.sidebar-logout-btn:focus-visible,
.sidebar-collapse-trigger:focus-visible {
  outline: 2px solid var(--sidebar-primary);
  outline-offset: 2px;
}

/* Mobile Responsive Drawer Overlay */
@media (max-width: 820px) {
  .sidebar {
    position: fixed;
    top: var(--header-height, 62px);
    left: 0;
    z-index: 160;
    width: 270px;
    min-width: 270px;
    height: calc(100vh - var(--header-height, 62px));
    box-shadow: var(--shadow-xl);
    transform: translateX(-105%);
    transition: transform .22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }

  .sidebar-header {
    display: none;
  }
}
</style>
