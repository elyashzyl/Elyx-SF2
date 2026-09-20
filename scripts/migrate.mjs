// Database Migration Runner for ElyTrack
// Runs versioned migrations from the migrations/ directory.
//
// Usage:
//   npm run db:migrate           # Run all pending migrations
//   npm run db:migrate:fresh     # Drop all tables and rerun all migrations
//   npm run db:migrate:status    # Check migration status
//
// Environment variables:
//   DATABASE_URL (optional: for MySQL e.g. mysql://user:pass@localhost:3306/elytrack)
//   DB_PATH      (optional: for SQLite e.g. /data/attendance.db, default attendance.db)

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { initDatabase, query, run, saveDatabase, DB_MODE } from '../db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const migrationsDir = path.join(projectRoot, 'migrations')

function parseArgs(argv) {
  const args = { fresh: false, status: false, help: false }
  for (const arg of argv) {
    if (arg === '--fresh') args.fresh = true
    else if (arg === '--status') args.status = true
    else if (arg === '--help' || arg === '-h') args.help = true
  }
  return args
}

function printHelp() {
  console.log(`
ElyTrack Database Migration Runner

Commands:
  node scripts/migrate.mjs            Run all pending migrations
  node scripts/migrate.mjs --fresh    Drop all tables and rerun all migrations from scratch
  node scripts/migrate.mjs --status   List all migrations and their status
  node scripts/migrate.mjs --help     Show this help message

Environment Variables:
  DATABASE_URL    MySQL connection URL (if omitted, SQLite is used)
  DB_PATH         SQLite file path (default: attendance.db)
`)
}

async function ensureMysqlDatabaseExists(databaseUrl) {
  try {
    const u = new URL(databaseUrl)
    const dbName = u.pathname.replace(/^\//, '')
    if (!dbName) return

    const host = u.hostname
    const port = u.port ? Number(u.port) : 3306
    const user = u.username ? decodeURIComponent(u.username) : undefined
    const password = u.password ? decodeURIComponent(u.password) : undefined

    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 8000
    })

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await conn.end()
    console.log(`[db] MySQL database "${dbName}" verified / created.`)
  } catch (err) {
    console.warn(`[db] Note: Could not pre-verify MySQL database creation (${err.message}). Proceeding with connection pool.`)
  }
}

async function ensureMigrationsTable(isMysql) {
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
  }
}

async function dropAllTables(isMysql) {
  console.log('Dropping all existing database tables (--fresh requested)...')
  if (isMysql) {
    await run('SET FOREIGN_KEY_CHECKS = 0')
    const tables = await query(`
      SELECT table_name AS tbl
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `)
    for (const row of tables) {
      if (row.tbl) await run(`DROP TABLE IF EXISTS \`${row.tbl}\``)
    }
    await run('SET FOREIGN_KEY_CHECKS = 1')
  } else {
    const tables = await query(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `)
    for (const row of tables) {
      if (row.name) await run(`DROP TABLE IF EXISTS \`${row.name}\``)
    }
  }
  saveDatabase()
  console.log('All tables successfully dropped.')
}

async function loadMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) return []
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.mjs') || f.endsWith('.js'))
    .sort()

  const loaded = []
  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const fileUrl = path.isAbsolute(filePath)
      ? new URL(`file://${filePath.replace(/\\/g, '/')}`).href
      : `./${path.relative(process.cwd(), filePath).replace(/\\/g, '/')}`

    const mod = await import(fileUrl)
    loaded.push({
      file,
      id: mod.id || path.basename(file, path.extname(file)),
      description: mod.description || '',
      up: mod.up,
      down: mod.down
    })
  }
  return loaded
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const isMysql = !!process.env.DATABASE_URL
  if (isMysql) {
    await ensureMysqlDatabaseExists(process.env.DATABASE_URL)
  } else {
    const dbPath = path.resolve(process.env.DB_PATH || path.join(projectRoot, 'attendance.db'))
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
  }

  await initDatabase()
  console.log(`[db] Active backend: ${DB_MODE.toUpperCase()}`)

  if (args.fresh) {
    await dropAllTables(isMysql)
  }

  await ensureMigrationsTable(isMysql)

  const migrations = await loadMigrationFiles()
  const appliedRows = await query('SELECT name, applied_at FROM _migrations ORDER BY id ASC')
  const appliedMap = new Map(appliedRows.map(r => [r.name, r.applied_at]))

  if (args.status) {
    console.log('\nMigration Status:')
    console.log('----------------------------------------------------------------------')
    for (const m of migrations) {
      const isApplied = appliedMap.has(m.id)
      const statusStr = isApplied ? `[✓] Applied (${appliedMap.get(m.id)})` : '[ ] Pending'
      console.log(`${statusStr.padEnd(38)} ${m.id} - ${m.description}`)
    }
    console.log('----------------------------------------------------------------------\n')
    process.exit(0)
  }

  const pending = migrations.filter(m => !appliedMap.has(m.id))
  if (pending.length === 0) {
    console.log('[db] Database is already up to date. No pending migrations.')
    process.exit(0)
  }

  console.log(`[db] Running ${pending.length} pending migration(s)...`)
  for (const m of pending) {
    console.log(`  → Migrating: ${m.id} (${m.description || 'no description'})`)
    if (typeof m.up !== 'function') {
      throw new Error(`Migration ${m.id} is missing an up() export function.`)
    }

    await m.up({ query, run, isMysql })
    await run('INSERT INTO _migrations (name) VALUES (?)', [m.id])
    saveDatabase()
    console.log(`  ✓ Applied:   ${m.id}`)
  }

  console.log(`\n[db] All migrations applied successfully (${pending.length} applied).`)
}

main().catch(err => {
  console.error('\n[db] Migration failed:', err)
  process.exit(1)
})
