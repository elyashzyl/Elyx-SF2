import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'

const ROOT = process.cwd()
function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8').replace(/\r\n/g, '\n')
}

// -----------------------------------------------------------------------------
// PART 1: STATIC & SCHEMA INTEGRITY TESTS
// -----------------------------------------------------------------------------
test('migration 033_school_quarter_count is append-only and supports both database backends', () => {
  const migration = read('migrations/033_school_quarter_count.mjs')
  assert.match(migration, /export const id = '033_school_quarter_count'/)
  assert.match(migration, /ALTER TABLE schools ADD COLUMN/)
  assert.match(migration, /quarter_count/)
  assert.match(migration, /isMysql/)
  assert.doesNotMatch(migration, /INSERT INTO|UPDATE schools/i)
})

test('quarter_count and school_year are exposed across db layer, context, schools, and settings routes', () => {
  const context = read('routes/_context.js')
  const settings = read('routes/settings.js')
  const schools = read('routes/schools.js')
  const quarterly = read('routes/quarterly.js')
  const grading = read('routes/grading.js')
  const db = read('db.js')
  const schoolsVue = read('src/views/Schools.vue')
  const settingsVue = read('src/views/Settings.vue')
  const quarterlyVue = read('src/views/QuarterlySettings.vue')
  const gradingVue = read('src/views/Grading.vue')

  assert.ok(context.includes('quarter_count'), 'context includes quarter_count')
  assert.ok(context.includes('school_year'), 'context includes school_year')

  assert.ok(schools.includes('quarter_count'), 'schools route includes quarter_count')
  assert.ok(schools.includes('school_year'), 'schools route includes school_year')
  assert.ok(schools.includes('bulk-school-year'), 'schools route includes bulk-school-year')

  assert.ok(settings.includes('quarter_count'), 'settings route includes quarter_count')
  assert.ok(settings.includes('school_year'), 'settings route includes school_year')
  assert.ok(settings.includes('apply-school-year'), 'settings route includes apply-school-year')

  assert.ok(quarterly.includes('quarter_count') || quarterly.includes('quarterCount'), 'quarterly terms route supports quarter_count')
  assert.ok(grading.includes('quarter_count') || grading.includes('quarterCount'), 'grading route respects school quarter_count')

  assert.ok(db.includes('quarter_count'), 'db includes quarter_count')

  assert.ok(schoolsVue.includes('quarter_count'), 'Schools.vue binds quarter_count')
  assert.ok(schoolsVue.includes('school_year'), 'Schools.vue binds school_year')
  assert.ok(schoolsVue.includes('showBulkSyModal') || schoolsVue.includes('bulkSchoolYear'), 'Schools.vue has bulk school year modal')

  assert.ok(settingsVue.includes('form.quarter_count'), 'Settings.vue binds form.quarter_count')
  assert.ok(settingsVue.includes('form.school_year'), 'Settings.vue binds form.school_year')
  assert.ok(settingsVue.includes('applyGlobalSchoolYear'), 'Settings.vue has applyGlobalSchoolYear')

  assert.ok(quarterlyVue.includes('selectedQuarterCount') || quarterlyVue.includes('quarter_count'), 'QuarterlySettings.vue binds quarter count')
  assert.ok(gradingVue.includes('activeQuarterCount'), 'Grading.vue determines activeQuarterCount')
  assert.ok(gradingVue.includes('activeQuarterList'), 'Grading.vue provides activeQuarterList')
})

