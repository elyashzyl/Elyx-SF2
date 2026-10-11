import { ref, computed } from 'vue'

const STORAGE_KEY = 'elytrack_sidebar_state'

function getInitialCollapsed() {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'collapsed'
  } catch {
    return false
  }
}

function checkIsMobile() {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 820
}

const isCollapsed = ref(getInitialCollapsed())
const isMobile = ref(checkIsMobile())
const openMobile = ref(false)

if (typeof window !== 'undefined') {
  let resizeTimer = null
  window.addEventListener('resize', () => {
    if (resizeTimer) cancelAnimationFrame(resizeTimer)
    resizeTimer = requestAnimationFrame(() => {
      isMobile.value = checkIsMobile()
      if (!isMobile.value) {
        openMobile.value = false
      }
    })
  }, { passive: true })

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return
      }
      e.preventDefault()
      toggleSidebar()
    } else if (e.key === 'Escape' && openMobile.value) {
      openMobile.value = false
    }
  })
}

function persistState() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, isCollapsed.value ? 'collapsed' : 'expanded')
  } catch {}
}

function toggleSidebar() {
  if (isMobile.value) {
    openMobile.value = !openMobile.value
  } else {
    isCollapsed.value = !isCollapsed.value
    persistState()
  }
}

function setCollapsed(val) {
  isCollapsed.value = Boolean(val)
  persistState()
}

function setOpenMobile(val) {
  openMobile.value = Boolean(val)
}

function closeSidebar() {
  openMobile.value = false
}

export function useSidebar() {
  return {
    state: computed(() => (isCollapsed.value ? 'collapsed' : 'expanded')),
    isCollapsed,
    isMobile,
    openMobile,
    toggleSidebar,
    setCollapsed,
    setOpenMobile,
    closeSidebar
  }
}
