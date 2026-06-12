import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { grade, section, gender } = req.query
  let sql = 'SELECT * FROM students'
  const params = []
  const conditions = []

  if (grade) {
    conditions.push('grade = ?')
    params.push(grade)
  }
  if (section) {
    conditions.push('section LIKE ?')
    params.push(`%${section}%`)
  }
  if (gender) {
    conditions.push('gender = ?')
    params.push(gender)
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }
  sql += ' ORDER BY name'

  const students = query(sql, params)
  res.json(students)
})

function duplicateNames(names) {
  if (!names.length) return []
  const placeholders = names.map(() => 'LOWER(name) = LOWER(?)').join(' OR ')
  const existing = query(`SELECT name FROM students WHERE ${placeholders}`, names)
  return existing.map(r => r.name.toLowerCase())
}

router.post('/', (req, res) => {
  const { name, grade, section, gender } = req.body
  const trimmed = (name || '').trim()
  if (!trimmed) return res.status(400).json({ error: 'Name is required' })
  const dupes = duplicateNames([trimmed])
  if (dupes.length) return res.status(409).json({ error: 'Student "' + trimmed + '" already exists' })
  const id = uuidv4()
  run('INSERT INTO students (id, name, grade, section, gender) VALUES (?, ?, ?, ?, ?)',
    [id, trimmed, grade, section, gender || ''])
  res.json({ id, name: trimmed, grade, section, gender: gender || '' })
})

router.post('/bulk', (req, res) => {
  const { names, grade, section, gender } = req.body
  if (!names || !Array.isArray(names) || names.length === 0) {
    return res.status(400).json({ error: 'No names provided' })
  }
  const trimmed = names.map(n => (n || '').trim()).filter(Boolean)
  if (!trimmed.length) return res.status(400).json({ error: 'No valid names provided' })
  const existingLower = new Set(duplicateNames(trimmed).map(n => n.toLowerCase()))
  const created = []
  const skipped = []
  for (const name of trimmed) {
    if (existingLower.has(name.toLowerCase())) {
      skipped.push(name)
      continue
    }
    const id = uuidv4()
    run('INSERT INTO students (id, name, grade, section, gender) VALUES (?, ?, ?, ?, ?)',
      [id, name, grade, section, gender || ''])
    created.push({ id, name, grade, section, gender: gender || '' })
  }
  res.json({ count: created.length, students: created, skipped })
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, grade, section, gender } = req.body
  run('UPDATE students SET name=?, grade=?, section=?, gender=? WHERE id=?',
    [name, grade, section, gender || '', id])
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  run('DELETE FROM students WHERE id=?', [id])
  res.json({ success: true })
})

router.post('/bulk-delete', (req, res) => {
  const { ids } = req.body
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No ids provided' })
  }
  for (const id of ids) {
    run('DELETE FROM students WHERE id=?', [id])
  }
  res.json({ count: ids.length })
})

export default router
