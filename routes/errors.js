import { Router } from 'express'
import { query, run } from '../db.js'
import { requireRole, resolveScopeSchool, actingUser, audit } from './_context.js'
import { logSystemError } from '../lib/errorLogger.js'

const router = Router()

// Simple in-memory rate limiter for client-side error reporting (max 30 per IP per minute)
const clientReportBuckets = new Map()
function isClientReportRateLimited(ip) {
  const now = Date.now()
  const bucket = clientReportBuckets.get(ip) || { count: 0, resetAt: now + 60000 }
  if (now > bucket.resetAt) {
    bucket.count = 1
    bucket.resetAt = now + 60000
    clientReportBuckets.set(ip, bucket)
    return false
  }
  bucket.count++
  clientReportBuckets.set(ip, bucket)
  return bucket.count > 30
}

// ── POST /api/errors/report ──
// Endpoint for client-side frontend error reporting (Vue errorHandler, window unhandledrejection)
router.post('/report', async (req, res) => {
  try {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
    if (isClientReportRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many error reports submitted. Please wait.' })
    }

    const me = await actingUser(req, res)
    const { message, stack, path, component, severity, metadata } = req.body || {}

    if (!message) {
      return res.status(400).json({ error: 'Error message is required' })
    }

    const errorId = await logSystemError({
      req,
      message: String(message),
      error: { stack: stack || '' },
      type: 'client',
      severity: ['critical', 'error', 'warning'].includes(severity) ? severity : 'error',
      statusCode: 400,
      schoolId: me?.school_id || '',
      metadata: {
        component: component || '',
        route: path || '',
        ...metadata
      }
    })

    res.status(201).json({ success: true, id: errorId })
  } catch (err) {
    console.error('Error reporting client issue:', err.message)
    res.status(500).json({ error: 'Failed to record error report' })
  }
})

// ── GET /api/errors/stats ──
// Incident and error telemetry metrics for administrators
router.get('/stats', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    const filterSql = schoolId ? ' WHERE (school_id = ? OR school_id = "")' : ''
    const params = schoolId ? [schoolId] : []

    const totalRow = (await query(`SELECT COUNT(*) as count FROM system_error_logs${filterSql}`, params))[0]
    const unresolvedRow = (await query(`SELECT COUNT(*) as count FROM system_error_logs ${schoolId ? 'WHERE (school_id = ? OR school_id = "") AND' : 'WHERE'} status = 'unresolved'`, params))[0]
    const criticalRow = (await query(`SELECT COUNT(*) as count FROM system_error_logs ${schoolId ? 'WHERE (school_id = ? OR school_id = "") AND' : 'WHERE'} severity = 'critical'`, params))[0]
    const todayRow = (await query(`SELECT COUNT(*) as count FROM system_error_logs ${schoolId ? 'WHERE (school_id = ? OR school_id = "") AND' : 'WHERE'} created_at >= CURRENT_DATE`, params))[0]
    const clientRow = (await query(`SELECT COUNT(*) as count FROM system_error_logs ${schoolId ? 'WHERE (school_id = ? OR school_id = "") AND' : 'WHERE'} error_type = 'client'`, params))[0]
    const serverRow = (await query(`SELECT COUNT(*) as count FROM system_error_logs ${schoolId ? 'WHERE (school_id = ? OR school_id = "") AND' : 'WHERE'} error_type != 'client'`, params))[0]

    res.json({
      success: true,
      total_errors: Number(totalRow?.count || 0),
      unresolved_count: Number(unresolvedRow?.count || 0),
      critical_count: Number(criticalRow?.count || 0),
      today_count: Number(todayRow?.count || 0),
      client_count: Number(clientRow?.count || 0),
      server_count: Number(serverRow?.count || 0)
    })
  } catch (err) {
    console.error('Error fetching error stats:', err.message)
    res.status(500).json({ error: 'Failed to fetch error statistics' })
  }
})

