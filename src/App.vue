<template>
  <div id="app" :data-theme="theme" :style="{ '--header-height': `${headerHeight}px` }">
    <header ref="headerRef" class="app-header" v-if="auth.user">
      <nav class="top-nav">
        <button
          class="mobile-menu-btn"
          type="button"
          :aria-label="sidebarOpen ? 'Close navigation' : 'Open navigation'"
          :aria-expanded="sidebarOpen"
          aria-controls="app-sidebar"
          @click="sidebarOpen = !sidebarOpen"
        >
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
          <img v-if="auth.school?.logo_url" :src="auth.school.logo_url" alt="" class="top-nav-school-logo" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
          <span v-else class="top-nav-school-dot"></span>
          <span class="top-nav-school-copy">
            <small>Active school</small>
            <strong>{{ pillName }}</strong>
          </span>
        </div>

        <div class="top-nav-actions">
          <button
            type="button"
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
            type="button"
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
            type="button"
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

          <button type="button" @click="handleLogout" class="top-nav-logout" title="Sign out" aria-label="Sign out">
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
        <button type="button" @click="handleStopImpersonating" class="impersonate-stop" :disabled="stoppingImpersonation">
          {{ stoppingImpersonation ? 'Returning…' : 'Return to superadmin' }}
        </button>
      </div>

      <!-- License Lock Banner for Admins -->
      <div v-if="licenseLocked && auth.isAdmin" class="license-lock-banner">
        <span class="license-lock-copy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Your school's ElyTrack license is currently <strong>{{ licenseStatus.toUpperCase() }}</strong>. Operational modules are locked.</span>
        </span>
        <router-link to="/licenses" class="lock-action-btn">Manage License &amp; Renew →</router-link>
      </div>
    </header>

    <!-- Teacher Lockout Screen -->
    <div v-if="licenseLocked && auth.isTeacher" class="license-teacher-lockout">
      <div class="lockout-card">
        <img src="/elytrack-logo.png" alt="ElyTrack" class="lockout-logo" />
        <h2>School Workspace Locked</h2>
        <p>Your school's ElyTrack subscription is currently <strong>{{ licenseStatus.toUpperCase() }}</strong>.</p>
        <p class="lockout-sub">Attendance recording and SF2 reporting are locked until your school administrator renews the active campus license.</p>
        <button type="button" @click="handleLogout" class="btn btn-secondary lockout-signout">Sign out</button>
      </div>
    </div>

    <div v-if="auth.user" class="app-body">
      <aside id="app-sidebar" class="sidebar" :class="{ 'is-open': sidebarOpen }">
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
            <router-link v-if="auth.isAdmin" to="/reports" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </span>
              <span>Reports & Analytics</span>
            </router-link>
            <router-link to="/schedule" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <span>Schedule & Calendar</span>
            </router-link>
            <router-link to="/grading" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span>Academic Grading (SF9)</span>
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
              <router-link to="/quarterly" @click="closeSidebar">
                <span class="nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <span>Quarterly terms</span>
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

          <div class="sidebar-section-title">Support</div>
          <div class="sidebar-links">
            <router-link to="/inquiries" @click="closeSidebar">
              <span class="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 9h8M8 13h5" />
                </svg>
              </span>
              <span>Helpdesk &amp; Inquiries</span>
            </router-link>
          </div>

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
              <div class="sidebar-profile-avatar">
                <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url" alt="Profile avatar" />
                <span v-else>{{ (auth.user?.name || 'U').charAt(0).toUpperCase() }}</span>
              </div>
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
          <button type="button" v-if="unreadCount" @click="handleMarkAllRead" class="notif-action-btn">Mark read</button>
          <button type="button" @click="clearAll" class="notif-action-btn notif-action--clear">Clear</button>
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
          <button type="button" @click.stop="dismiss(n.id)" class="notif-item-close" title="Dismiss">&times;</button>
        </div>
      </div>
      <div v-else class="notif-empty">
        <span class="notif-empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
        <strong>You're all caught up</strong>
        <span>No notifications yet.</span>
      </div>
    </div>

    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', 'toast--' + t.type]">
        <span>{{ t.message }}</span>
        <button type="button" @click="removeToast(t.id)" class="toast-close">&times;</button>
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
const { notifications, unreadCount, syncAnnouncements, markRead, markAllRead, dismiss, clearAll, formatTimeAgo } = useNotifications()
const { theme, toggleTheme } = useTheme()
const { hasActive, displayName, displayShort, displayAvatar, noneSelected } = useActiveSchool()

