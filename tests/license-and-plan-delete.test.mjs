import test from 'node:test'
import assert from 'node:assert/strict'
import { v4 as uuidv4 } from 'uuid'
import { initDatabase, query, run } from '../db.js'

test('License record can be created and deleted', async () => {
  await initDatabase()
  const testId = uuidv4()
  const testKey = 'DEL-TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  
  // Insert dummy license
  await run(
    'INSERT INTO licenses (id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers, max_students) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [testId, 'test-school', testKey, 'campus', 'active', 'annual', 5, 100]
  )

  const inserted = await query('SELECT * FROM licenses WHERE id = ?', [testId])
  assert.equal(inserted.length, 1, 'License should exist after insert')

  // Delete license
  await run('DELETE FROM licenses WHERE id = ?', [testId])

  const afterDelete = await query('SELECT * FROM licenses WHERE id = ?', [testId])
  assert.equal(afterDelete.length, 0, 'License should be deleted')
})

test('Subscription plan can be created and deleted if unassigned', async () => {
  await initDatabase()
  const testPlanId = 'test_plan_' + Math.random().toString(36).substring(2, 8)
  
  await run(
    'INSERT INTO subscription_plans (id, tier, name, description, price_monthly, price_annual_monthly, billing_annual_total, trial_days, max_teachers, max_students) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [testPlanId, testPlanId, 'Temporary Plan', 'Desc', 100, 80, 800, 14, 2, 50]
  )

  const inserted = await query('SELECT * FROM subscription_plans WHERE id = ?', [testPlanId])
  assert.equal(inserted.length, 1, 'Plan should exist after insert')

  await run('DELETE FROM subscription_plans WHERE id = ?', [testPlanId])

  const afterDelete = await query('SELECT * FROM subscription_plans WHERE id = ?', [testPlanId])
  assert.equal(afterDelete.length, 0, 'Plan should be deleted')
})
