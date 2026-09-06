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
  const impersonatedBy = ref(JSON.parse(localStorage.getItem('auth_impersonator') || 'null'))

  const isSuperadmin = computed(() => user.value?.role === 'superadmin')
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'superadmin')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isImpersonating = computed(() => !!impersonatedBy.value)
  const schoolId = computed(() => user.value?.school_id || '')
  const school = computed(() => user.value?.school || null)

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
    impersonatedBy.value = null
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_impersonator')
  }

  // Superadmin: take over another user's session (admin or teacher).
  async function impersonate(targetId) {
    const data = await fetchJson(`${API}/auth/impersonate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams({ targetId }))
    })
    if (data?.error) throw new Error(data.error)
    if (!data || !data.user) throw new Error('Impersonation failed')
    user.value = data.user
    impersonatedBy.value = data.impersonatedBy || null
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    localStorage.setItem('auth_impersonator', JSON.stringify(impersonatedBy.value))
    return data.user
  }

  // Restore the original superadmin session.
  async function stopImpersonating() {
    if (!impersonatedBy.value) return null
    const data = await fetchJson(`${API}/auth/impersonate/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ superadminId: impersonatedBy.value.id, userId: user.value?.id })
    })
    if (data?.error) throw new Error(data.error)
    if (!data || !data.user) throw new Error('Could not restore session')
    user.value = data.user
    impersonatedBy.value = null
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    localStorage.removeItem('auth_impersonator')
    return data.user
  }

  function actorParams(extra = {}) {
    return {
      userId: user.value?.id || '',
      userRole: user.value?.role || '',
      ...extra
    }
  }

  async function getUsers(schoolId) {
    try {
      const params = new URLSearchParams(actorParams(schoolId ? { schoolId } : {}))
      return await fetchJson(`${API}/users?${params}`) || []
    } catch {
      return []
    }
  }

  async function addUser(userData) {
    const data = await fetchJson(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams(userData))
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function updateUser(id, userData) {
    const data = await fetchJson(`${API}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams(userData))
    })
    if (data?.error) throw new Error(data.error)
    if (user.value?.id === id) {
      if (userData.name) user.value.name = userData.name
      if (userData.role) user.value.role = userData.role
      if ('grade' in userData) user.value.grade = userData.grade || ''
      if ('section' in userData) user.value.section = userData.section || ''
      if ('period' in userData) user.value.period = userData.period || ''
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
    return data
  }

  async function deleteUser(id) {
    const params = new URLSearchParams(actorParams())
    await fetchJson(`${API}/users/${id}?${params}`, { method: 'DELETE' })
  }

  async function getSchools() {
    try {
      const params = new URLSearchParams(actorParams())
      return await fetchJson(`${API}/schools?${params}`) || []
    } catch {
      return []
    }
  }

  async function addSchool(payload) {
    const data = await fetchJson(`${API}/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams(payload))
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function updateSchool(id, payload) {
    const data = await fetchJson(`${API}/schools/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams(payload))
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function deleteSchool(id) {
    const params = new URLSearchParams(actorParams())
    const data = await fetchJson(`${API}/schools/${id}?${params}`, { method: 'DELETE' })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function getSchoolInfo(schoolId) {
    try {
      const params = new URLSearchParams(actorParams(schoolId ? { schoolId } : {}))
      return await fetchJson(`${API}/settings/school?${params}`)
    } catch {
      return null
    }
  }

  async function saveSchoolInfo(payload, schoolId) {
    const data = await fetchJson(`${API}/settings/school`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams({ ...payload, ...(schoolId ? { schoolId } : {}) }))
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function getLogs(params = {}) {
    const qs = new URLSearchParams(actorParams(params)).toString()
    const data = await fetchJson(`${API}/logs?${qs}`)
    if (data?.error) throw new Error(data.error)
    return data || { total: 0, logs: [] }
  }

  async function getLogActions() {
    const qs = new URLSearchParams(actorParams()).toString()
    try {
      return await fetchJson(`${API}/logs/actions?${qs}`) || []
    } catch {
      return []
    }
  }

  return { user, impersonatedBy, isSuperadmin, isAdmin, isTeacher, isImpersonating, schoolId, school, login, logout, impersonate, stopImpersonating, actorParams, getUsers, addUser, updateUser, deleteUser, getSchools, addSchool, updateSchool, deleteSchool, getSchoolInfo, saveSchoolInfo, getLogs, getLogActions }
})
