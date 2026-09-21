// Production Database Backup Strategy for ElyTrack
// Supports automated backup for both SQLite and MySQL deployments.
//
// Usage:
//   node scripts/backup.mjs
//   npm run db:backup
//
// Environment variables:
//   BACKUP_DIR      Target directory (default: /data/backups if /data exists, else ./backups)
//   BACKUP_RETAIN   Days of backups to keep (default: 14)
//   DATABASE_URL    MySQL connection string (if using MySQL)
//   DB_PATH         SQLite database file path (default: attendance.db)

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

const backupDir = process.env.BACKUP_DIR || (fs.existsSync('/data') ? '/data/backups' : path.join(projectRoot, 'backups'))
const retentionDays = parseInt(process.env.BACKUP_RETAIN || '14', 10)

function getTimestamp() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
}

function cleanOldBackups(dir, maxAgeDays) {
  if (!fs.existsSync(dir)) return
  const now = Date.now()
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
  const files = fs.readdirSync(dir)

  for (const f of files) {
    if (!f.startsWith('elytrack-') && !f.startsWith('attendance-')) continue
    const fullPath = path.join(dir, f)
    try {
      const stat = fs.statSync(fullPath)
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fullPath)
        console.log(`[backup] Removed expired backup: ${f}`)
      }
    } catch (_) {}
  }
}

async function backupSqlite() {
  const dbPath = process.env.DB_PATH || (process.env.NODE_ENV === 'production' && fs.existsSync('/data/attendance.db') ? '/data/attendance.db' : path.join(projectRoot, 'attendance.db'))
  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database not found at path: ${dbPath}`)
  }

  const timestamp = getTimestamp()
  const destFile = path.join(backupDir, `attendance-backup-${timestamp}.db`)

  fs.copyFileSync(dbPath, destFile)
  const stats = fs.statSync(destFile)
  console.log(`[backup] SQLite snapshot saved: ${destFile} (${(stats.size / 1024).toFixed(1)} KB)`)
  return destFile
}

async function backupMysql(databaseUrl) {
  const u = new URL(databaseUrl)
  const host = u.hostname
  const port = u.port || '3306'
  const user = u.username ? decodeURIComponent(u.username) : 'root'
  const password = u.password ? decodeURIComponent(u.password) : ''
  const dbName = u.pathname.replace(/^\//, '')

  const timestamp = getTimestamp()
  const destFile = path.join(backupDir, `elytrack-mysql-${dbName}-${timestamp}.sql`)

  console.log(`[backup] Initiating mysqldump for database: ${dbName} on ${host}:${port}...`)

  const args = [
    `--host=${host}`,
    `--port=${port}`,
    `--user=${user}`,
    '--single-transaction',
    '--quick',
    '--routines',
    '--triggers',
    dbName
  ]

  const env = { ...process.env }
  if (password) {
    env.MYSQL_PWD = password
  }

  return new Promise((resolve, reject) => {
    const dumpProc = spawn('mysqldump', args, { env })
    const writeStream = fs.createWriteStream(destFile)

    dumpProc.stdout.pipe(writeStream)

    let stderr = ''
    dumpProc.stderr.on('data', (d) => { stderr += d.toString() })

    dumpProc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('[backup] WARNING: "mysqldump" binary not found in PATH. Falling back to table query export.')
        fallbackMysqlExport(databaseUrl, destFile).then(resolve).catch(reject)
      } else {
        reject(err)
      }
    })

    dumpProc.on('close', (code) => {
      if (code === 0) {
        const stats = fs.statSync(destFile)
        console.log(`[backup] MySQL dump completed: ${destFile} (${(stats.size / 1024).toFixed(1)} KB)`)
        resolve(destFile)
      } else {
        reject(new Error(`mysqldump exited with code ${code}: ${stderr}`))
      }
    })
  })
}

async function fallbackMysqlExport(databaseUrl, destFile) {
  const mysql = await import('mysql2/promise')
  const conn = await mysql.createConnection(databaseUrl)
  try {
    const [tables] = await conn.query('SHOW TABLES')
    const tableKey = Object.keys(tables[0] || {})[0]
    let sqlDump = `-- ElyTrack Fallback SQL Dump\n-- Generated: ${new Date().toISOString()}\n\nSET foreign_key_checks = 0;\n\n`

    for (const row of tables) {
      const tbl = row[tableKey]
      const [[createRow]] = await conn.query(`SHOW CREATE TABLE \`${tbl}\``)
      sqlDump += `DROP TABLE IF EXISTS \`${tbl}\`;\n`
      sqlDump += `${createRow['Create Table']};\n\n`

      const [rows] = await conn.query(`SELECT * FROM \`${tbl}\``)
      for (const r of rows) {
        const cols = Object.keys(r).map(c => `\`${c}\``).join(', ')
        const vals = Object.values(r).map(v => (v === null ? 'NULL' : conn.escape(v))).join(', ')
        sqlDump += `INSERT INTO \`${tbl}\` (${cols}) VALUES (${vals});\n`
      }
      sqlDump += '\n'
    }

    sqlDump += 'SET foreign_key_checks = 1;\n'
    fs.writeFileSync(destFile, sqlDump, 'utf8')
    console.log(`[backup] Fallback MySQL dump generated: ${destFile}`)
    return destFile
  } finally {
    await conn.end()
  }
}

async function main() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  console.log(`[backup] ElyTrack Database Backup Utility`)
  console.log(`[backup] Destination directory: ${backupDir}`)

  const databaseUrl = process.env.DATABASE_URL
  let backupFile

  if (databaseUrl && !databaseUrl.startsWith('sqlite')) {
    backupFile = await backupMysql(databaseUrl)
  } else {
    backupFile = await backupSqlite()
  }

  cleanOldBackups(backupDir, retentionDays)
  console.log(`[backup] Backup routine finished successfully. (Retaining past ${retentionDays} days)`)
}

main().catch((err) => {
  console.error('[backup] Backup failed:', err.message)
  process.exit(1)
})
