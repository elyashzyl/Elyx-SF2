<template>
  <div class="management-page">
    <div class="page-header">
      <div class="header-left">
        <h2>License &amp; Subscription Management</h2>
        <p class="subtitle">Control institutional seat capacity, DepEd SF2 modules, renewal cycles, and subscription keys.</p>
      </div>
      <div class="header-actions">
        <div v-if="!auth.isSuperadmin" class="read-only-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Read-Only License View</span>
        </div>
        <button v-if="auth.isSuperadmin" class="btn btn-secondary" @click="openIssueModal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Issue License</span>
        </button>
        <button v-if="auth.isSuperadmin" class="btn btn-primary" @click="openActivateModal">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Activate License Key</span>
        </button>
      </div>
    </div>

    <!-- Active License Hero Card (For School Admin / Selected School) -->
    <div v-if="activeLicense" class="license-hero-card" :class="[ 'tier--' + activeLicense.plan_tier, { 'is-expired': activeLicense.is_expired } ]">
      <div class="hero-top-row">
        <div class="tier-identity">
          <span class="tier-pill">{{ planTierName(activeLicense.plan_tier) }}</span>
          <span class="status-indicator" :class="'status--' + activeLicense.status">
            <span class="dot"></span>
            <span>{{ activeLicense.status.toUpperCase() }}</span>
          </span>
          <span v-if="activeLicense.is_trial" class="trial-pill">{{ activeLicense.trial_days || 'Configured' }}-Day Free Trial</span>
        </div>

        <div class="license-meta-keys">
          <span class="key-label">Active License Key:</span>
          <code class="license-key-code">{{ activeLicense.license_key }}</code>
          <button type="button" class="copy-key-btn" @click="copyKey(activeLicense.license_key)" title="Copy Key">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="hero-metrics-grid">
        <div class="metric-block">
          <span class="metric-title">Validity &amp; Expiry</span>
          <div class="metric-value-row">
            <span class="metric-primary-num">{{ activeLicense.days_remaining }}</span>
            <span class="metric-unit">days left</span>
          </div>
          <small class="metric-foot">Valid until {{ formatDate(activeLicense.expires_at) }}</small>
        </div>

        <div class="metric-block">
          <span class="metric-title">Faculty Advisers Capacity</span>
          <div class="metric-value-row">
            <span class="metric-primary-num">{{ usage.teachers || 0 }}</span>
            <span class="metric-capacity">/ {{ activeLicense.max_teachers }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(100, ((usage.teachers || 0) / activeLicense.max_teachers) * 100) + '%' }"></div>
          </div>
        </div>

        <div class="metric-block">
          <span class="metric-title">Student Population Cap</span>
          <div class="metric-value-row">
            <span class="metric-primary-num">{{ usage.students || 0 }}</span>
            <span class="metric-capacity">/ {{ activeLicense.max_students }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(100, ((usage.students || 0) / activeLicense.max_students) * 100) + '%' }"></div>
          </div>
        </div>

        <div class="metric-block">
          <span class="metric-title">DepEd Module Access</span>
          <div class="modules-chip-list">
            <span class="module-chip" :class="{ enabled: activeLicense.features?.sf2_export }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 4px; vertical-align: -1px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>SF2 Automated</span>
            </span>
            <span class="module-chip" :class="{ enabled: activeLicense.features?.sardo_radar }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 4px; vertical-align: -1px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>SARDO Radar</span>
            </span>
            <span class="module-chip" :class="{ enabled: activeLicense.features?.analytics }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 4px; vertical-align: -1px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Trend Forecaster</span>
            </span>
            <span class="module-chip" :class="{ enabled: activeLicense.features?.audit_logs }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right: 4px; vertical-align: -1px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Audit Telemetry</span>
            </span>
          </div>
        </div>
      </div>

      <div class="hero-actions-bar">
        <div class="hero-school-name">
          <span class="school-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 21h18"></path>
              <path d="M5 21V7l7-4 7 4v14"></path>
              <path d="M9 10h1"></path>
              <path d="M14 10h1"></path>
              <path d="M9 14h1"></path>
              <path d="M14 14h1"></path>
              <path d="M10 21v-4a2 2 0 0 1 4 0v4"></path>
            </svg>
          </span>
          <strong>{{ currentSchool?.name || 'School Node' }}</strong>
          <span v-if="currentSchool?.school_id">· DepEd ID: {{ currentSchool.school_id }}</span>
        </div>

        <div v-if="auth.isSuperadmin" class="hero-btns">
          <button v-if="activeLicense.is_trial" class="btn btn-sm btn-secondary" @click="extendTrial">
            <span>Extend Trial</span>
          </button>
          <button v-if="activeLicense.status === 'active'" class="btn btn-sm btn-danger" @click="suspendLicense(activeLicense.id)">
            <span>Stop / Suspend License</span>
          </button>
          <button v-if="activeLicense.status === 'suspended'" class="btn btn-sm btn-success" @click="resumeLicense(activeLicense.id)">
            <span>Resume License</span>
          </button>
          <button class="btn btn-sm btn-primary" @click="openRenewModal">
            <span>Renew Subscription</span>
          </button>
        </div>
        <div v-else class="hero-readonly-note">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>License terms, renewals, and key activations are managed centrally by the platform superadmin.</span>
        </div>
      </div>
    </div>

    <!-- Database Subscription Plans Table -->
    <div v-if="auth.isAdmin" class="card" style="margin-top: 24px;">
      <div class="card-header-row">
        <div>
          <h3>Database Subscription Plans &amp; Pricing Tiers</h3>
          <p class="desc">Real-time subscription quotas, pricing, and feature modules directly from the database.</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Plan Tier</th>
              <th>Name</th>
              <th>Monthly Price</th>
              <th>Annual Rate</th>
              <th>Max Teachers</th>
              <th>Max Students</th>
              <th>Trial</th>
              <th v-if="auth.isSuperadmin">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in availablePlans" :key="p.id">
              <td><code>{{ p.tier }}</code></td>
              <td>
                <strong>{{ p.name }}</strong>
                <small v-if="p.tag" style="display: block; color: var(--muted-foreground);">Tag: {{ p.tag }}</small>
              </td>
              <td>₱{{ Number(p.price_monthly || 0).toLocaleString() }} / mo</td>
              <td>
                <strong>₱{{ Number(p.price_annual_monthly || 0).toLocaleString() }} / mo</strong>
                <small style="display: block; color: var(--muted-foreground);">₱{{ Number(p.billing_annual_total || 0).toLocaleString() }} / {{ p.billing_months || 'configured' }}-month term</small>
              </td>
              <td>{{ p.max_teachers }}</td>
              <td>{{ p.max_students }}</td>
              <td>{{ p.trial_days }} days</td>
              <td v-if="auth.isSuperadmin">
                <div class="table-actions">
                  <button class="btn-icon" @click="openEditPlanModal(p)" title="Edit Plan Details in Database">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </button>
                  <button class="btn-icon icon-btn--danger" @click="deletePlan(p)" title="Delete Subscription Plan">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Official School Payment Options & QR Codes -->
    <div class="card" style="margin-top: 24px;">
      <div class="card-header-row" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <span>Official School Payment Options &amp; QR Codes</span>
            <span class="badge badge-payment-count">{{ paymentMethods.length }} Available</span>
          </h3>
          <p class="desc">
            Directly pay for plan renewals and upgrades via bank transfer or scan official QR codes. No need to wait on email threads.
          </p>
        </div>
        <div v-if="auth.isSuperadmin" class="card-header-actions">
          <button class="btn btn-sm btn-primary" @click="openAddPaymentModal" type="button">
            <span>+ Add Payment Option / QR</span>
          </button>
        </div>
      </div>

      <div v-if="paymentMethods.length === 0" class="empty-payments-box">
        <p>No payment options configured yet.</p>
        <button v-if="auth.isSuperadmin" class="btn btn-sm btn-primary" @click="openAddPaymentModal" style="margin-top: 8px;">
          Add First Payment Option
        </button>
      </div>

      <div v-else class="payment-methods-grid">
        <div
          v-for="pm in paymentMethods"
          :key="pm.id"
          class="payment-method-card"
          :class="{ 'payment-inactive': !pm.is_active }"
        >
          <div class="pm-top-row">
            <div class="pm-type-badge" :class="'type--' + pm.type">
              {{ formatPaymentType(pm.type) }}
            </div>
            <div v-if="auth.isSuperadmin" class="pm-admin-status">
              <span class="status-indicator" :class="pm.is_active ? 'status--active' : 'status--expired'">
                <span class="dot"></span>
                <span>{{ pm.is_active ? 'Active' : 'Disabled' }}</span>
              </span>
            </div>
          </div>

          <h4 class="pm-bank-name">{{ pm.bank_name }}</h4>

          <div class="pm-details-box">
            <div class="pm-detail-item">
              <span class="pm-detail-label">Account Name</span>
              <strong class="pm-detail-value">{{ pm.account_name }}</strong>
            </div>

            <div class="pm-detail-item">
              <span class="pm-detail-label">Account / Mobile Number</span>
              <div class="pm-account-number-row">
                <code class="pm-account-num">{{ pm.account_number }}</code>
                <button
                  class="btn-copy-account"
                  @click="copyAccountNumber(pm)"
                  :title="'Copy ' + pm.account_number"
                  type="button"
                >
                  <span>{{ copiedMethodId === pm.id ? 'Copied!' : 'Copy' }}</span>
                </button>
              </div>
            </div>

            <div v-if="pm.instructions" class="pm-instructions">
              <strong>Instructions:</strong> {{ pm.instructions }}
            </div>
          </div>

          <!-- QR Code Preview if present -->
          <div v-if="pm.qr_image_url" class="pm-qr-preview-box">
            <img
              :src="pm.qr_image_url"
              :alt="pm.bank_name + ' QR Code'"
              class="pm-qr-thumbnail"
              @click="openQrPreview(pm)"
              title="Click to enlarge QR Code"
            />
            <small class="pm-qr-hint" @click="openQrPreview(pm)" style="display: inline-flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Click to scan / enlarge</span>
            </small>
          </div>

          <!-- Superadmin Management Actions -->
          <div v-if="auth.isSuperadmin" class="pm-card-actions">
            <button
              class="btn btn-sm btn-secondary"
              @click="openEditPaymentModal(pm)"
              :disabled="paymentActionId === pm.id || submitting"
              type="button"
            >
              {{ paymentActionId === pm.id ? 'Saving…' : 'Edit' }}
            </button>
            <button
              class="btn btn-sm"
              :class="pm.is_active ? 'btn-danger' : 'btn-success'"
              @click="togglePaymentActive(pm)"
              :disabled="paymentActionId === pm.id"
              type="button"
            >
              {{ paymentActionId === pm.id ? 'Updating…' : (pm.is_active ? 'Disable' : 'Enable') }}
            </button>
            <button
              class="btn btn-sm btn-icon icon-btn--danger"
              @click="deletePaymentMethod(pm)"
              :disabled="paymentActionId === pm.id"
              title="Delete"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscription lifecycle: school admins submit payment for verification; superadmins review it. -->
    <div class="card" style="margin-top: 24px;">
      <div class="card-header-row" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3>Subscription &amp; Payment Requests</h3>
          <p class="desc">Submit a payment reference after paying through an official channel. A superadmin verifies it before the license is activated or renewed.</p>
        </div>
        <button v-if="!auth.isSuperadmin" class="btn btn-sm btn-primary" type="button" @click="openSubscriptionRequestModal">Submit Payment</button>
      </div>
      <div v-if="auth.isSuperadmin && subscriptionRequests.length" class="table-wrapper">
        <table class="data-table">
          <thead><tr><th>School</th><th>Request</th><th>Plan</th><th>Amount</th><th>Reference</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="request in subscriptionRequests" :key="request.id">
              <td><strong>{{ request.school_name || request.school_id }}</strong></td>
              <td>{{ formatRequestType(request.request_type) }}</td>
              <td>{{ request.plan_name || request.plan_tier }}<small style="display:block;color:var(--muted-foreground);">{{ request.billing_cycle }}</small></td>
              <td>₱{{ Number(request.amount || 0).toLocaleString() }}</td>
              <td><code>{{ request.payment_reference || 'Proof attached' }}</code></td>
              <td><span class="status-indicator" :class="'status--' + request.status"><span class="dot"></span>{{ request.status }}</span></td>
              <td>{{ formatDate(request.created_at) }}</td>
              <td class="table-action-cell">
                <button v-if="request.status === 'pending'" class="btn btn-sm btn-primary" type="button" @click="openReviewModal(request)">Review</button>
                <button v-else class="btn btn-sm btn-secondary" type="button" @click="openReviewModal(request)">Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="!auth.isSuperadmin && subscriptionRequests.length" class="subscription-request-list">
        <div v-for="request in subscriptionRequests" :key="request.id" class="subscription-request-row">
          <div>
            <strong>{{ formatRequestType(request.request_type) }} · {{ request.plan_name || request.plan_tier }}</strong>
            <div style="font-size: 0.85rem; color: var(--muted-foreground); margin-top: 2px;">
              {{ request.billing_cycle }} · ₱{{ Number(request.amount || 0).toLocaleString() }}
              · Ref: <code>{{ request.payment_reference || 'Attached' }}</code>
              · {{ formatDate(request.created_at) }}
            </div>
            <div v-if="request.notes && request.status !== 'pending'" style="font-size: 0.8rem; color: var(--muted-foreground); margin-top: 4px;">
              <strong>Remarks:</strong> {{ request.notes }}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="status-indicator" :class="'status--' + request.status"><span class="dot"></span>{{ request.status }}</span>
            <button
              v-if="request.status === 'pending'"
              class="btn btn-xs btn-secondary"
              @click="cancelSubscriptionRequest(request)"
              type="button"
            >
              Cancel
            </button>
            <button
              v-if="request.proof_url"
              class="btn btn-xs btn-secondary"
              @click="openProofEnlarge(request.proof_url)"
              type="button"
            >
              Proof
            </button>
          </div>
        </div>
      </div>
      <p v-else class="empty-state">{{ auth.isSuperadmin ? 'No subscription payment requests.' : 'No payment request submitted yet.' }}</p>
    </div>

    <!-- Subscription Status History & Superadmin Audit Trail Card -->
    <div class="card" style="margin-top: 24px;">
      <div class="card-header-row" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Subscription Status History &amp; Audit Trail</span>
            <span class="badge badge-payment-count">{{ subscriptionHistory.length }} Records</span>
          </h3>
          <p class="desc">
            Audited lifecycle timeline of payment submissions, superadmin review decisions, license activations, and status transitions.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <select v-model="historyStatusFilter" class="form-select-sm" style="font-size: 0.85rem; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--background); color: var(--foreground);">
            <option value="all">All Lifecycle States</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button class="btn btn-sm btn-secondary" @click="loadSubscriptionHistory" type="button" title="Refresh Audit Trail">
            Refresh
          </button>
        </div>
      </div>

      <div v-if="filteredSubscriptionHistory.length" class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th v-if="auth.isSuperadmin">School</th>
              <th>Status Transition</th>
              <th>Reviewed / Action By</th>
              <th>Audit Notes &amp; Remarks</th>
              <th>Details &amp; Metadata</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in filteredSubscriptionHistory" :key="h.id">
              <td v-if="auth.isSuperadmin">
                <strong>{{ h.school_name || h.school_id || 'System' }}</strong>
              </td>
              <td>
                <div class="history-status-transition">
                  <span v-if="h.from_status && h.from_status !== 'none'" class="status-indicator" :class="'status--' + h.from_status">
                    <span class="dot"></span>{{ h.from_status }}
                  </span>
                  <span v-if="h.from_status && h.from_status !== 'none'" class="transition-arrow">&rarr;</span>
                  <span class="status-indicator" :class="'status--' + h.to_status">
                    <span class="dot"></span>{{ h.to_status }}
                  </span>
                </div>
              </td>
              <td>
                <strong>{{ h.actor_name || 'System' }}</strong>
                <small v-if="h.actor_role" style="display: block; color: var(--muted-foreground); text-transform: capitalize;">{{ h.actor_role }}</small>
              </td>
              <td>
                <span>{{ h.notes || '—' }}</span>
              </td>
              <td>
                <div v-if="h.metadata" class="history-meta-chips">
                  <span v-if="h.metadata.plan_tier" class="meta-chip">Plan: {{ h.metadata.plan_tier }}</span>
                  <span v-if="h.metadata.amount" class="meta-chip">₱{{ Number(h.metadata.amount).toLocaleString() }}</span>
                  <span v-if="h.metadata.payment_reference" class="meta-chip">Ref: {{ h.metadata.payment_reference }}</span>
                  <span v-if="h.metadata.billing_cycle" class="meta-chip">{{ h.metadata.billing_cycle }}</span>
                  <span v-if="h.metadata.expires_at" class="meta-chip">Expires: {{ h.metadata.expires_at }}</span>
                </div>
                <span v-else style="color: var(--muted-foreground);">—</span>
              </td>
              <td>
                <small>{{ formatDateTime(h.created_at) }}</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty-state">No subscription status history recorded yet.</p>
    </div>

    <!-- MODAL: SUBMIT SUBSCRIPTION PAYMENT (School admin) -->
    <div v-if="showSubscriptionRequestModal" class="modal-overlay" @click.self="showSubscriptionRequestModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Submit Subscription Payment</h3>
          <button class="modal-close" type="button" @click="showSubscriptionRequestModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitSubscriptionRequest">
          <div class="modal-body">
            <p class="desc">Pay using one of the official payment options above, then enter the payment reference below. The superadmin will verify the request.</p>
            <div class="form-group"><label>Request type *</label><select v-model="subscriptionForm.request_type" required><option value="activation">New activation</option><option value="renewal">Renewal</option><option value="upgrade">Plan upgrade</option></select></div>
            <div class="form-group"><label>Plan *</label><select v-model="subscriptionForm.plan_tier" required><option v-for="plan in availablePlans" :key="plan.id" :value="plan.tier">{{ plan.name }} (₱{{ Number(subscriptionForm.billing_cycle === 'monthly' ? plan.price_monthly : plan.billing_annual_total).toLocaleString() }})</option></select></div>
            <div class="form-group"><label>Billing cycle *</label><select v-model="subscriptionForm.billing_cycle"><option value="annual">Annual plan term</option><option value="monthly">Monthly</option></select></div>
            <div class="form-group"><label>Payment channel</label><select v-model="subscriptionForm.payment_method_id"><option value="">Not specified</option><option v-for="method in paymentMethods.filter(pm => pm.is_active)" :key="method.id" :value="method.id">{{ method.bank_name }}</option></select></div>
            <div class="form-group"><label>Payment reference *</label><input v-model.trim="subscriptionForm.payment_reference" type="text" maxlength="255" placeholder="Reference number or transaction ID" required /></div>
            
            <div class="form-group">
              <label>Proof of Payment (Screenshot / Receipt)</label>
              <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleProofUpload"
                  id="proof-file-upload"
                  style="display: none;"
                />
                <button type="button" class="btn btn-sm btn-secondary" @click="triggerProofFileInput" style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Upload Receipt Image</span>
                </button>
                <small style="color: var(--muted-foreground);">Upload a receipt image or paste URL below</small>
              </div>
              <input v-model.trim="subscriptionForm.proof_url" type="text" placeholder="Or paste proof URL (https://... or data:image/...)" />
              <div v-if="subscriptionForm.proof_url" style="margin-top: 8px; display: flex; align-items: center; gap: 10px;">
                <img v-if="isImageProof(subscriptionForm.proof_url)" :src="subscriptionForm.proof_url" alt="Receipt Preview" style="max-height: 80px; border-radius: 6px; border: 1px solid var(--border);" />
                <button type="button" class="btn btn-xs btn-secondary" @click="subscriptionForm.proof_url = ''">Remove Proof</button>
              </div>
            </div>

            <div class="form-group"><label>Notes</label><textarea v-model.trim="subscriptionForm.notes" rows="2" placeholder="Additional payment details"></textarea></div>
          </div>
          <div class="modal-footer"><button type="button" class="btn btn-secondary" @click="showSubscriptionRequestModal = false">Cancel</button><button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? 'Submitting…' : 'Submit for Verification' }}</button></div>
        </form>
      </div>
    </div>

    <!-- MODAL: REVIEW SUBSCRIPTION PAYMENT (Superadmin) -->
    <div v-if="auth.isSuperadmin && showReviewModal && activeReviewRequest" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal-card" style="max-width: 580px;">
        <div class="modal-header">
          <h3>Review Subscription Payment Request</h3>
          <button class="modal-close" type="button" @click="showReviewModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="review-meta-grid">
            <div class="review-meta-item">
              <span class="review-meta-label">School:</span>
              <strong>{{ activeReviewRequest.school_name || activeReviewRequest.school_id }}</strong>
            </div>
            <div class="review-meta-item">
              <span class="review-meta-label">Request Type:</span>
              <span class="tier-pill">{{ formatRequestType(activeReviewRequest.request_type) }}</span>
            </div>
            <div class="review-meta-item">
              <span class="review-meta-label">Plan &amp; Cycle:</span>
              <strong>{{ activeReviewRequest.plan_name || activeReviewRequest.plan_tier }} ({{ activeReviewRequest.billing_cycle }})</strong>
            </div>
            <div class="review-meta-item">
              <span class="review-meta-label">Amount:</span>
              <strong style="color: var(--primary);">₱{{ Number(activeReviewRequest.amount || 0).toLocaleString() }}</strong>
            </div>
          </div>

          <div class="review-payment-box">
            <div class="review-payment-row">
              <span class="review-meta-label">Payment Channel:</span>
              <span>{{ activeReviewRequest.payment_bank_name || activeReviewRequest.payment_method_id || 'Not specified' }}</span>
            </div>
            <div class="review-payment-row">
              <span class="review-meta-label">Payment Reference:</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <code class="license-key-code">{{ activeReviewRequest.payment_reference || 'None' }}</code>
                <button v-if="activeReviewRequest.payment_reference" type="button" class="btn-copy-account" @click="copyText(activeReviewRequest.payment_reference, 'Payment reference copied!')">Copy</button>
              </div>
            </div>
            <div v-if="activeReviewRequest.requested_by_name" class="review-payment-row">
              <span class="review-meta-label">Submitted By:</span>
              <span>{{ activeReviewRequest.requested_by_name }} ({{ formatDate(activeReviewRequest.created_at) }})</span>
            </div>
            <div v-if="activeReviewRequest.notes" class="review-payment-row">
              <span class="review-meta-label">Requester Notes:</span>
              <em>{{ activeReviewRequest.notes }}</em>
            </div>
          </div>

          <!-- Proof Document Preview -->
          <div v-if="activeReviewRequest.proof_url" class="review-proof-container">
            <span class="review-meta-label" style="display: block; margin-bottom: 6px;">Submitted Proof of Payment:</span>
            <div style="text-align: center;">
              <img
                v-if="isImageProof(activeReviewRequest.proof_url)"
                :src="activeReviewRequest.proof_url"
                alt="Proof of Payment"
                class="review-proof-img"
                @click="openProofEnlarge(activeReviewRequest.proof_url)"
                title="Click to enlarge receipt"
              />
              <div v-else style="padding: 10px; background: var(--secondary); border-radius: 6px;">
                <a :href="activeReviewRequest.proof_url" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">
                  Open External Proof Link &rarr;
                </a>
              </div>
            </div>
          </div>

          <!-- Review Remarks -->
          <div class="form-group" style="margin-top: 16px;">
            <label>Superadmin Review Remarks &amp; Audit Notes *</label>
            <textarea
              v-model.trim="reviewNotesInput"
              rows="2"
              placeholder="e.g. Verified payment via online banking ledger on 2026-10-06"
              :disabled="activeReviewRequest.status !== 'pending'"
            ></textarea>
            <small style="color: var(--muted-foreground);">These notes are permanently saved into the audit history trail.</small>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: space-between;">
          <button type="button" class="btn btn-secondary" @click="showReviewModal = false">Close</button>
          <div v-if="activeReviewRequest.status === 'pending'" style="display: flex; gap: 8px;">
            <button
              type="button"
              class="btn btn-danger"
              :disabled="submitting"
              @click="submitRequestDecision('rejected')"
            >
              {{ submitting ? 'Processing…' : 'Reject Request' }}
            </button>
            <button
              type="button"
              class="btn btn-success"
              :disabled="submitting"
              @click="submitRequestDecision('approved')"
            >
              {{ submitting ? 'Processing…' : 'Approve & Activate' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: ENLARGE PROOF PREVIEW -->
    <div v-if="showProofEnlargeModal && enlargedProofUrl" class="modal-overlay" @click.self="showProofEnlargeModal = false">
      <div class="modal-card" style="max-width: 680px; text-align: center;">
        <div class="modal-header">
          <h3>Payment Proof Document</h3>
          <button class="modal-close" @click="showProofEnlargeModal = false">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <img
            :src="enlargedProofUrl"
            alt="Payment Proof Enlarge"
            style="max-width: 100%; max-height: 70vh; border-radius: 8px; border: 1px solid var(--border);"
          />
        </div>
        <div class="modal-footer" style="justify-content: center;">
          <button class="btn btn-secondary" @click="showProofEnlargeModal = false">Close</button>
        </div>
      </div>
    </div>

    <!-- MODAL: EDIT PLAN (Superadmin) -->
    <div v-if="auth.isSuperadmin && showEditPlanModal" class="modal-overlay" @click.self="showEditPlanModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Edit Plan (Database): {{ editPlanForm.tier }}</h3>
          <button class="modal-close" @click="showEditPlanModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleSavePlan">
          <div class="modal-body">
            <div class="form-group">
              <label>Plan Name</label>
              <input v-model="editPlanForm.name" type="text" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <input v-model="editPlanForm.description" type="text" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Monthly Price (₱)</label>
                <input v-model.number="editPlanForm.price_monthly" type="number" min="0" required />
              </div>
              <div class="form-group">
                <label>Annual Rate / Month (₱)</label>
                <input v-model.number="editPlanForm.price_annual_monthly" type="number" min="0" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Annual Total (₱)</label>
                <input v-model.number="editPlanForm.billing_annual_total" type="number" min="0" required />
              </div>
              <div class="form-group">
                <label>Annual Term (months)</label>
                <input v-model.number="editPlanForm.billing_months" type="number" min="1" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Trial Days</label>
                <input v-model.number="editPlanForm.trial_days" type="number" min="0" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Max Teachers</label>
                <input v-model.number="editPlanForm.max_teachers" type="number" min="1" required />
              </div>
              <div class="form-group">
                <label>Max Students</label>
                <input v-model.number="editPlanForm.max_students" type="number" min="1" required />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditPlanModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving…' : 'Save Changes to Database' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="auth.isSuperadmin" class="card" style="margin-top: 24px;">
      <div class="card-header-row">
        <div>
          <h3>All Institutional Licenses (Superadmin)</h3>
          <p class="desc">Master directory of deployed campus contracts, active seats, and license expirations.</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>School Name</th>
              <th>License Key</th>
              <th>Plan Tier</th>
              <th>Status</th>
              <th>Advisers</th>
              <th>Students</th>
              <th>Expires At</th>
              <th>Days Left</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lic in allLicenses" :key="lic.id">
              <td>
                <strong>{{ lic.school_name || 'Unassigned Node' }}</strong>
                <small v-if="lic.school_short" style="display: block; color: var(--muted-foreground);">{{ lic.school_short }}</small>
              </td>
              <td><code>{{ lic.license_key }}</code></td>
              <td>
                <span class="tier-badge" :class="'tier--' + lic.plan_tier">{{ planTierName(lic.plan_tier) }}</span>
              </td>
              <td>
                <span class="status-indicator" :class="'status--' + lic.status">
                  <span class="dot"></span>
                  <span>{{ lic.status }}</span>
                </span>
              </td>
              <td>{{ lic.teacher_count || 0 }} / {{ lic.max_teachers }}</td>
              <td>{{ lic.student_count || 0 }} / {{ lic.max_students }}</td>
              <td>{{ formatDate(lic.expires_at) }}</td>
              <td>
                <span :class="{ 'text-danger': lic.days_remaining <= 15 }">{{ lic.days_remaining }} days</span>
              </td>
              <td>
                <div class="table-actions">
                  <button v-if="lic.status === 'active'" class="btn-icon icon-btn--danger" @click="suspendLicense(lic.id)" title="Stop / Suspend License">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  </button>
                  <button v-else-if="lic.status === 'suspended'" class="btn-icon icon-btn--success" @click="resumeLicense(lic.id)" title="Resume License">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </button>
                  <button class="btn-icon" @click="editLicense(lic)" title="Modify License">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </button>
                  <button class="btn-icon" @click="quickRenew(lic)" title="Quick renew using the plan term">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                  </button>
                  <button v-if="['active', 'suspended', 'trial'].includes(lic.status)" class="btn-icon icon-btn--warning" @click="cancelLicense(lic)" title="Cancel License">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </button>
                  <button class="btn-icon icon-btn--danger" @click="deleteLicense(lic)" title="Delete License Permanently">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!allLicenses.length">
              <td colspan="9" style="text-align: center; padding: 32px; color: var(--muted-foreground);">
                No license records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: ACTIVATE LICENSE KEY -->
    <div v-if="auth.isSuperadmin && showActivateModal" class="modal-overlay" @click.self="showActivateModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Activate License Key</h3>
          <button class="modal-close" @click="showActivateModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleActivateKey">
          <div class="modal-body">
            <p style="font-size: 0.85rem; color: var(--muted-foreground); margin-bottom: 16px;">
              Enter the subscription license key provided with your institutional deployment contract or teacher registration receipt.
            </p>
            <div class="form-group">
              <label for="activate-key">License Key *</label>
              <input
                id="activate-key"
                v-model="activateKeyInput"
                type="text"
                placeholder="Enter the license key provided by the platform administrator"
                required
                style="text-transform: uppercase; font-family: monospace; font-size: 1rem; font-weight: 700;"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showActivateModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Activating…' : 'Activate License' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: ISSUE NEW LICENSE (Superadmin) -->
    <div v-if="auth.isSuperadmin && showIssueModal" class="modal-overlay" @click.self="showIssueModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Issue New School License</h3>
          <button class="modal-close" @click="showIssueModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleIssueLicense">
          <div class="modal-body">
            <div class="form-group">
              <label for="issue-school">Target School *</label>
              <select id="issue-school" v-model="issueForm.school_id" required>
                <option value="" disabled>Select school…</option>
                <option v-for="s in schoolsList" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.short || s.school_id || 'Campus' }})
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="issue-tier">Plan Tier *</label>
                <select id="issue-tier" v-model="issueForm.plan_tier" @change="onTierChange">
                  <option v-for="p in availablePlans" :key="p.tier" :value="p.tier">
                    {{ p.name }} (₱{{ Number(p.price_annual_monthly || 0).toLocaleString() }}/mo)
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="issue-cycle">Billing Cycle</label>
                <select id="issue-cycle" v-model="issueForm.billing_cycle" required>
                  <option value="annual">Annual plan term</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="issue-duration">Annual term duration (months)</label>
              <input id="issue-duration" v-model.number="issueForm.duration_months" type="number" min="1" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="issue-teachers">Max Teachers/Advisers</label>
                <input id="issue-teachers" v-model.number="issueForm.max_teachers" type="number" min="1" required />
              </div>
              <div class="form-group">
                <label for="issue-students">Max Students</label>
                <input id="issue-students" v-model.number="issueForm.max_students" type="number" min="1" required />
              </div>
            </div>

            <div class="form-group">
              <label for="issue-notes">Contract / DepEd Procurement Notes</label>
              <input id="issue-notes" v-model="issueForm.notes" type="text" placeholder="Optional contract or procurement reference" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showIssueModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Issuing…' : 'Generate & Issue License' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: RENEW / EXTEND -->
    <div v-if="auth.isSuperadmin && showRenewModal" class="modal-overlay" @click.self="showRenewModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Extend Subscription Term</h3>
          <button class="modal-close" @click="showRenewModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleRenew">
          <div class="modal-body">
            <p style="font-size: 0.85rem; color: var(--muted-foreground); margin-bottom: 16px;">
              Extend this campus's operational validity for another academic term.
            </p>
            <div class="form-group">
              <label for="renew-duration">Extension Period (months) *</label>
              <input id="renew-duration" v-model.number="renewMonths" type="number" min="1" required />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showRenewModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Extending…' : 'Confirm Renewal' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: ADD / EDIT PAYMENT METHOD (Superadmin) -->
    <div v-if="auth.isSuperadmin && showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ paymentForm.id ? 'Edit Payment Option' : 'Add Official Payment Option / QR' }}</h3>
          <button class="modal-close" @click="showPaymentModal = false">&times;</button>
        </div>
        <form @submit.prevent="handleSavePaymentMethod">
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Payment Method Type *</label>
                <select v-model="paymentForm.type" required>
                  <option value="bank_transfer">Bank Transfer (BDO, BPI, Landbank, etc.)</option>
                  <option value="gcash_qr">GCash QR / Mobile</option>
                  <option value="maya_qr">Maya QR / Mobile</option>
                  <option value="qr_ph">QR Ph (National Standard QR)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Bank or Provider Name *</label>
                <input v-model="paymentForm.bank_name" type="text" placeholder="e.g. BDO Unibank, GCash, BPI" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Account Holder Name *</label>
                <input v-model="paymentForm.account_name" type="text" placeholder="Enter account holder name" required />
              </div>
              <div class="form-group">
                <label>Account / Mobile Number *</label>
                <input v-model="paymentForm.account_number" type="text" placeholder="e.g. 0012-3456-7890 or 0917-000-0000" required />
              </div>
            </div>

            <div class="form-group">
              <label>QR Code Image</label>
              <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleQrUpload"
                  id="qr-file-upload"
                  style="display: none;"
                />
                <button type="button" class="btn btn-sm btn-secondary" @click="triggerQrFileInput" style="display: inline-flex; align-items: center; gap: 6px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span>Upload QR Code Image</span>
                </button>
                <small style="color: var(--muted-foreground);">Upload a QR file (.png, .jpg) or paste URL below</small>
              </div>
              <input
                v-model="paymentForm.qr_image_url"
                type="text"
                placeholder="Or paste QR image URL (https://... or data:image/...)"
              />
              <div v-if="paymentForm.qr_image_url" style="margin-top: 8px; text-align: center;">
                <img :src="paymentForm.qr_image_url" alt="QR Preview" style="max-height: 120px; border-radius: 8px; border: 1px solid var(--border);" />
              </div>
            </div>

            <div class="form-group">
              <label>Instructions &amp; Payment Notes for School Admins</label>
              <textarea
                v-model="paymentForm.instructions"
                rows="2"
                placeholder="e.g. Include School Name or DepEd ID in the reference note, then message proof in chat."
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Display Sort Order</label>
                <input v-model.number="paymentForm.sort_order" type="number" min="0" />
              </div>
              <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 26px;">
                <input type="checkbox" id="pm-active" v-model="paymentForm.is_active" style="width: 18px; height: 18px;" />
                <label for="pm-active" style="margin-bottom: 0; cursor: pointer;">Available for Schools to View</label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showPaymentModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Saving…' : 'Save Payment Option' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: ENLARGE QR CODE PREVIEW -->
    <div v-if="showQrPreviewModal && selectedQrMethod" class="modal-overlay" @click.self="showQrPreviewModal = false">
      <div class="modal-card" style="max-width: 420px; text-align: center;">
        <div class="modal-header">
          <h3>Scan to Pay: {{ selectedQrMethod.bank_name }}</h3>
          <button class="modal-close" @click="showQrPreviewModal = false">&times;</button>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 24px;">
          <img
            :src="selectedQrMethod.qr_image_url"
            :alt="selectedQrMethod.bank_name + ' QR'"
            style="max-width: 260px; max-height: 260px; border-radius: 12px; border: 2px solid var(--border); box-shadow: 0 4px 14px rgba(0,0,0,0.1);"
          />
          <div>
            <strong>{{ selectedQrMethod.account_name }}</strong>
            <p style="margin: 4px 0; font-family: monospace; font-size: 1.05rem; font-weight: 700;">{{ selectedQrMethod.account_number }}</p>
            <small style="color: var(--muted-foreground);">{{ selectedQrMethod.instructions }}</small>
          </div>
        </div>
        <div class="modal-footer" style="justify-content: center;">
          <button class="btn btn-secondary" @click="showQrPreviewModal = false">Close</button>
          <button class="btn btn-primary" @click="copyAccountNumber(selectedQrMethod)">
            {{ copiedMethodId === selectedQrMethod.id ? 'Copied!' : 'Copy Account Number' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'

const auth = useAuthStore()
const { showSuccess, showError } = useToast()

const activeLicense = ref(null)
const usage = reactive({ teachers: 0, students: 0 })
const currentSchool = ref(null)
const allLicenses = ref([])
const schoolsList = ref([])
const availablePlans = ref([])

const paymentMethods = ref([])
const subscriptionRequests = ref([])
const subscriptionHistory = ref([])
const historyStatusFilter = ref('all')
const showSubscriptionRequestModal = ref(false)
const showReviewModal = ref(false)
const activeReviewRequest = ref(null)
const reviewNotesInput = ref('')
const showProofEnlargeModal = ref(false)
const enlargedProofUrl = ref('')

const subscriptionForm = reactive({
  request_type: 'renewal',
  plan_tier: '',
  billing_cycle: '',
  payment_method_id: '',
  payment_reference: '',
  proof_url: '',
  notes: ''
})
let paymentMethodsRequestId = 0
const paymentActionId = ref(null)
const showPaymentModal = ref(false)
const showQrPreviewModal = ref(false)
const selectedQrMethod = ref(null)
const copiedMethodId = ref(null)

const paymentForm = reactive({
  id: '',
  type: 'bank_transfer',
  bank_name: '',
  account_name: '',
  account_number: '',
  qr_image_url: '',
  instructions: '',
  is_active: true,
  sort_order: 0
})

const showActivateModal = ref(false)
const activateKeyInput = ref('')
const showIssueModal = ref(false)
const showRenewModal = ref(false)
const renewMonths = ref(null)
const submitting = ref(false)

const showEditPlanModal = ref(false)
const editPlanForm = reactive({
  id: '',
  tier: '',
  name: '',
  description: '',
  price_monthly: 0,
  price_annual_monthly: 0,
  billing_annual_total: 0,
  billing_months: null,
  trial_days: 0,
  max_teachers: 1,
  max_students: 65
})

const issueForm = reactive({
  school_id: '',
  plan_tier: '',
  billing_cycle: '',
  duration_months: null,
  max_teachers: null,
  max_students: null,
  notes: ''
})

function formatPaymentType(type) {
  const map = {
    bank_transfer: 'Bank Transfer',
    gcash_qr: 'GCash QR',
    maya_qr: 'Maya QR',
    qr_ph: 'QR Ph'
  }
  return map[type] || type || 'Payment Option'
}

async function loadPaymentMethods() {
  const requestId = ++paymentMethodsRequestId
  try {
    const qs = new URLSearchParams(auth.actorParams({ _ts: Date.now() })).toString()
    const res = await fetch(`/api/payment-methods?${qs}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        ...auth.actorHeaders()
      }
    })
    if (!res.ok) throw new Error(`Payment methods request failed (${res.status})`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error(data.error || 'Invalid payment methods response')
    // A slower request must not overwrite a newer save/toggle/delete response.
    if (requestId === paymentMethodsRequestId) paymentMethods.value = data
    return data
  } catch (err) {
    if (requestId === paymentMethodsRequestId) console.error('Failed to load payment methods:', err)
    return null
  }
}

async function copyAccountNumber(pm) {
  try {
    await navigator.clipboard.writeText(pm.account_number)
    copiedMethodId.value = pm.id
    showSuccess(`Copied ${pm.bank_name} account number to clipboard!`)
    setTimeout(() => {
      if (copiedMethodId.value === pm.id) copiedMethodId.value = null
    }, 2500)
  } catch {
    showSuccess(`Account: ${pm.account_number}`)
  }
}

function openQrPreview(pm) {
  selectedQrMethod.value = pm
  showQrPreviewModal.value = true
}

function openAddPaymentModal() {
  Object.assign(paymentForm, {
    id: '',
    type: 'bank_transfer',
    bank_name: '',
    account_name: '',
    account_number: '',
    qr_image_url: '',
    instructions: '',
    is_active: true,
    sort_order: paymentMethods.value.length + 1
  })
  showPaymentModal.value = true
}

function openEditPaymentModal(pm) {
  Object.assign(paymentForm, {
    id: pm.id,
    type: pm.type,
    bank_name: pm.bank_name,
    account_name: pm.account_name,
    account_number: pm.account_number,
    qr_image_url: pm.qr_image_url || '',
    instructions: pm.instructions || '',
    is_active: Boolean(pm.is_active),
    sort_order: pm.sort_order || 0
  })
  showPaymentModal.value = true
}

function triggerQrFileInput() {
  const input = document.getElementById('qr-file-upload')
  if (input) input.click()
}

function handleQrUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    const rawDataUrl = ev.target?.result || ''
    // Compress/resize if very large image
    const img = new Image()
    img.onload = () => {
      const maxDim = 1000
      let w = img.width
      let h = img.height
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w)
          w = maxDim
        } else {
          w = Math.round((w * maxDim) / h)
          h = maxDim
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        paymentForm.qr_image_url = canvas.toDataURL('image/png')
      } else {
        paymentForm.qr_image_url = rawDataUrl
      }
    }
    img.onerror = () => {
      paymentForm.qr_image_url = rawDataUrl
    }
    img.src = rawDataUrl
  }
  reader.readAsDataURL(file)
}

async function handleSavePaymentMethod() {
  if (!auth.isSuperadmin) return
  submitting.value = true
  try {
    const isEdit = Boolean(paymentForm.id)
    const paymentId = paymentForm.id
    const query = new URLSearchParams(auth.actorParams({ _ts: Date.now() })).toString()
    const url = isEdit
      ? `/api/payment-methods/${paymentId}?${query}`
      : `/api/payment-methods?${query}`
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify(auth.actorParams({
        type: paymentForm.type,
        bank_name: paymentForm.bank_name,
        account_name: paymentForm.account_name,
        account_number: paymentForm.account_number,
        qr_image_url: paymentForm.qr_image_url,
        instructions: paymentForm.instructions,
        is_active: paymentForm.is_active ? 1 : 0,
        sort_order: paymentForm.sort_order
      }))
    })

    let data = {}
    try {
      data = await res.json()
    } catch {}
    if (!res.ok) throw new Error(data.error || (res.status === 413 ? 'Image or payload is too large to save' : 'Failed to save payment option'))

    const savedMethod = data.paymentMethod
    if (!savedMethod?.id) throw new Error('The server did not return the saved payment option')

    if (isEdit) {
      const index = paymentMethods.value.findIndex(pm => pm.id === savedMethod.id)
      if (index !== -1) paymentMethods.value[index] = savedMethod
      else paymentMethods.value = [savedMethod, ...paymentMethods.value]
    } else {
      paymentMethods.value = [...paymentMethods.value, savedMethod]
    }

    showPaymentModal.value = false
    showSuccess(`Payment option "${savedMethod.bank_name}" saved successfully!`)
    // Reconcile with the database without keeping the modal open or blocking the UI.
    void loadPaymentMethods()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function togglePaymentActive(pm) {
  if (!auth.isSuperadmin || paymentActionId.value === pm.id) return
  paymentActionId.value = pm.id
  try {
    const qs = new URLSearchParams(auth.actorParams({ _ts: Date.now() })).toString()
    const res = await fetch(`/api/payment-methods/${pm.id}/toggle?${qs}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify(auth.actorParams())
    })
    let data = {}
    try {
      data = await res.json()
    } catch {}
    if (!res.ok) throw new Error(data.error || 'Failed to toggle status')
    const index = paymentMethods.value.findIndex(item => item.id === pm.id)
    if (index !== -1) {
      paymentMethods.value[index] = {
        ...paymentMethods.value[index],
        is_active: Number(data.is_active) ? 1 : 0
      }
    }
    showSuccess(`Payment option ${data.is_active ? 'enabled' : 'disabled'}.`)
    void loadPaymentMethods()
  } catch (err) {
    showError(err.message)
  } finally {
    paymentActionId.value = null
  }
}

async function deletePaymentMethod(pm) {
  if (!auth.isSuperadmin || paymentActionId.value === pm.id) return
  if (!confirm(`Are you sure you want to delete payment option "${pm.bank_name}"?`)) return
  paymentActionId.value = pm.id
  try {
    const qs = new URLSearchParams(auth.actorParams({ _ts: Date.now() })).toString()
    const res = await fetch(`/api/payment-methods/${pm.id}?${qs}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify(auth.actorParams())
    })
    let data = {}
    try {
      data = await res.json()
    } catch {}
    if (!res.ok) throw new Error(data.error || 'Failed to delete payment option')
    paymentMethods.value = paymentMethods.value.filter(item => item.id !== pm.id)
    if (selectedQrMethod.value?.id === pm.id) {
      selectedQrMethod.value = null
      showQrPreviewModal.value = false
    }
    showSuccess(`Deleted payment option "${pm.bank_name}".`)
    void loadPaymentMethods()
  } catch (err) {
    showError(err.message)
  } finally {
    paymentActionId.value = null
  }
}

function formatRequestType(type) {
  return { activation: 'Activation', renewal: 'Renewal', upgrade: 'Upgrade' }[type] || 'Subscription request'
}

function planTierName(tier) {
  const p = availablePlans.value.find(x => x.tier === tier)
  if (p) return p.name
  return tier || 'Unconfigured plan'
}

const filteredSubscriptionHistory = computed(() => {
  if (historyStatusFilter.value === 'all') return subscriptionHistory.value
  return subscriptionHistory.value.filter(h => h.to_status === historyStatusFilter.value || h.from_status === historyStatusFilter.value)
})

function formatDate(d) {
  if (!d) return '—'
  try {
    const date = new Date(d)
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}

function formatDateTime(d) {
  if (!d) return '—'
  try {
    const date = new Date(d)
    return date.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return d
  }
}

function isImageProof(url) {
  if (!url) return false
  const clean = String(url).trim()
  if (clean.startsWith('data:image/')) return true
  return /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(clean) || clean.startsWith('http')
}

function triggerProofFileInput() {
  const input = document.getElementById('proof-file-upload')
  if (input) input.click()
}

function handleProofUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    const rawDataUrl = ev.target?.result || ''
    const img = new Image()
    img.onload = () => {
      const maxDim = 1200
      let w = img.width
      let h = img.height
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w)
          w = maxDim
        } else {
          w = Math.round((w * maxDim) / h)
          h = maxDim
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        subscriptionForm.proof_url = canvas.toDataURL('image/jpeg', 0.85)
      } else {
        subscriptionForm.proof_url = rawDataUrl
      }
    }
    img.onerror = () => {
      subscriptionForm.proof_url = rawDataUrl
    }
    img.src = rawDataUrl
  }
  reader.readAsDataURL(file)
}

function openProofEnlarge(url) {
  enlargedProofUrl.value = url
  showProofEnlargeModal.value = true
}

async function copyText(text, successMsg = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text)
    showSuccess(successMsg)
  } catch {
    showSuccess(`Value: ${text}`)
  }
}

async function copyKey(key) {
  try {
    await navigator.clipboard.writeText(key)
    showSuccess('License key copied to clipboard!')
  } catch {
    showSuccess(`Copied: ${key}`)
  }
}

function onTierChange() {
  const p = availablePlans.value.find(x => x.tier === issueForm.plan_tier)
  if (p) {
    issueForm.max_teachers = p.max_teachers
    issueForm.max_students = p.max_students
  } else {
    issueForm.max_teachers = null
    issueForm.max_students = null
  }

  issueForm.duration_months = p?.billing_months || null
  if (p?.billing_months) issueForm.billing_cycle = 'annual'
}

async function loadSubscriptionRequests() {
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/subscriptions/requests?${qs}`, { cache: 'no-store', headers: auth.actorHeaders() })
    if (res.ok) subscriptionRequests.value = await res.json()
  } catch (err) {
    console.error('Failed to load subscription requests:', err)
  }
}

async function loadSubscriptionHistory() {
  try {
    const qs = new URLSearchParams(auth.actorParams({ limit: 100 })).toString()
    const res = await fetch(`/api/subscriptions/history?${qs}`, { cache: 'no-store', headers: auth.actorHeaders() })
    if (res.ok) subscriptionHistory.value = await res.json()
  } catch (err) {
    console.error('Failed to load subscription history:', err)
  }
}

function openSubscriptionRequestModal() {
  if (auth.isSuperadmin) return
  subscriptionForm.request_type = activeLicense.value ? 'renewal' : 'activation'
  subscriptionForm.plan_tier = availablePlans.value[0]?.tier || ''
  subscriptionForm.billing_cycle = availablePlans.value[0]?.billing_months ? 'annual' : 'monthly'
  subscriptionForm.payment_method_id = paymentMethods.value.find(pm => pm.is_active)?.id || ''
  subscriptionForm.payment_reference = ''
  subscriptionForm.proof_url = ''
  subscriptionForm.notes = ''
  showSubscriptionRequestModal.value = true
}

async function submitSubscriptionRequest() {
  if (auth.isSuperadmin) return
  submitting.value = true
  try {
    const res = await fetch('/api/subscriptions/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.actorHeaders() },
      body: JSON.stringify(auth.actorParams(subscriptionForm))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to submit payment request')
    showSubscriptionRequestModal.value = false
    showSuccess('Payment submitted for superadmin verification.')
    await Promise.all([loadSubscriptionRequests(), loadSubscriptionHistory()])
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

function openReviewModal(request) {
  activeReviewRequest.value = request
  reviewNotesInput.value = request.notes || ''
  showReviewModal.value = true
}

async function submitRequestDecision(status) {
  if (!auth.isSuperadmin || !activeReviewRequest.value) return
  submitting.value = true
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/subscriptions/requests/${activeReviewRequest.value.id}/status?${qs}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...auth.actorHeaders() },
      body: JSON.stringify(auth.actorParams({ status, notes: reviewNotesInput.value.trim() }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to review request')
    showSuccess(status === 'approved' ? 'Subscription approved and license activated!' : 'Subscription request rejected.')
    showReviewModal.value = false
    await Promise.all([loadSubscriptionRequests(), loadLicenseData(), loadSubscriptionHistory()])
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function cancelSubscriptionRequest(request) {
  if (!confirm('Are you sure you want to cancel this pending payment request?')) return
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/subscriptions/requests/${request.id}/cancel?${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.actorHeaders() },
      body: JSON.stringify(auth.actorParams({ notes: 'Cancelled by school administrator' }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to cancel request')
    showSuccess('Subscription payment request cancelled.')
    await Promise.all([loadSubscriptionRequests(), loadSubscriptionHistory()])
  } catch (err) {
    showError(err.message)
  }
}

async function loadPlans() {
  try {
    const res = await fetch('/api/licenses/plans')
    if (res.ok) {
      availablePlans.value = await res.json()
      if (availablePlans.value.length > 0) {
        if (!issueForm.plan_tier) issueForm.plan_tier = availablePlans.value[0].tier
        if (!issueForm.billing_cycle) issueForm.billing_cycle = availablePlans.value[0].billing_months ? 'annual' : 'monthly'
        onTierChange()
      }
    }
  } catch (err) {
    console.error('Failed to load plans:', err)
  }
}

function openEditPlanModal(plan) {
  if (!auth.isSuperadmin) return
  Object.assign(editPlanForm, {
    id: plan.id,
    tier: plan.tier,
    name: plan.name,
    description: plan.description,
    price_monthly: plan.price_monthly,
    price_annual_monthly: plan.price_annual_monthly,
    billing_annual_total: plan.billing_annual_total,
    billing_months: plan.billing_months,
    trial_days: plan.trial_days,
    max_teachers: plan.max_teachers,
    max_students: plan.max_students
  })
  showEditPlanModal.value = true
}

async function handleSavePlan() {
  if (!auth.isSuperadmin) return
  submitting.value = true
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/licenses/plans/${editPlanForm.id}?${qs}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      },
      body: JSON.stringify(auth.actorParams(editPlanForm))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update plan')
    showSuccess(`Plan "${editPlanForm.name}" updated in database!`)
    showEditPlanModal.value = false
    await loadPlans()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function deletePlan(plan) {
  if (!auth.isSuperadmin) return
  if (!confirm(`Are you sure you want to delete the "${plan.name}" (${plan.tier}) plan? This action cannot be undone.`)) return
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/licenses/plans/${plan.id}?${qs}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete plan')
    showSuccess(`Plan "${plan.name}" deleted successfully!`)
    await loadPlans()
  } catch (err) {
    showError(err.message)
  }
}

async function loadLicenseData() {
  try {
    const res = await fetch('/api/licenses?' + new URLSearchParams(auth.actorParams()))
    const data = await res.json()
    if (Array.isArray(data)) {
      allLicenses.value = data
      if (data.length > 0) {
        activeLicense.value = data[0]
        usage.teachers = data[0].teacher_count || 0
        usage.students = data[0].student_count || 0
      }
    } else {
      activeLicense.value = data.license
      Object.assign(usage, data.usage || {})
      currentSchool.value = data.school
    }
  } catch (err) {
    console.error('Failed to load license data:', err)
  }
}

async function loadSchoolsList() {
  if (!auth.isSuperadmin) return
  try {
    schoolsList.value = (await auth.getSchools()) || []
  } catch {}
}

function openActivateModal() {
  if (!auth.isSuperadmin) return
  activateKeyInput.value = ''
  showActivateModal.value = true
}

function openIssueModal() {
  if (!auth.isSuperadmin) return
  issueForm.school_id = schoolsList.value[0]?.id || ''
  issueForm.plan_tier = availablePlans.value[0]?.tier || ''
  issueForm.billing_cycle = availablePlans.value[0]?.billing_months ? 'annual' : 'monthly'
  onTierChange()
  showIssueModal.value = true
}

function openRenewModal() {
  if (!auth.isSuperadmin) return
  showRenewModal.value = true
}

async function handleActivateKey() {
  if (!auth.isSuperadmin) return
  if (!activateKeyInput.value.trim()) return
  submitting.value = true
  try {
    const res = await fetch('/api/licenses/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({
        licenseKey: activateKeyInput.value.trim(),
        schoolId: auth.schoolId
      }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to activate key')
    showSuccess('License successfully activated!')
    showActivateModal.value = false
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function handleIssueLicense() {
  if (!auth.isSuperadmin) return
  submitting.value = true
  try {
    const res = await fetch('/api/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams(issueForm))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to issue license')
    showSuccess(`Issued license ${data.license.license_key}!`)
    showIssueModal.value = false
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function handleRenew() {
  if (!auth.isSuperadmin) return
  submitting.value = true
  try {
    const res = await fetch('/api/licenses/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({
        schoolId: auth.schoolId,
        months: Number(renewMonths.value)
      }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Renewal failed')
    showSuccess('Subscription renewed successfully!')
    showRenewModal.value = false
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  } finally {
    submitting.value = false
  }
}

async function extendTrial() {
  if (!auth.isSuperadmin) return
  try {
    const res = await fetch('/api/licenses/start-trial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({ schoolId: auth.schoolId, plan_tier: activeLicense.value?.plan_tier }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Could not extend trial')
    showSuccess('Trial extended successfully.')
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

async function suspendLicense(id) {
  if (!auth.isSuperadmin) return
  if (!confirm('Are you sure you want to stop/suspend this license? When suspended, all accounts in this school will be locked out immediately.')) return
  try {
    const res = await fetch(`/api/licenses/${id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams())
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to suspend license')
    showSuccess('License has been suspended. School workspace accounts are now locked.')
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

async function resumeLicense(id) {
  if (!auth.isSuperadmin) return
  try {
    const res = await fetch(`/api/licenses/${id}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams())
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to resume license')
    showSuccess('License has been reactivated. School workspace accounts restored.')
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

async function deleteLicense(lic) {
  if (!auth.isSuperadmin) return
  if (!confirm(`Are you sure you want to PERMANENTLY delete license "${lic.license_key}"? This action cannot be undone.`)) return
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/licenses/${lic.id}?${qs}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...auth.actorHeaders()
      }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to delete license')
    showSuccess(`License "${lic.license_key}" deleted successfully.`)
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

async function cancelLicense(lic) {
  if (!auth.isSuperadmin) return
  const reason = prompt(`Enter cancellation remarks for license "${lic.license_key}":`, 'Administrative contract cancellation')
  if (reason === null) return
  try {
    const qs = new URLSearchParams(auth.actorParams()).toString()
    const res = await fetch(`/api/licenses/${lic.id}/cancel?${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.actorHeaders() },
      body: JSON.stringify(auth.actorParams({ notes: reason }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to cancel license')
    showSuccess(`License "${lic.license_key}" has been cancelled.`)
    await Promise.all([loadLicenseData(), loadSubscriptionHistory()])
  } catch (err) {
    showError(err.message)
  }
}

async function quickRenew(lic) {
  if (!auth.isSuperadmin) return
  try {
    const res = await fetch('/api/licenses/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({ schoolId: lic.school_id, months: Number(lic.billing_cycle === 'monthly' ? 1 : availablePlans.value.find(plan => plan.tier === lic.plan_tier)?.billing_months) }))
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Renewal failed')
    showSuccess(`Renewed license for ${lic.school_name || 'school'}!`)
    await loadLicenseData()
  } catch (err) {
    showError(err.message)
  }
}

function editLicense(lic) {
  if (!auth.isSuperadmin) return
  openRenewModal()
}

let licensePollInterval = null

onMounted(async () => {
  await Promise.all([
    loadLicenseData(),
    loadSchoolsList(),
    loadPlans(),
    loadPaymentMethods(),
    loadSubscriptionRequests(),
    loadSubscriptionHistory()
  ])
  // Real-time polling every 6 seconds to keep license status and capacity synchronized across tabs/devices
  licensePollInterval = setInterval(() => {
    void loadLicenseData()
    void loadSubscriptionRequests()
    void loadSubscriptionHistory()
    loadPaymentMethods()
  }, 6000)
})

onUnmounted(() => {
  if (licensePollInterval) clearInterval(licensePollInterval)
})
</script>

<style scoped>
.license-hero-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.tier-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tier-pill {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--foreground);
}

.trial-pill {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--info-bg);
  color: var(--info);
  text-transform: uppercase;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status--active {
  background: var(--success-bg);
  color: var(--success);
}
.status--active .dot { background: var(--success); }

.status--trial {
  background: var(--info-bg);
  color: var(--info);
}
.status--trial .dot { background: var(--info); }

.status--expired {
  background: var(--red-bg);
  color: var(--destructive);
}
.status--expired .dot { background: var(--destructive); }

.license-meta-keys {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--secondary);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 8px;
}

.key-label {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.license-key-code {
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: monospace;
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--primary);
}

.copy-key-btn {
  background: transparent;
  border: none;
  color: var(--muted-foreground);
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s ease;
}

.copy-key-btn:hover {
  color: var(--foreground);
}

/* Metrics Grid */
.hero-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 24px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-title {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-primary-num {
  font-family: 'Manrope', sans-serif;
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1;
}

.metric-capacity {
  font-size: 0.95rem;
  color: var(--muted-foreground);
  font-weight: 600;
}

.metric-unit {
  font-size: 0.85rem;
  color: var(--primary);
  font-weight: 700;
}

.metric-foot {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--secondary);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 4px;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.modules-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.module-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--secondary);
  color: var(--muted-foreground);
}

.module-chip.enabled {
  background: var(--primary-bg);
  color: var(--primary);
}

/* Actions bar */
.hero-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.hero-school-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
}

.read-only-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.hero-readonly-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--muted-foreground);
  background: var(--muted);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.hero-btns {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.tier-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 5px;
  background: var(--secondary);
  color: var(--foreground);
}

.tier--adviser { background: var(--primary-bg); color: var(--primary); }
.tier--campus { background: var(--secondary); color: var(--secondary-foreground); }
.tier--division { background: var(--card); color: var(--foreground); border: 1px solid var(--border); }

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(8, 13, 12, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow-x: hidden;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--muted-foreground);
  cursor: pointer;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--secondary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 900px) {
  .hero-metrics-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .hero-metrics-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}

/* Payment Methods & QR Grid */
.badge-payment-count {
  background: var(--primary-bg);
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 700;
}

.empty-payments-box {
  text-align: center;
  padding: 32px 20px;
  color: var(--muted-foreground);
  font-size: 0.88rem;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  margin-top: 16px;
}

.payment-method-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.payment-method-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.payment-method-card.payment-inactive {
  opacity: 0.65;
  background: var(--muted);
}

.pm-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pm-type-badge {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 6px;
}

.type--gcash_qr {
  background: var(--info-bg);
  color: var(--info);
}

.type--maya_qr {
  background: var(--success-bg);
  color: var(--success);
}

.type--bank_transfer {
  background: var(--warning-bg);
  color: var(--warning);
}

.type--qr_ph {
  background: var(--primary-bg);
  color: var(--primary);
}

.pm-bank-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--foreground);
}

.pm-details-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--secondary);
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.pm-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pm-detail-label {
  font-size: 0.72rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.pm-detail-value {
  font-size: 0.88rem;
  color: var(--foreground);
}

.pm-account-number-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
}

.pm-account-num {
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary);
  background: var(--card);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.btn-copy-account {
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-account:hover {
  background: var(--primary-hover);
}

.pm-instructions {
  font-size: 0.76rem;
  line-height: 1.4;
  color: var(--muted-foreground);
  border-top: 1px dashed var(--border);
  padding-top: 8px;
}

.pm-qr-preview-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
}

.pm-qr-thumbnail {
  width: 140px;
  height: 140px;
  object-fit: contain;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.pm-qr-thumbnail:hover {
  transform: scale(1.04);
}

.pm-qr-hint {
  font-size: 0.72rem;
  color: var(--primary);
  cursor: pointer;
  font-weight: 600;
}

.pm-card-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

/* Subscription Status History & Audit Trail styles */
.history-status-transition {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.transition-arrow {
  color: var(--muted-foreground);
  font-weight: 700;
  font-size: 0.85rem;
}

.status--pending {
  background: var(--warning-bg);
  color: var(--warning);
}
.status--pending .dot { background: var(--warning); }

.status--approved {
  background: var(--success-bg);
  color: var(--success);
}
.status--approved .dot { background: var(--success); }

.status--rejected {
  background: var(--red-bg);
  color: var(--destructive);
}
.status--rejected .dot { background: var(--destructive); }

.status--suspended {
  background: var(--muted);
  color: var(--muted-foreground);
}
.status--suspended .dot { background: var(--muted-foreground); }

.status--cancelled {
  background: var(--secondary);
  color: var(--muted-foreground);
}
.status--cancelled .dot { background: var(--muted-foreground); }

.history-meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-chip {
  font-size: 0.72rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--secondary);
  border: 1px solid var(--border);
  color: var(--foreground);
}

/* Review Modal specific styles */
.review-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 14px;
  background: var(--secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 14px;
}

.review-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.review-meta-label {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.review-payment-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  margin-bottom: 14px;
}

.review-payment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.88rem;
}

.review-proof-container {
  padding: 14px;
  background: var(--secondary);
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 14px;
}

.review-proof-img {
  max-width: 100%;
  max-height: 220px;
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.review-proof-img:hover {
  transform: scale(1.02);
}

.icon-btn--warning {
  color: var(--warning);
}
.icon-btn--warning:hover {
  background: var(--warning-bg);
}
</style>
