import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { month, year, grade, section } = req.query
  const records = query(
    'SELECT * FROM monthly_records WHERE month = ? AND year = ? AND grade = ? AND section = ?',
    [month, year, grade, section]
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
  res.json(record)
})

router.post('/', (req, res) => {
  const { month, year, grade, section, adviser, entries, created_by, created_by_name } = req.body
  const existing = query(
    'SELECT id FROM monthly_records WHERE month = ? AND year = ? AND grade = ? AND section = ?',
    [month, year, grade, section]
  )
  let recordId
  if (existing.length > 0) {
    recordId = existing[0].id
    run('DELETE FROM monthly_entries WHERE record_id = ?', [recordId])
    run('UPDATE monthly_records SET adviser=? WHERE id=?', [adviser, recordId])
  } else {
    recordId = uuidv4()
    run('INSERT INTO monthly_records (id, month, year, grade, section, adviser, created_by, created_by_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [recordId, month, year, grade, section, adviser, created_by || '', created_by_name || ''])
  }
  for (const entry of entries) {
    run('INSERT INTO monthly_entries (record_id, student_id, student_name, days, present, absent, remarks, late_enrollee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [recordId, entry.studentId, entry.name, JSON.stringify(entry.days || {}), entry.present || 0, entry.absent || 0, entry.remarks || '', entry.late_enrollee ? 1 : 0])
  }
  const updated = query('SELECT * FROM monthly_records WHERE id = ?', [recordId])
  res.json({ id: recordId, success: true, record: updated[0] || null })
})

router.put('/:recordId/entry', (req, res) => {
  const { recordId } = req.params
  const { studentId, day, status, userId, userRole } = req.body

  const records = query('SELECT * FROM monthly_records WHERE id = ?', [recordId])
  if (records.length === 0) return res.status(404).json({ error: 'Record not found' })

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

  let absent = 0
  for (const d of Object.keys(days)) {
    const s = days[d]
    if (s === 'A' || s === '█') absent++
    else if (s === '◢' || s === 'H') absent += 0.5
    // ◤/T counts as full present, no deduction
  }
  const present = total - absent

  run('UPDATE monthly_entries SET days=?, present=?, absent=? WHERE record_id=? AND student_id=?',
    [JSON.stringify(days), present, absent, recordId, studentId])

  res.json({ success: true, present, absent })
})

router.put('/:recordId/remarks', (req, res) => {
  const { recordId } = req.params
  const { studentId, remarks } = req.body
  run('UPDATE monthly_entries SET remarks=? WHERE record_id=? AND student_id=?',
    [remarks, recordId, studentId])
  res.json({ success: true })
})

router.put('/:recordId/summary', (req, res) => {
  const { recordId } = req.params
  const { summary_data, adviser } = req.body
  run('UPDATE monthly_records SET summary_data=?, adviser=? WHERE id=?',
    [JSON.stringify(summary_data || {}), adviser || '', recordId])
  res.json({ success: true })
})

router.put('/:recordId/excluded-dates', (req, res) => {
  const { recordId } = req.params
  const { excluded_dates } = req.body
  run('UPDATE monthly_records SET excluded_dates=? WHERE id=?',
    [JSON.stringify(excluded_dates || []), recordId])
  res.json({ success: true })
})

router.delete('/:recordId', (req, res) => {
  const { recordId } = req.params
  run('DELETE FROM monthly_entries WHERE record_id = ?', [recordId])
  run('DELETE FROM monthly_records WHERE id = ?', [recordId])
  res.json({ success: true })
})

export default router
