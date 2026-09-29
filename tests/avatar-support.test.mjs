import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8').replace(/\r\n/g, '\n')
}

test('avatar migration is append-only and does not seed or rewrite users', () => {
  const migration = read('migrations/020_user_avatar_url.mjs')
  assert.match(migration, /export const id = '020_user_avatar_url'/)
  assert.match(migration, /ALTER TABLE users ADD COLUMN avatar_url/)
  assert.match(migration, /isMysql/)
  assert.doesNotMatch(migration, /INSERT INTO|UPDATE users/i)
})

test('avatar support is database-backed across the API, session, Prisma schema, and settings UI', () => {
  const db = read('db.js')
  const schema = read('prisma/schema.prisma')
  const users = read('routes/users.js')
  const sessions = read('lib/sessions.js')
  const settings = read('src/views/Settings.vue')
  const app = read('src/App.vue')

  assert.match(db, /avatar_url/)
  assert.match(schema, /avatarUrl\s+String.*@map\("avatar_url"\)/)
  assert.match(users, /MAX_AVATAR_URL_LENGTH = 2048/)
  assert.match(users, /avatar_url/)
  assert.match(sessions, /u\.avatar_url/)
  assert.match(settings, /profile\.avatar_url/)
  assert.match(app, /auth\.user\?\.avatar_url/)
})

test('avatar validation permits HTTPS and local relative paths but rejects unsafe schemes', () => {
  const users = read('routes/users.js')
  assert.match(users, /url\.protocol === 'https:'/)
  assert.match(users, /value\.startsWith\('\/'\)/)
  assert.match(users, /Avatar URL must use HTTPS or be a local relative path/)
})
