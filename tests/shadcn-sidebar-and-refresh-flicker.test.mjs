import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

test('main.js mounts without blocking on network session restore to eliminate refresh flicker', () => {
  const main = read('src/main.js')

  // Must not block initial paint behind top-level await auth.restoreSession()
  assert.ok(!main.includes('await auth.restoreSession()'), 'main.js must not block app.mount behind await auth.restoreSession()')

  // Background non-blocking session restore
  assert.ok(main.includes('auth.restoreSession()'), 'main.js must dispatch auth.restoreSession() in background')

  // Synchronous mount ensures immediate render without blank screen hangs
  assert.ok(main.includes("app.mount('#app')"), 'main.js must mount to #app')
})

test('index.html provides critical pre-load theme background styles', () => {
  const html = read('index.html')

  assert.ok(html.includes('--bg-preload'), 'index.html must include pre-render background variable')
  assert.ok(html.includes('[data-theme="dark"]'), 'index.html must style dark theme background pre-render')
  assert.ok(html.includes('background-color: var(--bg-preload)'), 'index.html must set pre-render background color')
})

test('useSidebar composable manages state, persistence, and keyboard shortcuts', () => {
  const composable = read('src/composables/useSidebar.js')

  assert.ok(composable.includes('elytrack_sidebar_state'), 'useSidebar must persist state to localStorage')
  assert.ok(composable.includes('isCollapsed'), 'useSidebar must provide reactive isCollapsed')
  assert.ok(composable.includes('isMobile'), 'useSidebar must track isMobile state')
  assert.ok(composable.includes('openMobile'), 'useSidebar must track openMobile state')
  assert.ok(composable.includes('toggleSidebar'), 'useSidebar must provide toggleSidebar handler')
  assert.ok(composable.includes('closeSidebar'), 'useSidebar must provide closeSidebar helper')
  assert.ok(composable.includes("key.toLowerCase() === 'b'"), 'useSidebar must register Ctrl/Cmd+B shortcut')
})

test('Sidebar.vue implements Shadcn-Vue sidebar specifications', () => {
  const sidebar = read('src/components/Sidebar.vue')

  // Uses composable
  assert.ok(sidebar.includes("useSidebar"), 'Sidebar.vue must consume useSidebar composable')

  // Collapsible rail state and classes
  assert.ok(sidebar.includes('is-collapsed'), 'Sidebar.vue must handle is-collapsed class')
  assert.ok(sidebar.includes('sidebar-collapse-trigger'), 'Sidebar.vue must provide collapse toggle button')
  assert.ok(sidebar.includes('sidebar-tooltip'), 'Sidebar.vue must provide tooltip for collapsed icon rail')

  // Groups
  assert.ok(sidebar.includes('Workspace'), 'Sidebar.vue must render Workspace group')
  assert.ok(sidebar.includes('People'), 'Sidebar.vue must render People group for admin')
  assert.ok(sidebar.includes('Configuration'), 'Sidebar.vue must render Configuration group')
  assert.ok(sidebar.includes('Support'), 'Sidebar.vue must render Support group')
  assert.ok(sidebar.includes('Platform'), 'Sidebar.vue must render Platform group for superadmin')

  // Profile and actions
  assert.ok(sidebar.includes('sidebar-footer'), 'Sidebar.vue must render footer')
  assert.ok(sidebar.includes('sidebar-profile-card'), 'Sidebar.vue must render profile card')
  assert.ok(sidebar.includes('to="/settings"'), 'Sidebar.vue profile card must link to /settings')
  assert.ok(sidebar.includes('sidebar-logout-btn'), 'Sidebar.vue must render logout button')
  assert.ok(sidebar.includes("$emit('logout')"), 'Sidebar.vue logout button must emit logout event')
})

test('App.vue integrates Sidebar component and reactive header sizing', () => {
  const app = read('src/App.vue')

  assert.ok(app.includes("import Sidebar from './components/Sidebar.vue'"), 'App.vue must import Sidebar')
  assert.ok(app.includes('<Sidebar'), 'App.vue must mount Sidebar component')
  assert.ok(app.includes('sidebar-scrim'), 'App.vue must render mobile scrim overlay')
  assert.ok(app.includes('auth.user?.avatar_url'), 'App.vue must retain auth.user?.avatar_url')
})
