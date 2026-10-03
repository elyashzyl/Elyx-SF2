import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolId = `sum-school-${suffix}`
const adminId = `sum-admin-${suffix}`
const teacherId = `sum-teacher-${suffix}`
const grade = 'Grade 8'
const section = 'Emerald'

const studentMaleId = `sum-stu-m-${suffix}`
const studentFemaleId = `sum-stu-f-${suffix}`

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

  // Set up school with cutoff date 2026-05-01
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, attendance_lock_cutoff) VALUES (?, ?, ?, ?, ?, ?)',
    [schoolId, 'Summaries Test School', `SCH-${suffix.slice(0, 6)}`, 'Baguio City', 'STS', '2026-05-01']
  )

  const passwordHash = await hashPassword('password123')

  // Set up admin
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [adminId, `sumadmin-${suffix}`, passwordHash, 'Sum Admin', 'admin', schoolId]
  )

  // Set up teacher
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id, grade, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherId, `sumteacher-${suffix}`, passwordHash, 'Sum Teacher', 'teacher', schoolId, grade, section]
  )

  // Set up grade level
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [randomUUID(), schoolId, grade, JSON.stringify([section]), 1]
  )

  // Set up students (1 Male, 1 Female)
  await run(
    'INSERT INTO students (id, name, gender, grade, section, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [studentMaleId, 'Bautista, Mark', 'Male', grade, section, schoolId, 'active']
  )
  await run(
    'INSERT INTO students (id, name, gender, grade, section, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [studentFemaleId, 'Santos, Maria', 'Female', grade, section, schoolId, 'active']
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  await run('DELETE FROM attendance_entries WHERE record_id IN (SELECT id FROM attendance_records WHERE school_id = ?)', [schoolId])
  await run('DELETE FROM attendance_corrections WHERE record_id IN (SELECT id FROM attendance_records WHERE school_id = ?)', [schoolId])
  await run('DELETE FROM attendance_records WHERE school_id = ?', [schoolId])
  await run('DELETE FROM students WHERE school_id = ?', [schoolId])
  await run('DELETE FROM grade_levels WHERE school_id = ?', [schoolId])
  await run('DELETE FROM users WHERE school_id = ?', [schoolId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
})

test('multi-dimensional attendance summaries aggregate by date, gender, section, and status', async () => {
  // Create attendance record 1 (Day 1: 2026-06-10 - after cutoff so unlocked)
  const day1Res = await request('/api/attendance', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({
      schoolId,
      date: '2026-06-10',
      grade,
      section,
      adviser: 'Sum Teacher',
      entries: [
        { studentId: studentMaleId, name: 'Bautista, Mark', periods: { am1: 'E', pm1: 'E' }, excused: false, unexcused: false },
        { studentId: studentFemaleId, name: 'Santos, Maria', periods: { am1: 'A', pm1: 'A' }, excused: false, unexcused: false }
      ]
    })
  })
  assert.equal(day1Res.response.status, 200)

  // Create attendance record 2 (Day 2: 2026-06-11)
  const day2Res = await request('/api/attendance', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({
      schoolId,
      date: '2026-06-11',
      grade,
      section,
      adviser: 'Sum Teacher',
      entries: [
        { studentId: studentMaleId, name: 'Bautista, Mark', periods: { am1: 'E', pm1: 'T' }, excused: false, unexcused: false },
        { studentId: studentFemaleId, name: 'Santos, Maria', periods: { am1: 'E', pm1: 'E' }, excused: false, unexcused: false }
      ]
    })
  })
  assert.equal(day2Res.response.status, 200)

  // 1. Fetch full school summaries
  const sumRes = await request(`/api/attendance/summaries?schoolId=${schoolId}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(sumRes.response.status, 200)
  assert.equal(sumRes.body.summary.totalSessions, 2)
  assert.equal(sumRes.body.summary.studentsCount, 2)
  // Male was present twice (1 with tardy); Female was absent once, present once.
  // Total present = 3, total absent = 1. Total entries = 4.
  assert.equal(sumRes.body.summary.present, 3)
  assert.equal(sumRes.body.summary.absent, 1)
  assert.equal(sumRes.body.summary.tardy, 1)

  // Check gender breakdown
  assert.equal(sumRes.body.byGender.male.present, 2)
  assert.equal(sumRes.body.byGender.male.absent, 0)
  assert.equal(sumRes.body.byGender.male.tardy, 1)
  assert.equal(sumRes.body.byGender.female.present, 1)
  assert.equal(sumRes.body.byGender.female.absent, 1)

  // Check section breakdown
  assert.equal(sumRes.body.bySection.length, 1)
  assert.equal(sumRes.body.bySection[0].grade, grade)
  assert.equal(sumRes.body.bySection[0].section, section)
  assert.equal(sumRes.body.bySection[0].sessionsCount, 2)

  // 2. Filter by date range
  const filterRes = await request(`/api/attendance/summaries?schoolId=${schoolId}&startDate=2026-06-11&endDate=2026-06-11`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(filterRes.response.status, 200)
  assert.equal(filterRes.body.summary.totalSessions, 1)
  assert.equal(filterRes.body.summary.present, 2)
  assert.equal(filterRes.body.summary.absent, 0)

  // 3. Filter by gender
  const maleOnlyRes = await request(`/api/attendance/summaries?schoolId=${schoolId}&gender=male`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(maleOnlyRes.response.status, 200)
  assert.equal(maleOnlyRes.body.summary.present, 2)
  assert.equal(maleOnlyRes.body.summary.absent, 0)
})

test('48-hour correction window automatically relocks expired reopened records', async () => {
  const lockedDate = '2026-04-15' // Prior to cutoff 2026-05-01

  // Create record on cutoff date
  const createRes = await request('/api/attendance', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      date: lockedDate,
      grade,
      section,
      adviser: 'Sum Teacher',
      entries: [
        { studentId: studentMaleId, name: 'Bautista, Mark', periods: { am1: 'E', pm1: 'E' }, excused: false, unexcused: false }
      ]
    })
  })
  assert.equal(createRes.response.status, 200)
  const recordId = createRes.body.id

  // Verify record is initially locked by cutoff
  const recCheck1 = await request(`/api/attendance?schoolId=${schoolId}&date=${lockedDate}&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(recCheck1.response.status, 200)
  assert.equal(recCheck1.body.locked, 1)
  assert.equal(recCheck1.body.locked_by, 'system')

  // Reopen the record
  const reopenRes = await request(`/api/attendance/${recordId}/reopen`, {
    method: 'PUT',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({ schoolId, reason: 'Valid admin reopen' })
  })
  assert.equal(reopenRes.response.status, 200)

  // While reopened recently (under 48 hours), mutations are allowed
  const editAllowedRes = await request(`/api/attendance/${recordId}`, {
    method: 'PUT',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      date: lockedDate,
      grade,
      section,
      adviser: 'Sum Teacher',
      correctionReason: 'Immediate post-reopen correction'
    })
  })
  assert.equal(editAllowedRes.response.status, 200)

  // Now simulate expiration: set reopened_at to 50 hours ago (beyond 48 hours)
  const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString()
  await run('UPDATE attendance_records SET reopened_at = ? WHERE id = ?', [fiftyHoursAgo, recordId])

  // Attempting to query or edit the record should trigger auto-relocking with system:window_expired
  const getRelocked = await request(`/api/attendance?schoolId=${schoolId}&date=${lockedDate}&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(getRelocked.response.status, 200)
  assert.equal(getRelocked.body.locked, 1)
  assert.equal(getRelocked.body.locked_by, 'system:window_expired')

  // Mutations should now be blocked with HTTP 423
  const blockedEdit = await request(`/api/attendance/${recordId}`, {
    method: 'PUT',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      date: lockedDate,
      grade,
      section,
      adviser: 'Sum Teacher',
      correctionReason: 'Attempt edit after window expired'
    })
  })
  assert.equal(blockedEdit.response.status, 423)
  assert.ok(blockedEdit.body.error.toLowerCase().includes('attendance record is locked'))
})
