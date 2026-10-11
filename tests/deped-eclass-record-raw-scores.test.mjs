import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { calculateDepEdComponent, calculateLearnerEClassRecord, transmuteGrade } from '../lib/grading.js'

const suffix = randomUUID()
const schoolId = `cr-sch-${suffix}`
const superadminId = `cr-super-${suffix}`
const teacherId = `cr-teach-${suffix}`
const studentMId = `cr-stu-m-${suffix}`
const studentFId = `cr-stu-f-${suffix}`
const subjectId = `cr-sub-${suffix}`

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

  // Seed test school
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, school_year, quarter_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [schoolId, 'E-Class Record High School', '8888', 'Baguio City', 'ECRHS', '2026-2027', 4]
  )

  // Seed superadmin & teacher
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `cr-super-${suffix}`, 'hash', 'Super Admin', 'superadmin', '', '', '', '', 'super@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherId, `cr-teach-${suffix}`, 'hash', 'Subject Teacher', 'teacher', 'Grade 8', 'Sapphire', 'AM', schoolId, 'teacher@test.com']
  )

  // Seed students (1 male, 1 female)
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, lrn, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [studentMId, 'Dela Cruz, Juan', 'Grade 8', 'Sapphire', 'Male', schoolId, '123456789012', 'active']
  )
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, lrn, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [studentFId, 'Silang, Gabriela', 'Grade 8', 'Sapphire', 'Female', schoolId, '123456789013', 'active']
  )

  // Seed grading subject
  await run(
    `INSERT INTO grading_subjects (id, school_id, grade_level, subject_name, subject_code, weight_ww, weight_pt, weight_qa, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [subjectId, schoolId, 'Grade 8', 'Science', 'SCI8', 40, 40, 20, 1]
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM class_record_configs WHERE school_id = ?', [schoolId])
  await run('DELETE FROM learner_grades WHERE school_id = ?', [schoolId])
  await run('DELETE FROM grading_subjects WHERE school_id = ?', [schoolId])
  await run('DELETE FROM students WHERE id IN (?, ?)', [studentMId, studentFId])
  await run('DELETE FROM users WHERE id IN (?, ?)', [superadminId, teacherId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
})

test('DepEd Order No. 8, s. 2015 component PS and WS calculations', () => {
  // Test calculateDepEdComponent
  // 5 items: raw scores [18, 19, 23, 19, 15], HPS [20, 20, 25, 20, 15]
  // Total raw = 94, Total HPS = 100
  // PS = 94.00%, with weight 40% -> WS = 37.60
  const comp = calculateDepEdComponent([18, 19, 23, 19, 15], [20, 20, 25, 20, 15], 40)
  assert.equal(comp.totalRaw, 94)
  assert.equal(comp.totalHps, 100)
  assert.equal(comp.ps, 94.00)
  assert.equal(comp.ws, 37.60)

  // Test full learner record:
  // WW: 94 / 100 * 40% = 37.60
  // PT: [24, 25, 23, 24] -> 96 / 100 * 40% = 38.40
  // QA: [45] / 50 -> 90% * 20% = 18.00
  // Initial Grade = 37.60 + 38.40 + 18.00 = 94.00
  // Transmuted Grade = 96
  const record = calculateLearnerEClassRecord({
    wwScores: [18, 19, 23, 19, 15],
    wwHps: [20, 20, 25, 20, 15],
    weightWw: 40,
    ptScores: [24, 25, 23, 24],
    ptHps: [25, 25, 25, 25],
    weightPt: 40,
    qaScores: [45],
    qaHps: [50],
    weightQa: 20
  })

  assert.equal(record.initialGrade, 94.00)
  assert.equal(record.transmutedGrade, 96)
  assert.equal(record.remarks, 'Passed')
})

test('GET /api/grading/class-record loads students grouped by gender with default weights', async () => {
  const { response, body } = await request(
    `/api/grading/class-record?schoolId=${schoolId}&gradeLevel=Grade%208&section=Sapphire&subjectId=${subjectId}&quarter=Q1&schoolYear=2026-2027`,
    { headers: headers(teacherId, 'teacher') }
  )

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.subject.id, subjectId)
  assert.equal(body.config.weight_ww, 40)
  assert.equal(body.config.weight_pt, 40)
  assert.equal(body.config.weight_qa, 20)
  assert.equal(body.students.length, 2)

  // Male first, then female
  assert.equal(body.students[0].gender, 'Male')
  assert.equal(body.students[1].gender, 'Female')
})

test('POST /api/grading/class-record/save validates weights must total 100%', async () => {
  const invalidPayload = {
    schoolId,
    gradeLevel: 'Grade 8',
    section: 'Sapphire',
    subjectId,
    quarter: 'Q1',
    schoolYear: '2026-2027',
    weightWw: 30,
    weightPt: 50,
    weightQa: 10, // sums to 90%
    wwHps: [20, 20, 20],
    ptHps: [25, 25],
    qaHps: [50],
    learners: []
  }

  const { response, body } = await request('/api/grading/class-record/save', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify(invalidPayload)
  })

  assert.equal(response.status, 400)
  assert.match(body.error, /Assessment weights must total exactly 100%/)
})

test('POST /api/grading/class-record/save saves teacher-adjusted percentages and raw scores', async () => {
  // Teacher adjusts Science weights to 35% WW, 45% PT, 20% QA (sums to 100%)
  const savePayload = {
    schoolId,
    gradeLevel: 'Grade 8',
    section: 'Sapphire',
    subjectId,
    quarter: 'Q1',
    schoolYear: '2026-2027',
    weightWw: 35,
    weightPt: 45,
    weightQa: 20,
    wwHps: [20, 25, 20, 15, 20], // sum 100
    ptHps: [25, 25, 25, 25],     // sum 100
    qaHps: [50],                 // sum 50
    learners: [
      {
        studentId: studentMId,
        wwScores: [19, 23, 19, 14, 18], // sum = 93 -> 93% * 35% = 32.55
        ptScores: [24, 25, 23, 24],     // sum = 96 -> 96% * 45% = 43.20
        qaScores: [46],                 // 46/50 = 92% * 20% = 18.40
        // Initial = 32.55 + 43.20 + 18.40 = 94.15 -> Transmuted 96
        isLocked: 0
      },
      {
        studentId: studentFId,
        wwScores: [15, 20, 15, 12, 16], // sum = 78 -> 78% * 35% = 27.30
        ptScores: [20, 22, 21, 22],     // sum = 85 -> 85% * 45% = 38.25
        qaScores: [40],                 // 40/50 = 80% * 20% = 16.00
        // Initial = 27.30 + 38.25 + 16.00 = 81.55 -> Transmuted 88
        isLocked: 0
      }
    ]
  }

  const { response, body } = await request('/api/grading/class-record/save', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify(savePayload)
  })

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.count, 2)

  // Verify class_record_configs was updated with teacher's adjusted weights
  const configs = await query(
    'SELECT * FROM class_record_configs WHERE school_id = ? AND subject_id = ? AND quarter = ?',
    [schoolId, subjectId, 'Q1']
  )
  assert.equal(configs.length, 1)
  assert.equal(configs[0].weight_ww, 35)
  assert.equal(configs[0].weight_pt, 45)
  assert.equal(configs[0].weight_qa, 20)

  // Verify learner_grades has raw_scores and transmuted grades
  const grades = await query(
    'SELECT * FROM learner_grades WHERE school_id = ? AND subject_id = ? AND quarter = ? ORDER BY student_id',
    [schoolId, subjectId, 'Q1']
  )
  assert.equal(grades.length, 2)

  const studentMGrade = grades.find(g => g.student_id === studentMId)
  assert.ok(studentMGrade)
  assert.equal(studentMGrade.transmuted_grade, 96)
  assert.equal(studentMGrade.remarks, 'Passed')

  const parsedRawM = JSON.parse(studentMGrade.raw_scores)
  assert.deepEqual(parsedRawM.ww, [19, 23, 19, 14, 18])
  assert.deepEqual(parsedRawM.qa, [46])

  // Verify GET /class-record reflects the saved weights and raw scores
  const getRes = await request(
    `/api/grading/class-record?schoolId=${schoolId}&gradeLevel=Grade%208&section=Sapphire&subjectId=${subjectId}&quarter=Q1&schoolYear=2026-2027`,
    { headers: headers(teacherId, 'teacher') }
  )
  assert.equal(getRes.body.config.weight_ww, 35)
  assert.equal(getRes.body.config.weight_pt, 45)
  assert.equal(getRes.body.config.weight_qa, 20)
  assert.equal(getRes.body.students[0].transmuted_grade, 96)
})

test('Form 138 (SF9) seamlessly reflects quarter grades computed from raw scores', async () => {
  const { response, body } = await request(
    `/api/grading/form138/${studentMId}?schoolYear=2026-2027`,
    { headers: headers(teacherId, 'teacher') }
  )

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  const scienceArea = body.subjects.find(s => s.subjectId === subjectId)
  assert.ok(scienceArea)
  assert.equal(scienceArea.q1, 96)
})

test('Respects quarter_count and rejects Q4 for 3-quarter (trimester) schools', async () => {
  // Update school to 3 quarters
  await run('UPDATE schools SET quarter_count = 3 WHERE id = ?', [schoolId])

  // Attempting to fetch class record for Q4 should be rejected with 400
  const { response, body } = await request(
    `/api/grading/class-record?schoolId=${schoolId}&gradeLevel=Grade%208&section=Sapphire&subjectId=${subjectId}&quarter=Q4&schoolYear=2026-2027`,
    { headers: headers(teacherId, 'teacher') }
  )

  assert.equal(response.status, 400)
  assert.match(body.error, /4th Quarter is not available for schools with 3 Quarters/)

  // Reset back to 4 quarters
  await run('UPDATE schools SET quarter_count = 4 WHERE id = ?', [schoolId])
})

test('Connects seamlessly to configured school year', async () => {
  // Check that querying with a different school year separates the records
  const { response, body } = await request(
    `/api/grading/class-record?schoolId=${schoolId}&gradeLevel=Grade%208&section=Sapphire&subjectId=${subjectId}&quarter=Q1&schoolYear=2027-2028`,
    { headers: headers(teacherId, 'teacher') }
  )

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.schoolYear, '2027-2028')
  // New school year has fresh unencoded grades
  assert.equal(body.students[0].initial_grade, 0)
})

test('GET /api/grading/class-record/export generates formatted DepEd CSV spreadsheet', async () => {
  const { response, text } = await request(
    `/api/grading/class-record/export?schoolId=${schoolId}&gradeLevel=Grade%208&section=Sapphire&subjectId=${subjectId}&quarter=Q1&schoolYear=2026-2027`,
    { headers: headers(teacherId, 'teacher') }
  )

  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /text\/csv/)
  assert.match(response.headers.get('content-disposition'), /attachment; filename="EClassRecord_/)

  // CSV content checks
  assert.ok(text.includes('DEPARTMENT OF EDUCATION - ELECTRONIC CLASS RECORD'))
  assert.ok(text.includes('Written Works: 35%'))
  assert.ok(text.includes('Performance Tasks: 45%'))
  assert.ok(text.includes('Quarterly Assessment: 20%'))
  assert.ok(text.includes('HIGHEST POSSIBLE SCORE (HPS)'))
  assert.ok(text.includes('MALE LEARNERS'))
  assert.ok(text.includes('Dela Cruz, Juan'))
  assert.ok(text.includes('FEMALE LEARNERS'))
  assert.ok(text.includes('Silang, Gabriela'))
})
