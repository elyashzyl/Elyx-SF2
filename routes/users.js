import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { requireRole, resolveScopeSchool, canManageUser, assertValidClass, audit } from './_context.js'

const router = Router()

const VALID_ROLES = ['superadmin', 'admin', 'teacher']

// List users. Superadmin may filter by ?schoolId; others see own school only.
// Teachers are never allowed to list users.
router.get('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    const users = scope.schoolId
      ? await query('SELECT id, username, name, role, grade, section, period, school_id FROM users WHERE school_id = ? OR (school_id IS NULL OR school_id = ?) AND role = ? ORDER BY name', [scope.schoolId, '', 'superadmin'])
      : await query('SELECT id, username, name, role, grade, section, period, school_id FROM users ORDER BY name')
    res.json(users)
  } catch (err) {
    console.error('Error listing users:', err.message)
    res.status(500).json({ error: 'Failed to list users' })
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
    const id = uuidv4()
    await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, password, name, role, grade || '', section || '', period || '', targetSchoolId || ''])
    await audit(me, 'user.create', { type: 'user', id, name: `${name} (${username})`, schoolId: targetSchoolId || '' }, `Created ${role} "${username}"`)
    res.json({ id, username, name, role })
  } catch (err) {
    console.error('Error creating user:', err.message)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const { id } = req.params
    const target = (await query('SELECT * FROM users WHERE id = ?', [id]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })
    // Actor must be able to manage the target's current role/school and the new role/school
    const { username, password, name, role, grade, section, period } = req.body
    const newRole = role || target.role
    if (!VALID_ROLES.includes(newRole)) return res.status(400).json({ error: 'Invalid role' })
    let newSchoolId = req.body.schoolId !== undefined ? req.body.schoolId : (req.body.school_id !== undefined ? req.body.school_id : target.school_id)
    if (me.role !== 'superadmin') {
      // Admins: target must be a teacher in their school; edits stay within their school
      if (!canManageUser(me, target.role, target.school_id) || !canManageUser(me, newRole, me.school_id)) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      newSchoolId = me.school_id
    }
    if (newRole !== 'superadmin' && !newSchoolId && me.role === 'superadmin') {
      return res.status(400).json({ error: 'schoolId is required for non-superadmin users' })
    }
    const dup = await query('SELECT id FROM users WHERE username = ? AND id != ?', [username || target.username, id])
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
    const vals = {
      username: username !== undefined ? username : target.username,
      name: name !== undefined ? name : target.name,
      grade: grade !== undefined ? (grade || '') : (target.grade || ''),
      section: section !== undefined ? (section || '') : (target.section || ''),
      period: period !== undefined ? (period || '') : (target.period || '')
    }
    const sets = ['username=?', 'name=?', 'role=?', 'grade=?', 'section=?', 'period=?', 'school_id=?']
    const params = [vals.username, vals.name, newRole, vals.grade, vals.section, vals.period, newRole === 'superadmin' ? '' : (newSchoolId || '')]
    if (password) { sets.push('password=?'); params.push(password) }
    params.push(id)
    await run(`UPDATE users SET ${sets.join(', ')} WHERE id=?`, params)
    await audit(me, 'user.update', { type: 'user', id, name: `${vals.username}`, schoolId: newRole === 'superadmin' ? '' : (newSchoolId || '') }, `Updated user "${target.username}"`)
    res.json({ success: true })
  } catch (err) {
    console.error('Error updating user:', err.message)
    res.status(500).json({ error: 'Failed to update user' })
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
    if (target.role !== 'teacher' && me.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can delete admins' })
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
