import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8').replace(/\r\n/g, '\n')
}

// ---------------------------------------------------------------------------
// Database Schema & Migrations
// ---------------------------------------------------------------------------

test('db.js includes inquiries and inquiry_messages tables in MySQL and SQLite DDL', () => {
  const db = read('db.js')

  // MySQL DDL contains inquiries
  assert.ok(db.includes('CREATE TABLE IF NOT EXISTS inquiries ('), 'MySQL DDL must define inquiries table')
  assert.ok(db.includes('CREATE TABLE IF NOT EXISTS inquiry_messages ('), 'MySQL DDL must define inquiry_messages table')

  // SQLite DDL contains inquiries
  assert.ok(db.includes("status TEXT DEFAULT 'open'"), 'SQLite DDL must define inquiries with open default status')
  assert.ok(db.includes('user_notified INTEGER DEFAULT 0'), 'SQLite DDL must track user_notified flag for notifications')
  assert.ok(db.includes('inquiry_id TEXT NOT NULL'), 'SQLite DDL must link messages to inquiry_id')
})

test('Migration 005_inquiries_chat.mjs exists and creates inquiry tables', () => {
  const migration = read('migrations/005_inquiries_chat.mjs')

  assert.ok(migration.includes("export const id = '005_inquiries_chat'"), 'Migration must define 005_inquiries_chat id')
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS inquiries'), 'Migration must create inquiries table')
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS inquiry_messages'), 'Migration must create inquiry_messages table')
})

// ---------------------------------------------------------------------------
// API Routes: routes/inquiries.js
// ---------------------------------------------------------------------------

test('routes/inquiries.js provides full inquiry lifecycle and superadmin finish capability', () => {
  const routes = read('routes/inquiries.js')

  // Listing inquiries with role-based scoping
  assert.ok(routes.includes("router.get('/',"), 'GET / must list inquiries')
  assert.ok(routes.includes("me.role !== 'superadmin'"), 'GET / must scope inquiries for non-superadmins')

  // Creating inquiries
  assert.ok(routes.includes("router.post('/',"), 'POST / must create new inquiry')
  assert.ok(routes.includes('INSERT INTO inquiries'), 'POST / must insert into inquiries table')
  assert.ok(routes.includes('INSERT INTO inquiry_messages'), 'POST / must record first chat message')

  // Status updating / marking finished
  assert.ok(routes.includes("router.patch('/:id/status',"), 'PATCH /:id/status must handle status changes')
  assert.ok(routes.includes("['open', 'finished'].includes(status)"), 'Must allow status values open and finished')
  assert.ok(routes.includes("me.role !== 'superadmin'"), 'Must guard finish resolution so only superadmin (or owner) can resolve')
  assert.ok(routes.includes('user_notified = ?'), 'Status update must reset user_notified flag for the submitter')

  // Unread notifications endpoint
  assert.ok(routes.includes("router.get('/notifications/unread'"), 'GET /notifications/unread must check for resolved inquiries')
  assert.ok(routes.includes("user_notified = 0 AND status = \"finished\""), 'Must filter for newly finished inquiries not yet notified')

  // Notification dismissal
  assert.ok(routes.includes("router.post('/:id/dismiss-notification'"), 'Must provide dismiss-notification endpoint')
})

test('server.js mounts /api/inquiries endpoint', () => {
  const server = read('server.js')
  assert.ok(server.includes("import inquiryRoutes from './routes/inquiries.js'"), 'server.js must import inquiryRoutes')
  assert.ok(server.includes("app.use('/api/inquiries', inquiryRoutes)"), 'server.js must mount inquiryRoutes at /api/inquiries')
})

// ---------------------------------------------------------------------------
// Frontend UI & Notification Integration
// ---------------------------------------------------------------------------

test('SupportChatModal.vue implements floating button, chat modal, and notification sync', () => {
  const component = read('src/components/SupportChatModal.vue')

  assert.ok(component.includes('floating-chat-btn'), 'Must render right-side floating chat button')
  assert.ok(component.includes('chat-modal-window'), 'Must render pop-up modal window')
  assert.ok(component.includes('auth.isSuperadmin'), 'Must branch UI for superadmin vs users')
  assert.ok(component.includes('Mark as Finished'), 'Superadmin view must have Mark as Finished button')
  assert.ok(component.includes('checkUnreadNotifications'), 'Must poll/check unread finished notifications')
  assert.ok(component.includes('ely.ashzyl@gmail.com'), 'Must reference ely.ashzyl@gmail.com for payments & inquiries')
})

test('App.vue imports and renders SupportChatModal', () => {
  const app = read('src/App.vue')
  assert.ok(app.includes("import SupportChatModal from './components/SupportChatModal.vue'"), 'App.vue must import SupportChatModal')
  assert.ok(app.includes('<SupportChatModal'), 'App.vue must mount <SupportChatModal />')
})
