// Migration: 024_student_profiles_and_interventions.mjs
// Description: Expand student profiles with LRN, guardian contacts, emergency information,
// consent tracking, school-configurable SARDO thresholds, and create student interventions
// and guardian contact tracking tables.
// This migration is schema-only and never inserts or modifies operational records.

export const id = '024_student_profiles_and_interventions'
export const description = 'Add student guardian contacts, consent tracking, SARDO thresholds, and interventions'

async function addColumn(run, isMysql, table, name, mysqlDefinition, sqliteDefinition) {
  try {
    await run(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${isMysql ? mysqlDefinition : sqliteDefinition}`)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  // 1. Add student profile expansion columns
  const studentColumns = [
    ['lrn', "VARCHAR(32) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['birth_date', "VARCHAR(10) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['address', "TEXT NULL", "TEXT NOT NULL DEFAULT ''"],
    ['guardian_name', "VARCHAR(255) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['guardian_relationship', "VARCHAR(64) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['guardian_contact', "VARCHAR(64) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['emergency_contact_name', "VARCHAR(255) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['emergency_contact_number', "VARCHAR(64) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['consent_data_sharing', "TINYINT NOT NULL DEFAULT 1", "INTEGER NOT NULL DEFAULT 1"],
    ['consent_medical_emergency', "TINYINT NOT NULL DEFAULT 1", "INTEGER NOT NULL DEFAULT 1"]
  ]

  for (const [col, mysqlDef, sqliteDef] of studentColumns) {
    await addColumn(run, isMysql, 'students', col, mysqlDef, sqliteDef)
  }

  // 2. Add configurable SARDO threshold columns to schools
  const schoolColumns = [
    ['sardo_consecutive_absences', "INT NOT NULL DEFAULT 3", "INTEGER NOT NULL DEFAULT 3"],
    ['sardo_cumulative_absences', "INT NOT NULL DEFAULT 5", "INTEGER NOT NULL DEFAULT 5"]
  ]

  for (const [col, mysqlDef, sqliteDef] of schoolColumns) {
    await addColumn(run, isMysql, 'schools', col, mysqlDef, sqliteDef)
  }

  // 3. Create student_interventions table
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS student_interventions (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL,
        student_id VARCHAR(96) NOT NULL,
        concern_type VARCHAR(64) NOT NULL,
        assigned_staff_id VARCHAR(96) NOT NULL DEFAULT '',
        assigned_staff_name VARCHAR(255) NOT NULL DEFAULT '',
        action_taken TEXT NOT NULL,
        follow_up_date VARCHAR(10) NOT NULL DEFAULT '',
        resolution_status VARCHAR(32) NOT NULL DEFAULT 'open',
        notes TEXT NULL,
        created_by VARCHAR(96) NOT NULL DEFAULT '',
        created_by_name VARCHAR(255) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_interventions_school_student (school_id, student_id),
        INDEX idx_interventions_status (school_id, resolution_status)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS student_interventions (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        concern_type TEXT NOT NULL,
        assigned_staff_id TEXT NOT NULL DEFAULT '',
        assigned_staff_name TEXT NOT NULL DEFAULT '',
        action_taken TEXT NOT NULL DEFAULT '',
        follow_up_date TEXT NOT NULL DEFAULT '',
        resolution_status TEXT NOT NULL DEFAULT 'open',
        notes TEXT DEFAULT '',
        created_by TEXT NOT NULL DEFAULT '',
        created_by_name TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_interventions_school_student ON student_interventions (school_id, student_id)')
      await run('CREATE INDEX IF NOT EXISTS idx_interventions_status ON student_interventions (school_id, resolution_status)')
    } catch {}
  }

  // 4. Create student_guardian_contacts table
  if (isMysql) {
    await run(`
      CREATE TABLE IF NOT EXISTS student_guardian_contacts (
        id VARCHAR(96) PRIMARY KEY,
        school_id VARCHAR(96) NOT NULL,
        student_id VARCHAR(96) NOT NULL,
        contact_date VARCHAR(10) NOT NULL,
        contact_method VARCHAR(64) NOT NULL,
        guardian_name VARCHAR(255) NOT NULL DEFAULT '',
        guardian_contact VARCHAR(64) NOT NULL DEFAULT '',
        reason VARCHAR(255) NOT NULL DEFAULT '',
        outcome TEXT NULL,
        staff_id VARCHAR(96) NOT NULL DEFAULT '',
        staff_name VARCHAR(255) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_guardian_contacts_school_student (school_id, student_id)
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)
  } else {
    await run(`
      CREATE TABLE IF NOT EXISTS student_guardian_contacts (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        contact_date TEXT NOT NULL,
        contact_method TEXT NOT NULL,
        guardian_name TEXT NOT NULL DEFAULT '',
        guardian_contact TEXT NOT NULL DEFAULT '',
        reason TEXT NOT NULL DEFAULT '',
        outcome TEXT DEFAULT '',
        staff_id TEXT NOT NULL DEFAULT '',
        staff_name TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    try {
      await run('CREATE INDEX IF NOT EXISTS idx_guardian_contacts_school_student ON student_guardian_contacts (school_id, student_id)')
    } catch {}
  }
}

export async function down({ run }) {
  // Schema changes are append-only.
  return undefined
}
