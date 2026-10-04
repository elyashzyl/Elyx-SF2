import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolId = `phase5-school-${suffix}`
const superadminId = `phase5-superadmin-${suffix}`
const adminId = `phase5-admin-${suffix}`
const teacher1Id = `phase5-teacher1-${suffix}`
const teacher2Id = `phase5-teacher2-${suffix}`

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
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [schoolId, 'Phase 5 Integrated Academy', '6001', 'Benguet', 'P5IA'])

  const pw = await hashPassword('password123')

  // Superadmin
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `super-${suffix}`, pw, 'Super Admin P5', 'superadmin', '', '', '', '', 'superadmin@test.com']
  )

  // School Admin
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminId, `admin-${suffix}`, pw, 'School Admin P5', 'admin', '', '', '', schoolId, 'admin@test.com']
  )

  // Teacher 1: Grade 7 - Pearl
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacher1Id, `teacher1-${suffix}`, pw, 'Teacher One P5', 'teacher', 'Grade 7', 'Pearl', 'AM', schoolId, 'teacher1@test.com']
  )

  // Teacher 2: Grade 8 - Diamond
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacher2Id, `teacher2-${suffix}`, pw, 'Teacher Two P5', 'teacher', 'Grade 8', 'Diamond', 'AM', schoolId, 'teacher2@test.com']
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM users WHERE school_id = ? OR id IN (?, ?, ?, ?)', [schoolId, superadminId, adminId, teacher1Id, teacher2Id])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
  await run('DELETE FROM announcements WHERE author_id IN (?, ?, ?, ?)', [superadminId, adminId, teacher1Id, teacher2Id])
  await run('DELETE FROM inquiries WHERE user_id IN (?, ?, ?, ?)', [superadminId, adminId, teacher1Id, teacher2Id])
  await run('DELETE FROM user_notification_preferences WHERE user_id IN (?, ?, ?, ?)', [superadminId, adminId, teacher1Id, teacher2Id])
})

