import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, withTransaction } from '../db.js'
import { requireRole, resolveScopeSchool, audit, getSchoolLicense } from './_context.js'

const router = Router()

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function attendanceEntryMetrics(entry) {
  const periods = [entry.am1, entry.am2, entry.am3, entry.am4, entry.am5, entry.am6, entry.pm1, entry.pm2, entry.pm3, entry.pm4]
    .map(value => String(value || '').trim().toUpperCase())
    .filter(Boolean)
  const absentCodes = new Set(['A', 'A/S', 'U'])
  const isAbsent = periods.length === 0 || periods.every(code => absentCodes.has(code))
  const isTardy = periods.some(code => code === 'T' || code === 'E/T')
  return { isAbsent, isTardy }
}

function schoolYearParts(value) {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{4})$/)
  if (!match) return null
  return { start: Number(match[1]), end: Number(match[2]) }
}

// ── Database-backed school-year options ──

router.get('/school-years', async (req, res) => {
  try {
    const { error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const params = []
    const schoolCondition = scope.schoolId ? 'WHERE school_id = ?' : ''
    if (scope.schoolId) params.push(scope.schoolId)
    const rows = await query(`SELECT DISTINCT year FROM monthly_records ${schoolCondition} ORDER BY year DESC`, params)
    const years = new Set()
    for (const row of rows) {
      const year = Number(row.year)
      if (!Number.isFinite(year)) continue
      years.add(`${year}-${year + 1}`)
      years.add(`${year - 1}-${year}`)
    }

    const schoolParams = scope.schoolId ? [scope.schoolId] : []
    const schoolRows = await query(`SELECT school_year FROM schools ${scope.schoolId ? 'WHERE id = ?' : ''}`, schoolParams)
    schoolRows.forEach(row => {
      if (row.school_year) years.add(String(row.school_year).trim())
    })
    res.json([...years].filter(Boolean).sort((a, b) => b.localeCompare(a)))
  } catch (err) {
    console.error('Failed to load report school years:', err.message)
    res.status(500).json({ error: 'Failed to load report school years' })
  }
})

// ── Saved Report Views ──

router.get('/saved-views', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const reportType = String(req.query.reportType || '').trim()
    const conditions = []
    const params = []
    if (scope.schoolId) {
      conditions.push('(user_id = ? OR school_id = ?)')
      params.push(me.id, scope.schoolId)
    } else {
      conditions.push('(user_id = ? OR school_id IN (SELECT id FROM schools))')
      params.push(me.id)
    }

    if (reportType) {
      conditions.push('report_type = ?')
      params.push(reportType)
    }

    const rows = await query(`
      SELECT * FROM saved_report_views
      WHERE ${conditions.join(' AND ')}
      ORDER BY updated_at DESC, name ASC
    `, params)

    const parsed = rows.map(r => {
      let filters = {}
      try { filters = JSON.parse(r.filters_json || '{}') } catch {}
      return {
        id: r.id,
        schoolId: r.school_id,
        userId: r.user_id,
        name: r.name,
        reportType: r.report_type,
        filters,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }
    })

    res.json(parsed)
  } catch (err) {
    console.error('Failed to load saved views:', err.message)
    res.status(500).json({ error: 'Failed to load saved views' })
  }
})

