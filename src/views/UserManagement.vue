<template>
  <div class="management-page">
    <h1>User Management</h1>
    <button @click="showForm = true" class="btn-primary" v-if="!showForm">+ Add User</button>

    <div v-if="showForm" class="form-card">
      <h3>{{ editingUser ? 'Edit User' : 'Add User' }}</h3>
      <form @submit.prevent="handleSave">
        <div class="form-group">
          <label>Full Name</label>
          <input v-model="form.name" required />
        </div>
        <div class="form-group">
          <label>Username</label>
          <input v-model="form.username" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" :required="!editingUser" type="text" />
        </div>
        <div class="form-group">
          <label>Role</label>
          <select v-model="form.role" required>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : (editingUser ? 'Update' : 'Save') }}</button>
          <button type="button" @click="cancelForm" class="btn-secondary">Cancel</button>
        </div>
        <p v-if="formError" class="error-msg">{{ formError }}</p>
      </form>
    </div>

    <table class="data-table" v-if="users.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>Username</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.name }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.role }}</td>
          <td>
            <button @click="editUser(u)" class="btn-sm">Edit</button>
            <button @click="removeUser(u.id)" class="btn-sm btn-danger" v-if="u.role !== 'admin'">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="empty">No users found.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const showForm = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const formError = ref('')
const users = ref([])
const form = ref({ name: '', username: '', password: '', role: 'teacher' })

onMounted(async () => {
  users.value = await auth.getUsers()
})

function resetForm() {
  form.value = { name: '', username: '', password: '', role: 'teacher' }
  editingUser.value = null
  formError.value = ''
}

function cancelForm() {
  showForm.value = false
  resetForm()
}

async function handleSave() {
  saving.value = true
  formError.value = ''
  try {
    if (editingUser.value) {
      const data = { ...form.value }
      if (!data.password) delete data.password
      await auth.updateUser(editingUser.value.id, data)
    } else {
      await auth.addUser({ ...form.value })
    }
    users.value = await auth.getUsers()
    cancelForm()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

function editUser(u) {
  editingUser.value = u
  form.value = { name: u.name, username: u.username, password: '', role: u.role }
  showForm.value = true
}

async function removeUser(id) {
  if (confirm('Delete this user?')) {
    await auth.deleteUser(id)
    users.value = await auth.getUsers()
  }
}
</script>
