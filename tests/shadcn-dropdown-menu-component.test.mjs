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

test('DropdownMenu.vue implements Shadcn-Vue dropdown specifications', () => {
  const component = read('src/components/DropdownMenu.vue')

  assert.ok(component.includes('shadcn-dropdown-wrapper'), 'Must provide wrapper container')
  assert.ok(component.includes('shadcn-dropdown-trigger'), 'Must provide trigger container')
  assert.ok(component.includes('shadcn-dropdown-content'), 'Must provide popover content container')
  assert.ok(component.includes('aria-haspopup="menu"'), 'Must specify accessibility menu popup role')
  assert.ok(component.includes('handleClickOutside'), 'Must handle click outside to close')
  assert.ok(component.includes('handleKeyDown') && component.includes('Escape'), 'Must support Escape key to dismiss')
  assert.ok(component.includes('provide(\'dropdownMenu\''), 'Must provide dropdownMenu context')
})

test('ui/dropdown-menu exports modular Shadcn-Vue subcomponents', () => {
  const index = read('src/components/ui/dropdown-menu/index.js')
  assert.ok(index.includes('DropdownMenuTrigger'), 'Must export DropdownMenuTrigger')
  assert.ok(index.includes('DropdownMenuContent'), 'Must export DropdownMenuContent')
  assert.ok(index.includes('DropdownMenuItem'), 'Must export DropdownMenuItem')
  assert.ok(index.includes('DropdownMenuLabel'), 'Must export DropdownMenuLabel')
  assert.ok(index.includes('DropdownMenuSeparator'), 'Must export DropdownMenuSeparator')
})

test('App.vue integrates DropdownMenu for the TopBar School Switcher', () => {
  const app = read('src/App.vue')

  assert.ok(app.includes("import DropdownMenu from './components/DropdownMenu.vue'"), 'App.vue must import DropdownMenu')
  assert.ok(app.includes('<DropdownMenu'), 'App.vue must render DropdownMenu for campus switcher')
  assert.ok(app.includes('handleSelectSchool'), 'App.vue must provide handleSelectSchool handler')
  assert.ok(app.includes('All Campuses'), 'App.vue must include All Campuses option')
})

test('Sidebar.vue integrates DropdownMenu for profile and account options', () => {
  const sidebar = read('src/components/Sidebar.vue')

  assert.ok(sidebar.includes("import DropdownMenu from './DropdownMenu.vue'"), 'Sidebar.vue must import DropdownMenu')
  assert.ok(sidebar.includes('<DropdownMenu'), 'Sidebar.vue must mount DropdownMenu in footer')
  assert.ok(sidebar.includes('to="/settings"'), 'Sidebar.vue must provide Settings link inside dropdown')
  assert.ok(sidebar.includes('Sign out'), 'Sidebar.vue must provide Sign out inside dropdown')
})

test('ClassRecord.vue integrates DropdownMenu for column header quick actions', () => {
  const classRecord = read('src/views/ClassRecord.vue')

  assert.ok(classRecord.includes("import DropdownMenu from '../components/DropdownMenu.vue'"), 'ClassRecord.vue must import DropdownMenu')
  assert.ok(classRecord.includes('<DropdownMenu'), 'ClassRecord.vue must render DropdownMenu for column actions')
  assert.ok(classRecord.includes('quickFillValue'), 'ClassRecord.vue must provide quickFillValue helper')
})
