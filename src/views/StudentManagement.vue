<template>
  <div class="management-page">
    <h1>Student Management</h1>
    <button @click="showForm = true" class="btn-primary" v-if="!showForm">+ Add Student</button>

    <div v-if="showForm" class="form-card">
      <h3>{{ editingStudent ? 'Edit Student' : 'Add Student' }}</h3>
      <form @submit.prevent="handleSave">
        <div class="form-group">
          <label>Student Name</label>
          <input v-model="form.name" required />
        </div>
        <div class="form-group">
          <label>Grade</label>
          <select v-model="form.grade" required>
            <option v-for="g in grades" :key="g">{{ g }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Section</label>
          <input v-model="form.section" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : (editingStudent ? 'Update' : 'Save') }}</button>
          <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>

    <div class="filters">
      <select v-model="filterGrade" @change="loadStudents">
        <option value="">All Grades</option>
        <option v-for="g in grades" :key="g">{{ g }}</option>
      </select>
      <input v-model="filterSection" @input="loadStudents" placeholder="Filter by section" />
    </div>

    <table class="data-table" v-if="students.length">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Grade</th>
          <th>Section</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(s, i) in students" :key="s.id">
          <td>{{ i + 1 }}</td>
          <td>{{ s.name }}</td>
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
import { ref, onMounted } from 'vue'
import { useAttendanceStore } from '../stores/attendance'

const store = useAttendanceStore()
const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const showForm = ref(false)
const editingStudent = ref(null)
const saving = ref(false)
const filterGrade = ref('')
const filterSection = ref('')
const students = ref([])
const form = ref({ name: '', grade: 'Grade 7', section: '' })

onMounted(() => loadStudents())

async function loadStudents() {
  const params = {}
  if (filterGrade.value) params.grade = filterGrade.value
  if (filterSection.value) params.section = filterSection.value
  students.value = await store.getStudents(params)
}

function resetForm() {
  form.value = { name: '', grade: 'Grade 7', section: '' }
  editingStudent.value = null
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

async function handleSave() {
  saving.value = true
  try {
    if (editingStudent.value) {
      await store.updateStudent(editingStudent.value.id, { ...form.value })
    } else {
      await store.addStudent({ ...form.value })
    }
    await loadStudents()
    cancelForm()
  } finally {
    saving.value = false
  }
}

function editStudent(s) {
  editingStudent.value = s
  form.value = { name: s.name, grade: s.grade, section: s.section }
  showForm.value = true
}

async function removeStudent(id) {
  if (confirm('Delete this student?')) {
    await store.deleteStudent(id)
    await loadStudents()
  }
}
</script>
