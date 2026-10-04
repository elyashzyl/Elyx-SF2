import { ref, computed } from 'vue'
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

  async function syncAnnouncements(actorHeaders = {}) {
    try {
      const res = await fetch('/api/announcements', { headers: actorHeaders })
      if (!res.ok) return
      const items = await res.json()
      if (Array.isArray(items)) {
        for (const a of items) {
          const existing = notifications.value.find(n => n.announcementId === a.id)
          if (existing) {
            existing.read = a.is_read
          } else {
            notifications.value.unshift({
              id: nextId++,
              announcementId: a.id,
              type: a.priority === 'urgent' ? 'error' : a.priority === 'important' ? 'warning' : 'info',
              message: `${a.title}: ${a.content}`,
              title: a.title,
              content: a.content,
              ts: new Date(a.created_at).getTime(),
              read: a.is_read,
              priority: a.priority,
              author: a.author_name
            })
          }
        }
        persist()
      }
    } catch {}
  }

  async function markRead(id, actorHeaders = {}) {
    const n = notifications.value.find(n => n.id === id)
    if (n && !n.read) {
      n.read = true
      persist()
      if (n.announcementId) {
        try {
          await fetch(`/api/announcements/${n.announcementId}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...actorHeaders }
          })
        } catch {}
      }
    }
  }

  async function markAllRead(actorHeaders = {}) {
    let changed = false
    for (const n of notifications.value) {
      if (!n.read) {
        n.read = true
        changed = true
      }
    }
    if (changed) persist()
    try {
      await fetch('/api/announcements/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...actorHeaders }
      })
    } catch {}
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

  return {
    notifications,
    unreadCount,
    notify,
    syncAnnouncements,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    formatTimeAgo,
  }
}
