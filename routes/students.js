import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, DB_MODE, withTransaction, isValidClass } from '../db.js'
import { requireRole, resolveScopeSchool, assertValidClass, audit, getSchoolLicense } from './_context.js'
import { asTrimmedString } from '../lib/validation.js'

const router = Router()

let enrollmentColumnEnsured = false
async function ensureEnrollmentStatusColumn() {
  if (enrollmentColumnEnsured) return
  try {
    const isMysql = DB_MODE === 'mysql'
    if (isMysql) {
      await run("ALTER TABLE students ADD COLUMN enrollment_status VARCHAR(32) NOT NULL DEFAULT 'active'")
    } else {
      await run("ALTER TABLE students ADD COLUMN enrollment_status TEXT NOT NULL DEFAULT 'active'")
    }
  } catch (err) {
    if (!/duplicate|exists|ER_DUP_FIELDNAME/i.test(String(err.message || err.code || ''))) {
      // non-fatal
    }
  }
  try {
    const isMysql = DB_MODE === 'mysql'
    await run(isMysql
      ? `CREATE TABLE IF NOT EXISTS student_enrollment_events (
          id VARCHAR(96) PRIMARY KEY,
          student_id VARCHAR(96) NOT NULL,
          school_id VARCHAR(96) NOT NULL,
          event_type VARCHAR(32) NOT NULL,
          status VARCHAR(32) NOT NULL,
          effective_on VARCHAR(10) NOT NULL,
          grade VARCHAR(255) NOT NULL DEFAULT '',
          section VARCHAR(255) NOT NULL DEFAULT '',
          reason VARCHAR(1000) NOT NULL DEFAULT '',
          actor_id VARCHAR(96) NOT NULL DEFAULT '',
          actor_name VARCHAR(255) NOT NULL DEFAULT '',
          actor_role VARCHAR(32) NOT NULL DEFAULT '',
          transfer_group_id VARCHAR(96) NOT NULL DEFAULT '',
          event_sequence BIGINT NOT NULL DEFAULT 0,
          created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      : `CREATE TABLE IF NOT EXISTS student_enrollment_events (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          school_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          status TEXT NOT NULL,
          effective_on TEXT NOT NULL,
          grade TEXT NOT NULL DEFAULT '',
          section TEXT NOT NULL DEFAULT '',
          reason TEXT NOT NULL DEFAULT '',
          actor_id TEXT NOT NULL DEFAULT '',
          actor_name TEXT NOT NULL DEFAULT '',
          actor_role TEXT NOT NULL DEFAULT '',
          transfer_group_id TEXT NOT NULL DEFAULT '',
          event_sequence INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
        )`)
  } catch (err) {
    if (!/duplicate|exists/i.test(String(err.message || err.code || ''))) {
      // non-fatal
    }
  }
  try {
    await run(DB_MODE === 'mysql'
      ? 'ALTER TABLE student_enrollment_events ADD COLUMN event_sequence BIGINT NOT NULL DEFAULT 0'
      : 'ALTER TABLE student_enrollment_events ADD COLUMN event_sequence INTEGER NOT NULL DEFAULT 0')
  } catch (err) {
    if (!/duplicate|exists/i.test(String(err.message || err.code || ''))) {
      // non-fatal
    }
  }
  try {
    await run("UPDATE students SET enrollment_status = 'active' WHERE enrollment_status IS NULL OR enrollment_status = ''")
  } catch {}
  try {
    const missingEvents = await query(`
      SELECT s.id, s.grade, s.section, s.school_id, s.enrollment_status,
             COALESCE(MIN(ar.date), '2000-01-01') AS earliest_date
      FROM students s
      LEFT JOIN student_enrollment_events e ON e.student_id = s.id
      LEFT JOIN attendance_entries ae ON ae.student_id = s.id
      LEFT JOIN attendance_records ar ON ar.id = ae.record_id
      WHERE e.id IS NULL
      GROUP BY s.id, s.grade, s.section, s.school_id, s.enrollment_status
    `)
    for (const s of missingEvents) {
      const isWithdrawn = s.enrollment_status === 'withdrawn'
      await run(`INSERT INTO student_enrollment_events
        (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role, event_sequence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '', 1)`, [
        uuidv4(),
        s.id,
        s.school_id || '',
        isWithdrawn ? 'withdraw' : 'enroll',
        isWithdrawn ? 'withdrawn' : 'active',
        s.earliest_date || '2000-01-01',
        s.grade || '',
        s.section || '',
        'Baseline enrollment baseline'
      ])
    }
  } catch {}
  enrollmentColumnEnsured = true
}

router.get('/', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    const { me, schoolId } = scope
    if (!schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const { grade, section, gender, search, asOf } = req.query
    const includeWithdrawn = String(req.query.includeWithdrawn || '').toLowerCase() === 'true'
    const historicalDate = asOf && validDate(asOf) ? String(asOf) : ''
    const historical = Boolean(historicalDate)
    let sql = historical
      ? `SELECT s.*, e.grade, e.section, e.school_id, e.status AS enrollment_status
         FROM student_enrollment_events e
         JOIN students s ON s.id = e.student_id
         WHERE e.school_id = ? AND e.effective_on <= ?
           AND NOT EXISTS (
             SELECT 1 FROM student_enrollment_events newer
             WHERE newer.student_id = e.student_id AND newer.school_id = e.school_id
               AND newer.effective_on <= ?
               AND (newer.effective_on > e.effective_on
                 OR (newer.effective_on = e.effective_on AND newer.event_sequence > e.event_sequence)
                 OR (newer.effective_on = e.effective_on AND newer.event_sequence = e.event_sequence AND newer.created_at > e.created_at)
                 OR (newer.effective_on = e.effective_on AND newer.event_sequence = e.event_sequence AND newer.created_at = e.created_at AND newer.id > e.id))
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

    let students = []
    try {
      students = await query(sql, params)
    } catch (err) {
      if (/unknown column 'enrollment_status'/i.test(String(err.message || ''))) {
        const fallbackConditions = conditions.filter(c => !c.includes('enrollment_status'))
        let fallbackSql = 'SELECT * FROM students'
        if (fallbackConditions.length) fallbackSql += ' WHERE ' + fallbackConditions.join(' AND ')
        fallbackSql += ' ORDER BY name'
        students = await query(fallbackSql, params)
      } else {
        throw err
      }
    }
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

async function addEnrollmentEvent({ student, eventType, status, effectiveOn, grade, section, reason, actor, transferGroupId = '', tx = null }) {
  const runner = tx || { query, run }
  const id = uuidv4()
  const sequenceRows = await runner.query(
    'SELECT COALESCE(MAX(event_sequence), 0) AS latest_sequence FROM student_enrollment_events WHERE student_id = ? AND school_id = ?',
    [student.id, student.school_id || '']
  )
  const eventSequence = Number(sequenceRows[0]?.latest_sequence || 0) + 1
  const createdAt = new Date().toISOString().replace('T', ' ').replace('Z', '')
  await runner.run(`INSERT INTO student_enrollment_events
    (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role, transfer_group_id, event_sequence, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, student.id, student.school_id || '', eventType, status, effectiveOn,
    grade || '', section || '', reason || '', actor?.id || '', actor?.name || '', actor?.role || '', transferGroupId, eventSequence, createdAt
  ])
  return { id, student_id: student.id, school_id: student.school_id || '', event_type: eventType, status, effective_on: effectiveOn, grade: grade || '', section: section || '', reason: reason || '', actor_id: actor?.id || '', actor_name: actor?.name || '', actor_role: actor?.role || '', transfer_group_id: transferGroupId, event_sequence: eventSequence }
}

router.post('/', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const { name, grade, section, gender, lrn, birth_date, address, guardian_name, guardian_relationship, guardian_contact, emergency_contact_name, emergency_contact_number, consent_data_sharing, consent_medical_emergency } = req.body
    const nameValue = asTrimmedString(name, 'Name', { required: true, max: 255 })
    if (nameValue.error) return res.status(400).json({ error: nameValue.error })
    const trimmed = nameValue.value
    if (!grade || !section) return res.status(400).json({ error: 'grade and section are required' })
    if (!(await assertValidClass(res, scope.schoolId, grade, section))) return
    const dupes = await duplicateNames([trimmed], scope.schoolId)
    if (dupes.length) return res.status(409).json({ error: 'Student "' + trimmed + '" already exists in this school' })

    const cleanLrn = String(lrn || '').trim()
    if (cleanLrn) {
      const lrnDupes = await query('SELECT id, name FROM students WHERE school_id = ? AND lrn = ?', [scope.schoolId, cleanLrn])
      if (lrnDupes.length) {
        return res.status(409).json({ error: `Student with LRN "${cleanLrn}" already exists (${lrnDupes[0].name})` })
      }
    }

    const license = await getSchoolLicense(scope.schoolId)
    if (license && license.max_students > 0) {
      let currentStudents = 0
      try {
        currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [scope.schoolId]))[0]?.cnt || 0
      } catch {
        currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ?", [scope.schoolId]))[0]?.cnt || 0
      }
      if (currentStudents >= license.max_students) {
        return res.status(400).json({
          error: `Student population limit reached (${currentStudents}/${license.max_students} students). Upgrade your license capacity to enroll more students.`
        })
      }
    }

    if (req.body.effectiveOn && !validDate(req.body.effectiveOn)) return res.status(400).json({ error: 'effectiveOn must use YYYY-MM-DD format' })
    const id = uuidv4()
    const birthDate = String(birth_date || '').trim()
    const addr = String(address || '').trim()
    const gName = String(guardian_name || '').trim()
    const gRel = String(guardian_relationship || '').trim()
    const gContact = String(guardian_contact || '').trim()
    const emName = String(emergency_contact_name || '').trim()
    const emNum = String(emergency_contact_number || '').trim()
    const cDataSharing = consent_data_sharing !== undefined ? (consent_data_sharing ? 1 : 0) : 1
    const cMedEmergency = consent_medical_emergency !== undefined ? (consent_medical_emergency ? 1 : 0) : 1

    let student
    await withTransaction(async (tx) => {
      try {
        await tx.run(`INSERT INTO students
          (id, name, grade, section, gender, school_id, lrn, birth_date, address, guardian_name, guardian_relationship, guardian_contact, emergency_contact_name, emergency_contact_number, consent_data_sharing, consent_medical_emergency)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, trimmed, grade, section, gender || '', scope.schoolId, cleanLrn, birthDate, addr, gName, gRel, gContact, emName, emNum, cDataSharing, cMedEmergency])
      } catch {
        await tx.run('INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
          [id, trimmed, grade, section, gender || '', scope.schoolId])
      }
      student = {
        id, name: trimmed, grade, section, gender: gender || '', school_id: scope.schoolId,
        lrn: cleanLrn, birth_date: birthDate, address: addr, guardian_name: gName, guardian_relationship: gRel,
        guardian_contact: gContact, emergency_contact_name: emName, emergency_contact_number: emNum,
        consent_data_sharing: cDataSharing, consent_medical_emergency: cMedEmergency
      }
      await addEnrollmentEvent({
        student,
        eventType: 'enroll',
        status: 'active',
        effectiveOn: effectiveDate(req.body.effectiveOn),
        grade,
        section,
        reason: String(req.body.reason || 'Initial enrollment').trim(),
        actor: me,
        tx
      })
    })
    await audit(me, 'student.create', { type: 'student', id, name: trimmed, schoolId: scope.schoolId }, `Enrolled "${trimmed}" (${grade} - ${section})`)
    res.json({ ...student, enrollment_status: 'active' })
  } catch (err) {
    console.error('Failed to create student', err.message)
    res.status(500).json({ error: 'Failed to create student' })
  }
})

