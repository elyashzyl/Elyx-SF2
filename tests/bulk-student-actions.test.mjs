import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'

const suffix = randomUUID().substring(0, 8)
const schoolId = `bulk-school-${suffix}`
const adminId = `bulk-admin-${suffix}`
let server
let baseUrl
const studentIds = []

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
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolId, 'Bulk Action Test School', '999123', 'City', 'BATS'])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`gl-g7-${suffix}`, schoolId, 'Grade 7', '["Section 1","Section 2"]', 1])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`gl-g8-${suffix}`, schoolId, 'Grade 8', '["Section 1","Section 2"]', 2])
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminId, adminId, 'password123', 'Bulk Admin', 'admin', '', '', '', schoolId]
  )

  // Seed 3 test students
  for (let i = 1; i <= 3; i++) {
    const sId = `bulk-stud-${suffix}-${i}`
    studentIds.push(sId)
    await run(
      "INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, 'active')",
      [sId, `TEST STUDENT ${i}`, 'Grade 7', 'Section 1', 'Male', schoolId]
    )
    await run(
      "INSERT INTO student_enrollment_events (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role) VALUES (?, ?, ?, 'enroll', 'active', '2026-06-01', 'Grade 7', 'Section 1', 'Initial enrollment', ?, 'Bulk Admin', 'admin')",
      [`ev-${sId}-1`, sId, schoolId, adminId]
    )
  }

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  for (const sId of studentIds) {
    await run('DELETE FROM student_enrollment_events WHERE student_id = ?', [sId])
    await run('DELETE FROM students WHERE id = ?', [sId])
  }
  await run('DELETE FROM grade_levels WHERE school_id = ?', [schoolId])
  await run('DELETE FROM users WHERE id = ?', [adminId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
  await new Promise(resolve => server.close(resolve))
})

test('bulk action transfer moves active students to a new section', async () => {
  const res = await request('/api/students/bulk-action', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      ids: studentIds,
      action: 'transfer',
      grade: 'Grade 7',
      section: 'Section 2',
      effectiveOn: '2026-07-01',
      reason: 'Section rebalancing',
      schoolId
    })
  })

  assert.equal(res.response.status, 200)
  assert.equal(res.body.count, 3)

  const rows = await query('SELECT * FROM students WHERE id IN (?, ?, ?)', studentIds)
  for (const r of rows) {
    assert.equal(r.section, 'Section 2')
    assert.equal(r.enrollment_status, 'active')
  }

  const events = await query("SELECT * FROM student_enrollment_events WHERE student_id = ? AND event_type = 'transfer'", [studentIds[0]])
  assert.equal(events.length, 1)
  assert.equal(events[0].section, 'Section 2')
})

test('bulk action promote advances active students to next grade', async () => {
  const res = await request('/api/students/bulk-action', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      ids: studentIds,
      action: 'promote',
      grade: 'Grade 8',
      section: 'Section 1',
      effectiveOn: '2026-08-01',
      reason: 'Promoted to Grade 8',
      schoolId
    })
  })

  assert.equal(res.response.status, 200)
  assert.equal(res.body.count, 3)

  const rows = await query('SELECT * FROM students WHERE id IN (?, ?, ?)', studentIds)
  for (const r of rows) {
    assert.equal(r.grade, 'Grade 8')
    assert.equal(r.section, 'Section 1')
  }
})

test('bulk action gender batch updates gender', async () => {
  const res = await request('/api/students/bulk-action', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      ids: [studentIds[0], studentIds[1]],
      action: 'gender',
      gender: 'Female',
      schoolId
    })
  })

  assert.equal(res.response.status, 200)
  assert.equal(res.body.count, 2)

  const r0 = (await query('SELECT gender FROM students WHERE id = ?', [studentIds[0]]))[0]
  assert.equal(r0.gender, 'Female')
})

test('bulk action withdraw sets status to withdrawn and logs reason', async () => {
  const res = await request('/api/students/bulk-action', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      ids: studentIds,
      action: 'withdraw',
      effectiveOn: '2026-09-01',
      reason: 'Family relocation',
      schoolId
    })
  })

  assert.equal(res.response.status, 200)
  assert.equal(res.body.count, 3)

  const rows = await query('SELECT enrollment_status FROM students WHERE id IN (?, ?, ?)', studentIds)
  for (const r of rows) {
    assert.equal(r.enrollment_status, 'withdrawn')
  }

  const events = await query("SELECT * FROM student_enrollment_events WHERE student_id = ? AND event_type = 'withdraw'", [studentIds[0]])
  assert.equal(events.length, 1)
  assert.equal(events[0].reason, 'Family relocation')
})

test('bulk action reenroll reactivates withdrawn students', async () => {
  const res = await request('/api/students/bulk-action', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      ids: studentIds,
      action: 'reenroll',
      grade: 'Grade 8',
      section: 'Section 2',
      effectiveOn: '2026-10-01',
      reason: 'Returned to school',
      schoolId
    })
  })

  assert.equal(res.response.status, 200)
  assert.equal(res.body.count, 3)

  const rows = await query('SELECT enrollment_status, grade, section FROM students WHERE id IN (?, ?, ?)', studentIds)
  for (const r of rows) {
    assert.equal(r.enrollment_status, 'active')
    assert.equal(r.grade, 'Grade 8')
    assert.equal(r.section, 'Section 2')
  }
})

test('bulk action permanent_delete deletes students completely', async () => {
  const res = await request('/api/students/bulk-action', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      ids: [studentIds[2]],
      action: 'permanent_delete',
      schoolId
    })
  })

  assert.equal(res.response.status, 200)
  assert.equal(res.body.count, 1)

  const remaining = await query('SELECT * FROM students WHERE id = ?', [studentIds[2]])
  assert.equal(remaining.length, 0)
  const remainingEvents = await query('SELECT * FROM student_enrollment_events WHERE student_id = ?', [studentIds[2]])
  assert.equal(remainingEvents.length, 0)
})
