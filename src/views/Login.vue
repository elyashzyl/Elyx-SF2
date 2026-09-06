<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-brand-badge">E</div>
        <h1>Elyx Studio</h1>
        <h2>Monthly Attendance Checker</h2>
        <p>{{ school.school_name }}</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="Enter your username"
            autocomplete="username"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn-primary login-submit" :disabled="loading">
          <span v-if="loading" class="spinner" style="margin-right: 6px;"></span>
          {{ loading ? 'Signing in...' : 'Sign in to Account' }}
        </button>
      </form>
      <div class="login-footer">
        <span>Elyx Studio v1.0</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const school = reactive({
  school_name: '',
  school_id: '',
  school_address: '',
  school_short: ''
})

onMounted(async () => {
  try {
    const res = await fetch('/api/settings/school')
    const data = await res.json()
    Object.assign(school, data)
  } catch (e) {
    // Silently handle error
  }
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const success = await auth.login(username.value, password.value)
    if (success) {
      const role = auth.user?.role
      if (role === 'superadmin') router.push('/schools')
      else if (role === 'admin') router.push('/admin')
      else router.push('/teacher')
    } else {
      error.value = 'Invalid username or password'
    }
  } catch (e) {
    error.value = e.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
