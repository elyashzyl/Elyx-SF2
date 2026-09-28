// Migration: 010_attendance_locking_and_corrections.mjs
// Description: Adds attendance lock metadata and append-only correction history.

export const id = '010_attendance_locking_and_corrections'
export const description = 'Add attendance locking and correction history'

async function addColumn(run, sql) {
  try {
    await run(sql)
  } catch (error) {
    if (!/duplicate|exists/i.test(String(error.message))) throw error
  }
}

export async function up({ run, isMysql }) {
  const attendanceColumns = isMysql
    ? [
        "ALTER TABLE attendance_records ADD COLUMN locked INT NOT NULL DEFAULT 0",
        "ALTER TABLE attendance_records ADD COLUMN locked_at DATETIME NULL",
        "ALTER TABLE attendance_records ADD COLUMN locked_by VARCHAR(96) NOT NULL DEFAULT ''",
        "ALTER TABLE attendance_records ADD COLUMN reopened_at DATETIME NULL",
        "ALTER TABLE attendance_records ADD COLUMN reopened_by VARCHAR(96) NOT NULL DEFAULT ''",
        "ALTER TABLE attendance_records ADD COLUMN reopen_reason VARCHAR(1000) NOT NULL DEFAULT ''"
      ]
    : [
        "ALTER TABLE attendance_records ADD COLUMN locked INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE attendance_records ADD COLUMN locked_at TEXT",
        "ALTER TABLE attendance_records ADD COLUMN locked_by TEXT DEFAULT ''",
        "ALTER TABLE attendance_records ADD COLUMN reopened_at TEXT",
        "ALTER TABLE attendance_records ADD COLUMN reopened_by TEXT DEFAULT ''",
        "ALTER TABLE attendance_records ADD COLUMN reopen_reason TEXT DEFAULT ''"
      ]

  for (const sql of attendanceColumns) await addColumn(run, sql)
  await addColumn(run, isMysql
    ? "ALTER TABLE schools ADD COLUMN attendance_lock_cutoff VARCHAR(10) NOT NULL DEFAULT ''"
    : "ALTER TABLE schools ADD COLUMN attendance_lock_cutoff TEXT DEFAULT ''")

  await run(isMysql
    ? `CREATE TABLE IF NOT EXISTS attendance_corrections (
        id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        record_id VARCHAR(96) NOT NULL,
        student_id VARCHAR(96) NOT NULL DEFAULT '',
        field VARCHAR(128) NOT NULL,
        old_value LONGTEXT NOT NULL,
        new_value LONGTEXT NOT NULL,
        reason VARCHAR(1000) NOT NULL DEFAULT '',
        actor_id VARCHAR(96) NOT NULL DEFAULT '',
        actor_name VARCHAR(255) NOT NULL DEFAULT '',
        actor_role VARCHAR(32) NOT NULL DEFAULT '',
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    : `CREATE TABLE IF NOT EXISTS attendance_corrections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id TEXT NOT NULL,
        student_id TEXT DEFAULT '',
        field TEXT NOT NULL,
        old_value TEXT DEFAULT '',
        new_value TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        actor_id TEXT DEFAULT '',
        actor_name TEXT DEFAULT '',
        actor_role TEXT DEFAULT '',
        school_id TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
  )

  if (isMysql) {
    try { await run('CREATE INDEX idx_attendance_corrections_record ON attendance_corrections (record_id, created_at)') } catch (error) {
      if (!/duplicate|exists/i.test(String(error.message))) throw error
    }
  } else {
    await run('CREATE INDEX IF NOT EXISTS idx_attendance_corrections_record ON attendance_corrections (record_id, created_at)')
  }
}

export async function down({ run }) {
  try { await run('DROP TABLE IF EXISTS attendance_corrections') } catch {}
  // Existing attendance columns are intentionally retained for safe rollback.
}
