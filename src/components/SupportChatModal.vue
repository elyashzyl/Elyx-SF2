<template>
  <div class="support-chat-wrapper">
    <!-- Floating Help / Chat Trigger Button (Fixed Bottom-Right) -->
    <button
      v-if="auth.user"
      class="floating-chat-btn"
      :class="{ 'has-unread': unreadBadgeCount > 0, 'is-active': isOpen }"
      @click="toggleModal"
      title="Need Help or Payment Inquiry? Chat with Superadmin"
      aria-label="Need Help or Payment Inquiry? Chat with Superadmin"
      type="button"
    >
      <div class="floating-icon-wrap">
        <svg v-if="!isOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
      <span class="floating-btn-text">{{ auth.isSuperadmin ? 'Support Desk' : 'Help & Chat' }}</span>
      <span v-if="unreadBadgeCount > 0" class="floating-badge">{{ unreadBadgeCount }}</span>
    </button>

    <!-- Support Chat Pop-Up Modal -->
    <div v-if="isOpen" class="chat-modal-backdrop" @click.self="isOpen = false">
      <div class="chat-modal-window">
        <!-- Header -->
        <div class="chat-modal-header">
          <div class="chat-header-info">
            <div class="chat-header-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 class="chat-header-title">
                {{ auth.isSuperadmin ? 'Superadmin Support Console' : 'Direct Superadmin Support' }}
              </h3>
              <p class="chat-header-subtitle">
                {{ auth.isSuperadmin ? 'Manage inquiries, payments, & technical issues' : 'Inquire about licenses, payments, or report issues' }}
              </p>
            </div>
          </div>
          <button class="chat-close-btn" @click="isOpen = false" aria-label="Close" type="button">&times;</button>
        </div>

        <!-- Main Body -->
        <div class="chat-modal-body">
          <!-- SUPERADMIN VIEW -->
          <template v-if="auth.isSuperadmin">
            <!-- Superadmin Detail / Thread View -->
            <div v-if="activeInquiry" class="chat-thread-view">
              <div class="thread-header">
                <button class="thread-back-btn" @click="activeInquiry = null" type="button">
                  ← Back to Inquiries
                </button>
                <div class="thread-actions">
                  <button
                    v-if="activeInquiry.status === 'open'"
                    class="btn-finish"
                    @click="updateStatus(activeInquiry.id, 'finished')"
                    :disabled="statusLoading"
                    type="button"
                  >
                    ✓ Mark as Finished
                  </button>
                  <button
                    v-else
                    class="btn-reopen"
                    @click="updateStatus(activeInquiry.id, 'open')"
                    :disabled="statusLoading"
                    type="button"
                  >
                    ↺ Re-open
                  </button>
                </div>
              </div>

              <!-- Inquiry Meta Card -->
              <div class="inquiry-meta-card">
                <div class="meta-row">
                  <span class="meta-subject">{{ activeInquiry.subject }}</span>
                  <span class="badge" :class="'badge-' + activeInquiry.status">
                    {{ activeInquiry.status === 'finished' ? 'Finished ✓' : 'Open' }}
                  </span>
                </div>
                <div class="meta-details">
                  <span><strong>From:</strong> {{ activeInquiry.user_name }} ({{ activeInquiry.user_role }})</span>
                  <span v-if="activeInquiry.school_name"><strong>School:</strong> {{ activeInquiry.school_name }}</span>
                  <span v-if="activeInquiry.user_email"><strong>Email:</strong> {{ activeInquiry.user_email }}</span>
                  <span><strong>Category:</strong> {{ formatCategory(activeInquiry.category) }}</span>
                  <span v-if="activeInquiry.resolved_at"><strong>Resolved:</strong> {{ formatDate(activeInquiry.resolved_at) }}</span>
                </div>
              </div>

              <!-- Messages List -->
              <div class="messages-container" ref="messagesBox">
                <div
                  v-for="msg in messages"
                  :key="msg.id"
                  class="message-bubble"
                  :class="msg.sender_role === 'superadmin' ? 'bubble-admin' : 'bubble-user'"
                >
                  <div class="bubble-header">
                    <span class="bubble-sender">{{ msg.sender_name }} ({{ msg.sender_role }})</span>
                    <span class="bubble-time">{{ formatDate(msg.created_at) }}</span>
                  </div>
                  <div class="bubble-content">{{ msg.message }}</div>
                </div>
                <div v-if="messages.length === 0" class="empty-state">No messages in this inquiry.</div>
              </div>

              <!-- Reply Input -->
              <div class="reply-input-bar">
                <textarea
                  v-model="replyText"
                  placeholder="Type a response to this user or school..."
                  rows="2"
                  @keydown.enter.ctrl.prevent="sendReply"
                ></textarea>
                <div class="reply-bar-bottom">
                  <small>Ctrl+Enter to send</small>
                  <button class="btn-send" @click="sendReply" :disabled="!replyText.trim() || sendingReply" type="button">
                    {{ sendingReply ? 'Sending...' : 'Send Reply' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Superadmin Inquiries List -->
            <div v-else class="admin-inquiries-list">
              <!-- Filters and Search -->
              <div class="list-controls">
                <div class="status-tabs">
                  <button
                    class="tab-btn"
                    :class="{ active: filterStatus === 'all' }"
                    @click="filterStatus = 'all'; fetchInquiries()"
                    type="button"
                  >
                    All ({{ inquiries.length }})
                  </button>
                  <button
                    class="tab-btn"
                    :class="{ active: filterStatus === 'open' }"
                    @click="filterStatus = 'open'; fetchInquiries()"
                    type="button"
                  >
                    Open
                  </button>
                  <button
                    class="tab-btn"
                    :class="{ active: filterStatus === 'finished' }"
                    @click="filterStatus = 'finished'; fetchInquiries()"
                    type="button"
                  >
                    Finished
                  </button>
                </div>
                <div class="search-box">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search by school, user, or topic..."
                    @input="debouncedSearch"
                  />
                </div>
              </div>

              <!-- List Items -->
              <div class="inquiry-items-scroll">
                <div v-if="loadingList" class="loading-state">Loading inquiries...</div>
                <div v-else-if="inquiries.length === 0" class="empty-state">
                  No inquiries found matching criteria.
                </div>
                <div
                  v-for="item in inquiries"
                  :key="item.id"
                  class="inquiry-card"
                  @click="openInquiry(item)"
                >
                  <div class="inquiry-card-top">
                    <div class="inquiry-card-tags">
                      <span class="badge" :class="'badge-' + item.category">{{ formatCategory(item.category) }}</span>
                      <span class="badge" :class="'badge-' + item.status">
                        {{ item.status === 'finished' ? 'Finished ✓' : 'Open' }}
                      </span>
                    </div>
                    <span class="inquiry-time">{{ formatDate(item.created_at) }}</span>
                  </div>
                  <h4 class="inquiry-card-subject">{{ item.subject }}</h4>
                  <div class="inquiry-card-footer">
                    <span><strong>{{ item.user_name }}</strong> · {{ item.user_role }}</span>
                    <span v-if="item.school_name" class="school-pill">{{ item.school_name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- REGULAR USER VIEW (Admin / Teacher) -->
          <template v-else>
            <!-- View 1: New Inquiry Form -->
            <div v-if="userView === 'new'" class="user-new-view">
              <div class="view-header-row">
                <button class="thread-back-btn" @click="userView = 'list'" type="button">
                  ← Back to My Inquiries
                </button>
                <span class="view-badge">Direct Superadmin Message</span>
              </div>

              <div class="payment-callout">
                <div class="callout-icon">💡</div>
                <div class="callout-text">
                  <strong>Direct Help &amp; Payment Desk</strong>
                  <p>
                    Have questions about school plans, upgrading seats, or payment options? You can coordinate directly here with the superadmin or via email at
                    <a href="mailto:ely.ashzyl@gmail.com?subject=ElyTrack%20Inquiry">ely.ashzyl@gmail.com</a>.
                  </p>
                </div>
              </div>

              <form @submit.prevent="submitNewInquiry" class="new-inquiry-form">
                <div class="form-group">
                  <label>Topic / Category</label>
                  <select v-model="newForm.category" required>
                    <option value="payment">Payment &amp; Subscription Inquiry</option>
                    <option value="technical">Technical Support &amp; Bug Report</option>
                    <option value="license">License Key &amp; Seat Capacity</option>
                    <option value="general">General Question</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Subject</label>
                  <input
                    v-model="newForm.subject"
                    type="text"
                    placeholder="Brief summary of your inquiry or request..."
                    required
                  />
                </div>

                <div class="form-group">
                  <label>Contact Email (Optional for email follow-up)</label>
                  <input
                    v-model="newForm.userEmail"
                    type="email"
                    placeholder="your.email@school.edu.ph"
                  />
                </div>

                <div class="form-group">
                  <label>Message / Details</label>
                  <textarea
                    v-model="newForm.message"
                    rows="4"
                    placeholder="Describe your issue, question, or payment inquiry in detail..."
                    required
                  ></textarea>
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-cancel" @click="userView = 'list'">Cancel</button>
                  <button type="submit" class="btn-primary" :disabled="submittingNew">
                    {{ submittingNew ? 'Submitting...' : 'Send Inquiry to Superadmin →' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- View 2: Thread View for User -->
            <div v-else-if="userView === 'thread' && activeInquiry" class="chat-thread-view">
              <div class="thread-header">
                <button class="thread-back-btn" @click="userView = 'list'; activeInquiry = null" type="button">
                  ← Back to My Inquiries
                </button>
                <span class="badge" :class="'badge-' + activeInquiry.status">
                  {{ activeInquiry.status === 'finished' ? 'Finished ✓' : 'Open' }}
                </span>
              </div>

              <!-- Status Banner -->
              <div v-if="activeInquiry.status === 'finished'" class="resolved-banner">
                <div class="banner-icon">✓</div>
                <div class="banner-text">
                  <strong>Inquiry Marked as Finished</strong>
                  <p>The superadmin has marked this inquiry as resolved on {{ formatDate(activeInquiry.resolved_at) }}. If you still need help, feel free to send a follow-up message below!</p>
                </div>
              </div>

              <div class="inquiry-meta-card">
                <div class="meta-row">
                  <span class="meta-subject">{{ activeInquiry.subject }}</span>
                  <span class="badge" :class="'badge-' + activeInquiry.category">{{ formatCategory(activeInquiry.category) }}</span>
                </div>
                <div class="meta-details">
                  <span><strong>Started:</strong> {{ formatDate(activeInquiry.created_at) }}</span>
                  <span v-if="activeInquiry.resolved_by"><strong>Handled by:</strong> {{ activeInquiry.resolved_by }}</span>
                </div>
              </div>

              <!-- Messages List -->
              <div class="messages-container" ref="messagesBox">
                <div
                  v-for="msg in messages"
                  :key="msg.id"
                  class="message-bubble"
                  :class="msg.sender_role === 'superadmin' ? 'bubble-admin' : 'bubble-user'"
                >
                  <div class="bubble-header">
                    <span class="bubble-sender">
                      {{ msg.sender_role === 'superadmin' ? 'Superadmin Desk' : 'You' }}
                    </span>
                    <span class="bubble-time">{{ formatDate(msg.created_at) }}</span>
                  </div>
                  <div class="bubble-content">{{ msg.message }}</div>
                </div>
              </div>

              <!-- Reply Input Bar -->
              <div class="reply-input-bar">
                <textarea
                  v-model="replyText"
                  placeholder="Type a follow-up message..."
                  rows="2"
                  @keydown.enter.ctrl.prevent="sendReply"
                ></textarea>
                <div class="reply-bar-bottom">
                  <small>Ctrl+Enter to send</small>
                  <button class="btn-send" @click="sendReply" :disabled="!replyText.trim() || sendingReply" type="button">
                    {{ sendingReply ? 'Sending...' : 'Send Message' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- View 3: Inquiries List for User -->
            <div v-else class="user-inquiries-list">
              <div class="list-action-header">
                <div>
                  <h4 class="list-heading">Support &amp; Payment Inquiries</h4>
                  <small class="list-sub">Direct channel to platform superadmin</small>
                </div>
                <button class="btn-new-inquiry" @click="userView = 'new'" type="button">
                  + New Inquiry
                </button>
              </div>

              <div class="payment-hint-strip">
                <span>💳 Need to discuss license payments or upgrades?</span>
                <button class="link-btn" @click="startPaymentInquiry" type="button">Ask Superadmin</button>
              </div>

              <div class="inquiry-items-scroll">
                <div v-if="loadingList" class="loading-state">Loading your inquiries...</div>
                <div v-else-if="inquiries.length === 0" class="empty-state-card">
                  <div class="empty-icon">💬</div>
                  <h4>No inquiries submitted yet</h4>
                  <p>Have questions about license renewal, payment options, or need technical help? Start an inquiry with the superadmin.</p>
                  <button class="btn-primary" @click="userView = 'new'" type="button">
                    Submit First Inquiry →
                  </button>
                </div>
                <div
                  v-for="item in inquiries"
                  :key="item.id"
                  class="inquiry-card"
                  @click="openInquiry(item)"
                >
                  <div class="inquiry-card-top">
                    <div class="inquiry-card-tags">
                      <span class="badge" :class="'badge-' + item.category">{{ formatCategory(item.category) }}</span>
                      <span class="badge" :class="'badge-' + item.status">
                        {{ item.status === 'finished' ? 'Finished ✓' : 'Pending Review' }}
                      </span>
                    </div>
                    <span class="inquiry-time">{{ formatDate(item.created_at) }}</span>
                  </div>
                  <h4 class="inquiry-card-subject">{{ item.subject }}</h4>
                  <div class="inquiry-card-footer">
                    <span v-if="item.status === 'finished'" class="footer-finished-note">
                      ✓ Resolved by Superadmin
                    </span>
                    <span v-else class="footer-open-note">
                      Active with Superadmin
                    </span>
                    <span class="footer-action">View chat →</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'
import { useToast } from '../composables/useToast'

const auth = useAuthStore()
const { notify } = useNotifications()
const { addToast } = useToast()

const isOpen = ref(false)
const userView = ref('list') // 'list' | 'new' | 'thread'
const inquiries = ref([])
const activeInquiry = ref(null)
const messages = ref([])
const loadingList = ref(false)
const statusLoading = ref(false)
const sendingReply = ref(false)
const submittingNew = ref(false)
const replyText = ref('')
const filterStatus = ref('all')
const searchQuery = ref('')
const messagesBox = ref(null)
const unreadBadgeCount = ref(0)

const newForm = reactive({
  category: 'payment',
  subject: '',
  userEmail: '',
  message: ''
})

let pollInterval = null
let searchTimeout = null

function formatCategory(cat) {
  const map = {
    payment: 'Payment & Subscription',
    technical: 'Technical Support',
    license: 'License & Seats',
    general: 'General Inquiry'
  }
  return map[cat] || cat || 'General'
}

function formatDate(val) {
  if (!val) return ''
  try {
    const d = new Date(val)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return val
  }
}

function toggleModal() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    fetchInquiries()
    unreadBadgeCount.value = 0
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchInquiries()
  }, 300)
}

function startPaymentInquiry() {
  newForm.category = 'payment'
  newForm.subject = 'Payment & Subscription Inquiry for School'
  userView.value = 'new'
}

async function fetchInquiries() {
  if (!auth.user) return
  loadingList.value = true
  try {
    const params = new URLSearchParams(auth.actorParams({
      status: filterStatus.value,
      search: searchQuery.value
    }))
    const res = await fetch(`/api/inquiries?${params}`)
    const data = await res.json()
    if (Array.isArray(data)) {
      inquiries.value = data
    }
  } catch (err) {
    console.error('Failed to fetch inquiries:', err)
  } finally {
    loadingList.value = false
  }
}

async function openInquiry(inquiry) {
  activeInquiry.value = inquiry
  if (!auth.isSuperadmin) userView.value = 'thread'
  await fetchThread(inquiry.id)
}

async function fetchThread(id) {
  try {
    const params = new URLSearchParams(auth.actorParams())
    const res = await fetch(`/api/inquiries/${id}?${params}`)
    const data = await res.json()
    if (data.inquiry) activeInquiry.value = data.inquiry
    if (Array.isArray(data.messages)) messages.value = data.messages
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('Failed to fetch thread:', err)
  }
}

function scrollToBottom() {
  if (messagesBox.value) {
    messagesBox.value.scrollTop = messagesBox.value.scrollHeight
  }
}

async function submitNewInquiry() {
  if (!newForm.subject.trim() || !newForm.message.trim()) return
  submittingNew.value = true
  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({
        subject: newForm.subject,
        category: newForm.category,
        message: newForm.message,
        userEmail: newForm.userEmail
      }))
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    addToast('Inquiry submitted to Superadmin!', 'success')
    newForm.subject = ''
    newForm.message = ''
    newForm.userEmail = ''
    userView.value = 'list'
    await fetchInquiries()
    if (data.inquiry) {
      openInquiry(data.inquiry)
    }
  } catch (err) {
    addToast(err.message || 'Failed to submit inquiry', 'error')
  } finally {
    submittingNew.value = false
  }
}

async function sendReply() {
  if (!replyText.value.trim() || !activeInquiry.value) return
  sendingReply.value = true
  try {
    const res = await fetch(`/api/inquiries/${activeInquiry.value.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({
        message: replyText.value
      }))
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    replyText.value = ''
    await fetchThread(activeInquiry.value.id)
  } catch (err) {
    addToast(err.message || 'Failed to send reply', 'error')
  } finally {
    sendingReply.value = false
  }
}

async function updateStatus(id, newStatus) {
  statusLoading.value = true
  try {
    const res = await fetch(`/api/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth.actorParams({
        status: newStatus
      }))
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    addToast(`Inquiry marked as ${newStatus}!`, 'success')
    activeInquiry.value = data.inquiry
    await fetchInquiries()
  } catch (err) {
    addToast(err.message || 'Failed to update status', 'error')
  } finally {
    statusLoading.value = false
  }
}

// Background sync: alerts users when Superadmin marks an inquiry as finished
async function checkUnreadNotifications() {
  if (!auth.user || auth.isSuperadmin) return
  try {
    const params = new URLSearchParams(auth.actorParams())
    const res = await fetch(`/api/inquiries/notifications/unread?${params}`)
    const data = await res.json()
    if (data?.unread && data.unread.length > 0) {
      unreadBadgeCount.value = data.unread.length
      for (const item of data.unread) {
        notify(`🎉 Superadmin marked your inquiry "${item.subject}" as Finished!`, 'success')
        // Dismiss from backend so it won't repeatedly notify
        await fetch(`/api/inquiries/${item.id}/dismiss-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auth.actorParams())
        })
      }
    }
  } catch {}
}

onMounted(() => {
  checkUnreadNotifications()
  pollInterval = setInterval(checkUnreadNotifications, 25000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
.support-chat-wrapper {
  position: relative;
  z-index: 1050;
}

/* Floating Action Button */
.floating-chat-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.88rem;
  box-shadow: 0 10px 25px -3px rgba(14, 165, 233, 0.4), 0 4px 6px -2px rgba(14, 165, 233, 0.2);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1050;
}

.floating-chat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px -3px rgba(14, 165, 233, 0.5), 0 6px 10px -2px rgba(14, 165, 233, 0.3);
  filter: brightness(1.06);
}

.floating-chat-btn.is-active {
  background: #0f172a;
  border-color: #334155;
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.3);
}

.floating-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-btn-text {
  letter-spacing: -0.01em;
}

.floating-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #fff;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 7px;
  border: 2px solid #fff;
}

/* Modal Window */
.chat-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 24px;
  z-index: 1040;
}

.chat-modal-window {
  width: 520px;
  max-width: calc(100vw - 32px);
  height: 640px;
  max-height: calc(100vh - 80px);
  background: var(--card, #ffffff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Header */
.chat-modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  background: var(--card, #ffffff);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.12);
  color: #0ea5e9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-header-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--foreground, #0f172a);
}

.chat-header-subtitle {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--muted-foreground, #64748b);
}

.chat-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--muted-foreground, #94a3b8);
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.chat-close-btn:hover {
  color: var(--foreground, #0f172a);
}

/* Body */
.chat-modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Thread View */
.chat-thread-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.thread-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--muted, #f8fafc);
}

.thread-back-btn {
  background: none;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0ea5e9;
  cursor: pointer;
  padding: 4px 8px;
}

.thread-back-btn:hover {
  text-decoration: underline;
}

.thread-actions {
  display: flex;
  gap: 8px;
}

.btn-finish {
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 12px;
  cursor: pointer;
}

.btn-finish:hover {
  background: #059669;
}

.btn-reopen {
  background: #64748b;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 12px;
  cursor: pointer;
}

.inquiry-meta-card {
  padding: 12px 16px;
  background: var(--card, #fff);
  border-bottom: 1px solid var(--border, #e2e8f0);
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.meta-subject {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--foreground, #0f172a);
}

.meta-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--muted-foreground, #64748b);
}

.resolved-banner {
  margin: 12px 16px 4px;
  padding: 10px 14px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: #065f46;
}

.banner-icon {
  font-size: 1.1rem;
  font-weight: 800;
  color: #10b981;
}

.banner-text strong {
  display: block;
  font-size: 0.85rem;
}

.banner-text p {
  margin: 2px 0 0;
  font-size: 0.76rem;
  color: #047857;
}

/* Messages container */
.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--background, #f8fafc);
}

.message-bubble {
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  word-break: break-word;
}

.bubble-user {
  align-self: flex-end;
  background: #0ea5e9;
  color: #fff;
  border-bottom-right-radius: 2px;
}

.bubble-admin {
  align-self: flex-start;
  background: var(--card, #fff);
  color: var(--foreground, #0f172a);
  border: 1px solid var(--border, #e2e8f0);
  border-bottom-left-radius: 2px;
}

.bubble-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.68rem;
  opacity: 0.85;
}

.bubble-content {
  font-size: 0.85rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

/* Reply input */
.reply-input-bar {
  padding: 12px 16px;
  border-top: 1px solid var(--border, #e2e8f0);
  background: var(--card, #fff);
}

.reply-input-bar textarea {
  width: 100%;
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  resize: none;
  outline: none;
  font-family: inherit;
  background: var(--background, #fff);
  color: var(--foreground, #0f172a);
}

.reply-input-bar textarea:focus {
  border-color: #0ea5e9;
}

.reply-bar-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.reply-bar-bottom small {
  color: var(--muted-foreground, #94a3b8);
  font-size: 0.7rem;
}

.btn-send {
  background: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 6px 14px;
  cursor: pointer;
}

.btn-send:hover {
  background: #0284c7;
}

/* Lists */
.admin-inquiries-list,
.user-inquiries-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.list-controls {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-tabs {
  display: flex;
  gap: 6px;
}

.tab-btn {
  background: var(--muted, #f1f5f9);
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted-foreground, #64748b);
  cursor: pointer;
}

.tab-btn.active {
  background: #0ea5e9;
  color: #fff;
}

.search-box input {
  width: 100%;
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 0.8rem;
  outline: none;
  background: var(--background, #fff);
  color: var(--foreground, #0f172a);
}

.inquiry-items-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inquiry-card {
  padding: 12px 14px;
  background: var(--card, #fff);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.inquiry-card:hover {
  border-color: #0ea5e9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.08);
  transform: translateY(-1px);
}

.inquiry-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.inquiry-card-tags {
  display: flex;
  gap: 6px;
}

.inquiry-card-subject {
  margin: 0 0 6px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--foreground, #0f172a);
}

.inquiry-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--muted-foreground, #64748b);
}

.school-pill {
  background: var(--muted, #f1f5f9);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}

/* User Views */
.list-action-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-heading {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--foreground, #0f172a);
}

.list-sub {
  color: var(--muted-foreground, #64748b);
  font-size: 0.75rem;
}

.btn-new-inquiry {
  background: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-new-inquiry:hover {
  background: #0284c7;
}

.payment-hint-strip {
  margin: 10px 16px 0;
  padding: 8px 12px;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.76rem;
  color: #0369a1;
}

.link-btn {
  background: none;
  border: none;
  color: #0284c7;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}

.footer-finished-note {
  color: #10b981;
  font-weight: 700;
}

.footer-open-note {
  color: #0284c7;
  font-weight: 600;
}

.footer-action {
  font-weight: 600;
  color: #0ea5e9;
}

/* User New View */
.user-new-view {
  padding: 16px;
  overflow-y: auto;
  height: 100%;
}

.view-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.view-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0ea5e9;
  background: rgba(14, 165, 233, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
}

.payment-callout {
  padding: 12px 14px;
  background: rgba(14, 165, 233, 0.06);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 10px;
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.callout-icon {
  font-size: 1.2rem;
}

.callout-text strong {
  display: block;
  font-size: 0.82rem;
  color: var(--foreground, #0f172a);
}

.callout-text p {
  margin: 3px 0 0;
  font-size: 0.74rem;
  line-height: 1.4;
  color: var(--muted-foreground, #475569);
}

.callout-text a {
  color: #0ea5e9;
  font-weight: 700;
  text-decoration: underline;
}

.new-inquiry-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--foreground, #334155);
}

.form-group input,
.form-group select,
.form-group textarea {
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.82rem;
  outline: none;
  background: var(--background, #fff);
  color: var(--foreground, #0f172a);
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #0ea5e9;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
}

.btn-cancel {
  background: var(--muted, #f1f5f9);
  border: 1px solid var(--border, #cbd5e1);
  color: var(--foreground, #334155);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary:hover {
  background: #0284c7;
}

/* Badges */
.badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-open {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-finished {
  background: #dcfce7;
  color: #15803d;
}

.badge-payment {
  background: #fef3c7;
  color: #92400e;
}

.badge-technical {
  background: #f1f5f9;
  color: #475569;
}

.badge-license {
  background: #ede9fe;
  color: #6d28d9;
}

.badge-general {
  background: #e2e8f0;
  color: #334155;
}

/* States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 30px;
  color: var(--muted-foreground, #64748b);
  font-size: 0.85rem;
}

.empty-state-card {
  text-align: center;
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-state-card .empty-icon {
  font-size: 2.2rem;
}

.empty-state-card h4 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--foreground, #0f172a);
}

.empty-state-card p {
  margin: 0 0 8px;
  font-size: 0.78rem;
  color: var(--muted-foreground, #64748b);
  max-width: 320px;
}

@media (max-width: 600px) {
  .chat-modal-window {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  .chat-modal-backdrop {
    padding: 0;
  }
  .floating-chat-btn {
    bottom: 16px;
    right: 16px;
    padding: 10px 14px;
    font-size: 0.8rem;
  }
}
</style>
