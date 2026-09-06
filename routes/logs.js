import { Router } from 'express'
import { query } from '../db.js'
import { requireRole } from './_context.js'

const router = Router()

// Superadmin activity log. Filters: action, actor, schoolId, search, limit, offset.
router.get('/', (req, res) => {
  const { me, error } = requireRole(req, res, 'superadmin')
  if (error) return
  const { action, actor, schoolId, search } = req.query
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500)
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)
  const conditions = []
  const params = []
  if (action) { conditions.push('action = ?'); params.push(action) }
  if (actor) { conditions.push('(actor_id = ? OR actor_name LIKE ?)'); params.push(actor, `%${actor}%`) }
  if (schoolId) { conditions.push('(actor_school_id = ? OR target_school_id = ?)'); params.push(schoolId, schoolId) }
  if (search) {
    conditions.push('(actor_name LIKE ? OR target_name LIKE ? OR action LIKE ? OR detail LIKE ?)')
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const total = query(`SELECT COUNT(*) as cnt FROM audit_logs ${where}`, params)[0]?.cnt || 0
  const rows = query(`SELECT * FROM audit_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
  res.json({ total, limit, offset, logs: rows })
})

// Distinct action names for the filter dropdown.
router.get('/actions', (req, res) => {
  const { error } = requireRole(req, res, 'superadmin')
  if (error) return
  const rows = query('SELECT DISTINCT action FROM audit_logs ORDER BY action')
  res.json(rows.map(r => r.action))
})

export default router