router.post('/saved-views', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.body.schoolId)
    if (!scope) return

    const { name, reportType, filters } = req.body || {}
    const cleanName = String(name || '').trim()
    if (!cleanName) return res.status(400).json({ error: 'View name is required' })

    const id = 'view-' + uuidv4()
    const type = String(reportType || 'dashboard').trim()
    const filtersJson = JSON.stringify(filters || {})

    await run(`
      INSERT INTO saved_report_views (id, school_id, user_id, name, report_type, filters_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, scope.schoolId || me.school_id || '', me.id, cleanName, type, filtersJson])

    await audit(me, 'report.save_view', { type: 'report_view', id, name: cleanName, schoolId: scope.schoolId }, `Saved report view "${cleanName}" (${type})`)

    res.status(201).json({
      id,
      schoolId: scope.schoolId || me.school_id || '',
      userId: me.id,
      name: cleanName,
      reportType: type,
      filters: filters || {}
    })
  } catch (err) {
    console.error('Failed to save report view:', err.message)
    res.status(500).json({ error: 'Failed to save report view' })
  }
})

router.delete('/saved-views/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const existing = await query('SELECT * FROM saved_report_views WHERE id = ?', [req.params.id])
    if (!existing.length) return res.status(404).json({ error: 'Saved view not found' })

    const view = existing[0]
    if (me.role !== 'superadmin' && view.user_id !== me.id && view.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await run('DELETE FROM saved_report_views WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Saved view removed' })
  } catch (err) {
    console.error('Failed to delete saved view:', err.message)
    res.status(500).json({ error: 'Failed to delete saved view' })
  }
})

// ── Section Comparison Report Helper ──

async function computeSectionComparison(sid, { grade, section, month, year, startDate, endDate }) {
  // 1. Get all active sections and teachers
  let teacherFilter = sid ? "WHERE role = 'teacher' AND school_id = ?" : "WHERE role = 'teacher'"
  const teacherRows = await query(`SELECT id, name, grade, section, school_id FROM users ${teacherFilter}`, sid ? [sid] : [])
  const adviserMap = {}
  teacherRows.forEach(t => {
    if (t.grade && t.section) adviserMap[`${t.school_id || ''}::${t.grade}__${t.section}`] = t.name
  })

  // 2. Query students grouped by school and section
  let studentSql = `
    SELECT school_id, grade, section,
      COUNT(*) as total,
      SUM(CASE WHEN LOWER(gender) = 'male' THEN 1 ELSE 0 END) as male,
      SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END) as female
    FROM students
    WHERE COALESCE(enrollment_status, 'active') = 'active'
    ${sid ? 'AND school_id = ?' : ''}
    ${grade ? 'AND grade = ?' : ''}
    ${section ? 'AND section = ?' : ''}
    GROUP BY school_id, grade, section
    ORDER BY school_id, grade, section
  `
  const studentParams = []
  if (sid) studentParams.push(sid)
  if (grade) studentParams.push(grade)
  if (section) studentParams.push(section)
  const sectionRosters = await query(studentSql, studentParams)

  // 3. Query attendance metrics
  let sectionAttendanceMap = new Map()

  if (startDate && endDate) {
    // Date-range filtered via attendance_records & attendance_entries
    const recs = await query(`
      SELECT id, school_id, grade, section, date FROM attendance_records
      WHERE date >= ? AND date <= ?
      ${sid ? 'AND school_id = ?' : ''}
      ${grade ? 'AND grade = ?' : ''}
      ${section ? 'AND section = ?' : ''}
    `, [startDate, endDate, ...(sid ? [sid] : []), ...(grade ? [grade] : []), ...(section ? [section] : [])])

    if (recs.length) {
      const inPlaceholders = recs.map(() => '?').join(',')
      const entries = await query(
        `SELECT record_id, am1, am2, am3, am4, am5, am6, pm1, pm2, pm3, pm4 FROM attendance_entries WHERE record_id IN (${inPlaceholders})`,
        recs.map(r => r.id)
      )
      const recMap = new Map(recs.map(r => [r.id, r]))
      for (const e of entries) {
        const r = recMap.get(e.record_id)
        if (!r) continue
        const key = `${r.school_id || ''}::${r.grade}__${r.section}`
        if (!sectionAttendanceMap.has(key)) {
          sectionAttendanceMap.set(key, { present: 0, absent: 0, tardy: 0, sessions: new Set() })
        }
        const item = sectionAttendanceMap.get(key)
        item.sessions.add(r.date)
        const { isAbsent, isTardy } = attendanceEntryMetrics(e)
        if (isAbsent) item.absent++
        else item.present++
        if (isTardy) item.tardy++
      }
    }
  } else {
    // Monthly records query
    let mConditions = []
    let mParams = []
    if (sid) { mConditions.push('mr.school_id = ?'); mParams.push(sid) }
    if (grade) { mConditions.push('mr.grade = ?'); mParams.push(grade) }
    if (section) { mConditions.push('mr.section = ?'); mParams.push(section) }
    if (month) { mConditions.push('mr.month = ?'); mParams.push(parseInt(month, 10)) }
    if (year) { mConditions.push('mr.year = ?'); mParams.push(parseInt(year, 10)) }

    const mWhere = mConditions.length ? 'WHERE ' + mConditions.join(' AND ') : ''
    const attRows = await query(`
      SELECT mr.school_id, mr.grade, mr.section,
        COALESCE(SUM(me.present), 0) as present,
        COALESCE(SUM(me.absent), 0) as absent,
        COALESCE(SUM(me.tardy), 0) as tardy,
        COUNT(DISTINCT mr.id) as records_count
      FROM monthly_entries me
      JOIN monthly_records mr ON mr.id = me.record_id
      ${mWhere}
      GROUP BY mr.school_id, mr.grade, mr.section
    `, mParams)

    attRows.forEach(r => {
      sectionAttendanceMap.set(`${r.school_id || ''}::${r.grade}__${r.section}`, {
        present: Number(r.present),
        absent: Number(r.absent),
        tardy: Number(r.tardy),
        sessionsCount: Number(r.records_count)
      })
    })

    // Also supplement from daily attendance_records for sections that have daily entries
    // but no monthly record generated yet. Use the same period interpretation as the
    // date-range path instead of counting only am1.
    const dailyRows = await query(`
      SELECT ar.school_id, ar.grade, ar.section, ar.date,
        ae.am1, ae.am2, ae.am3, ae.am4, ae.am5, ae.am6,
        ae.pm1, ae.pm2, ae.pm3, ae.pm4
      FROM attendance_records ar
      JOIN attendance_entries ae ON ae.record_id = ar.id
      WHERE 1=1
      ${sid ? 'AND ar.school_id = ?' : ''}
      ${grade ? 'AND ar.grade = ?' : ''}
      ${section ? 'AND ar.section = ?' : ''}
    `, [ ...(sid ? [sid] : []), ...(grade ? [grade] : []), ...(section ? [section] : []) ])

    const dailyMap = new Map()
    dailyRows.forEach(row => {
      const key = `${row.school_id || ''}::${row.grade}__${row.section}`
      if (!dailyMap.has(key)) dailyMap.set(key, { present: 0, absent: 0, tardy: 0, sessions: new Set() })
      const item = dailyMap.get(key)
      item.sessions.add(row.date)
      const { isAbsent, isTardy } = attendanceEntryMetrics(row)
      if (isAbsent) item.absent++
      else item.present++
      if (isTardy) item.tardy++
    })

    dailyMap.forEach((item, key) => {
      if (!sectionAttendanceMap.has(key)) {
        sectionAttendanceMap.set(key, {
          present: item.present,
          absent: item.absent,
          tardy: item.tardy,
          sessionsCount: item.sessions.size
        })
      }
    })
  }

  // 4. SARDO Chronic Absence Alerts per section
  let sardoCumulative = 5
  if (sid) {
    try {
      const sRows = await query('SELECT sardo_cumulative_absences FROM schools WHERE id = ?', [sid])
      if (sRows[0]?.sardo_cumulative_absences) sardoCumulative = Number(sRows[0].sardo_cumulative_absences)
    } catch {}
  }

  const sardoConditions = []
  const sardoParams = []
  if (sid) { sardoConditions.push('mr.school_id = ?'); sardoParams.push(sid) }
  if (grade) { sardoConditions.push('mr.grade = ?'); sardoParams.push(grade) }
  if (section) { sardoConditions.push('mr.section = ?'); sardoParams.push(section) }
  sardoParams.push(sardoCumulative)
  const sardoRows = await query(`
    SELECT mr.school_id, mr.grade, mr.section, COUNT(DISTINCT me.student_id) as alert_count
    FROM monthly_entries me
    JOIN monthly_records mr ON mr.id = me.record_id
    ${sardoConditions.length ? 'WHERE ' + sardoConditions.join(' AND ') : ''}
    GROUP BY mr.school_id, mr.grade, mr.section, me.student_id
    HAVING SUM(me.absent) >= ?
  `, sardoParams)

  const sardoMap = {}
  sardoRows.forEach(s => {
    const k = `${s.school_id || ''}::${s.grade}__${s.section}`
    sardoMap[k] = (sardoMap[k] || 0) + 1
  })

  // 5. Combine and calculate rankings
  const sections = sectionRosters.map(sec => {
    const key = `${sec.school_id || ''}::${sec.grade}__${sec.section}`
    const att = sectionAttendanceMap.get(key) || { present: 0, absent: 0, tardy: 0 }
    const totalLogged = att.present + att.absent
    const rate = totalLogged > 0 ? Number(((att.present / totalLogged) * 100).toFixed(1)) : 0
    const sessions = att.sessions ? att.sessions.size : (att.sessionsCount || 0)

    return {
      schoolId: sec.school_id || null,
      grade: sec.grade,
      section: sec.section,
      adviser: adviserMap[key] || 'Unassigned',
      enrolled: sec.total,
      male: sec.male,
      female: sec.female,
      sessionsCount: sessions,
      present: att.present,
      absent: att.absent,
      tardy: att.tardy,
      attendanceRate: rate,
      sardoAlerts: sardoMap[key] || 0
    }
  })

  // Sort descending by attendance rate
  sections.sort((a, b) => b.attendanceRate - a.attendanceRate || b.enrolled - a.enrolled)

  // Assign ranking
  sections.forEach((s, idx) => {
    s.rank = idx + 1
  })

  // Campus-wide aggregates
  const totalEnrolled = sections.reduce((acc, s) => acc + s.enrolled, 0)
  const totalPresent = sections.reduce((acc, s) => acc + s.present, 0)
  const totalAbsent = sections.reduce((acc, s) => acc + s.absent, 0)
  const totalTardy = sections.reduce((acc, s) => acc + s.tardy, 0)
  const overallRate = (totalPresent + totalAbsent) > 0
    ? Number(((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(1))
    : 0

  return {
    schoolId: sid,
    period: { startDate: startDate || null, endDate: endDate || null, month: month || null, year: year || null },
    summary: {
      totalSections: sections.length,
      totalEnrolled,
      totalPresent,
      totalAbsent,
      totalTardy,
      overallAttendanceRate: overallRate,
      depedStandardRate: 95
    },
    sections
  }
}

// ── Quarterly DepEd Consolidation Summary Helper ──

async function computeQuarterlySummary(sid, { quarter, schoolYear, grade, section }) {
  const q = parseInt(quarter, 10) || 1
  const sy = String(schoolYear || '').trim()
  const syParts = schoolYearParts(sy)
  const effectiveSchoolYear = syParts ? sy : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  const effectiveParts = schoolYearParts(effectiveSchoolYear)
  const quarterMonthMap = {
    1: [8, 9, 10],
    2: [11, 12, 1],
    3: [2, 3],
    4: [4, 5]
  }
  const months = quarterMonthMap[q] || [8, 9, 10]
  const monthYearPairs = months.map(month => {
    const recordYear = month >= 8 ? effectiveParts.start : effectiveParts.end
    return { month, year: recordYear }
  })

  // 1. Fetch monthly records matching both month and academic year.
  const monthYearWhere = monthYearPairs.map(() => '(mr.month = ? AND mr.year = ?)').join(' OR ')
  const recParams = monthYearPairs.flatMap(pair => [pair.month, pair.year])
  let recSql = `
    SELECT mr.*
    FROM monthly_records mr
    WHERE (${monthYearWhere})
  `
  if (sid) { recSql += ' AND mr.school_id = ?'; recParams.push(sid) }
  if (grade) { recSql += ' AND mr.grade = ?'; recParams.push(grade) }
  if (section) { recSql += ' AND mr.section = ?'; recParams.push(section) }
  recSql += ' ORDER BY mr.grade, mr.section, mr.year, mr.month'

  const records = await query(recSql, recParams)
  const recordIds = records.map(r => r.id)
  let entries = []
  if (recordIds.length) {
    const inPlaceholders = recordIds.map(() => '?').join(',')
    entries = await query(`
      SELECT me.*, s.gender
      FROM monthly_entries me
      LEFT JOIN students s ON s.id = me.student_id
      WHERE me.record_id IN (${inPlaceholders})
    `, recordIds)
  }

  const entriesByRecord = new Map()
  entries.forEach(e => {
    if (!entriesByRecord.has(e.record_id)) entriesByRecord.set(e.record_id, [])
    entriesByRecord.get(e.record_id).push(e)
  })

  // 2. Group records by Grade & Section
  const classGroups = new Map()
  for (const r of records) {
    const key = `${r.school_id || ''}::${r.grade}__${r.section}`
    if (!classGroups.has(key)) {
      classGroups.set(key, {
        schoolId: r.school_id || null,
        grade: r.grade,
        section: r.section,
        adviser: r.adviser,
        schoolHead: r.school_head,
        records: []
      })
    }
    classGroups.get(key).records.push(r)
  }

  // 3. Also include all active sections from students so every class is tracked
  let studentSql = `
    SELECT school_id, grade, section,
      COUNT(*) as total,
      SUM(CASE WHEN LOWER(gender) = 'male' THEN 1 ELSE 0 END) as male,
      SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END) as female
    FROM students
    WHERE COALESCE(enrollment_status, 'active') = 'active'
    ${sid ? 'AND school_id = ?' : ''}
    ${grade ? 'AND grade = ?' : ''}
    ${section ? 'AND section = ?' : ''}
    GROUP BY school_id, grade, section
    ORDER BY school_id, grade, section
  `
  const sParams = []
  if (sid) sParams.push(sid)
  if (grade) sParams.push(grade)
  if (section) sParams.push(section)

  const allSections = await query(studentSql, sParams)
  const teacherRows = await query(`SELECT name, grade, section, school_id FROM users WHERE role = 'teacher' ${sid ? 'AND school_id = ?' : ''}`, sid ? [sid] : [])
  const adviserMap = {}
  teacherRows.forEach(t => { if (t.grade && t.section) adviserMap[`${t.school_id || ''}::${t.grade}__${t.section}`] = t.name })

  for (const s of allSections) {
    const key = `${s.school_id || ''}::${s.grade}__${s.section}`
    if (!classGroups.has(key)) {
      classGroups.set(key, {
        schoolId: s.school_id || null,
        grade: s.grade,
        section: s.section,
        adviser: adviserMap[key] || 'Unassigned',
        schoolHead: '',
        records: [],
        rosterTotals: { male: s.male, female: s.female, total: s.total }
      })
    }
  }

  // Calculate quarterly metrics per section
  const sectionSummaries = []
  let grandMaleEnrolled = 0
  let grandFemaleEnrolled = 0
  let grandTotalEnrolled = 0
  let grandMaleADA = 0
  let grandFemaleADA = 0
  let grandTotalADA = 0
  let grandDays = 0

  for (const [key, group] of classGroups.entries()) {
    let qTotalDays = 0
    let qMalePresent = 0
    let qFemalePresent = 0
    let qMaleAbsent = 0
    let qFemaleAbsent = 0
    const activeMaleLearners = new Set()
    const activeFemaleLearners = new Set()

    for (const rec of group.records) {
      const recEntries = entriesByRecord.get(rec.id) || []
      let parsedSummary = {}
      try { parsedSummary = JSON.parse(rec.summary_data || '{}') } catch {}

      let numDays = parsedSummary.num_school_days || 0
      if (!numDays && parsedSummary.date_cols) numDays = parsedSummary.date_cols.length
      if (!numDays) numDays = 20
      qTotalDays += numDays

      for (const e of recEntries) {
        const isFemale = String(e.gender || '').toLowerCase() === 'female'
        if (isFemale) {
          activeFemaleLearners.add(e.student_id)
          qFemalePresent += Number(e.present || 0)
          qFemaleAbsent += Number(e.absent || 0)
        } else {
          activeMaleLearners.add(e.student_id)
          qMalePresent += Number(e.present || 0)
          qMaleAbsent += Number(e.absent || 0)
        }
      }
    }

    let mCount = activeMaleLearners.size
    let fCount = activeFemaleLearners.size
    if (mCount === 0 && fCount === 0 && group.rosterTotals) {
      mCount = group.rosterTotals.male
      fCount = group.rosterTotals.female
    }
    const tCount = mCount + fCount

    const mADA = qTotalDays > 0 ? Number((qMalePresent / qTotalDays).toFixed(2)) : 0
    const fADA = qTotalDays > 0 ? Number((qFemalePresent / qTotalDays).toFixed(2)) : 0
    const tADA = Number((mADA + fADA).toFixed(2))

    const mRate = (qMalePresent + qMaleAbsent) > 0 ? Number(((qMalePresent / (qMalePresent + qMaleAbsent)) * 100).toFixed(1)) : 0
    const fRate = (qFemalePresent + qFemaleAbsent) > 0 ? Number(((qFemalePresent / (qFemalePresent + qFemaleAbsent)) * 100).toFixed(1)) : 0
    const tRate = (qMalePresent + qFemalePresent + qMaleAbsent + qFemaleAbsent) > 0
      ? Number((((qMalePresent + qFemalePresent) / (qMalePresent + qFemalePresent + qMaleAbsent + qFemaleAbsent)) * 100).toFixed(1))
      : 0

    grandMaleEnrolled += mCount
    grandFemaleEnrolled += fCount
    grandTotalEnrolled += tCount
    grandMaleADA += mADA
    grandFemaleADA += fADA
    grandTotalADA += tADA
    grandDays = Math.max(grandDays, qTotalDays)

    sectionSummaries.push({
      schoolId: group.schoolId || null,
      grade: group.grade,
      section: group.section,
      adviser: group.adviser || adviserMap[key] || 'Unassigned',
      schoolDays: qTotalDays,
      enrolment: { male: mCount, female: fCount, total: tCount },
      ada: { male: mADA, female: fADA, total: tADA },
      attendanceRate: { male: mRate, female: fRate, total: tRate }
    })
  }

  const overallAttRate = grandTotalEnrolled > 0 && grandDays > 0
    ? Number(((grandTotalADA / grandTotalEnrolled) * 100).toFixed(1))
    : (sectionSummaries.length > 0
        ? Number((sectionSummaries.reduce((acc, s) => acc + s.attendanceRate.total, 0) / sectionSummaries.length).toFixed(1))
        : 0)

  return {
    schoolId: sid,
    quarter: q,
    schoolYear: effectiveSchoolYear,
    monthsIncluded: months.map(m => MONTH_NAMES[m]),
    grandTotal: {
      totalEnrolled: grandTotalEnrolled,
      maleEnrolled: grandMaleEnrolled,
      femaleEnrolled: grandFemaleEnrolled,
      ada: {
        male: Number(grandMaleADA.toFixed(2)),
        female: Number(grandFemaleADA.toFixed(2)),
        total: Number(grandTotalADA.toFixed(2))
      },
      attendanceRate: overallAttRate,
      schoolDays: grandDays
    },
    sections: sectionSummaries
  }
}

// ── Section Comparison Report ──

router.get('/section-comparison', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const report = await computeSectionComparison(scope.schoolId, req.query)
    res.json(report)
  } catch (err) {
    console.error('Failed to generate section comparison report:', err.message)
    res.status(500).json({ error: 'Failed to generate section comparison report' })
  }
})

// ── Quarterly DepEd Consolidation Summary ──

router.get('/quarterly-summary', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const report = await computeQuarterlySummary(scope.schoolId, req.query)
    res.json(report)
  } catch (err) {
    console.error('Failed to generate quarterly summary report:', err.message)
    res.status(500).json({ error: 'Failed to generate quarterly summary report' })
  }
})

// ── Export Formatted CSV ──

router.get('/export/csv', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const reportType = String(req.query.type || 'section_comparison').trim()
    const sid = scope.schoolId

    let csvContent = ''
    let filename = `elytrack-report-${reportType}-${Date.now()}.csv`

    if (reportType === 'section_comparison') {
      filename = `section-comparison-${new Date().toISOString().slice(0, 10)}.csv`
      const rep = await computeSectionComparison(sid, req.query)
      const headers = ['Rank', 'Grade', 'Section', 'Class Adviser', 'Total Learners', 'Male', 'Female', 'Present', 'Absent', 'Attendance %', 'SARDO Alerts', 'DepEd Compliance Status']
      const rows = (rep.sections || []).map(s => [
        s.rank,
        `"${s.grade}"`,
        `"${s.section}"`,
        `"${s.adviser || 'Unassigned'}"`,
        s.enrolled,
        s.male,
        s.female,
        s.present,
        s.absent,
        `"${s.attendanceRate}%"`,
        s.sardoAlerts,
        `"${s.attendanceRate >= 95 ? 'Compliant (DepEd DO 8 Met)' : 'Below Target'}"`
      ])

      const summaryRow = [
        'Total',
        '""',
        '""',
        `"${rep.summary.totalSections} sections"`,
        rep.summary.totalEnrolled,
        '',
        '',
        rep.summary.totalPresent,
        rep.summary.totalAbsent,
        `"${rep.summary.overallAttendanceRate}%"`,
        '',
        `"${rep.summary.overallAttendanceRate >= 95 ? 'DepEd Target Met' : 'Attention Needed'}"`
      ]

      csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')].join('\r\n')
    } else if (reportType === 'quarterly_summary') {
      const q = req.query.quarter || 1
      filename = `deped-quarter-${q}-summary-${new Date().toISOString().slice(0, 10)}.csv`
      const rep = await computeQuarterlySummary(sid, req.query)
      const headers = ['Grade Level', 'Section', 'Class Adviser', 'School Days', 'Enrolled Male', 'Enrolled Female', 'Enrolled Total', 'ADA Male', 'ADA Female', 'ADA Total', 'Att % Male', 'Att % Female', 'Att % Total']
      const rows = (rep.sections || []).map(s => [
        `"${s.grade}"`,
        `"${s.section}"`,
        `"${s.adviser || 'Unassigned'}"`,
        s.schoolDays,
        s.enrolment.male,
        s.enrolment.female,
        s.enrolment.total,
        s.ada.male,
        s.ada.female,
        s.ada.total,
        `"${s.attendanceRate.male}%"`,
        `"${s.attendanceRate.female}%"`,
        `"${s.attendanceRate.total}%"`
      ])

      const grandTotalRow = [
        '"Grand Total"',
        '""',
        '""',
        rep.grandTotal.schoolDays,
        rep.grandTotal.maleEnrolled,
        rep.grandTotal.femaleEnrolled,
        rep.grandTotal.totalEnrolled,
        rep.grandTotal.ada.male,
        rep.grandTotal.ada.female,
        rep.grandTotal.ada.total,
        '',
        '',
        `"${rep.grandTotal.attendanceRate}%"`
      ]

      csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(',')), grandTotalRow.join(',')].join('\r\n')
    } else {
      filename = `operational-summary-${new Date().toISOString().slice(0, 10)}.csv`
      csvContent = '\uFEFFIndicator,Value\r\nGenerated Date,' + new Date().toISOString()
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csvContent)
  } catch (err) {
    console.error('Failed to export CSV:', err.message)
    res.status(500).json({ error: 'Failed to export CSV' })
  }
})

// ── Report Archive ──

router.get('/archive', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const archiveParams = []
    let archiveWhere = ''
    if (scope.schoolId) {
      archiveWhere = 'WHERE school_id = ?'
      archiveParams.push(scope.schoolId)
    }
    const rows = await query(`
      SELECT id, school_id, created_by, created_by_name, report_type, title, file_format, file_size, status, created_at
      FROM report_archives
      ${archiveWhere}
      ORDER BY created_at DESC
      LIMIT 100
    `, archiveParams)

    res.json(rows)
  } catch (err) {
    console.error('Failed to fetch report archive:', err.message)
    res.status(500).json({ error: 'Failed to fetch report archive' })
  }
})

router.post('/archive', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.body.schoolId)
    if (!scope) return

    const { reportType, title, parameters, fileFormat, contentData, fileSize } = req.body || {}
    if (!title) return res.status(400).json({ error: 'Report title is required' })

    const id = 'rep-' + uuidv4()
    const size = fileSize || (contentData ? Buffer.byteLength(contentData, 'utf8') : 0)

    await run(`
      INSERT INTO report_archives (id, school_id, created_by, created_by_name, report_type, title, parameters_json, file_format, file_size, status, content_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      scope.schoolId || me.school_id || '',
      me.id,
      me.name,
      reportType || 'custom_summary',
      title,
      JSON.stringify(parameters || {}),
      fileFormat || 'csv',
      size,
      'completed',
      contentData || null
    ])

    await audit(me, 'report.archive', { type: 'report', id, name: title, schoolId: scope.schoolId }, `Archived report "${title}"`)

    res.status(201).json({ success: true, id, title })
  } catch (err) {
    console.error('Failed to archive report:', err.message)
    res.status(500).json({ error: 'Failed to archive report' })
  }
})

