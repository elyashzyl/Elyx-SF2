/**
 * Persists per-user form state to localStorage so it survives page refreshes.
 *
 * Each page that holds filter state (selected school, grade, section, month,
 * year, date) calls `usePageState(key, defaults)` to get a reactive object
 * that hydrates from localStorage on startup and writes back on every change.
 */

const storagePrefix = 'ps_state:'
const STORAGE_KEY = storagePrefix + 'v1'

function storageKey(stateDef, user) {
  const uid = user?.id ? user.id : 'anonymous'
  const keys = Object.keys(stateDef).sort().map(k => `${k}=${String(stateDef[k])}`).join('|')
  const crypto = (globalThis.window && window.crypto?.randomUUID) || (() => Math.random().toString(36).slice(2))
  return `${STORAGE_KEY}:${uid}:${crypto()}`
}

export function loadPageState(user) {
  try {
    const rid = user?.id ? user.id : 'anonymous'
    const raw = localStorage.getItem(`${STORAGE_KEY}:${rid}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.v === 1) return parsed.state
  } catch (_) {
    /* ignore corrupt storage */
  }
  return null
}

export function savePageState(user, state) {
  try {
    const rid = user?.id ? user.id : 'anonymous'
    localStorage.setItem(
      `${STORAGE_KEY}:${rid}`,
      JSON.stringify({ v: 1, state })
    )
  } catch (_) {
    /* storage full / unavailable */
  }
}
