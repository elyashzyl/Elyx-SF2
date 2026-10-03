import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolAId = `p3-schoolA-${suffix}`
const schoolBId = `p3-schoolB-${suffix}`
const adminAId = `p3-adminA-${suffix}`
const adminBId = `p3-adminB-${suffix}`
const teacherAId = `p3-teacherA-${suffix}`
const grade = 'Grade 11'
const section = 'Newton'

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

  // Set up schools
  await run(
    'INSERT INTO schools (id, name, school_id, address, short, sardo_consecutive_absences, sardo_cumulative_absences) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [schoolAId, 'Phase 3 School A', `SCH-A-${suffix.slice(0, 6)}`, 'Baguio City', 'P3A', 2, 4]
  )
  await run(
    'INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [schoolBId, 'Phase 3 School B', `SCH-B-${suffix.slice(0, 6)}`, 'Baguio City', 'P3B']
  )

  const passwordHash = await hashPassword('password123')

  // Set up users
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [adminAId, `p3adminA-${suffix}`, passwordHash, 'Admin A', 'admin', schoolAId]
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [adminBId, `p3adminB-${suffix}`, passwordHash, 'Admin B', 'admin', schoolBId]
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, school_id, grade, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherAId, `p3teacherA-${suffix}`, passwordHash, 'Teacher A', 'teacher', schoolAId, grade, section]
  )

  // Set up grade level
  await run(
    'INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
    [randomUUID(), schoolAId, grade, JSON.stringify([section]), 1]
  )

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  await run('DELETE FROM student_guardian_contacts WHERE school_id IN (?, ?)', [schoolAId, schoolBId])
  await run('DELETE FROM student_interventions WHERE school_id IN (?, ?)', [schoolAId, schoolBId])
  await run('DELETE FROM student_enrollment_events WHERE school_id IN (?, ?)', [schoolAId, schoolBId])
  await run('DELETE FROM students WHERE school_id IN (?, ?)', [schoolAId, schoolBId])
  await run('DELETE FROM grade_levels WHERE school_id IN (?, ?)', [schoolAId, schoolBId])
  await run('DELETE FROM users WHERE school_id IN (?, ?)', [schoolAId, schoolBId])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolAId, schoolBId])
})

test('student profile expansion: create, inspect, update, and LRN duplicate enforcement', async () => {
  const lrn1 = `101010${Math.floor(100000 + Math.random() * 900000)}`
  
  // 1. Create student with full profile fields
  const createRes = await request('/api/students', {
    method: 'POST',
    headers: headers(adminAId, 'admin'),
    body: JSON.stringify({
      schoolId: schoolAId,
      name: 'Cruz, Juanito',
      grade,
      section,
      gender: 'Male',
      lrn: lrn1,
      birth_date: '2008-05-12',
      address: '123 Session Road, Baguio City',
      guardian_name: 'Cruz, Maria',
      guardian_relationship: 'Mother',
      guardian_contact: '09171234567',
      emergency_contact_name: 'Cruz, Pedro',
      emergency_contact_number: '09187654321',
      consent_data_sharing: true,
      consent_medical_emergency: true
    })
  })

  assert.equal(createRes.response.status, 200)
  assert.equal(createRes.body.lrn, lrn1)
  assert.equal(createRes.body.guardian_name, 'Cruz, Maria')
  assert.equal(createRes.body.guardian_contact, '09171234567')
  const studentId = createRes.body.id

  // 2. Fetch full student profile via GET /api/students/:id
  const getRes = await request(`/api/students/${studentId}`, {
    headers: headers(adminAId, 'admin')
  })
  assert.equal(getRes.response.status, 200)
  assert.equal(getRes.body.lrn, lrn1)
  assert.equal(getRes.body.guardian_relationship, 'Mother')
  assert.ok(Array.isArray(getRes.body.interventions))
  assert.ok(Array.isArray(getRes.body.contactHistory))
  assert.ok(Array.isArray(getRes.body.enrollmentHistory))

  // 3. Update student profile
  const updateRes = await request(`/api/students/${studentId}`, {
    method: 'PUT',
    headers: headers(adminAId, 'admin'),
    body: JSON.stringify({
      guardian_contact: '09179998888',
      address: '456 Harrison Road, Baguio City'
    })
  })
  assert.equal(updateRes.response.status, 200)
  assert.equal(updateRes.body.student.guardian_contact, '09179998888')

  // 4. Duplicate LRN enforcement
  const dupLrnRes = await request('/api/students', {
    method: 'POST',
    headers: headers(adminAId, 'admin'),
    body: JSON.stringify({
      schoolId: schoolAId,
      name: 'Another Student',
      grade,
      section,
      gender: 'Female',
      lrn: lrn1
    })
  })
  assert.equal(dupLrnRes.response.status, 409)
  assert.ok(dupLrnRes.body.error.includes(lrn1))

  // 5. Duplicate student check endpoint
  const checkRes = await request('/api/students/check-duplicates', {
    method: 'POST',
    headers: headers(adminAId, 'admin'),
    body: JSON.stringify({
      schoolId: schoolAId,
      lrn: lrn1
    })
  })
  assert.equal(checkRes.response.status, 200)
  assert.equal(checkRes.body.hasDuplicate, true)
  assert.equal(checkRes.body.matchesCount, 1)
})

