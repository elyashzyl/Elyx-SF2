import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolA = `lifecycle-school-a-${suffix}`
const schoolB = `lifecycle-school-b-${suffix}`
const adminA = `lifecycle-admin-a-${suffix}`
const adminB = `lifecycle-admin-b-${suffix}`
const teacherA = `lifecycle-teacher-a-${suffix}`
const teacherB = `lifecycle-teacher-b-${suffix}`
let server
let baseUrl

function actorHeaders(id, role) {
  return {
    'content-type': 'application/json',
    'x-user-id': id,
    'x-user-role': role
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
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolA, 'Lifecycle School A', '', '', 'A'])
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolB, 'Lifecycle School B', '', '', 'B'])
  for (const [id, username, name, role, schoolId] of [
    [adminA, adminA, 'Lifecycle Admin A', 'admin', schoolA],
    [adminB, adminB, 'Lifecycle Admin B', 'admin', schoolB],
    [teacherA, teacherA, 'Lifecycle Teacher A', 'teacher', schoolA],
    [teacherB, teacherB, 'Lifecycle Teacher B', 'teacher', schoolB]
  ]) {
    await run(
      'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, await hashPassword('test-password'), name, role, role === 'teacher' ? 'Grade 1' : '', role === 'teacher' ? 'Section A' : '', '', schoolId]
    )
  }
  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await run('DELETE FROM auth_sessions WHERE user_id IN (?, ?, ?, ?)', [adminA, adminB, teacherA, teacherB])
  await run('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [adminA, adminB, teacherA, teacherB])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolA, schoolB])
  await new Promise(resolve => server.close(resolve))
})

test('same-school administrators can disable and re-enable accounts', async () => {
  const disabled = await request(`/api/users/${teacherA}/status`, {
    method: 'PATCH',
    headers: actorHeaders(adminA, 'admin'),
    body: JSON.stringify({ status: 'disabled' })
  })
  assert.equal(disabled.response.status, 200)
  assert.equal(disabled.body.user.account_status, 'disabled')

  const blocked = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: teacherA, password: 'test-password' })
  })
  assert.equal(blocked.response.status, 403)

  const enabled = await request(`/api/users/${teacherA}/status`, {
    method: 'PATCH',
    headers: actorHeaders(adminA, 'admin'),
    body: JSON.stringify({ status: 'active' })
  })
  assert.equal(enabled.response.status, 200)
  assert.equal(enabled.body.user.account_status, 'active')
})

test('administrators cannot change an account in another school', async () => {
  const response = await request(`/api/users/${teacherB}/status`, {
    method: 'PATCH',
    headers: actorHeaders(adminA, 'admin'),
    body: JSON.stringify({ status: 'disabled' })
  })
  assert.equal(response.response.status, 403)
})

test('five failed passwords lock an account', async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: teacherA, password: 'wrong-password' })
    })
    assert.equal(response.response.status, 401)
  }

  const row = (await query('SELECT account_status, failed_login_count, locked_until FROM users WHERE id = ?', [teacherA]))[0]
  assert.equal(row.account_status, 'locked')
  assert.equal(Number(row.failed_login_count), 5)
  assert.ok(row.locked_until)

  const blocked = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: teacherA, password: 'test-password' })
  })
  assert.equal(blocked.response.status, 403)
})