router.post('/bulk', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
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

function normalizeGender(val) {
  const s = String(val || '').trim().toLowerCase()
  if (['m', 'male', 'boy', 'lalaki'].includes(s)) return 'Male'
  if (['f', 'female', 'girl', 'babae'].includes(s)) return 'Female'
  return ''
}

function formatStudentName(row) {
  if (row.name && String(row.name).trim()) {
    return String(row.name).trim()
  }
  const last = String(row.lastName || row.last_name || '').trim()
  const first = String(row.firstName || row.first_name || '').trim()
  const middle = String(row.middleName || row.middle_name || '').trim()
  if (last && first) {
    return `${last}, ${first}${middle ? ' ' + middle : ''}`
  }
  return first || last || ''
}

router.post('/bulk-validate', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return

    const rows = Array.isArray(req.body.rows) ? req.body.rows : []
    if (!rows.length) return res.status(400).json({ error: 'No student rows provided for validation' })

    const license = await getSchoolLicense(scope.schoolId)
    let currentStudents = 0
    try {
      currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [scope.schoolId]))[0]?.cnt || 0
    } catch {
      currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ?", [scope.schoolId]))[0]?.cnt || 0
    }

    const existingRows = await query('SELECT name, grade, section FROM students WHERE school_id = ?', [scope.schoolId])
    const existingMap = new Set(existingRows.map(r => `${(r.name || '').trim().toLowerCase()}__${(r.grade || '').trim().toLowerCase()}__${(r.section || '').trim().toLowerCase()}`))
    let existingLrnMap = new Map()
    try {
      const existingLrnRows = await query('SELECT lrn, name FROM students WHERE school_id = ? AND lrn != ""', [scope.schoolId])
      existingLrnMap = new Map(existingLrnRows.map(r => [r.lrn, r.name]))
    } catch {}
    const batchLrnSet = new Set()

    const valid = []
    const duplicates = []
    const errors = []

    rows.forEach((raw, idx) => {
      const rowNum = idx + 1
      const name = formatStudentName(raw)
      const grade = String(raw.grade || req.body.defaultGrade || '').trim()
      const section = String(raw.section || req.body.defaultSection || '').trim()
      const gender = normalizeGender(raw.gender || raw.sex)
      const lrn = String(raw.lrn || raw.LRN || '').trim()
      const guardianName = String(raw.guardian_name || raw.guardianName || raw.guardian || '').trim()
      const guardianContact = String(raw.guardian_contact || raw.guardianContact || raw.contact || '').trim()
      const emergencyContactName = String(raw.emergency_contact_name || raw.emergencyContactName || '').trim()
      const emergencyContactNumber = String(raw.emergency_contact_number || raw.emergencyContactNumber || '').trim()

      if (!name) {
        errors.push({ rowNumber: rowNum, raw, error: 'Learner name is required' })
        return
      }
      if (name.length > 255) {
        errors.push({ rowNumber: rowNum, raw, error: 'Learner name exceeds 255 characters' })
        return
      }
      if (!grade) {
        errors.push({ rowNumber: rowNum, raw, error: 'Grade level is required' })
        return
      }
      if (!section) {
        errors.push({ rowNumber: rowNum, raw, error: 'Section is required' })
        return
      }

      const dupKey = `${name.toLowerCase()}__${grade.toLowerCase()}__${section.toLowerCase()}`
      const studentObj = {
        rowNumber: rowNum,
        name,
        grade,
        section,
        gender: gender || 'Male',
        lrn,
        guardian_name: guardianName,
        guardian_contact: guardianContact,
        emergency_contact_name: emergencyContactName,
        emergency_contact_number: emergencyContactNumber
      }

      if (lrn && batchLrnSet.has(lrn)) {
        duplicates.push({ ...studentObj, warning: `Duplicate LRN "${lrn}" in import file` })
      } else if (lrn && existingLrnMap.has(lrn)) {
        duplicates.push({ ...studentObj, warning: `LRN "${lrn}" already assigned to ${existingLrnMap.get(lrn)}` })
      } else if (existingMap.has(dupKey)) {
        duplicates.push({ ...studentObj, warning: `Already enrolled in ${grade} - ${section}` })
      } else {
        if (lrn) batchLrnSet.add(lrn)
        valid.push(studentObj)
      }
    })

    const maxStudents = license ? license.max_students : 0
    const wouldExceed = maxStudents > 0 && (currentStudents + valid.length > maxStudents)

    res.json({
      valid,
      duplicates,
      errors,
      summary: {
        total: rows.length,
        validCount: valid.length,
        duplicateCount: duplicates.length,
        errorCount: errors.length,
        currentCount: currentStudents,
        maxStudents,
        wouldExceed
      }
    })
  } catch (err) {
    console.error('Failed to validate student roster:', err.message)
    res.status(500).json({ error: 'Failed to validate student roster' })
  }
})

