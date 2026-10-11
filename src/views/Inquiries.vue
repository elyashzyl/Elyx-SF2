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
        <h1 class="page-title">Helpdesk &amp; Support Inquiries</h1>
        <p class="page-subtitle">Centralized ticket triage, communication telemetry, and multi-campus support operations.</p>
      </div>
      <div class="page-header-actions">
        <button v-if="auth.isAdmin" @click="exportCsv" class="btn-secondary" :disabled="exporting">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{{ exporting ? 'Exporting…' : 'Export CSV' }}</span>
        </button>
        <button @click="openCreateModal" class="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Inquiry</span>
        </button>
      </div>
    </div>

    <!-- KPI Metric Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-tag kpi-tag--neutral">Total Tickets</span>
          <div class="kpi-icon-badge kpi-icon--teal">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num">{{ stats.total }}</span>
        </div>
        <span class="kpi-subtext">All-time filed inquiries</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-tag kpi-tag--warning">Active Triage</span>
          <div class="kpi-icon-badge kpi-icon--warning">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num text-warning">{{ stats.open }}</span>
        </div>
        <span class="kpi-subtext">Awaiting staff resolution</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-tag kpi-tag--danger">Urgent Escalation</span>
          <div class="kpi-icon-badge kpi-icon--danger">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num text-danger">{{ stats.urgent }}</span>
        </div>
        <span class="kpi-subtext">Immediate action required</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-tag kpi-tag--success">Resolution Rate</span>
          <div class="kpi-icon-badge kpi-icon--success">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num text-success">{{ stats.resolutionRate }}%</span>
        </div>
        <span class="kpi-subtext">{{ stats.finished }} completed tickets</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-tag kpi-tag--neutral">Turnaround Time</span>
          <div class="kpi-icon-badge kpi-icon--teal">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-main-num">{{ stats.avgResolutionHours }}</span>
          <span class="kpi-unit">hrs</span>
        </div>
        <span class="kpi-subtext">Average time to close</span>
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
            placeholder="Search tickets, requesters, campus, or category…"
            class="search-input"
          />
          <button v-if="filters.search" @click="filters.search = ''; fetchInquiries()" class="clear-search-btn" title="Clear search">&times;</button>
        </div>

        <div class="filter-controls">
          <div class="filter-item">
            <select v-model="filters.status" @change="fetchInquiries" class="filter-select">
              <option value="all">All Statuses</option>
              <option value="open">Open Only</option>
              <option value="finished">Finished Only</option>
            </select>
          </div>

          <div class="filter-item">
            <select v-model="filters.priority" @change="fetchInquiries" class="filter-select">
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div class="filter-item">
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
          </div>

          <div v-if="auth.isSuperadmin" class="filter-item">
            <select v-model="filters.schoolId" @change="fetchInquiries" class="filter-select">
              <option value="">All Campuses</option>
              <option v-for="sch in schoolsList" :key="sch.id" :value="sch.id">
                {{ sch.short || sch.name }}
              </option>
            </select>
          </div>

          <div v-if="auth.isSuperadmin" class="filter-item">
            <select v-model="filters.assigned_to" @change="fetchInquiries" class="filter-select">
              <option value="all">All Assignees</option>
              <option value="">Unassigned</option>
              <option v-for="staff in staffMembers" :key="staff.id" :value="staff.id">
                {{ staff.name }}
              </option>
            </select>
          </div>

          <button v-if="hasActiveFilters" @click="resetFilters" class="btn-xs btn-secondary reset-btn" title="Reset all filters">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Bulk Actions Bar (Superadmin only) -->
      <div v-if="auth.isSuperadmin && selectedIds.length > 0" class="bulk-actions-bar">
        <div class="bulk-count">
          <span class="bulk-badge">{{ selectedIds.length }}</span>
          <span>inquiries selected for bulk action</span>
        </div>
        <div class="bulk-buttons">
          <button @click="applyBulkStatus('finished')" class="btn-xs btn-primary" :disabled="bulkLoading">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Mark Finished</span>
          </button>
          <button @click="applyBulkStatus('open')" class="btn-xs btn-secondary" :disabled="bulkLoading">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            <span>Reopen Selected</span>
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
              <th v-if="auth.isSuperadmin" class="col-check">
                <input
                  type="checkbox"
                  class="custom-checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleSelectAll"
                  aria-label="Select all inquiries"
                />
              </th>
              <th class="col-priority">Priority</th>
              <th class="col-status">Status</th>
              <th class="col-main">Subject &amp; Requester</th>
              <th class="col-category">Category</th>
              <th v-if="auth.isSuperadmin" class="col-campus">Campus</th>
              <th v-if="auth.isSuperadmin" class="col-assignee">Assigned To</th>
              <th class="col-updated">Updated</th>
              <th class="col-actions">Action</th>
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
              <td v-if="auth.isSuperadmin" class="col-check">
                <input
                  type="checkbox"
                  class="custom-checkbox"
                  :value="inq.id"
                  v-model="selectedIds"
                  :aria-label="`Select ticket ${inq.subject}`"
                />
              </td>
              <td class="col-priority">
                <span class="priority-pill" :class="'priority-' + (inq.priority || 'medium')">
                  {{ (inq.priority || 'medium').toUpperCase() }}
                </span>
              </td>
              <td class="col-status">
                <span class="status-pill" :class="inq.status === 'finished' ? 'status-pill--success' : 'status-pill--warning'">
                  <span class="status-dot"></span>
                  {{ inq.status === 'finished' ? 'Finished' : 'Open' }}
                </span>
              </td>
              <td class="col-main">
                <div class="ticket-subject-wrap">
                  <div class="ticket-subject" @click="openDrawer(inq)" :title="inq.subject">
                    {{ inq.subject }}
                  </div>
                  <div class="ticket-requester-info">
                    <span class="requester-name">{{ inq.user_name }}</span>
                    <span class="role-badge">{{ inq.user_role }}</span>
                    <span v-if="inq.user_email" class="email-subtext">· {{ inq.user_email }}</span>
                  </div>
                </div>
              </td>
              <td class="col-category">
                <span class="category-badge">{{ formatCategory(inq.category) }}</span>
              </td>
              <td v-if="auth.isSuperadmin" class="col-campus">
                <span class="campus-tag">{{ inq.school_name || 'System General' }}</span>
              </td>
              <td v-if="auth.isSuperadmin" class="col-assignee">
                <span v-if="inq.assigned_to_name" class="assignee-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {{ inq.assigned_to_name }}
                </span>
                <span v-else class="unassigned-text">Unassigned</span>
              </td>
              <td class="col-updated">
                <span class="time-text">{{ formatTimeAgo(inq.updated_at || inq.created_at) }}</span>
              </td>
              <td class="col-actions">
                <div class="table-actions-group">
                  <button @click="openDrawer(inq)" class="btn-xs btn-secondary" title="View thread and reply">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>Thread</span>
                  </button>
                  <button
                    v-if="auth.isSuperadmin && inq.status === 'open'"
                    @click="updateStatusQuick(inq.id, 'finished')"
                    class="btn-xs btn-primary"
                    title="Mark finished"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Resolve</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="tableColspan" class="empty-cell">
                <div class="empty-state-wrap">
                  <div class="empty-icon-box">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <h4>No inquiries found</h4>
                  <p>No tickets match your active filter parameters or keyword search.</p>
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
                <span class="status-dot"></span>
                {{ activeInquiry.status === 'finished' ? 'Finished' : 'Open' }}
              </span>
              <span class="category-badge">{{ formatCategory(activeInquiry.category) }}</span>
            </div>
            <h2 class="drawer-title">{{ activeInquiry.subject }}</h2>
            <div class="drawer-subtitle">
              <span>Submitted by <strong>{{ activeInquiry.user_name }}</strong> ({{ activeInquiry.user_role }})</span>
              <span v-if="activeInquiry.school_name"> · {{ activeInquiry.school_name }}</span>
              <span v-if="activeInquiry.user_email"> · {{ activeInquiry.user_email }}</span>
            </div>
          </div>
          <button @click="closeDrawer" class="drawer-close-btn" aria-label="Close panel" title="Close drawer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- Drawer Action Bar -->
        <div class="drawer-action-bar">
          <div v-if="auth.isSuperadmin" class="drawer-controls-left">
            <div class="drawer-assign-wrap">
              <label class="assign-label">Assignee:</label>
              <select v-model="selectedAssignee" @change="assignInquiry" :disabled="assigningStaff" class="filter-select select-compact">
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
              class="btn-xs"
              :class="activeInquiry.status === 'open' ? 'btn-primary' : 'btn-secondary'"
              :disabled="statusLoading"
            >
              <svg v-if="activeInquiry.status === 'open'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              <span>{{ activeInquiry.status === 'open' ? 'Mark Finished' : 'Reopen Ticket' }}</span>
            </button>
            <button @click="showHistory = !showHistory" class="btn-xs btn-secondary" :class="{ 'btn-active': showHistory }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{{ showHistory ? 'Hide Trail' : 'Audit Trail' }}</span>
            </button>
          </div>
        </div>

        <!-- Audit History Timeline (Collapsible) -->
        <div v-if="showHistory" class="drawer-history-block">
          <div class="history-header">
            <h4 class="history-title">Status &amp; Assignment Audit Trail</h4>
          </div>
          <div class="history-timeline">
            <div v-for="h in threadHistory" :key="h.id" class="history-item">
              <div class="history-node">
                <span class="history-dot"></span>
              </div>
              <div class="history-detail">
                <div class="history-note">
                  <span class="history-actor">{{ h.changed_by_name || 'System' }}</span>
                  <span class="history-text">{{ h.note }}</span>
                </div>
                <small class="history-time">{{ formatDate(h.created_at) }}</small>
              </div>
            </div>
          </div>
          <div v-if="threadHistory.length === 0" class="history-empty">No status modifications recorded yet.</div>
        </div>

        <!-- Messages Chat Stream -->
        <div class="drawer-chat-stream" ref="chatStreamRef">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="chat-bubble-container"
            :class="msg.sender_role === 'superadmin' ? 'bubble-align-staff' : 'bubble-align-user'"
          >
            <div
              class="chat-bubble"
              :class="msg.sender_role === 'superadmin' ? 'chat-bubble--admin' : 'chat-bubble--user'"
            >
              <div class="bubble-header">
                <span class="bubble-sender">
                  <span class="sender-role-tag" :class="msg.sender_role === 'superadmin' ? 'tag-staff' : 'tag-user'">
                    {{ msg.sender_role === 'superadmin' ? 'Support Staff' : 'Requester' }}
                  </span>
                  {{ msg.sender_name }}
                </span>
                <span class="bubble-time">{{ formatDate(msg.created_at) }}</span>
              </div>
              <div class="bubble-body">
                <p>{{ msg.message }}</p>
                <div v-if="msg.attachment_url" class="attachment-preview">
                  <Attachment variant="preview" :attachment="msg" />
                </div>
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
              placeholder="Write your response, resolution notes, or instructions…"
              class="composer-textarea"
              required
            ></textarea>

            <div class="composer-footer">
              <div class="composer-att-wrap">
                <Attachment
                  variant="inline"
                  v-model="replyAttachment"
                  button-label="Attach File"
                  @error="onAttachmentError"
                />
              </div>

              <button type="submit" class="btn-xs btn-primary composer-send-btn" :disabled="sendingReply || (!replyText.trim() && !replyAttachment)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{{ sendingReply ? 'Sending…' : 'Send Reply' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create New Inquiry Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="form-card create-inquiry-modal">
        <div class="modal-header-row">
          <div>
            <h3>Create Support Ticket</h3>
            <p class="modal-subtext">Submit a support request, payment query, or report a system concern to the platform superadmin.</p>
          </div>
          <button type="button" @click="showCreateModal = false" class="modal-close-icon" aria-label="Close modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="submitNewInquiry">
          <div class="form-group">
            <label>Subject / Summary <span class="required">*</span></label>
            <input v-model="newForm.subject" type="text" placeholder="e.g. License renewal payment proof confirmation" required class="text-input" />
          </div>

          <div class="form-row-2col">
            <div class="form-group">
              <label>Category</label>
              <select v-model="newForm.category" class="filter-select full-width">
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
              <select v-model="newForm.priority" class="filter-select full-width">
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
            <label>Attachment (Optional: Screenshot, receipt, or file, max 5MB)</label>
            <Attachment
              variant="dropzone"
              v-model="newAttachment"
              @error="onAttachmentError"
            />
          </div>

          <div class="form-actions">
            <button type="button" @click="showCreateModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="submittingNew">
              {{ submittingNew ? 'Submitting…' : 'Submit Inquiry' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import Attachment from '../components/Attachment.vue'

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

function onAttachmentError(err) {
  alert(err || 'Failed to attach file')
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

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
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

.page-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--foreground);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.25;
}

.page-subtitle {
  font-size: 0.82rem;
  color: var(--muted-foreground);
  margin: 4px 0 0 0;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.16s ease;
  min-width: 0;
}

.kpi-card:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.kpi-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.kpi-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.kpi-tag--neutral {
  background: var(--muted);
  color: var(--muted-foreground);
}

.kpi-tag--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.kpi-tag--danger {
  background: var(--red-bg);
  color: var(--destructive);
}

.kpi-tag--success {
  background: var(--success-bg);
  color: var(--success);
}

.kpi-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon--teal {
  background: var(--primary-bg);
  color: var(--primary);
}

.kpi-icon--warning {
  background: var(--warning-bg);
  color: var(--warning);
}

.kpi-icon--danger {
  background: var(--red-bg);
  color: var(--destructive);
}

.kpi-icon--success {
  background: var(--success-bg);
  color: var(--success);
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 6px;
  margin-bottom: 2px;
}

.kpi-main-num {
  font-family: 'Manrope', sans-serif;
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.kpi-unit {
  font-size: 0.74rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.kpi-subtext {
  font-size: 0.72rem;
  color: var(--muted-foreground);
  display: block;
}

.text-warning {
  color: var(--warning) !important;
}

.text-danger {
  color: var(--destructive) !important;
}

.text-success {
  color: var(--success) !important;
}

/* Toolbar */
.toolbar-card {
  padding: 16px 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
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
  flex: 1 1 260px;
  max-width: 420px;
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
  height: 35px;
  padding: 0 32px 0 34px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--foreground);
  transition: all 0.14s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--muted-foreground);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.clear-search-btn:hover {
  color: var(--foreground);
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-select {
  height: 35px;
  padding: 0 10px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--foreground);
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 35px;
}

/* Bulk Actions Bar */
.bulk-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--primary-bg);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
  border-radius: var(--radius-sm);
  animation: fadeIn 0.18s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.bulk-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--foreground);
}

