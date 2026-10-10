import { Router } from 'express'
import { query, run, getSettings, getSchoolById, updateSchoolRow } from '../db.js'
import { requireRole, resolveScopeSchool, actingUser, schoolToResponse, audit } from './_context.js'

const router = Router()

const SCHOOL_KEYS = ['school_name', 'school_id', 'school_address', 'school_short']

router.get('/', async (req, res) => {
  try {
    const all = await query('SELECT `key`, `value` FROM settings')
    const result = {}
    for (const row of all) {
      result[row.key] = row.value
    }
    if (!result.school_year) {
      const syRows = await query('SELECT school_year FROM schools WHERE school_year != "" AND archived_at IS NULL ORDER BY school_year DESC LIMIT 1')
      result.school_year = syRows[0]?.school_year || '2026-2027'
    }
    if (!result.active_school_year) {
      result.active_school_year = result.school_year
    }
    res.json(result)
  } catch (err) {
    console.error('Error listing settings:', err.message)
    res.status(500).json({ error: 'Failed to list settings' })
  }
})

// Superadmin endpoint: Broadcast an academic school year to all schools
// Preserves each school's individual quarter_count (3 vs 4 quarters).
router.post('/apply-school-year', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const schoolYear = String(req.body?.school_year || req.body?.schoolYear || '').trim()
    if (!schoolYear) {
      return res.status(400).json({ error: 'School year is required' })
    }

    // Persist in settings table
    const existingSy = await query('SELECT `key` FROM settings WHERE `key` = ?', ['school_year'])
    if (existingSy.length > 0) {
      await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [schoolYear, 'school_year'])
    } else {
      await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['school_year', schoolYear])
    }

    const existingActive = await query('SELECT `key` FROM settings WHERE `key` = ?', ['active_school_year'])
    if (existingActive.length > 0) {
      await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [schoolYear, 'active_school_year'])
    } else {
      await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['active_school_year', schoolYear])
    }

    // Update all non-archived schools without affecting quarter_count or other settings
    await run('UPDATE schools SET school_year = ? WHERE archived_at IS NULL', [schoolYear])
    const countRows = await query('SELECT COUNT(*) as count FROM schools WHERE archived_at IS NULL')
    const updatedCount = Number(countRows[0]?.count || 0)

    await audit(me, 'settings.school_year_all', { school_year: schoolYear, updated_count: updatedCount }, `Applied school year "${schoolYear}" to all ${updatedCount} active schools`)
    res.json({ success: true, school_year: schoolYear, updatedSchoolsCount: updatedCount })
  } catch (err) {
    console.error('Error applying school year to all schools:', err.message)
    res.status(500).json({ error: 'Failed to apply school year to all schools' })
  }
})

