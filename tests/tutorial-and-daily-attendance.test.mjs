import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

test('TeacherDashboard.vue provides direct daily attendance link', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/views/TeacherDashboard.vue'), 'utf-8')
  
  assert.ok(content.includes('todayAttendanceUrl'), 'TeacherDashboard should define todayAttendanceUrl')
  assert.ok(content.includes('take-attendance-btn'), 'TeacherDashboard should have take-attendance-btn in header')
  assert.ok(content.includes('Take Today\'s Attendance'), 'Button text should be present')
  assert.ok(content.includes('/attendance?grade='), 'Link should direct to /attendance with query params')
  assert.ok(content.includes('autoOpen=1'), 'Link should request autoOpen')
})

test('AttendanceSheet.vue supports teacher advisory scoping and batch quick-fill', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/views/AttendanceSheet.vue'), 'utf-8')
  
  assert.ok(content.includes('route.query.autoOpen'), 'AttendanceSheet should support autoOpen query parameter')
  assert.ok(content.includes('canEdit'), 'AttendanceSheet should check canEdit instead of naive isOwner')
  assert.ok(content.includes('quickMarkAllPresent'), 'AttendanceSheet should implement quickMarkAllPresent')
  assert.ok(content.includes('Mark All Present (E)'), 'Quick Fill button should be present in UI')
  assert.ok(!content.includes('v-if="auth.isTeacher && !isOwner" class="readonly-banner"'), 'False ownership banner should be removed')
})

test('WalkInTutorial.vue contains 6 multi-role onboarding slides and localStorage persistence', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/WalkInTutorial.vue'), 'utf-8')
  
  assert.ok(content.includes('currentStep === 0'), 'Slide 1 (Overview) should exist')
  assert.ok(content.includes('currentStep === 1'), 'Slide 2 (Daily Roll Call) should exist')
  assert.ok(content.includes('currentStep === 2'), 'Slide 3 (Monthly DepEd SF2) should exist')
  assert.ok(content.includes('currentStep === 3'), 'Slide 4 (SARDO Radar) should exist')
  assert.ok(content.includes('currentStep === 4'), 'Slide 5 (Institutional / Scoping) should exist')
  assert.ok(content.includes('currentStep === 5'), 'Slide 6 (Ready to Roll) should exist')

  assert.ok(content.includes('code-present'), 'Slide 2 should include code chips (E)')
  assert.ok(content.includes('code-tardy'), 'Slide 2 should include code chips (T)')
  assert.ok(content.includes('code-absent'), 'Slide 2 should include code chips (A)')
  assert.ok(content.includes('auth.isAdmin || auth.isSuperadmin'), 'Slide 5 should branch for Admin vs Teacher')
  assert.ok(content.includes('elytrack_tutorial_seen'), 'Should store completion flag in localStorage')
})

test('App.vue mounts WalkInTutorial and provides tutorial button in top navigation', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/App.vue'), 'utf-8')
  
  assert.ok(content.includes('WalkInTutorial'), 'App.vue should import WalkInTutorial')
  assert.ok(content.includes('<WalkInTutorial'), 'App.vue should mount WalkInTutorial')
  assert.ok(content.includes('tutorial-btn'), 'App.vue should have tutorial-btn in top nav')
  assert.ok(content.includes('showTutorial'), 'App.vue should have showTutorial state')
  assert.ok(content.includes('elytrack_tutorial_seen'), 'App.vue should check elytrack_tutorial_seen')
})

test('Licenses route blocks school admins from mutation endpoints', () => {
  const raw = fs.readFileSync(path.join(ROOT, 'routes/licenses.js'), 'utf-8')
  const content = raw.replace(/\r\n/g, '\n')
  
  // Verify that mutation endpoints strictly require superadmin role
  assert.ok(content.includes("router.post('/', async (req, res) => {\n  try {\n    const { me, error } = await requireRole(req, res, 'superadmin')"), 'POST / should require superadmin')
  assert.ok(content.includes("router.post('/activate', async (req, res) => {\n  try {\n    const { me, error } = await requireRole(req, res, 'superadmin')"), 'POST /activate should require superadmin')
  assert.ok(content.includes("router.post('/renew', async (req, res) => {\n  try {\n    const { me, error } = await requireRole(req, res, 'superadmin')"), 'POST /renew should require superadmin')
  assert.ok(content.includes("router.post('/:id/suspend', async (req, res) => {\n  try {\n    const { me, error } = await requireRole(req, res, 'superadmin')"), 'POST /:id/suspend should require superadmin')
  assert.ok(content.includes("router.delete('/:id', async (req, res) => {\n  try {\n    const { me, error } = await requireRole(req, res, 'superadmin')"), 'DELETE /:id should require superadmin')
})
