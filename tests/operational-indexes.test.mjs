import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const migration = fs.readFileSync(
  path.join(process.cwd(), 'migrations/014_operational_indexes.mjs'),
  'utf8'
)
const legacyMigration = fs.readFileSync(
  path.join(process.cwd(), 'migrations/002_add_performance_indexes.mjs'),
  'utf8'
)

test('operational MySQL indexes use prefixes for legacy TEXT columns', () => {
  assert.match(migration, /mysql: 'users \(school_id\(96\), role\(32\)\)'/)
  assert.match(migration, /mysql: 'students \(school_id\(96\), enrollment_status\(32\)\)'/)
  assert.match(migration, /mysql: 'attendance_records \(school_id\(96\), date\(10\), grade\(64\), section\(64\)\)'/)
  assert.match(migration, /mysql: 'licenses \(school_id, issued_at\(32\)\)'/)
})

test('legacy performance indexes also use MySQL prefixes for TEXT columns', () => {
  assert.match(legacyMigration, /mysql: 'school_id\(96\)'/)
  assert.match(legacyMigration, /mysql: 'school_id\(96\), grade\(64\), section\(64\)'/)
  assert.match(legacyMigration, /CREATE INDEX.*idx\.mysql/s)
})

test('operational index migration keeps SQLite definitions unmodified', () => {
  assert.match(migration, /sqlite: 'users \(school_id, role\)'/)
  assert.match(migration, /CREATE INDEX IF NOT EXISTS \$\{index\.name\} ON \$\{index\.sqlite\}/)
})