// -----------------------------------------------------------------------------
// PART 2: END-TO-END API TESTS WITH A 3-QUARTER SCHOOL
// -----------------------------------------------------------------------------
const suffix = randomUUID()
const school3QId = `sch-3q-${suffix}`
const school4QId = `sch-4q-${suffix}`
const superadminId = `super-${suffix}`
const adminId = `admin-${suffix}`
const teacherId = `teach-${suffix}`
const studentId = `stu-3q-${suffix}`
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

  // Seed 3-Quarter school
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, school_year, grading_period, quarter_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [school3QId, 'Trimester High School', '3001', 'Benguet', 'THS', '2026-2027', 'First Trimester', 3]
  )

  // Seed 4-Quarter school
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, school_year, grading_period, quarter_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [school4QId, 'Standard 4Q High School', '4001', 'Baguio City', 'SQHS', '2025-2026', 'First Grading', 4]
  )

  // Seed users
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `super-${suffix}`, 'hash', 'Super Admin', 'superadmin', '', '', '', '', 'super@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminId, `admin-${suffix}`, 'hash', 'School Admin', 'admin', '', '', '', school3QId, 'admin@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherId, `teach-${suffix}`, 'hash', 'Teacher Trimester', 'teacher', 'Grade 8', 'Amber', 'AM', school3QId, 'teacher@test.com']
  )

  // Seed student in 3Q school
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, lrn, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [studentId, 'Dela Cruz, Juan', 'Grade 8', 'Amber', 'Male', school3QId, '123456789012', 'active']
  )

  // Seed subject in 3Q school
  await run(
    'INSERT INTO grading_subjects (id, school_id, grade_level, subject_name, subject_code, weight_ww, weight_pt, weight_qa, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [`sub-${suffix}`, school3QId, 'Grade 8', 'Science 8', 'SCI8', 40, 40, 20, 1]
  )

  // Seed Q1, Q2, Q3 grades for student (and an orphaned Q4 grade that should be ignored in 3Q mode)
  await run(
    `INSERT INTO learner_grades (id, school_id, student_id, subject_id, school_year, quarter, ww_score, ww_total, pt_score, pt_total, qa_score, qa_total, initial_grade, transmuted_grade, remarks, is_locked)
     VALUES (?, ?, ?, ?, ?, ?, 80, 100, 80, 100, 40, 50, 80, 87, 'Passed', 0)`,
    [`lg-q1-${suffix}`, school3QId, studentId, `sub-${suffix}`, '2026-2027', 'Q1']
  )
  await run(
    `INSERT INTO learner_grades (id, school_id, student_id, subject_id, school_year, quarter, ww_score, ww_total, pt_score, pt_total, qa_score, qa_total, initial_grade, transmuted_grade, remarks, is_locked)
     VALUES (?, ?, ?, ?, ?, ?, 85, 100, 85, 100, 42, 50, 85, 90, 'Passed', 0)`,
    [`lg-q2-${suffix}`, school3QId, studentId, `sub-${suffix}`, '2026-2027', 'Q2']
  )
  await run(
    `INSERT INTO learner_grades (id, school_id, student_id, subject_id, school_year, quarter, ww_score, ww_total, pt_score, pt_total, qa_score, qa_total, initial_grade, transmuted_grade, remarks, is_locked)
     VALUES (?, ?, ?, ?, ?, ?, 90, 100, 90, 100, 45, 50, 90, 93, 'Passed', 0)`,
    [`lg-q3-${suffix}`, school3QId, studentId, `sub-${suffix}`, '2026-2027', 'Q3']
  )
  // An orphaned Q4 grade with 60 to verify it is excluded from average in 3-quarter school
  await run(
    `INSERT INTO learner_grades (id, school_id, student_id, subject_id, school_year, quarter, ww_score, ww_total, pt_score, pt_total, qa_score, qa_total, initial_grade, transmuted_grade, remarks, is_locked)
     VALUES (?, ?, ?, ?, ?, ?, 50, 100, 50, 100, 20, 50, 50, 60, 'Failed', 0)`,
    [`lg-q4-${suffix}`, school3QId, studentId, `sub-${suffix}`, '2026-2027', 'Q4']
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM learner_grades WHERE school_id IN (?, ?)', [school3QId, school4QId])
  await run('DELETE FROM grading_subjects WHERE school_id IN (?, ?)', [school3QId, school4QId])
  await run('DELETE FROM students WHERE id = ?', [studentId])
  await run('DELETE FROM users WHERE id IN (?, ?, ?)', [superadminId, adminId, teacherId])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [school3QId, school4QId])
})

test('GET and PUT /api/schools persists quarter_count and school_year', async () => {
  // 1. Fetch 3-Quarter school
  const getRes = await request(`/api/schools/${school3QId}`, {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(getRes.response.status, 200)
  assert.equal(getRes.body.quarter_count, 3)
  assert.equal(getRes.body.school_year, '2026-2027')

  // 2. Fetch 4-Quarter school
  const get4QRes = await request(`/api/schools/${school4QId}`, {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(get4QRes.response.status, 200)
  assert.equal(get4QRes.body.quarter_count, 4)
  assert.equal(get4QRes.body.school_year, '2025-2026')

  // 3. Update 4Q school to 3Q and update school year
  const updateRes = await request(`/api/schools/${school4QId}`, {
    method: 'PUT',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      quarter_count: 3,
      school_year: '2026-2027'
    })
  })
  assert.equal(updateRes.response.status, 200)
  assert.equal(updateRes.body.school.quarter_count, 3)
  assert.equal(updateRes.body.school.school_year, '2026-2027')

  // Revert back
  await request(`/api/schools/${school4QId}`, {
    method: 'PUT',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      quarter_count: 4,
      school_year: '2025-2026'
    })
  })
})

