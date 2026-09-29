import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashAccountToken } from '../lib/account-tokens.js'

const root = fileURLToPath(new URL('..', import.meta.url))
function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8')
}

test('account tokens are hashed with SHA-256 and never expose raw values', () => {
  const raw = 'example-one-time-token'
  const hash = hashAccountToken(raw)
  assert.equal(hash.length, 64)
  assert.notEqual(hash, raw)
  assert.equal(hash, hashAccountToken(raw))
})

test('account token storage and email fields are append-only migration-backed', () => {
  const migration = read('migrations/016_account_tokens_and_email.mjs')
  assert.match(migration, /account_tokens/)
  assert.match(migration, /token_hash/)
  assert.match(migration, /expires_at/)
  assert.match(migration, /used_at/)
  assert.match(migration, /email_verified_at/)
})

test('account routes use one-time token consumption and non-enumerating reset responses', () => {
  const auth = read('routes/auth.js')
  assert.match(auth, /consumeAccountToken/)
  assert.match(auth, /password-reset\/request/)
  assert.match(auth, /const generic = \{ message:/)
  assert.match(auth, /revokeAllUserSessions\(consumed\.user_id\)/)
})

test('user invitation actions preserve school scope and use configured mail delivery', () => {
  const users = read('routes/users.js')
  assert.match(users, /requestedSchoolId !== me\.school_id/)
  assert.match(users, /account_status\) VALUES.*invited|account_status\)\s*\n\s*VALUES[\s\S]*'invited'/)
  assert.match(users, /issueAccountToken/)
  assert.match(users, /sendAccountEmail/)
})

test('account email links require APP_URL and production SMTP', () => {
  const mailer = read('lib/mailer.js')
  assert.match(mailer, /APP_URL is required/)
  assert.match(mailer, /MAIL_MAILER=log is not allowed in production/)
  assert.match(mailer, /MAIL_HOST, MAIL_PORT, and MAIL_FROM_ADDRESS are required/)
})
