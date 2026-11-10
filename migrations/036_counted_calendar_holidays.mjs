// Migration: 036_counted_calendar_holidays.mjs
// Description: Adds a flag for holidays that should remain counted as school days.

export const id = '036_counted_calendar_holidays'
export const description = 'Add counted option to calendar holidays'

async function addColumn(run, sql) {
  try {
    await run(sql)
  } catch (error) {
    if (!/duplicate|exists|ER_DUP_FIELDNAME/i.test(String(error.message || error.code || ''))) throw error
  }
}

export async function up({ run, isMysql }) {
  await addColumn(run, isMysql
    ? 'ALTER TABLE calendar_events ADD COLUMN is_counted INT NOT NULL DEFAULT 0'
    : 'ALTER TABLE calendar_events ADD COLUMN is_counted INTEGER NOT NULL DEFAULT 0')
}

export async function down({ run }) {
  // SQLite does not support dropping columns on all supported versions.
  // The flag is harmless on rollback and is retained for compatibility.
  try { await run('ALTER TABLE calendar_events DROP COLUMN is_counted') } catch {}
}
