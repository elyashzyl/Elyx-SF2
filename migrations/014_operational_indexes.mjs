// Migration: 014_operational_indexes.mjs
// Description: Add indexes for common authorization and operational queries.

export const id = '014_operational_indexes'
export const description = 'Add operational query indexes'

const indexes = [
  {
    name: 'idx_users_school_role',
    sqlite: 'users (school_id, role)',
    // Existing MySQL installations may have these columns as TEXT. Prefixes
    // make the index valid without rebuilding or rewriting the table.
    mysql: 'users (school_id(96), role(32))'
  },
  {
    name: 'idx_students_school_status',
    sqlite: 'students (school_id, enrollment_status)',
    mysql: 'students (school_id(96), enrollment_status(32))'
  },
  {
    name: 'idx_enrollment_student_date',
    sqlite: 'student_enrollment_events (student_id, school_id, effective_on, event_sequence)',
    mysql: 'student_enrollment_events (student_id, school_id, effective_on, event_sequence)'
  },
  {
    name: 'idx_attendance_school_date',
    sqlite: 'attendance_records (school_id, date, grade, section)',
    mysql: 'attendance_records (school_id(96), date(10), grade(64), section(64))'
  },
  {
    name: 'idx_inquiries_user_status',
    sqlite: 'inquiries (user_id, status, updated_at)',
    mysql: 'inquiries (user_id, status, updated_at)'
  },
  {
    name: 'idx_inquiry_messages_thread',
    sqlite: 'inquiry_messages (inquiry_id, created_at)',
    mysql: 'inquiry_messages (inquiry_id, created_at)'
  },
  {
    name: 'idx_licenses_school_issued',
    sqlite: 'licenses (school_id, issued_at)',
    mysql: 'licenses (school_id, issued_at(32))'
  },
  {
    name: 'idx_subscription_requests_school_status',
    sqlite: 'subscription_requests (school_id, status, created_at)',
    mysql: 'subscription_requests (school_id, status, created_at)'
  },
  {
    name: 'idx_payment_methods_active_sort',
    sqlite: 'payment_methods (is_active, sort_order, created_at)',
    mysql: 'payment_methods (is_active, sort_order, created_at)'
  }
]

export async function up({ run, isMysql }) {
  for (const index of indexes) {
    try {
      await run(isMysql
        ? `CREATE INDEX ${index.name} ON ${index.mysql}`
        : `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.sqlite}`)
    } catch (err) {
      // MySQL has no portable CREATE INDEX IF NOT EXISTS. A duplicate index
      // means the deployment already contains the intended optimization.
      if (!/duplicate|already exists/i.test(String(err.message || err.code || ''))) throw err
    }
  }
}

export async function down({ run, isMysql }) {
  for (const { name } of indexes) {
    try {
      await run(isMysql ? `DROP INDEX ${name} ON ${indexTable(name)}` : `DROP INDEX IF EXISTS ${name}`)
    } catch {
      // Index rollback is best effort across the shared SQLite/MySQL adapter.
    }
  }
}

function indexTable(name) {
  return {
    idx_users_school_role: 'users',
    idx_students_school_status: 'students',
    idx_enrollment_student_date: 'student_enrollment_events',
    idx_attendance_school_date: 'attendance_records',
    idx_inquiries_user_status: 'inquiries',
    idx_inquiry_messages_thread: 'inquiry_messages',
    idx_licenses_school_issued: 'licenses',
    idx_subscription_requests_school_status: 'subscription_requests',
    idx_payment_methods_active_sort: 'payment_methods'
  }[name] || ''
}
