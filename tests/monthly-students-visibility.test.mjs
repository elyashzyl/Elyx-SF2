import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolId = `month-vis-school-${suffix}`
const adminId = `month-vis-admin-${suffix}`
const teacherId = `month-vis-teacher-${suffix}`
const grade = 'Grade 7'
const section = 'Section Emerald'

let midMonthStudentId
let withdrawnStudentId
let regularStudentId
let month8RecordId
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
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [schoolId, 'Monthly Visibility School', 'MVS-01', 'Baguio City', 'MVS'])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [`grade-${schoolId}`, schoolId, grade, JSON.stringify([section, 'Section Diamond']), 1])

  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminId, adminId, await hashPassword('password123'), 'Visibility Admin', 'admin', '', '', '', schoolId]
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherId, teacherId, await hashPassword('password123'), 'Visibility Teacher', 'teacher', grade, section, '', schoolId]
  )

  // 1. Regular student enrolled at start of school year (2026-08-01)
  regularStudentId = `student-regular-${suffix}`
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [regularStudentId, 'Alpha, Regular Learner', grade, section, 'Male', schoolId, 'active']
  )
  await run(`INSERT INTO student_enrollment_events
    (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role, event_sequence)
    VALUES (?, ?, ?, 'enroll', 'active', '2026-08-01', ?, ?, 'Beginning of year', ?, 'Admin', 'admin', 1)`,
    [`evt-1-${suffix}`, regularStudentId, schoolId, grade, section, adminId]
  )

  // 2. Mid-month late enrollee (enrolled on 2026-10-15)
  midMonthStudentId = `student-mid-${suffix}`
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [midMonthStudentId, 'Bravo, Mid-Month Learner', grade, section, 'Female', schoolId, 'active']
  )
  await run(`INSERT INTO student_enrollment_events
    (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role, event_sequence)
    VALUES (?, ?, ?, 'enroll', 'active', '2026-10-15', ?, ?, 'Late enrollee', ?, 'Admin', 'admin', 1)`,
    [`evt-2-${suffix}`, midMonthStudentId, schoolId, grade, section, adminId]
  )

  // 3. Student enrolled in August but withdrawn on 2026-10-20
  withdrawnStudentId = `student-withdrawn-${suffix}`
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [withdrawnStudentId, 'Charlie, Withdrawn Learner', grade, section, 'Male', schoolId, 'withdrawn']
  )
  await run(`INSERT INTO student_enrollment_events
    (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role, event_sequence)
    VALUES (?, ?, ?, 'enroll', 'active', '2026-08-01', ?, ?, 'Beginning of year', ?, 'Admin', 'admin', 1)`,
    [`evt-3a-${suffix}`, withdrawnStudentId, schoolId, grade, section, adminId]
  )
  await run(`INSERT INTO student_enrollment_events
    (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role, event_sequence)
    VALUES (?, ?, ?, 'withdraw', 'withdrawn', '2026-10-20', ?, ?, 'Transferred residence', ?, 'Admin', 'admin', 2)`,
    [`evt-3b-${suffix}`, withdrawnStudentId, schoolId, grade, section, adminId]
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  await run('DELETE FROM monthly_entries WHERE record_id IN (SELECT id FROM monthly_records WHERE school_id = ?)', [schoolId])
  await run('DELETE FROM monthly_records WHERE school_id = ?', [schoolId])
  await run('DELETE FROM student_enrollment_events WHERE school_id = ?', [schoolId])
  await run('DELETE FROM students WHERE school_id = ?', [schoolId])
  await run('DELETE FROM grade_levels WHERE school_id = ?', [schoolId])
  await run('DELETE FROM users WHERE school_id = ?', [schoolId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
})

test('historical roster as of month end includes mid-month enrollees for that month', async () => {
  // Query October 2026 with month-end asOf (2026-10-31)
  const res = await request(`/api/students?schoolId=${schoolId}&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}&asOf=2026-10-31&includeWithdrawn=true`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(res.response.status, 200)
  assert.ok(Array.isArray(res.body))

  const ids = res.body.map(s => s.id)
  assert.ok(ids.includes(regularStudentId), 'Regular student must be present in October')
  assert.ok(ids.includes(midMonthStudentId), 'Mid-month student (enrolled Oct 15) must be present in October with month-end asOf')
  assert.ok(ids.includes(withdrawnStudentId), 'Withdrawn student must be present when includeWithdrawn=true')
})

test('POST /api/monthly accepts mid-month enrollees and withdrawn students for that month', async () => {
  const saveRes = await request('/api/monthly', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({
      schoolId,
      month: 10,
      year: 2026,
      grade,
      section,
      entries: [
        {
          studentId: regularStudentId,
          name: 'Alpha, Regular Learner',
          days: { '1': 'P', '2': 'P' },
          present: 2,
          absent: 0,
          late_enrollee: false
        },
        {
          studentId: midMonthStudentId,
          name: 'Bravo, Mid-Month Learner',
          days: { '15': 'E', '16': 'P' },
          present: 1,
          absent: 0,
          late_enrollee: true
        },
        {
          studentId: withdrawnStudentId,
          name: 'Charlie, Withdrawn Learner',
          days: { '1': 'P', '20': 'T/O' },
          present: 1,
          absent: 0,
          remarks: 'T/O 10/20'
        }
      ]
    })
  })

  assert.equal(saveRes.response.status, 200)
  assert.ok(saveRes.body.record?.id)
  const recordId = saveRes.body.record.id

  // Verify fetch returns all 3 students with accurate genders from LEFT JOIN students
  const getRes = await request(`/api/monthly?schoolId=${schoolId}&month=10&year=2026&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(teacherId, 'teacher')
  })
  assert.equal(getRes.response.status, 200)
  assert.equal(getRes.body.id, recordId)
  assert.equal(getRes.body.entries.length, 3)

  const femaleEntry = getRes.body.entries.find(e => e.studentId === midMonthStudentId)
  assert.ok(femaleEntry)
  assert.equal(femaleEntry.gender, 'Female')
  assert.equal(femaleEntry.late_enrollee, true)

  const withdrawnEntry = getRes.body.entries.find(e => e.studentId === withdrawnStudentId)
  assert.ok(withdrawnEntry)
  assert.equal(withdrawnEntry.remarks, 'T/O 10/20')
})

test('POST /api/monthly preserves existing entries on subsequent saves and rejects alien class students', async () => {
  // Alien student from Section Diamond
  const alienId = `student-alien-${suffix}`
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [alienId, 'Alien Learner', grade, 'Section Diamond', 'Male', schoolId, 'active']
  )
  await run(`INSERT INTO student_enrollment_events
    (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role, event_sequence)
    VALUES (?, ?, ?, 'enroll', 'active', '2026-08-01', ?, 'Section Diamond', 'Diamond enrollment', ?, 'Admin', 'admin', 1)`,
    [`evt-alien-${suffix}`, alienId, schoolId, grade, adminId]
  )

  const rejectRes = await request('/api/monthly', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      schoolId,
      month: 10,
      year: 2026,
      grade,
      section,
      entries: [
        {
          studentId: alienId,
          name: 'Alien Learner',
          days: {},
          present: 0,
          absent: 0
        }
      ]
    })
  })

  assert.equal(rejectRes.response.status, 400)
  assert.match(rejectRes.body.error, /was not enrolled/)
})

test('GET /api/monthly/roster returns unified class roster across all enrollment events and records', async () => {
  const rosterRes = await request(`/api/monthly/roster?schoolId=${schoolId}&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(teacherId, 'teacher')
  })
  assert.equal(rosterRes.response.status, 200)
  assert.ok(Array.isArray(rosterRes.body))
  const ids = rosterRes.body.map(s => s.id)
  assert.ok(ids.includes(regularStudentId))
  assert.ok(ids.includes(midMonthStudentId))
  assert.ok(ids.includes(withdrawnStudentId))
})

