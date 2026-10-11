import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

async function reportClientError({ message, stack, component, path, severity = 'error' }) {
  try {
    if (!message || path === '/api/errors/report' || String(message).includes('/api/errors/report')) return
    await fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: String(message),
        stack: String(stack || ''),
        component: String(component || ''),
        path: window.location?.pathname || path || '',
        severity,
        metadata: {
          url: window.location?.href || '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        }
      })
    })
  } catch {}
}

app.config.errorHandler = (err, vm, info) => {
  console.error('[Vue App Error]:', err, info)
  const componentName = vm?.$options?.name || vm?.$options?.__name || String(info || '')
  reportClientError({
    message: err?.message || String(err),
    stack: err?.stack,
    component: componentName,
    path: window.location?.pathname || '',
    severity: 'error'
  })
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Rejection]:', event.reason)
    const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    reportClientError({
      message: err.message,
      stack: err.stack,
      path: window.location?.pathname || '',
      severity: 'warning'
    })
  })
}

app.use(pinia)
app.use(router)

// The local user cache is only a render hint. The server-side session is the
// source of truth and is restored before protected routes are mounted.
const auth = useAuthStore()
await auth.restoreSession()
app.mount('#app')
