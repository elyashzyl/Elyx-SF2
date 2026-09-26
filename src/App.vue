<template>
  <div id="app" :data-theme="theme">
    <nav v-if="auth.user" class="top-nav">
      <button class="mobile-menu-btn" type="button" aria-label="Open navigation" @click="sidebarOpen = !sidebarOpen">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div class="top-nav-brand">
        <img src="/elytrack-logo.png" alt="ElyTrack Logo" class="top-nav-brand-img" />
        <span class="top-nav-brand-copy">
          <strong>ElyTrack</strong>
          <small>School operations</small>
        </span>
      </div>

      <div class="top-nav-context">
        <span class="top-nav-context-label">Workspace</span>
        <strong>{{ currentPageTitle }}</strong>
      </div>

      <div class="top-nav-spacer"></div>

      <div class="top-nav-school" :title="pillName">
        <span class="top-nav-school-dot"></span>
        <span class="top-nav-school-copy">
          <small>Active school</small>
          <strong>{{ pillName }}</strong>
        </span>
      </div>

      <div class="top-nav-actions">
        <button
          @click="showTutorial = true"
          class="top-nav-btn tutorial-btn"
          title="Onboarding walkthrough &amp; guide"
          aria-label="Onboarding walkthrough &amp; guide"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        <button
          @click="toggleTheme()"
          class="top-nav-btn"
          :title="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
          :aria-label="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
        >
          <svg v-if="theme === 'light'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </button>

        <button
          @click="toggleNotifications"
          class="top-nav-btn notification-btn"
          :class="{ 'has-notifications': unreadCount > 0 }"
          title="Notifications"
          aria-label="Notifications"
          :aria-expanded="showNotifications"
          ref="notifBellRef"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
        </button>

        <button @click="handleLogout" class="top-nav-logout" title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </nav>

    <div v-if="auth.isImpersonating" class="impersonate-banner">
      <span class="impersonate-banner-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
        </svg>
      </span>
      <span>Viewing as <strong>{{ auth.user.name }}</strong> ({{ auth.user.role }}) · started by {{ auth.impersonatedBy?.name }}</span>
      <button @click="handleStopImpersonating" class="impersonate-stop" :disabled="stoppingImpersonation">
        {{ stoppingImpersonation ? 'Returning…' : 'Return to superadmin' }}
      </button>
    </div>

    <!-- License Lock Banner for Admins -->
    <div v-if="licenseLocked && auth.isAdmin" class="license-lock-banner">
      <span>⚠️ Your school's ElyTrack license is currently <strong>{{ licenseStatus.toUpperCase() }}</strong>. Operational modules are locked.</span>
      <router-link to="/licenses" class="lock-action-btn">Manage License &amp; Renew →</router-link>
    </div>

    <!-- Teacher Lockout Screen -->
    <div v-if="licenseLocked && auth.isTeacher" class="license-teacher-lockout">
      <div class="lockout-card">
        <img src="/elytrack-logo.png" alt="ElyTrack" class="lockout-logo" />
        <h2>School Workspace Locked</h2>
        <p>Your school's ElyTrack subscription is currently <strong>{{ licenseStatus.toUpperCase() }}</strong>.</p>
        <p class="lockout-sub">Attendance recording and SF2 reporting are locked until your school administrator renews the active campus license.</p>
        <button @click="handleLogout" class="btn btn-secondary" style="margin-top: 10px;">Sign out</button>
      </div>
    </div>

    <div v-if="auth.user" class="app-body">
      <aside class="sidebar" :class="{ 'is-open': sidebarOpen }">
        <div class="sidebar-scroll">
          <div class="sidebar-section-title">Workspace</div>
          <div class="sidebar-links">
            <router-link v-if="auth.isAdmin" to="/admin" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              <span>Overview</span>
            </router-link>
            <router-link v-if="auth.isTeacher" to="/teacher" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              <span>Overview</span>
            </router-link>
            <router-link to="/attendance" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 15h3M8 18h6" />
                </svg>
              </span>
              <span>Daily attendance</span>
            </router-link>
            <router-link to="/monthly" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M8 7h8M8 11h8" />
                </svg>
              </span>
              <span>Monthly SF2</span>
            </router-link>
            <router-link to="/schedule" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <span>Schedule & Calendar</span>
            </router-link>
          </div>

          <div v-if="auth.isAdmin" class="sidebar-section-title">People</div>
          <div v-if="auth.isAdmin" class="sidebar-links">
            <router-link to="/students" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span>Students</span>
            </router-link>
            <router-link to="/users" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span>User accounts</span>
            </router-link>
          </div>

          <template v-if="auth.isAdmin">
            <div class="sidebar-section-title">Configuration</div>
            <div class="sidebar-links">
              <router-link to="/grade-levels" @click="closeSidebar">
                <span class="nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" /><path d="M8 7h8M8 11h8M8 15h5" />
                  </svg>
                </span>
                <span>Grades & sections</span>
              </router-link>
              <router-link to="/licenses" @click="closeSidebar">
                <span class="nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <span>License & Plans</span>
              </router-link>
            </div>
          </template>

          <template v-if="auth.isSuperadmin">
            <div class="sidebar-section-title">Platform</div>
            <div class="sidebar-links">
              <router-link to="/schools" @click="closeSidebar">
                <span class="nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m2 7 10-5 10 5-10 5L2 7Z" /><path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
                  </svg>
                </span>
                <span>Schools</span>
              </router-link>
              <router-link to="/logs" @click="closeSidebar">
                <span class="nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" />
                  </svg>
                </span>
                <span>Activity logs</span>
              </router-link>
            </div>
          </template>
        </div>

        <div class="sidebar-bottom">
          <router-link
            to="/settings"
            class="sidebar-profile-btn"
            @click="closeSidebar"
            title="User Profile & Settings"
          >
            <div class="sidebar-profile-avatar-wrap">
              <div class="sidebar-profile-avatar">{{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}</div>
              <span class="sidebar-status-dot" title="Account active"></span>
            </div>
            <div class="sidebar-profile-info">
              <span class="sidebar-profile-name">{{ auth.user?.name || 'User' }}</span>
              <span class="sidebar-profile-role">{{ roleLabel }} · Settings</span>
            </div>
            <span class="sidebar-settings-icon" title="Settings" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V22h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 17a1.7 1.7 0 0 0-1.56-1.03H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 12a1.7 1.7 0 0 0-.34-1.88L8 10.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V7h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 12c.2.64.8 1.03 1.46 1.03h.24v2.4h-.24c-.66 0-1.26.39-1.46 1.03Z" />
              </svg>
            </span>
          </router-link>

          <button
            type="button"
            @click="handleLogout"
            class="sidebar-logout-btn"
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      <button v-if="sidebarOpen" class="sidebar-scrim" type="button" aria-label="Close navigation" @click="closeSidebar"></button>
      <main class="main-with-sidebar">
        <router-view />
      </main>
    </div>
    <main v-else class="main-full">
      <router-view />
    </main>

    <div v-if="showNotifications" class="notif-panel" ref="notifPanelRef">
      <div class="notif-header">
        <div>
          <span class="notif-title">Notifications</span>
          <small>Recent workspace activity</small>
        </div>
        <div v-if="notifications.length" class="notif-header-actions">
          <button v-if="unreadCount" @click="markAllRead" class="notif-action-btn">Mark read</button>
          <button @click="clearAll" class="notif-action-btn notif-action--clear">Clear</button>
        </div>
      </div>
      <div v-if="notifications.length" class="notif-list">
        <div
          v-for="n in notifications"
          :key="n.id"
          :class="['notif-item', 'notif-item--' + n.type, { unread: !n.read }]"
          @click="openNotification(n)"
        >
          <span class="notif-item-icon" :class="'icon--' + n.type">{{ notifIcon(n.type) }}</span>
          <div class="notif-item-body">
            <span class="notif-item-message">{{ n.message }}</span>
            <span class="notif-item-time">{{ formatTimeAgo(n.ts) }}</span>
          </div>
          <button @click.stop="dismiss(n.id)" class="notif-item-close" title="Dismiss">&times;</button>
        </div>
      </div>
      <div v-else class="notif-empty">
        <span class="notif-empty-icon">✓</span>
        <strong>You're all caught up</strong>
        <span>No notifications yet.</span>
      </div>
    </div>

    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', 'toast--' + t.type]">
        <span>{{ t.message }}</span>
        <button @click="removeToast(t.id)" class="toast-close">&times;</button>
      </div>
    </div>

    <!-- Walk-In User Onboarding Tutorial -->
    <WalkInTutorial v-model:show="showTutorial" />

    <!-- Floating Help & Support Chat Directed to Superadmin -->
    <SupportChatModal />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from './composables/useToast'
import { useNotifications } from './composables/useNotifications'
import { useTheme } from './composables/useTheme'
import { useActiveSchool } from './composables/useActiveSchool'
import { restoreScrollAfterLoad } from './router'
import WalkInTutorial from './components/WalkInTutorial.vue'
import SupportChatModal from './components/SupportChatModal.vue'

const auth = useAuthStore()
const router = useRouter()
const { toasts, removeToast } = useToast()
const { notifications, unreadCount, markRead, markAllRead, dismiss, clearAll, formatTimeAgo } = useNotifications()
const { theme, toggleTheme } = useTheme()
const { hasActive, displayName, displayShort, displayAvatar, noneSelected } = useActiveSchool()

const sidebarOpen = ref(false)
const showNotifications = ref(false)
const notifPanelRef = ref(null)
const notifBellRef = ref(null)
const stoppingImpersonation = ref(false)
const school = reactive({ school_name: '', school_id: '', school_address: '', school_short: '' })

const showTutorial = ref(false)

const licenseLocked = ref(false)
const licenseStatus = ref('active')

async function checkLicenseStatus() {
  if (auth.isSuperadmin || !auth.user?.school_id) {
    licenseLocked.value = false
    return
  }
  try {
    const res = await fetch('/api/licenses?' + new URLSearchParams(auth.actorParams()))
    const data = await res.json()
    if (data?.license) {
      licenseStatus.value = data.license.status
      licenseLocked.value = data.license.status === 'suspended' || data.license.is_expired
    }
  } catch {}
}

const routeTitles = {
  AdminDashboard: 'Overview',
  TeacherDashboard: 'Overview',
  AttendanceSheet: 'Daily attendance',
  MonthlyAttendance: 'Monthly SF2',
  Schedule: 'Schedule & Calendar',
  StudentManagement: 'Students',
  UserManagement: 'User accounts',
  GradeLevels: 'Grades & sections',
  Licenses: 'License & Subscription',
  Settings: 'Settings',
  Schools: 'Schools',
  ActivityLogs: 'Activity logs'
}
const currentPageTitle = computed(() => (router.currentRoute?.value?.name ? routeTitles[router.currentRoute.value.name] : null) || 'Workspace')
const roleLabel = computed(() => ({ superadmin: 'Superadmin', admin: 'Administrator', teacher: 'Teacher' }[auth.user?.role] || 'Member'))

const noSchoolContext = computed(() => noneSelected.value && auth.isSuperadmin)
const ownSchool = computed(() => (auth.user?.school && auth.user.school.school_id ? auth.user.school : null) || null)
const brandShort = computed(() => {
  if (noSchoolContext.value) return ''
  if (hasActive.value) return displayShort.value
  if (ownSchool.value) return ownSchool.value.short || ownSchool.value.school_short || ''
  return school.school_short || ''
})
const brandInitial = computed(() => (brandShort.value || 'ET').slice(0, 2).toUpperCase())
const pillAvatar = computed(() => {
  if (noSchoolContext.value) return (auth.user?.name || 'U').charAt(0).toUpperCase()
  if (hasActive.value) return displayAvatar.value
  if (ownSchool.value) return (ownSchool.value.short || ownSchool.value.school_short || ownSchool.value.name || 'S').charAt(0).toUpperCase()
  return (auth.user?.name || 'U').charAt(0).toUpperCase()
})
const pillName = computed(() => {
  if (noSchoolContext.value) return 'All schools'
  if (hasActive.value) return displayName.value || 'School'
  if (ownSchool.value) return ownSchool.value.name || ownSchool.value.school_name || 'School'
  return school.school_name || school.school_short || 'School'
})

async function loadSchool() {
  if (noSchoolContext.value) {
    Object.assign(school, { school_name: '', school_id: '', school_address: '', school_short: '' })
    return
  }
  if (ownSchool.value) {
    school.school_name = ownSchool.value.name || ownSchool.value.school_name || ''
    school.school_id = ownSchool.value.school_id || ''
    school.school_short = ownSchool.value.short || ownSchool.value.school_short || ''
    school.school_address = ownSchool.value.address || ownSchool.value.school_address || ''
    return
  }
  try {
    const params = new URLSearchParams({ userId: auth.user?.id || '', userRole: auth.user?.role || '' })
    const res = await fetch(`/api/settings/school?${params}`)
    const data = await res.json()
    Object.assign(school, data)
  } catch {}
}

let appLicenseInterval = null

onMounted(() => {
  loadSchool()
  checkLicenseStatus()
  restoreScrollAfterLoad()

  // Auto-launch walkthrough for first-time authenticated users
  if (auth.user && !localStorage.getItem('elytrack_tutorial_seen')) {
    showTutorial.value = true
  }

  // Realtime license validation check every 10 seconds for instant locking on suspension
  appLicenseInterval = setInterval(() => {
    if (auth.user) checkLicenseStatus()
  }, 10000)
})

onUnmounted(() => {
  if (appLicenseInterval) clearInterval(appLicenseInterval)
})

watch(() => auth.user?.school_id, () => {
  checkLicenseStatus()
})

watch(() => auth.user, (newUser) => {
  if (newUser && !localStorage.getItem('elytrack_tutorial_seen')) {
    showTutorial.value = true
  }
})

function closeSidebar() {
  sidebarOpen.value = false
}

function handleLogout() {
  auth.logout()
  closeSidebar()
  router.push('/login')
}

async function handleStopImpersonating() {
  stoppingImpersonation.value = true
  try {
    await auth.stopImpersonating()
    router.push('/schools')
  } finally {
    stoppingImpersonation.value = false
  }
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
}

function openNotification(n) {
  if (!n.read) markRead(n.id)
}

function onOutsideClick(e) {
  const bell = notifBellRef.value
  if (bell && bell.contains(e.target)) return
  if (notifPanelRef.value && notifPanelRef.value.contains(e.target)) return
  showNotifications.value = false
}

function onEsc(e) {
  if (e.key === 'Escape') {
    showNotifications.value = false
    closeSidebar()
  }
}

watch(showNotifications, (open) => {
  if (open) {
    document.addEventListener('click', onOutsideClick, true)
    document.addEventListener('keydown', onEsc)
  } else {
    document.removeEventListener('click', onOutsideClick, true)
    document.removeEventListener('keydown', onEsc)
  }
})

watch(() => router.currentRoute.value.fullPath, () => closeSidebar())

onBeforeUnmount(() => {
  document.removeEventListener('click', onOutsideClick, true)
  document.removeEventListener('keydown', onEsc)
})

function notifIcon(type) {
  return { success: '✓', error: '×', warning: '!', info: 'i' }[type] || 'i'
}
</script>
