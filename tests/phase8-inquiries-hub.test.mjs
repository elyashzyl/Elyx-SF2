import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'

const suffix = randomUUID()
const school1Id = `p8-sch1-${suffix}`
const school2Id = `p8-sch2-${suffix}`
const superadminId = `p8-super-${suffix}`
const admin1Id = `p8-admin1-${suffix}`
const teacher1Id = `p8-teach1-${suffix}`

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

  // Seed schools
  await run(
    'INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [school1Id, 'Phase 8 East Campus', '8001', 'Baguio City', 'P8-East']
  )
  await run(
    'INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
    [school2Id, 'Phase 8 West Campus', '8002', 'La Trinidad', 'P8-West']
  )

  // Seed users
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `p8-super-${suffix}`, 'hash', 'Super User', 'superadmin', '', '', '', '', 'super@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [admin1Id, `p8-admin1-${suffix}`, 'hash', 'Admin East', 'admin', '', '', '', school1Id, 'admin1@test.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacher1Id, `p8-teach1-${suffix}`, 'hash', 'Teacher East', 'teacher', 'Grade 7', 'Section A', 'AM', school1Id, 'teacher1@test.com']
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM inquiries WHERE user_id IN (?, ?, ?)', [superadminId, admin1Id, teacher1Id])
  await run('DELETE FROM users WHERE id IN (?, ?, ?)', [superadminId, admin1Id, teacher1Id])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [school1Id, school2Id])
})

test('creates support inquiry and populates KPI stats', async () => {
  // 1. Create inquiry as teacher
  const res = await request('/api/inquiries', {
    method: 'POST',
    headers: headers(teacher1Id, 'teacher'),
    body: JSON.stringify({
      subject: 'Critical billing issue for quarterly attendance sync',
      category: 'payment',
      priority: 'urgent',
      message: 'Need help clarifying the latest license renewal invoice.',
      userEmail: 'teacher1@test.com'
    })
  })
  assert.equal(res.response.status, 201)
  assert.equal(res.body.success, true)
  const ticketId = res.body.inquiry.id

  // 2. Fetch stats as superadmin
  const statsRes = await request('/api/inquiries/stats', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(statsRes.response.status, 200)
  assert.ok(statsRes.body.total >= 1)
  assert.ok(statsRes.body.open >= 1)
  assert.ok(statsRes.body.urgent >= 1)
  assert.equal(typeof statsRes.body.resolutionRate, 'number')

  // 3. School admin sees scoped stats
  const adminStatsRes = await request('/api/inquiries/stats', {
    headers: headers(admin1Id, 'admin')
  })
  assert.equal(adminStatsRes.response.status, 200)
  assert.ok(adminStatsRes.body.total >= 1)
})

test('bulk marks inquiries as finished by superadmin', async () => {
  // Create second inquiry
  const res = await request('/api/inquiries', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      subject: 'Bulk test ticket',
      category: 'technical',
      priority: 'medium',
      message: 'Testing bulk status updates'
    })
  })
  const ticketId = res.body.inquiry.id

  // Non-superadmin cannot bulk update
  const forbiddenRes = await request('/api/inquiries/bulk-status', {
    method: 'POST',
    headers: headers(admin1Id, 'admin'),
    body: JSON.stringify({
      ids: [ticketId],
      status: 'finished'
    })
  })
  assert.equal(forbiddenRes.response.status, 403)

  // Superadmin bulk updates
  const bulkRes = await request('/api/inquiries/bulk-status', {
    method: 'POST',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      ids: [ticketId],
      status: 'finished',
      note: 'Bulk resolved in test suite'
    })
  })
  assert.equal(bulkRes.response.status, 200)
  assert.equal(bulkRes.body.success, true)
  assert.equal(bulkRes.body.updatedCount, 1)

  // Verify status is finished
  const checkRes = await request(`/api/inquiries/${ticketId}`, {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(checkRes.body.inquiry.status, 'finished')
})

test('exports filtered inquiries to CSV with correct UTF-8 headers', async () => {
  const csvRes = await request('/api/inquiries/export/csv?category=payment', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(csvRes.response.status, 200)
  assert.ok(csvRes.response.headers.get('content-type').includes('text/csv'))
  assert.ok(csvRes.text.includes('Ticket ID,Campus,Requester,Role,Email,Category,Priority,Subject,Status,Assigned To'))
  assert.ok(csvRes.text.includes('Critical billing issue'))
})
