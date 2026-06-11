import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'

const router = Router()

function canEdit(record, userId, userRole) {
  if (userRole === 'admin') return true
  if (!record.created_by || record.created_by === userId) return true
  return false
}

router.get('/all', (req, res) => {
  const records = query('SELECT * FROM attendance_records ORDER BY date DESC, grade, section')
  res.json(records)
})

router.get('/', (req, res) => {
  const { date, grade, section } = req.query
  const records = query(
    'SELECT * FROM attendance_records WHERE date = ? AND grade = ? AND section = ?',
    [date, grade, section]
  )

  if (records.length === 0) {
    return res.json(null)
  }

  const record = records[0]
  const entries = query(
    'SELECT * FROM attendance_entries WHERE record_id = ? ORDER BY id',
    [record.id]
  )

  record.entries = entries.map(e => ({
    studentId: e.student_id,
    name: e.name,
    periods: {
      am1: e.am1 || '', am2: e.am2 || '', am3: e.am3 || '',
      am4: e.am4 || '', am5: e.am5 || '', am6: e.am6 || '',
      pm1: e.pm1 || '', pm2: e.pm2 || '', pm3: e.pm3 || '', pm4: e.pm4 || ''
    },
    reason: e.reason || '',
    excused: !!e.excused,
    unexcused: !!e.unexcused
  }))

  res.json(record)
})

router.post('/', (req, res) => {
  const { date, grade, section, adviser, entries, created_by, created_by_name } = req.body
  const existing = query(
    'SELECT id, created_by, created_by_name FROM attendance_records WHERE date = ? AND grade = ? AND section = ?',
    [date, grade, section]
  )

  let recordId
  if (existing.length > 0) {
    recordId = existing[0].id
    run('DELETE FROM attendance_entries WHERE record_id = ?', [recordId])
    run('UPDATE attendance_records SET adviser=? WHERE id=?', [adviser, recordId])
  } else {
    recordId = uuidv4()
    run('INSERT INTO attendance_records (id, date, grade, section, adviser, created_by, created_by_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [recordId, date, grade, section, adviser, created_by || '', created_by_name || ''])
  }

  for (const entry of entries) {
    run(`INSERT INTO attendance_entries
      (record_id, student_id, name, am1, am2, am3, am4, am5, am6, pm1, pm2, pm3, pm4, reason, excused, unexcused)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId, entry.studentId, entry.name,
        entry.periods.am1 || '', entry.periods.am2 || '', entry.periods.am3 || '',
        entry.periods.am4 || '', entry.periods.am5 || '', entry.periods.am6 || '',
        entry.periods.pm1 || '', entry.periods.pm2 || '', entry.periods.pm3 || '', entry.periods.pm4 || '',
        entry.reason || '', entry.excused ? 1 : 0, entry.unexcused ? 1 : 0
      ])
  }

  const updated = query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
  res.json({ id: recordId, success: true, record: updated[0] || null })
})

router.get('/:id', (req, res) => {
  const { id } = req.params
  const records = query('SELECT * FROM attendance_records WHERE id = ?', [id])

  if (records.length === 0) {
    return res.status(404).json({ error: 'Record not found' })
  }

  const record = records[0]
  const entries = query(
    'SELECT * FROM attendance_entries WHERE record_id = ? ORDER BY id',
    [id]
  )

  record.entries = entries.map(e => ({
    studentId: e.student_id,
    name: e.name,
    periods: {
      am1: e.am1 || '', am2: e.am2 || '', am3: e.am3 || '',
      am4: e.am4 || '', am5: e.am5 || '', am6: e.am6 || '',
      pm1: e.pm1 || '', pm2: e.pm2 || '', pm3: e.pm3 || '', pm4: e.pm4 || ''
    },
    reason: e.reason || '',
    excused: !!e.excused,
    unexcused: !!e.unexcused
  }))

  res.json(record)
})

router.put('/:recordId/entry', (req, res) => {
  const { recordId } = req.params
  const { studentId, field, value, userId, userRole } = req.body

  const records = query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
  if (records.length === 0) {
    return res.status(404).json({ error: 'Record not found' })
  }

  if (!canEdit(records[0], userId, userRole)) {
    return res.status(403).json({ error: 'Only the teacher who created this record or an admin can edit it' })
  }

  if (field.startsWith('periods.')) {
    const periodKey = field.split('.')[1]
    const validPeriods = ['am1','am2','am3','am4','am5','am6','pm1','pm2','pm3','pm4']
    if (!validPeriods.includes(periodKey)) {
      return res.status(400).json({ error: 'Invalid period' })
    }
    run(`UPDATE attendance_entries SET ${periodKey}=? WHERE record_id=? AND student_id=?`,
      [value, recordId, studentId])
  } else if (field === 'reason') {
    run('UPDATE attendance_entries SET reason=? WHERE record_id=? AND student_id=?',
      [value, recordId, studentId])
  } else if (field === 'excused') {
    run('UPDATE attendance_entries SET excused=? WHERE record_id=? AND student_id=?',
      [value ? 1 : 0, recordId, studentId])
  } else if (field === 'unexcused') {
    run('UPDATE attendance_entries SET unexcused=? WHERE record_id=? AND student_id=?',
      [value ? 1 : 0, recordId, studentId])
  }

  res.json({ success: true })
})

router.put('/:recordId/unlock', (req, res) => {
  const { recordId } = req.params
  const { userId, userRole } = req.body

  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can unlock records' })
  }

  const records = query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
  if (records.length === 0) {
    return res.status(404).json({ error: 'Record not found' })
  }

  run('UPDATE attendance_records SET created_by=?, created_by_name=? WHERE id=?',
    [userId, '', recordId])

  res.json({ success: true })
})

export default router
