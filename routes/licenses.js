import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, saveDatabase, seedLicenseForSchool, getSchoolById } from '../db.js'
import { requireRole, resolveScopeSchool, audit } from './_context.js'

const router = Router()

function calculateDaysRemaining(dateStr) {
  if (!dateStr) return 0
  const target = new Date(dateStr)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

function parseFeatures(featuresStr) {
  try {
    return JSON.parse(featuresStr || '{}')
  } catch {
    return {}
  }
}

// GET /api/licenses
// Returns active license and usage stats for current school, or all licenses for superadmin.
router.get('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.query.schoolId, { checkLicense: false })
    if (!scope) return

    if (me.role === 'superadmin' && !scope.schoolId) {
      // Superadmin global overview of all licenses
      const rows = await query(`
        SELECT l.*, s.name as school_name, s.short as school_short,
          (SELECT COUNT(*) FROM users u WHERE u.school_id = l.school_id AND u.role = 'teacher') as teacher_count,
          (SELECT COUNT(*) FROM students st WHERE st.school_id = l.school_id) as student_count
        FROM licenses l
        LEFT JOIN schools s ON l.school_id = s.id
        ORDER BY l.issued_at DESC
      `)

      return res.json(rows.map(row => ({
        ...row,
        features: parseFeatures(row.features),
        days_remaining: calculateDaysRemaining(row.status === 'trial' ? row.trial_ends_at : row.expires_at),
        is_expired: calculateDaysRemaining(row.status === 'trial' ? row.trial_ends_at : row.expires_at) <= 0
      })))
    }

    const schoolId = scope.schoolId || me.school_id
    if (!schoolId) {
      return res.status(400).json({ error: 'No school assigned to this account' })
    }

    let license = (await query('SELECT * FROM licenses WHERE school_id = ? ORDER BY issued_at DESC LIMIT 1', [schoolId]))[0]

    // Automatically seed an active campus license if none exists
    if (!license) {
      license = await seedLicenseForSchool(schoolId, 'campus', 'annual')
    }

    const school = await getSchoolById(schoolId)
    const teachersCount = (await query('SELECT COUNT(*) as cnt FROM users WHERE school_id = ? AND role = "teacher"', [schoolId]))[0]?.cnt || 0
    const studentsCount = (await query('SELECT COUNT(*) as cnt FROM students WHERE school_id = ?', [schoolId]))[0]?.cnt || 0

    const effectiveExpiry = license.status === 'trial' && license.trial_ends_at ? license.trial_ends_at : license.expires_at
    const daysRemaining = calculateDaysRemaining(effectiveExpiry)
    const isExpired = daysRemaining <= 0 && license.status !== 'active'

    res.json({
      license: {
        ...license,
        features: parseFeatures(license.features),
        days_remaining: daysRemaining,
        is_expired: isExpired,
        is_trial: license.status === 'trial'
      },
      usage: {
        teachers: teachersCount,
        max_teachers: license.max_teachers,
        students: studentsCount,
        max_students: license.max_students,
        days_remaining: daysRemaining
      },
      school: school ? { id: school.id, name: school.name, short: school.short, school_id: school.school_id } : null
    })
  } catch (err) {
    console.error('Failed to get licenses:', err.message)
    res.status(500).json({ error: 'Failed to retrieve license information' })
  }
})

