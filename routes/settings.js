import { Router } from 'express'
import { query, run } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const all = query('SELECT key, value FROM settings')
  const result = {}
  for (const row of all) {
    result[row.key] = row.value
  }
  res.json(result)
})

router.put('/', (req, res) => {
  const { settings } = req.body
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings object' })
  }
  for (const [key, value] of Object.entries(settings)) {
    const existing = query('SELECT key FROM settings WHERE key = ?', [key])
    if (existing.length > 0) {
      run('UPDATE settings SET value = ? WHERE key = ?', [String(value), key])
    } else {
      run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)])
    }
  }
  res.json({ success: true })
})

export default router
