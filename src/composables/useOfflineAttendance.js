import { ref, computed } from 'vue'

const QUEUE_STORAGE_KEY = 'elytrack_offline_attendance_queue'
const ROSTER_CACHE_PREFIX = 'elytrack_roster_cache_'

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const isSyncing = ref(false)
const lastSyncResult = ref(null)

function loadStoredQueue() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistQueue(queue) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
  } catch {}
}

const offlineQueue = ref(loadStoredQueue())

// Initialize online/offline event listeners once
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline.value = true
  })
  window.addEventListener('offline', () => {
    isOnline.value = false
  })
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'offline_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
}

export function useOfflineAttendance() {
  const pendingSyncCount = computed(() => offlineQueue.value.length)

  function cacheRoster(schoolId, grade, section, students) {
    if (typeof localStorage === 'undefined' || !Array.isArray(students)) return
    try {
      const key = `${ROSTER_CACHE_PREFIX}${schoolId || 'default'}_${grade}_${section}`
      localStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        students
      }))
    } catch {}
  }

  function getCachedRoster(schoolId, grade, section) {
    if (typeof localStorage === 'undefined') return null
    try {
      const key = `${ROSTER_CACHE_PREFIX}${schoolId || 'default'}_${grade}_${section}`
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed?.students) ? parsed.students : null
    } catch {
      return null
    }
  }

  function enqueueRollCall(payload) {
    const idempotencyKey = payload.idempotencyKey || generateId()
    const item = {
      id: generateId(),
      idempotencyKey,
      date: payload.date,
      grade: payload.grade,
      section: payload.section,
      adviser: payload.adviser || '',
      entries: payload.entries || [],
      teacher_notes: payload.teacher_notes ?? payload.teacherNotes ?? '',
      schoolId: payload.schoolId || '',
      userId: payload.userId || '',
      userRole: payload.userRole || '',
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      lastError: null
    }

    // If an item for the exact same date, grade, section, school already exists in the queue, replace it with latest
    const existingIndex = offlineQueue.value.findIndex(
      q => q.date === item.date && q.grade === item.grade && q.section === item.section && q.schoolId === item.schoolId
    )

    if (existingIndex >= 0) {
      offlineQueue.value[existingIndex] = item
    } else {
      offlineQueue.value.push(item)
    }

    persistQueue(offlineQueue.value)
    return item
  }

  async function syncQueue(onSynced) {
    if (!isOnline.value || isSyncing.value || offlineQueue.value.length === 0) {
      return { syncedCount: 0, failedCount: 0 }
    }

    isSyncing.value = true
    let syncedCount = 0
    let failedCount = 0
    const remaining = []

    for (const item of [...offlineQueue.value]) {
      try {
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': item.idempotencyKey,
            'x-user-id': item.userId,
            'x-user-role': item.userRole
          },
          body: JSON.stringify({
            date: item.date,
            grade: item.grade,
            section: item.section,
            adviser: item.adviser,
            entries: item.entries,
            teacher_notes: item.teacher_notes,
            schoolId: item.schoolId,
            idempotencyKey: item.idempotencyKey
          })
        })

        if (response.ok) {
          syncedCount++
          if (typeof onSynced === 'function') {
            try { onSynced(item) } catch {}
          }
        } else {
          const errText = await response.text()
          item.retryCount = (item.retryCount || 0) + 1
          item.lastError = `HTTP ${response.status}: ${errText.slice(0, 100)}`
          remaining.push(item)
          failedCount++
        }
      } catch (networkErr) {
        item.retryCount = (item.retryCount || 0) + 1
        item.lastError = networkErr.message
        remaining.push(item)
        failedCount++
      }
    }

    offlineQueue.value = remaining
    persistQueue(offlineQueue.value)
    isSyncing.value = false

    const result = { syncedCount, failedCount, remainingCount: remaining.length }
    lastSyncResult.value = result
    return result
  }

  function clearQueue() {
    offlineQueue.value = []
    persistQueue([])
  }

  return {
    isOnline,
    isSyncing,
    offlineQueue,
    pendingSyncCount,
    lastSyncResult,
    cacheRoster,
    getCachedRoster,
    enqueueRollCall,
    syncQueue,
    clearQueue
  }
}
