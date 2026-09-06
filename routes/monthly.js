import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { requireRole, resolveScopeSchool, actingUser, assertValidClass } from './_context.js'

const router = Router()

function resolveClassScope(me, grade, section) {
  if (me.role === 'teacher') {
    if (!me.grade || !me.section) return { error: 'No advisory class assigned' }
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

router.get('/', (req, res) => {
  const { me, error } = requireRole(req, res, 'superadmin', 'admin', 'teacher')
  if (error) return
  const scope = resolveScopeSchool(req, res, req.query.schoolId)
  if (!scope) return
  if (!scope.schoolId) return res.status(400).json({ error: 'schoolId is required' })
  const { month, year, grade, section } = req.query
  const cls = resolveClassScope(me, grade, section)
  if (cls.error) return res.status(403).json({ error: cls.error })
  const records = query(
    'SELECT * FROM monthly_records WHERE month = ? AND year = ? AND grade = ? AND section = ? AND school_id = ?',
    [month, year, cls.grade, cls.section, scope.schoolId]
  )
  if (records.length === 0) return res.json(null)
  const record = records[0]
  const entries = query('SELECT * FROM monthly_entries WHERE record_id = ? ORDER BY id', [record.id])
  record.entries = entries.map(e => ({
    id: e.id,
    studentId: e.student_id,
    name: e.student_name,
    days: JSON.parse(e.days || '{}'),
    present: e.present,
    absent: e.absent,
    remarks: e.remarks || '',
    late_enrollee: e.late_enrollee || 0
  }))
  record.summary_data = JSON.parse(record.summary_data || '{}')
  record.excluded_dates = JSON.parse(record.excluded_dates || '[]')
  record.schoolHead = record.school_head || ''
  res.json(record)
})

router.post('/', (req, res) => {
  const { me, error } = requireRole(req, res, 'superadmin', 'admin', 'teacher')
  if (error) return
  const scope = resolveScopeSchool(req, res, req.body.schoolId)
  if (!scope) return
  if (!scope.schoolId) return res.status(400).json({ error: 'schoolId is required' })
  const { month, year, grade, section, adviser, entries, created_by, created_by_name } = req.body
  const cls = resolveClassScope(me, grade, section)
  if (cls.error) return res.status(403).json({ error: cls.error })
  if (!assertValidClass(res, scope.schoolId, cls.grade, cls.section)) return
  const existing = query(
    'SELECT id FROM monthly_records WHERE month = ? AND year = ? AND grade = ? AND section = ? AND school_id = ?',
    [month, year, cls.grade, cls.section, scope.schoolId]
  )
  let recordId
  if (existing.length > 0) {
    recordId = existing[0].id
    const rec = query('SELECT * FROM monthly_records WHERE id = ?', [recordId])[0]
    if (!scopeRecordCheck(me, rec)) return res.status(403).json({ error: 'Forbidden: outside your school' })
    run('DELETE FROM monthly_entries WHERE record_id = ?', [recordId])
    run('UPDATE monthly_records SET adviser=?, school_head=? WHERE id=?', [adviser, '', recordId])
  } else {
    recordId = uuidv4()
    run('INSERT INTO monthly_records (id, month, year, grade, section, adviser, school_head, created_by, created_by_name, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [recordId, month, year, cls.grade, cls.section, adviser, '', created_by || '', created_by_name || '', scope.schoolId])
  }
  for (const entry of entries) {
    run('INSERT INTO monthly_entries (record_id, student_id, student_name, days, present, absent, remarks, late_enrollee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [recordId, entry.studentId, entry.name, JSON.stringify(entry.days || {}), entry.present || 0, entry.absent || 0, entry.remarks || '', entry.late_enrollee ? 1 : 0])
  }
  const updated = query('SELECT * FROM monthly_records WHERE id = ?', [recordId])
  res.json({ id: recordId, success: true, record: updated[0] || null })
})

function guardRecord(req, res) {
  const { me, error } = requireRole(req, res, 'superadmin', 'admin', 'teacher')
  if (error) return null
  const records = query('SELECT * FROM monthly_records WHERE id = ?', [req.params.recordId])
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

router.put('/:recordId/entry', (req, res) => {
  const g = guardRecord(req, res)
  if (!g) return
  const { recordId } = req.params
  const { studentId, day, status } = req.body

  const records = [g.record]

  const entries = query('SELECT * FROM monthly_entries WHERE record_id = ? AND student_id = ?', [recordId, studentId])
  if (entries.length === 0) return res.status(404).json({ error: 'Entry not found' })

  const entry = entries[0]
  const days = JSON.parse(entry.days || '{}')
  if (status) {
    days[day] = status
  } else {
    delete days[day]
  }

  // Compute school days from record
  const rec = records[0]
  const dim = new Date(rec.year, rec.month, 0).getDate()
  const excluded = JSON.parse(rec.excluded_dates || '[]')
  let total = 0
  for (let d = 1; d <= dim; d++) {
    const dow = new Date(rec.year, rec.month - 1, d).getDay()
    if (dow === 0 || dow === 6) continue
    if (excluded.includes(d)) continue
    total++
  }

  // Determine earliest enrollment day (E mark)
  let enrollDay = null
  for (const d of Object.keys(days)) {
    if (days[d] === 'E') {
      const dayNum = parseInt(d, 10)
      if (enrollDay === null || dayNum < enrollDay) enrollDay = dayNum
    }
  }

  let absent = 0
  for (const d of Object.keys(days)) {
    const dayNum = parseInt(d, 10)
    if (excluded.includes(dayNum)) continue
    const dow = new Date(rec.year, rec.month - 1, dayNum).getDay()
    if (dow === 0 || dow === 6) continue
    if (enrollDay !== null && dayNum < enrollDay) { absent++; continue }
    const s = days[d]
    if (s === 'A') absent++
    else if (s === '◢' || s === 'H') absent += 0.5
  }
  const present = total - absent

  run('UPDATE monthly_entries SET days=?, present=?, absent=? WHERE record_id=? AND student_id=?',
    [JSON.stringify(days), present, absent, recordId, studentId])

  res.json({ success: true, present, absent })
})

router.put('/:recordId/remarks', (req, res) => {
  const g = guardRecord(req, res)
  if (!g) return
  const { recordId } = req.params
  const { studentId, remarks } = req.body
  run('UPDATE monthly_entries SET remarks=? WHERE record_id=? AND student_id=?',
    [remarks, recordId, studentId])
  res.json({ success: true })
})

router.put('/:recordId/summary', (req, res) => {
  const g = guardRecord(req, res)
  if (!g) return
  const { recordId } = req.params
  const { summary_data, adviser, schoolHead } = req.body
  run('UPDATE monthly_records SET summary_data=?, adviser=?, school_head=? WHERE id=?',
    [JSON.stringify(summary_data || {}), adviser || '', schoolHead || '', recordId])
  res.json({ success: true })
})

router.put('/:recordId/excluded-dates', (req, res) => {
  const g = guardRecord(req, res)
  if (!g) return
  const { recordId } = req.params
  const { excluded_dates } = req.body
  run('UPDATE monthly_records SET excluded_dates=? WHERE id=?',
    [JSON.stringify(excluded_dates || []), recordId])
  res.json({ success: true })
})

router.delete('/:recordId', (req, res) => {
  const { me, error } = requireRole(req, res, 'superadmin', 'admin')
  if (error) return
  const { recordId } = req.params
  const records = query('SELECT * FROM monthly_records WHERE id = ?', [recordId])
  if (records.length === 0) return res.status(404).json({ error: 'Record not found' })
  if (!scopeRecordCheck(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
  run('DELETE FROM monthly_entries WHERE record_id = ?', [recordId])
  run('DELETE FROM monthly_records WHERE id = ?', [recordId])
  res.json({ success: true })
})

export default router