// POST /api/licenses
// Issue / create a new license (superadmin or admin for school)
router.post('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const {
      school_id,
      plan_tier = 'campus',
      billing_cycle = 'annual',
      duration_months = 10,
      custom_key,
      max_teachers,
      max_students,
      notes
    } = req.body || {}

    const targetSchoolId = me.role === 'superadmin' ? (school_id || me.school_id) : me.school_id
    if (!targetSchoolId) {
      return res.status(400).json({ error: 'Target school is required' })
    }

    const id = uuidv4()
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    const licenseKey = custom_key ? custom_key.trim() : `ELY-${plan_tier.toUpperCase()}-2026-${rand}`

    const now = new Date()
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + Number(duration_months || 10))

    const nowStr = now.toISOString().split('T')[0]
    const expStr = expires.toISOString().split('T')[0]

    const effTeachers = max_teachers !== undefined ? Number(max_teachers) : (plan_tier === 'adviser' ? 1 : (plan_tier === 'division' ? 500 : 60))
    const effStudents = max_students !== undefined ? Number(max_students) : (plan_tier === 'adviser' ? 65 : (plan_tier === 'division' ? 25000 : 2500))

    await run(
      `INSERT INTO licenses (id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers, max_students, issued_at, expires_at, trial_ends_at, features, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        targetSchoolId,
        licenseKey,
        plan_tier,
        'active',
        billing_cycle,
        effTeachers,
        effStudents,
        nowStr,
        expStr,
        '',
        JSON.stringify({
          sf2_export: true,
          sardo_radar: true,
          analytics: true,
          audit_logs: plan_tier !== 'adviser',
          multi_school: plan_tier === 'division'
        }),
        notes || 'Provisioned License'
      ]
    )

    saveDatabase()

    await audit(me, 'license.create', { type: 'license', id, name: licenseKey, schoolId: targetSchoolId }, `Issued ${plan_tier} license "${licenseKey}"`)

    const created = (await query('SELECT * FROM licenses WHERE id = ?', [id]))[0]
    res.status(201).json({ license: { ...created, features: parseFeatures(created.features) } })
  } catch (err) {
    console.error('Failed to create license:', err.message)
    res.status(500).json({ error: 'Failed to issue license: ' + err.message })
  }
})

// POST /api/licenses/activate
// Activate an existing license key for the school
router.post('/activate', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const { licenseKey, schoolId } = req.body || {}
    if (!licenseKey || !licenseKey.trim()) {
      return res.status(400).json({ error: 'License key is required' })
    }

    const targetSchoolId = me.role === 'superadmin' ? (schoolId || me.school_id) : me.school_id
    if (!targetSchoolId) {
      return res.status(400).json({ error: 'School context required' })
    }

    const cleanKey = licenseKey.trim().toUpperCase()
    const found = (await query('SELECT * FROM licenses WHERE UPPER(license_key) = ?', [cleanKey]))[0]

    if (!found) {
      return res.status(404).json({ error: 'Invalid license key. Please verify your activation code.' })
    }

    const now = new Date()
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + (found.billing_cycle === 'monthly' ? 1 : 10))
    const expStr = expires.toISOString().split('T')[0]

    await run(
      'UPDATE licenses SET school_id = ?, status = ?, expires_at = ? WHERE id = ?',
      [targetSchoolId, 'active', expStr, found.id]
    )

    saveDatabase()

    await audit(me, 'license.activate', { type: 'license', id: found.id, name: cleanKey, schoolId: targetSchoolId }, `Activated license "${cleanKey}"`)

    const updated = (await query('SELECT * FROM licenses WHERE id = ?', [found.id]))[0]
    res.json({ success: true, license: { ...updated, features: parseFeatures(updated.features) } })
  } catch (err) {
    console.error('Failed to activate license:', err.message)
    res.status(500).json({ error: 'Failed to activate license: ' + err.message })
  }
})

// POST /api/licenses/start-trial
// Start a 14-day free trial for the school
router.post('/start-trial', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const { schoolId, plan_tier = 'campus' } = req.body || {}
    const targetSchoolId = me.role === 'superadmin' ? (schoolId || me.school_id) : me.school_id
    if (!targetSchoolId) {
      return res.status(400).json({ error: 'School context required' })
    }

    const now = new Date()
    const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const nowStr = now.toISOString().split('T')[0]
    const trialStr = trialEnds.toISOString().split('T')[0]

    const existing = (await query('SELECT * FROM licenses WHERE school_id = ?', [targetSchoolId]))[0]

    if (existing) {
      await run(
        'UPDATE licenses SET status = ?, plan_tier = ?, trial_ends_at = ?, expires_at = ? WHERE id = ?',
        ['trial', plan_tier, trialStr, trialStr, existing.id]
      )
    } else {
      const id = uuidv4()
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
      const key = `ELY-TRIAL-14D-${rand}`
      await run(
        `INSERT INTO licenses (id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers, max_students, issued_at, expires_at, trial_ends_at, features, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, targetSchoolId, key, plan_tier, 'trial', 'trial', 25, 1000, nowStr, trialStr, trialStr, JSON.stringify({ sf2_export: true, sardo_radar: true, analytics: true }), '14-Day Free Trial']
      )
    }

    saveDatabase()

    await audit(me, 'license.trial_start', { type: 'license', schoolId: targetSchoolId }, 'Started 14-day free trial')

    const updated = (await query('SELECT * FROM licenses WHERE school_id = ?', [targetSchoolId]))[0]
    res.json({ success: true, license: { ...updated, features: parseFeatures(updated?.features) } })
  } catch (err) {
    console.error('Failed to start trial:', err.message)
    res.status(500).json({ error: 'Failed to start trial' })
  }
})