test('previous month automatically reconciles to include students visible in other/later months', async () => {
  // 1. Create a Month 8 record with only 1 student initially
  month8RecordId = `m8-rec-${suffix}`
  await run(`
    INSERT INTO monthly_records (id, month, year, grade, section, adviser, school_head, created_by, created_by_name, school_id, include_saturdays, excluded_dates)
    VALUES (?, 8, 2026, ?, ?, 'Visibility Teacher', '', ?, 'Teacher', ?, 0, '[]')
  `, [month8RecordId, grade, section, teacherId, schoolId])
  await run(`
    INSERT INTO monthly_entries (record_id, student_id, student_name, days, present, absent, remarks, late_enrollee)
    VALUES (?, ?, 'Alpha, Regular Learner', '{"1":"P"}', 1, 0, '', 0)
  `, [month8RecordId, regularStudentId])

  // 2. Before reconcile, Month 8 only has 1 entry in the database
  const entriesBefore = await query('SELECT student_id FROM monthly_entries WHERE record_id = ?', [month8RecordId])
  assert.equal(entriesBefore.length, 1)

  // 3. Query Month 8 via GET /api/monthly (which triggers auto-reconciliation with other months like Month 10)
  const getRes = await request(`/api/monthly?schoolId=${schoolId}&month=8&year=2026&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(teacherId, 'teacher')
  })

  assert.equal(getRes.response.status, 200)
  assert.equal(getRes.body.id, month8RecordId)
  assert.equal(getRes.body.entries.length, 3, 'Month 8 must reconcile and include all 3 students from the unified roster/Month 10')

  const ids = getRes.body.entries.map(e => e.studentId)
  assert.ok(ids.includes(regularStudentId))
  assert.ok(ids.includes(midMonthStudentId), 'Mid-month student visible in Month 10 must be reconciled and visible in previous month (Month 8)')
  assert.ok(ids.includes(withdrawnStudentId), 'Withdrawn student must be reconciled and visible in previous month (Month 8)')

  // 4. Verify original attendance on the pre-existing student was preserved intact
  const originalStudent = getRes.body.entries.find(e => e.studentId === regularStudentId)
  assert.equal(originalStudent.present, 1)
  assert.deepEqual(originalStudent.days, { '1': 'P' })
})

test('advisory teachers and school admins can delete/reset a monthly SF2 report', async () => {
  // Test deletion of month8RecordId by advisory teacher
  const deleteRes = await request(`/api/monthly/${month8RecordId}?schoolId=${schoolId}`, {
    method: 'DELETE',
    headers: headers(teacherId, 'teacher')
  })
  assert.equal(deleteRes.response.status, 200)

  // Verify record and entries are completely removed
  const rec = await query('SELECT * FROM monthly_records WHERE id = ?', [month8RecordId])
  assert.equal(rec.length, 0)
  const entries = await query('SELECT * FROM monthly_entries WHERE record_id = ?', [month8RecordId])
  assert.equal(entries.length, 0)

  // Querying month 8 now returns null, allowing a fresh report to be generated
  const getNullRes = await request(`/api/monthly?schoolId=${schoolId}&month=8&year=2026&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(teacherId, 'teacher')
  })
  assert.equal(getNullRes.response.status, 200)
  assert.equal(getNullRes.body, null)
})