test('GET /api/quarterly/terms exposes school quarter_count and disables Q4 defaults for 3Q school', async () => {
  const termsRes = await request(`/api/quarterly/terms?schoolId=${school3QId}&schoolYear=2026-2027`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(termsRes.response.status, 200)
  assert.equal(termsRes.body.quarter_count, 3)
  const q4 = termsRes.body.quarters.find(q => q.quarter_number === 4)
  assert.ok(q4)
  assert.equal(q4.is_active, 0)
})

test('GET /api/grading/form138/:studentId calculates 3-quarter average excluding Q4', async () => {
  const form138Res = await request(`/api/grading/form138/${studentId}?schoolYear=2026-2027`, {
    headers: headers(teacherId, 'teacher')
  })
  assert.equal(form138Res.response.status, 200)
  assert.equal(form138Res.body.quarterCount, 3)
  assert.equal(form138Res.body.schoolYear, '2026-2027')

  const subject = form138Res.body.learningAreas.find(la => la.subjectCode === 'SCI8')
  assert.ok(subject)
  assert.equal(subject.q1, 87)
  assert.equal(subject.q2, 90)
  assert.equal(subject.q3, 93)
  assert.equal(subject.q4, null) // In 3Q mode, Q4 is null

  // Expected 3-quarter final rating: (87 + 90 + 93) / 3 = 270 / 3 = 90
  // (If 4 quarters were counted with 60, it would be (270 + 60)/4 = 82.5 -> 83)
  assert.equal(subject.finalRating, 90)
  assert.equal(subject.remarks, 'Passed')
  assert.equal(form138Res.body.generalAverage, 90)

  // Core values has 3 rating entries
  assert.equal(form138Res.body.coreValues[0].ratings.length, 3)
})

test('POST /api/grading/form138/:studentId/save saves ratings only for active quarters in 3Q school', async () => {
  const saveRes = await request(`/api/grading/form138/${studentId}/save`, {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({
      schoolYear: '2026-2027',
      grades: [
        {
          subjectId: `sub-${suffix}`,
          q1: 88,
          q2: 91,
          q3: 94,
          q4: 70 // ignored in 3Q mode
        }
      ]
    })
  })
  assert.equal(saveRes.response.status, 200)
  assert.equal(saveRes.body.success, true)

  // Check saved transmuted grades in DB
  const rows = await query(
    'SELECT quarter, transmuted_grade FROM learner_grades WHERE student_id = ? AND school_year = ? ORDER BY quarter ASC',
    [studentId, '2026-2027']
  )
  const q1Row = rows.find(r => r.quarter === 'Q1')
  const q2Row = rows.find(r => r.quarter === 'Q2')
  const q3Row = rows.find(r => r.quarter === 'Q3')
  assert.equal(q1Row.transmuted_grade, 88)
  assert.equal(q2Row.transmuted_grade, 91)
  assert.equal(q3Row.transmuted_grade, 94)
})

test('POST /api/settings/apply-school-year broadcasts school year globally while preserving per-school quarter settings', async () => {
  // 1. Non-superadmin is rejected
  const forbiddenRes = await request('/api/settings/apply-school-year', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({ school_year: '2027-2028' })
  })
  assert.equal(forbiddenRes.response.status, 403)

  // 2. Superadmin applies new academic year to all schools
  const applyRes = await request('/api/settings/apply-school-year', {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({ school_year: '2027-2028' })
  })
  assert.equal(applyRes.response.status, 200)
  assert.equal(applyRes.body.success, true)
  assert.equal(applyRes.body.school_year, '2027-2028')
  assert.ok(applyRes.body.updatedSchoolsCount >= 2)

  // 3. Verify both schools now have the new school year
  const sch3 = await request(`/api/schools/${school3QId}`, { headers: headers(superadminId, 'superadmin') })
  const sch4 = await request(`/api/schools/${school4QId}`, { headers: headers(superadminId, 'superadmin') })

  assert.equal(sch3.body.school_year, '2027-2028')
  assert.equal(sch4.body.school_year, '2027-2028')

  // CRITICAL REQUIREMENT: Quarter counts remain independent and untouched!
  assert.equal(sch3.body.quarter_count, 3, 'Trimester school retains 3 quarters')
  assert.equal(sch4.body.quarter_count, 4, 'Standard school retains 4 quarters')

  // 4. Verify GET /api/settings returns active_school_year
  const settingsRes = await request('/api/settings', { headers: headers(superadminId, 'superadmin') })
  assert.equal(settingsRes.response.status, 200)
  assert.equal(settingsRes.body.school_year, '2027-2028')
  assert.equal(settingsRes.body.active_school_year, '2027-2028')
})

