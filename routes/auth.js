import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, getSchoolById, logAudit, saveDatabase, getGradeLevels, DB_MODE } from '../db.js'
import prisma from '../prisma/client.js'
import { schoolToResponse, requireRole, isLicenseActive } from './_context.js'
import { hashPassword, hashLegacyPasswordForMigration, verifyPassword, isPasswordHash } from '../lib/passwords.js'
import { createSession, setSessionCookie, clearSessionCookie, revokeSession, getSession, updateSessionUser, revokeAllUserSessions } from '../lib/sessions.js'
import { asTrimmedString } from '../lib/validation.js'
import { ACCOUNT_TOKEN_TYPES, consumeAccountToken, inspectAccountToken, issueAccountToken } from '../lib/account-tokens.js'
import { accountLink, sendAccountEmail } from '../lib/mailer.js'

const router = Router()

async function listPublicSchoolsWithPrisma() {
  if (DB_MODE !== 'mysql' || !prisma) return null
  try {
    const rows = await prisma.school.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, schoolId: true, address: true, short: true },
      orderBy: { name: 'asc' }
    })
    return rows.map(row => schoolToResponse({
      ...row,
      school_id: row.schoolId,
      attendance_lock_cutoff: '',
      contact_email: '',
      contact_phone: '',
      division: '',
      district: '',
      principal_name: '',
      school_year: '',
      grading_period: '',
      archived_at: null,
      archived_by: '',
      archive_reason: ''
    }))
  } catch (error) {
    console.warn('[auth] Prisma public school list fallback:', error.message)
    return null
  }
}

function parseDatabaseDate(value) {
  if (!value) return null
  const text = String(value)
  const normalized = /z$/i.test(text) || /[+-]\d{2}:?\d{2}$/.test(text)
    ? text
    : `${text.replace(' ', 'T')}Z`
  const date = new Date(normalized)
  return Number.isFinite(date.getTime()) ? date : null
}

async function publicUser(row) {
  const { password: _, ...userData } = row
  const school = userData.school_id ? schoolToResponse(await getSchoolById(userData.school_id)) : null
  return { ...userData, school }
}

