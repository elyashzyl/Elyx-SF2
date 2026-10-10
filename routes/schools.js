import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, saveDatabase, getSchoolById, getGradeLevels, setGradeLevels, DB_MODE } from '../db.js'
import { requireRole, schoolToResponse, audit } from './_context.js'
import { hashPassword } from '../lib/passwords.js'
import prisma from '../prisma/client.js'

const router = Router()

function mapPrismaSchool(row) {
  if (!row) return null
  return schoolToResponse({
    id: row.id,
    name: row.name,
    school_id: row.schoolId,
    address: row.address,
    short: row.short,
    attendance_lock_cutoff: row.attendanceLockCutoff,
    contact_email: row.contactEmail,
    contact_phone: row.contactPhone,
    division: row.division,
    district: row.district,
    principal_name: row.principalName,
    school_year: row.schoolYear,
    grading_period: row.gradingPeriod,
    logo_url: row.logoUrl || row.logo_url || '',
    quarter_count: Number(row.quarterCount ?? row.quarter_count ?? 4) === 3 ? 3 : 4,
    archived_at: row.archivedAt,
    archived_by: row.archivedBy,
    archive_reason: row.archiveReason,
    sardo_consecutive_absences: row.sardoConsecutiveAbsences ?? 3,
    sardo_cumulative_absences: row.sardoCumulativeAbsences ?? 5
  })
}

function parseSections(value) {
  if (Array.isArray(value)) return value.map(section => String(section)).filter(Boolean)
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed.map(section => String(section)).filter(Boolean) : []
  } catch {
    return []
  }
}

export async function listSchoolsWithPrisma(includeArchived = false) {
  if (DB_MODE !== 'mysql' || !prisma) return null
  try {
    const rows = await prisma.school.findMany({
      ...(includeArchived ? {} : { where: { archivedAt: null } }),
      orderBy: { name: 'asc' }
    })
    return rows.map(mapPrismaSchool)
  } catch (error) {
    console.warn('[schools] Prisma school list fallback:', error.message)
    return null
  }
}

export async function findSchoolWithPrisma(id) {
  if (DB_MODE !== 'mysql' || !prisma) return null
  try {
    return { available: true, row: mapPrismaSchool(await prisma.school.findUnique({ where: { id } })) }
  } catch (error) {
    console.warn('[schools] Prisma school read fallback:', error.message)
    return null
  }
}

export async function listGradeLevelsWithPrisma(schoolId) {
  if (DB_MODE !== 'mysql' || !prisma) return null
  try {
    const rows = await prisma.gradeLevel.findMany({
      where: { schoolId },
      select: { grade: true, sections: true, sort: true },
      orderBy: [{ sort: 'asc' }, { grade: 'asc' }]
    })
    return rows.map(row => ({ grade: row.grade, sections: parseSections(row.sections) }))
  } catch (error) {
    console.warn('[schools] Prisma grade-level read fallback:', error.message)
    return null
  }
}

// List schools. Superadmin sees all; others see only their own.
router.get('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    if (me.role === 'superadmin') {
      const includeArchived = String(req.query.includeArchived || '').toLowerCase() === 'true'
      const prismaSchools = await listSchoolsWithPrisma(includeArchived)
      if (prismaSchools !== null) return res.json(prismaSchools)
      const rows = await query(`SELECT * FROM schools ${includeArchived ? '' : 'WHERE archived_at IS NULL'} ORDER BY name`)
      return res.json(rows.map(schoolToResponse))
    }
    if (!me.school_id) return res.json([])
    const prismaSchool = await findSchoolWithPrisma(me.school_id)
    const own = prismaSchool ? prismaSchool.row : await getSchoolById(me.school_id)
    return res.json(own && !own.archived_at ? [schoolToResponse(own)] : [])
  } catch (err) {
    console.error('Failed to fetch schools', err.message)
    res.status(500).json({ error: 'Failed to fetch schools' })
  }
})

