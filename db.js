import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import initSqlJs from 'sql.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env candidates without overriding environment variables already provided
// by Docker, Coolify, or system runtime.
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '..', '.env')
]
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

export function getDbPath() {
  const customPath = process.env.DB_PATH?.trim()
  if (customPath) {
    return path.isAbsolute(customPath) ? customPath : path.resolve(process.cwd(), customPath)
  }
  return path.join(__dirname, 'attendance.db')
}

export let DB_PATH = getDbPath()

// Resolve database URL from DATABASE_URL / MYSQL_URL or individual DB_* / MYSQL_* variables.
// Does NOT require DATABASE_URL to be set, and respects user configuration without forcing defaults.
export function resolveDatabaseUrl() {
  // An explicit non-MySQL driver must win over stale DATABASE_URL values
  // inherited from a deployment environment. This also makes local SQLite
  // migration/testing deterministic without mutating the caller's variables.
  const connection = (process.env.DB_CONNECTION || '').trim().toLowerCase()
  if (connection && connection !== 'mysql' && connection !== 'mariadb') {
    return ''
  }

  const explicitUrl = (
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_CONNECTION_URL ||
    process.env.DB_URL ||
    process.env.MYSQL_URI ||
    process.env.DB_URI
  )?.trim()

  if (explicitUrl) {
    return explicitUrl
  }

  const host = (
    process.env.DB_HOST ||
    process.env.MYSQL_HOST ||
    process.env.DATABASE_HOST ||
    process.env.DB_HOSTNAME ||
    process.env.MYSQL_HOSTNAME
  )?.trim()

  const database = (
    process.env.DB_DATABASE ||
    process.env.DB_NAME ||
    process.env.MYSQL_DATABASE ||
    process.env.DATABASE_NAME
  )?.trim()

  const username = (
    process.env.DB_USERNAME ||
    process.env.DB_USER ||
    process.env.MYSQL_USER ||
    process.env.MYSQL_USERNAME ||
    process.env.DATABASE_USER ||
    process.env.DATABASE_USERNAME
  )?.trim()

  if (!host || !database || !username) {
    return ''
  }

  const port = (process.env.DB_PORT || process.env.MYSQL_PORT || process.env.DATABASE_PORT)?.trim() || '3306'
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.DATABASE_PASSWORD || ''
  const resolved = `mysql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`
  return resolved
}

export let DATABASE_URL = resolveDatabaseUrl()
export let USE_MYSQL = Boolean(DATABASE_URL)

// Reports which backend the process is running on (used by /api/health).
export let DB_MODE = USE_MYSQL ? 'mysql' : 'sqlite'


let mysqlPool = null
let sqlite = null

async function mysqlExec(sql, params = []) {
  const [res] = await mysqlPool.query(sql, params)
  // SELECT returns an array of row objects; writes/DDL return an OkPacket.
  if (Array.isArray(res)) {
    return { rows: res, changes: 0, lastInsertRowid: null }
  }
  return {
    rows: [],
    changes: res.affectedRows ?? 0,
    lastInsertRowid: res.insertId ?? null
  }
}

function sqliteExec(sql, params = []) {
  // CHAR_LENGTH() is used by routes for character-accurate counting on MySQL
  // (where LENGTH() counts bytes and mis-counts multibyte marks like '◢').
  // SQLite's LENGTH() already counts characters, and sql.js lacks
  // CHAR_LENGTH(), so translate it for the SQLite backend.
  sql = sql.replace(/\bCHAR_LENGTH\s*\(/gi, 'LENGTH(')
  const stmt = sqlite.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const isSelect = /^\s*(select|pragma|with|explain)/i.test(sql.trim())
  const rows = []
  let changes = 0
  let lastInsertRowid = null
  if (isSelect) {
    while (stmt.step()) rows.push(stmt.getAsObject())
  } else {
    stmt.step()
    changes = sqlite.getRowsModified()
    if (/^\s*insert/i.test(sql.trim())) {
      lastInsertRowid = sqlite.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0] ?? null
    }
    stmt.free()
    return { rows, changes, lastInsertRowid }
  }
  stmt.free()
  return { rows, changes, lastInsertRowid }
}

async function execSql(sql, params = []) {
  // undefined is an impossible SQL value; normalize to NULL so neither sql.js
  // nor mysql2 (which throws on undefined) chokes when a route omits a param.
  params = params.map(p => (p === undefined ? null : p))
  return USE_MYSQL ? await mysqlExec(sql, params) : sqliteExec(sql, params)
}

function annotateRows(rows, meta) {
  Object.defineProperty(rows, 'insertId', { value: meta.lastInsertRowid, enumerable: true })
  Object.defineProperty(rows, 'lastInsertRowid', { value: meta.lastInsertRowid, enumerable: true })
  Object.defineProperty(rows, 'changes', { value: meta.changes, enumerable: true })
  return rows
}

// async query(sql, params) -> array of row objects (with insertId etc. attached)
export async function query(sql, params = []) {
  const r = await execSql(sql, params)
  return annotateRows(r.rows, r)
}

// async run(sql, params) -> { lastInsertRowid, changes }
export async function run(sql, params = []) {
  const r = await execSql(sql, params)
  return { lastInsertRowid: r.lastInsertRowid ?? null, changes: r.changes ?? 0 }
}

export async function withTransaction(callback, existingTx = null) {
  if (existingTx) {
    return await callback(existingTx)
  }

  if (USE_MYSQL) {
    if (!mysqlPool) {
      throw new Error('MySQL pool is not initialized')
    }
    const conn = await mysqlPool.getConnection()
    await conn.beginTransaction()
    try {
      const tx = {
        async query(sql, params = []) {
          params = params.map(p => (p === undefined ? null : p))
          const [res] = await conn.query(sql, params)
          if (Array.isArray(res)) {
            return annotateRows(res, { changes: 0, lastInsertRowid: null })
          }
          return annotateRows([], { changes: res.affectedRows ?? 0, lastInsertRowid: res.insertId ?? null })
        },
        async run(sql, params = []) {
          params = params.map(p => (p === undefined ? null : p))
          const [res] = await conn.query(sql, params)
          if (Array.isArray(res)) {
            return { lastInsertRowid: null, changes: 0 }
          }
          return { lastInsertRowid: res.insertId ?? null, changes: res.affectedRows ?? 0 }
        }
      }
      const result = await callback(tx)
      await conn.commit()
      return result
    } catch (err) {
      await conn.rollback().catch(() => {})
      throw err
    } finally {
      conn.release()
    }
  } else {
    if (!sqlite) {
      throw new Error('SQLite database is not initialized')
    }
    sqlite.run('BEGIN TRANSACTION')
    try {
      const tx = {
        async query(sql, params = []) {
          params = params.map(p => (p === undefined ? null : p))
          const r = sqliteExec(sql, params)
          return annotateRows(r.rows, r)
        },
        async run(sql, params = []) {
          params = params.map(p => (p === undefined ? null : p))
          const r = sqliteExec(sql, params)
          return { lastInsertRowid: r.lastInsertRowid ?? null, changes: r.changes ?? 0 }
        }
      }
      const result = await callback(tx)
      sqlite.run('COMMIT')
      saveDatabase()
      return result
    } catch (err) {
      try { sqlite.run('ROLLBACK') } catch {}
      throw err
    }
  }
}

