import express from 'express'
import XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

const router = express.Router()

const DEFAULT_TEMPLATE = 'C:\\Users\\New User\\Documents\\BPHS 2026\\SF2.xlsx'

function resolveTemplate(templatePath) {
  if (templatePath && fs.existsSync(templatePath)) return templatePath
  if (fs.existsSync(DEFAULT_TEMPLATE)) return DEFAULT_TEMPLATE
  return null
}

router.post('/sheets', (req, res) => {
  try {
    const templatePath = resolveTemplate(req.body?.templatePath)
    if (!templatePath) return res.status(400).json({ error: 'Template file not found' })
    const wb = XLSX.readFile(templatePath)
    const sheets = wb.SheetNames
    res.json({ sheets })
  } catch (err) {
    console.error('Error reading template sheets:', err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/sf2', (req, res) => {
  try {
    const { sheetName, entries, month, year, grade, section, templatePath } = req.body
    if (!sheetName) return res.status(400).json({ error: 'sheetName is required' })
    if (!entries || !entries.length) return res.status(400).json({ error: 'No entries provided' })

    const tp = resolveTemplate(templatePath)
    if (!tp) return res.status(400).json({ error: 'Template file not found' })

    const wb = XLSX.readFile(tp)
    const sheetIndex = wb.SheetNames.indexOf(sheetName)
    if (sheetIndex === -1) return res.status(400).json({ error: `Sheet "${sheetName}" not found in template` })

    const ws = wb.Sheets[wb.SheetNames[sheetIndex]]
    if (!ws['!ref']) return res.status(400).json({ error: 'Sheet is empty' })

    // Template layout:
    //   Row 2: School Year (K10), Month (U20)
    //   Row 3: Grade (U20), Section (AD29)
    //   Row 5: Date numbers in cols E-T (4-19)
    //   Row 7-23: Male student rows
    //   Row 25: MALE TOTAL row
    //   Row 26-27: date/day headers repeated
    //   Row 28-46: Female student rows
    //   Row 48: FEMALE TOTAL row
    //   Row 49: Combined TOTAL row
    //   Row 50+: Guidelines
    const MALE_START = 7
    const MALE_END = 23
    const FEMALE_START = 28
    const FEMALE_END = 46
    const MALE_TOTAL_ROW = 25
    const FEMALE_TOTAL_ROW = 48
    const COMBINED_TOTAL_ROW = 49

    const NAME_COL = 2
    const NUM_COL = 0
    const ABSENT_COL = 29
    const PRESENT_COL = 31
    const REMARKS_COL = 33

    // ── Update metadata headers ──
    // School Year (K10): compute from year + month
    const syNum = (month >= 7) ? year : year - 1
    const schoolYear = `${syNum}-${syNum + 1}`
    ws[XLSX.utils.encode_cell({ r: 2, c: 10 })] = { t: 's', v: schoolYear }

    // Month name (U20)
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
    ws[XLSX.utils.encode_cell({ r: 2, c: 20 })] = { t: 's', v: monthNames[month - 1] }

    // Grade (U20 on row 3) - extract number from "Grade 9"
    if (grade) {
      const gradeNum = parseInt(grade.replace(/\D/g, ''), 10) || 0
      ws[XLSX.utils.encode_cell({ r: 3, c: 20 })] = { t: 'n', v: gradeNum }
    }

    // Section (AD29 on row 3)
    if (section) {
      ws[XLSX.utils.encode_cell({ r: 3, c: 29 })] = { t: 's', v: section.toUpperCase() }
    }

    // ── Helpers to preserve existing cell formatting ──
    function setCell(ws, r, c, type, value) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (ws[addr]) { ws[addr].v = value; ws[addr].t = type; delete ws[addr].f }
      else ws[addr] = { t: type, v: value }
    }
    function delCell(ws, r, c) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (ws[addr]) { ws[addr].v = ''; ws[addr].t = 's'; delete ws[addr].f }
    }

    // ── Remove merged cells in the student/total area (prevent template merge interference) ──
    if (ws['!merges']) {
      ws['!merges'] = ws['!merges'].filter(m => {
        const s = m.s.r, e = m.e.r
        // Keep merges in header rows (1-6) and footer (50+), strip everything in between
        return (s >= 1 && e <= 6) || (s >= 50)
      })
    }

    // ── Update date columns to match the selected month ──
    const DATE_COL_START = 4
    const MAX_DATE_COLS = 22
    const DAY_ABBR = { 0: 'Sun', 1: 'M', 2: 'T', 3: 'W', 4: 'TH', 5: 'F', 6: 'Sat' }

    function computeSchoolDays(mon, yr) {
      const days = []
      const dim = new Date(yr, mon, 0).getDate()
      for (let d = 1; d <= dim; d++) {
        const dow = new Date(yr, mon - 1, d).getDay()
        if (dow === 0 || dow === 6) continue
        days.push({ day: d, weekday: dow })
      }
      return days
    }

    const schoolDays = computeSchoolDays(month, year)
    const dateColMap = {}
    const numDateCols = Math.min(schoolDays.length, MAX_DATE_COLS)

    // Build dateColMap first (used everywhere)
    for (let ci = 0; ci < numDateCols; ci++)
      dateColMap[schoolDays[ci].day] = DATE_COL_START + ci

    // Write male date headers (row 5-6) — always at the template position
    for (let ci = 0; ci < MAX_DATE_COLS; ci++) {
      delCell(ws, 5, DATE_COL_START + ci)
      delCell(ws, 6, DATE_COL_START + ci)
    }
    for (let ci = 0; ci < numDateCols; ci++) {
      const sd = schoolDays[ci]
      setCell(ws, 5, DATE_COL_START + ci, 'n', sd.day)
      setCell(ws, 6, DATE_COL_START + ci, 's', DAY_ABBR[sd.weekday])
    }

    // ── Count genders and compute dynamic section rows ──
    const maleEntriesAll = entries.filter(e => (e.gender || '').toLowerCase() !== 'female')
    const femaleEntriesAll = entries.filter(e => (e.gender || '').toLowerCase() === 'female')
    const maleCount = maleEntriesAll.length
    const femaleCount = femaleEntriesAll.length

    const MALE_SECTION_START = 7
    const maleSectionEnd = MALE_SECTION_START + maleCount - 1
    const maleTotalRow = maleSectionEnd + 2
    const femaleHeaderRow = maleTotalRow + 1
    const femaleSectionStart = femaleHeaderRow + 2
    const femaleSectionEnd = femaleSectionStart + femaleCount - 1
    const femaleTotalRow = femaleSectionEnd + 2
    const combinedTotalRow = femaleTotalRow + 1

    // ── Clear all old student/total data from the full area ──
    function clearRowData(r) {
      setCell(ws, r, NAME_COL, 's', '')
      setCell(ws, r, ABSENT_COL, 'n', 0)
      setCell(ws, r, PRESENT_COL, 'n', 0)
      setCell(ws, r, REMARKS_COL, 's', '')
      delCell(ws, r, NUM_COL)
      for (let c = DATE_COL_START; c < DATE_COL_START + MAX_DATE_COLS; c++)
        delCell(ws, r, c)
    }
    const clearEnd = Math.max(55, combinedTotalRow + 5)
    for (let r = 7; r <= clearEnd; r++) clearRowData(r)

    // ── Write female date headers at computed position ──
    for (let ci = 0; ci < MAX_DATE_COLS; ci++) {
      delCell(ws, femaleHeaderRow, DATE_COL_START + ci)
      delCell(ws, femaleHeaderRow + 1, DATE_COL_START + ci)
    }
    for (let ci = 0; ci < numDateCols; ci++) {
      const sd = schoolDays[ci]
      setCell(ws, femaleHeaderRow, DATE_COL_START + ci, 'n', sd.day)
      setCell(ws, femaleHeaderRow + 1, DATE_COL_START + ci, 's', DAY_ABBR[sd.weekday])
    }

    // ── Write male students ──
    let row = MALE_SECTION_START
    for (let i = 0; i < maleCount; i++) {
      const entry = maleEntriesAll[i]
      setCell(ws, row, NUM_COL, 'n', i + 1)
      setCell(ws, row, NAME_COL, 's', entry.name)
      const days = entry.days || {}
      for (const [dayStr, status] of Object.entries(days)) {
        const dayNum = parseInt(dayStr, 10)
        const col = dateColMap[dayNum]
        if (col === undefined || !status) continue
        setCell(ws, row, col, 's', status === 'T' ? '◤' : status === 'H' ? '◢' : status)
      }
      setCell(ws, row, ABSENT_COL, 'n', entry.absent || 0)
      setCell(ws, row, PRESENT_COL, 'n', numDateCols - (entry.absent || 0))
      if (entry.remarks) setCell(ws, row, REMARKS_COL, 's', entry.remarks)
      row++
    }

    // ── Write female students ──
    row = femaleSectionStart
    for (let i = 0; i < femaleCount; i++) {
      const entry = femaleEntriesAll[i]
      setCell(ws, row, NUM_COL, 'n', i + 1)
      setCell(ws, row, NAME_COL, 's', entry.name)
      const days = entry.days || {}
      for (const [dayStr, status] of Object.entries(days)) {
        const dayNum = parseInt(dayStr, 10)
        const col = dateColMap[dayNum]
        if (col === undefined || !status) continue
        setCell(ws, row, col, 's', status === 'T' ? '◤' : status === 'H' ? '◢' : status)
      }
      setCell(ws, row, ABSENT_COL, 'n', entry.absent || 0)
      setCell(ws, row, PRESENT_COL, 'n', numDateCols - (entry.absent || 0))
      if (entry.remarks) setCell(ws, row, REMARKS_COL, 's', entry.remarks)
      row++
    }

    // ── Write summary rows ──
    function sumAbsent(el) { return el.reduce((s, e) => s + (e.absent || 0), 0) }
    function sumPresent(el) { return el.reduce((s, e) => s + (numDateCols - (e.absent || 0)), 0) }
    function daySum(el, dn) {
      let count = 0
      for (const e of el) {
        const s = e.days ? e.days[String(dn)] : null
        if (s === 'E') count++
        else if (s === '◤' || s === '◢' || s === 'T' || s === 'H') count += 0.5
      }
      return count
    }
    function writeSummaryRow(r, entriesList, label, count) {
      setCell(ws, r, NAME_COL, 's', `<=== ${label} TOTAL Per Day ===>`)
      setCell(ws, r, NUM_COL, 'n', count)
      for (const [dayNum, col] of Object.entries(dateColMap))
        setCell(ws, r, col, 'n', daySum(entriesList, parseInt(dayNum)))
      setCell(ws, r, ABSENT_COL, 'n', sumAbsent(entriesList))
      setCell(ws, r, PRESENT_COL, 'n', sumPresent(entriesList))
    }

    writeSummaryRow(maleTotalRow, maleEntriesAll, `MALE | ${maleCount}`, maleCount)
    writeSummaryRow(femaleTotalRow, femaleEntriesAll, `FEMALE | ${femaleCount}`, femaleCount)
    // Combined total uses different label format (no arrows)
    setCell(ws, combinedTotalRow, NAME_COL, 's', `Combined TOTAL Per Day`)
    setCell(ws, combinedTotalRow, NUM_COL, 'n', maleCount + femaleCount)
    for (const [dayNum, col] of Object.entries(dateColMap))
      setCell(ws, combinedTotalRow, col, 'n', daySum(entries, parseInt(dayNum)))
    setCell(ws, combinedTotalRow, ABSENT_COL, 'n', sumAbsent(entries))
    setCell(ws, combinedTotalRow, PRESENT_COL, 'n', sumPresent(entries))

    setCell(ws, 5, 32, 'n', numDateCols)

    // ── Set column widths to make date cells square ──
    const cols = []
    for (let c = 0; c <= 40; c++) {
      if (c >= DATE_COL_START && c < DATE_COL_START + MAX_DATE_COLS) cols[c] = { wch: 3 }
      else if (c === NAME_COL) cols[c] = { wch: 30 }
      else if (c === NUM_COL) cols[c] = { wch: 5 }
      else if (c === REMARKS_COL) cols[c] = { wch: 18 }
      else cols[c] = { wch: 8 }
    }
    ws['!cols'] = cols

    // Set row heights for student rows (match column width for square cells)
    const rows = []
    for (let r = MALE_SECTION_START; r <= maleSectionEnd; r++) rows[r] = { hpt: 16 }
    for (let r = femaleSectionStart; r <= femaleSectionEnd; r++) rows[r] = { hpt: 16 }
    ws['!rows'] = rows

    // ── Write output ──
    const outFileName = `SF2_${sheetName}_${year || '2025'}.xlsx`
    const outDir = path.join(process.cwd(), 'exports')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    const outPath = path.join(outDir, outFileName)

    XLSX.writeFile(wb, outPath, { bookType: 'xlsx', type: 'file' })

    res.download(outPath, outFileName, (err) => {
      if (err) console.error('Download error:', err)
      fs.unlink(outPath, () => {})
    })
  } catch (err) {
    console.error('Error exporting SF2:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