const sidebarOpen = ref(false)
const showNotifications = ref(false)
const notifPanelRef = ref(null)
const notifBellRef = ref(null)
const headerRef = ref(null)
const headerHeight = ref(70)
let headerResizeObserver = null

function updateHeaderHeight() {
  if (headerRef.value) {
    const rect = headerRef.value.getBoundingClientRect()
    if (rect.height > 0) {
      headerHeight.value = Math.round(rect.height)
    }
  }
}
const stoppingImpersonation = ref(false)
const school = reactive({ school_name: '', school_id: '', school_address: '', school_short: '' })

const showTutorial = ref(false)
const tutorialSeenKey = computed(() => `elytrack_tutorial_seen:${auth.user?.id || auth.user?.username || 'guest'}`)

function maybeShowTutorial() {
  if (auth.user && !localStorage.getItem(tutorialSeenKey.value)) {
    showTutorial.value = true
  }
}

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
  Grading: 'Academic Grading (SF9)',
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
  updateHeaderHeight()
  if (headerRef.value && typeof ResizeObserver !== 'undefined') {
    headerResizeObserver = new ResizeObserver(() => {
      updateHeaderHeight()
    })
    headerResizeObserver.observe(headerRef.value)
  }
  loadSchool()
  checkLicenseStatus()
  restoreScrollAfterLoad()

  // Auto-launch the walkthrough once for each authenticated user.
  maybeShowTutorial()
  if (auth.user) {
    syncAnnouncements(auth.actorHeaders())
  }

  // Realtime license validation check every 10 seconds for instant locking on suspension
  appLicenseInterval = setInterval(() => {
    if (auth.user) checkLicenseStatus()
  }, 10000)
})

onUnmounted(() => {
  if (headerResizeObserver) {
    headerResizeObserver.disconnect()
    headerResizeObserver = null
  }
  if (appLicenseInterval) clearInterval(appLicenseInterval)
})

watch(() => [auth.isImpersonating, licenseLocked.value, auth.user], () => {
  setTimeout(updateHeaderHeight, 50)
})

watch(() => auth.user?.school_id, () => {
  checkLicenseStatus()
})

watch(() => auth.user, (newUser) => {
  if (newUser) maybeShowTutorial()
})

function closeSidebar() {
  sidebarOpen.value = false
}

async function handleLogout() {
  await auth.logout()
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
  if (showNotifications.value && auth.user) {
    syncAnnouncements(auth.actorHeaders())
  }
}

function openNotification(n) {
  if (!n.read) markRead(n.id, auth.actorHeaders())
}

