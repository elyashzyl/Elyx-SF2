import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import app, { initializeServerDatabase } from '../server.js'
import { run, query } from '../db.js'

let server
let baseUrl
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`

const schoolA = `sub-school-a-${suffix}`
const schoolB = `sub-school-b-${suffix}`

const superadminId = `sub-super-${suffix}`
const adminA = `sub-admin-a-${suffix}`
const adminB = `sub-admin-b-${suffix}`
const teacherA = `sub-teach-a-${suffix}`

const studentA = `sub-stud-a-${suffix}`

function headers(userId, role) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-user-role': role
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`
  const res = await fetch(url, options)
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { response: res, body }
}

before(async () => {
  await initializeServerDatabase()

  // Seed schools
  await run(
    'INSERT INTO schools (id, name, school_id) VALUES (?, ?, ?)',
    [schoolA, `School A ${suffix}`, `SCHA-${suffix}`]
  )
  await run(
    'INSERT INTO schools (id, name, school_id) VALUES (?, ?, ?)',
    [schoolB, `School B ${suffix}`, `SCHB-${suffix}`]
  )

  // Seed grade levels for School A
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [`gl-a7-${suffix}`, schoolA, 'Grade 7', JSON.stringify(['Emerald']), 1]
  )
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [`gl-a8-${suffix}`, schoolA, 'Grade 8', JSON.stringify(['Garnet']), 2]
  )

  // Seed users
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `sub-super-${suffix}`, 'hash', 'Super Admin', 'superadmin', '', '', '', '', 'super@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminA, `sub-admin-a-${suffix}`, 'hash', 'Admin A', 'admin', '', '', '', schoolA, 'adminA@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminB, `sub-admin-b-${suffix}`, 'hash', 'Admin B', 'admin', '', '', '', schoolB, 'adminB@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherA, `sub-teach-a-${suffix}`, 'hash', 'Teacher A', 'teacher', 'Grade 7', 'Emerald', 'AM', schoolA, 'teacherA@test.com']
  )

  // Seed student in School A
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, lrn, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [studentA, 'Luna, Antonio', 'Grade 7', 'Emerald', 'Male', schoolA, '112233445566', 'active']
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM learner_grades WHERE school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM grading_subjects WHERE school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM grade_levels WHERE school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM students WHERE school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM licenses WHERE school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [superadminId, adminA, adminB, teacherA])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolA, schoolB])
})

test('Subject Creation & DepEd Order No. 8, s. 2015 weight validation', async () => {
  // 1. Rejects when weights do not sum to 100%
  const invalidRes = await request('/api/grading/subjects', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      schoolId: schoolA,
      gradeLevel: 'Grade 7',
      subjectName: 'Test Subject',
      subjectCode: 'TST',
      weightWw: 40,
      weightPt: 40,
      weightQa: 10 // sums to 90%
    })
  })
  assert.equal(invalidRes.response.status, 400)
  assert.match(invalidRes.body.error, /100%/)

  // 2. Succeeds when weights sum to 100% (DepEd Math standard: 40/40/20)
  const validRes = await request('/api/grading/subjects', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      schoolId: schoolA,
      gradeLevel: 'Grade 7',
      subjectName: 'Mathematics 7',
      subjectCode: 'MATH7',
      weightWw: 40,
      weightPt: 40,
      weightQa: 20,
      displayOrder: 1
    })
  })
  assert.equal(validRes.response.status, 201)
  assert.equal(validRes.body.success, true)
  assert.equal(validRes.body.subject.subject_name, 'Mathematics 7')
  assert.equal(validRes.body.subject.weight_ww, 40)
  assert.equal(validRes.body.subject.weight_pt, 40)
  assert.equal(validRes.body.subject.weight_qa, 20)
})

test('Subject Seeding: Populates DepEd standard subjects across single or all school grade levels', async () => {
  // Seed for 'all' grades in School A (which has Grade 7 and Grade 8)
  const seedRes = await request('/api/grading/subjects/seed-defaults', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      schoolId: schoolA,
      gradeLevel: 'all'
    })
  })
  assert.equal(seedRes.response.status, 200)
  assert.equal(seedRes.body.success, true)
  assert.ok(seedRes.body.count > 0)

  // Verify Grade 7 subjects (Mathematics 7 + seeded standards)
  const listG7 = await request(`/api/grading/subjects?schoolId=${schoolA}&gradeLevel=Grade 7`, {
    headers: headers(teacherA, 'teacher')
  })
  assert.equal(listG7.response.status, 200)
  assert.ok(listG7.body.subjects.some(s => s.subject_name === 'Mathematics 7' || s.subject_name === 'Mathematics'))
  assert.ok(listG7.body.subjects.some(s => s.subject_name === 'English'))
  assert.ok(listG7.body.subjects.some(s => s.subject_name === 'Filipino'))

  // Verify Grade 8 subjects were also seeded
  const listG8 = await request(`/api/grading/subjects?schoolId=${schoolA}&gradeLevel=Grade 8`, {
    headers: headers(teacherA, 'teacher')
  })
  assert.equal(listG8.response.status, 200)
  assert.ok(listG8.body.subjects.length >= 8)
})

