import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolA = `enrollment-school-a-${suffix}`
const schoolB = `enrollment-school-b-${suffix}`
const adminA = `enrollment-admin-a-${suffix}`
const adminB = `enrollment-admin-b-${suffix}`
let studentId
let attendanceRecordId
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
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolA, 'Enrollment School A', '', '', 'A'])
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolB, 'Enrollment School B', '', '', 'B'])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`grade-${schoolA}`, schoolA, 'Grade 1', '["Section A","Section B"]', 1])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`grade2-${schoolA}`, schoolA, 'Grade 2', '["Section A","Section B"]', 2])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`grade-${schoolB}`, schoolB, 'Grade 1', '["Section A"]', 1])
  for (const [id, schoolId, name] of [[adminA, schoolA, 'Enrollment Admin A'], [adminB, schoolB, 'Enrollment Admin B']]) {
    await run(
      'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, id, await hashPassword('test-password'), name, 'admin', '', '', '', schoolId]
    )
  }
  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (attendanceRecordId) {
    await run('DELETE FROM attendance_entries WHERE record_id = ?', [attendanceRecordId])
    await run('DELETE FROM attendance_records WHERE id = ?', [attendanceRecordId])
  }
  if (studentId) {
    await run('DELETE FROM student_enrollment_events WHERE student_id = ?', [studentId])
    await run('DELETE FROM students WHERE id = ?', [studentId])
  }
  await run('DELETE FROM audit_logs WHERE actor_id IN (?, ?)', [adminA, adminB])
  await run('DELETE FROM grade_levels WHERE school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM users WHERE id IN (?, ?)', [adminA, adminB])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolA, schoolB])
  await new Promise(resolve => server.close(resolve))
})

test('student creation records enrollment history and class changes are append-only', async () => {
  const created = await request('/api/students', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      userId: adminA,
      userRole: 'admin',
      schoolId: schoolA,
      name: 'History Student',
      grade: 'Grade 1',
      section: 'Section A',
      gender: 'Female',
      effectiveOn: '2025-01-01'
    })
  })
  assert.equal(created.response.status, 200)
  studentId = created.body.id

  let events = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? ORDER BY effective_on, created_at', [studentId])
  assert.equal(events.length, 1)
  assert.equal(events[0].event_type, 'enroll')
  assert.equal(events[0].effective_on, '2025-01-01')

  const promoted = await request(`/api/students/${studentId}/enrollment-events`, {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({ userId: adminA, userRole: 'admin', schoolId: schoolA, eventType: 'promote', effectiveOn: '2025-06-01', grade: 'Grade 2', section: 'Section B', reason: 'End-of-year promotion' })
  })
  assert.equal(promoted.response.status, 201)
  events = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? ORDER BY effective_on, created_at', [studentId])
  assert.equal(events.length, 2)
  assert.equal(events[0].grade, 'Grade 1')
  assert.equal(events[0].section, 'Section A')
  assert.equal(events[1].grade, 'Grade 2')
  assert.equal(events[1].section, 'Section B')

  const updated = (await query('SELECT * FROM students WHERE id = ?', [studentId]))[0]
  assert.equal(updated.grade, 'Grade 2')
  assert.equal(updated.section, 'Section B')
  assert.equal(updated.enrollment_status, 'active')
})

test('withdrawal preserves attendance and current roster hides withdrawn students', async () => {
  attendanceRecordId = `enrollment-attendance-${suffix}`
  await run(
    `INSERT INTO attendance_records (id, date, grade, section, adviser, created_by, created_by_name, summary_data, school_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [attendanceRecordId, '2025-05-15', 'Grade 1', 'Section A', 'Enrollment Admin A', adminA, 'Enrollment Admin A', '{}', schoolA]
  )
  await run(
    `INSERT INTO attendance_entries (record_id, student_id, name, am1, reason, excused, unexcused, nls)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [attendanceRecordId, studentId, 'History Student', 'E', '', 0, 0, 0]
  )

  const withdrawn = await request(`/api/students/${studentId}/enrollment-events`, {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({ userId: adminA, userRole: 'admin', schoolId: schoolA, eventType: 'withdraw', effectiveOn: '2025-07-01', reason: 'Transferred out' })
  })
  assert.equal(withdrawn.response.status, 201)

  const entry = await query('SELECT * FROM attendance_entries WHERE record_id = ? AND student_id = ?', [attendanceRecordId, studentId])
  assert.equal(entry.length, 1)
  const current = await request(`/api/students?userId=${adminA}&userRole=admin&schoolId=${schoolA}`)
  assert.equal(current.response.status, 200)
  assert.equal(current.body.some(student => student.id === studentId), false)
  const historical = await request(`/api/students?userId=${adminA}&userRole=admin&schoolId=${schoolA}&includeWithdrawn=true`)
  assert.equal(historical.response.status, 200)
  assert.equal(historical.body.some(student => student.id === studentId), true)

  const asOfBeforePromotion = await request(`/api/students?userId=${adminA}&userRole=admin&schoolId=${schoolA}&asOf=2025-05-20`)
  assert.equal(asOfBeforePromotion.response.status, 200)
  assert.equal(asOfBeforePromotion.body.find(student => student.id === studentId)?.grade, 'Grade 1')
  const asOfAfterPromotion = await request(`/api/students?userId=${adminA}&userRole=admin&schoolId=${schoolA}&asOf=2025-06-10`)
  assert.equal(asOfAfterPromotion.response.status, 200)
  assert.equal(asOfAfterPromotion.body.find(student => student.id === studentId)?.section, 'Section B')
})

