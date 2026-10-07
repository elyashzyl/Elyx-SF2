import { Router } from 'express'
import { query } from '../db.js'
import { requireRole, resolveScopeSchool } from './_context.js'

const router = Router()

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

router.get('/stats', async (req, res) => {
  const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
  if (error) return
  const scope = await resolveScopeSchool(req, res, req.query.schoolId)
  if (!scope) return

  try {
    const sid = scope.schoolId
    const studentFilter = sid ? 'WHERE school_id = ?' : ''
    const studentParams = sid ? [sid] : []

    // 1. Overall Student Demographics
    const genderCounts = (await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN LOWER(gender) = 'male' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END) as female
      FROM students
      ${studentFilter}
    `, studentParams))[0] || { total: 0, male: 0, female: 0 }

    // 2. Teachers & Advisers
    const teacherFilter = sid ? "WHERE role = 'teacher' AND school_id = ?" : "WHERE role = 'teacher'"
    const teacherParams = sid ? [sid] : []
    const teacherRows = await query(`
      SELECT id, name, grade, section FROM users ${teacherFilter}
    `, teacherParams)
    const teachersCount = teacherRows.length
    const advisersCount = teacherRows.filter(t => t.grade && t.section).length
    const adviserMap = {}
    teacherRows.forEach(t => {
      if (t.grade && t.section) {
        adviserMap[`${t.grade}__${t.section}`] = t.name
      }
    })

    // 3. Overall Attendance Aggregates
    const startDate = String(req.query.startDate || '').trim()
    const endDate = String(req.query.endDate || '').trim()
    const hasDateRange = /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)
    const dateRange = { startDate: startDate || null, endDate: endDate || null, isCustom: hasDateRange }

    let attendanceSums = null
    let gradeAttMap = {}
    let sectionAttMap = {}

    if (hasDateRange) {
      const dailyRecs = await query(`
        SELECT id, grade, section, date FROM attendance_records
        WHERE date >= ? AND date <= ? ${sid ? 'AND school_id = ?' : ''}
      `, [startDate, endDate, ...(sid ? [sid] : [])])

      if (dailyRecs.length) {
        const inPlaceholders = dailyRecs.map(() => '?').join(',')
        const entries = await query(
          `SELECT record_id, student_id, am1, am2, am3, am4, am5, am6, pm1, pm2, pm3, pm4 FROM attendance_entries WHERE record_id IN (${inPlaceholders})`,
          dailyRecs.map(r => r.id)
        )
        const recMap = new Map(dailyRecs.map(r => [r.id, r]))
        let present = 0
        let absent = 0
        let tardy = 0
        const studentsTracked = new Set()

        for (const e of entries) {
          const r = recMap.get(e.record_id)
          if (!r) continue
          studentsTracked.add(e.student_id)
          const periods = [e.am1, e.am2, e.am3, e.am4, e.am5, e.am6, e.pm1, e.pm2, e.pm3, e.pm4].filter(Boolean)
          const isAbsent = periods.every(p => p === 'A') || periods.length === 0
          const isTardy = periods.some(p => p === 'T' || p === 'E/T')
          if (isAbsent) absent++
          else present++
          if (isTardy) tardy++

          const gKey = r.grade
          const sKey = `${r.grade}__${r.section}`
          if (!gradeAttMap[gKey]) gradeAttMap[gKey] = { present: 0, absent: 0 }
          if (!sectionAttMap[sKey]) sectionAttMap[sKey] = { present: 0, absent: 0 }
          if (isAbsent) {
            gradeAttMap[gKey].absent++
            sectionAttMap[sKey].absent++
          } else {
            gradeAttMap[gKey].present++
            sectionAttMap[sKey].present++
          }
        }

        attendanceSums = {
          present,
          absent,
          tardy,
          students_tracked: studentsTracked.size
        }
      }
    }

    if (!attendanceSums) {
      attendanceSums = (await query(`
        SELECT
          COALESCE(SUM(me.present), 0) as present,
          COALESCE(SUM(me.absent), 0) as absent,
          COALESCE(SUM(me.tardy), 0) as tardy,
          COUNT(DISTINCT me.student_id) as students_tracked
        FROM monthly_entries me
        JOIN monthly_records mr ON mr.id = me.record_id
        ${sid ? 'WHERE mr.school_id = ?' : ''}
      `, sid ? [sid] : []))[0] || { present: 0, absent: 0, tardy: 0, students_tracked: 0 }
    }

    const totalDays = attendanceSums.present + attendanceSums.absent
    const overallRate = totalDays > 0
      ? Number(((attendanceSums.present / totalDays) * 100).toFixed(1))
      : 0

    // 4. Monthly Records Count & Entries Count
    const recordsCount = (await query(
      `SELECT COUNT(*) as cnt FROM monthly_records ${sid ? 'WHERE school_id = ?' : ''}`,
      sid ? [sid] : []
    ))[0]?.cnt || 0

    const entriesCount = (await query(
      `SELECT COUNT(*) as cnt FROM monthly_entries me JOIN monthly_records mr ON mr.id = me.record_id ${sid ? 'WHERE mr.school_id = ?' : ''}`,
      sid ? [sid] : []
    ))[0]?.cnt || 0

    // 5. Grade-Level & Section-Level Breakdowns
    const gradeCounts = await query(`
      SELECT 
        s.grade,
        COUNT(*) as total,
        SUM(CASE WHEN LOWER(s.gender) = 'male' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN LOWER(s.gender) = 'female' THEN 1 ELSE 0 END) as female
      FROM students s
      ${studentFilter}
      GROUP BY s.grade
      ORDER BY s.grade
    `, studentParams)

    if (!hasDateRange || Object.keys(gradeAttMap).length === 0) {
      const gradeAttendanceRows = await query(`
        SELECT
          mr.grade,
          COALESCE(SUM(me.present), 0) as present,
          COALESCE(SUM(me.absent), 0) as absent
        FROM monthly_entries me
        JOIN monthly_records mr ON mr.id = me.record_id
        ${sid ? 'WHERE mr.school_id = ?' : ''}
        GROUP BY mr.grade
      `, sid ? [sid] : [])
      gradeAttendanceRows.forEach(g => {
        gradeAttMap[g.grade] = { present: g.present, absent: g.absent }
      })
    }

    const sectionCounts = await query(`
      SELECT 
        s.grade,
        s.section,
        COUNT(*) as total,
        SUM(CASE WHEN LOWER(s.gender) = 'male' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN LOWER(s.gender) = 'female' THEN 1 ELSE 0 END) as female
      FROM students s
      ${studentFilter}
      GROUP BY s.grade, s.section
      ORDER BY s.grade, s.section
    `, studentParams)

    if (!hasDateRange || Object.keys(sectionAttMap).length === 0) {
      const sectionAttRows = await query(`
        SELECT
          mr.grade,
          mr.section,
          COALESCE(SUM(me.present), 0) as present,
          COALESCE(SUM(me.absent), 0) as absent
        FROM monthly_entries me
        JOIN monthly_records mr ON mr.id = me.record_id
        ${sid ? 'WHERE mr.school_id = ?' : ''}
        GROUP BY mr.grade, mr.section
      `, sid ? [sid] : [])
      sectionAttRows.forEach(s => {
        sectionAttMap[`${s.grade}__${s.section}`] = { present: s.present, absent: s.absent }
      })
    }

    const grades = gradeCounts.map(g => {
      const att = gradeAttMap[g.grade] || { present: 0, absent: 0 }
      const gDays = att.present + att.absent
      const rate = gDays > 0 ? Number(((att.present / gDays) * 100).toFixed(1)) : null

      const gradeSections = sectionCounts
        .filter(sec => sec.grade === g.grade)
        .map(sec => {
          const sKey = `${sec.grade}__${sec.section}`
          const sAtt = sectionAttMap[sKey] || { present: 0, absent: 0 }
          const sDays = sAtt.present + sAtt.absent
          const sRate = sDays > 0 ? Number(((sAtt.present / sDays) * 100).toFixed(1)) : null
          return {
            section: sec.section,
            students: sec.total,
            male: sec.male || 0,
            female: sec.female || 0,
            present: sAtt.present,
            absent: sAtt.absent,
            rate: sRate,
            adviser: adviserMap[sKey] || ''
          }
        })

      return {
        grade: g.grade,
        students: g.total,
        male: g.male || 0,
        female: g.female || 0,
        present: att.present,
        absent: att.absent,
        rate,
        sections: gradeSections
      }
    })

    // 6. Monthly Attendance Trends
    const monthlyTrends = (await query(`
      SELECT 
        mr.year,
        mr.month,
        COALESCE(SUM(me.present), 0) as present,
        COALESCE(SUM(me.absent), 0) as absent,
        COALESCE(SUM(me.tardy), 0) as tardy,
        COUNT(DISTINCT me.student_id) as student_count
      FROM monthly_entries me
      JOIN monthly_records mr ON mr.id = me.record_id
      ${sid ? 'WHERE mr.school_id = ?' : ''}
      GROUP BY mr.year, mr.month
      ORDER BY mr.year ASC, mr.month ASC
    `, sid ? [sid] : [])).map(m => {
      const tot = m.present + m.absent
      const rate = tot > 0 ? Number(((m.present / tot) * 100).toFixed(1)) : 0
      return {
        year: m.year,
        month: m.month,
        monthName: MONTH_NAMES[m.month] || `Month ${m.month}`,
        present: m.present,
        absent: m.absent,
        tardy: m.tardy,
        rate,
        studentCount: m.student_count
      }
    })

    // 6b. Per-record attendance aggregates (fallback when summary_data is empty)
    const entryAggRows = await query(
      "SELECT me.record_id as rid, COUNT(*) as c, COALESCE(SUM(me.present), 0) as p, COALESCE(SUM(me.absent), 0) as a FROM monthly_entries me JOIN monthly_records mr ON mr.id = me.record_id " + (sid ? "WHERE mr.school_id = ?" : "") + " GROUP BY me.record_id",
      sid ? [sid] : []
    )
    const entryAgg = {}
    entryAggRows.forEach(r => { entryAgg[r.rid] = r })

    // 7. Recent Monthly Records (SF2)
    const recentRecords = (await query(`
      SELECT 
        mr.id,
        mr.month,
        mr.year,
        mr.grade,
        mr.section,
        mr.adviser,
        mr.school_head,
        mr.school_id,
        mr.summary_data
      FROM monthly_records mr
      ${sid ? 'WHERE mr.school_id = ?' : ''}
      ORDER BY mr.year DESC, mr.month DESC, mr.grade, mr.section
      LIMIT 8
    `, sid ? [sid] : [])).map(r => {
      let summary = {}
      try { summary = JSON.parse(r.summary_data || '{}') } catch {}
      const agg = entryAgg[r.id]
      const fbRate = agg && (agg.p + agg.a) > 0
        ? Number(((agg.p / (agg.p + agg.a)) * 100).toFixed(1))
        : null
      return {
        id: r.id,
        month: r.month,
        monthName: MONTH_NAMES[r.month] || `${r.month}`,
        year: r.year,
        grade: r.grade,
        section: r.section,
        adviser: r.adviser,
        schoolHead: r.school_head,
        schoolId: r.school_id || null,
        enrolled: summary.enr_t ?? (agg?.c ?? null),
        ada: summary.ada_t ?? null,
        attendanceRate: summary.pct_t ?? fbRate
      }
    })

    // 8. Chronic Absenteeism (SARDO Early Warning based on school-configurable rules)
    let sardoConsecutive = 3
    let sardoCumulative = 5
    if (sid) {
      try {
        const sRows = await query('SELECT sardo_consecutive_absences, sardo_cumulative_absences FROM schools WHERE id = ?', [sid])
        if (sRows.length) {
          if (sRows[0].sardo_consecutive_absences) sardoConsecutive = Number(sRows[0].sardo_consecutive_absences)
          if (sRows[0].sardo_cumulative_absences) sardoCumulative = Number(sRows[0].sardo_cumulative_absences)
        }
      } catch {}
    }

    const chronicAbsenteeism = await query(`
      SELECT 
        me.student_id as studentId,
        me.student_name as studentName,
        mr.grade,
        mr.section,
        SUM(me.absent) as totalAbsences,
        SUM(me.present) as totalPresent
      FROM monthly_entries me
      JOIN monthly_records mr ON mr.id = me.record_id
      ${sid ? 'WHERE mr.school_id = ?' : ''}
      GROUP BY me.student_id, me.student_name, mr.grade, mr.section
      HAVING totalAbsences >= ?
      ORDER BY totalAbsences DESC
      LIMIT 10
    `, sid ? [sid, sardoCumulative] : [sardoCumulative])

    // 8b. Daily Attendance Roll Call Completion for Today
    const nowLocal = new Date()
    const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`

    let activeSections = []
    const gradeLevelRows = await query(
      `SELECT grade, sections FROM grade_levels ${sid ? 'WHERE school_id = ?' : ''} ORDER BY sort ASC, grade ASC`,
      sid ? [sid] : []
    )
    for (const gl of gradeLevelRows) {
      let secs = []
      try { secs = JSON.parse(gl.sections || '[]') } catch {}
      for (const sec of secs) {
        const secName = typeof sec === 'string' ? sec : (sec?.name || '')
        if (secName) {
          activeSections.push({ grade: gl.grade, section: secName, adviser: typeof sec === 'object' ? (sec.adviser || '') : '' })
        }
      }
    }
    if (!activeSections.length) {
      activeSections = await query(
        `SELECT DISTINCT grade, section FROM students ${sid ? 'WHERE school_id = ?' : ''} ORDER BY grade, section`,
        sid ? [sid] : []
      )
    }

    const todayRecords = await query(
      `SELECT id, date, grade, section, adviser, created_by_name, locked, reopened_at, teacher_notes FROM attendance_records WHERE date = ? ${sid ? 'AND school_id = ?' : ''}`,
      sid ? [todayStr, sid] : [todayStr]
    )

    const todayRecordMap = new Map()
    for (const r of todayRecords) {
      todayRecordMap.set(`${r.grade}__${r.section}`, r)
    }

    const sectionCompletionList = activeSections.map(sec => {
      const key = `${sec.grade}__${sec.section}`
      const rec = todayRecordMap.get(key)
      const adviserName = sec.adviser || adviserMap[key] || ''
      return {
        grade: sec.grade,
        section: sec.section,
        adviser: adviserName,
        submitted: !!rec,
        recordId: rec?.id || null,
        recordedBy: rec?.created_by_name || adviserName,
        locked: !!rec?.locked && !rec?.reopened_at,
        hasNotes: !!(rec?.teacher_notes && rec.teacher_notes.trim())
      }
    })

    const totalSectionsCount = sectionCompletionList.length
    const submittedSectionsCount = sectionCompletionList.filter(s => s.submitted).length
    const pendingSectionsCount = totalSectionsCount - submittedSectionsCount
    const rollCallRate = totalSectionsCount > 0 ? Math.round((submittedSectionsCount / totalSectionsCount) * 100) : 0

    const todayAttendanceCompletion = {
      date: todayStr,
      totalSections: totalSectionsCount,
      submittedCount: submittedSectionsCount,
      pendingCount: pendingSectionsCount,
      completionRate: rollCallRate,
      sections: sectionCompletionList
    }

    // 8c. Per-school analytics breakdown for multi-campus / superadmin overview
    let schoolStats = []
    if (!sid || me.role === 'superadmin') {
      const allSchools = await query('SELECT id, name, short, school_id as deped_id FROM schools ORDER BY name ASC')
      if (allSchools.length > 0) {
        const schStudentCounts = await query(`
          SELECT school_id, COUNT(*) as total,
            SUM(CASE WHEN LOWER(gender) = 'male' THEN 1 ELSE 0 END) as male,
            SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END) as female
          FROM students
          GROUP BY school_id
        `)
        const schTeacherCounts = await query(`
          SELECT school_id, COUNT(*) as total
          FROM users WHERE role = 'teacher'
          GROUP BY school_id
        `)
        const schAttCounts = await query(`
          SELECT mr.school_id,
            COALESCE(SUM(me.present), 0) as present,
            COALESCE(SUM(me.absent), 0) as absent
          FROM monthly_entries me
          JOIN monthly_records mr ON mr.id = me.record_id
          GROUP BY mr.school_id
        `)

        const stMap = new Map(schStudentCounts.map(s => [s.school_id, s]))
        const tcMap = new Map(schTeacherCounts.map(t => [t.school_id, Number(t.total)]))
        const atMap = new Map(schAttCounts.map(a => [a.school_id, a]))

        schoolStats = allSchools.map(sch => {
          const st = stMap.get(sch.id) || { total: 0, male: 0, female: 0 }
          const tc = tcMap.get(sch.id) || 0
          const at = atMap.get(sch.id) || { present: 0, absent: 0 }
          const totalDays = Number(at.present) + Number(at.absent)
          const schRate = totalDays > 0 ? Number(((Number(at.present) / totalDays) * 100).toFixed(1)) : 0

          return {
            id: sch.id,
            name: sch.name,
            short: sch.short || sch.name,
            depedId: sch.deped_id || '',
            students: Number(st.total || 0),
            maleStudents: Number(st.male || 0),
            femaleStudents: Number(st.female || 0),
            teachers: tc,
            present: Number(at.present || 0),
            absent: Number(at.absent || 0),
            attendanceRate: schRate
          }
        })
      }
    }

    // 9. Teacher-Specific Class Stats
    let teacherClass = null
    if (me.role === 'teacher') {
      const tGrade = me.grade || ''
      const tSection = me.section || ''
      const tSchoolId = me.school_id
      const hasAdvisory = Boolean(tGrade && tSection)

      if (hasAdvisory) {
        const tStudents = (await query(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(gender) = 'male' THEN 1 ELSE 0 END) as male,
            SUM(CASE WHEN LOWER(gender) = 'female' THEN 1 ELSE 0 END) as female
          FROM students
          WHERE school_id = ? AND grade = ? AND section = ?
        `, [tSchoolId, tGrade, tSection]))[0] || { total: 0, male: 0, female: 0 }

        const tAtt = (await query(`
          SELECT 
            COALESCE(SUM(me.present), 0) as present,
            COALESCE(SUM(me.absent), 0) as absent,
            COALESCE(SUM(me.tardy), 0) as tardy
          FROM monthly_entries me
          JOIN monthly_records mr ON mr.id = me.record_id
          WHERE mr.school_id = ? AND mr.grade = ? AND mr.section = ?
        `, [tSchoolId, tGrade, tSection]))[0] || { present: 0, absent: 0, tardy: 0 }

        const tDays = tAtt.present + tAtt.absent
        const tRate = tDays > 0 ? Number(((tAtt.present / tDays) * 100).toFixed(1)) : 0

        const tAggRows = await query(
          "SELECT me.record_id as rid, COUNT(*) as c, COALESCE(SUM(me.present), 0) as p, COALESCE(SUM(me.absent), 0) as a FROM monthly_entries me JOIN monthly_records mr ON mr.id = me.record_id WHERE mr.school_id = ? AND mr.grade = ? AND mr.section = ? GROUP BY me.record_id",
          [tSchoolId, tGrade, tSection]
        )
        const tAgg = {}
        tAggRows.forEach(r => { tAgg[r.rid] = r })

        const tRecords = (await query(`
          SELECT id, month, year, summary_data, school_id
          FROM monthly_records
          WHERE school_id = ? AND grade = ? AND section = ?
          ORDER BY year DESC, month DESC
        `, [tSchoolId, tGrade, tSection])).map(r => {
          let summary = {}
          try { summary = JSON.parse(r.summary_data || '{}') } catch {}
          const tRowAgg = tAgg[r.id]
          const tFbRate = tRowAgg && (tRowAgg.p + tRowAgg.a) > 0
            ? Number(((tRowAgg.p / (tRowAgg.p + tRowAgg.a)) * 100).toFixed(1))
            : null
          return {
            id: r.id,
            month: r.month,
            monthName: MONTH_NAMES[r.month] || `${r.month}`,
            year: r.year,
            schoolId: r.school_id || null,
            attendanceRate: summary.pct_t ?? tFbRate,
            enrolled: summary.enr_t ?? (tRowAgg?.c ?? null),
            ada: summary.ada_t ?? null
          }
        })

        const tRoster = await query(`
          SELECT
            s.id,
            s.name,
            s.gender,
            COALESCE((
              SELECT SUM(me.present) FROM monthly_entries me
              JOIN monthly_records mr ON mr.id = me.record_id
              WHERE me.student_id = s.id AND mr.school_id = s.school_id AND mr.grade = s.grade AND mr.section = s.section
            ), 0) as present,
            COALESCE((
              SELECT SUM(me.absent) FROM monthly_entries me
              JOIN monthly_records mr ON mr.id = me.record_id
              WHERE me.student_id = s.id AND mr.school_id = s.school_id AND mr.grade = s.grade AND mr.section = s.section
            ), 0) as absent,
            COALESCE((
              SELECT SUM(me.tardy) FROM monthly_entries me
              JOIN monthly_records mr ON mr.id = me.record_id
              WHERE me.student_id = s.id AND mr.school_id = s.school_id AND mr.grade = s.grade AND mr.section = s.section
            ), 0) as tardy,
            COALESCE((
              SELECT SUM(
                CHAR_LENGTH(me.days) - CHAR_LENGTH(REPLACE(REPLACE(me.days, '◢', ''), 'H', ''))
              ) FROM monthly_entries me
              JOIN monthly_records mr ON mr.id = me.record_id
              WHERE me.student_id = s.id AND mr.school_id = s.school_id AND mr.grade = s.grade AND mr.section = s.section
            ), 0) as half_day
          FROM students s
          WHERE s.school_id = ? AND s.grade = ? AND s.section = ?
          GROUP BY s.id, s.name, s.gender
          ORDER BY s.name ASC`, [tSchoolId, tGrade, tSection])

        const tAtRisk = await query(`
          SELECT
            me.student_id as studentId,
            me.student_name as studentName,
            COALESCE(SUM(me.present), 0) as totalPresent,
            COALESCE(SUM(me.absent), 0) as totalAbsent,
            COALESCE(SUM(me.tardy), 0) as totalTardy
          FROM monthly_entries me
          JOIN monthly_records mr ON mr.id = me.record_id
          WHERE mr.school_id = ? AND mr.grade = ? AND mr.section = ?
          GROUP BY me.student_id, me.student_name
          HAVING totalAbsent > 0
          ORDER BY totalAbsent DESC
          LIMIT 6
        `, [tSchoolId, tGrade, tSection])

        const tTodayRec = todayRecordMap.get(`${tGrade}__${tSection}`)
        teacherClass = {
          hasAdvisory: true,
          grade: tGrade,
          section: tSection,
          todayAttendance: {
            date: todayStr,
            submitted: !!tTodayRec,
            recordId: tTodayRec?.id || null,
            locked: !!tTodayRec?.locked && !tTodayRec?.reopened_at,
            hasNotes: !!(tTodayRec?.teacher_notes && tTodayRec.teacher_notes.trim())
          },
          students: {
            total: tStudents.total,
            male: tStudents.male || 0,
            female: tStudents.female || 0
          },
          attendance: {
            ...tAtt,
            rate: tRate
          },
          records: tRecords,
          roster: tRoster,
          atRisk: tAtRisk
        }
      } else {
        teacherClass = {
          hasAdvisory: false,
          grade: '',
          section: ''
        }
      }
    }

    res.json({
      // Backward-compatible flat keys
      students: genderCounts.total,
      teachers: teachersCount,
      records: recordsCount,
      entries: entriesCount,

      // Rich analytics
      summary: {
        students: genderCounts.total,
        maleStudents: genderCounts.male || 0,
        femaleStudents: genderCounts.female || 0,
        teachers: teachersCount,
        advisers: advisersCount,
        records: recordsCount,
        entries: entriesCount,
        attendance: {
          present: attendanceSums.present,
          absent: attendanceSums.absent,
          tardy: attendanceSums.tardy,
          rate: overallRate,
          studentsTracked: attendanceSums.students_tracked
        }
      },
      grades,
      monthlyTrends,
      recentRecords,
      dateRange,
      chronicAbsenteeism,
      sardoRules: { consecutive: sardoConsecutive, cumulative: sardoCumulative },
      todayAttendanceCompletion,
      schools: schoolStats,
      teacherClass
    })
  } catch (err) {
    console.error('Stats endpoint error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