// MySQL DDL mirrors the SQLite schema (TEXT/VARCHAR strings, INT numbers,
// DATETIME defaults) so the SQL written for SQLite runs unchanged on MySQL.
// Route code never uses dialect-specific functions (verified), and the app sets
// session sql_mode='' so an omitted NOT NULL column inserts its empty default,
// exactly like SQLite/Postgres did.
const MYSQL_DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(96) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    grade TEXT NOT NULL DEFAULT (''),
    section TEXT NOT NULL DEFAULT (''),
    period TEXT NOT NULL DEFAULT (''),
    school_id TEXT NOT NULL DEFAULT (''),
    account_status VARCHAR(32) NOT NULL DEFAULT ('active'),
    last_login_at DATETIME NULL,
    password_changed_at DATETIME NULL,
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    email VARCHAR(255) NOT NULL DEFAULT (''),
    email_verified_at DATETIME NULL,
    avatar_url VARCHAR(2048) NOT NULL DEFAULT ('')
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS account_tokens (
    id VARCHAR(96) PRIMARY KEY,
    user_id VARCHAR(96) NOT NULL,
    token_type VARCHAR(32) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_by VARCHAR(96) NOT NULL DEFAULT ('') ,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS auth_sessions (
    id VARCHAR(96) PRIMARY KEY,
    user_id VARCHAR(96) NOT NULL,
    impersonator_id VARCHAR(96) NOT NULL DEFAULT (''),
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(96) PRIMARY KEY,
    name TEXT NOT NULL,
    school_id TEXT NOT NULL DEFAULT (''),
    address TEXT NOT NULL DEFAULT (''),
    short TEXT NOT NULL DEFAULT ('') ,
    attendance_lock_cutoff VARCHAR(10) NOT NULL DEFAULT (''),
    contact_email VARCHAR(255) NOT NULL DEFAULT (''),
    contact_phone VARCHAR(64) NOT NULL DEFAULT (''),
    division VARCHAR(255) NOT NULL DEFAULT (''),
    district VARCHAR(255) NOT NULL DEFAULT (''),
    principal_name VARCHAR(255) NOT NULL DEFAULT (''),
    school_year VARCHAR(32) NOT NULL DEFAULT (''),
    grading_period VARCHAR(64) NOT NULL DEFAULT (''),
    logo_url VARCHAR(2048) NOT NULL DEFAULT (''),
    quarter_count INT NOT NULL DEFAULT 4,
    archived_at DATETIME NULL,
    archived_by VARCHAR(96) NOT NULL DEFAULT (''),
    archive_reason VARCHAR(1000) NOT NULL DEFAULT (''),
    sardo_consecutive_absences INT NOT NULL DEFAULT 3,
    sardo_cumulative_absences INT NOT NULL DEFAULT 5
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS school_archive_user_status (
    user_id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL,
    prior_status VARCHAR(32) NOT NULL,
    archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    school_id TEXT NOT NULL DEFAULT ('') ,
    enrollment_status VARCHAR(32) NOT NULL DEFAULT 'active',
    lrn VARCHAR(32) NOT NULL DEFAULT (''),
    birth_date VARCHAR(10) NOT NULL DEFAULT (''),
    address TEXT NULL,
    guardian_name VARCHAR(255) NOT NULL DEFAULT (''),
    guardian_relationship VARCHAR(64) NOT NULL DEFAULT (''),
    guardian_contact VARCHAR(64) NOT NULL DEFAULT (''),
    emergency_contact_name VARCHAR(255) NOT NULL DEFAULT (''),
    emergency_contact_number VARCHAR(64) NOT NULL DEFAULT (''),
    consent_data_sharing TINYINT NOT NULL DEFAULT 1,
    consent_medical_emergency TINYINT NOT NULL DEFAULT 1
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS student_enrollment_events (
    id VARCHAR(96) PRIMARY KEY,
    student_id VARCHAR(96) NOT NULL,
    school_id VARCHAR(96) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    effective_on VARCHAR(10) NOT NULL,
    grade VARCHAR(255) NOT NULL DEFAULT ('') ,
    section VARCHAR(255) NOT NULL DEFAULT ('') ,
    reason VARCHAR(1000) NOT NULL DEFAULT ('') ,
    actor_id VARCHAR(96) NOT NULL DEFAULT ('') ,
    actor_name VARCHAR(255) NOT NULL DEFAULT ('') ,
    actor_role VARCHAR(32) NOT NULL DEFAULT ('') ,
    transfer_group_id VARCHAR(96) NOT NULL DEFAULT ('') ,
    event_sequence BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
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
    school_id TEXT NOT NULL DEFAULT (''),
    locked INT NOT NULL DEFAULT 0,
    locked_at DATETIME NULL,
    locked_by TEXT NOT NULL DEFAULT (''),
    reopened_at DATETIME NULL,
    reopened_by TEXT NOT NULL DEFAULT (''),
    reopen_reason TEXT NOT NULL DEFAULT (''),
    teacher_notes TEXT NULL
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
    excluded_dates TEXT NOT NULL DEFAULT ('[]'),
    include_saturdays TINYINT(1) NOT NULL DEFAULT 0
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
  `CREATE TABLE IF NOT EXISTS attendance_corrections (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    record_id VARCHAR(96) NOT NULL,
    student_id TEXT NOT NULL DEFAULT (''),
    field TEXT NOT NULL,
    old_value TEXT NOT NULL DEFAULT (''),
    new_value TEXT NOT NULL DEFAULT (''),
    reason TEXT NOT NULL DEFAULT (''),
    actor_id TEXT NOT NULL DEFAULT (''),
    actor_name TEXT NOT NULL DEFAULT (''),
    actor_role TEXT NOT NULL DEFAULT (''),
    school_id TEXT NOT NULL DEFAULT (''),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS teacher_schedules (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    day_of_week INT NOT NULL DEFAULT 0,
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
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS licenses (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL DEFAULT (''),
    license_key VARCHAR(64) UNIQUE NOT NULL,
    plan_tier VARCHAR(32) NOT NULL DEFAULT ('campus'),
    status VARCHAR(32) NOT NULL DEFAULT ('active'),
    billing_cycle VARCHAR(32) NOT NULL DEFAULT ('annual'),
    max_teachers INT NOT NULL DEFAULT 50,
    max_students INT NOT NULL DEFAULT 1500,
    issued_at TEXT NOT NULL DEFAULT (''),
    expires_at TEXT NOT NULL DEFAULT (''),
    trial_ends_at TEXT NOT NULL DEFAULT (''),
    features TEXT NOT NULL DEFAULT ('{}'),
    notes TEXT NOT NULL DEFAULT (''),
    grace_period_days INT NOT NULL DEFAULT 5
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(64) PRIMARY KEY,
    tier VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    tag VARCHAR(64) NOT NULL DEFAULT (''),
    description TEXT NOT NULL DEFAULT (''),
    price_monthly INT NOT NULL DEFAULT 0,
    price_annual_monthly INT NOT NULL DEFAULT 0,
    billing_annual_total INT NOT NULL DEFAULT 0,
    billing_months INT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT ('PHP'),
    trial_days INT NOT NULL DEFAULT 14,
    grace_period_days INT NOT NULL DEFAULT 5,
    max_teachers INT NOT NULL DEFAULT 1,
    max_students INT NOT NULL DEFAULT 65,
    is_featured INT NOT NULL DEFAULT 0,
    badge VARCHAR(64) NOT NULL DEFAULT (''),
    cta_text VARCHAR(64) NOT NULL DEFAULT ('Inquire'),
    cta_url VARCHAR(255) NOT NULL DEFAULT (''),
    features TEXT NOT NULL DEFAULT ('[]'),
    modules TEXT NOT NULL DEFAULT ('{}'),
    sort_order INT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL DEFAULT (''),
    school_name TEXT NOT NULL,
    user_id VARCHAR(96) NOT NULL DEFAULT (''),
    user_name TEXT NOT NULL,
    user_email VARCHAR(255) NOT NULL DEFAULT (''),
    user_role VARCHAR(32) NOT NULL DEFAULT (''),
    category VARCHAR(64) NOT NULL DEFAULT ('general'),
    priority VARCHAR(32) NOT NULL DEFAULT ('medium'),
    assigned_to VARCHAR(96) NOT NULL DEFAULT (''),
    assigned_to_name VARCHAR(255) NOT NULL DEFAULT (''),
    subject TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT ('open'),
    user_notified INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT NOT NULL DEFAULT (''),
    resolved_by VARCHAR(96) NOT NULL DEFAULT ('')
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS inquiry_messages (
    id VARCHAR(96) PRIMARY KEY,
    inquiry_id VARCHAR(96) NOT NULL,
    sender_id VARCHAR(96) NOT NULL DEFAULT (''),
    sender_name TEXT NOT NULL,
    sender_role VARCHAR(32) NOT NULL DEFAULT (''),
    message TEXT NOT NULL,
    attachment_url LONGTEXT NULL,
    attachment_name VARCHAR(255) NOT NULL DEFAULT (''),
    attachment_type VARCHAR(64) NOT NULL DEFAULT (''),
    attachment_size INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(96) PRIMARY KEY,
    type VARCHAR(32) NOT NULL DEFAULT ('bank_transfer'),
    bank_name VARCHAR(128) NOT NULL DEFAULT (''),
    account_name VARCHAR(255) NOT NULL DEFAULT (''),
    account_number VARCHAR(128) NOT NULL DEFAULT (''),
    qr_image_url LONGTEXT,
    instructions TEXT NOT NULL DEFAULT (''),
    is_active INT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS subscription_requests (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL DEFAULT (''),
    license_id VARCHAR(96) NOT NULL DEFAULT (''),
    request_type VARCHAR(32) NOT NULL DEFAULT (''),
    plan_tier VARCHAR(32) NOT NULL DEFAULT ('campus'),
    billing_cycle VARCHAR(32) NOT NULL DEFAULT ('annual'),
    amount INT NOT NULL DEFAULT 0,
    payment_method_id VARCHAR(96) NOT NULL DEFAULT (''),
    payment_reference VARCHAR(255) NOT NULL DEFAULT (''),
    proof_url LONGTEXT,
    status VARCHAR(32) NOT NULL DEFAULT ('pending'),
    requested_by VARCHAR(96) NOT NULL DEFAULT (''),
    reviewed_by VARCHAR(96) NOT NULL DEFAULT (''),
    reviewed_at TEXT NOT NULL DEFAULT (''),
    notes TEXT NOT NULL DEFAULT (''),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS student_interventions (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL,
    student_id VARCHAR(96) NOT NULL,
    concern_type VARCHAR(64) NOT NULL,
    assigned_staff_id VARCHAR(96) NOT NULL DEFAULT (''),
    assigned_staff_name VARCHAR(255) NOT NULL DEFAULT (''),
    action_taken TEXT NOT NULL,
    follow_up_date VARCHAR(10) NOT NULL DEFAULT (''),
    resolution_status VARCHAR(32) NOT NULL DEFAULT ('open'),
    notes TEXT NULL,
    created_by VARCHAR(96) NOT NULL DEFAULT (''),
    created_by_name VARCHAR(255) NOT NULL DEFAULT (''),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS student_guardian_contacts (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL,
    student_id VARCHAR(96) NOT NULL,
    contact_date VARCHAR(10) NOT NULL,
    contact_method VARCHAR(64) NOT NULL,
    guardian_name VARCHAR(255) NOT NULL DEFAULT (''),
    guardian_contact VARCHAR(64) NOT NULL DEFAULT (''),
    reason VARCHAR(255) NOT NULL DEFAULT (''),
    outcome TEXT NULL,
    staff_id VARCHAR(96) NOT NULL DEFAULT (''),
    staff_name VARCHAR(255) NOT NULL DEFAULT (''),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS saved_report_views (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL,
    user_id VARCHAR(96) NOT NULL,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(64) NOT NULL DEFAULT ('dashboard'),
    filters_json LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS report_archives (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL,
    created_by VARCHAR(96) NOT NULL DEFAULT (''),
    created_by_name VARCHAR(255) NOT NULL DEFAULT (''),
    report_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    parameters_json LONGTEXT NOT NULL,
    file_format VARCHAR(32) NOT NULL DEFAULT ('csv'),
    file_size INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT ('completed'),
    content_data LONGTEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS report_jobs (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL,
    user_id VARCHAR(96) NOT NULL,
    report_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT ('pending'),
    progress INT NOT NULL DEFAULT 0,
    parameters_json LONGTEXT NOT NULL,
    result_archive_id VARCHAR(96) NOT NULL DEFAULT (''),
    error_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS inquiry_status_history (
    id VARCHAR(96) PRIMARY KEY,
    inquiry_id VARCHAR(96) NOT NULL,
    old_status VARCHAR(32) NOT NULL,
    new_status VARCHAR(32) NOT NULL,
    changed_by_id VARCHAR(96) NOT NULL DEFAULT (''),
    changed_by_name VARCHAR(255) NOT NULL DEFAULT (''),
    note TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL DEFAULT (''),
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    target_role VARCHAR(32) NOT NULL DEFAULT ('all'),
    target_grade VARCHAR(255) NOT NULL DEFAULT (''),
    target_section VARCHAR(255) NOT NULL DEFAULT (''),
    priority VARCHAR(32) NOT NULL DEFAULT ('normal'),
    author_id VARCHAR(96) NOT NULL DEFAULT (''),
    author_name VARCHAR(255) NOT NULL DEFAULT (''),
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS announcement_reads (
    id VARCHAR(96) PRIMARY KEY,
    announcement_id VARCHAR(96) NOT NULL,
    user_id VARCHAR(96) NOT NULL,
    read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_announcement_user (announcement_id, user_id)
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id VARCHAR(96) PRIMARY KEY,
    email_on_inquiry_reply TINYINT NOT NULL DEFAULT 1,
    email_on_announcement TINYINT NOT NULL DEFAULT 1,
    email_on_status_change TINYINT NOT NULL DEFAULT 1,
    in_app_notifications TINYINT NOT NULL DEFAULT 1,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS subscription_status_history (
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
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS license_expiration_reminders (
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
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS subscription_invoices (
    id VARCHAR(96) PRIMARY KEY,
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    request_id VARCHAR(96) NOT NULL DEFAULT (''),
    school_id VARCHAR(96) NOT NULL DEFAULT (''),
    license_id VARCHAR(96) NOT NULL DEFAULT (''),
    plan_tier VARCHAR(64) NOT NULL DEFAULT (''),
    plan_name VARCHAR(255) NOT NULL DEFAULT (''),
    billing_cycle VARCHAR(32) NOT NULL DEFAULT ('annual'),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(16) NOT NULL DEFAULT ('PHP'),
    payment_method_id VARCHAR(96) NOT NULL DEFAULT (''),
    payment_channel VARCHAR(128) NOT NULL DEFAULT (''),
    payment_reference VARCHAR(255) NOT NULL DEFAULT (''),
    status VARCHAR(32) NOT NULL DEFAULT ('paid'),
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at DATETIME NULL,
    paid_at DATETIME NULL,
    notes TEXT NULL,
    metadata LONGTEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_invoices_school (school_id, created_at),
    INDEX idx_invoices_request (request_id)
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS quarterly_terms (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL DEFAULT (''),
    quarter_number INT NOT NULL,
    quarter_name VARCHAR(128) NOT NULL DEFAULT (''),
    school_year VARCHAR(32) NOT NULL DEFAULT (''),
    months VARCHAR(255) NOT NULL DEFAULT (''),
    start_date VARCHAR(10) NOT NULL DEFAULT (''),
    end_date VARCHAR(10) NOT NULL DEFAULT (''),
    target_days INT NOT NULL DEFAULT 50,
    is_active INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quarterly_school_sy (school_id, school_year, quarter_number)
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS grading_subjects (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL DEFAULT (''),
    grade_level VARCHAR(64) NOT NULL DEFAULT (''),
    subject_name VARCHAR(128) NOT NULL,
    subject_code VARCHAR(32) NOT NULL DEFAULT (''),
    weight_ww INT NOT NULL DEFAULT 30,
    weight_pt INT NOT NULL DEFAULT 50,
    weight_qa INT NOT NULL DEFAULT 20,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_grading_subjects_school_grade (school_id, grade_level)
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS learner_grades (
    id VARCHAR(96) PRIMARY KEY,
    school_id VARCHAR(96) NOT NULL DEFAULT (''),
    student_id VARCHAR(96) NOT NULL,
    subject_id VARCHAR(96) NOT NULL,
    school_year VARCHAR(32) NOT NULL DEFAULT (''),
    quarter VARCHAR(8) NOT NULL DEFAULT 'Q1',
    ww_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    ww_total DECIMAL(6,2) NOT NULL DEFAULT 100,
    pt_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    pt_total DECIMAL(6,2) NOT NULL DEFAULT 100,
    qa_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    qa_total DECIMAL(6,2) NOT NULL DEFAULT 50,
    initial_grade DECIMAL(5,2) NOT NULL DEFAULT 0,
    transmuted_grade INT NOT NULL DEFAULT 75,
    remarks VARCHAR(64) NOT NULL DEFAULT 'Passed',
    is_locked INT NOT NULL DEFAULT 0,
    encoded_by VARCHAR(96) NOT NULL DEFAULT (''),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_learner_grades_lookup (school_id, student_id, school_year, quarter),
    INDEX idx_learner_grades_subject (subject_id, school_year, quarter)
  ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
]

// MySQL only allows TEXT default values as DEFAULT ('...') expressions on
// 8.0.13+/MariaDB 10.2+, which older MySQL 5.7 servers reject outright. The
// session non-strict sql_mode below inserts the column type's empty default for
// any omitted column (exactly like SQLite/Postgres did), so the TEXT defaults
// are unnecessary for runtime correctness — strip them for maximum compatibility.
function stripTextDefaults(ddl) {
  return ddl.replace(/\sDEFAULT\s*\(\s*('[^']*')\s*\)/g, '')
}

// Parse mysql:// URLs into a mysql2 config object. Done manually so URL query
// params (sslmode, ssl, ...) never leak into mysql2's own URL parser, which
// warns/errors on unknown keys like "sslmode".
function parseMysqlUrl(url) {
  const u = new URL(url)
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    database: u.pathname ? decodeURIComponent(u.pathname.replace(/^\//, '')) : undefined
  }
}

async function initMysql() {
  const poolCfg = {
    ...parseMysqlUrl(DATABASE_URL),
    connectionLimit: parseInt(process.env.MYSQL_POOL_MAX || '10', 10),
    connectTimeout: 10000,
    dateStrings: true,
    charset: 'utf8mb4_unicode_ci',
    waitForConnections: true
  }
  // Some managed MySQL providers (Aiven, DigitalOcean, etc.) require SSL.
  if (/sslmode=(require|verify-ca|verify-full)|\bssl=(?:true|1|\d+)\b|ssl-mode=required/i.test(DATABASE_URL) || process.env.MYSQL_SSL === '1') {
    poolCfg.ssl = { rejectUnauthorized: process.env.MYSQL_SSL_VERIFY === '1' }
  }

  function createPoolInstance(cfg) {
    const p = mysql.createPool(cfg)
    p.on('connection', conn => {
      conn.query("SET SESSION sql_mode=''", () => {})
    })
    return p
  }

  mysqlPool = createPoolInstance(poolCfg)

  let connected = false
  let attempts = 0
  const maxAttempts = 15

  while (!connected && attempts < maxAttempts) {
    attempts++
    try {
      await mysqlPool.query('SELECT 1')
      connected = true
    } catch (err) {
      const msg = String(err.message || '')
      const code = String(err.code || '')

      // 1. If database does not exist, auto-create it
      if (/ER_BAD_DB_ERROR|Unknown database/i.test(msg) || code === 'ER_BAD_DB_ERROR') {
        console.log(`[db] MySQL database "${poolCfg.database}" does not exist. Creating database...`)
        try {
          const rootCfg = { ...poolCfg }
          delete rootCfg.database
          const tempConn = await mysql.createConnection(rootCfg)
          await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${poolCfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
          await tempConn.end()
          console.log(`[db] MySQL database "${poolCfg.database}" created successfully.`)
          await mysqlPool.end().catch(() => {})
          mysqlPool = createPoolInstance(poolCfg)
          await mysqlPool.query('SELECT 1')
          connected = true
          break
        } catch (createErr) {
          console.warn(`[db] Could not auto-create database "${poolCfg.database}": ${createErr.message}`)
        }
      }

      // 2. SSL negotiation fallback
      if (!poolCfg.ssl && /\b(ssl|tls|pem|certificate)\b/i.test(msg)) {
        console.warn('[db] MySQL requires SSL; retrying with TLS (rejectUnauthorized=false).')
        await mysqlPool.end().catch(() => {})
        poolCfg.ssl = { rejectUnauthorized: false }
        mysqlPool = createPoolInstance(poolCfg)
        continue
      } else if (poolCfg.ssl && /does not support SSL|failed to connect|handshake/i.test(msg)) {
        console.warn('[db] MySQL rejected SSL; retrying without TLS (internal network).')
        await mysqlPool.end().catch(() => {})
        delete poolCfg.ssl
        mysqlPool = createPoolInstance(poolCfg)
        continue
      }

      // 3. Transient connection failures while MySQL boots
      if (attempts < maxAttempts && /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENOTFOUND|connect/i.test(msg)) {
        console.log(`[db] Waiting for MySQL server to become available (attempt ${attempts}/${maxAttempts}: ${msg}). Retrying in 2s...`)
        await new Promise(r => setTimeout(r, 2000))
      } else {
        throw err
      }
    }
  }

  for (const raw of MYSQL_DDL) await mysqlPool.query(stripTextDefaults(raw))
  // Ensure table columns added in later versions exist on MySQL (mirrors initSqlite schema alters)
  await ensureMysqlColumns()
  // Database initialization is schema-only. Versioned migrations handle
  // changes to existing installations. Accounts, schools, grades, plans,
  // licenses, and payment data are created by explicit commands or API actions.
  await migrateToMultiSchoolMysql()
}

async function ensureMysqlColumns() {
  if (!mysqlPool) return
  const alters = [
    ["users", "grade", "VARCHAR(255) DEFAULT ''"],
    ["users", "section", "VARCHAR(255) DEFAULT ''"],
    ["users", "period", "VARCHAR(255) DEFAULT ''"],
    ["users", "school_id", "VARCHAR(96) DEFAULT ''"],
    ["users", "account_status", "VARCHAR(32) NOT NULL DEFAULT 'active'"],
    ["users", "last_login_at", "DATETIME NULL"],
    ["users", "password_changed_at", "DATETIME NULL"],
    ["users", "failed_login_count", "INT NOT NULL DEFAULT 0"],
    ["users", "locked_until", "DATETIME NULL"],
    ["users", "email", "VARCHAR(255) NOT NULL DEFAULT ''"],
    ["users", "email_verified_at", "DATETIME NULL"],
    ["users", "avatar_url", "VARCHAR(2048) NOT NULL DEFAULT ''"],
    ["students", "gender", "VARCHAR(32) DEFAULT ''"],
    ["students", "school_id", "VARCHAR(96) DEFAULT ''"],
    ["students", "enrollment_status", "VARCHAR(32) NOT NULL DEFAULT 'active'"],
    ["monthly_records", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"],
    ["monthly_records", "summary_data", "LONGTEXT"],
    ["monthly_records", "excluded_dates", "LONGTEXT"],
    ["monthly_records", "school_head", "VARCHAR(255) DEFAULT ''"],
    ["monthly_records", "school_id", "VARCHAR(96) DEFAULT ''"],
    ["attendance_records", "school_id", "VARCHAR(96) DEFAULT ''"],
    ["schools", "attendance_lock_cutoff", "VARCHAR(255) DEFAULT ''"],
    ["attendance_records", "locked", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["attendance_records", "locked_at", "DATETIME NULL"],
    ["attendance_records", "locked_by", "VARCHAR(96) DEFAULT ''"],
    ["attendance_records", "reopened_at", "DATETIME NULL"],
    ["attendance_records", "reopened_by", "VARCHAR(96) DEFAULT ''"],
    ["attendance_records", "reopen_reason", "TEXT"],
    ["attendance_records", "teacher_notes", "TEXT NULL"],
    ["monthly_entries", "late_enrollee", "TINYINT(1) DEFAULT 0"],
    ["monthly_records", "include_saturdays", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["schools", "sardo_consecutive_absences", "INT NOT NULL DEFAULT 3"],
    ["schools", "sardo_cumulative_absences", "INT NOT NULL DEFAULT 5"],
    ["students", "lrn", "VARCHAR(32) NOT NULL DEFAULT ''"],
    ["students", "birth_date", "VARCHAR(10) NOT NULL DEFAULT ''"],
    ["students", "address", "TEXT NULL"],
    ["students", "guardian_name", "VARCHAR(255) NOT NULL DEFAULT ''"],
    ["students", "guardian_relationship", "VARCHAR(64) NOT NULL DEFAULT ''"],
    ["students", "guardian_contact", "VARCHAR(64) NOT NULL DEFAULT ''"],
    ["students", "emergency_contact_name", "VARCHAR(255) NOT NULL DEFAULT ''"],
    ["students", "emergency_contact_number", "VARCHAR(64) NOT NULL DEFAULT ''"],
    ["students", "consent_data_sharing", "TINYINT NOT NULL DEFAULT 1"],
    ["students", "consent_medical_emergency", "TINYINT NOT NULL DEFAULT 1"],
    ["inquiries", "priority", "VARCHAR(32) NOT NULL DEFAULT 'medium'"],
    ["inquiries", "assigned_to", "VARCHAR(96) NOT NULL DEFAULT ''"],
    ["inquiries", "assigned_to_name", "VARCHAR(255) NOT NULL DEFAULT ''"],
    ["inquiry_messages", "attachment_url", "LONGTEXT NULL"],
    ["inquiry_messages", "attachment_name", "VARCHAR(255) NOT NULL DEFAULT ''"],
    ["inquiry_messages", "attachment_type", "VARCHAR(64) NOT NULL DEFAULT ''"],
    ["inquiry_messages", "attachment_size", "INT NOT NULL DEFAULT 0"]
  ]

  for (const [tbl, col, def] of alters) {
    try {
      await mysqlPool.query(`ALTER TABLE \`${tbl}\` ADD COLUMN \`${col}\` ${def}`)
    } catch (err) {
      const message = String(err.message || err.code || '')
      const duplicateColumn = /duplicate column|already exists|ER_DUP_FIELDNAME/i.test(message)
      if (!duplicateColumn) {
        // Do not hide permission, connectivity, or malformed-schema errors.
        // Startup must stop before serving requests if an additive repair could
        // not be applied; this does not delete or rewrite existing records.
        throw err
      }
    }
  }
}

