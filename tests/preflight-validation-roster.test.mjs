import test from 'node:test'
import assert from 'node:assert/strict'
import { query, run, initDatabase } from '../db.js'
import { getUnifiedClassRoster } from '../routes/monthly.js'

test('getUnifiedClassRoster retrieves learners with LRN and gender even when schoolId scope is implicit', async () => {
  await initDatabase()

  // Verify class with students exists
  const students = await query(
    "SELECT id, name, grade, section, school_id, lrn FROM students WHERE grade = 'Grade 7' AND section = 'Pine' LIMIT 5"
  )
  assert.ok(students.length > 0, 'Database should contain Grade 7 Pine students')

  const schoolId = students[0].school_id

  // 1. Calling with explicit schoolId
  const explicitRoster = await getUnifiedClassRoster(schoolId, 'Grade 7', 'Pine')
  assert.ok(explicitRoster.length > 0, 'Explicit school roster should not be empty')
  assert.ok(explicitRoster[0].name, 'Roster entries must contain student name')
  assert.ok('lrn' in explicitRoster[0], 'Roster entries must contain lrn field')

  // 2. Calling with empty schoolId (implicit scope fallback)
  const implicitRoster = await getUnifiedClassRoster('', 'Grade 7', 'Pine')
  assert.ok(implicitRoster.length > 0, 'Implicit school roster must not return empty when learners are present')
  assert.equal(implicitRoster.length, explicitRoster.length, 'Implicit roster should find all matching learners')
})
