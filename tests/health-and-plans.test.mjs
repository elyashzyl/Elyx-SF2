import test from 'node:test'
import assert from 'node:assert/strict'
import { initDatabase, query } from '../db.js'

test('Database ping and connectivity', async () => {
  await initDatabase()
  const result = await query('SELECT 1 as ping')
  assert.ok(Array.isArray(result), 'Query should return an array')
  assert.equal(result[0]?.ping, 1, 'Ping should return 1')
})

test('Subscription plans are present in the database', async () => {
  await initDatabase()
  const plans = await query('SELECT * FROM subscription_plans ORDER BY sort_order ASC')
  assert.ok(plans.length >= 3, 'Should have at least 3 plans in database')

  const tiers = plans.map(p => p.tier)
  assert.ok(tiers.includes('adviser'), 'Should include adviser tier')
  assert.ok(tiers.includes('campus'), 'Should include campus tier')
  assert.ok(tiers.includes('division'), 'Should include division tier')

  const adviser = plans.find(p => p.tier === 'adviser')
  assert.equal(adviser.price_monthly, 249)
  assert.equal(adviser.price_annual_monthly, 199)
  assert.equal(adviser.trial_days, 14)
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
