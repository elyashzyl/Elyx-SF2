// Migration: 027_subscription_lifecycle.mjs
// Description: Create subscription_status_history table for auditing lifecycle states,
// superadmin reviews, and payment approvals. Schema-only, never seeds operational records.

export const id = '027_subscription_lifecycle'
export const description = 'Create subscription_status_history table for audit trail and lifecycle tracking'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS subscription_status_history (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        license_id VARCHAR(96) NOT NULL DEFAULT '',
        request_id VARCHAR(96) NOT NULL DEFAULT '',
        from_status VARCHAR(32) NOT NULL DEFAULT '',
        to_status VARCHAR(32) NOT NULL DEFAULT '',
        actor_id VARCHAR(96) NOT NULL DEFAULT '',
        actor_name VARCHAR(255) NOT NULL DEFAULT '',
        actor_role VARCHAR(32) NOT NULL DEFAULT '',
        notes TEXT NULL,
        metadata LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sub_history_school (school_id, created_at),
        INDEX idx_sub_history_request (request_id)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS subscription_status_history (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL DEFAULT '',
        license_id TEXT DEFAULT '',
        request_id TEXT DEFAULT '',
        from_status TEXT DEFAULT '',
        to_status TEXT NOT NULL DEFAULT '',
        actor_id TEXT DEFAULT '',
        actor_name TEXT DEFAULT '',
        actor_role TEXT DEFAULT '',
        notes TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_sub_history_school ON subscription_status_history (school_id, created_at)')
      await run('CREATE INDEX IF NOT EXISTS idx_sub_history_request ON subscription_status_history (request_id)')
    } catch {}
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS subscription_status_history')
}
