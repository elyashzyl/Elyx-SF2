// Migration: 028_license_expiration_reminders.mjs
// Description: Create license_expiration_reminders table for tracking dispatched
// expiration alerts, interval warnings, deduplication, and notification audit trails.
// Schema-only migration; never seeds or inserts operational records.

export const id = '028_license_expiration_reminders'
export const description = 'Create license_expiration_reminders table for automated expiration notifications'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS license_expiration_reminders (
        id VARCHAR(96) PRIMARY KEY,
        license_id VARCHAR(96) NOT NULL,
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        reminder_type VARCHAR(32) NOT NULL,
        target_expiration_date VARCHAR(32) NOT NULL DEFAULT '',
        days_remaining INT NOT NULL DEFAULT 0,
        channel VARCHAR(32) NOT NULL DEFAULT 'both',
        recipients_count INT NOT NULL DEFAULT 0,
        recipients_data LONGTEXT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'sent',
        notes TEXT NULL,
        sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_license_reminder (license_id, reminder_type, target_expiration_date),
        INDEX idx_reminders_school_sent (school_id, sent_at),
        INDEX idx_reminders_license (license_id)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS license_expiration_reminders (
        id TEXT PRIMARY KEY,
        license_id TEXT NOT NULL,
        school_id TEXT NOT NULL DEFAULT '',
        reminder_type TEXT NOT NULL,
        target_expiration_date TEXT NOT NULL DEFAULT '',
        days_remaining INTEGER NOT NULL DEFAULT 0,
        channel TEXT NOT NULL DEFAULT 'both',
        recipients_count INTEGER NOT NULL DEFAULT 0,
        recipients_data TEXT,
        status TEXT NOT NULL DEFAULT 'sent',
        notes TEXT,
        sent_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(license_id, reminder_type, target_expiration_date)
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_reminders_school_sent ON license_expiration_reminders (school_id, sent_at)')
      await run('CREATE INDEX IF NOT EXISTS idx_reminders_license ON license_expiration_reminders (license_id)')
    } catch {}
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS license_expiration_reminders')
}
