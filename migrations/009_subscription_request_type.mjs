// Migration: 009_subscription_request_type.mjs
// Description: Records whether a request is for activation, renewal, or upgrade.

export const id = '009_subscription_request_type'
export const description = 'Add subscription request approval type'

export async function up({ run, isMysql }) {
  try {
    await run(isMysql
      ? "ALTER TABLE subscription_requests ADD COLUMN request_type VARCHAR(32) NOT NULL DEFAULT ''"
      : "ALTER TABLE subscription_requests ADD COLUMN request_type TEXT DEFAULT ''")
  } catch (error) {
    if (!/duplicate|exists/i.test(String(error.message))) throw error
  }
}

export async function down({ run }) {
  try { await run('ALTER TABLE subscription_requests DROP COLUMN request_type') } catch {}
}
