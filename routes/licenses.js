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

// GET /api/licenses/plans
// Public: Returns all subscription plans stored in the database.
router.get('/plans', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM subscription_plans ORDER BY sort_order ASC, price_annual_monthly ASC')
    res.json(rows.map(r => ({
      ...r,
      features: typeof r.features === 'string' ? JSON.parse(r.features || '[]') : (r.features || []),
      modules: typeof r.modules === 'string' ? JSON.parse(r.modules || '{}') : (r.modules || {})
    })))
  } catch (err) {
    console.error('Failed to get subscription plans:', err.message)
    res.status(500).json({ error: 'Failed to retrieve plans' })
  }
})

// GET /api/licenses/landing-data
// Public: Dynamic landing data from database (plans, school context, telemetry stats, sample roster)
router.get('/landing-data', async (req, res) => {
  try {
    const planRows = await query('SELECT * FROM subscription_plans ORDER BY sort_order ASC')
    const plans = planRows.map(r => ({
      ...r,
      features: typeof r.features === 'string' ? JSON.parse(r.features || '[]') : (r.features || []),
      modules: typeof r.modules === 'string' ? JSON.parse(r.modules || '{}') : (r.modules || {})
    }))

    const schoolRow = (await query('SELECT id, name, short, school_id, address FROM schools ORDER BY id ASC LIMIT 1'))[0] || null
    const studentCount = (await query('SELECT COUNT(*) as cnt FROM students'))[0]?.cnt || 0
    const teacherCount = (await query('SELECT COUNT(*) as cnt FROM users WHERE role = "teacher"'))[0]?.cnt || 0
    const sectionCount = (await query('SELECT COUNT(DISTINCT grade || "_" || section) as cnt FROM students'))[0]?.cnt || 0
    const monthlyRecordCount = (await query('SELECT COUNT(*) as cnt FROM monthly_records'))[0]?.cnt || 0

    // Fetch up to 5 real students from database for interactive demo preview
    let previewStudents = []
    if (schoolRow) {
      previewStudents = await query(
        'SELECT id, name, gender, grade, section FROM students WHERE school_id = ? ORDER BY name ASC LIMIT 5',
        [schoolRow.id]
      )
    }
    if (!previewStudents.length) {
      previewStudents = await query('SELECT id, name, gender, grade, section FROM students ORDER BY name ASC LIMIT 5')
    }

    res.json({
      plans,
      school: schoolRow,
      stats: {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalSections: Math.max(sectionCount, 1),
        totalSF2Filed: monthlyRecordCount
      },
      previewStudents
    })
  } catch (err) {
    console.error('Failed to get landing data:', err.message)
    res.status(500).json({ error: 'Failed to retrieve landing data' })
  }
})

