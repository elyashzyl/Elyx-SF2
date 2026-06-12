import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

router.get('/stats', (req, res) => {
  try {
    const students = query('SELECT COUNT(*) as cnt FROM students')[0]?.cnt || 0
    const teachers = query("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher'")[0]?.cnt || 0
    const records = query('SELECT COUNT(*) as cnt FROM attendance_records')[0]?.cnt || 0
    const entries = query('SELECT COUNT(*) as cnt FROM attendance_entries')[0]?.cnt || 0
    res.json({ students, teachers, records, entries })
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router