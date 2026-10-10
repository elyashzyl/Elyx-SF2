import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, withTransaction, logAudit } from '../db.js'
import { requireRole, resolveScopeSchool } from './_context.js'

const router = Router()

async function scoped(req, res) {
  const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
  if (error) return null
  const scope = await resolveScopeSchool(req, res, req.query.schoolId ?? req.body?.schoolId)
  if (!scope) return null
  return { me, schoolId: scope.schoolId || '' }
}

async function writable(req, res) {
  const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
  if (error) return null
  const scope = await resolveScopeSchool(req, res, req.body?.schoolId ?? req.query?.schoolId)
  if (!scope) return null
  return { me, schoolId: scope.schoolId || '' }
}

async function ownRow(table, id, schoolId, me) {
  const row = (await query(`SELECT * FROM ${table} WHERE id = ?`, [id]))[0]
  if (!row) return { row: null }
  if (me.role !== 'superadmin' && row.school_id !== schoolId && row.school_id !== me.school_id) return { denied: true }
  return { row }
}

const DEFAULT_QUARTERS = [
  {
    quarter_number: 1,
    quarter_name: '1st Quarter / Grading Period',
    months: [8, 9, 10],
    target_days: 50,
    start_date: '',
    end_date: '',
    is_active: 1
  },
  {
    quarter_number: 2,
    quarter_name: '2nd Quarter / Grading Period',
    months: [11, 12, 1],
    target_days: 50,
    start_date: '',
    end_date: '',
    is_active: 1
  },
  {
    quarter_number: 3,
    quarter_name: '3rd Quarter / Grading Period',
    months: [2, 3],
    target_days: 45,
    start_date: '',
    end_date: '',
    is_active: 1
  },
  {
    quarter_number: 4,
    quarter_name: '4th Quarter / Grading Period',
    months: [4, 5],
    target_days: 45,
    start_date: '',
    end_date: '',
    is_active: 1
  }
]

function parseMonths(raw) {
  if (Array.isArray(raw)) {
    return raw.map(m => parseInt(m, 10)).filter(m => m >= 1 && m <= 12)
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map(m => parseInt(m, 10)).filter(m => m >= 1 && m <= 12)
      }
    } catch {}
    return raw.split(',').map(m => parseInt(m.trim(), 10)).filter(m => m >= 1 && m <= 12)
  }
  return []
}

// ── GET /api/quarterly/terms ──
// Returns configurable quarters (Q1 to Q4). If no DB records exist, returns DepEd defaults.
router.get('/terms', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const sid = scope.schoolId || ''
    const sy = String(req.query.schoolYear || '').trim()

    let schoolQuarterCount = 4
    if (sid) {
      const schoolRows = await query('SELECT quarter_count, school_year FROM schools WHERE id = ?', [sid])
      if (schoolRows.length) {
        schoolQuarterCount = Number(schoolRows[0].quarter_count) === 3 ? 3 : 4
      }
    }

    let sql = 'SELECT * FROM quarterly_terms WHERE school_id = ?'
    const params = [sid]
    if (sy) {
      sql += ' AND (school_year = ? OR school_year = "")'
      params.push(sy)
    }
    sql += ' ORDER BY quarter_number ASC'

    let rows = await query(sql, params)

    // If specific school has no records and sid is provided, check if global default (school_id = '') exists
    if (!rows.length && sid) {
      let gSql = 'SELECT * FROM quarterly_terms WHERE school_id = ""'
      const gParams = []
      if (sy) {
        gSql += ' AND (school_year = ? OR school_year = "")'
        gParams.push(sy)
      }
      gSql += ' ORDER BY quarter_number ASC'
      rows = await query(gSql, gParams)
    }

    if (!rows.length) {
      // Return DepEd defaults
      const defaults = DEFAULT_QUARTERS.map(q => ({
        id: `default-q${q.quarter_number}`,
        school_id: sid,
        quarter_number: q.quarter_number,
        quarter_name: q.quarter_name,
        school_year: sy,
        months: [...q.months],
        start_date: q.start_date,
        end_date: q.end_date,
        target_days: q.target_days,
        is_active: schoolQuarterCount === 3 && q.quarter_number === 4 ? 0 : q.is_active,
        is_custom: false
      }))
      return res.json({ quarters: defaults, is_custom: false, quarter_count: schoolQuarterCount })
    }

    // Map DB rows to structured response
    const quarters = rows.map(r => ({
      id: r.id,
      school_id: r.school_id,
      quarter_number: Number(r.quarter_number),
      quarter_name: r.quarter_name,
      school_year: r.school_year || sy,
      months: parseMonths(r.months),
      start_date: r.start_date || '',
      end_date: r.end_date || '',
      target_days: Number(r.target_days || 50),
      is_active: Number(r.is_active ?? 1),
      is_custom: true,
      updated_at: r.updated_at
    }))

    res.json({ quarters, is_custom: true, quarter_count: schoolQuarterCount })
  } catch (err) {
    console.error('Failed to fetch quarterly terms:', err.message)
    res.status(500).json({ error: 'Failed to fetch quarterly terms' })
  }
})