test('support inquiry creation with priority, category, and audit history', async () => {
  const { response, body } = await request('/api/inquiries', {
    method: 'POST',
    headers: headers(teacher1Id, 'teacher'),
    body: JSON.stringify({
      subject: 'Critical billing discrepancy for SF2 export',
      category: 'payment',
      priority: 'urgent',
      message: 'Need urgent seat capacity clarification before monthly generation cutoff.',
      userEmail: 'teacher1@test.com'
    })
  })

  assert.equal(response.status, 201)
  assert.equal(body.success, true)
  assert.equal(body.inquiry.priority, 'urgent')
  assert.equal(body.inquiry.category, 'payment')
  assert.equal(body.inquiry.status, 'open')

  const inquiryId = body.inquiry.id

  // Check status history endpoint
  const historyRes = await request(`/api/inquiries/${inquiryId}/history`, {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(historyRes.response.status, 200)
  assert.ok(Array.isArray(historyRes.body.history))
  assert.equal(historyRes.body.history.length, 1)
  assert.equal(historyRes.body.history[0].new_status, 'open')
  assert.equal(historyRes.body.history[0].note, 'Inquiry created')
})

test('support inquiry attachment validation rejects dangerous file types and large payloads', async () => {
  // Reject dangerous extension
  const badExt = await request('/api/inquiries', {
    method: 'POST',
    headers: headers(teacher2Id, 'teacher'),
    body: JSON.stringify({
      subject: 'Dangerous script test',
      message: 'Here is an executable',
      attachment: {
        name: 'exploit.exe',
        url: 'data:application/octet-stream;base64,AAAA',
        type: 'application/octet-stream',
        size: 100
      }
    })
  })
  assert.equal(badExt.response.status, 400)
  assert.match(badExt.body.error, /disallowed file extension/i)

  // Reject oversized file (> 5MB)
  const oversized = await request('/api/inquiries', {
    method: 'POST',
    headers: headers(teacher2Id, 'teacher'),
    body: JSON.stringify({
      subject: 'Oversized file test',
      message: 'File is too large',
      attachment: {
        name: 'huge.pdf',
        url: 'https://example.com/huge.pdf',
        type: 'application/pdf',
        size: 6 * 1024 * 1024
      }
    })
  })
  assert.equal(oversized.response.status, 400)
  assert.match(oversized.body.error, /exceeds maximum size/i)

  // Accept valid image attachment
  const validImage = await request('/api/inquiries', {
    method: 'POST',
    headers: headers(teacher2Id, 'teacher'),
    body: JSON.stringify({
      subject: 'Valid screenshot inquiry',
      category: 'technical',
      priority: 'high',
      message: 'Screenshot showing error badge on SF2 export.',
      attachment: {
        name: 'error-screenshot.png',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        type: 'image/png',
        size: 85
      }
    })
  })
  assert.equal(validImage.response.status, 201)
  assert.equal(validImage.body.inquiry.priority, 'high')
})

test('superadmin can assign inquiries to staff and view audit history', async () => {
  // Create an inquiry
  const createRes = await request('/api/inquiries', {
    method: 'POST',
    headers: headers(teacher1Id, 'teacher'),
    body: JSON.stringify({
      subject: 'Faculty schedule consultation',
      category: 'general',
      priority: 'low',
      message: 'Requesting guidance on class periods.'
    })
  })
  assert.equal(createRes.response.status, 201)
  const inquiryId = createRes.body.inquiry.id

  // Non-superadmin cannot assign
  const forbiddenAssign = await request(`/api/inquiries/${inquiryId}/assign`, {
    method: 'PATCH',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({ assigned_to: adminId, assigned_to_name: 'Admin User' })
  })
  assert.equal(forbiddenAssign.response.status, 403)

  // Superadmin assigns to School Admin
  const assignRes = await request(`/api/inquiries/${inquiryId}/assign`, {
    method: 'PATCH',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      assigned_to: adminId,
      assigned_to_name: 'School Admin P5',
      note: 'Assigned to campus administrator for local follow-up'
    })
  })
  assert.equal(assignRes.response.status, 200)
  assert.equal(assignRes.body.inquiry.assigned_to, adminId)
  assert.equal(assignRes.body.inquiry.assigned_to_name, 'School Admin P5')

  // Superadmin marks as finished
  const finishRes = await request(`/api/inquiries/${inquiryId}/status`, {
    method: 'PATCH',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      status: 'finished',
      admin_reply: 'Resolved in coordination with campus admin.',
      note: 'Resolution completed'
    })
  })
  assert.equal(finishRes.response.status, 200)
  assert.equal(finishRes.body.inquiry.status, 'finished')

  // Verify status history audit entries
  const historyRes = await request(`/api/inquiries/${inquiryId}/history`, {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(historyRes.response.status, 200)
  assert.equal(historyRes.body.history.length, 3)
  assert.equal(historyRes.body.history[0].new_status, 'open')
  assert.match(historyRes.body.history[1].note, /Assigned to campus administrator/)
  assert.equal(historyRes.body.history[2].new_status, 'finished')
})

