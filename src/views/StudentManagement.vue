<template>
  <div class="management-page">
    <div class="page-header">
      <div>
        <h1>Student Management</h1>
        <p>Manage student rosters, filter by grade and section, and configure gender assignments.</p>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="cancelForm">
      <div class="form-card">
        <h3>{{ editingStudent ? 'Edit Student Details' : 'Add Student(s) to Roster' }}</h3>
        <form @submit.prevent="handleSave">
          <template v-if="editingStudent">
            <div class="form-group">
              <label>Student Full Name</label>
              <input v-model="form.name" required placeholder="LAST NAME, FIRST NAME, MIDDLE NAME" />
            </div>
          </template>
          <template v-else>
            <div class="form-group">
              <label>Student Names</label>
              <span class="label-hint">One learner name per line</span>
              <textarea v-model="form.names" rows="5" required placeholder="Enter one learner name per line"></textarea>
            </div>
          </template>
          <div class="form-row">
            <div class="form-group">
              <label>Grade Level</label>
              <select v-model="form.grade" @change="form.section = ''" required>
                <option value="" disabled v-if="!grades.length">No grade levels defined</option>
                <option v-for="g in grades" :key="g">{{ g }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Section</label>
              <select v-model="form.section" required>
                <option value="" disabled>Select section</option>
                <option v-for="s in availableSections" :key="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Gender</label>
            <select v-model="form.gender">
              <option value="">— Select Gender —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner" style="margin-right: 6px;"></span>
              {{ saving ? 'Saving...' : (editingStudent ? 'Update Student' : 'Save Students') }}
            </button>
            <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEnrollmentModal" class="modal-overlay" @click.self="closeEnrollmentModal">
      <div class="form-card">
        <h3>{{ enrollmentStudent?.name }} — Enrollment Change</h3>
        <form @submit.prevent="saveEnrollmentEvent">
          <div class="form-group">
            <label>Action</label>
            <select v-model="enrollmentForm.eventType" required>
              <option value="transfer">Change Class</option>
              <option value="promote">Promote</option>
              <option value="reenroll">Re-enroll</option>
              <option value="withdraw">Withdraw</option>
            </select>
          </div>
          <div class="form-row" v-if="enrollmentForm.eventType !== 'withdraw'">
            <div class="form-group">
              <label>Grade Level</label>
              <select v-model="enrollmentForm.grade" required>
                <option v-for="g in grades" :key="g">{{ g }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Section</label>
              <select v-model="enrollmentForm.section" required>
                <option v-for="s in (sectionsByGrade[enrollmentForm.grade] || [])" :key="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Effective Date</label>
            <input v-model="enrollmentForm.effectiveOn" type="date" required />
          </div>
          <div class="form-group">
            <label>Reason</label>
            <textarea v-model="enrollmentForm.reason" rows="3" required placeholder="Explain this enrollment change"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="enrollmentSaving">{{ enrollmentSaving ? 'Saving...' : 'Save Change' }}</button>
            <button type="button" @click="closeEnrollmentModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
      <div class="form-card">
        <h3>{{ historyStudent?.name }} — Enrollment History</h3>
        <div v-if="historyLoading" class="empty">Loading history...</div>
        <div v-else-if="!history.length" class="empty">No enrollment history found.</div>
        <div v-else class="activity-list">
          <div v-for="item in history" :key="item.id" class="activity-item">
            <strong>{{ item.event_type }}</strong>
            <span>{{ item.effective_on }} · {{ item.grade }} · {{ item.section }}</span>
            <small>{{ item.reason }}</small>
          </div>
        </div>
        <div class="form-actions"><button type="button" @click="showHistoryModal = false" class="btn-secondary">Close</button></div>
      </div>
    </div>

    <div v-if="showBulkReenrollModal" class="modal-overlay" @click.self="closeBulkReenrollModal">
      <div class="form-card">
        <h3>Re-enroll {{ selectedIds.size }} Selected Student{{ selectedIds.size > 1 ? 's' : '' }}</h3>
        <form @submit.prevent="submitBulkReenroll">
          <div class="form-group">
            <label>Class Assignment</label>
            <select v-model="bulkReenrollMode">
              <option value="keep">Keep each student's current grade and section</option>
              <option value="assign">Assign all selected students to a new class</option>
            </select>
          </div>
          <div class="form-row" v-if="bulkReenrollMode === 'assign'">
            <div class="form-group">
              <label>Grade Level</label>
              <select v-model="bulkReenrollForm.grade" required>
                <option value="" disabled>Select grade</option>
                <option v-for="g in grades" :key="g">{{ g }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Section</label>
              <select v-model="bulkReenrollForm.section" required>
                <option value="" disabled>Select section</option>
                <option v-for="s in (sectionsByGrade[bulkReenrollForm.grade] || [])" :key="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Effective Date</label>
            <input v-model="bulkReenrollForm.effectiveOn" type="date" required />
          </div>
          <div class="form-group">
            <label>Reason</label>
            <textarea v-model="bulkReenrollForm.reason" rows="3" required placeholder="Reason for re-enrollment"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="bulkReenrollSaving">
              <span v-if="bulkReenrollSaving" class="spinner" style="margin-right: 6px;"></span>
              {{ bulkReenrollSaving ? 'Re-enrolling...' : 'Re-enroll Students' }}
            </button>
            <button type="button" @click="closeBulkReenrollModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <span class="show-wrap">Show
            <select v-model="pageSize" @change="onPageSizeChange" class="show-select">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </span>
          <button @click="openAddForm" class="btn-primary" :disabled="auth.isSuperadmin && !effectiveSchoolId">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Student(s)
          </button>
        </div>
        <div class="table-toolbar-right">
          <span class="tbl-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search student" />
          </span>
          <select v-if="auth.isSuperadmin" v-model="filterSchoolId" @change="onSchoolChange" class="tbl-filter">
            <option value="">None</option>
            <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}{{ s.school_id ? ' (' + s.school_id + ')' : '' }}</option>
          </select>
          <select v-model="filterGrade" @change="filterSection = ''; currentPage = 1; loadStudents()" class="tbl-filter">
            <option value="">All Grades</option>
            <option v-for="g in grades" :key="g">{{ g }}</option>
          </select>
          <select v-model="filterSection" @change="currentPage = 1; loadStudents()" class="tbl-filter">
            <option value="">All Sections</option>
            <option v-for="s in filterSections" :key="s">{{ s }}</option>
          </select>
          <select v-model="filterGender" @change="currentPage = 1; loadStudents()" class="tbl-filter">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <label class="tbl-check"><input v-model="includeWithdrawn" @change="currentPage = 1; loadStudents()" type="checkbox" /> Include withdrawn</label>
        </div>
      </div>
      <div class="bulk-bar" v-if="selectedIds.size" style="margin: 12px 20px 0;">
        <span>{{ selectedIds.size }} student{{ selectedIds.size > 1 ? 's' : '' }} selected</span>
        <button @click="openBulkReenrollModal" class="btn-sm btn-success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
          </svg>
          Re-enroll Selected
        </button>
        <button @click="bulkWithdraw" class="btn-sm btn-danger">Withdraw Selected</button>
        <button @click="clearSelection" class="btn-sm btn-secondary">Clear</button>
      </div>
      <div style="overflow-x: auto;">
      <table class="data-table" v-if="students.length">
        <thead>
          <tr>
            <th class="col-chk"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
            <th class="cell-id">ID</th>
            <th>Student</th>
            <th v-if="auth.isSuperadmin">School</th>
            <th>Gender</th>
            <th>Grade</th>
            <th>Section</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in pagedStudents" :key="s.id" :class="{ 'row-selected': selectedIds.has(s.id) }">
            <td class="col-chk"><input type="checkbox" :checked="selectedIds.has(s.id)" @change="toggleOne(s.id)" /></td>
            <td class="cell-id">#{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>
              <div class="cell-person">
                <span class="cell-avatar">{{ (s.name || '?').charAt(0).toUpperCase() }}</span>
                <div style="min-width: 0;">
                  <div class="cell-main">{{ s.name }}</div>
                  <div class="cell-sub">{{ s.grade }} &middot; {{ s.section }}</div>
                </div>
              </div>
            </td>
            <td v-if="auth.isSuperadmin">{{ schoolNameOf(s) }}</td>
            <td>
              <span v-if="s.gender" :class="['pill', s.gender === 'Male' ? 'pill--blue' : 'pill--green']">{{ s.gender }}</span>
              <span v-else style="color: var(--muted-foreground)">—</span>
            </td>
            <td>{{ s.grade }}</td>
            <td>
              {{ s.section }}
              <span v-if="s.enrollment_status === 'withdrawn'" class="pill pill--red">Withdrawn</span>
              <button
                v-if="s.enrollment_status === 'withdrawn'"
                @click="openReenrollModal(s)"
                class="btn-xs-reenroll"
                title="Re-enroll this student"
              >
                Re-enroll
              </button>
            </td>
            <td style="text-align: right;">
              <div class="row-actions">
                <button @click="viewHistory(s)" class="icon-btn" title="View enrollment history">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
                </button>
                <button @click="openEnrollmentModal(s)" class="icon-btn" title="Change enrollment">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18"/></svg>
                </button>
                <button @click="openReenrollModal(s)" class="icon-btn" :class="{ 'icon-btn--success': s.enrollment_status === 'withdrawn' }" title="Re-enroll student">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                </button>
                <button @click="editStudent(s)" class="icon-btn" title="Edit details">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button v-if="s.enrollment_status !== 'withdrawn'" @click="removeStudent(s)" class="icon-btn icon-btn--danger" title="Withdraw">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      <p v-if="!students.length" class="empty">{{ auth.isSuperadmin && !effectiveSchoolId ? 'Select a school above to view its students.' : 'No students found matching your filters.' }}</p>
      <div class="table-footer" v-if="students.length">
        <span class="table-count">Showing {{ showingFrom }} to {{ showingTo }} of {{ students.length }} entries</span>
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
import { ref, computed, onMounted } from 'vue'
import { useAttendanceStore } from '../stores/attendance'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useGradeLevels } from '../composables/useGradeLevels'

const store = useAttendanceStore()
const auth = useAuthStore()
const { addToast } = useToast()
const { grades, sectionsByGrade, loadGradeLevels } = useGradeLevels()
const availableSections = computed(() => sectionsByGrade.value[form.value.grade] || [])
const filterSections = computed(() => filterGrade.value ? (sectionsByGrade.value[filterGrade.value] || []) : [])
const showForm = ref(false)
const editingStudent = ref(null)
const saving = ref(false)
const schools = ref([])
const filterSchoolId = ref('')
const effectiveSchoolId = computed(() => auth.isSuperadmin ? (filterSchoolId.value || '') : (auth.schoolId || ''))
const filterGrade = ref('')
const filterSection = ref('')
const filterGender = ref('')
const includeWithdrawn = ref(false)
const searchQuery = ref('')
const students = ref([])
const form = ref({ names: '', name: '', grade: '', section: '', gender: '' })
const showEnrollmentModal = ref(false)
const enrollmentStudent = ref(null)
const enrollmentSaving = ref(false)
const enrollmentForm = ref({ eventType: 'transfer', effectiveOn: new Date().toISOString().slice(0, 10), grade: '', section: '', reason: '' })
const showBulkReenrollModal = ref(false)
const bulkReenrollSaving = ref(false)
const bulkReenrollMode = ref('keep')
const bulkReenrollForm = ref({ grade: '', section: '', effectiveOn: new Date().toISOString().slice(0, 10), reason: 'Re-enrolled' })
const showHistoryModal = ref(false)
const historyStudent = ref(null)
const history = ref([])
const historyLoading = ref(false)
const selectedIds = ref(new Set())
const pageSize = ref(10)
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(students.value.length / pageSize.value)))
const pagedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return students.value.slice(start, start + pageSize.value)
})
const showingFrom = computed(() => (students.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const showingTo = computed(() => Math.min(students.value.length, currentPage.value * pageSize.value))
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

function applyGradeDefaults() {
  if (!grades.value.length) { form.value.grade = ''; form.value.section = ''; return }
  if (!grades.value.includes(form.value.grade)) {
    form.value.grade = grades.value[0]
    form.value.section = ''
  }
}

function schoolNameOf(s) {
  if (!s.school_id) return '—'
  const found = schools.value.find(x => x.id === s.school_id)
  return found ? (found.short ? `${found.name} (${found.short})` : found.name) : s.school_id
}

const allSelected = computed(() => students.value.length > 0 && students.value.every(s => selectedIds.value.has(s.id)))

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(students.value.map(s => s.id))
  }
}

