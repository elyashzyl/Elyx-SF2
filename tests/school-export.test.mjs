import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolA = `export-school-a-${suffix}`
const schoolB = `export-school-b-${suffix}`
const superadminId = `export-superadmin-${suffix}`
const adminA = `export-admin-a-${suffix}`
const adminB = `export-admin-b-${suffix}`
const studentA = `export-student-a-${suffix}`
const studentB = `export-student-b-${suffix}`
const sessionToken = `export-session-secret-${suffix}`
const accountToken = `export-account-secret-${suffix}`
let server
let baseUrl
let superadminCookie
let adminCookie

async function request(urlPath, options = {}) {
  const response = await fetch(`${baseUrl}${urlPath}`, options)
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch {}
  return { response, body, text }
}

async function login(username) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'export-password' })
  })
  assert.equal(result.response.status, 200)
  return result.response.headers.get('set-cookie')?.split(';')[0]
}

before(async () => {
  await initializeServerDatabase()
  const password = await hashPassword('export-password')
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolA, 'Export School A', '', '', 'EA'])
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolB, 'Export School B', '', '', 'EB'])
  for (const [id, username, name, role, schoolId] of [
    [superadminId, superadminId, 'Export Superadmin', 'superadmin', ''],
    [adminA, adminA, 'Export Admin A', 'admin', schoolA],
    [adminB, adminB, 'Export Admin B', 'admin', schoolB]
  ]) {
    await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, password, name, role, '', '', '', schoolId, 'active'])
  }
  await run('INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [studentA, 'Export Student A', 'Grade 1', 'A', 'Female', schoolA])
  await run('INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
    [studentB, 'Export Student B', 'Grade 1', 'A', 'Male', schoolB])
  await run('INSERT INTO auth_sessions (id, user_id, impersonator_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
    [`export-session-${suffix}`, adminA, '', sessionToken, '2099-01-01 00:00:00'])
  await run('INSERT INTO account_tokens (id, user_id, token_type, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
    [`export-token-${suffix}`, adminA, 'reset', accountToken, '2099-01-01 00:00:00'])

  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
  superadminCookie = await login(superadminId)
  adminCookie = await login(adminA)
})

after(async () => {
  await run('DELETE FROM audit_logs WHERE target_school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM school_archive_user_status WHERE school_id IN (?, ?)', [schoolA, schoolB])
  await run('DELETE FROM account_tokens WHERE id = ?', [`export-token-${suffix}`])
  await run('DELETE FROM auth_sessions WHERE id = ?', [`export-session-${suffix}`])
  await run('DELETE FROM students WHERE id IN (?, ?)', [studentA, studentB])
  await run('DELETE FROM users WHERE id IN (?, ?, ?)', [superadminId, adminA, adminB])
  await run('DELETE FROM schools WHERE id IN (?, ?)', [schoolA, schoolB])
  await new Promise(resolve => server.close(resolve))
})

test('only superadmins can export a school snapshot', async () => {
  const denied = await request(`/api/schools/${schoolA}/export`, { headers: { Cookie: adminCookie } })
  assert.equal(denied.response.status, 403)

  const exported = await request(`/api/schools/${schoolA}/export`, { headers: { Cookie: superadminCookie } })
  assert.equal(exported.response.status, 200)
  assert.match(exported.response.headers.get('content-type') || '', /^application\/json; charset=utf-8/i)
  assert.equal(exported.response.headers.get('content-disposition'), `attachment; filename="elytrack-school-${schoolA}-${new Date().toISOString().slice(0, 10)}.json"`)

  const snapshot = exported.body
  assert.equal(snapshot.format, 'elytrack-school-export')
  assert.equal(snapshot.school.id, schoolA)
  assert.ok(snapshot.data.users.some(user => user.id === adminA))
  assert.ok(!snapshot.data.users.some(user => user.id === adminB))
  assert.ok(snapshot.data.students.some(student => student.id === studentA))
  assert.ok(!snapshot.data.students.some(student => student.id === studentB))
  assert.ok(snapshot.data.audit_logs.some(log => log.action === 'school.export'))
  assert.equal(snapshot.data.auth_sessions, undefined)
  assert.equal(snapshot.data.account_tokens, undefined)
  assert.doesNotMatch(exported.text, new RegExp(sessionToken))
  assert.doesNotMatch(exported.text, new RegExp(accountToken))
  for (const user of snapshot.data.users) assert.equal(Object.hasOwn(user, 'password'), false)
})

test('permanent deletion requires a prior export', async () => {
  const denied = await request(`/api/schools/${schoolB}?userId=${encodeURIComponent(superadminId)}&userRole=superadmin`, {
    method: 'DELETE',
    headers: { Cookie: superadminCookie }
  })
  assert.equal(denied.response.status, 409)
  assert.match(denied.body.error, /Export this school before permanent deletion/)
})

test('archived schools remain exportable before permanent deletion', async () => {
  const archived = await request(`/api/schools/${schoolA}/archive`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: superadminCookie },
    body: JSON.stringify({ archived: true, reason: 'Export before deletion' })
  })
  assert.equal(archived.response.status, 200)

  const exported = await request(`/api/schools/${schoolA}/export`, { headers: { Cookie: superadminCookie } })
  assert.equal(exported.response.status, 200)
  assert.equal(exported.body.school.id, schoolA)
  assert.equal(exported.body.school.archived_at !== null, true)
})
