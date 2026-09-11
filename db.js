import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import initSqlJs from 'sql.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = (
  process.env.NODE_ENV === 'production'
    ? (process.env.DB_PATH && path.isAbsolute(process.env.DB_PATH) ? process.env.DB_PATH : '/data/attendance.db')
    : (process.env.DB_PATH || path.join(__dirname, 'attendance.db'))
)
let USE_MYSQL = !!process.env.DATABASE_URL

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
    ...parseMysqlUrl(process.env.DATABASE_URL),
    connectionLimit: parseInt(process.env.MYSQL_POOL_MAX || '10', 10),
    connectTimeout: 10000,
    dateStrings: true,
    charset: 'utf8mb4_unicode_ci',
    waitForConnections: true
  }
  // Some managed MySQL providers (Aiven, DigitalOcean, etc.) require SSL.
  if (/sslmode=(require|verify-ca|verify-full)|\bssl=(?:true|1|\d+)\b|ssl-mode=required/i.test(process.env.DATABASE_URL) || process.env.MYSQL_SSL === '1') {
    poolCfg.ssl = { rejectUnauthorized: process.env.MYSQL_SSL_VERIFY === '1' }
  }
  mysqlPool = mysql.createPool(poolCfg)
  // Non-strict mode: an omitted column inserts its empty default (like SQLite/Postgres).
  mysqlPool.on('connection', conn => {
    conn.query("SET SESSION sql_mode=''").catch(() => {})
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
        conn.query("SET SESSION sql_mode=''").catch(() => {})
      })
      await mysqlPool.query('SELECT 1')
    } else if (poolCfg.ssl && /does not support SSL|failed to connect|handshake/i.test(msg)) {
      console.warn('[db] MySQL rejected SSL; retrying without TLS (internal network).')
      await mysqlPool.end().catch(() => {})
      delete poolCfg.ssl
      mysqlPool = mysql.createPool(poolCfg)
      mysqlPool.on('connection', conn => {
        conn.query("SET SESSION sql_mode=''").catch(() => {})
      })
      await mysqlPool.query('SELECT 1')
    } else {
      throw err
    }
  }
  for (const raw of MYSQL_DDL) await mysqlPool.query(stripTextDefaults(raw))
  const [[cntRows]] = await mysqlPool.query('SELECT COUNT(*) AS cnt FROM users')
  if ((cntRows?.cnt ?? 0) === 0) {
    await mysqlPool.query(
      `INSERT INTO users (id, username, password, name, role, school_id) VALUES (?, ?, ?, ?, ?, ?)`,
      ['1', 'admin', 'admin123', 'System Admin', 'superadmin', ''])
    await mysqlPool.query(
      `INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)`,
      ['school-1', 'BAGUIO PATRIOTIC HIGH SCHOOL', '406219', 'Baguio City', 'BPHS'])
  }
  await migrateToMultiSchoolMysql()
  await seedGradeLevelsMysql()
}