test('user notification preferences GET and PUT lifecycle', async () => {
  // GET default preferences for user without records
  const defaultGet = await request('/api/users/me/notification-preferences', {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(defaultGet.response.status, 200)
  assert.equal(defaultGet.body.email_on_inquiry_reply, true)
  assert.equal(defaultGet.body.email_on_announcement, true)
  assert.equal(defaultGet.body.email_on_status_change, true)
  assert.equal(defaultGet.body.in_app_notifications, true)

  // PUT customized preferences
  const updateRes = await request('/api/users/me/notification-preferences', {
    method: 'PUT',
    headers: headers(teacher1Id, 'teacher'),
    body: JSON.stringify({
      email_on_inquiry_reply: false,
      email_on_announcement: true,
      email_on_status_change: false,
      in_app_notifications: true
    })
  })
  assert.equal(updateRes.response.status, 200)
  assert.equal(updateRes.body.success, true)
  assert.equal(updateRes.body.preferences.email_on_inquiry_reply, false)
  assert.equal(updateRes.body.preferences.email_on_status_change, false)

  // Subsequent GET reflects updated values
  const getUpdated = await request('/api/users/me/notification-preferences', {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(getUpdated.response.status, 200)
  assert.equal(getUpdated.body.email_on_inquiry_reply, false)
  assert.equal(getUpdated.body.email_on_announcement, true)
  assert.equal(getUpdated.body.email_on_status_change, false)
})

test('configurable support email validation in platform settings', async () => {
  // Invalid email format rejected
  const badEmail = await request('/api/settings', {
    method: 'PUT',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      settings: { support_email: 'not-an-email' }
    })
  })
  assert.equal(badEmail.response.status, 400)
  assert.match(badEmail.body.error, /invalid support email/i)

  // Valid email accepted
  const goodEmail = await request('/api/settings', {
    method: 'PUT',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      settings: { support_email: 'helpdesk@integratedacademy.edu.ph' }
    })
  })
  assert.equal(goodEmail.response.status, 200)
  assert.equal(goodEmail.body.success, true)

  // Verify settings output
  const listSettings = await request('/api/settings', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(listSettings.body.support_email, 'helpdesk@integratedacademy.edu.ph')
})

test('targeted announcements creation, role and class filtering, read tracking, and cleanup', async () => {
  // 1. Post school-wide urgent announcement by School Admin
  const ann1Res = await request('/api/announcements', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      title: 'Suspension of Classes Due to Typhoon',
      content: 'Classes across all levels are suspended tomorrow.',
      priority: 'urgent',
      target_role: 'all'
    })
  })
  assert.equal(ann1Res.response.status, 201)
  const ann1Id = ann1Res.body.announcement.id

  // 2. Post teacher-only announcement targeted specifically to Grade 7
  const ann2Res = await request('/api/announcements', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      title: 'Grade 7 Curriculum Meeting',
      content: 'Meeting at 3:00 PM in Faculty Room B.',
      priority: 'important',
      target_role: 'teacher',
      target_grade: 'Grade 7'
    })
  })
  assert.equal(ann2Res.response.status, 201)
  const ann2Id = ann2Res.body.announcement.id

  // 3. Post teacher-only announcement targeted specifically to Grade 8
  const ann3Res = await request('/api/announcements', {
    method: 'POST',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      title: 'Grade 8 Science Fair Prep',
      content: 'Submit project proposals by Friday.',
      priority: 'normal',
      target_role: 'teacher',
      target_grade: 'Grade 8'
    })
  })
  assert.equal(ann3Res.response.status, 201)
  const ann3Id = ann3Res.body.announcement.id

  // 4. Verify Teacher 1 (Grade 7) sees ann1 and ann2, but NOT ann3 (Grade 8)
  const teacher1List = await request('/api/announcements', {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(teacher1List.response.status, 200)
  const t1Ids = teacher1List.body.map(a => a.id)
  assert.ok(t1Ids.includes(ann1Id), 'Teacher 1 should see school-wide announcement')
  assert.ok(t1Ids.includes(ann2Id), 'Teacher 1 should see Grade 7 announcement')
  assert.ok(!t1Ids.includes(ann3Id), 'Teacher 1 should NOT see Grade 8 announcement')

  // 5. Verify unread count for Teacher 1
  const t1Unread = await request('/api/announcements/unread-count', {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(t1Unread.response.status, 200)
  assert.equal(t1Unread.body.unreadCount, 2)

  // 6. Teacher 1 marks ann1 as read
  const markReadRes = await request(`/api/announcements/${ann1Id}/read`, {
    method: 'POST',
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(markReadRes.response.status, 200)

  // Unread count decrements to 1
  const t1UnreadAfter = await request('/api/announcements/unread-count', {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(t1UnreadAfter.body.unreadCount, 1)

  // 7. Teacher 1 marks all as read
  const markAllRes = await request('/api/announcements/mark-all-read', {
    method: 'POST',
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(markAllRes.response.status, 200)
  assert.equal(markAllRes.body.count, 1)

  const t1UnreadFinal = await request('/api/announcements/unread-count', {
    headers: headers(teacher1Id, 'teacher')
  })
  assert.equal(t1UnreadFinal.body.unreadCount, 0)

  // 8. Delete announcement
  const deleteRes = await request(`/api/announcements/${ann3Id}`, {
    method: 'DELETE',
    headers: headers(adminId, 'admin')
  })
  assert.equal(deleteRes.response.status, 200)

  // 9. Expired announcement cleanup endpoint
  const expiredPastDate = '2020-01-01 00:00:00'
  const expAnnId = randomUUID()
  await run(
    `INSERT INTO announcements (id, school_id, title, content, target_role, expires_at, created_at, updated_at)
     VALUES (?, ?, 'Old Notice', 'Expired content', 'all', ?, ?, ?)`,
    [expAnnId, schoolId, expiredPastDate, expiredPastDate, expiredPastDate]
  )

  const cleanupRes = await request('/api/announcements/cleanup', {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({ retentionDays: 30 })
  })
  assert.equal(cleanupRes.response.status, 200)
  assert.ok(cleanupRes.body.deleted >= 1)
})
