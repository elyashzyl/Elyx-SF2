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
          <div v-for="s in pagedSchools" :key="s.id" class="school-card">
            <div class="school-card-top">
              <div class="school-card-avatar">
                {{ (s.short || s.name || 'S').charAt(0).toUpperCase() }}
              </div>
              <div class="school-card-actions">
                <button @click="editSchool(s)" class="table-action-btn" title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  </svg>
                  Edit
                </button>
                <button @click="removeSchool(s.id)" class="table-action-btn table-action-btn--danger" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="school-card-body">
              <h3 class="school-card-name">{{ s.name }}</h3>
              <div class="school-card-details">
                <div v-if="s.school_id" class="school-card-detail">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>{{ s.school_id }}</span>
                </div>
                <div v-if="s.short" class="school-card-detail">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                  </svg>
                  <span>{{ s.short }}</span>
                </div>
                <div v-if="s.address" class="school-card-detail">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{{ s.address }}</span>
                </div>
              </div>
            </div>
            <div class="school-card-footer">
              <span class="badge badge-info" v-if="s.school_id">ID: {{ s.school_id }}</span>
              <span class="badge badge-success" v-if="s.short">{{ s.short }}</span>
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
                  <input v-model="form.adminPassword" type="text" placeholder="Enter password" />
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useNotifications } from '../composables/useNotifications'
import { loadPageState, savePageState } from '../composables/usePageState'

const auth = useAuthStore()
const { notify } = useNotifications()
const savedState = loadPageState(auth.user)
const schools = ref([])
const searchQuery = ref(savedState?.search || '')
const showForm = ref(false)
const editingSchool = ref(null)
const saving = ref(false)
const formError = ref('')
const pageSize = ref(savedState?.pageSize || 6)
const form = ref({ name: '', school_id: '', short: '', address: '', adminName: '', adminUsername: '', adminPassword: '' })

onMounted(loadSchools)

const filteredSchools = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return schools.value
  return schools.value.filter(s =>
    s.name?.toLowerCase().includes(q) ||
    s.short?.toLowerCase().includes(q) ||
    s.school_id?.toLowerCase().includes(q) ||
    s.address?.toLowerCase().includes(q)
  )
})

// Client-side pagination for the school grid
const currentPage = ref(savedState?.page || 1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredSchools.value.length / pageSize.value)))
const pagedSchools = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredSchools.value.slice(start, start + pageSize.value)
})
const showingFrom = computed(() => (filteredSchools.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const showingTo = computed(() => Math.min(filteredSchools.value.length, currentPage.value * pageSize.value))
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
// Reset paging when search changes
watch(searchQuery, () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })
watch([searchQuery, pageSize, currentPage], () => {
  if (auth.user) {
    savePageState(auth.user, { search: searchQuery.value, pageSize: pageSize.value, page: currentPage.value })
  }
})
watch(filteredSchools, (list) => { if (currentPage.value > Math.max(1, Math.ceil(list.length / pageSize.value))) currentPage.value = 1 })

const schoolsWithId = computed(() => schools.value.filter(s => s.school_id).length)
const schoolsWithAddress = computed(() => schools.value.filter(s => s.address).length)

async function loadSchools() {
  schools.value = await auth.getSchools()
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
  editingSchool.value = s
  form.value = { name: s.name, school_id: s.school_id || '', short: s.short || '', address: s.address || '', adminName: '', adminUsername: '', adminPassword: '' }
  formError.value = ''
  showForm.value = true
}

async function removeSchool(id) {
  if (!confirm('Delete this school? This only works when it has no users, students, or records.')) return
  try {
    await auth.deleteSchool(id)
    await loadSchools()
    notify('School deleted', 'success')
  } catch (e) {
    notify(e.message, 'error')
  }
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
  box-shadow: 0 0 0 3px rgba(108, 21, 36, 0.1);
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
  background: rgba(108, 21, 36, 0.1);
  color: var(--primary);
}

.stat-icon--info {
  background: rgba(37, 99, 235, 0.1);
  color: var(--info);
}

.stat-icon--success {
  background: rgba(22, 163, 74, 0.1);
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

.school-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 0;
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
  font-weight: 700;
  font-size: 1.15rem;
  font-family: 'Lora', serif;
}

.school-card-actions {
  display: flex;
  gap: 6px;
}

.table-action-btn--danger {
  color: var(--destructive);
  border-color: rgba(220, 38, 38, 0.25);
}

.table-action-btn--danger:hover {
  background: rgba(220, 38, 38, 0.08);
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
  margin-bottom: 10px;
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

.school-card-footer {
  padding: 10px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Badge variants */
.badge-info {
  background: rgba(37, 99, 235, 0.12);
  color: var(--info);
  border: 1px solid rgba(37, 99, 235, 0.25);
}

.badge-success {
  background: rgba(22, 163, 74, 0.12);
  color: var(--success);
  border: 1px solid rgba(22, 163, 74, 0.25);
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
  background: rgba(37, 99, 235, 0.06);
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
