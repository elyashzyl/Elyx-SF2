import { Router } from 'express'
import { query, run } from '../db.js'

const router = Router()

// ---- Calendar Events ----
router.get('/calendar', (req, res) => {
  try {
    const events = query('SELECT * FROM calendar_events ORDER BY event_date')
    res.json(events)
  } catch {
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

router.post('/calendar', (req, res) => {
  try {
    const { title, type, event_date, color } = req.body
    if (!title || !type || !event_date) {
      return res.status(400).json({ error: 'title, type, and event_date are required' })
    }
    run('INSERT INTO calendar_events (title, type, event_date, color, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, type, event_date, color || '', req.user?.id || ''])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to create event' })
  }
})

router.put('/calendar/:id', (req, res) => {
  try {
    const { title, type, event_date, color } = req.body
    run('UPDATE calendar_events SET title=?, type=?, event_date=?, color=? WHERE id=?',
      [title, type, event_date, color || '', req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to update event' })
  }
})

router.delete('/calendar/:id', (req, res) => {
  try {
    run('DELETE FROM calendar_events WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

// ---- Quarterly Events ----
router.get('/quarterly', (req, res) => {
  try {
    const events = query('SELECT * FROM quarterly_events ORDER BY id')
    res.json(events)
  } catch {
    res.status(500).json({ error: 'Failed to fetch quarterly events' })
  }
})

router.post('/quarterly', (req, res) => {
  try {
    const { event_name, first_grading, second_grading, third_grading, fourth_grading } = req.body
    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' })
    }
    run('INSERT INTO quarterly_events (event_name, first_grading, second_grading, third_grading, fourth_grading) VALUES (?, ?, ?, ?, ?)',
      [event_name, first_grading || '', second_grading || '', third_grading || '', fourth_grading || ''])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to create quarterly event' })
  }
})

router.put('/quarterly/:id', (req, res) => {
  try {
    const { event_name, first_grading, second_grading, third_grading, fourth_grading } = req.body
    run('UPDATE quarterly_events SET event_name=?, first_grading=?, second_grading=?, third_grading=?, fourth_grading=? WHERE id=?',
      [event_name, first_grading || '', second_grading || '', third_grading || '', fourth_grading || '', req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to update quarterly event' })
  }
})

router.delete('/quarterly/:id', (req, res) => {
  try {
    run('DELETE FROM quarterly_events WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Failed to delete quarterly event' })
  }
})

export default router