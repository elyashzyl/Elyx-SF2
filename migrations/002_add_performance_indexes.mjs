// Migration: 002_add_performance_indexes.mjs
// Description: Adds performance indexes for frequent query paths (school lookups, dates, class sections).

export const id = '002_add_performance_indexes'
export const description = 'Add performance indexes for frequent query paths'

const INDEXES = [
  {
    name: 'idx_users_school_id',
    table: 'users',
    sqlite: 'school_id',
    // The original MySQL schema uses TEXT for legacy school identifiers.
    mysql: 'school_id(96)'
  },
  {
    name: 'idx_students_school_class',
    table: 'students',
    sqlite: 'school_id, grade, section',
    mysql: 'school_id(96), grade(64), section(64)'
  },
  {
    name: 'idx_attendance_rec_lookup',
    table: 'attendance_records',
    sqlite: 'school_id, date, grade, section',
    mysql: 'school_id(96), date(10), grade(64), section(64)'
  },
  {
    name: 'idx_attendance_ent_rec',
    table: 'attendance_entries',
    sqlite: 'record_id, student_id',
    mysql: 'record_id(96), student_id(96)'
  },
  {
    name: 'idx_monthly_rec_lookup',
    table: 'monthly_records',
    sqlite: 'school_id, year, month, grade, section',
    mysql: 'school_id(96), year, month, grade(64), section(64)'
  },
  {
    name: 'idx_monthly_ent_rec',
    table: 'monthly_entries',
    sqlite: 'record_id, student_id',
    mysql: 'record_id(96), student_id(96)'
  },
  {
    name: 'idx_schedules_teacher',
    table: 'teacher_schedules',
    sqlite: 'teacher_id, school_id',
    mysql: 'teacher_id(96), school_id(96)'
  },
  {
    name: 'idx_calendar_school_date',
    table: 'calendar_events',
    sqlite: 'school_id, event_date',
    mysql: 'school_id(96), event_date(10)'
  },
  {
    name: 'idx_audit_actor_date',
    table: 'audit_logs',
    sqlite: 'actor_id, created_at',
    mysql: 'actor_id(96), created_at'
  }
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
          await run(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\` (${idx.mysql})`)
        }
      } catch (err) {
        // If information_schema is unavailable, still attempt the additive
        // index. Do not hide a real schema error such as a bad key definition.
        try {
          await run(`CREATE INDEX \`${idx.name}\` ON \`${idx.table}\` (${idx.mysql})`)
        } catch (createError) {
          if (!/duplicate|already exists/i.test(String(createError.message || createError.code || ''))) throw createError
        }
      }
    } else {
      // SQLite supports CREATE INDEX IF NOT EXISTS natively
      await run(`CREATE INDEX IF NOT EXISTS \`${idx.name}\` ON \`${idx.table}\` (${idx.sqlite})`)
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
