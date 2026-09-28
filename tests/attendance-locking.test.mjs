import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'

const suffix = randomUUID()
const schoolA = `attendance-lock-school-a-${suffix}`
const schoolB = `attendance-lock-school-b-${suffix}`
const adminA = `attendance-lock-admin-a-${suffix}`
const adminB = `attendance-lock-admin-b-${suffix}`
const teacherA = `attendance-lock-teacher-a-${suffix}`
const studentA = `attendance-lock-student-a-${suffix}`
const recordId = `attendance-lock-record-${suffix}`
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

  await run(
    'INSERT INTO schools (id, name, school_id, address, short, attendance_lock_cutoff) VALUES (?, ?, ?, ?, ?, ?)',
    [schoolA, 'Attendance Lock School A', '', '', 'A', '2025-01-31']
  )
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, attendance_lock_cutoff) VALUES (?, ?, ?, ?, ?, ?)',
    [schoolB, 'Attendance Lock School B', '', '', 'B', '2025-01-31']
  )

  for (const [id, username, name, role, grade, section, schoolId] of [
    [adminA, adminA, 'Lock Admin A', 'admin', '', '', schoolA],
    [adminB, adminB, 'Lock Admin B', 'admin', '', '', schoolB],
    [teacherA, teacherA, 'Lock Teacher A', 'teacher', 'Grade 1', 'Section A', schoolA]
  ]) {
    await run(
      'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, 'test-password', name, role, grade, section, '', schoolId]
    )
  }

  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [studentA, 'Lock Student A', 'Grade 1', 'Section A', 'Female', schoolA]
  )
  await run(
    `INSERT INTO attendance_records
      (id, date, grade, section, adviser, created_by, created_by_name, summary_data, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [recordId, '2025-01-15', 'Grade 1', 'Section A', 'Lock Teacher A', teacherA, 'Lock Teacher A', '{}', schoolA]
  )
  await run(
    `INSERT INTO attendance_entries
      (record_id, student_id, name, am1, reason, excused, unexcused, nls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [recordId, studentA, 'Lock Student A', 'E', '', 0, 0, 0]
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await run('DELETE FROM attendance_corrections WHERE record_id = ?', [recordId])
  await run('DELETE FROM attendance_entries WHERE record_id = ?', [recordId])
  await run('DELETE FROM attendance_records WHERE id = ?', [recordId])
  await run('DELETE FROM audit_logs WHERE target_id = ?', [recordId])
  await run('DELETE FROM students WHERE id = ?', [studentA])
  await run('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [adminA, adminB, teacherA, `missing-${suffix}`])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolA, schoolB])
  await new Promise(resolve => server.close(resolve))
})

test('configured cutoff locks an attendance record and blocks teacher mutations', async () => {
  const opened = await request(`/api/attendance/${recordId}`, {
    headers: headers(teacherA, 'teacher')
  })
  assert.equal(opened.response.status, 200)
  assert.equal(Number(opened.body.locked), 1)
  assert.ok(opened.body.locked_at)

  const entryUpdate = await request(`/api/attendance/${recordId}/entry`, {
    method: 'PUT',
    headers: headers(teacherA, 'teacher'),
    body: JSON.stringify({ studentId: studentA, field: 'periods.am1', value: 'A' })
  })
  assert.equal(entryUpdate.response.status, 423)
  assert.equal(entryUpdate.body.locked, true)

  const recordUpdate = await request(`/api/attendance/${recordId}`, {
    method: 'PUT',
    headers: headers(teacherA, 'teacher'),
    body: JSON.stringify({ date: '2025-01-15', grade: 'Grade 1', section: 'Section A', adviser: 'Changed' })
  })
  assert.equal(recordUpdate.response.status, 423)

  const fullSave = await request('/api/attendance', {
    method: 'POST',
    headers: headers(teacherA, 'teacher'),
    body: JSON.stringify({
      schoolId: schoolA,
      date: '2025-01-15',
      grade: 'Grade 1',
      section: 'Section A',
      adviser: 'Lock Teacher A',
      entries: [{
        studentId: studentA,
        name: 'Lock Student A',
        periods: { am1: 'A' },
        reason: '',
        excused: false,
        unexcused: false,
        nls: false
      }]
    })
  })
  assert.equal(fullSave.response.status, 423)

  const remove = await request(`/api/attendance/${recordId}?userId=${encodeURIComponent(teacherA)}&userRole=teacher`, {
    method: 'DELETE'
  })
  assert.equal(remove.response.status, 423)
})

test('reopening requires a reason and is restricted to the same-school administrator', async () => {
  const missingReason = await request(`/api/attendance/${recordId}/reopen`, {
    method: 'PUT',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({})
  })
  assert.equal(missingReason.response.status, 400)

  const crossSchool = await request(`/api/attendance/${recordId}/reopen`, {
    method: 'PUT',
    headers: headers(adminB, 'admin'),
    body: JSON.stringify({ reason: 'Cross-school attempt' })
  })
  assert.equal(crossSchool.response.status, 403)

  const reopened = await request(`/api/attendance/${recordId}/reopen`, {
    method: 'PUT',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({ reason: 'Correct an approved attendance entry' })
  })
  assert.equal(reopened.response.status, 200)
  assert.equal(reopened.body.record.reopen_reason, 'Correct an approved attendance entry')

  const auditRows = await query(
    "SELECT * FROM audit_logs WHERE target_id = ? AND action = 'attendance.reopen'",
    [recordId]
  )
  assert.equal(auditRows.length, 1)
  assert.equal(auditRows[0].actor_id, adminA)
})

test('post-reopen edits are allowed and persisted in correction history', async () => {
  const update = await request(`/api/attendance/${recordId}/entry`, {
    method: 'PUT',
    headers: headers(teacherA, 'teacher'),
    body: JSON.stringify({
      studentId: studentA,
      field: 'periods.am1',
      value: 'A',
      correctionReason: 'Verified absence against the signed class record'
    })
  })
  assert.equal(update.response.status, 200)

  const corrections = await request(`/api/attendance/${recordId}/corrections`, {
    headers: headers(teacherA, 'teacher')
  })
  assert.equal(corrections.response.status, 200)
  const correction = corrections.body.find(row => row.field === 'periods.am1')
  assert.ok(correction)
  assert.equal(correction.old_value, 'E')
  assert.equal(correction.new_value, 'A')
  assert.equal(correction.actor_id, teacherA)
  assert.equal(correction.reason, 'Verified absence against the signed class record')
})
