// Migration: 016_account_tokens_and_email.mjs
// Description: Add account email fields and one-time invitation/reset tokens.

export const id = '016_account_tokens_and_email'
export const description = 'Add account email verification and one-time auth tokens'

export async function up({ run, isMysql }) {
  const columns = isMysql
    ? [
        ['email', "VARCHAR(255) NOT NULL DEFAULT ''"],
        ['email_verified_at', 'DATETIME NULL']
      ]
    : [
        ['email', "TEXT NOT NULL DEFAULT ''"],
        ['email_verified_at', 'TEXT']
      ]

  for (const [name, definition] of columns) {
    try {
      await run(`ALTER TABLE users ADD COLUMN ${name} ${definition}`)
    } catch (err) {
      if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(String(err.message || err.code || ''))) {
        throw err
      }
    }
  }

  await run(isMysql
    ? `CREATE TABLE IF NOT EXISTS account_tokens (
        id VARCHAR(96) PRIMARY KEY,
        user_id VARCHAR(96) NOT NULL,
        token_type VARCHAR(32) NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_by VARCHAR(96) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    : `CREATE TABLE IF NOT EXISTS account_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_type TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_by TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`)

  if (isMysql) {
    for (const statement of [
      'CREATE INDEX idx_account_tokens_user_type ON account_tokens (user_id, token_type)',
      'CREATE INDEX idx_account_tokens_expiry ON account_tokens (expires_at)',
      'CREATE INDEX idx_users_email ON users (email)'
    ]) {
      try { await run(statement) } catch (err) {
        if (!/duplicate|already exists|exists|ER_DUP_KEYNAME/i.test(String(err.message || err.code || ''))) throw err
      }
    }
  } else {
    await run('CREATE INDEX IF NOT EXISTS idx_account_tokens_user_type ON account_tokens (user_id, token_type)')
    await run('CREATE INDEX IF NOT EXISTS idx_account_tokens_expiry ON account_tokens (expires_at)')
    await run('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)')
  }
}

export async function down({ run, isMysql }) {
  if (isMysql) {
    try { await run('DROP INDEX idx_users_email ON users') } catch {}
  } else {
    try { await run('DROP INDEX IF EXISTS idx_users_email') } catch {}
  }
  await run('DROP TABLE IF EXISTS account_tokens')
  // User columns remain append-only for SQLite compatibility and to avoid
  // destructive rollback of account contact data.
}