router.get('/archive/:id/download', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const rows = await query('SELECT * FROM report_archives WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Report not found' })

    const rep = rows[0]
    if (me.role !== 'superadmin' && rep.school_id !== me.school_id && rep.school_id !== scope.schoolId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const safeTitle = rep.title.replace(/[^a-zA-Z0-9_\-]/g, '_')
    const ext = rep.file_format || 'csv'
    res.setHeader('Content-Type', ext === 'csv' ? 'text/csv; charset=utf-8' : 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${ext}"`)
    res.send(rep.content_data || '')
  } catch (err) {
    console.error('Failed to download archived report:', err.message)
    res.status(500).json({ error: 'Failed to download report' })
  }
})

router.delete('/archive/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const rows = await query('SELECT * FROM report_archives WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Report not found' })

    const rep = rows[0]
    if (me.role !== 'superadmin' && rep.school_id !== me.school_id && rep.school_id !== scope.schoolId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await run('DELETE FROM report_archives WHERE id = ?', [req.params.id])
    await audit(me, 'report.archive_delete', { type: 'report', id: rep.id, name: rep.title, schoolId: rep.school_id }, `Deleted archived report "${rep.title}"`)
    res.json({ success: true, message: 'Report archive deleted' })
  } catch (err) {
    console.error('Failed to delete report archive:', err.message)
    res.status(500).json({ error: 'Failed to delete report archive' })
  }
})

