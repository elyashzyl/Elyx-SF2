import crypto from 'node:crypto'
import { query, run, saveDatabase } from '../db.js'

const COOKIE_NAME = 'elytrack_session'
const DEFAULT_LIFETIME_MINUTES = 120

function lifetimeMinutes() {
  const value = Number(process.env.SESSION_LIFETIME || DEFAULT_LIFETIME_MINUTES)
  return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 43200) : DEFAULT_LIFETIME_MINUTES
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function cookieAttributes() {
  const attributes = ['Path=/', 'HttpOnly', 'SameSite=Lax']
  if (process.env.NODE_ENV === 'production') attributes.push('Secure')
  return attributes.join('; ')
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const index = part.indexOf('=')
    if (index < 0) return cookies
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (key) {
      try { cookies[key] = decodeURIComponent(value) } catch { /* ignore malformed cookie values */ }
    }
    return cookies
  }, {})
}

function expiresAt() {
  return new Date(Date.now() + lifetimeMinutes() * 60 * 1000)
}

function sqlDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

export function sessionCookieName() {
  return COOKIE_NAME
}

export async function createSession(userId, options = {}) {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expires = expiresAt()
  await run(`INSERT INTO auth_sessions
    (id, user_id, impersonator_id, token_hash, expires_at, created_at, last_seen_at, revoked_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)`, [
    crypto.randomUUID(), userId, options.impersonatorId || '', tokenHash, sqlDate(expires)
  ])
  saveDatabase()
  return { token, expiresAt: expires }
}

export function setSessionCookie(res, token, expires) {
  const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000))
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Expires=${expires.toUTCString()}; ${cookieAttributes()}`)
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${cookieAttributes()}`)
}

export async function revokeSession(req, res) {
  const token = parseCookies(req.headers.cookie || '')[COOKIE_NAME]
  if (token) {
    await run('UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL', [hashToken(token)])
    saveDatabase()
  }
  clearSessionCookie(res)
}

export async function getSession(req) {
  const token = parseCookies(req.headers.cookie || '')[COOKIE_NAME]
  if (!token) return null
  const rows = await query(`
    SELECT s.id AS session_id, s.user_id, s.impersonator_id, s.expires_at,
           u.id, u.username, u.name, u.role, u.grade, u.section, u.period, u.school_id,
           u.account_status, u.last_login_at, u.password_changed_at, u.email, u.email_verified_at, u.avatar_url
    FROM auth_sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN schools sc ON sc.id = u.school_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP
      AND COALESCE(u.account_status, 'active') = 'active'
      AND (u.role = 'superadmin' OR u.school_id = '' OR sc.archived_at IS NULL)
    LIMIT 1`, [hashToken(token)])
  const session = rows[0]
  if (!session) return null

  const refreshed = expiresAt()
  await run('UPDATE auth_sessions SET expires_at = ?, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [sqlDate(refreshed), session.session_id])
  saveDatabase()
  // Sliding expiry is persisted, but the current cookie is refreshed by callers.
  return {
    sessionId: session.session_id,
    user: {
      id: session.id,
      username: session.username,
      name: session.name,
      role: session.role,
      grade: session.grade,
      section: session.section,
      period: session.period,
      school_id: session.school_id,
      account_status: session.account_status || 'active',
      last_login_at: session.last_login_at || null,
      password_changed_at: session.password_changed_at || null,
      email: session.email || '',
      email_verified_at: session.email_verified_at || null,
      avatar_url: session.avatar_url || ''
    },
    impersonatorId: session.impersonator_id || '',
    token,
    expiresAt: refreshed
  }
}

export async function updateSessionUser(sessionId, userId, impersonatorId = '') {
  await run('UPDATE auth_sessions SET user_id = ?, impersonator_id = ?, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [userId, impersonatorId, sessionId])
  saveDatabase()
}

export async function revokeAllUserSessions(userId) {
  await run('UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL', [userId])
  saveDatabase()
}

export function legacyAuthAllowed() {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_LEGACY_AUTH === '1'
}

export { hashToken }