// POST /api/licenses/renew
// Renew / extend active license by 1 month or 1 school year (10 months)
router.post('/renew', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const { schoolId, months = 10 } = req.body || {}
    const targetSchoolId = me.role === 'superadmin' ? (schoolId || me.school_id) : me.school_id

    const license = (await query('SELECT * FROM licenses WHERE school_id = ? ORDER BY issued_at DESC LIMIT 1', [targetSchoolId]))[0]
    if (!license) {
      return res.status(404).json({ error: 'No license found for this school' })
    }

    const currentExp = new Date(license.expires_at || Date.now())
    const baseDate = currentExp > new Date() ? currentExp : new Date()
    baseDate.setMonth(baseDate.getMonth() + Number(months))

    const newExpStr = baseDate.toISOString().split('T')[0]

    await run(
      'UPDATE licenses SET status = ?, expires_at = ? WHERE id = ?',
      ['active', newExpStr, license.id]
    )

    saveDatabase()

    await audit(me, 'license.renew', { type: 'license', id: license.id, schoolId: targetSchoolId }, `Extended license validity to ${newExpStr}`)

    const updated = (await query('SELECT * FROM licenses WHERE id = ?', [license.id]))[0]
    res.json({ success: true, license: { ...updated, features: parseFeatures(updated.features) } })
  } catch (err) {
    console.error('Failed to renew license:', err.message)
    res.status(500).json({ error: 'Failed to renew license' })
  }
})

// PUT /api/licenses/:id
// Update license parameters (status, tier, max_teachers, max_students, notes)
router.put('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const { id } = req.params
    const license = (await query('SELECT * FROM licenses WHERE id = ?', [id]))[0]
    if (!license) return res.status(404).json({ error: 'License not found' })

    if (me.role !== 'superadmin' && license.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    const {
      status,
      plan_tier,
      billing_cycle,
      expires_at,
      max_teachers,
      max_students,
      notes
    } = req.body || {}

    const sets = []
    const params = []

    if (status) { sets.push('status = ?'); params.push(status) }
    if (plan_tier) { sets.push('plan_tier = ?'); params.push(plan_tier) }
    if (billing_cycle) { sets.push('billing_cycle = ?'); params.push(billing_cycle) }
    if (expires_at) { sets.push('expires_at = ?'); params.push(expires_at) }
    if (max_teachers !== undefined) { sets.push('max_teachers = ?'); params.push(Number(max_teachers)) }
    if (max_students !== undefined) { sets.push('max_students = ?'); params.push(Number(max_students)) }
    if (notes !== undefined) { sets.push('notes = ?'); params.push(String(notes)) }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })

    params.push(id)
    await run(`UPDATE licenses SET ${sets.join(', ')} WHERE id = ?`, params)
    saveDatabase()

    await audit(me, 'license.update', { type: 'license', id, schoolId: license.school_id }, `Updated license "${license.license_key}"`)

    const updated = (await query('SELECT * FROM licenses WHERE id = ?', [id]))[0]
    res.json({ success: true, license: { ...updated, features: parseFeatures(updated.features) } })
  } catch (err) {
    console.error('Failed to update license:', err.message)
    res.status(500).json({ error: 'Failed to update license' })
  }
})

// POST /api/licenses/:id/suspend
// Suspend / stop a license (Superadmin or Admin)
router.post('/:id/suspend', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const { id } = req.params
    const license = (await query('SELECT * FROM licenses WHERE id = ?', [id]))[0]
    if (!license) return res.status(404).json({ error: 'License not found' })

    if (me.role !== 'superadmin' && license.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    await run('UPDATE licenses SET status = ? WHERE id = ?', ['suspended', id])
    saveDatabase()

    await audit(me, 'license.suspend', { type: 'license', id, schoolId: license.school_id }, `Suspended license "${license.license_key}"`)

    const updated = (await query('SELECT * FROM licenses WHERE id = ?', [id]))[0]
    res.json({ success: true, license: { ...updated, features: parseFeatures(updated.features) } })
  } catch (err) {
    console.error('Failed to suspend license:', err.message)
    res.status(500).json({ error: 'Failed to suspend license' })
  }
})

// POST /api/licenses/:id/resume
// Resume / reactivate a suspended license
router.post('/:id/resume', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const { id } = req.params
    const license = (await query('SELECT * FROM licenses WHERE id = ?', [id]))[0]
    if (!license) return res.status(404).json({ error: 'License not found' })

    if (me.role !== 'superadmin' && license.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    await run('UPDATE licenses SET status = ? WHERE id = ?', ['active', id])
    saveDatabase()

    await audit(me, 'license.resume', { type: 'license', id, schoolId: license.school_id }, `Resumed license "${license.license_key}"`)

    const updated = (await query('SELECT * FROM licenses WHERE id = ?', [id]))[0]
    res.json({ success: true, license: { ...updated, features: parseFeatures(updated.features) } })
  } catch (err) {
    console.error('Failed to resume license:', err.message)
    res.status(500).json({ error: 'Failed to resume license' })
  }
})

export default router
