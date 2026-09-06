<template>
  <div class="management-page">
    <div class="page-header">
      <div>
        <h1>User Management</h1>
        <p>Manage teachers, advisers, and system administrator accounts.</p>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="cancelForm">
      <div class="form-card">
        <h3>{{ editingUser ? 'Edit User Account' : 'Add New User Account' }}</h3>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="form.name" required placeholder="e.g. Maria Santos" />
          </div>
          <div class="form-group">
            <label>Username</label>
            <input v-model="form.username" required placeholder="e.g. msantos" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input v-model="form.password" :required="!editingUser" type="text" :placeholder="editingUser ? 'Leave blank to keep unchanged' : 'Enter password'" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select v-model="form.role" required>
              <option v-if="auth.isSuperadmin" value="superadmin">Superadmin</option>
              <option value="admin">Administrator</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div class="form-group" v-if="auth.isSuperadmin && form.role !== 'superadmin'">
            <label>School</label>
            <select v-model="form.schoolId" required>
              <option value="" disabled>Select school</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}</option>
            </select>
          </div>
          <template v-if="form.role === 'teacher'">
            <p v-if="targetSchoolId && !grades.length" class="error-msg">This school has no grade levels yet. Define them in the Grades & Sections page first.</p>
            <div class="form-row">
              <div class="form-group">
                <label>Advisory Grade</label>
                <select v-model="form.grade" @change="form.section = ''">
                  <option value="">None</option>
                  <option v-for="g in grades" :key="g">{{ g }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Advisory Section</label>
                <select v-model="form.section">
                  <option value="">None</option>
                  <option v-for="s in availableSections" :key="s">{{ s }}</option>
                </select>
              </div>
            </div>
          </template>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner" style="margin-right: 6px;"></span>
              {{ saving ? 'Saving...' : (editingUser ? 'Update Account' : 'Save Account') }}
            </button>
            <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
          </div>
          <p v-if="formError" class="error-msg">{{ formError }}</p>
        </form>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <span class="show-wrap">Show
            <select v-model="pageSize" @change="onPageSizeChange" class="show-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </span>
          <button @click="showForm = true" class="btn-primary" v-if="!showForm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add User
          </button>
        </div>
        <div class="table-toolbar-right">
          <span class="tbl-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input v-model="userSearch" @input="currentPage = 1" type="text" placeholder="Search user" />
          </span>
          <select v-if="auth.isSuperadmin" v-model="filterSchoolId" @change="currentPage = 1; loadUsers()" class="tbl-filter">
            <option value="">All Schools</option>
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>
      <div style="overflow-x: auto;">
      <table class="data-table" v-if="filteredUsers.length">
        <thead>
          <tr>
            <th class="cell-id">ID</th>
            <th>User</th>
            <th>Role</th>
            <th v-if="auth.isSuperadmin">School</th>
            <th>Advisory</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in pagedUsers" :key="u.id">
            <td class="cell-id">#{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>
              <div class="cell-person">
                <span class="cell-avatar">{{ (u.name || '?').charAt(0).toUpperCase() }}</span>
                <div style="min-width: 0;">
                  <div class="cell-main">{{ u.name }}</div>
                  <div class="cell-sub">@{{ u.username }}</div>
                </div>
              </div>
            </td>
            <td>
              <span :class="['pill', u.role === 'superadmin' ? 'pill--amber' : u.role === 'admin' ? 'pill--blue' : 'pill--green']">{{ u.role === 'superadmin' ? 'Superadmin' : u.role === 'admin' ? 'Administrator' : 'Teacher' }}</span>
            </td>
            <td v-if="auth.isSuperadmin">{{ schoolNameOf(u) }}</td>
            <td>{{ u.grade ? (u.grade + (u.section ? ' - ' + u.section : '')) : '—' }}</td>
            <td style="text-align: right;">
              <div class="row-actions">
                <button @click="editUser(u)" class="icon-btn" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button @click="impersonateUser(u)" class="icon-btn" title="Impersonate" v-if="auth.isSuperadmin && u.id !== auth.user?.id && u.role !== 'superadmin'" :disabled="impersonatingId === u.id">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button @click="removeUser(u.id)" class="icon-btn icon-btn--danger" title="Delete" v-if="u.id !== auth.user?.id">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <p v-if="!filteredUsers.length" class="empty">No users found.</p>
      <div class="table-footer" v-if="filteredUsers.length">
        <span class="table-count">Showing {{ showingFrom }} to {{ showingTo }} of {{ filteredUsers.length }} entries</span>
        <div class="pager">
          <button class="pager-btn" @click="prevPage" :disabled="currentPage === 1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Previous
          </button>
          <button v-for="p in pageNumbers" :key="p" class="pager-num" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
          <span v-if="totalPages > pageNumbers[pageNumbers.length - 1]" class="pager-dots">…</span>
          <button class="pager-btn" @click="nextPage" :disabled="currentPage === totalPages">
            Next
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useGradeLevels } from '../composables/useGradeLevels'
import { useActiveSchool } from '../composables/useActiveSchool'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const { addToast } = useToast()
const showForm = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const formError = ref('')
const users = ref([])
const schools = ref([])
const filterSchoolId = ref('')
const impersonatingId = ref(null)
const userSearch = ref('')
const pageSize = ref(10)
const currentPage = ref(1)
const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u => (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)))
const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})
const showingFrom = computed(() => (filteredUsers.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const showingTo = computed(() => Math.min(filteredUsers.value.length, currentPage.value * pageSize.value))
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 4) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 2) return [1, 2, 3]
  if (cur >= total - 1) return [total - 2, total - 1, total]
  return [cur - 1, cur, cur + 1]
})
function goToPage(p) { currentPage.value = p }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function onPageSizeChange() { currentPage.value = 1 }
const form = ref({ name: '', username: '', password: '', role: 'teacher', grade: '', section: '', schoolId: '' })
const { grades, sectionsByGrade, loadGradeLevels } = useGradeLevels()
const { activeSchool } = useActiveSchool()
const activeSchoolId = computed(() => activeSchool.value?.id || '')
// Advisory options follow the target school: superadmin's picked school, else own school
const targetSchoolId = computed(() => auth.isSuperadmin ? (form.value.schoolId || '') : (auth.schoolId || ''))
const availableSections = computed(() => sectionsByGrade.value[form.value.grade] || [])

