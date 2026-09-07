<template>
  <div id="app" :data-theme="theme">
    <div v-if="auth.user" class="bg-orb bg-orb--1"></div>
    <div v-if="auth.user" class="bg-orb bg-orb--2"></div>
    <div v-if="auth.user" class="bg-orb bg-orb--3"></div>

    <nav v-if="auth.user" class="top-nav">
      <div class="top-nav-brand">
        <span class="top-nav-brand-icon">{{ (brandShort || 'A').charAt(0) }}</span>
        <span>{{ brandShort || 'School' }} Attendance</span>
      </div>
      <div class="top-nav-spacer"></div>
      
      <div class="top-nav-actions">
        <div class="top-nav-user-pill">
          <span class="top-nav-avatar">{{ pillAvatar }}</span>
          <span>{{ pillName }}</span>
        </div>

        <button @click="toggleTheme()" class="top-nav-btn" :title="theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'">
          <svg v-if="theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
          </svg>
        </button>

        <button @click="toggleNotifications" class="top-nav-btn" :class="{ 'has-notifications': unreadCount > 0 }" title="Notifications" ref="notifBellRef">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
        </button>

        <button @click="handleLogout" class="top-nav-logout" title="Sign out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </nav>

    <div v-if="auth.isImpersonating" class="impersonate-banner">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
      </svg>
      <span>Viewing as <strong>{{ auth.user.name }}</strong> ({{ auth.user.role }}) — started by {{ auth.impersonatedBy?.name }}</span>
      <button @click="handleStopImpersonating" class="impersonate-stop" :disabled="stoppingImpersonation">
        {{ stoppingImpersonation ? 'Returning…' : 'Stop Impersonating' }}
      </button>
    </div>

    <div v-if="auth.user" class="app-body">
      <aside class="sidebar">
        <!-- User Profile -->
        <div class="sidebar-profile">
          <div class="sidebar-profile-avatar">
            {{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}
          </div>
          <div class="sidebar-profile-info">
            <span class="sidebar-profile-name">{{ auth.user?.name || 'User' }}</span>
            <span class="sidebar-profile-role">{{ auth.user?.role || 'role' }}</span>
          </div>
        </div>

        <!-- Pages Section -->
        <div class="sidebar-section-title">Pages</div>
        <div class="sidebar-links">
          <router-link v-if="auth.isAdmin" to="/admin">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
              </svg>
            </span>
            <span>Dashboard</span>
          </router-link>

          <router-link v-if="auth.isTeacher" to="/teacher">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
              </svg>
            </span>
            <span>Dashboard</span>
          </router-link>

          <router-link to="/monthly">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/>
              </svg>
            </span>
            <span>Monthly Record</span>
          </router-link>

          <router-link to="/settings">
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M4.22 4.22l2.83 2.83"/><path d="M16.95 16.95l2.83 2.83"/><path d="M1 12h4"/><path d="M19 12h4"/><path d="m4.22 19.78 2.83-2.83"/><path d="m16.95 7.05 2.83-2.83"/>
              </svg>
            </span>
            <span>Settings</span>
          </router-link>
        </div>

        <!-- Administration Section -->
        <template v-if="auth.isAdmin">
          <div class="sidebar-section-title">Administration</div>
          <div class="sidebar-links">
            <router-link v-if="auth.isSuperadmin" to="/schools">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m2 7 10-5 10 5-10 5L2 7Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>
                </svg>
              </span>
              <span>Schools</span>
            </router-link>

            <router-link to="/users">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </span>
              <span>User Management</span>
            </router-link>

            <router-link to="/students">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/>
                </svg>
              </span>
              <span>Students</span>
            </router-link>

            <router-link to="/grade-levels">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>
                </svg>
              </span>
              <span>Grades & Sections</span>
            </router-link>

            <router-link v-if="auth.isSuperadmin" to="/logs">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
                </svg>
              </span>
              <span>Activity Logs</span>
            </router-link>
          </div>
        </template>
      </aside>
      <main class="main-with-sidebar">
        <router-view />
      </main>
    </div>
    <main v-else class="main-full">
      <router-view />
    </main>

    <div v-if="showNotifications" class="notif-panel" ref="notifPanelRef">
      <div class="notif-header">
        <span class="notif-title">Notifications</span>
        <div v-if="notifications.length" class="notif-header-actions">
          <button v-if="unreadCount" @click="markAllRead" class="notif-action-btn" title="Mark all as read">Mark all read</button>
          <button @click="clearAll" class="notif-action-btn notif-action--clear" title="Clear all">Clear all</button>
        </div>
      </div>

      <div v-if="notifications.length" class="notif-list">
        <div v-for="n in notifications" :key="n.id"
             :class="['notif-item', 'notif-item--' + n.type, { unread: !n.read }]"
             @click="openNotification(n)">
          <span class="notif-item-icon" :class="'icon--' + n.type">{{ notifIcon(n.type) }}</span>
          <div class="notif-item-body">
            <span class="notif-item-message">{{ n.message }}</span>
            <span class="notif-item-time">{{ formatTimeAgo(n.ts) }}</span>
          </div>
          <button @click.stop="dismiss(n.id)" class="notif-item-close" title="Dismiss">&times;</button>
        </div>
      </div>
      <div v-else class="notif-empty">No notifications yet.</div>
    </div>

    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', 'toast--' + t.type]">
        <span>{{ t.message }}</span>
        <button @click="removeToast(t.id)" class="toast-close">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from './composables/useToast'
import { useNotifications } from './composables/useNotifications'
import { useTheme } from './composables/useTheme'
import { useActiveSchool } from './composables/useActiveSchool'
import { restoreScrollAfterLoad } from './router'
import { watch, onBeforeUnmount } from 'vue'

const auth = useAuthStore()
const router = useRouter()
const { toasts, removeToast } = useToast()
const { notifications, unreadCount, notify, markRead, markAllRead, dismiss, clearAll, formatTimeAgo } = useNotifications()
const { theme, toggleTheme } = useTheme()
const { hasActive, displayName, displayShort, displayAvatar, noneSelected } = useActiveSchool()
const showNotifications = ref(false)
const notifPanelRef = ref(null)
const notifBellRef = ref(null)
const stoppingImpersonation = ref(false)
const school = reactive({ school_name: '', school_id: '', school_address: '', school_short: '' })

const noSchoolContext = computed(() => noneSelected.value && auth.isSuperadmin)
const ownSchool = computed(() => (auth.user?.school && auth.user.school.school_id ? auth.user.school : null) || null)
const brandShort = computed(() => {
  if (noSchoolContext.value) return ''
  if (hasActive.value) return displayShort.value
  if (ownSchool.value) return ownSchool.value.short || ownSchool.value.school_short || ''
  return school.school_short || ''
})
const pillAvatar = computed(() => {
  if (noSchoolContext.value) return (auth.user?.name || 'U').charAt(0).toUpperCase()
  if (hasActive.value) return displayAvatar.value
  if (ownSchool.value) return (ownSchool.value.short || ownSchool.value.school_short || ownSchool.value.name || ownSchool.value.school_name || 'S').charAt(0).toUpperCase()
  return (auth.user?.name || 'U').charAt(0).toUpperCase()
})
const pillName = computed(() => {
  if (noSchoolContext.value) return auth.user?.name || 'User'
  if (hasActive.value) return displayName.value || 'School'
  if (ownSchool.value) return ownSchool.value.name || ownSchool.value.school_name || 'School'
  return auth.user?.name || 'User'
})

async function loadSchool() {
  if (noSchoolContext.value) {
    school.school_name = ''
    school.school_id = ''
    school.school_address = ''
    school.school_short = ''
    return
  }
  // Teachers/admins carry their school on the login payload; use it as the
  // source of truth so the brand/pill never fall back to a missing fetch.
  if (ownSchool.value) {
    school.school_name = ownSchool.value.name || ownSchool.value.school_name || ''
    school.school_id = ownSchool.value.school_id || ''
    school.school_short = ownSchool.value.short || ownSchool.value.school_short || ''
    school.school_address = ownSchool.value.address || ownSchool.value.school_address || ''
    return
  }
  try {
    const params = new URLSearchParams({
      userId: auth.user?.id || '',
      userRole: auth.user?.role || ''
    })
    const res = await fetch(`/api/settings/school?${params}`)
    const data = await res.json()
    Object.assign(school, data)
  } catch {}
}

onMounted(() => {
  loadSchool()
  restoreScrollAfterLoad()
})

function handleLogout() {
  auth.logout()
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
  if (bell && bell.contains(e.target)) return   // bell toggles on its own click
  if (notifPanelRef.value && notifPanelRef.value.contains(e.target)) return
  showNotifications.value = false
}

function onEsc(e) {
  if (e.key === 'Escape') showNotifications.value = false
}

watch(showNotifications, (open) => {
  if (open) {
    markAllRead()
    document.addEventListener('click', onOutsideClick, true)
    document.addEventListener('keydown', onEsc)
  } else {
    document.removeEventListener('click', onOutsideClick, true)
    document.removeEventListener('keydown', onEsc)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onOutsideClick, true)
  document.removeEventListener('keydown', onEsc)
})

function notifIcon(type) {
  return { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }[type] || 'ℹ'
}
</script>