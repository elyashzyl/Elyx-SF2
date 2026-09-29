// Migration: 018_school_archive.mjs
// Description: Add reversible school archive metadata.
// This migration is schema-only and does not archive or delete any school.

export const id = '018_school_archive'
export const description = 'Add reversible school archive metadata'

async function addColumn(run, isMysql, name, mysqlDefinition, sqliteDefinition) {
  try {
    await run(`ALTER TABLE schools ADD COLUMN ${name} ${isMysql ? mysqlDefinition : sqliteDefinition}`)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  await addColumn(run, isMysql, 'archived_at', 'DATETIME NULL', 'TEXT')
  await addColumn(run, isMysql, 'archived_by', "VARCHAR(96) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''")
  await addColumn(run, isMysql, 'archive_reason', "VARCHAR(1000) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''")
}

export async function down({ run }) {
  // Archive metadata is retained intentionally. Removing it could make a
  // restored school's history ambiguous after a rollback.
  return undefined
}
