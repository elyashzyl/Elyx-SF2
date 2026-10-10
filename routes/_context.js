import { query, getSchoolById, isValidClass, logAudit } from '../db.js'
import { getSession, setSessionCookie, legacyAuthAllowed } from '../lib/sessions.js'

export { logAudit }

// Convenience: log an action performed by `me` against a target.
export async function audit(me, action, target = {}, detail = '') {
  if (!me) return
  await logAudit({
    actor_id: me.id || '', actor_name: me.name || '', actor_role: me.role || '',
    actor_school_id: me.school_id || '',
    action,
    target_type: target.type || '', target_id: target.id || '',
    target_name: target.name || '', target_school_id: target.schoolId || '',
    detail
  })
}

// Reject unknown grade/section combos for a school. Returns true when OK,
// otherwise sends a 400 and returns false.
export async function assertValidClass(res, schoolId, grade, section) {
  if (!grade) { res.status(400).json({ error: 'grade is required' }); return false }
  if (!await isValidClass(schoolId, grade, section || '')) {
    res.status(400).json({ error: `Unknown class "${grade}${section ? ' - ' + section : ''}" for this school. Check Grade Levels in Settings.` })
    return false
  }
  return true
}

// Roles in privilege order
const RANK = { superadmin: 3, admin: 2, teacher: 1 }

// Resolve the acting user from the server-side session. Caller-provided identity
// fields remain accepted only outside production while existing integration tests
// and local development migrate to cookies.
export async function actingUser(req, res = req.res || null) {
  const session = await getSession(req)
  if (session) {
    if (res) setSessionCookie(res, session.token, session.expiresAt)
    req.user = session.user
    return session.user
  }
  if (!legacyAuthAllowed()) return null

  const userId = req.body?.userId ?? req.query?.userId ?? req.headers?.['x-user-id'] ?? req.body?.created_by ?? null
  const userRole = req.body?.userRole ?? req.query?.userRole ?? req.headers?.['x-user-role'] ?? null
  if (!userId) return null
  const rows = await query('SELECT id, username, name, role, grade, section, period, school_id FROM users WHERE id = ?', [userId])
  if (!rows.length) return null
  const u = rows[0]
  if (u.role !== 'superadmin' && u.school_id) {
    const school = await getSchoolById(u.school_id)
    if (school?.archived_at) return null
  }
  if (userRole && userRole !== u.role) {
    req.user = { ...u, roleMismatch: true }
    return req.user
  }
  req.user = u
  return u
}

export async function requireRole(req, res, ...allowed) {
  const me = await actingUser(req, res)
  if (!me) return { error: res.status(401).json({ error: 'Not authenticated' }) }
  if (me.roleMismatch) return { error: res.status(403).json({ error: 'Role mismatch — please sign in again' }) }
  if (!allowed.includes(me.role)) return { error: res.status(403).json({ error: 'Forbidden' }) }
  return { me }
}

// School the acting user belongs to (null = no school / superadmin-global until one is picked)
export function actorSchoolId(me) {
  if (!me) return null
  if (me.role === 'superadmin') return me.school_id || null
  return me.school_id || null
}

// Enforce that a target school id is visible to the actor.
// Superadmin sees all; admin/teacher are confined to their own school.
export async function assertSchoolAccess(req, res, targetSchoolId) {
  const me = await actingUser(req, res)
  if (!me) { res.status(401).json({ error: 'Not authenticated' }); return null }
  if (me.roleMismatch) { res.status(403).json({ error: 'Role mismatch — please sign in again' }); return null }
  if (me.role === 'superadmin') return me
  if (!targetSchoolId || me.school_id !== targetSchoolId) {
    res.status(403).json({ error: 'Forbidden: outside your school' })
    return null
  }
  return me
}

export function getLicenseGracePeriodState(license) {
  if (!license) {
    return { active: false, expired: true, inGracePeriod: false, graceDaysRemaining: 0, hardLockout: true, reason: 'none' }
  }
  if (license.status === 'suspended' || license.status === 'cancelled') {
    return { active: false, expired: license.status === 'cancelled', inGracePeriod: false, graceDaysRemaining: 0, hardLockout: true, reason: license.status }
  }

  const targetDate = license.status === 'trial' && license.trial_ends_at ? license.trial_ends_at : license.expires_at
  if (!targetDate) {
    return { active: true, expired: false, inGracePeriod: false, graceDaysRemaining: 0, hardLockout: false }
  }

  const expiry = new Date(targetDate)
  expiry.setHours(23, 59, 59, 999)
  const now = new Date()

  if (now <= expiry) {
    return { active: true, expired: false, inGracePeriod: false, graceDaysRemaining: 0, hardLockout: false }
  }

  // Target expiry has passed -> evaluate configured grace period
  const graceDays = Number.isInteger(Number(license.grace_period_days)) && Number(license.grace_period_days) >= 0
    ? Number(license.grace_period_days)
    : 5

  const graceEnd = new Date(expiry)
  graceEnd.setDate(graceEnd.getDate() + graceDays)

  if (now <= graceEnd) {
    const msRemaining = graceEnd.getTime() - now.getTime()
    const graceDaysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
    return { active: false, expired: true, inGracePeriod: true, graceDaysRemaining, hardLockout: false, reason: 'grace_period' }
  }

  return { active: false, expired: true, inGracePeriod: false, graceDaysRemaining: 0, hardLockout: true, reason: 'expired' }
}

