import { createRouter, createWebHistory } from 'vue-router'
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

const router = createRouter({
  history: createWebHistory(),
  routes
})

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
