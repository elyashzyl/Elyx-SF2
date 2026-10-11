<template>
  <div class="management-page error-management-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header-text">
        <div class="breadcrumb">
          <router-link to="/settings" class="breadcrumb-link">System Settings</router-link>
          <span class="sep">/</span>
          <span class="current">Error Incident Manager</span>
        </div>
        <div class="dashboard-header-title-row">
          <div class="dashboard-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h1 class="page-title">System Errors &amp; Incident Management</h1>
            <p class="page-subtitle">
              Monitor, triage, and resolve runtime exceptions and API failures in real time across your school workspaces.
            </p>
          </div>
        </div>
      </div>

      <div class="page-header-actions">
        <!-- Live Telemetry Status Pill -->
        <div class="live-telemetry-badge" title="Live telemetry is actively monitoring server and browser exceptions">
          <span class="pulse-dot"></span>
          <span>Live Telemetry</span>
        </div>

        <!-- Superadmin Multi-School Switcher -->
        <div v-if="auth.isSuperadmin && schoolsList.length > 1" class="school-picker-wrap">
          <svg class="school-picker-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
          </svg>
          <select v-model="selectedSchoolId" @change="onSchoolChange" class="school-picker-select">
            <option value="">All Campuses</option>
            <option v-for="s in schoolsList" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- Refresh Button -->
        <button @click="loadErrors" type="button" class="btn-secondary header-action-btn" :disabled="loading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spin-icon': loading }">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>{{ loading ? 'Syncing...' : 'Refresh' }}</span>
        </button>

        <!-- Clear Resolved Button -->
        <button 
          v-if="auth.isAdmin" 
          @click="clearResolvedErrors" 
          type="button" 
          class="btn-secondary header-action-btn" 
          :disabled="clearing || !stats.total_errors"
          title="Delete all resolved and ignored incident logs"
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
          <span class="stat-value text-warning">{{ stats.critical_count }}</span>
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
          <span class="stat-value text-primary">{{ stats.today_count }}</span>
          <span class="stat-label">Occurred Today</span>
        </div>
      </div>
    </div>

    <!-- Toolbar & Filters -->
    <div class="form-card filter-toolbar-card">
      <div class="filter-controls-row">
        <!-- Search -->
        <div class="form-group search-group">
          <label class="filter-label">Search Error Logs</label>
          <div class="search-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              v-model="searchQuery" 
              @input="onSearchInput" 
              class="form-input search-input" 
              placeholder="Search message, URL path, user name, status code..." 
            />
            <button v-if="searchQuery" type="button" class="clear-btn" @click="searchQuery = ''; onSearchInput()">&times;</button>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="form-group select-group">
          <label class="filter-label">Status</label>
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
          <label class="filter-label">Severity</label>
          <select v-model="filterSeverity" @change="currentPage = 1; loadErrors()" class="form-select">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="form-group select-group">
          <label class="filter-label">Origin</label>
          <select v-model="filterType" @change="currentPage = 1; loadErrors()" class="form-select">
            <option value="">All Origins</option>
            <option value="client">Client (Browser)</option>
            <option value="server">Server (API)</option>
          </select>
        </div>

        <!-- Reset Button -->
        <div class="filter-reset-group" v-if="searchQuery || filterStatus || filterSeverity || filterType">
          <button @click="resetFilters" type="button" class="btn-sm btn-secondary reset-filter-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Table Card -->
    <div class="table-card-wrap">
      <!-- Card Toolbar -->
      <div class="table-card-header">
        <div class="table-card-header-title">
          <h3>Incident Telemetry Stream</h3>
          <span class="incident-counter-chip">{{ totalErrors }} recorded {{ totalErrors === 1 ? 'incident' : 'incidents' }}</span>
        </div>
        <div class="table-card-header-hint" v-if="filterStatus || filterSeverity || filterType || searchQuery">
          Filtered view active
        </div>
      </div>

      <div v-if="loading" class="empty-state-box">
        <div class="spinner"></div>
        <p>Streaming system error telemetry...</p>
      </div>

      <div v-else-if="!errorsList.length" class="empty-state-box">
        <div class="empty-icon-shield">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <h3>No System Errors Recorded</h3>
        <p>All platform systems and client sessions are operating smoothly with zero matching exceptions.</p>
        <button v-if="searchQuery || filterStatus || filterSeverity || filterType" @click="resetFilters" type="button" class="btn-sm btn-secondary" style="margin-top: 10px;">
          Clear Active Filters
        </button>
      </div>

      <div v-else class="table-container">
        <table class="data-table error-table">
          <thead>
            <tr>
              <th style="width: 110px;">Severity</th>
              <th style="width: 95px;">Origin</th>
              <th>Incident Details &amp; Path</th>
              <th style="width: 160px;">Actor / User</th>
              <th style="width: 130px;">Status</th>
              <th style="width: 140px;">Occurred</th>
              <th class="text-right" style="width: 160px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in errorsList" :key="e.id" class="error-row">
              <td>
                <span class="badge" :class="severityBadgeClass(e.severity)">
                  <span class="severity-dot"></span>
                  {{ e.severity }}
                </span>
              </td>
              <td>
                <span class="type-pill" :class="e.error_type === 'client' ? 'type-client' : 'type-server'">
                  {{ e.error_type === 'client' ? 'Browser' : 'Server' }}
                </span>
              </td>
              <td class="error-message-cell">
                <div class="error-message-text" :title="e.message">{{ e.message }}</div>
                <div class="error-path-sub" v-if="e.path">
                  <span class="method-tag" :class="'method-' + (e.method || 'get').toLowerCase()" v-if="e.method">{{ e.method }}</span>
                  <span class="path-text">{{ e.path }}</span>
                  <span class="status-code-tag" v-if="e.status_code">[{{ e.status_code }}]</span>
                </div>
              </td>
              <td>
                <div class="actor-info" v-if="e.user_name || e.user_id">
                  <div class="actor-name">{{ e.user_name || 'User ' + e.user_id.slice(0, 6) }}</div>
                  <div class="actor-role">{{ e.user_role || 'User' }}</div>
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
                  <button @click="openInspectModal(e)" type="button" class="btn-xs btn-outline action-btn" title="Inspect stack trace and context">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <span>Inspect</span>
                  </button>
                  <button 
                    v-if="e.status === 'unresolved'" 
                    @click="updateErrorStatus(e.id, 'resolved')" 
                    type="button" 
                    class="btn-xs btn-success action-btn"
                    title="Mark resolved"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Resolve</span>
                  </button>
                  <button @click="deleteError(e.id)" type="button" class="btn-xs btn-danger-icon" title="Delete record">
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
          Showing <strong>{{ (currentPage - 1) * pageSize + 1 }}</strong> to <strong>{{ Math.min(totalErrors, currentPage * pageSize) }}</strong> of <strong>{{ totalErrors }}</strong> incidents
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
            <label class="modal-section-label">Exception Message</label>
            <div class="error-msg-banner">{{ selectedError.message }}</div>
          </div>

          <div class="context-grid">
            <div class="context-item">
              <label>Origin</label>
              <span>{{ selectedError.error_type === 'client' ? 'Client (Browser)' : 'Server (API)' }}</span>
            </div>
            <div class="context-item">
              <label>Severity</label>
              <span style="text-transform: capitalize;">{{ selectedError.severity }}</span>
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
              <label class="modal-section-label">Stack Trace</label>
              <button @click="copyStackTrace" type="button" class="btn-xs btn-outline">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>{{ copied ? 'Copied!' : 'Copy Stack Trace' }}</span>
              </button>
            </div>
            <pre class="stack-pre"><code>{{ selectedError.stack }}</code></pre>
          </div>

          <!-- Metadata -->
          <div class="metadata-section" v-if="selectedError.metadata">
            <label class="modal-section-label">Context Metadata</label>
            <pre class="metadata-pre"><code>{{ JSON.stringify(selectedError.metadata, null, 2) }}</code></pre>
          </div>

          <!-- Status & Resolution Editor -->
          <div class="resolution-editor-box">
            <label class="res-title">Incident Triage &amp; Resolution</label>
            <div class="form-row">
              <div class="form-group" style="flex: 1; margin-bottom: 0;">
                <label>Status</label>
                <select v-model="editStatus" class="form-select">
                  <option value="unresolved">Unresolved</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="ignored">Ignored</option>
                </select>
              </div>
              <div class="form-group" style="flex: 2; margin-bottom: 0;">
                <label>Resolution Notes</label>
                <input v-model="editNotes" class="form-input" placeholder="Explain the root cause or resolution..." />
              </div>
            </div>
            <div v-if="selectedError.resolved_by" class="resolved-by-notice">
              Resolved by <strong>{{ selectedError.resolved_by }}</strong> at {{ formatShortDate(selectedError.resolved_at) }}
            </div>
          </div>

          <div class="modal-footer">
            <button @click="selectedError = null" type="button" class="btn-secondary">Close</button>
            <button @click="saveErrorStatus" type="button" class="btn-primary" :disabled="savingStatus">
              {{ savingStatus ? 'Saving…' : 'Save Resolution' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
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
  gap: 22px;
}

.breadcrumb-link {
  color: var(--muted-foreground);
  text-decoration: none;
  transition: color 0.15s ease;
}
.breadcrumb-link:hover {
  color: var(--primary);
}

.dashboard-header-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dashboard-header-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--red-bg);
  color: var(--destructive);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--destructive) 20%, transparent);
}

