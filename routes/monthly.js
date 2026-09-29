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
    const entries = await query(`
      SELECT me.*, COALESCE(s.gender, '') as student_gender 
      FROM monthly_entries me 
      LEFT JOIN students s ON s.id = me.student_id 
      WHERE me.record_id = ? 
      ORDER BY me.id
    `, [record.id])
    record.entries = entries.map(e => ({
      id: e.id,
      studentId: e.student_id,
      name: e.student_name,
      gender: e.student_gender || '',
      days: typeof e.days === 'string' ? JSON.parse(e.days || '{}') : (e.days || {}),
      present: e.present,
      absent: e.absent,
      remarks: e.remarks || '',
      late_enrollee: e.late_enrollee || 0
    }))
    record.summary_data = JSON.parse(record.summary_data || '{}')
    record.excluded_dates = JSON.parse(record.excluded_dates || '[]')
    record.include_saturdays = record.include_saturdays === true || Number(record.include_saturdays) === 1
    record.schoolHead = record.school_head || ''
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
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    for (const entry of entries) {
      const student = (await query('SELECT id, school_id FROM students WHERE id = ? AND school_id = ?', [entry.studentId, scope.schoolId]))[0]
      if (!student) return res.status(400).json({ error: `Student ${entry.studentId} does not belong to the selected school` })
      const enrollment = (await query(`
        SELECT grade, section, status FROM student_enrollment_events
        WHERE student_id = ? AND school_id = ? AND effective_on <= ?
        ORDER BY effective_on DESC, event_sequence DESC, created_at DESC, id DESC LIMIT 1`, [entry.studentId, scope.schoolId, monthStart]))[0]
      if (enrollment && (enrollment.status !== 'active' || enrollment.grade !== cls.grade || enrollment.section !== cls.section)) {
        return res.status(400).json({ error: `Student ${entry.studentId} was not enrolled in ${cls.grade} - ${cls.section} at the start of this month` })
      }
    }
    const existing = await query(
      'SELECT id FROM monthly_records WHERE month = ? AND year = ? AND grade = ? AND section = ? AND school_id = ?',
      [month, year, cls.grade, cls.section, scope.schoolId]
    )
    let recordId
    if (existing.length > 0) {
      recordId = existing[0].id
      const rec = (await query('SELECT * FROM monthly_records WHERE id = ?', [recordId]))[0]
      if (!scopeRecordCheck(me, rec)) return res.status(403).json({ error: 'Forbidden: outside your school' })
      await run('DELETE FROM monthly_entries WHERE record_id = ?', [recordId])
      // Preserve an existing report's Saturday setting when regenerating its entries.
      await run('UPDATE monthly_records SET adviser=?, school_head=? WHERE id=?', [adviserName, '', recordId])
    } else {
      recordId = uuidv4()
      await run('INSERT INTO monthly_records (id, month, year, grade, section, adviser, school_head, created_by, created_by_name, school_id, include_saturdays) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [recordId, month, year, cls.grade, cls.section, adviserName, '', me.id, me.name || me.username || '', scope.schoolId, includeSaturdays ? 1 : 0])
    }
    for (const entry of entries) {
      await run('INSERT INTO monthly_entries (record_id, student_id, student_name, days, present, absent, remarks, late_enrollee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [recordId, entry.studentId, entry.name, JSON.stringify(entry.days || {}), entry.present || 0, entry.absent || 0, entry.remarks || '', entry.late_enrollee ? 1 : 0])
    }
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

    const totals = calculateMonthlyEntryTotals({
      year: rec.year,
      month: rec.month,
      days,
      excludedDates: excluded,
      includeSaturdays: rec.include_saturdays === true || Number(rec.include_saturdays) === 1
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
    const entries = await query('SELECT student_id, days FROM monthly_entries WHERE record_id = ?', [record.id])
    await run('UPDATE monthly_records SET include_saturdays=? WHERE id=?', [includeSaturdays ? 1 : 0, record.id])
    for (const entry of entries) {
      const days = typeof entry.days === 'string' ? JSON.parse(entry.days || '{}') : (entry.days || {})
      const totals = calculateMonthlyEntryTotals({
        year: record.year,
        month: record.month,
        days,
        excludedDates: excluded,
        includeSaturdays
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
    await run('UPDATE monthly_records SET summary_data=?, adviser=?, school_head=? WHERE id=?',
      [JSON.stringify(summary_data || {}), adviser || '', schoolHead || '', recordId])
    res.json({ success: true })
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
    await run('UPDATE monthly_records SET excluded_dates=? WHERE id=?',
      [JSON.stringify(excludedDates), recordId])

    // Recalculate stored totals immediately so excluding/restoring a Saturday
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
        includeSaturdays
      })
      await run('UPDATE monthly_entries SET present=?, absent=? WHERE record_id=? AND student_id=?', [totals.present, totals.absent, recordId, entry.student_id])
    }
    res.json({ success: true, excluded_dates: excludedDates })
  } catch (err) {
    console.error('Failed to update excluded dates:', err.message)
    res.status(500).json({ error: 'Failed to update excluded dates' })
  }
})

router.delete('/:recordId', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const { recordId } = req.params
    const records = await query('SELECT * FROM monthly_records WHERE id = ?', [recordId])
    if (records.length === 0) return res.status(404).json({ error: 'Record not found' })
    if (!scopeRecordCheck(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
    await run('DELETE FROM monthly_entries WHERE record_id = ?', [recordId])
    await run('DELETE FROM monthly_records WHERE id = ?', [recordId])
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete monthly record:', err.message)
    res.status(500).json({ error: 'Failed to delete monthly record' })
  }
})

export default router
