import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function runScript(script, args, env) {
  return execFileSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
}

test('SQLite backup can be restored with a safety copy', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'elytrack-backup-'))
  const dbPath = path.join(tempRoot, 'attendance.db')
  const backupDir = path.join(tempRoot, 'backups')
  const env = {
    DB_CONNECTION: 'sqlite',
    DATABASE_URL: '',
    REQUIRE_MYSQL: '0',
    DB_PATH: dbPath,
    BACKUP_DIR: backupDir
  }

  try {
    runScript('migrate.mjs', [], env)
    runScript('backup.mjs', [], env)

    const backups = fs.readdirSync(backupDir).filter(file => file.endsWith('.db'))
    assert.equal(backups.length, 1, 'backup should create one SQLite snapshot')

    const backupPath = path.join(backupDir, backups[0])
    const restoreOutput = runScript('restore.mjs', ['--file', backupPath, '--force'], env)
    assert.match(restoreOutput, /SQLite database restored/i)
    assert.match(restoreOutput, /Previous database saved/i)

    const safetyCopies = fs.readdirSync(tempRoot).filter(file => file.includes('.pre-restore-'))
    assert.equal(safetyCopies.length, 1, 'restore should preserve the previous database')
    assert.ok(fs.statSync(dbPath).size > 0, 'restored database should not be empty')
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})