.bulk-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

/* Table styles */
.table-card {
  padding: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-responsive {
  overflow-x: auto;
  width: 100%;
}

.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.overview-table th {
  padding: 12px 18px;
  background: var(--muted);
  border-bottom: 1px solid var(--border);
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-foreground);
  text-align: left;
  white-space: nowrap;
}

.overview-table td {
  padding: 13px 18px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  color: var(--foreground);
  transition: background 0.12s ease;
}

.overview-table tbody tr:hover {
  background: color-mix(in srgb, var(--secondary) 50%, transparent);
}

.overview-table tbody tr:last-child td {
  border-bottom: none;
}

/* Column Widths & Alignments */
.col-check {
  width: 38px;
  text-align: center;
  padding-left: 14px;
  padding-right: 6px;
}

.col-priority {
  width: 88px;
  white-space: nowrap;
}

.col-status {
  width: 96px;
  white-space: nowrap;
}

.col-category {
  width: 130px;
  white-space: nowrap;
}

.col-campus {
  width: 140px;
  white-space: nowrap;
}

.col-assignee {
  width: 140px;
  white-space: nowrap;
}

.col-updated {
  width: 96px;
  text-align: right;
  white-space: nowrap;
}

.col-actions {
  width: 156px;
  text-align: right;
  white-space: nowrap;
}

