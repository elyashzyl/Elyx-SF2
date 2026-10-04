<template>
  <div class="management-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>School Management</h1>
        <p>Register schools, assign their first administrator, and manage school profiles.</p>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon--primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 10-5 10 5-10 5L2 7Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ filteredSchools.length }}</span>
          <span class="stat-label">Total Schools</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ schoolsWithId }}</span>
          <span class="stat-label">With School ID</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ schoolsWithAddress }}</span>
          <span class="stat-label">With Address</span>
        </div>
      </div>
    </div>

    <!-- School Cards Grid -->
    <div class="table-card">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <span class="show-wrap">Show
            <select v-model="pageSize" @change="currentPage = 1" class="show-select">
              <option :value="6">6</option>
              <option :value="12">12</option>
              <option :value="24">24</option>
            </select>
          </span>
          <button @click="openAddForm" class="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add School
          </button>
        </div>
        <div class="table-toolbar-right">
          <label v-if="auth.isSuperadmin" class="archive-toggle" :class="{ 'is-checked': includeArchived }">
            <svg class="toolbar-control-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>
            </svg>
            <span>Show archived</span>
            <input v-model="includeArchived" type="checkbox" @change="loadSchools" />
            <span class="toolbar-switch" aria-hidden="true"></span>
          </label>
          <span class="tbl-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input v-model="searchQuery" type="text" placeholder="Search schools" />
          </span>
        </div>
      </div>
      <div style="padding: 18px 20px;">
        <div v-if="pagedSchools.length" class="schools-grid">
          <div v-for="(s, idx) in pagedSchools" :key="s?.id || idx" class="school-card" :class="{ 'school-card--archived': !!s?.archived_at }">
            <div class="school-card-top">
              <div class="school-card-identity">
                <div class="school-card-avatar" aria-hidden="true">
                  {{ (s?.short || s?.name || 'S').charAt(0).toUpperCase() }}
                </div>
                <div class="school-card-heading">
                  <h3 class="school-card-name">{{ s?.name || 'School' }}</h3>
                  <span v-if="s?.archived_at" class="badge badge-warning">Archived</span>
                  <span v-else class="school-card-status">Active school</span>
                </div>
              </div>
              <div class="school-card-actions">
                <button v-if="!s?.archived_at" @click="editSchool(s)" class="table-action-btn" title="Edit" aria-label="Edit school">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  </svg>
                </button>
                <button v-if="auth.isSuperadmin && !s?.archived_at" @click="openArchive(s)" class="table-action-btn" title="Archive" aria-label="Archive school">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>
                  </svg>
                </button>
                <button v-if="auth.isSuperadmin && s?.archived_at" @click="restore(s)" class="table-action-btn" title="Restore" aria-label="Restore school">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/>
                  </svg>
                </button>
                <button v-if="auth.isSuperadmin" @click="exportSchool(s)" class="table-action-btn" :title="exportingSchoolId === s?.id ? 'Exporting...' : 'Export school data'" :aria-label="exportingSchoolId === s?.id ? 'Exporting school data' : 'Export school data'" :disabled="exportingSchoolId === s?.id">
                  <span v-if="exportingSchoolId === s?.id" class="spinner" aria-hidden="true"></span>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>
                  </svg>
                </button>
                <button v-if="auth.isSuperadmin" @click="removeSchool(s?.id)" class="table-action-btn table-action-btn--danger" title="Delete" aria-label="Delete school">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-1 2-1h4c1 0 2 1 2 2v1"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="school-card-body">
              <div class="school-card-details">
                <div class="school-card-detail" :class="{ 'school-card-detail--empty': !s?.school_id }">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>{{ s?.school_id || 'No school ID' }}</span>
                </div>
                <div class="school-card-detail" :class="{ 'school-card-detail--empty': !s?.short }">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                  </svg>
                  <span>{{ s?.short || 'No short name' }}</span>
                </div>
                <div class="school-card-detail school-card-detail--address" :class="{ 'school-card-detail--empty': !s?.address }">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{{ s?.address || 'No address provided' }}</span>
                </div>
              </div>
            </div>
            <div class="school-card-footer">
              <span class="badge badge-info" v-if="s?.school_id">ID: {{ s.school_id }}</span>
              <span class="badge badge-success" v-if="s?.short">{{ s.short }}</span>
              <span v-if="!s?.school_id && !s?.short" class="school-card-footer-empty">Profile details pending</span>
            </div>
          </div>
        </div>
        <div v-else class="empty">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m2 7 10-5 10 5-10 5L2 7Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>
            </svg>
          </div>
          <h3 v-if="searchQuery">No schools match "{{ searchQuery }}"</h3>
          <h3 v-else>No schools registered yet</h3>
          <p v-if="searchQuery">Try a different search term or clear the filter.</p>
          <p v-else>Click "Add School" to register your first school.</p>
        </div>
      </div>
      <div class="table-footer" v-if="filteredSchools.length">
        <span class="table-count">Showing {{ showingFrom }} to {{ showingTo }} of {{ filteredSchools.length }} entries</span>
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

    <!-- Add/Edit Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="cancelForm">
      <div class="form-card schools-modal">
        <div class="schools-modal-header">
          <div>
            <h2>{{ editingSchool ? 'Edit School' : 'Register New School' }}</h2>
            <p v-if="editingSchool">Update the school profile details below.</p>
            <p v-else>Fill in the details to register a new school in the system.</p>
          </div>
          <button @click="cancelForm" class="btn-icon" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSave" class="schools-modal-body">
          <!-- School Info Section -->
          <div class="form-section">
            <div class="form-section-label">School Information</div>
            <div class="form-group">
              <label>School Name <span class="required">*</span></label>
              <input v-model="form.name" required placeholder="e.g. SANTA MARIA NATIONAL HIGH SCHOOL" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>School ID</label>
                <input v-model="form.school_id" placeholder="e.g. 300999" />
              </div>
              <div class="form-group">
                <label>Short Name</label>
                <input v-model="form.short" placeholder="e.g. SMNHS" />
              </div>
            </div>
            <div class="form-group">
              <label>Address</label>
              <input v-model="form.address" placeholder="e.g. Santa Maria, Bulacan" />
            </div>
          </div>

          <p v-if="!editingSchool" class="form-hint">
            New schools start with no grade levels. After registering, define them in the Grades & Sections page before enrolling students or assigning teachers.
          </p>

          <!-- Admin Section (new school only) -->
          <template v-if="!editingSchool">
            <div class="form-section">
              <div class="form-section-label">First School Administrator <span class="optional">(optional)</span></div>
              <div class="form-group">
                <label>Admin Full Name</label>
                <input v-model="form.adminName" placeholder="e.g. Juan Dela Cruz" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Admin Username</label>
                  <input v-model="form.adminUsername" placeholder="e.g. smnhs.admin" />
                </div>
                <div class="form-group">
                  <label>Admin Password</label>
                  <input v-model="form.adminPassword" type="password" placeholder="Enter password" autocomplete="new-password" />
                </div>
              </div>
            </div>
          </template>

          <!-- Form Footer -->
          <div class="form-actions">
            <p v-if="formError" class="error-msg">{{ formError }}</p>
            <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner" style="margin-right: 6px;"></span>
              {{ saving ? 'Saving...' : (editingSchool ? 'Update School' : 'Register School') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Archive confirmation and dependency preview -->
    <div v-if="showArchiveModal" class="modal-overlay" @click.self="closeArchive">
      <div class="form-card schools-modal">
        <div class="schools-modal-header">
          <div>
            <h2>{{ archiveAction === 'delete' ? 'Delete' : 'Archive' }} {{ archiveSchoolData?.name || 'School' }}</h2>
            <p v-if="archiveAction === 'delete'">This permanently deletes the school and all of its users, students, attendance, inquiries, licenses, and subscription requests. This cannot be undone.</p>
            <p v-else>Archiving preserves historical records and disables the school's accounts. It can be restored later.</p>
          </div>
          <button @click="closeArchive" class="btn-icon" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div class="schools-modal-body">
          <div v-if="dependencyPreview" class="form-hint">
            This school has {{ dependencyPreview.total }} related record(s):
            {{ Object.entries(dependencyPreview.counts).map(([key, value]) => `${key}: ${value}`).join(', ') }}.
          </div>
          <div v-else class="form-hint">Loading dependent record counts...</div>
          <div class="form-group">
            <template v-if="archiveAction === 'archive'">
              <label>Archive reason <span class="optional">(optional)</span></label>
              <textarea v-model="archiveReason" maxlength="1000" rows="3" placeholder="Reason for archiving"></textarea>
            </template>
          </div>
          <p v-if="archiveError" class="error-msg">{{ archiveError }}</p>
          <div class="form-actions">
            <button v-if="auth.isSuperadmin" type="button" @click="exportSchool(archiveSchoolData)" class="btn-secondary" :disabled="exportingSchoolId === archiveSchoolData?.id">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
              {{ exportingSchoolId === archiveSchoolData?.id ? 'Exporting...' : 'Export Data' }}
            </button>
            <button type="button" @click="closeArchive" class="btn-secondary">Cancel</button>
            <button type="button" @click="confirmArchive" class="btn-primary" :class="{ 'btn-danger': archiveAction === 'delete' }" :disabled="archiving || !dependencyPreview">{{ archiving ? (archiveAction === 'delete' ? 'Deleting...' : 'Archiving...') : (archiveAction === 'delete' ? 'Delete Permanently' : 'Archive School') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'
import { loadPageState, savePageState } from '../composables/usePageState'

const auth = useAuthStore()
const { notify } = useNotifications()
const savedState = loadPageState(auth.user, 'schools')
const schools = ref([])
const includeArchived = ref(false)
const searchQuery = ref(savedState?.search || '')
const showForm = ref(false)
const editingSchool = ref(null)
const saving = ref(false)
const formError = ref('')
const pageSize = ref(Number.isFinite(Number(savedState?.pageSize)) && Number(savedState.pageSize) > 0 ? Number(savedState.pageSize) : 6)
const form = ref({ name: '', school_id: '', short: '', address: '', adminName: '', adminUsername: '', adminPassword: '' })
const showArchiveModal = ref(false)
const archiveSchoolData = ref(null)
const archiveAction = ref('archive')
const dependencyPreview = ref(null)
const archiveReason = ref('')
const archiveError = ref('')
const archiving = ref(false)
const exportingSchoolId = ref('')

onMounted(loadSchools)

const filteredSchools = computed(() => {
  if (!Array.isArray(schools.value)) return []
  const q = (searchQuery.value || '').toLowerCase().trim()
  const valid = schools.value.filter(Boolean)
  if (!q) return valid
  return valid.filter(s =>
    (s?.name || '').toLowerCase().includes(q) ||
    (s?.short || '').toLowerCase().includes(q) ||
    (s?.school_id || '').toLowerCase().includes(q) ||
    (s?.address || '').toLowerCase().includes(q)
  )
})

// Client-side pagination for the school grid
const currentPage = ref(Number.isFinite(Number(savedState?.page)) && Number(savedState.page) > 0 ? Number(savedState.page) : 1)
const totalPages = computed(() => {
  const size = Math.max(1, Number(pageSize.value) || 6)
  const totalItems = Array.isArray(filteredSchools.value) ? filteredSchools.value.length : 0
  return Math.max(1, Math.ceil(totalItems / size))
})
const pagedSchools = computed(() => {
  if (!Array.isArray(filteredSchools.value)) return []
  const size = Math.max(1, Number(pageSize.value) || 6)
  const page = Math.max(1, Math.min(currentPage.value || 1, totalPages.value))
  const start = (page - 1) * size
  return filteredSchools.value.slice(start, start + size)
})
const showingFrom = computed(() => {
  const len = Array.isArray(filteredSchools.value) ? filteredSchools.value.length : 0
  if (!len) return 0
  const size = Math.max(1, Number(pageSize.value) || 6)
  const page = Math.max(1, Math.min(currentPage.value || 1, totalPages.value))
  return (page - 1) * size + 1
})
const showingTo = computed(() => {
  const len = Array.isArray(filteredSchools.value) ? filteredSchools.value.length : 0
  if (!len) return 0
  const size = Math.max(1, Number(pageSize.value) || 6)
  const page = Math.max(1, Math.min(currentPage.value || 1, totalPages.value))
  return Math.min(len, page * size)
})
const pageNumbers = computed(() => {
  const total = totalPages.value || 1
  const cur = Math.max(1, Math.min(currentPage.value || 1, total))
  if (total <= 4) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 2) return [1, 2, 3].filter(p => p <= total)
  if (cur >= total - 1) return [total - 2, total - 1, total].filter(p => p >= 1)
  return [cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= total)
})
function goToPage(p) { currentPage.value = p }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
// Reset paging when search changes
watch(searchQuery, () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })
watch([searchQuery, pageSize, currentPage], () => {
  if (auth.user) {
    savePageState(auth.user, { search: searchQuery.value, pageSize: pageSize.value, page: currentPage.value }, 'schools')
  }
})
watch(filteredSchools, (list) => {
  const maxPage = Math.max(1, Math.ceil((list?.length || 0) / (pageSize.value || 6)))
  if (currentPage.value > maxPage) currentPage.value = 1
})

const schoolsWithId = computed(() => (Array.isArray(schools.value) ? schools.value.filter(s => s && s.school_id).length : 0))
const schoolsWithAddress = computed(() => (Array.isArray(schools.value) ? schools.value.filter(s => s && s.address).length : 0))

async function loadSchools() {
  try {
    const list = await auth.getSchools(includeArchived.value)
    schools.value = Array.isArray(list) ? list.filter(Boolean) : []
  } catch (err) {
    console.error('Failed to load schools:', err)
    schools.value = []
  }
}

function openAddForm() {
  editingSchool.value = null
  form.value = { name: '', school_id: '', short: '', address: '', adminName: '', adminUsername: '', adminPassword: '' }
  formError.value = ''
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingSchool.value = null
  formError.value = ''
}

async function handleSave() {
  saving.value = true
  formError.value = ''
  try {
    if (editingSchool.value) {
      await auth.updateSchool(editingSchool.value.id, {
        name: form.value.name,
        school_id: form.value.school_id,
        address: form.value.address,
        short: form.value.short
      })
      notify('School updated', 'success')
    } else {
      const payload = {
        name: form.value.name,
        school_id: form.value.school_id,
        address: form.value.address,
        short: form.value.short
      }
      if (form.value.adminUsername && form.value.adminPassword && form.value.adminName) {
        payload.admin = {
          name: form.value.adminName,
          username: form.value.adminUsername,
          password: form.value.adminPassword
        }
      } else if (form.value.adminUsername || form.value.adminPassword || form.value.adminName) {
        throw new Error('Fill all three admin fields, or leave them blank')
      }
      await auth.addSchool(payload)
      notify('School registered', 'success')
    }
    await loadSchools()
    cancelForm()
  } catch (e) {
    formError.value = e.message
    notify(e.message, 'error')
  } finally {
    saving.value = false
  }
}

function editSchool(s) {
  if (s?.archived_at) return
  editingSchool.value = s
  form.value = { name: s.name, school_id: s.school_id || '', short: s.short || '', address: s.address || '', adminName: '', adminUsername: '', adminPassword: '' }
  formError.value = ''
  showForm.value = true
}

function openArchive(s) {
  archiveSchoolData.value = s
  archiveAction.value = 'archive'
  dependencyPreview.value = null
  archiveReason.value = ''
  archiveError.value = ''
  showArchiveModal.value = true
  auth.getSchoolDependencyPreview(s.id).then(data => { dependencyPreview.value = data }).catch(error => { archiveError.value = error.message })
}

function closeArchive() {
  showArchiveModal.value = false
  archiveSchoolData.value = null
  archiveAction.value = 'archive'
  dependencyPreview.value = null
  archiveReason.value = ''
  archiveError.value = ''
}

async function confirmArchive() {
  if (!archiveSchoolData.value) return
  archiving.value = true
  archiveError.value = ''
  try {
    if (archiveAction.value === 'delete') {
      await auth.deleteSchool(archiveSchoolData.value.id)
      closeArchive()
      await loadSchools()
      notify('School deleted', 'success')
    } else {
      await auth.archiveSchool(archiveSchoolData.value.id, archiveReason.value)
      closeArchive()
      await loadSchools()
      notify('School archived', 'success')
    }
  } catch (e) {
    archiveError.value = e.message
    notify(e.message, 'error')
  } finally {
    archiving.value = false
  }
}

async function restore(s) {
  if (!confirm(`Restore ${s?.name || 'this school'}? Accounts that were disabled before archiving will remain disabled.`)) return
  try {
    await auth.restoreSchool(s.id)
    await loadSchools()
    notify('School restored', 'success')
  } catch (e) {
    notify(e.message, 'error')
  }
}

async function exportSchool(s) {
  if (!s?.id || !auth.isSuperadmin || exportingSchoolId.value) return
  exportingSchoolId.value = s.id
  try {
    await auth.exportSchoolData(s.id)
    notify('School data exported', 'success')
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    exportingSchoolId.value = ''
  }
}

function removeSchool(id) {
  if (!auth.isSuperadmin) return
  const school = schools.value.find(item => item?.id === id)
  if (!school) return
  archiveSchoolData.value = school
  archiveAction.value = 'delete'
  dependencyPreview.value = null
  archiveReason.value = ''
  archiveError.value = ''
  showArchiveModal.value = true
  auth.getSchoolDependencyPreview(id).then(data => { dependencyPreview.value = data }).catch(error => { archiveError.value = error.message })
}
</script>

<style scoped>
/* Schools-specific overrides that aren't in global CSS */

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-bg);
}

