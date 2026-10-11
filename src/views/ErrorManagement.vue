<template>
  <div class="management-page error-management-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header-text">
        <div class="breadcrumb">
          <span>System Health &amp; Telemetry</span>
          <span class="sep">/</span>
          <span class="current">Error Management</span>
        </div>
        <div class="header-title-wrap">
          <div class="header-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">System Errors &amp; Incident Management</h1>
            <p class="page-subtitle">
              Monitor, inspect, and manage runtime errors, client-side exceptions, and API failures across your school workspaces.
            </p>
          </div>
        </div>
      </div>

      <div class="page-header-actions">
        <!-- Superadmin Multi-School Switcher -->
        <div v-if="auth.isSuperadmin && schoolsList.length > 1" class="school-picker-wrap">
          <svg class="school-picker-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
          </svg>
          <select v-model="selectedSchoolId" @change="onSchoolChange" class="school-picker-select">
            <option value="">All Schools</option>
            <option v-for="s in schoolsList" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <button @click="loadErrors" type="button" class="btn-secondary" :disabled="loading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>Refresh</span>
        </button>

        <button 
          v-if="auth.isAdmin" 
          @click="clearResolvedErrors" 
          type="button" 
          class="btn-secondary" 
          :disabled="clearing || !stats.total_errors"
          title="Delete all resolved and ignored errors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
          <span>{{ clearing ? 'Purging…' : 'Clear Resolved' }}</span>
        </button>
      </div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="stats-row">
      <div 
        class="stat-card stat-card-filter" 
        :class="{ 'stat-card--active': filterStatus === '' && !filterSeverity }" 
        @click="filterStatus = ''; filterSeverity = ''; currentPage = 1; loadErrors()"
      >
        <div class="stat-icon stat-icon--info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total_errors }}</span>
          <span class="stat-label">Total Errors</span>
        </div>
      </div>

      <div 
        class="stat-card stat-card-filter" 
        :class="{ 'stat-card--active': filterStatus === 'unresolved' }" 
        @click="filterStatus = 'unresolved'; currentPage = 1; loadErrors()"
      >
        <div class="stat-icon stat-icon--danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value text-destructive">{{ stats.unresolved_count }}</span>
          <span class="stat-label">Unresolved</span>
        </div>
      </div>

      <div 
        class="stat-card stat-card-filter" 
        :class="{ 'stat-card--active': filterSeverity === 'critical' }" 
        @click="filterSeverity = 'critical'; currentPage = 1; loadErrors()"
      >
        <div class="stat-icon stat-icon--warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value" style="color: #f59e0b;">{{ stats.critical_count }}</span>
          <span class="stat-label">Critical Severity</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stat-icon--primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.today_count }}</span>
          <span class="stat-label">Occurred Today</span>
        </div>
      </div>
    </div>

    <!-- Toolbar & Filters -->
    <div class="form-card filter-toolbar-card">
      <div class="filter-controls-row">
        <!-- Search -->
        <div class="form-group search-group">
          <label>Search Error Logs</label>
          <div class="search-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              v-model="searchQuery" 
              @input="onSearchInput" 
              class="form-input search-input" 
              placeholder="Search message, URL path, user name..." 
            />
            <button v-if="searchQuery" type="button" class="clear-btn" @click="searchQuery = ''; onSearchInput()">&times;</button>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="form-group select-group">
          <label>Status</label>
          <select v-model="filterStatus" @change="currentPage = 1; loadErrors()" class="form-select">
            <option value="">All Statuses</option>
            <option value="unresolved">Unresolved</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>

        <!-- Severity Filter -->
        <div class="form-group select-group">
          <label>Severity</label>
          <select v-model="filterSeverity" @change="currentPage = 1; loadErrors()" class="form-select">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="form-group select-group">
          <label>Origin</label>
          <select v-model="filterType" @change="currentPage = 1; loadErrors()" class="form-select">
            <option value="">All Origins</option>
            <option value="client">Client (Browser)</option>
            <option value="server">Server (API)</option>
          </select>
        </div>

        <div class="filter-reset-group" v-if="searchQuery || filterStatus || filterSeverity || filterType">
          <button @click="resetFilters" type="button" class="btn-sm btn-secondary">
            Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Error Table Card -->
    <div class="form-card table-card-wrap">
      <div v-if="loading" class="empty-state-box">
        <div class="spinner"></div>
        <p>Loading system error telemetry...</p>
      </div>

      <div v-else-if="!errorsList.length" class="empty-state-box">
        <div class="empty-icon-shield">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <h3>No system errors recorded</h3>
        <p>Your application is healthy with zero unhandled incidents matching the selected criteria.</p>
      </div>

      <div v-else class="table-container">
        <table class="data-table error-table">
          <thead>
            <tr>
              <th style="width: 110px;">Severity</th>
              <th style="width: 90px;">Origin</th>
              <th>Error Details &amp; Request Path</th>
              <th style="width: 150px;">Actor / User</th>
              <th style="width: 130px;">Status</th>
              <th style="width: 150px;">Occurred</th>
              <th class="text-right" style="width: 140px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in errorsList" :key="e.id" class="error-row">
              <td>
                <span class="badge" :class="severityBadgeClass(e.severity)">
                  {{ e.severity }}
                </span>
              </td>
              <td>
                <span class="type-pill" :class="e.error_type === 'client' ? 'type-client' : 'type-server'">
                  {{ e.error_type === 'client' ? 'Client' : 'Server' }}
                </span>
              </td>
              <td class="error-message-cell">
                <div class="error-message-text" :title="e.message">{{ e.message }}</div>
                <div class="error-path-sub" v-if="e.path">
                  <span class="method-tag" v-if="e.method">{{ e.method }}</span>
                  <span class="path-text">{{ e.path }}</span>
                  <span class="status-code-tag" v-if="e.status_code">({{ e.status_code }})</span>
                </div>
              </td>
              <td>
                <div class="actor-info" v-if="e.user_name || e.user_id">
                  <div class="actor-name">{{ e.user_name || 'User ' + e.user_id.slice(0, 6) }}</div>
                  <div class="actor-role">{{ e.user_role || 'user' }}</div>
                </div>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span class="status-badge" :class="statusBadgeClass(e.status)">
                  <span class="status-dot"></span>
                  {{ e.status }}
                </span>
              </td>
              <td class="time-cell">
                <div class="time-main">{{ formatTimeAgo(e.created_at) }}</div>
                <div class="time-sub">{{ formatShortDate(e.created_at) }}</div>
              </td>
              <td class="text-right">
                <div class="action-btn-row">
                  <button @click="openInspectModal(e)" type="button" class="btn-xs btn-outline" title="Inspect stack trace and metadata">
                    Inspect
                  </button>
                  <button 
                    v-if="e.status === 'unresolved'" 
                    @click="updateErrorStatus(e.id, 'resolved')" 
                    type="button" 
                    class="btn-xs btn-success"
                    title="Mark resolved"
                  >
                    Resolve
                  </button>
                  <button @click="deleteError(e.id)" type="button" class="btn-xs btn-danger-icon" title="Delete log">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-footer">
        <span class="page-count-text">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(totalErrors, currentPage * pageSize) }} of {{ totalErrors }} incidents
        </span>
        <div class="pager">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pager-btn">Previous</button>
          <span class="pager-current">Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="pager-btn">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal: Inspect Error Details & Stack Trace -->
    <div v-if="selectedError" class="modal-overlay" @click.self="selectedError = null">
      <div class="modal-card inspect-modal-card">
        <div class="modal-header">
          <div class="modal-header-icon" :class="severityIconClass(selectedError.severity)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3>Error Incident Details</h3>
            <p>ID: <code>{{ selectedError.id }}</code> &bull; Logged {{ formatTimeAgo(selectedError.created_at) }}</p>
          </div>
          <button @click="selectedError = null" type="button" class="modal-close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div class="modal-field-box">
            <label>Error Message</label>
            <div class="error-msg-banner">{{ selectedError.message }}</div>
          </div>

          <div class="context-grid">
            <div class="context-item">
              <label>Origin</label>
              <span>{{ selectedError.error_type }}</span>
            </div>
            <div class="context-item">
              <label>Severity</label>
              <span>{{ selectedError.severity }}</span>
            </div>
            <div class="context-item">
              <label>Endpoint / Route</label>
              <code>{{ selectedError.method }} {{ selectedError.path || '—' }}</code>
            </div>
            <div class="context-item">
              <label>HTTP Code</label>
              <span>{{ selectedError.status_code || 500 }}</span>
            </div>
            <div class="context-item">
              <label>Actor</label>
              <span>{{ selectedError.user_name || selectedError.user_id || 'Guest / Unauthenticated' }} ({{ selectedError.user_role || 'none' }})</span>
            </div>
            <div class="context-item">
              <label>IP Address</label>
              <span>{{ selectedError.ip_address || '—' }}</span>
            </div>
          </div>

          <!-- Stack Trace -->
          <div class="stack-trace-section" v-if="selectedError.stack">
            <div class="stack-header">
              <label>Stack Trace</label>
              <button @click="copyStackTrace" type="button" class="btn-xs btn-outline">
                {{ copied ? 'Copied!' : 'Copy Stack' }}
              </button>
            </div>
            <pre class="stack-pre"><code>{{ selectedError.stack }}</code></pre>
          </div>

          <!-- Metadata -->
          <div class="metadata-section" v-if="selectedError.metadata">
            <label>Metadata / Context</label>
            <pre class="metadata-pre"><code>{{ JSON.stringify(selectedError.metadata, null, 2) }}</code></pre>
          </div>

          <!-- Status & Resolution Editor -->
          <div class="resolution-editor-box">
            <label class="res-title">Incident Status &amp; Resolution</label>
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label>Status</label>
                <select v-model="editStatus" class="form-select">
                  <option value="unresolved">Unresolved</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="ignored">Ignored</option>
                </select>
              </div>
              <div class="form-group" style="flex: 2;">
                <label>Resolution Notes</label>
                <input v-model="editNotes" class="form-input" placeholder="Explain fix or resolution details..." />
              </div>
            </div>
            <div v-if="selectedError.resolved_by" class="resolved-by-notice">
              Resolved by <strong>{{ selectedError.resolved_by }}</strong> at {{ formatShortDate(selectedError.resolved_at) }}
            </div>
          </div>

          <div class="modal-footer">
            <button @click="selectedError = null" type="button" class="btn-secondary">Close</button>
            <button @click="saveErrorStatus" type="button" class="btn-primary" :disabled="savingStatus">
              {{ savingStatus ? 'Saving…' : 'Save Resolution Status' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'

const auth = useAuthStore()
const { notify } = useNotifications()

const loading = ref(false)
const clearing = ref(false)
const savingStatus = ref(false)
const copied = ref(false)

const errorsList = ref([])
const totalErrors = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(20)

const searchQuery = ref('')
const filterStatus = ref('')
const filterSeverity = ref('')
const filterType = ref('')
const selectedSchoolId = ref(auth.schoolId || '')
const schoolsList = ref([])

const stats = ref({
  total_errors: 0,
  unresolved_count: 0,
  critical_count: 0,
  today_count: 0,
  client_count: 0,
  server_count: 0
})

const selectedError = ref(null)
const editStatus = ref('unresolved')
const editNotes = ref('')

let searchDebounce = null
let autoRefreshTimer = null

function onSearchInput() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    loadErrors()
  }, 300)
}

