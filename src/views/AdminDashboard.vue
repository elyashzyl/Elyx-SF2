<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {{ auth.user.name }}. Overview of the school's attendance system.</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-students">S</div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.students }}</span>
          <span class="stat-label">Total Students</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-teachers">T</div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.teachers }}</span>
          <span class="stat-label">Teachers</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-records">R</div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.records }}</span>
          <span class="stat-label">Attendance Records</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-entries">E</div>
        <div class="stat-body">
          <span class="stat-value">{{ stats.entries }}</span>
          <span class="stat-label">Total Entries</span>
        </div>
      </div>
    </div>
    <div class="dash-cards">
      <router-link to="/attendance" class="dash-card">
        <h3>Attendance Records</h3>
        <p>View and manage daily attendance</p>
      </router-link>
      <router-link to="/schedule" class="dash-card">
        <h3>Schedule</h3>
        <p>Manage teacher schedules and school calendar</p>
      </router-link>
      <router-link to="/users" class="dash-card">
        <h3>User Management</h3>
        <p>Manage teachers and admin accounts</p>
      </router-link>
      <router-link to="/students" class="dash-card">
        <h3>Student Management</h3>
        <p>Add, edit, or remove students</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const stats = ref({ students: 0, teachers: 0, records: 0, entries: 0 })

onMounted(async () => {
  try {
    const res = await fetch('/api/dashboard/stats')
    stats.value = await res.json()
  } catch {}
})
</script>