.search-box svg {
  color: var(--muted-foreground);
  flex-shrink: 0;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.88rem;
  color: var(--foreground);
  width: 200px;
}

.search-box input::placeholder {
  color: var(--muted-foreground);
  opacity: 0.7;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  box-shadow: var(--shadow-xs);
  transition: transform 0.15s, box-shadow 0.15s;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon--primary {
  background: var(--primary-bg);
  color: var(--primary);
}

.stat-icon--info {
  background: var(--info-bg);
  color: var(--info);
}

.stat-icon--success {
  background: var(--success-bg);
  color: var(--success);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--foreground);
  line-height: 1.1;
}

.stat-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--muted-foreground);
  margin-top: 2px;
}

/* School Cards Grid */
.schools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.school-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
}

.school-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
}

.school-card--archived {
  opacity: 0.82;
}

.school-card--archived:hover {
  opacity: 1;
}

.school-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px 0;
}

.school-card-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 auto;
}

.school-card-avatar {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 46px;
  font-weight: 700;
  font-size: 1.15rem;
  font-family: 'Lora', serif;
}

.school-card-heading {
  min-width: 0;
}

.school-card-heading .school-card-name {
  margin: 0;
}

.school-card-status {
  display: block;
  margin-top: 4px;
  color: var(--success);
  font-size: 0.68rem;
  font-weight: 700;
}