// ── Large Export Async Job Tracking ──

router.post('/jobs', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.body.schoolId)
    if (!scope) return

    const { reportType, parameters } = req.body || {}
    const id = 'job-' + uuidv4()

    await run(`
      INSERT INTO report_jobs (id, school_id, user_id, report_type, status, progress, parameters_json)
      VALUES (?, ?, ?, ?, 'pending', 0, ?)
    `, [id, scope.schoolId || me.school_id || '', me.id, reportType || 'sf2_export', JSON.stringify(parameters || {})])

    // Simulate immediate quick completion for standard jobs
    setTimeout(async () => {
      try {
        await run("UPDATE report_jobs SET status = 'completed', progress = 100 WHERE id = ?", [id])
      } catch {}
    }, 100)

    res.status(202).json({ jobId: id, status: 'pending', progress: 0 })
  } catch (err) {
    console.error('Failed to create report job:', err.message)
    res.status(500).json({ error: 'Failed to create report job' })
  }
})

router.get('/jobs/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const rows = await query('SELECT * FROM report_jobs WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Job not found' })

    const job = rows[0]
    res.json({
      id: job.id,
      reportType: job.report_type,
      status: job.status,
      progress: job.progress,
      resultArchiveId: job.result_archive_id || null,
      errorMessage: job.error_message || null,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    })
  } catch (err) {
    console.error('Failed to check report job status:', err.message)
    res.status(500).json({ error: 'Failed to check report job status' })
  }
})

export default router