async function migrateToMultiSchoolMysql() {
  try {
    const [[cntRows]] = await mysqlPool.query('SELECT COUNT(*) AS cnt FROM schools')
    if ((cntRows?.cnt ?? 0) > 0) return
    const settings = {}
    try {
      const [rows] = await mysqlPool.query('SELECT `key`, value FROM settings')
      if (Array.isArray(rows)) {
        for (const row of rows) settings[row.key] = row.value
      }
    } catch {}
    if (!settings.school_name?.trim()) return
    const schoolId = 'school-' + Date.now().toString(36)
    await mysqlPool.query('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [schoolId, settings.school_name, settings.school_id || '', settings.school_address || '', settings.school_short || ''])
    const tables = ['users', 'students', 'monthly_records', 'attendance_records', 'calendar_events', 'quarterly_events']
    for (const t of tables) {
      try { await mysqlPool.query(`UPDATE ${t} SET school_id = ? WHERE school_id IS NULL OR school_id = ''`, [schoolId]) } catch {}
    }
    try {
      await mysqlPool.query("UPDATE users SET role = 'superadmin' WHERE role = 'admin' AND (school_id = ? OR school_id = '')", [schoolId])
    } catch {}
  } catch (err) {
    console.error('Multi-school migration error:', err.message)
  }
}

// Grade levels and sections are school-owned data. New schools remain empty
// until an administrator configures them or an explicit seed supplies them.

async function initSqlite() {
  const SQL = await initSqlJs()
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    sqlite = new SQL.Database(buffer)
  } else {
    sqlite = new SQL.Database()
  }
  for (const ddl of [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'teacher')),
      grade TEXT DEFAULT '',
      section TEXT DEFAULT '',
      period TEXT DEFAULT '',
      school_id TEXT DEFAULT '',
      account_status TEXT NOT NULL DEFAULT 'active',
      last_login_at TEXT,
      password_changed_at TEXT,
      failed_login_count INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      email TEXT NOT NULL DEFAULT '',
      email_verified_at TEXT,
      avatar_url TEXT NOT NULL DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS account_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_type TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      impersonator_id TEXT NOT NULL DEFAULT '',
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      revoked_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      school_id TEXT DEFAULT '',
      address TEXT DEFAULT '',
      short TEXT DEFAULT '',
      attendance_lock_cutoff TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      division TEXT DEFAULT '',
      district TEXT DEFAULT '',
      principal_name TEXT DEFAULT '',
      school_year TEXT DEFAULT '',
      grading_period TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      quarter_count INTEGER NOT NULL DEFAULT 4,
      archived_at TEXT,
      archived_by TEXT DEFAULT '',
      archive_reason TEXT DEFAULT '',
      sardo_consecutive_absences INTEGER NOT NULL DEFAULT 3,
      sardo_cumulative_absences INTEGER NOT NULL DEFAULT 5
    )`,
    `CREATE TABLE IF NOT EXISTS school_archive_user_status (
      user_id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      prior_status TEXT NOT NULL,
      archived_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      school_id TEXT DEFAULT '',
      enrollment_status TEXT NOT NULL DEFAULT 'active',
      lrn TEXT NOT NULL DEFAULT '',
      birth_date TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      guardian_name TEXT NOT NULL DEFAULT '',
      guardian_relationship TEXT NOT NULL DEFAULT '',
      guardian_contact TEXT NOT NULL DEFAULT '',
      emergency_contact_name TEXT NOT NULL DEFAULT '',
      emergency_contact_number TEXT NOT NULL DEFAULT '',
      consent_data_sharing INTEGER NOT NULL DEFAULT 1,
      consent_medical_emergency INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS student_enrollment_events (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL,
      effective_on TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT '',
      section TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      actor_id TEXT NOT NULL DEFAULT '',
      actor_name TEXT NOT NULL DEFAULT '',
      actor_role TEXT NOT NULL DEFAULT '',
      transfer_group_id TEXT NOT NULL DEFAULT '',
      event_sequence INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL,
      created_by TEXT DEFAULT '',
      created_by_name TEXT DEFAULT '',
      summary_data TEXT DEFAULT '{}',
      school_id TEXT DEFAULT '',
      locked INTEGER NOT NULL DEFAULT 0,
      locked_at TEXT,
      locked_by TEXT DEFAULT '',
      reopened_at TEXT,
      reopened_by TEXT DEFAULT '',
      reopen_reason TEXT DEFAULT '',
      teacher_notes TEXT DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS monthly_records (
      id TEXT PRIMARY KEY,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL,
      school_head TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_by_name TEXT DEFAULT '',
      school_id TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      summary_data TEXT DEFAULT '{}',
      excluded_dates TEXT DEFAULT '[]',
      include_saturdays INTEGER NOT NULL DEFAULT 0
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
    `CREATE TABLE IF NOT EXISTS attendance_corrections (
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
    )`,
    `CREATE TABLE IF NOT EXISTS teacher_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT NOT NULL,
      day_of_week INTEGER DEFAULT 0,
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
    )`,
    `CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      school_id TEXT DEFAULT '',
      license_key TEXT UNIQUE NOT NULL,
      plan_tier TEXT DEFAULT 'campus',
      status TEXT DEFAULT 'active',
      billing_cycle TEXT DEFAULT 'annual',
      max_teachers INTEGER DEFAULT 50,
      max_students INTEGER DEFAULT 1500,
      issued_at TEXT DEFAULT '',
      expires_at TEXT DEFAULT '',
      trial_ends_at TEXT DEFAULT '',
      features TEXT DEFAULT '{}',
      notes TEXT DEFAULT '',
      grace_period_days INTEGER DEFAULT 5
    )`,
    `CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      tier TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tag TEXT DEFAULT '',
      description TEXT DEFAULT '',
      price_monthly INTEGER DEFAULT 0,
      price_annual_monthly INTEGER DEFAULT 0,
      billing_annual_total INTEGER DEFAULT 0,
      billing_months INTEGER,
      currency TEXT DEFAULT 'PHP',
      trial_days INTEGER DEFAULT 14,
      grace_period_days INTEGER DEFAULT 5,
      max_teachers INTEGER DEFAULT 1,
      max_students INTEGER DEFAULT 65,
      is_featured INTEGER DEFAULT 0,
      badge TEXT DEFAULT '',
      cta_text TEXT DEFAULT 'Inquire',
      cta_url TEXT DEFAULT '',
      features TEXT DEFAULT '[]',
      modules TEXT DEFAULT '{}',
      sort_order INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      school_id TEXT DEFAULT '',
      school_name TEXT DEFAULT '',
      user_id TEXT DEFAULT '',
      user_name TEXT DEFAULT '',
      user_email TEXT DEFAULT '',
      user_role TEXT DEFAULT '',
      category TEXT DEFAULT 'general',
      priority TEXT DEFAULT 'medium',
      assigned_to TEXT DEFAULT '',
      assigned_to_name TEXT DEFAULT '',
      subject TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      user_notified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT DEFAULT '',
      resolved_by TEXT DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS inquiry_messages (
      id TEXT PRIMARY KEY,
      inquiry_id TEXT NOT NULL,
      sender_id TEXT DEFAULT '',
      sender_name TEXT DEFAULT '',
      sender_role TEXT DEFAULT '',
      message TEXT NOT NULL,
      attachment_url TEXT,
      attachment_name TEXT DEFAULT '',
      attachment_type TEXT DEFAULT '',
      attachment_size INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'bank_transfer',
      bank_name TEXT DEFAULT '',
      account_name TEXT DEFAULT '',
      account_number TEXT DEFAULT '',
      qr_image_url TEXT DEFAULT '',
      instructions TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS subscription_requests (
      id TEXT PRIMARY KEY,
      school_id TEXT DEFAULT '',
      license_id TEXT DEFAULT '',
      request_type TEXT DEFAULT '',
      plan_tier TEXT DEFAULT 'campus',
      billing_cycle TEXT DEFAULT 'annual',
      amount INTEGER DEFAULT 0,
      payment_method_id TEXT DEFAULT '',
      payment_reference TEXT DEFAULT '',
      proof_url TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      requested_by TEXT DEFAULT '',
      reviewed_by TEXT DEFAULT '',
      reviewed_at TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS student_interventions (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      concern_type TEXT NOT NULL,
      assigned_staff_id TEXT NOT NULL DEFAULT '',
      assigned_staff_name TEXT NOT NULL DEFAULT '',
      action_taken TEXT NOT NULL DEFAULT '',
      follow_up_date TEXT NOT NULL DEFAULT '',
      resolution_status TEXT NOT NULL DEFAULT 'open',
      notes TEXT DEFAULT '',
      created_by TEXT NOT NULL DEFAULT '',
      created_by_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS student_guardian_contacts (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      contact_date TEXT NOT NULL,
      contact_method TEXT NOT NULL,
      guardian_name TEXT NOT NULL DEFAULT '',
      guardian_contact TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      outcome TEXT DEFAULT '',
      staff_id TEXT NOT NULL DEFAULT '',
      staff_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS saved_report_views (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      report_type TEXT NOT NULL DEFAULT 'dashboard',
      filters_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS report_archives (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT '',
      created_by_name TEXT NOT NULL DEFAULT '',
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      parameters_json TEXT NOT NULL,
      file_format TEXT NOT NULL DEFAULT 'csv',
      file_size INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      content_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS report_jobs (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      report_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER NOT NULL DEFAULT 0,
      parameters_json TEXT NOT NULL,
      result_archive_id TEXT NOT NULL DEFAULT '',
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS inquiry_status_history (
      id TEXT PRIMARY KEY,
      inquiry_id TEXT NOT NULL,
      old_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_by_id TEXT DEFAULT '',
      changed_by_name TEXT DEFAULT '',
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      school_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_role TEXT DEFAULT 'all',
      target_grade TEXT DEFAULT '',
      target_section TEXT DEFAULT '',
      priority TEXT DEFAULT 'normal',
      author_id TEXT DEFAULT '',
      author_name TEXT DEFAULT '',
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS announcement_reads (
      id TEXT PRIMARY KEY,
      announcement_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      read_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(announcement_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_notification_preferences (
      user_id TEXT PRIMARY KEY,
      email_on_inquiry_reply INTEGER NOT NULL DEFAULT 1,
      email_on_announcement INTEGER NOT NULL DEFAULT 1,
      email_on_status_change INTEGER NOT NULL DEFAULT 1,
      in_app_notifications INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS subscription_status_history (
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
    )`,
    `CREATE TABLE IF NOT EXISTS license_expiration_reminders (
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
    )`,
    `CREATE TABLE IF NOT EXISTS subscription_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      request_id TEXT NOT NULL DEFAULT '',
      school_id TEXT NOT NULL DEFAULT '',
      license_id TEXT NOT NULL DEFAULT '',
      plan_tier TEXT NOT NULL DEFAULT '',
      plan_name TEXT NOT NULL DEFAULT '',
      billing_cycle TEXT NOT NULL DEFAULT 'annual',
      amount REAL NOT NULL DEFAULT 0.00,
      currency TEXT NOT NULL DEFAULT 'PHP',
      payment_method_id TEXT NOT NULL DEFAULT '',
      payment_channel TEXT NOT NULL DEFAULT '',
      payment_reference TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'paid',
      issued_at TEXT NOT NULL DEFAULT (datetime('now')),
      due_at TEXT,
      paid_at TEXT,
      notes TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS quarterly_terms (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL DEFAULT '',
      quarter_number INTEGER NOT NULL,
      quarter_name TEXT NOT NULL DEFAULT '',
      school_year TEXT NOT NULL DEFAULT '',
      months TEXT NOT NULL DEFAULT '',
      start_date TEXT NOT NULL DEFAULT '',
      end_date TEXT NOT NULL DEFAULT '',
      target_days INTEGER NOT NULL DEFAULT 50,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS grading_subjects (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL DEFAULT '',
      grade_level TEXT NOT NULL DEFAULT '',
      subject_name TEXT NOT NULL,
      subject_code TEXT NOT NULL DEFAULT '',
      weight_ww INTEGER NOT NULL DEFAULT 30,
      weight_pt INTEGER NOT NULL DEFAULT 50,
      weight_qa INTEGER NOT NULL DEFAULT 20,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS learner_grades (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL DEFAULT '',
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      school_year TEXT NOT NULL DEFAULT '',
      quarter TEXT NOT NULL DEFAULT 'Q1',
      ww_score REAL NOT NULL DEFAULT 0,
      ww_total REAL NOT NULL DEFAULT 100,
      pt_score REAL NOT NULL DEFAULT 0,
      pt_total REAL NOT NULL DEFAULT 100,
      qa_score REAL NOT NULL DEFAULT 0,
      qa_total REAL NOT NULL DEFAULT 50,
      initial_grade REAL NOT NULL DEFAULT 0,
      transmuted_grade INTEGER NOT NULL DEFAULT 75,
      remarks TEXT NOT NULL DEFAULT 'Passed',
      is_locked INTEGER NOT NULL DEFAULT 0,
      encoded_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  ]) {
    sqlite.run(ddl)
  }
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_sub_history_school ON subscription_status_history (school_id, created_at)') } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_sub_history_request ON subscription_status_history (request_id)') } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_reminders_school_sent ON license_expiration_reminders (school_id, sent_at)') } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_reminders_license ON license_expiration_reminders (license_id)') } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_invoices_school ON subscription_invoices (school_id, created_at)') } catch {}
  try { sqlite.run("ALTER TABLE schools ADD COLUMN logo_url TEXT DEFAULT ''") } catch {}
  try { sqlite.run("ALTER TABLE schools ADD COLUMN quarter_count INTEGER NOT NULL DEFAULT 4") } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_invoices_request ON subscription_invoices (request_id)') } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_quarterly_school_sy ON quarterly_terms (school_id, school_year, quarter_number)') } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_grading_subjects_school_grade ON grading_subjects (school_id, grade_level)') } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_learner_grades_lookup ON learner_grades (school_id, student_id, school_year, quarter)') } catch {}
  try { sqlite.run('CREATE INDEX IF NOT EXISTS idx_learner_grades_subject ON learner_grades (subject_id, school_year, quarter)') } catch {}
  {
    try { sqlite.run("ALTER TABLE subscription_plans ADD COLUMN grace_period_days INTEGER NOT NULL DEFAULT 5") } catch {}
    try { sqlite.run("ALTER TABLE licenses ADD COLUMN grace_period_days INTEGER NOT NULL DEFAULT 5") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN grade TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN section TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN period TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN last_login_at TEXT") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN password_changed_at TEXT") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN locked_until TEXT") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN email_verified_at TEXT") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN gender TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN enrollment_status TEXT NOT NULL DEFAULT 'active'") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN created_at TEXT DEFAULT (datetime('now'))") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN summary_data TEXT DEFAULT '{}'") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN excluded_dates TEXT DEFAULT '[]'") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN school_head TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE schools ADD COLUMN attendance_lock_cutoff TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE schools ADD COLUMN school_year TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE schools ADD COLUMN grading_period TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE schools ADD COLUMN division TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE schools ADD COLUMN district TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE schools ADD COLUMN principal_name TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN locked INTEGER NOT NULL DEFAULT 0") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN locked_at TEXT") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN locked_by TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN reopened_at TEXT") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN reopened_by TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN reopen_reason TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN teacher_notes TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE monthly_entries ADD COLUMN late_enrollee INTEGER DEFAULT 0") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN include_saturdays INTEGER NOT NULL DEFAULT 0") } catch {}
    try { sqlite.run("ALTER TABLE schools ADD COLUMN sardo_consecutive_absences INTEGER NOT NULL DEFAULT 3") } catch {}
    try { sqlite.run("ALTER TABLE schools ADD COLUMN sardo_cumulative_absences INTEGER NOT NULL DEFAULT 5") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN lrn TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN birth_date TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN address TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN guardian_name TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN guardian_relationship TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN guardian_contact TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN emergency_contact_name TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN emergency_contact_number TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN consent_data_sharing INTEGER NOT NULL DEFAULT 1") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN consent_medical_emergency INTEGER NOT NULL DEFAULT 1") } catch {}
    try { sqlite.run("ALTER TABLE inquiries ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'") } catch {}
    try { sqlite.run("ALTER TABLE inquiries ADD COLUMN assigned_to TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE inquiries ADD COLUMN assigned_to_name TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE inquiry_messages ADD COLUMN attachment_url TEXT") } catch {}
    try { sqlite.run("ALTER TABLE inquiry_messages ADD COLUMN attachment_name TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE inquiry_messages ADD COLUMN attachment_type TEXT NOT NULL DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE inquiry_messages ADD COLUMN attachment_size INTEGER NOT NULL DEFAULT 0") } catch {}
  }
  // Upgrade legacy CHECK(role IN ('admin','teacher')) -> include 'superadmin'
  const tbl = querySync("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
  if (tbl.length && !tbl[0].sql.includes('superadmin')) {
    sqlite.run(`CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'teacher')),
      grade TEXT DEFAULT '',
      section TEXT DEFAULT '',
      period TEXT DEFAULT '',
      school_id TEXT DEFAULT '',
      account_status TEXT NOT NULL DEFAULT 'active',
      last_login_at TEXT,
      password_changed_at TEXT,
      failed_login_count INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      email TEXT NOT NULL DEFAULT '',
      email_verified_at TEXT
    )`)
    sqlite.run(`INSERT INTO users_new (id, username, password, name, role, grade, section, period, school_id, account_status, last_login_at, password_changed_at, failed_login_count, locked_until, email, email_verified_at)
      SELECT id, username, password, name, role,
        COALESCE(grade, ''), COALESCE(section, ''), COALESCE(period, ''), COALESCE(school_id, ''),
        COALESCE(account_status, 'active'), last_login_at, password_changed_at,
        COALESCE(failed_login_count, 0), locked_until, COALESCE(email, ''), email_verified_at
      FROM users`)
    sqlite.run(`DROP TABLE users`)
    sqlite.run(`ALTER TABLE users_new RENAME TO users`)
  }
  // Database initialization is schema-only. Accounts, schools, grades,
  // plans, licenses, and payment data are created explicitly.
  migrateToMultiSchoolSqlite()
  saveDatabase()
}

function querySync(sql, params = []) {
  const stmt = sqlite.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const results = []
  while (stmt.step()) results.push(stmt.getAsObject())
  stmt.free()
  return results
}

function migrateToMultiSchoolSqlite() {
  try {
    const schoolCount = querySync('SELECT COUNT(*) as cnt FROM schools')[0]?.cnt || 0
    if (schoolCount > 0) return

    // Migrate legacy records only when an existing settings row explicitly
    // contains a school name. Never manufacture a school from a placeholder.
    const settings = {}
    try {
      const rows = querySync('SELECT key, value FROM settings')
      for (const row of rows) settings[row.key] = row.value
    } catch {}
    if (!settings.school_name?.trim()) return

    const schoolId = 'school-' + Date.now().toString(36)
    sqlite.run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [schoolId, settings.school_name, settings.school_id || '', settings.school_address || '', settings.school_short || ''])
    const tables = ['users', 'students', 'monthly_records', 'attendance_records', 'calendar_events', 'quarterly_events']
    for (const table of tables) {
      try { sqlite.run(`UPDATE "${table}" SET school_id = ? WHERE school_id IS NULL OR school_id = ''`, [schoolId]) } catch {}
    }
    try { sqlite.run("UPDATE users SET role = 'superadmin' WHERE role = 'admin' AND (school_id = ? OR school_id = '')", [schoolId]) } catch {}
    saveDatabase()
  } catch (err) {
    console.error('Multi-school migration error:', err.message)
  }
}

export async function initDatabase() {
  DB_PATH = getDbPath()
  DATABASE_URL = resolveDatabaseUrl()
  USE_MYSQL = Boolean(DATABASE_URL)
  DB_MODE = USE_MYSQL ? 'mysql' : 'sqlite'

  console.log(`[db] env: NODE_ENV=${process.env.NODE_ENV ?? '(unset)'} REQUIRE_MYSQL=${process.env.REQUIRE_MYSQL ?? '(unset)'} DB_CONNECTION=${process.env.DB_CONNECTION ?? '(unset)'}`)
  console.log(`[db] backend: ${DB_MODE} DATABASE_URL=${DATABASE_URL ? redactUrl(DATABASE_URL) : '(not configured)'} DB_PATH=${DB_PATH}`)

  if (USE_MYSQL) {
    try {
      await initMysql()
      console.log(`[db] MySQL backend ready (${redactUrl(DATABASE_URL)})`)
    } catch (err) {
      if (process.env.REQUIRE_MYSQL === '1') {
        throw err
      }
      console.error(`[db] WARNING: MySQL connection failed (${err.message}). Falling back to SQLite.`)
      await mysqlPool?.end().catch(() => {})
      mysqlPool = null
      USE_MYSQL = false
      DB_MODE = 'sqlite'
      await initSqlite()
      console.warn(`[db] SQLite backend ready (fallback: ${DB_PATH}).`)
    }
  } else if (process.env.REQUIRE_MYSQL === '1') {
    console.error('[db] FATAL: REQUIRE_MYSQL=1 is set, but no MySQL configuration was provided.')
    throw new Error('DATABASE_URL or MySQL connection parameters are required when REQUIRE_MYSQL=1.')
  } else {
    await initSqlite()
    console.warn(`[db] SQLite backend ready (${DB_PATH}).`)
  }
  // Payment methods, plans, accounts, schools, and licenses are never seeded
  // during application startup. Use an explicit seed command or API workflow.
  return getDb()
}

function redactUrl(url) {
  try {
    const u = new URL(url)
    u.password = '***'
    return u.href
  } catch {
    return url ? '(set)' : '(missing)'
  }
}

export { MYSQL_DDL }

export async function getGradeLevels(schoolDbId) {
  const rows = await query('SELECT grade, sections, sort FROM grade_levels WHERE school_id = ? ORDER BY sort, grade', [schoolDbId])
  return rows.map(r => {
    let sections = []
    try { sections = JSON.parse(r.sections || '[]') } catch {}
    return { grade: r.grade, sections }
  })
}

export async function setGradeLevels(schoolDbId, levels) {
  if (USE_MYSQL) {
    await run('DELETE FROM grade_levels WHERE school_id = ?', [schoolDbId])
    for (let i = 0; i < (levels || []).length; i++) {
      const g = levels[i]
      await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
        [`gl-${schoolDbId}-${Date.now().toString(36)}-${i}`, schoolDbId, g.grade, JSON.stringify(g.sections || []), i])
    }
  } else {
    sqlite.run('DELETE FROM grade_levels WHERE school_id = ?', [schoolDbId])
    ;(levels || []).forEach((g, i) => {
      sqlite.run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
        [`gl-${schoolDbId}-${Date.now().toString(36)}-${i}`, schoolDbId, g.grade, JSON.stringify(g.sections || []), i])
    })
    saveDatabase()
  }
}

export async function isValidClass(schoolDbId, grade, section) {
  const rows = await query('SELECT sections FROM grade_levels WHERE school_id = ? AND grade = ?', [schoolDbId, grade])
  if (!rows.length) return false
  if (!section) return true
  try {
    const sections = JSON.parse(rows[0].sections || '[]')
    return sections.includes(section)
  } catch { return false }
}

function schoolRowToSettings(row) {
  return {
    school_name: row?.name || '',
    school_id: row?.school_id || '',
    school_address: row?.address || '',
    school_short: row?.short || '',
    attendance_lock_cutoff: row?.attendance_lock_cutoff || '',
    contact_email: row?.contact_email || '',
    contact_phone: row?.contact_phone || '',
    division: row?.division || '',
    district: row?.district || '',
    principal_name: row?.principal_name || '',
    school_year: row?.school_year || '',
    grading_period: row?.grading_period || '',
    quarter_count: Number(row?.quarter_count ?? 4) === 3 ? 3 : 4,
    archived_at: row?.archived_at || null,
    archived_by: row?.archived_by || '',
    archive_reason: row?.archive_reason || ''
  }
}

export async function getSchoolById(schoolId) {
  const rows = await query('SELECT * FROM schools WHERE id = ?', [schoolId])
  return rows[0] || null
}

const DEFAULT_SETTINGS = {
  school_name: '',
  school_id: '',
  school_address: '',
  school_short: '',
  contact_email: '',
  contact_phone: '',
  division: '',
  district: '',
  principal_name: '',
  school_year: '',
  grading_period: '',
  quarter_count: 4
}

export function getDb() {
  return { mysql: mysqlPool, sqlite }
}

export async function getSettings(schoolId) {
  if (schoolId) {
    try {
      const row = await getSchoolById(schoolId)
      if (row) return schoolRowToSettings(row)
    } catch {}
  }
  const settings = { ...DEFAULT_SETTINGS }
  if (USE_MYSQL) {
    if (!mysqlPool) return settings
    try {
      const rows = await query('SELECT `key`, value FROM settings')
      for (const r of rows) {
        if (r.key in settings) settings[r.key] = r.value
      }
    } catch {}
  } else {
    if (!sqlite) return settings
    try {
      const rows = querySync('SELECT key, value FROM settings')
      for (const r of rows) {
        if (r.key in settings) settings[r.key] = r.value
      }
    } catch {}
  }
  return settings
}

export async function logAudit({ actor_id = '', actor_name = '', actor_role = '', actor_school_id = '', action = '', target_type = '', target_id = '', target_name = '', target_school_id = '', detail = '' }) {
  try {
    await run(`INSERT INTO audit_logs (actor_id, actor_name, actor_role, actor_school_id, action, target_type, target_id, target_name, target_school_id, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [actor_id, actor_name, actor_role, actor_school_id, action, target_type, target_id, target_name, target_school_id, detail])
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}

