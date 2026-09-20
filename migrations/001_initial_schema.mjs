// Migration: 001_initial_schema.mjs
// Description: Creates all core tables for ElyTrack school operations.

export const id = '001_initial_schema'
export const description = 'Create all core school operations tables'

export async function up({ run, isMysql }) {
  const mysqlTables = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(96) PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT (''),
      section TEXT NOT NULL DEFAULT (''),
      period TEXT NOT NULL DEFAULT (''),
      school_id TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS schools (
      id VARCHAR(96) PRIMARY KEY,
      name TEXT NOT NULL,
      school_id TEXT NOT NULL DEFAULT (''),
      address TEXT NOT NULL DEFAULT (''),
      short TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS grade_levels (
      id VARCHAR(96) PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade TEXT NOT NULL,
      sections TEXT NOT NULL DEFAULT ('[]'),
      sort INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actor_id TEXT NOT NULL DEFAULT (''),
      actor_name TEXT NOT NULL DEFAULT (''),
      actor_role TEXT NOT NULL DEFAULT (''),
      actor_school_id TEXT NOT NULL DEFAULT (''),
      action TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT (''),
      target_id TEXT NOT NULL DEFAULT (''),
      target_name TEXT NOT NULL DEFAULT (''),
      target_school_id TEXT NOT NULL DEFAULT (''),
      detail TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(96) PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT (''),
      school_id TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS attendance_records (
      id VARCHAR(96) PRIMARY KEY,
      date TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL DEFAULT (''),
      created_by TEXT NOT NULL DEFAULT (''),
      created_by_name TEXT NOT NULL DEFAULT (''),
      summary_data TEXT NOT NULL DEFAULT ('{}'),
      school_id TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS attendance_entries (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      record_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT (''),
      am1 TEXT NOT NULL DEFAULT (''), am2 TEXT NOT NULL DEFAULT (''), am3 TEXT NOT NULL DEFAULT (''),
      am4 TEXT NOT NULL DEFAULT (''), am5 TEXT NOT NULL DEFAULT (''), am6 TEXT NOT NULL DEFAULT (''),
      pm1 TEXT NOT NULL DEFAULT (''), pm2 TEXT NOT NULL DEFAULT (''), pm3 TEXT NOT NULL DEFAULT (''), pm4 TEXT NOT NULL DEFAULT (''),
      reason TEXT NOT NULL DEFAULT (''),
      excused INT NOT NULL DEFAULT 0,
      unexcused INT NOT NULL DEFAULT 0,
      nls INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS monthly_records (
      id VARCHAR(96) PRIMARY KEY,
      month INT NOT NULL,
      year INT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL DEFAULT (''),
      school_head TEXT NOT NULL DEFAULT (''),
      created_by TEXT NOT NULL DEFAULT (''),
      created_by_name TEXT NOT NULL DEFAULT (''),
      school_id TEXT NOT NULL DEFAULT (''),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      summary_data TEXT NOT NULL DEFAULT ('{}'),
      excluded_dates TEXT NOT NULL DEFAULT ('[]')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS monthly_entries (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      record_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      days TEXT NOT NULL DEFAULT ('{}'),
      present INT NOT NULL DEFAULT 0,
      absent INT NOT NULL DEFAULT 0,
      tardy INT NOT NULL DEFAULT 0,
      remarks TEXT NOT NULL DEFAULT (''),
      late_enrollee INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS teacher_schedules (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL DEFAULT (''),
      period TEXT NOT NULL DEFAULT (''),
      start_time TEXT NOT NULL DEFAULT (''),
      end_time TEXT NOT NULL DEFAULT (''),
      subject TEXT NOT NULL DEFAULT (''),
      grade TEXT NOT NULL DEFAULT (''),
      section TEXT NOT NULL DEFAULT (''),
      school_id TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS calendar_events (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT (''),
      type TEXT NOT NULL DEFAULT (''),
      event_date TEXT NOT NULL DEFAULT (''),
      color TEXT NOT NULL DEFAULT (''),
      created_by TEXT NOT NULL DEFAULT (''),
      school_id TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS quarterly_events (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      event_name TEXT NOT NULL DEFAULT (''),
      first_grading TEXT NOT NULL DEFAULT (''),
      second_grading TEXT NOT NULL DEFAULT (''),
      third_grading TEXT NOT NULL DEFAULT (''),
      fourth_grading TEXT NOT NULL DEFAULT (''),
      school_id TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  ]

  const sqliteTables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'teacher')),
      grade TEXT DEFAULT '',
      section TEXT DEFAULT '',
      period TEXT DEFAULT '',
      school_id TEXT DEFAULT ''
    )`,

    `CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      school_id TEXT DEFAULT '',
      address TEXT DEFAULT '',
      short TEXT DEFAULT ''
    )`,

    `CREATE TABLE IF NOT EXISTS grade_levels (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade TEXT NOT NULL,
      sections TEXT NOT NULL DEFAULT '[]',
      sort INTEGER DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      actor_id TEXT DEFAULT '',
      actor_name TEXT DEFAULT '',
      actor_role TEXT DEFAULT '',
      actor_school_id TEXT DEFAULT '',
      action TEXT NOT NULL,
      target_type TEXT DEFAULT '',
      target_id TEXT DEFAULT '',
      target_name TEXT DEFAULT '',
      target_school_id TEXT DEFAULT '',
      detail TEXT DEFAULT ''
    )`,

    `CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      gender TEXT DEFAULT '',
      school_id TEXT DEFAULT ''
    )`,

    `CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL DEFAULT '',
      created_by TEXT DEFAULT '',
      created_by_name TEXT DEFAULT '',
      summary_data TEXT DEFAULT '{}',
      school_id TEXT DEFAULT ''
    )`,

    `CREATE TABLE IF NOT EXISTS attendance_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      name TEXT DEFAULT '',
      am1 TEXT DEFAULT '', am2 TEXT DEFAULT '', am3 TEXT DEFAULT '',
      am4 TEXT DEFAULT '', am5 TEXT DEFAULT '', am6 TEXT DEFAULT '',
      pm1 TEXT DEFAULT '', pm2 TEXT DEFAULT '', pm3 TEXT DEFAULT '', pm4 TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      excused INTEGER DEFAULT 0,
      unexcused INTEGER DEFAULT 0,
      nls INTEGER DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS monthly_records (
      id TEXT PRIMARY KEY,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL DEFAULT '',
      school_head TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_by_name TEXT DEFAULT '',
      school_id TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      summary_data TEXT DEFAULT '{}',
      excluded_dates TEXT DEFAULT '[]'
    )`,

    `CREATE TABLE IF NOT EXISTS monthly_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      days TEXT DEFAULT '{}',
      present INTEGER DEFAULT 0,
      absent INTEGER DEFAULT 0,
      tardy INTEGER DEFAULT 0,
      remarks TEXT DEFAULT '',
      late_enrollee INTEGER DEFAULT 0
    )`,

    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    )`,

    `CREATE TABLE IF NOT EXISTS teacher_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT NOT NULL,
      day_of_week TEXT DEFAULT '',
      period TEXT DEFAULT '',
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      grade TEXT DEFAULT '',
      section TEXT DEFAULT '',
      school_id TEXT DEFAULT ''
    )`,

    `CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      type TEXT DEFAULT '',
      event_date TEXT DEFAULT '',
      color TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      school_id TEXT DEFAULT ''
    )`,

    `CREATE TABLE IF NOT EXISTS quarterly_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT DEFAULT '',
      first_grading TEXT DEFAULT '',
      second_grading TEXT DEFAULT '',
      third_grading TEXT DEFAULT '',
      fourth_grading TEXT DEFAULT '',
      school_id TEXT DEFAULT ''
    )`
  ]

  const statements = isMysql ? mysqlTables : sqliteTables
  for (const sql of statements) {
    await run(sql)
  }
}

export async function down({ run }) {
  const tables = [
    'quarterly_events',
    'calendar_events',
    'teacher_schedules',
    'settings',
    'monthly_entries',
    'monthly_records',
    'attendance_entries',
    'attendance_records',
    'students',
    'audit_logs',
    'grade_levels',
    'schools',
    'users'
  ]

  for (const t of tables) {
    await run(`DROP TABLE IF EXISTS \`${t}\``)
  }
}
