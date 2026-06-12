import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'

const router = Router()

function dayOfWeek(dateStr) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(dateStr + 'T00:00:00').getDay()]
}

function canEdit(record, userId, userRole) {
  if (userRole === 'admin') return true
  if (userRole === 'teacher') {
    const sched = query('SELECT COUNT(*) as cnt FROM teacher_schedules WHERE teacher_id = ?', [userId])
    return sched.length > 0 && sched[0].cnt > 0
  }
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
    unexcused: !!e.unexcused,
    nls: !!e.nls
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
      (record_id, student_id, name, am1, am2, am3, am4, am5, am6, pm1, pm2, pm3, pm4, reason, excused, unexcused, nls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId, entry.studentId, entry.name,
        entry.periods.am1 || '', entry.periods.am2 || '', entry.periods.am3 || '',
        entry.periods.am4 || '', entry.periods.am5 || '', entry.periods.am6 || '',
        entry.periods.pm1 || '', entry.periods.pm2 || '', entry.periods.pm3 || '', entry.periods.pm4 || '',
        entry.reason || '', entry.excused ? 1 : 0, entry.unexcused ? 1 : 0, entry.nls ? 1 : 0
      ])
  }

  const updated = query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
  res.json({ id: recordId, success: true, record: updated[0] || null })
})

function getAttendanceStatus(entry) {
  if (entry.nls) return 5
  if (entry.excused) return 4
  if (entry.unexcused) return 3
  const periodKeys = ['am1','am2','am3','am4','am5','am6','pm1','pm2','pm3','pm4']
  let hasTardy = false
  let hasAbsent = false
  for (const pk of periodKeys) {
    const v = (entry[pk] || '').trim()
    if (v === 'T') hasTardy = true
    if (v === 'A') hasAbsent = true
  }
  if (hasAbsent) return 3
  if (hasTardy) return 2
  return 1
}

router.get('/monthly', (req, res) => {
  const { grade, section, month, year } = req.query
  if (!grade || !section || !month || !year) {
    return res.status(400).json({ error: 'grade, section, month, and year are required' })
  }

  const m = String(month).padStart(2, '0')
  const prefix = `${year}-${m}`
  const students = query('SELECT * FROM students WHERE grade = ? AND section = ? ORDER BY name', [grade, section])
  const records = query(
    'SELECT * FROM attendance_records WHERE grade = ? AND section = ? AND date LIKE ? ORDER BY date',
    [grade, section, prefix + '%']
  )

  const dateSet = [...new Set(records.map(r => r.date))].sort()
  const entriesByRecord = {}
  for (const r of records) {
    entriesByRecord[r.id] = query('SELECT * FROM attendance_entries WHERE record_id = ?', [r.id])
  }

  const dayAbbr = { 'Monday':'M','Tuesday':'T','Wednesday':'W','Thursday':'TH','Friday':'F','Saturday':'SA','Sunday':'SU' }
  function getDayAbbr(dateStr) {
    return dayAbbr[['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(dateStr + 'T00:00:00').getDay()]]
  }

  const dates = dateSet.map(d => ({
    date: d,
    day: parseInt(d.split('-')[2], 10),
    dayName: getDayAbbr(d)
  }))

  const rows = students.map(s => {
    const dayStatus = {}
    const reasons = []
    let nls = false
    for (const r of records) {
      const recEntries = entriesByRecord[r.id] || []
      const match = recEntries.find(e => e.student_id === s.id)
      if (match) {
        dayStatus[r.date] = getAttendanceStatus(match)
        if (match.reason) reasons.push({ date: r.date, text: match.reason })
        if (match.nls) nls = true
      }
    }
    const totalPresent = Object.values(dayStatus).filter(v => v === 1).length
    const remark = reasons.map(r => `${r.date}: ${r.text}`).join('; ')
    return {
      studentId: s.id,
      name: s.name,
      gender: s.gender || '',
      dayStatus,
      totalPresent,
      nls,
      remark
    }
  })

  res.json({ grade, section, month, year, dates, rows })
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
    unexcused: !!e.unexcused,
    nls: !!e.nls
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
    if (userRole === 'teacher') {
      const dow = dayOfWeek(records[0].date)
      const sched = query('SELECT COUNT(*) as cnt FROM teacher_schedules WHERE teacher_id = ? AND day_of_week = ? AND period = ?',
        [userId, dow, periodKey])
      if (sched.length === 0 || sched[0].cnt === 0) {
        return res.status(403).json({ error: 'You can only edit your assigned periods' })
      }
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
  } else if (field === 'nls') {
    run('UPDATE attendance_entries SET nls=? WHERE record_id=? AND student_id=?',
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

router.put('/:recordId', (req, res) => {
  const { recordId } = req.params
  const { date, grade, section, adviser } = req.body
  try {
    run('UPDATE attendance_records SET date=?, grade=?, section=?, adviser=? WHERE id=?',
      [date, grade, section, adviser, recordId])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to update record' })
  }
})

router.delete('/:recordId', (req, res) => {
  const { recordId } = req.params
  const userId = req.query.userId
  const userRole = req.query.userRole

  const records = query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
  if (records.length === 0) {
    return res.status(404).json({ error: 'Record not found' })
  }

  if (userRole !== 'admin' && records[0].created_by !== userId) {
    return res.status(403).json({ error: 'Only the owner or an admin can delete this record' })
  }

  run('DELETE FROM attendance_entries WHERE record_id = ?', [recordId])
  run('DELETE FROM attendance_records WHERE id = ?', [recordId])

  res.json({ success: true })
})

export default router
