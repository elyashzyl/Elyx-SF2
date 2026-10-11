<template>
  <div class="shadcn-calendar" :class="{ 'is-disabled': disabled }">
    <!-- Header with Navigation and Month/Year Jumpers -->
    <div class="calendar-header">
      <button
        type="button"
        class="calendar-nav-btn prev"
        title="Previous Month"
        aria-label="Previous Month"
        :disabled="isPrevMonthDisabled"
        @click="goToPrevMonth"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="calendar-selects">
        <select
          v-model="currentMonth"
          class="calendar-select month-select"
          aria-label="Select month"
        >
          <option v-for="(mName, idx) in MONTH_NAMES" :key="idx" :value="idx">
            {{ mName }}
          </option>
        </select>

        <select
          v-model="currentYear"
          class="calendar-select year-select"
          aria-label="Select year"
        >
          <option v-for="yr in yearRange" :key="yr" :value="yr">
            {{ yr }}
          </option>
        </select>
      </div>

      <button
        type="button"
        class="calendar-nav-btn next"
        title="Next Month"
        aria-label="Next Month"
        :disabled="isNextMonthDisabled"
        @click="goToNextMonth"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>

    <!-- Weekday Labels -->
    <div class="calendar-weekdays" role="row">
      <span
        v-for="(wName, idx) in WEEKDAY_NAMES"
        :key="idx"
        class="calendar-weekday"
        role="columnheader"
        :aria-label="fullWeekdayNames[idx]"
      >
        {{ wName }}
      </span>
    </div>

    <!-- Calendar Day Grid -->
    <div class="calendar-grid" role="grid">
      <button
        v-for="cell in daysGrid"
        :key="cell.iso"
        type="button"
        class="calendar-day"
        :class="{
          'is-outside': !cell.isCurrentMonth,
          'is-selected': cell.isSelected,
          'is-today': cell.isToday,
          'is-disabled': cell.isDisabled
        }"
        :disabled="cell.isDisabled"
        :aria-selected="cell.isSelected ? 'true' : 'false'"
        :aria-label="cell.iso"
        @click="handleDayClick(cell)"
      >
        <span>{{ cell.day }}</span>
      </button>
    </div>

    <!-- Quick Actions Footer -->
    <div v-if="showQuickButtons" class="calendar-footer">
      <button
        type="button"
        class="quick-btn today-btn"
        @click="handleSelectToday"
      >
        Today
      </button>
      <button
        v-if="modelValue"
        type="button"
        class="quick-btn clear-btn"
        @click="handleClear"
      >
        Clear
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const fullWeekdayNames = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default: ''
  },
  min: {
    type: [String, Date],
    default: ''
  },
  max: {
    type: [String, Date],
    default: ''
  },
  defaultPlaceholder: {
    type: [String, Date],
    default: ''
  },
  showQuickButtons: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  layout: {
    type: String,
    default: 'month-and-year'
  }
})

const emit = defineEmits(['update:modelValue', 'select', 'clear'])

function parseIso(val) {
  if (!val) return null
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : new Date(val.getFullYear(), val.getMonth(), val.getDate())
  }
  if (typeof val === 'string') {
    const parts = val.trim().split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day)
      }
    }
    const d = new Date(val)
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
  }
  return null
}

function formatIso(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const todayDate = new Date()
const todayIso = formatIso(todayDate)

const selectedDate = computed(() => parseIso(props.modelValue))
const selectedIso = computed(() => formatIso(selectedDate.value))

const minIso = computed(() => {
  const d = parseIso(props.min)
  return d ? formatIso(d) : ''
})

const maxIso = computed(() => {
  const d = parseIso(props.max)
  return d ? formatIso(d) : ''
})

// Current month & year viewed in calendar
const initialDate = parseIso(props.modelValue) || parseIso(props.defaultPlaceholder) || todayDate
const currentYear = ref(initialDate.getFullYear())
const currentMonth = ref(initialDate.getMonth())

watch(
  () => props.modelValue,
  (newVal) => {
    const parsed = parseIso(newVal)
    if (parsed) {
      currentYear.value = parsed.getFullYear()
      currentMonth.value = parsed.getMonth()
    }
  }
)

const yearRange = computed(() => {
  const currentY = todayDate.getFullYear()
  const start = currentY - 80 // allow birthdates back 80 years
  const end = currentY + 15   // future planning
  const years = []
  for (let y = start; y <= end; y++) {
    years.push(y)
  }
  return years
})

const isPrevMonthDisabled = computed(() => {
  if (!minIso.value) return false
  const prevMonthEnd = new Date(currentYear.value, currentMonth.value, 0)
  return formatIso(prevMonthEnd) < minIso.value
})

const isNextMonthDisabled = computed(() => {
  if (!maxIso.value) return false
  const nextMonthStart = new Date(currentYear.value, currentMonth.value + 1, 1)
  return formatIso(nextMonthStart) > maxIso.value
})

function goToPrevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value -= 1
  } else {
    currentMonth.value -= 1
  }
}

function goToNextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value += 1
  } else {
    currentMonth.value += 1
  }
}

