// Migration: 033_school_quarter_count.mjs
// Description: Add quarter_count column to schools table (default 4, allows 3 or 4 quarters).
// Schema-only migration; zero operational seeding.

export const id = '033_school_quarter_count'
export const description = 'Add quarter_count column to schools table for configurable 3 or 4-quarter academic calendars'

async function addColumn(run, isMysql, name, mysqlDefinition, sqliteDefinition) {
  try {
    await run(`ALTER TABLE schools ADD COLUMN ${name} ${isMysql ? mysqlDefinition : sqliteDefinition}`)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  await addColumn(run, isMysql, 'quarter_count', 'INT NOT NULL DEFAULT 4', 'INTEGER NOT NULL DEFAULT 4')
}

export async function down({ run }) {
  return undefined
}
