// Migration: 012_auth_sessions.mjs
// Description: Add expiring, revocable server-side authentication sessions.

export const id = '012_auth_sessions'
export const description = 'Add expiring server-side authentication sessions'

export async function up({ run, isMysql }) {
  await run(isMysql
    ? `CREATE TABLE IF NOT EXISTS auth_sessions (
        id VARCHAR(96) PRIMARY KEY,
        user_id VARCHAR(96) NOT NULL,
        impersonator_id VARCHAR(96) NOT NULL DEFAULT '',
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        revoked_at DATETIME NULL
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    : `CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        impersonator_id TEXT NOT NULL DEFAULT '',
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
        revoked_at TEXT
      )`)

  if (isMysql) {
    await run('CREATE INDEX idx_auth_sessions_user ON auth_sessions (user_id)')
    await run('CREATE INDEX idx_auth_sessions_expiry ON auth_sessions (expires_at)')
  } else {
    await run('CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions (user_id)')
    await run('CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions (expires_at)')
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS auth_sessions')
}
