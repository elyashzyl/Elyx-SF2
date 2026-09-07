import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'Landing', component: () => import('../views/Landing.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { role: 'admin' }
  },
  {
    path: '/teacher',
    name: 'TeacherDashboard',
    component: () => import('../views/TeacherDashboard.vue'),
    meta: { role: 'teacher' }
  },
  {
    path: '/attendance',
    name: 'AttendanceSheet',
    component: () => import('../views/AttendanceSheet.vue'),
    meta: { role: ['admin', 'teacher'] }
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: () => import('../views/UserManagement.vue'),
    meta: { role: 'admin' }
  },
  {
    path: '/students',
    name: 'StudentManagement',
    component: () => import('../views/StudentManagement.vue'),
    meta: { role: 'admin' }
  },
  {
    path: '/monthly',
    name: 'MonthlyAttendance',
    component: () => import('../views/MonthlyAttendance.vue'),
    meta: { role: ['admin', 'teacher'] }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { role: ['superadmin', 'admin', 'teacher'] }
  },
  {
    path: '/logs',
    name: 'ActivityLogs',
    component: () => import('../views/ActivityLogs.vue'),
    meta: { role: 'superadmin' }
  },
  {
    path: '/schools',
    name: 'Schools',
    component: () => import('../views/Schools.vue'),
    meta: { role: 'superadmin' }
  },
  {
    path: '/grade-levels',
    name: 'GradeLevels',
    component: () => import('../views/GradeLevels.vue'),
    meta: { role: ['superadmin', 'admin'] }
  }
]

const SCROLL_KEY = 'scroll_positions_v1'

function loadScrollMap() {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_KEY)) || {}
  } catch {
    return {}
  }
}

function saveScrollMap(map) {
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map))
  } catch {}
}

function rememberScroll(path) {
  if (typeof window === 'undefined') return
  const map = loadScrollMap()
  map[path] = window.scrollY || window.pageYOffset || 0
  saveScrollMap(map)
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Back/forward: restore what the browser remembered.
    if (savedPosition) return savedPosition
    // Initial page load (refresh / direct link): do nothing here — the app
    // restores via restoreScrollAfterLoad() once content has rendered, so a
    // refresh never flashes the previous viewport while it is still short.
    if (from === START_LOCATION) return false
    // SPA navigation: restore the last position stored for this exact URL.
    const top = typeof loadScrollMap()[to.fullPath] === 'number' ? loadScrollMap()[to.fullPath] : 0
    // Wait briefly so async-loaded tables have rendered before jumping.
    return new Promise((resolve) => {
      setTimeout(() => resolve({ top, behavior: 'instant' }), 80)
    })
  }
})

// Persist current scroll continuously (throttled via rAF) and on unload so a
// full-page refresh can bring the user back to where they were.
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  let scrollRaf = null
  function onScrollCapture() {
    if (scrollRaf) return
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = null
      const path = router.currentRoute.value?.fullPath
      if (path) rememberScroll(path)
    })
  }
  window.addEventListener('scroll', onScrollCapture, { passive: true })
  window.addEventListener('beforeunload', () => {
    const path = router.currentRoute.value?.fullPath
    if (path) rememberScroll(path)
  })
}

// Snapshot the outgoing page's position right before navigating away (fresh
// same-route entries during refresh are skipped so they don't wipe the value).
router.beforeEach((to, from) => {
  if (from.fullPath && from.fullPath !== to.fullPath) rememberScroll(from.fullPath)
})

// Best-effort scroll restore for full-page refreshes. Waits (polling) until the
// document is tall enough for the target position so we never jump into content
// that hasn't rendered yet — that polling avoids the "old data flash" on reload.
export function restoreScrollAfterLoad() {
  if (typeof window === 'undefined') return
  const path = router.currentRoute.value?.fullPath
  const want = typeof loadScrollMap()[path] === 'number' ? loadScrollMap()[path] : 0
  if (!want) return
  let tries = 0
  const attempt = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight
    if (available >= want - 1 || tries >= 16) {
      window.scrollTo(0, want)
      return
    }
    tries++
    setTimeout(attempt, 80)
  }
  attempt()
}

function homeFor(role) {
  if (role === 'superadmin') return '/schools'
  if (role === 'admin') return '/admin'
  return '/teacher'
}

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.role && !auth.user) {
    return next('/login')
  }
  if (to.meta.role) {
    const allowed = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]
    // Legacy 'admin' routes admit superadmin too
    if (allowed.includes('admin') && auth.user?.role === 'superadmin') {
      // fall through — superadmin may access admin pages
    } else if (!allowed.includes(auth.user?.role)) {
      return next(homeFor(auth.user?.role))
    }
  }
  if (to.path === '/login' && auth.user) {
    return next(homeFor(auth.user.role))
  }
  if (to.path === '/' && auth.user) {
    return next(homeFor(auth.user.role))
  }
  next()
})

export default router