test('Subject Update & Delete Protection against recorded grades', async () => {
  // Create a dedicated subject for delete tests
  const createRes = await request('/api/grading/subjects', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      schoolId: schoolA,
      gradeLevel: 'Grade 7',
      subjectName: 'Elective Journalism',
      subjectCode: 'JOURN',
      weightWw: 30,
      weightPt: 50,
      weightQa: 20
    })
  })
  assert.equal(createRes.response.status, 201)
  const subjectId = createRes.body.subject.id

  // 1. Update subject details
  const updateRes = await request(`/api/grading/subjects/${subjectId}`, {
    method: 'PUT',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      subjectName: 'Advanced Journalism 7',
      weightWw: 30,
      weightPt: 50,
      weightQa: 20
    })
  })
  assert.equal(updateRes.response.status, 200)
  assert.equal(updateRes.body.subject.subject_name, 'Advanced Journalism 7')

  // 2. Attach a student grade to this subject
  await run(
    `INSERT INTO learner_grades (id, school_id, student_id, subject_id, school_year, quarter, initial_grade, transmuted_grade)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [`lg-test-${suffix}`, schoolA, studentA, subjectId, '2026-2027', 'Q1', 85, 90]
  )

  // 3. Attempt to delete -> Should be rejected with 400 because student grade exists
  const deleteBlockedRes = await request(`/api/grading/subjects/${subjectId}`, {
    method: 'DELETE',
    headers: headers(adminA, 'admin')
  })
  assert.equal(deleteBlockedRes.response.status, 400)
  assert.match(deleteBlockedRes.body.error, /Cannot delete subject because .* recorded student grade\(s\) exist/)

  // 4. Remove grade and retry deletion -> Should succeed
  await run('DELETE FROM learner_grades WHERE id = ?', [`lg-test-${suffix}`])
  const deleteOkRes = await request(`/api/grading/subjects/${subjectId}`, {
    method: 'DELETE',
    headers: headers(adminA, 'admin')
  })
  assert.equal(deleteOkRes.response.status, 200)
  assert.equal(deleteOkRes.body.success, true)
})

test('Campus Isolation: Prevents cross-school access and mutation', async () => {
  // Admin B (School B) attempts to create subject in School A -> Expect 403
  const crossCreate = await request('/api/grading/subjects', {
    method: 'POST',
    headers: headers(adminB, 'admin'),
    body: JSON.stringify({
      schoolId: schoolA,
      gradeLevel: 'Grade 7',
      subjectName: 'Hacked Subject',
      weightWw: 30,
      weightPt: 50,
      weightQa: 20
    })
  })
  assert.equal(crossCreate.response.status, 403)

  // Admin B attempts to list School A's subjects -> Expect 403
  const crossList = await request(`/api/grading/subjects?schoolId=${schoolA}`, {
    headers: headers(adminB, 'admin')
  })
  assert.equal(crossList.response.status, 403)
})

test('License Enforcement: Locks subject operations when campus license is suspended or expired', async () => {
  const licenseId = `lic-sub-${suffix}`

  // 1. Insert suspended license for School A
  await run(
    `INSERT INTO licenses (id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers, max_students, issued_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [licenseId, schoolA, `KEY-SUB-${suffix}`, 'standard', 'suspended', 'annual', 10, 200]
  )

  // 2. Admin A attempts to list subjects -> 402 License Locked
  const listLocked = await request(`/api/grading/subjects?schoolId=${schoolA}`, {
    headers: headers(adminA, 'admin')
  })
  assert.equal(listLocked.response.status, 402)
  assert.equal(listLocked.body.licenseLocked, true)

  // 3. Admin A attempts to create subject -> 402 License Locked
  const createLocked = await request('/api/grading/subjects', {
    method: 'POST',
    headers: headers(adminA, 'admin'),
    body: JSON.stringify({
      schoolId: schoolA,
      gradeLevel: 'Grade 7',
      subjectName: 'Locked Subject',
      weightWw: 30,
      weightPt: 50,
      weightQa: 20
    })
  })
  assert.equal(createLocked.response.status, 402)
  assert.equal(createLocked.body.licenseLocked, true)

  // Clean up license
  await run('DELETE FROM licenses WHERE id = ?', [licenseId])
})
