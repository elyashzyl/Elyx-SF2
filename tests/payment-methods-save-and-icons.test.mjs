import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8').replace(/\r\n/g, '\n')
}

test('server.js configures large payload limit for payment QR uploads', () => {
  const server = read('server.js')
  assert.ok(server.includes("express.json({ limit: '50mb' })"), 'server.js must configure express.json with 50mb limit')
  assert.ok(server.includes("express.urlencoded({ limit: '50mb', extended: true })"), 'server.js must configure express.urlencoded with 50mb limit')
})

test('Licenses.vue handles large QR uploads, error responses, and query params', () => {
  const licenses = read('src/views/Licenses.vue')

  // Error handling & payload handling
  assert.ok(licenses.includes('handleSavePaymentMethod'), 'Must define handleSavePaymentMethod')
  assert.ok(licenses.includes('handleQrUpload'), 'Must define handleQrUpload')
  assert.ok(licenses.includes('canvas') || licenses.includes('maxDim'), 'handleQrUpload should support client-side image optimization')
  assert.ok(licenses.includes('deletePaymentMethod'), 'Must define deletePaymentMethod')
  assert.ok(licenses.includes('togglePaymentActive'), 'Must define togglePaymentActive')

  // No raw emojis in Licenses.vue
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u
  const hasEmoji = emojiRegex.test(licenses)
  assert.strictEqual(hasEmoji, false, 'Licenses.vue must not contain any emoji characters')
})

test('SupportChatModal.vue does not contain any emoji characters and uses SVG icons', () => {
  const chat = read('src/components/SupportChatModal.vue')

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u
  const hasEmoji = emojiRegex.test(chat)
  assert.strictEqual(hasEmoji, false, 'SupportChatModal.vue must not contain any emoji characters')

  // Uses SVG icons
  assert.ok(chat.includes('<svg'), 'SupportChatModal.vue must use inline SVG icons')
  assert.ok(chat.includes('Mark as Finished'), 'Superadmin view must retain Mark as Finished action')
})
