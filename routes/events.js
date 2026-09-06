import { Router } from 'express'
import { query, run } from '../db.js'
import { requireRole, resolveScopeSchool } from './_context.js'

const router = Router()

function scoped(req, res) {
  const { me, error } = requireRole(req, res, 'superadmin', 'admin', 'teacher')
  if (error) return null
  const scope = resolveScopeSchool(req, res, req.query.schoolId ?? req.body?.schoolId)
  if (!scope) return null
  return { me, schoolId: scope.schoolId }
}

function writable(req, res) {
  const { me, error } = requireRole(req, res, 'superadmin', 'admin')
  if (error) return null
  const scope = resolveScopeSchool(req, res, req.body?.schoolId)
  if (!scope) return null
  if (!scope.schoolId) { res.status(400).json({ error: 'schoolId is required' }); return null }
  return { me, schoolId: scope.schoolId }
}

function ownRow(table, id, schoolId, me) {
  const row = query(`SELECT * FROM "${table}" WHERE id = ?`, [id])[0]
  if (!row) return { row: null }
  if (me.role !== 'superadmin' && row.school_id !== schoolId && row.school_id !== me.school_id) return { denied: true }
  return { row }
}

// ---- Calendar Events ----
router.get('/calendar', (req, res) => {
  const s = scoped(req, res)
  if (!s) return
  try {
    const events = s.schoolId
      ? query('SELECT * FROM calendar_events WHERE school_id = ? ORDER BY event_date', [s.schoolId])
      : query('SELECT * FROM calendar_events ORDER BY event_date')
    res.json(events)
  } catch {
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

router.post('/calendar', (req, res) => {
  const s = writable(req, res)
  if (!s) return
  try {
    const { title, type, event_date, color } = req.body
    if (!title || !type || !event_date) {
      return res.status(400).json({ error: 'title, type, and event_date are required' })
    }
    run('INSERT INTO calendar_events (title, type, event_date, color, created_by, school_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, type, event_date, color || '', req.body?.userId || '', s.schoolId])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to create event' })
  }
})

router.put('/calendar/:id', (req, res) => {
  const s = writable(req, res)
  if (!s) return
  try {
    const chk = ownRow('calendar_events', req.params.id, s.schoolId, s.me)
    if (!chk.row) return res.status(404).json({ error: 'Event not found' })
    if (chk.denied) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const { title, type, event_date, color } = req.body
    run('UPDATE calendar_events SET title=?, type=?, event_date=?, color=? WHERE id=?',
      [title, type, event_date, color || '', req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to update event' })
  }
})

router.delete('/calendar/:id', (req, res) => {
  const s = writable(req, res)
  if (!s) return
  try {
    const chk = ownRow('calendar_events', req.params.id, s.schoolId, s.me)
    if (!chk.row) return res.status(404).json({ error: 'Event not found' })
    if (chk.denied) return res.status(403).json({ error: 'Forbidden: outside your school' })
    run('DELETE FROM calendar_events WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

// ---- Quarterly Events ----
router.get('/quarterly', (req, res) => {
  const s = scoped(req, res)
  if (!s) return
  try {
    const events = s.schoolId
      ? query('SELECT * FROM quarterly_events WHERE school_id = ? ORDER BY id', [s.schoolId])
      : query('SELECT * FROM quarterly_events ORDER BY id')
    res.json(events)
  } catch {
    res.status(500).json({ error: 'Failed to fetch quarterly events' })
  }
})

router.post('/quarterly', (req, res) => {
  const s = writable(req, res)
  if (!s) return
  try {
    const { event_name, first_grading, second_grading, third_grading, fourth_grading } = req.body
    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' })
    }
    run('INSERT INTO quarterly_events (event_name, first_grading, second_grading, third_grading, fourth_grading, school_id) VALUES (?, ?, ?, ?, ?, ?)',
      [event_name, first_grading || '', second_grading || '', third_grading || '', fourth_grading || '', s.schoolId])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to create quarterly event' })
  }
})

router.put('/quarterly/:id', (req, res) => {
  const s = writable(req, res)
  if (!s) return
  try {
    const chk = ownRow('quarterly_events', req.params.id, s.schoolId, s.me)
    if (!chk.row) return res.status(404).json({ error: 'Event not found' })
    if (chk.denied) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const { event_name, first_grading, second_grading, third_grading, fourth_grading } = req.body
    run('UPDATE quarterly_events SET event_name=?, first_grading=?, second_grading=?, third_grading=?, fourth_grading=? WHERE id=?',
      [event_name, first_grading || '', second_grading || '', third_grading || '', fourth_grading || '', req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to update quarterly event' })
  }
})

router.delete('/quarterly/:id', (req, res) => {
  const s = writable(req, res)
  if (!s) return
  try {
    const chk = ownRow('quarterly_events', req.params.id, s.schoolId, s.me)
    if (!chk.row) return res.status(404).json({ error: 'Event not found' })
    if (chk.denied) return res.status(403).json({ error: 'Forbidden: outside your school' })
    run('DELETE FROM quarterly_events WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete quarterly event' })
  }
})

export default router