import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx-js-style'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

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
