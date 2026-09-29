import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.config.errorHandler = (err, vm, info) => {
  console.error('[Vue App Error]:', err, info)
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Rejection]:', event.reason)
  })
}

app.use(pinia)
app.use(router)

// The local user cache is only a render hint. The server-side session is the
// source of truth and is restored before protected routes are mounted.
const auth = useAuthStore()
await auth.restoreSession()
app.mount('#app')
