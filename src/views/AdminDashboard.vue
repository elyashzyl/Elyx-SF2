<template>
  <div class="dashboard">
    <h1>Admin Dashboard</h1>
    <p>Welcome, {{ auth.user.name }}</p>
    <div class="dash-cards">
      <router-link to="/attendance" class="dash-card">
        <h3>Attendance Records</h3>
        <p>View and manage daily attendance</p>
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
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>
