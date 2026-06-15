<template>
  <div id="app" :data-theme="theme">
    <div class="bg-orb bg-orb--1"></div>
    <div class="bg-orb bg-orb--2"></div>
    <div class="bg-orb bg-orb--3"></div>

    <nav v-if="auth.user" class="top-nav">
      <div class="top-nav-brand">BPHS Attendance</div>
      <div class="top-nav-spacer"></div>
      <button @click="toggleTheme" class="top-nav-btn" :title="theme === 'light' ? 'Dark mode' : 'Light mode'">
        {{ theme === 'light' ? '\u263E' : '\u2600' }}
      </button>
      <button @click="showNotifications = !showNotifications" class="top-nav-btn" title="Notifications">
        &#x1F514;
      </button>
      <button class="top-nav-btn" title="Profile Settings">&#x2699;</button>
      <button @click="handleLogout" class="top-nav-btn top-nav-logout">Logout</button>
    </nav>

    <div v-if="auth.user" class="app-body">
      <aside class="sidebar">
        <div class="sidebar-links">
          <router-link v-if="auth.isAdmin" to="/admin">Dashboard</router-link>
          <router-link v-if="auth.isTeacher" to="/teacher">Dashboard</router-link>
          <router-link to="/attendance">Attendance</router-link>
          <router-link to="/monthly">Monthly</router-link>
          <router-link to="/schedule">Schedule</router-link>
          <router-link v-if="auth.isAdmin" to="/users">Users</router-link>
          <router-link v-if="auth.isAdmin" to="/students">Students</router-link>
        </div>
      </aside>
      <main class="main-with-sidebar">
        <router-view />
      </main>
    </div>
    <main v-else class="main-full">
      <router-view />
    </main>

    <div v-if="showNotifications" class="notif-panel">
      <div class="notif-header">Notifications</div>
      <div class="notif-empty">No notifications yet.</div>
    </div>

    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', 'toast--' + t.type]">
        {{ t.message }}
        <button @click="removeToast(t.id)" class="toast-close">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from './composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const { toasts, removeToast } = useToast()
const showNotifications = ref(false)

const theme = ref(localStorage.getItem('theme') || 'light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>