async function migrateToMultiSchoolMysql() {
  try {
    const [[cntRows]] = await mysqlPool.query('SELECT COUNT(*) AS cnt FROM schools')
    if ((cntRows?.cnt ?? 0) > 0) return
    const legacy = { ...DEFAULT_SCHOOL_FALLBACK }
    try {
      const [[sRows]] = await mysqlPool.query('SELECT `key`, value FROM settings')
      for (const r of sRows) {
        if (r.key in legacy) legacy[r.key] = r.value
      }
    } catch {}
    const schoolId = 'school-' + Date.now().toString(36)
    await mysqlPool.query('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [schoolId, legacy.school_name, legacy.school_id, legacy.school_address, legacy.school_short])
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

const DEFAULT_GRADE_SKELETON = [
  { grade: 'Grade 7', sections: ['Pine', 'Molave'] },
  { grade: 'Grade 8', sections: ['Cypress', 'Narra'] },
  { grade: 'Grade 9', sections: ['Kamagong', 'Mahogany'] },
  { grade: 'Grade 10', sections: ['Acacia', 'Yakal'] }
]

export async function seedGradeLevelsForSchool(schoolDbId) {
  const existing = await query('SELECT COUNT(*) AS cnt FROM grade_levels WHERE school_id = ?', [schoolDbId])
  if ((existing[0]?.cnt ?? 0) > 0) return
  for (let i = 0; i < DEFAULT_GRADE_SKELETON.length; i++) {
    const g = DEFAULT_GRADE_SKELETON[i]
    await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
      [`gl-${schoolDbId}-${i}`, schoolDbId, g.grade, JSON.stringify(g.sections), i])
  }
}

async function seedGradeLevelsMysql() {
  try {
    const [[schools]] = await mysqlPool.query('SELECT id FROM schools')
    for (const s of schools) {
      try { await seedGradeLevelsForSchool(s.id) } catch {}
    }
  } catch (err) {
    console.error('Grade levels seed error:', err.message)
  }
}

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
  const count = querySync('SELECT COUNT(*) as cnt FROM users')[0]?.cnt || 0
  if (count === 0) {
    sqlite.run("INSERT INTO users (id, username, password, name, role, school_id) VALUES (?, ?, ?, ?, ?, ?)",
      ['1', 'admin', 'admin123', 'System Admin', 'superadmin', ''])
    sqlite.run("INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)",
      ['school-1', 'BAGUIO PATRIOTIC HIGH SCHOOL', '406219', 'Baguio City', 'BPHS'])
  }
  migrateToMultiSchoolSqlite()
  seedGradeLevelsSqlite()
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

const DEFAULT_SCHOOL_FALLBACK = {
  school_name: 'BAGUIO PATRIOTIC HIGH SCHOOL',
  school_id: '406219',
  school_address: 'Baguio City',
  school_short: 'BPHS'
}

function migrateToMultiSchoolSqlite() {
  try {
    const schoolCount = querySync('SELECT COUNT(*) as cnt FROM schools')[0]?.cnt || 0
    if (schoolCount > 0) return
    const legacy = { ...DEFAULT_SCHOOL_FALLBACK }
    try {
      const rows = querySync('SELECT key, value FROM settings')
      for (const r of rows) {
        if (r.key in legacy) legacy[r.key] = r.value
      }
    } catch {}
    const schoolId = 'school-' + Date.now().toString(36)
    sqlite.run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [schoolId, legacy.school_name, legacy.school_id, legacy.school_address, legacy.school_short])
    const tables = ['users', 'students', 'monthly_records', 'attendance_records', 'calendar_events', 'quarterly_events']
    for (const t of tables) {
      try { sqlite.run(`UPDATE "${t}" SET school_id = ? WHERE school_id IS NULL OR school_id = ''`, [schoolId]) } catch {}
    }
    try { sqlite.run("UPDATE users SET role = 'superadmin' WHERE role = 'admin' AND (school_id = ? OR school_id = '')", [schoolId]) } catch {}
    saveDatabase()
  } catch (err) {
    console.error('Multi-school migration error:', err.message)
  }
}

function seedGradeLevelsSqlite() {
  try {
    const done = querySync("SELECT value FROM settings WHERE key = 'grade_levels_seeded'")[0]?.value
    if (done) return
    const schools = querySync('SELECT id FROM schools')
    for (const s of schools) {
      try { seedGradeLevelsForSchoolSync(s.id) } catch {}
    }
    try { sqlite.run("INSERT INTO settings (key, value) VALUES ('grade_levels_seeded', '1')") } catch {}
    saveDatabase()
  } catch (err) {
    console.error('Grade levels seed error:', err.message)
  }
}

function seedGradeLevelsForSchoolSync(schoolDbId) {
  const existing = querySync('SELECT COUNT(*) as cnt FROM grade_levels WHERE school_id = ?', [schoolDbId])[0]?.cnt || 0
  if (existing > 0) return
  DEFAULT_GRADE_SKELETON.forEach((g, i) => {
    sqlite.run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
      [`gl-${schoolDbId}-${i}`, schoolDbId, g.grade, JSON.stringify(g.sections), i])
  })
}