// Public endpoint to list schools for registration
router.get('/schools', async (req, res) => {
  try {
    const prismaSchools = await listPublicSchoolsWithPrisma()
    if (prismaSchools) return res.json(prismaSchools)
    const schools = await query('SELECT id, name, school_id, address, short FROM schools WHERE archived_at IS NULL ORDER BY name ASC')
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

function passwordInput(body) {
  const password = typeof body?.password === 'string' ? body.password : ''
  const confirmation = typeof body?.password_confirmation === 'string'
    ? body.password_confirmation
    : (typeof body?.passwordConfirmation === 'string' ? body.passwordConfirmation : '')
  if (password.length < 8) return { error: 'Password must be at least 8 characters' }
  if (password !== confirmation) return { error: 'Passwords do not match' }
  return { password }
}

function publicTokenPayload(tokenRow) {
  if (!tokenRow) return null
  return {
    username: tokenRow.username,
    name: tokenRow.name,
    email: tokenRow.email,
    role: tokenRow.role,
    school_id: tokenRow.school_id,
    grade: tokenRow.grade,
    section: tokenRow.section,
    account_status: tokenRow.account_status,
    expiresAt: tokenRow.expires_at
  }
}

router.post('/invitations/inspect', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim()
    const row = await inspectAccountToken(token, ACCOUNT_TOKEN_TYPES.INVITATION)
    if (!row || row.account_status !== 'invited') return res.status(400).json({ error: 'This invitation is invalid or expired' })
    res.json({ invitation: publicTokenPayload(row) })
  } catch (err) {
    console.error('Invitation inspection error:', err.message)
    res.status(400).json({ error: 'This invitation is invalid or expired' })
  }
})

router.post('/invitations/accept', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim()
    const inspected = await inspectAccountToken(token, ACCOUNT_TOKEN_TYPES.INVITATION)
    if (!inspected || inspected.account_status !== 'invited') return res.status(400).json({ error: 'This invitation is invalid or expired' })
    const credentials = passwordInput(req.body)
    if (credentials.error) return res.status(400).json({ error: credentials.error })
    const username = String(req.body?.username || inspected.username || '').trim()
    const name = String(req.body?.name || inspected.name || '').trim()
    if (!username || !/^[A-Za-z0-9._-]{3,255}$/.test(username)) return res.status(400).json({ error: 'Username may contain only letters, numbers, dots, underscores, and hyphens' })
    if (!name) return res.status(400).json({ error: 'Name is required' })
    const duplicate = await query('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ? LIMIT 1', [username, inspected.user_id])
    if (duplicate.length) return res.status(409).json({ error: 'That username is already in use' })

    const consumed = await consumeAccountToken(token, ACCOUNT_TOKEN_TYPES.INVITATION)
    if (!consumed) return res.status(400).json({ error: 'This invitation is invalid or expired' })
    const passwordHash = await hashPassword(credentials.password)
    await run(`UPDATE users SET username = ?, name = ?, password = ?, account_status = 'active',
      password_changed_at = CURRENT_TIMESTAMP, email_verified_at = CURRENT_TIMESTAMP,
      failed_login_count = 0, locked_until = NULL WHERE id = ? AND account_status = 'invited'`,
      [username, name, passwordHash, inspected.user_id])
    saveDatabase()
    const user = (await query('SELECT * FROM users WHERE id = ?', [inspected.user_id]))[0]
    if (!user || user.account_status !== 'active') return res.status(409).json({ error: 'This invitation is no longer available' })
    const session = await createSession(user.id)
    setSessionCookie(res, session.token, session.expiresAt)
    res.status(201).json({ user: await publicUser(user), expiresAt: session.expiresAt.toISOString() })
  } catch (err) {
    console.error('Invitation acceptance error:', err.message)
    res.status(500).json({ error: 'Unable to accept invitation' })
  }
})

router.post('/password-reset/request', async (req, res) => {
  const generic = { message: 'If an account matches the supplied details, password reset instructions will be sent.' }
  try {
    const lookup = String(req.body?.email || req.body?.username || req.body?.emailOrUsername || '').trim().toLowerCase()
    if (!lookup) return res.json(generic)
    const rows = await query(
      'SELECT * FROM users WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND email IS NOT NULL AND email != "" LIMIT 1',
      [lookup, lookup]
    )
    const user = rows[0]
    if (!user || user.account_status === 'invited' || !user.email) return res.json(generic)
    const issued = await issueAccountToken({ userId: user.id, tokenType: ACCOUNT_TOKEN_TYPES.PASSWORD_RESET })
    const link = accountLink('/reset-password', issued.token)
    try {
      await sendAccountEmail({ to: user.email, subject: 'Reset your ElyTrack password', text: `Reset your ElyTrack password here: ${link}`, html: `<p>Use the link below to reset your ElyTrack password.</p><p><a href="${link}">Reset password</a></p>` })
    } catch (mailError) {
      console.error('Password reset request delivery error:', mailError.message)
    }
    return res.json(generic)
  } catch (err) {
    console.error('Password reset request error:', err.message)
    res.json(generic)
  }
})

router.post('/password-reset/inspect', async (req, res) => {
  try {
    const row = await inspectAccountToken(String(req.body?.token || '').trim(), ACCOUNT_TOKEN_TYPES.PASSWORD_RESET)
    if (!row || row.account_status === 'invited') return res.status(400).json({ error: 'This password reset link is invalid or expired' })
    res.json({ username: row.username, expiresAt: row.expires_at })
  } catch {
    res.status(400).json({ error: 'This password reset link is invalid or expired' })
  }
})

