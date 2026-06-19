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
    const SUMMARY_STYLE = {
      font: { name: 'Calibri', sz: 9 },
      alignment: { horizontal: 'left', vertical: 'center' }
    }
    const DATA_STYLE = {
      font: { name: 'Calibri', sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: MEDIUM_BORDER,
      fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' }
    }
    const PLAIN_LEFT_STYLE = {
      font: { name: 'Calibri', sz: 11 },
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

    // ── Set column widths ──
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
    sec(newWs, 50, 0, 50, 18, 'GUIDELINES:', S8_BOLD_LEFT)
    for (let i = 0; i < 3; i++) sec(newWs, 51 + i, 0, 51 + i, 18, guideTexts[i], S8_LEFT)

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 3: ATTENDANCE FORMULAS (A-S = c0-c18, rows 55-60)
    // ═══════════════════════════════════════════════════════════════════
    function bottomBorder(ws, r, c1, c2) {
      for (let c = c1; c <= c2; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (!ws[addr]) ws[addr] = { t: 's', v: '' }
        ws[addr].s = { font: A8, border: { bottom: { style: 'thin', color: { rgb: 'FF000000' } } }, alignment: { horizontal: 'center', vertical: 'center' } }
      }
    }
    // Formula A
    sec(newWs, 54, 0, 55, 3, 'a. Percentage of Enrolment =', S8_LEFT)
    sec(newWs, 54, 4, 54, 15, 'Registered Learners as of end of the month', S8_CENTER)
    bottomBorder(newWs, 54, 4, 15)
    sec(newWs, 55, 4, 55, 15, 'Enrolment as of 1st Friday of the school year', S8_CENTER)
    sec(newWs, 54, 16, 55, 18, 'x 100', S8_CENTER)
    // Formula B
    sec(newWs, 56, 0, 57, 3, 'b. Average Daily Attendance =', S8_LEFT)
    sec(newWs, 56, 4, 56, 15, 'Total Daily Attendance', S8_CENTER)
    bottomBorder(newWs, 56, 4, 15)
    sec(newWs, 57, 4, 57, 15, 'Number of School Days in reporting month', S8_CENTER)
    // Formula C
    sec(newWs, 58, 0, 59, 3, 'c. Percentage of Attendance for the month =', S8_LEFT)
    sec(newWs, 58, 4, 58, 15, 'Average daily attendance', S8_CENTER)
    bottomBorder(newWs, 58, 4, 15)
    sec(newWs, 59, 4, 59, 15, 'Registered Learners as of end of the month', S8_CENTER)
    sec(newWs, 58, 16, 59, 18, 'x 100', S8_CENTER)
    // Footnote
    sec(newWs, 64, 0, 67, 18, '*Beginning of School Year cut-off report is every 1st Friday of the School Year', { font: { ...A8, italic: true }, alignment: { horizontal: 'left', vertical: 'center' }, border: MEDIUM_BORDER })

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 4: CODES (J-S = c9-c18, rows 70-79)
    // ═══════════════════════════════════════════════════════════════════
    const codesText = [
      '(blank) - Present', 'X - Absent', 'T - Tardy (half day)', 'C - Cutting Classes',
      'H - Holiday', 'V - Vacation', 'E - Educational Trip', 'D - Disaster', 'O - Other Authorized Activity'
    ]
    sec(newWs, 69, 9, 69, 18, '1. CODES FOR CHECKING ATTENDANCE', { font: { ...A8, bold: true }, border: THIN_BORDER, alignment: { horizontal: 'left', vertical: 'center' } })
    for (let i = 0; i < codesText.length; i++) sec(newWs, 70 + i, 9, 70 + i, 18, codesText[i], S8_LEFT)
    // ═══════════════════════════════════════════════════════════════════
    // SECTION 5: REASONS/CAUSES FOR MLS (J-S = c9-c18, rows 81+)
    // ═══════════════════════════════════════════════════════════════════
    sec(newWs, 80, 9, 80, 18, '2. REASONS/CAUSES FOR MLS', { font: { ...A8, bold: true }, border: THIN_BORDER, alignment: { horizontal: 'left', vertical: 'center' } })
    sec(newWs, 81, 9, 81, 18, 'A. Domestic-Related Factors', S8_BOLD_LEFT)
    const dom = ['a.1 Had to take care of sibling', 'a.2 Early marriage/pregnancy', 'a.3 Family problems', 'a.4 Family mobility', 'a.5 Other domestic-related factors']
    for (let i = 0; i < dom.length; i++) sec(newWs, 82 + i, 9, 82 + i, 18, dom[i], S8_LEFT)
    sec(newWs, 88, 9, 88, 18, 'B. Individual-Related Factors', S8_BOLD_LEFT)
    const ind = ['b.1 Illness', 'b.2 Over-age', 'b.3 Death', 'b.4 Drug Abuse', 'b.5 Poor academic performance', 'b.6 Lack of interest/distraction']
    for (let i = 0; i < ind.length; i++) sec(newWs, 89 + i, 9, 89 + i, 18, ind[i], S8_LEFT)
    sec(newWs, 96, 9, 96, 18, 'C. School-Related Factors', S8_BOLD_LEFT)
    for (let i = 0; i < 3; i++) sec(newWs, 97 + i, 9, 97 + i, 18, ['c.1 Teacher Factor', 'c.2 Physical condition of classroom', 'c.3 Peer influence'][i], S8_LEFT)
    sec(newWs, 101, 9, 101, 18, 'D. Geographic/Environmental', S8_BOLD_LEFT)
    const geo = ['d.1 Distance between home and school', 'd.2 Armed conflict (including tribal wars/conflict)', 'd.3 Presence of disasters']
    for (let i = 0; i < geo.length; i++) sec(newWs, 102 + i, 9, 102 + i, 18, geo[i], S8_LEFT)
    sec(newWs, 106, 9, 106, 18, 'E. Financial-Related Factors', S8_BOLD_LEFT)
    sec(newWs, 107, 9, 107, 18, 'e.1 Child labor/work', S8_LEFT)
    sec(newWs, 109, 9, 109, 18, 'F. Others (Specify)', S8_BOLD_LEFT)
    // Generated through LIS
    sec(newWs, 113, 11, 114, 13, 'Generated through LIS', S8_THIN)

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 5: MONTHLY SUMMARY TABLE (far right: c19-c39)
    // ═══════════════════════════════════════════════════════════════════
    // Header row: Description | M | F | TOTAL
    sec(newWs, 49, 19, 49, 31, 'Description', S9_GRAY_THIN)
    sec(newWs, 49, 32, 49, 32, 'M', S9_GRAY_THIN)
    sec(newWs, 49, 33, 49, 33, 'F', S9_GRAY_THIN)
    sec(newWs, 49, 34, 49, 36, 'TOTAL', S9_GRAY_THIN)

    // No. of Days of Classes
    sec(newWs, 50, 19, 50, 39, `No. of Days of Classes: ${numDateCols}`, S9_THIN)

    // Summary data rows
    const summaryLabels = [
      { label: 'Enrollment as of 1st Friday of the School Year', r: 52, keyM: 'enr_m', keyF: 'enr_f', keyT: 'enr_t', defM: initM, defF: initF, defT: initT },
      { label: 'Late Enrollment during the month', r: 54, keyM: null, keyF: null, keyT: null, defM: lateM, defF: lateF, defT: lateM + lateF },
      { label: 'Registered Learners as of end of the month', r: 58, keyM: 'reg_m', keyF: 'reg_f', keyT: 'reg_t', defM: maleCount, defF: femaleCount, defT: maleCount + femaleCount },
      { label: 'Percentage of Enrollment as of end of the month', r: 60, keyM: 'pct_enr_m', keyF: 'pct_enr_f', keyT: 'pct_enr_t', defM: initM > 0 ? Math.round(maleCount / initM * 100) : 0, defF: initF > 0 ? Math.round(femaleCount / initF * 100) : 0, defT: initT > 0 ? Math.round((maleCount + femaleCount) / initT * 100) : 0 },
      { label: 'Average Daily Attendance', r: 62, keyM: 'ada_m', keyF: 'ada_f', keyT: 'ada_t', defM: mADA, defF: fADA, defT: tADA },
      { label: 'Percentage of Attendance for the month', r: 63, keyM: 'pct_m', keyF: 'pct_f', keyT: 'pct_t', defM: mPct, defF: fPct, defT: tPct },
      { label: 'MLS', r: 65, keyM: 'nls_m', keyF: 'nls_f', keyT: 'nls_t', defM: 0, defF: 0, defT: 0 },
      { label: 'Transferred Out', r: 67, keyM: 'transfer_out_m', keyF: 'transfer_out_f', keyT: 'transfer_out_t', defM: 0, defF: 0, defT: 0 },
      { label: 'Transferred In', r: 69, keyM: 'transfer_in_m', keyF: 'transfer_in_f', keyT: 'transfer_in_t', defM: 0, defF: 0, defT: 0 },
    ]
    for (const s of summaryLabels) {
      const mVal = s.keyM ? (sd[s.keyM] != null ? sd[s.keyM] : s.defM) : s.defM
      const fVal = s.keyF ? (sd[s.keyF] != null ? sd[s.keyF] : s.defF) : s.defF
      const tVal = s.keyT ? (sd[s.keyT] != null ? sd[s.keyT] : s.defT) : s.defT
      sec(newWs, s.r, 19, s.r, 31, s.label, S9_THIN)
      sec(newWs, s.r, 32, s.r, 32, '', S9_CENTER_THIN)
      setVal(newWs, s.r, 32, 'n', mVal)
      sec(newWs, s.r, 33, s.r, 33, '', S9_CENTER_THIN)
      setVal(newWs, s.r, 33, 'n', fVal)
      sec(newWs, s.r, 34, s.r, 34, '', S9_CENTER_THIN)
      setVal(newWs, s.r, 34, 'n', tVal)
      for (let c = 35; c <= 39; c++) applyStyle(newWs, s.r, c, S9_CENTER_THIN)
    }

    // ═══════════════════════════════════════════════════════════════════
    // SECTION 6: CERTIFICATION + SIGNATURES
    // ═══════════════════════════════════════════════════════════════════
    const certRow = 117
    sec(newWs, certRow, 0, certRow, 39, 'I certify that this is a true and correct report.', S9_LEFT)
    sec(newWs, certRow + 2, 0, certRow + 2, 39, '___________________________________', S9_CENTER)
    const advRow = certRow + 2
    setVal(newWs, advRow, 0, 's', '___________________________________')
    applyStyle(newWs, advRow, 0, S9_CENTER)
    sec(newWs, advRow + 1, 0, advRow + 1, 39, '(Signature of Adviser over Printed Name)', S9_CENTER)

    const headRow = advRow + 4
    sec(newWs, headRow, 0, headRow, 39, '___________________________________', S9_CENTER)
    sec(newWs, headRow + 1, 0, headRow + 1, 39, '(Signature of School Head over Printed Name)', S9_CENTER)

    // Extend !ref to cover full section
    newWs['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: headRow + 5, c: 39 } })

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
