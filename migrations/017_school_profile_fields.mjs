// Migration: 017_school_profile_fields.mjs
// Description: Add optional school profile and academic-period fields.
// This migration is schema-only and never inserts or modifies operational records.

export const id = '017_school_profile_fields'
export const description = 'Add school contact, governance, and academic profile fields'

async function addColumn(run, isMysql, name, mysqlDefinition, sqliteDefinition) {
  try {
    await run(`ALTER TABLE schools ADD COLUMN ${name} ${isMysql ? mysqlDefinition : sqliteDefinition}`)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  const fields = [
    ['contact_email', "VARCHAR(255) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['contact_phone', "VARCHAR(64) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['division', "VARCHAR(255) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['district', "VARCHAR(255) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['principal_name', "VARCHAR(255) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['school_year', "VARCHAR(32) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"],
    ['grading_period', "VARCHAR(64) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''"]
  ]

  for (const [name, mysqlDefinition, sqliteDefinition] of fields) {
    await addColumn(run, isMysql, name, mysqlDefinition, sqliteDefinition)
  }
}

export async function down({ run }) {
  // School profile data is intentionally append-only. Removing columns would
  // discard administrator-entered contact and academic-period information.
  return undefined
}
