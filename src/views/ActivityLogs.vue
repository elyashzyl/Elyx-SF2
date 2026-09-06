<template>
  <div class="management-page">
    <div class="page-header">
      <div>
        <h1>Activity Logs</h1>
        <p>Superadmin audit trail — user, school, grade, student, and impersonation activity.</p>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <button @click="loadLogs(0)" class="btn-primary" :disabled="loading">Refresh</button>
        </div>
        <div class="table-toolbar-right">
          <span class="tbl-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input v-model="search" @input="onSearchInput" type="text" placeholder="Search actor, target" />
          </span>
          <select v-model="filterAction" @change="loadLogs(0)" class="tbl-filter">
            <option value="">All Actions</option>
            <option v-for="a in actions" :key="a" :value="a">{{ actionLabel(a) }}</option>
          </select>
          <select v-model="filterSchoolId" @change="loadLogs(0)" class="tbl-filter">
            <option value="">All Schools</option>
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>
      <div v-if="logs.length" style="overflow-x: auto;">
      <table class="data-table">
        <thead>
          <tr>
            <th class="cell-id">ID</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
            <th>Issued Date</th>
            <th style="text-align: right;">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(l, i) in logs" :key="l.id">
            <td class="cell-id">#{{ i + 1 }}</td>
            <td>
              <div class="cell-person">
                <span class="cell-avatar">{{ (l.actor_name || '?').charAt(0).toUpperCase() }}</span>
                <div style="min-width: 0;">
                  <div class="cell-main">{{ l.actor_name || '—' }}</div>
                  <div class="cell-sub">{{ l.actor_role || '?' }}</div>
                </div>
              </div>
            </td>
            <td><span class="pill pill--blue">{{ actionLabel(l.action) }}</span></td>
            <td>{{ l.target_name || l.target_id || '—' }}</td>
            <td style="white-space: nowrap;">{{ formatTime(l.created_at) }}</td>
            <td style="text-align: right;">{{ l.detail || '—' }}</td>
          </tr>
        </tbody>
      </table>
      </div>
      <p v-else class="empty">{{ loading ? 'Loading…' : 'No activity recorded yet.' }}</p>
      <div class="table-footer" v-if="logs.length">
        <span class="table-count">Showing 1 to {{ logs.length }} of {{ total }} entries</span>
        <div class="pager">
          <button class="pager-btn" @click="loadMore" :disabled="loading || total <= logs.length">{{ loading ? 'Loading…' : 'Next' }}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'

const auth = useAuthStore()
const { notify } = useNotifications()
const logs = ref([])
const schools = ref([])
const actions = ref([])
const total = ref(0)
const loading = ref(false)
const search = ref('')
const filterAction = ref('')
const filterSchoolId = ref('')
const PAGE = 100

const ACTION_LABELS = {
  'impersonate.start': 'Impersonation started',
  'impersonate.stop': 'Impersonation ended',
  'user.create': 'User created',
  'user.update': 'User updated',
  'user.delete': 'User deleted',
  'school.create': 'School created',
  'school.update': 'School updated',
  'school.delete': 'School deleted',
  'school.settings': 'School settings saved',
  'grades.update': 'Grade levels updated',
  'student.create': 'Student enrolled',
  'student.bulk_create': 'Students bulk enrolled',
  'student.update': 'Student updated',
  'student.delete': 'Student deleted',
  'student.bulk_delete': 'Students bulk deleted'
}

function actionLabel(a) {
  return ACTION_LABELS[a] || a
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts.replace(' ', 'T') + 'Z').toLocaleString()
  } catch {
    return ts
  }
}

onMounted(async () => {
  schools.value = await auth.getSchools()
  actions.value = await auth.getLogActions()
  await loadLogs(0)
})

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadLogs(0), 300)
}

async function loadLogs(offset) {
  loading.value = true
  try {
    const data = await auth.getLogs({
      limit: PAGE,
      offset,
      ...(search.value.trim() ? { search: search.value.trim() } : {}),
      ...(filterAction.value ? { action: filterAction.value } : {}),
      ...(filterSchoolId.value ? { schoolId: filterSchoolId.value } : {})
    })
    total.value = data.total || 0
    logs.value = offset === 0 ? (data.logs || []) : [...logs.value, ...(data.logs || [])]
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  await loadLogs(logs.value.length)
}
</script>
