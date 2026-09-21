import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.config.errorHandler = (err, vm, info) => {
  console.error('[Vue App Error]:', err, info)
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Rejection]:', event.reason)
  })
}

app.use(createPinia())
app.use(router)
app.mount('#app')
