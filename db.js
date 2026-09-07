import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'attendance.db')

let db = null

export async function initDatabase() {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'teacher'))
    )
  `)
  try { db.run("ALTER TABLE users ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
  // Upgrade legacy CHECK(role IN ('admin','teacher')) -> include 'superadmin'
  try {
    const tbl = query("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
    if (tbl.length && !tbl[0].sql.includes('superadmin')) {
      db.run(`CREATE TABLE users_new (
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
      db.run(`INSERT INTO users_new (id, username, password, name, role, grade, section, period, school_id)
        SELECT id, username, password, name, role,
          COALESCE(grade, ''), COALESCE(section, ''), COALESCE(period, ''), COALESCE(school_id, '')
        FROM users`)
      db.run(`DROP TABLE users`)
      db.run(`ALTER TABLE users_new RENAME TO users`)
    }
  } catch (err) { console.error('Users role migration error:', err.message) }

  db.run(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      school_id TEXT DEFAULT '',
      address TEXT DEFAULT '',
      short TEXT DEFAULT ''
    )
  `)

  // Per-school grade levels + sections. sections stored as JSON array.
  db.run(`
    CREATE TABLE IF NOT EXISTS grade_levels (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      grade TEXT NOT NULL,
      sections TEXT NOT NULL DEFAULT '[]',
      sort INTEGER DEFAULT 0
    )
  `)

  // Superadmin activity log.
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
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
    )
  `)

  // Superadmin activity log.
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
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
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      gender TEXT DEFAULT ''
    )
  `)
  try { db.run("ALTER TABLE students ADD COLUMN gender TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE students ADD COLUMN school_id TEXT DEFAULT ''") } catch {}

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL,
      created_by TEXT DEFAULT '',
      created_by_name TEXT DEFAULT '',
      summary_data TEXT DEFAULT '{}'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_records (
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
    )
  `)
  try { db.run("ALTER TABLE monthly_records ADD COLUMN created_at TEXT DEFAULT (datetime('now'))") } catch {}
  try { db.run("ALTER TABLE monthly_records ADD COLUMN summary_data TEXT DEFAULT '{}'") } catch {}
  try { db.run("ALTER TABLE monthly_records ADD COLUMN excluded_dates TEXT DEFAULT '[]'") } catch {}
  try { db.run("ALTER TABLE monthly_records ADD COLUMN school_head TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE monthly_records ADD COLUMN school_id TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE attendance_records ADD COLUMN school_id TEXT DEFAULT ''") } catch {}

  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      days TEXT DEFAULT '{}',
      present INTEGER DEFAULT 0,
      absent INTEGER DEFAULT 0,
      tardy INTEGER DEFAULT 0,
      remarks TEXT DEFAULT '',
      late_enrollee INTEGER DEFAULT 0,
      FOREIGN KEY (record_id) REFERENCES monthly_records(id)
    )
  `)
  try { db.run("ALTER TABLE monthly_entries ADD COLUMN late_enrollee INTEGER DEFAULT 0") } catch {}

  // Settings key/value store (legacy single-school settings).
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    )
  `)

  // Per-student attendance entries for a daily attendance record.
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_entries (
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
      nls INTEGER DEFAULT 0,
      FOREIGN KEY (record_id) REFERENCES attendance_records(id)
    )
  `)

  // Teacher weekly schedules.
  db.run(`
    CREATE TABLE IF NOT EXISTS teacher_schedules (
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
    )
  `)

  // School calendar events.
  db.run(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      type TEXT DEFAULT '',
      event_date TEXT DEFAULT '',
      color TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      school_id TEXT DEFAULT ''
    )
  `)

  // Quarterly events per school.
  db.run(`
    CREATE TABLE IF NOT EXISTS quarterly_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT DEFAULT '',
      first_grading TEXT DEFAULT '',
      second_grading TEXT DEFAULT '',
      third_grading TEXT DEFAULT '',
      fourth_grading TEXT DEFAULT '',
      school_id TEXT DEFAULT ''
    )
  `)

  const row = db.exec("SELECT COUNT(*) as cnt FROM users")
  const count = row[0]?.values[0][0] || 0
  if (count === 0) {
    db.run("INSERT INTO users (id, username, password, name, role, school_id) VALUES (?, ?, ?, ?, ?, ?)",
      ['1', 'admin', 'admin123', 'System Admin', 'superadmin', ''])
    // Default school for the fresh install goes to the superadmin
    db.run("INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)",
      ['school-1', 'BAGUIO PATRIOTIC HIGH SCHOOL', '406219', 'Baguio City', 'BPHS'])
  }

  migrateToMultiSchool()
  seedGradeLevels()

  saveDatabase()
  return db
}

const DEFAULT_SCHOOL_FALLBACK = {
  school_name: 'BAGUIO PATRIOTIC HIGH SCHOOL',
  school_id: '406219',
  school_address: 'Baguio City',
  school_short: 'BPHS'
}