router.post('/bulk-import', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return

    const students = Array.isArray(req.body.students) ? req.body.students : []
    if (!students.length) return res.status(400).json({ error: 'No students provided for import' })

    const license = await getSchoolLicense(scope.schoolId)
    if (license && license.max_students > 0) {
      let currentStudents = 0
      try {
        currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [scope.schoolId]))[0]?.cnt || 0
      } catch {
        currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ?", [scope.schoolId]))[0]?.cnt || 0
      }
      if (currentStudents + students.length > license.max_students) {
        return res.status(400).json({
          error: `Importing ${students.length} students would exceed your school license limit (${currentStudents + students.length}/${license.max_students}).`
        })
      }
    }

    const effectiveOn = effectiveDate(req.body.effectiveOn)
    const reason = String(req.body.reason || 'Bulk roster import').trim()

    const created = []
    for (const item of students) {
      const name = String(item.name || '').trim()
      const grade = String(item.grade || '').trim()
      const section = String(item.section || '').trim()
      const gender = normalizeGender(item.gender || item.sex) || 'Male'
      const lrn = String(item.lrn || '').trim()
      const guardianName = String(item.guardian_name || '').trim()
      const guardianContact = String(item.guardian_contact || '').trim()
      const emergencyContactName = String(item.emergency_contact_name || '').trim()
      const emergencyContactNumber = String(item.emergency_contact_number || '').trim()
      if (!name || !grade || !section) continue

      const id = uuidv4()
      try {
        await run(
          'INSERT INTO students (id, name, grade, section, gender, school_id, lrn, guardian_name, guardian_contact, emergency_contact_name, emergency_contact_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, name, grade, section, gender, scope.schoolId, lrn, guardianName, guardianContact, emergencyContactName, emergencyContactNumber]
        )
      } catch {
        await run(
          'INSERT INTO students (id, name, grade, section, gender, school_id) VALUES (?, ?, ?, ?, ?, ?)',
          [id, name, grade, section, gender, scope.schoolId]
        )
      }
      const student = {
        id, name, grade, section, gender, school_id: scope.schoolId,
        lrn, guardian_name: guardianName, guardian_contact: guardianContact,
        emergency_contact_name: emergencyContactName, emergency_contact_number: emergencyContactNumber,
        enrollment_status: 'active'
      }
      await addEnrollmentEvent({
        student,
        eventType: 'enroll',
        status: 'active',
        effectiveOn,
        grade,
        section,
        reason,
        actor: me
      })
      created.push(student)
    }

    if (created.length) {
      await audit(
        me,
        'student.bulk_import',
        { type: 'student', id: '', name: `${created.length} learners`, schoolId: scope.schoolId },
        `Bulk imported roster of ${created.length} learners`
      )
    }

    res.json({ success: true, count: created.length, students: created })
  } catch (err) {
    console.error('Failed to bulk import students:', err.message)
    res.status(500).json({ error: 'Failed to bulk import students' })
  }
})

router.post('/check-duplicates', async (req, res) => {
  try {
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const { lrn, name, excludeId } = req.body || {}
    const matches = []

    if (lrn && String(lrn).trim()) {
      const cleanLrn = String(lrn).trim()
      let lrnSql = 'SELECT id, name, grade, section, gender, lrn, enrollment_status FROM students WHERE school_id = ? AND lrn = ?'
      const lrnParams = [scope.schoolId, cleanLrn]
      if (excludeId) {
        lrnSql += ' AND id != ?'
        lrnParams.push(excludeId)
      }
      const lrnRows = await query(lrnSql, lrnParams)
      for (const row of lrnRows) {
        matches.push({ ...row, matchType: 'lrn_exact', reason: `Exact LRN match (${cleanLrn})` })
      }
    }

    if (name && String(name).trim()) {
      const cleanName = String(name).trim()
      let nameSql = 'SELECT id, name, grade, section, gender, lrn, enrollment_status FROM students WHERE school_id = ? AND LOWER(name) = LOWER(?)'
      const nameParams = [scope.schoolId, cleanName]
      if (excludeId) {
        nameSql += ' AND id != ?'
        nameParams.push(excludeId)
      }
      const nameRows = await query(nameSql, nameParams)
      for (const row of nameRows) {
        if (!matches.some(m => m.id === row.id)) {
          matches.push({ ...row, matchType: 'name_exact', reason: `Exact name match (${cleanName})` })
        }
      }
    }

    res.json({
      hasDuplicate: matches.length > 0,
      matchesCount: matches.length,
      matches
    })
  } catch (err) {
    console.error('Failed to check duplicates:', err.message)
    res.status(500).json({ error: 'Failed to check duplicates' })
  }
})

router.get('/interventions', async (req, res) => {
  try {
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const { me, schoolId } = scope
    const { concern_type, resolution_status, assigned_staff_id, student_id } = req.query

    let sql = `
      SELECT i.*, s.name as student_name, s.grade, s.section, s.gender, s.lrn
      FROM student_interventions i
      JOIN students s ON s.id = i.student_id AND s.school_id = i.school_id
      WHERE i.school_id = ?
    `
    const params = [schoolId]

    if (me.role === 'teacher') {
      if (me.grade && me.section) {
        sql += ' AND s.grade = ? AND s.section = ?'
        params.push(me.grade, me.section)
      } else {
        return res.json([])
      }
    }

    if (concern_type) {
      sql += ' AND i.concern_type = ?'
      params.push(concern_type)
    }
    if (resolution_status) {
      sql += ' AND i.resolution_status = ?'
      params.push(resolution_status)
    }
    if (assigned_staff_id) {
      sql += ' AND i.assigned_staff_id = ?'
      params.push(assigned_staff_id)
    }
    if (student_id) {
      sql += ' AND i.student_id = ?'
      params.push(student_id)
    }

    sql += ' ORDER BY i.created_at DESC'
    const rows = await query(sql, params)
    res.json(rows)
  } catch (err) {
    console.error('Failed to list interventions:', err.message)
    res.status(500).json({ error: 'Failed to list interventions' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const students = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId])
    if (!students.length) return res.status(404).json({ error: 'Student not found' })
    const student = students[0]

    if (scope.me.role === 'teacher' && (student.grade !== scope.me.grade || student.section !== scope.me.section)) {
      return res.status(403).json({ error: 'Forbidden: outside your advisory class' })
    }

    let interventions = []
    try {
      interventions = await query('SELECT * FROM student_interventions WHERE student_id = ? AND school_id = ? ORDER BY created_at DESC', [student.id, scope.schoolId])
    } catch {}

    let contactHistory = []
    try {
      contactHistory = await query('SELECT * FROM student_guardian_contacts WHERE student_id = ? AND school_id = ? ORDER BY contact_date DESC, created_at DESC', [student.id, scope.schoolId])
    } catch {}

    let enrollmentHistory = []
    try {
      enrollmentHistory = await query('SELECT * FROM student_enrollment_events WHERE student_id = ? AND school_id = ? ORDER BY effective_on DESC, event_sequence DESC LIMIT 10', [student.id, scope.schoolId])
    } catch {}

    res.json({
      ...student,
      interventions,
      contactHistory,
      enrollmentHistory
    })
  } catch (err) {
    console.error('Failed to get student:', err.message)
    res.status(500).json({ error: 'Failed to get student' })
  }
})

router.get('/:id/interventions', async (req, res) => {
  try {
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const studentRows = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })
    const rows = await query('SELECT * FROM student_interventions WHERE student_id = ? AND school_id = ? ORDER BY created_at DESC', [req.params.id, scope.schoolId])
    res.json(rows)
  } catch (err) {
    console.error('Failed to fetch student interventions:', err.message)
    res.status(500).json({ error: 'Failed to fetch student interventions' })
  }
})

