import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import app, { initializeServerDatabase } from '../server.js'
import { run, query } from '../db.js'
import { getRuntimeSetting } from '../lib/runtimeSettings.js'

let server
let baseUrl
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`

const schoolId = `test-school-cfg-${suffix}`
const superadminId = `super-cfg-${suffix}`
const adminId = `admin-cfg-${suffix}`
const teacherOnlineId = `teach-on-${suffix}`
const teacherOfflineId = `teach-off-${suffix}`

function headers(userId, role) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId,
    'x-user-role': role
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`
  const res = await fetch(url, options)
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { response: res, body }
}

before(async () => {
  await initializeServerDatabase()

  // Seed test school
  await run(
    'INSERT INTO schools (id, name, school_id) VALUES (?, ?, ?)',
    [schoolId, `Config School ${suffix}`, `CFG-${suffix}`]
  )

  // Seed users
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [superadminId, `super-${suffix}`, 'hash', 'Super Admin Config', 'superadmin', '', '', '', '', 'super@cfg.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [adminId, `admin-${suffix}`, 'hash', 'Admin Config', 'admin', '', '', '', schoolId, 'admin@cfg.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherOnlineId, `teach1-${suffix}`, 'hash', 'Online Teacher', 'teacher', 'Grade 7', 'A', '', schoolId, 't1@cfg.com']
  )
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherOfflineId, `teach2-${suffix}`, 'hash', 'Offline Teacher', 'teacher', 'Grade 8', 'B', '', schoolId, 't2@cfg.com']
  )

  // Seed active session for teacherOnlineId
  await run(
    `INSERT INTO auth_sessions (id, user_id, impersonator_id, token_hash, expires_at, created_at, last_seen_at, revoked_at)
     VALUES (?, ?, '', ?, datetime('now', '+2 hours'), datetime('now'), datetime('now'), NULL)`,
    [`sess-on-${suffix}`, teacherOnlineId, `hash-on-${suffix}`]
  )

  // Seed expired/revoked session for teacherOfflineId
  await run(
    `INSERT INTO auth_sessions (id, user_id, impersonator_id, token_hash, expires_at, created_at, last_seen_at, revoked_at)
     VALUES (?, ?, '', ?, datetime('now', '-2 hours'), datetime('now', '-3 hours'), datetime('now', '-3 hours'), datetime('now', '-2 hours'))`,
    [`sess-off-${suffix}`, teacherOfflineId, `hash-off-${suffix}`]
  )

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await run('DELETE FROM system_error_logs WHERE school_id = ? OR user_id IN (?, ?, ?, ?)', [schoolId, superadminId, adminId, teacherOnlineId, teacherOfflineId])
  await run('DELETE FROM auth_sessions WHERE user_id IN (?, ?, ?, ?)', [superadminId, adminId, teacherOnlineId, teacherOfflineId])
  await run('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [superadminId, adminId, teacherOnlineId, teacherOfflineId])
  await run('DELETE FROM schools WHERE id = ?', [schoolId])
})

