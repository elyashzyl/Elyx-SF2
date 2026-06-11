import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const users = query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password])
  if (users.length === 0) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }
  const { password: _, ...userData } = users[0]
  res.json({ user: userData })
})

export default router
