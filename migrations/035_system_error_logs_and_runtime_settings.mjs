// Migration: 035_system_error_logs_and_runtime_settings.mjs
// Description: Create system_error_logs table for comprehensive application error reporting,
// telemetry, and resolution management. Schema-only migration; zero operational seeding.

export const id = '035_system_error_logs_and_runtime_settings'
export const description = 'Create system_error_logs table for error reporting and resolution management'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS system_error_logs (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        user_id VARCHAR(96) NOT NULL DEFAULT '',
        user_name VARCHAR(128) NOT NULL DEFAULT '',
        user_role VARCHAR(32) NOT NULL DEFAULT '',
        error_type VARCHAR(64) NOT NULL DEFAULT 'server',
        severity VARCHAR(32) NOT NULL DEFAULT 'error',
        status VARCHAR(32) NOT NULL DEFAULT 'unresolved',
        message TEXT NOT NULL,
        stack LONGTEXT NULL,
        path VARCHAR(512) NOT NULL DEFAULT '',
        method VARCHAR(16) NOT NULL DEFAULT '',
        status_code INT NOT NULL DEFAULT 500,
        user_agent TEXT NULL,
        ip_address VARCHAR(64) NOT NULL DEFAULT '',
        metadata LONGTEXT NULL,
        resolved_at DATETIME NULL,
        resolved_by VARCHAR(96) NOT NULL DEFAULT '',
        resolution_notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_err_logs_status (status),
        INDEX idx_err_logs_severity (severity),
        INDEX idx_err_logs_school (school_id),
        INDEX idx_err_logs_created (created_at)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS system_error_logs (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL DEFAULT '',
        user_id TEXT NOT NULL DEFAULT '',
        user_name TEXT NOT NULL DEFAULT '',
        user_role TEXT NOT NULL DEFAULT '',
        error_type TEXT NOT NULL DEFAULT 'server',
        severity TEXT NOT NULL DEFAULT 'error',
        status TEXT NOT NULL DEFAULT 'unresolved',
        message TEXT NOT NULL,
        stack TEXT,
        path TEXT NOT NULL DEFAULT '',
        method TEXT NOT NULL DEFAULT '',
        status_code INTEGER NOT NULL DEFAULT 500,
        user_agent TEXT,
        ip_address TEXT NOT NULL DEFAULT '',
        metadata TEXT,
        resolved_at TEXT,
        resolved_by TEXT NOT NULL DEFAULT '',
        resolution_notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_err_logs_status ON system_error_logs (status)')
      await run('CREATE INDEX IF NOT EXISTS idx_err_logs_severity ON system_error_logs (severity)')
      await run('CREATE INDEX IF NOT EXISTS idx_err_logs_school ON system_error_logs (school_id)')
      await run('CREATE INDEX IF NOT EXISTS idx_err_logs_created ON system_error_logs (created_at)')
    } catch {}
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS system_error_logs')
}
