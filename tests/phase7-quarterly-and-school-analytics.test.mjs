import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const school1Id = `p7-sch1-${suffix}`
const school2Id = `p7-sch2-${suffix}`
const superadminId = `p7-super-${suffix}`
const admin1Id = `p7-admin1-${suffix}`
const admin2Id = `p7-admin2-${suffix}`
const teacher1Id = `p7-teach1-${suffix}`

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

  // Seed two distinct campuses
  await run(
    'INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [school1Id, 'Phase 7 North High School', '7001', 'Baguio City, Benguet', 'P7-North']
  )
  await run(
    'INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [school2Id, 'Phase 7 South Academy', '7002', 'La Trinidad, Benguet', 'P7-South']
  )

  const pw = await hashPassword('password123')

  // Seed users: superadmin, campus admins, and teacher
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `super-${suffix}`, pw, 'Super Admin Seven', 'superadmin', '', '', '', '', 'super@phase7.edu']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin1Id, `admin1-${suffix}`, pw, 'Admin North', 'admin', '', '', '', school1Id, 'admin1@north.edu']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin2Id, `admin2-${suffix}`, pw, 'Admin South', 'admin', '', '', '', school2Id, 'admin2@south.edu']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacher1Id, `teacher1-${suffix}`, pw, 'Teacher North', 'teacher', 'Grade 7', 'Section Diamond', '', school1Id, 'teacher1@north.edu']
  )

  // Seed grade levels
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [`gl1-${suffix}`, school1Id, 'Grade 7', '["Section Diamond"]', 1]
  )
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [`gl2-${suffix}`, school2Id, 'Grade 7', '["Section Pearl"]', 1]
  )

  // Seed learners
  const st1Id = `st1-${suffix}`
  const st2Id = `st2-${suffix}`
  const st3Id = `st3-${suffix}`
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status, lrn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [st1Id, 'Learner Alpha', 'Grade 7', 'Section Diamond', 'Male', school1Id, 'active', '700100000001']
  )
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status, lrn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [st2Id, 'Learner Beta', 'Grade 7', 'Section Diamond', 'Female', school1Id, 'active', '700100000002']
  )
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status, lrn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [st3Id, 'Learner Gamma', 'Grade 7', 'Section Pearl', 'Female', school2Id, 'active', '700200000001']
  )

  // Seed monthly SF2 attendance records for school 1 (months 9 & 10)
  const mr1Id = `mr1-${suffix}`
  await run(
    `INSERT INTO monthly_records (id, school_id, grade, section, month, year, adviser, summary_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [mr1Id, school1Id, 'Grade 7', 'Section Diamond', 9, 2025, 'Teacher North', JSON.stringify({ num_school_days: 20 })]
  )
  await run(
    `INSERT INTO monthly_entries (record_id, student_id, student_name, present, absent, tardy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [mr1Id, st1Id, 'Learner Alpha', 19, 1, 0]
  )
  await run(
    `INSERT INTO monthly_entries (record_id, student_id, student_name, present, absent, tardy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [mr1Id, st2Id, 'Learner Beta', 20, 0, 0]
  )

  const mr2Id = `mr2-${suffix}`
  await run(
    `INSERT INTO monthly_records (id, school_id, grade, section, month, year, adviser, summary_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [mr2Id, school1Id, 'Grade 7', 'Section Diamond', 10, 2025, 'Teacher North', JSON.stringify({ num_school_days: 22 })]
  )
  await run(
    `INSERT INTO monthly_entries (record_id, student_id, student_name, present, absent, tardy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [mr2Id, st1Id, 'Learner Alpha', 21, 1, 0]
  )
  await run(
    `INSERT INTO monthly_entries (record_id, student_id, student_name, present, absent, tardy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [mr2Id, st2Id, 'Learner Beta', 22, 0, 0]
  )

  // Seed monthly SF2 attendance records for school 2 (month 9)
  const mr3Id = `mr3-${suffix}`
  await run(
    `INSERT INTO monthly_records (id, school_id, grade, section, month, year, adviser, summary_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [mr3Id, school2Id, 'Grade 7', 'Section Pearl', 9, 2025, 'Admin South', JSON.stringify({ num_school_days: 20 })]
  )
  await run(
    `INSERT INTO monthly_entries (record_id, student_id, student_name, present, absent, tardy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [mr3Id, st3Id, 'Learner Gamma', 18, 2, 0]
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [superadminId, admin1Id, admin2Id, teacher1Id])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [school1Id, school2Id])
  await run('DELETE FROM students WHERE school_id IN (?, ?)', [school1Id, school2Id])
  await run('DELETE FROM grade_levels WHERE school_id IN (?, ?)', [school1Id, school2Id])
  await run('DELETE FROM monthly_records WHERE school_id IN (?, ?)', [school1Id, school2Id])
  await run('DELETE FROM quarterly_terms WHERE school_id IN (?, ?, "")', [school1Id, school2Id])
  await run('DELETE FROM quarterly_events WHERE school_id IN (?, ?)', [school1Id, school2Id])
})

test('GET /api/quarterly/terms returns DepEd standard defaults when unconfigured', async () => {
  const { response, body } = await request(`/api/quarterly/terms?schoolId=${school1Id}`, {
    headers: headers(admin1Id, 'admin')
  })

  assert.equal(response.status, 200)
  assert.equal(body.is_custom, false)
  assert.ok(Array.isArray(body.quarters))
  assert.equal(body.quarters.length, 4)

  const q1 = body.quarters.find(q => q.quarter_number === 1)
  assert.ok(q1)
  assert.deepEqual(q1.months, [8, 9, 10])
  assert.equal(q1.target_days, 50)
})

test('PUT /api/quarterly/terms saves custom quarter months and target days', async () => {
  const payload = {
    schoolYear: '2025-2026',
    quarters: [
      {
        quarter_number: 1,
        quarter_name: 'Q1 Customized Grading Period',
        months: [9, 10], // Custom months
        target_days: 42,
        start_date: '2025-09-01',
        end_date: '2025-10-31',
        is_active: 1
      },
      {
        quarter_number: 2,
        quarter_name: 'Q2 Grading Period',
        months: [11, 12, 1],
        target_days: 48,
        start_date: '2025-11-03',
        end_date: '2026-01-30',
        is_active: 1
      },
      {
        quarter_number: 3,
        quarter_name: 'Q3 Grading Period',
        months: [2, 3],
        target_days: 40,
        start_date: '2026-02-02',
        end_date: '2026-03-27',
        is_active: 1
      },
      {
        quarter_number: 4,
        quarter_name: 'Q4 Grading Period',
        months: [4, 5],
        target_days: 40,
        start_date: '2026-04-06',
        end_date: '2026-05-29',
        is_active: 1
      }
    ]
  }

  const { response, body } = await request('/api/quarterly/terms', {
    method: 'PUT',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify(payload)
  })

  assert.equal(response.status, 200)
  assert.equal(body.success, true)

  // Verify terms now return as custom
  const getRes = await request(`/api/quarterly/terms?schoolId=${school1Id}&schoolYear=2025-2026`, {
    headers: headers(admin1Id, 'admin')
  })

  assert.equal(getRes.response.status, 200)
  assert.equal(getRes.body.is_custom, true)
  const updatedQ1 = getRes.body.quarters.find(q => q.quarter_number === 1)
  assert.ok(updatedQ1)
  assert.equal(updatedQ1.quarter_name, 'Q1 Customized Grading Period')
  assert.deepEqual(updatedQ1.months, [9, 10])
  assert.equal(updatedQ1.target_days, 42)
})

test('GET /api/reports/quarterly-summary dynamically respects custom quarters and returns school summaries', async () => {
  const { response, body } = await request(
    `/api/reports/quarterly-summary?quarter=1&schoolYear=2025-2026&schoolId=${school1Id}`,
    { headers: headers(admin1Id, 'admin') }
  )

  assert.equal(response.status, 200)
  assert.equal(body.quarter, 1)
  assert.equal(body.configuredQuarterName, 'Q1 Customized Grading Period')
  assert.ok(Array.isArray(body.monthsIncluded))
  assert.deepEqual(body.monthsIncluded, ['September', 'October'])

  // Check section details contain campus metadata
  assert.ok(Array.isArray(body.sections))
  assert.ok(body.sections.length > 0)
  const sec = body.sections[0]
  assert.equal(sec.schoolName, 'Phase 7 North High School')
  assert.equal(sec.schoolShort, 'P7-North')
  assert.equal(sec.depedId, '7001')

  // Check schoolSummaries is present
  assert.ok(Array.isArray(body.schoolSummaries))
  assert.equal(body.schoolSummaries.length, 1)
  assert.equal(body.schoolSummaries[0].schoolId, school1Id)
  assert.equal(body.schoolSummaries[0].schoolShort, 'P7-North')
})

test('Multi-campus quarterly report returns all campus summaries when viewing all schools', async () => {
  const { response, body } = await request(
    '/api/reports/quarterly-summary?quarter=1&schoolYear=2025-2026',
    { headers: headers(superadminId, 'superadmin') }
  )

  assert.equal(response.status, 200)
  assert.ok(Array.isArray(body.schoolSummaries))
  assert.ok(body.schoolSummaries.some(s => s.schoolId === school1Id))
  assert.ok(body.schoolSummaries.some(s => s.schoolId === school2Id))
})

test('GET /api/reports/section-comparison includes schoolSummaries and campus metadata', async () => {
  const { response, body } = await request(
    '/api/reports/section-comparison',
    { headers: headers(superadminId, 'superadmin') }
  )

  assert.equal(response.status, 200)
  assert.ok(Array.isArray(body.schoolSummaries))
  assert.ok(body.schoolSummaries.length >= 2)

  const s1 = body.schoolSummaries.find(s => s.schoolId === school1Id)
  assert.ok(s1)
  assert.equal(s1.schoolName, 'Phase 7 North High School')
  assert.equal(s1.schoolShort, 'P7-North')
  assert.equal(s1.enrolled.total, 2)
  assert.ok(s1.attendanceRate > 0)

  // Enriched sections
  assert.ok(Array.isArray(body.sections))
  const secNorth = body.sections.find(s => s.schoolId === school1Id)
  assert.ok(secNorth)
  assert.equal(secNorth.schoolShort, 'P7-North')
  assert.equal(secNorth.depedId, '7001')
})

test('GET /api/reports/export/csv includes Campus column for both comparison and quarterly reports', async () => {
  // Section comparison CSV
  const rep1 = await request('/api/reports/export/csv?reportType=section_comparison', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(rep1.response.status, 200)
  assert.ok(rep1.text.includes('Campus'))
  assert.ok(rep1.text.includes('"P7-North"'))

  // Quarterly summary CSV
  const rep2 = await request('/api/reports/export/csv?reportType=quarterly_summary&quarter=1&schoolYear=2025-2026', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(rep2.response.status, 200)
  assert.ok(rep2.text.includes('Campus'))
  assert.ok(rep2.text.includes('"P7-North"'))
})

test('GET /api/dashboard/stats returns schools breakdown array for superadmin scope', async () => {
  const { response, body } = await request('/api/dashboard/stats', {
    headers: headers(superadminId, 'superadmin')
  })

  assert.equal(response.status, 200)
  assert.ok(Array.isArray(body.schools))
  assert.ok(body.schools.length >= 2)

  const north = body.schools.find(s => s.id === school1Id)
  assert.ok(north)
  assert.equal(north.name, 'Phase 7 North High School')
  assert.equal(north.short, 'P7-North')
  assert.equal(north.depedId, '7001')
  assert.equal(north.students, 2)
  assert.equal(north.teachers, 1)
  assert.ok(north.attendanceRate > 0)
})

test('POST /api/quarterly/terms/reset resets custom terms back to DepEd defaults', async () => {
  const resetRes = await request('/api/quarterly/terms/reset', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({ schoolYear: '2025-2026' })
  })

  assert.equal(resetRes.response.status, 200)
  assert.equal(resetRes.body.success, true)

  const verifyRes = await request(`/api/quarterly/terms?schoolId=${school1Id}&schoolYear=2025-2026`, {
    headers: headers(admin1Id, 'admin')
  })

  assert.equal(verifyRes.response.status, 200)
  assert.equal(verifyRes.body.is_custom, false)
})

test('Milestone events CRUD (/api/quarterly/events)', async () => {
  // Create event
  const createRes = await request('/api/quarterly/events', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      event_name: 'Mid-Quarter Examination',
      first_grading: '2025-09-25',
      second_grading: '2025-11-20',
      third_grading: '',
      fourth_grading: ''
    })
  })
  assert.equal(createRes.response.status, 200)

  // Read events
  const getRes = await request('/api/quarterly/events', {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(getRes.response.status, 200)
  assert.ok(Array.isArray(getRes.body))
  const created = getRes.body.find(e => e.event_name === 'Mid-Quarter Examination')
  assert.ok(created)
  assert.equal(created.first_grading, '2025-09-25')

  // Update event
  const updateRes = await request(`/api/quarterly/events/${created.id}`, {
    method: 'PUT',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      event_name: 'Mid-Quarter Examination (Updated)',
      first_grading: '2025-09-26',
      second_grading: '2025-11-20'
    })
  })
  assert.equal(updateRes.response.status, 200)

  // Delete event
  const delRes = await request(`/api/quarterly/events/${created.id}`, {
    method: 'DELETE',
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(delRes.response.status, 200)
})
