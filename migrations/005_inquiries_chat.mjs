// Migration: 005_inquiries_chat.mjs
// Description: Creates tables for inquiries and chat messages directed to superadmin.

export const id = '005_inquiries_chat'
export const description = 'Create inquiries and inquiry_messages tables'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`CREATE TABLE IF NOT EXISTS inquiries (
      id VARCHAR(96) PRIMARY KEY,
      school_id VARCHAR(96) NOT NULL DEFAULT (''),
      school_name TEXT NOT NULL,
      user_id VARCHAR(96) NOT NULL DEFAULT (''),
      user_name TEXT NOT NULL,
      user_email VARCHAR(255) NOT NULL DEFAULT (''),
      user_role VARCHAR(32) NOT NULL DEFAULT (''),
      category VARCHAR(64) NOT NULL DEFAULT ('general'),
      subject TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT ('open'),
      user_notified INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT NOT NULL DEFAULT (''),
      resolved_by VARCHAR(96) NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)

    await run(`CREATE TABLE IF NOT EXISTS inquiry_messages (
      id VARCHAR(96) PRIMARY KEY,
      inquiry_id VARCHAR(96) NOT NULL,
      sender_id VARCHAR(96) NOT NULL DEFAULT (''),
      sender_name TEXT NOT NULL,
      sender_role VARCHAR(32) NOT NULL DEFAULT (''),
      message TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  } else {
    await run(`CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      school_id TEXT DEFAULT '',
      school_name TEXT DEFAULT '',
      user_id TEXT DEFAULT '',
      user_name TEXT DEFAULT '',
      user_email TEXT DEFAULT '',
      user_role TEXT DEFAULT '',
      category TEXT DEFAULT 'general',
      subject TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      user_notified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT DEFAULT '',
      resolved_by TEXT DEFAULT ''
    )`)

    await run(`CREATE TABLE IF NOT EXISTS inquiry_messages (
      id TEXT PRIMARY KEY,
      inquiry_id TEXT NOT NULL,
      sender_id TEXT DEFAULT '',
      sender_name TEXT DEFAULT '',
      sender_role TEXT DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`)
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS inquiry_messages')
  await run('DROP TABLE IF EXISTS inquiries')
}
