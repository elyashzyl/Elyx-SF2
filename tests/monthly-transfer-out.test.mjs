import test, { before } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { isTransferredOutRemark, markStudentTransferredOut } from '../routes/monthly.js'
import { calculateMonthlyEntryTotals, hasMonthlyConsecutiveAbsences } from '../lib/monthly-calendar.js'
import { initializeServerDatabase } from '../server.js'
import { query, run } from '../db.js'

before(async () => {
  await initializeServerDatabase()
})

test('isTransferredOutRemark identifies TRANSFERRED OUT in various cases and formats', () => {
  assert.equal(isTransferredOutRemark('TRANSFERRED OUT'), true)
  assert.equal(isTransferredOutRemark('Transferred Out'), true)
  assert.equal(isTransferredOutRemark('transferred out'), true)
  assert.equal(isTransferredOutRemark('transfered out'), true)
  assert.equal(isTransferredOutRemark('Transfered Out'), true)
  assert.equal(isTransferredOutRemark('TRANSFERED OUT'), true)
  assert.equal(isTransferredOutRemark('transfered-out'), true)
  assert.equal(isTransferredOutRemark('T/O'), true)
  assert.equal(isTransferredOutRemark('t/o'), true)
  assert.equal(isTransferredOutRemark('T / O'), true)
  assert.equal(isTransferredOutRemark('T/O - Transfer to Manila'), true)
  assert.equal(isTransferredOutRemark('  transferred   out  '), true)
  assert.equal(isTransferredOutRemark('TRANSFERRED OUT - Moved to Manila High School'), true)
  assert.equal(isTransferredOutRemark('Transferred Out on 2026-10-15'), true)

  assert.equal(isTransferredOutRemark(''), false)
  assert.equal(isTransferredOutRemark(null), false)
  assert.equal(isTransferredOutRemark(undefined), false)
  assert.equal(isTransferredOutRemark('TRANSFERRED IN'), false)
  assert.equal(isTransferredOutRemark('Transferred in from other school'), false)
  assert.equal(isTransferredOutRemark('transfer in'), false)
  assert.equal(isTransferredOutRemark('Late enrollee'), false)
  assert.equal(isTransferredOutRemark('Dropped out'), false)
})

test('registered learners count subtracts TRANSFERRED OUT students from class totals', () => {
  const maleEntries = [
    { studentId: 'm1', name: 'Boy One', gender: 'male', remarks: '' },
    { studentId: 'm2', name: 'Boy Two', gender: 'male', remarks: 'TRANSFERRED OUT' },
    { studentId: 'm3', name: 'Boy Three', gender: 'male', remarks: '' }
  ]
  const femaleEntries = [
    { studentId: 'f1', name: 'Girl One', gender: 'female', remarks: 'Transferred Out to BPHS' },
    { studentId: 'f2', name: 'Girl Two', gender: 'female', remarks: '' },
    { studentId: 'f3', name: 'Girl Three', gender: 'female', remarks: 'transferred out' },
    { studentId: 'f4', name: 'Girl Four', gender: 'female', remarks: '' }
  ]

  const mCount = maleEntries.length // 3
  const fCount = femaleEntries.length // 4

  const mTransferredOut = maleEntries.filter(e => isTransferredOutRemark(e.remarks)).length
  const fTransferredOut = femaleEntries.filter(e => isTransferredOutRemark(e.remarks)).length
  const tTransferredOut = mTransferredOut + fTransferredOut

  assert.equal(mTransferredOut, 1)
  assert.equal(fTransferredOut, 2)
  assert.equal(tTransferredOut, 3)

  const regM = Math.max(0, mCount - mTransferredOut)
  const regF = Math.max(0, fCount - fTransferredOut)
  const regT = regM + regF

  assert.equal(regM, 2)
  assert.equal(regF, 2)
  assert.equal(regT, 4)

  // SF2 percentage of enrolment with 3 initial males and 4 initial females
  const initM = 3
  const initF = 4
  const pctEnrM = Math.round((regM / initM) * 1000) / 10
  const pctEnrF = Math.round((regF / initF) * 1000) / 10
  const pctEnrT = Math.round((regT / (initM + initF)) * 1000) / 10

  assert.equal(pctEnrM, 66.7)
  assert.equal(pctEnrF, 50.0)
  assert.equal(pctEnrT, 57.1)
})

test('registered learners count never becomes negative even when transferred out exceeds count', () => {
  const maleEntries = [
    { studentId: 'm1', name: 'Boy One', gender: 'male', remarks: 'TRANSFERRED OUT' }
  ]
  const mCount = 1
  const transferredOut = 2 // e.g. Manual override or edge case
  const regM = Math.max(0, mCount - transferredOut)
  assert.equal(regM, 0)
})

test('calculateMonthlyEntryTotals returns 0 present and 0 absent for transferred out entries', () => {
  const totals = calculateMonthlyEntryTotals({
    year: 2026,
    month: 8,
    days: { 3: 'A', 4: 'A', 5: 'A' },
    remarks: 'transfered out'
  })
  assert.equal(totals.present, 0)
  assert.equal(totals.absent, 0)
  assert.equal(totals.total, 0)
})

test('hasMonthlyConsecutiveAbsences returns false for transferred out entries', () => {
  const res = hasMonthlyConsecutiveAbsences({
    year: 2026,
    month: 8,
    days: { 3: 'A', 4: 'A', 5: 'A', 6: 'A', 7: 'A' },
    remarks: 'T/O'
  })
  assert.equal(res, false)
})