.custom-checkbox {
  width: 15px;
  height: 15px;
  accent-color: var(--primary);
  cursor: pointer;
  vertical-align: middle;
}

/* Badges & Pills */
.priority-pill {
  display: inline-block;
  padding: 2px 7px;
  font-size: 0.65rem;
  font-weight: 800;
  border-radius: 5px;
  letter-spacing: 0.05em;
  line-height: 1.25;
}

.priority-urgent {
  background: var(--red-bg);
  color: var(--destructive);
  border: 1px solid color-mix(in srgb, var(--destructive) 30%, transparent);
}

.priority-high {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
}

.priority-medium {
  background: var(--primary-bg);
  color: var(--primary);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
}

.priority-low {
  background: var(--muted);
  color: var(--muted-foreground);
  border: 1px solid var(--border);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: 0.68rem;
  font-weight: 700;
  border-radius: 999px;
  line-height: 1.3;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.status-pill--success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid color-mix(in srgb, var(--success) 25%, transparent);
}

.status-pill--warning {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid color-mix(in srgb, var(--warning) 25%, transparent);
}

.ticket-subject-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ticket-subject {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--foreground);
  cursor: pointer;
  transition: color 0.14s ease;
  line-height: 1.35;
}

.ticket-subject:hover {
  color: var(--primary);
  text-decoration: underline;
}