function toggleOne(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  selectedIds.value = next
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function bulkWithdraw() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) return
  const result = await store.deleteStudents(ids, effectiveSchoolId.value)
  selectedIds.value = new Set()
  await loadStudents()
  addToast(result.count + ' students withdrawn', 'success')
}

onMounted(async () => {
  if (auth.isSuperadmin) {
    try { schools.value = await auth.getSchools() } catch {}
  }
  await loadGradeLevels(effectiveSchoolId.value || undefined)
  applyGradeDefaults()
  await loadStudents()
})

async function onSchoolChange() {
  filterGrade.value = ''
  filterSection.value = ''
  selectedIds.value = new Set()
  currentPage.value = 1
  await loadGradeLevels(filterSchoolId.value || undefined)
  applyGradeDefaults()
  await loadStudents()
}

async function loadStudents() {
  const sid = effectiveSchoolId.value
  if (auth.isSuperadmin && !sid) { students.value = []; return }
  const params = {}
  if (sid) params.schoolId = sid
  if (filterGrade.value) params.grade = filterGrade.value
  if (filterSection.value) params.section = filterSection.value
  if (filterGender.value) params.gender = filterGender.value
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
  if (includeWithdrawn.value) params.includeWithdrawn = 'true'
  students.value = await store.getStudents(params)
  if (currentPage.value > totalPages.value) currentPage.value = 1
}

