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
const testSchoolId = `holiday-school-${suffix}`
const testAdminId = `holiday-admin-${suffix}`
let server
let baseUrl

before(async () => {
  await initializeServerDatabase()
  await run('INSERT INTO schools (id, name, school_id, address, short) VALUES (?, ?, ?, ?, ?)', [testSchoolId, 'Baguio Test Academy', '123456', 'Baguio City', 'BTA'])
  await run('INSERT INTO grade_levels (id, school_id, grade, sections, sort) VALUES (?, ?, ?, ?, ?)', [`gl-${testSchoolId}`, testSchoolId, 'Grade 7', '["Pine"]', 1])
  await run(
    'INSERT INTO users (id, username, password, name, role, grade, section, period, school_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [testAdminId, testAdminId, await hashPassword('password123'), 'Admin Tester', 'admin', '', '', '', testSchoolId]
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

test('SF2 export generates vertical holiday labels and preserves column continuity for Baguio Day and Sipat Day', async () => {
  const localTemplate = path.join(projectRoot, 'templates', 'SF2.xlsx')
  const defaultTemplate = path.join(projectRoot, 'test_final2.xlsx')
  const tp = fs.existsSync(localTemplate) ? localTemplate : defaultTemplate
  const wbRaw = XLSX.readFile(tp)
  const sheetName = wbRaw.SheetNames[0]

  // September 2026:
  // Day 1 (Tuesday) = Baguio Day (holiday)
  // Day 11 (Friday) = Sipat Day (holiday)
  const payload = {
    schoolId: testSchoolId,
    sheetName,
    month: 9,
    year: 2026,
    grade: 'Grade 7',
    section: 'Pine',
    adviser: 'Adviser Baguio',
    schoolHead: 'Principal Baguio',
    excluded_dates: [1, 11],
    includeSaturdays: false,
    summary_data: {
      holiday_labels: {
        '1': 'BAGUIO DAY',
        '11': 'SIPAT DAY'
      }
    },
    entries: [
      {
        name: 'Abad, Juan',
        gender: 'Male',
        lrn: '123456789001',
        days: { '2': '1', '3': '1', '4': '1', '7': '1', '8': '1', '9': 'T', '10': '1' }
      },
      {
        name: 'Cortez, Pedro',
        gender: 'Male',
        lrn: '123456789002',
        days: { '2': '1', '3': '1', '4': '1', '7': '1', '8': '1', '9': 'A', '10': '1' }
      },
      {
        name: 'Del Rosario, Maria',
        gender: 'Female',
        lrn: '123456789003',
        days: { '2': '1', '3': '1', '4': '1', '7': '1', '8': '1', '9': '1', '10': '1' }
      },
      {
        name: 'Santos, Ana',
        gender: 'Female',
        lrn: '123456789004',
        days: { '2': '1', '3': '1', '4': '1', '7': '1', '8': '1', '9': '1', '10': '1' }
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
  const arrayBuffer = await response.arrayBuffer()
  const exportedWb = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer', cellStyles: true })
  const ws = exportedWb.Sheets[sheetName]
  assert.ok(ws, 'Exported sheet must exist')

  // 1. Verify Date Headers include Day 1 and Day 11 in sequence
  // In row 6 (0-indexed: r:6, which is row 7 in 1-indexed A1 notation)
  // Find column for Day 1 and Day 11
  let colDay1 = null
  let colDay11 = null
  for (let c = 4; c <= 28; c++) {
    const addr = XLSX.utils.encode_cell({ r: 6, c })
    if (ws[addr] && ws[addr].v === 1) colDay1 = c
    if (ws[addr] && ws[addr].v === 11) colDay11 = c
  }

  assert.ok(colDay1 !== null, 'Day 1 (Baguio Day) column must be present in header')
  assert.ok(colDay11 !== null, 'Day 11 (Sipat Day) column must be present in header')

  // 2. Verify Day 1 has weekday "T" and Day 11 has weekday "F" at r:7
  const addrDay1Abbr = XLSX.utils.encode_cell({ r: 7, c: colDay1 })
  const addrDay11Abbr = XLSX.utils.encode_cell({ r: 7, c: colDay11 })
  assert.equal(ws[addrDay1Abbr]?.v, 'T', 'Day 1 must be Tuesday (T)')
  assert.equal(ws[addrDay11Abbr]?.v, 'F', 'Day 11 must be Friday (F)')

  // 3. Verify Vertical Merges in Male and Female sections
  const merges = ws['!merges'] || []
  const hasMaleBaguioMerge = merges.some(m => m.s.c === colDay1 && m.s.r === 8 && m.e.r === 9)
  const hasFemaleBaguioMerge = merges.some(m => m.s.c === colDay1 && m.s.r === 11 && m.e.r === 12)
  const hasMaleSipatMerge = merges.some(m => m.s.c === colDay11 && m.s.r === 8 && m.e.r === 9)
  const hasFemaleSipatMerge = merges.some(m => m.s.c === colDay11 && m.s.r === 11 && m.e.r === 12)

  assert.ok(hasMaleBaguioMerge, 'Must vertically merge Male rows for Baguio Day')
  assert.ok(hasFemaleBaguioMerge, 'Must vertically merge Female rows for Baguio Day')
  assert.ok(hasMaleSipatMerge, 'Must vertically merge Male rows for Sipat Day')
  assert.ok(hasFemaleSipatMerge, 'Must vertically merge Female rows for Sipat Day')

  // 4. Verify Cell Values and Vertical Orientation for BAGUIO DAY and SIPAT DAY
  const cellMaleBaguio = ws[XLSX.utils.encode_cell({ r: 8, c: colDay1 })]
  const cellFemaleBaguio = ws[XLSX.utils.encode_cell({ r: 11, c: colDay1 })]
  const cellMaleSipat = ws[XLSX.utils.encode_cell({ r: 8, c: colDay11 })]
  const cellFemaleSipat = ws[XLSX.utils.encode_cell({ r: 11, c: colDay11 })]

  assert.equal(cellMaleBaguio?.v, 'BAGUIO DAY')
  assert.equal(cellFemaleBaguio?.v, 'BAGUIO DAY')
  assert.equal(cellMaleSipat?.v, 'SIPAT DAY')
  assert.equal(cellFemaleSipat?.v, 'SIPAT DAY')

  // 5. Verify Totals Row is blank for holiday columns (no numbers)
  // Male Total Row is r:10
  const cellMaleTotalDay1 = ws[XLSX.utils.encode_cell({ r: 10, c: colDay1 })]
  const cellMaleTotalDay11 = ws[XLSX.utils.encode_cell({ r: 10, c: colDay11 })]
  assert.ok(!cellMaleTotalDay1 || cellMaleTotalDay1.v === '', 'Male Total for Day 1 must be blank')
  assert.ok(!cellMaleTotalDay11 || cellMaleTotalDay11.v === '', 'Male Total for Day 11 must be blank')

  // Regular school day (e.g. Day 2) must have learner attendance count (2 males)
  const colDay2 = dateColForDay(ws, 2)
  const cellMaleTotalDay2 = ws[XLSX.utils.encode_cell({ r: 10, c: colDay2 })]
  assert.equal(cellMaleTotalDay2?.v, 2, 'Male Total for Day 2 must have learner count (2)')
})

function dateColForDay(ws, dayNum) {
  for (let c = 4; c <= 28; c++) {
    const addr = XLSX.utils.encode_cell({ r: 6, c })
    if (ws[addr] && ws[addr].v === dayNum) return c
  }
  return null
}