.live-telemetry-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--success-bg);
  color: var(--success);
  font-size: 0.74rem;
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--success) 24%, transparent);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse-ring 2s infinite ease-in-out;
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stat-card-filter {
  cursor: pointer;
  transition: all 0.18s ease;
}

.stat-card-filter:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.stat-card--active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, var(--card));
  box-shadow: 0 0 0 1px var(--primary);
}

.stat-icon--danger {
  background: var(--red-bg);
  color: var(--destructive);
}

.text-destructive {
  color: var(--destructive);
}
.text-warning {
  color: var(--warning);
}
.text-primary {
  color: var(--primary);
}

.filter-toolbar-card {
  padding: 22px 24px;
}

.filter-controls-row {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted-foreground);
  margin-bottom: 6px;
  display: block;
}

.search-group {
  flex: 2;
  min-width: 250px;
  margin-bottom: 0;
}

.select-group {
  flex: 1;
  min-width: 145px;
  margin-bottom: 0;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 11px;
  color: var(--muted-foreground);
  pointer-events: none;
}

.search-input {
  padding-left: 34px;
  padding-right: 30px;
}

.clear-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.15rem;
  color: var(--muted-foreground);
  cursor: pointer;
  line-height: 1;
}

.filter-reset-group {
  margin-bottom: 2px;
}

