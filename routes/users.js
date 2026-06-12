import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const users = query('SELECT id, username, name, role, grade, section, period FROM users ORDER BY name')
  res.json(users)
})

router.post('/', (req, res) => {
  const { username, password, name, role, grade, section, period } = req.body
  const existing = query('SELECT id FROM users WHERE username = ?', [username])
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Username already exists' })
  }
  const id = uuidv4()
  run('INSERT INTO users (id, username, password, name, role, grade, section, period) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, username, password, name, role, grade || '', section || '', period || ''])
  res.json({ id, username, name, role })
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const { username, password, name, role, grade, section, period } = req.body
  const dup = query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id])
  if (dup.length > 0) {
    return res.status(400).json({ error: 'Username already exists' })
  }
  if (password) {
    run('UPDATE users SET username=?, password=?, name=?, role=?, grade=?, section=?, period=? WHERE id=?',
      [username, password, name, role, grade || '', section || '', period || '', id])
  } else {
    run('UPDATE users SET username=?, name=?, role=?, grade=?, section=?, period=? WHERE id=?',
      [username, name, role, grade || '', section || '', period || '', id])
  }
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  run('DELETE FROM users WHERE id=? AND role=?', [id, 'teacher'])
  res.json({ success: true })
})

export default router
