// Migration: 008_plan_billing_months.mjs
// Description: Stores the annual billing duration for each subscription plan.

export const id = '008_plan_billing_months'
export const description = 'Add database-backed plan billing duration'

export async function up({ run, isMysql }) {
  if (isMysql) {
    try {
      await run('ALTER TABLE subscription_plans ADD COLUMN billing_months INT NULL')
    } catch (error) {
      if (!/duplicate|exists/i.test(String(error.message))) throw error
    }
  } else {
    try {
      await run('ALTER TABLE subscription_plans ADD COLUMN billing_months INTEGER')
    } catch (error) {
      if (!/duplicate|exists/i.test(String(error.message))) throw error
    }
  }
}

export async function down({ run }) {
  // SQLite cannot safely drop a column on all supported runtime versions.
  // The column is harmless when rolling back on SQLite and is removed on MySQL.
  try { await run('ALTER TABLE subscription_plans DROP COLUMN billing_months') } catch {}
}
