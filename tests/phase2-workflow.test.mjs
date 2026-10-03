import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolId = `phase2-school-${suffix}`
const adminId = `phase2-admin-${suffix}`
const teacherId = `phase2-teacher-${suffix}`
const studentId = `phase2-student-${suffix}`
const grade = 'Grade 10'
const section = 'Rizal'

let server
let baseUrl

function headers(userId, userRole) {
  return {
    'content-type': 'application/json',
    'x-user-id': userId,
    'x-user-role': userRole
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options)
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch {}
  return { response, body }
}

before(async () => {
  await initializeServerDatabase()

  // Set up school
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, attendance_lock_cutoff) VALUES (?, ?, ?, ?, ?, ?)',
    [schoolId, 'Phase 2 Test School', `SCH-${suffix.slice(0, 6)}`, 'Baguio City', 'P2S', '2026-01-01']
  )

  const passwordHash = await hashPassword('password123')

  // Set up admin
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [adminId, `p2admin-${suffix}`, passwordHash, 'P2 Admin', 'admin', schoolId]
  )

  // Set up teacher assigned to grade and section
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id, grade, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherId, `p2teacher-${suffix}`, passwordHash, 'P2 Teacher', 'teacher', schoolId, grade, section]
  )

  // Set up grade level
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [randomUUID(), schoolId, grade, JSON.stringify([section]), 1]
  )

  // Set up student
  await run(
    'INSERT INTO students (id, name, gender, grade, section, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [studentId, 'Dela Cruz, Juan', 'Male', grade, section, schoolId]
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  await run('DELETE FROM attendance_entries WHERE record_id IN (SELECT id FROM attendance_records WHERE school_id = ?)', [schoolId])
  await run('DELETE FROM attendance_corrections WHERE record_id IN (SELECT id FROM attendance_records WHERE school_id = ?)', [schoolId])
  await run('DELETE FROM attendance_records WHERE school_id = ?', [schoolId])
  await run('DELETE FROM monthly_entries WHERE record_id IN (SELECT id FROM monthly_records WHERE school_id = ?)', [schoolId])
  await run('DELETE FROM monthly_records WHERE school_id = ?', [schoolId])
  await run('DELETE FROM calendar_events WHERE school_id = ?', [schoolId])
  await run('DELETE FROM students WHERE school_id = ?', [schoolId])
  await run('DELETE FROM grade_levels WHERE school_id = ?', [schoolId])
  await run('DELETE FROM users WHERE school_id = ?', [schoolId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
})

test('teacher notes are saved and retrieved with attendance records', async () => {
  const date = '2026-10-15'
  const initialNotes = 'Typhoon Signal 1 declared in afternoon; dismissed at 2:00 PM.'

  // 1. Record attendance with teacher notes
  const saveRes = await request('/api/attendance', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({
      schoolId,
      date,
      grade,
      section,
      adviser: 'P2 Teacher',
      teacher_notes: initialNotes,
      entries: [
        {
          studentId,
          name: 'Dela Cruz, Juan',
          periods: { am1: 'E', pm1: 'E' },
          reason: '',
          excused: false,
          unexcused: false
        }
      ]
    })
  })

  assert.equal(saveRes.response.status, 200)
  assert.ok(saveRes.body.id)
  const recordId = saveRes.body.id

  // 2. Query attendance record and verify teacher_notes is returned
  const getRes = await request(`/api/attendance?schoolId=${schoolId}&date=${date}&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(teacherId, 'teacher')
  })

  assert.equal(getRes.response.status, 200)
  assert.equal(getRes.body.teacher_notes, initialNotes)

  // 3. Update notes via PATCH endpoint
  const updatedNotes = 'Updated: Class dismissed early due to advisory from DepEd Division.'
  const patchRes = await request(`/api/attendance/${recordId}/notes`, {
    method: 'PATCH',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({
      schoolId,
      teacher_notes: updatedNotes
    })
  })

  assert.equal(patchRes.response.status, 200)
  assert.equal(patchRes.body.teacher_notes, updatedNotes)

  // 4. Verify directly in database
  const rows = await query('SELECT teacher_notes FROM attendance_records WHERE id = ?', [recordId])
  assert.equal(rows[0]?.teacher_notes, updatedNotes)
})

test('post-reopen teacher notes updates are tracked in correction history', async () => {
  const date = '2025-12-10' // earlier than cutoff (2026-01-01), so will be locked
  const originalNotes = 'Original attendance note before lock.'

  const createRes = await request('/api/attendance', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      date,
      grade,
      section,
      adviser: 'P2 Teacher',
      teacher_notes: originalNotes,
      entries: [
        {
          studentId,
          name: 'Dela Cruz, Juan',
          periods: { am1: 'E', pm1: 'E' },
          reason: '',
          excused: false,
          unexcused: false
        }
      ]
    })
  })

  assert.equal(createRes.response.status, 200)
  const recordId = createRes.body.id

  // Reopen the record with required reason
  const reopenRes = await request(`/api/attendance/${recordId}/reopen`, {
    method: 'PUT',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      reason: 'Administrative correction for weather event notes'
    })
  })
  assert.equal(reopenRes.response.status, 200)

  // Update teacher notes on reopened record
  const correctedNotes = 'Corrected note: Typhoon alert lifted; regular PM session completed.'
  const editRes = await request(`/api/attendance/${recordId}`, {
    method: 'PUT',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      date,
      grade,
      section,
      adviser: 'P2 Teacher',
      teacher_notes: correctedNotes,
      correctionReason: 'Updating weather notes after formal verification'
    })
  })
  assert.equal(editRes.response.status, 200)

  // Verify correction history contains teacher_notes change
  const corrRes = await request(`/api/attendance/${recordId}/corrections`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(corrRes.response.status, 200)
  const noteCorr = corrRes.body.find(c => c.field === 'teacher_notes')
  assert.ok(noteCorr, 'Correction history must track teacher_notes change')
  assert.equal(noteCorr.old_value, originalNotes)
  assert.equal(noteCorr.new_value, correctedNotes)
})

test('dashboard stats report daily roll call completion and teacher status', async () => {
  const statsRes = await request(`/api/dashboard/stats?schoolId=${schoolId}`, {
    headers: headers(adminId, 'admin')
  })

  assert.equal(statsRes.response.status, 200)
  assert.ok(statsRes.body.todayAttendanceCompletion, 'Must include todayAttendanceCompletion')
  const completion = statsRes.body.todayAttendanceCompletion
  assert.equal(typeof completion.totalSections, 'number')
  assert.equal(typeof completion.submittedCount, 'number')
  assert.equal(typeof completion.pendingCount, 'number')
  assert.equal(typeof completion.completionRate, 'number')
  assert.ok(Array.isArray(completion.sections))

  // Teacher-specific view
  const teacherStatsRes = await request(`/api/dashboard/stats?schoolId=${schoolId}`, {
    headers: headers(teacherId, 'teacher')
  })
  assert.equal(teacherStatsRes.response.status, 200)
  assert.ok(teacherStatsRes.body.teacherClass?.todayAttendance, 'Must include teacherClass.todayAttendance')
})

test('school calendar events sync with monthly SF2 calculations', async () => {
  // Add a holiday in calendar_events for this school
  const holidayDate = '2026-10-28'
  await run(
    'INSERT INTO calendar_events (title, type, event_date, color, created_by, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    ['DepEd Special Day', 'holiday', holidayDate, '#ef4444', adminId, schoolId]
  )

  // Create monthly record for October 2026
  const createRes = await request('/api/monthly', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      month: 10,
      year: 2026,
      grade,
      section,
      entries: [
        {
          studentId,
          name: 'Dela Cruz, Juan',
          days: { '28': 'A' }, // marked absent on holiday before sync
          present: 20,
          absent: 1
        }
      ]
    })
  })

  assert.equal(createRes.response.status, 200)
  const recordId = createRes.body.id

  // Call sync-calendar endpoint
  const syncRes = await request(`/api/monthly/${recordId}/sync-calendar`, {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({ schoolId })
  })

  assert.equal(syncRes.response.status, 200)
  assert.ok(syncRes.body.excluded_dates.includes(28), 'Day 28 must be in excluded_dates')

  // Verify fetch returns calendar_events and recalculated totals
  const getRes = await request(`/api/monthly?schoolId=${schoolId}&month=10&year=2026&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(adminId, 'admin')
  })

  assert.equal(getRes.response.status, 200)
  assert.ok(getRes.body.excluded_dates.includes(28))
  assert.ok(Array.isArray(getRes.body.calendar_events))
  assert.ok(getRes.body.calendar_events.some(e => e.title === 'DepEd Special Day'))
})