export function isLicenseActive(license) {
  if (!license) return false
  if (license.status === 'suspended' || license.status === 'cancelled') return false
  const state = getLicenseGracePeriodState(license)
  return !state.hardLockout
}

export async function getSchoolLicense(schoolId) {
  if (!schoolId) return null
  const rows = await query('SELECT * FROM licenses WHERE school_id = ? ORDER BY issued_at DESC LIMIT 1', [schoolId])
  return rows[0] || null
}

// Resolve which school id scopes this request:
// explicit param wins (checked against actor), else actor's own school.
// Options: { checkLicense: true (default) }
export async function resolveScopeSchool(req, res, explicit, options = { checkLicense: true }) {
  const me = await actingUser(req, res)
  if (!me) { res.status(401).json({ error: 'Not authenticated' }); return null }
  if (me.roleMismatch) { res.status(403).json({ error: 'Role mismatch — please sign in again' }); return null }
  
  let targetSchoolId = null
  if (explicit) {
    if (me.role !== 'superadmin' && me.school_id !== explicit) {
      res.status(403).json({ error: 'Forbidden: outside your school' })
      return null
    }
    targetSchoolId = explicit
  } else if (me.role === 'superadmin') {
    targetSchoolId = null
  } else {
    if (!me.school_id) { res.status(403).json({ error: 'No school assigned to this account' }); return null }
    targetSchoolId = me.school_id
  }

  // Enforce license check for non-superadmin users if checkLicense is true
  if (options.checkLicense !== false && me.role !== 'superadmin' && targetSchoolId) {
    const license = await getSchoolLicense(targetSchoolId)
    if (license) {
      const graceState = getLicenseGracePeriodState(license)
      if (graceState.hardLockout) {
        const reason = graceState.reason || (license.status === 'suspended' ? 'suspended' : 'expired')
        res.status(402).json({
          error: `School workspace is locked. Your ElyTrack license is currently ${reason}. Please contact your administrator or ely.ashzyl@gmail.com to restore access.`,
          licenseStatus: license.status,
          licenseLocked: true,
          schoolId: targetSchoolId
        })
        return null
      }

      if (graceState.inGracePeriod) {
        res.setHeader('X-License-Grace-Period', '1')
        res.setHeader('X-License-Grace-Days', String(graceState.graceDaysRemaining))
        const method = (req.method || 'GET').toUpperCase()
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          res.status(402).json({
            error: `School workspace is in a ${license.grace_period_days || 5}-day grace period (${graceState.graceDaysRemaining} day${graceState.graceDaysRemaining === 1 ? '' : 's'} remaining). Access is read-only. Please submit a renewal payment to restore full write operations.`,
            inGracePeriod: true,
            graceDaysRemaining: graceState.graceDaysRemaining,
            readOnly: true,
            licenseStatus: 'grace_period',
            schoolId: targetSchoolId
          })
          return null
        }
      }
    }
  }

  return { me, schoolId: targetSchoolId }
}

export function rankOf(role) {
  return RANK[role] || 0
}

// Can actor manage (create/edit/delete) a user of targetRole in targetSchool?
// superadmin: anyone. admin: any non-superadmin within their own school only.
export function canManageUser(me, targetRole, targetSchoolId) {
  if (!me) return false
  if (me.role === 'superadmin') return true
  if (me.role === 'admin') {
    if (targetRole === 'superadmin') return false   // never touch superadmins
    return !!me.school_id && me.school_id === targetSchoolId
  }
  return false
}

export function schoolToResponse(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    school_id: row.school_id,
    address: row.address,
    short: row.short,
    attendance_lock_cutoff: row.attendance_lock_cutoff || '',
    contact_email: row.contact_email || '',
    contact_phone: row.contact_phone || '',
    division: row.division || '',
    district: row.district || '',
    principal_name: row.principal_name || '',
    school_year: row.school_year || '',
    grading_period: row.grading_period || '',
    logo_url: row.logo_url || '',
    quarter_count: Number(row.quarter_count ?? 4) === 3 ? 3 : 4,
    archived_at: row.archived_at || null,
    archived_by: row.archived_by || '',
    archive_reason: row.archive_reason || '',
    sardo_consecutive_absences: Number(row.sardo_consecutive_absences ?? 3),
    sardo_cumulative_absences: Number(row.sardo_cumulative_absences ?? 5)
  }
}

export async function getActorSchoolRow(me) {
  if (!me?.school_id) return null
  return getSchoolById(me.school_id)
}