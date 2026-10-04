import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run, withTransaction } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolA = `transfer-school-a-${suffix}`
const schoolB = `transfer-school-b-${suffix}`
const superadminId = `transfer-superadmin-${suffix}`
const adminA = `transfer-admin-a-${suffix}`
const adminB = `transfer-admin-b-${suffix}`
let student1Id
let student2Id
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
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolA, 'Transfer Academy North', '4001', 'Baguio City', 'TAN'])
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolB, 'Transfer Academy South', '4002', 'Baguio City', 'TAS'])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`grade-${schoolA}`, schoolA, 'Grade 7', '["Section Emerald","Section Ruby"]', 1])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`grade-${schoolB}`, schoolB, 'Grade 7', '["Section Diamond","Section Sapphire"]', 1])
  
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, superadminId, await hashPassword('test-password'), 'Super Admin', 'superadmin', '', '', '', '']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminA, adminA, await hashPassword('test-password'), 'Admin North', 'admin', '', '', '', schoolA]
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminB, adminB, await hashPassword('test-password'), 'Admin South', 'admin', '', '', '', schoolB]
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (attendanceRecordId) {
    await run('DELETE FROM attendance_entries WHERE record_id = ?', [attendanceRecordId])
    await run('DELETE FROM attendance_records WHERE id = ?', [attendanceRecordId])
  }
  const cleanStudents = [student1Id, student2Id].filter(Boolean)
  for (const sid of cleanStudents) {
    await run('DELETE FROM attendance_corrections WHERE student_id = ?', [sid])
    await run('DELETE FROM student_enrollment_events WHERE student_id = ?', [sid])
    await run('DELETE FROM student_interventions WHERE student_id = ?', [sid])
    await run('DELETE FROM student_guardian_contacts WHERE student_id = ?', [sid])
    await run('DELETE FROM attendance_entries WHERE student_id = ?', [sid])
    await run('DELETE FROM monthly_entries WHERE student_id = ?', [sid])
    await run('DELETE FROM students WHERE id = ?', [sid])
  }
  await run('DELETE FROM audit_logs WHERE actor_id IN (?, ?, ?)', [superadminId, adminA, adminB])
  await run('DELETE FROM grade_levels WHERE school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM users WHERE id IN (?, ?, ?)', [superadminId, adminA, adminB])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolA, schoolB])
  await new Promise(resolve => server.close(resolve))
})

test('withTransaction atomic helper commits and rolls back on failure', async () => {
  // Test commit
  let txStudentId = `tx-student-${randomUUID()}`
  await withTransaction(async (tx) => {
    await tx.run('INSERT INTO students (id, name, grade, section, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?)',
      [txStudentId, 'Tx Commit Test', 'Grade 7', 'Section Emerald', schoolA, 'active'])
  })
  let rows = await query('SELECT * FROM students WHERE id = ?', [txStudentId])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].name, 'Tx Commit Test')

  // Test rollback
  let failId = `tx-fail-${randomUUID()}`
  await assert.rejects(async () => {
    await withTransaction(async (tx) => {
      await tx.run('INSERT INTO students (id, name, grade, section, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?)',
        [failId, 'Tx Fail Test', 'Grade 7', 'Section Emerald', schoolA, 'active'])
      throw new Error('Intentional transaction abortion')
    })
  }, /Intentional transaction abortion/)
  
  rows = await query('SELECT * FROM students WHERE id = ?', [failId])
  assert.equal(rows.length, 0, 'Rolled-back row must not persist')

  // Cleanup
  await run('DELETE FROM students WHERE id = ?', [txStudentId])
})

