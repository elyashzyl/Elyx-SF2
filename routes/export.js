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
    const { sheetName, entries, month, year, grade, section, templatePath, summary_data, excluded_dates } = req.body
    if (!sheetName) return res.status(400).json({ error: 'sheetName is required' })
    if (!entries || !entries.length) return res.status(400).json({ error: 'No entries provided' })

    const tp = resolveTemplate(templatePath)
    if (!tp) return res.status(400).json({ error: 'Template file not found' })

    const wb = XLSX.readFile(tp, { cellStyles: true })
    const sheetIndex = wb.SheetNames.indexOf(sheetName)
    if (sheetIndex === -1) return res.status(400).json({ error: `Sheet "${sheetName}" not found in template` })

    const ws = wb.Sheets[wb.SheetNames[sheetIndex]]
    if (!ws['!ref']) return res.status(400).json({ error: 'Sheet is empty' })

    // Preserve the summary/footer section (r:50+) from the template
    // Rows where we'll apply our own T-AC (c19-c28) merges — exclude these from preservation
    const SUMMARY_MERGE_ROWS = [50, 52, 54, 58, 60, 62, 63, 64, 65, 67, 69]
    function inSummaryMergeRange(row, col) {
      return SUMMARY_MERGE_ROWS.includes(row) && col >= 19 && col <= 28
    }
    const preservedCells = {}
    const preservedMerges = (ws['!merges'] || []).filter(m => {
      if (m.s.r < 50) return false
      // Exclude any merge that overlaps with our T-AC range on summary rows
      for (const rw of SUMMARY_MERGE_ROWS) {
        if (rw >= m.s.r && rw <= m.e.r && !(19 > m.e.c || 28 < m.s.c)) return false
      }
      return true
    })
    for (const key of Object.keys(ws)) {
      if (key === '!ref' || key === '!merges' || key === '!cols' || key === '!rows' || key === '!autofilter') continue
      const cell = ws[key]
      const match = key.match(/^([A-Z]+)(\d+)$/)
      if (match) {
        const row = parseInt(match[2], 10) - 1
        if (row >= 50) preservedCells[key] = JSON.parse(JSON.stringify(cell))
      }
    }

    // Build a fresh worksheet for rows 0-49
    const newWs = {}
    newWs['!merges'] = JSON.parse(JSON.stringify(preservedMerges))
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
      font: { name: 'Calibri', sz: 11, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: THIN_BORDER,
      fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }
    }
    const LABEL_STYLE = {
      font: { name: 'Calibri', sz: 11 },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: THIN_BORDER,
      fill: { fgColor: { rgb: 'D9D9D9' }, patternType: 'solid' }
    }
    const PLAIN_LABEL_STYLE = {
      font: { name: 'Calibri', sz: 11 },
      alignment: { horizontal: 'right', vertical: 'center' }
    }
    const TITLE_STYLE = {
      font: { name: 'Calibri', sz: 12, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {}
    }
    const SUBTITLE_STYLE = {
      font: { name: 'Calibri', sz: 9, italic: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {}
    }
    const TABLE_HEADER_STYLE = {
      font: { name: 'Calibri', sz: 11, bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: MEDIUM_BORDER,
      fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }
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
    addMerge(newWs, COL_HEADER_ROW, 0, COL_HEADER_ROW + 2, 1)
    setVal(newWs, COL_HEADER_ROW, 0, 's', 'No.')
    addMerge(newWs, COL_HEADER_ROW, 2, COL_HEADER_ROW + 2, 3)
    setVal(newWs, COL_HEADER_ROW, 2, 's', 'NAME\n(Last Name, First Name, Middle Name)')

    // Total for the at r:6, c29-c32
    addMerge(newWs, COL_HEADER_ROW, 29, COL_HEADER_ROW, 32)
    setVal(newWs, COL_HEADER_ROW, 29, 's', 'Total for the')

    // REMARKS at r:6, c33-c37, merging down
    addMerge(newWs, COL_HEADER_ROW, 33, COL_HEADER_ROW + 2, 37)
    setVal(newWs, COL_HEADER_ROW, 33, 's', 'REMARKS\n(If NLS, state reason, please refer to legend number 2. If TRANSFERRED IN/OUT, write the name of School.)')

    // Date section header at r:6, c4-c28 (E-AC)
    addMerge(newWs, COL_HEADER_ROW, 4, COL_HEADER_ROW, 28)
    setVal(newWs, COL_HEADER_ROW, 4, 's', '')

    // ABSENT / PRESENT labels on the date rows
    // r:7 (date numbers row) has Month | label and absent/present columns
    // r:8 (day abbreviations row) has ABSENT/PRESENT labels

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

    // Build dateColMap first (used everywhere)
    for (let ci = 0; ci < numDateCols; ci++)
      dateColMap[schoolDays[ci].day] = DATE_COL_START + ci

    // Date headers at r:7 (date numbers) and r:8 (day abbreviations)
    const DATE_NUM_ROW = 7
    const DATE_ABBR_ROW = 8

    // Write month and class days count in date header row (r:7)
    addMerge(newWs, DATE_NUM_ROW, 29, DATE_NUM_ROW, 31)  // AD-AF
    setVal(newWs, DATE_NUM_ROW, 29, 's', 'Month')
    setVal(newWs, DATE_NUM_ROW, 32, 'n', numDateCols)

    // Write ABSENT / PRESENT labels on day abbreviation row (r:8)
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
      [COL_HEADER_ROW, 0, COL_HEADER_ROW + 2, 1],     // No.
      [COL_HEADER_ROW, 2, COL_HEADER_ROW + 2, 3],     // NAME
      [COL_HEADER_ROW, 4, COL_HEADER_ROW, 28],        // Date section header (E7:AC7)
      [COL_HEADER_ROW, 29, COL_HEADER_ROW, 32],       // Total for the
      [COL_HEADER_ROW, 33, COL_HEADER_ROW + 2, 37],   // REMARKS
      [DATE_NUM_ROW, 29, DATE_NUM_ROW, 31],           // Month | (AD-AF merged)
      [DATE_NUM_ROW, 32, DATE_NUM_ROW, 32],           // numDateCols
      [DATE_ABBR_ROW, 29, DATE_ABBR_ROW, 29],         // ABSENT
      [DATE_ABBR_ROW, 30, DATE_ABBR_ROW, 32],         // PRESENT (AE-AG merged)
    ]
    if (numDateCols > 0) {
      tableRanges.push([DATE_NUM_ROW, DATE_COL_START, DATE_NUM_ROW, DATE_COL_START + numDateCols - 1])
      tableRanges.push([DATE_ABBR_ROW, DATE_COL_START, DATE_ABBR_ROW, DATE_COL_START + numDateCols - 1])
    }
    for (const [r1, c1, r2, c2] of tableRanges) {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          applyStyle(newWs, r, c, TABLE_HEADER_STYLE)
        }
      }
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
    // Student data starts at row 9 (Excel Row 10)
    let nextRow = 9
    const maleSectionStart = nextRow
    nextRow += maleCount
    const maleSectionEnd = nextRow - 1
    const maleTotalRow = nextRow++
    const femaleSectionStart = femaleCount > 0 ? nextRow : -1
    nextRow += femaleCount
    const femaleSectionEnd = femaleCount > 0 ? nextRow - 1 : -1
    const femaleTotalRow = nextRow++
    const combinedTotalRow = nextRow++

    const clearEnd = Math.min(Math.max(combinedTotalRow + 5, 55), 49)
    for (let r = 9; r <= clearEnd; r++) clearRowData(r)

    // Reset !ref to prevent xlsx from writing empty cells from template range
    newWs['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(clearEnd, 70), c: 37 } })

    // ── Helpers ──
    function calcEntryPresent(entry) {
      let p = 0
      for (const [dayStr, s] of Object.entries(entry.days || {})) {
        if (dateColMap[parseInt(dayStr, 10)] === undefined) continue
        if (s === 'E') p++
        else if (s === '◤' || s === '◢' || s === 'T' || s === 'H') p += 0.5
      }
      return p
    }
    function sumAbsent(el) { return el.reduce((s, e) => s + (e.absent || 0), 0) }
    function sumPresent(el) { return el.reduce((s, e) => s + calcEntryPresent(e), 0) }
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
        setVal(newWs, row, col, 's', status === 'T' ? '◤' : status === 'H' ? '◢' : status)
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
          setVal(newWs, row, col, 's', status === 'T' ? '◤' : status === 'H' ? '◢' : status)
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

    // ── Extend E-AC borders to table body rows (skip label rows only) ──
    const bodyRows = []
    for (let r = maleSectionStart; r <= maleTotalRow; r++) bodyRows.push(r)
    if (femaleCount > 0) {
      for (let r = femaleSectionStart; r <= femaleTotalRow; r++) bodyRows.push(r)
    }
    bodyRows.push(combinedTotalRow)
    for (const r of bodyRows) {
      for (let c = 0; c <= 37; c++) {
        applyStyle(newWs, r, c, TABLE_HEADER_STYLE)
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

    // ── Update summary section ──
    const SUMMARY_COL_M = 34  // AI
    const SUMMARY_COL_F = 35  // AJ
    const SUMMARY_COL_T = 36  // AK

    // "No. of Days of Classes: N" at row 51 (template AG51)
    setVal(newWs, 50, 32, 's', `No. of Days of Classes: ${numDateCols}`)

    // Row 53: Enrolment = total − late (initial count)
    // Row 55: Late enrolment
    // Row 59: Registered Learners = total students
    // Row 61: % of Enrolment = Registered / Enrolment × 100
    // Row 63: ADA = Total Present / School Days
    // Row 64: % of Attendance = ADA / Registered × 100
    // Row 65: Absent 5+
    // Row 66: NLS
    // Row 68: Transferred out
    // Row 70: Transferred in
    const lateM = sd.late_m != null ? sd.late_m : 0
    const lateF = sd.late_f != null ? sd.late_f : 0
    const initM = maleCount - lateM
    const initF = femaleCount - lateF
    const initT = initM + initF
    // Row 53: Enrolment
    setVal(newWs, 52, SUMMARY_COL_M, 'n', sd.enr_m != null ? sd.enr_m : initM)
    setVal(newWs, 52, SUMMARY_COL_F, 'n', sd.enr_f != null ? sd.enr_f : initF)
    setVal(newWs, 52, SUMMARY_COL_T, 'n', sd.enr_t != null ? sd.enr_t : initT)

    // Row 55: Late enrolment
    setVal(newWs, 54, SUMMARY_COL_M, 'n', lateM)
    setVal(newWs, 54, SUMMARY_COL_F, 'n', lateF)
    setVal(newWs, 54, SUMMARY_COL_T, 'n', lateM + lateF)

    // Row 59: Registered Learners
    setVal(newWs, 58, SUMMARY_COL_M, 'n', sd.reg_m != null ? sd.reg_m : maleCount)
    setVal(newWs, 58, SUMMARY_COL_F, 'n', sd.reg_f != null ? sd.reg_f : femaleCount)
    setVal(newWs, 58, SUMMARY_COL_T, 'n', sd.reg_t != null ? sd.reg_t : maleCount + femaleCount)

    // Row 61: Percentage of Enrolment
    setVal(newWs, 60, SUMMARY_COL_M, 'n', sd.pct_enr_m != null ? sd.pct_enr_m : (initM > 0 ? Math.round(maleCount / initM * 100) : 0))
    setVal(newWs, 60, SUMMARY_COL_F, 'n', sd.pct_enr_f != null ? sd.pct_enr_f : (initF > 0 ? Math.round(femaleCount / initF * 100) : 0))
    setVal(newWs, 60, SUMMARY_COL_T, 'n', sd.pct_enr_t != null ? sd.pct_enr_t : (initT > 0 ? Math.round((maleCount + femaleCount) / initT * 100) : 0))

    // Row 63: Average Daily Attendance
    setVal(newWs, 62, SUMMARY_COL_M, 'n', sd.ada_m != null ? sd.ada_m : mADA)
    setVal(newWs, 62, SUMMARY_COL_F, 'n', sd.ada_f != null ? sd.ada_f : fADA)
    setVal(newWs, 62, SUMMARY_COL_T, 'n', sd.ada_t != null ? sd.ada_t : tADA)

    // Row 64: Percentage of Attendance
    setVal(newWs, 63, SUMMARY_COL_M, 'n', sd.pct_m != null ? sd.pct_m : mPct)
    setVal(newWs, 63, SUMMARY_COL_F, 'n', sd.pct_f != null ? sd.pct_f : fPct)
    setVal(newWs, 63, SUMMARY_COL_T, 'n', sd.pct_t != null ? sd.pct_t : tPct)

    // Row 65: Number of students absent for 5 consecutive days (template AI65)
    const abs5m = sd.abs5_m != null ? sd.abs5_m : 0
    const abs5f = sd.abs5_f != null ? sd.abs5_f : 0
    const abs5t = sd.abs5_t != null ? sd.abs5_t : 0
    setVal(newWs, 64, SUMMARY_COL_M, 'n', abs5m)
    setVal(newWs, 64, SUMMARY_COL_F, 'n', abs5f)
    setVal(newWs, 64, SUMMARY_COL_T, 'n', abs5t)

    // Row 66: NLS (template AI66)
    setVal(newWs, 65, SUMMARY_COL_M, 'n', sd.nls_m ?? 0)
    setVal(newWs, 65, SUMMARY_COL_F, 'n', sd.nls_f ?? 0)
    setVal(newWs, 65, SUMMARY_COL_T, 'n', sd.nls_t ?? 0)

    // Row 68: Transferred out (template AI68)
    setVal(newWs, 67, SUMMARY_COL_M, 'n', sd.transfer_out_m ?? 0)
    setVal(newWs, 67, SUMMARY_COL_F, 'n', sd.transfer_out_f ?? 0)
    setVal(newWs, 67, SUMMARY_COL_T, 'n', sd.transfer_out_t ?? 0)

    // Row 70: Transferred in (template AI70)
    setVal(newWs, 69, SUMMARY_COL_M, 'n', sd.transfer_in_m ?? 0)
    setVal(newWs, 69, SUMMARY_COL_F, 'n', sd.transfer_in_f ?? 0)
    setVal(newWs, 69, SUMMARY_COL_T, 'n', sd.transfer_in_t ?? 0)

    // ── Set column widths (merged header areas span multiple date-cols) ──
    const cols = []
    for (let c = 0; c <= 40; c++) {
      if (c === 0) cols[c] = { wch: 15 }  // Labels (School ID, Name of School) + No.
      else if (c === NAME_COL) cols[c] = { wch: 30 }
      else if (c === 3) cols[c] = { wch: 4 }
      else if (c >= DATE_COL_START && c < DATE_COL_START + MAX_DATE_COLS) cols[c] = { wch: 3 }
      else if (c === 26) cols[c] = { wch: 8 }
      else if (c === 27) cols[c] = { wch: 4 }
      else if (c === 28) cols[c] = { wch: 4 }
      else if (c === 29) cols[c] = { wch: 20 }  // Section value
      else if (c === REMARKS_COL) cols[c] = { wch: 18 }
      else cols[c] = { wch: 4 }
    }
    newWs['!cols'] = cols

    // Set row heights for student rows (match column width for square cells)
    const rows = []
    for (let r = maleSectionStart; r <= maleSectionEnd; r++) rows[r] = { hpt: 16 }
    for (let r = femaleSectionStart; r <= femaleSectionEnd && r >= 0; r++) rows[r] = { hpt: 16 }
    newWs['!rows'] = rows

    // Copy preserved template summary cells back into the new worksheet
    for (const [key, cell] of Object.entries(preservedCells)) {
      newWs[key] = cell
    }

    // ── Merge T-AC (c19-c28) on summary rows with borders (after preserved copy) ──
    for (const r of SUMMARY_MERGE_ROWS) {
      addMerge(newWs, r, 19, r, 28)
      for (let c = 19; c <= 28; c++) {
        applyStyle(newWs, r, c, TABLE_HEADER_STYLE)
      }
    }

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