router.post('/password-reset/consume', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim()
    const inspected = await inspectAccountToken(token, ACCOUNT_TOKEN_TYPES.PASSWORD_RESET)
    if (!inspected || inspected.account_status === 'invited') return res.status(400).json({ error: 'This password reset link is invalid or expired' })
    const credentials = passwordInput(req.body)
    if (credentials.error) return res.status(400).json({ error: credentials.error })
    const consumed = await consumeAccountToken(token, ACCOUNT_TOKEN_TYPES.PASSWORD_RESET)
    if (!consumed) return res.status(400).json({ error: 'This password reset link is invalid or expired' })
    const passwordHash = await hashPassword(credentials.password)
    await run('UPDATE users SET password = ?, password_changed_at = CURRENT_TIMESTAMP, failed_login_count = 0, locked_until = NULL WHERE id = ?', [passwordHash, consumed.user_id])
    await revokeAllUserSessions(consumed.user_id)
    saveDatabase()
    res.json({ success: true })
  } catch (err) {
    console.error('Password reset completion error:', err.message)
    res.status(500).json({ error: 'Unable to reset password' })
  }
})

router.post('/email-verification/resend', async (req, res) => {
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: 'Not authenticated' })
    const user = (await query('SELECT * FROM users WHERE id = ?', [session.user.id]))[0]
    if (!user) return res.status(401).json({ error: 'Not authenticated' })
    if (!user.email) return res.status(400).json({ error: 'Add an email address before requesting verification' })
    if (user.email_verified_at) return res.json({ success: true, alreadyVerified: true })
    const issued = await issueAccountToken({ userId: user.id, tokenType: ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION })
    const link = accountLink('/verify-email', issued.token)
    await sendAccountEmail({ to: user.email, subject: 'Verify your ElyTrack email', text: `Verify your ElyTrack email here: ${link}`, html: `<p>Verify your ElyTrack email address.</p><p><a href="${link}">Verify email</a></p>` })
    res.json({ success: true, expiresAt: issued.expiresAt.toISOString() })
  } catch (err) {
    console.error('Email verification resend error:', err.message)
    res.status(503).json({ error: 'Verification email could not be delivered' })
  }
})