test('POST /api/schools/bulk-school-year updates targeted or all schools preserving quarter configs', async () => {
  // 1. Non-superadmin is rejected
  const forbiddenRes = await request('/api/schools/bulk-school-year', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({ school_year: '2028-2029' })
  })
  assert.equal(forbiddenRes.response.status, 403)

  // 2. Bulk update specific school only
  const targetRes = await request('/api/schools/bulk-school-year', {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      school_year: '2028-2029',
      school_ids: [school3QId]
    })
  })
  assert.equal(targetRes.response.status, 200)
  assert.equal(targetRes.body.success, true)
  assert.equal(targetRes.body.updatedCount, 1)

  const sch3 = await request(`/api/schools/${school3QId}`, { headers: headers(superadminId, 'superadmin') })
  const sch4 = await request(`/api/schools/${school4QId}`, { headers: headers(superadminId, 'superadmin') })

  assert.equal(sch3.body.school_year, '2028-2029')
  assert.equal(sch4.body.school_year, '2027-2028') // Unchanged
  assert.equal(sch3.body.quarter_count, 3)
  assert.equal(sch4.body.quarter_count, 4)
})

test('GET and PUT /api/settings/school-year configures system-wide school year applicable to all schools', async () => {
  // 1. GET /api/settings/school-year returns global school year and schools breakdown
  const getRes = await request('/api/settings/school-year', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(getRes.response.status, 200)
  assert.ok(getRes.body.school_year)
  assert.ok(getRes.body.total_schools >= 2)
  assert.ok(Array.isArray(getRes.body.schools))

  // 2. PUT /api/settings/school-year without superadmin is forbidden
  const forbidden = await request('/api/settings/school-year', {
    method: 'PUT',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({ school_year: '2029-2030' })
  })
  assert.equal(forbidden.response.status, 403)

  // 3. PUT /api/settings/school-year by superadmin updates global school year and applies to all active schools
  const putRes = await request('/api/settings/school-year', {
    method: 'PUT',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({ school_year: '2029-2030', apply_to_all: true })
  })
  assert.equal(putRes.response.status, 200)
  assert.equal(putRes.body.success, true)
  assert.equal(putRes.body.school_year, '2029-2030')
  assert.ok(putRes.body.updatedSchoolsCount >= 2)

  // 4. Verify both 3Q and 4Q schools now have the new school year while quarter_count is untouched
  const sch3 = await request(`/api/schools/${school3QId}`, { headers: headers(superadminId, 'superadmin') })
  const sch4 = await request(`/api/schools/${school4QId}`, { headers: headers(superadminId, 'superadmin') })
  assert.equal(sch3.body.school_year, '2029-2030')
  assert.equal(sch4.body.school_year, '2029-2030')
  assert.equal(sch3.body.quarter_count, 3)
  assert.equal(sch4.body.quarter_count, 4)

  // 5. Verify GET /api/reports/school-years includes the configured 2029-2030 school year
  const reportsRes = await request('/api/reports/school-years', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(reportsRes.response.status, 200)
  assert.ok(reportsRes.body.includes('2029-2030'))
})

test('POST /api/schools automatically inherits the global school year when omitted', async () => {
  const newSchoolRes = await request('/api/schools', {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      name: `Auto SY Campus ${suffix}`,
      school_id: `999-${suffix.slice(0, 4)}`,
      quarter_count: 4
      // school_year omitted
    })
  })
  assert.equal(newSchoolRes.response.status, 200)
  assert.equal(newSchoolRes.body.success, true)
  const createdSchoolId = newSchoolRes.body.id

  const fetched = await request(`/api/schools/${createdSchoolId}`, {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(fetched.response.status, 200)
  // Should inherit the active school year configured above (2029-2030)
  assert.equal(fetched.body.school_year, '2029-2030')

  // Clean up
  await run('DELETE FROM schools WHERE id = ?', [createdSchoolId])
})
