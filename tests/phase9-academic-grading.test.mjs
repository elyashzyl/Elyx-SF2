import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { calculateInitialGrade, transmuteGrade, determineHonors, getProficiencyLevel } from '../lib/grading.js'

const suffix = randomUUID()
const school1Id = `p9-sch1-${suffix}`
const school2Id = `p9-sch2-${suffix}`
const superadminId = `p9-super-${suffix}`
const admin1Id = `p9-admin1-${suffix}`
const teacher1Id = `p9-teach1-${suffix}`
const student1Id = `p9-stu1-${suffix}`
const student2Id = `p9-stu2-${suffix}`

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
  return { response, body, text }
}

before(async () => {
  await initializeServerDatabase()

  // Seed schools
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, school_year) VALUES (?, ?, ?, ?, ?, ?)',
    [school1Id, 'Phase 9 Baguio City High', '9001', 'Baguio City', 'BCHS', '2025-2026']
  )
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, school_year) VALUES (?, ?, ?, ?, ?, ?)',
    [school2Id, 'Phase 9 Benguet National High', '9002', 'La Trinidad', 'BNHS', '2025-2026']
  )

  // Seed users
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `p9-super-${suffix}`, 'hash', 'Super Admin', 'superadmin', '', '', '', '', 'super@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin1Id, `p9-admin1-${suffix}`, 'hash', 'School Admin', 'admin', '', '', '', school1Id, 'admin@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacher1Id, `p9-teach1-${suffix}`, 'hash', 'Class Adviser', 'teacher', 'Grade 7', 'Diamond', 'AM', school1Id, 'teacher@test.com']
  )

  // Seed students in school 1
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, lrn, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [student1Id, 'Santos, Maria Clara', 'Grade 7', 'Diamond', 'Female', school1Id, '109876543210', 'active']
  )
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, lrn, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [student2Id, 'Ibarra, Crisostomo', 'Grade 7', 'Diamond', 'Male', school1Id, '109876543211', 'active']
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM learner_grades WHERE school_id IN (?, ?)', [school1Id, school2Id])
  await run('DELETE FROM grading_subjects WHERE school_id IN (?, ?)', [school1Id, school2Id])
  await run('DELETE FROM students WHERE id IN (?, ?)', [student1Id, student2Id])
  await run('DELETE FROM users WHERE id IN (?, ?, ?)', [superadminId, admin1Id, teacher1Id])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [school1Id, school2Id])
})

test('DepEd Order No. 8, s. 2015 formula and transmutation unit checks', () => {
  // Test initial grade formula:
  // Math: WW 40%, PT 40%, QA 20%
  // ww: 80/100, pt: 90/100, qa: 45/50 (which is 90%)
  // ww weighted = 80 * 0.4 = 32
  // pt weighted = 90 * 0.4 = 36
  // qa weighted = 90 * 0.2 = 18
  // total initial = 32 + 36 + 18 = 86.00
  const initial = calculateInitialGrade(80, 100, 40, 90, 100, 40, 45, 50, 20)
  assert.equal(initial, 86.00)

  // Transmutation:
  // 86.00 is in range 85.60 - 87.19 -> 91
  const transmuted = transmuteGrade(86.00)
  assert.equal(transmuted, 91)

  // Boundary checks:
  assert.equal(transmuteGrade(100), 100)
  assert.equal(transmuteGrade(60.00), 75)
  assert.equal(transmuteGrade(59.99), 74)
  assert.equal(transmuteGrade(0), 60)

  // Proficiency descriptors:
  assert.equal(getProficiencyLevel(95), 'Outstanding')
  assert.equal(getProficiencyLevel(87), 'Very Satisfactory')
  assert.equal(getProficiencyLevel(82), 'Satisfactory')
  assert.equal(getProficiencyLevel(76), 'Fairly Satisfactory')
  assert.equal(getProficiencyLevel(70), 'Did Not Meet Expectations')

  // Honors evaluation:
  // 98+ with no grade below 85 -> With Highest Honors
  assert.deepEqual(determineHonors(98.5, [98, 99, 97, 100]), { status: 'Passed', honorTitle: 'With Highest Honors' })
  // 95-97 -> With High Honors
  assert.deepEqual(determineHonors(96.0, [95, 96, 97]), { status: 'Passed', honorTitle: 'With High Honors' })
  // 90-94 -> With Honors
  assert.deepEqual(determineHonors(92.0, [90, 92, 94]), { status: 'Passed', honorTitle: 'With Honors' })
  // 92 average but has an 84 -> Disqualified from honors
  assert.deepEqual(determineHonors(92.0, [96, 96, 84]), { status: 'Passed', honorTitle: null })
})

