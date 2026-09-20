// Migration: 003_licenses_and_subscriptions.mjs
// Description: Creates the licenses table for ElyTrack subscription and license-based management.

export const id = '003_licenses_and_subscriptions'
export const description = 'Create licenses table and seed default school licenses'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`CREATE TABLE IF NOT EXISTS licenses (
      id VARCHAR(96) PRIMARY KEY,
      school_id VARCHAR(96) NOT NULL DEFAULT (''),
      license_key VARCHAR(64) UNIQUE NOT NULL,
      plan_tier VARCHAR(32) NOT NULL DEFAULT ('campus'),
      status VARCHAR(32) NOT NULL DEFAULT ('active'),
      billing_cycle VARCHAR(32) NOT NULL DEFAULT ('annual'),
      max_teachers INT NOT NULL DEFAULT 50,
      max_students INT NOT NULL DEFAULT 1500,
      issued_at TEXT NOT NULL DEFAULT (''),
      expires_at TEXT NOT NULL DEFAULT (''),
      trial_ends_at TEXT NOT NULL DEFAULT (''),
      features TEXT NOT NULL DEFAULT ('{}'),
      notes TEXT NOT NULL DEFAULT ('')
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  } else {
    await run(`CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      school_id TEXT DEFAULT '',
      license_key TEXT UNIQUE NOT NULL,
      plan_tier TEXT DEFAULT 'campus',
      status TEXT DEFAULT 'active',
      billing_cycle TEXT DEFAULT 'annual',
      max_teachers INTEGER DEFAULT 50,
      max_students INTEGER DEFAULT 1500,
      issued_at TEXT DEFAULT '',
      expires_at TEXT DEFAULT '',
      trial_ends_at TEXT DEFAULT '',
      features TEXT DEFAULT '{}',
      notes TEXT DEFAULT ''
    )`)
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS licenses')
}
