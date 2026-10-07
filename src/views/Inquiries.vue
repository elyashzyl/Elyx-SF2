<template>
  <div class="inquiries-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <div class="breadcrumb">
          <span>Operations</span>
          <span class="sep">/</span>
          <span class="current">Support &amp; Inquiries Hub</span>
        </div>
        <h1>Helpdesk &amp; Support Inquiries</h1>
        <p>Comprehensive inquiry lifecycle management, real-time ticket triage, and multi-campus support telemetry.</p>
      </div>
      <div class="page-header-actions">
        <button @click="exportCsv" class="btn-secondary" :disabled="exporting">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {{ exporting ? 'Exporting…' : 'Export CSV' }}
        </button>
        <button @click="openCreateModal" class="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Inquiry
        </button>
      </div>
    </div>

    <!-- KPI Metric Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--blue">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Total Inquiries</span>
          <strong class="kpi-value">{{ stats.total }}</strong>
          <small class="kpi-subtext">All time filed tickets</small>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--amber">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Active / Open</span>
          <strong class="kpi-value text-amber">{{ stats.open }}</strong>
          <small class="kpi-subtext">Awaiting resolution</small>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--danger">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Urgent Priority</span>
          <strong class="kpi-value text-danger">{{ stats.urgent }}</strong>
          <small class="kpi-subtext">Immediate action required</small>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Resolution Rate</span>
          <strong class="kpi-value text-green">{{ stats.resolutionRate }}%</strong>
          <small class="kpi-subtext">{{ stats.finished }} completed</small>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon kpi-icon--purple">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Avg. Resolution</span>
          <strong class="kpi-value">{{ stats.avgResolutionHours }} hrs</strong>
          <small class="kpi-subtext">Average time to close</small>
        </div>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="card toolbar-card">
      <div class="toolbar-grid">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="filters.search"
            @input="debounceFetch"
            type="text"
            placeholder="Search by ticket subject, user, campus, or category…"
            class="search-input"
          />
          <button v-if="filters.search" @click="filters.search = ''; fetchInquiries()" class="clear-search-btn">&times;</button>
        </div>

        <div class="filter-controls">
          <select v-model="filters.status" @change="fetchInquiries" class="filter-select">
            <option value="all">All Statuses</option>
            <option value="open">Open Only</option>
            <option value="finished">Finished Only</option>
          </select>

          <select v-model="filters.priority" @change="fetchInquiries" class="filter-select">
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select v-model="filters.category" @change="fetchInquiries" class="filter-select">
            <option value="all">All Categories</option>
            <option value="payment">Payment &amp; Billing</option>
            <option value="license">License &amp; Plan</option>
            <option value="attendance">Daily Attendance</option>
            <option value="technical">Technical Issue</option>
            <option value="account">Account Access</option>
            <option value="feature_request">Feature Request</option>
            <option value="general">General Support</option>
          </select>

          <select v-if="auth.isSuperadmin" v-model="filters.schoolId" @change="fetchInquiries" class="filter-select">
            <option value="">All Campuses</option>
            <option v-for="sch in schoolsList" :key="sch.id" :value="sch.id">
              {{ sch.short || sch.name }}
            </option>
          </select>

          <select v-if="auth.isSuperadmin" v-model="filters.assigned_to" @change="fetchInquiries" class="filter-select">
            <option value="all">All Assignees</option>
            <option value="">Unassigned</option>
            <option v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
              {{ staff.name }}
            </option>
          </select>

          <button v-if="hasActiveFilters" @click="resetFilters" class="btn-xs btn-secondary">
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Bulk Actions Bar (Superadmin only) -->
      <div v-if="auth.isSuperadmin && selectedIds.length > 0" class="bulk-actions-bar">
        <div class="bulk-count">
          <strong>{{ selectedIds.length }}</strong> inquiries selected
        </div>
        <div class="bulk-buttons">
          <button @click="applyBulkStatus('finished')" class="btn-xs btn-primary" :disabled="bulkLoading">
            Mark Finished
          </button>
          <button @click="applyBulkStatus('open')" class="btn-xs btn-secondary" :disabled="bulkLoading">
            Reopen Selected
          </button>
          <button @click="selectedIds = []" class="btn-xs btn-secondary">
            Deselect All
          </button>
        </div>
      </div>
    </div>

    <!-- Main Inquiries Table -->
    <div class="card table-card">
      <div class="table-responsive">
        <table class="overview-table">
          <thead>
            <tr>
              <th v-if="auth.isSuperadmin" style="width: 38px; text-align: center;">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleSelectAll"
                />
              </th>
              <th style="width: 90px;">Priority</th>
              <th style="width: 100px;">Status</th>
              <th>Subject &amp; Requester</th>
              <th>Category</th>
              <th v-if="auth.isSuperadmin">Campus</th>
              <th v-if="auth.isSuperadmin">Assigned To</th>
              <th style="text-align: right;">Updated</th>
              <th style="width: 140px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr>
              <td :colspan="tableColspan" class="loading-cell">
                <div class="loading-spinner"></div>
                <span>Loading support inquiries…</span>
              </td>
            </tr>
          </tbody>
          <tbody v-else-if="inquiries.length > 0">
            <tr
              v-for="inq in inquiries"
              :key="inq.id"
              :class="{ 'row-active': activeInquiry?.id === inq.id, 'row-unread': inq.user_notified === 0 && inq.user_id === auth.user?.id }"
            >
              <td v-if="auth.isSuperadmin" style="text-align: center;">
                <input
                  type="checkbox"
                  :value="inq.id"
                  v-model="selectedIds"
                />
              </td>
              <td>
                <span class="priority-pill" :class="'priority-' + (inq.priority || 'medium')">
                  {{ (inq.priority || 'medium').toUpperCase() }}
                </span>
              </td>
              <td>
                <span class="status-pill" :class="inq.status === 'finished' ? 'status-pill--success' : 'status-pill--warning'">
                  {{ inq.status === 'finished' ? 'Finished' : 'Open' }}
                </span>
              </td>
              <td>
                <div class="ticket-subject-wrap">
                  <strong class="ticket-subject" @click="openDrawer(inq)">{{ inq.subject }}</strong>
                  <div class="ticket-requester-info">
                    <span>{{ inq.user_name }}</span>
                    <span class="role-badge">{{ inq.user_role }}</span>
                    <span v-if="inq.user_email" class="email-subtext">· {{ inq.user_email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="category-badge">{{ formatCategory(inq.category) }}</span>
              </td>
              <td v-if="auth.isSuperadmin">
                <span class="campus-tag">{{ inq.school_name || 'System General' }}</span>
              </td>
              <td v-if="auth.isSuperadmin">
                <span v-if="inq.assigned_to_name" class="assignee-text">{{ inq.assigned_to_name }}</span>
                <span v-else class="unassigned-text">Unassigned</span>
              </td>
              <td style="text-align: right;">
                <span class="time-text">{{ formatTimeAgo(inq.updated_at || inq.created_at) }}</span>
              </td>
              <td style="text-align: right;">
                <div class="table-actions-group">
                  <button @click="openDrawer(inq)" class="btn-xs btn-secondary" title="View thread and reply">
                    Open Thread
                  </button>
                  <button
                    v-if="auth.isSuperadmin && inq.status === 'open'"
                    @click="updateStatusQuick(inq.id, 'finished')"
                    class="btn-xs btn-primary"
                    title="Mark finished"
                  >
                    Resolve
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="tableColspan" class="empty-cell">
                <div class="empty-state-wrap">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <strong>No inquiries match your criteria</strong>
                  <p>Try clearing filters or search keywords, or submit a new ticket.</p>
                  <button @click="resetFilters" class="btn-xs btn-secondary">Clear Filters</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Ticket Detail & Conversation Drawer (Slide-Over Panel) -->
    <div v-if="activeInquiry" class="drawer-overlay" @click.self="closeDrawer">
      <div class="drawer-panel">
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="drawer-header-info">
            <div class="drawer-badge-group">
              <span class="priority-pill" :class="'priority-' + (activeInquiry.priority || 'medium')">
                {{ (activeInquiry.priority || 'medium').toUpperCase() }}
              </span>
              <span class="status-pill" :class="activeInquiry.status === 'finished' ? 'status-pill--success' : 'status-pill--warning'">
                {{ activeInquiry.status === 'finished' ? 'Finished' : 'Open' }}
              </span>
              <span class="category-badge">{{ formatCategory(activeInquiry.category) }}</span>
            </div>
            <h2 class="drawer-title">{{ activeInquiry.subject }}</h2>
            <div class="drawer-subtitle">
              <span>From: <strong>{{ activeInquiry.user_name }}</strong> ({{ activeInquiry.user_role }})</span>
              <span v-if="activeInquiry.school_name"> · {{ activeInquiry.school_name }}</span>
            </div>
          </div>
          <button @click="closeDrawer" class="drawer-close-btn" aria-label="Close panel">&times;</button>
        </div>

        <!-- Drawer Action Bar -->
        <div class="drawer-action-bar">
          <div v-if="auth.isSuperadmin" class="drawer-controls-left">
            <div class="drawer-assign-wrap">
              <label>Assignee:</label>
              <select v-model="selectedAssignee" @change="assignInquiry" :disabled="assigningStaff" class="filter-select">
                <option value="">Unassigned</option>
                <option v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
                  {{ staff.name }} ({{ staff.role }})
                </option>
              </select>
            </div>
          </div>

          <div class="drawer-controls-right">
            <button
              v-if="auth.isSuperadmin || activeInquiry.user_id === auth.user?.id"
              @click="toggleStatus(activeInquiry)"
              class="btn-sm"
              :class="activeInquiry.status === 'open' ? 'btn-primary' : 'btn-secondary'"
              :disabled="statusLoading"
            >
              {{ activeInquiry.status === 'open' ? '✓ Mark as Finished' : '↺ Reopen Ticket' }}
            </button>
            <button @click="showHistory = !showHistory" class="btn-sm btn-secondary">
              {{ showHistory ? 'Hide Audit Log' : 'Audit Log' }}
            </button>
          </div>
        </div>

        <!-- Audit History Timeline (Collapsible) -->
        <div v-if="showHistory" class="drawer-history-block">
          <h4 class="history-title">Status &amp; Assignment Audit Trail</h4>
          <div v-for="h in threadHistory" :key="h.id" class="history-item">
            <span class="history-dot"></span>
            <div class="history-detail">
              <strong>{{ h.changed_by_name || 'System' }}</strong>: {{ h.note }}
              <small class="history-time">{{ formatDate(h.created_at) }}</small>
            </div>
          </div>
          <div v-if="threadHistory.length === 0" class="history-empty">No status changes recorded yet.</div>
        </div>

        <!-- Messages Chat Stream -->
        <div class="drawer-chat-stream" ref="chatStreamRef">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="chat-bubble"
            :class="msg.sender_role === 'superadmin' ? 'chat-bubble--admin' : 'chat-bubble--user'"
          >
            <div class="bubble-header">
              <span class="bubble-sender">{{ msg.sender_name }} ({{ msg.sender_role }})</span>
              <span class="bubble-time">{{ formatDate(msg.created_at) }}</span>
            </div>
            <div class="bubble-body">
              <p>{{ msg.message }}</p>
              <div v-if="msg.attachment_url" class="attachment-preview">
                <a :href="msg.attachment_url" target="_blank" rel="noopener noreferrer" class="attachment-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span>{{ msg.attachment_name || 'Attached File' }}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Reply Composer -->
        <div class="drawer-composer">
          <form @submit.prevent="submitReply">
            <textarea
              v-model="replyText"
              rows="3"
              placeholder="Write your reply or instructions…"
              class="composer-textarea"
              required
            ></textarea>

            <div class="composer-footer">
              <div class="composer-att-wrap">
                <label class="btn-xs btn-secondary att-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span>{{ replyAttachment ? replyAttachment.name.slice(0, 15) + '…' : 'Attach' }}</span>
                  <input type="file" @change="onReplyFilePicked" style="display: none;" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
                </label>
                <button v-if="replyAttachment" type="button" @click="replyAttachment = null" class="clear-att-btn">&times;</button>
              </div>

              <button type="submit" class="btn-primary" :disabled="sendingReply || !replyText.trim()">
                {{ sendingReply ? 'Sending…' : 'Send Reply' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create New Inquiry Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="form-card create-inquiry-modal">
        <h3>Create Support Ticket</h3>
        <p class="modal-subtext">Submit a support request, payment query, or report a system concern to the platform superadmin.</p>

        <form @submit.prevent="submitNewInquiry">
          <div class="form-group">
            <label>Subject / Summary <span class="required">*</span></label>
            <input v-model="newForm.subject" type="text" placeholder="e.g. License renewal payment proof confirmation" required class="text-input" />
          </div>

          <div class="form-row-2col">
            <div class="form-group">
              <label>Category</label>
              <select v-model="newForm.category" class="filter-select">
                <option value="payment">Payment &amp; Billing</option>
                <option value="license">License &amp; Plan</option>
                <option value="attendance">Daily Attendance</option>
                <option value="technical">Technical Issue</option>
                <option value="account">Account Access</option>
                <option value="feature_request">Feature Request</option>
                <option value="general">General Support</option>
              </select>
            </div>

            <div class="form-group">
              <label>Priority</label>
              <select v-model="newForm.priority" class="filter-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Notification Email (Optional)</label>
            <input v-model="newForm.userEmail" type="email" placeholder="email@school.edu" class="text-input" />
          </div>

          <div class="form-group">
            <label>Detailed Message <span class="required">*</span></label>
            <textarea v-model="newForm.message" rows="4" placeholder="Describe the issue, steps to reproduce, or transaction reference..." required class="text-input" style="font-family: inherit;"></textarea>
          </div>

          <div class="form-group">
            <label>File Attachment (Max 5MB)</label>
            <input type="file" @change="onNewFilePicked" class="file-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
            <small v-if="newAttachment" style="color: var(--muted-foreground); margin-top: 4px; display: block;">
              Selected: {{ newAttachment.name }} ({{ Math.round(newAttachment.size / 1024) }} KB)
            </small>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="submittingNew">
              {{ submittingNew ? 'Submitting…' : 'Submit Inquiry' }}
            </button>
            <button type="button" @click="showCreateModal = false" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const loading = ref(false)
const bulkLoading = ref(false)
const exporting = ref(false)
const inquiries = ref([])
const selectedIds = ref([])
const schoolsList = ref([])
const staffMembers = ref([])

const stats = reactive({
  total: 0,
  open: 0,
  finished: 0,
  urgent: 0,
  high: 0,
  resolutionRate: 100,
  avgResolutionHours: 0
})

const filters = reactive({
  search: '',
  status: 'all',
  priority: 'all',
  category: 'all',
  assigned_to: 'all',
  schoolId: ''
})

let debounceTimer = null
function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchInquiries()
  }, 300)
}

const hasActiveFilters = computed(() => {
  return filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.category !== 'all' || filters.assigned_to !== 'all' || filters.schoolId
})

const tableColspan = computed(() => {
  return auth.isSuperadmin ? 9 : 6
})

const isAllSelected = computed(() => {
  return inquiries.value.length > 0 && selectedIds.value.length === inquiries.value.length
})

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < inquiries.value.length
})

