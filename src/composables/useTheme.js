import { ref, watch } from 'vue'

const STORAGE_KEY = 'theme'
const VALID = ['light', 'dark']
const theme = ref(typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) || 'light') : 'light')

function apply(value) {
  if (typeof document === 'undefined') return
  if (document.documentElement) {
    document.documentElement.setAttribute('data-theme', value)
    document.documentElement.style.colorScheme = value
  }
  if (document.body) {
    document.body.setAttribute('data-theme', value)
  }
  const root = document.getElementById('app')
  if (root) {
    root.setAttribute('data-theme', value)
  }
}

apply(theme.value)

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => apply(theme.value), { once: true })
}

watch(theme, (value) => {
  if (!VALID.includes(value)) return
  apply(value)
  try { localStorage.setItem(STORAGE_KEY, value) } catch (_) { /* ignore */ }
}, { immediate: true })

function setTheme(value) {
  if (!VALID.includes(value)) return
  theme.value = value
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

export function useTheme() {
  return { theme, setTheme, toggleTheme }
}
