<template>
  <div id="app" :data-theme="'light'">
    <div class="bg-orb bg-orb--1"></div>
    <div class="bg-orb bg-orb--2"></div>
    <div class="bg-orb bg-orb--3"></div>
    <nav v-if="auth.user" class="top-nav">
      <div class="nav-brand">BPHS Attendance</div>
      <div class="nav-links">
        <span class="nav-user">{{ auth.user.name }} ({{ auth.user.role }})</span>
        <router-link v-if="auth.isAdmin" to="/admin">Dashboard</router-link>
        <router-link v-if="auth.isTeacher" to="/teacher">Dashboard</router-link>
        <router-link to="/attendance">Attendance</router-link>
        <router-link v-if="auth.isAdmin" to="/users">Users</router-link>
        <router-link v-if="auth.isAdmin" to="/students">Students</router-link>
        <button @click="handleLogout" class="btn-logout">Logout</button>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