export async function updateSchoolRow(schoolId, { school_name, school_id, school_address, school_short, attendance_lock_cutoff, contact_email, contact_phone, division, district, principal_name, school_year, grading_period, logo_url, quarter_count, sardo_consecutive_absences, sardo_cumulative_absences }) {
  const sets = []
  const params = []
  if (school_name !== undefined) { sets.push('name = ?'); params.push(String(school_name)) }
  if (school_id !== undefined) { sets.push('school_id = ?'); params.push(String(school_id)) }
  if (school_address !== undefined) { sets.push('address = ?'); params.push(String(school_address)) }
  if (school_short !== undefined) { sets.push('short = ?'); params.push(String(school_short)) }
  if (contact_email !== undefined) { sets.push('contact_email = ?'); params.push(String(contact_email).trim()) }
  if (contact_phone !== undefined) { sets.push('contact_phone = ?'); params.push(String(contact_phone).trim()) }
  if (division !== undefined) { sets.push('division = ?'); params.push(String(division).trim()) }
  if (district !== undefined) { sets.push('district = ?'); params.push(String(district).trim()) }
  if (principal_name !== undefined) { sets.push('principal_name = ?'); params.push(String(principal_name).trim()) }
  if (school_year !== undefined) { sets.push('school_year = ?'); params.push(String(school_year).trim()) }
  if (grading_period !== undefined) { sets.push('grading_period = ?'); params.push(String(grading_period).trim()) }
  if (logo_url !== undefined) { sets.push('logo_url = ?'); params.push(String(logo_url).trim()) }
  if (quarter_count !== undefined) {
    sets.push('quarter_count = ?')
    params.push(Number(quarter_count) === 3 ? 3 : 4)
  }
  if (sardo_consecutive_absences !== undefined) {
    sets.push('sardo_consecutive_absences = ?')
    params.push(Math.max(1, parseInt(sardo_consecutive_absences, 10) || 3))
  }
  if (sardo_cumulative_absences !== undefined) {
    sets.push('sardo_cumulative_absences = ?')
    params.push(Math.max(1, parseInt(sardo_cumulative_absences, 10) || 5))
  }
  if (attendance_lock_cutoff !== undefined) {
    const cutoff = String(attendance_lock_cutoff || '').trim()
    if (cutoff && !/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) throw new Error('Attendance lock cutoff must be a valid date')
    sets.push('attendance_lock_cutoff = ?'); params.push(cutoff)
  }
  if (!sets.length) return getSchoolById(schoolId)
  params.push(schoolId)
  await run(`UPDATE schools SET ${sets.join(', ')} WHERE id = ?`, params)
  return getSchoolById(schoolId)
}


export { prisma } from './prisma/client.js'

export async function closeDatabase() {
  if (mysqlPool) {
    try {
      await Promise.race([
        mysqlPool.end(),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ])
    } catch {}
    mysqlPool = null
  }
}

export function saveDatabase() {
  if (sqlite && !USE_MYSQL) {
    const data = sqlite.export()
    const buffer = Buffer.from(data)
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(DB_PATH, buffer)
  }
}