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
      section TEXT NOT NULL
    )
  `)

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
      FOREIGN KEY (record_id) REFERENCES attendance_records(id)
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
