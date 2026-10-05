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
    if (res.status === 401 || (res.status === 403 && typeof msg === 'string' && (msg.includes('Role mismatch') || msg.includes('Not authenticated')))) {
      try {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_impersonator')
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login'
        }
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

  function setUser(nextUser) {
    user.value = nextUser || null
    if (nextUser) localStorage.setItem('auth_user', JSON.stringify(nextUser))
    else localStorage.removeItem('auth_user')
  }

  async function login(username, password) {
    try {
      const data = await fetchJson(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!data || !data.user) return false
      setUser(data.user)
      return true
    } catch {
      return false
    }
  }

  async function restoreSession() {
    try {
      const data = await fetchJson(`${API}/auth/me`)
      if (!data?.user) return false
      setUser(data.user)
      return true
    } catch {
      user.value = null
      impersonatedBy.value = null
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_impersonator')
      return false
    }
  }

  async function logout() {
    try {
      await fetchJson(`${API}/auth/logout`, { method: 'POST' })
    } catch {}
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
      body: JSON.stringify({ superadminId: impersonatedBy.value.id })
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

  function actorHeaders(extra = {}) {
    return {
      'x-user-id': user.value?.id || '',
      'x-user-role': user.value?.role || '',
      ...extra
    }
  }

  async function getUsers(schoolId) {
    try {
      const params = new URLSearchParams(actorParams(schoolId ? { schoolId } : {}))
      const data = await fetchJson(`${API}/users?${params}`)
      return Array.isArray(data) ? data.filter(Boolean) : []
    } catch {
      return []
    }
  }

  async function inviteUser(userData) {
    const data = await fetchJson(`${API}/users/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams(userData))
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function resendInvitation(id) {
    const data = await fetchJson(`${API}/users/${id}/invite/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams())
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function requestUserPasswordReset(id) {
    const data = await fetchJson(`${API}/users/${id}/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams())
    })
    if (data?.error) throw new Error(data.error)
    return data
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
      if (userData.username) user.value.username = userData.username
      if (userData.name) user.value.name = userData.name
      if (data?.user) {
        user.value = { ...user.value, ...data.user }
      }
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
    return data
  }

  async function deleteUser(id) {
    const params = new URLSearchParams(actorParams())
    await fetchJson(`${API}/users/${id}?${params}`, { method: 'DELETE' })
  }

  async function inspectInvitation(token) {
    return fetchJson(`${API}/auth/invitations/inspect`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
    })
  }

  async function acceptInvitation(payload) {
    return fetchJson(`${API}/auth/invitations/accept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
  }

  async function requestPasswordReset(identifier) {
    return fetchJson(`${API}/auth/password-reset/request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emailOrUsername: identifier })
    })
  }

  async function inspectPasswordReset(token) {
    return fetchJson(`${API}/auth/password-reset/inspect`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
    })
  }

  async function resetPassword(payload) {
    return fetchJson(`${API}/auth/password-reset/consume`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
  }

  async function verifyEmail(token) {
    return fetchJson(`${API}/auth/email-verification/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
    })
  }

  async function resendEmailVerification() {
    return fetchJson(`${API}/auth/email-verification/resend`, { method: 'POST' })
  }

  async function updateUserStatus(id, status, lockedUntil = null) {
    const data = await fetchJson(`${API}/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams({ status, ...(lockedUntil ? { lockedUntil } : {}) }))
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function unlockUser(id) {
    const data = await fetchJson(`${API}/users/${id}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams({}))
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function getSchools(includeArchived = false) {
    try {
      const params = new URLSearchParams(actorParams(includeArchived ? { includeArchived: 'true' } : {}))
      const data = await fetchJson(`${API}/schools?${params}`)
      return Array.isArray(data) ? data.filter(Boolean) : []
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

  async function exportSchoolData(id) {
    const params = new URLSearchParams(actorParams())
    let response
    try {
      response = await fetch(`${API}/schools/${encodeURIComponent(id)}/export?${params}`)
    } catch {
      throw new Error('Cannot connect to server')
    }
    if (!response.ok) {
      const text = await response.text()
      let message = `Request failed (${response.status})`
      try {
        const data = text ? JSON.parse(text) : null
        if (data?.error) message = data.error
      } catch {}
      throw new Error(message)
    }
    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    const match = disposition.match(/filename="?([^";]+)"?/i)
    const filename = match?.[1] || `elytrack-school-${id}-export.json`
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    return { filename }
  }

  async function getSchoolDependencyPreview(id) {
    const params = new URLSearchParams(actorParams())
    const data = await fetchJson(`${API}/schools/${id}/dependency-preview?${params}`)
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function archiveSchool(id, reason = '') {
    const data = await fetchJson(`${API}/schools/${id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams({ archived: true, reason }))
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function restoreSchool(id) {
    const data = await fetchJson(`${API}/schools/${id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actorParams({ archived: false }))
    })
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

  async function deleteLicense(id) {
    const params = new URLSearchParams(actorParams())
    const data = await fetchJson(`${API}/licenses/${id}?${params}`, {
      method: 'DELETE',
      headers: actorHeaders()
    })
    if (data?.error) throw new Error(data.error)
    return data
  }

  return { user, impersonatedBy, isSuperadmin, isAdmin, isTeacher, isImpersonating, schoolId, school, setUser, login, restoreSession, logout, impersonate, stopImpersonating, actorParams, actorHeaders, getUsers, addUser, inviteUser, resendInvitation, requestUserPasswordReset, updateUser, updateUserStatus, unlockUser, deleteUser, inspectInvitation, acceptInvitation, requestPasswordReset, inspectPasswordReset, resetPassword, verifyEmail, resendEmailVerification, getSchools, addSchool, updateSchool, deleteSchool, exportSchoolData, getSchoolDependencyPreview, archiveSchool, restoreSchool, deleteLicense, getSchoolInfo, saveSchoolInfo, getLogs, getLogActions }
})
