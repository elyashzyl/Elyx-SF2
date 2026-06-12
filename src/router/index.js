import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/login' },
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
    path: '/schedule',
    name: 'Schedule',
    component: () => import('../views/Schedule.vue'),
    meta: { role: ['admin', 'teacher'] }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.role && !auth.user) {
    return next('/login')
  }
  if (to.meta.role === 'admin' && auth.user?.role !== 'admin') {
    return next('/teacher')
  }
  if (to.meta.role === 'teacher' && auth.user?.role !== 'teacher') {
    return next('/admin')
  }
  if (to.path === '/login' && auth.user) {
    return next(auth.user.role === 'admin' ? '/admin' : '/teacher')
  }
  next()
})

export default router
