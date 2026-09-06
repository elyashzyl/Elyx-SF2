import { query, getSchoolById, isValidClass, logAudit } from '../db.js'

export { logAudit }

// Convenience: log an action performed by `me` against a target.
export function audit(me, action, target = {}, detail = '') {
  if (!me) return
  logAudit({
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
export function assertValidClass(res, schoolId, grade, section) {
  if (!grade) { res.status(400).json({ error: 'grade is required' }); return false }
  if (!isValidClass(schoolId, grade, section || '')) {
    res.status(400).json({ error: `Unknown class "${grade}${section ? ' - ' + section : ''}" for this school. Check Grade Levels in Settings.` })
    return false
  }
  return true
}

// Roles in privilege order
const RANK = { superadmin: 3, admin: 2, teacher: 1 }

// Resolve the acting user from body/query auth fields.
// All school-scoped endpoints accept { userId, userRole } in body or query.
export function actingUser(req) {
  const userId = req.body?.userId ?? req.query?.userId ?? req.body?.created_by ?? null
  const userRole = req.body?.userRole ?? req.query?.userRole ?? null
  if (!userId) return null
  const rows = query('SELECT id, username, name, role, grade, section, period, school_id FROM users WHERE id = ?', [userId])
  if (!rows.length) return null
  const u = rows[0]
  // Trust-but-verify: ignore caller-supplied role if it disagrees with DB
  if (userRole && userRole !== u.role) return { ...u, roleMismatch: true }
  return u
}

export function requireRole(req, res, ...allowed) {
  const me = actingUser(req)
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
export function assertSchoolAccess(req, res, targetSchoolId) {
  const me = actingUser(req)
  if (!me) { res.status(401).json({ error: 'Not authenticated' }); return null }
  if (me.roleMismatch) { res.status(403).json({ error: 'Role mismatch — please sign in again' }); return null }
  if (me.role === 'superadmin') return me
  if (!targetSchoolId || me.school_id !== targetSchoolId) {
    res.status(403).json({ error: 'Forbidden: outside your school' })
    return null
  }
  return me
}

// Resolve which school id scopes this request:
// explicit param wins (checked against actor), else actor's own school.
export function resolveScopeSchool(req, res, explicit) {
  const me = actingUser(req)
  if (!me) { res.status(401).json({ error: 'Not authenticated' }); return null }
  if (me.roleMismatch) { res.status(403).json({ error: 'Role mismatch — please sign in again' }); return null }
  if (explicit) {
    if (me.role !== 'superadmin' && me.school_id !== explicit) {
      res.status(403).json({ error: 'Forbidden: outside your school' })
      return null
    }
    return { me, schoolId: explicit }
  }
  if (me.role === 'superadmin') {
    return { me, schoolId: null }
  }
  if (!me.school_id) { res.status(403).json({ error: 'No school assigned to this account' }); return null }
  return { me, schoolId: me.school_id }
}

export function rankOf(role) {
  return RANK[role] || 0
}

// Can actor manage (create/edit/delete) a user of targetRole in targetSchool?
// superadmin: anyone. admin: teachers within own school only.
export function canManageUser(me, targetRole, targetSchoolId) {
  if (!me) return false
  if (me.role === 'superadmin') return true
  if (me.role === 'admin') {
    if (targetRole !== 'teacher') return false
    return !!me.school_id && me.school_id === targetSchoolId
  }
  return false
}

export function schoolToResponse(row) {
  if (!row) return null
  return { id: row.id, name: row.name, school_id: row.school_id, address: row.address, short: row.short }
}

export function getActorSchoolRow(me) {
  if (!me?.school_id) return null
  return getSchoolById(me.school_id)
}
