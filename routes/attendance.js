import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, getSettings } from '../db.js'
import { requireRole, resolveScopeSchool, audit } from './_context.js'

const router = Router()

async function guardAttendanceRecord(req, res) {
  const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
  if (error) return null
  return me
}

function recordSchoolOk(me, record) {
  if (!record) return true
  if (me.role === 'superadmin') return true
  return record.school_id === me.school_id
}

function canEdit(record, actor) {
  if (!actor) return false
  if (actor.role === 'superadmin') return true
  if (actor.role === 'admin') {
    return !!record.school_id && actor.school_id === record.school_id
  }
  if (actor.role === 'teacher') {
    if (record.school_id && actor.school_id !== record.school_id) return false
    if (actor.grade && actor.section) {
      return record.grade === actor.grade && record.section === actor.section
    }
    return true
  }
  return false
}

const DEFAULT_CORRECTION_WINDOW_HOURS = 48

function isCorrectionWindowActive(record) {
  if (!record?.reopened_at) return false
  const reopenedTime = new Date(record.reopened_at).getTime()
  if (isNaN(reopenedTime)) return false
  const windowMs = DEFAULT_CORRECTION_WINDOW_HOURS * 60 * 60 * 1000
  return (Date.now() - reopenedTime) <= windowMs
}

function isRecordLocked(record) {
  if (record?.reopened_at && isCorrectionWindowActive(record)) return false
  return Number(record?.locked) === 1 || Boolean(record?.locked_at)
}

async function ensureRecordLock(record) {
  if (!record || !record.school_id || !record.date) return record

  const schools = await query('SELECT attendance_lock_cutoff FROM schools WHERE id = ?', [record.school_id])
  const cutoff = String(schools[0]?.attendance_lock_cutoff || '').trim()
  if (!cutoff || record.date > cutoff) return record

  // If already locked and not reopened, keep locked
  if (Number(record.locked) === 1 && !record.reopened_at) return record

  // If reopened, verify whether the correction window has elapsed
  if (record.reopened_at) {
    if (isCorrectionWindowActive(record)) {
      return record
    }
    // Window elapsed: automatically relock
    const lockedAt = databaseTimestamp()
    await run('UPDATE attendance_records SET locked = 1, locked_at = ?, locked_by = ? WHERE id = ?', [lockedAt, 'system:window_expired', record.id])
    return { ...record, locked: 1, locked_at: lockedAt, locked_by: 'system:window_expired' }
  }

  const lockedAt = databaseTimestamp()
  await run('UPDATE attendance_records SET locked = 1, locked_at = ?, locked_by = ? WHERE id = ?', [lockedAt, 'system', record.id])
  return { ...record, locked: 1, locked_at: lockedAt, locked_by: 'system' }
}

function lockError(res) {
  return res.status(423).json({ error: 'This attendance record is locked. An administrator must reopen it before changes can be made.', locked: true })
}

function databaseTimestamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000 // 10 minutes
const idempotencyStore = new Map() // key -> { timestamp, status, body }
const inFlightAttendanceSaves = new Map() // key -> Promise

function getCachedIdempotentResponse(key) {
  if (!key) return null
  const cached = idempotencyStore.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > IDEMPOTENCY_TTL_MS) {
    idempotencyStore.delete(key)
    return null
  }
  return cached
}

function setCachedIdempotentResponse(key, status, body) {
  if (!key) return
  if (idempotencyStore.size > 2000) {
    const now = Date.now()
    for (const [k, v] of idempotencyStore.entries()) {
      if (now - v.timestamp > IDEMPOTENCY_TTL_MS) idempotencyStore.delete(k)
    }
  }
  idempotencyStore.set(key, { timestamp: Date.now(), status, body })
}

async function validateEntryStudents(entries, schoolId, date, grade, section) {
  const ids = [...new Set(entries.map(entry => String(entry.studentId || '').trim()).filter(Boolean))]
  if (!ids.length) return null
  for (const studentId of ids) {
    const rows = await query('SELECT * FROM students WHERE id = ? AND school_id = ?', [studentId, schoolId])
    if (!rows.length) return `Student ${studentId} does not belong to the selected school`
    const events = await query(`
      SELECT event_type, status, grade, section
      FROM student_enrollment_events
      WHERE student_id = ? AND school_id = ? AND effective_on <= ?
      ORDER BY effective_on DESC, created_at DESC, id DESC
      LIMIT 1`, [studentId, schoolId, date])
    const enrollment = events[0]
    if (enrollment) {
      if (enrollment.status !== 'active') return `Student ${studentId} was not actively enrolled on ${date}`
      if (enrollment.grade !== grade || enrollment.section !== section) {
        return `Student ${studentId} was not enrolled in ${grade} - ${section} on ${date}`
      }
    } else if (rows[0].grade !== grade || rows[0].section !== section) {
      return `Student ${studentId} is not enrolled in ${grade} - ${section}`
    }
  }
  return null
}

