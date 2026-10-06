import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolId1 = `p6-school1-${suffix}`
const schoolId2 = `p6-school2-${suffix}`
const superadminId = `p6-super-${suffix}`
const admin1Id = `p6-admin1-${suffix}`
const admin2Id = `p6-admin2-${suffix}`

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
    [schoolId1, 'Phase 6 Academy One', '7001', 'Baguio City', 'P6A1'])
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [schoolId2, 'Phase 6 Academy Two', '7002', 'La Trinidad', 'P6A2'])

  // Create subscription plan if not exists
  const existingPlan = (await query('SELECT * FROM subscription_plans WHERE tier = "testcampus" LIMIT 1'))[0]
  if (!existingPlan) {
    await run(`INSERT INTO subscription_plans (
      id, tier, name, description, price_monthly, price_annual_monthly, billing_annual_total,
      billing_months, currency, trial_days, max_teachers, max_students, is_featured, badge,
      cta_text, cta_url, features, modules, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      `plan-${suffix}`, 'testcampus', 'Test Campus Plan', 'Plan for testing lifecycle',
      2999, 2499, 29988, 12, 'PHP', 14, 50, 1500, 1, 'Best', 'Subscribe', '', '[]', '{}', 1
    ])
  }

  // Create payment method
  await run(`INSERT INTO payment_methods (id, type, bank_name, account_name, account_number, is_active, sort_order)
    VALUES (?, 'bank_transfer', 'BDO Unibank', 'ElyTrack Holdings', '0012-3456-7890', 1, 1)`,
    [`pm-${suffix}`])

  const pw = await hashPassword('password123')

  // Superadmin
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `super-${suffix}`, pw, 'Super Admin P6', 'superadmin', '', '', '', '', 'superadmin@test.com']
  )

  // School Admin 1
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin1Id, `admin1-${suffix}`, pw, 'School Admin 1', 'admin', '', '', '', schoolId1, 'admin1@test.com']
  )

  // School Admin 2
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin2Id, `admin2-${suffix}`, pw, 'School Admin 2', 'admin', '', '', '', schoolId2, 'admin2@test.com']
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM users WHERE school_id IN (?, ?) OR id = ?', [schoolId1, schoolId2, superadminId])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolId1, schoolId2])
  await run('DELETE FROM subscription_plans WHERE tier = "testcampus"')
  await run('DELETE FROM payment_methods WHERE id = ?', [`pm-${suffix}`])
  await run('DELETE FROM subscription_requests WHERE school_id IN (?, ?)', [schoolId1, schoolId2])
  await run('DELETE FROM licenses WHERE school_id IN (?, ?)', [schoolId1, schoolId2])
  await run('DELETE FROM subscription_status_history WHERE school_id IN (?, ?)', [schoolId1, schoolId2])
})

test('submitting subscription payment request records pending state in status history', async () => {
  const { response, body } = await request('/api/subscriptions/requests', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      request_type: 'activation',
      plan_tier: 'testcampus',
      billing_cycle: 'annual',
      payment_method_id: `pm-${suffix}`,
      payment_reference: 'BDO-REF-12345678',
      proof_url: 'https://example.com/receipt.jpg',
      notes: 'Payment made via mobile banking'
    })
  })

  assert.equal(response.status, 201)
  assert.equal(body.success, true)
  assert.equal(body.request.status, 'pending')
  assert.equal(body.request.payment_reference, 'BDO-REF-12345678')

  const requestId = body.request.id

  // Verify history record
  const history = await query(
    'SELECT * FROM subscription_status_history WHERE request_id = ? AND to_status = "pending"',
    [requestId]
  )
  assert.equal(history.length, 1)
  assert.equal(history[0].school_id, schoolId1)
  assert.equal(history[0].to_status, 'pending')
  assert.equal(history[0].actor_id, admin1Id)
  assert.equal(history[0].actor_role, 'admin')
  assert.ok(history[0].metadata.includes('BDO-REF-12345678'))
})

test('superadmin approving request records approved transition and activates license', async () => {
  // Fetch pending request
  const reqRows = await query('SELECT * FROM subscription_requests WHERE school_id = ? AND status = "pending" LIMIT 1', [schoolId1])
  assert.equal(reqRows.length, 1)
  const requestId = reqRows[0].id

  const reviewNotes = 'Payment verified via BDO merchant portal ref #9988'
  const { response, body } = await request(`/api/subscriptions/requests/${requestId}/status`, {
    method: 'PATCH',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      status: 'approved',
      notes: reviewNotes
    })
  })

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.request.status, 'approved')

  // Verify license activated
  const licenseRows = await query('SELECT * FROM licenses WHERE school_id = ? AND status = "active"', [schoolId1])
  assert.equal(licenseRows.length, 1)
  assert.equal(licenseRows[0].plan_tier, 'testcampus')

  // Verify approval history record
  const approvalHistory = await query(
    'SELECT * FROM subscription_status_history WHERE request_id = ? AND to_status = "approved"',
    [requestId]
  )
  assert.equal(approvalHistory.length, 1)
  assert.equal(approvalHistory[0].from_status, 'pending')
  assert.equal(approvalHistory[0].to_status, 'approved')
  assert.equal(approvalHistory[0].actor_id, superadminId)
  assert.equal(approvalHistory[0].actor_role, 'superadmin')
  assert.equal(approvalHistory[0].notes, reviewNotes)
})

test('superadmin rejecting request records rejected transition with audit notes', async () => {
  // Create a new request from school 2
  const createRes = await request('/api/subscriptions/requests', {
    method: 'POST',
    headers: headers(admin2Id, 'admin'),
    body: JSON.stringify({
      request_type: 'activation',
      plan_tier: 'testcampus',
      billing_cycle: 'monthly',
      payment_method_id: `pm-${suffix}`,
      payment_reference: 'INVALID-REF-0000',
      notes: 'Check this payment'
    })
  })
  assert.equal(createRes.response.status, 201)
  const requestId = createRes.body.request.id

  const rejectNotes = 'Reference number not found in bank statement'
  const { response, body } = await request(`/api/subscriptions/requests/${requestId}/status`, {
    method: 'PATCH',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      status: 'rejected',
      notes: rejectNotes
    })
  })

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.request.status, 'rejected')

  // Verify rejection history record
  const rejectHistory = await query(
    'SELECT * FROM subscription_status_history WHERE request_id = ? AND to_status = "rejected"',
    [requestId]
  )
  assert.equal(rejectHistory.length, 1)
  assert.equal(rejectHistory[0].from_status, 'pending')
  assert.equal(rejectHistory[0].to_status, 'rejected')
  assert.equal(rejectHistory[0].actor_id, superadminId)
  assert.equal(rejectHistory[0].notes, rejectNotes)
})

test('school admin can cancel pending request and logs cancelled transition', async () => {
  // Submit request from school 2
  const createRes = await request('/api/subscriptions/requests', {
    method: 'POST',
    headers: headers(admin2Id, 'admin'),
    body: JSON.stringify({
      request_type: 'activation',
      plan_tier: 'testcampus',
      billing_cycle: 'annual',
      payment_reference: 'CANCEL-ME-1122',
      notes: 'Submitted by accident'
    })
  })
  assert.equal(createRes.response.status, 201)
  const requestId = createRes.body.request.id

  const { response, body } = await request(`/api/subscriptions/requests/${requestId}/cancel`, {
    method: 'POST',
    headers: headers(admin2Id, 'admin'),
    body: JSON.stringify({ notes: 'Cancelled before payment confirmation' })
  })

  assert.equal(response.status, 200)
  assert.equal(body.success, true)
  assert.equal(body.request.status, 'cancelled')

  const cancelHistory = await query(
    'SELECT * FROM subscription_status_history WHERE request_id = ? AND to_status = "cancelled"',
    [requestId]
  )
  assert.equal(cancelHistory.length, 1)
  assert.equal(cancelHistory[0].actor_id, admin2Id)
  assert.equal(cancelHistory[0].notes, 'Cancelled before payment confirmation')
})

test('license suspension and cancellation record transitions in history', async () => {
  const licenseRows = await query('SELECT * FROM licenses WHERE school_id = ? AND status = "active" LIMIT 1', [schoolId1])
  assert.equal(licenseRows.length, 1)
  const licenseId = licenseRows[0].id

  // 1. Suspend license
  const suspendRes = await request(`/api/licenses/${licenseId}/suspend`, {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({ notes: 'Temporary administrative suspension' })
  })
  assert.equal(suspendRes.response.status, 200)

  const suspendHist = await query(
    'SELECT * FROM subscription_status_history WHERE license_id = ? AND to_status = "suspended"',
    [licenseId]
  )
  assert.equal(suspendHist.length, 1)
  assert.equal(suspendHist[0].from_status, 'active')
  assert.equal(suspendHist[0].actor_id, superadminId)

  // 2. Resume license
  const resumeRes = await request(`/api/licenses/${licenseId}/resume`, {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({ notes: 'Reactivated after clearance' })
  })
  assert.equal(resumeRes.response.status, 200)

  // 3. Cancel license
  const cancelRes = await request(`/api/licenses/${licenseId}/cancel`, {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({ notes: 'Contract terminated upon institutional request' })
  })
  assert.equal(cancelRes.response.status, 200)
  assert.equal(cancelRes.body.license.status, 'cancelled')

  const cancelHist = await query(
    'SELECT * FROM subscription_status_history WHERE license_id = ? AND to_status = "cancelled"',
    [licenseId]
  )
  assert.equal(cancelHist.length, 1)
  assert.equal(cancelHist[0].notes, 'Contract terminated upon institutional request')
})

test('GET /api/subscriptions/history respects school boundaries', async () => {
  // School 1 admin querying history
  const { response: res1, body: body1 } = await request('/api/subscriptions/history', {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(res1.status, 200)
  assert.ok(Array.isArray(body1))
  assert.ok(body1.length > 0)
  assert.ok(body1.every(entry => entry.school_id === schoolId1), 'School admin must only see own history')

  // Superadmin querying all history
  const { response: resSuper, body: bodySuper } = await request('/api/subscriptions/history', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(resSuper.status, 200)
  assert.ok(Array.isArray(bodySuper))
  assert.ok(bodySuper.some(entry => entry.school_id === schoolId1))
  assert.ok(bodySuper.some(entry => entry.school_id === schoolId2))
})
