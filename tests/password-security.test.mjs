import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, isPasswordHash, legacyPasswordFallbackAllowed } from '../lib/passwords.js'

const PASSWORD = 'correct-horse-battery-staple'

test('password helper hashes and verifies passwords', async () => {
  const hash = await hashPassword(PASSWORD)

  assert.notEqual(hash, PASSWORD)
  assert.equal(isPasswordHash(hash), true)
  assert.equal(await verifyPassword(PASSWORD, hash), true)
  assert.equal(await verifyPassword('wrong-password', hash), false)
})

test('password helper rejects legacy plaintext by default', async () => {
  assert.equal(isPasswordHash(PASSWORD), false)
  assert.equal(await verifyPassword(PASSWORD, PASSWORD), false)
  assert.equal(await verifyPassword('wrong-password', PASSWORD), false)
})

test('password helper allows legacy plaintext only with explicit opt-in outside production', async () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousFlag = process.env.ALLOW_LEGACY_PASSWORD_LOGIN
  process.env.NODE_ENV = 'test'
  process.env.ALLOW_LEGACY_PASSWORD_LOGIN = '1'
  try {
    assert.equal(legacyPasswordFallbackAllowed(), true)
    assert.equal(await verifyPassword(PASSWORD, PASSWORD), true)
    assert.equal(await verifyPassword('wrong-password', PASSWORD), false)
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
    if (previousFlag === undefined) delete process.env.ALLOW_LEGACY_PASSWORD_LOGIN
    else process.env.ALLOW_LEGACY_PASSWORD_LOGIN = previousFlag
  }
})

test('password helper never allows legacy plaintext in production', async () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousFlag = process.env.ALLOW_LEGACY_PASSWORD_LOGIN
  process.env.NODE_ENV = 'production'
  process.env.ALLOW_LEGACY_PASSWORD_LOGIN = '1'
  try {
    assert.equal(legacyPasswordFallbackAllowed(), false)
    assert.equal(await verifyPassword(PASSWORD, PASSWORD), false)
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
    if (previousFlag === undefined) delete process.env.ALLOW_LEGACY_PASSWORD_LOGIN
    else process.env.ALLOW_LEGACY_PASSWORD_LOGIN = previousFlag
  }
})

test('password helper rejects short new passwords', async () => {
  await assert.rejects(() => hashPassword('short'), /at least 8 characters/)
})
