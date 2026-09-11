// One-time migration: attendance.db (SQLite) -> MySQL.
// Usage: DATABASE_URL=mysql://user:pass@host:3306/dbname node scripts/migrate-sqlite-to-mysql.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'
import mysql from 'mysql2/promise'
import { MYSQL_DDL } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'attendance.db')
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is required.')
  console.error('Example: DATABASE_URL=mysql://elyx:elyxsecret@localhost:3306/elyx node scripts/migrate-sqlite-to-mysql.mjs')
  process.exit(1)
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`No SQLite database found at ${DB_PATH} — nothing to migrate. (Fresh installs need no migration.)`)
  process.exit(1)
}

const SQL = await initSqlJs()
const sqlite = new SQL.Database(fs.readFileSync(DB_PATH))

function sqliteQuery(sql, params = []) {
  const stmt = sqlite.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

const SERIAL_TABLES = ['audit_logs', 'monthly_entries', 'attendance_entries', 'teacher_schedules', 'calendar_events', 'quarterly_events']

function stripTextDefaults(ddl) {
  return ddl.replace(/\sDEFAULT\s*\(\s*('[^']*')\s*\)/g, '')
}

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

const poolCfg = { ...parseMysqlUrl(DATABASE_URL), connectionLimit: 5 }
if (DATABASE_URL.includes('sslmode=require') || /ssl=(?:true|1|\d+)/i.test(DATABASE_URL) || process.env.MYSQL_SSL === '1') {
  poolCfg.ssl = { rejectUnauthorized: false }
}
const pool = mysql.createPool(poolCfg)
pool.on('connection', conn => { conn.query("SET SESSION sql_mode=''").catch(() => {}) })

async function main() {
  try { await pool.query('SELECT 1') } catch (e) {
    if (!poolCfg.ssl && /\b(ssl|tls|pem|certificate)\b/i.test(String(e.message))) {
      console.warn('MySQL requires SSL; retrying with TLS.')
      poolCfg.ssl = { rejectUnauthorized: false }
      await pool.query('SELECT 1')
    } else { throw e }
  }

  console.log('Creating schema...')
  for (const raw of MYSQL_DDL) await pool.query(stripTextDefaults(raw))

  // Identify tables actually present in SQLite so a partially-migrated DB can rerun safely.
  const sqliteTables = sqliteQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(r => r.name)

  for (const table of sqliteTables) {
    // Skip views/oddities, only copy known app tables.
    if (!SERIAL_TABLES.includes(table) && !MYSQL_DDL.some(d => d.toLowerCase().includes(`table if not exists ${table}`))) {
      console.log(`  skipping non-app table: ${table}`)
      continue
    }
    const rows = sqliteQuery(`SELECT * FROM "${table}"`)
    if (!rows.length) {
      console.log(`  ${table}: 0 rows (cleared)`)
      await pool.query(`TRUNCATE TABLE \`${table}\``)
      continue
    }

    const typeRows = (await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? AND table_schema = DATABASE()`, [table]))[0]
    const typeOf = Object.fromEntries(typeRows.map(r => [r.column_name, r.data_type]))

    await pool.query(`TRUNCATE TABLE \`${table}\``)
    const batchSize = 500
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      for (const row of batch) {
        const cols = Object.keys(row)
        const ph = cols.map((_, j) => '?').join(', ')
        const vals = cols.map(c => {
          let v = row[c]
          if (v === undefined || v === null || v === '') {
            return (typeOf[c] ?? '').includes('int') || (typeOf[c] ?? '').includes('bigint') ? 0 : ''
          }
          return v
        })
        await pool.query(
          `INSERT INTO \`${table}\` (\`${cols.join('`, `')}\`) VALUES (${ph})`, vals)
      }
      console.log(`  ${table}: ${Math.min(batch.length + i, rows.length)}/${rows.length}`)
    }

    // Keep AUTO_INCREMENT sequences ahead of any copied rows.
    if (SERIAL_TABLES.includes(table)) {
      const [[maxRow]] = await pool.query(`SELECT IFNULL(MAX(id), 0) + 1 AS nxt FROM \`${table}\``)
      await pool.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = ?`, [maxRow?.nxt || 1])
    }
  }

  console.log('Migration complete.')
  await pool.end()
}

main().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})