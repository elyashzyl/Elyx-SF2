import express from 'express'
import XLSX from 'xlsx-js-style'
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
    const { sheetName, entries, month, year, grade, section, templatePath, summary_data, excluded_dates, adviser } = req.body
    if (!sheetName) return res.status(400).json({ error: 'sheetName is required' })
    if (!entries || !entries.length) return res.status(400).json({ error: 'No entries provided' })

    const tp = resolveTemplate(templatePath)
    if (!tp) return res.status(400).json({ error: 'Template file not found' })

    const wb = XLSX.readFile(tp, { cellStyles: true })
    const sheetIndex = wb.SheetNames.indexOf(sheetName)
    if (sheetIndex === -1) return res.status(400).json({ error: `Sheet "${sheetName}" not found in template` })

    const ws = wb.Sheets[wb.SheetNames[sheetIndex]]
    if (!ws['!ref']) return res.status(400).json({ error: 'Sheet is empty' })

    // Build a fresh worksheet — we will build rows 50+ from scratch
    const newWs = {}
    newWs['!merges'] = []
    const THIN_BORDER = {
      top: { style: 'thin', color: { rgb: 'FF000000' } },
      bottom: { style: 'thin', color: { rgb: 'FF000000' } },
      left: { style: 'thin', color: { rgb: 'FF000000' } },
      right: { style: 'thin', color: { rgb: 'FF000000' } }
    }
    const MEDIUM_BORDER = {
      top: { style: 'medium', color: { rgb: 'FF000000' } },
      bottom: { style: 'medium', color: { rgb: 'FF000000' } },
      left: { style: 'medium', color: { rgb: 'FF000000' } },
      right: { style: 'medium', color: { rgb: 'FF000000' } }
    }

    const VALUE_STYLE = {
      font: { name: 'Trebuchet MS', sz: 11, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: THIN_BORDER,
      fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }
    }
    const LABEL_STYLE = {
      font: { name: 'Trebuchet MS', sz: 11 },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: THIN_BORDER,
      fill: { fgColor: { rgb: 'D9D9D9' }, patternType: 'solid' }
    }
    const PLAIN_LABEL_STYLE = {
      font: { name: 'Trebuchet MS', sz: 11 },
      alignment: { horizontal: 'right', vertical: 'center' }
    }
    const TITLE_STYLE = {
      font: { name: 'Trebuchet MS', sz: 12, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {}
    }
    const SUBTITLE_STYLE = {
      font: { name: 'Trebuchet MS', sz: 9, italic: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {}
    }
    const TABLE_HEADER_STYLE = {
      font: { name: 'Trebuchet MS', sz: 10, bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: MEDIUM_BORDER,
      fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }
    }
    const SUMMARY_STYLE = {
      font: { name: 'Trebuchet MS', sz: 9 },
      alignment: { horizontal: 'left', vertical: 'center' }
    }
    const DATA_STYLE = {
      font: { name: 'Trebuchet MS', sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: MEDIUM_BORDER,
      fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }
    }
    const PLAIN_LEFT_STYLE = {
      font: { name: 'Trebuchet MS', sz: 11 },
      alignment: { horizontal: 'left', vertical: 'center' }
    }
    function applyStyle(newWs, r, c, style) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (!newWs[addr]) newWs[addr] = { t: 's', v: '' }
      newWs[addr].s = style
    }
    function setVal(newWs, r, c, type, value) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (newWs[addr]) { newWs[addr].v = value; newWs[addr].t = type; delete newWs[addr].f }
      else newWs[addr] = { t: type, v: value }
    }
    function delCell(newWs, r, c) {
      const addr = XLSX.utils.encode_cell({ r, c })
      if (newWs[addr]) { newWs[addr].v = ''; newWs[addr].t = 's'; delete newWs[addr].f }
    }

    function addMerge(newWs, r1, c1, r2, c2) {
      if (!newWs['!merges']) newWs['!merges'] = []
      newWs['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } })
    }

    // ── Row 1 (r:0): Title ──
    addMerge(newWs, 0, 0, 0, 37)
    setVal(newWs, 0, 0, 's', 'School Form 2 (SF2) Daily Attendance Report of Learners')
    applyStyle(newWs, 0, 0, TITLE_STYLE)

    // ── Row 2 (r:1): Subtitle ──
    addMerge(newWs, 1, 0, 1, 37)
    setVal(newWs, 1, 0, 's', '(This replaces Form 1, Form 2 & STS Form 4: Absenteeism and Dropout Profile)')
    applyStyle(newWs, 1, 0, SUBTITLE_STYLE)

    // ── Row 3 (r:2): Empty gap ──

    // ── Bordered information table (Rows 4-6 = r:3-r:5) ──

    // School Year, Month values
    const syNum = parseInt(year, 10) || 0
    const schoolYear = `${syNum}-${syNum + 1}`
    const monthNames = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
    const monthName = monthNames[month - 1]
    const gradeNum = grade ? (parseInt(grade.replace(/\D/g, ''), 10) || 0) : ''
    const sectionVal = section ? section.toUpperCase() : ''

    // Row 4 (r:3): First Info Row
    // School ID(A-D) (E-g) | School Year(h-j) (k-o) | Month(p-s) (u-z)
    addMerge(newWs, 3, 0, 3, 3);  setVal(newWs, 3, 0, 's', 'School ID');  applyStyle(newWs, 3, 0, PLAIN_LABEL_STYLE)
    addMerge(newWs, 3, 4, 3, 6);  setVal(newWs, 3, 4, 's', '406219');  applyStyle(newWs, 3, 4, VALUE_STYLE)
    addMerge(newWs, 3, 7, 3, 9);  setVal(newWs, 3, 7, 's', 'School Year');  applyStyle(newWs, 3, 7, PLAIN_LABEL_STYLE)
    addMerge(newWs, 3, 10, 3, 14); setVal(newWs, 3, 10, 's', schoolYear);  applyStyle(newWs, 3, 10, VALUE_STYLE)
    addMerge(newWs, 3, 15, 3, 18); setVal(newWs, 3, 15, 's', 'Month');  applyStyle(newWs, 3, 15, PLAIN_LABEL_STYLE)
    addMerge(newWs, 3, 20, 3, 25); setVal(newWs, 3, 20, 's', monthName);  applyStyle(newWs, 3, 20, VALUE_STYLE)

    // Row 5 (r:4): Second Info Row
    // School Name(a-d)(e-o) | Grade Level(p-t)(u-z) | Section(aa-ac)(ad-ak)
    addMerge(newWs, 4, 0, 4, 3);  setVal(newWs, 4, 0, 's', 'Name of School');  applyStyle(newWs, 4, 0, PLAIN_LABEL_STYLE)
    addMerge(newWs, 4, 4, 4, 14); setVal(newWs, 4, 4, 's', 'Baguio Patriotic High School');  applyStyle(newWs, 4, 4, VALUE_STYLE)
    addMerge(newWs, 4, 15, 4, 19); setVal(newWs, 4, 15, 's', 'Grade Level');  applyStyle(newWs, 4, 15, PLAIN_LABEL_STYLE)
    addMerge(newWs, 4, 20, 4, 25); setVal(newWs, 4, 20, 's', gradeNum !== '' ? String(gradeNum) : '');  applyStyle(newWs, 4, 20, VALUE_STYLE)
    addMerge(newWs, 4, 26, 4, 28); setVal(newWs, 4, 26, 's', 'Section');  applyStyle(newWs, 4, 26, PLAIN_LABEL_STYLE)
    addMerge(newWs, 4, 29, 4, 37); setVal(newWs, 4, 29, 's', sectionVal);  applyStyle(newWs, 4, 29, VALUE_STYLE)

    // ── Apply VALUE_STYLE to every cell in each value merge range ──
    const valueRanges = [[3,4,3,6],[3,10,3,14],[3,20,3,25],[4,4,4,14],[4,20,4,25],[4,29,4,37]]
    for (const [r1,c1,r2,c2] of valueRanges) {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const addr = XLSX.utils.encode_cell({ r, c })
          if (!newWs[addr]) newWs[addr] = { t: 's', v: '' }
          newWs[addr].s = VALUE_STYLE
        }
      }
    }

    // ── Column headers at Row 7 (r:6) ──
    // "No." (c0-c1), "NAME" (c2-c3), "Total for the" (c29-c32), "REMARKS" (c33-c37)
    // "ABSENT" (c29) and "PRESENT" (c31) labels below on date rows
    const COL_HEADER_ROW = 6
    // No. and NAME merge vertically to match date rows height
    addMerge(newWs, COL_HEADER_ROW - 1, 0, COL_HEADER_ROW + 1, 1)
    setVal(newWs, COL_HEADER_ROW - 1, 0, 's', 'No.')
    addMerge(newWs, COL_HEADER_ROW - 1, 2, COL_HEADER_ROW + 1, 3)
    setVal(newWs, COL_HEADER_ROW - 1, 2, 's', 'NAME\n(Last Name, First Name, Middle Name)')

    // Total for the at r:5, c29-c32
    addMerge(newWs, COL_HEADER_ROW - 1, 29, COL_HEADER_ROW - 1, 32)
    setVal(newWs, COL_HEADER_ROW - 1, 29, 's', 'Total for the')
    // Month name at r:6, c29-c31; total days at r:6, c32
    addMerge(newWs, COL_HEADER_ROW, 29, COL_HEADER_ROW, 31)
    setVal(newWs, COL_HEADER_ROW, 29, 's', 'Month')

    // REMARKS at r:5-7, c33-c37
    addMerge(newWs, COL_HEADER_ROW - 1, 33, COL_HEADER_ROW + 1, 37)
    setVal(newWs, COL_HEADER_ROW - 1, 33, 's', 'REMARKS\n(If NLS, state reason, please refer to legend number 2. If TRANSFERRED IN/OUT, write the name of School.)')

    // Row 5, E-AC (c4-c28) merged with medium border
    addMerge(newWs, COL_HEADER_ROW - 1, 4, COL_HEADER_ROW - 1, 28)
    for (let c = 4; c <= 28; c++) applyStyle(newWs, COL_HEADER_ROW - 1, c, { font: { name: 'Trebuchet MS', sz: 10, bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: MEDIUM_BORDER, fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' } })

    // Date numbers at r:6, c4-c28 (same row as column headers)

    // ── Update date columns to match the selected month ──
    const DATE_COL_START = 4
    const MAX_DATE_COLS = 22
    const DAY_ABBR = { 0: 'Sun', 1: 'M', 2: 'T', 3: 'W', 4: 'TH', 5: 'F', 6: 'Sat' }

    function computeSchoolDays(mon, yr, excl) {
      const days = []
      const dim = new Date(yr, mon, 0).getDate()
      const excluded = excl || []
      for (let d = 1; d <= dim; d++) {
        const dow = new Date(yr, mon - 1, d).getDay()
        if (dow === 0 || dow === 6) continue
        if (excluded.includes(d)) continue
        days.push({ day: d, weekday: dow })
      }
      return days
    }

    const schoolDays = computeSchoolDays(month, year, excluded_dates)
    const dateColMap = {}
    const numDateCols = Math.min(schoolDays.length, MAX_DATE_COLS)
    setVal(newWs, COL_HEADER_ROW, 32, 'n', numDateCols)

    // Build dateColMap first (used everywhere)
    for (let ci = 0; ci < numDateCols; ci++)
      dateColMap[schoolDays[ci].day] = DATE_COL_START + ci

    // Date headers at r:6 (date numbers) and r:7 (day abbreviations)
    const DATE_NUM_ROW = 6
    const DATE_ABBR_ROW = 7

    // Write ABSENT / PRESENT labels on day abbreviation row (r:7 only)
    setVal(newWs, DATE_ABBR_ROW, 29, 's', 'ABSENT')
    addMerge(newWs, DATE_ABBR_ROW, 30, DATE_ABBR_ROW, 32)  // AE-AG
    setVal(newWs, DATE_ABBR_ROW, 30, 's', 'PRESENT')

    // Clear and write date headers (r:7-r:8)
    for (let ci = 0; ci < MAX_DATE_COLS; ci++) {
      delCell(newWs, DATE_NUM_ROW, DATE_COL_START + ci)
      delCell(newWs, DATE_ABBR_ROW, DATE_COL_START + ci)
    }
    for (let ci = 0; ci < numDateCols; ci++) {
      const sd = schoolDays[ci]
      setVal(newWs, DATE_NUM_ROW, DATE_COL_START + ci, 'n', sd.day)
      setVal(newWs, DATE_ABBR_ROW, DATE_COL_START + ci, 's', DAY_ABBR[sd.weekday])
    }

    // ── Apply medium borders to table header cells ──
    // Ensure empty trailing date cells exist so borders extend to AC (c28)
    const DATE_END_COL = 28
    for (let c = DATE_COL_START + numDateCols; c <= DATE_END_COL; c++) {
      applyStyle(newWs, DATE_NUM_ROW, c, TABLE_HEADER_STYLE)
      applyStyle(newWs, DATE_ABBR_ROW, c, TABLE_HEADER_STYLE)
    }
    const tableRanges = [
      [COL_HEADER_ROW - 1, 0, COL_HEADER_ROW + 1, 1], // No.
      [COL_HEADER_ROW - 1, 2, COL_HEADER_ROW + 1, 3], // NAME
      [COL_HEADER_ROW - 1, 29, COL_HEADER_ROW - 1, 32], // Total for the
      [COL_HEADER_ROW, 29, COL_HEADER_ROW, 31],         // month name
      [COL_HEADER_ROW, 32, COL_HEADER_ROW, 32],       // total days count
      [COL_HEADER_ROW - 1, 33, COL_HEADER_ROW + 1, 37], // REMARKS
      [DATE_ABBR_ROW, 29, DATE_ABBR_ROW, 29],         // ABSENT
      [DATE_ABBR_ROW, 30, DATE_ABBR_ROW, 32],         // PRESENT (AE-AG merged)
    ]
    for (const [r1, c1, r2, c2] of tableRanges) {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          applyStyle(newWs, r, c, TABLE_HEADER_STYLE)
        }
      }
    }
    // Date column headers: thin borders within weeks, medium at week boundaries
    function dateBorder(ci) {
      const left = (ci === 0 || schoolDays[ci].weekday === 1) ? { style: 'medium', color: { rgb: 'FF000000' } } : { style: 'thin', color: { rgb: 'FF000000' } }
      const right = (ci === numDateCols - 1 || schoolDays[ci].weekday === 5) ? { style: 'medium', color: { rgb: 'FF000000' } } : { style: 'thin', color: { rgb: 'FF000000' } }
      return { top: { style: 'medium', color: { rgb: 'FF000000' } }, bottom: { style: 'medium', color: { rgb: 'FF000000' } }, left, right }
    }
    for (let ci = 0; ci < numDateCols; ci++) {
      const c = DATE_COL_START + ci
      const b = dateBorder(ci)
      applyStyle(newWs, DATE_NUM_ROW, c, { font: { name: 'Trebuchet MS', sz: 10, bold: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: b, fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' } })
      applyStyle(newWs, DATE_ABBR_ROW, c, { font: { name: 'Trebuchet MS', sz: 10 }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: b, fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' } })
    }

    // ── Count genders ──
    const maleEntriesAll = entries.filter(e => (e.gender || '').toLowerCase() !== 'female')
    const femaleEntriesAll = entries.filter(e => (e.gender || '').toLowerCase() === 'female')
    const maleCount = maleEntriesAll.length
    const femaleCount = femaleEntriesAll.length

    const NAME_COL = 2
    const NUM_COL = 0
    const ABSENT_COL = 29
    const PRESENT_COL = 31
    const REMARKS_COL = 33

    // ── Clear all student/total area ──
    function clearRowData(r) {
      for (let c = 0; c <= 37; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        delete newWs[addr]
      }
    }

    // Compute row positions:
    //   male students → BOYS TOTAL → female students → GIRLS TOTAL → COMBINED TOTAL
    // Student data starts at row 8 (Excel Row 9)
    let nextRow = 8
    const maleSectionStart = nextRow
    nextRow += maleCount
    const maleSectionEnd = nextRow - 1
    const maleTotalRow = nextRow++
    const femaleSectionStart = femaleCount > 0 ? nextRow : -1
    nextRow += femaleCount
    const femaleSectionEnd = femaleCount > 0 ? nextRow - 1 : -1
    const femaleTotalRow = nextRow++
    const combinedTotalRow = nextRow++

    const S = combinedTotalRow + 1
    const clearEnd = Math.min(Math.max(combinedTotalRow, 55), S - 1)
    for (let r = 8; r <= clearEnd; r++) clearRowData(r)

    // Reset !ref to prevent xlsx from writing empty cells from template range
    newWs['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(clearEnd, 70), c: 37 } })

    // ── Helpers ──
    function calcEntryPresent(entry) {
      let absent = 0
      for (const [dayStr, s] of Object.entries(entry.days || {})) {
        if (dateColMap[parseInt(dayStr, 10)] === undefined) continue
        if (s === 'A') absent++
        else if (s === '◢' || s === 'H') absent += 0.5
        // ◤/T counts as full present, no deduction
      }
      return numDateCols - absent
    }
    function sumAbsent(el) { return el.reduce((s, e) => s + (e.absent || 0), 0) }
    function sumPresent(el) { return el.reduce((s, e) => s + calcEntryPresent(e), 0) }
    function daySum(el, dn) {
      let count = 0
      for (const e of el) {
        const s = e.days ? e.days[String(dn)] : null
        if (!s || s === '◤' || s === 'T') count++
        else if (s === '◢' || s === 'H') count += 0.5
        // 'A' = absent, contributes 0
      }
      return count
    }
    function writeSummaryRow(r, entriesList, label, count) {
      addMerge(newWs, r, 0, r, 1)
      addMerge(newWs, r, 2, r, 3)
      setVal(newWs, r, NAME_COL, 's', `<=== ${label} TOTAL Per Day ===>`)
      setVal(newWs, r, NUM_COL, 'n', count)
      for (const [dayNum, col] of Object.entries(dateColMap))
        setVal(newWs, r, col, 'n', daySum(entriesList, parseInt(dayNum)))
      setVal(newWs, r, ABSENT_COL, 'n', sumAbsent(entriesList))
      addMerge(newWs, r, 30, r, 32)
      setVal(newWs, r, 30, 'n', sumPresent(entriesList))
      addMerge(newWs, r, 33, r, 37)
    }

    // ── Write male students ──
    let row = maleSectionStart
    for (let i = 0; i < maleCount; i++) {
      const entry = maleEntriesAll[i]
      addMerge(newWs, row, 0, row, 1)
      setVal(newWs, row, NUM_COL, 'n', i + 1)
      addMerge(newWs, row, 2, row, 3)
      setVal(newWs, row, NAME_COL, 's', entry.name)
      const days = entry.days || {}
      for (const [dayStr, status] of Object.entries(days)) {
        const dayNum = parseInt(dayStr, 10)
        const col = dateColMap[dayNum]
        if (col === undefined || !status) continue
        const sym = status === 'T' ? '◤' : status === 'H' ? '◢' : status === 'A' ? 'x' : status === 'E' ? '' : status
        setVal(newWs, row, col, 's', sym)
        applyStyle(newWs, row, col, { font: { name: 'Trebuchet MS', sz: 36 }, alignment: { horizontal: 'center', vertical: 'center' } })
      }
      setVal(newWs, row, ABSENT_COL, 'n', entry.absent || 0)
      addMerge(newWs, row, 30, row, 32)
      setVal(newWs, row, 30, 'n', calcEntryPresent(entry))
      addMerge(newWs, row, 33, row, 37)
      if (entry.remarks) setVal(newWs, row, REMARKS_COL, 's', entry.remarks)
      row++
    }

    // ── Write BOYS TOTAL ──
    writeSummaryRow(maleTotalRow, maleEntriesAll, `MALE | ${maleCount}`, maleCount)

    // ── Write female students (only if any exist) ──
    if (femaleCount > 0) {
      row = femaleSectionStart
      for (let i = 0; i < femaleCount; i++) {
        const entry = femaleEntriesAll[i]
        addMerge(newWs, row, 0, row, 1)
        setVal(newWs, row, NUM_COL, 'n', i + 1)
        addMerge(newWs, row, 2, row, 3)
        setVal(newWs, row, NAME_COL, 's', entry.name)
        const days = entry.days || {}
        for (const [dayStr, status] of Object.entries(days)) {
          const dayNum = parseInt(dayStr, 10)
          const col = dateColMap[dayNum]
          if (col === undefined || !status) continue
        const sym = status === 'T' ? '◤' : status === 'H' ? '◢' : status === 'A' ? 'x' : status === 'E' ? '' : status
          setVal(newWs, row, col, 's', sym)
          applyStyle(newWs, row, col, { font: { name: 'Trebuchet MS', sz: 36 }, alignment: { horizontal: 'center', vertical: 'center' } })
        }
        setVal(newWs, row, ABSENT_COL, 'n', entry.absent || 0)
        addMerge(newWs, row, 30, row, 32)
        setVal(newWs, row, 30, 'n', calcEntryPresent(entry))
        addMerge(newWs, row, 33, row, 37)
        if (entry.remarks) setVal(newWs, row, REMARKS_COL, 's', entry.remarks)
        row++
      }
      // ── Write GIRLS TOTAL ──
      writeSummaryRow(femaleTotalRow, femaleEntriesAll, `FEMALE | ${femaleCount}`, femaleCount)
    }

    // ── Write COMBINED TOTAL ──
    addMerge(newWs, combinedTotalRow, 0, combinedTotalRow, 1)
    addMerge(newWs, combinedTotalRow, 2, combinedTotalRow, 3)
    setVal(newWs, combinedTotalRow, NAME_COL, 's', `<=== COMBINED | ${numDateCols} TOTAL Per Day ===>`)
    setVal(newWs, combinedTotalRow, NUM_COL, 'n', numDateCols)
    for (const [dayNum, col] of Object.entries(dateColMap))
      setVal(newWs, combinedTotalRow, col, 'n', daySum(entries, parseInt(dayNum)))
    setVal(newWs, combinedTotalRow, ABSENT_COL, 'n', sumAbsent(entries))
    addMerge(newWs, combinedTotalRow, 30, combinedTotalRow, 32)
    setVal(newWs, combinedTotalRow, 30, 'n', sumPresent(entries))
    addMerge(newWs, combinedTotalRow, 33, combinedTotalRow, 37)

    // ── Extend borders to table body rows ──
    for (let r = maleSectionStart; r <= maleSectionEnd; r++) {
      for (let c = 0; c <= 37; c++) applyStyle(newWs, r, c, DATA_STYLE)
    }
    for (const r of [maleTotalRow]) {
      if (r !== undefined) for (let c = 0; c <= 37; c++) applyStyle(newWs, r, c, TABLE_HEADER_STYLE)
    }
    if (femaleCount > 0) {
      for (let r = femaleSectionStart; r <= femaleSectionEnd; r++) {
        for (let c = 0; c <= 37; c++) applyStyle(newWs, r, c, DATA_STYLE)
      }
      for (const r of [femaleTotalRow]) {
        if (r !== undefined) for (let c = 0; c <= 37; c++) applyStyle(newWs, r, c, TABLE_HEADER_STYLE)
      }
    }
    {
      const r = combinedTotalRow
      for (let c = 0; c <= 37; c++) applyStyle(newWs, r, c, TABLE_HEADER_STYLE)
    }

    // ── Date body cells: thin borders within weeks, medium at week boundaries ──
    const bodyRows = []
    for (let r = maleSectionStart; r <= maleSectionEnd; r++) bodyRows.push(r)
    if (maleTotalRow !== undefined) bodyRows.push(maleTotalRow)
    if (femaleCount > 0) {
      for (let r = femaleSectionStart; r <= femaleSectionEnd; r++) bodyRows.push(r)
      if (femaleTotalRow !== undefined) bodyRows.push(femaleTotalRow)
    }
    bodyRows.push(combinedTotalRow)
    for (const r of bodyRows) {
      for (let ci = 0; ci < numDateCols; ci++) {
        const c = DATE_COL_START + ci
        applyStyle(newWs, r, c, { font: { name: 'Trebuchet MS', sz: 11 }, alignment: { horizontal: 'center', vertical: 'center' }, border: dateBorder(ci), fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' } })
      }
    }
    // Re-apply font 22 on triangle cells after all style overrides
    for (const r of bodyRows) {
      for (let ci = 0; ci < numDateCols; ci++) {
        const c = DATE_COL_START + ci
        const addr = XLSX.utils.encode_cell({ r, c })
        if (newWs[addr] && (newWs[addr].v === '◤' || newWs[addr].v === '◢')) applyStyle(newWs, r, c, { font: { name: 'Trebuchet MS', sz: 36 }, alignment: { horizontal: 'center', vertical: 'center' }, border: dateBorder(ci) })
      }
    }

    // ── Use summary_data from request (or compute defaults) ──
    const sd = summary_data || {}
    const totalCount = maleCount + femaleCount
    const mTotalPresent = sumPresent(maleEntriesAll)
    const fTotalPresent = sumPresent(femaleEntriesAll)
    const mADA = sd.ada_m != null ? sd.ada_m : (numDateCols > 0 ? Math.round((mTotalPresent / numDateCols) * 10) / 10 : 0)
    const fADA = sd.ada_f != null ? sd.ada_f : (numDateCols > 0 ? Math.round((fTotalPresent / numDateCols) * 10) / 10 : 0)
    const tADA = sd.ada_t != null ? sd.ada_t : (numDateCols > 0 ? Math.round(((mTotalPresent + fTotalPresent) / numDateCols) * 10) / 10 : 0)
    const mPct = sd.pct_m != null ? sd.pct_m : (maleCount > 0 ? Math.round((mTotalPresent / numDateCols / maleCount) * 100) : 0)
    const fPct = sd.pct_f != null ? sd.pct_f : (femaleCount > 0 ? Math.round((fTotalPresent / numDateCols / femaleCount) * 100) : 0)
    const tPct = sd.pct_t != null ? sd.pct_t : (totalCount > 0 ? Math.round(((mTotalPresent + fTotalPresent) / numDateCols / totalCount) * 100) : 0)

    // ── Compute late/enrolment values for summary section ──
    const lateM = sd.late_m != null ? sd.late_m : 0
    const lateF = sd.late_f != null ? sd.late_f : 0
    const initM = maleCount - lateM
    const initF = femaleCount - lateF
    const initT = initM + initF

    // ── Left-align name cells with bottom border only ──
    for (const r of bodyRows) {
      for (const nc of [NAME_COL, 3])
        applyStyle(newWs, r, nc, { font: { name: 'Trebuchet MS', sz: 11 }, alignment: { horizontal: 'left', vertical: 'center' }, border: { bottom: { style: 'medium', color: { rgb: 'FF000000' } } }, fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' } })
    }

    // ── Set column widths ──
    const cols = []
    for (let c = 0; c <= 40; c++) {
      if (c === 0) cols[c] = { wch: 5 }  // No.
      else if (c === NAME_COL) cols[c] = { wch: 35 }
      else if (c === 3) cols[c] = { wch: 4 }
      else if (c >= DATE_COL_START && c < DATE_COL_START + MAX_DATE_COLS) cols[c] = { wch: 3 }  // 25px square attendance cells
      else if (c === 26) cols[c] = { wch: 5 }
      else if (c === 27) cols[c] = { wch: 5 }
      else if (c === 28) cols[c] = { wch: 5 }
      else if (c >= 19 && c <= 25) cols[c] = { wch: 9 }   // CODES / REASONS (T-AC)
      else if (c === 29) cols[c] = { wch: 10 }  // ABSENT
      else if (c >= 30 && c <= 32) cols[c] = { wch: 5 }  // PRESENT
      else if (c === 33) cols[c] = { wch: 5 }  // REMARKS start
      else if (c >= 34 && c <= 36) cols[c] = { wch: 5 }   // M / F / TOTAL (AI-AL)
      else if (c === REMARKS_COL) cols[c] = { wch: 12 }
      else cols[c] = { wch: 4 }
    }
    newWs['!cols'] = cols

    // Set row heights for student rows (match column width for square cells)
    const rows = []
    for (let r = maleSectionStart; r <= maleSectionEnd; r++) rows[r] = { hpt: 19 }
    for (let r = femaleSectionStart; r <= femaleSectionEnd && r >= 0; r++) rows[r] = { hpt: 19 }
    newWs['!rows'] = rows

    // ── BOTTOM SECTION STYLES (font 9 for rows 51+) ──
    const A8 = { name: 'Arial', sz: 8 }
    const A9 = { name: 'Arial', sz: 9 }
    const S9_THIN = { font: A9, border: THIN_BORDER, alignment: { vertical: 'center' } }
    const S9_MED = { font: A9, border: MEDIUM_BORDER, alignment: { vertical: 'center' } }
    const S9_LEFT = { font: A9, alignment: { horizontal: 'left', vertical: 'center' } }
    const S9_BOLD_LEFT = { font: { ...A9, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } }
    const S9_BOLD_MED_LEFT = { font: { ...A9, bold: true }, border: MEDIUM_BORDER, alignment: { horizontal: 'left', vertical: 'center' } }
    const S9_CENTER = { font: A9, alignment: { horizontal: 'center', vertical: 'center' } }
    const S9_CENTER_THIN = { font: A9, border: THIN_BORDER, alignment: { horizontal: 'center', vertical: 'center' } }
    const S9_GRAY_THIN = { font: { ...A9, bold: true }, border: THIN_BORDER, alignment: { horizontal: 'center', vertical: 'center' }, fill: { fgColor: { rgb: 'D9D9D9' }, patternType: 'solid' } }
    // Arial 8pt styles for guidelines text and formulas
    const S8_LEFT = { font: A8, alignment: { horizontal: 'left', vertical: 'center' } }
    const S8_BOLD_LEFT = { font: { ...A8, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } }
    const S8_CENTER = { font: A8, alignment: { horizontal: 'center', vertical: 'center' } }
    const S8_THIN = { font: A8, border: THIN_BORDER, alignment: { vertical: 'center' } }

    // Helper: merge + set value + style on range
    function sec(ws, r1, c1, r2, c2, val, style, fmt) {
      addMerge(ws, r1, c1, r2, c2)
      setVal(ws, r1, c1, fmt || 's', val)
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) applyStyle(ws, r, c, style)
    }

    // ═══════════════════════════════════════════════════════════════════
    // GUIDELINES (A-S = c0-c18, rows 51-53)
    // ═══════════════════════════════════════════════════════════════════
    const guideTexts = [
      '1. The attendance shall be accomplished daily. Refer to the codes for checking learners\' attendance.',
      '2. Dates shall be written in the columns after Learner\'s Name.',
      '3. To compute the following:'
    ]
    sec(newWs, S, 0, S, 18, 'GUIDELINES:', S8_BOLD_LEFT)
    for (let i = 0; i < 3; i++) sec(newWs, S + 1 + i, 0, S + 1 + i, 18, guideTexts[i], S8_LEFT)

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 3: ATTENDANCE FORMULAS (A-S = c0-c18, rows 55-60)
    // ═══════════════════════════════════════════════════════════════════
    function bottomBorder(ws, r, c1, c2) {
      for (let c = c1; c <= c2; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (!ws[addr]) ws[addr] = { t: 's', v: '' }
        ws[addr].s = { font: A8, border: { bottom: { style: 'medium', color: { rgb: 'FF000000' } } }, alignment: { horizontal: 'center', vertical: 'center' } }
      }
    }
    // Formula A
    sec(newWs, S + 4, 0, S + 5, 3, 'a. Percentage of Enrolment =', S8_LEFT)
    sec(newWs, S + 4, 4, S + 4, 15, 'Registered Learners as of end of the month', S8_CENTER)
    bottomBorder(newWs, S + 4, 4, 15)
    sec(newWs, S + 5, 4, S + 5, 15, 'Enrolment as of 1st Friday of the school year', S8_CENTER)
    sec(newWs, S + 4, 16, S + 5, 18, 'x 100', S8_CENTER)
    // Formula B
    sec(newWs, S + 6, 0, S + 7, 3, 'b. Average Daily Attendance =', S8_LEFT)
    sec(newWs, S + 6, 4, S + 6, 15, 'Total Daily Attendance', S8_CENTER)
    bottomBorder(newWs, S + 6, 4, 15)
    sec(newWs, S + 7, 4, S + 7, 15, 'Number of School Days in reporting month', S8_CENTER)
    // Formula C
    sec(newWs, S + 8, 0, S + 9, 3, 'c. Percentage of Attendance for the month =', S8_LEFT)
    sec(newWs, S + 8, 4, S + 8, 15, 'Average daily attendance', S8_CENTER)
    bottomBorder(newWs, S + 8, 4, 15)
    sec(newWs, S + 9, 4, S + 9, 15, 'Registered Learners as of end of the month', S8_CENTER)
    sec(newWs, S + 8, 16, S + 9, 18, 'x 100', S8_CENTER)
    // Footnote
    sec(newWs, S + 14, 0, S + 17, 18, '*Beginning of School Year cut-off report is every 1st Friday of the School Year', { font: { ...A8, italic: true }, alignment: { horizontal: 'left', vertical: 'center' } })

    // ═══════════════════════════════════════════════════════════════════
    // RIGHT PANEL: CODES (T-AC = c19-c28, rows 50-52)
    // ═══════════════════════════════════════════════════════════════════
    // CODES header
    sec(newWs, S, 19, S, 28, '1. CODES FOR CHECKING ATTENDANCE', S9_BOLD_MED_LEFT)
    // CODES description - wrap text
    addMerge(newWs, S + 1, 19, S + 2, 28)
    setVal(newWs, S + 1, 19, 's', '(blank) - Present; (x) - Absent; ◤ = Tardy; ◢ = Cutting Classes / Half Day')
    for (let r = S + 1; r <= S + 2; r++) for (let c = 19; c <= 28; c++) applyStyle(newWs, r, c, { font: A8, alignment: { horizontal: 'left', vertical: 'center', wrapText: true }, border: THIN_BORDER })

    // ═══════════════════════════════════════════════════════════════════
    // REASONS / CAUSES FOR MLS (T-AC = c19-c28, rows 53-79)
    // ═══════════════════════════════════════════════════════════════════
    // Header (2 rows)
    sec(newWs, S + 3, 19, S + 4, 28, '2. REASONS/CAUSES FOR MLS', S9_BOLD_MED_LEFT)
    // A. Domestic-Related Factors
    sec(newWs, S + 5, 19, S + 5, 28, 'a. Domestic-Related Factors', { font: { ...A8, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } })
    addMerge(newWs, S + 6, 19, S + 9, 28)
    setVal(newWs, S + 6, 19, 's', 'a.1 Had to take care of sibling\na.2 Early marriage/pregnancy\na.3 Parents\' attitude toward schooling\na.4 Family problems')
    for (let r = S + 6; r <= S + 9; r++) for (let c = 19; c <= 28; c++) applyStyle(newWs, r, c, { font: A8, alignment: { horizontal: 'left', vertical: 'center', wrapText: true } })
    // B. Individual-Related Factors (thick top border)
    sec(newWs, S + 10, 19, S + 10, 28, 'b. Individual-Related Factors', { font: { ...A8, bold: true }, alignment: { horizontal: 'left', vertical: 'center' }, border: { top: { style: 'medium', color: { rgb: 'FF000000' } }, bottom: { style: 'thin', color: { rgb: 'FF000000' } }, left: { style: 'thin', color: { rgb: 'FF000000' } }, right: { style: 'thin', color: { rgb: 'FF000000' } } } })
    addMerge(newWs, S + 11, 19, S + 16, 28)
    setVal(newWs, S + 11, 19, 's', 'b.1 Illness\nb.2 Over-age\nb.3 Death\nb.4 Drug Abuse\nb.5 Poor academic performance\nb.6 Lack of interest/Distractions')
    for (let r = S + 11; r <= S + 16; r++) for (let c = 19; c <= 28; c++) applyStyle(newWs, r, c, { font: A8, alignment: { horizontal: 'left', vertical: 'center', wrapText: true } })
    // C. School-Related Factors
    sec(newWs, S + 17, 19, S + 17, 28, 'c. School-Related Factors', { font: { ...A8, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } })
    addMerge(newWs, S + 18, 19, S + 22, 28)
    setVal(newWs, S + 18, 19, 's', 'c.1 Teacher Factor\nc.2 Physical condition of classroom\nc.3 Peer influence')
    for (let r = S + 18; r <= S + 22; r++) for (let c = 19; c <= 28; c++) applyStyle(newWs, r, c, { font: A8, alignment: { horizontal: 'left', vertical: 'top', wrapText: true } })
    // D. Geographic/Environmental
    sec(newWs, S + 23, 19, S + 23, 28, 'd. Geographic/Environmental', { font: { ...A8, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } })
    addMerge(newWs, S + 24, 19, S + 26, 28)
    setVal(newWs, S + 24, 19, 's', 'd.1 Distance between home and school\nd.2 Armed conflict (incl. Tribal wars & clan feuds)\nd.3 Calamities/Disasters')
    for (let r = S + 24; r <= S + 26; r++) for (let c = 19; c <= 28; c++) applyStyle(newWs, r, c, { font: A8, alignment: { horizontal: 'left', vertical: 'center', wrapText: true } })
    // E. Financial-Related
    sec(newWs, S + 27, 19, S + 27, 28, 'e. Financial-Related', { font: { ...A8, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } })
    sec(newWs, S + 28, 19, S + 28, 28, 'e.1 Child labor, work', { font: A8, alignment: { horizontal: 'left', vertical: 'center' } })
    // F. Others
    sec(newWs, S + 29, 19, S + 29, 28, 'f. Others (Specify)', { font: { ...A8, bold: true }, alignment: { horizontal: 'left', vertical: 'center' } })
    // Medium outside border around entire MLS section
    for (let r = S + 3; r <= S + 29; r++) {
      for (let c = 19; c <= 28; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (!newWs[addr]) newWs[addr] = { t: 's', v: '' }
        if (!newWs[addr].s) newWs[addr].s = {}
        const b = newWs[addr].s.border || {}
        newWs[addr].s.border = {
          top: r === S + 3 ? { style: 'medium', color: { rgb: 'FF000000' } } : b.top || { style: 'thin', color: { rgb: 'FF000000' } },
          bottom: r === S + 29 ? undefined : b.bottom || { style: 'thin', color: { rgb: 'FF000000' } },
          left: c === 19 ? { style: 'medium', color: { rgb: 'FF000000' } } : b.left || { style: 'thin', color: { rgb: 'FF000000' } },
          right: c === 28 ? { style: 'medium', color: { rgb: 'FF000000' } } : b.right || { style: 'thin', color: { rgb: 'FF000000' } },
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // GENERATED THROUGH LIS (W-AB = c22-c27, rows 81-82)
    // ═══════════════════════════════════════════════════════════════════
    sec(newWs, S + 31, 22, S + 32, 27, 'Generated thru LIS', { font: A8, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: 'FF000000' } } } })

    // ═══════════════════════════════════════════════════════════════════
    // SUMMARY TABLE (AD-AL = c29-c37, rows 50-73)
    // ═══════════════════════════════════════════════════════════════════
    const S9_BOLD_LEFT_WRAP = { font: { ...A9, bold: true }, alignment: { horizontal: 'left', vertical: 'center', wrapText: true }, border: THIN_BORDER }
    const S9_ITALIC_CENTER = { font: { ...A9, italic: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: THIN_BORDER }
    const S9_ITALIC_CENTER_WRAP = { font: { ...A9, italic: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: THIN_BORDER }
    const S9_BOLD_CENTER = { font: { ...A9, bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: THIN_BORDER }
    const S9_VALUE_CENTER = { font: A9, alignment: { horizontal: 'center', vertical: 'center' }, border: THIN_BORDER }
    const S9_MED_BOTTOM = { font: { ...A9, bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: { bottom: { style: 'medium', color: { rgb: 'FF000000' } } } }
    // Helper: full-border descriptor row (merge AD:AH across r1-r2)
    function descRow(ws, r1, r2, label, style) {
      addMerge(ws, r1, 29, r2, 33)
      setVal(ws, r1, 29, 's', label)
      for (let r = r1; r <= r2; r++) for (let c = 29; c <= 33; c++) applyStyle(ws, r, c, style)
    }
    // Helper: value column (merge AI, AJ, AK:AL each across r1-r2)
    function valCols(ws, r1, r2, m, f, t) {
      for (const [ci, v] of [[34, m], [35, f]]) {
        if (r1 !== r2) addMerge(ws, r1, ci, r2, ci)
        setVal(ws, r1, ci, 'n', v)
        for (let r = r1; r <= r2; r++) applyStyle(ws, r, ci, S9_VALUE_CENTER)
      }
      addMerge(ws, r1, 36, r2, 37)
      setVal(ws, r1, 36, 'n', t)
      for (let r = r1; r <= r2; r++) for (let c = 36; c <= 37; c++) applyStyle(ws, r, c, S9_VALUE_CENTER)
    }
    function applyOuterBorder(ws, r1, c1, r2, c2, style, outer) {
      addMerge(ws, r1, c1, r2, c2)
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) applyStyle(ws, r, c, style)
      if (outer) for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (!ws[addr].s.border) ws[addr].s.border = {}
        ws[addr].s.border.top = r === r1 ? outer.top || outer : ws[addr].s.border.top
        ws[addr].s.border.bottom = r === r2 ? outer.bottom || outer : ws[addr].s.border.bottom
        ws[addr].s.border.left = c === c1 ? outer.left || outer : ws[addr].s.border.left
        ws[addr].s.border.right = c === c2 ? outer.right || outer : ws[addr].s.border.right
      }
    }
    // Header rows (50-51): Month + No. of Days + Summary
    sec(newWs, S, 29, S + 1, 31, `Month : ${monthName}`, { font: { ...A9, bold: true }, alignment: { horizontal: 'left', vertical: 'center' }, border: THIN_BORDER })
    sec(newWs, S, 32, S + 1, 33, `No. of Days of Classes: ${numDateCols}`, S9_BOLD_LEFT_WRAP)
    sec(newWs, S, 34, S, 37, 'Summary', { font: { ...A9, bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: THIN_BORDER })
    // Column headers (row 51): M | F | TOTAL with thin + medium bottom border
    const S9_MED_BOTTOM_FULL = { font: { ...A9, bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin', color: { rgb: 'FF000000' } }, bottom: { style: 'medium', color: { rgb: 'FF000000' } }, left: { style: 'thin', color: { rgb: 'FF000000' } }, right: { style: 'thin', color: { rgb: 'FF000000' } } } }
    sec(newWs, S + 1, 34, S + 1, 34, 'M', S9_MED_BOTTOM_FULL)
    sec(newWs, S + 1, 35, S + 1, 35, 'F', S9_MED_BOTTOM_FULL)
    sec(newWs, S + 1, 36, S + 1, 37, 'TOTAL', S9_MED_BOTTOM_FULL)
    // Data rows
    // Enrollment (rows 52-53)
    descRow(newWs, S + 2, S + 3, '* Enrollment as of (1st Friday of the SY)', { font: A9, alignment: { horizontal: 'left', vertical: 'center', wrapText: true }, border: THIN_BORDER })
    valCols(newWs, S + 2, S + 3, initM, initF, initT)
    // Late enrolment (rows 54-56)
    setVal(newWs, S + 4, 29, 's', 'Late enrolment during the month')
    applyOuterBorder(newWs, S + 4, 29, S + 6, 33, { font: { name: 'Arial', sz: 9 }, alignment: { horizontal: 'center', vertical: 'center' } })
    applyOuterBorder(newWs, S + 4, 29, S + 6, 33, { font: { name: 'Arial', sz: 9 }, alignment: { horizontal: 'center', vertical: 'center' } }, MEDIUM_BORDER)
    // Value columns are merged down through the late-enrolment/beyond-cut-off block.
    const noBorderCenter = { font: { name: 'Arial', sz: 9 }, alignment: { horizontal: 'center', vertical: 'center' } }
    for (const [ci, v] of [[34, lateM], [35, lateF]]) {
      if (S + 4 !== S + 8) addMerge(newWs, S + 4, ci, S + 8, ci)
      setVal(newWs, S + 4, ci, 'n', v)
      for (let r = S + 4; r <= S + 8; r++) applyStyle(newWs, r, ci, noBorderCenter)
    }
    addMerge(newWs, S + 4, 36, S + 8, 37)
    setVal(newWs, S + 4, 36, 'n', lateM + lateF)
    for (let r = S + 4; r <= S + 8; r++) for (let c = 36; c <= 37; c++) applyStyle(newWs, r, c, noBorderCenter)
    // (beyond cut-off) rows 57-58
    descRow(newWs, S + 7, S + 8, '(beyond cut-off)', { font: { name: 'Arial', sz: 9, italic: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } })
    // Registered Learners (rows 59-60)
    descRow(newWs, S + 9, S + 10, 'Registered Learners as of end of month', S9_ITALIC_CENTER_WRAP)
    valCols(newWs, S + 9, S + 10, maleCount, femaleCount, maleCount + femaleCount)
    // Percentage of Enrolment (rows 61-62)
    const pctEnrM = initM > 0 ? Math.round(maleCount / initM * 100) : 0
    const pctEnrF = initF > 0 ? Math.round(femaleCount / initF * 100) : 0
    const pctEnrT = initT > 0 ? Math.round((maleCount + femaleCount) / initT * 100) : 0
    descRow(newWs, S + 11, S + 12, 'Percentage of Enrolment as of end of month', S9_ITALIC_CENTER_WRAP)
    valCols(newWs, S + 11, S + 12, `${pctEnrM}%`, `${pctEnrF}%`, `${pctEnrT}%`)
    // ADA (rows 63-64)
    descRow(newWs, S + 13, S + 14, 'Average Daily Attendance', S9_ITALIC_CENTER)
    valCols(newWs, S + 13, S + 14, mADA, fADA, tADA)
    // Percentage of Attendance (row 65)
    const pctAttM2 = sd.pct_m != null ? sd.pct_m : mPct
    const pctAttF2 = sd.pct_f != null ? sd.pct_f : fPct
    const pctAttT2 = sd.pct_t != null ? sd.pct_t : tPct
    descRow(newWs, S + 15, S + 15, 'Percentage of Attendance for the month', { font: { name: 'Arial', sz: 8, italic: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: THIN_BORDER })
    valCols(newWs, S + 15, S + 15, pctAttM2, pctAttF2, pctAttT2)
    // Number of students absent for 5 consecutive days (rows 60-61)
    descRow(newWs, S + 16, S + 17, 'Number of students absent for 5 consecutive days', { font: { name: 'Arial', sz: 8, italic: true }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: THIN_BORDER })
    valCols(newWs, S + 16, S + 17, 0, 0, 0)
    // NLS (row 62)
    const nlsM2 = sd.nls_m != null ? sd.nls_m : 0
    const nlsF2 = sd.nls_f != null ? sd.nls_f : 0
    const nlsT2 = sd.nls_t != null ? sd.nls_t : 0
    descRow(newWs, S + 18, S + 18, 'NLS', S9_BOLD_CENTER)
    valCols(newWs, S + 18, S + 18, nlsM2, nlsF2, nlsT2)
    // Transferred out (rows 63-64)
    const toM2 = sd.transfer_out_m != null ? sd.transfer_out_m : 0
    const toF2 = sd.transfer_out_f != null ? sd.transfer_out_f : 0
    const toT2 = sd.transfer_out_t != null ? sd.transfer_out_t : 0
    descRow(newWs, S + 19, S + 20, 'Transferred out', { font: { name: 'Arial', sz: 9, bold: true }, alignment: { horizontal: 'center', vertical: 'center' } })
    valCols(newWs, S + 19, S + 20, toM2, toF2, toT2)
    // Transferred in (rows 65-66)
    const tiM2 = sd.transfer_in_m != null ? sd.transfer_in_m : 0
    const tiF2 = sd.transfer_in_f != null ? sd.transfer_in_f : 0
    const tiT2 = sd.transfer_in_t != null ? sd.transfer_in_t : 0
    descRow(newWs, S + 21, S + 22, 'Transferred in', S9_BOLD_CENTER)
    valCols(newWs, S + 21, S + 22, tiM2, tiF2, tiT2)
    // Apply full grid to summary range (rows 50-72), then override per spec
    for (let r = S; r <= S + 23; r++) {
      for (let c = 29; c <= 37; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (!newWs[addr]) newWs[addr] = { t: 's', v: '' }
        if (!newWs[addr].s) newWs[addr].s = { font: A9, alignment: { vertical: 'center' }, border: THIN_BORDER }
        else if (!newWs[addr].s.border) newWs[addr].s.border = THIN_BORDER
        // Medium top border on first row
        if (r === S) newWs[addr].s.border.top = { style: 'medium', color: { rgb: 'FF000000' } }
        // Medium left/right on desc column (c29, c33) for rows 64-71
        if (r >= S + 15 && c === 29) newWs[addr].s.border.left = { style: 'medium', color: { rgb: 'FF000000' } }
        if (r >= S + 15 && c === 33) newWs[addr].s.border.right = { style: 'medium', color: { rgb: 'FF000000' } }
        // Medium right on TOTAL column (c37) for content rows (skip last cell to avoid overlap)
        if (c === 37 && r < S + 22) newWs[addr].s.border.right = { style: 'medium', color: { rgb: 'FF000000' } }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // CERTIFICATION + SIGNATURES
    // ═══════════════════════════════════════════════════════════════════
    const A8_ITALIC_LEFT = { font: { name: 'Arial', sz: 8, italic: true }, alignment: { horizontal: 'left', vertical: 'center' } }
    const A8_CENTER = { font: { name: 'Arial', sz: 8 }, alignment: { horizontal: 'center', vertical: 'center' } }
    const A8_BOLD_CENTER = { font: { name: 'Arial', sz: 8, bold: true }, alignment: { horizontal: 'center', vertical: 'center' } }
    const A8_CENTER_ITALIC = { font: { name: 'Arial', sz: 8, italic: true }, alignment: { horizontal: 'left', vertical: 'center' } }
    const MED_TOP_BORDER = { border: { top: { style: 'medium', color: { rgb: 'FF000000' } } } }
    // Certification text (rows 73-74, AD74:AK75)
    sec(newWs, S + 23, 29, S + 24, 36, 'I certify that this is a true and correct report.', A8_ITALIC_LEFT)
    // Remove border from cell beside certification text (AL)
    for (let r = S + 23; r <= S + 24; r++) {
      const addr = XLSX.utils.encode_cell({ r, c: 37 })
      if (newWs[addr] && newWs[addr].s) delete newWs[addr].s.border
    }
    // Adviser name (row 76, AE77:AK77) with signature line
    sec(newWs, S + 26, 30, S + 26, 36, (adviser || 'LEEVIN JONES O. GOYAO').toUpperCase(), { ...A8_CENTER, border: { bottom: { style: 'medium', color: { rgb: 'FF000000' } } } })
    // Adviser signature + designation (row 77, AE78:AK78)
    sec(newWs, S + 27, 30, S + 27, 36, '(Signature of Adviser over Printed Name)', A8_CENTER)
    // Attested by (row 79, AD80)
    sec(newWs, S + 29, 29, S + 29, 29, 'Attested by:', A8_ITALIC_LEFT)
    // School head name (row 80, AE81:AK81) with signature line
    sec(newWs, S + 30, 30, S + 30, 36, 'MRS. MYRNA KAY - AN', { ...A8_BOLD_CENTER, border: { bottom: { style: 'medium', color: { rgb: 'FF000000' } } } })
    // School head signature + designation (row 81, AE82:AK82)
    sec(newWs, S + 31, 30, S + 31, 36, '(Signature of School Head over Printed Name)', A8_CENTER)

    // Extend !ref to cover full section
    newWs['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: S + 40, c: 37 } })

    // Replace the workbook sheet with our fresh worksheet
    wb.Sheets[wb.SheetNames[sheetIndex]] = newWs

    // ── Write output ──
    const outFileName = `SF2_${sheetName}_${year || '2025'}.xlsx`
    const outDir = path.join(process.cwd(), 'exports')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    const outPath = path.join(outDir, outFileName)

    XLSX.writeFile(wb, outPath, { bookType: 'xlsx', type: 'file', cellStyles: true })

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