router.post('/:id/interventions', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return

    const studentRows = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })
    const student = studentRows[0]

    if (me.role === 'teacher' && (student.grade !== me.grade || student.section !== me.section)) {
      return res.status(403).json({ error: 'Forbidden: you can only add interventions for your advisory students' })
    }

    const { concern_type, action_taken, follow_up_date, resolution_status, notes, assigned_staff_id, assigned_staff_name } = req.body || {}
    if (!concern_type || !String(concern_type).trim()) {
      return res.status(400).json({ error: 'Concern type is required (e.g. attendance, academic, behavioral, health)' })
    }
    if (!action_taken || !String(action_taken).trim()) {
      return res.status(400).json({ error: 'Action taken description is required' })
    }

    const id = uuidv4()
    const concernType = String(concern_type).trim().toLowerCase()
    const actionTaken = String(action_taken).trim()
    const followUp = follow_up_date && validDate(follow_up_date) ? String(follow_up_date) : ''
    const status = ['open', 'in_progress', 'resolved', 'escalated'].includes(resolution_status) ? resolution_status : 'open'
    const staffId = String(assigned_staff_id || me.id).trim()
    const staffName = String(assigned_staff_name || me.name || '').trim()
    const noteText = String(notes || '').trim()

    await run(`INSERT INTO student_interventions
      (id, school_id, student_id, concern_type, assigned_staff_id, assigned_staff_name, action_taken, follow_up_date, resolution_status, notes, created_by, created_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, scope.schoolId, student.id, concernType, staffId, staffName, actionTaken, followUp, status, noteText, me.id, me.name || ''])

    await audit(me, 'student.intervention_create', { type: 'student', id: student.id, name: student.name, schoolId: scope.schoolId }, `Added ${concernType} intervention for "${student.name}"`)
    const rows = await query('SELECT * FROM student_interventions WHERE id = ?', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to create intervention:', err.message)
    res.status(500).json({ error: 'Failed to create intervention' })
  }
})

router.put('/:id/interventions/:interventionId', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return

    const studentRows = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })

    const existing = await query('SELECT * FROM student_interventions WHERE id = ? AND student_id = ? AND school_id = ?', [req.params.interventionId, req.params.id, scope.schoolId])
    if (!existing.length) return res.status(404).json({ error: 'Intervention record not found' })

    const { concern_type, action_taken, follow_up_date, resolution_status, notes, assigned_staff_id, assigned_staff_name } = req.body || {}
    const sets = []
    const params = []
    if (concern_type !== undefined) { sets.push('concern_type = ?'); params.push(String(concern_type).trim().toLowerCase()) }
    if (action_taken !== undefined) { sets.push('action_taken = ?'); params.push(String(action_taken).trim()) }
    if (follow_up_date !== undefined) { sets.push('follow_up_date = ?'); params.push(validDate(follow_up_date) ? String(follow_up_date) : '') }
    if (resolution_status !== undefined && ['open', 'in_progress', 'resolved', 'escalated'].includes(resolution_status)) {
      sets.push('resolution_status = ?'); params.push(resolution_status)
    }
    if (notes !== undefined) { sets.push('notes = ?'); params.push(String(notes).trim()) }
    if (assigned_staff_id !== undefined) { sets.push('assigned_staff_id = ?'); params.push(String(assigned_staff_id).trim()) }
    if (assigned_staff_name !== undefined) { sets.push('assigned_staff_name = ?'); params.push(String(assigned_staff_name).trim()) }

    if (!sets.length) return res.status(400).json({ error: 'No fields provided for update' })
    params.push(req.params.interventionId)
    await run(`UPDATE student_interventions SET ${sets.join(', ')} WHERE id = ?`, params)

    const updated = (await query('SELECT * FROM student_interventions WHERE id = ?', [req.params.interventionId]))[0]
    await audit(me, 'student.intervention_update', { type: 'student', id: req.params.id, name: studentRows[0].name, schoolId: scope.schoolId }, `Updated intervention ${req.params.interventionId} for "${studentRows[0].name}"`)
    res.json(updated)
  } catch (err) {
    console.error('Failed to update intervention:', err.message)
    res.status(500).json({ error: 'Failed to update intervention' })
  }
})

router.delete('/:id/interventions/:interventionId', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return

    const studentRows = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })

    const existing = await query('SELECT * FROM student_interventions WHERE id = ? AND student_id = ? AND school_id = ?', [req.params.interventionId, req.params.id, scope.schoolId])
    if (!existing.length) return res.status(404).json({ error: 'Intervention record not found' })

    await run('DELETE FROM student_interventions WHERE id = ?', [req.params.interventionId])
    await audit(me, 'student.intervention_delete', { type: 'student', id: req.params.id, name: studentRows[0].name, schoolId: scope.schoolId }, `Deleted intervention ${req.params.interventionId}`)
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete intervention:', err.message)
    res.status(500).json({ error: 'Failed to delete intervention' })
  }
})

router.get('/:id/guardian-contacts', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return

    const studentRows = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })

    const rows = await query('SELECT * FROM student_guardian_contacts WHERE student_id = ? AND school_id = ? ORDER BY contact_date DESC, created_at DESC', [req.params.id, scope.schoolId])
    res.json(rows)
  } catch (err) {
    console.error('Failed to fetch guardian contacts:', err.message)
    res.status(500).json({ error: 'Failed to fetch guardian contacts' })
  }
})

router.post('/:id/guardian-contacts', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return

    const studentRows = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })
    const student = studentRows[0]

    const { contact_date, contact_method, guardian_name, guardian_contact, reason, outcome } = req.body || {}
    if (!contact_method || !String(contact_method).trim()) {
      return res.status(400).json({ error: 'Contact method is required (e.g. phone, home_visit, in_person, sms, letter)' })
    }
    const cDate = contact_date && validDate(contact_date) ? String(contact_date) : effectiveDate(contact_date)
    const id = uuidv4()
    const gName = String(guardian_name || student.guardian_name || '').trim()
    const gContact = String(guardian_contact || student.guardian_contact || '').trim()
    const rsn = String(reason || 'SARDO / Attendance follow-up').trim()
    const otc = String(outcome || '').trim()

    await run(`INSERT INTO student_guardian_contacts
      (id, school_id, student_id, contact_date, contact_method, guardian_name, guardian_contact, reason, outcome, staff_id, staff_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, scope.schoolId, student.id, cDate, String(contact_method).trim().toLowerCase(), gName, gContact, rsn, otc, me.id, me.name || ''])

    await audit(me, 'student.guardian_contact_log', { type: 'student', id: student.id, name: student.name, schoolId: scope.schoolId }, `Logged guardian contact (${contact_method}) for "${student.name}"`)
    const rows = await query('SELECT * FROM student_guardian_contacts WHERE id = ?', [id])
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Failed to log guardian contact:', err.message)
    res.status(500).json({ error: 'Failed to log guardian contact' })
  }
})

router.delete('/:id/guardian-contacts/:contactId', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return

    const studentRows = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })

    const existing = await query('SELECT * FROM student_guardian_contacts WHERE id = ? AND student_id = ? AND school_id = ?', [req.params.contactId, req.params.id, scope.schoolId])
    if (!existing.length) return res.status(404).json({ error: 'Contact log not found' })

    await run('DELETE FROM student_guardian_contacts WHERE id = ?', [req.params.contactId])
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete guardian contact:', err.message)
    res.status(500).json({ error: 'Failed to delete guardian contact' })
  }
})

async function scopedStudent(req) {
  const rows = await query('SELECT * FROM students WHERE id = ?', [req.params.id])
  return rows[0] || null
}

