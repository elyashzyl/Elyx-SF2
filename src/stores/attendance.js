import { defineStore } from 'pinia'

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

export const useAttendanceStore = defineStore('attendance', () => {

  async function getStudents(params = {}) {
    try {
      const query = new URLSearchParams(params).toString()
      return await fetchJson(`${API}/students?${query}`) || []
    } catch {
      return []
    }
  }

  async function addStudent(data) {
    return await fetchJson(`${API}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  async function updateStudent(id, data) {
    await fetchJson(`${API}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  async function deleteStudent(id) {
    await fetchJson(`${API}/students/${id}`, { method: 'DELETE' })
  }

  async function getRecord(date, grade, section) {
    const params = new URLSearchParams({ date, grade, section }).toString()
    return await fetchJson(`${API}/attendance?${params}`)
  }

  async function saveRecord(record, user) {
    return await fetchJson(`${API}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...record,
        created_by: user?.id || '',
        created_by_name: user?.name || ''
      })
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
      } else if (!record.entries || record.entries.length === 0) {
        // Existing record has no entries — populate from current students
        const students = await getStudents({ grade, section })
        record.entries = students.map(s => ({
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
        await saveRecord(record, user)
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
      body: JSON.stringify({ studentId, field, value, userId, userRole })
    })
  }

  async function unlockRecord(recordId, userId, userRole) {
    return await fetchJson(`${API}/attendance/${recordId}/unlock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userRole })
    })
  }

  async function getAllRecords() {
    try {
      return await fetchJson(`${API}/attendance/all`) || []
    } catch {
      return []
    }
  }

  async function deleteRecord(recordId, userId, userRole) {
    const params = new URLSearchParams({ userId, userRole }).toString()
    return await fetchJson(`${API}/attendance/${recordId}?${params}`, {
      method: 'DELETE'
    })
  }

  return {
    getStudents, addStudent, updateStudent, deleteStudent,
    getRecord, saveRecord, getOrCreateRecord,
    updateEntry, unlockRecord, getAllRecords, deleteRecord
  }
})