test('Runtime System Settings: Configure dynamically without server restart', async () => {
  // 1. Initial settings
  const initialGet = await request('/api/settings', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(initialGet.response.status, 200)

  // 2. Superadmin updates runtime settings
  const updateRes = await request('/api/settings', {
    method: 'PUT',
    headers: headers(superadminId, 'superadmin'),
    body: JSON.stringify({
      settings: {
        app_name: 'ElyTrack Enterprise Pro',
        support_email: 'support-live@elytrack.org',
        session_lifetime_minutes: 240,
        license_reminder_days: 14,
        maintenance_mode: '1',
        error_reporting_enabled: '1',
        system_announcement: 'Scheduled upgrade notice'
      }
    })
  })
  assert.equal(updateRes.response.status, 200)
  assert.equal(updateRes.body.success, true)

  // 3. Immediately inspect runtime cache in memory without restarting
  assert.equal(getRuntimeSetting('app_name'), 'ElyTrack Enterprise Pro')
  assert.equal(getRuntimeSetting('support_email'), 'support-live@elytrack.org')
  assert.equal(getRuntimeSetting('session_lifetime_minutes'), '240')
  assert.equal(getRuntimeSetting('license_reminder_days'), '14')
  assert.equal(getRuntimeSetting('maintenance_mode'), '1')

  // 4. Verify GET /api/settings immediately serves the updated values
  const refreshedGet = await request('/api/settings', {
    headers: headers(superadminId, 'superadmin')
  })
  assert.equal(refreshedGet.response.status, 200)
  assert.equal(refreshedGet.body.app_name, 'ElyTrack Enterprise Pro')
  assert.equal(refreshedGet.body.support_email, 'support-live@elytrack.org')
  assert.equal(refreshedGet.body.session_lifetime_minutes, 240)
  assert.equal(refreshedGet.body.license_reminder_days, 14)
  assert.equal(refreshedGet.body.maintenance_mode, true)
})

test('User Management: Real-time Online and Offline presence detection', async () => {
  const usersRes = await request(`/api/users?schoolId=${schoolId}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(usersRes.response.status, 200)
  assert.ok(Array.isArray(usersRes.body))

  const onlineTeacher = usersRes.body.find(u => u.id === teacherOnlineId)
  assert.ok(onlineTeacher, 'Online teacher should be found in list')
  assert.equal(onlineTeacher.is_online, true, 'User with recent active session must be flagged is_online=true')

  const offlineTeacher = usersRes.body.find(u => u.id === teacherOfflineId)
  assert.ok(offlineTeacher, 'Offline teacher should be found in list')
  assert.equal(offlineTeacher.is_online, false, 'User with revoked/expired session must be flagged is_online=false')

  // The caller making the request is always online
  const currentAdmin = usersRes.body.find(u => u.id === adminId)
  assert.ok(currentAdmin)
  assert.equal(currentAdmin.is_online, true, 'Current acting user must be flagged is_online=true')
})

test('Error Reporting & Management: Complete incident lifecycle', async () => {
  // 1. Report client-side frontend error
  const reportRes = await request('/api/errors/report', {
    method: 'POST',
    headers: headers(teacherOnlineId, 'teacher'),
    body: JSON.stringify({
      message: 'Uncaught TypeError: Cannot read properties of undefined (reading scores)',
      stack: 'TypeError: at Component.vue:42:15\n at renderComponent.js:10:5',
      path: '/class-record',
      component: 'ClassRecord.vue',
      severity: 'error'
    })
  })
  assert.equal(reportRes.response.status, 201)
  assert.equal(reportRes.body.success, true)
  const errorId = reportRes.body.id
  assert.ok(errorId, 'Error ID should be returned')

  // 2. Fetch error statistics
  const statsRes = await request(`/api/errors/stats?schoolId=${schoolId}`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(statsRes.response.status, 200)
  assert.ok(statsRes.body.total_errors >= 1)
  assert.ok(statsRes.body.unresolved_count >= 1)

  // 3. List error logs with status filter
  const listRes = await request(`/api/errors?schoolId=${schoolId}&status=unresolved`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(listRes.response.status, 200)
  assert.ok(listRes.body.errors.some(e => e.id === errorId))
  const reportedItem = listRes.body.errors.find(e => e.id === errorId)
  assert.equal(reportedItem.error_type, 'client')
  assert.equal(reportedItem.status, 'unresolved')

  // 4. Update status to investigating and then resolved with notes
  const updateStatusRes = await request(`/api/errors/${errorId}/status`, {
    method: 'PUT',
    headers: headers(adminId, 'admin'),
    body: JSON.stringify({
      status: 'resolved',
      resolution_notes: 'Fixed undefined scores guard in ClassRecord.vue'
    })
  })
  assert.equal(updateStatusRes.response.status, 200)
  assert.equal(updateStatusRes.body.status, 'resolved')

  // 5. Verify status is updated
  const verifiedList = await request(`/api/errors?schoolId=${schoolId}&status=resolved`, {
    headers: headers(adminId, 'admin')
  })
  assert.equal(verifiedList.response.status, 200)
  const resolvedItem = verifiedList.body.errors.find(e => e.id === errorId)
  assert.ok(resolvedItem)
  assert.equal(resolvedItem.status, 'resolved')
  assert.equal(resolvedItem.resolution_notes, 'Fixed undefined scores guard in ClassRecord.vue')

  // 6. Delete the resolved error record
  const deleteRes = await request(`/api/errors/${errorId}`, {
    method: 'DELETE',
    headers: headers(adminId, 'admin')
  })
  assert.equal(deleteRes.response.status, 200)
  assert.equal(deleteRes.body.success, true)
})