.ticket-requester-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.74rem;
  color: var(--muted-foreground);
}

.requester-name {
  font-weight: 600;
  color: var(--foreground);
}

.role-badge {
  display: inline-block;
  padding: 1px 5px;
  font-size: 0.62rem;
  text-transform: uppercase;
  font-weight: 700;
  border-radius: 4px;
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
}

.email-subtext {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.category-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 6px;
  background: var(--muted);
  color: var(--foreground);
  border: 1px solid var(--border);
}

.campus-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 6px;
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
}

.assignee-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--foreground);
}

.unassigned-text {
  font-size: 0.76rem;
  color: var(--muted-foreground);
  font-style: italic;
}

.time-text {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  white-space: nowrap;
}

.table-actions-group {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.row-active {
  background: color-mix(in srgb, var(--primary-bg) 60%, transparent) !important;
  box-shadow: inset 3px 0 0 var(--primary);
}

.row-unread {
  font-weight: 600;
  background: color-mix(in srgb, var(--warning-bg) 35%, transparent);
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 48px 16px;
  color: var(--muted-foreground);
}

.empty-state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  max-width: 340px;
  margin: 0 auto;
}

.empty-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--muted);
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.empty-state-wrap h4 {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--foreground);
  margin: 0;
}

.empty-state-wrap p {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  margin: 0 0 10px 0;
}