const daysGrid = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
  const firstDayWeekday = new Date(year, month, 1).getDay() // 0 (Sun) to 6 (Sat)
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const grid = []

  // 1. Trailing days from previous month
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const dateObj = new Date(year, month - 1, d)
    const iso = formatIso(dateObj)
    grid.push({
      day: d,
      month: month - 1,
      year,
      iso,
      isCurrentMonth: false,
      isSelected: iso === selectedIso.value,
      isToday: iso === todayIso,
      isDisabled: props.disabled || (minIso.value && iso < minIso.value) || (maxIso.value && iso > maxIso.value)
    })
  }

  // 2. Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateObj = new Date(year, month, d)
    const iso = formatIso(dateObj)
    grid.push({
      day: d,
      month,
      year,
      iso,
      isCurrentMonth: true,
      isSelected: iso === selectedIso.value,
      isToday: iso === todayIso,
      isDisabled: props.disabled || (minIso.value && iso < minIso.value) || (maxIso.value && iso > maxIso.value)
    })
  }

  // 3. Leading days for next month (fill up to total of 35 or 42 cells)
  const remainingCells = 42 - grid.length
  for (let d = 1; d <= remainingCells; d++) {
    const dateObj = new Date(year, month + 1, d)
    const iso = formatIso(dateObj)
    grid.push({
      day: d,
      month: month + 1,
      year,
      iso,
      isCurrentMonth: false,
      isSelected: iso === selectedIso.value,
      isToday: iso === todayIso,
      isDisabled: props.disabled || (minIso.value && iso < minIso.value) || (maxIso.value && iso > maxIso.value)
    })
  }

  return grid
})

function handleDayClick(cell) {
  if (cell.isDisabled) return
  if (!cell.isCurrentMonth) {
    const parsed = parseIso(cell.iso)
    if (parsed) {
      currentYear.value = parsed.getFullYear()
      currentMonth.value = parsed.getMonth()
    }
  }
  emit('update:modelValue', cell.iso)
  emit('select', cell.iso)
}

function handleSelectToday() {
  const today = formatIso(new Date())
  if ((minIso.value && today < minIso.value) || (maxIso.value && today > maxIso.value)) {
    return
  }
  currentYear.value = todayDate.getFullYear()
  currentMonth.value = todayDate.getMonth()
  emit('update:modelValue', today)
  emit('select', today)
}

function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}

defineExpose({
  currentYear,
  currentMonth,
  goToPrevMonth,
  goToNextMonth,
  handleSelectToday,
  handleClear
})
</script>

<style scoped>
.shadcn-calendar {
  width: 280px;
  padding: 8px;
  background: var(--card, #ffffff);
  color: var(--foreground, #09090b);
  user-select: none;
  font-family: inherit;
}

.shadcn-calendar.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Header */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 2px;
}

.calendar-selects {
  display: flex;
  align-items: center;
  gap: 4px;
}

.calendar-select {
  background: var(--secondary, rgba(255, 255, 255, 0.05));
  color: var(--foreground, #09090b);
  border: 1px solid var(--border, #e4e4e7);
  border-radius: var(--radius-sm, 6px);
  padding: 3px 6px;
  font-size: 0.78rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.calendar-select:hover {
  background: var(--muted, rgba(0, 0, 0, 0.04));
  border-color: var(--primary, #0c5357);
}

.calendar-select:focus {
  border-color: var(--primary, #0c5357);
  box-shadow: 0 0 0 1px var(--primary, #0c5357);
}

.calendar-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--foreground, #09090b);
  border: 1px solid var(--border, #e4e4e7);
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
}

.calendar-nav-btn:hover:not(:disabled) {
  background: var(--secondary, rgba(0, 0, 0, 0.05));
  color: var(--primary, #0c5357);
}

.calendar-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Weekday headers */
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 4px;
}

.calendar-weekday {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--muted-foreground, #71717a);
  padding: 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Days Grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 34px;
  margin: 0 auto;
  border-radius: var(--radius-sm, 6px);
  border: none;
  background: transparent;
  color: var(--foreground, #09090b);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: background 0.12s ease, color 0.12s ease, transform 0.08s ease;
}

.calendar-day:hover:not(.is-disabled):not(.is-selected) {
  background: var(--primary-bg, rgba(12, 83, 87, 0.12));
  color: var(--primary, #0c5357);
}

.calendar-day:active:not(.is-disabled) {
  transform: scale(0.96);
}

.calendar-day.is-outside {
  color: var(--muted-foreground, #a1a1aa);
  opacity: 0.55;
}

.calendar-day.is-today:not(.is-selected) {
  border: 1.5px solid var(--primary, #0c5357);
  font-weight: 700;
  color: var(--primary, #0c5357);
}

.calendar-day.is-selected {
  background: var(--primary, #0c5357) !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(12, 83, 87, 0.35);
}

.calendar-day.is-disabled {
  opacity: 0.25;
  cursor: not-allowed;
  pointer-events: none;
}

/* Footer */
.calendar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--border, #e4e4e7);
}

.quick-btn {
  background: transparent;
  border: none;
  padding: 4px 8px;
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--primary, #0c5357);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  transition: background 0.12s ease;
}

.quick-btn:hover {
  background: var(--primary-bg, rgba(12, 83, 87, 0.1));
}

.quick-btn.clear-btn {
  color: var(--muted-foreground, #71717a);
}

.quick-btn.clear-btn:hover {
  color: var(--destructive, #ef4444);
  background: rgba(239, 68, 68, 0.1);
}
</style>
