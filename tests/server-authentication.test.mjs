import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import app, { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'
import { hashToken } from '../lib/sessions.js'

const suffix = randomUUID()
const userId = `session-user-${suffix}`
const username = `session-user-${suffix}`
let server
let baseUrl

function cookieFrom(response) {
  return response.headers.get('set-cookie')?.split(';')[0] || ''
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
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, username, await hashPassword('session-password'), 'Session User', 'admin', '', '', '', '']
  )
  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await run('DELETE FROM auth_sessions WHERE user_id = ?', [userId])
  await run('DELETE FROM users WHERE id = ?', [userId])
  await new Promise(resolve => server.close(resolve))
})

test('login establishes a server-side session and /me restores it', async () => {
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password: 'session-password' })
  })

  assert.equal(login.response.status, 200)
  assert.equal(login.body.user.id, userId)
  const cookie = cookieFrom(login.response)
  assert.match(cookie, /^elytrack_session=/)

  const me = await request('/api/auth/me', { headers: { cookie } })
  assert.equal(me.response.status, 200)
  assert.equal(me.body.user.id, userId)
  assert.match(me.response.headers.get('set-cookie') || '', /^elytrack_session=/)
})

test('logout revokes the session cookie', async () => {
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password: 'session-password' })
  })
  const cookie = cookieFrom(login.response)
  assert.match(cookie, /^elytrack_session=/)

  const logout = await request('/api/auth/logout', {
    method: 'POST',
    headers: { cookie }
  })
  assert.equal(logout.response.status, 200)

  const me = await request('/api/auth/me', { headers: { cookie } })
  assert.equal(me.response.status, 401)
  const tokenHash = hashToken(cookie.split('=')[1])
  const revoked = await query('SELECT revoked_at FROM auth_sessions WHERE user_id = ? AND token_hash = ?', [userId, tokenHash])
  assert.equal(revoked.length, 1)
  assert.ok(revoked[0].revoked_at)
})

test('production rejects caller-supplied identity when no session exists', async () => {
  const previous = process.env.NODE_ENV
  const previousLegacy = process.env.ALLOW_LEGACY_AUTH
  process.env.NODE_ENV = 'production'
  delete process.env.ALLOW_LEGACY_AUTH
  try {
    const response = await request('/api/users', {
      headers: {
        'x-user-id': userId,
        'x-user-role': 'superadmin'
      }
    })
    assert.equal(response.response.status, 401)
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous
    if (previousLegacy === undefined) delete process.env.ALLOW_LEGACY_AUTH
    else process.env.ALLOW_LEGACY_AUTH = previousLegacy
  }
})
