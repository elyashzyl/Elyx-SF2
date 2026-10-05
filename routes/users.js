import { Router } from 'express'
import crypto from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { query, run, DB_MODE } from '../db.js'
import prisma from '../prisma/client.js'
import { requireRole, resolveScopeSchool, canManageUser, assertValidClass, audit, getSchoolLicense, isLicenseActive, actingUser } from './_context.js'
import { hashPassword } from '../lib/passwords.js'
import { revokeAllUserSessions } from '../lib/sessions.js'
import { ACCOUNT_TOKEN_TYPES, issueAccountToken } from '../lib/account-tokens.js'
import { accountLink, sendAccountEmail } from '../lib/mailer.js'

const router = Router()

const VALID_ROLES = ['superadmin', 'admin', 'teacher']
const VALID_ACCOUNT_STATUSES = ['active', 'invited', 'disabled', 'locked']

const MAX_AVATAR_URL_LENGTH = 2048

function isValidAvatarUrl(value) {
  if (value.length > MAX_AVATAR_URL_LENGTH) return false
  if (value.startsWith('/')) return !value.startsWith('//') && !/[\u0000-\u001f\u007f]/.test(value)
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !/[\u0000-\u001f\u007f]/.test(value)
  } catch {
    return false
  }
}

const USER_LIST_SELECT = {
  id: true,
  username: true,
  name: true,
  email: true,
  emailVerifiedAt: true,
  role: true,
  grade: true,
  section: true,
  period: true,
  schoolId: true,
  accountStatus: true,
  lastLoginAt: true,
  passwordChangedAt: true,
  lockedUntil: true,
  avatarUrl: true
}

function mapPrismaUser(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email || '',
    email_verified_at: row.emailVerifiedAt || null,
    role: row.role,
    grade: row.grade || '',
    section: row.section || '',
    period: row.period || '',
    school_id: row.schoolId || '',
    account_status: row.accountStatus || 'active',
    last_login_at: row.lastLoginAt || null,
    password_changed_at: row.passwordChangedAt || null,
    locked_until: row.lockedUntil || null,
    avatar_url: row.avatarUrl || ''
  }
}

async function listUsersWithPrisma(schoolId) {
  if (DB_MODE !== 'mysql' || !prisma) return null
  try {
    const rows = await prisma.user.findMany({
      ...(schoolId ? { where: { schoolId } } : {}),
      select: USER_LIST_SELECT,
      orderBy: { name: 'asc' }
    })
    return rows.map(mapPrismaUser)
  } catch (error) {
    console.warn('[users] Prisma list fallback:', error.message)
    return null
  }
}

async function sendVerificationEmail(userId, email, createdBy = '') {
  const issued = await issueAccountToken({ userId, tokenType: ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION, createdBy })
  const link = accountLink('/verify-email', issued.token)
  await sendAccountEmail({
    to: email,
    subject: 'Verify your ElyTrack email',
    text: `Verify your ElyTrack email here: ${link}`,
    html: `<p>Verify your ElyTrack email address.</p><p><a href="${link}">Verify email</a></p>`
  })
  return issued
}

// List users. Superadmin may filter by ?schoolId; others see own school only.
// Teachers are never allowed to list users.
router.get('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    const prismaUsers = await listUsersWithPrisma(scope.schoolId)
    const users = prismaUsers ?? (scope.schoolId
      ? await query('SELECT id, username, name, email, email_verified_at, avatar_url, role, grade, section, period, school_id, account_status, last_login_at, password_changed_at, locked_until FROM users WHERE school_id = ? ORDER BY name', [scope.schoolId])
      : await query('SELECT id, username, name, email, email_verified_at, avatar_url, role, grade, section, period, school_id, account_status, last_login_at, password_changed_at, locked_until FROM users ORDER BY name'))
    res.json(users)
  } catch (err) {
    console.error('Error listing users:', err.message)
    res.status(500).json({ error: 'Failed to list users' })
  }
})

