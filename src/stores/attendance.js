import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useOfflineAttendance } from '../composables/useOfflineAttendance'

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
    let sid = extra.schoolId || auth?.user?.school_id || ''
    if (!sid && auth?.user?.role === 'superadmin') {
      try {
        const raw = localStorage.getItem('app_active_school')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && !parsed.__none && (parsed.id || parsed.school_id)) {
            sid = parsed.id || parsed.school_id
          }
        }
      } catch (_) {}
    }
    const res = {
      userId: auth?.user?.id || '',
      userRole: auth?.user?.role || '',
      ...(sid ? { schoolId: sid } : {}),
      ...extra
    }
    if (sid && !res.schoolId) res.schoolId = sid
    return res
  }

  async function getStudents(params = {}, schoolId, options = {}) {
    const extra = { ...params }
    if (schoolId) extra.schoolId = schoolId
    const query = new URLSearchParams(actor(extra)).toString()
    try {
      const students = await fetchJson(`${API}/students?${query}`) || []
      if (params.grade && params.section && students.length > 0) {
        try {
          const { cacheRoster } = useOfflineAttendance()
          cacheRoster(schoolId, params.grade, params.section, students)
        } catch {}
      }
      return students
    } catch (error) {
      if (params.grade && params.section) {
        try {
          const { getCachedRoster } = useOfflineAttendance()
          const cached = getCachedRoster(schoolId, params.grade, params.section)
          if (cached && cached.length > 0) return cached
        } catch {}
      }
      if (options.throwOnError) throw error
      return []
    }
  }

  async function addStudent(data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function updateStudent(id, data, schoolId) {
    const auth = getAuth()
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    await fetchJson(`${API}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...actor(extra), ...(auth?.user ? { userId: auth.user.id, userRole: auth.user.role } : {}) })
    })
  }

  async function addStudents(data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function getStudentProfile(id, schoolId) {
    const extra = schoolId ? { schoolId } : {}
    const query = new URLSearchParams(actor(extra)).toString()
    return await fetchJson(`${API}/students/${id}?${query}`)
  }

  async function getInterventions(params = {}) {
    const query = new URLSearchParams(actor(params)).toString()
    return await fetchJson(`${API}/students/interventions?${query}`) || []
  }

  async function createIntervention(studentId, data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/${studentId}/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function updateIntervention(studentId, interventionId, data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/${studentId}/interventions/${interventionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function deleteIntervention(studentId, interventionId, schoolId) {
    const extra = schoolId ? { schoolId } : {}
    const query = new URLSearchParams(actor(extra)).toString()
    return await fetchJson(`${API}/students/${studentId}/interventions/${interventionId}?${query}`, {
      method: 'DELETE'
    })
  }

  async function getGuardianContacts(studentId, schoolId) {
    const extra = schoolId ? { schoolId } : {}
    const query = new URLSearchParams(actor(extra)).toString()
    return await fetchJson(`${API}/students/${studentId}/guardian-contacts?${query}`) || []
  }

  async function logGuardianContact(studentId, data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/${studentId}/guardian-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function deleteGuardianContact(studentId, contactId, schoolId) {
    const extra = schoolId ? { schoolId } : {}
    const query = new URLSearchParams(actor(extra)).toString()
    return await fetchJson(`${API}/students/${studentId}/guardian-contacts/${contactId}?${query}`, {
      method: 'DELETE'
    })
  }

  async function checkDuplicateStudents(data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/check-duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function getEnrollmentHistory(id, schoolId) {
    const extra = schoolId ? { schoolId } : {}
    const query = new URLSearchParams(actor(extra)).toString()
    return await fetchJson(`${API}/students/${id}/enrollment-history?${query}`) || []
  }

  async function createEnrollmentEvent(id, data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/${id}/enrollment-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function reenrollStudent(id, data = {}, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/${id}/reenroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function reenrollStudents(data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/bulk-reenroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function bulkStudentAction(data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/bulk-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function bulkPermanentDeleteStudents(ids, schoolId) {
    const extra = { ids }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/bulk-permanent-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function deleteStudent(id, schoolId) {
    const auth = getAuth()
    const extra = { userId: auth?.user?.id || '', userRole: auth?.user?.role || '' }
    if (schoolId) extra.schoolId = schoolId
    const params = new URLSearchParams(extra).toString()
    await fetchJson(`${API}/students/${id}?${params}`, { method: 'DELETE' })
  }

  async function deleteStudents(ids, schoolId) {
    const extra = { ids }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function getRecord(date, grade, section, schoolId) {
    const extra = { date, grade, section }
    if (schoolId) extra.schoolId = schoolId
    const params = new URLSearchParams(actor(extra)).toString()
    return await fetchJson(`${API}/attendance?${params}`)
  }

  const inFlightSaves = new Map()

  function generateClientMutationId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return 'mut_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11)
  }

  async function saveRecord(record, user, schoolId) {
    const saveKey = `${schoolId || ''}__${record.date}__${record.grade}__${record.section}`
    if (inFlightSaves.has(saveKey)) {
      return await inFlightSaves.get(saveKey)
    }

    const idempotencyKey = record.idempotencyKey || generateClientMutationId()
    const extra = {
      ...record,
      idempotencyKey,
      created_by: user?.id || '',
      created_by_name: user?.name || ''
    }
    if (schoolId) extra.schoolId = schoolId

    const savePromise = (async () => {
      try {
        return await fetchJson(`${API}/attendance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          body: JSON.stringify(actor(extra))
        })
      } catch (err) {
        if (typeof navigator !== 'undefined' && (!navigator.onLine || /failed to fetch|cannot connect/i.test(err.message))) {
          try {
            const { enqueueRollCall } = useOfflineAttendance()
            enqueueRollCall({
              ...extra,
              userId: user?.id || '',
              userRole: user?.role || ''
            })
            return {
              id: 'offline_' + idempotencyKey,
              success: true,
              isOffline: true,
              record: { ...extra, id: 'offline_' + idempotencyKey }
            }
          } catch {}
        }
        throw err
      } finally {
        inFlightSaves.delete(saveKey)
      }
    })()

    inFlightSaves.set(saveKey, savePromise)
    return await savePromise
  }

  async function getOrCreateRecord(date, grade, section, adviser, user, schoolId) {
    try {
      let record = await getRecord(date, grade, section, schoolId)
      if (!record) {
        const students = await getStudents({ grade, section }, schoolId)
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
        if (schoolId) record.schoolId = schoolId
        const result = await saveRecord(record, user, schoolId)
        if (result && result.record) {
          Object.assign(record, result.record)
          record.id = result.record.id
          record.created_by = result.record.created_by
          record.created_by_name = result.record.created_by_name
        } else if (result && result.id) {
          record.id = result.id
        }
      } else {
        const students = await getStudents({ grade, section }, schoolId)
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
          if (!(record.locked && !record.reopened_at)) {
            await saveRecord(record, user, schoolId)
          }
        }
      }
      return record
    } catch (e) {
      console.error('Failed to load record:', e)
      return null
    }
  }

  async function updateEntry(recordId, studentId, field, value, userId, userRole, schoolId) {
    const extra = { studentId, field, value, userId, userRole }
    if (schoolId) extra.schoolId = schoolId
    await fetchJson(`${API}/attendance/${recordId}/entry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function updateTeacherNotes(recordId, notes, userId, userRole, schoolId) {
    const extra = { teacher_notes: notes, userId, userRole }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/attendance/${recordId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function reopenRecord(recordId, reason, schoolId) {
    const extra = { reason }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/attendance/${recordId}/reopen`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function getCorrections(recordId) {
    return await fetchJson(`${API}/attendance/${recordId}/corrections?${new URLSearchParams(actor()).toString()}`) || []
  }

  async function getAllRecords(schoolId) {
    try {
      const extra = {}
      if (schoolId) extra.schoolId = schoolId
      const params = new URLSearchParams(actor(extra)).toString()
      return await fetchJson(`${API}/attendance/all?${params}`) || []
    } catch {
      return []
    }
  }

  async function deleteRecord(recordId, userId, userRole, schoolId) {
    const extra = { userId, userRole }
    if (schoolId) extra.schoolId = schoolId
    const params = new URLSearchParams(actor(extra)).toString()
    return await fetchJson(`${API}/attendance/${recordId}?${params}`, {
      method: 'DELETE'
    })
  }

  async function fetchMonthly(grade, section, month, year, schoolId, options = {}) {
    try {
      const params = new URLSearchParams(actor({ grade, section, month, year, ...(schoolId ? { schoolId } : {}) }))
      return await fetchJson(`${API}/monthly?${params}`)
    } catch (error) {
      if (options.throwOnError) throw error
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

  async function updateMonthlySettings(recordId, includeSaturdays, userId, userRole, schoolId) {
    const extra = { includeSaturdays: Boolean(includeSaturdays), userId, userRole }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/monthly/${recordId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
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

  async function syncMonthlyCalendar(recordId, userId, userRole, schoolId) {
    const extra = { userId, userRole }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/monthly/${recordId}/sync-calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function fetchAttendanceSummaries(filters = {}, schoolId) {
    const extra = { ...filters }
    if (schoolId) extra.schoolId = schoolId
    const query = new URLSearchParams(actor(extra)).toString()
    return await fetchJson(`${API}/attendance/summaries?${query}`)
  }

  async function validateBulkAttendanceImport(data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/attendance/bulk-import-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function bulkImportAttendance(data, schoolId) {
    const extra = { ...data }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/attendance/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function bulkValidateStudents(rows, defaultGrade, defaultSection, schoolId) {
    const extra = { rows, defaultGrade, defaultSection }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/bulk-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  async function bulkImportStudents(students, effectiveOn, reason, schoolId) {
    const extra = { students, effectiveOn, reason }
    if (schoolId) extra.schoolId = schoolId
    return await fetchJson(`${API}/students/bulk-import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actor(extra))
    })
  }

  return {
    getStudents, addStudent, addStudents, updateStudent, getStudentProfile,
    getInterventions, createIntervention, updateIntervention, deleteIntervention,
    getGuardianContacts, logGuardianContact, deleteGuardianContact, checkDuplicateStudents,
    getEnrollmentHistory, createEnrollmentEvent, reenrollStudent, reenrollStudents, bulkStudentAction, bulkPermanentDeleteStudents, deleteStudent, deleteStudents,
    bulkValidateStudents, bulkImportStudents,
    fetchAttendanceSummaries, validateBulkAttendanceImport, bulkImportAttendance,
    getRecord, saveRecord, getOrCreateRecord,
    updateEntry, updateTeacherNotes, reopenRecord, getCorrections, getAllRecords, deleteRecord,
    fetchMonthly, saveMonthly, updateMonthlyEntry, updateMonthlySettings, updateMonthlyRemarks, syncMonthlyCalendar
  }
})
