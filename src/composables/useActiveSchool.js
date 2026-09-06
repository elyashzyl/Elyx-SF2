import { ref, computed } from 'vue'

const STORAGE_KEY = 'app_active_school'
// Sentinel persisted when superadmin explicitly picks "None", so the
// choice survives reloads (distinct from "never picked a school").
const NONE_SELECTED = { __none: true }

// Currently "switched" school. Persisted so the selected context survives reloads.
const activeSchool = ref(null)
// True when the user explicitly chose "None" (no school context).
const noneSelected = ref(false)

try {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed && parsed.__none === true) {
      noneSelected.value = true
      activeSchool.value = null
    } else {
      activeSchool.value = parsed
    }
  }
} catch (_) {
  /* ignore corrupt storage */
}

function persist() {
  try {
    if (activeSchool.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSchool.value))
    } else if (noneSelected.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(NONE_SELECTED))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (_) {
    /* storage full / unavailable */
  }
}

export function useActiveSchool() {
  const hasActive = computed(() => !!activeSchool.value)

  const displayName = computed(() => {
    const s = activeSchool.value
    if (!s) return null
    return s.name || s.school_name || s.short || s.school_short || 'School'
  })

  const displayShort = computed(() => {
    const s = activeSchool.value
    if (!s) return null
    return s.short || s.school_short || ''
  })

  const displayAvatar = computed(() => {
    const s = activeSchool.value
    if (!s) return ''
    const label = s.short || s.school_short || s.name || s.school_name || 'S'
    return label.charAt(0).toUpperCase()
  })

  function setActiveSchool(school) {
    activeSchool.value = school || null
    noneSelected.value = !school
    persist()
  }

  function clearActiveSchool() {
    setActiveSchool(null)
  }

  return {
    activeSchool,
    noneSelected,
    hasActive,
    displayName,
    displayShort,
    displayAvatar,
    setActiveSchool,
    clearActiveSchool,
  }
}
