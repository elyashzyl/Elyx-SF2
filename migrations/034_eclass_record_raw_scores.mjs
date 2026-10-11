// Migration: 034_eclass_record_raw_scores.mjs
// Description: Create class_record_configs table and add raw_scores column to learner_grades
// for DepEd Order No. 8, s. 2015 Electronic Class Records with adjustable component percentages
// (Written Works, Performance Tasks, Quarterly Exam) and item-level raw scores.
// Schema-only migration; zero operational seeding.

export const id = '034_eclass_record_raw_scores'
export const description = 'Create class_record_configs table and add raw_scores column to learner_grades for DepEd E-Class Records'

async function addColumn(run, isMysql, table, name, mysqlDefinition, sqliteDefinition) {
  try {
    await run(`ALTER TABLE ${table} ADD COLUMN ${name} ${isMysql ? mysqlDefinition : sqliteDefinition}`)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS class_record_configs (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        grade_level VARCHAR(64) NOT NULL DEFAULT '',
        section VARCHAR(64) NOT NULL DEFAULT '',
        subject_id VARCHAR(96) NOT NULL,
        school_year VARCHAR(32) NOT NULL DEFAULT '',
        quarter VARCHAR(8) NOT NULL DEFAULT 'Q1',
        weight_ww INT NOT NULL DEFAULT 30,
        weight_pt INT NOT NULL DEFAULT 50,
        weight_qa INT NOT NULL DEFAULT 20,
        ww_hps TEXT NOT NULL,
        pt_hps TEXT NOT NULL,
        qa_hps TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_class_rec_cfg (school_id, grade_level, section, subject_id, school_year, quarter)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS class_record_configs (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL DEFAULT '',
        grade_level TEXT NOT NULL DEFAULT '',
        section TEXT NOT NULL DEFAULT '',
        subject_id TEXT NOT NULL,
        school_year TEXT NOT NULL DEFAULT '',
        quarter TEXT NOT NULL DEFAULT 'Q1',
        weight_ww INTEGER NOT NULL DEFAULT 30,
        weight_pt INTEGER NOT NULL DEFAULT 50,
        weight_qa INTEGER NOT NULL DEFAULT 20,
        ww_hps TEXT NOT NULL DEFAULT '[]',
        pt_hps TEXT NOT NULL DEFAULT '[]',
        qa_hps TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_class_rec_cfg ON class_record_configs (school_id, grade_level, section, subject_id, school_year, quarter)')
    } catch {}
  }

  // Add raw_scores column to learner_grades for persisting item-level raw scores breakdown
  await addColumn(run, isMysql, 'learner_grades', 'raw_scores', 'LONGTEXT NULL', 'TEXT NULL')
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS class_record_configs')
}
