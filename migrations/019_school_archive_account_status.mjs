// Migration: 019_school_archive_account_status.mjs
// Description: Track account statuses changed by school archiving.
// This migration is schema-only and does not modify existing users or schools.

export const id = '019_school_archive_account_status'
export const description = 'Track account statuses changed by school archiving'

export async function up({ run, isMysql }) {
  await run(isMysql
    ? `CREATE TABLE IF NOT EXISTS school_archive_user_status (
        user_id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL,
        prior_status VARCHAR(32) NOT NULL,
        archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    : `CREATE TABLE IF NOT EXISTS school_archive_user_status (
        user_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        prior_status TEXT NOT NULL,
        archived_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`)
}

export async function down({ run, isMysql }) {
  // This table contains restoration metadata and is intentionally retained in
  // normal deployments so a rollback cannot silently lose account history.
  return undefined
}