// One-time migration: single-school DB -> multi-school.
// Creates a school from legacy settings rows (or defaults), backfills
// school_id on all existing data, promotes legacy sole admin to superadmin.
function migrateToMultiSchool() {
  try {
    const schoolCount = query('SELECT COUNT(*) as cnt FROM schools')[0]?.cnt || 0
    if (schoolCount > 0) return
    const legacy = { ...DEFAULT_SCHOOL_FALLBACK }
    try {
      const rows = query('SELECT key, value FROM settings')
      for (const r of rows) {
        if (r.key in legacy) legacy[r.key] = r.value
      }
    } catch {}
    const schoolId = 'school-' + Date.now().toString(36)
    run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [schoolId, legacy.school_name, legacy.school_id, legacy.school_address, legacy.school_short])
    const tables = ['users', 'students', 'monthly_records', 'attendance_records', 'calendar_events', 'quarterly_events']
    for (const t of tables) {
      try { run(`UPDATE "${t}" SET school_id = ? WHERE school_id IS NULL OR school_id = ''`, [schoolId]) } catch {}
    }
    // Legacy single admin becomes superadmin
    try { run("UPDATE users SET role = 'superadmin' WHERE role = 'admin' AND (school_id = ? OR school_id = '')", [schoolId]) } catch {}
    saveDatabase()
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

export function seedGradeLevelsForSchool(schoolDbId) {
  const existing = query('SELECT COUNT(*) as cnt FROM grade_levels WHERE school_id = ?', [schoolDbId])[0]?.cnt || 0
  if (existing > 0) return
  DEFAULT_GRADE_SKELETON.forEach((g, i) => {
    run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
      [`gl-${schoolDbId}-${i}`, schoolDbId, g.grade, JSON.stringify(g.sections), i])
  })
}

// One-time backfill: schools that predate grade_levels get the default
// skeleton (existing data was created under it). New schools start EMPTY so
// each school defines its own grades/sections in Settings.
function seedGradeLevels() {
  try {
    const done = query("SELECT value FROM settings WHERE key = 'grade_levels_seeded'")[0]?.value
    if (done) return
    const schools = query('SELECT id FROM schools')
    for (const s of schools) {
      try { seedGradeLevelsForSchool(s.id) } catch {}
    }
    try { run("INSERT INTO settings (key, value) VALUES ('grade_levels_seeded', '1')") } catch {}
    saveDatabase()
  } catch (err) {
    console.error('Grade levels seed error:', err.message)
  }
}

export function getGradeLevels(schoolDbId) {
  const rows = query('SELECT grade, sections, sort FROM grade_levels WHERE school_id = ? ORDER BY sort, grade', [schoolDbId])
  return rows.map(r => {
    let sections = []
    try { sections = JSON.parse(r.sections || '[]') } catch {}
    return { grade: r.grade, sections }
  })
}

export function setGradeLevels(schoolDbId, levels) {
  run('DELETE FROM grade_levels WHERE school_id = ?', [schoolDbId])
  levels.forEach((g, i) => {
    run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)',
      [`gl-${schoolDbId}-${Date.now().toString(36)}-${i}`, schoolDbId, g.grade, JSON.stringify(g.sections || []), i])
  })
  saveDatabase()
}

export function isValidClass(schoolDbId, grade, section) {
  const rows = query('SELECT sections FROM grade_levels WHERE school_id = ? AND grade = ?', [schoolDbId, grade])
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

export function getSchoolById(schoolId) {
  const rows = query('SELECT * FROM schools WHERE id = ?', [schoolId])
  return rows[0] || null
}

const DEFAULT_SETTINGS = {
  school_name: 'BAGUIO PATRIOTIC HIGH SCHOOL',
  school_id: '406219',
  school_address: 'Baguio City',
  school_short: 'BPHS'
}

export function getDb() {
  return db
}

export function getSettings(schoolId) {
  // Prefer the schools table when a school id is provided
  if (schoolId) {
    try {
      const row = getSchoolById(schoolId)
      if (row) return schoolRowToSettings(row)
    } catch {}
  }
  // Legacy fallback: settings key/value store
  const settings = { ...DEFAULT_SETTINGS }
  if (!db) return settings
  try {
    const rows = query('SELECT key, value FROM settings')
    for (const r of rows) {
      if (r.key in settings) settings[r.key] = r.value
    }
  } catch {}
  return settings
}

export function logAudit({ actor_id = '', actor_name = '', actor_role = '', actor_school_id = '', action = '', target_type = '', target_id = '', target_name = '', target_school_id = '', detail = '' }) {
  try {
    run(`INSERT INTO audit_logs (actor_id, actor_name, actor_role, actor_school_id, action, target_type, target_id, target_name, target_school_id, detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [actor_id, actor_name, actor_role, actor_school_id, action, target_type, target_id, target_name, target_school_id, detail])
  } catch (err) {
    console.error('Audit log error:', err.message)
  }
}

export function updateSchoolRow(schoolId, { school_name, school_id, school_address, school_short }) {
  const sets = []
  const params = []
  if (school_name !== undefined) { sets.push('name = ?'); params.push(String(school_name)) }
  if (school_id !== undefined) { sets.push('school_id = ?'); params.push(String(school_id)) }
  if (school_address !== undefined) { sets.push('address = ?'); params.push(String(school_address)) }
  if (school_short !== undefined) { sets.push('short = ?'); params.push(String(school_short)) }
  if (!sets.length) return getSchoolById(schoolId)
  params.push(schoolId)
  run(`UPDATE schools SET ${sets.join(', ')} WHERE id = ?`, params)
  return getSchoolById(schoolId)
}

export function saveDatabase() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  }
}

export function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    if (params.length > 0) stmt.bind(params)
    const results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  } catch (err) {
    console.error('SQL query error:', err.message)
    throw err
  }
}

export function run(sql, params = []) {
  try {
    db.run(sql, params)
    saveDatabase()
  } catch (err) {
    console.error('SQL run error:', err.message)
    throw err
  }
}
