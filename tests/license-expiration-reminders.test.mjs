import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'
import { evaluateLicenseExpirationReminders, calculateDaysRemaining, getEligibleReminderThreshold } from '../lib/expirationReminders.js'

const suffix = randomUUID()
const schoolId1 = `rem-school1-${suffix}`
const schoolId2 = `rem-school2-${suffix}`
const superadminId = `rem-super-${suffix}`
const admin1Id = `rem-admin1-${suffix}`
const admin2Id = `rem-admin2-${suffix}`
const teacherId = `rem-teach-${suffix}`

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

  // Create test schools
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [schoolId1, 'Reminder Academy One', '8001', 'Baguio City', 'RA1'])
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [schoolId2, 'Reminder Academy Two', '8002', 'La Trinidad', 'RA2'])

  // Create test users
  const passwordHash = await hashPassword('TestSecret2026!')
  await run(`INSERT INTO users (id, username, password, name, role, school_id, email, account_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [superadminId, `rem_super_${suffix}`, passwordHash, 'Rem Super', 'superadmin', '', 'rem_super@test.com'])

  await run(`INSERT INTO users (id, username, password, name, role, school_id, email, account_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [admin1Id, `rem_admin1_${suffix}`, passwordHash, 'Rem Admin One', 'admin', schoolId1, 'rem_admin1@test.com'])

  await run(`INSERT INTO users (id, username, password, name, role, school_id, email, account_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [admin2Id, `rem_admin2_${suffix}`, passwordHash, 'Rem Admin Two', 'admin', schoolId2, 'rem_admin2@test.com'])

  await run(`INSERT INTO users (id, username, password, name, role, school_id, email, account_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
    [teacherId, `rem_teach_${suffix}`, passwordHash, 'Rem Teacher', 'teacher', schoolId1, 'rem_teach@test.com'])

  // User notification preferences
  await run(`INSERT INTO user_notification_preferences (user_id, email_on_inquiry_reply, email_on_announcement, email_on_status_change, in_app_notifications)
    VALUES (?, 1, 1, 1, 1)`, [admin1Id])

  await run(`INSERT INTO user_notification_preferences (user_id, email_on_inquiry_reply, email_on_announcement, email_on_status_change, in_app_notifications)
    VALUES (?, 1, 1, 1, 1)`, [admin2Id])

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
})

test('calculateDaysRemaining and getEligibleReminderThreshold helpers evaluate correctly', () => {
  const today = new Date().toISOString().split('T')[0]
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  assert.ok(calculateDaysRemaining(in3Days) <= 4 && calculateDaysRemaining(in3Days) >= 2)
  assert.ok(calculateDaysRemaining(pastDate) <= 0)

  // Threshold mapping
  const trialExpired = getEligibleReminderThreshold(true, 0)
  assert.equal(trialExpired?.type, 'trial_expired')

  const trial3d = getEligibleReminderThreshold(true, 3)
  assert.equal(trial3d?.type, 'trial_3d')

  const sub7d = getEligibleReminderThreshold(false, 7)
  assert.equal(sub7d?.type, 'sub_7d')

  const sub14d = getEligibleReminderThreshold(false, 14)
  assert.equal(sub14d?.type, 'sub_14d')

  const farFuture = getEligibleReminderThreshold(false, 60)
  assert.equal(farFuture, null)
})