// Create a school (superadmin only). Optionally seed the first admin + carry grade skeleton.
router.post('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const { name, school_id, address, short, contact_email, contact_phone, division, district, principal_name, school_year, grading_period, logo_url, quarter_count, admin } = req.body || {}
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'School name is required' })
    const email = String(contact_email || '').trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Contact email is invalid' })
    const id = uuidv4()
    let effectiveSchoolYear = String(school_year || '').trim()
    if (!effectiveSchoolYear) {
      const sySettings = await query('SELECT `value` FROM settings WHERE `key` = ? OR `key` = ? LIMIT 1', ['school_year', 'active_school_year'])
      effectiveSchoolYear = sySettings[0]?.value || '2026-2027'
    }
    await run(`INSERT INTO schools
      (id, name, school_id, address, short, contact_email, contact_phone, division, district, principal_name, school_year, grading_period, logo_url, quarter_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, String(name).trim(), String(school_id || '').trim(), String(address || '').trim(), String(short || '').trim(), email,
        String(contact_phone || '').trim(), String(division || '').trim(), String(district || '').trim(), String(principal_name || '').trim(),
        effectiveSchoolYear, String(grading_period || '').trim(), String(logo_url || '').trim(), Number(quarter_count) === 3 ? 3 : 4])
    // New schools start with NO grades — the school admin defines its own
    // grade levels + sections in Settings → Grade Levels & Sections.
    // Optional first school admin created together with the school
    if (admin && admin.username && admin.password && admin.name) {
      const dup = await query('SELECT id FROM users WHERE username = ?', [admin.username])
      if (dup.length > 0) {
        await run('DELETE FROM schools WHERE id = ?', [id])
        return res.status(400).json({ error: 'Username already exists' })
      }
      const passwordHash = await hashPassword(String(admin.password))
      await run('INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), admin.username, passwordHash, admin.name, 'admin', '', '', '', id])
    }

    await audit(me, 'school.create', { type: 'school', id, name: String(name).trim(), schoolId: id }, `Registered school "${String(name).trim()}"`)
    res.json({ id, success: true })
  } catch (err) {
    console.error('Failed to create school', err.message)
    res.status(500).json({ error: 'Failed to create school' })
  }
})

// Bulk update school year across all or selected schools (superadmin only)
// Preserves each school's individual quarter_count (3 vs 4 quarters).
router.post('/bulk-school-year', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const schoolYear = String(req.body?.school_year || req.body?.schoolYear || '').trim()
    if (!schoolYear) return res.status(400).json({ error: 'School year is required' })

    const schoolIds = Array.isArray(req.body?.school_ids) ? req.body.school_ids.filter(Boolean) : null
    let updatedCount = 0

    if (schoolIds && schoolIds.length > 0) {
      const placeholders = schoolIds.map(() => '?').join(',')
      await run(`UPDATE schools SET school_year = ? WHERE id IN (${placeholders})`, [schoolYear, ...schoolIds])
      updatedCount = schoolIds.length
    } else {
      await run('UPDATE schools SET school_year = ? WHERE archived_at IS NULL', [schoolYear])
      const countRows = await query('SELECT COUNT(*) as count FROM schools WHERE archived_at IS NULL')
      updatedCount = Number(countRows[0]?.count || 0)

      // Also persist in global settings
      const existing = await query('SELECT `key` FROM settings WHERE `key` = ?', ['school_year'])
      if (existing.length > 0) {
        await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [schoolYear, 'school_year'])
      } else {
        await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['school_year', schoolYear])
      }
      const existingActive = await query('SELECT `key` FROM settings WHERE `key` = ?', ['active_school_year'])
      if (existingActive.length > 0) {
        await run('UPDATE settings SET `value` = ? WHERE `key` = ?', [schoolYear, 'active_school_year'])
      } else {
        await run('INSERT INTO settings (`key`, `value`) VALUES (?, ?)', ['active_school_year', schoolYear])
      }
    }

    await audit(me, 'schools.bulk_school_year', { school_year: schoolYear, updated_count: updatedCount }, `Bulk updated school year to "${schoolYear}" for ${updatedCount} schools`)
    res.json({ success: true, school_year: schoolYear, updatedCount })
  } catch (err) {
    console.error('Failed to bulk update school year:', err.message)
    res.status(500).json({ error: 'Failed to update school year' })
  }
})

// Get one school (scope-checked)
router.get('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    if (me.role !== 'superadmin' && me.school_id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const prismaSchool = await findSchoolWithPrisma(req.params.id)
    const row = prismaSchool ? prismaSchool.row : await getSchoolById(req.params.id)
    if (!row) return res.status(404).json({ error: 'School not found' })
    if (row.archived_at && me.role !== 'superadmin') return res.status(410).json({ error: 'School is archived' })
    res.json(schoolToResponse(row))
  } catch (err) {
    console.error('Failed to fetch school', err.message)
    res.status(500).json({ error: 'Failed to fetch school' })
  }
})

// Update a school. Superadmin: any field. Admin: own school profile only (no transfers).
router.put('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    if (me.role !== 'superadmin' && me.school_id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const { name, school_id, address, short, contact_email, contact_phone, division, district, principal_name, school_year, grading_period, logo_url, quarter_count } = req.body || {}
    const sets = []
    const params = []
    if (name !== undefined) { sets.push('name = ?'); params.push(String(name).trim()) }
    if (school_id !== undefined) { sets.push('school_id = ?'); params.push(String(school_id).trim()) }
    if (address !== undefined) { sets.push('address = ?'); params.push(String(address).trim()) }
    if (short !== undefined) { sets.push('short = ?'); params.push(String(short).trim()) }
    if (contact_email !== undefined) {
      const email = String(contact_email).trim()
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Contact email is invalid' })
      sets.push('contact_email = ?'); params.push(email)
    }
    for (const [field, value] of Object.entries({ contact_phone, division, district, principal_name, school_year, grading_period, logo_url })) {
      if (value !== undefined) { sets.push(`${field} = ?`); params.push(String(value).trim()) }
    }
    if (quarter_count !== undefined) {
      sets.push('quarter_count = ?')
      params.push(Number(quarter_count) === 3 ? 3 : 4)
    }
    if (req.body?.sardo_consecutive_absences !== undefined) {
      sets.push('sardo_consecutive_absences = ?')
      params.push(Math.max(1, parseInt(req.body.sardo_consecutive_absences, 10) || 3))
    }
    if (req.body?.sardo_cumulative_absences !== undefined) {
      sets.push('sardo_cumulative_absences = ?')
      params.push(Math.max(1, parseInt(req.body.sardo_cumulative_absences, 10) || 5))
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
    params.push(req.params.id)
    await run(`UPDATE schools SET ${sets.join(', ')} WHERE id = ?`, params)
    const row = await getSchoolById(req.params.id)
    await audit(me, 'school.update', { type: 'school', id: req.params.id, name: row?.name || '', schoolId: req.params.id }, `Updated school "${row?.name || req.params.id}"`)
    res.json({ success: true, school: schoolToResponse(row) })
  } catch (err) {
    console.error('Failed to update school', err.message)
    res.status(500).json({ error: 'Failed to update school' })
  }
})

// Grade levels for a school. Superadmin: any school. Admin/teacher: own school.
router.get('/:id/grades', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin', 'teacher')
    if (error) return
    if (me.role !== 'superadmin' && me.school_id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const prismaSchool = await findSchoolWithPrisma(req.params.id)
    const row = prismaSchool ? prismaSchool.row : await getSchoolById(req.params.id)
    if (!row) return res.status(404).json({ error: 'School not found' })
    const prismaLevels = await listGradeLevelsWithPrisma(req.params.id)
    res.json(prismaLevels !== null ? prismaLevels : await getGradeLevels(req.params.id))
  } catch (err) {
    console.error('Failed to fetch grade levels', err.message)
    res.status(500).json({ error: 'Failed to fetch grade levels' })
  }
})

// Replace grade levels. Superadmin: any school. Admin: own school only.
router.put('/:id/grades', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return
    if (me.role !== 'superadmin' && me.school_id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    const row = await getSchoolById(req.params.id)
    if (!row) return res.status(404).json({ error: 'School not found' })
    const { levels } = req.body || {}
    if (!Array.isArray(levels)) return res.status(400).json({ error: 'levels must be an array of {grade, sections[]}' })
    const clean = []
    const seenGrades = new Set()
    for (const l of levels) {
      const grade = String(l?.grade || '').trim()
      if (!grade || seenGrades.has(grade.toLowerCase())) continue
      seenGrades.add(grade.toLowerCase())
      const sections = [...new Set((Array.isArray(l.sections) ? l.sections : []).map(s => String(s).trim()).filter(Boolean))]
      clean.push({ grade, sections })
    }
    if (!clean.length) return res.status(400).json({ error: 'Add at least one grade level with a name' })
    await setGradeLevels(req.params.id, clean)
    await audit(me, 'grades.update', { type: 'school', id: req.params.id, name: row?.name || '', schoolId: req.params.id }, `Updated grade levels (${clean.length} grades)`)
    res.json({ success: true, levels: await getGradeLevels(req.params.id) })
  } catch (err) {
    console.error('Failed to update grade levels', err.message)
    res.status(500).json({ error: 'Failed to update grade levels' })
  }
})

// Download a school-scoped JSON snapshot before archiving or permanent deletion.
// Sensitive credentials and authentication tokens are intentionally excluded.
router.get('/:id/export', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const id = String(req.params.id || '').trim()
    const school = await getSchoolById(id)
    if (!school) return res.status(404).json({ error: 'School not found' })

    // Record the export before reading audit logs so the snapshot contains its
    // own audit trail. Authentication secrets are never included in the query.
    await audit(me, 'school.export', { type: 'school', id, name: school.name || '', schoolId: id }, `Exported school data for "${school.name || id}"`)

    const [users, students, gradeLevels, attendanceRecords, attendanceEntries, monthlyRecords,
      monthlyEntries, enrollmentEvents, teacherSchedules, calendarEvents, quarterlyEvents,
      licenses, subscriptionRequests, inquiries, inquiryMessages, auditLogs] = await Promise.all([
      query(`SELECT id, username, name, role, grade, section, period, school_id, account_status,
        last_login_at, password_changed_at, failed_login_count, locked_until, email, email_verified_at
        FROM users WHERE school_id = ? ORDER BY name, username`, [id]),
      query('SELECT * FROM students WHERE school_id = ? ORDER BY name', [id]),
      query('SELECT * FROM grade_levels WHERE school_id = ? ORDER BY sort, grade', [id]),
      query('SELECT * FROM attendance_records WHERE school_id = ? ORDER BY date, grade, section', [id]),
      query(`SELECT ae.* FROM attendance_entries ae
        JOIN attendance_records ar ON ar.id = ae.record_id
        WHERE ar.school_id = ? ORDER BY ae.record_id, ae.id`, [id]),
      query('SELECT * FROM monthly_records WHERE school_id = ? ORDER BY year, month, grade, section', [id]),
      query(`SELECT me.* FROM monthly_entries me
        JOIN monthly_records mr ON mr.id = me.record_id
        WHERE mr.school_id = ? ORDER BY me.record_id, me.id`, [id]),
      query('SELECT * FROM student_enrollment_events WHERE school_id = ? ORDER BY student_id, effective_on, event_sequence', [id]),
      query('SELECT * FROM teacher_schedules WHERE school_id = ? ORDER BY teacher_id, day_of_week, start_time', [id]),
      query('SELECT * FROM calendar_events WHERE school_id = ? ORDER BY event_date, id', [id]),
      query('SELECT * FROM quarterly_events WHERE school_id = ? ORDER BY event_name', [id]),
      query('SELECT * FROM licenses WHERE school_id = ? ORDER BY issued_at', [id]),
      query('SELECT * FROM subscription_requests WHERE school_id = ? ORDER BY created_at', [id]),
      query('SELECT * FROM inquiries WHERE school_id = ? ORDER BY created_at', [id]),
      query(`SELECT im.* FROM inquiry_messages im
        JOIN inquiries i ON i.id = im.inquiry_id
        WHERE i.school_id = ? ORDER BY im.inquiry_id, im.created_at`, [id]),
      query('SELECT * FROM audit_logs WHERE target_school_id = ? OR actor_school_id = ? ORDER BY created_at, id', [id, id])
    ])

    const exportedAt = new Date().toISOString()
    const snapshot = {
      format: 'elytrack-school-export',
      version: 1,
      exported_at: exportedAt,
      school: schoolToResponse(school),
      data: {
        users,
        students,
        grade_levels: gradeLevels,
        attendance_records: attendanceRecords,
        attendance_entries: attendanceEntries,
        monthly_records: monthlyRecords,
        monthly_entries: monthlyEntries,
        enrollment_events: enrollmentEvents,
        teacher_schedules: teacherSchedules,
        calendar_events: calendarEvents,
        quarterly_events: quarterlyEvents,
        licenses,
        subscription_requests: subscriptionRequests,
        inquiries,
        inquiry_messages: inquiryMessages,
        audit_logs: auditLogs
      }
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="elytrack-school-${id}-${exportedAt.slice(0, 10)}.json"`)
    res.send(JSON.stringify(snapshot, null, 2))
  } catch (err) {
    console.error('Failed to export school data', err.message)
    res.status(500).json({ error: 'Failed to export school data' })
  }
})

