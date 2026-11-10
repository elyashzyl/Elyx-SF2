export function normalizeExcludedDates(excludedDates) {
  if (!Array.isArray(excludedDates)) return new Set()
  return new Set(excludedDates.map(Number).filter(Number.isInteger))
}

export function isMonthlySchoolDay(year, month, day, includeSaturdays = false, excludedDates = []) {
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const weekday = date.getDay()
  if (weekday === 0) return false
  if (weekday === 6 && !includeSaturdays) return false
  return !normalizeExcludedDates(excludedDates).has(Number(day))
}

export function listMonthlySchoolDays(month, year, excludedDates = [], includeSaturdays = false) {
  const days = []
  const dim = new Date(Number(year), Number(month), 0).getDate()
  const excluded = normalizeExcludedDates(excludedDates)
  for (let day = 1; day <= dim; day++) {
    const date = new Date(Number(year), Number(month) - 1, day)
    const weekday = date.getDay()
    if (weekday === 0) continue
    if (weekday === 6 && !includeSaturdays) continue
    if (excluded.has(day)) continue
    days.push({ day, weekday })
  }
  return days
}

export function isStudentCountedOnDate({ year, month, day, transferOutDate = '' }) {
  const transferDate = String(transferOutDate || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transferDate)) return true
  const reportDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return reportDate < transferDate
}

export function calculateMonthlyEntryTotals({ year, month, days = {}, excludedDates = [], includeSaturdays = false, schoolDaysOverride = null }) {
  const schoolDays = listMonthlySchoolDays(month, year, excludedDates, includeSaturdays)
  const customDays = Number(schoolDaysOverride)
  const totalDays = (customDays > 0) ? customDays : schoolDays.length
  const schoolDayNumbers = new Set(schoolDays.map(({ day }) => day))
  const enrollmentDays = Object.keys(days)
    .filter(day => days[day] === 'E')
    .map(Number)
    .filter(Number.isInteger)
  const enrollDay = enrollmentDays.length ? Math.min(...enrollmentDays) : null

  let absent = 0
  for (const dayKey of Object.keys(days)) {
    const day = Number(dayKey)
    if (!schoolDayNumbers.has(day)) continue
    if (enrollDay !== null && day < enrollDay) {
      absent++
      continue
    }
    const status = days[dayKey]
    if (status === 'A') absent++
    else if (status === '◢' || status === 'H') absent += 0.5
  }

  return { total: totalDays, present: Math.max(0, totalDays - absent), absent }
}

export function hasConsecutiveAbsences({ days = {}, schoolDays = [] }, requiredDays = 5) {
  const required = Math.max(1, Number(requiredDays) || 5)
  let consecutive = 0
  let previousDay = null
  for (const schoolDay of schoolDays) {
    const day = Number(schoolDay.day)
    const isAdjacent = previousDay !== null && day === previousDay + 1
    if (!isAdjacent) consecutive = 0
    if (days[String(day)] === 'A') {
      consecutive++
      if (consecutive >= required) return true
    } else {
      consecutive = 0
    }
    previousDay = day
  }
  return false
}

export function hasMonthlyConsecutiveAbsences({ year, month, days = {}, excludedDates = [], includeSaturdays = false, requiredDays = 5 }) {
  return hasConsecutiveAbsences({
    days,
    schoolDays: listMonthlySchoolDays(month, year, excludedDates, includeSaturdays)
  }, requiredDays)
}
