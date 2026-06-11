import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { grade, section } = req.query
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

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }
  sql += ' ORDER BY name'

  const students = query(sql, params)
  res.json(students)
})

router.post('/', (req, res) => {
  const { name, grade, section } = req.body
  const id = uuidv4()
  run('INSERT INTO students (id, name, grade, section) VALUES (?, ?, ?, ?)',
    [id, name, grade, section])
  res.json({ id, name, grade, section })
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const { name, grade, section } = req.body
  run('UPDATE students SET name=?, grade=?, section=? WHERE id=?',
    [name, grade, section, id])
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  run('DELETE FROM students WHERE id=?', [id])
  res.json({ success: true })
})

export default router