/* Slide-Over Drawer */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 17, 18, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-panel {
  width: 100%;
  max-width: 620px;
  height: 100%;
  background: var(--card);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  animation: slideInDrawer 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideInDrawer {
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
  gap: 14px;
  background: var(--card);
}

.drawer-header-info {
  min-width: 0;
  flex: 1;
}

.drawer-badge-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.drawer-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0 0 6px 0;
  line-height: 1.35;
  word-break: break-word;
}

.drawer-subtitle {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  line-height: 1.4;
}

.drawer-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.drawer-close-btn:hover {
  border-color: var(--destructive);
  color: var(--destructive);
  background: var(--red-bg);
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
  gap: 8px;
}

.assign-label {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.select-compact {
  height: 30px;
  font-size: 0.75rem;
  padding: 0 8px;
}

.drawer-controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-active {
  border-color: var(--primary) !important;
  color: var(--primary) !important;
  background: var(--primary-bg) !important;
}

/* History Timeline Block */
.drawer-history-block {
  padding: 14px 22px;
  background: var(--background);
  border-bottom: 1px solid var(--border);
  max-height: 200px;
  overflow-y: auto;
}

.history-header {
  margin-bottom: 8px;
}

.history-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--muted-foreground);
  margin: 0;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 2px solid var(--border);
  margin-left: 6px;
  padding-left: 14px;
}