test('monthly SF2 entries are strictly arranged alphabetically by learner name within gender', async () => {
  const abadId = `student-abad-${suffix}`
  const zunigaId = `student-zuniga-${suffix}`

  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [abadId, 'Abad, Aaron', grade, section, 'Male', schoolId, 'active']
  )
  await run(
    'INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [zunigaId, 'Zuniga, Zoe', grade, section, 'Male', schoolId, 'active']
  )

  // Create monthly record with arbitrary unsorted order: Zuniga, Regular, Abad
  const saveRes = await request('/api/monthly', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({
      schoolId,
      month: 9,
      year: 2026,
      grade,
      section,
      entries: [
        { studentId: zunigaId, name: 'Zuniga, Zoe', gender: 'Male', days: {}, present: 0, absent: 0 },
        { studentId: regularStudentId, name: 'Regular, Ryan', gender: 'Male', days: {}, present: 0, absent: 0 },
        { studentId: abadId, name: 'Abad, Aaron', gender: 'Male', days: {}, present: 0, absent: 0 }
      ]
    })
  })
  assert.equal(saveRes.response.status, 200)

  // Fetch record via GET /api/monthly
  const getRes = await request(`/api/monthly?schoolId=${schoolId}&month=9&year=2026&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`, {
    headers: headers(teacherId, 'teacher')
  })
  assert.equal(getRes.response.status, 200)
  const maleNames = getRes.body.entries.filter(e => e.gender.toLowerCase() === 'male').map(e => e.name)

  // Verify Abad is first, then Regular, then Zuniga
  assert.equal(maleNames[0], 'Abad, Aaron', 'Abad must be arranged at the top alphabetically')
  assert.equal(maleNames[maleNames.length - 1], 'Zuniga, Zoe', 'Zuniga must be arranged at the bottom alphabetically')

  // Clean up added test students
  await run('DELETE FROM students WHERE id IN (?, ?)', [abadId, zunigaId])
  if (saveRes.body.id) {
    await run('DELETE FROM monthly_entries WHERE record_id = ?', [saveRes.body.id])
    await run('DELETE FROM monthly_records WHERE id = ?', [saveRes.body.id])
  }
})