function resetFilters() {
  searchQuery.value = ''
  filterStatus.value = ''
  filterSeverity.value = ''
  filterType.value = ''
  currentPage.value = 1
  loadErrors()
}

function effectiveSchoolId() {
  return auth.isSuperadmin ? (selectedSchoolId.value || '') : (auth.schoolId || '')
}

async function loadStats() {
  try {
    const params = new URLSearchParams()
    const sid = effectiveSchoolId()
    if (sid) params.set('schoolId', sid)

    const res = await fetch(`/api/errors/stats?${params.toString()}`, {
      headers: auth.actorHeaders()
    })
    if (res.ok) {
      const data = await res.json()
      stats.value = data
    }
  } catch (err) {
    console.error('Failed to load error stats:', err)
  }
}

async function loadErrors() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(currentPage.value),
      limit: String(pageSize.value)
    })
    const sid = effectiveSchoolId()
    if (sid) params.set('schoolId', sid)
    if (filterStatus.value) params.set('status', filterStatus.value)
    if (filterSeverity.value) params.set('severity', filterSeverity.value)
    if (filterType.value) params.set('type', filterType.value)
    if (searchQuery.value) params.set('search', searchQuery.value)

    const res = await fetch(`/api/errors?${params.toString()}`, {
      headers: auth.actorHeaders()
    })
    if (res.ok) {
      const data = await res.json()
      errorsList.value = data.errors || []
      totalErrors.value = data.total || 0
      totalPages.value = data.totalPages || 1
    }
    await loadStats()
  } catch (err) {
    console.error('Failed to load error list:', err)
    notify('Failed to load error logs', 'error')
  } finally {
    loading.value = false
  }
}

