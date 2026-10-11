<template>
  <!-- Variant 1: Preview Mode (for displaying existing uploaded message attachments) -->
  <div v-if="variant === 'preview'" class="attachment-preview-container">
    <!-- Image preview with thumbnail and click-to-zoom -->
    <div
      v-if="isImage(previewData.type, previewData.name)"
      class="attachment-image-card"
      @click="openLightbox"
      role="button"
      tabindex="0"
      @keydown.enter="openLightbox"
      :title="`Click to preview ${previewData.name || 'image'}`"
    >
      <div class="attachment-image-thumb-wrap">
        <img
          :src="previewData.url"
          :alt="previewData.name || 'Attachment preview'"
          class="attachment-image-thumb"
          loading="lazy"
        />
        <div class="attachment-image-overlay">
          <span class="attachment-zoom-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </span>
          <span class="attachment-overlay-text">Preview</span>
        </div>
      </div>
      <div class="attachment-image-meta" v-if="previewData.name">
        <span class="attachment-file-name" :title="previewData.name">{{ previewData.name }}</span>
        <span class="attachment-file-size" v-if="previewData.size">{{ formatFileSize(previewData.size) }}</span>
      </div>
    </div>

    <!-- Document / Non-Image File Card -->
    <a
      v-else
      :href="previewData.url"
      :download="previewData.name || 'attachment'"
      target="_blank"
      rel="noopener noreferrer"
      class="attachment-file-card"
      :title="`Download ${previewData.name || 'attachment'}`"
    >
      <div class="attachment-icon-badge" :class="getFileCategory(previewData.name, previewData.type)">
        <svg v-if="getFileCategory(previewData.name, previewData.type) === 'pdf'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <svg v-else-if="getFileCategory(previewData.name, previewData.type) === 'sheet'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="16" y2="17"/>
          <line x1="12" y1="9" x2="12" y2="21"/>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>

      <div class="attachment-file-info">
        <span class="attachment-file-name" :title="previewData.name">{{ previewData.name || 'Download file' }}</span>
        <span class="attachment-file-sub">
          <span class="attachment-type-badge">{{ getFileExtension(previewData.name) || 'FILE' }}</span>
          <span v-if="previewData.size" class="attachment-file-size">{{ formatFileSize(previewData.size) }}</span>
        </span>
      </div>

      <div class="attachment-download-action" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
    </a>

    <!-- Lightbox Zoom Modal for Images -->
    <Teleport to="body">
      <div v-if="showLightbox" class="attachment-lightbox" @click.self="showLightbox = false" role="dialog" aria-modal="true" :aria-label="previewData.name || 'Image preview'">
        <div class="attachment-lightbox-panel">
          <div class="attachment-lightbox-header">
            <span class="attachment-lightbox-title">{{ previewData.name || 'Image attachment' }}</span>
            <div class="attachment-lightbox-actions">
              <a
                v-if="previewData.url"
                :href="previewData.url"
                :download="previewData.name || 'download'"
                class="attachment-lightbox-btn"
                title="Download original file"
                target="_blank"
                rel="noopener"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
              <button type="button" class="attachment-lightbox-btn close-btn" @click="showLightbox = false" aria-label="Close image preview">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="attachment-lightbox-body">
            <img :src="previewData.url" :alt="previewData.name || 'Full preview'" class="attachment-lightbox-img" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <!-- Variant 2: Compact / Inline Mode (for chat reply bars and inline toolbars) -->
  <div v-else-if="variant === 'inline' || variant === 'compact'" class="attachment-inline-container">
    <!-- Active File Chip with Remove Button -->
    <div v-if="modelValue" class="attachment-inline-chip">
      <span class="attachment-chip-icon" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </span>
      <span class="attachment-chip-name" :title="modelValue.name">{{ modelValue.name }}</span>
      <span v-if="modelValue.size" class="attachment-chip-size">({{ formatFileSize(modelValue.size) }})</span>
      <button
        type="button"
        class="attachment-chip-remove"
        @click="clearAttachment"
        :aria-label="`Remove ${modelValue.name}`"
        title="Remove attachment"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Inline Attach Button -->
    <div v-else class="attachment-inline-trigger-wrap">
      <input
        ref="fileInputRef"
        type="file"
        class="attachment-hidden-input"
        :accept="accept"
        :disabled="disabled"
        @change="handleFileInput"
      />
      <button
        type="button"
        class="attachment-inline-btn"
        :disabled="disabled"
        @click="triggerFileSelect"
        :title="buttonTitle || 'Attach document, screenshot, or receipt (max 5MB)'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
        <span>{{ buttonLabel || 'Attach' }}</span>
      </button>
    </div>
  </div>

  <!-- Variant 3: Dropzone Mode (default for modal forms, ticket creation, etc.) -->
  <div v-else class="attachment-dropzone-container">
    <!-- Selected Attachment Card -->
    <div v-if="modelValue" class="attachment-selected-card">
      <div class="attachment-selected-preview">
        <img
          v-if="isImage(modelValue.type, modelValue.name)"
          :src="modelValue.url"
          :alt="modelValue.name"
          class="attachment-selected-thumb"
        />
        <div v-else class="attachment-selected-icon-badge" :class="getFileCategory(modelValue.name, modelValue.type)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
      </div>

      <div class="attachment-selected-details">
        <div class="attachment-selected-name" :title="modelValue.name">{{ modelValue.name }}</div>
        <div class="attachment-selected-meta">
          <span class="attachment-pill-badge">{{ getFileExtension(modelValue.name) || 'FILE' }}</span>
          <span class="attachment-selected-size">{{ formatFileSize(modelValue.size) }}</span>
          <span class="attachment-selected-status">Ready to send</span>
        </div>
      </div>

      <button
        type="button"
        class="attachment-remove-btn"
        @click="clearAttachment"
        :aria-label="`Remove ${modelValue.name}`"
        title="Remove attachment"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Drag & Drop Zone -->
    <div
      v-else
      class="attachment-dropzone"
      :class="{ 'is-dragging': isDragging, 'is-disabled': disabled }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="triggerFileSelect"
      role="button"
      tabindex="0"
      @keydown.enter.prevent="triggerFileSelect"
      @keydown.space.prevent="triggerFileSelect"
      :aria-label="label || 'Upload file attachment'"
    >
      <input
        ref="fileInputRef"
        type="file"
        class="attachment-hidden-input"
        :accept="accept"
        :disabled="disabled"
        @change="handleFileInput"
      />

      <div class="attachment-dropzone-inner">
        <div class="attachment-dropzone-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>

        <div class="attachment-dropzone-content">
          <div class="attachment-dropzone-title">
            <strong>Click to upload</strong> or drag and drop
          </div>
          <div class="attachment-dropzone-hint">
            Screenshots, PDF, Word, Excel, CSV or text (max {{ Math.round(maxSize / (1024 * 1024)) }}MB)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  variant: {
    type: String,
    default: 'dropzone', // 'dropzone' | 'inline' | 'compact' | 'preview'
    validator: v => ['dropzone', 'inline', 'compact', 'preview'].includes(v)
  },
  attachment: {
    type: Object,
    default: null
  },
  accept: {
    type: String,
    default: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5 MB
  },
  buttonLabel: {
    type: String,
    default: ''
  },
  buttonTitle: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'error'])

