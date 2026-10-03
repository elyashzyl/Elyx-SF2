// Migration: 023_teacher_notes.mjs
// Description: Store teacher notes for exceptional attendance cases on daily records.

export const id = '023_teacher_notes'
export const description = 'Add teacher notes for exceptional attendance cases'

export async function up({ run, isMysql }) {
  try {
    await run(`ALTER TABLE attendance_records ADD COLUMN teacher_notes ${isMysql ? "TEXT NULL" : "TEXT DEFAULT ''"}`)
  } catch (error) {
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(String(error.message || error.code || ''))) throw error
  }
}

export async function down({ run, isMysql }) {
  if (isMysql) {
    try { await run('ALTER TABLE attendance_records DROP COLUMN teacher_notes') } catch {}
  }
}
