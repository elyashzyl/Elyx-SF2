#!/usr/bin/env node

// Deployment smoke checks for Phase 1. Health and school reads are read-only.
// When explicit credentials are supplied, the authentication check creates a
// normal session and may update login metadata; it never creates application
// records, edits school data, deletes rows, or seeds data.

function value(name) {
  return String(process.env[name] ?? '').trim()
}

function fail(message) {
  console.error(`[phase1] ${message}`)
  process.exitCode = 1
}

function baseUrl() {
  const configured = value('PHASE1_BASE_URL') || value('APP_URL')
  if (!configured) return ''
  return configured.replace(/\/+$/, '')
}

function cookieFrom(response) {
  const combined = response.headers.get('set-cookie') || ''
  return combined.split(';')[0].trim()
}

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {})
    }
  })
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch {}
  return { response, body, text }
}

const base = baseUrl()
if (!base) {
  fail('Set PHASE1_BASE_URL or APP_URL to the deployed application URL.')
} else {
  try {
    const health = await request(base, '/api/health')
    if (health.response.status !== 200 || health.body?.status !== 'ok') {
      fail(`Health check failed with HTTP ${health.response.status}.`)
    } else if (health.body?.db !== 'mysql') {
      fail(`Health check reported backend "${health.body?.db || 'unknown'}" instead of MySQL.`)
    } else {
      console.log(`[phase1] Health check passed (MySQL, ${health.body.latencyMs ?? '?'} ms).`)
    }

    const username = value('PHASE1_SMOKE_USERNAME')
    const password = process.env.PHASE1_SMOKE_PASSWORD || ''
    if (!username && !password) {
      console.log('[phase1] Authentication smoke test skipped; no PHASE1_SMOKE_USERNAME/PASSWORD supplied.')
    } else if (!username || !password) {
      fail('Provide both PHASE1_SMOKE_USERNAME and PHASE1_SMOKE_PASSWORD, or neither.')
    } else {
      const login = await request(base, '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (login.response.status !== 200) {
        fail(`Authentication smoke test failed with HTTP ${login.response.status}.`)
      } else {
        const cookie = cookieFrom(login.response)
        const me = await request(base, '/api/auth/me', { headers: { Cookie: cookie } })
        if (me.response.status !== 200 || !me.body?.user) {
          fail(`Session smoke test failed with HTTP ${me.response.status}.`)
        } else {
          const user = me.body.user
          console.log(`[phase1] Session check passed for role ${user.role}.`)

          if (user.role === 'admin') {
            const users = await request(base, '/api/users', { headers: { Cookie: cookie } })
            if (users.response.status !== 200 || !Array.isArray(users.body)) {
              fail(`School-scope user check failed with HTTP ${users.response.status}.`)
            } else if (users.body.some(row => row.school_id !== user.school_id)) {
              fail('School-scope user check found an account outside the authenticated school.')
            } else {
              console.log(`[phase1] School isolation check passed for ${users.body.length} account(s).`)
            }
          } else {
            console.log('[phase1] Superadmin session verified; school-scope user check is not applicable.')
          }
        }
      }
    }
  } catch (error) {
    fail(`Request failed: ${error.code || error.message}`)
  }
}

if (process.exitCode) process.exit(process.exitCode)
