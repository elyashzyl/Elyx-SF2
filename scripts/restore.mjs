// Restore an ElyTrack database backup.
//
// SQLite usage:
//   node scripts/restore.mjs --file ./backups/attendance-backup-2026-01-01.db --force
//
// MySQL usage:
//   DATABASE_URL=mysql://user:pass@host:3306/db \
//     node scripts/restore.mjs --file ./backups/elytrack-mysql-db-2026-01-01.sql --force
//
// `--force` is required because restoring replaces the active database.
// The current SQLite database is copied to a timestamped safety backup first.

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

function parseArgs(argv) {
  const options = { force: false, help: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--file') options.file = argv[++i]
    else if (arg === '--force') options.force = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return options
}

function timestamp() {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
}

function printHelp() {
  console.log(`Restore an ElyTrack database backup.

Options:
  --file <path>   Backup file to restore (required)
  --force         Confirm that the active database may be replaced
  -h, --help      Show this help

Environment variables:
  BACKUP_FILE     Backup file path when --file is omitted
  DB_PATH         Active SQLite database path (default: attendance.db)
  DATABASE_URL    MySQL connection URL when restoring a .sql dump

Safety:
  Restore is refused unless --force is provided. Existing SQLite databases are
  copied to <database>.pre-restore-<timestamp> before replacement.
`)
}

function resolveBackupPath(value) {
  if (!value) throw new Error('A backup file is required. Use --file <path> or BACKUP_FILE.')
  return path.resolve(process.cwd(), value)
}

function resolveSqlitePath() {
  const configured = process.env.DB_PATH?.trim()
  return configured
    ? (path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured))
    : path.join(projectRoot, 'attendance.db')
}

function resolveDatabaseUrl() {
  const explicit = (
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_CONNECTION_URL ||
    process.env.DB_URL ||
    process.env.MYSQL_URI ||
    process.env.DB_URI
  )?.trim()
  if (explicit) return explicit

  const host = (process.env.DB_HOST || process.env.MYSQL_HOST || process.env.DATABASE_HOST)?.trim()
  const database = (process.env.DB_DATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE)?.trim()
  const username = (process.env.DB_USERNAME || process.env.DB_USER || process.env.MYSQL_USER)?.trim()
  if (!host || !database || !username) return ''

  const port = (process.env.DB_PORT || process.env.MYSQL_PORT || '3306').trim()
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || ''
  return `mysql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`
}

async function validateSqliteBackup(backupPath) {
  const contents = fs.readFileSync(backupPath)
  if (contents.length === 0) throw new Error('The SQLite backup file is empty.')

  const SQL = await initSqlJs()
  const database = new SQL.Database(contents)
  try {
    const result = database.exec("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'")
    const tableCount = Number(result[0]?.values?.[0]?.[0] || 0)
    if (tableCount < 1) throw new Error('The SQLite backup does not contain any tables.')
    return tableCount
  } finally {
    database.close()
  }
}

async function restoreSqlite(backupPath) {
  const tableCount = await validateSqliteBackup(backupPath)
  const databasePath = resolveSqlitePath()
  const databaseDir = path.dirname(databasePath)
  fs.mkdirSync(databaseDir, { recursive: true })

  const safetyBackup = fs.existsSync(databasePath)
    ? `${databasePath}.pre-restore-${timestamp()}`
    : null
  const temporaryPath = `${databasePath}.restore-${process.pid}`

  try {
    if (safetyBackup) fs.copyFileSync(databasePath, safetyBackup)
    fs.copyFileSync(backupPath, temporaryPath)
    fs.renameSync(temporaryPath, databasePath)
  } finally {
    if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true })
  }

  console.log(`[restore] SQLite database restored to ${databasePath}.`)
  console.log(`[restore] Validated ${tableCount} table(s) from ${backupPath}.`)
  if (safetyBackup) console.log(`[restore] Previous database saved to ${safetyBackup}.`)
}

function restoreMysql(backupPath, databaseUrl) {
  const url = new URL(databaseUrl)
  const database = url.pathname.replace(/^\//, '')
  if (!database) throw new Error('DATABASE_URL must include a database name.')

  const args = [
    `--host=${url.hostname}`,
    `--port=${url.port || '3306'}`,
    `--user=${decodeURIComponent(url.username || '')}`,
    database
  ]
  const env = { ...process.env }
  if (url.password) env.MYSQL_PWD = decodeURIComponent(url.password)

  return new Promise((resolve, reject) => {
    const child = spawn('mysql', args, { env, stdio: ['pipe', 'inherit', 'pipe'] })
    const stream = fs.createReadStream(backupPath)
    let stderr = ''

    child.stderr.on('data', data => { stderr += data.toString() })
    child.on('error', error => {
      if (error.code === 'ENOENT') reject(new Error('The mysql client is required to restore a MySQL dump.'))
      else reject(error)
    })
    child.on('close', code => {
      if (code === 0) {
        console.log(`[restore] MySQL database restored from ${backupPath}.`)
        resolve()
      } else {
        reject(new Error(`mysql restore failed with exit code ${code}: ${stderr.trim()}`))
      }
    })

    stream.on('error', error => {
      child.kill()
      reject(error)
    })
    stream.pipe(child.stdin)
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }
  if (!options.force) {
    throw new Error('Restore refused. Re-run with --force after confirming the backup and target database.')
  }

  const backupPath = resolveBackupPath(options.file || process.env.BACKUP_FILE)
  if (!fs.existsSync(backupPath)) throw new Error(`Backup file not found: ${backupPath}`)

  const databaseUrl = resolveDatabaseUrl()
  const isMysqlDump = path.extname(backupPath).toLowerCase() === '.sql'
  if (isMysqlDump) {
    if (!databaseUrl || databaseUrl.startsWith('sqlite')) {
      throw new Error('A MySQL DATABASE_URL is required to restore an .sql backup.')
    }
    await restoreMysql(backupPath, databaseUrl)
  } else {
    await restoreSqlite(backupPath)
  }
}

main().catch(error => {
  console.error('[restore] Restore failed:', error.message)
  process.exit(1)
})