async function performCrossSchoolTransfer({ student, targetSchoolId, targetGrade, targetSection, effectiveOn, reason, me, tx = null }) {
  if (!targetSchoolId) {
    throw new Error('targetSchoolId is required for cross-school transfer')
  }
  if (targetSchoolId === student.school_id) {
    throw new Error('Target school must be different from current school. For within-school class changes, use class transfer.')
  }
  const runner = tx || { query, run }
  const destSchoolRows = await runner.query('SELECT * FROM schools WHERE id = ?', [targetSchoolId])
  if (!destSchoolRows.length) {
    throw new Error('Target school not found')
  }
  const destSchool = destSchoolRows[0]
  if (destSchool.archived_at) {
    throw new Error('Cannot transfer to an archived school')
  }

  const srcSchoolRows = await runner.query('SELECT * FROM schools WHERE id = ?', [student.school_id])
  const srcSchool = srcSchoolRows[0]
  const srcSchoolName = srcSchool?.name || 'Previous School'
  const destSchoolName = destSchool?.name || 'New School'

  if (!targetGrade || !targetSection) {
    throw new Error('Target grade and section are required')
  }

  const valid = await isValidClass(targetSchoolId, targetGrade, targetSection)
  if (!valid) {
    throw new Error(`Grade "${targetGrade}" and Section "${targetSection}" do not exist in target school "${destSchoolName}"`)
  }

  const license = await getSchoolLicense(targetSchoolId)
  if (license && license.max_students > 0) {
    let currentStudents = 0
    try {
      currentStudents = (await runner.query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [targetSchoolId]))[0]?.cnt || 0
    } catch {
      currentStudents = (await runner.query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ?", [targetSchoolId]))[0]?.cnt || 0
    }
    if (currentStudents >= license.max_students) {
      throw new Error(`Target school has reached maximum student capacity (${currentStudents}/${license.max_students})`)
    }
  }

  if (student.enrollment_status === 'withdrawn') {
    throw new Error('Withdrawn students cannot be transferred across schools. Re-enroll the student first.')
  }

  const effDate = effectiveDate(effectiveOn)
  const latestEventRows = await runner.query(`
    SELECT * FROM student_enrollment_events
    WHERE student_id = ? AND school_id = ?
    ORDER BY effective_on DESC, event_sequence DESC, created_at DESC, id DESC
    LIMIT 1`, [student.id, student.school_id])
  const latestEvent = latestEventRows[0]
  if (latestEvent && effDate < latestEvent.effective_on) {
    throw new Error(`Transfer effective date (${effDate}) cannot be earlier than the latest enrollment event (${latestEvent.effective_on})`)
  }

  const transferGroupId = 'xfer-' + uuidv4()
  const transferReason = String(reason || '').trim()

  return await withTransaction(async (innerTx) => {
    // 1. Source school: record transfer_out event
    const sourceEvent = await addEnrollmentEvent({
      student: { id: student.id, school_id: student.school_id },
      eventType: 'transfer_out',
      status: 'withdrawn',
      effectiveOn: effDate,
      grade: student.grade,
      section: student.section,
      reason: transferReason || `Transferred out to ${destSchoolName}`,
      actor: me,
      transferGroupId,
      tx: innerTx
    })

    // 2. Destination school: record transfer_in event
    const destinationEvent = await addEnrollmentEvent({
      student: { id: student.id, school_id: targetSchoolId },
      eventType: 'transfer_in',
      status: 'active',
      effectiveOn: effDate,
      grade: targetGrade,
      section: targetSection,
      reason: transferReason || `Transferred in from ${srcSchoolName}`,
      actor: me,
      transferGroupId,
      tx: innerTx
    })

    // 3. Update student row to destination school and new class
    try {
      await innerTx.run(
        'UPDATE students SET school_id = ?, grade = ?, section = ?, enrollment_status = ? WHERE id = ?',
        [targetSchoolId, targetGrade, targetSection, 'active', student.id]
      )
    } catch (err) {
      if (/unknown column 'enrollment_status'/i.test(String(err.message || ''))) {
        await innerTx.run(
          'UPDATE students SET school_id = ?, grade = ?, section = ? WHERE id = ?',
          [targetSchoolId, targetGrade, targetSection, student.id]
        )
      } else {
        throw err
      }
    }

    const updated = (await innerTx.query('SELECT * FROM students WHERE id = ?', [student.id]))[0]

    return {
      success: true,
      student: updated,
      transferGroupId,
      sourceEvent,
      destinationEvent,
      srcSchoolName,
      destSchoolName
    }
  }, tx)
}

router.get('/:id/enrollment-history', async (req, res) => {
  try {
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const isSuperadminAll = scope.me.role === 'superadmin' && String(req.query.allSchools || '').toLowerCase() === 'true'
    const rows = isSuperadminAll
      ? await query(
          'SELECT * FROM student_enrollment_events WHERE student_id = ? ORDER BY effective_on ASC, event_sequence ASC, created_at ASC, id ASC',
          [req.params.id]
        )
      : await query(
          'SELECT * FROM student_enrollment_events WHERE student_id = ? AND school_id = ? ORDER BY effective_on ASC, event_sequence ASC, created_at ASC, id ASC',
          [req.params.id, scope.schoolId]
        )
    if (!rows.length) {
      const student = (await query('SELECT id FROM students WHERE id = ?', [req.params.id]))[0]
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
    await ensureEnrollmentStatusColumn()
    const me = await assertWritable(req, res)
    if (!me) return
    const scope = await studentSchoolScope(req, res)
    if (!scope) return
    const student = (await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [req.params.id, scope.schoolId]))[0]
    if (!student) return res.status(404).json({ error: 'Student not found' })

    const eventType = String(req.body.eventType || '').trim().toLowerCase()
    const allowed = new Set(['transfer', 'promote', 'withdraw', 'reenroll', 'transfer_school', 'cross_school_transfer'])
    if (!allowed.has(eventType)) return res.status(400).json({ error: 'eventType must be transfer, promote, withdraw, reenroll, or transfer_school' })
    const effectiveOn = effectiveDate(req.body.effectiveOn)
    if (req.body.effectiveOn && !validDate(req.body.effectiveOn)) return res.status(400).json({ error: 'effectiveOn must use YYYY-MM-DD format' })
    const reason = String(req.body.reason || '').trim()
    if (!reason && !['transfer_school', 'cross_school_transfer'].includes(eventType)) return res.status(400).json({ error: 'A reason is required for enrollment changes' })

    const targetGrade = String(req.body.grade || '').trim()
    const targetSection = String(req.body.section || '').trim()

    if (['transfer_school', 'cross_school_transfer'].includes(eventType)) {
      const targetSchoolId = String(req.body.targetSchoolId || req.body.destinationSchoolId || req.body.schoolId || '').trim()
      const result = await performCrossSchoolTransfer({
        student,
        targetSchoolId,
        targetGrade,
        targetSection,
        effectiveOn: req.body.effectiveOn,
        reason,
        me
      })
      await audit(
        me,
        'student.transfer_school',
        { type: 'student', id: student.id, name: student.name, schoolId: targetSchoolId },
        `Transferred "${student.name}" from ${result.srcSchoolName} to ${result.destSchoolName} (${targetGrade} - ${targetSection}) effective ${result.destinationEvent.effective_on}`
      )
      return res.status(201).json({
        event: result.destinationEvent,
        student: result.student,
        currentEnrollment: result.destinationEvent,
        transferGroupId: result.transferGroupId,
        sourceEvent: result.sourceEvent,
        destinationEvent: result.destinationEvent
      })
    }

    if (['transfer', 'promote', 'reenroll'].includes(eventType)) {
      if (!targetGrade || !targetSection) return res.status(400).json({ error: 'grade and section are required for this enrollment event' })
      if (!(await assertValidClass(res, scope.schoolId, targetGrade, targetSection))) return
    }
    const latestEvent = (await query(`
      SELECT * FROM student_enrollment_events
      WHERE student_id = ? AND school_id = ?
      ORDER BY effective_on DESC, event_sequence DESC, created_at DESC, id DESC
      LIMIT 1`, [student.id, student.school_id]))[0]
    let effDate = effectiveOn
    if (eventType === 'reenroll') {
      if (latestEvent && effDate < latestEvent.effective_on) {
        effDate = latestEvent.effective_on
      }
    } else if (latestEvent && effDate < latestEvent.effective_on) {
      return res.status(409).json({ error: 'Enrollment changes must be effective on or after the latest enrollment event' })
    }
    if (latestEvent && effDate === latestEvent.effective_on && latestEvent.event_type === eventType && latestEvent.grade === (targetGrade || student.grade) && latestEvent.section === (targetSection || student.section)) {
      if (eventType !== 'reenroll') {
        return res.status(409).json({ error: 'An identical enrollment event already exists for this date' })
      }
    }
    if (eventType === 'withdraw' && student.enrollment_status === 'withdrawn') {
      return res.status(409).json({ error: 'Student is already withdrawn' })
    }
    if (eventType !== 'withdraw' && student.enrollment_status !== 'active' && eventType !== 'reenroll') {
      return res.status(409).json({ error: 'Withdrawn students must be reenrolled before changing class' })
    }
    if (eventType === 'reenroll' && student.enrollment_status === 'withdrawn') {
      const license = await getSchoolLicense(scope.schoolId)
      if (license && license.max_students > 0) {
        let currentStudents = 0
        try {
          currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [scope.schoolId]))[0]?.cnt || 0
        } catch {
          currentStudents = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ?", [scope.schoolId]))[0]?.cnt || 0
        }
        if (currentStudents >= license.max_students) {
          return res.status(400).json({
            error: `Student population limit reached (${currentStudents}/${license.max_students} students). Upgrade your license capacity to enroll more students.`
          })
        }
      }
    }

    const currentGrade = targetGrade || student.grade
    const currentSection = targetSection || student.section
    const status = eventType === 'withdraw' ? 'withdrawn' : 'active'
    let event
    await withTransaction(async (tx) => {
      event = await addEnrollmentEvent({
        student,
        eventType,
        status,
        effectiveOn: effDate,
        grade: currentGrade,
        section: currentSection,
        reason,
        actor: me,
        transferGroupId: String(req.body.transferGroupId || ''),
        tx
      })
      try {
        await tx.run('UPDATE students SET grade = ?, section = ?, enrollment_status = ? WHERE id = ?', [currentGrade, currentSection, status, student.id])
      } catch (err) {
        if (/unknown column 'enrollment_status'/i.test(String(err.message || ''))) {
          await tx.run('UPDATE students SET grade = ?, section = ? WHERE id = ?', [currentGrade, currentSection, student.id])
        } else {
          throw err
        }
      }
    })
    await audit(me, `student.${eventType}`, { type: 'student', id: student.id, name: student.name, schoolId: student.school_id || '' }, `${eventType} for "${student.name}" effective ${effDate}: ${reason}`)
    const updated = (await query('SELECT * FROM students WHERE id = ?', [student.id]))[0]
    res.status(201).json({ event, student: updated, currentEnrollment: event })
  } catch (err) {
    console.error('Failed to create enrollment event', err.message)
    res.status(500).json({ error: 'Failed to create enrollment event' })
  }
})