// Notification preferences for current acting user
router.get('/me/notification-preferences', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const rows = await query(
      'SELECT email_on_inquiry_reply, email_on_announcement, email_on_status_change, in_app_notifications FROM user_notification_preferences WHERE user_id = ?',
      [me.id]
    )

    if (!rows.length) {
      return res.json({
        email_on_inquiry_reply: true,
        email_on_announcement: true,
        email_on_status_change: true,
        in_app_notifications: true
      })
    }

    res.json({
      email_on_inquiry_reply: Boolean(rows[0].email_on_inquiry_reply),
      email_on_announcement: Boolean(rows[0].email_on_announcement),
      email_on_status_change: Boolean(rows[0].email_on_status_change),
      in_app_notifications: Boolean(rows[0].in_app_notifications)
    })
  } catch (err) {
    console.error('Error fetching notification preferences:', err.message)
    res.status(500).json({ error: 'Failed to fetch notification preferences' })
  }
})

router.put('/me/notification-preferences', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const {
      email_on_inquiry_reply = true,
      email_on_announcement = true,
      email_on_status_change = true,
      in_app_notifications = true
    } = req.body || {}

    const vInquiry = email_on_inquiry_reply ? 1 : 0
    const vAnnounce = email_on_announcement ? 1 : 0
    const vStatus = email_on_status_change ? 1 : 0
    const vInApp = in_app_notifications ? 1 : 0
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    const existing = await query('SELECT user_id FROM user_notification_preferences WHERE user_id = ?', [me.id])
    if (existing.length) {
      await run(
        `UPDATE user_notification_preferences SET
          email_on_inquiry_reply = ?,
          email_on_announcement = ?,
          email_on_status_change = ?,
          in_app_notifications = ?,
          updated_at = ?
         WHERE user_id = ?`,
        [vInquiry, vAnnounce, vStatus, vInApp, now, me.id]
      )
    } else {
      await run(
        `INSERT INTO user_notification_preferences (
          user_id, email_on_inquiry_reply, email_on_announcement, email_on_status_change, in_app_notifications, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [me.id, vInquiry, vAnnounce, vStatus, vInApp, now]
      )
    }

    res.json({
      success: true,
      preferences: {
        email_on_inquiry_reply: Boolean(vInquiry),
        email_on_announcement: Boolean(vAnnounce),
        email_on_status_change: Boolean(vStatus),
        in_app_notifications: Boolean(vInApp)
      }
    })
  } catch (err) {
    console.error('Error updating notification preferences:', err.message)
    res.status(500).json({ error: 'Failed to update notification preferences' })
  }
})

router.post('/invite', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const body = req.body || {}
    const email = String(body.email || '').trim().toLowerCase()
    const username = String(body.username || '').trim()
    const name = String(body.name || '').trim()
    const role = String(body.role || '').trim().toLowerCase()
    const grade = String(body.grade || '').trim()
    const section = String(body.section || '').trim()
    const period = String(body.period || '').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'A valid email is required' })
    if (!username || !name) return res.status(400).json({ error: 'username and name are required' })
    if (!/^[A-Za-z0-9._-]{3,255}$/.test(username)) return res.status(400).json({ error: 'Username may contain only letters, numbers, dots, underscores, and hyphens' })
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' })

    const requestedSchoolId = body.schoolId || body.school_id || null
    let targetSchoolId = requestedSchoolId
    if (me.role !== 'superadmin') {
      if (requestedSchoolId && requestedSchoolId !== me.school_id) return res.status(403).json({ error: 'Forbidden: outside your school' })
      targetSchoolId = me.school_id || null
      if (!targetSchoolId) return res.status(403).json({ error: 'No school assigned to this account' })
    } else if (role !== 'superadmin' && !targetSchoolId) {
      return res.status(400).json({ error: 'schoolId is required for non-superadmin users' })
    }
    if (!canManageUser(me, role, targetSchoolId)) return res.status(403).json({ error: 'Forbidden: cannot invite this role' })
    if (targetSchoolId && !(await query('SELECT id FROM schools WHERE id = ? LIMIT 1', [targetSchoolId])).length) {
      return res.status(400).json({ error: 'School not found' })
    }
    if (role === 'teacher' && (!grade || !section)) return res.status(400).json({ error: 'Teachers need an advisory grade and section' })
    if (role === 'teacher' && !(await assertValidClass(res, targetSchoolId, grade, section))) return

    if (role === 'teacher' && targetSchoolId) {
      const license = await getSchoolLicense(targetSchoolId)
      if (license) {
        if (!isLicenseActive(license)) return res.status(403).json({ error: 'Cannot invite teacher: school license is expired or suspended.' })
        const currentTeachers = (await query('SELECT COUNT(*) as cnt FROM users WHERE school_id = ? AND role = "teacher" AND account_status != "disabled"', [targetSchoolId]))[0]?.cnt || 0
        if (currentTeachers >= license.max_teachers) return res.status(400).json({ error: `License seat limit reached (${currentTeachers}/${license.max_teachers})` })
      }
    }

    const duplicate = await query('SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1', [username, email])
    if (duplicate.length) return res.status(409).json({ error: 'Username or email is already in use' })

    const id = uuidv4()
    const unusablePassword = await hashPassword(crypto.randomBytes(32).toString('hex'))
    await run(`INSERT INTO users
      (id, username, password, name, email, role, grade, section, period, school_id, account_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'invited')`,
      [id, username, unusablePassword, name, email, role, grade, section, period, targetSchoolId || ''])
    const issued = await issueAccountToken({ userId: id, tokenType: ACCOUNT_TOKEN_TYPES.INVITATION, createdBy: me.id })
    try {
      await sendAccountEmail({
        to: email,
        subject: 'You are invited to ElyTrack',
        text: `You have been invited to ElyTrack. Complete your account setup here: ${accountLink('/accept-invitation', issued.token)}`,
        html: `<p>You have been invited to ElyTrack.</p><p><a href="${accountLink('/accept-invitation', issued.token)}">Complete your account setup</a></p>`
      })
    } catch (mailError) {
      await run('DELETE FROM account_tokens WHERE user_id = ? AND token_type = ? AND used_at IS NULL', [id, ACCOUNT_TOKEN_TYPES.INVITATION])
      await run('DELETE FROM users WHERE id = ?', [id])
      throw mailError
    }
    await audit(me, 'user.invite', { type: 'user', id, name: `${name} (${username})`, schoolId: targetSchoolId || '' }, `Invited ${role} "${username}"`)
    res.status(201).json({ success: true, id, username, name, email, role, account_status: 'invited', expiresAt: issued.expiresAt.toISOString() })
  } catch (err) {
    console.error('Error inviting user:', err.message)
    res.status(500).json({ error: 'Failed to send invitation' })
  }
})

router.post('/:id/invite/resend', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const target = (await query('SELECT * FROM users WHERE id = ?', [req.params.id]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (!canManageUser(me, target.role, target.school_id)) return res.status(403).json({ error: 'Forbidden' })
    if (target.account_status !== 'invited') return res.status(400).json({ error: 'Only invited accounts can receive an invitation resend' })
    if (!target.email) return res.status(400).json({ error: 'The account has no email address' })
    const issued = await issueAccountToken({ userId: target.id, tokenType: ACCOUNT_TOKEN_TYPES.INVITATION, createdBy: me.id })
    try {
      const link = accountLink('/accept-invitation', issued.token)
      await sendAccountEmail({ to: target.email, subject: 'Your ElyTrack invitation', text: `Complete your ElyTrack account setup here: ${link}`, html: `<p>Complete your ElyTrack account setup.</p><p><a href="${link}">Set up your account</a></p>` })
    } catch (mailError) {
      console.error('Invitation resend delivery error:', mailError.message)
      return res.status(503).json({ error: 'Invitation email could not be delivered' })
    }
    await audit(me, 'user.invite_resend', { type: 'user', id: target.id, name: `${target.name} (${target.username})`, schoolId: target.school_id || '' }, `Resent invitation to "${target.username}"`)
    res.json({ success: true, expiresAt: issued.expiresAt.toISOString() })
  } catch (err) {
    console.error('Error resending invitation:', err.message)
    res.status(500).json({ error: 'Failed to resend invitation' })
  }
})

router.post('/:id/password-reset', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const target = (await query('SELECT * FROM users WHERE id = ?', [req.params.id]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (!canManageUser(me, target.role, target.school_id)) return res.status(403).json({ error: 'Forbidden' })
    if (target.account_status === 'invited') return res.status(400).json({ error: 'Use invitation resend for invited accounts' })
    if (!target.email) return res.status(400).json({ error: 'The account has no email address' })
    const issued = await issueAccountToken({ userId: target.id, tokenType: ACCOUNT_TOKEN_TYPES.PASSWORD_RESET, createdBy: me.id })
    try {
      const link = accountLink('/reset-password', issued.token)
      await sendAccountEmail({ to: target.email, subject: 'Reset your ElyTrack password', text: `Reset your ElyTrack password here: ${link}`, html: `<p>Use the link below to reset your ElyTrack password.</p><p><a href="${link}">Reset password</a></p>` })
    } catch (mailError) {
      console.error('Password reset delivery error:', mailError.message)
      return res.status(503).json({ error: 'Password reset email could not be delivered' })
    }
    await audit(me, 'user.password_reset_request', { type: 'user', id: target.id, name: `${target.name} (${target.username})`, schoolId: target.school_id || '' }, `Requested password reset for "${target.username}"`)
    res.json({ success: true, expiresAt: issued.expiresAt.toISOString() })
  } catch (err) {
    console.error('Error creating password reset:', err.message)
    res.status(500).json({ error: 'Failed to send password reset' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const { username, password, name, role, grade, section, period } = req.body
    if (!username || !password || !name) return res.status(400).json({ error: 'username, password, and name are required' })
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' })
    const existing = await query('SELECT id FROM users WHERE username = ?', [username])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' })
    }
    // Target school: explicit schoolId (superadmin) or actor's own school
    let targetSchoolId = req.body.schoolId || req.body.school_id || null
    if (me.role !== 'superadmin') {
      targetSchoolId = me.school_id || null
      if (!targetSchoolId) return res.status(403).json({ error: 'No school assigned to this account' })
    } else if (role !== 'superadmin' && !targetSchoolId) {
      return res.status(400).json({ error: 'schoolId is required for non-superadmin users' })
    }
    if (!canManageUser(me, role, targetSchoolId)) {
      return res.status(403).json({ error: 'Forbidden: cannot create this role' })
    }
    if (role === 'teacher' && (!grade || !section)) {
      return res.status(400).json({ error: 'Teachers need an advisory grade and section' })
    }
    if (role === 'teacher' && !(await assertValidClass(res, targetSchoolId, grade, section))) return

    // License quota enforcement: check if school has reached its faculty capacity
    if (role === 'teacher' && targetSchoolId) {
      const license = await getSchoolLicense(targetSchoolId)
      if (license) {
        if (!isLicenseActive(license)) {
          return res.status(403).json({ error: 'Cannot add teacher: school license is expired or suspended.' })
        }
        const currentTeachers = (await query('SELECT COUNT(*) as cnt FROM users WHERE school_id = ? AND role = "teacher"', [targetSchoolId]))[0]?.cnt || 0
        if (currentTeachers >= license.max_teachers) {
          return res.status(400).json({
            error: `License seat limit reached (${currentTeachers}/${license.max_teachers} advisers). Review the assigned plan or contact the platform administrator.`
          })
        }
      }
    }

    const id = uuidv4()
    const passwordHash = await hashPassword(String(password))
    await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id, password_changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, username, passwordHash, name, role, grade || '', section || '', period || '', targetSchoolId || ''])
    await audit(me, 'user.create', { type: 'user', id, name: `${name} (${username})`, schoolId: targetSchoolId || '' }, `Created ${role} "${username}"`)
    res.json({ id, username, name, role })
  } catch (err) {
    console.error('Error creating user:', err.message)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })
    if (me.roleMismatch) return res.status(403).json({ error: 'Role mismatch — please sign in again' })
    const { id } = req.params
    const target = (await query('SELECT * FROM users WHERE id = ?', [id]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })

    const isSelf = me.id === target.id

    // Self-update: any authenticated user (teacher, admin, superadmin) may change
    // their own username, password, and display name.
    // They are explicitly prevented from modifying their assigned grade, section, school, or role.
    if (isSelf) {
      const { username, password, name, email, avatar_url, avatarUrl, role, grade, section, schoolId, school_id } = req.body || {}

      if (role !== undefined && role !== target.role) {
        return res.status(403).json({ error: 'You cannot change your own role' })
      }
      const requestedSchool = schoolId !== undefined ? schoolId : school_id
      if (requestedSchool !== undefined && requestedSchool !== target.school_id) {
        return res.status(403).json({ error: 'You cannot change your assigned school' })
      }
      if ((grade !== undefined && grade !== target.grade) || (section !== undefined && section !== target.section)) {
        return res.status(403).json({ error: 'You cannot change your assigned advisory grade or section' })
      }

      const newUsername = (username !== undefined ? username : target.username)?.trim()
      if (!newUsername) {
        return res.status(400).json({ error: 'Username is required' })
      }

      const dup = await query('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?', [newUsername, id])
      if (dup.length > 0) {
        return res.status(400).json({ error: 'Username already exists' })
      }

      const newName = (name !== undefined ? name : target.name)?.trim() || target.name
      const newEmail = email !== undefined ? String(email || '').trim().toLowerCase() : (target.email || '')
      if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return res.status(400).json({ error: 'A valid email is required' })
      if (newEmail) {
        const emailDup = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?', [newEmail, id])
        if (emailDup.length) return res.status(400).json({ error: 'Email already exists' })
      }
      const emailChanged = newEmail !== (target.email || '')
      const newAvatarUrl = avatarUrl !== undefined ? String(avatarUrl || '').trim() : String(avatar_url !== undefined ? avatar_url || '' : target.avatar_url || '').trim()
      if (newAvatarUrl.length > MAX_AVATAR_URL_LENGTH) return res.status(400).json({ error: `Avatar URL must be ${MAX_AVATAR_URL_LENGTH} characters or fewer` })
      if (newAvatarUrl && !isValidAvatarUrl(newAvatarUrl)) return res.status(400).json({ error: 'Avatar URL must use HTTPS or be a local relative path' })

      const sets = ['username=?', 'name=?', 'email=?', 'avatar_url=?']
      const params = [newUsername, newName, newEmail, newAvatarUrl]

      if (password && String(password).trim()) {
        sets.push('password=?', 'password_changed_at=CURRENT_TIMESTAMP')
        params.push(await hashPassword(String(password).trim()))
        await revokeAllUserSessions(id)
      }

      params.push(id)
      await run(`UPDATE users SET ${sets.join(', ')}${emailChanged ? ', email_verified_at=NULL' : ''} WHERE id=?`, params)
      if (emailChanged && newEmail) {
        try {
          await sendVerificationEmail(id, newEmail, me.id)
        } catch (mailError) {
          console.error('Email verification delivery error:', mailError.message)
        }
      }

      await audit(me, 'user.self_update', {
        type: 'user',
        id,
        name: `${newName} (${newUsername})`,
        schoolId: target.school_id || ''
      }, `User updated their credentials (username/password)`)

      return res.json({
        success: true,
        user: {
          id: target.id,
          username: newUsername,
          name: newName,
          email: newEmail,
          email_verified_at: emailChanged ? null : (target.email_verified_at || null),
          role: target.role,
          grade: target.grade,
          section: target.section,
          period: target.period,
          school_id: target.school_id,
          avatar_url: newAvatarUrl
        }
      })
    }

    // Administrative update of other user accounts (me.id !== target.id)
    if (me.role !== 'superadmin' && me.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { username, password, name, email, avatar_url, avatarUrl, role, grade, section, period, account_status } = req.body || {}
    const newRole = role || target.role
    if (!VALID_ROLES.includes(newRole)) return res.status(400).json({ error: 'Invalid role' })

    let newSchoolId = req.body.schoolId !== undefined ? req.body.schoolId : (req.body.school_id !== undefined ? req.body.school_id : target.school_id)
    if (me.role !== 'superadmin') {
      // Admin: target must be a non-superadmin in their own school; role change must stay non-superadmin
      if (!target.school_id || target.school_id !== me.school_id) {
        return res.status(403).json({ error: 'Forbidden: outside your school' })
      }
      if (target.role === 'superadmin' || newRole === 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: cannot manage superadmin' })
      }
      newSchoolId = me.school_id
    }
    if (newRole !== 'superadmin' && !newSchoolId && me.role === 'superadmin') {
      return res.status(400).json({ error: 'schoolId is required for non-superadmin users' })
    }

    const newUsername = (username !== undefined ? username : target.username)?.trim()
    if (!newUsername) return res.status(400).json({ error: 'Username is required' })
    const newEmail = email !== undefined ? String(email || '').trim().toLowerCase() : (target.email || '')
    if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return res.status(400).json({ error: 'A valid email is required' })
    if (newEmail) {
      const emailDup = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?', [newEmail, id])
      if (emailDup.length) return res.status(400).json({ error: 'Email already exists' })
    }

    const dup = await query('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?', [newUsername, id])
    if (dup.length > 0) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    if (newRole === 'teacher' && (!(grade !== undefined ? grade : target.grade) || !(section !== undefined ? section : target.section))) {
      return res.status(400).json({ error: 'Teachers need an advisory grade and section' })
    }
    if (newRole === 'teacher') {
      const effGrade = grade !== undefined ? grade : target.grade
      const effSection = section !== undefined ? section : target.section
      const effSchool = newRole === 'superadmin' ? '' : (newSchoolId || target.school_id || '')
      if (effSchool && !(await assertValidClass(res, effSchool, effGrade, effSection))) return
    }

    const emailChanged = newEmail !== (target.email || '')
    const newAvatarUrl = avatarUrl !== undefined ? String(avatarUrl || '').trim() : String(avatar_url !== undefined ? avatar_url || '' : target.avatar_url || '').trim()
    if (newAvatarUrl.length > MAX_AVATAR_URL_LENGTH) return res.status(400).json({ error: `Avatar URL must be ${MAX_AVATAR_URL_LENGTH} characters or fewer` })
    if (newAvatarUrl && !isValidAvatarUrl(newAvatarUrl)) return res.status(400).json({ error: 'Avatar URL must use HTTPS or be a local relative path' })
    const vals = {
      username: newUsername,
      name: (name !== undefined ? name : target.name)?.trim() || target.name,
      grade: grade !== undefined ? (grade || '') : (target.grade || ''),
      section: section !== undefined ? (section || '') : (target.section || ''),
      period: period !== undefined ? (period || '') : (target.period || '')
    }
    const sets = ['username=?', 'name=?', 'email=?', 'avatar_url=?', 'role=?', 'grade=?', 'section=?', 'period=?', 'school_id=?']
    const params = [vals.username, vals.name, newEmail, newAvatarUrl, newRole, vals.grade, vals.section, vals.period, newRole === 'superadmin' ? '' : (newSchoolId || '')]
    if (account_status !== undefined && VALID_ACCOUNT_STATUSES.includes(account_status) && target.id !== me.id) {
      sets.push('account_status = ?')
      params.push(account_status)
      if (account_status === 'active') {
        sets.push('locked_until = NULL', 'failed_login_count = 0')
      } else {
        await revokeAllUserSessions(id)
      }
    }
    if (password && String(password).trim()) {
      sets.push('password=?', 'password_changed_at=CURRENT_TIMESTAMP')
      params.push(await hashPassword(String(password).trim()))
      await revokeAllUserSessions(id)
    }
    params.push(id)
    await run(`UPDATE users SET ${sets.join(', ')}${emailChanged ? ', email_verified_at=NULL' : ''} WHERE id=?`, params)
    if (emailChanged && newEmail) {
      try {
        await sendVerificationEmail(id, newEmail, me.id)
      } catch (mailError) {
        console.error('Email verification delivery error:', mailError.message)
      }
    }
    await audit(me, 'user.update', { type: 'user', id, name: `${vals.username}`, schoolId: newRole === 'superadmin' ? '' : (newSchoolId || '') }, `Updated user "${target.username}"`)
    res.json({
      success: true,
      user: {
        id: target.id,
        username: vals.username,
        name: vals.name,
        email: newEmail,
        email_verified_at: emailChanged ? null : (target.email_verified_at || null),
        role: newRole,
        grade: vals.grade,
        section: vals.section,
        period: vals.period,
        school_id: newRole === 'superadmin' ? '' : (newSchoolId || ''),
        avatar_url: newAvatarUrl
      }
    })
  } catch (err) {
    console.error('Error updating user:', err.message)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Administrators can change lifecycle status only for accounts in their scope.
// Status changes revoke existing sessions so disabled or locked accounts lose
// access immediately rather than waiting for their cookie to expire.
router.patch('/:id/status', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const id = String(req.params.id || '').trim()
    const target = (await query('SELECT * FROM users WHERE id = ?', [id]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.id === me.id) return res.status(400).json({ error: 'Cannot change your own account status' })
    if (!canManageUser(me, target.role, target.school_id)) return res.status(403).json({ error: 'Forbidden' })

    const status = String(req.body?.status || '').trim().toLowerCase()
    if (!VALID_ACCOUNT_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_ACCOUNT_STATUSES.join(', ')}` })
    }

    const lockedUntil = status === 'locked' && req.body?.lockedUntil
      ? String(req.body.lockedUntil).trim()
      : null
    await run(
      'UPDATE users SET account_status = ?, locked_until = ?, failed_login_count = ? WHERE id = ?',
      [status, lockedUntil, status === 'active' ? 0 : Number(target.failed_login_count) || 0, id]
    )
    if (status !== 'active') await revokeAllUserSessions(id)
    await audit(me, 'user.status_update', {
      type: 'user', id, name: `${target.name} (${target.username})`, schoolId: target.school_id || ''
    }, `Changed account status from ${target.account_status || 'active'} to ${status}`)

    const updated = (await query('SELECT id, username, name, email, email_verified_at, role, grade, section, period, school_id, account_status, last_login_at, password_changed_at, locked_until FROM users WHERE id = ?', [id]))[0]
    res.json({ success: true, user: updated })
  } catch (err) {
    console.error('Error changing user status:', err.message)
    res.status(500).json({ error: 'Failed to change user status' })
  }
})

