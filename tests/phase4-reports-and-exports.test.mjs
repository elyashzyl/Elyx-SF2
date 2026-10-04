import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolId = `phase4-school-${suffix}`
const adminId = `phase4-admin-${suffix}`
let student1Id
let student2Id
let attRecord1Id
let attRecord2Id
let monthlyRecordId
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
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolId, 'Phase 4 High School', '5001', 'Baguio City', 'P4HS'])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`gl-${schoolId}`, schoolId, 'Grade 8', '["Section Emerald","Section Ruby"]', 1])
  
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminId, adminId, await hashPassword('test-password'), 'Admin Phase4', 'admin', '', '', '', schoolId]
  )

  // Seed two students
  student1Id = `s1-${suffix}`
  student2Id = `s2-${suffix}`
  await run('INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status, lrn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [student1Id, 'Bernardo Carpio', 'Grade 8', 'Section Emerald', 'Male', schoolId, 'active', '123456789012'])
  await run('INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status, lrn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [student2Id, 'Gabriela Silang', 'Grade 8', 'Section Ruby', 'Female', schoolId, 'active', '123456789013'])

  // Seed daily attendance records
  attRecord1Id = `att-1-${suffix}`
  await run(
    `INSERT INTO attendance_records (id, date, grade, section, adviser, created_by, created_by_name, summary_data, school_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [attRecord1Id, '2025-03-03', 'Grade 8', 'Section Emerald', 'Teacher 1', adminId, 'Teacher 1', '{}', schoolId]
  )
  await run(
    `INSERT INTO attendance_entries (record_id, student_id, name, am1, reason, excused, unexcused, nls)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [attRecord1Id, student1Id, 'Bernardo Carpio', 'E', '', 0, 0, 0]
  )

  attRecord2Id = `att-2-${suffix}`
  await run(
    `INSERT INTO attendance_records (id, date, grade, section, adviser, created_by, created_by_name, summary_data, school_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [attRecord2Id, '2025-03-04', 'Grade 8', 'Section Emerald', 'Teacher 1', adminId, 'Teacher 1', '{}', schoolId]
  )
  await run(
    `INSERT INTO attendance_entries (record_id, student_id, name, am1, reason, excused, unexcused, nls)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [attRecord2Id, student1Id, 'Bernardo Carpio', 'A', 'Unexcused', 0, 1, 0]
  )

  // Seed monthly record
  monthlyRecordId = `mon-${suffix}`
  await run(
    `INSERT INTO monthly_records (id, month, year, grade, section, adviser, school_head, created_by, created_by_name, school_id, summary_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [monthlyRecordId, 3, 2025, 'Grade 8', 'Section Emerald', 'Teacher 1', 'Principal', adminId, 'Teacher 1', schoolId, JSON.stringify({ num_school_days: 20 })]
  )
  await run(
    `INSERT INTO monthly_entries (record_id, student_id, student_name, present, absent, tardy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [monthlyRecordId, student1Id, 'Bernardo Carpio', 18, 2, 1]
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (attRecord1Id) {
    await run('DELETE FROM attendance_entries WHERE record_id = ?', [attRecord1Id])
    await run('DELETE FROM attendance_records WHERE id = ?', [attRecord1Id])
  }
  if (attRecord2Id) {
    await run('DELETE FROM attendance_entries WHERE record_id = ?', [attRecord2Id])
    await run('DELETE FROM attendance_records WHERE id = ?', [attRecord2Id])
  }
  if (monthlyRecordId) {
    await run('DELETE FROM monthly_entries WHERE record_id = ?', [monthlyRecordId])
    await run('DELETE FROM monthly_records WHERE id = ?', [monthlyRecordId])
  }
  await run('DELETE FROM students WHERE school_id = ?', [schoolId])
  await run('DELETE FROM saved_report_views WHERE school_id = ?', [schoolId])
  await run('DELETE FROM report_archives WHERE school_id = ?', [schoolId])
  await run('DELETE FROM report_jobs WHERE school_id = ?', [schoolId])
  await run('DELETE FROM audit_logs WHERE actor_id = ?', [adminId])
  await run('DELETE FROM grade_levels WHERE school_id = ?', [schoolId])
  await run('DELETE FROM users WHERE id = ?', [adminId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
  await new Promise(resolve => server.close(resolve))
})

test('dashboard stats supports date-range filtering', async () => {
  // Query with custom date range covering only 2025-03-03 to 2025-03-04
  const res = await request(`/api/dashboard/stats?schoolId=${schoolId}&startDate=2025-03-03&endDate=2025-03-04`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(res.response.status, 200)
  assert.ok(res.body.dateRange)
  assert.equal(res.body.dateRange.isCustom, true)
  assert.equal(res.body.dateRange.startDate, '2025-03-03')
  assert.equal(res.body.dateRange.endDate, '2025-03-04')
  assert.equal(res.body.summary.attendance.present, 1)
  assert.equal(res.body.summary.attendance.absent, 1)
  assert.equal(res.body.summary.attendance.rate, 50.0)
})

test('saved report views CRUD lifecycle', async () => {
  // 1. Create saved view
  const createRes = await request('/api/reports/saved-views', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      name: 'Grade 8 Q1 Watchlist',
      reportType: 'section_comparison',
      filters: { grade: 'Grade 8', quarter: 1 }
    })
  })
  assert.equal(createRes.response.status, 201)
  assert.equal(createRes.body.name, 'Grade 8 Q1 Watchlist')
  const viewId = createRes.body.id

  // 2. Fetch saved views
  const listRes = await request(`/api/reports/saved-views?schoolId=${schoolId}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(listRes.response.status, 200)
  assert.ok(listRes.body.some(v => v.id === viewId))

  // 3. Delete saved view
  const delRes = await request(`/api/reports/saved-views/${viewId}`, {
    method: 'DELETE',
    headers: headers(adminId, 'admin')
  })
  assert.equal(delRes.response.status, 200)
  assert.equal(delRes.body.success, true)
})

test('section comparison report calculates ranks and rates', async () => {
  const res = await request(`/api/reports/section-comparison?schoolId=${schoolId}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(res.response.status, 200)
  assert.ok(Array.isArray(res.body.sections))
  assert.ok(res.body.summary.totalSections >= 1)
  const emerald = res.body.sections.find(s => s.section === 'Section Emerald')
  assert.ok(emerald)
  assert.equal(emerald.grade, 'Grade 8')
  assert.ok(emerald.rank >= 1)
})

test('quarterly summary report aggregates DepEd Form 2 metrics', async () => {
  // Query Q3 (Feb-March) which covers month 3 (March)
  const res = await request(`/api/reports/quarterly-summary?schoolId=${schoolId}&quarter=3&schoolYear=2026-2027`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(res.response.status, 200)
  assert.equal(res.body.quarter, 3)
  assert.ok(Array.isArray(res.body.sections))
  assert.ok(res.body.grandTotal.totalEnrolled >= 1)
  const sec = res.body.sections.find(s => s.section === 'Section Emerald')
  assert.ok(sec)
  assert.ok(sec.ada.total > 0)
})

test('CSV export returns proper attachment headers and formatted content', async () => {
  const res = await request(`/api/reports/export/csv?schoolId=${schoolId}&type=section_comparison`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(res.response.status, 200)
  assert.match(res.response.headers.get('content-type'), /text\/csv/i)
  assert.match(res.response.headers.get('content-disposition'), /attachment; filename=/i)
  assert.ok(res.text.includes('Section Emerald'))
  assert.ok(res.text.includes('DepEd'))
})

test('report archive storage and retrieval', async () => {
  // Archive a report
  const archiveRes = await request('/api/reports/archive', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      reportType: 'section_comparison',
      title: 'Official March Section Comparison',
      contentData: 'Rank,Grade,Section\n1,Grade 8,Section Emerald'
    })
  })
  assert.equal(archiveRes.response.status, 201)
  const reportId = archiveRes.body.id

  // List archives
  const listRes = await request(`/api/reports/archive?schoolId=${schoolId}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(listRes.response.status, 200)
  assert.ok(listRes.body.some(r => r.id === reportId))

  // Download archive
  const downloadRes = await request(`/api/reports/archive/${reportId}/download?schoolId=${schoolId}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(downloadRes.response.status, 200)
  assert.ok(downloadRes.text.includes('Section Emerald'))
})

test('report jobs endpoint tracks export generation status', async () => {
  const jobRes = await request('/api/reports/jobs', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      reportType: 'sf2_monthly',
      parameters: { month: 3, year: 2025 }
    })
  })
  assert.equal(jobRes.response.status, 202)
  const jobId = jobRes.body.jobId
  assert.ok(jobId)

  const statusRes = await request(`/api/reports/jobs/${jobId}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(statusRes.response.status, 200)
  assert.equal(statusRes.body.id, jobId)
  assert.ok(['pending', 'completed'].includes(statusRes.body.status))
})

test('template version tracking endpoint inspects active SF2 template', async () => {
  const res = await request('/api/export/template/version', {
    headers: headers(adminId, 'admin')
  })
  assert.equal(res.response.status, 200)
  assert.ok(res.body.version)
  assert.ok(res.body.hash)
  assert.ok(res.body.fileSize > 0)
  assert.ok(Array.isArray(res.body.sheets))
  assert.match(res.body.complianceStandard, /DepEd Order No\. 8/i)
})

test('export validation endpoint detects invalid codes, missing names, and formatting issues', async () => {
  // Test valid payload
  const validRes = await request('/api/export/validate', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      grade: 'Grade 8',
      section: 'Section Emerald',
      month: 3,
      year: 2025,
      entries: [
        { name: 'Maria Santos', gender: 'Female', lrn: '123456789012', days: { '1': 'E', '2': 'A', '3': 'T' } },
        { name: 'Juan Dela Cruz', gender: 'Male', lrn: '123456789013', days: { '1': 'E', '2': 'x' } }
      ]
    })
  })
  assert.equal(validRes.response.status, 200)
  assert.equal(validRes.body.valid, true)
  assert.equal(validRes.body.errors.length, 0)
  assert.equal(validRes.body.summary.totalLearners, 2)
  assert.equal(validRes.body.summary.maleCount, 1)
  assert.equal(validRes.body.summary.femaleCount, 1)

  // Test invalid payload with missing name, invalid LRN, and unknown mark
  const invalidRes = await request('/api/export/validate', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      grade: 'Grade 8',
      section: 'Section Emerald',
      month: 3,
      year: 2025,
      entries: [
        { name: '', gender: 'Male', lrn: '12345', days: { '1': 'INVALID_MARK_999' } }
      ]
    })
  })
  assert.equal(invalidRes.response.status, 200)
  assert.equal(invalidRes.body.valid, false)
  assert.ok(invalidRes.body.errors.length >= 1, 'Missing name must produce error')
  assert.ok(invalidRes.body.warnings.length >= 2, 'Invalid LRN and unrecognized mark must produce warnings')
})
