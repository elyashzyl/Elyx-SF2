import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { getRuntimeSetting } from './runtimeSettings.js'

function sanitizeMetadata(meta) {
  if (!meta || typeof meta !== 'object') return null
  const clean = { ...meta }
  const sensitiveKeys = ['password', 'token', 'secret', 'hash', 'authorization', 'cookie']
  for (const k of Object.keys(clean)) {
    if (sensitiveKeys.some(s => k.toLowerCase().includes(s))) {
      clean[k] = '[REDACTED]'
    }
  }
  return clean
}

/**
 * Persists an application error to system_error_logs for administrative monitoring.
 */
export async function logSystemError({
  req = null,
  error = null,
  message = '',
  type = 'server',
  severity = 'error',
  statusCode = 500,
  schoolId = '',
  metadata = null
}) {
  try {
    // Check if error reporting is disabled in dynamic runtime settings
    if (getRuntimeSetting('error_reporting_enabled', '1') === '0') {
      return null
    }

    const id = uuidv4()
    const errorMsg = String(message || error?.message || 'Unknown system error').slice(0, 4000)
    const stack = error?.stack ? String(error.stack).slice(0, 16000) : ''
    const path = req ? String(req.originalUrl || req.url || '').slice(0, 500) : ''
    const method = req ? String(req.method || 'GET').toUpperCase() : ''
    const ipAddress = req ? String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 60) : ''
    const userAgent = req ? String(req.headers['user-agent'] || '').slice(0, 500) : ''

    let userId = ''
    let userName = ''
    let userRole = ''
    let effectiveSchoolId = schoolId || ''

    if (req?.user) {
      userId = req.user.id || ''
      userName = req.user.name || ''
      userRole = req.user.role || ''
      if (!effectiveSchoolId) effectiveSchoolId = req.user.school_id || ''
    }

    const cleanMeta = sanitizeMetadata(metadata)
    const metaJson = cleanMeta ? JSON.stringify(cleanMeta) : null

    await run(
      `INSERT INTO system_error_logs (
        id, school_id, user_id, user_name, user_role,
        error_type, severity, status, message, stack,
        path, method, status_code, user_agent, ip_address, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unresolved', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        id, effectiveSchoolId, userId, userName, userRole,
        type, severity, errorMsg, stack,
        path, method, statusCode, userAgent, ipAddress, metaJson
      ]
    )

    return id
  } catch (err) {
    // Failsafe: never throw if error logging fails
    console.error('[errorLogger] Failed to log system error:', err.message)
    return null
  }
}