// ── GET /api/errors ──
// Filtered and paginated list of application errors
router.get('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    const status = String(req.query.status || '').trim()
    const severity = String(req.query.severity || '').trim()
    const errorType = String(req.query.type || '').trim()
    const search = String(req.query.search || '').trim()
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit || '25', 10)))
    const offset = (page - 1) * limit

    let whereSql = 'WHERE 1=1'
    const params = []

    if (schoolId) {
      whereSql += ' AND (school_id = ? OR school_id = "")'
      params.push(schoolId)
    }

    if (status) {
      whereSql += ' AND status = ?'
      params.push(status)
    }

    if (severity) {
      whereSql += ' AND severity = ?'
      params.push(severity)
    }

    if (errorType) {
      whereSql += ' AND error_type = ?'
      params.push(errorType)
    }

    if (search) {
      whereSql += ' AND (message LIKE ? OR path LIKE ? OR user_name LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const countRow = (await query(`SELECT COUNT(*) as count FROM system_error_logs ${whereSql}`, params))[0]
    const total = Number(countRow?.count || 0)

    const listSql = `
      SELECT id, school_id, user_id, user_name, user_role, error_type, severity,
             status, message, stack, path, method, status_code, ip_address,
             metadata, resolved_at, resolved_by, resolution_notes, created_at
      FROM system_error_logs
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    const errors = await query(listSql, [...params, limit, offset])

    res.json({
      success: true,
      errors: errors.map(e => {
        let meta = null
        if (e.metadata) {
          try { meta = JSON.parse(e.metadata) } catch {}
        }
        return { ...e, metadata: meta }
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (err) {
    console.error('Error fetching errors:', err.message)
    res.status(500).json({ error: 'Failed to fetch error logs' })
  }
})

// ── PUT /api/errors/:id/status ──
// Update resolution status and add administrative notes
router.put('/:id/status', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const id = req.params.id
    const rows = await query('SELECT * FROM system_error_logs WHERE id = ?', [id])
    if (!rows.length) {
      return res.status(404).json({ error: 'Error log not found' })
    }

    const current = rows[0]
    if (me.role !== 'superadmin' && current.school_id && current.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    const status = String(req.body?.status || '').trim()
    const resolutionNotes = req.body?.resolution_notes !== undefined ? String(req.body.resolution_notes).trim() : current.resolution_notes
    const validStatuses = ['unresolved', 'investigating', 'resolved', 'ignored']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
    }

    const isResolved = status === 'resolved' || status === 'ignored'

    await run(
      `UPDATE system_error_logs SET
         status = ?,
         resolution_notes = ?,
         resolved_by = ?,
         resolved_at = ?
       WHERE id = ?`,
      [
        status,
        resolutionNotes,
        isResolved ? (me.name || me.username) : '',
        isResolved ? new Date().toISOString() : null,
        id
      ]
    )

    await audit(me, 'error.update_status', { errorId: id, status, resolutionNotes }, `Marked error ${id} as ${status}`)

    res.json({ success: true, status, resolution_notes: resolutionNotes })
  } catch (err) {
    console.error('Error updating error log status:', err.message)
    res.status(500).json({ error: 'Failed to update error status' })
  }
})

// ── DELETE /api/errors/:id ──
// Delete a specific error log
router.delete('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const id = req.params.id
    const rows = await query('SELECT * FROM system_error_logs WHERE id = ?', [id])
    if (!rows.length) {
      return res.status(404).json({ error: 'Error log not found' })
    }

    const current = rows[0]
    if (me.role !== 'superadmin' && current.school_id && current.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    await run('DELETE FROM system_error_logs WHERE id = ?', [id])
    await audit(me, 'error.delete', { errorId: id }, `Deleted error log ${id}`)

    res.json({ success: true, message: 'Error log deleted successfully' })
  } catch (err) {
    console.error('Error deleting error log:', err.message)
    res.status(500).json({ error: 'Failed to delete error log' })
  }
})

// ── POST /api/errors/clear-resolved ──
// Purge resolved or ignored error logs to keep database clean
router.post('/clear-resolved', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.body?.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    let sql = 'DELETE FROM system_error_logs WHERE status IN ("resolved", "ignored")'
    const params = []

    if (schoolId) {
      sql += ' AND (school_id = ? OR school_id = "")'
      params.push(schoolId)
    }

    await run(sql, params)
    await audit(me, 'error.clear_resolved', { schoolId }, `Cleared resolved system errors`)

    res.json({ success: true, message: 'Cleared resolved error logs successfully' })
  } catch (err) {
    console.error('Error clearing resolved error logs:', err.message)
    res.status(500).json({ error: 'Failed to clear resolved error logs' })
  }
})

export default router