test('student row number is blank for transferred out entries and sequentially adjusted for active entries', () => {
  const entries = [
    { studentId: 'm1', name: 'Boy One', remarks: '' },
    { studentId: 'm2', name: 'Boy Two', remarks: 'TRANSFERRED OUT' },
    { studentId: 'm3', name: 'Boy Three', remarks: 'T/O' },
    { studentId: 'm4', name: 'Boy Four', remarks: '' }
  ]

  let seq = 1
  const rowNumbers = entries.map(entry => (
    isTransferredOutRemark(entry.remarks) ? '' : seq++
  ))

  assert.equal(rowNumbers[0], 1)
  assert.equal(rowNumbers[1], '')
  assert.equal(rowNumbers[2], '')
  assert.equal(rowNumbers[3], 2)
})

test('Percentage of Attendance follows DepEd formula with 2 decimal places and half-up rounding', () => {
  const mPresent = 490
  const fPresent = 530
  const schoolDays = 21

  // DepEd Formula B: ADA = Total Daily Attendance / School Days (rounded to 2 decimal places)
  const mADA = Math.round((mPresent / schoolDays) * 100) / 100 // 490 / 21 = 23.3333... -> 23.33
  const fADA = Math.round((fPresent / schoolDays) * 100) / 100 // 530 / 21 = 25.2380... -> 25.24
  const tADA = Math.round((mADA + fADA) * 100) / 100 // 23.33 + 25.24 = 48.57

  assert.equal(mADA, 23.33)
  assert.equal(fADA, 25.24)
  assert.equal(tADA, 48.57)

  // Registered learners (adjusted for transferred out)
  const regM = 24
  const regF = 26
  const regT = regM + regF // 50

  // DepEd Formula C: Percentage of Attendance = (ADA / Registered) * 100 (rounded to 2 decimal places)
  // 23.33 / 24 * 100 = 97.208333... -> with Math.round: 97.21 (Math.floor erroneously gave 97.20)
  const pctM = Math.round((mADA / regM) * 100 * 100) / 100
  const pctF = Math.round((fADA / regF) * 100 * 100) / 100
  const pctT = Math.round((tADA / regT) * 100 * 100) / 100

  assert.equal(pctM, 97.21)
  assert.equal(pctF, 97.08)
  assert.equal(pctT, 97.14)
})

test('gender summary row labels adjust active student counts when students transfer out', () => {
  const maleEntries = [
    { studentId: 'm1', name: 'Boy 1', remarks: '' },
    { studentId: 'm2', name: 'Boy 2', remarks: 'TRANSFERRED OUT' },
    { studentId: 'm3', name: 'Boy 3', remarks: '' }
  ]
  const femaleEntries = [
    { studentId: 'f1', name: 'Girl 1', remarks: '' },
    { studentId: 'f2', name: 'Girl 2', remarks: 'T/O' }
  ]

  const activeMaleCount = maleEntries.filter(e => !isTransferredOutRemark(e.remarks)).length
  const activeFemaleCount = femaleEntries.filter(e => !isTransferredOutRemark(e.remarks)).length

  assert.equal(activeMaleCount, 2)
  assert.equal(activeFemaleCount, 1)

  const maleLabel = `MALE | ${activeMaleCount}`
  const femaleLabel = `FEMALE | ${activeFemaleCount}`

  assert.equal(maleLabel, 'MALE | 2')
  assert.equal(femaleLabel, 'FEMALE | 1')
})

test('markStudentTransferredOut updates student enrollment_status to withdrawn and creates enrollment event', async () => {
  const testId = `test-stu-${randomUUID()}`
  const schoolId = `test-sch-${randomUUID()}`
  const actor = { id: 'admin1', name: 'Admin User', role: 'admin' }

  await run(`INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')`,
    [testId, 'Transferred Test Student', 'Grade 7', 'Section Ruby', 'male', schoolId]
  )

  const res = await markStudentTransferredOut(
    testId,
    schoolId,
    'Grade 7',
    'Section Ruby',
    'TRANSFERRED OUT to Manila High',
    2026,
    8,
    actor
  )

  assert.ok(res, 'Student should be returned')
  assert.equal(res.id, testId)

  // Verify status in students table is updated to withdrawn
  const updatedStudent = (await query('SELECT enrollment_status FROM students WHERE id = ?', [testId]))[0]
  assert.equal(updatedStudent.enrollment_status, 'withdrawn')

  // Verify student_enrollment_events record was created
  const events = await query('SELECT * FROM student_enrollment_events WHERE student_id = ?', [testId])
  assert.ok(events.length > 0, 'Enrollment event must be created')
  const transferEvent = events.find(e => e.event_type === 'transfer_out')
  assert.ok(transferEvent, 'Transfer out event must exist')
  assert.equal(transferEvent.status, 'withdrawn')
})

test('markStudentTransferredOut falls back to matching by student name if ID search fails', async () => {
  const testId = `name-stu-${randomUUID()}`
  const studentName = `Fallback Learner ${randomUUID().slice(0, 6)}`
  const schoolId = `test-sch-${randomUUID()}`
  const actor = { id: 'admin1', name: 'Admin User', role: 'admin' }

  await run(`INSERT INTO students (id, name, grade, section, gender, school_id, enrollment_status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')`,
    [testId, studentName, 'Grade 8', 'Section Diamond', 'female', schoolId]
  )

  // Call with arbitrary ID but provide studentName
  const res = await markStudentTransferredOut(
    'nonexistent-uuid',
    schoolId,
    'Grade 8',
    'Section Diamond',
    'T/O - Moved to Rizal',
    2026,
    8,
    actor,
    studentName
  )

  assert.ok(res, 'Student should be found by name fallback')
  assert.equal(res.id, testId)

  const updatedStudent = (await query('SELECT enrollment_status FROM students WHERE id = ?', [testId]))[0]
  assert.equal(updatedStudent.enrollment_status, 'withdrawn')
})
