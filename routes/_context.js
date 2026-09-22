import { query, getSchoolById, isValidClass, logAudit } from '../db.js'

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

// Resolve the acting user from body/query auth fields.
// All school-scoped endpoints accept { userId, userRole } in body or query.
export async function actingUser(req) {
  const userId = req.body?.userId ?? req.query?.userId ?? req.headers?.['x-user-id'] ?? req.body?.created_by ?? null
  const userRole = req.body?.userRole ?? req.query?.userRole ?? req.headers?.['x-user-role'] ?? null
  if (!userId) return null
  const rows = await query('SELECT id, username, name, role, grade, section, period, school_id FROM users WHERE id = ?', [userId])
  if (!rows.length) return null
  const u = rows[0]
  // Trust-but-verify: ignore caller-supplied role if it disagrees with DB
  if (userRole && userRole !== u.role) return { ...u, roleMismatch: true }
  return u
}

export async function requireRole(req, res, ...allowed) {
  const me = await actingUser(req)
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
  const me = await actingUser(req)
  if (!me) { res.status(401).json({ error: 'Not authenticated' }); return null }
  if (me.roleMismatch) { res.status(403).json({ error: 'Role mismatch — please sign in again' }); return null }
  if (me.role === 'superadmin') return me
  if (!targetSchoolId || me.school_id !== targetSchoolId) {
    res.status(403).json({ error: 'Forbidden: outside your school' })
    return null
  }
  return me
}

export function isLicenseActive(license) {
  if (!license) return false
  if (license.status === 'suspended') return false
  if (license.status === 'expired') return false
  
  const targetDate = license.status === 'trial' && license.trial_ends_at ? license.trial_ends_at : license.expires_at
  if (!targetDate) return true
  
  const expiry = new Date(targetDate)
  const now = new Date()
  expiry.setHours(23, 59, 59, 999)
  return now <= expiry
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
  const me = await actingUser(req)
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
    if (license && !isLicenseActive(license)) {
      const reason = license.status === 'suspended' ? 'suspended' : 'expired'
      res.status(402).json({
        error: `School workspace is locked. Your ElyTrack license is currently ${reason}. Please contact your administrator or deploy@elytrack.ph to restore access.`,
        licenseStatus: license.status,
        licenseLocked: true,
        schoolId: targetSchoolId
      })
      return null
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
  return { id: row.id, name: row.name, school_id: row.school_id, address: row.address, short: row.short }
}

export async function getActorSchoolRow(me) {
  if (!me?.school_id) return null
  return getSchoolById(me.school_id)
}