import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { requireRole, resolveScopeSchool, audit } from './_context.js'
import { calculateInitialGrade, transmuteGrade, determineHonors, getProficiencyLevel } from '../lib/grading.js'

const router = Router()

// Standard DepEd K-12 learning areas with DepEd Order No. 8, s. 2015 assessment weights
const DEPED_STANDARD_SUBJECTS = [
  { name: 'Filipino', code: 'FIL', ww: 30, pt: 50, qa: 20 },
  { name: 'English', code: 'ENG', ww: 30, pt: 50, qa: 20 },
  { name: 'Mathematics', code: 'MATH', ww: 40, pt: 40, qa: 20 },
  { name: 'Science', code: 'SCI', ww: 40, pt: 40, qa: 20 },
  { name: 'Araling Panlipunan (AP)', code: 'AP', ww: 30, pt: 50, qa: 20 },
  { name: 'Edukasyon sa Pagpapakatao (EsP)', code: 'ESP', ww: 30, pt: 50, qa: 20 },
  { name: 'Music, Arts, Physical Education & Health (MAPEH)', code: 'MAPEH', ww: 20, pt: 60, qa: 20 },
  { name: 'Technology and Livelihood Education (TLE)', code: 'TLE', ww: 20, pt: 60, qa: 20 }
]

// ── GET /api/grading/subjects ──
// List subjects for school and optional grade level
router.get('/subjects', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    const gradeLevel = String(req.query.gradeLevel || '').trim()

    let sql = 'SELECT * FROM grading_subjects WHERE 1=1'
    const params = []

    if (schoolId) {
      sql += ' AND school_id = ?'
      params.push(schoolId)
    }
    if (gradeLevel) {
      sql += ' AND grade_level = ?'
      params.push(gradeLevel)
    }

    sql += ' ORDER BY display_order ASC, subject_name ASC'

    const subjects = await query(sql, params)
    res.json({ success: true, subjects })
  } catch (err) {
    console.error('Error fetching grading subjects:', err)
    res.status(500).json({ error: 'Failed to fetch grading subjects' })
  }
})

// ── POST /api/grading/subjects ──
// Create a new grading subject with component weights
router.post('/subjects', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.body?.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    const gradeLevel = String(req.body?.gradeLevel || '').trim()
    const subjectName = String(req.body?.subjectName || '').trim()
    const subjectCode = String(req.body?.subjectCode || '').trim()
    const weightWw = parseInt(req.body?.weightWw ?? 30, 10)
    const weightPt = parseInt(req.body?.weightPt ?? 50, 10)
    const weightQa = parseInt(req.body?.weightQa ?? 20, 10)
    const displayOrder = parseInt(req.body?.displayOrder ?? 0, 10)

    if (!subjectName) {
      return res.status(400).json({ error: 'Subject name is required' })
    }

    if (weightWw < 0 || weightPt < 0 || weightQa < 0 || (weightWw + weightPt + weightQa) !== 100) {
      return res.status(400).json({
        error: `Assessment weights must total exactly 100% (currently ${weightWw + weightPt + weightQa}%)`
      })
    }

    const id = uuidv4()
    await run(
      `INSERT INTO grading_subjects (id, school_id, grade_level, subject_name, subject_code, weight_ww, weight_pt, weight_qa, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, schoolId, gradeLevel, subjectName, subjectCode, weightWw, weightPt, weightQa, displayOrder]
    )

    await audit(me, 'create_grading_subject', { type: 'subject', id, name: subjectName, schoolId }, `Created subject ${subjectName} (${gradeLevel})`)

    res.status(201).json({
      success: true,
      subject: {
        id,
        school_id: schoolId,
        grade_level: gradeLevel,
        subject_name: subjectName,
        subject_code: subjectCode,
        weight_ww: weightWw,
        weight_pt: weightPt,
        weight_qa: weightQa,
        display_order: displayOrder
      }
    })
  } catch (err) {
    console.error('Error creating grading subject:', err)
    res.status(500).json({ error: 'Failed to create grading subject' })
  }
})

// ── POST /api/grading/subjects/seed-defaults ──
// Populate standard DepEd K-12 learning areas for a grade level
router.post('/subjects/seed-defaults', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.body?.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    const gradeLevel = String(req.body?.gradeLevel || '').trim()

    if (!gradeLevel) {
      return res.status(400).json({ error: 'Grade level is required' })
    }

    // Check existing subjects for this school & grade
    const existing = await query(
      'SELECT subject_name FROM grading_subjects WHERE school_id = ? AND grade_level = ?',
      [schoolId, gradeLevel]
    )
    const existingNames = new Set(existing.map(s => s.subject_name.toLowerCase()))

    let inserted = 0
    for (let i = 0; i < DEPED_STANDARD_SUBJECTS.length; i++) {
      const def = DEPED_STANDARD_SUBJECTS[i]
      if (existingNames.has(def.name.toLowerCase())) continue

      const id = uuidv4()
      await run(
        `INSERT INTO grading_subjects (id, school_id, grade_level, subject_name, subject_code, weight_ww, weight_pt, weight_qa, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, schoolId, gradeLevel, def.name, def.code, def.ww, def.pt, def.qa, i + 1]
      )
      inserted++
    }

    await audit(me, 'seed_deped_subjects', { schoolId }, `Added ${inserted} DepEd standard subjects for ${gradeLevel}`)

    res.json({ success: true, count: inserted, message: `Added ${inserted} standard DepEd subjects` })
  } catch (err) {
    console.error('Error seeding DepEd subjects:', err)
    res.status(500).json({ error: 'Failed to seed standard subjects' })
  }
})

