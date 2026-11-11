import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateDepEdComponent, calculateLearnerEClassRecord, transmuteGrade } from '../lib/grading.js'

test('calculateDepEdComponent: normal numeric score calculations', () => {
  const scores = [18, 19, 23, 19, 15] // sum = 94
  const hps = [20, 20, 25, 20, 15]    // sum = 100
  const comp = calculateDepEdComponent(scores, hps, 40)

  assert.equal(comp.totalRaw, 94.00)
  assert.equal(comp.totalHps, 100.00)
  assert.equal(comp.nominalHps, 100.00)
  assert.equal(comp.ps, 94.00)
  assert.equal(comp.ws, 37.60)
  assert.equal(comp.aeCount, 0)
  assert.equal(comp.auCount, 0)
})

test('calculateDepEdComponent: clamps scores exceeding HPS to maximum HPS', () => {
  const scores = [25, 30, 20] // first two exceed HPS
  const hps = [20, 20, 20]    // HPS is 20 each
  const comp = calculateDepEdComponent(scores, hps, 50)

  // Scores should be clamped: 20 + 20 + 20 = 60
  assert.equal(comp.totalRaw, 60.00)
  assert.equal(comp.totalHps, 60.00)
  assert.equal(comp.ps, 100.00)
  assert.equal(comp.ws, 50.00)
})

test('calculateDepEdComponent: handles AE (Absent Excused) by exempting item from denominator', () => {
  // 3 items with HPS 20, 20, 20. Total HPS = 60.
  // Student takes item 1 (18/20), item 2 (18/20), and item 3 is AE (excused).
  // Total raw = 36. Total effective HPS = 40 (item 3 excluded).
  // PS = 36 / 40 * 100 = 90.00%.
  const scores = [18, 18, 'AE']
  const hps = [20, 20, 20]
  const comp = calculateDepEdComponent(scores, hps, 30)

  assert.equal(comp.totalRaw, 36.00)
  assert.equal(comp.totalHps, 40.00)
  assert.equal(comp.nominalHps, 60.00)
  assert.equal(comp.ps, 90.00)
  assert.equal(comp.ws, 27.00)
  assert.equal(comp.aeCount, 1)
  assert.equal(comp.auCount, 0)
})

test('calculateDepEdComponent: handles AU (Absent Unexcused) by giving 0 but retaining denominator', () => {
  // 3 items with HPS 20, 20, 20. Total HPS = 60.
  // Student takes item 1 (18/20), item 2 (18/20), and item 3 is AU (unexcused).
  // Total raw = 36. Total effective HPS = 60 (item 3 retained).
  // PS = 36 / 60 * 100 = 60.00%.
  const scores = [18, 18, 'AU']
  const hps = [20, 20, 20]
  const comp = calculateDepEdComponent(scores, hps, 30)

  assert.equal(comp.totalRaw, 36.00)
  assert.equal(comp.totalHps, 60.00)
  assert.equal(comp.nominalHps, 60.00)
  assert.equal(comp.ps, 60.00)
  assert.equal(comp.ws, 18.00)
  assert.equal(comp.aeCount, 0)
  assert.equal(comp.auCount, 1)
})

test('calculateDepEdComponent: handles case-insensitive ae and au strings', () => {
  const scores = [20, 'ae', 'au', 20]
  const hps = [20, 20, 20, 20]
  const comp = calculateDepEdComponent(scores, hps, 50)

  // item 1: 20/20
  // item 2: AE (exempt, 0 raw, 0 denom)
  // item 3: AU (unexcused, 0 raw, 20 denom)
  // item 4: 20/20
  // Total raw = 40. Effective HPS = 60.
  // PS = 40/60 * 100 = 66.67%
  assert.equal(comp.totalRaw, 40.00)
  assert.equal(comp.totalHps, 60.00)
  assert.equal(comp.nominalHps, 80.00)
  assert.equal(comp.ps, 66.67)
  assert.equal(comp.ws, 33.33)
  assert.equal(comp.aeCount, 1)
  assert.equal(comp.auCount, 1)
})

test('calculateDepEdComponent: when all items are AE, learner is exempt (PS = 100%)', () => {
  const scores = ['AE', 'AE', 'AE']
  const hps = [25, 25, 25]
  const comp = calculateDepEdComponent(scores, hps, 50)

  assert.equal(comp.totalRaw, 0)
  assert.equal(comp.totalHps, 0)
  assert.equal(comp.nominalHps, 75.00)
  assert.equal(comp.ps, 100.00)
  assert.equal(comp.ws, 50.00)
  assert.equal(comp.aeCount, 3)
})

test('calculateLearnerEClassRecord: unified PT backward compatibility', () => {
  const record = calculateLearnerEClassRecord({
    wwScores: [18, 19, 23, 19, 15],
    wwHps: [20, 20, 25, 20, 15],
    weightWw: 40,
    ptScores: [24, 25, 23, 24],
    ptHps: [25, 25, 25, 25],
    weightPt: 40,
    qaScores: [45],
    qaHps: [50],
    weightQa: 20
  })

  assert.equal(record.isPtSplit, false)
  assert.equal(record.initialGrade, 94.00)
  assert.equal(record.transmutedGrade, 96)
  assert.equal(record.remarks, 'Passed')
})

