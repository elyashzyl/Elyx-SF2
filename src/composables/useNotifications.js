import { ref, computed, onMounted } from 'vue'
import { useToast } from './useToast'

const notifications = ref([])
const STORAGE_KEY = 'app_notifications'
const MAX_NOTIFICATIONS = 100
let nextId = 0

try {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      notifications.value = parsed
      nextId = parsed.reduce((m, n) => Math.max(m, n.id + 1), 0)
    }
  }
} catch (_) {
  /* ignore corrupt storage */
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.value))
  } catch (_) {
    /* storage full / unavailable */
  }
}

export function formatTimeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const sec = Math.max(0, Math.floor(diff / 1000))
  if (sec < 5) return 'Just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d > 1 ? 's' : ''} ago`
}

export function useNotifications() {
  const { addToast } = useToast()

  function notify(message, type = 'info', { toast = true } = {}) {
    const id = nextId++
    notifications.value.unshift({ id, type, message, ts: Date.now(), read: false })
    if (notifications.value.length > MAX_NOTIFICATIONS) {
      notifications.value.splice(MAX_NOTIFICATIONS)
    }
    if (toast) addToast(message, type, type === 'error' ? 5000 : 4000)
    persist()
    return id
  }

  function markRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n && !n.read) {
      n.read = true
      persist()
    }
  }

  function markAllRead() {
    let changed = false
    for (const n of notifications.value) {
      if (!n.read) {
        n.read = true
        changed = true
      }
    }
    if (changed) persist()
  }

  function dismiss(id) {
    const prev = notifications.value.length
    notifications.value = notifications.value.filter(n => n.id !== id)
    if (notifications.value.length !== prev) persist()
  }

  function clearAll() {
    if (!notifications.value.length) return
    notifications.value = []
    persist()
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  onMounted(() => {
    /* hydration point for future live updates */
  })

  return {
    notifications,
    unreadCount,
    notify,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    formatTimeAgo,
  }
}