test('student intervention records: full lifecycle and resolution tracking', async () => {
  // First create a student
  const studentRes = await request('/api/students', {
    method: 'POST',
    headers: headers(adminAId, 'admin'),
    body: JSON.stringify({
      schoolId: schoolAId,
      name: 'Reyes, Carlo',
      grade,
      section,
      gender: 'Male'
    })
  })
  assert.equal(studentRes.response.status, 200)
  const studentId = studentRes.body.id

  // 1. Create intervention record
  const createInterventionRes = await request(`/api/students/${studentId}/interventions`, {
    method: 'POST',
    headers: headers(teacherAId, 'teacher'),
    body: JSON.stringify({
      concern_type: 'attendance',
      action_taken: 'Conducted teacher-parent conference regarding 3 unexcused absences',
      follow_up_date: '2026-10-25',
      resolution_status: 'open',
      notes: 'Parent acknowledged and committed to transport support'
    })
  })

  assert.equal(createInterventionRes.response.status, 201)
  assert.equal(createInterventionRes.body.concern_type, 'attendance')
  assert.equal(createInterventionRes.body.resolution_status, 'open')
  const interventionId = createInterventionRes.body.id

  // 2. Query student interventions list
  const listRes = await request(`/api/students/${studentId}/interventions`, {
    headers: headers(teacherAId, 'teacher')
  })
  assert.equal(listRes.response.status, 200)
  assert.equal(listRes.body.length, 1)
  assert.equal(listRes.body[0].id, interventionId)

  // 3. Query school-wide interventions
  const schoolWideRes = await request(`/api/students/interventions?schoolId=${schoolAId}&concern_type=attendance`, {
    headers: headers(adminAId, 'admin')
  })
  assert.equal(schoolWideRes.response.status, 200)
  assert.ok(schoolWideRes.body.some(i => i.id === interventionId))

  // 4. Update intervention resolution status
  const updateInterventionRes = await request(`/api/students/${studentId}/interventions/${interventionId}`, {
    method: 'PUT',
    headers: headers(teacherAId, 'teacher'),
    body: JSON.stringify({
      resolution_status: 'resolved',
      action_taken: 'Follow-up completed: student returned to 100% attendance rate this week',
      notes: 'Case resolved successfully'
    })
  })
  assert.equal(updateInterventionRes.response.status, 200)
  assert.equal(updateInterventionRes.body.resolution_status, 'resolved')

  // 5. Delete intervention
  const deleteRes = await request(`/api/students/${studentId}/interventions/${interventionId}`, {
    method: 'DELETE',
    headers: headers(adminAId, 'admin')
  })
  assert.equal(deleteRes.response.status, 200)
  assert.equal(deleteRes.body.success, true)
})

test('guardian contact logs and school-configurable SARDO thresholds', async () => {
  // 1. Create a student
  const studentRes = await request('/api/students', {
    method: 'POST',
    headers: headers(adminAId, 'admin'),
    body: JSON.stringify({
      schoolId: schoolAId,
      name: 'Mendoza, Andrea',
      grade,
      section,
      gender: 'Female',
      guardian_name: 'Mendoza, Elena',
      guardian_contact: '09201112233'
    })
  })
  assert.equal(studentRes.response.status, 200)
  const studentId = studentRes.body.id

  // 2. Log guardian contact event
  const logContactRes = await request(`/api/students/${studentId}/guardian-contacts`, {
    method: 'POST',
    headers: headers(teacherAId, 'teacher'),
    body: JSON.stringify({
      contact_date: '2026-10-18',
      contact_method: 'phone',
      reason: 'Consecutive absence check-in',
      outcome: 'Parent answered, confirmed flu recovery; returning to class on Tuesday.'
    })
  })
  assert.equal(logContactRes.response.status, 201)
  assert.equal(logContactRes.body.contact_method, 'phone')
  assert.equal(logContactRes.body.guardian_name, 'Mendoza, Elena')
  const contactId = logContactRes.body.id

  // 3. Fetch contact logs
  const getContactsRes = await request(`/api/students/${studentId}/guardian-contacts`, {
    headers: headers(teacherAId, 'teacher')
  })
  assert.equal(getContactsRes.response.status, 200)
  assert.equal(getContactsRes.body.length, 1)
  assert.equal(getContactsRes.body[0].id, contactId)

  // 4. Update school SARDO risk criteria
  const updateSchoolRes = await request(`/api/schools/${schoolAId}`, {
    method: 'PUT',
    headers: headers(adminAId, 'admin'),
    body: JSON.stringify({
      sardo_consecutive_absences: 2,
      sardo_cumulative_absences: 4
    })
  })
  assert.equal(updateSchoolRes.response.status, 200)
  assert.equal(updateSchoolRes.body.school.sardo_consecutive_absences, 2)
  assert.equal(updateSchoolRes.body.school.sardo_cumulative_absences, 4)

  // 5. Dashboard reflects configured SARDO rules
  const statsRes = await request(`/api/dashboard/stats?schoolId=${schoolAId}`, {
    headers: headers(adminAId, 'admin')
  })
  assert.equal(statsRes.response.status, 200)
  assert.equal(statsRes.body.sardoRules?.consecutive, 2)
  assert.equal(statsRes.body.sardoRules?.cumulative, 4)

  // 6. Cross-school isolation: Admin B cannot inspect or mutate School A student
  const crossGet = await request(`/api/students/${studentId}`, {
    headers: headers(adminBId, 'admin')
  })
  assert.equal(crossGet.response.status, 404)

  const crossIntervention = await request(`/api/students/${studentId}/interventions`, {
    method: 'POST',
    headers: headers(adminBId, 'admin'),
    body: JSON.stringify({
      concern_type: 'behavioral',
      action_taken: 'Unauthorized cross-school intervention'
    })
  })
  assert.equal(crossIntervention.response.status, 404)
})
