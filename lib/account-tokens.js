import crypto from 'node:crypto'
import { query, run, saveDatabase } from '../db.js'

export const ACCOUNT_TOKEN_TYPES = Object.freeze({
  INVITATION: 'invitation',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification'
})

const TOKEN_BYTES = 32

function expirationHours(type) {
  const envKey = {
    [ACCOUNT_TOKEN_TYPES.INVITATION]: 'INVITATION_TOKEN_EXPIRY_HOURS',
    [ACCOUNT_TOKEN_TYPES.PASSWORD_RESET]: 'PASSWORD_RESET_TOKEN_EXPIRY_HOURS',
    [ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION]: 'EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS'
  }[type]
  const defaults = {
    [ACCOUNT_TOKEN_TYPES.INVITATION]: 72,
    [ACCOUNT_TOKEN_TYPES.PASSWORD_RESET]: 1,
    [ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION]: 24
  }
  const value = Number(process.env[envKey] || defaults[type])
  return Number.isFinite(value) && value > 0 ? Math.min(value, 24 * 30) : defaults[type]
}

function sqlDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

export function hashAccountToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

export async function issueAccountToken({ userId, tokenType, createdBy = '' }) {
  if (!userId || !Object.values(ACCOUNT_TOKEN_TYPES).includes(tokenType)) {
    throw new Error('Invalid account token request')
  }

  // Supersede prior unused tokens of the same type. Raw tokens are never stored.
  await run(
    'UPDATE account_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND token_type = ? AND used_at IS NULL',
    [userId, tokenType]
  )

  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url')
  const expiresAt = new Date(Date.now() + expirationHours(tokenType) * 60 * 60 * 1000)
  await run(
    `INSERT INTO account_tokens
      (id, user_id, token_type, token_hash, expires_at, used_at, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)`,
    [crypto.randomUUID(), userId, tokenType, hashAccountToken(token), sqlDate(expiresAt), createdBy]
  )
  saveDatabase()
  return { token, expiresAt }
}

export async function inspectAccountToken(token, tokenType) {
  if (!token || !Object.values(ACCOUNT_TOKEN_TYPES).includes(tokenType)) return null
  const rows = await query(
    `SELECT t.id, t.user_id, t.token_type, t.expires_at, u.username, u.name, u.email,
            u.role, u.school_id, u.grade, u.section, u.account_status, u.email_verified_at
       FROM account_tokens t
       JOIN users u ON u.id = t.user_id
      WHERE t.token_hash = ? AND t.token_type = ? AND t.used_at IS NULL
        AND t.expires_at > CURRENT_TIMESTAMP
      LIMIT 1`,
    [hashAccountToken(token), tokenType]
  )
  return rows[0] || null
}

export async function consumeAccountToken(token, tokenType) {
  const current = await inspectAccountToken(token, tokenType)
  if (!current) return null

  // The conditional update makes consumption one-time even when two requests
  // race to use the same raw token.
  const result = await run(
    `UPDATE account_tokens
        SET used_at = CURRENT_TIMESTAMP
      WHERE id = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
    [current.id]
  )
  if (result.changes !== 1) return null
  saveDatabase()
  return current
}

export async function revokeAccountTokens(userId, tokenType = null) {
  if (!userId) return
  if (tokenType) {
    await run('UPDATE account_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND token_type = ? AND used_at IS NULL', [userId, tokenType])
  } else {
    await run('UPDATE account_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL', [userId])
  }
  saveDatabase()
}
