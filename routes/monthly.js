import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { requireRole, resolveScopeSchool, actingUser, assertValidClass, audit } from './_context.js'
import { calculateMonthlyEntryTotals } from '../lib/monthly-calendar.js'

const router = Router()

function resolveClassScope(me, grade, section) {
  if (me.role === 'teacher') {
    if (!me.grade || !me.section) return { error: 'No advisory class assigned' }
    if ((grade && grade !== me.grade) || (section && section !== me.section) || (grade && !section) || (!grade && section)) {
      return { error: 'Forbidden: outside your advisory class' }
    }
    return { grade: me.grade, section: me.section }
  }
  if (!grade || !section) return { error: 'grade and section are required' }
  return { grade, section }
}

function scopeRecordCheck(me, record) {
  if (!record) return true
  if (me.role === 'superadmin') return true
  return record.school_id === me.school_id
}

export async function getUnifiedClassRoster(schoolId, grade, section) {
  const studentMap = new Map()

  // 1. Current class students in students table
  try {
    const rows = await query(
      `SELECT id, name, gender, enrollment_status FROM students
       WHERE (school_id = ? OR school_id = '' OR school_id IS NULL)
         AND LOWER(TRIM(grade)) = LOWER(TRIM(?))
         AND LOWER(TRIM(section)) = LOWER(TRIM(?))`,
      [schoolId, grade, section]
    )
    for (const r of rows) {
      studentMap.set(String(r.id), { id: r.id, name: r.name, gender: r.gender || '', late_enrollee: false })
    }
  } catch {}

  // 2. Students who appeared in ANY monthly record of this class in this school
  try {
    const rows = await query(`
      SELECT DISTINCT me.student_id as id, me.student_name as name, COALESCE(s.gender, '') as gender, me.late_enrollee
      FROM monthly_entries me
      JOIN monthly_records mr ON mr.id = me.record_id
      LEFT JOIN students s ON (s.id = me.student_id OR LOWER(TRIM(s.name)) = LOWER(TRIM(me.student_name)))
      WHERE (mr.school_id = ? OR mr.school_id = '' OR mr.school_id IS NULL)
        AND LOWER(TRIM(mr.grade)) = LOWER(TRIM(?))
        AND LOWER(TRIM(mr.section)) = LOWER(TRIM(?))
    `, [schoolId, grade, section])
    for (const r of rows) {
      const sid = String(r.id || r.name)
      if (!studentMap.has(sid)) {
        studentMap.set(sid, { id: r.id || sid, name: r.name, gender: r.gender || '', late_enrollee: Boolean(r.late_enrollee) })
      } else if (r.gender && !studentMap.get(sid).gender) {
        studentMap.get(sid).gender = r.gender
      }
    }
  } catch {}

  // 3. Students with historical enrollment events for this class
  try {
    const rows = await query(`
      SELECT DISTINCT s.id, s.name, COALESCE(s.gender, '') as gender
      FROM student_enrollment_events e
      JOIN students s ON s.id = e.student_id
      WHERE (e.school_id = ? OR e.school_id = '' OR e.school_id IS NULL)
        AND LOWER(TRIM(e.grade)) = LOWER(TRIM(?))
        AND LOWER(TRIM(e.section)) = LOWER(TRIM(?))
    `, [schoolId, grade, section])
    for (const r of rows) {
      const sid = String(r.id)
      if (!studentMap.has(sid)) {
        studentMap.set(sid, { id: r.id, name: r.name, gender: r.gender || '', late_enrollee: false })
      } else if (r.gender && !studentMap.get(sid).gender) {
        studentMap.get(sid).gender = r.gender
      }
    }
  } catch {}

  // 4. Students who appeared in daily attendance records for this class
  try {
    const rows = await query(`
      SELECT DISTINCT ae.student_id as id, ae.name, COALESCE(s.gender, '') as gender
      FROM attendance_entries ae
      JOIN attendance_records ar ON ar.id = ae.record_id
      LEFT JOIN students s ON (s.id = ae.student_id OR LOWER(TRIM(s.name)) = LOWER(TRIM(ae.name)))
      WHERE (ar.school_id = ? OR ar.school_id = '' OR ar.school_id IS NULL)
        AND LOWER(TRIM(ar.grade)) = LOWER(TRIM(?))
        AND LOWER(TRIM(ar.section)) = LOWER(TRIM(?))
    `, [schoolId, grade, section])
    for (const r of rows) {
      const sid = String(r.id || r.name)
      if (!studentMap.has(sid)) {
        studentMap.set(sid, { id: r.id || sid, name: r.name, gender: r.gender || '', late_enrollee: false })
      } else if (r.gender && !studentMap.get(sid).gender) {
        studentMap.get(sid).gender = r.gender
      }
    }
  } catch {}

  const list = Array.from(studentMap.values())
  list.sort((a, b) => {
    const gA = (a.gender || '').toLowerCase() === 'female' ? 1 : 0
    const gB = (b.gender || '').toLowerCase() === 'female' ? 1 : 0
    if (gA !== gB) return gA - gB
    return (a.name || '').localeCompare(b.name || '')
  })
  return list
}

