// One-time migration: attendance.db (SQLite) -> Postgres.
// Usage: DATABASE_URL=postgres://... node scripts/migrate-sqlite-to-pg.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'
import pg from 'pg'
import { PG_DDL } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'attendance.db')
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is required.')
  console.error('Example: DATABASE_URL=postgres://elyx:elyxsecret@localhost:5432/elyx node scripts/migrate-sqlite-to-pg.mjs')
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

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 })

async function main() {
  console.log('Creating schema...')
  for (const ddl of PG_DDL) await pool.query(ddl)

  // Identify tables actually present in SQLite so a partially-migrated DB can rerun safely.
  const sqliteTables = sqliteQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").map(r => r.name)

  for (const table of sqliteTables) {
    // Skip views/oddities, only copy known app tables.
    if (!PG_DDL.some(d => d.includes(`TABLE IF NOT EXISTS ${table}`)) && !SERIAL_TABLES.includes(table)) {
      console.log(`  skipping non-app table: ${table}`)
      continue
    }
    const rows = sqliteQuery(`SELECT * FROM "${table}"`)
    if (!rows.length) {
      console.log(`  ${table}: 0 rows (cleared)`)
      await pool.query(`TRUNCATE TABLE "${table}"`)
      continue
    }

    const typeRows = (await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table])).rows
    const typeOf = Object.fromEntries(typeRows.map(r => [r.column_name, r.data_type]))

    await pool.query(`TRUNCATE TABLE "${table}"`)
    const batchSize = 500
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      for (const row of batch) {
        const cols = Object.keys(row)
        const ph = cols.map((_, j) => '$' + (j + 1)).join(', ')
        const vals = cols.map(c => {
          let v = row[c]
          if (v === undefined || v === null) {
            return (typeOf[c] ?? '').includes('int') ? 0 : ''
          }
          return v
        })
        await pool.query(
          `INSERT INTO "${table}" ("${cols.join('", "')}") VALUES (${ph})`, vals)
      }
      console.log(`  ${table}: ${Math.min(batch.length + i, rows.length)}/${rows.length}`)
    }

    // Keep SERIAL sequences ahead of any explicit ids that were copied.
    if (SERIAL_TABLES.includes(table)) {
      const seq = await pool.query(`SELECT pg_get_serial_sequence('${table}', 'id') AS seq`)
      if (seq.rows[0]?.seq) {
        await pool.query(`SELECT setval($1, COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`, [seq.rows[0].seq])
      }
    }
  }

  console.log('Migration complete.')
  await pool.end()
}

main().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})