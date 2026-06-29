<template>
  <div class="management-page">
    <div class="page-header">
      <h1>User Management</h1>
      <p>Manage teachers and administrators.</p>
      <div class="page-header-actions">
        <button @click="showForm = true" class="btn-primary" v-if="!showForm">+ Add User</button>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="cancelForm">
      <div class="form-card">
        <h3>{{ editingUser ? 'Edit User' : 'Add User' }}</h3>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="form.name" required />
          </div>
          <div class="form-group">
            <label>Username</label>
            <input v-model="form.username" required />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input v-model="form.password" :required="!editingUser" type="text" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="form.role" required>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <template v-if="form.role === 'teacher'">
            <div class="form-row">
              <div class="form-group">
                <label>Advisory</label>
                <select v-model="form.grade" @change="form.section = ''">
                  <option value="">None</option>
                  <option v-for="g in grades" :key="g">{{ g }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Section</label>
                <select v-model="form.section">
                  <option value="">None</option>
                  <option v-for="s in availableSections" :key="s">{{ s }}</option>
                </select>
              </div>
            </div>
          </template>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : (editingUser ? 'Update' : 'Save') }}</button>
            <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
          </div>
          <p v-if="formError" class="error-msg">{{ formError }}</p>
        </form>
      </div>
    </div>

    <table class="data-table" v-if="users.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Role</th>
          <th>Advisory</th>
          <th>Section</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.name }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.role }}</td>
          <td>{{ u.grade || '—' }}</td>
          <td>{{ u.section || '—' }}</td>
          <td>
            <button @click="editUser(u)" class="btn-sm">Edit</button>
            <button @click="openSchedule(u)" class="btn-sm" v-if="u.role === 'teacher'">Schedule</button>
            <button @click="removeUser(u.id)" class="btn-sm btn-danger" v-if="u.role !== 'admin'">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="schedulingUser" class="modal-overlay" @click.self="cancelSchedule">
      <div class="form-card form-card--wide">
        <h3>Weekly Schedule</h3>
        <div class="schedule-grid">
          <div class="schedule-row schedule-header">
            <span class="schedule-day"></span>
            <span v-for="p in allPeriods" :key="p" class="schedule-period-label">{{ periodLabel(p) }}</span>
          </div>
          <div v-for="day in daysOfWeek" :key="day" class="schedule-row">
            <span class="schedule-day">{{ day.substring(0,3) }}</span>
            <label v-for="p in allPeriods" :key="day + p" class="schedule-cell"
                   :class="{ active: hasSchedule(day, p) }">
              <input type="checkbox" :checked="hasSchedule(day, p)" @change="toggleSchedule(day, p)" />
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button @click="saveSchedule" class="btn-primary" :disabled="savingSched">{{ savingSched ? 'Saving...' : 'Save Schedule' }}</button>
          <button @click="cancelSchedule" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <p v-else class="empty">No users found.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

const auth = useAuthStore()
const { addToast } = useToast()
const showForm = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const formError = ref('')
const users = ref([])
const form = ref({ name: '', username: '', password: '', role: 'teacher', grade: '', section: '' })
const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const sectionsByGrade = {
  'Grade 7': ['Pine', 'Molave'],
  'Grade 8': ['Cypress', 'Narra'],
  'Grade 9': ['Kamagong', 'Mahogany'],
  'Grade 10': ['Acacia', 'Yakal']
}
const allPeriods = ['am1','am2','am3','am4','am5','am6','pm1','pm2','pm3','pm4']
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const availableSections = computed(() => sectionsByGrade[form.value.grade] || [])
function periodLabel(p) {
  const labels = { am1:'AM 1', am2:'AM 2', am3:'AM 3', am4:'AM 4', am5:'AM 5', am6:'AM 6', pm1:'PM 1', pm2:'PM 2', pm3:'PM 3', pm4:'PM 4' }
  return labels[p] || p
}

const schedulingUser = ref(null)
const scheduleEntries = ref([])
const savingSched = ref(false)

async function openSchedule(u) {
  schedulingUser.value = u
  const res = await fetch('/api/schedules/' + u.id)
  scheduleEntries.value = await res.json()
}

function hasSchedule(day, period) {
  return scheduleEntries.value.some(s => s.day_of_week === day && s.period === period)
}

function toggleSchedule(day, period) {
  const idx = scheduleEntries.value.findIndex(s => s.day_of_week === day && s.period === period)
  if (idx >= 0) {
    scheduleEntries.value.splice(idx, 1)
  } else {
    scheduleEntries.value.push({ day_of_week: day, period })
  }
}

async function saveSchedule() {
  savingSched.value = true
  try {
    await fetch('/api/schedules/' + schedulingUser.value.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedules: scheduleEntries.value })
    })
    addToast('Schedule saved', 'success')
    cancelSchedule()
  } catch (e) {
    addToast('Failed to save schedule', 'error')
  } finally {
    savingSched.value = false
  }
}

function cancelSchedule() {
  schedulingUser.value = null
  scheduleEntries.value = []
}

onMounted(async () => {
  users.value = await auth.getUsers()
})

function resetForm() {
  form.value = { name: '', username: '', password: '', role: 'teacher', grade: '', section: '' }
  editingUser.value = null
  formError.value = ''
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

async function handleSave() {
  saving.value = true
  formError.value = ''
  try {
    if (editingUser.value) {
      const data = { ...form.value }
      if (!data.password) delete data.password
      await auth.updateUser(editingUser.value.id, data)
    } else {
      await auth.addUser({ ...form.value })
    }
    users.value = await auth.getUsers()
    cancelForm()
    addToast(editingUser.value ? 'User updated' : 'User added', 'success')
  } catch (e) {
    formError.value = e.message
    addToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

function editUser(u) {
  editingUser.value = u
  form.value = { name: u.name, username: u.username, password: '', role: u.role, grade: u.grade || '', section: u.section || '' }
  showForm.value = true
}

async function removeUser(id) {
  await auth.deleteUser(id)
  users.value = await auth.getUsers()
  addToast('User deleted', 'success')
}
</script>