function toggleSelectAll(e) {
  if (e.target.checked) {
    selectedIds.value = inquiries.value.map(i => i.id)
  } else {
    selectedIds.value = []
  }
}

function resetFilters() {
  filters.search = ''
  filters.status = 'all'
  filters.priority = 'all'
  filters.category = 'all'
  filters.assigned_to = 'all'
  filters.schoolId = ''
  fetchInquiries()
}

// Drawer state
const activeInquiry = ref(null)
const messages = ref([])
const threadHistory = ref([])
const showHistory = ref(false)
const selectedAssignee = ref('')
const assigningStaff = ref(false)
const statusLoading = ref(false)
const replyText = ref('')
const replyAttachment = ref(null)
const sendingReply = ref(false)
const chatStreamRef = ref(null)

// Create modal state
const showCreateModal = ref(false)
const submittingNew = ref(false)
const newAttachment = ref(null)
const newForm = reactive({
  subject: '',
  category: 'general',
  priority: 'medium',
  userEmail: auth.user?.email || '',
  message: ''
})

async function fetchStats() {
  try {
    const params = new URLSearchParams(auth.actorParams())
    if (filters.schoolId) params.append('schoolId', filters.schoolId)
    const res = await fetch(`/api/inquiries/stats?${params}`)
    if (res.ok) {
      const data = await res.json()
      stats.total = data.total || 0
      stats.open = data.open || 0
      stats.finished = data.finished || 0
      stats.urgent = data.urgent || 0
      stats.high = data.high || 0
      stats.resolutionRate = data.resolutionRate ?? 100
      stats.avgResolutionHours = data.avgResolutionHours || 0
    }
  } catch (err) {
    console.warn('Failed to fetch stats:', err)
  }
}

