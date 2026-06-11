import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API = '/api'

async function fetchJson(url, options) {
  let res
  try {
    res = await fetch(url, options)
  } catch {
    throw new Error('Cannot connect to server')
  }
  const text = await res.text()
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    if (text) {
      try {
        const err = JSON.parse(text)
        if (err.error) msg = err.error
      } catch {}
    }
    throw new Error(msg)
  }
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid server response')
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTeacher = computed(() => user.value?.role === 'teacher')

  async function login(username, password) {
    try {
      const data = await fetchJson(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!data || !data.user) return false
      user.value = data.user
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      return true
    } catch {
      return false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('auth_user')
  }

  async function getUsers() {
    try {
      return await fetchJson(`${API}/users`) || []
    } catch {
      return []
    }
  }

  async function addUser(userData) {
    const data = await fetchJson(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function updateUser(id, userData) {
    const data = await fetchJson(`${API}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    if (data?.error) throw new Error(data.error)
    if (user.value?.id === id && userData.name) {
      user.value.name = userData.name
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
    return data
  }

  async function deleteUser(id) {
    await fetchJson(`${API}/users/${id}`, { method: 'DELETE' })
  }

  return { user, isAdmin, isTeacher, login, logout, getUsers, addUser, updateUser, deleteUser }
})