// ── PUT /api/grading/subjects/:id ──
// Update an existing grading subject
router.put('/subjects/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const id = req.params.id
    const rows = await query('SELECT * FROM grading_subjects WHERE id = ?', [id])
    if (!rows.length) {
      return res.status(404).json({ error: 'Subject not found' })
    }

    const current = rows[0]
    if (me.role !== 'superadmin' && current.school_id && current.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    const subjectName = req.body?.subjectName !== undefined ? String(req.body.subjectName).trim() : current.subject_name
    const subjectCode = req.body?.subjectCode !== undefined ? String(req.body.subjectCode).trim() : current.subject_code
    const gradeLevel = req.body?.gradeLevel !== undefined ? String(req.body.gradeLevel).trim() : current.grade_level
    const weightWw = req.body?.weightWw !== undefined ? parseInt(req.body.weightWw, 10) : current.weight_ww
    const weightPt = req.body?.weightPt !== undefined ? parseInt(req.body.weightPt, 10) : current.weight_pt
    const weightQa = req.body?.weightQa !== undefined ? parseInt(req.body.weightQa, 10) : current.weight_qa
    const displayOrder = req.body?.displayOrder !== undefined ? parseInt(req.body.displayOrder, 10) : current.display_order

    if (!subjectName) {
      return res.status(400).json({ error: 'Subject name cannot be empty' })
    }

    if (weightWw < 0 || weightPt < 0 || weightQa < 0 || (weightWw + weightPt + weightQa) !== 100) {
      return res.status(400).json({
        error: `Assessment weights must total exactly 100% (currently ${weightWw + weightPt + weightQa}%)`
      })
    }

    await run(
      `UPDATE grading_subjects SET
         subject_name = ?, subject_code = ?, grade_level = ?,
         weight_ww = ?, weight_pt = ?, weight_qa = ?, display_order = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [subjectName, subjectCode, gradeLevel, weightWw, weightPt, weightQa, displayOrder, id]
    )

    await audit(me, 'update_grading_subject', { type: 'subject', id, name: subjectName, schoolId: current.school_id }, `Updated subject ${subjectName}`)

    res.json({
      success: true,
      subject: {
        id,
        school_id: current.school_id,
        grade_level: gradeLevel,
        subject_name: subjectName,
        subject_code: subjectCode,
        weight_ww: weightWw,
        weight_pt: weightPt,
        weight_qa: weightQa,
        display_order: displayOrder
      }
    })
  } catch (err) {
    console.error('Error updating grading subject:', err)
    res.status(500).json({ error: 'Failed to update grading subject' })
  }
})

// ── DELETE /api/grading/subjects/:id ──
// Delete a grading subject (blocked if recorded grades exist)
router.delete('/subjects/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const id = req.params.id
    const rows = await query('SELECT * FROM grading_subjects WHERE id = ?', [id])
    if (!rows.length) {
      return res.status(404).json({ error: 'Subject not found' })
    }

    const current = rows[0]
    if (me.role !== 'superadmin' && current.school_id && current.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    // Check for learner grades
    const gradesCountRow = (await query('SELECT COUNT(*) as count FROM learner_grades WHERE subject_id = ?', [id]))[0]
    const gradeCount = Number(gradesCountRow?.count || 0)

    if (gradeCount > 0) {
      return res.status(400).json({
        error: `Cannot delete subject because ${gradeCount} recorded student grade(s) exist for it.`
      })
    }

    await run('DELETE FROM grading_subjects WHERE id = ?', [id])
    await audit(me, 'delete_grading_subject', { type: 'subject', id, name: current.subject_name, schoolId: current.school_id }, `Deleted subject ${current.subject_name}`)

    res.json({ success: true, message: 'Subject deleted successfully' })
  } catch (err) {
    console.error('Error deleting grading subject:', err)
    res.status(500).json({ error: 'Failed to delete grading subject' })
  }
})

// ── GET /api/grading/sheet ──
// Fetch class grade sheet with students and current quarterly scores
router.get('/sheet', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    const gradeLevel = String(req.query.gradeLevel || '').trim()
    const section = String(req.query.section || '').trim()
    const subjectId = String(req.query.subjectId || '').trim()
    const quarter = String(req.query.quarter || 'Q1').trim()
    const schoolYear = String(req.query.schoolYear || '').trim()

    if (!subjectId) {
      return res.status(400).json({ error: 'Subject ID is required' })
    }
    if (!gradeLevel || !section) {
      return res.status(400).json({ error: 'Grade level and section are required' })
    }

    // Teacher section check
    if (me.role === 'teacher' && me.section && me.section !== section) {
      // allow teachers to encode only if assigned or general school access
    }

    const subjectRows = await query('SELECT * FROM grading_subjects WHERE id = ?', [subjectId])
    if (!subjectRows.length) {
      return res.status(404).json({ error: 'Subject not found' })
    }
    const subject = subjectRows[0]

    // Fetch enrolled students
    const students = await query(
      `SELECT id, name, lrn, gender, enrollment_status
       FROM students
       WHERE school_id = ? AND grade = ? AND section = ?
       ORDER BY CASE WHEN gender = 'MALE' OR gender = 'Male' THEN 1 ELSE 2 END ASC, name ASC`,
      [schoolId, gradeLevel, section]
    )

    // Fetch existing grades
    let gradeQuery = 'SELECT * FROM learner_grades WHERE subject_id = ? AND quarter = ?'
    const gradeParams = [subjectId, quarter]
    if (schoolYear) {
      gradeQuery += ' AND school_year = ?'
      gradeParams.push(schoolYear)
    }

    const existingGrades = await query(gradeQuery, gradeParams)
    const gradeMap = new Map()
    for (const g of existingGrades) {
      gradeMap.set(g.student_id, g)
    }

    // Merge student list with existing scores or DepEd defaults
    const learners = students.map(st => {
      const g = gradeMap.get(st.id)
      return {
        id: st.id,
        name: st.name,
        lrn: st.lrn || '',
        gender: st.gender || '',
        enrollment_status: st.enrollment_status || 'active',
        ww_score: g ? Number(g.ww_score) : 0,
        ww_total: g ? Number(g.ww_total) : 100,
        pt_score: g ? Number(g.pt_score) : 0,
        pt_total: g ? Number(g.pt_total) : 100,
        qa_score: g ? Number(g.qa_score) : 0,
        qa_total: g ? Number(g.qa_total) : 50,
        initial_grade: g ? Number(g.initial_grade) : 0,
        transmuted_grade: g ? Number(g.transmuted_grade) : 0,
        remarks: g ? g.remarks : '',
        is_locked: g ? Number(g.is_locked) : 0
      }
    })

    res.json({
      success: true,
      subject,
      quarter,
      schoolYear,
      gradeLevel,
      section,
      students: learners
    })
  } catch (err) {
    console.error('Error fetching grade sheet:', err)
    res.status(500).json({ error: 'Failed to fetch grade sheet' })
  }
})

// ── POST /api/grading/sheet/save ──
// Save / batch upsert scores for learners with live transmutation
router.post('/sheet/save', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.body?.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    const subjectId = String(req.body?.subjectId || '').trim()
    const quarter = String(req.body?.quarter || 'Q1').trim()
    const schoolYear = String(req.body?.schoolYear || '').trim()
    const grades = Array.isArray(req.body?.grades) ? req.body.grades : []

    if (!subjectId) {
      return res.status(400).json({ error: 'Subject ID is required' })
    }

    const subjectRows = await query('SELECT * FROM grading_subjects WHERE id = ?', [subjectId])
    if (!subjectRows.length) {
      return res.status(404).json({ error: 'Subject not found' })
    }
    const subject = subjectRows[0]

    let savedCount = 0

    for (const item of grades) {
      const studentId = String(item.studentId || item.id || '').trim()
      if (!studentId) continue

      const wwScore = Math.max(0, Number(item.wwScore ?? item.ww_score) || 0)
      const wwTotal = Math.max(1, Number(item.wwTotal ?? item.ww_total) || 100)
      const ptScore = Math.max(0, Number(item.ptScore ?? item.pt_score) || 0)
      const ptTotal = Math.max(1, Number(item.ptTotal ?? item.pt_total) || 100)
      const qaScore = Math.max(0, Number(item.qaScore ?? item.qa_score) || 0)
      const qaTotal = Math.max(1, Number(item.qaTotal ?? item.qa_total) || 50)
      const isLocked = item.isLocked ? 1 : 0

      const initialGrade = calculateInitialGrade(
        wwScore, wwTotal, subject.weight_ww,
        ptScore, ptTotal, subject.weight_pt,
        qaScore, qaTotal, subject.weight_qa
      )
      const transmutedGrade = transmuteGrade(initialGrade)
      const remarks = transmutedGrade >= 75 ? 'Passed' : 'Failed'

      // Check existing row
      const existing = (await query(
        'SELECT id, is_locked FROM learner_grades WHERE student_id = ? AND subject_id = ? AND quarter = ? AND school_year = ?',
        [studentId, subjectId, quarter, schoolYear]
      ))[0]

      if (existing) {
        if (existing.is_locked && !['superadmin', 'admin'].includes(me.role)) {
          // Locked grade cannot be updated by teachers
          continue
        }
        await run(
          `UPDATE learner_grades SET
             ww_score = ?, ww_total = ?, pt_score = ?, pt_total = ?,
             qa_score = ?, qa_total = ?, initial_grade = ?, transmuted_grade = ?,
             remarks = ?, is_locked = ?, encoded_by = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [wwScore, wwTotal, ptScore, ptTotal, qaScore, qaTotal, initialGrade, transmutedGrade, remarks, isLocked, me.id || '', existing.id]
        )
      } else {
        const gradeId = uuidv4()
        await run(
          `INSERT INTO learner_grades
             (id, school_id, student_id, subject_id, school_year, quarter, ww_score, ww_total, pt_score, pt_total, qa_score, qa_total, initial_grade, transmuted_grade, remarks, is_locked, encoded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [gradeId, schoolId, studentId, subjectId, schoolYear, quarter, wwScore, wwTotal, ptScore, ptTotal, qaScore, qaTotal, initialGrade, transmutedGrade, remarks, isLocked, me.id || '']
        )
      }
      savedCount++
    }

    await audit(
      me,
      'save_grade_sheet',
      { type: 'subject', id: subjectId, name: subject.subject_name, schoolId },
      `Saved ${savedCount} grades for ${quarter} SY ${schoolYear}`
    )

    res.json({
      success: true,
      message: `Successfully saved ${savedCount} learner grade(s)`,
      count: savedCount
    })
  } catch (err) {
    console.error('Error saving grade sheet:', err)
    res.status(500).json({ error: 'Failed to save grade sheet' })
  }
})

// ── GET /api/grading/form138/:studentId ──
// Generate official DepEd Form 138 (SF9) Progress Report Card payload
router.get('/form138/:studentId', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const studentId = req.params.studentId
    const studentRows = await query('SELECT * FROM students WHERE id = ?', [studentId])
    if (!studentRows.length) {
      return res.status(404).json({ error: 'Student not found' })
    }
    const student = studentRows[0]

    if (me.role !== 'superadmin' && student.school_id && student.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    const schoolRows = await query('SELECT * FROM schools WHERE id = ?', [student.school_id])
    const school = schoolRows[0] || {}
    const quarterCount = Number(school.quarter_count) === 3 ? 3 : 4

    const adviserRows = await query(
      "SELECT name FROM users WHERE school_id = ? AND role = 'teacher' AND grade = ? AND section = ? LIMIT 1",
      [student.school_id, student.grade, student.section]
    )
    const adviserName = adviserRows[0]?.name || ''

    const schoolYear = String(req.query.schoolYear || school.school_year || '2025-2026').trim()

    // Fetch subjects for learner's grade
    const subjects = await query(
      'SELECT * FROM grading_subjects WHERE school_id = ? AND grade_level = ? ORDER BY display_order ASC, subject_name ASC',
      [student.school_id, student.grade]
    )

    // Fetch all grades for this student
    let gradesSql = 'SELECT * FROM learner_grades WHERE student_id = ?'
    const gradesParams = [studentId]
    if (schoolYear) {
      gradesSql += ' AND (school_year = ? OR school_year = "")'
      gradesParams.push(schoolYear)
    }
    const allGrades = await query(gradesSql, gradesParams)

    const gradeLookup = new Map()
    for (const g of allGrades) {
      gradeLookup.set(`${g.subject_id}_${g.quarter}`, g)
    }

    // Compile learning areas
    const learningAreas = []
    const allFinalGrades = []
    const allQuarterlyGrades = []

    for (const sub of subjects) {
      const q1Row = gradeLookup.get(`${sub.id}_Q1`)
      const q2Row = gradeLookup.get(`${sub.id}_Q2`)
      const q3Row = gradeLookup.get(`${sub.id}_Q3`)
      const q4Row = gradeLookup.get(`${sub.id}_Q4`)

      const q1 = q1Row ? Number(q1Row.transmuted_grade) : null
      const q2 = q2Row ? Number(q2Row.transmuted_grade) : null
      const q3 = q3Row ? Number(q3Row.transmuted_grade) : null
      const q4 = q4Row ? Number(q4Row.transmuted_grade) : null

      const quarterList = quarterCount === 3 ? [q1, q2, q3] : [q1, q2, q3, q4]
      quarterList.forEach(g => {
        if (g !== null) allQuarterlyGrades.push(g)
      })

      const availableQuarters = quarterList.filter(v => v !== null)
      let finalRating = null
      let remarks = ''

      if (availableQuarters.length > 0) {
        finalRating = Math.round(availableQuarters.reduce((acc, curr) => acc + curr, 0) / availableQuarters.length)
        remarks = finalRating >= 75 ? 'Passed' : 'Failed'
        allFinalGrades.push(finalRating)
      }

      learningAreas.push({
        subjectId: sub.id,
        subjectName: sub.subject_name,
        subjectCode: sub.subject_code,
        q1,
        q2,
        q3,
        q4: quarterCount === 3 ? null : q4,
        finalRating,
        remarks
      })
    }

    // General Average
    const generalAverage = allFinalGrades.length > 0
      ? Math.round(allFinalGrades.reduce((acc, curr) => acc + curr, 0) / allFinalGrades.length)
      : null

    const proficiencyLevel = generalAverage !== null ? getProficiencyLevel(generalAverage) : ''
    const honors = generalAverage !== null
      ? determineHonors(generalAverage, allQuarterlyGrades)
      : { status: '', honorTitle: null }

    // Attendance Summary (10 DepEd standard school months)
    const monthNames = [
      { month: 8, name: 'Aug' },
      { month: 9, name: 'Sep' },
      { month: 10, name: 'Oct' },
      { month: 11, name: 'Nov' },
      { month: 12, name: 'Dec' },
      { month: 1, name: 'Jan' },
      { month: 2, name: 'Feb' },
      { month: 3, name: 'Mar' },
      { month: 4, name: 'Apr' },
      { month: 5, name: 'May' }
    ]

    // Fetch monthly records and entries for this student
    const monthlyData = await query(
      `SELECT mr.month, mr.year, mr.summary_data, me.present, me.absent, me.tardy
       FROM monthly_records mr
       JOIN monthly_entries me ON me.record_id = mr.id
       WHERE mr.school_id = ? AND me.student_id = ?`,
      [student.school_id, student.id]
    )

    const monthlyMap = new Map()
    for (const m of monthlyData) {
      monthlyMap.set(Number(m.month), m)
    }

    const attendanceSummary = monthNames.map(m => {
      const rec = monthlyMap.get(m.month)
      let schoolDays = 21 // standard default school days per month
      if (rec?.summary_data) {
        try {
          const parsed = JSON.parse(rec.summary_data)
          if (parsed.schoolDays) schoolDays = Number(parsed.schoolDays)
        } catch {}
      }
      const daysPresent = rec ? Number(rec.present || 0) : null
      const daysAbsent = rec ? Number(rec.absent || 0) : null
      const timesTardy = rec ? Number(rec.tardy || 0) : null

      return {
        month: m.month,
        monthName: m.name,
        schoolDays,
        daysPresent: daysPresent !== null ? daysPresent : '-',
        daysAbsent: daysAbsent !== null ? daysAbsent : '-',
        timesTardy: timesTardy !== null ? timesTardy : '-'
      }
    })

    // Totals for attendance
    const totalSchoolDays = attendanceSummary.reduce((acc, curr) => acc + (typeof curr.schoolDays === 'number' ? curr.schoolDays : 0), 0)
    const validPresents = attendanceSummary.filter(a => typeof a.daysPresent === 'number')
    const totalPresent = validPresents.length > 0 ? validPresents.reduce((acc, curr) => acc + curr.daysPresent, 0) : '-'
    const validAbsents = attendanceSummary.filter(a => typeof a.daysAbsent === 'number')
    const totalAbsent = validAbsents.length > 0 ? validAbsents.reduce((acc, curr) => acc + curr.daysAbsent, 0) : '-'

    // DepEd Core Values
    const cvRatings = quarterCount === 3 ? ['AO', 'AO', 'AO'] : ['AO', 'AO', 'AO', 'AO']
    const coreValues = [
      {
        coreValue: '1. Maka-Diyos',
        behaviorStatements: [
          'Expresses one’s spiritual beliefs while respecting others',
          'Shows adherence to ethical and moral principles'
        ],
        ratings: [...cvRatings]
      },
      {
        coreValue: '2. Makatao',
        behaviorStatements: [
          'Is sensitive to individual, social, and cultural differences',
          'Demonstrates solidarity and works collaboratively'
        ],
        ratings: [...cvRatings]
      },
      {
        coreValue: '3. Makakalikasan',
        behaviorStatements: [
          'Cares for the environment and utilizes resources prudently'
        ],
        ratings: [...cvRatings]
      },
      {
        coreValue: '4. Makabansa',
        behaviorStatements: [
          'Demonstrates pride in being a Filipino',
          'Exercises civic rights and responsibilities'
        ],
        ratings: [...cvRatings]
      }
    ]

    res.json({
      success: true,
      student,
      school,
      quarterCount,
      schoolYear,
      adviserName,
      principalName: school.principal_name || '',
      subjects: learningAreas,
      learningAreas,
      generalAverage,
      proficiencyLevel,
      honors,
      attendanceSummary: {
        months: attendanceSummary,
        totalSchoolDays,
        totalPresent,
        totalAbsent
      },
      coreValues
    })
  } catch (err) {
    console.error('Error generating Form 138 report:', err)
    res.status(500).json({ error: 'Failed to generate Form 138 report' })
  }
})

// ── POST /api/grading/form138/:studentId/save ──
// Save quarterly grades directly from the Form 138 report card table
router.post('/form138/:studentId/save', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const studentId = req.params.studentId
    const studentRows = await query('SELECT * FROM students WHERE id = ?', [studentId])
    if (!studentRows.length) return res.status(404).json({ error: 'Student not found' })
    const student = studentRows[0]

    if (me.role !== 'superadmin' && student.school_id && student.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }

    const schoolRows = await query('SELECT * FROM schools WHERE id = ?', [student.school_id])
    const school = schoolRows[0] || {}
    const quarterCount = Number(school.quarter_count) === 3 ? 3 : 4

    const schoolYear = String(req.body?.schoolYear || student.school_year || '2026-2027').trim()
    const gradesList = Array.isArray(req.body?.grades) ? req.body.grades : []

    let updatedCount = 0

    for (const item of gradesList) {
      const subjectId = String(item.subjectId || item.id || '').trim()
      if (!subjectId) continue

      const quarters = quarterCount === 3 ? ['Q1', 'Q2', 'Q3'] : ['Q1', 'Q2', 'Q3', 'Q4']
      for (const q of quarters) {
        const key = q.toLowerCase()
        const rawVal = item[key]
        if (rawVal === undefined || rawVal === null || rawVal === '') continue

        const numVal = Math.min(100, Math.max(60, Math.round(Number(rawVal))))
        if (isNaN(numVal)) continue

        const remarks = numVal >= 75 ? 'Passed' : 'Failed'

        const existing = (await query(
          'SELECT id, is_locked FROM learner_grades WHERE student_id = ? AND subject_id = ? AND quarter = ? AND school_year = ?',
          [studentId, subjectId, q, schoolYear]
        ))[0]

        if (existing) {
          if (existing.is_locked && !['superadmin', 'admin'].includes(me.role)) continue
          await run(
            `UPDATE learner_grades SET
               initial_grade = ?, transmuted_grade = ?, remarks = ?, encoded_by = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [numVal, numVal, remarks, me.id || '', existing.id]
          )
          updatedCount++
        } else {
          const id = 'lg-' + uuidv4()
          await run(
            `INSERT INTO learner_grades
               (id, school_id, student_id, subject_id, school_year, quarter,
                ww_score, ww_total, pt_score, pt_total, qa_score, qa_total,
                initial_grade, transmuted_grade, remarks, is_locked, encoded_by)
             VALUES (?, ?, ?, ?, ?, ?, 0, 100, 0, 100, 0, 50, ?, ?, ?, 0, ?)`,
            [id, student.school_id || me.school_id || '', studentId, subjectId, schoolYear, q, numVal, numVal, remarks, me.id || '']
          )
          updatedCount++
        }
      }
    }

    res.json({ success: true, updatedCount })
  } catch (err) {
    console.error('Error saving Form 138 card grades:', err.message)
    res.status(500).json({ error: 'Failed to save card grades: ' + err.message })
  }
})