test('calculateLearnerEClassRecord: split PT into Recitation & Seatwork with valid percentages', () => {
  // WW: 94/100 * 30% = 28.20
  // PT total weight: 50%
  //   - Recitation weight: 20%
  //     recScores: [9, 10, 10, 9] / [10, 10, 10, 10] -> 38/40 = 95.00%
  //     rec WS: 95.00 * 20% = 19.00
  //   - Seatwork / PT weight: 30%
  //     swScores: [25, 23, 24, 25] / [25, 25, 25, 25] -> 97/100 = 97.00%
  //     sw WS: 97.00 * 30% = 29.10
  //   - Total PT WS: 19.00 + 29.10 = 48.10
  // QA: 45/50 * 20% = 18.00
  // Initial Grade = 28.20 + 48.10 + 18.00 = 94.30
  // Transmuted Grade = 96
  const record = calculateLearnerEClassRecord({
    wwScores: [18, 19, 23, 19, 15],
    wwHps: [20, 20, 25, 20, 15],
    weightWw: 30,
    weightPt: 50,
    isPtSplit: true,
    recScores: [9, 10, 10, 9],
    recHps: [10, 10, 10, 10],
    weightRec: 20,
    swScores: [25, 23, 24, 25],
    swHps: [25, 25, 25, 25],
    weightSw: 30,
    qaScores: [45],
    qaHps: [50],
    weightQa: 20
  })

  assert.equal(record.isPtSplit, true)
  assert.ok(record.rec)
  assert.ok(record.sw)
  assert.equal(record.rec.totalRaw, 38.00)
  assert.equal(record.rec.totalHps, 40.00)
  assert.equal(record.rec.ps, 95.00)
  assert.equal(record.rec.ws, 19.00)

  assert.equal(record.sw.totalRaw, 97.00)
  assert.equal(record.sw.totalHps, 100.00)
  assert.equal(record.sw.ps, 97.00)
  assert.equal(record.sw.ws, 29.10)

  assert.equal(record.pt.ws, 48.10)
  assert.equal(record.initialGrade, 94.30)
  assert.equal(record.transmutedGrade, 96)
  assert.equal(record.remarks, 'Passed')
})

test('calculateLearnerEClassRecord: split PT strictly enforces weightRec + weightSw === weightPt', () => {
  // If weightRec + weightSw (20 + 25 = 45) !== weightPt (50), an error must be thrown
  assert.throws(() => {
    calculateLearnerEClassRecord({
      wwScores: [20],
      wwHps: [20],
      weightWw: 30,
      weightPt: 50,
      isPtSplit: true,
      recScores: [10],
      recHps: [10],
      weightRec: 20,
      swScores: [20],
      swHps: [25],
      weightSw: 25, // 20 + 25 = 45 !== 50!
      qaScores: [50],
      qaHps: [50],
      weightQa: 20
    })
  }, /Recitation weight.*must equal total PT weight/i)
})

test('calculateLearnerEClassRecord: split PT with special marks AE and AU', () => {
  const record = calculateLearnerEClassRecord({
    wwScores: [18, 'AE'],
    wwHps: [20, 20],
    weightWw: 30,
    weightPt: 50,
    isPtSplit: true,
    recScores: [10, 'AE'], // item 2 AE -> rec total = 10 / 10 = 100% -> WS = 20.00
    recHps: [10, 10],
    weightRec: 20,
    swScores: [20, 'AU'],  // item 2 AU -> sw total = 20 / 40 = 50% -> WS = 15.00
    swHps: [20, 20],
    weightSw: 30,
    qaScores: [40],
    qaHps: [50],
    weightQa: 20
  })

  // WW: 18 / 20 = 90% -> WS = 27.00
  assert.equal(record.ww.ps, 90.00)
  assert.equal(record.ww.ws, 27.00)

  // Rec: 10 / 10 = 100% -> WS = 20.00
  assert.equal(record.rec.ps, 100.00)
  assert.equal(record.rec.ws, 20.00)

  // SW: 20 / 40 = 50% -> WS = 15.00
  assert.equal(record.sw.ps, 50.00)
  assert.equal(record.sw.ws, 15.00)

  // PT WS: 20.00 + 15.00 = 35.00
  assert.equal(record.pt.ws, 35.00)

  // QA: 40 / 50 = 80% -> WS = 16.00
  assert.equal(record.qa.ps, 80.00)
  assert.equal(record.qa.ws, 16.00)

  // Initial Grade: 27.00 + 35.00 + 16.00 = 78.00
  assert.equal(record.initialGrade, 78.00)
  assert.equal(record.transmutedGrade, 86)
  assert.equal(record.remarks, 'Passed')
})
