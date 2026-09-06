import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

const API = '/api'

function getAuth() {
  try {
    return useAuthStore()
  } catch {
    return null
  }
}

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

export const useAttendanceStore = defineStore('attendance', () => {

  function actor(extra = {}) {
    const auth = getAuth()
    return {
      userId: auth?.user?.id || '',
      userRole: auth?.user?.role || '',
      ...(auth?.user?.school_id ? { schoolId: auth.user.school_id } : {}),
      ...extra
    }
  }

  async function getStudents(params = {}) {
    try {
      const query = new URLSearchParams(actor(params)).toString()
      return await fetchJson(`${API}/students?${query}`) || []
    } catch {
      return []
    }
  }

  async function addStudent(data) {
    return await fetchJson(`${API}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(data))
    })
  }

  async function updateStudent(id, data) {
    const auth = getAuth()
    await fetchJson(`${API}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...actor(data), ...(auth?.user ? { userId: auth.user.id, userRole: auth.user.role } : {}) })
    })
  }

  async function addStudents(data) {
    return await fetchJson(`${API}/students/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(data))
    })
  }

  async function deleteStudent(id) {
    const auth = getAuth()
    const params = new URLSearchParams({ userId: auth?.user?.id || '', userRole: auth?.user?.role || '' }).toString()
    await fetchJson(`${API}/students/${id}?${params}`, { method: 'DELETE' })
  }

  async function deleteStudents(ids) {
    return await fetchJson(`${API}/students/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor({ ids }))
    })
  }

  async function getRecord(date, grade, section) {
    const params = new URLSearchParams(actor({ date, grade, section })).toString()
    return await fetchJson(`${API}/attendance?${params}`)
  }

  async function saveRecord(record, user) {
    return await fetchJson(`${API}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor({
        ...record,
        created_by: user?.id || '',
        created_by_name: user?.name || ''
      }))
    })
  }

  async function getOrCreateRecord(date, grade, section, adviser, user) {
    try {
      let record = await getRecord(date, grade, section)
      if (!record) {
        const students = await getStudents({ grade, section })
        record = {
          date,
          grade,
          section,
          adviser,
          created_by: user?.id || '',
          created_by_name: user?.name || '',
          entries: students.map(s => ({
            studentId: s.id,
            name: s.name,
            periods: {
              am1: '', am2: '', am3: '', am4: '', am5: '', am6: '',
              pm1: '', pm2: '', pm3: '', pm4: ''
            },
            reason: '',
            excused: false,
            unexcused: false
          }))
        }
        const result = await saveRecord(record, user)
        if (result && result.record) {
          record.id = result.record.id
          record.created_by = result.record.created_by
          record.created_by_name = result.record.created_by_name
        } else if (result && result.id) {
          record.id = result.id
        }
      } else {
        const students = await getStudents({ grade, section })
        const existingIds = new Set(record.entries.map(e => e.studentId))
        const missing = students.filter(s => !existingIds.has(s.id))
        if (missing.length > 0) {
          for (const s of missing) {
            record.entries.push({
              studentId: s.id,
              name: s.name,
              periods: {
                am1: '', am2: '', am3: '', am4: '', am5: '', am6: '',
                pm1: '', pm2: '', pm3: '', pm4: ''
              },
              reason: '',
              excused: false,
              unexcused: false
            })
          }
          await saveRecord(record, user)
        }
      }
      return record
    } catch (e) {
      console.error('Failed to load record:', e)
      return null
    }
  }

  async function updateEntry(recordId, studentId, field, value, userId, userRole) {
    await fetchJson(`${API}/attendance/${recordId}/entry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor({ studentId, field, value, userId, userRole }))
    })
  }

  async function unlockRecord(recordId, userId, userRole) {
    return await fetchJson(`${API}/attendance/${recordId}/unlock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor({ userId, userRole }))
    })
  }

  async function getAllRecords() {
    try {
      const params = new URLSearchParams(actor()).toString()
      return await fetchJson(`${API}/attendance/all?${params}`) || []
    } catch {
      return []
    }
  }

  async function deleteRecord(recordId, userId, userRole) {
    const params = new URLSearchParams(actor({ userId, userRole })).toString()
    return await fetchJson(`${API}/attendance/${recordId}?${params}`, {
      method: 'DELETE'
    })
  }

  async function fetchMonthly(grade, section, month, year, schoolId) {
    try {
      const params = new URLSearchParams(actor({ grade, section, month, year, ...(schoolId ? { schoolId } : {}) }))
      return await fetchJson(`${API}/monthly?${params}`)
    } catch {
      return null
    }
  }

  async function saveMonthly(data, user, schoolId) {
    return await fetchJson(`${API}/monthly`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor({ ...data, created_by: user?.id || '', created_by_name: user?.name || '', userRole: user?.role || '', ...(schoolId ? { schoolId } : {}) }))
    })
  }

  async function updateMonthlyEntry(recordId, studentId, day, status, userId, userRole) {
    return await fetchJson(`${API}/monthly/${recordId}/entry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor({ studentId, day, status, userId, userRole }))
    })
  }

  async function updateMonthlyRemarks(recordId, studentId, remarks) {
    const auth = getAuth()
    return await fetchJson(`${API}/monthly/${recordId}/remarks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor({ studentId, remarks, userId: auth?.user?.id || '', userRole: auth?.user?.role || '' }))
    })
  }

  return {
    getStudents, addStudent, addStudents, updateStudent, deleteStudent, deleteStudents,
    getRecord, saveRecord, getOrCreateRecord,
    updateEntry, unlockRecord, getAllRecords, deleteRecord,
    fetchMonthly, saveMonthly, updateMonthlyEntry, updateMonthlyRemarks
  }
})
