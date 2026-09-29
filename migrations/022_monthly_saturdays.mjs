// Migration: 022_monthly_saturdays.mjs
// Description: Store whether a monthly SF2 report includes Saturdays as school days.
// Existing reports remain Monday-Friday only because the default is disabled.

export const id = '022_monthly_saturdays'
export const description = 'Add per-report Saturday school-day setting'

export async function up({ run, isMysql }) {
  try {
    await run(`ALTER TABLE monthly_records ADD COLUMN include_saturdays ${isMysql ? "TINYINT(1) NOT NULL DEFAULT 0" : "INTEGER NOT NULL DEFAULT 0"}`)
  } catch (error) {
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(String(error.message || error.code || ''))) throw error
  }
}

export async function down({ run, isMysql }) {
  if (isMysql) {
    try { await run('ALTER TABLE monthly_records DROP COLUMN include_saturdays') } catch {}
  }
  // SQLite retains additive columns for safe rollback compatibility.
}
