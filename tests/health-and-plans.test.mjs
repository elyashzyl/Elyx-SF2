import test from 'node:test'
import assert from 'node:assert/strict'
import { initDatabase, query } from '../db.js'

test('Database ping and connectivity', async () => {
  await initDatabase()
  const result = await query('SELECT 1 as ping')
  assert.ok(Array.isArray(result), 'Query should return an array')
  assert.equal(result[0]?.ping, 1, 'Ping should return 1')
})

test('Database initialization does not seed subscription plans', async (t) => {
  await initDatabase()
  const plans = await query('SELECT * FROM subscription_plans ORDER BY sort_order ASC')
  if (plans.length > 0 && !process.env.CI) {
    t.skip('Local development database already contains records')
    return
  }
  assert.equal(plans.length, 0, 'Plans must be inserted only by an explicit seed or API action')
})

test('Fresh initialization contains no operational records', async (t) => {
  await initDatabase()
  const userRows = await query('SELECT COUNT(*) AS count FROM users')
  if (Number(userRows[0]?.count || 0) > 0 && !process.env.CI) {
    t.skip('Local development database already contains records')
    return
  }
  for (const table of ['users', 'schools', 'grade_levels', 'students', 'licenses', 'payment_methods']) {
    const rows = await query(`SELECT COUNT(*) AS count FROM ${table}`)
    assert.equal(Number(rows[0]?.count || 0), 0, `${table} must remain empty until explicitly seeded`)
  }
})

test('Licenses table records have valid active/status constraints', async () => {
  await initDatabase()
  const licenses = await query('SELECT * FROM licenses')
  for (const lic of licenses) {
    assert.ok(['active', 'trial', 'suspended', 'expired'].includes(lic.status), `Invalid status: ${lic.status}`)
    assert.ok(lic.max_teachers >= 1, 'Max teachers should be at least 1')
    assert.ok(lic.max_students >= 1, 'Max students should be at least 1')
  }
})
