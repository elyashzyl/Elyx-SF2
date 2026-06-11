<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>BPHS</h1>
        <h2>Attendance Checker</h2>
        <p>Bacoor Parañaque High School</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Username</label>
          <input v-model="username" type="text" required autocomplete="username" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" required autocomplete="current-password" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? 'Logging in...' : 'Login' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const success = await auth.login(username.value, password.value)
    if (success) {
      const path = auth.user.role === 'admin' ? '/admin' : '/teacher'
      router.push(path)
    } else {
      error.value = 'Invalid username or password'
    }
  } catch {
    error.value = 'Connection error — is the server running?'
  } finally {
    loading.value = false
  }
}
</script>