.reset-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
}

.table-card-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--card);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  border-bottom: 1px solid var(--border);
  background: var(--card);
  flex-wrap: wrap;
  gap: 10px;
}

.table-card-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-card-header-title h3 {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
}

.incident-counter-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--secondary);
  color: var(--muted-foreground);
}

.table-card-header-hint {
  font-size: 0.74rem;
  color: var(--primary);
  font-weight: 600;
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
  padding: 13px 20px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.error-table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 0.84rem;
  vertical-align: middle;
}

.error-row:hover {
  background: color-mix(in srgb, var(--secondary) 50%, var(--card));
}

.badge-critical {
  background: var(--red-bg);
  color: var(--destructive);
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.severity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.type-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.type-client {
  background: var(--info-bg);
  color: var(--info);
  border: 1px solid color-mix(in srgb, var(--info) 20%, transparent);
}

.type-server {
  background: var(--primary-bg);
  color: var(--primary);
  border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
}

.error-message-cell {
  max-width: 420px;
}

.error-message-text {
  font-weight: 700;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
  line-height: 1.35;
}

.error-path-sub {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.method-tag {
  font-weight: 800;
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--muted);
  color: var(--foreground);
}

.method-get { color: var(--info); }
.method-post { color: var(--success); }
.method-put { color: var(--warning); }
.method-delete { color: var(--destructive); }

.path-text {
  font-family: monospace;
  font-size: 0.76rem;
}

.status-code-tag {
  font-weight: 700;
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.actor-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.actor-name {
  font-weight: 700;
  color: var(--foreground);
  font-size: 0.82rem;
}

.actor-role {
  font-size: 0.7rem;
  text-transform: capitalize;
  color: var(--muted-foreground);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  text-transform: capitalize;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status--unresolved {
  background: var(--red-bg);
  color: var(--destructive);
}
.status--unresolved .status-dot { background: var(--destructive); }

.status--investigating {
  background: var(--warning-bg);
  color: var(--warning);
}
.status--investigating .status-dot { background: var(--warning); }

.status--resolved {
  background: var(--success-bg);
  color: var(--success);
}
.status--resolved .status-dot { background: var(--success); }

.status--ignored {
  background: var(--muted);
  color: var(--muted-foreground);
}
.status--ignored .status-dot { background: var(--muted-foreground); }

.time-cell {
  font-size: 0.8rem;
}

.time-main {
  font-weight: 700;
  color: var(--foreground);
}

.time-sub {
  font-size: 0.7rem;
  color: var(--muted-foreground);
  margin-top: 2px;
}

.action-btn-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-xs {
  font-size: 0.72rem;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-success {
  background: var(--success);
  color: #ffffff;
  border: none;
}
.btn-success:hover {
  filter: brightness(0.92);
}

.btn-danger-icon {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted-foreground);
  padding: 4px 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-danger-icon:hover {
  color: var(--destructive);
  border-color: var(--destructive);
  background: var(--red-bg);
}

.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-top: 1px solid var(--border);
  font-size: 0.82rem;
  flex-wrap: wrap;
  gap: 12px;
}

.page-count-text {
  color: var(--muted-foreground);
}
.page-count-text strong {
  color: var(--foreground);
}

.empty-state-box {
  padding: 60px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon-shield {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--success-bg);
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--success) 20%, transparent);
}

.empty-state-box h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
}

