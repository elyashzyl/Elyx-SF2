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
    process.env.DATABASE_URL = explicitUrl
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
  process.env.DATABASE_URL = resolved
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
    notes TEXT NOT NULL DEFAULT ('')
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
  mysqlPool = mysql.createPool(poolCfg)
  // Non-strict mode: an omitted column inserts its empty default (like SQLite/Postgres).
  mysqlPool.on('connection', conn => {
    conn.query("SET SESSION sql_mode=''", () => {})
  })
  try {
    await mysqlPool.query('SELECT 1')
  } catch (err) {
    const msg = String(err.message)
    if (!poolCfg.ssl && /\b(ssl|tls|pem|certificate)\b/i.test(msg)) {
      console.warn('[db] MySQL requires SSL; retrying with TLS (rejectUnauthorized=false).')
      await mysqlPool.end().catch(() => {})
      poolCfg.ssl = { rejectUnauthorized: false }
      mysqlPool = mysql.createPool(poolCfg)
      mysqlPool.on('connection', conn => {
        conn.query("SET SESSION sql_mode=''", () => {})
      })
      await mysqlPool.query('SELECT 1')
    } else if (poolCfg.ssl && /does not support SSL|failed to connect|handshake/i.test(msg)) {
      console.warn('[db] MySQL rejected SSL; retrying without TLS (internal network).')
      await mysqlPool.end().catch(() => {})
      delete poolCfg.ssl
      mysqlPool = mysql.createPool(poolCfg)
      mysqlPool.on('connection', conn => {
        conn.query("SET SESSION sql_mode=''", () => {})
      })
      await mysqlPool.query('SELECT 1')
    } else {
      throw err
    }
  }
  for (const raw of MYSQL_DDL) await mysqlPool.query(stripTextDefaults(raw))
  // Database initialization is schema-only. Versioned migrations handle
  // changes to existing installations. Accounts, schools, grades, plans,
  // licenses, and payment data are created by explicit commands or API actions.
  await migrateToMultiSchoolMysql()
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
      gender TEXT DEFAULT ''
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL,
      created_by TEXT DEFAULT '',
      created_by_name TEXT DEFAULT '',
      summary_data TEXT DEFAULT '{}'
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
      notes TEXT DEFAULT ''
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
    )`
  ]) {
    sqlite.run(ddl)
  }
  {
    try { sqlite.run("ALTER TABLE users ADD COLUMN grade TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN section TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN period TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE users ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN gender TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE students ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN created_at TEXT DEFAULT (datetime('now'))") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN summary_data TEXT DEFAULT '{}'") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN excluded_dates TEXT DEFAULT '[]'") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN school_head TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE monthly_records ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE attendance_records ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
    try { sqlite.run("ALTER TABLE monthly_entries ADD COLUMN late_enrollee INTEGER DEFAULT 0") } catch {}
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
      school_id TEXT DEFAULT ''
    )`)
    sqlite.run(`INSERT INTO users_new (id, username, password, name, role, grade, section, period, school_id)
      SELECT id, username, password, name, role,
        COALESCE(grade, ''), COALESCE(section, ''), COALESCE(period, ''), COALESCE(school_id, '')
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
    school_short: row?.short || ''
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
  school_short: ''
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

export async function updateSchoolRow(schoolId, { school_name, school_id, school_address, school_short }) {
  const sets = []
  const params = []
  if (school_name !== undefined) { sets.push('name = ?'); params.push(String(school_name)) }
  if (school_id !== undefined) { sets.push('school_id = ?'); params.push(String(school_id)) }
  if (school_address !== undefined) { sets.push('address = ?'); params.push(String(school_address)) }
  if (school_short !== undefined) { sets.push('short = ?'); params.push(String(school_short)) }
  if (!sets.length) return getSchoolById(schoolId)
  params.push(schoolId)
  await run(`UPDATE schools SET ${sets.join(', ')} WHERE id = ?`, params)
  return getSchoolById(schoolId)
}


export { prisma } from './prisma/client.js'

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