// Migration: 004_subscription_plans.mjs
// Description: Creates subscription_plans table for database-backed subscription tiers, pricing, and quotas.

export const id = '004_subscription_plans'
export const description = 'Create subscription_plans table'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR(64) PRIMARY KEY,
      tier VARCHAR(32) NOT NULL UNIQUE,
      name VARCHAR(128) NOT NULL,
      tag VARCHAR(64) NOT NULL DEFAULT (''),
      description TEXT NOT NULL DEFAULT (''),
      price_monthly INT NOT NULL DEFAULT 0,
      price_annual_monthly INT NOT NULL DEFAULT 0,
      billing_annual_total INT NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT ('PHP'),
      trial_days INT NOT NULL DEFAULT 14,
      max_teachers INT NOT NULL DEFAULT 1,
      max_students INT NOT NULL DEFAULT 65,
      is_featured INT NOT NULL DEFAULT 0,
      badge VARCHAR(64) NOT NULL DEFAULT (''),
      cta_text VARCHAR(64) NOT NULL DEFAULT ('Inquire'),
      cta_url VARCHAR(255) NOT NULL DEFAULT (''),
      features TEXT NOT NULL DEFAULT ('[]'),
      modules TEXT NOT NULL DEFAULT ('{}'),
      sort_order INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  } else {
    await run(`CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      tier TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tag TEXT DEFAULT '',
      description TEXT DEFAULT '',
      price_monthly INTEGER DEFAULT 0,
      price_annual_monthly INTEGER DEFAULT 0,
      billing_annual_total INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'PHP',
      trial_days INTEGER DEFAULT 14,
      max_teachers INTEGER DEFAULT 1,
      max_students INTEGER DEFAULT 65,
      is_featured INTEGER DEFAULT 0,
      badge TEXT DEFAULT '',
      cta_text TEXT DEFAULT 'Inquire',
      cta_url TEXT DEFAULT '',
      features TEXT DEFAULT '[]',
      modules TEXT DEFAULT '{}',
      sort_order INTEGER DEFAULT 0
    )`)
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS subscription_plans')
}