function handleMarkAllRead() {
  markAllRead(auth.actorHeaders())
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

<style scoped>
/* Authenticated shell refinements: keep the shared chrome compact and theme-aware. */
.app-header {
  isolation: isolate;
}

.top-nav {
  min-width: 0;
  width: 100%;
  box-shadow: var(--shadow-xs);
}

.top-nav-brand,
.top-nav-context,
.top-nav-school,
.top-nav-actions,
.top-nav-brand-copy,
.top-nav-school-copy {
  min-width: 0;
}

.top-nav-brand-copy strong {
  max-width: 15ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-nav-context {
  flex: 0 1 220px;
}

.top-nav-spacer {
  min-width: 0;
}

.top-nav-school {
  flex: 0 1 240px;
}

.top-nav-school-copy strong {
  min-width: 0;
}

.top-nav-btn,
.top-nav-logout,
.mobile-menu-btn {
  border-color: var(--border);
  background: var(--card);
  color: var(--muted-foreground);
}

.mobile-menu-btn {
  transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease;
}

.mobile-menu-btn:hover,
.mobile-menu-btn[aria-expanded='true'] {
  border-color: var(--primary);
  background: var(--secondary);
  color: var(--primary);
}

.top-nav-actions {
  gap: 6px;
}

.notification-btn.has-notifications::after {
  background: var(--primary);
}

.notif-badge {
  border-color: var(--card);
  background: var(--primary);
  color: var(--primary-foreground);
}

.impersonate-banner,
.license-lock-banner {
  flex-wrap: wrap;
  min-width: 0;
  overflow-wrap: anywhere;
}

.impersonate-banner > span:not(.impersonate-banner-icon) {
  min-width: 0;
  flex: 1 1 240px;
}

.impersonate-stop {
  flex: 0 0 auto;
  border-color: color-mix(in srgb, var(--warning) 45%, var(--border));
  color: var(--foreground);
}

.impersonate-stop:hover {
  background: var(--warning);
  color: var(--primary-foreground);
}

.license-lock-banner {
  align-items: flex-start;
}

.license-lock-copy {
  min-width: 0;
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1 1 360px;
  line-height: 1.45;
}

.license-lock-copy > span {
  min-width: 0;
}

.lock-action-btn {
  flex: 0 0 auto;
  border: 1px solid var(--destructive);
  background: var(--destructive);
  color: var(--destructive-foreground);
  transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease;
}

.lock-action-btn:hover {
  opacity: 1;
  border-color: var(--destructive-hover);
  background: var(--destructive-hover);
  color: var(--destructive-foreground);
  transform: translateY(-1px);
}

.sidebar {
  min-height: 0;
}

.sidebar-scroll {
  min-height: 0;
  overscroll-behavior: contain;
}

.sidebar-links a > span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-links a.router-link-active,
.sidebar-profile-btn.router-link-active {
  border-color: var(--sidebar-border);
}

.sidebar-profile-avatar {
  border-color: var(--sidebar-border);
  background: var(--sidebar-accent);
}

.sidebar-profile-avatar-wrap .sidebar-status-dot {
  background: var(--success);
}

.sidebar-logout-btn:hover {
  background: var(--red-bg);
  border-color: color-mix(in srgb, var(--destructive) 30%, transparent);
  color: var(--destructive);
}

.main-with-sidebar {
  min-width: 0;
}

.notif-panel {
  top: calc(var(--header-height, 70px) + 9px);
  right: clamp(12px, 2vw, 24px);
  max-height: calc(100vh - var(--header-height, 70px) - 18px);
}

.notif-list {
  max-height: min(370px, calc(100vh - var(--header-height, 70px) - 110px));
}

.lockout-signout {
  margin-top: 10px;
}

.license-teacher-lockout {
  overflow-y: auto;
}

.lockout-card {
  min-width: 0;
  max-height: calc(100% - 32px);
  overflow-y: auto;
}

.top-nav-btn:focus-visible,
.top-nav-logout:focus-visible,
.mobile-menu-btn:focus-visible,
.impersonate-stop:focus-visible,
.lock-action-btn:focus-visible,
.sidebar-links a:focus-visible,
.sidebar-profile-btn:focus-visible,
.sidebar-logout-btn:focus-visible,
.notif-action-btn:focus-visible,
.notif-item-close:focus-visible,
.toast-close:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

@media (max-width: 820px) {
  .top-nav {
    gap: 10px;
    padding-inline: 18px;
  }

  .top-nav-brand-copy {
    overflow: hidden;
  }

  .top-nav-btn,
  .top-nav-logout,
  .mobile-menu-btn {
    width: 35px;
    height: 35px;
  }

  .top-nav-logout {
    min-height: 35px;
  }

  .sidebar {
    max-width: calc(100vw - 24px);
  }
}

@media (max-width: 600px) {
  .top-nav {
    gap: 6px;
    padding-inline: 12px;
  }

  .top-nav-brand {
    gap: 7px;
  }

  .top-nav-brand-img {
    width: 31px;
    height: 31px;
  }

  .top-nav-brand-copy strong {
    max-width: 11ch;
    font-size: .78rem;
  }

  .top-nav-actions {
    gap: 4px;
  }

  .top-nav-btn,
  .top-nav-logout,
  .mobile-menu-btn {
    width: 34px;
    height: 34px;
  }

  .top-nav-logout {
    min-height: 34px;
  }

  .impersonate-banner,
  .license-lock-banner {
    justify-content: flex-start;
    padding-inline: 12px;
    text-align: left;
  }

  .license-lock-copy {
    flex-basis: 100%;
  }

  .lock-action-btn {
    align-self: flex-start;
  }

  .notif-panel {
    top: calc(var(--header-height, 70px) + 9px);
    right: 12px;
    width: min(350px, calc(100vw - 24px));
    max-width: calc(100vw - 24px);
  }
}
</style>