router.post('/:id/transfer-school', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
    const me = await assertWritable(req, res)
    if (!me) return

    const studentRows = await query('SELECT * FROM students WHERE id = ?', [req.params.id])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })
    const student = studentRows[0]

    if (me.role !== 'superadmin' && student.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    const targetSchoolId = String(req.body.targetSchoolId || req.body.destinationSchoolId || req.body.schoolId || '').trim()
    const targetGrade = String(req.body.grade || req.body.targetGrade || '').trim()
    const targetSection = String(req.body.section || req.body.targetSection || '').trim()
    const effectiveOn = req.body.effectiveOn
    const reason = req.body.reason

    const result = await performCrossSchoolTransfer({
      student,
      targetSchoolId,
      targetGrade,
      targetSection,
      effectiveOn,
      reason,
      me
    })

    await audit(
      me,
      'student.transfer_school',
      { type: 'student', id: student.id, name: student.name, schoolId: targetSchoolId },
      `Transferred "${student.name}" from ${result.srcSchoolName} to ${result.destSchoolName} (${targetGrade} - ${targetSection}) effective ${result.destinationEvent.effective_on}`
    )

    res.status(200).json(result)
  } catch (err) {
    const msg = String(err.message || '')
    if (msg.includes('required') || msg.includes('must be different') || msg.includes('do not exist') || msg.includes('archived') || msg.includes('capacity')) {
      return res.status(400).json({ error: msg })
    }
    if (msg.includes('not found')) {
      return res.status(404).json({ error: msg })
    }
    if (msg.includes('earlier than') || msg.includes('Withdrawn students')) {
      return res.status(409).json({ error: msg })
    }
    console.error('Failed cross-school transfer:', err.message)
    res.status(500).json({ error: 'Failed cross-school transfer' })
  }
})

router.post('/:id/reenroll', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
    const me = await assertWritable(req, res)
    if (!me) return
    const target = await scopedStudent(req)
    if (!target) return res.status(404).json({ error: 'Student not found' })
    if (me.role !== 'superadmin' && target.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const targetGrade = String(req.body.grade || target.grade || '').trim()
    const targetSection = String(req.body.section || target.section || '').trim()
    if (!targetGrade || !targetSection) return res.status(400).json({ error: 'grade and section are required' })
    if (!(await assertValidClass(res, target.school_id, targetGrade, targetSection))) return

    if (req.body.effectiveOn && !validDate(req.body.effectiveOn)) return res.status(400).json({ error: 'effectiveOn must use YYYY-MM-DD format' })
    let effectiveOn = effectiveDate(req.body.effectiveOn)
    const reason = String(req.body.reason || (target.enrollment_status === 'withdrawn' ? 'Re-enrolled after withdrawal' : 'Re-enrolled')).trim()
    if (!reason) return res.status(400).json({ error: 'A reason is required for re-enrollment' })

    const latestEvent = (await query(`
      SELECT * FROM student_enrollment_events
      WHERE student_id = ? AND school_id = ?
      ORDER BY effective_on DESC, event_sequence DESC, created_at DESC, id DESC
      LIMIT 1`, [target.id, target.school_id]))[0]
    if (latestEvent && effectiveOn < latestEvent.effective_on) {
      effectiveOn = latestEvent.effective_on
    }

    if (target.enrollment_status === 'withdrawn') {
      const license = await getSchoolLicense(target.school_id)
      if (license && license.max_students > 0) {
        let currentActive = 0
        try {
          currentActive = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [target.school_id]))[0]?.cnt || 0
        } catch {
          currentActive = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ?", [target.school_id]))[0]?.cnt || 0
        }
        if (currentActive >= license.max_students) {
          return res.status(400).json({
            error: `Student population limit reached (${currentActive}/${license.max_students} students). Upgrade your license capacity to re-enroll this student.`
          })
        }
      }
    }

    const event = await addEnrollmentEvent({
      student: target,
      eventType: 'reenroll',
      status: 'active',
      effectiveOn,
      grade: targetGrade,
      section: targetSection,
      reason,
      actor: me
    })
    try {
      await run("UPDATE students SET grade = ?, section = ?, enrollment_status = 'active' WHERE id = ?", [targetGrade, targetSection, target.id])
    } catch (err) {
      if (/unknown column 'enrollment_status'/i.test(String(err.message || ''))) {
        await run("UPDATE students SET grade = ?, section = ? WHERE id = ?", [targetGrade, targetSection, target.id])
      } else {
        throw err
      }
    }
    await audit(me, 'student.reenroll', { type: 'student', id: target.id, name: target.name, schoolId: target.school_id || '' }, `Re-enrolled "${target.name}" (${targetGrade} - ${targetSection}) effective ${effectiveOn}: ${reason}`)
    const updated = (await query('SELECT * FROM students WHERE id = ?', [target.id]))[0]
    res.json({ success: true, event, student: updated })
  } catch (err) {
    console.error('Failed to re-enroll student', err.message)
    res.status(500).json({ error: 'Failed to re-enroll student' })
  }
})

