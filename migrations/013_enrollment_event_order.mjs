// Migration: 013_enrollment_event_order.mjs
// Description: Add deterministic ordering for same-date enrollment events.

export const id = '013_enrollment_event_order'
export const description = 'Add deterministic enrollment event ordering'

export async function up({ query, run, isMysql }) {
  try {
    await run(isMysql
      ? 'ALTER TABLE student_enrollment_events ADD COLUMN event_sequence BIGINT NOT NULL DEFAULT 0'
      : 'ALTER TABLE student_enrollment_events ADD COLUMN event_sequence INTEGER NOT NULL DEFAULT 0')
  } catch (err) {
    if (!/duplicate|exists/i.test(String(err.message || err.code || ''))) throw err
  }
  if (isMysql) {
    await run('ALTER TABLE student_enrollment_events MODIFY COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)')
  }

  const students = await query('SELECT DISTINCT student_id, school_id FROM student_enrollment_events')
  for (const student of students) {
    const events = await query(
      'SELECT id FROM student_enrollment_events WHERE student_id = ? AND school_id = ? ORDER BY effective_on ASC, created_at ASC, id ASC',
      [student.student_id, student.school_id]
    )
    for (let index = 0; index < events.length; index += 1) {
      await run('UPDATE student_enrollment_events SET event_sequence = ? WHERE id = ?', [index + 1, events[index].id])
    }
  }
}

export async function down({ run }) {
  // The shared adapter does not safely support dropping columns across all
  // supported SQLite versions. The column is harmless when rolling back.
}
