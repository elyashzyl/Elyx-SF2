// Migration: 007_subscription_requests.mjs
// Description: Stores school subscription and payment verification requests.

export const id = '007_subscription_requests'
export const description = 'Create subscription_requests table'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`CREATE TABLE IF NOT EXISTS subscription_requests (
      id VARCHAR(96) PRIMARY KEY,
      school_id VARCHAR(96) NOT NULL DEFAULT (''),
      license_id VARCHAR(96) NOT NULL DEFAULT (''),
      plan_tier VARCHAR(32) NOT NULL DEFAULT ('campus'),
      billing_cycle VARCHAR(32) NOT NULL DEFAULT ('annual'),
      amount INT NOT NULL DEFAULT 0,
      payment_method_id VARCHAR(96) NOT NULL DEFAULT (''),
      payment_reference VARCHAR(255) NOT NULL DEFAULT (''),
      proof_url LONGTEXT,
      status VARCHAR(32) NOT NULL DEFAULT ('pending'),
      requested_by VARCHAR(96) NOT NULL DEFAULT (''),
      reviewed_by VARCHAR(96) NOT NULL DEFAULT (''),
      reviewed_at TEXT NOT NULL DEFAULT (''),
      notes TEXT NOT NULL DEFAULT (''),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  } else {
    await run(`CREATE TABLE IF NOT EXISTS subscription_requests (
      id TEXT PRIMARY KEY,
      school_id TEXT DEFAULT '',
      license_id TEXT DEFAULT '',
      plan_tier TEXT DEFAULT 'campus',
      billing_cycle TEXT DEFAULT 'annual',
      amount INTEGER DEFAULT 0,
      payment_method_id TEXT DEFAULT '',
      payment_reference TEXT DEFAULT '',
      proof_url TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      requested_by TEXT DEFAULT '',
      reviewed_by TEXT DEFAULT '',
      reviewed_at TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`)
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS subscription_requests')
}
