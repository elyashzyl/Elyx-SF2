import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, getSchoolById } from '../db.js'
import { requireRole, actingUser, audit } from './_context.js'

const router = Router()

// List inquiries
// Superadmin sees all inquiries across all schools.
// Admins and teachers see their own inquiries (or inquiries from their school).
router.get('/', async (req, res) => {
  try {
    const me = await actingUser(req)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { status, category, search } = req.query

    let sql = 'SELECT * FROM inquiries'
    const params = []
    const conditions = []

    if (me.role !== 'superadmin') {
      if (me.role === 'admin' && me.school_id) {
        conditions.push('(user_id = ? OR school_id = ?)')
        params.push(me.id, me.school_id)
      } else {
        conditions.push('user_id = ?')
        params.push(me.id)
      }
    }

    if (status && status !== 'all') {
      conditions.push('status = ?')
      params.push(status)
    }

    if (category && category !== 'all') {
      conditions.push('category = ?')
      params.push(category)
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`
      conditions.push('(subject LIKE ? OR user_name LIKE ? OR school_name LIKE ? OR category LIKE ?)')
      params.push(q, q, q, q)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY created_at DESC'

    const rows = await query(sql, params)
    res.json(rows)
  } catch (err) {
    console.error('Error listing inquiries:', err.message)
    res.status(500).json({ error: 'Failed to list inquiries' })
  }
})

// Unread notifications for the current user
// Triggered when superadmin marks an issue as finished or sends a reply
router.get('/notifications/unread', async (req, res) => {
  try {
    const me = await actingUser(req)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const rows = await query(
      'SELECT id, subject, category, status, resolved_at, resolved_by, updated_at FROM inquiries WHERE user_id = ? AND user_notified = 0 AND status = "finished" ORDER BY updated_at DESC',
      [me.id]
    )

    res.json({ unread: rows })
  } catch (err) {
    console.error('Error fetching unread notifications:', err.message)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Create new inquiry / ticket
router.post('/', async (req, res) => {
  try {
    const me = await actingUser(req)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { subject, category = 'general', message, userEmail = '' } = req.body

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' })
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    let schoolName = ''
    if (me.school_id) {
      const school = await getSchoolById(me.school_id)
      if (school) schoolName = school.name || school.short || ''
    }

    const inquiryId = uuidv4()
    const msgId = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    await run(
      `INSERT INTO inquiries (id, school_id, school_name, user_id, user_name, user_email, user_role, category, subject, status, user_notified, created_at, updated_at, resolved_at, resolved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 1, ?, ?, '', '')`,
      [
        inquiryId,
        me.school_id || '',
        schoolName,
        me.id,
        me.name || me.username,
        userEmail || '',
        me.role,
        category,
        subject.trim(),
        now,
        now
      ]
    )

    await run(
      `INSERT INTO inquiry_messages (id, inquiry_id, sender_id, sender_name, sender_role, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        msgId,
        inquiryId,
        me.id,
        me.name || me.username,
        me.role,
        message.trim(),
        now
      ]
    )

    await audit(me, 'inquiry.create', { type: 'inquiry', id: inquiryId, name: subject.trim(), schoolId: me.school_id || '' }, `Created inquiry [${category}] ${subject.trim()}`)

    const created = (await query('SELECT * FROM inquiries WHERE id = ?', [inquiryId]))[0]
    res.json({ success: true, inquiry: created })
  } catch (err) {
    console.error('Error creating inquiry:', err.message)
    res.status(500).json({ error: 'Failed to create inquiry' })
  }
})

// Get single inquiry and its chat thread
router.get('/:id', async (req, res) => {
  try {
    const me = await actingUser(req)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { id } = req.params
    const rows = await query('SELECT * FROM inquiries WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Inquiry not found' })

    const inquiry = rows[0]

    // Access check: superadmin or author or school admin of the same school
    if (me.role !== 'superadmin' && inquiry.user_id !== me.id) {
      if (me.role !== 'admin' || !me.school_id || me.school_id !== inquiry.school_id) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const messages = await query(
      'SELECT * FROM inquiry_messages WHERE inquiry_id = ? ORDER BY created_at ASC',
      [id]
    )

    res.json({ inquiry, messages })
  } catch (err) {
    console.error('Error fetching inquiry details:', err.message)
    res.status(500).json({ error: 'Failed to fetch inquiry details' })
  }
})