// ── PUT /api/quarterly/terms ──
// Save or update quarters (batch update of Q1–Q4)
router.put('/terms', async (req, res) => {
  try {
    const s = await writable(req, res)
    if (!s) return

    const { schoolYear, quarters } = req.body || {}
    if (!Array.isArray(quarters) || !quarters.length) {
      return res.status(400).json({ error: 'Array of quarters is required' })
    }

    const sy = String(schoolYear || '').trim()
    const sid = s.schoolId || ''

    const requestedQuarterCount = req.body.quarter_count !== undefined ? req.body.quarter_count : req.body.quarterCount
    if (requestedQuarterCount !== undefined && sid) {
      await run('UPDATE schools SET quarter_count = ? WHERE id = ?', [Number(requestedQuarterCount) === 3 ? 3 : 4, sid])
    }

    await withTransaction(async (conn) => {
      for (const q of quarters) {
        const qNum = parseInt(q.quarter_number, 10)
        if (!qNum || qNum < 1 || qNum > 4) continue

        const qName = String(q.quarter_name || `Quarter ${qNum}`).trim()
        const cleanMonths = parseMonths(q.months)
        const monthsStr = cleanMonths.join(',')
        const startDate = String(q.start_date || '').trim()
        const endDate = String(q.end_date || '').trim()
        const targetDays = parseInt(q.target_days, 10) || 50
        const isActive = q.is_active === 0 ? 0 : 1

        const existing = await query(
          'SELECT id FROM quarterly_terms WHERE school_id = ? AND quarter_number = ? AND school_year = ?',
          [sid, qNum, sy]
        )

        if (existing.length) {
          await run(
            `UPDATE quarterly_terms 
             SET quarter_name = ?, months = ?, start_date = ?, end_date = ?, target_days = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [qName, monthsStr, startDate, endDate, targetDays, isActive, existing[0].id]
          )
        } else {
          const id = 'qt-' + uuidv4()
          await run(
            `INSERT INTO quarterly_terms 
             (id, school_id, quarter_number, quarter_name, school_year, months, start_date, end_date, target_days, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, sid, qNum, qName, sy, monthsStr, startDate, endDate, targetDays, isActive]
          )
        }
      }

      await logAudit({
        actor_id: s.me.id,
        actor_name: s.me.name,
        actor_role: s.me.role,
        actor_school_id: s.schoolId || '',
        action: 'update_quarterly_terms',
        target_type: 'quarterly_terms',
        target_id: sid,
        target_school_id: sid,
        detail: `Configured quarterly terms for school year ${sy || 'current'}`
      })
    })

    res.json({ success: true, message: 'Quarterly terms saved successfully' })
  } catch (err) {
    console.error('Failed to save quarterly terms:', err.message)
    res.status(500).json({ error: 'Failed to save quarterly terms' })
  }
})

// ── POST /api/quarterly/terms/reset ──
// Reset school quarterly terms to standard DepEd defaults
router.post('/terms/reset', async (req, res) => {
  try {
    const s = await writable(req, res)
    if (!s) return

    const { schoolYear } = req.body || {}
    const sy = String(schoolYear || '').trim()
    const sid = s.schoolId || ''

    if (sy) {
      await run('DELETE FROM quarterly_terms WHERE school_id = ? AND school_year = ?', [sid, sy])
    } else {
      await run('DELETE FROM quarterly_terms WHERE school_id = ?', [sid])
    }

    await logAudit({
      actor_id: s.me.id,
      actor_name: s.me.name,
      actor_role: s.me.role,
      actor_school_id: s.schoolId || '',
      action: 'reset_quarterly_terms',
      target_type: 'quarterly_terms',
      target_id: sid,
      target_school_id: sid,
      detail: `Reset quarterly terms to DepEd defaults for school year ${sy || 'all'}`
    })

    res.json({ success: true, message: 'Quarterly terms reset to DepEd defaults' })
  } catch (err) {
    console.error('Failed to reset quarterly terms:', err.message)
    res.status(500).json({ error: 'Failed to reset quarterly terms' })
  }
})

// ── Milestone Events (quarterly_events) ──

router.get('/events', async (req, res) => {
  const s = await scoped(req, res)
  if (!s) return
  try {
    const events = s.schoolId
      ? await query('SELECT * FROM quarterly_events WHERE school_id = ? ORDER BY id', [s.schoolId])
      : await query('SELECT * FROM quarterly_events ORDER BY id')
    res.json(events)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quarterly events' })
  }
})

router.post('/events', async (req, res) => {
  const s = await writable(req, res)
  if (!s) return
  try {
    const { event_name, first_grading, second_grading, third_grading, fourth_grading } = req.body
    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' })
    }
    await run(
      'INSERT INTO quarterly_events (event_name, first_grading, second_grading, third_grading, fourth_grading, school_id) VALUES (?, ?, ?, ?, ?, ?)',
      [event_name, first_grading || '', second_grading || '', third_grading || '', fourth_grading || '', s.schoolId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quarterly event' })
  }
})

router.put('/events/:id', async (req, res) => {
  const s = await writable(req, res)
  if (!s) return
  try {
    const chk = await ownRow('quarterly_events', req.params.id, s.schoolId, s.me)
    if (!chk.row) return res.status(404).json({ error: 'Event not found' })
    if (chk.denied) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const { event_name, first_grading, second_grading, third_grading, fourth_grading } = req.body
    await run(
      'UPDATE quarterly_events SET event_name=?, first_grading=?, second_grading=?, third_grading=?, fourth_grading=? WHERE id=?',
      [event_name, first_grading || '', second_grading || '', third_grading || '', fourth_grading || '', req.params.id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quarterly event' })
  }
})

router.delete('/events/:id', async (req, res) => {
  const s = await writable(req, res)
  if (!s) return
  try {
    const chk = await ownRow('quarterly_events', req.params.id, s.schoolId, s.me)
    if (!chk.row) return res.status(404).json({ error: 'Event not found' })
    if (chk.denied) return res.status(403).json({ error: 'Forbidden: outside your school' })
    await run('DELETE FROM quarterly_events WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quarterly event' })
  }
})

export default router
