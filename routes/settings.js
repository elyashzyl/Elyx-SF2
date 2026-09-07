import { Router } from 'express'
import { query, run, getSettings, getSchoolById, updateSchoolRow } from '../db.js'
import { requireRole, resolveScopeSchool, actingUser, schoolToResponse, audit } from './_context.js'

const router = Router()

const SCHOOL_KEYS = ['school_name', 'school_id', 'school_address', 'school_short']

router.get('/', async (req, res) => {
  try {
    const all = await query('SELECT key, value FROM settings')
    const result = {}
    for (const row of all) {
      result[row.key] = row.value
    }
    res.json(result)
  } catch (err) {
    console.error('Error listing settings:', err.message)
    res.status(500).json({ error: 'Failed to list settings' })
  }
})

// School info for the actor's school (or ?schoolId for superadmin).
// Used by login screen, top bar, sheets, and exports.
router.get('/school', async (req, res) => {
  try {
    const me = await actingUser(req)
    // Pre-login callers (login page branding): return first school if any
    if (!me) {
      const rows = await query('SELECT * FROM schools ORDER BY name LIMIT 1')
      if (rows.length) return res.json({ ...toLegacy(schoolToResponse(rows[0])), id: rows[0].id })
      return res.json(await getSettings())
    }
    if (me.role === 'superadmin' && req.query.schoolId) {
      const row = await getSchoolById(req.query.schoolId)
      if (!row) return res.status(404).json({ error: 'School not found' })
      return res.json({ ...toLegacy(schoolToResponse(row)), id: row.id })
    }
    if (me.school_id) {
      const row = await getSchoolById(me.school_id)
      if (row) return res.json({ ...toLegacy(schoolToResponse(row)), id: row.id })
    }
    return res.json(await getSettings())
  } catch (err) {
    console.error('Error fetching school info:', err.message)
    res.status(500).json({ error: 'Failed to fetch school info' })
  }
})

function toLegacy(s) {
  return {
    school_name: s?.name || '',
    school_id: s?.school_id || '',
    school_address: s?.address || '',
    school_short: s?.short || ''
  }
}

router.put('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const { settings } = req.body
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object' })
    }
    for (const [key, value] of Object.entries(settings)) {
      const existing = await query('SELECT key FROM settings WHERE key = ?', [key])
      if (existing.length > 0) {
        await run('UPDATE settings SET value = ? WHERE key = ?', [String(value), key])
      } else {
        await run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)])
      }
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Error updating settings:', err.message)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

router.put('/school', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    // Admins edit only their own school; superadmin edits ?schoolId or caller schoolId
    const targetId = me.role === 'superadmin'
      ? (req.body?.schoolId || req.body?.id || me.school_id || null)
      : (me.school_id || null)
    if (!targetId) return res.status(400).json({ error: 'schoolId is required' })
    const row = await getSchoolById(targetId)
    if (!row) return res.status(404).json({ error: 'School not found' })
    const updated = await updateSchoolRow(targetId, {
      school_name: req.body?.school_name,
      school_id: req.body?.school_id,
      school_address: req.body?.school_address,
      school_short: req.body?.school_short
    })
    await audit(me, 'school.settings', { type: 'school', id: targetId, name: updated?.name || '', schoolId: targetId }, `Updated school info`)
    res.json({ success: true, school: { ...toLegacy(schoolToResponse(updated)), id: updated.id } })
  } catch (err) {
    console.error('Error updating school info:', err.message)
    res.status(500).json({ error: 'Failed to update school info' })
  }
})

export default router
