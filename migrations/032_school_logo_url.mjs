// Migration: 032_school_logo_url.mjs
// Description: Add optional school logo_url field to schools table.
// Schema-only migration; zero operational seeding.

export const id = '032_school_logo_url'
export const description = 'Add logo_url field to schools table for campus branding and report cards'

async function addColumn(run, isMysql, name, mysqlDefinition, sqliteDefinition) {
  try {
    await run(`ALTER TABLE schools ADD COLUMN ${name} ${isMysql ? mysqlDefinition : sqliteDefinition}`)
  } catch (error) {
    const message = String(error.message || error.code || '')
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(message)) throw error
  }
}

export async function up({ run, isMysql }) {
  await addColumn(run, isMysql, 'logo_url', "VARCHAR(2048) NOT NULL DEFAULT ''", "TEXT NOT NULL DEFAULT ''")
}

export async function down({ run }) {
  return undefined
}