// Preview the dependent record counts before a destructive deletion.
router.get('/:id/dependency-preview', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const id = String(req.params.id || '').trim()
    const school = await getSchoolById(id)
    if (!school) return res.status(404).json({ error: 'School not found' })
    const tables = {
      users: 'SELECT COUNT(*) AS count FROM users WHERE school_id = ?',
      students: 'SELECT COUNT(*) AS count FROM students WHERE school_id = ?',
      attendance_records: 'SELECT COUNT(*) AS count FROM attendance_records WHERE school_id = ?',
      monthly_records: 'SELECT COUNT(*) AS count FROM monthly_records WHERE school_id = ?',
      inquiries: 'SELECT COUNT(*) AS count FROM inquiries WHERE school_id = ?',
      licenses: 'SELECT COUNT(*) AS count FROM licenses WHERE school_id = ?',
      subscription_requests: 'SELECT COUNT(*) AS count FROM subscription_requests WHERE school_id = ?',
      enrollment_events: 'SELECT COUNT(*) AS count FROM student_enrollment_events WHERE school_id = ?'
    }
    const counts = {}
    for (const [name, sql] of Object.entries(tables)) counts[name] = Number((await query(sql, [id]))[0]?.count || 0)
    res.json({ school: schoolToResponse(school), counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) })
  } catch (err) {
    console.error('Failed to preview school dependencies', err.message)
    res.status(500).json({ error: 'Failed to preview school dependencies' })
  }
})

