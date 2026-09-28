import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n')
}

test('public trial onboarding is database-backed and provisions a school admin license', () => {
  const auth = read('routes/auth.js')
  assert.ok(auth.includes("router.post('/trial'"), 'auth route must expose the public trial endpoint')
  assert.ok(auth.includes('subscription_plans'), 'trial must resolve the selected plan from the database')
  assert.ok(auth.includes("INSERT INTO schools"), 'trial must create a school record')
  assert.ok(auth.includes("INSERT INTO users"), 'trial must create an administrator account')
  assert.ok(auth.includes("'trial'"), 'trial must create a trial license')
  assert.ok(!auth.includes('seedGradeLevelsForSchool'), 'trial must not insert hardcoded grade levels')
  assert.ok(!auth.includes("router.post('/trial', requireRole"), 'trial must remain public')
})

test('landing trial CTA routes to the onboarding page instead of login', () => {
  const landing = read('src/views/Landing.vue')
  const router = read('src/router/index.js')
  const subscribe = read('src/views/Subscribe.vue')
  assert.ok(landing.includes('planCta(plan)'), 'landing pricing cards must use dynamic CTA routing')
  assert.ok(landing.includes('`/subscribe?plan=${encodeURIComponent(plan.tier || plan.id)}`'), 'trial CTAs must target onboarding with the database plan tier')
  assert.ok(router.includes("path: '/subscribe'"), 'router must expose the subscribe page')
  assert.ok(subscribe.includes("/api/auth/trial"), 'subscribe page must submit to the trial endpoint')
  assert.ok(subscribe.includes('auth.setUser'), 'successful trial signup must authenticate the new admin')
})

test('subscription requests are persisted and require superadmin verification', () => {
  const migration = read('migrations/007_subscription_requests.mjs')
  const requestTypeMigration = read('migrations/009_subscription_request_type.mjs')
  const routes = read('routes/subscriptions.js')
  const server = read('server.js')
  const db = read('db.js')
  assert.ok(migration.includes("export const id = '007_subscription_requests'"), 'migration must be versioned')
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS subscription_requests'), 'migration must create the request table')
  assert.ok(requestTypeMigration.includes('request_type'), 'request type must be tracked by a migration')
  assert.ok(db.includes('request_type'), 'runtime schema must support request types')
  assert.ok(routes.includes("router.post('/requests'"), 'schools must be able to submit payment requests')
  assert.ok(routes.includes("router.patch('/requests/:id/status'"), 'superadmins must be able to review requests')
  assert.ok(routes.includes("requireRole(req, res, 'superadmin')"), 'request approval must be superadmin-only')
  assert.ok(routes.includes("['activation', 'renewal', 'upgrade']"), 'requests must identify the approval action')
  assert.ok(routes.includes("UPDATE licenses SET"), 'approval must activate or renew the license')
  assert.ok(server.includes("app.use('/api/subscriptions', subscriptionRoutes)"), 'subscription routes must be mounted')
})

test('school deletion removes dependent operational and subscription records', () => {
  const schools = read('routes/schools.js')
  const view = read('src/views/Schools.vue')
  assert.ok(schools.includes("router.delete('/:id'"), 'school deletion endpoint must exist')
  assert.ok(schools.includes('DELETE FROM monthly_entries'), 'monthly child entries must be deleted')
  assert.ok(schools.includes('DELETE FROM attendance_entries'), 'attendance child entries must be deleted')
  assert.ok(schools.includes('DELETE FROM subscription_requests'), 'subscription requests must be deleted')
  assert.ok(schools.includes('DELETE FROM users WHERE school_id = ?'), 'school users must be deleted')
  assert.ok(schools.includes('saveDatabase()'), 'SQLite deletion must be persisted')
  assert.ok(view.includes('all of its users, students, attendance'), 'UI must warn about cascading deletion')
})
