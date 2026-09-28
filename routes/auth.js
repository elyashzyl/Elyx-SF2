import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, getSchoolById, logAudit, saveDatabase, getGradeLevels } from '../db.js'
import { schoolToResponse, requireRole, isLicenseActive } from './_context.js'

const router = Router()

async function publicUser(row) {
  const { password: _, ...userData } = row
  const school = userData.school_id ? schoolToResponse(await getSchoolById(userData.school_id)) : null
  return { ...userData, school }
}

// Public endpoint to list schools for registration
router.get('/schools', async (req, res) => {
  try {
    const schools = await query('SELECT id, name, school_id, address, short FROM schools ORDER BY name ASC')
    res.json(schools.map(schoolToResponse))
  } catch (err) {
    console.error('Failed to fetch public schools:', err.message)
    res.status(500).json({ error: 'Failed to fetch schools' })
  }
})

// Public endpoint to get grade levels for a school during registration
router.get('/schools/:id/grades', async (req, res) => {
  try {
    const grades = await getGradeLevels(req.params.id)
    res.json(grades || [])
  } catch (err) {
    console.error('Failed to fetch school grades:', err.message)
    res.json([])
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }
    const cleanUsername = String(username).trim()
    const users = await query('SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND password = ?', [cleanUsername, password])
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    const user = users[0]

    // License enforcement: check school's license status
    if (user.role !== 'superadmin' && user.school_id) {
      const license = (await query('SELECT * FROM licenses WHERE school_id = ? ORDER BY issued_at DESC LIMIT 1', [user.school_id]))[0]
      if (license && !isLicenseActive(license)) {
        const reason = license.status === 'suspended' ? 'suspended' : 'expired'
        if (user.role === 'teacher') {
          return res.status(403).json({
            error: `Your school's ElyTrack license is currently ${reason}. Teacher access is locked. Please contact your school administrator.`
          })
        }
      }
    }

    res.json({ user: await publicUser(user) })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Public registration is disabled; accounts are provisioned through subscription.
// The trial endpoint below is intentionally separate from /register so the
// regular account-provisioning policy remains unchanged.
router.post('/register', (_req, res) => {
  res.status(403).json({ error: 'Public registration is disabled. Accounts are provisioned upon school deployment.' })
})

// Start a database-backed free trial from the public landing page.
// This does not grant any administrative access beyond the new school workspace.
router.post('/trial', async (req, res) => {
  const body = req.body || {}
  const planTier = String(body.plan_tier || '').trim().toLowerCase()
  const schoolName = String(body.school_name || '').trim()
  const externalSchoolId = String(body.school_id || '').trim()
  const address = String(body.address || '').trim()
  const short = String(body.short || '').trim()
  const adminName = String(body.admin_name || '').trim()
  const username = String(body.admin_username || '').trim()
  const password = String(body.admin_password || '')
  const passwordConfirmation = String(body.admin_password_confirmation || '')

  if (!planTier || !schoolName || !adminName || !username || !password || !passwordConfirmation) {
    return res.status(400).json({ error: 'Plan, school name, administrator name, username, password, and password confirmation are required' })
  }
  if (schoolName.length > 255 || adminName.length > 255 || username.length > 255) {
    return res.status(400).json({ error: 'School name, administrator name, and username must be 255 characters or fewer' })
  }
  if (!/^[A-Za-z0-9._-]{3,255}$/.test(username)) {
    return res.status(400).json({ error: 'Username may contain only letters, numbers, dots, underscores, and hyphens' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }
  if (password !== passwordConfirmation) {
    return res.status(400).json({ error: 'Passwords do not match' })
  }

  let schoolId = ''
  let userId = ''
  let licenseId = ''
  try {
    const planRows = await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ? LIMIT 1', [planTier, planTier])
    const plan = planRows[0]
    if (!plan) return res.status(400).json({ error: 'The selected subscription plan is not available' })

    const trialDays = Number(plan.trial_days)
    if (!Number.isInteger(trialDays) || trialDays <= 0) {
      return res.status(400).json({ error: 'The selected plan does not include a valid free trial' })
    }
    const maxTeachers = Number(plan.max_teachers)
    const maxStudents = Number(plan.max_students)
    if (!Number.isInteger(maxTeachers) || maxTeachers <= 0 || !Number.isInteger(maxStudents) || maxStudents <= 0) {
      return res.status(400).json({ error: 'The selected plan has invalid capacity limits' })
    }

    const duplicate = await query('SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1', [username])
    if (duplicate.length > 0) {
      return res.status(409).json({ error: 'That username is already in use. Choose another username or sign in.' })
    }

    schoolId = uuidv4()
    userId = uuidv4()
    licenseId = uuidv4()
    const now = new Date()
    const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
    const issuedAt = now.toISOString().split('T')[0]
    const trialEndsAt = trialEnds.toISOString().split('T')[0]
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
    const licenseKey = `ELY-TRIAL-${trialDays}D-${rand}`
    const features = typeof plan.modules === 'string' ? plan.modules : JSON.stringify(plan.modules || {})

    await run(
      'INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [schoolId, schoolName, externalSchoolId, address, short]
    )
    await run(
      'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, password, adminName, 'admin', '', '', '', schoolId]
    )
    await run(
      `INSERT INTO licenses (
        id, school_id, license_key, plan_tier, status, billing_cycle,
        max_teachers, max_students, issued_at, expires_at, trial_ends_at,
        features, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        licenseId,
        schoolId,
        licenseKey,
        plan.tier || planTier,
        'trial',
        'trial',
        maxTeachers,
        maxStudents,
        issuedAt,
        trialEndsAt,
        trialEndsAt,
        features,
        `${trialDays}-Day Free Trial started from public onboarding`
      ]
    )

    // A new school starts with no grade or section records. Its administrator
    // configures those records explicitly after onboarding.
    saveDatabase()

    const createdUser = (await query('SELECT * FROM users WHERE id = ?', [userId]))[0]
    const createdLicense = (await query('SELECT * FROM licenses WHERE id = ?', [licenseId]))[0]
    res.status(201).json({
      user: await publicUser(createdUser),
      license: {
        ...createdLicense,
        features: typeof createdLicense.features === 'string'
          ? JSON.parse(createdLicense.features || '{}')
          : (createdLicense.features || {})
      },
      trial_days: trialDays
    })
  } catch (err) {
    // Keep retries from leaving an orphaned school or license if a later
    // insert fails. MySQL and SQLite both support these simple compensating
    // deletes through the shared database adapter.
    try { if (licenseId) await run('DELETE FROM licenses WHERE id = ?', [licenseId]) } catch {}
    try { if (schoolId) await run('DELETE FROM grade_levels WHERE school_id = ?', [schoolId]) } catch {}
    try { if (userId) await run('DELETE FROM users WHERE id = ?', [userId]) } catch {}
    try { if (schoolId) await run('DELETE FROM schools WHERE id = ?', [schoolId]) } catch {}
    console.error('Trial onboarding error:', err.message)
    res.status(500).json({ error: 'Unable to start the trial. Please try again.' })
  }
})

// Superadmin starts impersonating another user (admin or teacher).
// The client swaps its session to the returned user but keeps the original
// superadmin id so it can stop impersonating later.
router.post('/impersonate', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const { targetId } = req.body || {}
    if (!targetId) return res.status(400).json({ error: 'targetId is required' })
    if (targetId === me.id) return res.status(400).json({ error: 'Cannot impersonate yourself' })
    const target = (await query('SELECT * FROM users WHERE id = ?', [targetId]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.role === 'superadmin') return res.status(403).json({ error: 'Cannot impersonate another superadmin' })
    await logAudit({
      actor_id: me.id, actor_name: me.name, actor_role: me.role, actor_school_id: me.school_id || '',
      action: 'impersonate.start',
      target_type: 'user', target_id: target.id, target_name: target.name,
      target_school_id: target.school_id || '',
      detail: `Started impersonating ${target.name} (${target.role})`
    })
    res.json({ user: await publicUser(target), impersonatedBy: { id: me.id, name: me.name } })
  } catch (err) {
    console.error('Impersonate error:', err.message)
    res.status(500).json({ error: 'Impersonation failed' })
  }
})

// Stop impersonating: verify the original superadmin still exists, then
// restore their session. The client sends back the stored superadmin id.
router.post('/impersonate/stop', async (req, res) => {
  try {
    const { superadminId, userId } = req.body || {}
    if (!superadminId) return res.status(400).json({ error: 'superadminId is required' })
    const admin = (await query('SELECT * FROM users WHERE id = ?', [superadminId]))[0]
    if (!admin || admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Original superadmin session is no longer valid' })
    }
    const stopped = userId ? (await query('SELECT * FROM users WHERE id = ?', [userId]))[0] : null
    await logAudit({
      actor_id: admin.id, actor_name: admin.name, actor_role: admin.role, actor_school_id: admin.school_id || '',
      action: 'impersonate.stop',
      target_type: 'user', target_id: stopped?.id || '', target_name: stopped?.name || '',
      target_school_id: stopped?.school_id || '',
      detail: stopped ? `Stopped impersonating ${stopped.name}` : 'Stopped impersonation'
    })
    res.json({ user: await publicUser(admin) })
  } catch (err) {
    console.error('Impersonate stop error:', err.message)
    res.status(500).json({ error: 'Impersonation stop failed' })
  }
})

export default router