test('manages grading subjects and validates assessment weights', async () => {
  // 1. Try creating a subject with weights not summing to 100% -> expect 400
  const invalidRes = await request('/api/grading/subjects', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      schoolId: school1Id,
      gradeLevel: 'Grade 7',
      subjectName: 'Invalid Weights Subject',
      weightWw: 30,
      weightPt: 50,
      weightQa: 10 // sums to 90%
    })
  })
  assert.equal(invalidRes.response.status, 400)
  assert.match(invalidRes.body.error, /100%/)

  // 2. Create valid subject: Mathematics (WW 40, PT 40, QA 20)
  const mathRes = await request('/api/grading/subjects', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      schoolId: school1Id,
      gradeLevel: 'Grade 7',
      subjectName: 'Mathematics',
      subjectCode: 'MATH-7',
      weightWw: 40,
      weightPt: 40,
      weightQa: 20,
      displayOrder: 1
    })
  })
  assert.equal(mathRes.response.status, 201)
  assert.equal(mathRes.body.success, true)
  const mathSubjectId = mathRes.body.subject.id
  assert.ok(mathSubjectId)

  // 3. Seed DepEd default subjects for Grade 7
  const seedRes = await request('/api/grading/subjects/seed-defaults', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      schoolId: school1Id,
      gradeLevel: 'Grade 7'
    })
  })
  assert.equal(seedRes.response.status, 200)
  assert.equal(seedRes.body.success, true)
  assert.ok(seedRes.body.count >= 7) // Mathematics already exists, remaining 7 added

  // 4. List subjects for Grade 7
  const listRes = await request(`/api/grading/subjects?schoolId=${school1Id}&gradeLevel=Grade 7`, {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(listRes.response.status, 200)
  assert.equal(listRes.body.success, true)
  assert.ok(listRes.body.subjects.length >= 8)

  // 5. Update subject
  const updateRes = await request(`/api/grading/subjects/${mathSubjectId}`, {
    method: 'PUT',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      subjectName: 'Advanced Mathematics 7',
      weightWw: 40,
      weightPt: 40,
      weightQa: 20
    })
  })
  assert.equal(updateRes.response.status, 200)
  assert.equal(updateRes.body.subject.subject_name, 'Advanced Mathematics 7')
})

