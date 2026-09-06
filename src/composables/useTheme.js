import { ref, watch } from 'vue'

const STORAGE_KEY = 'theme'
const VALID = ['light', 'dark']
const theme = ref(typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) || 'light') : 'light')

function apply(value) {
  if (typeof document === 'undefined') return
  const root = document.getElementById('app') || document.documentElement
  root.setAttribute('data-theme', value)
}

apply(theme.value)

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
