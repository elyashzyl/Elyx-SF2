<template>
  <div class="management-page">
    <div class="page-header">
      <h1>Student Management</h1>
      <p>Manage students by grade, section, and gender.</p>
      <div class="page-header-actions">
        <button @click="openAddForm" class="btn-primary">+ Add Student(s)</button>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="cancelForm">
      <div class="form-card">
        <h3>{{ editingStudent ? 'Edit Student' : 'Add Student(s)' }}</h3>
        <form @submit.prevent="handleSave">
          <template v-if="editingStudent">
            <div class="form-group">
              <label>Student Name</label>
              <input v-model="form.name" required />
            </div>
          </template>
          <template v-else>
            <div class="form-group">
              <label>Names</label>
              <span class="label-hint">One name per line</span>
              <textarea v-model="form.names" rows="5" required placeholder="Juan Cruz&#10;Maria Santos&#10;Pedro Reyes"></textarea>
            </div>
          </template>
          <div class="form-row">
            <div class="form-group">
              <label>Grade</label>
              <select v-model="form.grade" @change="form.section = ''" required>
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
              <option value="">— Select —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : (editingStudent ? 'Update' : 'Save') }}</button>
            <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div class="filters">
      <select v-model="filterGrade" @change="filterSection = ''; loadStudents()">
        <option value="">All Grades</option>
        <option v-for="g in grades" :key="g">{{ g }}</option>
      </select>
      <select v-model="filterSection" @change="loadStudents" class="section-filter">
        <option value="">All Sections</option>
        <option v-for="s in filterSections" :key="s">{{ s }}</option>
      </select>
      <select v-model="filterGender" @change="loadStudents">
        <option value="">All Genders</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
    </div>

    <div class="bulk-bar" v-if="selectedIds.size">
      <span>{{ selectedIds.size }} selected</span>
      <button @click="bulkDelete" class="btn-sm btn-danger">Delete Selected</button>
      <button @click="selectedIds.clear()" class="btn-sm btn-secondary">Clear</button>
    </div>

    <table class="data-table" v-if="students.length">
      <thead>
        <tr>
          <th class="col-chk"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
          <th>#</th>
          <th>Name</th>
          <th>Gender</th>
          <th>Grade</th>
          <th>Section</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(s, i) in students" :key="s.id" :class="{ 'row-selected': selectedIds.has(s.id) }">
          <td class="col-chk"><input type="checkbox" :checked="selectedIds.has(s.id)" @change="toggleOne(s.id)" /></td>
          <td>{{ i + 1 }}</td>
          <td>{{ s.name }}</td>
          <td>{{ s.gender || '—' }}</td>
          <td>{{ s.grade }}</td>
          <td>{{ s.section }}</td>
          <td>
            <button @click="editStudent(s)" class="btn-sm">Edit</button>
            <button @click="removeStudent(s.id)" class="btn-sm btn-danger">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="empty">No students found.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAttendanceStore } from '../stores/attendance'
import { useToast } from '../composables/useToast'

const store = useAttendanceStore()
const { addToast } = useToast()
const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const sectionsByGrade = {
  'Grade 7': ['Pine', 'Molave'],
  'Grade 8': ['Cypress', 'Narra'],
  'Grade 9': ['Kamagong', 'Mahogany'],
  'Grade 10': ['Acacia', 'Yakal']
}
const availableSections = computed(() => sectionsByGrade[form.value.grade] || [])
const filterSections = computed(() => filterGrade.value ? (sectionsByGrade[filterGrade.value] || []) : [])
const showForm = ref(false)
const editingStudent = ref(null)
const saving = ref(false)
const filterGrade = ref('')
const filterSection = ref('')
const filterGender = ref('')
const students = ref([])
const form = ref({ names: '', name: '', grade: 'Grade 7', section: '', gender: '' })
const selectedIds = ref(new Set())

const allSelected = computed(() => students.value.length > 0 && students.value.every(s => selectedIds.value.has(s.id)))

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    selectedIds.value = new Set(students.value.map(s => s.id))
  }
}

function toggleOne(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  selectedIds.value = next
}

async function bulkDelete() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length) return
  const result = await store.deleteStudents(ids)
  selectedIds.value = new Set()
  await loadStudents()
  addToast(result.count + ' students deleted', 'success')
}

onMounted(() => loadStudents())

async function loadStudents() {
  const params = {}
  if (filterGrade.value) params.grade = filterGrade.value
  if (filterSection.value) params.section = filterSection.value
  if (filterGender.value) params.gender = filterGender.value
  students.value = await store.getStudents(params)
}

function openAddForm() {
  editingStudent.value = null
  form.value = { names: '', name: '', grade: 'Grade 7', section: '', gender: '' }
  showForm.value = true
}

function resetForm() {
  form.value = { names: '', name: '', grade: 'Grade 7', section: '', gender: '' }
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
    if (editingStudent.value) {
      await store.updateStudent(editingStudent.value.id, { name: capitalizeName(form.value.name), grade: form.value.grade, section: form.value.section, gender: form.value.gender })
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
        await store.addStudent({ name: names[0], grade: form.value.grade, section: form.value.section, gender: form.value.gender })
        addToast('Student added', 'success')
      } else {
        const result = await store.addStudents({ names, grade: form.value.grade, section: form.value.section, gender: form.value.gender })
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

async function removeStudent(id) {
  await store.deleteStudent(id)
  await loadStudents()
  addToast('Student deleted', 'success')
}
</script>