router.post('/email-verification/confirm', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim()
    const consumed = await consumeAccountToken(token, ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION)
    if (!consumed) return res.status(400).json({ error: 'This email verification link is invalid or expired' })
    await run('UPDATE users SET email_verified_at = CURRENT_TIMESTAMP WHERE id = ?', [consumed.user_id])
    saveDatabase()
    res.json({ success: true })
  } catch (err) {
    console.error('Email verification confirmation error:', err.message)
    res.status(500).json({ error: 'Unable to verify email' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {}
    const usernameValue = asTrimmedString(username, 'Username', { required: true, max: 255 })
    if (usernameValue.error || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: usernameValue.error || 'Password is required' })
    }
    const cleanUsername = usernameValue.value
    const users = await query('SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1', [cleanUsername])
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    const user = users[0]
    if (user.role !== 'superadmin' && user.school_id) {
      const school = await getSchoolById(user.school_id)
      if (school?.archived_at) {
        return res.status(403).json({ error: 'This school is archived. Contact the system administrator.' })
      }
    }
    const accountStatus = user.account_status || 'active'
    const lockedUntil = parseDatabaseDate(user.locked_until)

    // Automatic lockouts expire only when a subsequent login attempt arrives.
    if (accountStatus === 'locked' && lockedUntil && Number.isFinite(lockedUntil.getTime()) && lockedUntil <= new Date()) {
      await run("UPDATE users SET account_status = 'active', failed_login_count = 0, locked_until = NULL WHERE id = ?", [user.id])
      user.account_status = 'active'
      user.failed_login_count = 0
      user.locked_until = null
    }

    if (user.account_status === 'disabled' || user.account_status === 'invited' || user.account_status === 'locked') {
      return res.status(403).json({ error: 'This account is not available for sign in. Contact your school administrator.' })
    }

    if (!(await verifyPassword(password, user.password))) {
      const failedCount = (Number(user.failed_login_count) || 0) + 1
      if (failedCount >= 5) {
        const until = new Date(Date.now() + 15 * 60 * 1000)
        const lockedUntilValue = until.toISOString().slice(0, 19).replace('T', ' ')
        await run("UPDATE users SET failed_login_count = ?, account_status = 'locked', locked_until = ? WHERE id = ?", [failedCount, lockedUntilValue, user.id])
      } else {
        await run('UPDATE users SET failed_login_count = ? WHERE id = ?', [failedCount, user.id])
      }
      saveDatabase()
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // Legacy plaintext login is opt-in in local/test environments only. When it
    // is enabled, immediately replace the value with a bcrypt hash.
    const passwordHash = !isPasswordHash(user.password) ? await hashLegacyPasswordForMigration(password) : user.password
    await run('UPDATE users SET password = ?, failed_login_count = 0, locked_until = NULL, account_status = \'active\', last_login_at = CURRENT_TIMESTAMP, password_changed_at = COALESCE(password_changed_at, CURRENT_TIMESTAMP) WHERE id = ?', [passwordHash, user.id])
    user.password = passwordHash
    user.failed_login_count = 0
    user.locked_until = null
    user.account_status = 'active'
    user.last_login_at = new Date().toISOString()
    saveDatabase()

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

    const session = await createSession(user.id)
    setSessionCookie(res, session.token, session.expiresAt)
    res.json({ user: await publicUser(user), expiresAt: session.expiresAt.toISOString() })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: 'Not authenticated' })
    setSessionCookie(res, session.token, session.expiresAt)
    const user = (await query('SELECT * FROM users WHERE id = ?', [session.user.id]))[0]
    if (!user) {
      clearSessionCookie(res)
      return res.status(401).json({ error: 'Not authenticated' })
    }
    if (user.role !== 'superadmin' && user.school_id) {
      const school = await getSchoolById(user.school_id)
      if (school?.archived_at) {
        await revokeSession(req, res)
        return res.status(403).json({ error: 'This school is archived. Contact the system administrator.' })
      }
    }
    res.json({ user: await publicUser(user), expiresAt: session.expiresAt.toISOString() })
  } catch (err) {
    console.error('Session lookup error:', err.message)
    res.status(500).json({ error: 'Unable to validate session' })
  }
})

router.post('/logout', async (req, res) => {
  try {
    await revokeSession(req, res)
    res.json({ success: true })
  } catch (err) {
    console.error('Logout error:', err.message)
    clearSessionCookie(res)
    res.status(500).json({ error: 'Logout failed' })
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
    const passwordHash = await hashPassword(password)
    await run(
      'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, passwordHash, adminName, 'admin', '', '', '', schoolId]
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

// Superadmin starts impersonating another user. The authenticated server-side
// session is switched; caller-provided user IDs are not used for identity.
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
    const session = await getSession(req)
    if (session) {
      await updateSessionUser(session.sessionId, target.id, me.id)
      setSessionCookie(res, session.token, session.expiresAt)
    } else if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Not authenticated' })
    }
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

// Stop impersonating using the authenticated session's original superadmin id.
router.post('/impersonate/stop', async (req, res) => {
  try {
    const session = await getSession(req)
    const requestedId = req.body?.superadminId
    const superadminId = session?.impersonatorId || requestedId
    if (!superadminId) return res.status(400).json({ error: 'No active impersonation session' })
    const admin = (await query('SELECT * FROM users WHERE id = ?', [superadminId]))[0]
    if (!admin || admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Original superadmin session is no longer valid' })
    }
    const stopped = session?.user?.id ? (await query('SELECT * FROM users WHERE id = ?', [session.user.id]))[0] : null
    if (session) {
      await updateSessionUser(session.sessionId, admin.id, '')
      setSessionCookie(res, session.token, session.expiresAt)
    } else if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Not authenticated' })
    }
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