.school-card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 48%;
  flex: 0 1 auto;
}

.table-action-btn--danger {
  color: var(--destructive);
  border-color: color-mix(in srgb, var(--destructive) 28%, var(--border));
}

.table-action-btn--danger:hover {
  background: var(--red-bg);
  color: var(--destructive);
  border-color: var(--destructive);
}

.school-card-body {
  padding: 14px 20px 16px;
  flex: 1;
}

.school-card-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--foreground);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.school-card-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.school-card-detail {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  color: var(--muted-foreground);
}

.school-card-detail svg {
  flex-shrink: 0;
  opacity: 0.65;
}

.school-card-detail span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.school-card-detail--empty {
  opacity: 0.68;
  font-style: italic;
}

.school-card-footer {
  min-height: 43px;
  padding: 10px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.school-card-footer-empty {
  color: var(--muted-foreground);
  font-size: 0.72rem;
  font-style: italic;
}

@media (max-width: 760px) {
  .school-card-top {
    flex-direction: column;
  }

  .school-card-actions {
    width: 100%;
    max-width: none;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .schools-grid {
    grid-template-columns: 1fr;
  }

  .school-card-top {
    align-items: flex-start;
    gap: 12px;
  }

  .school-card-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .school-card-actions .table-action-btn {
    padding: 5px 7px;
    font-size: 0.68rem;
  }
}

/* Empty state */
.empty-icon {
  margin-bottom: 16px;
  opacity: 0.35;
}

.empty h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 6px;
}

.empty p {
  font-size: 0.88rem;
}

/* Modal overrides */
.schools-modal {
  margin-bottom: 0;
}

.schools-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.schools-modal-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--foreground);
}

.schools-modal-header p {
  font-size: 0.84rem;
  color: var(--muted-foreground);
  margin-top: 3px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted-foreground);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-icon:hover {
  background: var(--secondary);
  color: var(--foreground);
}

.schools-modal-body {
  padding: 0;
}

/* Form Sections */
.form-section {
  margin-bottom: 20px;
}

.form-section-label {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted-foreground);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  opacity: 0.7;
}

.required {
  color: var(--destructive);
}

.form-hint {
  font-size: 0.82rem;
  color: var(--muted-foreground);
  margin-bottom: 20px;
  padding: 10px 14px;
  background: var(--info-bg);
  border-radius: var(--radius-md);
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  .page-header-actions {
    width: 100%;
  }
  .search-box {
    flex: 1;
  }
  .search-box input {
    width: 100%;
  }
  .schools-grid {
    grid-template-columns: 1fr;
  }
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