async function fetchInquiries() {
  loading.value = true
  try {
    const params = new URLSearchParams(auth.actorParams())
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority)
    if (filters.category && filters.category !== 'all') params.append('category', filters.category)
    if (filters.assigned_to && filters.assigned_to !== 'all') params.append('assigned_to', filters.assigned_to)
    if (filters.schoolId) params.append('schoolId', filters.schoolId)
    if (filters.search) params.append('search', filters.search.trim())

    const res = await fetch(`/api/inquiries?${params}`)
    if (res.ok) {
      inquiries.value = await res.json()
    }
    fetchStats()
  } catch (err) {
    console.error('Failed to load inquiries:', err)
  } finally {
    loading.value = false
  }
}

async function fetchSchools() {
  if (!auth.isSuperadmin) return
  try {
    const params = new URLSearchParams(auth.actorParams())
    const res = await fetch(`/api/schools?${params}`)
    if (res.ok) {
      schoolsList.value = await res.json()
    }
  } catch {}
}

async function fetchStaffMembers() {
  if (!auth.isSuperadmin) return
  try {
    const params = new URLSearchParams(auth.actorParams())
    const res = await fetch(`/api/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      staffMembers.value = data.filter(u => u.role === 'superadmin' || u.role === 'admin')
    }
  } catch {}
}

async function openDrawer(inq) {
  activeInquiry.value = inq
  selectedAssignee.value = inq.assigned_to || ''
  showHistory.value = false
  replyText.value = ''
  replyAttachment.value = null

  try {
    const params = new URLSearchParams(auth.actorParams())
    const res = await fetch(`/api/inquiries/${inq.id}?${params}`)
    if (res.ok) {
      const data = await res.json()
      activeInquiry.value = data.inquiry
      messages.value = data.messages || []
      selectedAssignee.value = data.inquiry.assigned_to || ''
      scrollChat()
    }
    fetchHistory(inq.id)
  } catch (err) {
    console.error('Error opening inquiry:', err)
  }
}

function closeDrawer() {
  activeInquiry.value = null
  fetchInquiries()
}

async function fetchHistory(id) {
  try {
    const params = new URLSearchParams(auth.actorParams())
    const res = await fetch(`/api/inquiries/${id}/history?${params}`)
    if (res.ok) {
      const data = await res.json()
      threadHistory.value = data.history || []
    }
  } catch {}
}

function scrollChat() {
  nextTick(() => {
    if (chatStreamRef.value) {
      chatStreamRef.value.scrollTop = chatStreamRef.value.scrollHeight
    }
  })
}

async function assignInquiry() {
  if (!activeInquiry.value || !auth.isSuperadmin) return
  assigningStaff.value = true
  try {
    const staff = staffMembers.value.find(s => s.id === selectedAssignee.value)
    const res = await fetch(`/api/inquiries/${activeInquiry.value.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...auth.actorParams(),
        assigned_to: selectedAssignee.value,
        assigned_to_name: staff ? staff.name : '',
        note: staff ? `Assigned to ${staff.name}` : 'Unassigned from support staff'
      })
    })
    if (res.ok) {
      const data = await res.json()
      activeInquiry.value = data.inquiry
      fetchHistory(activeInquiry.value.id)
      fetchInquiries()
    }
  } catch (err) {
    console.error('Error assigning inquiry:', err)
  } finally {
    assigningStaff.value = false
  }
}

