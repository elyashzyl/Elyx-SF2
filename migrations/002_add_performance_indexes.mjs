// Migration: 002_add_performance_indexes.mjs
// Description: Adds performance indexes for frequent query paths (school lookups, dates, class sections).

export const id = '002_add_performance_indexes'
export const description = 'Add performance indexes for frequent query paths'

const INDEXES = [
  { name: 'idx_users_school_id', table: 'users', columns: 'school_id' },
  { name: 'idx_students_school_class', table: 'students', columns: 'school_id, grade, section' },
  { name: 'idx_attendance_rec_lookup', table: 'attendance_records', columns: 'school_id, date, grade, section' },
  { name: 'idx_attendance_ent_rec', table: 'attendance_entries', columns: 'record_id, student_id' },
  { name: 'idx_monthly_rec_lookup', table: 'monthly_records', columns: 'school_id, year, month, grade, section' },
  { name: 'idx_monthly_ent_rec', table: 'monthly_entries', columns: 'record_id, student_id' },
  { name: 'idx_schedules_teacher', table: 'teacher_schedules', columns: 'teacher_id, school_id' },
  { name: 'idx_calendar_school_date', table: 'calendar_events', columns: 'school_id, event_date' },
  { name: 'idx_audit_actor_date', table: 'audit_logs', columns: 'actor_id, created_at' }
]

export async function up({ query, run, isMysql }) {
  for (const idx of INDEXES) {
    if (isMysql) {
      // In MySQL, check if the index already exists on the table to prevent duplicate errors.
      try {
        const existing = await query(
          `SELECT COUNT(1) AS cnt FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
          [idx.table, idx.name]
        )
        if ((existing[0]?.cnt ?? 0) === 0) {
          await run(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\` (${idx.columns})`)
        }
      } catch (err) {
        // If query fails (e.g. permission on information_schema), attempt create with error catch
        try {
          await run(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\` (${idx.columns})`)
        } catch {}
      }
    } else {
      // SQLite supports CREATE INDEX IF NOT EXISTS natively
      await run(`CREATE INDEX IF NOT EXISTS \`${idx.name}\` ON \`${idx.table}\` (${idx.columns})`)
    }
  }
}

export async function down({ run, isMysql }) {
  for (const idx of INDEXES) {
    if (isMysql) {
      try {
        await run(`ALTER TABLE \`${idx.table}\` DROP INDEX \`${idx.name}\``)
      } catch {}
    } else {
      await run(`DROP INDEX IF EXISTS \`${idx.name}\``)
    }
  }
}
