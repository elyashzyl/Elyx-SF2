// Migration: 026_communication_and_notifications.mjs
// Description: Add support inquiry priorities, staff assignments, message attachments,
// status history tracking, targeted announcements, and user notification preferences.
// This migration is schema-only and never inserts or modifies operational records.

export const id = '026_communication_and_notifications'
export const description = 'Add inquiry priorities, staff assignments, status history, announcements, and notification preferences'

async function addColumn(run, isMysql, table, name, mysqlDefinition, sqliteDefinition) {
  try {
    await run(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${isMysql ? mysqlDefinition : sqliteDefinition}`)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  // 1. Expand inquiries table with priority and staff assignment
  const inquiryColumns = [
    ['priority', "VARCHAR(32) NOT NULL DEFAULT 'medium'", "TEXT NOT NULL DEFAULT 'medium'"],
    ['assigned_to', "VARCHAR(96) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['assigned_to_name', "VARCHAR(255) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"]
  ]
  for (const [col, mysqlDef, sqliteDef] of inquiryColumns) {
    await addColumn(run, isMysql, 'inquiries', col, mysqlDef, sqliteDef)
  }

  // 2. Expand inquiry_messages with attachment support
  const messageColumns = [
    ['attachment_url', "LONGTEXT NULL", "TEXT NULL"],
    ['attachment_name', "VARCHAR(255) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['attachment_type', "VARCHAR(64) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['attachment_size', "INT NOT NULL DEFAULT 0", "INTEGER NOT NULL DEFAULT 0"]
  ]
  for (const [col, mysqlDef, sqliteDef] of messageColumns) {
    await addColumn(run, isMysql, 'inquiry_messages', col, mysqlDef, sqliteDef)
  }

  // 3. Inquiry status & assignment audit history table
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS inquiry_status_history (
        id VARCHAR(96) PRIMARY KEY,
        inquiry_id VARCHAR(96) NOT NULL,
        old_status VARCHAR(32) NOT NULL,
        new_status VARCHAR(32) NOT NULL,
        changed_by_id VARCHAR(96) NOT NULL DEFAULT '',
        changed_by_name VARCHAR(255) NOT NULL DEFAULT '',
        note TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_inquiry_history_thread (inquiry_id, created_at)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS inquiry_status_history (
        id TEXT PRIMARY KEY,
        inquiry_id TEXT NOT NULL,
        old_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        changed_by_id TEXT NOT NULL DEFAULT '',
        changed_by_name TEXT NOT NULL DEFAULT '',
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_inquiry_history_thread ON inquiry_status_history (inquiry_id, created_at)')
    } catch {}
  }

  // 4. Targeted announcements table
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        target_role VARCHAR(32) NOT NULL DEFAULT 'all',
        target_grade VARCHAR(255) NOT NULL DEFAULT '',
        target_section VARCHAR(255) NOT NULL DEFAULT '',
        priority VARCHAR(32) NOT NULL DEFAULT 'normal',
        author_id VARCHAR(96) NOT NULL DEFAULT '',
        author_name VARCHAR(255) NOT NULL DEFAULT '',
        expires_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_announcements_school_role (school_id, target_role),
        INDEX idx_announcements_date (created_at)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        target_role TEXT NOT NULL DEFAULT 'all',
        target_grade TEXT NOT NULL DEFAULT '',
        target_section TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'normal',
        author_id TEXT NOT NULL DEFAULT '',
        author_name TEXT NOT NULL DEFAULT '',
        expires_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_announcements_school_role ON announcements (school_id, target_role)')
      await run('CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements (created_at)')
    } catch {}
  }

  // 5. Read tracking for announcements
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS announcement_reads (
        id VARCHAR(96) PRIMARY KEY,
        announcement_id VARCHAR(96) NOT NULL,
        user_id VARCHAR(96) NOT NULL,
        read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_announcement_user (announcement_id, user_id),
        INDEX idx_announcement_reads_user (user_id)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS announcement_reads (
        id TEXT PRIMARY KEY,
        announcement_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        read_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(announcement_id, user_id)
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads (user_id)')
    } catch {}
  }

  // 6. User notification preferences
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id VARCHAR(96) PRIMARY KEY,
        email_on_inquiry_reply TINYINT NOT NULL DEFAULT 1,
        email_on_announcement TINYINT NOT NULL DEFAULT 1,
        email_on_status_change TINYINT NOT NULL DEFAULT 1,
        in_app_notifications TINYINT NOT NULL DEFAULT 1,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id TEXT PRIMARY KEY,
        email_on_inquiry_reply INTEGER NOT NULL DEFAULT 1,
        email_on_announcement INTEGER NOT NULL DEFAULT 1,
        email_on_status_change INTEGER NOT NULL DEFAULT 1,
        in_app_notifications INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
  }
}

export async function down({ run }) {
  // Schema changes are append-only.
  return undefined
}
