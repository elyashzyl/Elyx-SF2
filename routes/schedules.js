import { Router } from 'express'
import { query, run } from '../db.js'

const router = Router()

router.get('/:teacherId', (req, res) => {
  const { teacherId } = req.params
  const schedules = query(
    'SELECT * FROM teacher_schedules WHERE teacher_id = ? ORDER BY day_of_week, period',
    [teacherId]
  )
  res.json(schedules)
})

router.post('/:teacherId', (req, res) => {
  const { teacherId } = req.params
  const { day_of_week, period, start_time, end_time, subject, grade, section } = req.body

  const result = query(
    'INSERT INTO teacher_schedules (teacher_id, day_of_week, period, start_time, end_time, subject, grade, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [teacherId, day_of_week, period, start_time || '', end_time || '', subject || '', grade || '', section || '']
  )

  res.json({ success: true, id: result.insertId || result.lastInsertRowid || null })
})

router.put('/:teacherId/:entryId', (req, res) => {
  const { teacherId, entryId } = req.params
  const { day_of_week, period, start_time, end_time, subject, grade, section } = req.body

  run(
    'UPDATE teacher_schedules SET day_of_week=?, period=?, start_time=?, end_time=?, subject=?, grade=?, section=? WHERE id=? AND teacher_id=?',
    [day_of_week, period, start_time || '', end_time || '', subject || '', grade || '', section || '', entryId, teacherId]
  )

  res.json({ success: true })
})

router.delete('/:teacherId/:entryId', (req, res) => {
  const { teacherId, entryId } = req.params
  run('DELETE FROM teacher_schedules WHERE id=? AND teacher_id=?', [entryId, teacherId])
  res.json({ success: true })
})

router.put('/:teacherId', (req, res) => {
  const { teacherId } = req.params
  const { schedules } = req.body
  run('DELETE FROM teacher_schedules WHERE teacher_id = ?', [teacherId])
  for (const s of schedules || []) {
    run('INSERT INTO teacher_schedules (teacher_id, day_of_week, period) VALUES (?, ?, ?)',
      [teacherId, s.day_of_week, s.period])
  }
  res.json({ success: true })
})

router.delete('/:teacherId', (req, res) => {
  const { teacherId } = req.params
  run('DELETE FROM teacher_schedules WHERE teacher_id = ?', [teacherId])
  res.json({ success: true })
})

export default router
