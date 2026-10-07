// Migration: 030_quarterly_terms_and_analytics.mjs
// Description: Create quarterly_terms table for configurable academic quarters,
// custom reporting months, date ranges, and school-specific DepEd Form 2 summaries.
// Schema-only migration; zero operational seeding.

export const id = '030_quarterly_terms_and_analytics'
export const description = 'Create quarterly_terms table for configurable quarters and grading periods'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS quarterly_terms (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        quarter_number INT NOT NULL,
        quarter_name VARCHAR(128) NOT NULL DEFAULT '',
        school_year VARCHAR(32) NOT NULL DEFAULT '',
        months VARCHAR(255) NOT NULL DEFAULT '',
        start_date VARCHAR(10) NOT NULL DEFAULT '',
        end_date VARCHAR(10) NOT NULL DEFAULT '',
        target_days INT NOT NULL DEFAULT 50,
        is_active INT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_quarterly_school_sy (school_id, school_year, quarter_number)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS quarterly_terms (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL DEFAULT '',
        quarter_number INTEGER NOT NULL,
        quarter_name TEXT NOT NULL DEFAULT '',
        school_year TEXT NOT NULL DEFAULT '',
        months TEXT NOT NULL DEFAULT '',
        start_date TEXT NOT NULL DEFAULT '',
        end_date TEXT NOT NULL DEFAULT '',
        target_days INTEGER NOT NULL DEFAULT 50,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_quarterly_school_sy ON quarterly_terms (school_id, school_year, quarter_number)')
    } catch {}
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS quarterly_terms')
}
