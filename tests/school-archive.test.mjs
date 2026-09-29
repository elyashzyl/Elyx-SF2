import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const suffix = randomUUID()
const schoolId = `archive-school-${suffix}`
const superadminId = `archive-superadmin-${suffix}`
const adminId = `archive-admin-${suffix}`
const teacherId = `archive-teacher-${suffix}`
let server
let baseUrl
let superadminCookie

async function request(urlPath, options = {}) {
  const response = await fetch(`${baseUrl}${urlPath}`, options)
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch {}
  return { response, body }
}

before(async () => {
  await initializeServerDatabase()
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [schoolId, 'Archive Test School', '', '', 'ATS'])
  await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, superadminId, await hashPassword('archive-password'), 'Archive Superadmin', 'superadmin', '', '', '', '', 'active'])
  await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminId, adminId, await hashPassword('archive-password'), 'Archive Admin', 'admin', '', '', '', schoolId, 'active'])
  await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, account_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherId, teacherId, await hashPassword('archive-password'), 'Archive Teacher', 'teacher', '', '', '', schoolId, 'disabled'])
  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
  const login = await request('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: superadminId, password: 'archive-password' })
  })
  assert.equal(login.response.status, 200)
  superadminCookie = login.response.headers.get('set-cookie')?.split(';')[0]
})

after(async () => {
  await run('DELETE FROM auth_sessions WHERE user_id = ?', [superadminId])
  await run('DELETE FROM school_archive_user_status WHERE school_id = ?', [schoolId])
  await run('DELETE FROM users WHERE id IN (?, ?, ?)', [superadminId, adminId, teacherId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
  await new Promise(resolve => server.close(resolve))
})

test('archive migration is schema-only and archive table is present', () => {
  const migration = fs.readFileSync(path.join(process.cwd(), 'migrations/019_school_archive_account_status.mjs'), 'utf8')
  assert.match(migration, /CREATE TABLE IF NOT EXISTS school_archive_user_status/)
  assert.doesNotMatch(migration, /INSERT INTO|UPDATE users|UPDATE schools/i)
})

test('school archive preserves records, disables active users, and restores prior status', async () => {
  const archived = await request(`/api/schools/${schoolId}/archive`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: superadminCookie },
    body: JSON.stringify({ archived: true, reason: 'Archive test' })
  })
  assert.equal(archived.response.status, 200)
  assert.equal(archived.body.school.archive_reason, 'Archive test')

  const school = (await query('SELECT * FROM schools WHERE id = ?', [schoolId]))[0]
  assert.ok(school.archived_at)
  assert.equal((await query('SELECT account_status FROM users WHERE id = ?', [adminId]))[0].account_status, 'disabled')
  assert.equal((await query('SELECT account_status FROM users WHERE id = ?', [teacherId]))[0].account_status, 'disabled')
  assert.equal((await query('SELECT prior_status FROM school_archive_user_status WHERE user_id = ?', [adminId]))[0].prior_status, 'active')
  assert.equal((await query('SELECT COUNT(*) AS count FROM schools WHERE archived_at IS NULL AND id = ?', [schoolId]))[0].count, 0)

  const blocked = await request('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: adminId, password: 'archive-password' })
  })
  assert.equal(blocked.response.status, 403)

  const restored = await request(`/api/schools/${schoolId}/archive`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: superadminCookie },
    body: JSON.stringify({ archived: false })
  })
  assert.equal(restored.response.status, 200)
  assert.equal((await query('SELECT archived_at FROM schools WHERE id = ?', [schoolId]))[0].archived_at, null)
  assert.equal((await query('SELECT account_status FROM users WHERE id = ?', [adminId]))[0].account_status, 'active')
  assert.equal((await query('SELECT account_status FROM users WHERE id = ?', [teacherId]))[0].account_status, 'disabled')
  assert.equal((await query('SELECT COUNT(*) AS count FROM school_archive_user_status WHERE school_id = ?', [schoolId]))[0].count, 0)
})