test('automated expiration reminders engine dispatches warnings, in-app alerts, and deduplicates', async () => {
  const licenseId = `lic-warn-${suffix}`
  const expDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Provision an active license expiring in 3 days
  await run(`INSERT INTO licenses (
    id, school_id, plan_tier, billing_cycle, expires_at, status, license_key, max_teachers, max_students, features
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    licenseId,
    schoolId1,
    'standard',
    'monthly',
    expDate,
    'active',
    `KEY-WARN-${suffix}`,
    10,
    300,
    '{}'
  ])

  // Run reminder evaluation
  const result1 = await evaluateLicenseExpirationReminders({ schoolId: schoolId1 })
  assert.ok(result1.remindersSent >= 1, 'Should have sent at least 1 reminder')

  // Verify record in license_expiration_reminders
  const reminders = await query('SELECT * FROM license_expiration_reminders WHERE license_id = ?', [licenseId])
  assert.equal(reminders.length, 1)
  assert.equal(reminders[0].reminder_type, 'sub_3d')
  assert.equal(reminders[0].school_id, schoolId1)
  assert.equal(reminders[0].target_expiration_date, expDate)

  // Verify in-app announcement was created for school administrators
  const announcements = await query('SELECT * FROM announcements WHERE school_id = ? AND target_role = "admin"', [schoolId1])
  assert.ok(announcements.length >= 1)
  assert.match(announcements[0].title, /\[Reminder\]/i)

  // Verify subscription status history logged the reminder dispatch
  const history = await query('SELECT * FROM subscription_status_history WHERE license_id = ?', [licenseId])
  assert.ok(history.length >= 1)
  assert.match(history[0].notes, /Dispatched/i)

  // Deduplication test: re-running immediately should NOT send duplicate reminders
  const result2 = await evaluateLicenseExpirationReminders({ schoolId: schoolId1 })
  assert.equal(result2.remindersSent, 0, 'Subsequent evaluation must be deduplicated and send 0 duplicates')

  const remindersAfter = await query('SELECT * FROM license_expiration_reminders WHERE license_id = ?', [licenseId])
  assert.equal(remindersAfter.length, 1, 'Should still be exactly 1 reminder recorded')
})

test('expired license is transitioned to expired status and audit logged', async () => {
  const expiredLicenseId = `lic-exp-${suffix}`
  const pastExpDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  await run(`INSERT INTO licenses (
    id, school_id, plan_tier, billing_cycle, expires_at, status, license_key, max_teachers, max_students, features
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    expiredLicenseId,
    schoolId2,
    'trial',
    'monthly',
    pastExpDate,
    'trial',
    `KEY-EXP-${suffix}`,
    5,
    150,
    '{}'
  ])

  // Run evaluation
  const evalResult = await evaluateLicenseExpirationReminders({ schoolId: schoolId2 })
  assert.ok(evalResult.remindersSent >= 1)

  // Verify license status was transitioned to expired in database
  const updatedLic = (await query('SELECT * FROM licenses WHERE id = ?', [expiredLicenseId]))[0]
  assert.equal(updatedLic.status, 'expired')

  // Verify status transition was logged in subscription_status_history
  const expiredHistory = await query('SELECT * FROM subscription_status_history WHERE license_id = ? AND to_status = "expired"', [expiredLicenseId])
  assert.ok(expiredHistory.length >= 1)
  assert.equal(expiredHistory[0].from_status, 'trial')
  assert.equal(expiredHistory[0].to_status, 'expired')
})

test('POST /api/licenses/check-expirations triggers reminders and enforces role guards', async () => {
  // Superadmin trigger
  const resSuper = await request('/api/licenses/check-expirations', {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({})
  })
  assert.equal(resSuper.response.status, 200)
  assert.equal(resSuper.body.success, true)
  assert.ok(typeof resSuper.body.remindersSent === 'number')

  // School admin trigger (scoped to own school)
  const resAdmin = await request('/api/licenses/check-expirations', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({})
  })
  assert.equal(resAdmin.response.status, 200)
  assert.equal(resAdmin.body.success, true)

  // Unauthorized role (teacher) should be rejected with 403
  const resTeacher = await request('/api/licenses/check-expirations', {
    method: 'POST',
    headers: headers(teacherId, 'teacher'),
    body: JSON.stringify({})
  })
  assert.equal(resTeacher.response.status, 403)
})

test('GET /api/licenses/reminders retrieves reminders and respects school boundaries', async () => {
  // Superadmin view across platform
  const resSuper = await request('/api/licenses/reminders', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(resSuper.response.status, 200)
  assert.ok(Array.isArray(resSuper.body))
  assert.ok(resSuper.body.length >= 2)

  // School admin view (should only see schoolId1)
  const resAdmin1 = await request('/api/licenses/reminders', {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(resAdmin1.response.status, 200)
  assert.ok(Array.isArray(resAdmin1.body))
  assert.ok(resAdmin1.body.every(r => r.school_id === schoolId1))

  // Cross-school isolation check: admin 1 cannot query admin 2's school reminders
  const resCross = await request(`/api/licenses/reminders?school_id=${schoolId2}`, {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(resCross.response.status, 200)
  assert.ok(resCross.body.every(r => r.school_id === schoolId1))
})