const fileInputRef = ref(null)
const isDragging = ref(false)
const showLightbox = ref(false)

const previewData = computed(() => {
  if (props.attachment) {
    return {
      url: props.attachment.attachment_url || props.attachment.url || '',
      name: props.attachment.attachment_name || props.attachment.name || '',
      type: props.attachment.attachment_type || props.attachment.type || '',
      size: props.attachment.attachment_size || props.attachment.size || 0
    }
  }
  return {
    url: props.modelValue?.url || '',
    name: props.modelValue?.name || '',
    type: props.modelValue?.type || '',
    size: props.modelValue?.size || 0
  }
})

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(filename = '') {
  const parts = String(filename).split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

function isImage(type = '', name = '') {
  if (type && String(type).toLowerCase().startsWith('image/')) return true
  const ext = String(name).toLowerCase()
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(ext)
}

function getFileCategory(name = '', type = '') {
  const ext = String(name).toLowerCase()
  const mime = String(type).toLowerCase()
  if (ext.endsWith('.pdf') || mime.includes('pdf')) return 'pdf'
  if (/\.(xlsx?|csv)$/i.test(ext) || mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return 'sheet'
  if (/\.(docx?|txt|rtf)$/i.test(ext) || mime.includes('word') || mime.includes('document')) return 'doc'
  if (isImage(type, name)) return 'image'
  return 'generic'
}

function openLightbox() {
  if (previewData.value.url) {
    showLightbox.value = true
  }
}

function triggerFileSelect() {
  if (props.disabled) return
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function clearAttachment() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emit('update:modelValue', null)
  emit('change', null)
}

function validateFile(file) {
  if (!file) return { valid: false, error: 'No file provided' }
  if (file.size > props.maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum limit of ${formatFileSize(props.maxSize)}`
    }
  }

  const disallowed = /\.(exe|bat|cmd|sh|php|js|mjs|py|vbs|msi)$/i
  if (disallowed.test(file.name)) {
    return {
      valid: false,
      error: 'Executable or script files are not allowed for security reasons'
    }
  }

  return { valid: true }
}

function processFile(file) {
  if (!file) return
  const check = validateFile(file)
  if (!check.valid) {
    emit('error', check.error)
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const payload = {
      url: reader.result,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size
    }
    emit('update:modelValue', payload)
    emit('change', payload)
  }
  reader.readAsDataURL(file)
}

function handleFileInput(e) {
  const file = e.target.files?.[0]
  if (file) {
    processFile(file)
  }
}

function onDragOver(e) {
  if (props.disabled) return
  isDragging.value = true
}

function onDragLeave(e) {
  isDragging.value = false
}

function onDrop(e) {
  if (props.disabled) return
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}
</script>

<style scoped>
/* ==========================================================================
   Shadcn-Vue Modern Attachment Component
   ========================================================================== */

/* 1. Preview Variant */
.attachment-preview-container {
  display: block;
  margin-top: 8px;
  max-width: 100%;
}

.attachment-image-card {
  position: relative;
  display: inline-block;
  cursor: pointer;
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--card);
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  box-shadow: var(--shadow-xs);
  outline: none;
}

.attachment-image-card:hover,
.attachment-image-card:focus-visible {
  transform: translateY(-1px);
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.attachment-image-thumb-wrap {
  position: relative;
  overflow: hidden;
  max-width: 280px;
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--muted);
}

.attachment-image-thumb {
  display: block;
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
  transition: transform .25s ease;
}

.attachment-image-card:hover .attachment-image-thumb {
  transform: scale(1.03);
}

.attachment-image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(12, 83, 87, .65);
  backdrop-filter: blur(2px);
  color: #ffffff;
  opacity: 0;
  transition: opacity .18s ease;
  font-size: .76rem;
  font-weight: 700;
}

.attachment-image-card:hover .attachment-image-overlay,
.attachment-image-card:focus-visible .attachment-image-overlay {
  opacity: 1;
}

.attachment-image-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: var(--card);
  border-top: 1px solid var(--border);
  font-size: .68rem;
}

/* File / Document Card */
.attachment-file-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  text-decoration: none;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
  box-shadow: var(--shadow-xs);
  max-width: 380px;
}

.attachment-file-card:hover,
.attachment-file-card:focus-visible {
  border-color: var(--primary);
  background: var(--secondary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  outline: none;
}

.attachment-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--muted);
  color: var(--primary);
  border: 1px solid var(--border);
}

.attachment-icon-badge.pdf {
  background: rgba(217, 67, 59, .08);
  color: #d9433b;
  border-color: rgba(217, 67, 59, .2);
}

.attachment-icon-badge.sheet {
  background: rgba(21, 128, 61, .08);
  color: #15803d;
  border-color: rgba(21, 128, 61, .2);
}

.attachment-icon-badge.doc {
  background: rgba(3, 105, 161, .08);
  color: #0369a1;
  border-color: rgba(3, 105, 161, .2);
}

.attachment-file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.attachment-file-name {
  font-size: .78rem;
  font-weight: 700;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-file-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .64rem;
  color: var(--muted-foreground);
}

.attachment-type-badge {
  font-size: .58rem;
  font-weight: 800;
  letter-spacing: .05em;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--muted);
  border: 1px solid var(--border);
  color: var(--foreground);
}

.attachment-download-action {
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color .15s ease, transform .15s ease;
}

.attachment-file-card:hover .attachment-download-action {
  color: var(--primary);
  transform: translateY(1px);
}

/* Lightbox Modal */
.attachment-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .75);
  backdrop-filter: blur(6px);
  padding: 20px;
}

.attachment-lightbox-panel {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 14px);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.attachment-lightbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--card);
}

.attachment-lightbox-title {
  font-size: .84rem;
  font-weight: 700;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60vw;
}

.attachment-lightbox-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attachment-lightbox-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--secondary);
  color: var(--foreground);
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease;
}

.attachment-lightbox-btn:hover {
  background: var(--card);
  border-color: var(--primary);
  color: var(--primary);
}

.attachment-lightbox-body {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  max-height: calc(90vh - 60px);
}

.attachment-lightbox-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 6px;
}

/* 2. Inline / Compact Variant */
.attachment-inline-container {
  display: inline-flex;
  align-items: center;
}

.attachment-hidden-input {
  display: none !important;
}

.attachment-inline-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted-foreground);
  font-size: .72rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease, transform .15s ease;
}

.attachment-inline-btn:hover:not(:disabled) {
  border-color: var(--primary);
  background: var(--secondary);
  color: var(--primary);
  transform: translateY(-1px);
}

.attachment-inline-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px 4px 8px;
  border-radius: 8px;
  background: var(--secondary);
  border: 1px solid color-mix(in srgb, var(--primary) 30%, var(--border));
  color: var(--foreground);
  font-size: .72rem;
  font-weight: 600;
  max-width: 320px;
}

.attachment-chip-icon {
  color: var(--primary);
  display: flex;
  align-items: center;
}

.attachment-chip-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}

.attachment-chip-size {
  color: var(--muted-foreground);
  font-size: .64rem;
  font-weight: 500;
}

.attachment-chip-remove {
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 4px;
  transition: color .15s ease, background .15s ease;
}

.attachment-chip-remove:hover {
  color: var(--destructive);
  background: rgba(217, 67, 59, .1);
}

/* 3. Dropzone Variant */
.attachment-dropzone-container {
  width: 100%;
}

.attachment-dropzone {
  width: 100%;
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg, 14px);
  background: var(--card);
  padding: 24px 20px;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, transform .15s ease;
  outline: none;
}

.attachment-dropzone:hover:not(.is-disabled),
.attachment-dropzone:focus-visible:not(.is-disabled) {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--secondary) 40%, var(--card));
  transform: translateY(-1px);
}

.attachment-dropzone.is-dragging {
  border-color: var(--primary);
  border-style: solid;
  background: color-mix(in srgb, var(--primary) 8%, var(--card));
  box-shadow: 0 0 0 4px var(--primary-glow);
}

.attachment-dropzone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
}

.attachment-dropzone-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--secondary);
  color: var(--primary);
  border: 1px solid var(--border);
  transition: transform .2s ease;
}

.attachment-dropzone:hover .attachment-dropzone-icon {
  transform: translateY(-2px);
}

.attachment-dropzone-title {
  font-size: .84rem;
  color: var(--foreground);
}

.attachment-dropzone-title strong {
  color: var(--primary);
  font-weight: 700;
}

.attachment-dropzone-hint {
  font-size: .72rem;
  color: var(--muted-foreground);
  margin-top: 2px;
}

/* Selected Card in Dropzone Mode */
.attachment-selected-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: var(--radius-lg, 14px);
  border: 1px solid color-mix(in srgb, var(--primary) 35%, var(--border));
  background: var(--card);
  box-shadow: var(--shadow-sm);
}

.attachment-selected-preview {
  flex-shrink: 0;
}

.attachment-selected-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--border);
}

.attachment-selected-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--secondary);
  color: var(--primary);
  border: 1px solid var(--border);
}

.attachment-selected-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attachment-selected-name {
  font-size: .82rem;
  font-weight: 700;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-selected-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .7rem;
  color: var(--muted-foreground);
}

.attachment-pill-badge {
  font-size: .6rem;
  font-weight: 800;
  letter-spacing: .05em;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--secondary);
  color: var(--primary);
  border: 1px solid var(--border);
}

.attachment-selected-status {
  color: var(--success);
  font-weight: 600;
}

.attachment-remove-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted-foreground);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
  flex-shrink: 0;
}

.attachment-remove-btn:hover {
  border-color: var(--destructive);
  background: rgba(217, 67, 59, .08);
  color: var(--destructive);
}
</style>