// Unlocks an account, clearing temporary lockout and resetting failed login attempts.
router.post('/:id/unlock', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const id = String(req.params.id || '').trim()
    const target = (await query('SELECT * FROM users WHERE id = ?', [id]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (!canManageUser(me, target.role, target.school_id)) return res.status(403).json({ error: 'Forbidden' })

    await run("UPDATE users SET account_status = 'active', locked_until = NULL, failed_login_count = 0 WHERE id = ?", [id])
    await audit(me, 'user.unlock', {
      type: 'user', id, name: `${target.name} (${target.username})`, schoolId: target.school_id || ''
    }, `Unlocked user "${target.username}" and reset login lockout`)

    const updated = (await query('SELECT id, username, name, email, email_verified_at, role, grade, section, period, school_id, account_status, last_login_at, password_changed_at, locked_until FROM users WHERE id = ?', [id]))[0]
    res.json({ success: true, user: updated })
  } catch (err) {
    console.error('Error unlocking user:', err.message)
    res.status(500).json({ error: 'Failed to unlock user' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const { id } = req.params
    const target = (await query('SELECT * FROM users WHERE id = ?', [id]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.id === me.id) return res.status(400).json({ error: 'Cannot delete your own account' })
    if (!canManageUser(me, target.role, target.school_id)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    if (target.role === 'superadmin') {
      return res.status(403).json({ error: 'Forbidden: cannot delete superadmin' })
    }
    await run('DELETE FROM users WHERE id=?', [id])
    await audit(me, 'user.delete', { type: 'user', id, name: `${target.name} (${target.username})`, schoolId: target.school_id || '' }, `Deleted ${target.role} "${target.username}"`)
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting user:', err.message)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
