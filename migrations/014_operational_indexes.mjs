// Migration: 014_operational_indexes.mjs
// Description: Add indexes for common authorization and operational queries.

export const id = '014_operational_indexes'
export const description = 'Add operational query indexes'

const indexes = [
  ['idx_users_school_role', 'users (school_id, role)'],
  ['idx_students_school_status', 'students (school_id, enrollment_status)'],
  ['idx_enrollment_student_date', 'student_enrollment_events (student_id, school_id, effective_on, event_sequence)'],
  ['idx_attendance_school_date', 'attendance_records (school_id, date, grade, section)'],
  ['idx_inquiries_user_status', 'inquiries (user_id, status, updated_at)'],
  ['idx_inquiry_messages_thread', 'inquiry_messages (inquiry_id, created_at)'],
  ['idx_licenses_school_issued', 'licenses (school_id, issued_at)'],
  ['idx_subscription_requests_school_status', 'subscription_requests (school_id, status, created_at)'],
  ['idx_payment_methods_active_sort', 'payment_methods (is_active, sort_order, created_at)']
]

export async function up({ run, isMysql }) {
  for (const [name, definition] of indexes) {
    try {
      await run(isMysql
        ? `CREATE INDEX ${name} ON ${definition}`
        : `CREATE INDEX IF NOT EXISTS ${name} ON ${definition}`)
    } catch (err) {
      // MySQL has no portable CREATE INDEX IF NOT EXISTS. A duplicate index
      // means the deployment already contains the intended optimization.
      if (!/duplicate|already exists/i.test(String(err.message || err.code || ''))) throw err
    }
  }
}

export async function down({ run, isMysql }) {
  for (const [name] of indexes) {
    try {
      await run(isMysql ? `DROP INDEX ${name} ON ${name.startsWith('idx_') ? indexTable(name) : ''}` : `DROP INDEX IF EXISTS ${name}`)
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
