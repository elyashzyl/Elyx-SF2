import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateMonthlyEntryTotals, hasMonthlyConsecutiveAbsences, isStudentCountedOnDate, listMonthlySchoolDays } from '../lib/monthly-calendar.js'

test('monthly school days exclude Saturdays by default but include them when enabled', () => {
  const weekdaysOnly = listMonthlySchoolDays(8, 2026)
  const withSaturdays = listMonthlySchoolDays(8, 2026, [], true)

  assert.equal(weekdaysOnly.some(day => day.weekday === 6), false)
  assert.equal(withSaturdays.some(day => day.weekday === 6), true)
  assert.equal(withSaturdays.some(day => day.weekday === 0), false)
})

test('monthly totals count Saturday only when the report enables it', () => {
  const days = { 1: 'A', 8: 'A', 9: 'A' }
  const weekdaysOnly = calculateMonthlyEntryTotals({ year: 2026, month: 8, days })
  const withSaturdays = calculateMonthlyEntryTotals({ year: 2026, month: 8, days, includeSaturdays: true })

  assert.equal(weekdaysOnly.absent, 0)
  assert.equal(withSaturdays.absent, 2)
  assert.equal(withSaturdays.total, weekdaysOnly.total + 5)
})

test('excluded Saturdays remain disabled even when Saturdays are enabled', () => {
  const totals = calculateMonthlyEntryTotals({
    year: 2026,
    month: 8,
    days: { 8: 'A', 15: 'A' },
    excludedDates: [8],
    includeSaturdays: true
  })

  assert.equal(totals.absent, 1)
  assert.equal(totals.total, 25)
})

test('transferred-out learners count before but not on or after their transfer date', () => {
  assert.equal(isStudentCountedOnDate({ year: 2026, month: 8, day: 14, transferOutDate: '2026-08-15' }), true)
  assert.equal(isStudentCountedOnDate({ year: 2026, month: 8, day: 15, transferOutDate: '2026-08-15' }), false)
  assert.equal(isStudentCountedOnDate({ year: 2026, month: 8, day: 16, transferOutDate: '2026-08-15' }), false)
  assert.equal(isStudentCountedOnDate({ year: 2026, month: 8, day: 15 }), true)
})

test('five-day absence metric requires five consecutive school dates', () => {
  assert.equal(hasMonthlyConsecutiveAbsences({
    year: 2026,
    month: 8,
    days: { 3: 'A', 4: 'A', 5: 'A', 6: 'A', 7: 'A' }
  }), true)

  assert.equal(hasMonthlyConsecutiveAbsences({
    year: 2026,
    month: 8,
    days: { 3: 'A', 4: 'A', 6: 'A', 7: 'A', 10: 'A' }
  }), false)

  assert.equal(hasMonthlyConsecutiveAbsences({
    year: 2026,
    month: 8,
    days: { 3: 'A', 4: 'A', 5: 'A', 6: 'A', 7: 'A' },
    excludedDates: [5]
  }), false)
})