function goToPage(p) {
  if (p >= 1 && p <= totalPages.value) {
    currentPage.value = p
    loadErrors()
  }
}

function openInspectModal(err) {
  selectedError.value = err
  editStatus.value = err.status || 'unresolved'
  editNotes.value = err.resolution_notes || ''
  copied.value = false
}

async function saveErrorStatus() {
  if (!selectedError.value) return
  savingStatus.value = true
  try {
    const res = await fetch(`/api/errors/${selectedError.value.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify({
        status: editStatus.value,
        resolution_notes: editNotes.value
      })
    })
    if (!res.ok) throw new Error('Failed to update status')
    notify('Error status updated', 'success')
    selectedError.value = null
    await loadErrors()
  } catch (err) {
    notify(err.message, 'error')
  } finally {
    savingStatus.value = false
  }
}

async function updateErrorStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/errors/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify({ status: newStatus })
    })
    if (!res.ok) throw new Error('Failed to update status')
    notify(`Incident marked as ${newStatus}`, 'success')
    await loadErrors()
  } catch (err) {
    notify(err.message, 'error')
  }
}

async function deleteError(id) {
  if (!confirm('Delete this error log record?')) return
  try {
    const res = await fetch(`/api/errors/${id}`, {
      method: 'DELETE',
      headers: auth.actorHeaders()
    })
    if (!res.ok) throw new Error('Failed to delete error record')
    notify('Error log deleted', 'success')
    await loadErrors()
  } catch (err) {
    notify(err.message, 'error')
  }
}

async function clearResolvedErrors() {
  if (!confirm('Purge all resolved and ignored error records?')) return
  clearing.value = true
  try {
    const res = await fetch('/api/errors/clear-resolved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify({ schoolId: effectiveSchoolId() })
    })
    if (!res.ok) throw new Error('Failed to clear resolved error logs')
    notify('Resolved error records purged', 'success')
    await loadErrors()
  } catch (err) {
    notify(err.message, 'error')
  } finally {
    clearing.value = false
  }
}

function copyStackTrace() {
  if (!selectedError.value?.stack) return
  navigator.clipboard.writeText(selectedError.value.stack)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function onSchoolChange() {
  currentPage.value = 1
  loadErrors()
}

function severityBadgeClass(sev) {
  if (sev === 'critical') return 'badge-critical'
  if (sev === 'warning') return 'badge-warning'
  return 'badge-danger'
}

function severityIconClass(sev) {
  if (sev === 'critical') return 'icon--critical'
  if (sev === 'warning') return 'icon--warning'
  return 'icon--danger'
}

function statusBadgeClass(st) {
  if (st === 'resolved') return 'status--resolved'
  if (st === 'investigating') return 'status--investigating'
  if (st === 'ignored') return 'status--ignored'
  return 'status--unresolved'
}

function formatShortDate(val) {
  if (!val) return '—'
  const d = new Date(String(val).replace(' ', 'T') + (String(val).includes('Z') ? '' : 'Z'))
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString()
}

function formatTimeAgo(val) {
  if (!val) return '—'
  const d = new Date(String(val).replace(' ', 'T') + (String(val).includes('Z') ? '' : 'Z'))
  if (Number.isNaN(d.getTime())) return ''
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

onMounted(async () => {
  if (auth.isSuperadmin) {
    schoolsList.value = await auth.getSchools()
  }
  await loadErrors()
  // Periodic poll every 30s
  autoRefreshTimer = setInterval(loadErrors, 30000)
})

onUnmounted(() => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
  clearTimeout(searchDebounce)
})
</script>

<style scoped>
.error-management-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-box {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: rgba(239, 68, 68, 0.12);
  color: var(--destructive);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card-filter {
  cursor: pointer;
  transition: all 0.15s ease;
}

.stat-card-filter:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
}

.stat-card--active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 6%, var(--card));
  box-shadow: 0 0 0 1px var(--primary);
}

.stat-icon--danger {
  background: rgba(239, 68, 68, 0.12);
  color: var(--destructive);
}

.text-destructive {
  color: var(--destructive);
}

.filter-toolbar-card {
  padding: 16px 20px;
}

.filter-controls-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.search-group {
  flex: 2;
  min-width: 240px;
  margin-bottom: 0;
}

.select-group {
  flex: 1;
  min-width: 140px;
  margin-bottom: 0;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.search-input {
  padding-left: 32px;
  padding-right: 28px;
}

.clear-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--muted-foreground);
  cursor: pointer;
}

.filter-reset-group {
  margin-bottom: 4px;
}

.table-card-wrap {
  padding: 0;
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

.error-table {
  width: 100%;
  border-collapse: collapse;
}

.error-table th {
  background: var(--muted);
  padding: 12px 16px;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  border-bottom: 1px solid var(--border);
}

.error-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}

.error-row:hover {
  background: var(--secondary);
}

.badge-critical {
  background: rgba(220, 38, 38, 0.15);
  color: #dc2626;
  font-weight: 800;
  text-transform: uppercase;
}

.type-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.type-client {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.type-server {
  background: rgba(168, 85, 247, 0.12);
  color: #7c3aed;
}

.error-message-cell {
  max-width: 380px;
}

.error-message-text {
  font-weight: 700;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.error-path-sub {
  font-size: 0.76rem;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.method-tag {
  font-weight: 700;
  font-size: 0.68rem;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--muted);
  color: var(--foreground);
}

.path-text {
  font-family: monospace;
}

.actor-info {
  display: flex;
  flex-direction: column;
}

.actor-name {
  font-weight: 600;
  color: var(--foreground);
}

.actor-role {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: capitalize;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status--unresolved {
  background: rgba(239, 68, 68, 0.12);
  color: var(--destructive);
}
.status--unresolved .status-dot { background: var(--destructive); }

.status--investigating {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}
.status--investigating .status-dot { background: #d97706; }

.status--resolved {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}
.status--resolved .status-dot { background: #10b981; }

.status--ignored {
  background: var(--muted);
  color: var(--muted-foreground);
}
.status--ignored .status-dot { background: var(--muted-foreground); }

.time-cell {
  font-size: 0.8rem;
}

.time-main {
  font-weight: 600;
  color: var(--foreground);
}

.time-sub {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.action-btn-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-xs {
  font-size: 0.72rem;
  padding: 3px 7px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.btn-success {
  background: var(--success);
  color: var(--success-foreground, #fff);
  border: none;
}

.btn-danger-icon {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted-foreground);
  padding: 3px 5px;
}

.btn-danger-icon:hover {
  color: var(--destructive);
  border-color: var(--destructive);
}

.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  font-size: 0.82rem;
}

.empty-state-box {
  padding: 50px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon-shield {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal */
.inspect-modal-card {
  max-width: 720px;
  width: 100%;
}

.modal-header-icon.icon--danger {
  background: rgba(239, 68, 68, 0.12);
  color: var(--destructive);
}
.modal-header-icon.icon--critical {
  background: rgba(220, 38, 38, 0.15);
  color: #dc2626;
}

.error-msg-banner {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-weight: 700;
  color: var(--destructive);
  font-size: 0.9rem;
  line-height: 1.4;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}

.context-item label {
  font-size: 0.68rem;
  text-transform: uppercase;
  color: var(--muted-foreground);
  font-weight: 700;
  display: block;
}

.context-item span, .context-item code {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--foreground);
}

.stack-trace-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stack-pre {
  background: #111827;
  color: #f3f4f6;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  max-height: 220px;
  overflow: auto;
  line-height: 1.45;
  font-family: monospace;
}

.metadata-pre {
  background: var(--secondary);
  border: 1px solid var(--border);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.74rem;
  max-height: 140px;
  overflow: auto;
}

.resolution-editor-box {
  background: color-mix(in srgb, var(--primary) 5%, var(--card));
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.res-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--foreground);
}

.resolved-by-notice {
  font-size: 0.76rem;
  color: var(--muted-foreground);
  font-style: italic;
}
</style>