test('enrollment history is school-scoped and historical attendance accepts the historical class', async () => {
  const history = await request(`/api/students/${studentId}/enrollment-history?userId=${adminA}&userRole=admin&schoolId=${schoolA}`)
  assert.equal(history.response.status, 200)
  assert.equal(history.body.length, 3)

  const forbidden = await request(`/api/students/${studentId}/enrollment-history?userId=${adminB}&userRole=admin&schoolId=${schoolA}`)
  assert.equal(forbidden.response.status, 403)

  const directClassEdit = await request(`/api/students/${studentId}`, {
    method: 'PUT',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({ userId: adminA, userRole: 'admin', schoolId: schoolA, name: 'History Student', grade: 'Grade 1', section: 'Section A' })
  })
  assert.equal(directClassEdit.response.status, 400)

  const attendance = await request('/api/attendance', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      userId: adminA,
      userRole: 'admin',
      schoolId: schoolA,
      date: '2025-05-20',
      grade: 'Grade 1',
      section: 'Section A',
      adviser: 'Enrollment Admin A',
      entries: [{ studentId, name: 'History Student', periods: { am1: 'E' }, reason: '', excused: false, unexcused: false, nls: false }]
    })
  })
  assert.equal(attendance.response.status, 200)
  const historicalRecordId = attendance.body.id
  await run('DELETE FROM attendance_entries WHERE record_id = ?', [historicalRecordId])
  await run('DELETE FROM attendance_records WHERE id = ?', [historicalRecordId])
})

test('enrollment events allow backdated additions, date editing via PATCH, and event deletion with resequencing', async () => {
  // Currently student has events:
  // 1: 2025-01-01 enroll Grade 1 / Section A
  // 2: 2025-06-01 promote Grade 2 / Section B
  // 3: 2025-07-01 withdraw
  // Let's add a backdated event at 2025-04-01 (before 2025-06-01 and 2025-07-01) - previously this failed with 409
  const backdated = await request(`/api/students/${studentId}/enrollment-events`, {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      userId: adminA,
      userRole: 'admin',
      schoolId: schoolA,
      eventType: 'section_change',
      effectiveOn: '2025-04-01',
      grade: 'Grade 1',
      section: 'Section B',
      reason: 'Mid-year section rebalance'
    })
  })
  assert.equal(backdated.response.status, 201)

  // Verify events are sorted and resequenced properly
  let events = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? ORDER BY event_sequence ASC', [studentId])
  assert.equal(events.length, 4)
  assert.equal(events[0].effective_on, '2025-01-01')
  assert.equal(events[0].event_sequence, 1)
  assert.equal(events[1].effective_on, '2025-04-01')
  assert.equal(events[1].event_sequence, 2)
  assert.equal(events[2].effective_on, '2025-06-01')
  assert.equal(events[2].event_sequence, 3)
  assert.equal(events[3].effective_on, '2025-07-01')
  assert.equal(events[3].event_sequence, 4)

  // Test PATCH: Edit the withdrawal event's effective date to 2025-08-15
  const withdrawEvent = events.find(e => e.event_type === 'withdraw')
  assert.ok(withdrawEvent)
  const patchRes = await request(`/api/students/${studentId}/enrollment-events/${withdrawEvent.id}`, {
    method: 'PATCH',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      userId: adminA,
      userRole: 'admin',
      schoolId: schoolA,
      effectiveOn: '2025-08-15',
      reason: 'Updated withdrawal date by admin'
    })
  })
  assert.equal(patchRes.response.status, 200)
  assert.equal(patchRes.body.event.effective_on, '2025-08-15')
  assert.equal(patchRes.body.event.reason, 'Updated withdrawal date by admin')

  // Test DELETE: Delete the backdated event (2025-04-01)
  const backdatedEvent = events.find(e => e.effective_on === '2025-04-01')
  assert.ok(backdatedEvent)
  const deleteRes = await request(`/api/students/${studentId}/enrollment-events/${backdatedEvent.id}?userId=${adminA}&userRole=admin&schoolId=${schoolA}`, {
    method: 'DELETE',
    headers: headers(adminA, 'admin')
  })
  assert.equal(deleteRes.response.status, 200)

  // Confirm event is gone and remaining events are resequenced 1..3
  events = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? ORDER BY event_sequence ASC', [studentId])
  assert.equal(events.length, 3)
  assert.deepEqual(events.map(e => e.event_sequence), [1, 2, 3])
  assert.equal(events[0].effective_on, '2025-01-01')
  assert.equal(events[1].effective_on, '2025-06-01')
  assert.equal(events[2].effective_on, '2025-08-15')
})
