import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import XLSX from 'xlsx-js-style'
import app, { initializeServerDatabase } from '../server.js'
import { run } from '../db.js'
import { hashPassword } from '../lib/passwords.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

const suffix = randomUUID()
const testSchoolId = `export-test-school-${suffix}`
const testAdminId = `export-test-admin-${suffix}`
let server
let baseUrl

before(async () => {
  await initializeServerDatabase()
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [testSchoolId, 'Export Test School', '9999', 'Baguio City', 'ETS'])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`gl-${testSchoolId}`, testSchoolId, 'Grade 10', '["Section Einstein"]', 1])
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [testAdminId, testAdminId, await hashPassword('password123'), 'Export Tester', 'admin', '', '', '', testSchoolId]
  )
  server = http.createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await run('DELETE FROM grade_levels WHERE school_id = ?', [testSchoolId])
  await run('DELETE FROM users WHERE id = ?', [testAdminId])
  await run('DELETE FROM schools WHERE id = ?', [testSchoolId])
  await new Promise(resolve => server.close(resolve))
})

test('SF2 Excel template existence and structure regression', () => {
  const localTemplate = path.join(projectRoot, 'templates', 'SF2.xlsx')
  const defaultTemplate = path.join(projectRoot, 'test_final2.xlsx')

  const targetPath = fs.existsSync(localTemplate) ? localTemplate : (fs.existsSync(defaultTemplate) ? defaultTemplate : null)
  assert.ok(targetPath, 'At least one DepEd SF2 Excel template must be available')

  const wb = XLSX.readFile(targetPath)
  assert.ok(Array.isArray(wb.SheetNames), 'Workbook must have SheetNames array')
  assert.ok(wb.SheetNames.length > 0, 'Workbook must contain at least one sheet')

  const firstSheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[firstSheetName]
  assert.ok(sheet, 'First sheet must be readable')
})

test('SF2 export endpoint generates compliant workbook with correct glyphs and rows', async () => {
  const localTemplate = path.join(projectRoot, 'templates', 'SF2.xlsx')
  const defaultTemplate = path.join(projectRoot, 'test_final2.xlsx')
  const tp = fs.existsSync(localTemplate) ? localTemplate : defaultTemplate
  const wbRaw = XLSX.readFile(tp)
  const sheetName = wbRaw.SheetNames[0]

  const payload = {
    schoolId: testSchoolId,
    sheetName,
    month: 10,
    year: 2026,
    grade: 'Grade 10',
    section: 'Section Einstein',
    adviser: 'Mr. Test Adviser',
    schoolHead: 'Dr. Test Principal',
    entries: [
      {
        name: 'Abalos, Juan',
        gender: 'Male',
        lrn: '123456789001',
        days: { '1': 'T', '2': 'H', '5': 'A', '6': 'E' } // T -> ◤, H -> ◢, A -> x, E -> E
      },
      {
        name: 'Cruz, Maria',
        gender: 'Female',
        lrn: '123456789002',
        days: { '1': 'E', '2': 'T', '5': 'H', '6': 'A' }
      }
    ]
  }

  const response = await fetch(`${baseUrl}/api/export/sf2`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': testAdminId,
      'x-user-role': 'admin'
    },
    body: JSON.stringify(payload)
  })

  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type') || '', /spreadsheetml|octet-stream|excel/i)

  const arrayBuffer = await response.arrayBuffer()
  assert.ok(arrayBuffer.byteLength > 1000, 'Exported workbook must have non-trivial binary size')

  const exportedWb = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer', cellStyles: true })
  assert.ok(exportedWb.SheetNames.includes(sheetName))

  const ws = exportedWb.Sheets[sheetName]
  assert.ok(ws, 'Exported sheet must exist')

  // Search for glyphs and learner names in the exported sheet
  let foundJuan = false
  let foundMaria = false
  let foundTardyGlyph = false
  let foundCuttingClassesGlyph = false
  let foundAbsentGlyph = false

  for (const [cellKey, cellVal] of Object.entries(ws)) {
    if (cellKey.startsWith('!')) continue
    const v = String(cellVal.v || '')
    if (v.includes('Abalos, Juan')) foundJuan = true
    if (v.includes('Cruz, Maria')) foundFemale(v)
    if (v === '◤') foundTardyGlyph = true
    if (v === '◢') foundCuttingClassesGlyph = true
    if (v === 'x') foundAbsentGlyph = true
  }

  function foundFemale(val) {
    if (val.includes('Cruz, Maria')) foundMaria = true
  }

  assert.ok(foundJuan, 'Male learner name must be written')
  assert.ok(foundMaria, 'Female learner name must be written')
  assert.ok(foundTardyGlyph, 'Tardy glyph ◤ must be rendered')
  assert.ok(foundCuttingClassesGlyph, 'Half-day glyph ◢ must be rendered')
  assert.ok(foundAbsentGlyph, 'Absent glyph x must be rendered')
})
