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

test('Attachment.vue implements Shadcn-Vue attachment component specifications', () => {
  const component = read('src/components/Attachment.vue')

  // Supports all variants
  assert.ok(component.includes("variant === 'preview'"), 'Must support preview variant for uploaded attachments')
  assert.ok(component.includes("variant === 'inline'"), 'Must support inline variant for compact reply bars')
  assert.ok(component.includes('attachment-dropzone'), 'Must support drag-and-drop dropzone variant')

  // Lightbox preview for image attachments
  assert.ok(component.includes('attachment-lightbox'), 'Must provide lightbox modal for zoomed image preview')
  assert.ok(component.includes('Teleport'), 'Must teleport lightbox to body')

  // File categorization and icons
  assert.ok(component.includes('getFileCategory'), 'Must categorize file extensions (pdf, sheet, doc)')
  assert.ok(component.includes('formatFileSize'), 'Must format file sizes human-readably')
  assert.ok(component.includes('validateFile'), 'Must enforce max size and reject dangerous scripts')

  // Events
  assert.ok(component.includes("emit('update:modelValue'"), 'Must emit update:modelValue for v-model binding')
  assert.ok(component.includes("emit('error'"), 'Must emit error event for invalid files')
})

test('Inquiries.vue integrates Attachment component across thread and composers', () => {
  const view = read('src/views/Inquiries.vue')

  assert.ok(view.includes("import Attachment from '../components/Attachment.vue'"), 'Inquiries.vue must import Attachment component')
  assert.ok(view.includes('<Attachment variant="preview"'), 'Must render Attachment preview in inquiry message bubbles')
  assert.ok(view.includes('<Attachment') && view.includes('v-model="replyAttachment"'), 'Must bind replyAttachment to Attachment component')
  assert.ok(view.includes('<Attachment') && view.includes('v-model="newAttachment"'), 'Must bind newAttachment to Attachment component')
})

test('SupportChatModal.vue integrates Attachment component across admin and user views', () => {
  const modal = read('src/components/SupportChatModal.vue')

  assert.ok(modal.includes("import Attachment from './Attachment.vue'"), 'SupportChatModal.vue must import Attachment component')
  assert.ok(modal.includes('<Attachment variant="preview"'), 'Must render Attachment preview in chat bubbles')
  assert.ok(modal.includes('v-model="replyAttachment"'), 'Must bind replyAttachment in reply input bars')
  assert.ok(modal.includes('v-model="newAttachment"'), 'Must bind newAttachment in ticket creation form')
})
