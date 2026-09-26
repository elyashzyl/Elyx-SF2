// Migration: 006_payment_methods.mjs
// Description: Creates payment_methods table for bank accounts and QR code payments.

export const id = '006_payment_methods'
export const description = 'Create payment_methods table for QR and bank transfer options'

export async function up({ run, isMysql }) {
  if (isMysql) {
    await run(`CREATE TABLE IF NOT EXISTS payment_methods (
      id VARCHAR(96) PRIMARY KEY,
      type VARCHAR(32) NOT NULL DEFAULT ('bank_transfer'),
      bank_name VARCHAR(128) NOT NULL DEFAULT (''),
      account_name VARCHAR(255) NOT NULL DEFAULT (''),
      account_number VARCHAR(128) NOT NULL DEFAULT (''),
      qr_image_url LONGTEXT,
      instructions TEXT NOT NULL DEFAULT (''),
      is_active INT NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  } else {
    await run(`CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      type TEXT DEFAULT 'bank_transfer',
      bank_name TEXT DEFAULT '',
      account_name TEXT DEFAULT '',
      account_number TEXT DEFAULT '',
      qr_image_url TEXT DEFAULT '',
      instructions TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`)
  }
}

export async function down({ run }) {
  await run('DROP TABLE IF EXISTS payment_methods')
}