test('cross-school transfer records paired transfer_out and transfer_in events and preserves historical attendance', async () => {
  // 1. Create student in School A
  const created = await request('/api/students', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      userId: adminA,
      userRole: 'admin',
      schoolId: schoolA,
      name: 'Maria Santos',
      grade: 'Grade 7',
      section: 'Section Emerald',
      gender: 'Female',
      effectiveOn: '2025-01-10',
      reason: 'Regular enrollment'
    })
  })
  assert.equal(created.response.status, 200)
  student1Id = created.body.id

  // 2. Record attendance in School A on 2025-02-15
  attendanceRecordId = `att-rec-${randomUUID()}`
  await run(
    `INSERT INTO attendance_records (id, date, grade, section, adviser, created_by, created_by_name, summary_data, school_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [attendanceRecordId, '2025-02-15', 'Grade 7', 'Section Emerald', 'Teacher North', adminA, 'Teacher North', '{}', schoolA]
  )
  await run(
    `INSERT INTO attendance_entries (record_id, student_id, name, am1, reason, excused, unexcused, nls)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [attendanceRecordId, student1Id, 'Maria Santos', 'E', '', 0, 0, 0]
  )

  // 3. Superadmin executes cross-school transfer to School B on 2025-06-01
  const transferRes = await request(`/api/students/${student1Id}/transfer-school`, {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      userId: superadminId,
      userRole: 'superadmin',
      targetSchoolId: schoolB,
      grade: 'Grade 7',
      section: 'Section Diamond',
      effectiveOn: '2025-06-01',
      reason: 'Family relocated to South District'
    })
  })
  assert.equal(transferRes.response.status, 200)
  assert.equal(transferRes.body.success, true)
  assert.equal(transferRes.body.student.school_id, schoolB)
  assert.equal(transferRes.body.student.grade, 'Grade 7')
  assert.equal(transferRes.body.student.section, 'Section Diamond')
  assert.equal(transferRes.body.student.enrollment_status, 'active')

  // 4. Verify paired events exist with matching transfer_group_id
  const transferGroupId = transferRes.body.transferGroupId
  assert.ok(transferGroupId, 'transferGroupId must be present')

  const eventsA = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? AND school_id = ? ORDER BY effective_on ASC, event_sequence ASC', [student1Id, schoolA])
  assert.equal(eventsA.length, 2)
  assert.equal(eventsA[0].event_type, 'enroll')
  assert.equal(eventsA[1].event_type, 'transfer_out')
  assert.equal(eventsA[1].status, 'withdrawn')
  assert.equal(eventsA[1].transfer_group_id, transferGroupId)

  const eventsB = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? AND school_id = ? ORDER BY effective_on ASC, event_sequence ASC', [student1Id, schoolB])
  assert.equal(eventsB.length, 1)
  assert.equal(eventsB[0].event_type, 'transfer_in')
  assert.equal(eventsB[0].status, 'active')
  assert.equal(eventsB[0].grade, 'Grade 7')
  assert.equal(eventsB[0].section, 'Section Diamond')
  assert.equal(eventsB[0].transfer_group_id, transferGroupId)

  // 5. Verify historical as-of query for School A prior to transfer (e.g. 2025-03-01)
  const rosterBefore = await request(`/api/students?userId=${adminA}&userRole=admin&schoolId=${schoolA}&asOf=2025-03-01`)
  assert.equal(rosterBefore.response.status, 200)
  const studentInSchoolA = rosterBefore.body.find(s => s.id === student1Id)
  assert.ok(studentInSchoolA, 'Student must appear in School A historical roster prior to transfer')
  assert.equal(studentInSchoolA.grade, 'Grade 7')
  assert.equal(studentInSchoolA.section, 'Section Emerald')

  // 6. Verify historical query for School A after transfer (e.g. 2025-06-15)
  const rosterAfterSchoolA = await request(`/api/students?userId=${adminA}&userRole=admin&schoolId=${schoolA}&asOf=2025-06-15`)
  assert.equal(rosterAfterSchoolA.response.status, 200)
  assert.equal(rosterAfterSchoolA.body.some(s => s.id === student1Id), false, 'Active roster in School A after transfer must exclude transferred student')

  // 7. Verify active roster in School B
  const rosterSchoolB = await request(`/api/students?userId=${adminB}&userRole=admin&schoolId=${schoolB}`)
  assert.equal(rosterSchoolB.response.status, 200)
  const studentInSchoolB = rosterSchoolB.body.find(s => s.id === student1Id)
  assert.ok(studentInSchoolB, 'Student must appear in School B active roster')
  assert.equal(studentInSchoolB.grade, 'Grade 7')
  assert.equal(studentInSchoolB.section, 'Section Diamond')

  // 8. Verify historical attendance at School A is fully intact and queryable
  const attEntries = await query('SELECT * FROM attendance_entries WHERE record_id = ? AND student_id = ?', [attendanceRecordId, student1Id])
  assert.equal(attEntries.length, 1)
  assert.equal(attEntries[0].name, 'Maria Santos')
})

test('cross-school transfer validates target school, class, and unauthorized role restrictions', async () => {
  // Non-superadmin cannot transfer a student belonging to a different school
  const unauthRes = await request(`/api/students/${student1Id}/transfer-school`, {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      userId: adminA,
      userRole: 'admin',
      targetSchoolId: schoolA, // student is currently at schoolB
      grade: 'Grade 7',
      section: 'Section Emerald'
    })
  })
  assert.equal(unauthRes.response.status, 403)

  // Target class does not exist in destination school
  const invalidClassRes = await request(`/api/students/${student1Id}/transfer-school`, {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      userId: superadminId,
      userRole: 'superadmin',
      targetSchoolId: schoolA,
      grade: 'Grade 7',
      section: 'NonExistentSection'
    })
  })
  assert.equal(invalidClassRes.response.status, 400)
  assert.match(invalidClassRes.body.error, /do not exist in target school/i)
})

test('bulk cross-school transfer moves multiple active students with paired events', async () => {
  // Create student 2 in School A
  const created2 = await request('/api/students', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      userId: adminA,
      userRole: 'admin',
      schoolId: schoolA,
      name: 'Juan Dela Cruz',
      grade: 'Grade 7',
      section: 'Section Emerald',
      gender: 'Male',
      effectiveOn: '2025-01-15',
      reason: 'Regular enrollment'
    })
  })
  assert.equal(created2.response.status, 200)
  student2Id = created2.body.id

  // Bulk transfer student 2 to School B
  const bulkRes = await request('/api/students/bulk-action', {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      userId: superadminId,
      userRole: 'superadmin',
      action: 'transfer_school',
      ids: [student2Id],
      targetSchoolId: schoolB,
      grade: 'Grade 7',
      section: 'Section Sapphire',
      effectiveOn: '2025-06-01',
      reason: 'Bulk campus re-assignment'
    })
  })

  assert.equal(bulkRes.response.status, 200)
  assert.equal(bulkRes.body.success, true)
  assert.equal(bulkRes.body.count, 1)

  // Verify student2 is now in School B
  const s2 = (await query('SELECT * FROM students WHERE id = ?', [student2Id]))[0]
  assert.equal(s2.school_id, schoolB)
  assert.equal(s2.grade, 'Grade 7')
  assert.equal(s2.section, 'Section Sapphire')
  assert.equal(s2.enrollment_status, 'active')

  // Verify paired events
  const s2EventsA = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? AND school_id = ? AND event_type = "transfer_out"', [student2Id, schoolA])
  assert.equal(s2EventsA.length, 1)

  const s2EventsB = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? AND school_id = ? AND event_type = "transfer_in"', [student2Id, schoolB])
  assert.equal(s2EventsB.length, 1)
})
