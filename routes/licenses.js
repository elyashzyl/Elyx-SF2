import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, saveDatabase, getSchoolById } from '../db.js'
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
    const schoolFilter = schoolRow ? ' WHERE school_id = ?' : ''
    const schoolParams = schoolRow ? [schoolRow.id] : []
    const students = await query(`SELECT id, name, gender, grade, section FROM students${schoolFilter} ORDER BY name ASC`, schoolParams)
    const studentCount = students.length
    const teacherCount = (await query(`SELECT COUNT(*) as cnt FROM users WHERE role = "teacher"${schoolRow ? ' AND school_id = ?' : ''}`, schoolParams))[0]?.cnt || 0
    const sectionKeys = new Set(students.map(student => `${student.grade || ''}__${student.section || ''}`))
    const monthlyRecordCount = (await query(`SELECT COUNT(*) as cnt FROM monthly_records${schoolRow ? ' WHERE school_id = ?' : ''}`, schoolParams))[0]?.cnt || 0

    const currentMonth = new Date().toISOString().slice(0, 7)
    const attendanceRows = await query(`
      SELECT ar.date, ae.student_id, ae.am1, ae.am2, ae.am3, ae.am4, ae.am5, ae.am6,
        ae.pm1, ae.pm2, ae.pm3, ae.pm4
      FROM attendance_records ar
      JOIN attendance_entries ae ON ae.record_id = ar.id
      WHERE ar.date LIKE ?${schoolRow ? ' AND ar.school_id = ?' : ''}
    `, schoolRow ? [`${currentMonth}%`, schoolRow.id] : [`${currentMonth}%`])
    const periodFields = ['am1', 'am2', 'am3', 'am4', 'am5', 'am6', 'pm1', 'pm2', 'pm3', 'pm4']
    const presentRows = attendanceRows.filter(row => periodFields.some(field => ['E', 'T'].includes(String(row[field] || '').toUpperCase())))
    const attendanceRate = attendanceRows.length
      ? Number(((presentRows.length / attendanceRows.length) * 100).toFixed(1))
      : 0
    const schoolDays = new Set(attendanceRows.map(row => row.date)).size

    const riskStudents = schoolRow ? await query(`
      SELECT st.id, st.name, st.grade, st.section,
        SUM(COALESCE(me.absent, 0)) AS absent_count,
        SUM(COALESCE(me.tardy, 0)) AS tardy_count
      FROM students st
      JOIN monthly_entries me ON me.student_id = st.id
      JOIN monthly_records mr ON mr.id = me.record_id AND mr.school_id = st.school_id
      WHERE st.school_id = ?
      GROUP BY st.id, st.name, st.grade, st.section
      HAVING SUM(COALESCE(me.absent, 0)) >= 3 OR SUM(COALESCE(me.tardy, 0)) >= 2
      ORDER BY absent_count DESC, tardy_count DESC, st.name ASC
      LIMIT 5
    `, [schoolRow.id]) : []

    // Preview data is always sourced from the selected database school. Empty
    // tables remain empty instead of being replaced by demo records.
    const latestMarks = new Map()
    for (const row of attendanceRows) {
      if (!latestMarks.has(row.student_id)) latestMarks.set(row.student_id, row)
    }
    const previewStudents = students.slice(0, 5).map(student => {
      const marks = latestMarks.get(student.id) || {}
      const values = ['am1', 'am2', 'am3', 'am4'].map(field => String(marks[field] || ''))
      const status = values.includes('A')
        ? 'Absent'
        : (values.includes('T') ? 'Tardy' : (values.includes('E') ? 'Present' : 'Unmarked'))
      return { ...student, lrn: student.lrn || '', am1: values[0], am2: values[1], am3: values[2], am4: values[3], status }
    })
    const mappedRiskStudents = riskStudents.map(student => {
      const absent = Number(student.absent_count || 0)
      const tardy = Number(student.tardy_count || 0)
      return {
        id: student.id,
        name: student.name,
        grade: student.grade || '',
        section: student.section || '',
        risk: absent >= 5 ? 'high' : 'mid',
        detail: absent >= 3 ? `${absent} recorded absences` : `${tardy} recorded tardies`,
        action: absent >= 5 ? 'Review Required' : 'Adviser Follow-up'
      }
    })

    res.json({
      plans,
      school: schoolRow,
      stats: {
        totalStudents: studentCount,
        totalTeachers: Number(teacherCount),
        totalSections: sectionKeys.size,
        totalSF2Filed: Number(monthlyRecordCount),
        maleStudents: students.filter(student => String(student.gender || '').toLowerCase() === 'male').length,
        femaleStudents: students.filter(student => String(student.gender || '').toLowerCase() === 'female').length,
        averageDailyAttendance: schoolDays ? Number((presentRows.length / schoolDays).toFixed(1)) : 0,
        attendanceRate,
        schoolDays,
        atRiskStudents: mappedRiskStudents.length,
        retentionLabel: mappedRiskStudents.length ? 'Records requiring review' : 'No alerts recorded',
        monthLabel: currentMonth
      },
      previewStudents,
      riskStudents: mappedRiskStudents
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
      billing_months,
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
        billing_annual_total = ?, billing_months = ?, trial_days = ?, max_teachers = ?, max_students = ?,
        badge = ?, cta_text = ?, cta_url = ?, features = ?, modules = ?
       WHERE id = ?`,
      [
        name ?? existing.name,
        description ?? existing.description,
        tag ?? existing.tag,
        Number(price_monthly !== undefined ? price_monthly : existing.price_monthly),
        Number(price_annual_monthly !== undefined ? price_annual_monthly : existing.price_annual_monthly),
        Number(billing_annual_total !== undefined ? billing_annual_total : existing.billing_annual_total),
        billing_months !== undefined ? Number(billing_months) : existing.billing_months,
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

// DELETE /api/licenses/plans/:id
// Superadmin: Delete a subscription plan from the database
router.delete('/plans/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { id } = req.params
    const plan = (await query('SELECT * FROM subscription_plans WHERE id = ?', [id]))[0]
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' })
    }

    const assignedLicenses = await query('SELECT id, license_key FROM licenses WHERE plan_tier = ? OR plan_tier = ?', [plan.tier, plan.id])
    if (assignedLicenses.length > 0) {
      return res.status(400).json({ error: `Cannot delete plan "${plan.name}" because it is currently assigned to ${assignedLicenses.length} active license(s).` })
    }

    await run('DELETE FROM subscription_plans WHERE id = ?', [id])
    saveDatabase()

    await audit(me, 'plan.delete', { type: 'plan', id, name: plan.name }, `Deleted subscription plan "${plan.name}" (${plan.tier})`)
    res.json({ success: true, message: `Plan "${plan.name}" deleted successfully` })
  } catch (err) {
    console.error('Failed to delete subscription plan:', err.message)
    res.status(500).json({ error: 'Failed to delete plan: ' + err.message })
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

    if (!license) {
      return res.status(404).json({ error: 'No license has been provisioned for this school' })
    }

    const school = await getSchoolById(schoolId)
    const licensePlan = (await query('SELECT trial_days, billing_months FROM subscription_plans WHERE tier = ? OR id = ? LIMIT 1', [license.plan_tier, license.plan_tier]))[0] || null
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
        is_trial: license.status === 'trial',
        trial_days: licensePlan?.trial_days || null,
        billing_months: licensePlan?.billing_months || null
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
// Issue / create a new license (Superadmin only)
router.post('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const {
      school_id,
      plan_tier,
      billing_cycle,
      duration_months,
      custom_key,
      max_teachers,
      max_students,
      notes
    } = req.body || {}

    const targetSchoolId = me.role === 'superadmin' ? (school_id || me.school_id) : me.school_id
    if (!targetSchoolId || !plan_tier || !billing_cycle || !Number.isFinite(Number(duration_months))) {
      return res.status(400).json({ error: 'Target school, plan, billing cycle, and duration are required' })
    }
    if (!['monthly', 'annual'].includes(billing_cycle)) {
      return res.status(400).json({ error: 'Billing cycle must be monthly or annual' })
    }

    const id = uuidv4()
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    const licenseKey = custom_key ? custom_key.trim() : `ELY-${plan_tier.toUpperCase()}-${new Date().getFullYear()}-${rand}`

    const now = new Date()
    const durationMonths = Number(duration_months)
    if (!Number.isInteger(durationMonths) || durationMonths <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number of months' })
    }
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + durationMonths)

    const nowStr = now.toISOString().split('T')[0]
    const expStr = expires.toISOString().split('T')[0]

    // Fetch plan limits and modules from database
    const planRows = await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ?', [plan_tier, plan_tier])
    const dbPlan = planRows[0]
    if (!dbPlan) return res.status(400).json({ error: 'The selected subscription plan does not exist' })

    const effTeachers = max_teachers !== undefined ? Number(max_teachers) : Number(dbPlan.max_teachers)
    const effStudents = max_students !== undefined ? Number(max_students) : Number(dbPlan.max_students)
    if (!Number.isInteger(effTeachers) || effTeachers <= 0 || !Number.isInteger(effStudents) || effStudents <= 0) {
      return res.status(400).json({ error: 'The selected plan has invalid capacity limits' })
    }
    const effFeatures = typeof dbPlan.modules === 'string' ? dbPlan.modules : JSON.stringify(dbPlan.modules || {})

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
        notes || ''
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
// Activate an existing license key for the school (Superadmin only)
router.post('/activate', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
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
    const plan = (await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ? LIMIT 1', [found.plan_tier, found.plan_tier]))[0]
    const renewalMonths = found.billing_cycle === 'monthly' ? 1 : Number(plan?.billing_months)
    if (!Number.isInteger(renewalMonths) || renewalMonths <= 0) {
      return res.status(400).json({ error: 'The selected plan has no valid billing duration' })
    }
    expires.setMonth(expires.getMonth() + renewalMonths)
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
// Start a database-configured free trial for the school (Superadmin only)
router.post('/start-trial', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { schoolId, plan_tier } = req.body || {}
    const targetSchoolId = me.role === 'superadmin' ? (schoolId || me.school_id) : me.school_id
    if (!targetSchoolId) {
      return res.status(400).json({ error: 'School context required' })
    }

    if (!plan_tier) return res.status(400).json({ error: 'A subscription plan is required' })
    const now = new Date()
    // Fetch plan details from database
    const planRows = await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ?', [plan_tier, plan_tier])
    const dbPlan = planRows[0]
    if (!dbPlan) return res.status(400).json({ error: 'The selected subscription plan does not exist' })
    const trialDays = Number(dbPlan.trial_days)
    if (!Number.isInteger(trialDays) || trialDays <= 0) return res.status(400).json({ error: 'The selected plan does not include a valid trial' })
    if (trialDays <= 0) return res.status(400).json({ error: 'The selected plan does not include a trial' })
    const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
    const nowStr = now.toISOString().split('T')[0]
    const trialStr = trialEnds.toISOString().split('T')[0]
    const effTeachers = Number(dbPlan.max_teachers)
    const effStudents = Number(dbPlan.max_students)
    if (!Number.isInteger(effTeachers) || effTeachers <= 0 || !Number.isInteger(effStudents) || effStudents <= 0) {
      return res.status(400).json({ error: 'The selected plan has invalid capacity limits' })
    }
    const effFeatures = typeof dbPlan.modules === 'string' ? dbPlan.modules : JSON.stringify(dbPlan.modules || {})

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

    await audit(me, 'license.trial_start', { type: 'license', schoolId: targetSchoolId }, `Started ${trialDays}-day free trial`)

    const updated = (await query('SELECT * FROM licenses WHERE school_id = ?', [targetSchoolId]))[0]
    res.json({ success: true, license: { ...updated, features: parseFeatures(updated?.features) } })
  } catch (err) {
    console.error('Failed to start trial:', err.message)
    res.status(500).json({ error: 'Failed to start trial' })
  }
})

// POST /api/licenses/renew
// Renew / extend active license by 1 month or 1 school year (Superadmin only)
router.post('/renew', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { schoolId, months } = req.body || {}
    const targetSchoolId = me.role === 'superadmin' ? (schoolId || me.school_id) : me.school_id

    const renewalMonths = Number(months)
    if (!Number.isInteger(renewalMonths) || renewalMonths <= 0) {
      return res.status(400).json({ error: 'A positive renewal duration in months is required' })
    }

    const license = (await query('SELECT * FROM licenses WHERE school_id = ? ORDER BY issued_at DESC LIMIT 1', [targetSchoolId]))[0]
    if (!license) {
      return res.status(404).json({ error: 'No license found for this school' })
    }

    const currentExp = new Date(license.expires_at || Date.now())
    const baseDate = currentExp > new Date() ? currentExp : new Date()
    baseDate.setMonth(baseDate.getMonth() + renewalMonths)

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
// Update license parameters (Superadmin only)
router.put('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
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
// Suspend / stop a license (Superadmin only)
router.post('/:id/suspend', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
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
// Resume / reactivate a suspended license (Superadmin only)
router.post('/:id/resume', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
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
