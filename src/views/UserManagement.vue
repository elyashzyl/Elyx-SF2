<template>
  <div class="management-page">
    <div class="page-header">
      <div>
        <h1>User Management</h1>
        <p>Manage teachers, advisers, and system administrator accounts.</p>
      </div>
    </div>

    <!-- User Presence KPI Summary Row -->
    <div class="user-kpi-grid">
      <div 
        class="user-kpi-card" 
        :class="{ 'user-kpi-card--active': filterPresence === '' && !filterStatus }" 
        @click="filterPresence = ''; filterStatus = ''"
        role="button"
        tabindex="0"
      >
        <div class="user-kpi-icon icon--total">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div class="user-kpi-info">
          <span class="user-kpi-val">{{ users.length }}</span>
          <span class="user-kpi-lbl">Total Accounts</span>
        </div>
      </div>

      <div 
        class="user-kpi-card user-kpi-card--clickable" 
        :class="{ 'user-kpi-card--active': filterPresence === 'online' }" 
        @click="filterPresence = filterPresence === 'online' ? '' : 'online'"
        role="button"
        tabindex="0"
        title="Filter by online users"
      >
        <div class="user-kpi-icon icon--online">
          <span class="pulse-green-dot"></span>
        </div>
        <div class="user-kpi-info">
          <span class="user-kpi-val text-online">{{ onlineCount }}</span>
          <span class="user-kpi-lbl">Online Now</span>
        </div>
      </div>

      <div 
        class="user-kpi-card user-kpi-card--clickable" 
        :class="{ 'user-kpi-card--active': filterPresence === 'offline' }" 
        @click="filterPresence = filterPresence === 'offline' ? '' : 'offline'"
        role="button"
        tabindex="0"
        title="Filter by offline users"
      >
        <div class="user-kpi-icon icon--offline">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <div class="user-kpi-info">
          <span class="user-kpi-val text-muted">{{ offlineCount }}</span>
          <span class="user-kpi-lbl">Offline</span>
        </div>
      </div>

      <div 
        class="user-kpi-card user-kpi-card--clickable" 
        :class="{ 'user-kpi-card--active': filterStatus === 'locked' }" 
        @click="filterStatus = filterStatus === 'locked' ? '' : 'locked'"
        role="button"
        tabindex="0"
        title="Filter by locked accounts"
      >
        <div class="user-kpi-icon icon--locked">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div class="user-kpi-info">
          <span class="user-kpi-val text-locked">{{ lockedCount }}</span>
          <span class="user-kpi-lbl">Locked / Inactive</span>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay user-modal-overlay" @click.self="cancelForm">
      <div class="form-card user-form-card">
        <h3>{{ editingUser ? 'Edit User Account' : 'Add New User Account' }}</h3>
        <div v-if="editingUser && (editingUser.account_status === 'locked' || editingUser.locked_until)" style="margin-bottom: 16px; padding: 12px 14px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <div>
            <strong style="color: var(--destructive, #ef4444);">Account is Locked:</strong> This user cannot sign in due to failed login attempts or security lockout.
          </div>
          <button type="button" @click="handleQuickUnlock" class="btn-sm btn-success" style="white-space: nowrap;">
            Unlock Account Now
          </button>
        </div>
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="form.name" required placeholder="e.g. Maria Santos" />
          </div>
          <div class="form-group">
            <label>Username</label>
            <input v-model="form.username" required placeholder="Enter username" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" :required="!editingUser" placeholder="name@example.com" autocomplete="email" />
          </div>
          <div class="form-group" v-if="editingUser">
            <label>Password</label>
            <input v-model="form.password" type="password" placeholder="Leave blank to keep unchanged" autocomplete="new-password" />
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
          <div class="form-group" v-if="editingUser && editingUser.id !== auth.user?.id">
            <label>Account Status</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <select v-model="form.account_status" style="flex: 1;">
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="locked">Locked</option>
              </select>
              <button
                v-if="form.account_status === 'locked' || editingUser.account_status === 'locked'"
                type="button"
                @click="handleQuickUnlock"
                class="btn-secondary"
                style="white-space: nowrap; color: var(--success); border-color: color-mix(in srgb, var(--success) 35%, var(--border));"
              >
                Unlock Now
              </button>
            </div>
          </div>
          <div class="form-actions user-form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner user-save-spinner"></span>
              {{ saving ? 'Saving...' : (editingUser ? 'Update Account' : 'Send Invitation') }}
            </button>
            <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
          </div>
          <p v-if="formError" class="error-msg">{{ formError }}</p>
        </form>
      </div>
    </div>

    <div class="table-card user-table-card">
      <div class="table-toolbar user-management-toolbar">
        <div class="table-toolbar-left user-toolbar-left">
          <span class="show-wrap">Show
            <select v-model="pageSize" @change="onPageSizeChange" class="show-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </span>
          <button @click="startInvite" class="btn-primary" v-if="!showForm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add User
          </button>
        </div>
        <div class="table-toolbar-right user-toolbar-right">
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
          <select v-model="filterPresence" @change="currentPage = 1" class="tbl-filter" title="Filter by online/offline presence">
            <option value="">All Presence</option>
            <option value="online">Online only</option>
            <option value="offline">Offline only</option>
          </select>
          <select v-model="filterStatus" @change="currentPage = 1" class="tbl-filter" title="Filter by account status">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
            <option value="disabled">Disabled</option>
            <option value="invited">Invited</option>
          </select>
        </div>
      </div>
      <div class="user-table-scroll">
      <table class="data-table user-table" v-if="filteredUsers.length">
        <thead>
          <tr>
            <th class="cell-id">ID</th>
            <th>User</th>
            <th>Role</th>
            <th v-if="auth.isSuperadmin">School</th>
            <th>Advisory</th>
            <th>Status</th>
            <th class="user-actions-heading">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in pagedUsers" :key="u.id">
            <td class="cell-id">#{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>
              <div class="cell-person">
                <div class="avatar-wrap">
                  <span class="cell-avatar">{{ (u.name || '?').charAt(0).toUpperCase() }}</span>
                  <span 
                    class="avatar-presence-indicator" 
                    :class="u.is_online ? 'is-online' : 'is-offline'" 
                    :title="u.is_online ? 'User is online now' : (u.last_seen_at ? 'Offline. Last active ' + formatTimeAgo(u.last_seen_at) : 'Offline')"
                  ></span>
                </div>
                <div class="cell-person-copy">
                  <div class="cell-main-row">
                    <span class="cell-main">{{ u.name }}</span>
                    <span class="presence-badge" :class="u.is_online ? 'presence-badge--online' : 'presence-badge--offline'">
                      <span class="presence-dot"></span>
                      {{ u.is_online ? 'Online' : 'Offline' }}
                    </span>
                  </div>
                  <div class="cell-sub">
                    @{{ u.username }}<span v-if="u.email"> · {{ u.email }}</span>
                    <span v-if="u.is_online" class="online-active-hint"> · Active now</span>
                    <span v-else-if="u.last_seen_at" class="last-seen-hint"> · Active {{ formatTimeAgo(u.last_seen_at) }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span :class="['pill', u.role === 'superadmin' ? 'pill--amber' : u.role === 'admin' ? 'pill--blue' : 'pill--green']">{{ u.role === 'superadmin' ? 'Superadmin' : u.role === 'admin' ? 'Administrator' : 'Teacher' }}</span>
            </td>
            <td v-if="auth.isSuperadmin">{{ schoolNameOf(u) }}</td>
            <td>{{ u.grade ? (u.grade + (u.section ? ' - ' + u.section : '')) : '—' }}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span :class="['pill', statusClass(u.account_status)]">{{ statusLabel(u.account_status) }}</span>
                <button
                  v-if="(u.account_status === 'locked' || u.locked_until) && canManageStatus(u) && u.id !== auth.user?.id"
                  type="button"
                  @click="unlockUser(u)"
                  class="btn-xs-status"
                  title="Unlock this user immediately"
                  style="color: var(--success); border-color: color-mix(in srgb, var(--success) 35%, var(--border));"
                >
                  Unlock
                </button>
              </div>
              <div v-if="u.last_login_at" class="cell-sub">Last login: {{ formatDate(u.last_login_at) }}</div>
            </td>
            <td class="user-actions-cell">
              <div class="row-actions user-row-actions">
                <button @click="editUser(u)" class="icon-btn" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button @click="impersonateUser(u)" class="icon-btn" title="Impersonate" v-if="auth.isSuperadmin && u.id !== auth.user?.id && u.role !== 'superadmin'" :disabled="impersonatingId === u.id">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button @click="resendInvite(u)" class="icon-btn" title="Resend invitation" v-if="u.account_status === 'invited' && canManageStatus(u)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.36-6.36L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.36 6.36L3 16"/><path d="M3 21v-5h5"/></svg>
                </button>
                <button @click="requestReset(u)" class="icon-btn" title="Send password reset" v-if="u.account_status !== 'invited' && u.email && canManageStatus(u)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </button>
                <button @click="unlockUser(u)" class="icon-btn icon-btn--success" title="Unlock account (restore login access)" v-if="(u.account_status === 'locked' || u.locked_until) && u.id !== auth.user?.id && canManageStatus(u)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  </svg>
                </button>
                <button @click="toggleStatus(u)" class="icon-btn" :title="u.account_status === 'disabled' ? 'Enable account' : (u.account_status === 'locked' ? 'Unlock account' : 'Disable account')" v-if="u.id !== auth.user?.id && canManageStatus(u)">
                  <svg v-if="u.account_status === 'disabled'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/></svg>
                  <svg v-else-if="u.account_status === 'locked'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                </button>
                <button @click="removeUser(u.id)" class="icon-btn icon-btn--danger" title="Delete" v-if="u.id !== auth.user?.id && canManageStatus(u)">
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
const filterStatus = ref('')
const filterPresence = ref('')
const impersonatingId = ref(null)
const userSearch = ref('')
const pageSize = ref(10)
const currentPage = ref(1)

const onlineCount = computed(() => users.value.filter(u => u.is_online).length)
const offlineCount = computed(() => users.value.filter(u => !u.is_online).length)
const lockedCount = computed(() => users.value.filter(u => u.account_status === 'locked' || u.locked_until).length)

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  return users.value.filter(u => {
    if (filterStatus.value && (u.account_status || 'active') !== filterStatus.value) return false
    if (filterPresence.value === 'online' && !u.is_online) return false
    if (filterPresence.value === 'offline' && u.is_online) return false
    if (!q) return true
    return (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
  })
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
const form = ref({ name: '', username: '', email: '', password: '', role: 'teacher', grade: '', section: '', schoolId: '' })
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

let pollTimer = null

onMounted(async () => {
  if (auth.isSuperadmin) {
    schools.value = await auth.getSchools()
    filterSchoolId.value = activeSchoolId.value
  }
  await loadGradeLevels(targetSchoolId.value || undefined)
  await loadUsers()
  // Poll active presence every 25 seconds
  pollTimer = setInterval(loadUsers, 25000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
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

function statusLabel(status) {
  return ({ active: 'Active', invited: 'Invited', disabled: 'Disabled', locked: 'Locked' }[status] || 'Active')
}

function statusClass(status) {
  return ({ active: 'pill--green', invited: 'pill--amber', disabled: 'pill--red', locked: 'pill--red' }[status] || 'pill--green')
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

function formatTimeAgo(value) {
  if (!value) return ''
  const date = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'))
  if (Number.isNaN(date.getTime())) return ''
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

function canManageStatus(u) {
  return u.role !== 'superadmin' || auth.isSuperadmin
}

function resetForm() {
  form.value = { name: '', username: '', email: '', password: '', role: 'teacher', grade: '', section: '', schoolId: auth.isSuperadmin ? (activeSchoolId.value || '') : (auth.schoolId || ''), account_status: 'active' }
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
      await auth.inviteUser({ ...form.value })
    }
    await loadUsers()
    cancelForm()
    addToast(editingUser.value ? 'User updated' : 'Invitation sent', 'success')
  } catch (e) {
    formError.value = e.message
    addToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

function editUser(u) {
  editingUser.value = u
  form.value = {
    name: u.name,
    username: u.username,
    email: u.email || '',
    password: '',
    role: u.role,
    grade: u.grade || '',
    section: u.section || '',
    schoolId: u.school_id || '',
    account_status: u.account_status || 'active'
  }
  showForm.value = true
}

async function handleQuickUnlock() {
  if (!editingUser.value) return
  try {
    await auth.unlockUser(editingUser.value.id)
    editingUser.value.account_status = 'active'
    editingUser.value.locked_until = null
    form.value.account_status = 'active'
    await loadUsers()
    addToast(`Account for ${editingUser.value.name} unlocked successfully`, 'success')
  } catch (e) {
    addToast(e.message, 'error')
  }
}

async function unlockUser(u) {
  if (!confirm(`Unlock ${u.name}'s account? This will clear lockout and restore sign-in access immediately.`)) return
  try {
    await auth.unlockUser(u.id)
    await loadUsers()
    addToast(`Account for ${u.name} unlocked successfully`, 'success')
  } catch (e) {
    addToast(e.message, 'error')
  }
}

function startInvite() {
  resetForm()
  showForm.value = true
}

async function resendInvite(u) {
  try { await auth.resendInvitation(u.id); addToast('Invitation resent', 'success') }
  catch (e) { addToast(e.message, 'error') }
}

async function requestReset(u) {
  try { await auth.requestUserPasswordReset(u.id); addToast('Password reset sent', 'success') }
  catch (e) { addToast(e.message, 'error') }
}

async function toggleStatus(u) {
  if (u.account_status === 'locked') {
    return unlockUser(u)
  }
  const next = u.account_status === 'disabled' ? 'active' : 'disabled'
  if (!confirm(`${next === 'active' ? 'Enable' : 'Disable'} ${u.name}'s account?`)) return
  try {
    await auth.updateUserStatus(u.id, next)
    await loadUsers()
    addToast(`Account ${next === 'active' ? 'enabled' : 'disabled'}`, 'success')
  } catch (e) {
    addToast(e.message, 'error')
  }
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

<style scoped>
.user-modal-overlay {
  padding: clamp(12px, 3vw, 20px);
}

.user-form-card {
  max-height: min(90vh, 760px);
}

.user-form-card h3 {
  margin: 0 0 18px;
}

.user-form-actions {
  flex-wrap: wrap;
}

.user-form-actions > button {
  flex: 1 1 140px;
}

.user-save-spinner {
  margin-right: 6px;
}

.user-management-toolbar {
  align-items: center;
}

.user-toolbar-left,
.user-toolbar-right {
  min-width: 0;
  flex: 1 1 280px;
}

.user-toolbar-right {
  justify-content: flex-end;
}

.user-toolbar-right .tbl-search {
  min-width: 0;
  flex: 1 1 230px;
}

.user-toolbar-right .tbl-search input {
  width: 100%;
  max-width: 230px;
}

.user-toolbar-right .tbl-filter {
  max-width: 100%;
}

.user-table-scroll {
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

.user-table {
  min-width: 780px;
}

.user-table td {
  overflow-wrap: anywhere;
}

.user-table .cell-person-copy {
  min-width: 0;
}

.user-table .cell-sub {
  overflow-wrap: anywhere;
}

.user-actions-heading,
.user-actions-cell {
  min-width: 190px;
  text-align: right;
}

.user-row-actions {
  flex-wrap: wrap;
  gap: 4px;
}

.user-table-card .table-footer {
  align-items: flex-start;
}

.user-table-card .pager {
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* User KPI Presence Cards */
.user-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.user-kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
  user-select: none;
}

.user-kpi-card--clickable {
  cursor: pointer;
}

.user-kpi-card--clickable:hover {
  transform: translateY(-1px);
  border-color: var(--primary);
}

.user-kpi-card--active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 6%, var(--card));
  box-shadow: 0 0 0 1px var(--primary);
}

.user-kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon--total {
  background: var(--primary-bg);
  color: var(--primary);
}

.icon--online {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.icon--offline {
  background: var(--muted);
  color: var(--muted-foreground);
}

.icon--locked {
  background: rgba(239, 68, 68, 0.15);
  color: var(--destructive);
}

.user-kpi-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-kpi-val {
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--foreground);
}

.user-kpi-lbl {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 3px;
}

.text-online {
  color: #10b981 !important;
}

.text-locked {
  color: var(--destructive) !important;
}

.pulse-green-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulseGreen 2s infinite;
}

@keyframes pulseGreen {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

/* Avatar Presence Indicator */
.avatar-wrap {
  position: relative;
  display: inline-flex;
}

.avatar-presence-indicator {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--card);
}

.avatar-presence-indicator.is-online {
  background: #10b981;
}

.avatar-presence-indicator.is-offline {
  background: var(--muted-foreground);
  opacity: 0.6;
}

/* Presence Badges */
.cell-main-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.presence-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 9999px;
  letter-spacing: 0.02em;
}

.presence-badge--online {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.presence-badge--offline {
  background: var(--muted);
  color: var(--muted-foreground);
  border: 1px solid var(--border);
}

.presence-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.presence-badge--online .presence-dot {
  background: #10b981;
}

.presence-badge--offline .presence-dot {
  background: var(--muted-foreground);
  opacity: 0.5;
}

.online-active-hint {
  color: #059669;
  font-weight: 600;
}

.last-seen-hint {
  color: var(--muted-foreground);
}

@media (max-width: 820px) {
  .user-management-toolbar {
    align-items: stretch;
  }

  .user-toolbar-left,
  .user-toolbar-right {
    flex-basis: 100%;
  }

  .user-toolbar-right {
    justify-content: flex-start;
  }
}

@media (max-width: 600px) {
  .user-form-actions > button {
    flex-basis: 100%;
  }

  .user-toolbar-right .tbl-search input {
    max-width: none;
  }

  .user-table-card .table-footer {
    align-items: center;
  }

  .user-table-card .pager {
    justify-content: center;
  }
}
</style>
