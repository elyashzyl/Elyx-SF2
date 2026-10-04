import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolA = `auth-school-a-${suffix}`
const schoolB = `auth-school-b-${suffix}`
const adminA = `auth-admin-a-${suffix}`
const adminB = `auth-admin-b-${suffix}`
const teacherB = `auth-teacher-b-${suffix}`
const studentB = `auth-student-b-${suffix}`
const gradeLevelB = `auth-grade-level-b-${suffix}`
let server
let baseUrl

function actorHeaders(id, role) {
  return {
    'content-type': 'application/json',
    'x-user-id': id,
    'x-user-role': role
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

  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolA, 'Authorization School A', '', '', 'A'])
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolB, 'Authorization School B', '', '', 'B'])
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminA, adminA, await hashPassword('test-password'), 'Admin A', 'admin', '', '', '', schoolA]
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminB, adminB, await hashPassword('test-password'), 'Admin B', 'admin', '', '', '', schoolB]
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherB, teacherB, await hashPassword('test-password'), 'Teacher B', 'teacher', 'Grade 1', 'Section A', '', schoolB]
  )
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [studentB, 'Student B', 'Grade 1', 'Section A', 'Female', schoolB]
  )
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [gradeLevelB, schoolB, 'Grade 1', JSON.stringify(['Section A']), 1]
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  await run('DELETE FROM monthly_entries WHERE record_id IN (SELECT id FROM monthly_records WHERE school_id = ? AND month IN (?, ?))', [schoolB, 9, 10])
  await run('DELETE FROM monthly_records WHERE school_id = ? AND month IN (?, ?)', [schoolB, 9, 10])
  await run('DELETE FROM students WHERE id = ?', [studentB])
  await run('DELETE FROM grade_levels WHERE id = ?', [gradeLevelB])
  await run('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [adminA, adminB, teacherB, `missing-${suffix}`])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolA, schoolB])
  await new Promise(resolve => server.close(resolve))
})

test('public landing data contains aggregates but no learner or payment records', async () => {
  const landing = await request('/api/licenses/landing-data')
  assert.equal(landing.response.status, 200)
  assert.equal(landing.body.school, null)
  assert.ok(landing.body.publicPreview)
  assert.equal(landing.body.publicPreview.learnerRecords, false)
  assert.ok(!Object.hasOwn(landing.body, 'previewStudents'))
  assert.ok(!Object.hasOwn(landing.body, 'riskStudents'))
  assert.ok(!Object.hasOwn(landing.body, 'paymentMethods'))
  assert.ok(!Object.hasOwn(landing.body, 'payment_methods'))
  for (const plan of landing.body.plans || []) {
    assert.ok(!Object.hasOwn(plan, 'account_number'))
    assert.ok(!Object.hasOwn(plan, 'qr_image_url'))
    assert.ok(!Object.hasOwn(plan, 'internal_notes'))
  }
  assert.doesNotMatch(JSON.stringify(landing.body), /account_number|qr_image_url|student_id|lrn/i)
})

test('school administrators cannot list or inspect another school', async () => {
  const users = await request('/api/users', { headers: actorHeaders(adminA, 'admin') })
  assert.equal(users.response.status, 200)
  assert.ok(users.body.every(user => user.school_id === schoolA))
  assert.ok(!users.body.some(user => user.id === adminB))

  const school = await request(`/api/schools/${schoolB}`, { headers: actorHeaders(adminA, 'admin') })
  assert.equal(school.response.status, 403)

  const students = await request(`/api/students?schoolId=${encodeURIComponent(schoolB)}`, {
    headers: actorHeaders(adminA, 'admin')
  })
  assert.equal(students.response.status, 403)
})

test('school administrators cannot mutate another school or use superadmin license actions', async () => {
  const update = await request(`/api/users/${adminB}`, {
    method: 'PUT',
    headers: actorHeaders(adminA, 'admin'),
    body: JSON.stringify({ name: 'Unauthorized update' })
  })
  assert.equal(update.response.status, 403)

  const remove = await request(`/api/users/${adminB}`, {
    method: 'DELETE',
    headers: actorHeaders(adminA, 'admin')
  })
  assert.equal(remove.response.status, 403)

  const license = await request('/api/licenses/renew', {
    method: 'POST',
    headers: actorHeaders(adminA, 'admin'),
    body: JSON.stringify({ schoolId: schoolA, months: 1 })
  })
  assert.equal(license.response.status, 403)
})

test('teachers cannot list users or mutate students', async () => {
  const users = await request('/api/users', { headers: actorHeaders(teacherB, 'teacher') })
  assert.equal(users.response.status, 403)

  const remove = await request(`/api/students/${studentB}`, {
    method: 'DELETE',
    headers: actorHeaders(teacherB, 'teacher')
  })
  assert.equal(remove.response.status, 403)
})

test('teachers can create monthly SF2 records only for their advisory class', async () => {
  const save = await request('/api/monthly', {
    method: 'POST',
    headers: actorHeaders(teacherB, 'teacher'),
    body: JSON.stringify({
      schoolId: schoolB,
      month: 9,
      year: 2026,
      // Omitted intentionally: the API must resolve the teacher assignment.
      entries: [{ studentId: studentB, name: 'Student B', days: {}, present: 0, absent: 0 }]
    })
  })
  assert.equal(save.response.status, 200)
  assert.equal(save.body.success, true)
  assert.ok(save.body.record.id)

  const saved = await request(`/api/monthly?schoolId=${encodeURIComponent(schoolB)}&month=9&year=2026&grade=Grade%201&section=Section%20A`, {
    headers: actorHeaders(teacherB, 'teacher')
  })
  assert.equal(saved.response.status, 200)
  assert.equal(saved.body.grade, 'Grade 1')
  assert.equal(saved.body.section, 'Section A')

  const crossClass = await request('/api/monthly', {
    method: 'POST',
    headers: actorHeaders(teacherB, 'teacher'),
    body: JSON.stringify({
      schoolId: schoolB,
      month: 10,
      year: 2026,
      grade: 'Grade 2',
      section: 'Section B',
      entries: []
    })
  })
  assert.equal(crossClass.response.status, 403)
  assert.match(crossClass.body.error, /advisory class/i)
})

test('teacher SF2 export rejects a different advisory class', async () => {
  const exportResponse = await request('/api/export/sf2', {
    method: 'POST',
    headers: actorHeaders(teacherB, 'teacher'),
    body: JSON.stringify({
      schoolId: schoolB,
      sheetName: 'Sheet1',
      entries: [{ studentId: studentB, name: 'Student B', days: {} }],
      month: 9,
      year: 2026,
      grade: 'Grade 2',
      section: 'Section B'
    })
  })
  assert.equal(exportResponse.response.status, 403)
  assert.match(exportResponse.body.error, /advisory class/i)
})

test('caller-supplied roles cannot elevate database permissions', async () => {
  const schools = await request('/api/schools', { headers: actorHeaders(adminA, 'superadmin') })
  assert.equal(schools.response.status, 403)

  const unauthenticated = await request('/api/users', {
    headers: actorHeaders(`missing-${suffix}`, 'superadmin')
  })
  assert.equal(unauthenticated.response.status, 401)
})