// Send reply message in inquiry thread
router.post('/:id/messages', async (req, res) => {
  try {
    const me = await actingUser(req)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { id } = req.params
    const { message } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' })
    }

    const rows = await query('SELECT * FROM inquiries WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Inquiry not found' })

    const inquiry = rows[0]

    // Access check
    if (me.role !== 'superadmin' && inquiry.user_id !== me.id) {
      if (me.role !== 'admin' || !me.school_id || me.school_id !== inquiry.school_id) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const msgId = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    await run(
      `INSERT INTO inquiry_messages (id, inquiry_id, sender_id, sender_name, sender_role, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        msgId,
        id,
        me.id,
        me.name || me.username,
        me.role,
        message.trim(),
        now
      ]
    )

    // If superadmin sends a reply, reset user_notified = 0 so the user is notified
    const userNotified = me.role === 'superadmin' ? 0 : inquiry.user_notified
    await run('UPDATE inquiries SET updated_at = ?, user_notified = ? WHERE id = ?', [now, userNotified, id])

    res.json({
      success: true,
      message: {
        id: msgId,
        inquiry_id: id,
        sender_id: me.id,
        sender_name: me.name || me.username,
        sender_role: me.role,
        message: message.trim(),
        created_at: now
      }
    })
  } catch (err) {
    console.error('Error posting inquiry message:', err.message)
    res.status(500).json({ error: 'Failed to post message' })
  }
})

// Update status: superadmin can mark as finished or reopen
router.patch('/:id/status', async (req, res) => {
  try {
    const me = await actingUser(req)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { id } = req.params
    const { status, admin_reply } = req.body

    if (!['open', 'finished'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "open" or "finished"' })
    }

    const rows = await query('SELECT * FROM inquiries WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Inquiry not found' })

    const inquiry = rows[0]

    // Only superadmin can mark inquiries as finished (or user closing their own)
    if (me.role !== 'superadmin' && inquiry.user_id !== me.id) {
      return res.status(403).json({ error: 'Only superadmin can resolve this inquiry' })
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const resolvedAt = status === 'finished' ? now : ''
    const resolvedBy = status === 'finished' ? (me.name || me.username) : ''
    // When marked as finished, set user_notified = 0 so submitter gets alerted!
    const userNotified = 0

    await run(
      'UPDATE inquiries SET status = ?, resolved_at = ?, resolved_by = ?, user_notified = ?, updated_at = ? WHERE id = ?',
      [status, resolvedAt, resolvedBy, userNotified, now, id]
    )

    // Optional admin reply message
    if (admin_reply && admin_reply.trim()) {
      const msgId = uuidv4()
      await run(
        `INSERT INTO inquiry_messages (id, inquiry_id, sender_id, sender_name, sender_role, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          msgId,
          id,
          me.id,
          me.name || me.username,
          me.role,
          admin_reply.trim(),
          now
        ]
      )
    }

    await audit(
      me,
      status === 'finished' ? 'inquiry.resolve' : 'inquiry.reopen',
      { type: 'inquiry', id, name: inquiry.subject, schoolId: inquiry.school_id },
      `Marked inquiry as ${status}`
    )

    const updated = (await query('SELECT * FROM inquiries WHERE id = ?', [id]))[0]
    res.json({ success: true, inquiry: updated })
  } catch (err) {
    console.error('Error updating inquiry status:', err.message)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// Dismiss notification for a resolved inquiry
router.post('/:id/dismiss-notification', async (req, res) => {
  try {
    const me = await actingUser(req)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { id } = req.params
    await run('UPDATE inquiries SET user_notified = 1 WHERE id = ? AND user_id = ?', [id, me.id])
    res.json({ success: true })
  } catch (err) {
    console.error('Error dismissing inquiry notification:', err.message)
    res.status(500).json({ error: 'Failed to dismiss notification' })
  }
})

export default router
