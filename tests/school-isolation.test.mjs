import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

// Helper: read file normalising CRLF -> LF
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8').replace(/\r\n/g, '\n')
}

// ---------------------------------------------------------------------------
// routes/_context.js — canManageUser
// ---------------------------------------------------------------------------

test('_context.js: canManageUser allows admin to manage non-superadmin same-school users', () => {
  const content = read('routes/_context.js')

  // The updated guard must block superadmin targets
  assert.ok(
    content.includes("if (targetRole === 'superadmin') return false"),
    'canManageUser should block superadmin as a target role for admins'
  )

  // The old restriction "targetRole !== 'teacher'" must be gone
  assert.ok(
    !content.includes("if (targetRole !== 'teacher') return false"),
    'canManageUser should no longer restrict admins to only managing teachers'
  )

  // School-match guard must remain
  assert.ok(
    content.includes('me.school_id === targetSchoolId'),
    'canManageUser should still enforce same-school check'
  )
})

// ---------------------------------------------------------------------------
// routes/users.js — GET / no longer leaks superadmins to school admins
// ---------------------------------------------------------------------------

test('users.js GET /: strict school_id filter with no OR clause leaking superadmins', () => {
  const content = read('routes/users.js')

  // The broken OR query must not exist
  assert.ok(
    !content.includes("school_id IS NULL OR school_id = ?") &&
    !content.includes("OR (school_id IS NULL"),
    'GET / must not contain the OR clause that leaked superadmin accounts'
  )

  // The strict replacement must be present
  assert.ok(
    content.includes("WHERE school_id = ? ORDER BY name"),
    'GET / must use a strict WHERE school_id = ? query for school-scoped requests'
  )
})

// ---------------------------------------------------------------------------
// routes/users.js — PUT /:id admin branch
// ---------------------------------------------------------------------------

test('users.js PUT /:id: admin branch checks school membership, not just teacher role', () => {
  const content = read('routes/users.js')

  // Must guard against cross-school edits
  assert.ok(
    content.includes("target.school_id !== me.school_id"),
    "PUT /:id should reject edits where target's school doesn't match actor's school"
  )

  // Must guard against promoting to / editing a superadmin
  assert.ok(
    content.includes("target.role === 'superadmin' || newRole === 'superadmin'"),
    "PUT /:id should block edits to or from superadmin role for non-superadmin actors"
  )
})

// ---------------------------------------------------------------------------
// routes/users.js — DELETE /:id no longer restricts to teachers only
// ---------------------------------------------------------------------------

test('users.js DELETE /:id: only blocks deletion of superadmins, not other roles', () => {
  const content = read('routes/users.js')

  // Old overly-restrictive guard must be gone
  assert.ok(
    !content.includes("target.role !== 'teacher' && me.role !== 'superadmin'"),
    "DELETE /:id must not block admin from deleting non-teacher accounts in their school"
  )

  // New guard: only block deleting superadmins
  assert.ok(
    content.includes("if (target.role === 'superadmin')"),
    "DELETE /:id must still block deletion of superadmin accounts"
  )
})

// ---------------------------------------------------------------------------
// routes/attendance.js — canEdit school check for admin role
// ---------------------------------------------------------------------------

test('attendance.js canEdit: admin requires same-school match, not unconditional pass', () => {
  const content = read('routes/attendance.js')

  // The old short-circuit that let any admin pass must be gone
  assert.ok(
    !content.includes("actor.role === 'superadmin' || actor.role === 'admin') return true"),
    'canEdit must not grant all admins unconditional write access'
  )

  // Admin branch must enforce school match
  assert.ok(
    content.includes("actor.role === 'admin'") &&
    content.includes("actor.school_id === record.school_id"),
    'canEdit must check school_id match for admin role'
  )
})
