import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8').replace(/\r\n/g, '\n')
}

test('school profile migration is append-only and supports both database backends', () => {
  const migration = read('migrations/017_school_profile_fields.mjs')
  assert.match(migration, /export const id = '017_school_profile_fields'/)
  assert.match(migration, /ALTER TABLE schools ADD COLUMN/)
  assert.match(migration, /isMysql/)
  assert.match(migration, /contact_email/)
  assert.match(migration, /principal_name/)
  assert.match(migration, /school_year/)
  assert.match(migration, /grading_period/)
  assert.doesNotMatch(migration, /INSERT INTO|UPDATE schools/i)
})

test('school profile fields are exposed through scoped API and settings UI', () => {
  const context = read('routes/_context.js')
  const settings = read('routes/settings.js')
  const schools = read('routes/schools.js')
  const db = read('db.js')
  const ui = read('src/views/Settings.vue')

  for (const field of ['contact_email', 'contact_phone', 'division', 'district', 'principal_name', 'school_year', 'grading_period']) {
    assert.ok(context.includes(field), `school response should include ${field}`)
    assert.ok(settings.includes(field), `settings endpoint should support ${field}`)
    assert.ok(schools.includes(field), `school endpoint should support ${field}`)
    assert.ok(db.includes(field), `database layer should support ${field}`)
    assert.ok(ui.includes(`form.${field}`), `settings UI should bind ${field}`)
  }

  assert.match(settings, /requireRole\(req, res, 'superadmin', 'admin'\)/)
  assert.match(settings, /me\.school_id/)
})
