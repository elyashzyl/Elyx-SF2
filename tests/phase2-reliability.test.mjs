import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolId = `rel-school-${suffix}`
const adminId = `rel-admin-${suffix}`
const teacherId = `rel-teacher-${suffix}`
const grade = 'Grade 9'
const section = 'Sampaguita'

let server
let baseUrl

function headers(userId, userRole, idempotencyKey) {
  const h = {
    'content-type': 'application/json',
    'x-user-id': userId,
    'x-user-role': userRole
  }
  if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey
  return h
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
    'INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [schoolId, 'Reliability School', `SCH-${suffix.slice(0, 6)}`, 'Baguio City', 'REL']
  )

  const passwordHash = await hashPassword('password123')

  // Set up admin
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [adminId, `reladmin-${suffix}`, passwordHash, 'Rel Admin', 'admin', schoolId]
  )

  // Set up teacher assigned to grade and section
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id, grade, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherId, `relteacher-${suffix}`, passwordHash, 'Rel Teacher', 'teacher', schoolId, grade, section]
  )

  // Set up grade level
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [randomUUID(), schoolId, grade, JSON.stringify([section]), 1]
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  await run('DELETE FROM attendance_entries WHERE record_id IN (SELECT id FROM attendance_records WHERE school_id = ?)', [schoolId])
  await run('DELETE FROM attendance_records WHERE school_id = ?', [schoolId])
  await run('DELETE FROM student_enrollment_events WHERE school_id = ?', [schoolId])
  await run('DELETE FROM students WHERE school_id = ?', [schoolId])
  await run('DELETE FROM grade_levels WHERE school_id = ?', [schoolId])
  await run('DELETE FROM users WHERE school_id = ?', [schoolId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
})

test('bulk validate validates learner rows and detects duplicates and errors', async () => {
  // Pre-seed an existing student
  const existingId = randomUUID()
  await run(
    'INSERT INTO students (id, name, gender, grade, section, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [existingId, 'Existing, Learner One', 'Female', grade, section, schoolId]
  )

  const validateRes = await request('/api/students/bulk-validate', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      rows: [
        { name: 'Ramos, Fidel V.', gender: 'Male', grade, section },
        { name: 'Existing, Learner One', gender: 'Female', grade, section }, // duplicate
        { name: '', gender: 'Male', grade, section }, // error: missing name
        { name: 'Valid Two, Learner', gender: 'F', grade: '', section: '' } // will use fallback or fail
      ],
      defaultGrade: grade,
      defaultSection: section
    })
  })

  assert.equal(validateRes.response.status, 200)
  const body = validateRes.body
  assert.equal(body.valid.length, 2, 'Should have 2 valid learners')
  assert.equal(body.duplicates.length, 1, 'Should have 1 duplicate learner')
  assert.equal(body.errors.length, 1, 'Should have 1 error row')
  assert.equal(body.summary.validCount, 2)
  assert.equal(body.summary.duplicateCount, 1)
  assert.equal(body.summary.errorCount, 1)
})

test('bulk import enrolls valid students and records enrollment events', async () => {
  const studentsToImport = [
    { name: 'Magsaysay, Ramon B.', gender: 'Male', grade, section },
    { name: 'Silang, Gabriela C.', gender: 'Female', grade, section }
  ]

  const importRes = await request('/api/students/bulk-import', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      students: studentsToImport,
      effectiveOn: '2026-10-01',
      reason: 'First semester batch import'
    })
  })

  assert.equal(importRes.response.status, 200)
  assert.equal(importRes.body.count, 2)

  // Verify in database
  const studentRows = await query('SELECT * FROM students WHERE school_id = ? AND name IN (?, ?)', [
    schoolId,
    'Magsaysay, Ramon B.',
    'Silang, Gabriela C.'
  ])
  assert.equal(studentRows.length, 2)
  for (const s of studentRows) {
    assert.equal(s.enrollment_status, 'active')
  }

  // Verify enrollment events were created
  const eventRows = await query('SELECT * FROM student_enrollment_events WHERE school_id = ? AND student_id IN (?, ?)', [
    schoolId,
    studentRows[0].id,
    studentRows[1].id
  ])
  assert.equal(eventRows.length, 2)
  assert.equal(eventRows[0].event_type, 'enroll')
  assert.equal(eventRows[0].status, 'active')
})

test('idempotent roll call save prevents duplicate submissions and double audits', async () => {
  // Use a student from earlier import
  const student = (await query('SELECT id FROM students WHERE school_id = ? LIMIT 1', [schoolId]))[0]
  assert.ok(student)

  const date = '2026-10-18'
  const idempotencyKey = `test-idemp-${suffix}`

  const payload = {
    schoolId,
    date,
    grade,
    section,
    adviser: 'Rel Teacher',
    teacher_notes: 'Idempotency test notes',
    entries: [
      {
        studentId: student.id,
        name: 'Magsaysay, Ramon B.',
        periods: { am1: 'E', pm1: 'E' },
        reason: '',
        excused: false,
        unexcused: false
      }
    ]
  }

  // First request
  const firstRes = await request('/api/attendance', {
    method: 'POST',
    headers: headers(teacherId, 'teacher', idempotencyKey),
    body: JSON.stringify(payload)
  })

  assert.equal(firstRes.response.status, 200)
  assert.ok(firstRes.body.id)
  const firstRecordId = firstRes.body.id

  // Audit count after first call
  const initialAudits = await query(
    "SELECT COUNT(*) as cnt FROM audit_logs WHERE target_id = ? AND action IN ('attendance.create', 'attendance.update')",
    [firstRecordId]
  )
  const auditCountBefore = Number(initialAudits[0]?.cnt || 0)
  assert.ok(auditCountBefore >= 1)

  // Second duplicate request with identical idempotencyKey
  const secondRes = await request('/api/attendance', {
    method: 'POST',
    headers: headers(teacherId, 'teacher', idempotencyKey),
    body: JSON.stringify(payload)
  })

  assert.equal(secondRes.response.status, 200)
  assert.equal(secondRes.body.id, firstRecordId, 'Must return identical record ID')

  // Audit count should NOT have increased
  const auditsAfter = await query(
    "SELECT COUNT(*) as cnt FROM audit_logs WHERE target_id = ? AND action IN ('attendance.create', 'attendance.update')",
    [firstRecordId]
  )
  const auditCountAfter = Number(auditsAfter[0]?.cnt || 0)
  assert.equal(auditCountAfter, auditCountBefore, 'Duplicate idempotent request must not create extra audit entries')

  // Verify only 1 record exists in attendance_records
  const records = await query('SELECT COUNT(*) as cnt FROM attendance_records WHERE id = ?', [firstRecordId])
  assert.equal(Number(records[0]?.cnt), 1)
})