router.post('/bulk-reenroll', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
    const me = await assertWritable(req, res)
    if (!me) return
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No ids provided' })
    }
    const targetGrade = String(req.body.grade || '').trim()
    const targetSection = String(req.body.section || '').trim()
    if ((targetGrade && !targetSection) || (!targetGrade && targetSection)) {
      return res.status(400).json({ error: 'Both grade and section are required when assigning a new class' })
    }
    const scopeSchoolId = req.body.schoolId || me.school_id || ''
    if (targetGrade && targetSection && scopeSchoolId) {
      if (!(await assertValidClass(res, scopeSchoolId, targetGrade, targetSection))) return
    }
    if (req.body.effectiveOn && !validDate(req.body.effectiveOn)) return res.status(400).json({ error: 'effectiveOn must use YYYY-MM-DD format' })
    const effectiveOn = effectiveDate(req.body.effectiveOn)
    const reason = String(req.body.reason || 'Bulk re-enrolled').trim()

    if (scopeSchoolId) {
      const license = await getSchoolLicense(scopeSchoolId)
      if (license && license.max_students > 0) {
        let currentActive = 0
        try {
          currentActive = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [scopeSchoolId]))[0]?.cnt || 0
        } catch {
          currentActive = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ?", [scopeSchoolId]))[0]?.cnt || 0
        }
        const placeholders = ids.map(() => '?').join(',')
        let toActivate = 0
        try {
          toActivate = (await query(`SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND id IN (${placeholders}) AND enrollment_status = 'withdrawn'`, [scopeSchoolId, ...ids]))[0]?.cnt || 0
        } catch {
          toActivate = 0
        }
        if (currentActive + toActivate > license.max_students) {
          return res.status(400).json({
            error: `Re-enrolling would exceed student population limit (${currentActive + toActivate}/${license.max_students} students). Upgrade your license capacity to re-enroll these students.`
          })
        }
      }
    }

    let count = 0
    const skipped = []
    for (const id of ids) {
      const target = (await query('SELECT * FROM students WHERE id = ?', [id]))[0]
      if (!target) {
        skipped.push({ id, reason: 'Student not found' })
        continue
      }
      if (me.role !== 'superadmin' && target.school_id !== me.school_id) {
        skipped.push({ id, name: target.name, reason: 'Outside your school' })
        continue
      }
      const finalGrade = targetGrade || target.grade
      const finalSection = targetSection || target.section
      if (!finalGrade || !finalSection) {
        skipped.push({ id, name: target.name, reason: 'Missing grade or section' })
        continue
      }
      const latestEvent = (await query(`
        SELECT * FROM student_enrollment_events
        WHERE student_id = ? AND school_id = ?
        ORDER BY effective_on DESC, event_sequence DESC, created_at DESC, id DESC
        LIMIT 1`, [target.id, target.school_id]))[0]
      let itemEffectiveOn = effectiveOn
      if (latestEvent && itemEffectiveOn < latestEvent.effective_on) {
        itemEffectiveOn = latestEvent.effective_on
      }
      await addEnrollmentEvent({
        student: target,
        eventType: 'reenroll',
        status: 'active',
        effectiveOn: itemEffectiveOn,
        grade: finalGrade,
        section: finalSection,
        reason,
        actor: me
      })
      try {
        await run("UPDATE students SET grade = ?, section = ?, enrollment_status = 'active' WHERE id = ?", [finalGrade, finalSection, target.id])
      } catch (err) {
        if (/unknown column 'enrollment_status'/i.test(String(err.message || ''))) {
          await run("UPDATE students SET grade = ?, section = ? WHERE id = ?", [finalGrade, finalSection, target.id])
        } else {
          throw err
        }
      }
      count++
    }
    if (count) await audit(me, 'student.bulk_reenroll', { type: 'student', id: '', name: `${count} students`, schoolId: scopeSchoolId || me.school_id || '' }, `Bulk re-enrolled ${count} students`)
    res.json({ count, skipped })
  } catch (err) {
    console.error('Failed to bulk re-enroll students', err.message)
    res.status(500).json({ error: 'Failed to bulk re-enroll students' })
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
    const {
      name, grade, section, gender, lrn, birth_date, address,
      guardian_name, guardian_relationship, guardian_contact,
      emergency_contact_name, emergency_contact_number,
      consent_data_sharing, consent_medical_emergency
    } = req.body

    if (grade !== undefined || section !== undefined) {
      return res.status(400).json({ error: 'Use an enrollment event to change a student grade or section' })
    }

    if (lrn !== undefined && String(lrn).trim()) {
      const cleanLrn = String(lrn).trim()
      const existing = await query('SELECT id, name FROM students WHERE school_id = ? AND lrn = ? AND id != ?', [target.school_id, cleanLrn, target.id])
      if (existing.length) {
        return res.status(409).json({ error: `Student with LRN "${cleanLrn}" already exists (${existing[0].name})` })
      }
    }

    const sets = []
    const params = []
    if (name !== undefined) { sets.push('name = ?'); params.push(String(name).trim()) }
    if (gender !== undefined) { sets.push('gender = ?'); params.push(gender) }
    if (lrn !== undefined) { sets.push('lrn = ?'); params.push(String(lrn).trim()) }
    if (birth_date !== undefined) { sets.push('birth_date = ?'); params.push(String(birth_date).trim()) }
    if (address !== undefined) { sets.push('address = ?'); params.push(String(address).trim()) }
    if (guardian_name !== undefined) { sets.push('guardian_name = ?'); params.push(String(guardian_name).trim()) }
    if (guardian_relationship !== undefined) { sets.push('guardian_relationship = ?'); params.push(String(guardian_relationship).trim()) }
    if (guardian_contact !== undefined) { sets.push('guardian_contact = ?'); params.push(String(guardian_contact).trim()) }
    if (emergency_contact_name !== undefined) { sets.push('emergency_contact_name = ?'); params.push(String(emergency_contact_name).trim()) }
    if (emergency_contact_number !== undefined) { sets.push('emergency_contact_number = ?'); params.push(String(emergency_contact_number).trim()) }
    if (consent_data_sharing !== undefined) { sets.push('consent_data_sharing = ?'); params.push(consent_data_sharing ? 1 : 0) }
    if (consent_medical_emergency !== undefined) { sets.push('consent_medical_emergency = ?'); params.push(consent_medical_emergency ? 1 : 0) }

    if (!sets.length) return res.status(400).json({ error: 'No fields provided for update' })
    params.push(req.params.id)
    await run(`UPDATE students SET ${sets.join(', ')} WHERE id = ?`, params)
    await audit(me, 'student.update', { type: 'student', id: req.params.id, name: name || target.name, schoolId: target.school_id || '' }, `Updated student "${name || target.name}"`)
    const updated = (await query('SELECT * FROM students WHERE id = ?', [req.params.id]))[0]
    res.json({ success: true, student: updated })
  } catch (err) {
    console.error('Failed to update student', err.message)
    res.status(500).json({ error: 'Failed to update student' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
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
    try {
      await run("UPDATE students SET enrollment_status = 'withdrawn' WHERE id = ?", [target.id])
    } catch (err) {
      if (!/unknown column 'enrollment_status'/i.test(String(err.message || ''))) throw err
    }
    await audit(me, 'student.withdraw', { type: 'student', id: target.id, name: target.name, schoolId: target.school_id || '' }, `Withdrawn "${target.name}" effective ${effectiveOn}: ${reason}`)
    res.json({ success: true, event })
  } catch (err) {
    console.error('Failed to withdraw student', err.message)
    res.status(500).json({ error: 'Failed to withdraw student' })
  }
})

