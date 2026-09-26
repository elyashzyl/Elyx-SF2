import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8').replace(/\r\n/g, '\n')
}

// ---------------------------------------------------------------------------
// 1. Database Schema & Migration: payment_methods
// ---------------------------------------------------------------------------

test('db.js defines payment_methods table in MySQL and SQLite DDL and seeds defaults', () => {
  const db = read('db.js')

  // MySQL DDL
  assert.ok(db.includes('CREATE TABLE IF NOT EXISTS payment_methods ('), 'db.js MySQL DDL must create payment_methods table')
  assert.ok(db.includes('type VARCHAR(32) NOT NULL DEFAULT (\'bank_transfer\')'), 'MySQL DDL must define type with default')
  assert.ok(db.includes('qr_image_url LONGTEXT'), 'MySQL DDL must support LONGTEXT for base64 QR codes')

  // SQLite DDL
  assert.ok(db.includes('qr_image_url TEXT DEFAULT \'\''), 'SQLite DDL must define qr_image_url')
  assert.ok(db.includes('is_active INTEGER DEFAULT 1'), 'SQLite DDL must define is_active flag')

  // Seeder
  assert.ok(db.includes('export async function seedDefaultPaymentMethods()'), 'db.js must export seedDefaultPaymentMethods function')
  assert.ok(db.includes('SELECT COUNT(*) as cnt FROM payment_methods'), 'Seeder must only insert if table is empty')
})

test('Migration 006_payment_methods.mjs non-destructively creates payment_methods table', () => {
  const migration = read('migrations/006_payment_methods.mjs')

  assert.ok(migration.includes("export const id = '006_payment_methods'"), 'Migration must define 006_payment_methods id')
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS payment_methods'), 'Migration must use CREATE TABLE IF NOT EXISTS')
  assert.ok(migration.includes('isMysql'), 'Migration must support both MySQL and SQLite')
  assert.ok(migration.includes('LONGTEXT'), 'Migration must support LONGTEXT on MySQL for base64 QR codes')
})

test('prisma/schema.prisma defines PaymentMethod model', () => {
  const schema = read('prisma/schema.prisma')

  assert.ok(schema.includes('model PaymentMethod {'), 'Prisma schema must define PaymentMethod model')
  assert.ok(schema.includes('@@map("payment_methods")'), 'PaymentMethod must map to payment_methods table')
  assert.ok(schema.includes('qrImageUrl'), 'PaymentMethod must include qrImageUrl field')
})

// ---------------------------------------------------------------------------
// 2. Backend Routes: routes/payment_methods.js
// ---------------------------------------------------------------------------

test('routes/payment_methods.js enforces role guards and provides full CRUD', () => {
  const routes = read('routes/payment_methods.js')

  // Public/authenticated listing
  assert.ok(routes.includes("router.get('/',"), 'Must define GET / endpoint')
  assert.ok(routes.includes("me.role !== 'superadmin'"), 'Must filter by is_active = 1 for non-superadmins')

  // Superadmin mutations with requireRole guard
  assert.ok(routes.includes("router.post('/',"), 'Must define POST / endpoint')
  assert.ok(routes.includes("requireRole(req, res, 'superadmin')"), 'Must guard mutations with requireRole superadmin')
  assert.ok(routes.includes("router.put('/:id',"), 'Must define PUT /:id endpoint')
  assert.ok(routes.includes("router.patch('/:id/toggle',"), 'Must define PATCH /:id/toggle endpoint')
  assert.ok(routes.includes("router.delete('/:id',"), 'Must define DELETE /:id endpoint')

  // Audit logging
  assert.ok(routes.includes("audit(me, 'payment_method.create'"), 'Must audit payment method creation')
  assert.ok(routes.includes("audit(me, 'payment_method.update'"), 'Must audit payment method update')
  assert.ok(routes.includes("audit(me, 'payment_method.toggle'"), 'Must audit payment method toggle')
  assert.ok(routes.includes("audit(me, 'payment_method.delete'"), 'Must audit payment method deletion')
})

test('server.js mounts /api/payment-methods router', () => {
  const server = read('server.js')

  assert.ok(server.includes("import paymentMethodRoutes from './routes/payment_methods.js'"), 'server.js must import paymentMethodRoutes')
  assert.ok(server.includes("app.use('/api/payment-methods', paymentMethodRoutes)"), 'server.js must mount /api/payment-methods')
})

// ---------------------------------------------------------------------------
// 3. Frontend: Licenses.vue Integration
// ---------------------------------------------------------------------------

test('Licenses.vue displays official payment options and QR codes with superadmin management', () => {
  const licenses = read('src/views/Licenses.vue')

  assert.ok(licenses.includes('Official School Payment Options &amp; QR Codes') || licenses.includes('Official School Payment Options'), 'Must have Payment Options card')
  assert.ok(licenses.includes('paymentMethods'), 'Must define paymentMethods reactive state')
  assert.ok(licenses.includes('loadPaymentMethods'), 'Must load payment methods from API')
  assert.ok(licenses.includes('/api/payment-methods'), 'Must fetch from /api/payment-methods')
  assert.ok(licenses.includes('copyAccountNumber'), 'Must provide copy account number action')
  assert.ok(licenses.includes('openQrPreview'), 'Must support QR preview modal')
  assert.ok(licenses.includes('handleQrUpload'), 'Must support QR code image upload')
})

// ---------------------------------------------------------------------------
// 4. Frontend: SupportChatModal.vue Integration
// ---------------------------------------------------------------------------

test('SupportChatModal.vue integrates payment channels and reference pre-fill', () => {
  const chat = read('src/components/SupportChatModal.vue')

  // Payment view & state
  assert.ok(chat.includes("userView === 'payments'"), 'Support chat must support userView payments')
  assert.ok(chat.includes('paymentMethods'), 'Must have paymentMethods reactive state')
  assert.ok(chat.includes('fetchPaymentMethods'), 'Must fetch payment methods from API')
  assert.ok(chat.includes('/api/payment-methods'), 'Must query /api/payment-methods')

  // Entry buttons
  assert.ok(chat.includes('openPaymentMethodsView'), 'Must provide openPaymentMethodsView handler')
  assert.ok(chat.includes('btn-view-payments') || chat.includes('openPaymentMethodsView'), 'Must have UI button to view payment options')

  // Reference insertion & template
  assert.ok(chat.includes('useInReference'), 'Must define useInReference function')
  assert.ok(chat.includes('Payment sent for'), 'Must pre-fill "Payment sent for [School/Plan]. Amount: ₱____. Reference Number: ____"')
  assert.ok(chat.includes('Amount: ₱____. Reference Number: ____'), 'Must include exact reference format')
  assert.ok(chat.includes('copyPaymentAccount'), 'Must provide copy payment account function')

  // QR preview in chat
  assert.ok(chat.includes('showChatQrModal'), 'Must support enlarged QR code preview in chat')
  assert.ok(chat.includes('chat-qr-overlay'), 'Must include chat QR overlay')
})