async function toggleStatus(inq) {
  const next = inq.status === 'open' ? 'finished' : 'open'
  statusLoading.value = true
  try {
    const res = await fetch(`/api/inquiries/${inq.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...auth.actorParams(),
        status: next
      })
    })
    if (res.ok) {
      const data = await res.json()
      activeInquiry.value = data.inquiry
      fetchHistory(inq.id)
      fetchInquiries()
    }
  } catch (err) {
    console.error('Error toggling status:', err)
  } finally {
    statusLoading.value = false
  }
}

async function updateStatusQuick(id, status) {
  try {
    const res = await fetch(`/api/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...auth.actorParams(),
        status
      })
    })
    if (res.ok) {
      fetchInquiries()
    }
  } catch (err) {
    console.error('Quick status update failed:', err)
  }
}

async function applyBulkStatus(status) {
  if (selectedIds.value.length === 0) return
  bulkLoading.value = true
  try {
    const res = await fetch('/api/inquiries/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...auth.actorParams(),
        ids: selectedIds.value,
        status,
        note: `Bulk marked as ${status}`
      })
    })
    if (res.ok) {
      selectedIds.value = []
      fetchInquiries()
    }
  } catch (err) {
    console.error('Bulk update failed:', err)
  } finally {
    bulkLoading.value = false
  }
}