// Retrieve the system-wide active School Year configuration and campus synchronization status
router.get('/school-year', async (req, res) => {
  try {
    const { error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const sySettings = await query('SELECT `key`, `value` FROM settings WHERE `key` = ? OR `key` = ?', ['school_year', 'active_school_year'])
    let globalSchoolYear = ''
    for (const row of sySettings) {
      if (row.key === 'school_year' && row.value) globalSchoolYear = row.value
      if (!globalSchoolYear && row.key === 'active_school_year' && row.value) globalSchoolYear = row.value
    }
    if (!globalSchoolYear) {
      const syRows = await query('SELECT school_year FROM schools WHERE school_year != "" AND archived_at IS NULL ORDER BY school_year DESC LIMIT 1')
      globalSchoolYear = syRows[0]?.school_year || '2026-2027'
    }

    const schoolsList = await query('SELECT id, name, short, school_id, school_year, quarter_count FROM schools WHERE archived_at IS NULL ORDER BY name ASC')
    const mapped = schoolsList.map(s => {
      const sy = s.school_year || globalSchoolYear
      return {
        id: s.id,
        name: s.name,
        short: s.short || '',
        school_id: s.school_id || '',
        school_year: sy,
        quarter_count: Number(s.quarter_count ?? 4) === 3 ? 3 : 4,
        is_synced: sy === globalSchoolYear
      }
    })

    const syncedCount = mapped.filter(m => m.is_synced).length

    res.json({
      school_year: globalSchoolYear,
      active_school_year: globalSchoolYear,
      total_schools: mapped.length,
      synced_schools: syncedCount,
      schools: mapped
    })
  } catch (err) {
    console.error('Error fetching school year configuration:', err.message)
    res.status(500).json({ error: 'Failed to fetch school year configuration' })
  }
})

// Configure and persist the system-wide active School Year (superadmin only)
// Optionally applies to all active campuses without altering their quarter system
router.put('/school-year', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const schoolYear = String(req.body?.school_year || req.body?.schoolYear || '').trim()
    if (!schoolYear) {
      return res.status(400).json({ error: 'School year is required' })
    }

    // Persist in settings table
    const existingSy = await query('SELECT `key` FROM settings WHERE `key` = ?', ['school_year'])
    if (existingSy.length > 0) {
      await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [schoolYear, 'school_year'])
    } else {
      await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['school_year', schoolYear])
    }

    const existingActive = await query('SELECT `key` FROM settings WHERE `key` = ?', ['active_school_year'])
    if (existingActive.length > 0) {
      await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [schoolYear, 'active_school_year'])
    } else {
      await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['active_school_year', schoolYear])
    }

    const applyToAll = req.body?.apply_to_all !== false && req.body?.applyToAll !== false
    let updatedCount = 0
    if (applyToAll) {
      await run('UPDATE schools SET school_year = ? WHERE archived_at IS NULL', [schoolYear])
      const countRows = await query('SELECT COUNT(*) as count FROM schools WHERE archived_at IS NULL')
      updatedCount = Number(countRows[0]?.count || 0)
    }

    await audit(
      me,
      'settings.school_year_configuration',
      { school_year: schoolYear, updated_count: updatedCount, apply_to_all: applyToAll },
      `Configured global school year "${schoolYear}" (applied to ${updatedCount} active schools)`
    )

    res.json({
      success: true,
      school_year: schoolYear,
      active_school_year: schoolYear,
      appliedToAll: applyToAll,
      updatedSchoolsCount: updatedCount
    })
  } catch (err) {
    console.error('Error updating school year configuration:', err.message)
    res.status(500).json({ error: 'Failed to update school year configuration' })
  }
})

// School info for the actor's school (or ?schoolId for superadmin).
// Used by login screen, top bar, sheets, and exports.
router.get('/school', async (req, res) => {
  try {
    const me = await actingUser(req, res)
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
    school_short: s?.short || '',
    attendance_lock_cutoff: s?.attendance_lock_cutoff || '',
    contact_email: s?.contact_email || '',
    contact_phone: s?.contact_phone || '',
    division: s?.division || '',
    district: s?.district || '',
    principal_name: s?.principal_name || '',
    school_year: s?.school_year || '',
    grading_period: s?.grading_period || '',
    logo_url: s?.logo_url || '',
    quarter_count: Number(s?.quarter_count ?? 4) === 3 ? 3 : 4
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
      if (key === 'support_email' && String(value).trim()) {
        const val = String(value).trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          return res.status(400).json({ error: 'Invalid support email address format' })
        }
      }
      const existing = await query('SELECT `key` FROM settings WHERE `key` = ?', [key])
      if (existing.length > 0) {
        await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [String(value), key])
      } else {
        await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', [key, String(value)])
      }
    }
    if ((req.body?.apply_to_all_schools || req.body?.applyToAllSchools) && settings.school_year && me.role === 'superadmin') {
      const sy = String(settings.school_year).trim()
      if (sy) {
        await run('UPDATE schools SET school_year = ? WHERE archived_at IS NULL', [sy])
        await audit(me, 'settings.school_year_all', { school_year: sy }, `Applied school year "${sy}" to all active schools via settings`)
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
      school_short: req.body?.school_short,
      attendance_lock_cutoff: req.body?.attendance_lock_cutoff,
      contact_email: req.body?.contact_email,
      contact_phone: req.body?.contact_phone,
      division: req.body?.division,
      district: req.body?.district,
      principal_name: req.body?.principal_name,
      school_year: req.body?.school_year,
      grading_period: req.body?.grading_period,
      logo_url: req.body?.logo_url,
      quarter_count: req.body?.quarter_count,
      sardo_consecutive_absences: req.body?.sardo_consecutive_absences,
      sardo_cumulative_absences: req.body?.sardo_cumulative_absences
    })
    await audit(me, 'school.settings', { type: 'school', id: targetId, name: updated?.name || '', schoolId: targetId }, `Updated school info`)
    res.json({ success: true, school: { ...toLegacy(schoolToResponse(updated)), id: updated.id } })
  } catch (err) {
    console.error('Error updating school info:', err.message)
    res.status(500).json({ error: 'Failed to update school info' })
  }
})

export default router