async function addCorrection({ record, studentId = '', field, oldValue, newValue, reason = '', actor }) {
  if (!record?.reopened_at || String(oldValue ?? '') === String(newValue ?? '')) return
  await run(`INSERT INTO attendance_corrections
    (record_id, student_id, field, old_value, new_value, reason, actor_id, actor_name, actor_role, school_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      record.id, studentId, field, String(oldValue ?? ''), String(newValue ?? ''),
      String(reason || 'Post-reopen correction'), actor.id, actor.name || '', actor.role, record.school_id || actor.school_id || ''
    ])
}

async function addRecordCorrections(record, next, actor, reason = '') {
  for (const field of ['date', 'grade', 'section', 'adviser', 'teacher_notes']) {
    if (next[field] !== undefined) {
      await addCorrection({ record, field, oldValue: record[field], newValue: next[field], reason, actor })
    }
  }
}

async function lockRecordIfNeeded(record, actor, res) {
  const current = await ensureRecordLock(record)
  if (isRecordLocked(current)) {
    lockError(res)
    return null
  }
  if (!canEdit(current, actor)) {
    res.status(403).json({ error: 'Only the advisory teacher or an administrator can edit this record' })
    return null
  }
  return current
}

router.get('/all', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    const records = scope.schoolId
      ? await query('SELECT * FROM attendance_records WHERE school_id = ? ORDER BY date DESC, grade, section', [scope.schoolId])
      : await query('SELECT * FROM attendance_records ORDER BY date DESC, grade, section')
    res.json(await Promise.all(records.map(ensureRecordLock)))
  } catch (err) {
    console.error('Failed to fetch attendance records:', err.message)
    res.status(500).json({ error: 'Failed to fetch attendance records' })
  }
})

router.get('/summaries', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return

    const { startDate, endDate, grade, section, gender, status, adviser } = req.query
    const sid = scope.schoolId

    let recordSql = 'SELECT * FROM attendance_records WHERE 1=1'
    const recordParams = []
    if (sid) { recordSql += ' AND school_id = ?'; recordParams.push(sid) }
    if (startDate) { recordSql += ' AND date >= ?'; recordParams.push(startDate) }
    if (endDate) { recordSql += ' AND date <= ?'; recordParams.push(endDate) }
    if (grade) { recordSql += ' AND grade = ?'; recordParams.push(grade) }
    if (section) { recordSql += ' AND section = ?'; recordParams.push(section) }
    if (adviser) { recordSql += ' AND adviser LIKE ?'; recordParams.push(`%${adviser}%`) }
    recordSql += ' ORDER BY date ASC, grade ASC, section ASC'

    const records = await query(recordSql, recordParams)
    const recordIds = records.map(r => r.id)

    if (!recordIds.length) {
      return res.json({
        summary: { totalSessions: 0, totalEntries: 0, present: 0, absent: 0, tardy: 0, attendanceRate: 0, studentsCount: 0 },
        byGender: { male: { present: 0, absent: 0, tardy: 0, rate: 0, count: 0 }, female: { present: 0, absent: 0, tardy: 0, rate: 0, count: 0 } },
        bySection: [],
        byStatus: { active: { present: 0, absent: 0, rate: 0, count: 0 }, withdrawn: { present: 0, absent: 0, rate: 0, count: 0 } },
        dailyTrends: []
      })
    }

    const studentRows = await query(`SELECT id, name, gender, enrollment_status, grade, section FROM students ${sid ? 'WHERE school_id = ?' : ''}`, sid ? [sid] : [])
    const studentMap = new Map()
    studentRows.forEach(s => studentMap.set(String(s.id), s))

    const inPlaceholders = recordIds.map(() => '?').join(',')
    const entries = await query(`SELECT * FROM attendance_entries WHERE record_id IN (${inPlaceholders})`, recordIds)

    const recordMap = new Map()
    records.forEach(r => recordMap.set(r.id, r))

    let totalPresent = 0
    let totalAbsent = 0
    let totalTardy = 0
    const uniqueStudents = new Set()

    const genderStats = {
      male: { present: 0, absent: 0, tardy: 0, students: new Set() },
      female: { present: 0, absent: 0, tardy: 0, students: new Set() }
    }

    const sectionMap = new Map()
    const statusStats = {
      active: { present: 0, absent: 0, tardy: 0, students: new Set() },
      withdrawn: { present: 0, absent: 0, tardy: 0, students: new Set() }
    }

    const dailyMap = new Map()

    for (const e of entries) {
      const rec = recordMap.get(e.record_id)
      if (!rec) continue

      const stu = studentMap.get(String(e.student_id))
      const studentGender = stu?.gender?.toLowerCase() || ''
      const studentStatus = stu?.enrollment_status || 'active'

      if (gender && studentGender !== gender.toLowerCase()) continue
      if (status && status !== 'all' && studentStatus !== status) continue

      uniqueStudents.add(e.student_id)

      const periods = [e.am1, e.am2, e.am3, e.am4, e.am5, e.am6, e.pm1, e.pm2, e.pm3, e.pm4].filter(Boolean)
      const isAbsent = periods.every(p => p === 'A') || periods.length === 0
      const isTardy = periods.some(p => p === 'T' || p === 'E/T')
      const isPresent = !isAbsent

      const presVal = isPresent ? 1 : 0
      const absVal = isAbsent ? 1 : 0
      const tardVal = isTardy ? 1 : 0

      totalPresent += presVal
      totalAbsent += absVal
      totalTardy += tardVal

      if (studentGender === 'male') {
        genderStats.male.present += presVal
        genderStats.male.absent += absVal
        genderStats.male.tardy += tardVal
        genderStats.male.students.add(e.student_id)
      } else if (studentGender === 'female') {
        genderStats.female.present += presVal
        genderStats.female.absent += absVal
        genderStats.female.tardy += tardVal
        genderStats.female.students.add(e.student_id)
      }

      const statBucket = statusStats[studentStatus] || statusStats.active
      statBucket.present += presVal
      statBucket.absent += absVal
      statBucket.tardy += tardVal
      statBucket.students.add(e.student_id)

      const secKey = `${rec.grade}__${rec.section}`
      if (!sectionMap.has(secKey)) {
        sectionMap.set(secKey, {
          grade: rec.grade,
          section: rec.section,
          adviser: rec.adviser,
          sessions: new Set(),
          present: 0,
          absent: 0,
          tardy: 0,
          students: new Set()
        })
      }
      const secObj = sectionMap.get(secKey)
      secObj.sessions.add(rec.date)
      secObj.present += presVal
      secObj.absent += absVal
      secObj.tardy += tardVal
      secObj.students.add(e.student_id)

      if (!dailyMap.has(rec.date)) {
        dailyMap.set(rec.date, { date: rec.date, present: 0, absent: 0, tardy: 0 })
      }
      const dayObj = dailyMap.get(rec.date)
      dayObj.present += presVal
      dayObj.absent += absVal
      dayObj.tardy += tardVal
    }

    const totalDays = totalPresent + totalAbsent
    const overallRate = totalDays > 0 ? Number(((totalPresent / totalDays) * 100).toFixed(1)) : 0
    const calcRate = (p, a) => (p + a > 0 ? Number(((p / (p + a)) * 100).toFixed(1)) : 0)

    const bySection = Array.from(sectionMap.values()).map(s => ({
      grade: s.grade,
      section: s.section,
      adviser: s.adviser,
      sessionsCount: s.sessions.size,
      learnersCount: s.students.size,
      present: s.present,
      absent: s.absent,
      tardy: s.tardy,
      rate: calcRate(s.present, s.absent)
    }))

    const dailyTrends = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        rate: calcRate(d.present, d.absent)
      }))

    res.json({
      filters: { schoolId: sid, startDate, endDate, grade, section, gender, status, adviser },
      summary: {
        totalSessions: records.length,
        totalEntries: entries.length,
        present: totalPresent,
        absent: totalAbsent,
        tardy: totalTardy,
        attendanceRate: overallRate,
        studentsCount: uniqueStudents.size
      },
      byGender: {
        male: {
          present: genderStats.male.present,
          absent: genderStats.male.absent,
          tardy: genderStats.male.tardy,
          rate: calcRate(genderStats.male.present, genderStats.male.absent),
          count: genderStats.male.students.size
        },
        female: {
          present: genderStats.female.present,
          absent: genderStats.female.absent,
          tardy: genderStats.female.tardy,
          rate: calcRate(genderStats.female.present, genderStats.female.absent),
          count: genderStats.female.students.size
        }
      },
      bySection,
      byStatus: {
        active: {
          present: statusStats.active.present,
          absent: statusStats.active.absent,
          rate: calcRate(statusStats.active.present, statusStats.active.absent),
          count: statusStats.active.students.size
        },
        withdrawn: {
          present: statusStats.withdrawn.present,
          absent: statusStats.withdrawn.absent,
          rate: calcRate(statusStats.withdrawn.present, statusStats.withdrawn.absent),
          count: statusStats.withdrawn.students.size
        }
      },
      dailyTrends
    })
  } catch (err) {
    console.error('Failed to compute attendance summaries:', err.message)
    res.status(500).json({ error: 'Failed to compute attendance summaries' })
  }
})

router.get('/', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    const { date, grade, section } = req.query
    const params = [date, grade, section]
    let sql = 'SELECT * FROM attendance_records WHERE date = ? AND grade = ? AND section = ?'
    if (scope.schoolId) { sql += ' AND school_id = ?'; params.push(scope.schoolId) }
    const records = await query(sql, params)

    if (records.length === 0) {
      return res.json(null)
    }

    const record = await ensureRecordLock(records[0])
    const entries = await query(
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
  } catch (err) {
    console.error('Failed to fetch attendance record:', err.message)
    res.status(500).json({ error: 'Failed to fetch attendance record' })
  }
})

router.post('/', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const scope = await resolveScopeSchool(req, res, req.body.schoolId)
    if (!scope) return
    if (!scope.schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const rawIdempotencyKey = req.headers['idempotency-key'] ||
      req.headers['x-idempotency-key'] ||
      req.body?.idempotencyKey ||
      req.body?.idempotency_key
    const idempotencyKey = rawIdempotencyKey ? String(rawIdempotencyKey).trim() : null

    if (idempotencyKey) {
      const cached = getCachedIdempotentResponse(idempotencyKey)
      if (cached) {
        return res.status(cached.status).json(cached.body)
      }
      if (inFlightAttendanceSaves.has(idempotencyKey)) {
        try {
          const result = await inFlightAttendanceSaves.get(idempotencyKey)
          return res.status(result.status).json(result.body)
        } catch {
          return res.status(500).json({ error: 'Concurrent roll call save failed' })
        }
      }
    }

    const { date, grade, section, adviser, entries = [] } = req.body
    const teacherNotes = typeof req.body.teacher_notes === 'string'
      ? req.body.teacher_notes
      : (typeof req.body.teacherNotes === 'string' ? req.body.teacherNotes : null)
    if (!date || !grade || !section) return res.status(400).json({ error: 'date, grade, and section are required' })
    const entryScopeError = await validateEntryStudents(entries, scope.schoolId, date, grade, section)
    if (entryScopeError) return res.status(400).json({ error: entryScopeError })
    const existing = await query(
      'SELECT * FROM attendance_records WHERE date = ? AND grade = ? AND section = ? AND school_id = ?',
      [date, grade, section, scope.schoolId]
    )

    let recordId
    if (existing.length > 0) {
      recordId = existing[0].id
      if (!recordSchoolOk(me, existing[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
      const current = await lockRecordIfNeeded(existing[0], me, res)
      if (!current) return
      const correctionReason = String(req.body.correctionReason || '').trim()
      const nextRecordData = { date, grade, section, adviser }
      if (teacherNotes !== null) nextRecordData.teacher_notes = teacherNotes
      await addRecordCorrections(current, nextRecordData, me, correctionReason)
      const oldEntries = await query('SELECT * FROM attendance_entries WHERE record_id = ?', [recordId])
      const oldByStudent = new Map(oldEntries.map(entry => [String(entry.student_id), entry]))
      for (const entry of entries) {
        const old = oldByStudent.get(String(entry.studentId))
        if (!old) continue
        const values = {
          ...Object.fromEntries(['am1','am2','am3','am4','am5','am6','pm1','pm2','pm3','pm4'].map(key => [key, entry.periods?.[key] || ''])),
          reason: entry.reason || '',
          excused: entry.excused ? 1 : 0,
          unexcused: entry.unexcused ? 1 : 0,
          nls: entry.nls ? 1 : 0
        }
        for (const [field, newValue] of Object.entries(values)) {
          await addCorrection({ record: current, studentId: entry.studentId, field, oldValue: old[field], newValue, reason: correctionReason, actor: me })
        }
      }
      await run('DELETE FROM attendance_entries WHERE record_id = ?', [recordId])
      if (teacherNotes !== null) {
        await run('UPDATE attendance_records SET adviser=?, teacher_notes=? WHERE id=?', [adviser, teacherNotes, recordId])
      } else {
        await run('UPDATE attendance_records SET adviser=? WHERE id=?', [adviser, recordId])
      }
    } else {
      if (me.role === 'teacher' && me.grade && me.section) {
        if (grade !== me.grade || section !== me.section) {
          return res.status(403).json({ error: 'Forbidden: you may only record attendance for your assigned advisory class' })
        }
      }
      recordId = uuidv4()
      await run('INSERT INTO attendance_records (id, date, grade, section, adviser, created_by, created_by_name, school_id, teacher_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [recordId, date, grade, section, adviser, me.id, me.name || '', scope.schoolId, teacherNotes || ''])
    }

    for (const entry of entries) {
      await run(`INSERT INTO attendance_entries
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

    const updatedRows = await query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
    const updated = updatedRows.length ? await ensureRecordLock(updatedRows[0]) : null
    await audit(
      me,
      existing.length > 0 ? 'attendance.update' : 'attendance.create',
      { type: 'attendance', id: recordId, name: `${grade} - ${section}`, schoolId: scope.schoolId },
      `Recorded roll call for ${grade} - ${section} on ${date} (${entries.length} learners)`
    )

    const responsePayload = { id: recordId, success: true, record: updated || null }
    if (idempotencyKey) {
      setCachedIdempotentResponse(idempotencyKey, 200, responsePayload)
    }
    res.json(responsePayload)
  } catch (err) {
    console.error('Failed to save attendance record:', err.message)
    res.status(500).json({ error: 'Failed to save attendance record' })
  }
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

router.get('/monthly', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    if (!scope.schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const { grade, section, month, year } = req.query
    if (!grade || !section || !month || !year) {
      return res.status(400).json({ error: 'grade, section, month, and year are required' })
    }

    const m = String(month).padStart(2, '0')
    const prefix = `${year}-${m}`
    const students = await query('SELECT * FROM students WHERE grade = ? AND section = ? AND school_id = ? ORDER BY name', [grade, section, scope.schoolId])
    const records = await query(
      'SELECT * FROM attendance_records WHERE grade = ? AND section = ? AND date LIKE ? AND school_id = ? ORDER BY date',
      [grade, section, prefix + '%', scope.schoolId]
    )

    const dateSet = [...new Set(records.map(r => r.date))].sort()
    const entriesByRecord = {}
    for (const r of records) {
      entriesByRecord[r.id] = await query('SELECT * FROM attendance_entries WHERE record_id = ?', [r.id])
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
  } catch (err) {
    console.error('Failed to fetch monthly attendance:', err.message)
    res.status(500).json({ error: 'Failed to fetch monthly attendance' })
  }
})

router.get('/monthly/excel', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const scope = await resolveScopeSchool(req, res, req.query.schoolId)
    if (!scope) return
    if (!scope.schoolId) return res.status(400).json({ error: 'schoolId is required' })
    const { grade, section, month, year } = req.query
    if (!grade || !section || !month || !year) {
      return res.status(400).json({ error: 'grade, section, month, and year are required' })
    }

    const m = String(month).padStart(2, '0')
    const prefix = `${year}-${m}`
    const students = await query('SELECT * FROM students WHERE grade = ? AND section = ? AND school_id = ? ORDER BY name', [grade, section, scope.schoolId])
    const records = await query(
      'SELECT * FROM attendance_records WHERE grade = ? AND section = ? AND date LIKE ? AND school_id = ? ORDER BY date',
      [grade, section, prefix + '%', scope.schoolId]
    )

    const dateSet = [...new Set(records.map(r => r.date))].sort()
    const entriesByRecord = {}
    for (const r of records) {
      entriesByRecord[r.id] = await query('SELECT * FROM attendance_entries WHERE record_id = ?', [r.id])
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

    const school = await getSettings(scope.schoolId)

    // Row 2: School ID, School Year, Month
    const r2 = Array(maxCol).fill(null)
    r2[0] = 'School ID:'
    r2[1] = school.school_id
    r2[3] = 'School Year:'
    r2[4] = sy
    r2[6] = 'Month:'
    r2[7] = monthName
    wsData.push(r2)

    // Row 3: Name of School, Grade Level, Section
    const r3 = Array(maxCol).fill(null)
    r3[0] = 'Name of School:'
    r3[1] = school.school_name
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

router.get('/:recordId/corrections', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const records = await query('SELECT * FROM attendance_records WHERE id = ?', [req.params.recordId])
    if (!records.length) return res.status(404).json({ error: 'Record not found' })
    if (!recordSchoolOk(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const rows = await query('SELECT * FROM attendance_corrections WHERE record_id = ? ORDER BY created_at DESC, id DESC', [req.params.recordId])
    res.json(rows)
  } catch (err) {
    console.error('Failed to fetch attendance corrections:', err.message)
    res.status(500).json({ error: 'Failed to fetch attendance corrections' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const { id } = req.params
    const records = await query('SELECT * FROM attendance_records WHERE id = ?', [id])

    if (records.length === 0) {
      return res.status(404).json({ error: 'Record not found' })
    }
    if (!recordSchoolOk(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })

    const record = await ensureRecordLock(records[0])
    const entries = await query(
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
  } catch (err) {
    console.error('Failed to fetch attendance record:', err.message)
    res.status(500).json({ error: 'Failed to fetch attendance record' })
  }
})

router.put('/:recordId/entry', async (req, res) => {
  try {
    const { recordId } = req.params
    const { studentId, field, value, correctionReason } = req.body
    if (typeof field !== 'string' || !field.trim()) return res.status(400).json({ error: 'Attendance field is required' })
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return

    const records = await query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
    if (records.length === 0) return res.status(404).json({ error: 'Record not found' })
    if (!recordSchoolOk(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const record = await lockRecordIfNeeded(records[0], me, res)
    if (!record) return

    const entryRows = await query('SELECT * FROM attendance_entries WHERE record_id = ? AND student_id = ?', [recordId, studentId])
    if (!entryRows.length) return res.status(404).json({ error: 'Attendance entry not found' })
    const oldEntry = entryRows[0]
    const validPeriods = ['am1','am2','am3','am4','am5','am6','pm1','pm2','pm3','pm4']
    const validFields = ['reason', 'excused', 'unexcused', 'nls']
    const correctionField = field.startsWith('periods.') ? field.split('.')[1] : field
    if ((field.startsWith('periods.') && !validPeriods.includes(correctionField)) || (!field.startsWith('periods.') && !validFields.includes(field))) {
      return res.status(400).json({ error: 'Invalid attendance field' })
    }
    const oldValue = oldEntry[correctionField]
    const newValue = ['excused', 'unexcused', 'nls'].includes(correctionField) ? (value ? 1 : 0) : value
    await addCorrection({ record, studentId, field, oldValue, newValue, reason: correctionReason, actor: me })

    if (field.startsWith('periods.')) {
      const periodKey = field.split('.')[1]
      await run(`UPDATE attendance_entries SET ${periodKey}=? WHERE record_id=? AND student_id=?`,
        [value, recordId, studentId])
    } else if (field === 'reason') {
      await run('UPDATE attendance_entries SET reason=? WHERE record_id=? AND student_id=?',
        [value, recordId, studentId])
    } else if (field === 'excused') {
      await run('UPDATE attendance_entries SET excused=? WHERE record_id=? AND student_id=?',
        [value ? 1 : 0, recordId, studentId])
    } else if (field === 'unexcused') {
      await run('UPDATE attendance_entries SET unexcused=? WHERE record_id=? AND student_id=?',
        [value ? 1 : 0, recordId, studentId])
    } else if (field === 'nls') {
      await run('UPDATE attendance_entries SET nls=? WHERE record_id=? AND student_id=?',
        [value ? 1 : 0, recordId, studentId])
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Failed to update attendance entry:', err.message)
    res.status(500).json({ error: 'Failed to update attendance entry' })
  }
})

router.put('/:recordId/reopen', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const { recordId } = req.params
    const reason = String(req.body?.reason || '').trim()
    if (!reason) return res.status(400).json({ error: 'A reason is required to reopen an attendance record' })
    const records = await query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
    if (!records.length) return res.status(404).json({ error: 'Record not found' })
    const record = records[0]
    if (!recordSchoolOk(me, record)) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const current = await ensureRecordLock(record)
    if (Number(current.locked) !== 1) return res.status(409).json({ error: 'Attendance record is not locked' })

    const now = databaseTimestamp()
    await run('UPDATE attendance_records SET reopened_at = ?, reopened_by = ?, reopen_reason = ? WHERE id = ?', [now, me.id, reason, recordId])
    await audit(me, 'attendance.reopen', { type: 'attendance', id: recordId, name: `${record.grade} - ${record.section}`, schoolId: record.school_id }, reason)
    res.json({ success: true, record: { ...current, reopened_at: now, reopened_by: me.id, reopen_reason: reason } })
  } catch (err) {
    console.error('Failed to reopen attendance record:', err.message)
    res.status(500).json({ error: 'Failed to reopen attendance record' })
  }
})

// Retain ownership transfer as a separate action; it does not reopen locked records.
router.put('/:recordId/unlock', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    const { recordId } = req.params
    const records = await query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
    if (!records.length) return res.status(404).json({ error: 'Record not found' })
    if (!recordSchoolOk(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const current = await ensureRecordLock(records[0])
    if (isRecordLocked(current)) return lockError(res)
    await run('UPDATE attendance_records SET created_by=?, created_by_name=? WHERE id=?', [me.id, me.name || '', recordId])
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to transfer attendance ownership:', err.message)
    res.status(500).json({ error: 'Failed to transfer attendance ownership' })
  }
})

router.put('/:recordId', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const { recordId } = req.params
    const { date, grade, section, adviser } = req.body
    const teacherNotes = typeof req.body.teacher_notes === 'string'
      ? req.body.teacher_notes
      : (typeof req.body.teacherNotes === 'string' ? req.body.teacherNotes : null)
    const records = await query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
    if (records.length === 0) return res.status(404).json({ error: 'Record not found' })
    if (!recordSchoolOk(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const current = await lockRecordIfNeeded(records[0], me, res)
    if (!current) return
    const nextData = { date, grade, section, adviser }
    if (teacherNotes !== null) nextData.teacher_notes = teacherNotes
    await addRecordCorrections(current, nextData, me, String(req.body.correctionReason || '').trim())
    if (teacherNotes !== null) {
      await run('UPDATE attendance_records SET date=?, grade=?, section=?, adviser=?, teacher_notes=? WHERE id=?',
        [date, grade, section, adviser, teacherNotes, recordId])
    } else {
      await run('UPDATE attendance_records SET date=?, grade=?, section=?, adviser=? WHERE id=?',
        [date, grade, section, adviser, recordId])
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to update attendance record:', err.message)
    res.status(500).json({ error: 'Failed to update attendance record' })
  }
})

const VALID_DEPED_CODES = new Set(['E', 'A', 'T', 'H', '◢', 'A/S', 'E/T', 'NIPS', 'NIPU', 'NIPHC'])

function normalizeAttendanceCode(code) {
  const c = String(code || '').trim().toUpperCase()
  if (!c || c === 'PRESENT' || c === 'P' || c === 'YES' || c === '1') return 'E'
  if (c === 'ABSENT' || c === 'A' || c === 'NO' || c === '0') return 'A'
  if (c === 'TARDY' || c === 'T' || c === 'LATE') return 'T'
  if (c === 'HALF' || c === 'HALF-DAY' || c === 'H') return '◢'
  if (VALID_DEPED_CODES.has(c)) return c
  return 'E'
}

router.post('/bulk-import-validate', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const scope = await resolveScopeSchool(req, res, req.body.schoolId)
    if (!scope) return

    const { date, grade, section, entries = [] } = req.body
    if (!date || !grade || !section) {
      return res.status(400).json({ error: 'date, grade, and section are required' })
    }

    const schools = await query('SELECT attendance_lock_cutoff FROM schools WHERE id = ?', [scope.schoolId])
    const cutoff = String(schools[0]?.attendance_lock_cutoff || '').trim()
    const isLockedDate = Boolean(cutoff && date <= cutoff)

    const existingRows = await query(
      'SELECT id, locked, locked_at, reopened_at FROM attendance_records WHERE date = ? AND grade = ? AND section = ? AND school_id = ?',
      [date, grade, section, scope.schoolId]
    )
    const existing = existingRows[0] || null
    const lockedByExisting = existing && isRecordLocked(existing)

    if (isLockedDate && (!existing || lockedByExisting)) {
      return res.status(423).json({
        error: `Attendance for ${date} is locked by school cutoff (${cutoff}). An administrator must reopen the record before importing.`
      })
    }

    const students = await query(
      'SELECT id, name, gender FROM students WHERE school_id = ? AND grade = ? AND section = ?',
      [scope.schoolId, grade, section]
    )
    const studentById = new Map(students.map(s => [s.id, s]))
    const studentByName = new Map(students.map(s => [s.name.trim().toLowerCase(), s]))

    const valid = []
    const errors = []

    entries.forEach((row, idx) => {
      const rowNum = idx + 1
      const studentId = row.studentId ? String(row.studentId).trim() : null
      const studentName = row.name ? String(row.name).trim() : ''

      let matchedStudent = null
      if (studentId && studentById.has(studentId)) {
        matchedStudent = studentById.get(studentId)
      } else if (studentName && studentByName.has(studentName.toLowerCase())) {
        matchedStudent = studentByName.get(studentName.toLowerCase())
      }

      if (!matchedStudent) {
        errors.push({
          rowNumber: rowNum,
          row,
          error: `Learner "${studentName || studentId}" not enrolled in ${grade} - ${section}`
        })
        return
      }

      const status = normalizeAttendanceCode(row.status || row.attendance || row.code || 'E')
      const periods = row.periods || {
        am1: status, am2: status, am3: status, am4: status, am5: status, am6: status,
        pm1: status, pm2: status, pm3: status, pm4: status
      }

      valid.push({
        rowNumber: rowNum,
        studentId: matchedStudent.id,
        name: matchedStudent.name,
        gender: matchedStudent.gender,
        status,
        periods,
        reason: String(row.reason || '').trim(),
        excused: Boolean(row.excused),
        unexcused: Boolean(row.unexcused)
      })
    })

    res.json({
      valid,
      errors,
      summary: {
        total: entries.length,
        validCount: valid.length,
        errorCount: errors.length,
        classEnrolledCount: students.length,
        date,
        grade,
        section
      }
    })
  } catch (err) {
    console.error('Failed to validate attendance import:', err.message)
    res.status(500).json({ error: 'Failed to validate attendance import' })
  }
})

router.post('/bulk-import', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const scope = await resolveScopeSchool(req, res, req.body.schoolId)
    if (!scope) return

    const { date, grade, section, adviser, entries = [], teacherNotes } = req.body
    if (!date || !grade || !section || !entries.length) {
      return res.status(400).json({ error: 'date, grade, section, and non-empty entries are required' })
    }

    const schools = await query('SELECT attendance_lock_cutoff FROM schools WHERE id = ?', [scope.schoolId])
    const cutoff = String(schools[0]?.attendance_lock_cutoff || '').trim()
    const isLockedDate = Boolean(cutoff && date <= cutoff)

    const existingRows = await query(
      'SELECT * FROM attendance_records WHERE date = ? AND grade = ? AND section = ? AND school_id = ?',
      [date, grade, section, scope.schoolId]
    )
    const existing = existingRows[0] || null

    if (existing) {
      if (isRecordLocked(existing)) {
        return lockError(res)
      }
      await run('DELETE FROM attendance_entries WHERE record_id = ?', [existing.id])
      if (teacherNotes) {
        await run('UPDATE attendance_records SET adviser=?, teacher_notes=? WHERE id=?', [adviser || existing.adviser, teacherNotes, existing.id])
      }
      const recordId = existing.id
      for (const entry of entries) {
        const p = entry.periods || {}
        await run(`INSERT INTO attendance_entries
          (record_id, student_id, name, am1, am2, am3, am4, am5, am6, pm1, pm2, pm3, pm4, reason, excused, unexcused, nls)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            recordId, entry.studentId, entry.name,
            p.am1 || entry.status || 'E', p.am2 || entry.status || 'E', p.am3 || entry.status || 'E',
            p.am4 || entry.status || 'E', p.am5 || entry.status || 'E', p.am6 || entry.status || 'E',
            p.pm1 || entry.status || 'E', p.pm2 || entry.status || 'E', p.pm3 || entry.status || 'E', p.pm4 || entry.status || 'E',
            entry.reason || '', entry.excused ? 1 : 0, entry.unexcused ? 1 : 0, entry.nls ? 1 : 0
          ])
      }
      await audit(me, 'attendance.bulk_import', { type: 'attendance', id: recordId, name: `${grade} - ${section}`, schoolId: scope.schoolId },
        `Bulk imported attendance for ${grade} - ${section} on ${date} (${entries.length} learners)`)
      return res.json({ success: true, id: recordId, count: entries.length })
    }

    if (isLockedDate) {
      return res.status(423).json({ error: `Attendance for ${date} is locked by school cutoff (${cutoff}).` })
    }

    const recordId = uuidv4()
    await run('INSERT INTO attendance_records (id, date, grade, section, adviser, created_by, created_by_name, school_id, teacher_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [recordId, date, grade, section, adviser || '', me.id, me.name || '', scope.schoolId, teacherNotes || ''])

    for (const entry of entries) {
      const p = entry.periods || {}
      await run(`INSERT INTO attendance_entries
        (record_id, student_id, name, am1, am2, am3, am4, am5, am6, pm1, pm2, pm3, pm4, reason, excused, unexcused, nls)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId, entry.studentId, entry.name,
          p.am1 || entry.status || 'E', p.am2 || entry.status || 'E', p.am3 || entry.status || 'E',
          p.am4 || entry.status || 'E', p.am5 || entry.status || 'E', p.am6 || entry.status || 'E',
          p.pm1 || entry.status || 'E', p.pm2 || entry.status || 'E', p.pm3 || entry.status || 'E', p.pm4 || entry.status || 'E',
          entry.reason || '', entry.excused ? 1 : 0, entry.unexcused ? 1 : 0, entry.nls ? 1 : 0
        ])
    }

    await audit(me, 'attendance.bulk_import', { type: 'attendance', id: recordId, name: `${grade} - ${section}`, schoolId: scope.schoolId },
      `Bulk imported attendance for ${grade} - ${section} on ${date} (${entries.length} learners)`)

    res.json({ success: true, id: recordId, count: entries.length })
  } catch (err) {
    console.error('Failed to bulk import attendance:', err.message)
    res.status(500).json({ error: 'Failed to bulk import attendance' })
  }
})

router.patch('/:recordId/notes', async (req, res) => {
  try {
    const me = await guardAttendanceRecord(req, res)
    if (!me) return
    const { recordId } = req.params
    const teacherNotes = typeof req.body.teacher_notes === 'string'
      ? req.body.teacher_notes
      : (typeof req.body.teacherNotes === 'string' ? req.body.teacherNotes : '')
    const records = await query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
    if (!records.length) return res.status(404).json({ error: 'Record not found' })
    if (!recordSchoolOk(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const current = await lockRecordIfNeeded(records[0], me, res)
    if (!current) return
    await addRecordCorrections(current, { teacher_notes: teacherNotes }, me, String(req.body.correctionReason || '').trim())
    await run('UPDATE attendance_records SET teacher_notes = ? WHERE id = ?', [teacherNotes, recordId])
    res.json({ success: true, teacher_notes: teacherNotes })
  } catch (err) {
    console.error('Failed to update teacher notes:', err.message)
    res.status(500).json({ error: 'Failed to update teacher notes' })
  }
})

router.delete('/:recordId', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    const { recordId } = req.params
    const records = await query('SELECT * FROM attendance_records WHERE id = ?', [recordId])
    if (!records.length) return res.status(404).json({ error: 'Record not found' })
    if (!recordSchoolOk(me, records[0])) return res.status(403).json({ error: 'Forbidden: outside your school' })
    const current = await ensureRecordLock(records[0])
    if (isRecordLocked(current)) return lockError(res)
    if (me.role !== 'admin' && me.role !== 'superadmin' && current.created_by !== me.id) {
      return res.status(403).json({ error: 'Only the owner or an admin can delete this record' })
    }
    await run('DELETE FROM attendance_entries WHERE record_id = ?', [recordId])
    await run('DELETE FROM attendance_corrections WHERE record_id = ?', [recordId])
    await run('DELETE FROM attendance_records WHERE id = ?', [recordId])
    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete attendance record:', err.message)
    res.status(500).json({ error: 'Failed to delete attendance record' })
  }
})

export default router
