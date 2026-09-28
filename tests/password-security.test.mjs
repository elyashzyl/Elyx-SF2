import test from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword, isPasswordHash } from '../lib/passwords.js'

const PASSWORD = 'correct-horse-battery-staple'

test('password helper hashes and verifies passwords', async () => {
  const hash = await hashPassword(PASSWORD)

  assert.notEqual(hash, PASSWORD)
  assert.equal(isPasswordHash(hash), true)
  assert.equal(await verifyPassword(PASSWORD, hash), true)
  assert.equal(await verifyPassword('wrong-password', hash), false)
})

test('password helper accepts legacy plaintext for one-time migration', async () => {
  assert.equal(isPasswordHash(PASSWORD), false)
  assert.equal(await verifyPassword(PASSWORD, PASSWORD), true)
  assert.equal(await verifyPassword('wrong-password', PASSWORD), false)
})

test('password helper rejects short new passwords', async () => {
  await assert.rejects(() => hashPassword('short'), /at least 8 characters/)
})