// Archive or restore a school without deleting historical records.
router.patch('/:id/archive', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const id = String(req.params.id || '').trim()
    const school = await getSchoolById(id)
    if (!school) return res.status(404).json({ error: 'School not found' })
    const archived = req.body?.archived !== false
    const reason = String(req.body?.reason || '').trim()
    if (archived && reason.length > 1000) return res.status(400).json({ error: 'Archive reason is too long' })

    if (archived) {
      if (!school.archived_at) {
        const users = await query('SELECT id, account_status FROM users WHERE school_id = ? AND COALESCE(account_status, \'active\') <> \'disabled\'', [id])
        for (const user of users) {
          if (DB_MODE === 'mysql') {
            await run(`INSERT INTO school_archive_user_status (user_id, school_id, prior_status)
              VALUES (?, ?, ?)
              ON DUPLICATE KEY UPDATE prior_status = VALUES(prior_status), archived_at = CURRENT_TIMESTAMP`,
            [user.id, id, user.account_status || 'active'])
          } else {
            await run('INSERT OR REPLACE INTO school_archive_user_status (user_id, school_id, prior_status) VALUES (?, ?, ?)', [user.id, id, user.account_status || 'active'])
          }
        }
        await run('UPDATE users SET account_status = \'disabled\' WHERE school_id = ? AND COALESCE(account_status, \'active\') <> \'disabled\'', [id])
      }
      await run('UPDATE schools SET archived_at = ?, archived_by = ?, archive_reason = ? WHERE id = ?', [school.archived_at || new Date().toISOString(), me.id, reason, id])
    } else {
      if (DB_MODE === 'mysql') {
        await run(`UPDATE users u
          JOIN school_archive_user_status a ON a.user_id = u.id
          SET u.account_status = a.prior_status
          WHERE a.school_id = ? AND u.account_status = 'disabled'`, [id])
      } else {
        const archivedUsers = await query('SELECT user_id, prior_status FROM school_archive_user_status WHERE school_id = ?', [id])
        for (const user of archivedUsers) {
          await run('UPDATE users SET account_status = ? WHERE id = ? AND account_status = \'disabled\'', [user.prior_status, user.user_id])
        }
      }
      await run('DELETE FROM school_archive_user_status WHERE school_id = ?', [id])
      await run('UPDATE schools SET archived_at = NULL, archived_by = \'\', archive_reason = \'\' WHERE id = ?', [id])
    }
    await audit(me, archived ? 'school.archive' : 'school.restore', { type: 'school', id, name: school.name || '', schoolId: id }, archived ? `Archived school "${school.name || id}"` : `Restored school "${school.name || id}"`)
    const updated = await getSchoolById(id)
    saveDatabase()
    res.json({ success: true, school: schoolToResponse(updated) })
  } catch (err) {
    console.error('Failed to update school archive status', err.message)
    res.status(500).json({ error: 'Failed to update school archive status' })
  }
})

