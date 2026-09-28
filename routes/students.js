import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { requireRole, resolveScopeSchool, assertValidClass, audit, getSchoolLicense } from './_context.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    const { me, schoolId } = scope
    if (!schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const { grade, section, gender, search, asOf } = req.query
    const includeWithdrawn = String(req.query.includeWithdrawn || '').toLowerCase() === 'true'
    const historicalDate = asOf && validDate(asOf) ? String(asOf) : ''
    const historical = Boolean(historicalDate)
    let sql = historical
      ? `SELECT s.id, s.name, e.grade, e.section, s.gender, s.school_id, e.status AS enrollment_status
         FROM students s
         JOIN student_enrollment_events e ON e.student_id = s.id AND e.school_id = s.school_id
         WHERE s.school_id = ? AND e.effective_on <= ?
           AND NOT EXISTS (
             SELECT 1 FROM student_enrollment_events newer
             WHERE newer.student_id = e.student_id AND newer.school_id = e.school_id
               AND newer.effective_on <= ?
               AND (newer.effective_on > e.effective_on
                 OR (newer.effective_on = e.effective_on AND newer.created_at > e.created_at)
                 OR (newer.effective_on = e.effective_on AND newer.created_at = e.created_at AND newer.id > e.id))
           )`
      : 'SELECT * FROM students'
    const params = historical ? [schoolId, historicalDate, historicalDate] : [schoolId]
    const conditions = historical ? [] : ['school_id = ?']
    if (!includeWithdrawn) conditions.push(`${historical ? 'e.status' : "COALESCE(enrollment_status, 'active')"} = 'active'`)

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

    const gradeColumn = historical ? 'e.grade' : 'grade'
    const sectionColumn = historical ? 'e.section' : 'section'
    if (effGrade) {
      conditions.push(`${gradeColumn} = ?`)
      params.push(effGrade)
    }
    if (effSection) {
      conditions.push(`${sectionColumn} LIKE ?`)
      params.push(`%${effSection}%`)
    }
    if (gender) {
      conditions.push(`${historical ? 's.gender' : 'gender'} = ?`)
      params.push(gender)
    }
    if (search) {
      conditions.push(`${historical ? 's.name' : 'name'} LIKE ?`)
      params.push(`%${search}%`)
    }

    if (!historical) {
      sql += ' WHERE ' + conditions.join(' AND ')
    } else if (conditions.length) {
      sql += ' AND ' + conditions.join(' AND ')
    }
    sql += ` ORDER BY ${historical ? 's.name' : 'name'}`

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

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

function effectiveDate(value) {
  return validDate(value) ? String(value) : new Date().toISOString().slice(0, 10)
}

async function addEnrollmentEvent({ student, eventType, status, effectiveOn, grade, section, reason, actor, transferGroupId = '' }) {
  const id = uuidv4()
  await run(`INSERT INTO student_enrollment_events
    (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role, transfer_group_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, student.id, student.school_id || '', eventType, status, effectiveOn,
    grade || '', section || '', reason || '', actor?.id || '', actor?.name || '', actor?.role || '', transferGroupId
  ])
  return { id, student_id: student.id, school_id: student.school_id || '', event_type: eventType, status, effective_on: effectiveOn, grade: grade || '', section: section || '', reason: reason || '', actor_id: actor?.id || '', actor_name: actor?.name || '', actor_role: actor?.role || '', transfer_group_id: transferGroupId }
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

    const license = await getSchoolLicense(scope.schoolId)
    if (license && license.max_students > 0) {
      const currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [scope.schoolId]))[0]?.cnt || 0
      if (currentStudents >= license.max_students) {
        return res.status(400).json({
          error: `Student population limit reached (${currentStudents}/${license.max_students} students). Upgrade your license capacity to enroll more students.`
        })
      }
    }

    if (req.body.effectiveOn && !validDate(req.body.effectiveOn)) return res.status(400).json({ error: 'effectiveOn must use YYYY-MM-DD format' })
    const id = uuidv4()
    await run('INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, trimmed, grade, section, gender || '', scope.schoolId])
    const student = { id, name: trimmed, grade, section, gender: gender || '', school_id: scope.schoolId }
    await addEnrollmentEvent({ student, eventType: 'enroll', status: 'active', effectiveOn: effectiveDate(req.body.effectiveOn), grade, section, reason: String(req.body.reason || 'Initial enrollment').trim(), actor: me })
    await audit(me, 'student.create', { type: 'student', id, name: trimmed, schoolId: scope.schoolId }, `Enrolled "${trimmed}" (${grade} - ${section})`)
    res.json({ ...student, enrollment_status: 'active' })
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
    if (req.body.effectiveOn && !validDate(req.body.effectiveOn)) return res.status(400).json({ error: 'effectiveOn must use YYYY-MM-DD format' })
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
      const student = { id, name, grade, section, gender: gender || '', school_id: scope.schoolId }
      await addEnrollmentEvent({ student, eventType: 'enroll', status: 'active', effectiveOn: effectiveDate(req.body.effectiveOn), grade, section, reason: String(req.body.reason || 'Initial enrollment').trim(), actor: me })
      created.push({ ...student, enrollment_status: 'active' })
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

router.get('/:id/enrollment-history', async (req, res) => {
  try {
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const rows = await query(
      'SELECT * FROM student_enrollment_events WHERE student_id = ? AND school_id = ? ORDER BY effective_on ASC, created_at ASC, id ASC',
      [req.params.id, scope.schoolId]
    )
    if (!rows.length) {
      const student = (await query('SELECT id FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId]))[0]
      if (!student) return res.status(404).json({ error: 'Student not found' })
    }
    res.json(rows)
  } catch (err) {
    console.error('Failed to fetch enrollment history', err.message)
    res.status(500).json({ error: 'Failed to fetch enrollment history' })
  }
})

router.post('/:id/enrollment-events', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const student = (await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId]))[0]
    if (!student) return res.status(404).json({ error: 'Student not found' })

    const eventType = String(req.body.eventType || '').trim().toLowerCase()
    const allowed = new Set(['transfer', 'promote', 'withdraw', 'reenroll'])
    if (!allowed.has(eventType)) return res.status(400).json({ error: 'eventType must be transfer, promote, withdraw, or reenroll' })
    const effectiveOn = effectiveDate(req.body.effectiveOn)
    if (req.body.effectiveOn && !validDate(req.body.effectiveOn)) return res.status(400).json({ error: 'effectiveOn must use YYYY-MM-DD format' })
    const reason = String(req.body.reason || '').trim()
    if (!reason) return res.status(400).json({ error: 'A reason is required for enrollment changes' })

    const targetGrade = String(req.body.grade || '').trim()
    const targetSection = String(req.body.section || '').trim()
    if (['transfer', 'promote', 'reenroll'].includes(eventType)) {
      if (!targetGrade || !targetSection) return res.status(400).json({ error: 'grade and section are required for this enrollment event' })
      if (!(await assertValidClass(res, scope.schoolId, targetGrade, targetSection))) return
    }
    const latestEvent = (await query(`
      SELECT * FROM student_enrollment_events
      WHERE student_id = ? AND school_id = ?
      ORDER BY effective_on DESC, created_at DESC, id DESC
      LIMIT 1`, [student.id, student.school_id]))[0]
    if (latestEvent && effectiveOn < latestEvent.effective_on) {
      return res.status(409).json({ error: 'Enrollment changes must be effective on or after the latest enrollment event' })
    }
    if (latestEvent && effectiveOn === latestEvent.effective_on && latestEvent.event_type === eventType && latestEvent.grade === (targetGrade || student.grade) && latestEvent.section === (targetSection || student.section)) {
      return res.status(409).json({ error: 'An identical enrollment event already exists for this date' })
    }
    if (eventType === 'withdraw' && student.enrollment_status === 'withdrawn') {
      return res.status(409).json({ error: 'Student is already withdrawn' })
    }
    if (eventType !== 'withdraw' && student.enrollment_status !== 'active' && eventType !== 'reenroll') {
      return res.status(409).json({ error: 'Withdrawn students must be reenrolled before changing class' })
    }

    const currentGrade = targetGrade || student.grade
    const currentSection = targetSection || student.section
    const status = eventType === 'withdraw' ? 'withdrawn' : 'active'
    const event = await addEnrollmentEvent({
      student,
      eventType,
      status,
      effectiveOn,
      grade: currentGrade,
      section: currentSection,
      reason,
      actor: me,
      transferGroupId: String(req.body.transferGroupId || '')
    })
    await run('UPDATE students SET grade = ?, section = ?, enrollment_status = ? WHERE id = ?', [currentGrade, currentSection, status, student.id])
    await audit(me, `student.${eventType}`, { type: 'student', id: student.id, name: student.name, schoolId: student.school_id || '' }, `${eventType} for "${student.name}" effective ${effectiveOn}: ${reason}`)
    const updated = (await query('SELECT * FROM students WHERE id = ?', [student.id]))[0]
    res.status(201).json({ event, student: updated, currentEnrollment: event })
  } catch (err) {
    console.error('Failed to create enrollment event', err.message)
    res.status(500).json({ error: 'Failed to create enrollment event' })
  }
})

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
    if (grade !== undefined || section !== undefined) {
      return res.status(400).json({ error: 'Use an enrollment event to change a student grade or section' })
    }
    await run('UPDATE students SET name=?, gender=? WHERE id=?',
      [name === undefined ? target.name : String(name).trim(), gender === undefined ? target.gender || '' : gender, req.params.id])
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
    if (target.enrollment_status === 'withdrawn') return res.status(409).json({ error: 'Student is already withdrawn' })
    const requestedDate = req.body?.effectiveOn || req.query?.effectiveOn
    if (requestedDate && !validDate(requestedDate)) return res.status(400).json({ error: 'effectiveOn must use YYYY-MM-DD format' })
    const reason = String(req.body?.reason || req.query?.reason || 'Removed from the active roster').trim()
    const effectiveOn = effectiveDate(requestedDate)
    const event = await addEnrollmentEvent({ student: target, eventType: 'withdraw', status: 'withdrawn', effectiveOn, grade: target.grade, section: target.section, reason, actor: me })
    await run("UPDATE students SET enrollment_status = 'withdrawn' WHERE id = ?", [target.id])
    await audit(me, 'student.withdraw', { type: 'student', id: target.id, name: target.name, schoolId: target.school_id || '' }, `Withdrawn "${target.name}" effective ${effectiveOn}: ${reason}`)
    res.json({ success: true, event })
  } catch (err) {
    console.error('Failed to withdraw student', err.message)
    res.status(500).json({ error: 'Failed to withdraw student' })
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
      if (target.enrollment_status === 'withdrawn') continue
      await addEnrollmentEvent({ student: target, eventType: 'withdraw', status: 'withdrawn', effectiveOn: effectiveDate(req.body.effectiveOn), grade: target.grade, section: target.section, reason: String(req.body.reason || 'Removed from the active roster').trim(), actor: me })
      await run("UPDATE students SET enrollment_status = 'withdrawn' WHERE id = ?", [id])
      count++
    }
    if (count) await audit(me, 'student.bulk_withdraw', { type: 'student', id: '', name: `${count} students`, schoolId: me.school_id || '' }, `Bulk withdrew ${count} students`)
    res.json({ count })
  } catch (err) {
    console.error('Failed to bulk delete students', err.message)
    res.status(500).json({ error: 'Failed to bulk delete students' })
  }
})

export default router
