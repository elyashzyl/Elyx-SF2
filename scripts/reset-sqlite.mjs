// Rebuild the active SQLite database from its existing schema and data.
// Existing users and records are copied; only the selected reset account's
// password is changed. The old database is retained as a timestamped backup.
//
// Usage:
//   npm run db:reset
//   RESET_USERNAME=admin RESET_PASSWORD="new-password" npm run db:reset
//   node scripts/reset-sqlite.mjs --username admin --password "new-password"

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const dbPath = path.resolve(process.env.DB_PATH || path.join(projectRoot, 'attendance.db'))

function parseArgs(args) {
  const options = {}
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--username') options.username = args[++i]
    else if (arg === '--password') options.password = args[++i]
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return options
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function quoteTable(value) {
  return quoteIdentifier(value)
}

function readRows(db, sql) {
  const result = db.exec(sql)
  if (!result.length) return { columns: [], values: [] }
  return { columns: result[0].columns, values: result[0].values }
}

function getTableColumns(db, tableName) {
  return readRows(db, `PRAGMA table_info(${quoteTable(tableName)})`).values.map(row => row[1])
}

function timestamp() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
}

function printHelp() {
  console.log(`Rebuild the active SQLite database while preserving existing data.

Options:
  --username <name>    Account whose password will be reset (default: admin)
  --password <value>   New password (default: admin123)
  -h, --help           Show this help

Environment equivalents:
  DB_PATH, RESET_USERNAME, RESET_PASSWORD
`)
}

const options = parseArgs(process.argv.slice(2))
if (options.help) {
  printHelp()
  process.exit(0)
}

const resetUsername = options.username || process.env.RESET_USERNAME || 'admin'
const resetPassword = options.password || process.env.RESET_PASSWORD || 'admin123'

if (!resetUsername || !resetPassword) {
  throw new Error('Both a reset username and password are required.')
}
if (resetPassword === 'admin123') {
  console.warn('WARNING: using the development default password. Set RESET_PASSWORD or --password before production use.')
}
if (!fs.existsSync(dbPath)) {
  throw new Error(`SQLite database not found at ${dbPath}`)
}

const tempPath = `${dbPath}.new-${process.pid}`
const backupPath = `${dbPath}.backup-${timestamp()}`
if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true })

const SQL = await initSqlJs()
const source = new SQL.Database(fs.readFileSync(dbPath))
const target = new SQL.Database()

try {
  const schema = readRows(source, `
    SELECT type, name, tbl_name, sql
    FROM sqlite_master
    WHERE sql IS NOT NULL
      AND name NOT LIKE 'sqlite_%'
    ORDER BY
      CASE type
        WHEN 'table' THEN 0
        WHEN 'index' THEN 1
        WHEN 'trigger' THEN 2
        WHEN 'view' THEN 3
        ELSE 4
      END,
      name
  `).values

  const tables = schema.filter(row => row[0] === 'table')
  const otherObjects = schema.filter(row => row[0] !== 'table')

  for (const [, , , sql] of tables) target.run(sql)

  let copiedRows = 0
  const rowCounts = {}
  for (const [, tableName] of tables) {
    const columns = getTableColumns(source, tableName)
    if (columns.length === 0) continue

    const rows = readRows(source, `SELECT ${columns.map(quoteIdentifier).join(', ')} FROM ${quoteTable(tableName)}`).values
    const insertSql = `INSERT INTO ${quoteTable(tableName)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
    for (const row of rows) target.run(insertSql, row)
    copiedRows += rows.length
    rowCounts[tableName] = rows.length
  }

  // Explicit ids in AUTOINCREMENT tables should not cause the next insert to
  // reuse an existing id. sqlite_sequence is created automatically by SQLite.
  try {
    const sequenceRows = readRows(source, 'SELECT name, seq FROM sqlite_sequence').values
    for (const [name, seq] of sequenceRows) {
      target.run('UPDATE sqlite_sequence SET seq = ? WHERE name = ?', [seq, name])
      if (target.getRowsModified() === 0) target.run('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)', [name, seq])
    }
  } catch {
    // Databases without AUTOINCREMENT tables do not have sqlite_sequence.
  }

  for (const [, , , sql] of otherObjects) target.run(sql)

  const userColumns = getTableColumns(target, 'users')
  if (!userColumns.includes('username') || !userColumns.includes('password')) {
    throw new Error('The users table does not contain username/password columns.')
  }

  const userRows = readRows(target, `SELECT ${userColumns.map(quoteIdentifier).join(', ')} FROM ${quoteTable('users')}`).values
  const usernameIndex = userColumns.indexOf('username')
  const existingUser = userRows.find(row => row[usernameIndex] === resetUsername)

  if (existingUser) {
    target.run(`UPDATE ${quoteTable('users')} SET ${quoteIdentifier('password')} = ? WHERE ${quoteIdentifier('username')} = ?`, [resetPassword, resetUsername])
  } else {
    const required = ['id', 'username', 'password', 'name', 'role']
    const missing = required.filter(column => !userColumns.includes(column))
    if (missing.length) throw new Error(`Cannot create reset account; users table is missing: ${missing.join(', ')}`)

    const newUser = {
      id: `reset-${Date.now().toString(36)}`,
      username: resetUsername,
      password: resetPassword,
      name: 'System Admin',
      role: 'superadmin',
      grade: '',
      section: '',
      period: '',
      school_id: ''
    }
    const columns = userColumns.filter(column => Object.hasOwn(newUser, column))
    target.run(
      `INSERT INTO ${quoteTable('users')} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map(column => newUser[column])
    )
    console.log(`Created reset account ${resetUsername} because it was not present in the old database.`)
  }

  fs.writeFileSync(tempPath, Buffer.from(target.export()))
  fs.copyFileSync(dbPath, backupPath)
  fs.renameSync(tempPath, dbPath)

  console.log(`SQLite database rebuilt: ${dbPath}`)
  console.log(`Backup saved: ${backupPath}`)
  console.log(`Copied ${copiedRows} rows across ${tables.length} tables.`)
  console.log(`Reset login username: ${resetUsername}`)
  console.log('Password was supplied through the command line or environment and is not printed.')
  console.log(`Migrated table counts: ${JSON.stringify(rowCounts)}`)
} finally {
  source.close()
  target.close()
  if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true })
}
