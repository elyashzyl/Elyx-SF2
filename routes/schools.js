import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, getSchoolById, getGradeLevels, setGradeLevels } from '../db.js'
import { requireRole, schoolToResponse, audit } from './_context.js'

const router = Router()

// List schools. Superadmin sees all; others see only their own.
router.get('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    if (me.role === 'superadmin') {
      const rows = await query('SELECT * FROM schools ORDER BY name')
      return res.json(rows.map(schoolToResponse))
    }
    const own = me.school_id ? await getSchoolById(me.school_id) : null
    return res.json(own ? [schoolToResponse(own)] : [])
  } catch (err) {
    console.error('Failed to fetch schools', err.message)
    res.status(500).json({ error: 'Failed to fetch schools' })
  }
})

// Create a school (superadmin only). Optionally seed the first admin + carry grade skeleton.
router.post('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const { name, school_id, address, short, admin } = req.body || {}
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'School name is required' })
    const id = uuidv4()
    await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)',
      [id, String(name).trim(), school_id || '', address || '', short || ''])
    // New schools start with NO grades — the school admin defines its own
    // grade levels + sections in Settings → Grade Levels & Sections.
    // Optional first school admin created together with the school
    if (admin && admin.username && admin.password && admin.name) {
      const dup = await query('SELECT id FROM users WHERE username = ?', [admin.username])
      if (dup.length > 0) {
        await run('DELETE FROM schools WHERE id = ?', [id])
        return res.status(400).json({ error: 'Username already exists' })
      }
      await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), admin.username, admin.password, admin.name, 'admin', '', '', '', id])
    }
    await audit(me, 'school.create', { type: 'school', id, name: String(name).trim(), schoolId: id }, `Registered school "${String(name).trim()}"`)
    res.json({ id, success: true })
  } catch (err) {
    console.error('Failed to create school', err.message)
    res.status(500).json({ error: 'Failed to create school' })
  }
})

// Get one school (scope-checked)
router.get('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    if (me.role !== 'superadmin' && me.school_id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const row = await getSchoolById(req.params.id)
    if (!row) return res.status(404).json({ error: 'School not found' })
    res.json(schoolToResponse(row))
  } catch (err) {
    console.error('Failed to fetch school', err.message)
    res.status(500).json({ error: 'Failed to fetch school' })
  }
})

// Update a school. Superadmin: any field. Admin: own school name/ID/address/short (no transfers).
router.put('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    if (me.role !== 'superadmin' && me.school_id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const { name, school_id, address, short } = req.body || {}
    const sets = []
    const params = []
    if (name !== undefined) { sets.push('name = ?'); params.push(String(name)) }
    if (school_id !== undefined) { sets.push('school_id = ?'); params.push(String(school_id)) }
    if (address !== undefined) { sets.push('address = ?'); params.push(String(address)) }
    if (short !== undefined) { sets.push('short = ?'); params.push(String(short)) }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
    params.push(req.params.id)
    await run(`UPDATE schools SET ${sets.join(', ')} WHERE id = ?`, params)
    const row = await getSchoolById(req.params.id)
    await audit(me, 'school.update', { type: 'school', id: req.params.id, name: row?.name || '', schoolId: req.params.id }, `Updated school "${row?.name || req.params.id}"`)
    res.json({ success: true, school: schoolToResponse(row) })
  } catch (err) {
    console.error('Failed to update school', err.message)
    res.status(500).json({ error: 'Failed to update school' })
  }
})

// Grade levels for a school. Superadmin: any school. Admin/teacher: own school.
router.get('/:id/grades', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    if (me.role !== 'superadmin' && me.school_id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const row = await getSchoolById(req.params.id)
    if (!row) return res.status(404).json({ error: 'School not found' })
    res.json(await getGradeLevels(req.params.id))
  } catch (err) {
    console.error('Failed to fetch grade levels', err.message)
    res.status(500).json({ error: 'Failed to fetch grade levels' })
  }
})

// Replace grade levels. Superadmin: any school. Admin: own school only.
router.put('/:id/grades', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    if (me.role !== 'superadmin' && me.school_id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const row = await getSchoolById(req.params.id)
    if (!row) return res.status(404).json({ error: 'School not found' })
    const { levels } = req.body || {}
    if (!Array.isArray(levels)) return res.status(400).json({ error: 'levels must be an array of {grade, sections[]}' })
    const clean = []
    const seenGrades = new Set()
    for (const l of levels) {
      const grade = String(l?.grade || '').trim()
      if (!grade || seenGrades.has(grade.toLowerCase())) continue
      seenGrades.add(grade.toLowerCase())
      const sections = [...new Set((Array.isArray(l.sections) ? l.sections : []).map(s => String(s).trim()).filter(Boolean))]
      clean.push({ grade, sections })
    }
    if (!clean.length) return res.status(400).json({ error: 'Add at least one grade level with a name' })
    await setGradeLevels(req.params.id, clean)
    await audit(me, 'grades.update', { type: 'school', id: req.params.id, name: row?.name || '', schoolId: req.params.id }, `Updated grade levels (${clean.length} grades)`)
    res.json({ success: true, levels: await getGradeLevels(req.params.id) })
  } catch (err) {
    console.error('Failed to update grade levels', err.message)
    res.status(500).json({ error: 'Failed to update grade levels' })
  }
})

// Delete a school (superadmin only). Refuse if dependent rows exist.
router.delete('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const id = req.params.id
    for (const [table, label] of [
      ['users', 'users'], ['students', 'students'],
      ['monthly_records', 'monthly records'], ['attendance_records', 'attendance records']
    ]) {
      const n = (await query(`SELECT COUNT(*) as cnt FROM "${table}" WHERE school_id = ?`, [id]))[0]?.cnt || 0
      if (n > 0) return res.status(400).json({ error: `Cannot delete: school still has ${n} ${label}. Reassign or remove them first.` })
    }
    const doomed = await getSchoolById(id)
    await run('DELETE FROM calendar_events WHERE school_id = ?', [id])
    await run('DELETE FROM quarterly_events WHERE school_id = ?', [id])
    await run('DELETE FROM grade_levels WHERE school_id = ?', [id])
    await run('DELETE FROM schools WHERE id = ?', [id])
    await audit(me, 'school.delete', { type: 'school', id, name: doomed?.name || '', schoolId: id }, `Deleted school "${doomed?.name || id}"`)
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete school', err.message)
    res.status(500).json({ error: 'Failed to delete school' })
  }
})

export default router
