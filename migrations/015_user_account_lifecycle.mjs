// Migration: 015_user_account_lifecycle.mjs
// Description: Add account status, lockout, login, and password-change metadata.

export const id = '015_user_account_lifecycle'
export const description = 'Add user account lifecycle metadata and status'

const columns = [
  ['account_status', 'VARCHAR(32) NOT NULL DEFAULT \'active\'', "TEXT NOT NULL DEFAULT 'active'"],
  ['last_login_at', 'DATETIME NULL', 'TEXT'],
  ['password_changed_at', 'DATETIME NULL', 'TEXT'],
  ['failed_login_count', 'INT NOT NULL DEFAULT 0', 'INTEGER NOT NULL DEFAULT 0'],
  ['locked_until', 'DATETIME NULL', 'TEXT']
]

export async function up({ run, isMysql }) {
  for (const [name, mysqlDefinition, sqliteDefinition] of columns) {
    try {
      await run(`ALTER TABLE users ADD COLUMN ${name} ${isMysql ? mysqlDefinition : sqliteDefinition}`)
    } catch (err) {
      if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(String(err.message || err.code || ''))) {
        throw err
      }
    }
  }

  if (isMysql) {
    await run('CREATE INDEX idx_users_account_status ON users (account_status)')
  } else {
    await run('CREATE INDEX IF NOT EXISTS idx_users_account_status ON users (account_status)')
  }
}

export async function down({ run, isMysql }) {
  // SQLite does not support portable DROP COLUMN across the versions supported
  // by the application. This migration is intentionally append-only in normal
  // deployments; rollback is best effort for MySQL.
  if (isMysql) {
    for (const column of columns.map(([name]) => name)) {
      try { await run(`ALTER TABLE users DROP COLUMN ${column}`) } catch {}
    }
    try { await run('DROP INDEX idx_users_account_status ON users') } catch {}
  }
}
