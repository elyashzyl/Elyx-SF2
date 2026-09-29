#!/usr/bin/env node
// Audit and explicitly migrate legacy plaintext user passwords.
//
// Usage:
//   npm run passwords:audit
//   npm run passwords:migrate -- --confirm
//
// The migration command must be run after taking and verifying a database
// backup. It never prints password or seed-file values.

import 'dotenv/config'
import process from 'node:process'
import { initDatabase, query, run, saveDatabase, DB_MODE } from '../db.js'
import { hashLegacyPasswordForMigration, isPasswordHash } from '../lib/passwords.js'

function parseArgs(argv) {
  const options = { audit: false, migrate: false, confirm: false, help: false }
  for (const arg of argv) {
    if (arg === '--audit') options.audit = true
    else if (arg === '--migrate') options.migrate = true
    else if (arg === '--confirm') options.confirm = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Unknown option: ${arg}`)
  }
  return options
}

function printHelp() {
  console.log(`ElyTrack legacy password workflow

Commands:
  npm run passwords:audit
    Count bcrypt, legacy plaintext candidates, and empty/invalid password records.

  npm run passwords:migrate -- --confirm
    Replace legacy plaintext candidates with bcrypt hashes; leave empty/invalid values for password reset.
    Take and verify a database backup before running this command.

The workflow never prints stored password values. Authentication does not use
legacy plaintext passwords in production. Local/test plaintext compatibility
requires ALLOW_LEGACY_PASSWORD_LOGIN=1 and NODE_ENV must not be production.`)
}

function classifyPassword(value) {
  if (isPasswordHash(value)) return 'bcrypt'
  if (typeof value === 'string' && value.startsWith('$2')) return 'empty_or_invalid'
  if (typeof value === 'string' && value.length > 0) return 'legacy'
  return 'empty_or_invalid'
}

async function audit() {
  const rows = await query('SELECT password FROM users')
  const counts = { bcrypt: 0, legacy: 0, empty_or_invalid: 0 }
  for (const row of rows) counts[classifyPassword(row.password)] += 1
  console.log(`[passwords] Backend: ${DB_MODE.toUpperCase()}`)
  console.log(`[passwords] Accounts audited: ${rows.length}`)
  console.log(`[passwords] Bcrypt hashes: ${counts.bcrypt}`)
  console.log(`[passwords] Legacy plaintext records: ${counts.legacy}`)
  console.log(`[passwords] Empty/invalid password records: ${counts.empty_or_invalid}`)
  return counts
}

async function migrate() {
  const rows = await query('SELECT id, password FROM users')
  const legacyRows = rows.filter(row => classifyPassword(row.password) === 'legacy')
  if (legacyRows.length === 0) {
    console.log('[passwords] No legacy plaintext passwords found. No changes made.')
    return 0
  }

  let migrated = 0
  await run('BEGIN')
  try {
    for (const row of legacyRows) {
      const passwordHash = await hashLegacyPasswordForMigration(row.password)
      await run('UPDATE users SET password = ? WHERE id = ?', [passwordHash, row.id])
      migrated += 1
    }
    await run('COMMIT')
    saveDatabase()
  } catch (err) {
    try { await run('ROLLBACK') } catch {}
    throw err
  }
  console.log(`[passwords] Migrated ${migrated} legacy plaintext password record(s) to bcrypt.`)
  return migrated
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }
  if (options.audit === options.migrate) {
    throw new Error('Choose exactly one operation: --audit or --migrate')
  }
  if (options.migrate && !options.confirm) {
    throw new Error('Refusing to migrate without --confirm. Verify a database backup first.')
  }

  await initDatabase()
  if (options.audit) await audit()
  else await migrate()
}

main().catch(err => {
  console.error(`[passwords] ${err.message}`)
  process.exitCode = 1
})