async function submitReply() {
  if (!activeInquiry.value || !replyText.value.trim()) return
  sendingReply.value = true
  try {
    const res = await fetch(`/api/inquiries/${activeInquiry.value.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...auth.actorParams(),
        message: replyText.value.trim(),
        attachment: replyAttachment.value
      })
    })
    if (res.ok) {
      const data = await res.json()
      if (data.message) {
        messages.value.push(data.message)
      }
      replyText.value = ''
      replyAttachment.value = null
      scrollChat()
      fetchInquiries()
    }
  } catch (err) {
    console.error('Failed to post reply:', err)
  } finally {
    sendingReply.value = false
  }
}

function onReplyFilePicked(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alert('File size exceeds 5MB limit')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    replyAttachment.value = {
      name: file.name,
      type: file.type,
      size: file.size,
      url: reader.result
    }
  }
  reader.readAsDataURL(file)
}

function openCreateModal() {
  newForm.subject = ''
  newForm.category = 'general'
  newForm.priority = 'medium'
  newForm.userEmail = auth.user?.email || ''
  newForm.message = ''
  newAttachment.value = null
  showCreateModal.value = true
}

function onNewFilePicked(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alert('File size exceeds 5MB limit')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    newAttachment.value = {
      name: file.name,
      type: file.type,
      size: file.size,
      url: reader.result
    }
  }
  reader.readAsDataURL(file)
}

async function submitNewInquiry() {
  if (!newForm.subject.trim() || !newForm.message.trim()) return
  submittingNew.value = true
  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...auth.actorParams(),
        subject: newForm.subject.trim(),
        category: newForm.category,
        priority: newForm.priority,
        userEmail: newForm.userEmail.trim(),
        message: newForm.message.trim(),
        attachment: newAttachment.value
      })
    })
    if (res.ok) {
      showCreateModal.value = false
      fetchInquiries()
    }
  } catch (err) {
    console.error('Failed to create inquiry:', err)
  } finally {
    submittingNew.value = false
  }
}

async function exportCsv() {
  exporting.value = true
  try {
    const params = new URLSearchParams(auth.actorParams())
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority)
    if (filters.category && filters.category !== 'all') params.append('category', filters.category)
    if (filters.assigned_to && filters.assigned_to !== 'all') params.append('assigned_to', filters.assigned_to)
    if (filters.schoolId) params.append('schoolId', filters.schoolId)
    if (filters.search) params.append('search', filters.search.trim())

    const res = await fetch(`/api/inquiries/export/csv?${params}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `elytrack-inquiries-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  } catch (err) {
    console.error('CSV export failed:', err)
  } finally {
    exporting.value = false
  }
}

function formatCategory(cat) {
  const map = {
    payment: 'Payment & Billing',
    license: 'License & Plan',
    attendance: 'Attendance',
    technical: 'Technical',
    account: 'Account',
    feature_request: 'Feature Request',
    general: 'General Support'
  }
  return map[cat] || (cat ? cat.toUpperCase() : 'General')
}

function formatDate(dtStr) {
  if (!dtStr) return '—'
  try {
    const d = new Date(dtStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dtStr
  }
}

function formatTimeAgo(dtStr) {
  if (!dtStr) return '—'
  try {
    const d = new Date(dtStr)
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return dtStr
  }
}

onMounted(() => {
  fetchInquiries()
  fetchSchools()
  fetchStaffMembers()
})
</script>

<style scoped>
.inquiries-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  margin-bottom: 4px;
}

.breadcrumb .sep {
  opacity: 0.5;
}

.breadcrumb .current {
  color: var(--foreground);
  font-weight: 600;
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon--blue {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.kpi-icon--amber {
  background: rgba(217, 119, 6, 0.12);
  color: #d97706;
}

.kpi-icon--danger {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.kpi-icon--green {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}

.kpi-icon--purple {
  background: rgba(147, 51, 234, 0.12);
  color: #9333ea;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-label {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1.2;
}

.kpi-subtext {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.text-amber {
  color: #d97706 !important;
}

.text-danger {
  color: #dc2626 !important;
}

.text-green {
  color: #16a34a !important;
}

/* Toolbar */
.toolbar-card {
  padding: 14px 18px;
}

.toolbar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.search-wrap {
  position: relative;
  flex: 1 1 280px;
  max-width: 440px;
}

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted-foreground);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 34px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.85rem;
  color: var(--foreground);
  transition: border-color 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.clear-search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-size: 1.1rem;
  cursor: pointer;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-select {
  padding: 7px 11px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.82rem;
  color: var(--foreground);
}

.bulk-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.bulk-count {
  font-size: 0.85rem;
  color: var(--foreground);
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

/* Table styles */
.table-card {
  padding: 0;
  overflow: hidden;
}

.ticket-subject-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ticket-subject {
  font-size: 0.92rem;
  color: var(--foreground);
  cursor: pointer;
  transition: color 0.15s ease;
}

.ticket-subject:hover {
  color: var(--primary);
  text-decoration: underline;
}

.ticket-requester-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: var(--muted-foreground);
}

.role-badge {
  display: inline-block;
  padding: 1px 5px;
  font-size: 0.68rem;
  text-transform: uppercase;
  font-weight: 700;
  border-radius: 4px;
  background: var(--muted);
  color: var(--foreground);
}

.email-subtext {
  font-size: 0.74rem;
}

.priority-pill {
  display: inline-block;
  padding: 3px 7px;
  font-size: 0.72rem;
  font-weight: 800;
  border-radius: 5px;
  letter-spacing: 0.04em;
}

.priority-urgent {
  background: rgba(220, 38, 38, 0.15);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.priority-high {
  background: rgba(234, 88, 12, 0.15);
  color: #ea580c;
  border: 1px solid rgba(234, 88, 12, 0.3);
}

.priority-medium {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.priority-low {
  background: var(--muted);
  color: var(--muted-foreground);
}

.status-pill {
  display: inline-block;
  padding: 3px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 9999px;
}

.status-pill--success {
  background: rgba(22, 163, 74, 0.15);
  color: #16a34a;
}

.status-pill--warning {
  background: rgba(217, 119, 6, 0.15);
  color: #d97706;
}

.category-badge {
  display: inline-block;
  padding: 2px 7px;
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 5px;
  background: var(--muted);
  color: var(--foreground);
}

.campus-tag {
  display: inline-block;
  padding: 2px 7px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 5px;
  background: var(--muted);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.assignee-text {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--foreground);
}

.unassigned-text {
  font-size: 0.82rem;
  color: var(--muted-foreground);
  font-style: italic;
}

.time-text {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  white-space: nowrap;
}

.table-actions-group {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.row-active {
  background: rgba(37, 99, 235, 0.05) !important;
}

.row-unread {
  font-weight: 600;
  background: rgba(217, 119, 6, 0.04);
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 44px 16px;
  color: var(--muted-foreground);
}

.empty-state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Slide-Over Drawer */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  width: 100%;
  max-width: 580px;
  height: 100%;
  background: var(--card);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer-header {
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.drawer-badge-group {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.drawer-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0 0 4px 0;
}

.drawer-subtitle {
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.drawer-close-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--muted-foreground);
  cursor: pointer;
  line-height: 1;
}

.drawer-action-bar {
  padding: 10px 22px;
  background: var(--muted);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.drawer-controls-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-assign-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
}

.drawer-controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-history-block {
  padding: 12px 22px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--border);
  max-height: 180px;
  overflow-y: auto;
}

.history-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  color: var(--muted-foreground);
  margin: 0 0 8px 0;
  font-weight: 700;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.78rem;
  margin-bottom: 6px;
}

.history-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  margin-top: 5px;
}

.history-detail {
  display: flex;
  flex-direction: column;
}

.history-time {
  font-size: 0.7rem;
  color: var(--muted-foreground);
}

.drawer-chat-stream {
  flex: 1;
  padding: 20px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-bubble {
  max-width: 82%;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 0.88rem;
  line-height: 1.45;
}

.chat-bubble--admin {
  align-self: flex-start;
  background: var(--muted);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.chat-bubble--user {
  align-self: flex-end;
  background: var(--primary);
  color: var(--primary-foreground, #ffffff);
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.72rem;
  opacity: 0.8;
  margin-bottom: 4px;
}

.bubble-sender {
  font-weight: 700;
}

.bubble-body p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.attachment-preview {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed rgba(255, 255, 255, 0.2);
}

.chat-bubble--admin .attachment-preview {
  border-top-color: var(--border);
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  text-decoration: underline;
  color: inherit;
}

.drawer-composer {
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  background: var(--card);
}

.composer-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--foreground);
  font-family: inherit;
  font-size: 0.86rem;
  resize: vertical;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.composer-att-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.att-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.clear-att-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  font-size: 1rem;
}

/* Create Modal */
.create-inquiry-modal {
  max-width: 520px;
}

.file-input {
  font-size: 0.82rem;
  color: var(--foreground);
}
</style>
