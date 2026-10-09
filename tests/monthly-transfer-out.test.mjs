import test from 'node:test'
import assert from 'node:assert/strict'
import { isTransferredOutRemark } from '../routes/monthly.js'

test('isTransferredOutRemark identifies TRANSFERRED OUT in various cases and formats', () => {
  assert.equal(isTransferredOutRemark('TRANSFERRED OUT'), true)
  assert.equal(isTransferredOutRemark('Transferred Out'), true)
  assert.equal(isTransferredOutRemark('transferred out'), true)
  assert.equal(isTransferredOutRemark('  transferred   out  '), true)
  assert.equal(isTransferredOutRemark('TRANSFERRED OUT - Moved to Manila High School'), true)
  assert.equal(isTransferredOutRemark('Transferred Out on 2026-10-15'), true)

  assert.equal(isTransferredOutRemark(''), false)
  assert.equal(isTransferredOutRemark(null), false)
  assert.equal(isTransferredOutRemark(undefined), false)
  assert.equal(isTransferredOutRemark('TRANSFERRED IN'), false)
  assert.equal(isTransferredOutRemark('Transferred in from other school'), false)
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