watch(targetSchoolId, async (sid) => {
  if (!sid) return
  await loadGradeLevels(sid)
  if (form.value.grade && !grades.value.includes(form.value.grade)) {
    form.value.grade = ''
    form.value.section = ''
  }
})

onMounted(async () => {
  if (auth.isSuperadmin) {
    schools.value = await auth.getSchools()
    filterSchoolId.value = activeSchoolId.value
  }
  await loadGradeLevels(targetSchoolId.value || undefined)
  await loadUsers()
})

async function loadUsers() {
  users.value = await auth.getUsers(auth.isSuperadmin ? (filterSchoolId.value || undefined) : undefined)
  if (currentPage.value > totalPages.value) currentPage.value = 1
}

function schoolNameOf(u) {
  if (!u.school_id) return u.role === 'superadmin' ? 'All schools' : '—'
  const s = schools.value.find(x => x.id === u.school_id)
  return s ? s.name : u.school_id
}

function resetForm() {
  form.value = { name: '', username: '', password: '', role: 'teacher', grade: '', section: '', schoolId: auth.isSuperadmin ? (activeSchoolId.value || '') : (auth.schoolId || '') }
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
    await loadUsers()
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
  form.value = { name: u.name, username: u.username, password: '', role: u.role, grade: u.grade || '', section: u.section || '', schoolId: u.school_id || '' }
  showForm.value = true
}

async function removeUser(id) {
  if (!confirm('Delete this user?')) return
  try {
    await auth.deleteUser(id)
    await loadUsers()
    addToast('User deleted', 'success')
  } catch (e) {
    addToast(e.message, 'error')
  }
}

async function impersonateUser(u) {
  if (!confirm(`Sign in as ${u.name} (${u.username})? You will see exactly what they see. Use Stop Impersonating in the top bar to return.`)) return
  impersonatingId.value = u.id
  try {
    const session = await auth.impersonate(u.id)
    addToast(`Now signed in as ${session.name}`, 'success')
    router.push(session.role === 'admin' ? '/admin' : session.role === 'teacher' ? '/teacher' : '/schools')
  } catch (e) {
    addToast(e.message, 'error')
  } finally {
    impersonatingId.value = null
  }
}
</script>