// Delete a school (superadmin only).
// School deletion is an explicit destructive operation. It removes the school's
// operational records and dependent child rows so the UI does not fail simply
// because the school already has users, attendance, or subscription history.
router.delete('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const id = String(req.params.id || '').trim()
    const doomed = await getSchoolById(id)
    if (!doomed) return res.status(404).json({ error: 'School not found' })

    const exports = await query(`SELECT id FROM audit_logs
      WHERE action = 'school.export' AND target_school_id = ? LIMIT 1`, [id])
    if (!exports.length) {
      return res.status(409).json({ error: 'Export this school before permanent deletion' })
    }

    // Delete child rows first. The shared schema intentionally does not rely on
    // database foreign keys, so this cleanup must be explicit for both MySQL
    // and SQLite deployments.
    await run('DELETE FROM inquiry_messages WHERE inquiry_id IN (SELECT id FROM inquiries WHERE school_id = ?)', [id])
    await run('DELETE FROM inquiries WHERE school_id = ?', [id])
    await run('DELETE FROM monthly_entries WHERE record_id IN (SELECT id FROM monthly_records WHERE school_id = ?)', [id])
    await run('DELETE FROM monthly_records WHERE school_id = ?', [id])
    await run('DELETE FROM attendance_entries WHERE record_id IN (SELECT id FROM attendance_records WHERE school_id = ?)', [id])
    await run('DELETE FROM attendance_records WHERE school_id = ?', [id])
    await run('DELETE FROM teacher_schedules WHERE school_id = ? OR teacher_id IN (SELECT id FROM users WHERE school_id = ?)', [id, id])
    await run('DELETE FROM calendar_events WHERE school_id = ?', [id])
    await run('DELETE FROM quarterly_events WHERE school_id = ?', [id])
    await run('DELETE FROM grade_levels WHERE school_id = ?', [id])
    await run('DELETE FROM subscription_requests WHERE school_id = ?', [id])
    await run('DELETE FROM licenses WHERE school_id = ?', [id])
    await run('DELETE FROM student_enrollment_events WHERE school_id = ?', [id])
    await run('DELETE FROM school_archive_user_status WHERE school_id = ?', [id])
    await run('DELETE FROM students WHERE school_id = ?', [id])
    await run('DELETE FROM users WHERE school_id = ?', [id])
    await run('DELETE FROM schools WHERE id = ?', [id])
    await audit(me, 'school.delete', { type: 'school', id, name: doomed.name || '', schoolId: id }, `Deleted school "${doomed.name || id}" and its operational records`)
    saveDatabase()
    res.json({ success: true, deletedSchoolId: id })
  } catch (err) {
    console.error('Failed to delete school', err.message)
    res.status(500).json({ error: 'Failed to delete school: ' + err.message })
  }
})

export default router
