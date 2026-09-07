import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { requireRole, resolveScopeSchool, assertValidClass, audit } from './_context.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    const { me, schoolId } = scope
    if (!schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const { grade, section, gender, search } = req.query
    let sql = 'SELECT * FROM students'
    const params = []
    const conditions = ['school_id = ?']
    params.push(schoolId)

    // Teachers are restricted to their advisory grade + section.
    let effGrade = grade
    let effSection = section
    if (me.role === 'teacher') {
      effGrade = me.grade
      effSection = me.section
    }
    if (me.role === 'teacher' && (!effGrade || !effSection)) {
      return res.json([])
    }

    if (effGrade) {
      conditions.push('grade = ?')
      params.push(effGrade)
    }
    if (effSection) {
      conditions.push('section LIKE ?')
      params.push(`%${effSection}%`)
    }
    if (gender) {
      conditions.push('gender = ?')
      params.push(gender)
    }
    if (search) {
      conditions.push('name LIKE ?')
      params.push(`%${search}%`)
    }

    sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY name'

    const students = await query(sql, params)
    res.json(students)
  } catch (err) {
    console.error('Failed to fetch students', err.message)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

async function duplicateNames(names, schoolId) {
  if (!names.length) return []
  const placeholders = names.map(() => 'LOWER(name) = LOWER(?)').join(' OR ')
  const existing = await query(`SELECT name FROM students WHERE school_id = ? AND (${placeholders})`, [schoolId, ...names])
  return existing.map(r => r.name.toLowerCase())
}

async function studentSchoolScope(req, res) {
  const scope = await resolveScopeSchool(req, res, req.body?.schoolId ?? req.body?.school_id ?? req.query?.schoolId)
  if (!scope) return null
  if (!scope.schoolId) { res.status(400).json({ error: 'schoolId is required' }); return null }
  return scope
}

async function assertWritable(req, res) {
  const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
  if (error) return null
  return me
}

router.post('/', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const { name, grade, section, gender } = req.body
    const trimmed = (name || '').trim()
    if (!trimmed) return res.status(400).json({ error: 'Name is required' })
    if (!grade || !section) return res.status(400).json({ error: 'grade and section are required' })
    if (!(await assertValidClass(res, scope.schoolId, grade, section))) return
    const dupes = await duplicateNames([trimmed], scope.schoolId)
    if (dupes.length) return res.status(409).json({ error: 'Student "' + trimmed + '" already exists in this school' })
    const id = uuidv4()
    await run('INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, trimmed, grade, section, gender || '', scope.schoolId])
    await audit(me, 'student.create', { type: 'student', id, name: trimmed, schoolId: scope.schoolId }, `Enrolled "${trimmed}" (${grade} - ${section})`)
    res.json({ id, name: trimmed, grade, section, gender: gender || '' })
  } catch (err) {
    console.error('Failed to create student', err.message)
    res.status(500).json({ error: 'Failed to create student' })
  }
})

router.post('/bulk', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const { names, grade, section, gender } = req.body
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'No names provided' })
    }
    if (!grade || !section) return res.status(400).json({ error: 'grade and section are required' })
    if (!(await assertValidClass(res, scope.schoolId, grade, section))) return
    const trimmed = names.map(n => (n || '').trim()).filter(Boolean)
    if (!trimmed.length) return res.status(400).json({ error: 'No valid names provided' })
    const existingLower = new Set((await duplicateNames(trimmed, scope.schoolId)).map(n => n.toLowerCase()))
    const created = []
    const skipped = []
    for (const name of trimmed) {
      if (existingLower.has(name.toLowerCase())) {
        skipped.push(name)
        continue
      }
      const id = uuidv4()
      await run('INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, grade, section, gender || '', scope.schoolId])
      created.push({ id, name, grade, section, gender: gender || '' })
    }
    if (created.length) await audit(me, 'student.bulk_create', { type: 'student', id: '', name: `${created.length} students`, schoolId: scope.schoolId }, `Bulk enrolled ${created.length} students (${grade} - ${section})`)
    res.json({ count: created.length, students: created, skipped })
  } catch (err) {
    console.error('Failed to bulk create students', err.message)
    res.status(500).json({ error: 'Failed to bulk create students' })
  }
})

async function scopedStudent(req) {
  const rows = await query('SELECT * FROM students WHERE id = ?', [req.params.id])
  return rows[0] || null
}

router.put('/:id', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const target = await scopedStudent(req)
    if (!target) return res.status(404).json({ error: 'Student not found' })
    if (me.role !== 'superadmin' && target.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const { name, grade, section, gender } = req.body
    if (grade && section && !(await assertValidClass(res, target.school_id, grade, section))) return
    await run('UPDATE students SET name=?, grade=?, section=?, gender=? WHERE id=?',
      [name, grade, section, gender || '', req.params.id])
    await audit(me, 'student.update', { type: 'student', id: req.params.id, name: name || target.name, schoolId: target.school_id || '' }, `Updated student "${target.name}"`)
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to update student', err.message)
    res.status(500).json({ error: 'Failed to update student' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const target = await scopedStudent(req)
    if (!target) return res.status(404).json({ error: 'Student not found' })
    if (me.role !== 'superadmin' && target.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const { id } = req.params
    await run('DELETE FROM attendance_entries WHERE student_id=?', [id])
    await run('DELETE FROM monthly_entries WHERE student_id=?', [id])
    await run('DELETE FROM students WHERE id=?', [id])
    await audit(me, 'student.delete', { type: 'student', id, name: target.name, schoolId: target.school_id || '' }, `Deleted student "${target.name}"`)
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete student', err.message)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

router.post('/bulk-delete', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No ids provided' })
    }
    let count = 0
    for (const id of ids) {
      const target = (await query('SELECT * FROM students WHERE id = ?', [id]))[0]
      if (!target) continue
      if (me.role !== 'superadmin' && target.school_id !== me.school_id) continue
      await run('DELETE FROM attendance_entries WHERE student_id=?', [id])
      await run('DELETE FROM monthly_entries WHERE student_id=?', [id])
      await run('DELETE FROM students WHERE id=?', [id])
      count++
    }
    if (count) await audit(me, 'student.bulk_delete', { type: 'student', id: '', name: `${count} students` }, `Bulk deleted ${count} students`)
    res.json({ count })
  } catch (err) {
    console.error('Failed to bulk delete students', err.message)
    res.status(500).json({ error: 'Failed to bulk delete students' })
  }
})

export default router
