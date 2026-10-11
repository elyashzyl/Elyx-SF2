import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

test('Popover components implement Shadcn-Vue popover specifications', () => {
  const popover = read('src/components/ui/popover/Popover.vue')
  const content = read('src/components/ui/popover/PopoverContent.vue')
  const trigger = read('src/components/ui/popover/PopoverTrigger.vue')
  const index = read('src/components/ui/popover/index.js')

  assert.ok(popover.includes('shadcn-popover-root'), 'Must provide root wrapper')
  assert.ok(popover.includes("provide('popoverContext'"), 'Must provide popover context')
  assert.ok(popover.includes('handleClickOutside'), 'Must close on outside click')
  assert.ok(popover.includes('handleKeyDown'), 'Must support Escape dismissal')

  assert.ok(content.includes('shadcn-popover-content'), 'Must render content container')
  assert.ok(content.includes("inject('popoverContext'"), 'Must inject popover context')
  assert.ok(trigger.includes('shadcn-popover-trigger'), 'Must provide trigger')

  assert.ok(index.includes('Popover'), 'Must export Popover')
  assert.ok(index.includes('PopoverTrigger'), 'Must export PopoverTrigger')
  assert.ok(index.includes('PopoverContent'), 'Must export PopoverContent')
})

test('Calendar.vue implements Shadcn-Vue calendar specifications', () => {
  const calendar = read('src/components/ui/calendar/Calendar.vue')
  const index = read('src/components/ui/calendar/index.js')

  assert.ok(calendar.includes('shadcn-calendar'), 'Must have calendar container class')
  assert.ok(calendar.includes('calendar-grid'), 'Must render day grid')
  assert.ok(calendar.includes('is-selected'), 'Must highlight selected date')
  assert.ok(calendar.includes('is-today'), 'Must highlight today')
  assert.ok(calendar.includes("emit('update:modelValue'"), 'Must emit standard v-model updates')
  assert.ok(calendar.includes("emit('select'"), 'Must emit select events')
  assert.ok(calendar.includes('MONTH_NAMES'), 'Must provide month navigation')
  assert.ok(calendar.includes('yearRange'), 'Must provide year jumper range')

  assert.ok(index.includes('Calendar'), 'ui/calendar must export Calendar')
})

test('DatePicker composes Popover and Calendar with ISO compatibility', () => {
  const datePicker = read('src/components/ui/date-picker/DatePicker.vue')
  const wrapper = read('src/components/DatePicker.vue')
  const index = read('src/components/ui/date-picker/index.js')

  assert.ok(datePicker.includes('<Popover'), 'Must compose Popover')
  assert.ok(datePicker.includes('<PopoverTrigger'), 'Must compose PopoverTrigger')
  assert.ok(datePicker.includes('<PopoverContent'), 'Must compose PopoverContent')
  assert.ok(datePicker.includes('<Calendar'), 'Must compose Calendar')
  assert.ok(datePicker.includes('displayLabel'), 'Must calculate formatted display label')
  assert.ok(datePicker.includes("emit('update:modelValue'"), 'Must emit v-model update')
  assert.ok(datePicker.includes("emit('change'"), 'Must emit change event')
  assert.ok(wrapper.includes("import DatePicker from './ui/date-picker/DatePicker.vue'"), 'Must export top-level component')
  assert.ok(index.includes('DatePicker'), 'Must export DatePicker from module index')
})

test('All application views integrate DatePicker and eliminate native type="date" inputs', () => {
  const views = [
    'src/views/AttendanceSheet.vue',
    'src/views/AdminDashboard.vue',
    'src/views/StudentManagement.vue',
    'src/views/QuarterlySettings.vue',
    'src/views/Reports.vue',
    'src/views/Schedule.vue',
    'src/views/Settings.vue'
  ]

  for (const viewPath of views) {
    const content = read(viewPath)
    assert.ok(
      content.includes("import DatePicker from '../components/DatePicker.vue'"),
      `${viewPath} must import DatePicker`
    )
    assert.ok(
      content.includes('<DatePicker'),
      `${viewPath} must render <DatePicker>`
    )
    assert.ok(
      !content.includes('type="date"') && !content.includes("type='date'"),
      `${viewPath} must not contain native type="date" inputs`
    )
  }
})