export async function initDatabase() {
  // Diagnostic dump so deployments can see exactly what the container has.
  console.log(`[db] env: NODE_ENV=${process.env.NODE_ENV ?? '(unset)'} REQUIRE_MYSQL=${process.env.REQUIRE_MYSQL ?? '(unset)'} ALLOW_PERSISTED_SQLITE=${process.env.ALLOW_PERSISTED_SQLITE ?? '(unset)'}`)
  const urlState = !process.env.DATABASE_URL ? 'MISSING' : (process.env.DATABASE_URL === '' ? 'EMPTY-STRING (treated as missing!)' : 'PRESENT')
  console.log(`[db] env: DATABASE_URL=${urlState} DB_PATH=${process.env.DB_PATH ?? '(default /app/attendance.db)'}`)
  if (USE_MYSQL) {
    try {
      await initMysql()
      console.log(`[db] MySQL backend ready (${redactUrl(process.env.DATABASE_URL)})`)
    } catch (err) {
      const canFallback = process.env.ALLOW_PERSISTED_SQLITE === '1' && process.env.REQUIRE_MYSQL !== '1' && process.env.REQUIRE_POSTGRES !== '1'
      if (!canFallback) throw err
      console.error(`[db] WARNING: MySQL connection failed (${err.message}). Falling back to SQLite because ALLOW_PERSISTED_SQLITE=1.`)
      await mysqlPool?.end().catch(() => {})
      mysqlPool = null
      USE_MYSQL = false
      DB_MODE = 'sqlite'
      await initSqlite()
      console.warn(`[db] SQLite backend ready (fallback). DB_PATH=${DB_PATH} - mount a persistent volume here or you WILL lose data on redeploy.`)
    }
  } else if (process.env.REQUIRE_MYSQL === '1' || process.env.REQUIRE_POSTGRES === '1' || (process.env.NODE_ENV === 'production' && process.env.ALLOW_PERSISTED_SQLITE !== '1')) {
    // Silently using SQLite on an ephemeral container disk is what caused all
    // data to vanish on every redeploy. Refuse to start instead.
    console.error('[db] FATAL: DATABASE_URL is not set.')
    console.error('[db] Production/forced mode refuses to run on the ephemeral SQLite fallback, because the database file lives inside the container and is deleted on every redeploy.')
    console.error('[db] Fix (recommended): add the MySQL connection string (mysql://user:pass@host:3306/dbname) as the DATABASE_URL environment variable, then redeploy.')
    console.error("[db] Emergency fallback ONLY: set ALLOW_PERSISTED_SQLITE=1 AND mount a persistent Docker volume to /data (DB_PATH=/data/attendance.db) to accept responsibility for a SQLite file on that volume.")
    throw new Error('DATABASE_URL is required (MySQL must be enabled). The SQLite fallback is disabled when NODE_ENV=production or REQUIRE_MYSQL=1.')
  } else {
    await initSqlite()
    if (process.env.NODE_ENV === 'production') {
      console.warn('[db] WARNING: running SQLite in PRODUCTION via ALLOW_PERSISTED_SQLITE=1. DB_PATH=' + (process.env.DB_PATH || 'default') + '. You must have a persistent volume mounted there or you WILL lose data on redeploy.')
    } else {
      console.warn('[db] SQLite backend ready (attendance.db) — LOCAL DEV ONLY. Set DATABASE_URL on a production host.')
    }
  }
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

export { MYSQL_DDL, DEFAULT_GRADE_SKELETON }

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
  school_name: 'BAGUIO PATRIOTIC HIGH SCHOOL',
  school_id: '406219',
  school_address: 'Baguio City',
  school_short: 'BPHS'
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

export function saveDatabase() {
  if (sqlite && !USE_MYSQL) {
    const data = sqlite.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  }
}