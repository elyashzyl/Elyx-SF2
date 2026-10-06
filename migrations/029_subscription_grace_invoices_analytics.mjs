// Migration: 029_subscription_grace_invoices_analytics.mjs
// Description: Add grace period configuration to plans and licenses, and create
// subscription_invoices table for official billing receipts and transaction auditing.
// Schema-only migration; never seeds or inserts operational records.

export const id = '029_subscription_grace_invoices_analytics'
export const description = 'Add grace period duration columns and subscription_invoices table'

async function addColumn(run, isMysql, table, name, mysqlDefinition, sqliteDefinition) {
  try {
    await run(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${isMysql ? mysqlDefinition : sqliteDefinition}`)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  // 1. Add grace_period_days to subscription_plans
  await addColumn(
    run,
    isMysql,
    'subscription_plans',
    'grace_period_days',
    'INT NOT NULL DEFAULT 5',
    'INTEGER NOT NULL DEFAULT 5'
  )

  // 2. Add grace_period_days to licenses
  await addColumn(
    run,
    isMysql,
    'licenses',
    'grace_period_days',
    'INT NOT NULL DEFAULT 5',
    'INTEGER NOT NULL DEFAULT 5'
  )

  // 3. Create subscription_invoices table
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS subscription_invoices (
        id VARCHAR(96) PRIMARY KEY,
        invoice_number VARCHAR(64) UNIQUE NOT NULL,
        request_id VARCHAR(96) NOT NULL DEFAULT '',
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        license_id VARCHAR(96) NOT NULL DEFAULT '',
        plan_tier VARCHAR(64) NOT NULL DEFAULT '',
        plan_name VARCHAR(255) NOT NULL DEFAULT '',
        billing_cycle VARCHAR(32) NOT NULL DEFAULT 'annual',
        amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        currency VARCHAR(16) NOT NULL DEFAULT 'PHP',
        payment_method_id VARCHAR(96) NOT NULL DEFAULT '',
        payment_channel VARCHAR(128) NOT NULL DEFAULT '',
        payment_reference VARCHAR(255) NOT NULL DEFAULT '',
        status VARCHAR(32) NOT NULL DEFAULT 'paid',
        issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        due_at DATETIME NULL,
        paid_at DATETIME NULL,
        notes TEXT NULL,
        metadata LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_invoices_school (school_id, created_at),
        INDEX idx_invoices_request (request_id)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS subscription_invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        request_id TEXT NOT NULL DEFAULT '',
        school_id TEXT NOT NULL DEFAULT '',
        license_id TEXT NOT NULL DEFAULT '',
        plan_tier TEXT NOT NULL DEFAULT '',
        plan_name TEXT NOT NULL DEFAULT '',
        billing_cycle TEXT NOT NULL DEFAULT 'annual',
        amount REAL NOT NULL DEFAULT 0.00,
        currency TEXT NOT NULL DEFAULT 'PHP',
        payment_method_id TEXT NOT NULL DEFAULT '',
        payment_channel TEXT NOT NULL DEFAULT '',
        payment_reference TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'paid',
        issued_at TEXT NOT NULL DEFAULT (datetime('now')),
        due_at TEXT,
        paid_at TEXT,
        notes TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_invoices_school ON subscription_invoices (school_id, created_at)')
      await run('CREATE INDEX IF NOT EXISTS idx_invoices_request ON subscription_invoices (request_id)')
    } catch {}
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS subscription_invoices')
}
