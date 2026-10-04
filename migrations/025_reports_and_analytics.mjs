// Migration: 025_reports_and_analytics.mjs
// Description: Add database tables for saved report views, report archives,
// and asynchronous report generation jobs.
// This migration is schema-only and never inserts or modifies operational records.

export const id = '025_reports_and_analytics'
export const description = 'Add saved report views, report archives, and export job tracking'

export async function up({ run, isMysql }) {
  // 1. Saved report views (user and school-scoped filter presets)
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS saved_report_views (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL,
        user_id VARCHAR(96) NOT NULL,
        name VARCHAR(255) NOT NULL,
        report_type VARCHAR(64) NOT NULL DEFAULT 'dashboard',
        filters_json LONGTEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_saved_views_school_user (school_id, user_id),
        INDEX idx_saved_views_type (school_id, report_type)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS saved_report_views (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        report_type TEXT NOT NULL DEFAULT 'dashboard',
        filters_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_saved_views_school_user ON saved_report_views (school_id, user_id)')
      await run('CREATE INDEX IF NOT EXISTS idx_saved_views_type ON saved_report_views (school_id, report_type)')
    } catch {}
  }

  // 2. Report archives (historical repository of generated reports with metadata)
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS report_archives (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL,
        created_by VARCHAR(96) NOT NULL DEFAULT '',
        created_by_name VARCHAR(255) NOT NULL DEFAULT '',
        report_type VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        parameters_json LONGTEXT NOT NULL,
        file_format VARCHAR(32) NOT NULL DEFAULT 'csv',
        file_size INT NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'completed',
        content_data LONGTEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_report_archives_school (school_id, created_at),
        INDEX idx_report_archives_type (school_id, report_type)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS report_archives (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        created_by TEXT NOT NULL DEFAULT '',
        created_by_name TEXT NOT NULL DEFAULT '',
        report_type TEXT NOT NULL,
        title TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        file_format TEXT NOT NULL DEFAULT 'csv',
        file_size INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'completed',
        content_data TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_report_archives_school ON report_archives (school_id, created_at)')
      await run('CREATE INDEX IF NOT EXISTS idx_report_archives_type ON report_archives (school_id, report_type)')
    } catch {}
  }

  // 3. Report generation jobs (status tracking for large exports and async reports)
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS report_jobs (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL,
        user_id VARCHAR(96) NOT NULL,
        report_type VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        progress INT NOT NULL DEFAULT 0,
        parameters_json LONGTEXT NOT NULL,
        result_archive_id VARCHAR(96) NOT NULL DEFAULT '',
        error_message TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_report_jobs_user (user_id, status),
        INDEX idx_report_jobs_school (school_id, status)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS report_jobs (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        report_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        progress INTEGER NOT NULL DEFAULT 0,
        parameters_json TEXT NOT NULL,
        result_archive_id TEXT NOT NULL DEFAULT '',
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_report_jobs_user ON report_jobs (user_id, status)')
      await run('CREATE INDEX IF NOT EXISTS idx_report_jobs_school ON report_jobs (school_id, status)')
    } catch {}
  }
}

export async function down({ run }) {
  // Schema changes are append-only.
  return undefined
}