let searchTimer = null
function onSearchInput() {
  currentPage.value = 1
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadStudents(), 300)
}

function openAddForm() {
  editingStudent.value = null
  form.value = { names: '', name: '', grade: grades.value[0] || '', section: '', gender: '' }
  showForm.value = true
}

function resetForm() {
  form.value = { names: '', name: '', grade: grades.value[0] || '', section: '', gender: '' }
  editingStudent.value = null
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

function capitalizeName(name) {
  return name.toUpperCase()
}

function parseNames(text) {
  return text.split('\n').map(n => n.trim().replace(/\r$/, '')).filter(Boolean).map(capitalizeName)
}

async function handleSave() {
  saving.value = true
  try {
    const sid = effectiveSchoolId.value
    if (auth.isSuperadmin && !sid) throw new Error('Select a school first')
    if (editingStudent.value) {
      await store.updateStudent(editingStudent.value.id, { name: capitalizeName(form.value.name), gender: form.value.gender })
      addToast('Student updated', 'success')
      await loadStudents()
      cancelForm()
    } else {
      const names = parseNames(form.value.names)
      if (names.length === 0) {
        addToast('No names provided', 'error')
        return
      }
      if (names.length === 1) {
        await store.addStudent({ ...(sid ? { schoolId: sid } : {}), name: names[0], grade: form.value.grade, section: form.value.section, gender: form.value.gender })
        addToast('Student added', 'success')
      } else {
        const result = await store.addStudents({ ...(sid ? { schoolId: sid } : {}), names, grade: form.value.grade, section: form.value.section, gender: form.value.gender })
        const added = result.count
        const skipped = result.skipped || []
        if (skipped.length) addToast(added + ' added, ' + skipped.length + ' skipped (duplicates)', 'warning')
        else addToast(added + ' students added', 'success')
      }
      form.value.names = ''
      await loadStudents()
      saving.value = false
      return
    }
  } catch (e) {
    addToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

function editStudent(s) {
  editingStudent.value = s
  form.value = { names: '', name: s.name, grade: s.grade, section: s.section, gender: s.gender || '' }
  showForm.value = true
}

function openEnrollmentModal(student) {
  enrollmentStudent.value = student
  enrollmentForm.value = { eventType: student.enrollment_status === 'withdrawn' ? 'reenroll' : 'transfer', effectiveOn: new Date().toISOString().slice(0, 10), grade: student.grade, section: student.section, reason: '' }
  showEnrollmentModal.value = true
}

function openReenrollModal(student) {
  enrollmentStudent.value = student
  enrollmentForm.value = {
    eventType: 'reenroll',
    effectiveOn: new Date().toISOString().slice(0, 10),
    grade: student.grade || (grades.value[0] || ''),
    section: student.section || (sectionsByGrade.value[student.grade]?.[0] || ''),
    reason: student.enrollment_status === 'withdrawn' ? 'Re-enrolled after withdrawal' : 'Re-enrolled'
  }
  showEnrollmentModal.value = true
}

function openBulkReenrollModal() {
  bulkReenrollMode.value = 'keep'
  bulkReenrollForm.value = {
    grade: grades.value[0] || '',
    section: '',
    effectiveOn: new Date().toISOString().slice(0, 10),
    reason: 'Re-enrolled'
  }
  showBulkReenrollModal.value = true
}

function closeBulkReenrollModal() {
  showBulkReenrollModal.value = false
}

async function submitBulkReenroll() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) return
  bulkReenrollSaving.value = true
  try {
    const payload = {
      ids,
      effectiveOn: bulkReenrollForm.value.effectiveOn,
      reason: bulkReenrollForm.value.reason
    }
    if (bulkReenrollMode.value === 'assign') {
      if (!bulkReenrollForm.value.grade || !bulkReenrollForm.value.section) {
        addToast('Please select both grade and section', 'error')
        bulkReenrollSaving.value = false
        return
      }
      payload.grade = bulkReenrollForm.value.grade
      payload.section = bulkReenrollForm.value.section
    }
    const result = await store.reenrollStudents(payload, effectiveSchoolId.value)
    closeBulkReenrollModal()
    selectedIds.value = new Set()
    await loadStudents()
    if (result.count) {
      addToast(`${result.count} student${result.count > 1 ? 's' : ''} re-enrolled`, 'success')
    }
    if (result.skipped?.length) {
      addToast(`${result.skipped.length} student${result.skipped.length > 1 ? 's' : ''} skipped`, 'warning')
    }
  } catch (err) {
    addToast(err.message, 'error')
  } finally {
    bulkReenrollSaving.value = false
  }
}

function closeEnrollmentModal() {
  showEnrollmentModal.value = false
  enrollmentStudent.value = null
}

async function saveEnrollmentEvent() {
  if (!enrollmentStudent.value) return
  enrollmentSaving.value = true
  try {
    await store.createEnrollmentEvent(enrollmentStudent.value.id, enrollmentForm.value, effectiveSchoolId.value)
    addToast('Enrollment updated', 'success')
    closeEnrollmentModal()
    await loadStudents()
  } catch (e) {
    addToast(e.message, 'error')
  } finally {
    enrollmentSaving.value = false
  }
}

async function viewHistory(student) {
  historyStudent.value = student
  history.value = []
  historyLoading.value = true
  showHistoryModal.value = true
  try { history.value = await store.getEnrollmentHistory(student.id, effectiveSchoolId.value) } catch (e) { addToast(e.message, 'error') }
  finally { historyLoading.value = false }
}

async function removeStudent(student) {
  try {
    await store.deleteStudent(student.id, effectiveSchoolId.value)
    await loadStudents()
    addToast('Student withdrawn', 'success')
  } catch (e) {
    addToast(e.message, 'error')
  }
}
</script>