test('loads grade sheet, saves scores with transmutation, and protects locked records', async () => {
  // 1. Fetch created Math subject
  const listRes = await request(`/api/grading/subjects?schoolId=${school1Id}&gradeLevel=Grade 7`, {
    headers: headers(teacher1Id, 'teacher')
  })
  const mathSubject = listRes.body.subjects.find(s => s.subject_name.includes('Mathematics'))
  assert.ok(mathSubject)

  // 2. Load grade sheet for Grade 7 Diamond
  const sheetRes = await request(
    `/api/grading/sheet?schoolId=${school1Id}&gradeLevel=Grade 7&section=Diamond&subjectId=${mathSubject.id}&quarter=Q1&schoolYear=2025-2026`,
    { headers: headers(teacher1Id, 'teacher') }
  )
  assert.equal(sheetRes.response.status, 200)
  assert.equal(sheetRes.body.success, true)
  assert.equal(sheetRes.body.students.length, 2)
  // Verify default zero scores for initial load
  assert.equal(sheetRes.body.students[0].initial_grade, 0)

  // 3. Encode scores for Maria Clara Santos (high achiever) and Crisostomo Ibarra
  // Maria Clara: WW 95/100, PT 98/100, QA 48/50 -> high score (96.4 initial -> ~97 transmuted)
  // Crisostomo: WW 70/100, PT 75/100, QA 35/50 -> passing
  const saveRes = await request('/api/grading/sheet/save', {
    method: 'POST',
    headers: headers(teacher1Id, 'teacher'),
    body: JSON.stringify({
      schoolId: school1Id,
      subjectId: mathSubject.id,
      gradeLevel: 'Grade 7',
      section: 'Diamond',
      quarter: 'Q1',
      schoolYear: '2025-2026',
      grades: [
        {
          studentId: student1Id,
          wwScore: 95,
          wwTotal: 100,
          ptScore: 98,
          ptTotal: 100,
          qaScore: 48,
          qaTotal: 50
        },
        {
          studentId: student2Id,
          wwScore: 70,
          wwTotal: 100,
          ptScore: 75,
          ptTotal: 100,
          qaScore: 35,
          qaTotal: 50
        }
      ]
    })
  })
  assert.equal(saveRes.response.status, 200)
  assert.equal(saveRes.body.success, true)
  assert.equal(saveRes.body.count, 2)

  // 4. Reload sheet and verify transmuted grades and remarks
  const updatedSheetRes = await request(
    `/api/grading/sheet?schoolId=${school1Id}&gradeLevel=Grade 7&section=Diamond&subjectId=${mathSubject.id}&quarter=Q1&schoolYear=2025-2026`,
    { headers: headers(teacher1Id, 'teacher') }
  )
  assert.equal(updatedSheetRes.response.status, 200)
  const mariaClara = updatedSheetRes.body.students.find(s => s.id === student1Id)
  assert.ok(mariaClara)
  assert.ok(mariaClara.initial_grade > 90)
  assert.ok(mariaClara.transmuted_grade >= 95)
  assert.equal(mariaClara.remarks, 'Passed')

  // 5. Verify subject cannot be deleted while learner grades exist
  const delSubjectRes = await request(`/api/grading/subjects/${mathSubject.id}`, {
    method: 'DELETE',
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(delSubjectRes.response.status, 400)
  assert.match(delSubjectRes.body.error, /recorded student grade/)
})

test('generates DepEd Form 138 report card and grading analytics', async () => {
  // 1. Fetch Form 138 for Maria Clara
  const form138Res = await request(`/api/grading/form138/${student1Id}?schoolYear=2025-2026`, {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(form138Res.response.status, 200)
  assert.equal(form138Res.body.success, true)
  assert.equal(form138Res.body.student.name, 'Santos, Maria Clara')
  assert.equal(form138Res.body.school.name, 'Phase 9 Baguio City High')
  assert.ok(Array.isArray(form138Res.body.subjects))
  assert.ok(Array.isArray(form138Res.body.coreValues))
  assert.ok(form138Res.body.attendanceSummary)

  // 2. Fetch Grading Analytics for school 1
  const analyticsRes = await request(
    `/api/grading/analytics?schoolId=${school1Id}&gradeLevel=Grade 7&quarter=Q1&schoolYear=2025-2026`,
    { headers: headers(admin1Id, 'admin') }
  )
  assert.equal(analyticsRes.response.status, 200)
  assert.equal(analyticsRes.body.success, true)
  assert.ok(analyticsRes.body.totalGradesEvaluated >= 2)
  assert.equal(analyticsRes.body.passingRate, 100)
  assert.ok(analyticsRes.body.distribution.outstanding >= 1)
})

test('enforces school isolation on Form 138 and subject access', async () => {
  // Create admin for school 2
  const admin2Id = `p9-admin2-${suffix}`
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin2Id, `p9-admin2-${suffix}`, 'hash', 'Admin School 2', 'admin', '', '', '', school2Id, 'admin2@test.com']
  )

  // Admin 2 attempts to view Form 138 of School 1 student -> Forbidden 403
  const forbiddenRes = await request(`/api/grading/form138/${student1Id}`, {
    headers: headers(admin2Id, 'admin')
  })
  assert.equal(forbiddenRes.response.status, 403)

  await run('DELETE FROM users WHERE id = ?', [admin2Id])
})
