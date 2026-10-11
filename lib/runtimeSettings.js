import { query, run } from '../db.js'

const runtimeCache = new Map()
let isLoaded = false

/**
 * Preloads all persistent settings from the database into in-memory cache.
 * Called on application startup and whenever settings are dynamically updated.
 */
export async function loadRuntimeSettings() {
  try {
    const rows = await query('SELECT `key`, `value` FROM settings')
    runtimeCache.clear()
    for (const row of rows) {
      if (row.key) {
        runtimeCache.set(row.key, row.value)
      }
    }
    isLoaded = true
    return runtimeCache
  } catch (err) {
    // Non-fatal if table not initialized yet during initial script execution
    return runtimeCache
  }
}

/**
 * Retrieves a runtime setting immediately from in-memory cache.
 * Falls back to process.env and default value without requiring a server restart.
 */
export function getRuntimeSetting(key, fallback = '') {
  if (runtimeCache.has(key)) {
    const val = runtimeCache.get(key)
    if (val !== undefined && val !== null && val !== '') {
      return val
    }
  }

  // Fallback to environment variable if present
  const envKey = String(key || '').toUpperCase()
  if (process.env[envKey] !== undefined && process.env[envKey] !== '') {
    return process.env[envKey]
  }

  return fallback
}

/**
 * Updates a single setting in both in-memory cache and the database table.
 * Changes take effect immediately at runtime without restarting the server.
 */
export async function setRuntimeSetting(key, value) {
  const strVal = String(value ?? '')
  runtimeCache.set(key, strVal)

  const existing = await query('SELECT `key` FROM settings WHERE `key` = ?', [key])
  if (existing.length > 0) {
    await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [strVal, key])
  } else {
    await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [key, strVal])
  }
}

/**
 * Atomically updates multiple runtime settings in cache and database.
 */
export async function setMultipleRuntimeSettings(entries) {
  for (const [key, value] of Object.entries(entries || {})) {
    if (!key) continue
    const strVal = String(value ?? '')
    runtimeCache.set(key, strVal)

    const existing = await query('SELECT `key` FROM settings WHERE `key` = ?', [key])
    if (existing.length > 0) {
      await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [strVal, key])
    } else {
      await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [key, strVal])
    }
  }
}

/**
 * Returns a snapshot of all active runtime configuration key-value pairs.
 */
export function getAllRuntimeSettings() {
  const obj = {}
  for (const [k, v] of runtimeCache.entries()) {
    obj[k] = v
  }
  return obj
}