router.get('/roster', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    if (!scope.schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const { grade, section } = req.query
    const cls = resolveClassScope(me, grade, section)
    if (cls.error) return res.status(403).json({ error: cls.error })

    const roster = await getUnifiedClassRoster(scope.schoolId, cls.grade, cls.section)
    res.json(roster)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    if (!scope.schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const { month, year, grade, section } = req.query
    const cls = resolveClassScope(me, grade, section)
    if (cls.error) return res.status(403).json({ error: cls.error })
    const records = await query(
      'SELECT * FROM monthly_records WHERE month = ? AND year = ? AND grade = ? AND section = ? AND school_id = ?',
      [month, year, cls.grade, cls.section, scope.schoolId]
    )
    if (records.length === 0) return res.json(null)
    const record = records[0]

    // Reconcile entries: ensure any student who belongs to this class (or appeared in any other month)
    // is automatically present in this monthly record so they are never missing from previous months.
    const roster = await getUnifiedClassRoster(scope.schoolId, cls.grade, cls.section)
    const existingEntries = await query(`
      SELECT me.*, COALESCE(s.gender, '') as student_gender 
      FROM monthly_entries me 
      LEFT JOIN students s ON (s.id = me.student_id OR LOWER(TRIM(s.name)) = LOWER(TRIM(me.student_name)))
      WHERE me.record_id = ? 
      ORDER BY me.id
    `, [record.id])

    const existingIds = new Set(existingEntries.map(e => String(e.student_id || '')))
    const existingNames = new Set(existingEntries.map(e => (e.student_name || '').trim().toLowerCase()))
    let newlyInserted = false

    for (const s of roster) {
      const sId = String(s.id || '')
      const sName = (s.name || '').trim().toLowerCase()
      if ((!sId || !existingIds.has(sId)) && (!sName || !existingNames.has(sName))) {
        await run(`
          INSERT INTO monthly_entries (record_id, student_id, student_name, days, present, absent, remarks, late_enrollee)
          VALUES (?, ?, ?, '{}', 0, 0, '', 1)
        `, [record.id, s.id, s.name])
        newlyInserted = true
      }
    }

    const rawEntries = newlyInserted ? await query(`
      SELECT me.*, COALESCE(s.gender, '') as student_gender
      FROM monthly_entries me
      LEFT JOIN students s ON (s.id = me.student_id OR LOWER(TRIM(s.name)) = LOWER(TRIM(me.student_name)))
      WHERE me.record_id = ?
      ORDER BY me.id
    `, [record.id]) : existingEntries

    // Strictly sort alphabetically: Boys first alphabetically, Girls alphabetically, then unassigned alphabetically
    const sortAlpha = (a, b) => (a.student_name || '').localeCompare(b.student_name || '', undefined, { sensitivity: 'base' })
    const boysList = rawEntries.filter(e => (e.student_gender || '').toLowerCase() === 'male').sort(sortAlpha)
    const girlsList = rawEntries.filter(e => (e.student_gender || '').toLowerCase() === 'female').sort(sortAlpha)
    const otherList = rawEntries.filter(e => !['male', 'female'].includes((e.student_gender || '').toLowerCase())).sort(sortAlpha)
    const entries = [...boysList, ...girlsList, ...otherList]

    record.entries = entries.map(e => ({
      id: e.id,
      studentId: e.student_id,
      name: e.student_name,
      gender: e.student_gender || '',
      days: typeof e.days === 'string' ? JSON.parse(e.days || '{}') : (e.days || {}),
      present: e.present,
      absent: e.absent,
      remarks: e.remarks || '',
      late_enrollee: e.late_enrollee === 1 || e.late_enrollee === true || e.late_enrollee === '1'
    }))

    const curSummary = JSON.parse(record.summary_data || '{}')
    const mEntries = record.entries.filter(e => (e.gender || '').toLowerCase() === 'male')
    const fEntries = record.entries.filter(e => (e.gender || '').toLowerCase() === 'female')
    curSummary.reg_m = mEntries.length
    curSummary.reg_f = fEntries.length
    curSummary.reg_t = mEntries.length + fEntries.length
    const lateM = record.entries.filter(e => Boolean(e.late_enrollee) && (e.gender || '').toLowerCase() === 'male').length
    const lateF = record.entries.filter(e => Boolean(e.late_enrollee) && (e.gender || '').toLowerCase() === 'female').length
    if (newlyInserted || curSummary.late_m === undefined) {
      curSummary.late_m = lateM
      curSummary.late_f = lateF
      curSummary.late_t = lateM + lateF
    }
    if (newlyInserted) {
      await run('UPDATE monthly_records SET summary_data = ? WHERE id = ?', [JSON.stringify(curSummary), record.id])
    }
    record.summary_data = curSummary
    record.holiday_labels = curSummary.holiday_labels || {}
    record.excluded_dates = JSON.parse(record.excluded_dates || '[]')
    record.include_saturdays = record.include_saturdays === true || Number(record.include_saturdays) === 1
    record.schoolHead = record.school_head || ''

    const monthStr = String(record.month).padStart(2, '0')
    const prefix = `${record.year}-${monthStr}-`
    const monthEvents = await query(
      'SELECT id, title, type, event_date, color FROM calendar_events WHERE school_id = ? AND event_date LIKE ? ORDER BY event_date',
      [scope.schoolId, prefix + '%']
    )
    record.calendar_events = monthEvents

    res.json(record)
  } catch (err) {
    console.error('Failed to fetch monthly record:', err.message)
    res.status(500).json({ error: 'Failed to fetch monthly record' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const scope = await resolveScopeSchool(req, res, req.body.schoolId)
    if (!scope) return
    if (!scope.schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const { month, year, grade, section, entries } = req.body
    const includeSaturdays = req.body.includeSaturdays === true || req.body.include_saturdays === true || req.body.includeSaturdays === 1 || req.body.include_saturdays === 1
    const adviserName = typeof req.body.adviser === 'string' ? req.body.adviser : ''
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' })
    const cls = resolveClassScope(me, grade, section)
    if (cls.error) return res.status(403).json({ error: cls.error })
    if (!await assertValidClass(res, scope.schoolId, cls.grade, cls.section)) return
    const existing = await query(
      'SELECT id FROM monthly_records WHERE month = ? AND year = ? AND grade = ? AND section = ? AND school_id = ?',
      [month, year, cls.grade, cls.section, scope.schoolId]
    )
    let existingEntryIds = new Set()
    if (existing.length > 0) {
      const prevEntries = await query('SELECT student_id FROM monthly_entries WHERE record_id = ?', [existing[0].id])
      existingEntryIds = new Set(prevEntries.map(e => e.student_id))
    }

    const lastDayOfMonth = new Date(year, month, 0).getDate()
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`
    for (const entry of entries) {
      let student = (await query('SELECT id, grade, section, school_id FROM students WHERE id = ? AND school_id = ?', [entry.studentId, scope.schoolId]))[0]
      if (!student) {
        const hadEnrollment = (await query('SELECT student_id FROM student_enrollment_events WHERE student_id = ? AND school_id = ? AND effective_on <= ?', [entry.studentId, scope.schoolId, monthEnd]))[0]
        if (hadEnrollment) {
          student = (await query('SELECT id, grade, section, school_id FROM students WHERE id = ?', [entry.studentId]))[0]
        }
      }
      if (!student) return res.status(400).json({ error: `Student ${entry.studentId} does not belong to the selected school` })

      if (existingEntryIds.has(entry.studentId)) {
        continue
      }

      const enrollment = (await query(`
        SELECT grade, section, status FROM student_enrollment_events
        WHERE student_id = ? AND school_id = ? AND effective_on <= ?
        ORDER BY effective_on DESC, event_sequence DESC, created_at DESC, id DESC LIMIT 1`, [entry.studentId, scope.schoolId, monthEnd]))[0]

      let classMatches = false
      if (enrollment) {
        if (enrollment.grade === cls.grade && enrollment.section === cls.section) {
          classMatches = true
        } else {
          const inMonthEvent = (await query(`
            SELECT id FROM student_enrollment_events
            WHERE student_id = ? AND school_id = ? AND grade = ? AND section = ? AND effective_on >= ? AND effective_on <= ?
            LIMIT 1`, [entry.studentId, scope.schoolId, cls.grade, cls.section, monthStart, monthEnd]))[0]
          if (inMonthEvent) classMatches = true
        }
      } else {
        if (student.grade === cls.grade && student.section === cls.section) {
          classMatches = true
        } else {
          const earliestEvent = (await query(`
            SELECT grade, section FROM student_enrollment_events
            WHERE student_id = ? AND school_id = ?
            ORDER BY effective_on ASC, event_sequence ASC, created_at ASC, id ASC LIMIT 1`, [entry.studentId, scope.schoolId]))[0]
          if (earliestEvent && earliestEvent.grade === cls.grade && earliestEvent.section === cls.section) {
            classMatches = true
          }
        }
      }

      if (!classMatches) {
        return res.status(400).json({ error: `Student ${entry.studentId} was not enrolled in ${cls.grade} - ${cls.section}` })
      }
    }
    let recordId
    if (existing.length > 0) {
      recordId = existing[0].id
      const rec = (await query('SELECT * FROM monthly_records WHERE id = ?', [recordId]))[0]
      if (!scopeRecordCheck(me, rec)) return res.status(403).json({ error: 'Forbidden: outside your school' })
      await run('DELETE FROM monthly_entries WHERE record_id = ?', [recordId])
      const summaryPayload = req.body.summary_data ? JSON.stringify(req.body.summary_data) : rec.summary_data
      // Preserve an existing report's Saturday setting when regenerating its entries.
      await run('UPDATE monthly_records SET adviser=?, school_head=?, summary_data=? WHERE id=?', [adviserName, '', summaryPayload, recordId])
    } else {
      const monthStr = String(month).padStart(2, '0')
      const prefix = `${year}-${monthStr}-`
      const eventHolidays = await query(
        `SELECT event_date FROM calendar_events WHERE school_id = ? AND event_date LIKE ? AND LOWER(type) IN ('holiday', 'suspension', 'special_non_working', 'special-non-working', 'no_classes')`,
        [scope.schoolId, prefix + '%']
      )
      const autoExcludedDays = Array.isArray(req.body.excluded_dates)
        ? req.body.excluded_dates
        : eventHolidays.map(h => parseInt(h.event_date.split('-')[2], 10)).filter(Number.isInteger)

      recordId = uuidv4()
      await run('INSERT INTO monthly_records (id, month, year, grade, section, adviser, school_head, created_by, created_by_name, school_id, include_saturdays, excluded_dates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [recordId, month, year, cls.grade, cls.section, adviserName, '', me.id, me.name || me.username || '', scope.schoolId, includeSaturdays ? 1 : 0, JSON.stringify(autoExcludedDays)])
    }
    // Sort entries before inserting so database records are strictly alphabetical: Boys, Girls, Unassigned
    const sortAlpha = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    const bEntries = entries.filter(e => (e.gender || '').toLowerCase() === 'male').sort(sortAlpha)
    const gEntries = entries.filter(e => (e.gender || '').toLowerCase() === 'female').sort(sortAlpha)
    const uEntries = entries.filter(e => !['male', 'female'].includes((e.gender || '').toLowerCase())).sort(sortAlpha)
    const sortedEntriesToSave = [...bEntries, ...gEntries, ...uEntries]

    for (const entry of sortedEntriesToSave) {
      await run('INSERT INTO monthly_entries (record_id, student_id, student_name, days, present, absent, remarks, late_enrollee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [recordId, entry.studentId, entry.name, JSON.stringify(entry.days || {}), entry.present || 0, entry.absent || 0, entry.remarks || '', entry.late_enrollee ? 1 : 0])
    }

    // Synchronize registered counts in summary_data with the newly saved entries
    const mSavedCount = sortedEntriesToSave.filter(e => (e.gender || '').toLowerCase() === 'male').length
    const fSavedCount = sortedEntriesToSave.filter(e => (e.gender || '').toLowerCase() === 'female').length
    const latestRec = (await query('SELECT summary_data FROM monthly_records WHERE id = ?', [recordId]))[0]
    const curSum = JSON.parse(latestRec?.summary_data || '{}')
    curSum.reg_m = mSavedCount
    curSum.reg_f = fSavedCount
    curSum.reg_t = mSavedCount + fSavedCount
    await run('UPDATE monthly_records SET summary_data = ? WHERE id = ?', [JSON.stringify(curSum), recordId])

    const updated = await query('SELECT * FROM monthly_records WHERE id = ?', [recordId])
    await audit(
      me,
      existing.length > 0 ? 'monthly.update' : 'monthly.create',
      { type: 'monthly', id: recordId, name: `${cls.grade} - ${cls.section}`, schoolId: scope.schoolId },
      `Saved monthly SF2 sheet for ${cls.grade} - ${cls.section} (${month}/${year})`
    )
    if (updated[0]) updated[0].include_saturdays = updated[0].include_saturdays === true || Number(updated[0].include_saturdays) === 1
    res.json({ id: recordId, success: true, record: updated[0] || null })
  } catch (err) {
    console.error('Failed to save monthly record:', err.message)
    res.status(500).json({ error: 'Failed to save monthly record' })
  }
})

async function guardRecord(req, res) {
  const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
  if (error) return null
  const records = await query('SELECT * FROM monthly_records WHERE id = ?', [req.params.recordId])
  if (records.length === 0) { res.status(404).json({ error: 'Record not found' }); return null }
  if (!scopeRecordCheck(me, records[0])) { res.status(403).json({ error: 'Forbidden: outside your school' }); return null }
  if (me.role === 'teacher') {
    if (records[0].grade !== me.grade || records[0].section !== me.section) {
      res.status(403).json({ error: 'Forbidden: outside your advisory class' })
      return null
    }
  }
  return { me, record: records[0] }
}

router.put('/:recordId/entry', async (req, res) => {
  try {
    const g = await guardRecord(req, res)
    if (!g) return
    const { recordId } = req.params
    const { studentId, day, status } = req.body

    const records = [g.record]

    const entries = await query('SELECT * FROM monthly_entries WHERE record_id = ? AND student_id = ?', [recordId, studentId])
    if (entries.length === 0) return res.status(404).json({ error: 'Entry not found' })

    const entry = entries[0]
    const days = JSON.parse(entry.days || '{}')
    if (status) {
      days[day] = status
    } else {
      delete days[day]
    }

    const rec = records[0]
    const excluded = JSON.parse(rec.excluded_dates || '[]')
    const curSummary = JSON.parse(rec.summary_data || '{}')

    const totals = calculateMonthlyEntryTotals({
      year: rec.year,
      month: rec.month,
      days,
      excludedDates: excluded,
      includeSaturdays: rec.include_saturdays === true || Number(rec.include_saturdays) === 1,
      schoolDaysOverride: curSummary.schoolDays || curSummary.school_days
    })
    const present = totals.present
    const absent = totals.absent

    await run('UPDATE monthly_entries SET days=?, present=?, absent=? WHERE record_id=? AND student_id=?',
      [JSON.stringify(days), present, absent, recordId, studentId])

    await audit(
      g.me,
      'monthly.entry_edit',
      { type: 'monthly', id: recordId, name: `${g.record.grade} - ${g.record.section}`, schoolId: g.record.school_id },
      `Updated day ${day} for student ID ${studentId} (${status || 'cleared'})`
    )

    res.json({ success: true, present, absent })
  } catch (err) {
    console.error('Failed to update monthly entry:', err.message)
    res.status(500).json({ error: 'Failed to update monthly entry' })
  }
})

router.put('/:recordId/settings', async (req, res) => {
  try {
    const g = await guardRecord(req, res)
    if (!g) return
    if (typeof req.body.includeSaturdays !== 'boolean' && typeof req.body.include_saturdays !== 'boolean') {
      return res.status(400).json({ error: 'includeSaturdays must be a boolean' })
    }
    const includeSaturdays = req.body.includeSaturdays ?? req.body.include_saturdays
    const record = g.record
    const excluded = JSON.parse(record.excluded_dates || '[]')
    const curSummary = JSON.parse(record.summary_data || '{}')
    const entries = await query('SELECT student_id, days FROM monthly_entries WHERE record_id = ?', [record.id])
    await run('UPDATE monthly_records SET include_saturdays=? WHERE id=?', [includeSaturdays ? 1 : 0, record.id])
    for (const entry of entries) {
      const days = typeof entry.days === 'string' ? JSON.parse(entry.days || '{}') : (entry.days || {})
      const totals = calculateMonthlyEntryTotals({
        year: record.year,
        month: record.month,
        days,
        excludedDates: excluded,
        includeSaturdays,
        schoolDaysOverride: curSummary.schoolDays || curSummary.school_days
      })
      await run('UPDATE monthly_entries SET present=?, absent=? WHERE record_id=? AND student_id=?', [totals.present, totals.absent, record.id, entry.student_id])
    }
    await audit(g.me, 'monthly.settings_update', { type: 'monthly', id: record.id, name: `${record.grade} - ${record.section}`, schoolId: record.school_id }, `Updated Saturday school-day setting for ${record.month}/${record.year}`)
    res.json({ success: true, include_saturdays: includeSaturdays })
  } catch (err) {
    console.error('Failed to update monthly settings:', err.message)
    res.status(500).json({ error: 'Failed to update monthly settings' })
  }
})

router.put('/:recordId/remarks', async (req, res) => {
  try {
    const g = await guardRecord(req, res)
    if (!g) return
    const { recordId } = req.params
    const { studentId, remarks } = req.body
    await run('UPDATE monthly_entries SET remarks=? WHERE record_id=? AND student_id=?',
      [remarks, recordId, studentId])
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to update remarks:', err.message)
    res.status(500).json({ error: 'Failed to update remarks' })
  }
})

router.put('/:recordId/summary', async (req, res) => {
  try {
    const g = await guardRecord(req, res)
    if (!g) return
    const { recordId } = req.params
    const { summary_data, adviser, schoolHead } = req.body
    const prevSummary = JSON.parse(g.record.summary_data || '{}')
    const mergedSummary = { ...prevSummary, ...(summary_data || {}) }
    await run('UPDATE monthly_records SET summary_data=?, adviser=?, school_head=? WHERE id=?',
      [JSON.stringify(mergedSummary), adviser || '', schoolHead || '', recordId])
    res.json({ success: true, summary_data: mergedSummary })
  } catch (err) {
    console.error('Failed to update summary:', err.message)
    res.status(500).json({ error: 'Failed to update summary' })
  }
})

router.put('/:recordId/excluded-dates', async (req, res) => {
  try {
    const g = await guardRecord(req, res)
    if (!g) return
    const { recordId } = req.params
    const excludedDates = Array.isArray(req.body.excluded_dates) ? req.body.excluded_dates : []
    const record = g.record
    const curSummary = JSON.parse(record.summary_data || '{}')
    if (req.body.holiday_labels && typeof req.body.holiday_labels === 'object') {
      curSummary.holiday_labels = { ...(curSummary.holiday_labels || {}), ...req.body.holiday_labels }
      // Remove keys for dates that are no longer excluded
      const exclSet = new Set(excludedDates.map(Number))
      for (const k of Object.keys(curSummary.holiday_labels)) {
        if (!exclSet.has(Number(k))) delete curSummary.holiday_labels[k]
      }
    }
    await run('UPDATE monthly_records SET excluded_dates=?, summary_data=? WHERE id=?',
      [JSON.stringify(excludedDates), JSON.stringify(curSummary), recordId])

    // Recalculate stored totals immediately so excluding/restoring a date
    // stays consistent with the values displayed by the monthly sheet.
    const entries = await query('SELECT student_id, days FROM monthly_entries WHERE record_id = ?', [recordId])
    const includeSaturdays = record.include_saturdays === true || Number(record.include_saturdays) === 1
    for (const entry of entries) {
      const days = typeof entry.days === 'string' ? JSON.parse(entry.days || '{}') : (entry.days || {})
      const totals = calculateMonthlyEntryTotals({
        year: record.year,
        month: record.month,
        days,
        excludedDates,
        includeSaturdays,
        schoolDaysOverride: curSummary.schoolDays || curSummary.school_days
      })
      await run('UPDATE monthly_entries SET present=?, absent=? WHERE record_id=? AND student_id=?', [totals.present, totals.absent, recordId, entry.student_id])
    }
    res.json({ success: true, excluded_dates: excludedDates, holiday_labels: curSummary.holiday_labels || {} })
  } catch (err) {
    console.error('Failed to update excluded dates:', err.message)
    res.status(500).json({ error: 'Failed to update excluded dates' })
  }
})

router.post('/:recordId/sync-calendar', async (req, res) => {
  try {
    const g = await guardRecord(req, res)
    if (!g) return
    const { recordId } = req.params
    const record = g.record
    const monthStr = String(record.month).padStart(2, '0')
    const prefix = `${record.year}-${monthStr}-`
    const events = await query(
      `SELECT id, title, type, event_date FROM calendar_events WHERE school_id = ? AND event_date LIKE ? ORDER BY event_date`,
      [record.school_id, prefix + '%']
    )
    const holidays = events.filter(e => /holiday|suspension|special_non_working|special-non-working|no_classes/i.test(e.type || ''))
    const holidayDays = holidays.map(h => parseInt(h.event_date.split('-')[2], 10)).filter(Number.isInteger)

    const existingExcluded = Array.isArray(record.excluded_dates)
      ? record.excluded_dates
      : JSON.parse(record.excluded_dates || '[]')
    const merged = Array.from(new Set([...existingExcluded, ...holidayDays])).sort((a, b) => a - b)
    const curSummary = JSON.parse(record.summary_data || '{}')
    if (!curSummary.holiday_labels) curSummary.holiday_labels = {}
    for (const h of holidays) {
      const day = parseInt(h.event_date.split('-')[2], 10)
      if (day && h.title) {
        curSummary.holiday_labels[day] = h.title
      }
    }

    await run('UPDATE monthly_records SET excluded_dates=?, summary_data=? WHERE id=?', [JSON.stringify(merged), JSON.stringify(curSummary), recordId])

    const entries = await query('SELECT student_id, days FROM monthly_entries WHERE record_id = ?', [recordId])
    const includeSaturdays = record.include_saturdays === true || Number(record.include_saturdays) === 1
    for (const entry of entries) {
      const days = typeof entry.days === 'string' ? JSON.parse(entry.days || '{}') : (entry.days || {})
      const totals = calculateMonthlyEntryTotals({
        year: record.year,
        month: record.month,
        days,
        excludedDates: merged,
        includeSaturdays,
        schoolDaysOverride: curSummary.schoolDays || curSummary.school_days
      })
      await run('UPDATE monthly_entries SET present=?, absent=? WHERE record_id=? AND student_id=?', [totals.present, totals.absent, recordId, entry.student_id])
    }
    await audit(
      g.me,
      'monthly.sync_calendar',
      { type: 'monthly', id: recordId, name: `${record.grade} - ${record.section}`, schoolId: record.school_id },
      `Synced ${holidays.length} calendar events into excluded days for ${record.grade} - ${record.section} (${record.month}/${record.year})`
    )
    res.json({ success: true, excluded_dates: merged, synced_events: holidays, all_month_events: events })
  } catch (err) {
    console.error('Failed to sync calendar events:', err.message)
    res.status(500).json({ error: 'Failed to sync calendar events' })
  }
})

router.delete('/:recordId', async (req, res) => {
  try {
    const g = await guardRecord(req, res)
    if (!g) return
    const { recordId } = req.params
    await run('DELETE FROM monthly_entries WHERE record_id = ?', [recordId])
    await run('DELETE FROM monthly_records WHERE id = ?', [recordId])
    await audit(
      g.me,
      'monthly.delete',
      { type: 'monthly', id: recordId, name: `${g.record.grade} - ${g.record.section}`, schoolId: g.record.school_id },
      `Deleted monthly SF2 record for ${g.record.grade} - ${g.record.section} (${g.record.month}/${g.record.year})`
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete monthly record:', err.message)
    res.status(500).json({ error: 'Failed to delete monthly record' })
  }
})

export default router
