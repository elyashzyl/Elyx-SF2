// Migration: 011_student_enrollment_history.mjs
// Description: Adds append-only student enrollment history and current enrollment status.

import { v4 as uuidv4 } from 'uuid'

export const id = '011_student_enrollment_history'
export const description = 'Add append-only student enrollment history'

function today() {
  return new Date().toISOString().slice(0, 10)
}

async function addColumn(run, sql) {
  try {
    await run(sql)
  } catch (error) {
    if (!/duplicate|exists|ER_DUP_FIELDNAME/i.test(String(error.message || error.code || ''))) throw error
  }
}

export async function up({ query, run, isMysql }) {
  await addColumn(run, isMysql
    ? "ALTER TABLE students ADD COLUMN enrollment_status VARCHAR(32) NOT NULL DEFAULT 'active'"
    : "ALTER TABLE students ADD COLUMN enrollment_status TEXT NOT NULL DEFAULT 'active'")

  await run(isMysql
    ? `CREATE TABLE IF NOT EXISTS student_enrollment_events (
        id VARCHAR(96) PRIMARY KEY,
        student_id VARCHAR(96) NOT NULL,
        school_id VARCHAR(96) NOT NULL,
        event_type VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL,
        effective_on VARCHAR(10) NOT NULL,
        grade VARCHAR(255) NOT NULL DEFAULT '',
        section VARCHAR(255) NOT NULL DEFAULT '',
        reason VARCHAR(1000) NOT NULL DEFAULT '',
        actor_id VARCHAR(96) NOT NULL DEFAULT '',
        actor_name VARCHAR(255) NOT NULL DEFAULT '',
        actor_role VARCHAR(32) NOT NULL DEFAULT '',
        transfer_group_id VARCHAR(96) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    : `CREATE TABLE IF NOT EXISTS student_enrollment_events (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        school_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        effective_on TEXT NOT NULL,
        grade TEXT NOT NULL DEFAULT '',
        section TEXT NOT NULL DEFAULT '',
        reason TEXT NOT NULL DEFAULT '',
        actor_id TEXT NOT NULL DEFAULT '',
        actor_name TEXT NOT NULL DEFAULT '',
        actor_role TEXT NOT NULL DEFAULT '',
        transfer_group_id TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`)

  const students = await query(`
    SELECT s.id, s.grade, s.section, s.school_id,
           MIN(ar.date) AS earliest_attendance_date
    FROM students s
    LEFT JOIN attendance_entries ae ON ae.student_id = s.id
    LEFT JOIN attendance_records ar ON ar.id = ae.record_id AND ar.school_id = s.school_id
    GROUP BY s.id, s.grade, s.section, s.school_id
  `)

  for (const student of students) {
    await run("UPDATE students SET enrollment_status = 'active' WHERE id = ? AND (enrollment_status IS NULL OR enrollment_status = '')", [student.id])
    const existing = await query('SELECT id FROM student_enrollment_events WHERE student_id = ? LIMIT 1', [student.id])
    if (existing.length) continue
    await run(`INSERT INTO student_enrollment_events
      (id, student_id, school_id, event_type, status, effective_on, grade, section, reason, actor_id, actor_name, actor_role)
      VALUES (?, ?, ?, 'enroll', 'active', ?, ?, ?, ?, '', '', '')`, [
      uuidv4(),
      student.id,
      student.school_id || '',
      student.earliest_attendance_date || today(),
      student.grade || '',
      student.section || '',
      'Initial enrollment history backfill'
    ])
  }

  const indexes = [
    ['idx_enrollment_student_date', 'student_id, school_id, effective_on, created_at'],
    ['idx_enrollment_school_status', 'school_id, status, grade, section'],
    ['idx_enrollment_school_date', 'school_id, effective_on']
  ]
  for (const [name, columns] of indexes) {
    if (isMysql) {
      try {
        const found = await query(
          'SELECT COUNT(1) AS cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
          ['student_enrollment_events', name]
        )
        if (Number(found[0]?.cnt || 0) === 0) await run(`CREATE INDEX \`${name}\` ON student_enrollment_events (${columns})`)
      } catch (error) {
        if (!/duplicate|exists/i.test(String(error.message))) throw error
      }
    } else {
      await run(`CREATE INDEX IF NOT EXISTS \`${name}\` ON student_enrollment_events (${columns})`)
    }
  }
}

export async function down({ run }) {
  // Enrollment events are historical records. Drop only when explicitly resetting a database.
  await run('DROP TABLE IF EXISTS student_enrollment_events')
  // Keep students.enrollment_status so an applied migration is safe to roll back manually.
}
