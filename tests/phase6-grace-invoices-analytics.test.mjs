import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'
import { getLicenseGracePeriodState, isLicenseActive } from '../routes/_context.js'

const suffix = randomUUID()
const schoolId1 = `p6-sch1-${suffix}`
const schoolId2 = `p6-sch2-${suffix}`
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
    [schoolId1, 'Phase 6 Grace Academy One', '8001', 'Baguio City', 'P6GA1'])
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [schoolId2, 'Phase 6 Grace Academy Two', '8002', 'La Trinidad', 'P6GA2'])

  // Create subscription plan with grace_period_days
  await run(`INSERT INTO subscription_plans (
    id, tier, name, description, price_monthly, price_annual_monthly, billing_annual_total,
    billing_months, currency, trial_days, grace_period_days, max_teachers, max_students, is_featured, badge,
    cta_text, cta_url, features, modules, sort_order
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    `plan-${suffix}`, `tier-${suffix}`, 'Grace Enterprise Plan', 'Plan for grace testing',
    3000, 2500, 30000, 12, 'PHP', 14, 7, 50, 1500, 1, 'Best', 'Subscribe', '', '[]', '{"sf2_export": true}', 1
  ])

  // Create payment method
  await run(`INSERT INTO payment_methods (id, type, bank_name, account_name, account_number, is_active, sort_order)
    VALUES (?, 'bank_transfer', 'Metrobank', 'ElyTrack Holdings Inc', '9988-7766-5544', 1, 1)`,
    [`pm-${suffix}`])

  const pw = await hashPassword('password123')

  // Superadmin
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `super-${suffix}`, pw, 'Super Admin Grace', 'superadmin', '', '', '', '', 'super@phase6.com']
  )

  // School Admin 1
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin1Id, `admin1-${suffix}`, pw, 'School Admin Grace 1', 'admin', '', '', '', schoolId1, 'admin1@phase6.com']
  )

  // School Admin 2
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin2Id, `admin2-${suffix}`, pw, 'School Admin Grace 2', 'admin', '', '', '', schoolId2, 'admin2@phase6.com']
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
  await run('DELETE FROM subscription_plans WHERE id = ?', [`plan-${suffix}`])
  await run('DELETE FROM payment_methods WHERE id = ?', [`pm-${suffix}`])
  await run('DELETE FROM subscription_requests WHERE school_id IN (?, ?)', [schoolId1, schoolId2])
  await run('DELETE FROM subscription_invoices WHERE school_id IN (?, ?)', [schoolId1, schoolId2])
  await run('DELETE FROM licenses WHERE school_id IN (?, ?)', [schoolId1, schoolId2])
  await run('DELETE FROM subscription_status_history WHERE school_id IN (?, ?)', [schoolId1, schoolId2])
})

test('grace period helper correctly differentiates active, in-grace, and hard-lockout states', () => {
  const future = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  const recentPast = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
  const distantPast = new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0]

  // Active license
  const activeLic = { status: 'active', expires_at: future, grace_period_days: 5 }
  const activeState = getLicenseGracePeriodState(activeLic)
  assert.equal(activeState.active, true)
  assert.equal(activeState.inGracePeriod, false)
  assert.equal(activeState.hardLockout, false)
  assert.equal(isLicenseActive(activeLic), true)

  // Expired 2 days ago, grace period is 5 days -> inGracePeriod
  const graceLic = { status: 'active', expires_at: recentPast, grace_period_days: 5 }
  const graceState = getLicenseGracePeriodState(graceLic)
  assert.equal(graceState.active, false)
  assert.equal(graceState.inGracePeriod, true)
  assert.equal(graceState.hardLockout, false)
  assert.ok(graceState.graceDaysRemaining >= 1 && graceState.graceDaysRemaining <= 4)
  assert.equal(isLicenseActive(graceLic), true) // Not hard locked

  // Expired 20 days ago, grace period is 5 days -> hard lockout
  const lockedLic = { status: 'active', expires_at: distantPast, grace_period_days: 5 }
  const lockedState = getLicenseGracePeriodState(lockedLic)
  assert.equal(lockedState.active, false)
  assert.equal(lockedState.inGracePeriod, false)
  assert.equal(lockedState.hardLockout, true)
  assert.equal(isLicenseActive(lockedLic), false)

  // Suspended license -> immediately hard locked
  const suspendedLic = { status: 'suspended', expires_at: future, grace_period_days: 5 }
  assert.equal(getLicenseGracePeriodState(suspendedLic).hardLockout, true)
  assert.equal(isLicenseActive(suspendedLic), false)
})

test('school in grace period permits GET reads but blocks non-subscription mutations with 402', async () => {
  // Set school 1 license to expired 2 days ago with 5-day grace period
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
  const licId = randomUUID()
  await run(`INSERT INTO licenses (id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers, max_students, issued_at, expires_at, grace_period_days)
    VALUES (?, ?, ?, ?, 'active', 'annual', 10, 500, '2026-01-01', ?, 5)`,
    [licId, schoolId1, `KEY-GRACE-${suffix}`, `tier-${suffix}`, twoDaysAgo]
  )

  // 1. GET requests should succeed with grace period header
  const getRes = await request('/api/dashboard/stats', {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(getRes.response.status, 200)
  assert.equal(getRes.response.headers.get('x-license-grace-period'), '1')
  assert.ok(getRes.response.headers.get('x-license-grace-days') !== null)

  // 2. Mutation (POST to events/calendar or attendance) should be blocked with 402 read-only
  const postRes = await request('/api/events/calendar', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      schoolId: schoolId1,
      title: 'Grace Period Test Event',
      type: 'event',
      event_date: '2026-10-10'
    })
  })
  assert.equal(postRes.response.status, 402)
  assert.equal(postRes.body.inGracePeriod, true)
  assert.equal(postRes.body.readOnly, true)
  assert.ok(postRes.body.error.includes('grace period'))

  // 3. Subscription payment requests are NOT blocked during grace period
  const subReqRes = await request('/api/subscriptions/requests', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      request_type: 'renewal',
      plan_tier: `tier-${suffix}`,
      billing_cycle: 'annual',
      payment_method_id: `pm-${suffix}`,
      payment_reference: `REF-GRACE-${suffix}`,
      notes: 'Renewing within grace period'
    })
  })
  assert.equal(subReqRes.response.status, 201)
  assert.equal(subReqRes.body.success, true)
})

test('duplicate payment reference is rejected across schools with 409 collision check', async () => {
  // Admin 2 tries to submit the EXACT same payment reference as Admin 1
  const dupRes = await request('/api/subscriptions/requests', {
    method: 'POST',
    headers: headers(admin2Id, 'admin'),
    body: JSON.stringify({
      request_type: 'activation',
      plan_tier: `tier-${suffix}`,
      billing_cycle: 'annual',
      payment_method_id: `pm-${suffix}`,
      payment_reference: `REF-GRACE-${suffix}`, // same reference!
      notes: 'Attempting duplicate payment reference submission'
    })
  })

  assert.equal(dupRes.response.status, 409)
  assert.ok(dupRes.body.error.includes('already been submitted'))
  assert.ok(dupRes.body.error.includes('Duplicate payment references cannot be processed'))
})

test('superadmin approving payment request generates official subscription_invoices record', async () => {
  // Retrieve pending request from school 1
  const reqRows = await query('SELECT * FROM subscription_requests WHERE school_id = ? AND status = "pending" LIMIT 1', [schoolId1])
  assert.equal(reqRows.length, 1)
  const requestId = reqRows[0].id

  // Superadmin approves request
  const approveRes = await request(`/api/subscriptions/requests/${requestId}/status`, {
    method: 'PATCH',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      status: 'approved',
      notes: 'Verified via Metrobank direct clearing'
    })
  })

  assert.equal(approveRes.response.status, 200)
  assert.equal(approveRes.body.success, true)
  assert.ok(approveRes.body.invoice)
  assert.ok(approveRes.body.invoice.invoice_number.startsWith('INV-'))
  assert.equal(approveRes.body.invoice.status, 'paid')
  assert.equal(approveRes.body.invoice.amount, 30000)

  // Verify database record in subscription_invoices
  const invRows = await query('SELECT * FROM subscription_invoices WHERE request_id = ?', [requestId])
  assert.equal(invRows.length, 1)
  assert.equal(invRows[0].school_id, schoolId1)
  assert.equal(invRows[0].status, 'paid')
  assert.equal(invRows[0].payment_reference, `REF-GRACE-${suffix}`)
  assert.ok(invRows[0].payment_channel.includes('Metrobank'))
})

test('GET /api/subscriptions/invoices enforces school isolation and provides full overview for superadmin', async () => {
  // School 1 admin listing invoices
  const adminRes = await request('/api/subscriptions/invoices', {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(adminRes.response.status, 200)
  assert.ok(Array.isArray(adminRes.body))
  assert.ok(adminRes.body.length >= 1)
  assert.ok(adminRes.body.every(inv => inv.school_id === schoolId1))

  // School 2 admin listing invoices (has no approved invoices yet)
  const admin2Res = await request('/api/subscriptions/invoices', {
    headers: headers(admin2Id, 'admin')
  })
  assert.equal(admin2Res.response.status, 200)
  assert.equal(admin2Res.body.length, 0)

  // Superadmin listing all invoices
  const superRes = await request('/api/subscriptions/invoices', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(superRes.response.status, 200)
  assert.ok(superRes.body.some(inv => inv.school_id === schoolId1))

  // Single invoice retrieval
  const invoiceId = adminRes.body[0].id
  const singleRes = await request(`/api/subscriptions/invoices/${invoiceId}`, {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(singleRes.response.status, 200)
  assert.equal(singleRes.body.id, invoiceId)
  assert.equal(singleRes.body.school_name, 'Phase 6 Grace Academy One')

  // School 2 admin forbidden from retrieving School 1 invoice
  const forbiddenRes = await request(`/api/subscriptions/invoices/${invoiceId}`, {
    headers: headers(admin2Id, 'admin')
  })
  assert.equal(forbiddenRes.response.status, 403)
})

test('GET /api/subscriptions/analytics calculates platform monetization telemetry for superadmin', async () => {
  // Forbidden for school admin
  const adminRes = await request('/api/subscriptions/analytics', {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(adminRes.response.status, 403)

  // Superadmin retrieval
  const analyticsRes = await request('/api/subscriptions/analytics', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(analyticsRes.response.status, 200)
  const { summary, plan_distribution, recent_invoices } = analyticsRes.body

  assert.ok(summary.total_campuses >= 2)
  assert.ok(summary.total_invoices >= 1)
  assert.ok(summary.total_revenue >= 30000)
  assert.ok(summary.mrr_estimate >= 0)
  assert.ok(summary.arr_estimate >= 0)
  assert.ok(typeof summary.churn_rate === 'number')
  assert.ok(Array.isArray(recent_invoices))
  assert.ok(recent_invoices.length >= 1)
})

test('POST /api/subscriptions/webhook acknowledges event payload', async () => {
  const webhookRes = await request('/api/subscriptions/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event: 'payment.completed',
      data: { amount: 30000, reference: 'EXT-123' }
    })
  })
  assert.equal(webhookRes.response.status, 200)
  assert.equal(webhookRes.body.received, true)
})