router.post('/bulk-action', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
    const me = await assertWritable(req, res)
    if (!me) return
    const { ids, action } = req.body || {}
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No student ids provided' })
    }
    const validActions = ['transfer', 'promote', 'reenroll', 'withdraw', 'gender', 'permanent_delete', 'transfer_school']
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Action must be one of: ${validActions.join(', ')}` })
    }

    const scopeSchoolId = req.body.schoolId || me.school_id || ''
    const effectiveOn = effectiveDate(req.body.effectiveOn)
    const targetGrade = String(req.body.grade || '').trim()
    const targetSection = String(req.body.section || '').trim()
    const targetGender = String(req.body.gender || '').trim()
    const defaultReasons = {
      transfer: 'Class transfer',
      promote: 'Promoted to next grade level',
      reenroll: 'Re-enrolled after withdrawal',
      withdraw: 'Withdrawn from active roster',
      transfer_school: 'Cross-school transfer'
    }
    const reason = String(req.body.reason || defaultReasons[action] || '').trim()

    if (action === 'transfer_school') {
      const targetSchoolId = String(req.body.targetSchoolId || req.body.destinationSchoolId || '').trim()
      if (!targetSchoolId) {
        return res.status(400).json({ error: 'targetSchoolId is required for cross-school transfer' })
      }
      if (!targetGrade || !targetSection) {
        return res.status(400).json({ error: 'Both grade and section are required for destination school' })
      }
      if (!(await assertValidClass(res, targetSchoolId, targetGrade, targetSection))) return
    }

    if (['transfer', 'promote'].includes(action)) {
      if (!targetGrade || !targetSection) {
        return res.status(400).json({ error: 'Both grade and section are required' })
      }
      if (scopeSchoolId && !(await assertValidClass(res, scopeSchoolId, targetGrade, targetSection))) return
    }

    if (action === 'reenroll') {
      if (targetGrade && targetSection && scopeSchoolId) {
        if (!(await assertValidClass(res, scopeSchoolId, targetGrade, targetSection))) return
      }
      if (scopeSchoolId) {
        const license = await getSchoolLicense(scopeSchoolId)
        if (license && license.max_students > 0) {
          let currentActive = 0
          try {
            currentActive = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND COALESCE(enrollment_status, 'active') = 'active'", [scopeSchoolId]))[0]?.cnt || 0
          } catch {
            currentActive = (await query("SELECT COUNT(*) as cnt FROM students WHERE school_id = ?", [scopeSchoolId]))[0]?.cnt || 0
          }
          const placeholders = ids.map(() => '?').join(',')
          let toActivate = 0
          try {
            toActivate = (await query(`SELECT COUNT(*) as cnt FROM students WHERE school_id = ? AND id IN (${placeholders}) AND enrollment_status = 'withdrawn'`, [scopeSchoolId, ...ids]))[0]?.cnt || 0
          } catch {
            toActivate = 0
          }
          if (currentActive + toActivate > license.max_students) {
            return res.status(400).json({
              error: `Re-enrolling would exceed student population limit (${currentActive + toActivate}/${license.max_students} students). Upgrade your license capacity to re-enroll these students.`
            })
          }
        }
      }
    }

    if (action === 'gender' && !['Male', 'Female'].includes(targetGender)) {
      return res.status(400).json({ error: 'Gender must be Male or Female' })
    }

    let count = 0
    const skipped = []

    for (const id of ids) {
      const target = (await query('SELECT * FROM students WHERE id = ?', [id]))[0]
      if (!target) {
        skipped.push({ id, reason: 'Student not found' })
        continue
      }
      if (me.role !== 'superadmin' && target.school_id !== me.school_id) {
        skipped.push({ id, name: target.name, reason: 'Outside your school' })
        continue
      }

      if (action === 'gender') {
        await run('UPDATE students SET gender = ? WHERE id = ?', [targetGender, target.id])
        count++
        continue
      }

      if (action === 'permanent_delete') {
        await run('DELETE FROM attendance_corrections WHERE student_id = ?', [id])
        await run('DELETE FROM student_enrollment_events WHERE student_id = ?', [id])
        await run('DELETE FROM student_interventions WHERE student_id = ?', [id])
        await run('DELETE FROM student_guardian_contacts WHERE student_id = ?', [id])
        await run('DELETE FROM attendance_entries WHERE student_id = ?', [id])
        await run('DELETE FROM monthly_entries WHERE student_id = ?', [id])
        await run('DELETE FROM students WHERE id = ?', [id])
        count++
        continue
      }

      if (action === 'transfer_school') {
        const targetSchoolId = String(req.body.targetSchoolId || req.body.destinationSchoolId || '').trim()
        if (target.school_id === targetSchoolId) {
          skipped.push({ id, name: target.name, reason: 'Already in target school' })
          continue
        }
        if (target.enrollment_status === 'withdrawn') {
          skipped.push({ id, name: target.name, reason: 'Withdrawn students must be re-enrolled before cross-school transfer' })
          continue
        }
        try {
          await performCrossSchoolTransfer({
            student: target,
            targetSchoolId,
            targetGrade,
            targetSection,
            effectiveOn,
            reason: reason || defaultReasons.transfer_school,
            me
          })
          count++
        } catch (err) {
          skipped.push({ id, name: target.name, reason: err.message })
        }
        continue
      }

      if (action === 'withdraw') {
        if (target.enrollment_status === 'withdrawn') {
          skipped.push({ id, name: target.name, reason: 'Already withdrawn' })
          continue
        }
        await addEnrollmentEvent({
          student: target,
          eventType: 'withdraw',
          status: 'withdrawn',
          effectiveOn,
          grade: target.grade,
          section: target.section,
          reason: reason || defaultReasons.withdraw,
          actor: me
        })
        try {
          await run("UPDATE students SET enrollment_status = 'withdrawn' WHERE id = ?", [target.id])
        } catch (err) {
          if (!/unknown column 'enrollment_status'/i.test(String(err.message || ''))) throw err
        }
        count++
        continue
      }

      const finalGrade = targetGrade || target.grade
      const finalSection = targetSection || target.section
      if (!finalGrade || !finalSection) {
        skipped.push({ id, name: target.name, reason: 'Missing grade or section' })
        continue
      }

      const latestEvent = (await query(`
        SELECT * FROM student_enrollment_events
        WHERE student_id = ? AND school_id = ?
        ORDER BY effective_on DESC, event_sequence DESC, created_at DESC, id DESC
        LIMIT 1`, [target.id, target.school_id]))[0]
      let itemEffectiveOn = effectiveOn
      if (action === 'reenroll') {
        if (latestEvent && itemEffectiveOn < latestEvent.effective_on) {
          itemEffectiveOn = latestEvent.effective_on
        }
      } else if (latestEvent && effectiveOn < latestEvent.effective_on) {
        skipped.push({ id, name: target.name, reason: `Effective date before last event (${latestEvent.effective_on})` })
        continue
      }

      if (['transfer', 'promote'].includes(action) && target.enrollment_status === 'withdrawn') {
        skipped.push({ id, name: target.name, reason: 'Withdrawn students must be re-enrolled before class change' })
        continue
      }

      await addEnrollmentEvent({
        student: target,
        eventType: action,
        status: 'active',
        effectiveOn: itemEffectiveOn,
        grade: finalGrade,
        section: finalSection,
        reason: reason || defaultReasons[action],
        actor: me
      })
      try {
        await run("UPDATE students SET grade = ?, section = ?, enrollment_status = 'active' WHERE id = ?", [finalGrade, finalSection, target.id])
      } catch (err) {
        if (/unknown column 'enrollment_status'/i.test(String(err.message || ''))) {
          await run("UPDATE students SET grade = ?, section = ? WHERE id = ?", [finalGrade, finalSection, target.id])
        } else {
          throw err
        }
      }
      count++
    }

    if (count) {
      await audit(me, `student.bulk_${action}`, { type: 'student', id: '', name: `${count} students`, schoolId: scopeSchoolId || me.school_id || '' }, `Bulk ${action} on ${count} students`)
    }

    res.json({ success: true, count, skipped })
  } catch (err) {
    console.error('Failed to perform bulk student action:', err.message)
    res.status(500).json({ error: 'Failed to perform bulk student action: ' + err.message })
  }
})

router.post('/bulk-permanent-delete', async (req, res) => {
  try {
    const me = await assertWritable(req, res)
    if (!me) return
    const { ids } = req.body || {}
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No ids provided' })
    }
    let count = 0
    for (const id of ids) {
      const target = (await query('SELECT * FROM students WHERE id = ?', [id]))[0]
      if (!target) continue
      if (me.role !== 'superadmin' && target.school_id !== me.school_id) continue
      await run('DELETE FROM attendance_corrections WHERE student_id = ?', [id])
      await run('DELETE FROM student_enrollment_events WHERE student_id = ?', [id])
      await run('DELETE FROM student_interventions WHERE student_id = ?', [id])
      await run('DELETE FROM student_guardian_contacts WHERE student_id = ?', [id])
      await run('DELETE FROM attendance_entries WHERE student_id = ?', [id])
      await run('DELETE FROM monthly_entries WHERE student_id = ?', [id])
      await run('DELETE FROM students WHERE id = ?', [id])
      count++
    }
    if (count) await audit(me, 'student.bulk_permanent_delete', { type: 'student', id: '', name: `${count} students`, schoolId: me.school_id || '' }, `Permanently deleted ${count} students`)
    res.json({ count, success: true })
  } catch (err) {
    console.error('Failed to bulk permanently delete students', err.message)
    res.status(500).json({ error: 'Failed to bulk permanently delete students' })
  }
})

router.post('/bulk-delete', async (req, res) => {
  try {
    await ensureEnrollmentStatusColumn()
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
      try {
        await run("UPDATE students SET enrollment_status = 'withdrawn' WHERE id = ?", [id])
      } catch (err) {
        if (!/unknown column 'enrollment_status'/i.test(String(err.message || ''))) throw err
      }
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
