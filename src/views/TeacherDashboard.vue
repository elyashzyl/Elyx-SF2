<template>
  <div class="dashboard">
    <h1>Teacher Dashboard</h1>
    <p>Welcome, {{ auth.user.name }}</p>
    <div class="dash-cards">
      <router-link to="/attendance" class="dash-card">
        <h3>Take Attendance</h3>
        <p>Record daily attendance for your class</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>