.history-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.history-node {
  position: absolute;
  left: -19px;
  top: 4px;
}

.history-dot {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--card);
  border: 2px solid var(--primary);
}

.history-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-note {
  font-size: 0.76rem;
  color: var(--foreground);
}

.history-actor {
  font-weight: 700;
  margin-right: 4px;
}

.history-time {
  font-size: 0.68rem;
  color: var(--muted-foreground);
}

.history-empty {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  font-style: italic;
}

/* Chat Stream */
.drawer-chat-stream {
  flex: 1;
  padding: 20px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--background);
}

.chat-bubble-container {
  display: flex;
  width: 100%;
}

.bubble-align-staff {
  justify-content: flex-start;
}

.bubble-align-user {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 84%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.5;
  box-shadow: var(--shadow-xs);
}

.chat-bubble--admin {
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--foreground);
  border-bottom-left-radius: 4px;
}

.chat-bubble--user {
  background: var(--primary);
  color: var(--primary-foreground, #ffffff);
  border-bottom-right-radius: 4px;
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.7rem;
  opacity: 0.85;
  margin-bottom: 6px;
}

.bubble-sender {
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sender-role-tag {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 4px;
}

.tag-staff {
  background: var(--primary-bg);
  color: var(--primary);
}

.tag-user {
  background: rgba(255, 255, 255, 0.22);
  color: inherit;
}

.bubble-time {
  font-size: 0.68rem;
  white-space: nowrap;
}

.bubble-body p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.attachment-preview {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed rgba(255, 255, 255, 0.25);
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
  font-weight: 600;
}

/* Reply Composer */
.drawer-composer {
  padding: 16px 22px;
  border-top: 1px solid var(--border);
  background: var(--card);
}

.composer-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--background);
  color: var(--foreground);
  font-family: inherit;
  font-size: 0.84rem;
  line-height: 1.45;
  resize: vertical;
  min-height: 72px;
  transition: all 0.14s ease;
}

.composer-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.composer-att-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.att-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.clear-att-btn {
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
}

.clear-att-btn:hover {
  color: var(--destructive);
}

.composer-send-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Create Inquiry Modal */
.create-inquiry-modal {
  width: 100%;
  max-width: 560px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 26px 28px;
  box-shadow: var(--shadow-xl);
}

.modal-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.modal-header-row h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--foreground);
  margin: 0;
}

.modal-subtext {
  font-size: 0.78rem;
  color: var(--muted-foreground);
  margin: 4px 0 0 0;
}

.modal-close-icon {
  background: none;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
}

.modal-close-icon:hover {
  color: var(--foreground);
  background: var(--muted);
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.full-width {
  width: 100%;
}

.file-upload-wrap {
  padding: 8px 12px;
  background: var(--background);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
}

.file-input {
  font-size: 0.78rem;
  color: var(--foreground);
}

.attachment-info-tag {
  display: inline-block;
  margin-top: 5px;
  font-size: 0.72rem;
  color: var(--primary);
  font-weight: 600;
}

/* Responsive Media Queries */
@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }

  .page-header-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-start;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-wrap {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-grid {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .reset-btn {
    grid-column: span 2;
    justify-content: center;
  }

  .form-row-2col {
    grid-template-columns: 1fr;
  }

  .drawer-panel {
    max-width: 100vw;
    width: 100vw;
  }

  .drawer-header,
  .drawer-action-bar,
  .drawer-composer,
  .drawer-chat-stream {
    padding-left: 16px;
    padding-right: 16px;
  }

  .overview-table {
    min-width: 780px;
  }
}
</style>
