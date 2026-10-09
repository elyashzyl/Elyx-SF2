// Migration: 031_academic_grading_and_form138.mjs
// Description: Create grading_subjects and learner_grades tables for DepEd Form 137/138
// academic assessments, quarterly grades, transmuted ratings, and report cards.
// Schema-only migration; zero operational seeding.

export const id = '031_academic_grading_and_form138'
export const description = 'Create grading_subjects and learner_grades tables for DepEd grading and Form 138'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS grading_subjects (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        grade_level VARCHAR(64) NOT NULL DEFAULT '',
        subject_name VARCHAR(128) NOT NULL,
        subject_code VARCHAR(32) NOT NULL DEFAULT '',
        weight_ww INT NOT NULL DEFAULT 30,
        weight_pt INT NOT NULL DEFAULT 50,
        weight_qa INT NOT NULL DEFAULT 20,
        display_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_grading_subjects_school_grade (school_id, grade_level)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)

    await run(`
      CREATE TABLE IF NOT EXISTS learner_grades (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL DEFAULT '',
        student_id VARCHAR(96) NOT NULL,
        subject_id VARCHAR(96) NOT NULL,
        school_year VARCHAR(32) NOT NULL DEFAULT '',
        quarter VARCHAR(8) NOT NULL DEFAULT 'Q1',
        ww_score DECIMAL(6,2) NOT NULL DEFAULT 0,
        ww_total DECIMAL(6,2) NOT NULL DEFAULT 100,
        pt_score DECIMAL(6,2) NOT NULL DEFAULT 0,
        pt_total DECIMAL(6,2) NOT NULL DEFAULT 100,
        qa_score DECIMAL(6,2) NOT NULL DEFAULT 0,
        qa_total DECIMAL(6,2) NOT NULL DEFAULT 50,
        initial_grade DECIMAL(5,2) NOT NULL DEFAULT 0,
        transmuted_grade INT NOT NULL DEFAULT 75,
        remarks VARCHAR(64) NOT NULL DEFAULT 'Passed',
        is_locked INT NOT NULL DEFAULT 0,
        encoded_by VARCHAR(96) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_learner_grades_lookup (school_id, student_id, school_year, quarter),
        INDEX idx_learner_grades_subject (subject_id, school_year, quarter)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS grading_subjects (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL DEFAULT '',
        grade_level TEXT NOT NULL DEFAULT '',
        subject_name TEXT NOT NULL,
        subject_code TEXT NOT NULL DEFAULT '',
        weight_ww INTEGER NOT NULL DEFAULT 30,
        weight_pt INTEGER NOT NULL DEFAULT 50,
        weight_qa INTEGER NOT NULL DEFAULT 20,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_grading_subjects_school_grade ON grading_subjects (school_id, grade_level)')
    } catch {}

    await run(`
      CREATE TABLE IF NOT EXISTS learner_grades (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL DEFAULT '',
        student_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        school_year TEXT NOT NULL DEFAULT '',
        quarter TEXT NOT NULL DEFAULT 'Q1',
        ww_score REAL NOT NULL DEFAULT 0,
        ww_total REAL NOT NULL DEFAULT 100,
        pt_score REAL NOT NULL DEFAULT 0,
        pt_total REAL NOT NULL DEFAULT 100,
        qa_score REAL NOT NULL DEFAULT 0,
        qa_total REAL NOT NULL DEFAULT 50,
        initial_grade REAL NOT NULL DEFAULT 0,
        transmuted_grade INTEGER NOT NULL DEFAULT 75,
        remarks TEXT NOT NULL DEFAULT 'Passed',
        is_locked INTEGER NOT NULL DEFAULT 0,
        encoded_by TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_learner_grades_lookup ON learner_grades (school_id, student_id, school_year, quarter)')
      await run('CREATE INDEX IF NOT EXISTS idx_learner_grades_subject ON learner_grades (subject_id, school_year, quarter)')
    } catch {}
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS learner_grades')
  await run('DROP TABLE IF EXISTS grading_subjects')
}
