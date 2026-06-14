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
  const periodKeys = ['am1','am2','am3','am4','am5','am6','pm1','pm2','pm3','pm4']
  const amKeys = ['am1','am2','am3','am4','am5','am6']
  let hasAnyA = false
  let hasAnyT = false
  let amAbsentCount = 0
  let amEnteredCount = 0
  for (const pk of periodKeys) {
    const v = (entry[pk] || '').trim()
    if (v === 'A' || v === 'A/S') {
      hasAnyA = true
      if (amKeys.includes(pk)) amAbsentCount++
    }
    if (v === 'T') hasAnyT = true
    if (v === 'E' && amKeys.includes(pk)) amEnteredCount++
  }
  const isHalfDay = amAbsentCount >= 2 && amEnteredCount >= 1
  if (isHalfDay) {
    if (hasAnyT) return 'th'
    return 'hd'
  }
  if (hasAnyA) return 'x'
  if (entry.excused) return 'x'
  if (entry.unexcused) return 'x'
  if (hasAnyT) return 't'
  return ''
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

  const totalSchoolDays = dates.length

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
    const absentCount = Object.values(dayStatus).reduce((sum, v) => {
      if (v === 'x') return sum + 1
      if (v === 'hd' || v === 'th') return sum + 0.5
      return sum
    }, 0)
    const presentCount = totalSchoolDays - absentCount
    const remark = nls ? 'NLS' : reasons.map(r => `${r.date}: ${r.text}`).join('; ')
    return {
      studentId: s.id,
      name: s.name,
      gender: s.gender || '',
      dayStatus,
      absentCount,
      presentCount,
      nls,
      remark
    }
  })

  res.json({ grade, section, month, year, dates, totalSchoolDays, rows })
})

router.get('/monthly/excel', async (req, res) => {
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

  const totalSchoolDays = dates.length
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const monthName = monthNames[parseInt(month) - 1].toUpperCase()
  const sy = `${year}-${parseInt(year) + 1}`

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
    const absentCount = Object.values(dayStatus).reduce((sum, v) => {
      if (v === 'x') return sum + 1
      if (v === 'hd' || v === 'th') return sum + 0.5
      return sum
    }, 0)
    const presentCount = totalSchoolDays - absentCount
    const remark = nls ? 'NLS' : reasons.map(r => `${r.date}: ${r.text}`).join('; ')
    return { name: s.name, dayStatus, absentCount, presentCount, remark }
  })

  try {
    const xlsxMod = await import('xlsx')
    const XLSX = xlsxMod.default || xlsxMod
    const wb = XLSX.utils.book_new()

    const maxCol = 1 + 1 + dates.length + 2 + 1 // No + NAME + dates + ABSENT+PRESENT + REMARKS

    // Build sheet rows
    const wsData = []

    // Row 0: Title (merged across all columns)
    const r0 = Array(maxCol).fill(null)
    r0[0] = 'School Form 2 (SF2) Daily Attendance Report of Learners'
    wsData.push(r0)

    // Row 1: Subtitle (merged across all columns)
    const r1 = Array(maxCol).fill(null)
    r1[0] = '(This replaces Form 1, Form 2 & STS Form 4 - Absenteeism and Dropout Profile)'
    wsData.push(r1)

    // Row 2: School ID, School Year, Month
    const r2 = Array(maxCol).fill(null)
    r2[0] = 'School ID:'
    r2[1] = '406219'
    r2[3] = 'School Year:'
    r2[4] = sy
    r2[6] = 'Month:'
    r2[7] = monthName
    wsData.push(r2)

    // Row 3: Name of School, Grade Level, Section
    const r3 = Array(maxCol).fill(null)
    r3[0] = 'Name of School:'
    r3[1] = 'BAGUIO PATRIOTIC HIGH SCHOOL'
    r3[4] = 'Grade Level:'
    r3[5] = grade.replace('Grade ', '')
    r3[7] = 'Section:'
    r3[8] = section
    wsData.push(r3)

    // Row 4: Table header row 1 - No. | NAME | [dates] | Total for the Month (merged) | REMARKS (maybe merged)
    const colNo = 0
    const colName = 1
    const colFirstDate = 2
    const colLastDate = colFirstDate + dates.length - 1
    const colTotal = colLastDate + 1
    const colAbsent = colTotal
    const colPresent = colTotal + 1
    const colRemarks = colTotal + 2

    const r4 = Array(maxCol).fill(null)
    r4[colNo] = 'No.'
    r4[colName] = 'NAME (Last Name, First Name, Middle Name)'
    for (let i = 0; i < dates.length; i++) {
      r4[colFirstDate + i] = dates[i].day
    }
    r4[colTotal] = 'Total for the Month'
    r4[colRemarks] = 'REMARKS (If NLS, state reason, please refer to legend number 2. If TRANSFERRED IN/OUT, write the name of School.)'
    wsData.push(r4)

    // Row 5: Table header row 2 - (blank) | (blank) | [day abbr] | ABSENT | PRESENT | (blank)
    const r5 = Array(maxCol).fill(null)
    for (let i = 0; i < dates.length; i++) {
      r5[colFirstDate + i] = dates[i].dayName
    }
    r5[colAbsent] = 'ABSENT'
    r5[colPresent] = 'PRESENT'
    wsData.push(r5)

    // Student data rows
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const row = Array(maxCol).fill(null)
      row[colNo] = `${i + 1}.`
      row[colName] = r.name
      for (let j = 0; j < dates.length; j++) {
        const status = r.dayStatus[dates[j].date] || ''
        row[colFirstDate + j] = status === 'x' ? 'x' : ''
      }
      const ac = r.absentCount % 1 === 0 ? r.absentCount : r.absentCount.toFixed(1)
      const pc = r.presentCount % 1 === 0 ? r.presentCount : r.presentCount.toFixed(1)
      row[colAbsent] = ac
      row[colPresent] = pc
      row[colRemarks] = r.remark
      wsData.push(row)
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Merged cells
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: maxCol - 1 } },   // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: maxCol - 1 } },   // Subtitle
      { s: { r: 4, c: colTotal }, e: { r: 4, c: colPresent } },  // Total for the Month spanning ABSENT+PRESENT
    ]

    // Column widths
    const cols = Array(maxCol).fill(null)
    cols[colNo] = { wch: 5 }
    cols[colName] = { wch: 42 }
    for (let i = colFirstDate; i <= colLastDate; i++) cols[i] = { wch: 5 }
    cols[colAbsent] = { wch: 8 }
    cols[colPresent] = { wch: 8 }
    cols[colRemarks] = { wch: 35 }
    ws['!cols'] = cols

    // Cell styling - bold headers
    for (let c = 0; c < maxCol; c++) {
      if (wsData[4][c] !== null && wsData[4][c] !== '') {
        const addr = XLSX.utils.encode_cell({ r: 4, c })
        if (!ws[addr]) ws[addr] = {}
        ws[addr].s = { font: { bold: true } }
      }
    }
    // Bold ABSENT, PRESENT
    ;[colAbsent, colPresent].forEach(c => {
      const addr = XLSX.utils.encode_cell({ r: 5, c })
      if (!ws[addr]) ws[addr] = {}
      ws[addr].s = { font: { bold: true } }
    })

    XLSX.utils.book_append_sheet(wb, ws, 'SF2')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fname = `SF2_${grade.replace(' ', '_')}_${section}_${monthName}_${year}.xlsx`
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(buf)
  } catch (err) {
    console.error('Excel export error:', err)
    res.status(500).json({ error: 'Failed to generate Excel file' })
  }
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
