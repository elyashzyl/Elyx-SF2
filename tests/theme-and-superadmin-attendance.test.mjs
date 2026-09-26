import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

test('index.html includes anti-flash theme script in <head>', () => {
  const content = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8')
  assert.ok(content.includes("localStorage.getItem('theme')"), 'index.html should check localStorage theme')
  assert.ok(content.includes("document.documentElement.setAttribute('data-theme'"), 'index.html should set data-theme attribute on documentElement')
  assert.ok(content.includes("document.documentElement.style.colorScheme"), 'index.html should set colorScheme on documentElement')
})

test('useTheme.js applies data-theme and colorScheme to root, body, and #app', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/composables/useTheme.js'), 'utf-8')
  assert.ok(content.includes("document.documentElement.setAttribute('data-theme', value)"), 'useTheme should set data-theme on documentElement')
  assert.ok(content.includes("document.documentElement.style.colorScheme = value"), 'useTheme should set colorScheme on documentElement')
  assert.ok(content.includes("document.body.setAttribute('data-theme', value)"), 'useTheme should set data-theme on body')
  assert.ok(content.includes("root.setAttribute('data-theme', value)"), 'useTheme should set data-theme on #app')
  assert.ok(content.includes('export function useTheme'), 'useTheme should export useTheme')
})

test('Login.vue uses useTheme composable for unified theme management', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/views/Login.vue'), 'utf-8')
  assert.ok(content.includes("import { useTheme } from '../composables/useTheme'"), 'Login.vue should import useTheme')
  assert.ok(content.includes('const { theme, toggleTheme } = useTheme()'), 'Login.vue should destructure useTheme()')
  assert.ok(!content.includes("const theme = ref(localStorage.getItem('theme')"), 'Login.vue should not have isolated local theme ref')
})

test('attendance store actor() and methods support schoolId and superadmin fallback', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/stores/attendance.js'), 'utf-8')
  assert.ok(content.includes("let sid = extra.schoolId || auth?.user?.school_id || ''"), 'actor should extract sid from extra.schoolId or auth.user.school_id')
  assert.ok(content.includes("localStorage.getItem('app_active_school')"), 'actor should fallback to active school for superadmins')
  assert.ok(content.includes("getRecord(date, grade, section, schoolId)"), 'getRecord should accept schoolId')
  assert.ok(content.includes("saveRecord(record, user, schoolId)"), 'saveRecord should accept schoolId')
  assert.ok(content.includes("getOrCreateRecord(date, grade, section, adviser, user, schoolId)"), 'getOrCreateRecord should accept schoolId')
  assert.ok(content.includes("getAllRecords(schoolId)"), 'getAllRecords should accept schoolId')
  assert.ok(content.includes("deleteRecord(recordId, userId, userRole, schoolId)"), 'deleteRecord should accept schoolId')
  assert.ok(content.includes("updateEntry(recordId, studentId, field, value, userId, userRole, schoolId)"), 'updateEntry should accept schoolId')
})

test('AttendanceSheet.vue provides school selection for superadmins and passes effectiveSchoolId', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/views/AttendanceSheet.vue'), 'utf-8')
  assert.ok(content.includes('v-if="auth.isSuperadmin"'), 'AttendanceSheet should conditionally display superadmin controls')
  assert.ok(content.includes('v-model="selectedSchoolId"'), 'AttendanceSheet should bind selectedSchoolId')
  assert.ok(content.includes('@change="onSchoolChange"'), 'AttendanceSheet should trigger onSchoolChange when school changes')
  assert.ok(content.includes('useActiveSchool'), 'AttendanceSheet should import useActiveSchool')
  assert.ok(content.includes('effectiveSchoolId = computed'), 'AttendanceSheet should compute effectiveSchoolId')
  assert.ok(content.includes('loadGradeLevels(selectedSchoolId.value'), 'onSchoolChange should load grade levels for selected school')
  assert.ok(content.includes('Please select a school first'), 'openRecord should prompt superadmin to select school')
  assert.ok(content.includes('store.getOrCreateRecord('), 'openRecord should call store.getOrCreateRecord with effectiveSchoolId')
  assert.ok(content.includes('store.getAllRecords(effectiveSchoolId.value'), 'onMounted should load records for effectiveSchoolId')
})