// ── GET /api/grading/analytics ──
// Class- and school-level grade distribution, passing rates, and honors
router.get('/analytics', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const schoolId = scope.schoolId || ''
    const gradeLevel = String(req.query.gradeLevel || '').trim()
    const quarter = String(req.query.quarter || 'Q1').trim()
    const schoolYear = String(req.query.schoolYear || '').trim()

    let sql = `
      SELECT lg.*, st.name as student_name, st.gender, gs.subject_name
      FROM learner_grades lg
      JOIN students st ON st.id = lg.student_id
      JOIN grading_subjects gs ON gs.id = lg.subject_id
      WHERE 1=1
    `
    const params = []
    if (schoolId) {
      sql += ' AND lg.school_id = ?'
      params.push(schoolId)
    }
    if (quarter) {
      sql += ' AND lg.quarter = ?'
      params.push(quarter)
    }
    if (schoolYear) {
      sql += ' AND (lg.school_year = ? OR lg.school_year = "")'
      params.push(schoolYear)
    }
    if (gradeLevel) {
      sql += ' AND gs.grade_level = ?'
      params.push(gradeLevel)
    }

    const rows = await query(sql, params)

    const distribution = {
      outstanding: 0,        // 90 - 100
      verySatisfactory: 0,   // 85 - 89
      satisfactory: 0,       // 80 - 84
      fairlySatisfactory: 0, // 75 - 79
      didNotMeet: 0          // below 75
    }

    let totalGrades = rows.length
    let totalScore = 0
    let passedCount = 0

    // Group by student for honor calculations
    const studentGradesMap = new Map()

    for (const r of rows) {
      const g = Number(r.transmuted_grade) || 0
      totalScore += g
      if (g >= 75) passedCount++

      if (g >= 90) distribution.outstanding++
      else if (g >= 85) distribution.verySatisfactory++
      else if (g >= 80) distribution.satisfactory++
      else if (g >= 75) distribution.fairlySatisfactory++
      else distribution.didNotMeet++

      if (!studentGradesMap.has(r.student_id)) {
        studentGradesMap.set(r.student_id, {
          name: r.student_name,
          gender: r.gender,
          grades: []
        })
      }
      studentGradesMap.get(r.student_id).grades.push(g)
    }

    // Determine honor roll candidates
    const honorRoll = []
    for (const [sId, sData] of studentGradesMap.entries()) {
      if (sData.grades.length === 0) continue
      const avg = Math.round(sData.grades.reduce((a, b) => a + b, 0) / sData.grades.length)
      const honor = determineHonors(avg, sData.grades)
      if (honor.honorTitle) {
        honorRoll.push({
          studentId: sId,
          name: sData.name,
          gender: sData.gender,
          average: avg,
          honorTitle: honor.honorTitle
        })
      }
    }

    honorRoll.sort((a, b) => b.average - a.average)

    res.json({
      success: true,
      totalGradesEvaluated: totalGrades,
      averageGrade: totalGrades > 0 ? Math.round((totalScore / totalGrades) * 10) / 10 : 0,
      passingRate: totalGrades > 0 ? Math.round((passedCount / totalGrades) * 1000) / 10 : 0,
      distribution,
      honorCandidatesCount: honorRoll.length,
      honorRoll
    })
  } catch (err) {
    console.error('Error fetching grading analytics:', err)
    res.status(500).json({ error: 'Failed to fetch grading analytics' })
  }
})

export default router
