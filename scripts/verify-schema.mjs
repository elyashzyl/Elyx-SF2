#!/usr/bin/env node

// Read-only production schema verification. This command never runs migrations,
// creates tables, changes rows, or seeds data. It is intended for checking an
// existing MySQL database before/after a deployment.

import 'dotenv/config'
import mysql from 'mysql2/promise'

function value(name) {
  return String(process.env[name] ?? '').trim()
}

function resolveDatabaseUrl() {
  const explicit = value('DATABASE_URL') || value('MYSQL_URL') || value('DB_URL')
  if (explicit) return explicit

  const host = value('DB_HOST') || value('MYSQL_HOST')
  const database = value('DB_DATABASE') || value('DB_NAME') || value('MYSQL_DATABASE')
  const username = value('DB_USERNAME') || value('DB_USER') || value('MYSQL_USER')
  if (!host || !database || !username) return ''

  const port = value('DB_PORT') || value('MYSQL_PORT') || '3306'
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || ''
  return `mysql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`
}

function redact(url) {
  try {
    const parsed = new URL(url)
    parsed.password = '***'
    return parsed.href
  } catch {
    return '(configured)'
  }
}

const databaseUrl = resolveDatabaseUrl()
if (!databaseUrl) {
  console.error('[schema] Verification failed: MySQL DATABASE_URL or DB_* variables are required.')
  process.exitCode = 1
} else if (value('DB_CONNECTION').toLowerCase() === 'sqlite') {
  console.error('[schema] Verification failed: DB_CONNECTION=sqlite; this command requires MySQL.')
  process.exitCode = 1
} else {
  const connectionUrl = new URL(databaseUrl)
  let connection
  try {
    connection = await mysql.createConnection({
      host: connectionUrl.hostname,
      port: connectionUrl.port ? Number(connectionUrl.port) : 3306,
      user: decodeURIComponent(connectionUrl.username),
      password: decodeURIComponent(connectionUrl.password),
      database: decodeURIComponent(connectionUrl.pathname.replace(/^\//, '')),
      connectTimeout: 10000,
      dateStrings: true
    })
  } catch (error) {
    console.error(`[schema] Verification failed: unable to connect to ${redact(databaseUrl)} (${error.code || error.message})`)
    process.exitCode = 1
  }

  if (connection) try {
    const database = decodeURIComponent(connectionUrl.pathname.replace(/^\//, ''))
    const [tables] = await connection.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
      [database]
    )
    const existingTables = new Set(tables.map(row => row.table_name))

    const requiredTables = [
      'users',
      'schools',
      'grade_levels',
      'account_tokens',
      'auth_sessions',
      'school_archive_user_status',
      'audit_logs',
      'monthly_records'
    ]

    const requiredColumns = {
      users: ['school_id', 'account_status', 'last_login_at', 'password_changed_at', 'failed_login_count', 'locked_until', 'email', 'email_verified_at', 'avatar_url'],
      schools: ['attendance_lock_cutoff', 'contact_email', 'contact_phone', 'division', 'district', 'principal_name', 'school_year', 'grading_period', 'archived_at', 'archived_by', 'archive_reason'],
      grade_levels: ['school_id', 'grade', 'sections', 'sort'],
      account_tokens: ['user_id', 'token_type', 'token_hash', 'expires_at', 'used_at', 'created_by'],
      auth_sessions: ['user_id', 'impersonator_id', 'token_hash', 'expires_at', 'last_seen_at', 'revoked_at'],
      school_archive_user_status: ['user_id', 'school_id', 'prior_status', 'archived_at'],
      monthly_records: ['school_id', 'excluded_dates', 'include_saturdays']
    }

    const issues = []
    for (const table of requiredTables) {
      if (!existingTables.has(table)) {
        issues.push(`missing table: ${table}`)
        continue
      }
      const [columns] = await connection.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ?`,
        [database, table]
      )
      const existingColumns = new Set(columns.map(row => row.column_name))
      for (const column of requiredColumns[table] || []) {
        if (!existingColumns.has(column)) issues.push(`missing column: ${table}.${column}`)
      }
    }

    const [indexes] = await connection.query(
      `SELECT DISTINCT table_name, index_name
       FROM information_schema.statistics
       WHERE table_schema = ?
         AND index_name IN (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [database,
        'idx_users_school_role',
        'idx_students_school_status',
        'idx_enrollment_student_date',
        'idx_attendance_school_date',
        'idx_inquiries_user_status',
        'idx_inquiry_messages_thread',
        'idx_licenses_school_issued',
        'idx_subscription_requests_school_status',
        'idx_payment_methods_active_sort']
    )
    const expectedIndexes = [
      'idx_users_school_role',
      'idx_students_school_status',
      'idx_enrollment_student_date',
      'idx_attendance_school_date',
      'idx_inquiries_user_status',
      'idx_inquiry_messages_thread',
      'idx_licenses_school_issued',
      'idx_subscription_requests_school_status',
      'idx_payment_methods_active_sort'
    ]
    const existingIndexes = new Set(indexes.map(row => row.index_name))
    for (const index of expectedIndexes) {
      if (!existingIndexes.has(index)) issues.push(`missing index: ${index}`)
    }

    const [migrationRows] = await connection.query(
      `SELECT name FROM information_schema.tables
       WHERE table_schema = ? AND table_name = '_migrations'`,
      [database]
    )
    if (migrationRows.length === 0) {
      issues.push('missing table: _migrations')
    } else {
      const [applied] = await connection.query(
        `SELECT name FROM _migrations WHERE name IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          '010_attendance_locking_and_corrections',
          '011_student_enrollment_history',
          '012_auth_sessions',
          '013_enrollment_event_order',
          '014_operational_indexes',
          '015_user_account_lifecycle',
          '016_account_tokens_and_email',
          '017_school_profile_fields',
          '018_school_archive',
          '019_school_archive_account_status',
          '020_user_avatar_url',
          '021_repair_user_avatar_url',
          '022_monthly_saturdays'
        ]
      )
      const appliedNames = new Set(applied.map(row => row.name))
      for (const migration of [
        '010_attendance_locking_and_corrections',
        '011_student_enrollment_history',
        '012_auth_sessions',
        '013_enrollment_event_order',
        '014_operational_indexes',
        '015_user_account_lifecycle',
        '016_account_tokens_and_email',
        '017_school_profile_fields',
        '018_school_archive',
        '019_school_archive_account_status',
        '020_user_avatar_url',
        '021_repair_user_avatar_url',
        '022_monthly_saturdays'
      ]) {
        if (!appliedNames.has(migration)) issues.push(`migration not recorded: ${migration}`)
      }
    }

    console.log(`[schema] Checked ${redact(databaseUrl)}`)
    if (issues.length) {
      console.error('[schema] Verification failed:')
      for (const issue of issues) console.error(`[schema] ${issue}`)
      process.exitCode = 1
    } else {
      console.log('[schema] Verification passed. Required Phase 1 schema is present.')
    }
  } finally {
    await connection?.end()
  }
}
