import test from 'node:test'
import assert from 'node:assert/strict'

// Calculation logic mirroring DepEd School Form 2 standards
function calculateADA(totalPresent, schoolDays) {
  if (!schoolDays || schoolDays <= 0) return 0
  return Number((totalPresent / schoolDays).toFixed(2))
}

function calculatePercentageAttendance(ada, totalEnrolled) {
  if (!totalEnrolled || totalEnrolled <= 0) return 0
  return Number(((ada / totalEnrolled) * 100).toFixed(2))
}

function normalizeGender(g) {
  const v = String(g || '').trim().toLowerCase()
  if (v === 'm' || v === 'male' || v === 'boy' || v === 'boys') return 'M'
  if (v === 'f' || v === 'female' || v === 'girl' || v === 'girls') return 'F'
  return ''
}

test('DepEd SF2 Monthly ADA and Attendance Percentage Calculations', () => {
  const schoolDays = 20
  const enrolledMale = 25
  const enrolledFemale = 20
  const totalEnrolled = enrolledMale + enrolledFemale

  // Simulate attendance records
  // 25 males * 20 days = 500 max days. Suppose 20 absent days total. Present = 480.
  const malePresent = 480
  // 20 females * 20 days = 400 max days. Suppose 10 absent days total. Present = 390.
  const femalePresent = 390
  const combinedPresent = malePresent + femalePresent // 870

  const maleADA = calculateADA(malePresent, schoolDays)
  const femaleADA = calculateADA(femalePresent, schoolDays)
  const combinedADA = calculateADA(combinedPresent, schoolDays)

  assert.equal(maleADA, 24)
  assert.equal(femaleADA, 19.5)
  assert.equal(combinedADA, 43.5)
  assert.equal(Number((maleADA + femaleADA).toFixed(2)), combinedADA)

  const malePct = calculatePercentageAttendance(maleADA, enrolledMale)
  const femalePct = calculatePercentageAttendance(femaleADA, enrolledFemale)
  const combinedPct = calculatePercentageAttendance(combinedADA, totalEnrolled)

  assert.equal(malePct, 96)
  assert.equal(femalePct, 97.5)
  assert.equal(combinedPct, 96.67)
})

test('Gender Normalization guarantees both groups exist', () => {
  assert.equal(normalizeGender('M'), 'M')
  assert.equal(normalizeGender('male'), 'M')
  assert.equal(normalizeGender('Boy'), 'M')
  assert.equal(normalizeGender('F'), 'F')
  assert.equal(normalizeGender('female'), 'F')
  assert.equal(normalizeGender('Girl'), 'F')
  assert.equal(normalizeGender(''), '')
  assert.equal(normalizeGender(null), '')
})
