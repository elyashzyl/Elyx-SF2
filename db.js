import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'attendance.db')

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
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher'))
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

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT NOT NULL,
      created_by TEXT DEFAULT '',
      created_by_name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  try { db.run("ALTER TABLE attendance_records ADD COLUMN created_by TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE attendance_records ADD COLUMN created_by_name TEXT DEFAULT ''") } catch {}

  try { db.run("ALTER TABLE users ADD COLUMN grade TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN section TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE users ADD COLUMN period TEXT DEFAULT ''") } catch {}

  db.run(`
    CREATE TABLE IF NOT EXISTS teacher_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      period TEXT NOT NULL,
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      grade TEXT DEFAULT '',
      section TEXT DEFAULT '',
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `)

  try { db.run("ALTER TABLE teacher_schedules ADD COLUMN start_time TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE teacher_schedules ADD COLUMN end_time TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE teacher_schedules ADD COLUMN subject TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE teacher_schedules ADD COLUMN grade TEXT DEFAULT ''") } catch {}
  try { db.run("ALTER TABLE teacher_schedules ADD COLUMN section TEXT DEFAULT ''") } catch {}

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      event_date TEXT NOT NULL,
      color TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS quarterly_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      first_grading TEXT DEFAULT '',
      second_grading TEXT DEFAULT '',
      third_grading TEXT DEFAULT '',
      fourth_grading TEXT DEFAULT ''
    )
  `)

  const existingSettings = db.exec("SELECT COUNT(*) as cnt FROM settings")
  const settingCount = existingSettings[0]?.values[0][0] || 0
  if (settingCount === 0) {
    const defaults = {
      'period_am1': '07:00-07:50', 'period_am2': '07:50-08:40', 'period_am3': '08:40-09:30',
      'period_am4': '09:30-10:20', 'period_am5': '10:20-11:10', 'period_am6': '11:10-12:00',
      'period_pm1': '13:00-13:50', 'period_pm2': '13:50-14:40', 'period_pm3': '14:40-15:30', 'period_pm4': '15:30-16:20'
    }
    for (const [k, v] of Object.entries(defaults)) {
      run('INSERT INTO settings (key, value) VALUES (?, ?)', [k, v])
    }
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      am1 TEXT DEFAULT '',
      am2 TEXT DEFAULT '',
      am3 TEXT DEFAULT '',
      am4 TEXT DEFAULT '',
      am5 TEXT DEFAULT '',
      am6 TEXT DEFAULT '',
      pm1 TEXT DEFAULT '',
      pm2 TEXT DEFAULT '',
      pm3 TEXT DEFAULT '',
      pm4 TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      excused INTEGER DEFAULT 0,
      unexcused INTEGER DEFAULT 0,
      nls INTEGER DEFAULT 0,
      FOREIGN KEY (record_id) REFERENCES attendance_records(id)
    )
  `)

  try { db.run("ALTER TABLE attendance_entries ADD COLUMN nls INTEGER DEFAULT 0") } catch {}

  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_records (
      id TEXT PRIMARY KEY,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      adviser TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_by_name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

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
      FOREIGN KEY (record_id) REFERENCES monthly_records(id)
    )
  `)

  const row = db.exec("SELECT COUNT(*) as cnt FROM users")
  const count = row[0]?.values[0][0] || 0
  if (count === 0) {
    db.run("INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)",
      ['1', 'admin', 'admin123', 'System Admin', 'admin'])
  }

  saveDatabase()
  return db
}

export function getDb() {
  return db
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
