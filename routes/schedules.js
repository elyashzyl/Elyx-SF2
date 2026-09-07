import { Router } from 'express'
import { query, run } from '../db.js'

const router = Router()

router.get('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params
    const schedules = await query(
      'SELECT * FROM teacher_schedules WHERE teacher_id = ? ORDER BY day_of_week, period',
      [teacherId]
    )
    res.json(schedules)
  } catch (err) {
    console.error('Error fetching schedules:', err.message)
    res.status(500).json({ error: 'Failed to fetch schedules' })
  }
})

router.post('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params
    const { day_of_week, period, start_time, end_time, subject, grade, section } = req.body

    const result = await query(
      'INSERT INTO teacher_schedules (teacher_id, day_of_week, period, start_time, end_time, subject, grade, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [teacherId, day_of_week, period, start_time || '', end_time || '', subject || '', grade || '', section || '']
    )

    res.json({ success: true, id: result.insertId || result.lastInsertRowid || null })
  } catch (err) {
    console.error('Error creating schedule entry:', err.message)
    res.status(500).json({ error: 'Failed to create schedule entry' })
  }
})

router.put('/:teacherId/:entryId', async (req, res) => {
  try {
    const { teacherId, entryId } = req.params
    const { day_of_week, period, start_time, end_time, subject, grade, section } = req.body

    await run(
      'UPDATE teacher_schedules SET day_of_week=?, period=?, start_time=?, end_time=?, subject=?, grade=?, section=? WHERE id=? AND teacher_id=?',
      [day_of_week, period, start_time || '', end_time || '', subject || '', grade || '', section || '', entryId, teacherId]
    )

    res.json({ success: true })
  } catch (err) {
    console.error('Error updating schedule entry:', err.message)
    res.status(500).json({ error: 'Failed to update schedule entry' })
  }
})

router.delete('/:teacherId/:entryId', async (req, res) => {
  try {
    const { teacherId, entryId } = req.params
    await run('DELETE FROM teacher_schedules WHERE id=? AND teacher_id=?', [entryId, teacherId])
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting schedule entry:', err.message)
    res.status(500).json({ error: 'Failed to delete schedule entry' })
  }
})

router.put('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params
    const { schedules } = req.body
    await run('DELETE FROM teacher_schedules WHERE teacher_id = ?', [teacherId])
    for (const s of schedules || []) {
      await run('INSERT INTO teacher_schedules (teacher_id, day_of_week, period) VALUES (?, ?, ?)',
        [teacherId, s.day_of_week, s.period])
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Error replacing schedules:', err.message)
    res.status(500).json({ error: 'Failed to replace schedules' })
  }
})

router.delete('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params
    await run('DELETE FROM teacher_schedules WHERE teacher_id = ?', [teacherId])
    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting schedules:', err.message)
    res.status(500).json({ error: 'Failed to delete schedules' })
  }
})

export default router
