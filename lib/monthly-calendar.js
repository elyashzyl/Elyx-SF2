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

export function calculateMonthlyEntryTotals({ year, month, days = {}, excludedDates = [], includeSaturdays = false }) {
  const schoolDays = listMonthlySchoolDays(month, year, excludedDates, includeSaturdays)
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

  return { total: schoolDays.length, present: schoolDays.length - absent, absent }
}
