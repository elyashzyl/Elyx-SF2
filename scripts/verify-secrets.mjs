#!/usr/bin/env node
// Verify that production deployment secrets are present and do not use
// common placeholder values. This does not print any secret values.

import 'dotenv/config'

const placeholders = new Set([
  '',
  'change-me',
  'changeme',
  'password',
  'secret',
  'replace-me',
  'your-password',
  'your-secret'
])

function value(name) {
  return String(process.env[name] ?? '').trim()
}

function addIssue(issues, message) {
  issues.push(message)
}

const production = value('NODE_ENV').toLowerCase() === 'production'
const issues = []
const databaseUrl = value('DATABASE_URL') || value('MYSQL_URL') || value('DB_URL')
const dbConnection = value('DB_CONNECTION').toLowerCase()
const hasDbParts = ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'].every(name => value(name))

if (production) {
  if (dbConnection === 'sqlite') {
    addIssue(issues, 'Production requires MySQL; SQLite is disabled for production deployments')
  }
  if (!databaseUrl && !hasDbParts) {
    addIssue(issues, 'A production MySQL DATABASE_URL or complete DB_* configuration is required')
  }
  if (value('DB_PASSWORD') && placeholders.has(value('DB_PASSWORD').toLowerCase())) {
    addIssue(issues, 'DB_PASSWORD still uses a common placeholder value')
  }
  if (value('DATABASE_URL') && /:(password|secret|changeme)@/i.test(value('DATABASE_URL'))) {
    addIssue(issues, 'DATABASE_URL still uses a common placeholder password')
  }
  if (value('ALLOW_LEGACY_PASSWORD_LOGIN') === '1') {
    addIssue(issues, 'ALLOW_LEGACY_PASSWORD_LOGIN must not be enabled in production')
  }
  if (value('SECRETS_ROTATED') !== '1') {
    addIssue(issues, 'Set SECRETS_ROTATED=1 only after the provider credentials and exposed application secrets have been replaced')
  }
}

if (issues.length) {
  console.error('[secrets] Verification failed:')
  for (const issue of issues) console.error(`[secrets] ${issue}`)
  process.exitCode = 1
} else {
  console.log(`[secrets] Verification passed (${production ? 'production' : 'non-production'} configuration).`)
}