// PUT /api/licenses/plans/:id
// Superadmin: Update a subscription plan in the database
router.put('/plans/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { id } = req.params
    const {
      name,
      description,
      tag,
      price_monthly,
      price_annual_monthly,
      billing_annual_total,
      trial_days,
      max_teachers,
      max_students,
      badge,
      cta_text,
      cta_url,
      features,
      modules
    } = req.body || {}

    const existing = (await query('SELECT * FROM subscription_plans WHERE id = ?', [id]))[0]
    if (!existing) {
      return res.status(404).json({ error: 'Plan not found' })
    }

    await run(
      `UPDATE subscription_plans SET
        name = ?, description = ?, tag = ?, price_monthly = ?, price_annual_monthly = ?,
        billing_annual_total = ?, trial_days = ?, max_teachers = ?, max_students = ?,
        badge = ?, cta_text = ?, cta_url = ?, features = ?, modules = ?
       WHERE id = ?`,
      [
        name ?? existing.name,
        description ?? existing.description,
        tag ?? existing.tag,
        Number(price_monthly !== undefined ? price_monthly : existing.price_monthly),
        Number(price_annual_monthly !== undefined ? price_annual_monthly : existing.price_annual_monthly),
        Number(billing_annual_total !== undefined ? billing_annual_total : existing.billing_annual_total),
        Number(trial_days !== undefined ? trial_days : existing.trial_days),
        Number(max_teachers !== undefined ? max_teachers : existing.max_teachers),
        Number(max_students !== undefined ? max_students : existing.max_students),
        badge ?? existing.badge,
        cta_text ?? existing.cta_text,
        cta_url ?? existing.cta_url,
        typeof features === 'object' ? JSON.stringify(features) : (features || existing.features),
        typeof modules === 'object' ? JSON.stringify(modules) : (modules || existing.modules),
        id
      ]
    )

    saveDatabase()
    await audit(me, 'plan.update', { type: 'plan', id, name: name || existing.name }, `Updated subscription plan "${id}"`)

    const updated = (await query('SELECT * FROM subscription_plans WHERE id = ?', [id]))[0]
    res.json({
      ...updated,
      features: typeof updated.features === 'string' ? JSON.parse(updated.features || '[]') : (updated.features || []),
      modules: typeof updated.modules === 'string' ? JSON.parse(updated.modules || '{}') : (updated.modules || {})
    })
  } catch (err) {
    console.error('Failed to update plan:', err.message)
    res.status(500).json({ error: 'Failed to update plan: ' + err.message })
  }
})

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

    // Fetch plan limits and modules from database
    const planRows = await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ?', [plan_tier, plan_tier])
    const dbPlan = planRows[0] || null

    const effTeachers = max_teachers !== undefined ? Number(max_teachers) : (dbPlan ? dbPlan.max_teachers : (plan_tier === 'adviser' ? 1 : 60))
    const effStudents = max_students !== undefined ? Number(max_students) : (dbPlan ? dbPlan.max_students : (plan_tier === 'adviser' ? 65 : 2500))
    const effFeatures = dbPlan && dbPlan.modules ? (typeof dbPlan.modules === 'string' ? dbPlan.modules : JSON.stringify(dbPlan.modules)) : JSON.stringify({
      sf2_export: true,
      sardo_radar: true,
      analytics: true,
      audit_logs: plan_tier !== 'adviser',
      multi_school: plan_tier === 'division'
    })

    // Check for existing active or trial license for target school to prevent duplication
    const existingActive = await query(
      'SELECT id, license_key, status FROM licenses WHERE school_id = ? AND status IN ("active", "trial")',
      [targetSchoolId]
    )
    if (existingActive.length > 0) {
      // Archive/supersede prior active licenses to prevent duplicate active records
      for (const prev of existingActive) {
        await run('UPDATE licenses SET status = "superseded" WHERE id = ?', [prev.id])
      }
    }

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
        effFeatures,
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
    // Fetch plan details from database
    const planRows = await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ?', [plan_tier, plan_tier])
    const dbPlan = planRows[0] || null
    const trialDays = Number(dbPlan?.trial_days || 14)
    const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
    const nowStr = now.toISOString().split('T')[0]
    const trialStr = trialEnds.toISOString().split('T')[0]
    const effTeachers = dbPlan?.max_teachers || (plan_tier === 'adviser' ? 1 : 25)
    const effStudents = dbPlan?.max_students || (plan_tier === 'adviser' ? 65 : 1000)
    const effFeatures = dbPlan && dbPlan.modules ? (typeof dbPlan.modules === 'string' ? dbPlan.modules : JSON.stringify(dbPlan.modules)) : JSON.stringify({ sf2_export: true, sardo_radar: true, analytics: true })

    const existing = (await query('SELECT * FROM licenses WHERE school_id = ?', [targetSchoolId]))[0]

    if (existing) {
      await run(
        'UPDATE licenses SET status = ?, plan_tier = ?, trial_ends_at = ?, expires_at = ?, max_teachers = ?, max_students = ?, features = ? WHERE id = ?',
        ['trial', plan_tier, trialStr, trialStr, effTeachers, effStudents, effFeatures, existing.id]
      )
    } else {
      const id = uuidv4()
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
      const key = `ELY-TRIAL-${trialDays}D-${rand}`
      await run(
        `INSERT INTO licenses (id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers, max_students, issued_at, expires_at, trial_ends_at, features, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, targetSchoolId, key, plan_tier, 'trial', 'trial', effTeachers, effStudents, nowStr, trialStr, trialStr, effFeatures, `${trialDays}-Day Free Trial`]
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

// DELETE /api/licenses/:id
// Delete a license record (Superadmin only)
router.delete('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { id } = req.params
    const license = (await query('SELECT * FROM licenses WHERE id = ?', [id]))[0]
    if (!license) {
      return res.status(404).json({ error: 'License record not found' })
    }

    await run('DELETE FROM licenses WHERE id = ?', [id])
    saveDatabase()

    await audit(
      me,
      'license.delete',
      { type: 'license', id, schoolId: license.school_id },
      `Deleted license "${license.license_key}"`
    )

    res.json({ success: true, message: `License ${license.license_key} deleted successfully` })
  } catch (err) {
    console.error('Failed to delete license:', err.message)
    res.status(500).json({ error: 'Failed to delete license: ' + err.message })
  }
})

export default router
