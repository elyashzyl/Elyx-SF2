// Migration: 021_repair_user_avatar_url.mjs
// Description: Repair the optional user avatar column when migration tracking
// says it was applied but the MySQL schema is incomplete.

export const id = '021_repair_user_avatar_url'
export const description = 'Repair missing user avatar URL column'

export async function up({ run, isMysql }) {
  try {
    await run(`ALTER TABLE users ADD COLUMN avatar_url ${isMysql ? "VARCHAR(2048) NOT NULL DEFAULT ''" : "TEXT NOT NULL DEFAULT ''"}`)
  } catch (error) {
    if (!/duplicate|already exists|exists|ER_DUP_FIELDNAME/i.test(String(error.message || error.code || ''))) throw error
  }
}

export async function down({ run, isMysql }) {
  if (isMysql) {
    try { await run('ALTER TABLE users DROP COLUMN avatar_url') } catch {}
  }
}