.empty-state-box p {
  color: var(--muted-foreground);
  font-size: 0.84rem;
  max-width: 440px;
  margin: 0;
}

/* Modal */
.inspect-modal-card {
  max-width: 760px;
  width: 100%;
}

.modal-section-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
  margin-bottom: 6px;
  display: block;
}

.modal-header-icon.icon--danger {
  background: var(--red-bg);
  color: var(--destructive);
}
.modal-header-icon.icon--critical {
  background: var(--red-bg);
  color: var(--destructive);
}
.modal-header-icon.icon--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.error-msg-banner {
  background: var(--red-bg);
  border: 1px solid color-mix(in srgb, var(--destructive) 25%, transparent);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-weight: 700;
  color: var(--destructive);
  font-size: 0.9rem;
  line-height: 1.45;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: var(--secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
}

.context-item label {
  font-size: 0.68rem;
  text-transform: uppercase;
  color: var(--muted-foreground);
  font-weight: 700;
  letter-spacing: 0.04em;
  display: block;
  margin-bottom: 3px;
}

.context-item span, .context-item code {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--foreground);
}

.context-item code {
  font-family: monospace;
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
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  padding: 14px 16px;
  border-radius: var(--radius-md);
  font-size: 0.74rem;
  max-height: 220px;
  overflow: auto;
  line-height: 1.5;
  font-family: monospace;
  border: 1px solid var(--sidebar-border);
}

.metadata-pre {
  background: var(--secondary);
  border: 1px solid var(--border);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 0.74rem;
  max-height: 150px;
  overflow: auto;
  font-family: monospace;
}

.resolution-editor-box {
  background: color-mix(in srgb, var(--primary) 6%, var(--card));
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.res-title {
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--foreground);
}

.resolved-by-notice {
  font-size: 0.76rem;
  color: var(--muted-foreground);
}

@media (max-width: 900px) {
  .context-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .filter-controls-row {
    flex-direction: column;
    align-items: stretch;
  }
  .search-group,
  .select-group {
    width: 100%;
    min-width: 0;
  }
  .context-grid {
    grid-template-columns: 1fr;
  }
  .error-table th,
  .error-table td {
    padding: 12px 14px;
  }
}
</style>
