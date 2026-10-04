import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { requireRole, actingUser, audit } from './_context.js'
import { sendAccountEmail } from '../lib/mailer.js'

const router = Router()

const VALID_TARGET_ROLES = ['all', 'admin', 'teacher']
const VALID_PRIORITIES = ['normal', 'important', 'urgent']

// List announcements visible to the current user
router.get('/', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    let sql = `
      SELECT a.*,
        CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END AS is_read
      FROM announcements a
      LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = ?
    `
    const params = [me.id]
    const conditions = []

    // Expiration check: expires_at is NULL or in future
    conditions.push("(a.expires_at IS NULL OR a.expires_at = '' OR a.expires_at > ?)")
    params.push(now)

    // Role and school targeting
    if (me.role === 'superadmin') {
      // Superadmin sees all announcements; optional filter by ?school_id
      if (req.query.school_id) {
        conditions.push('(a.school_id = ? OR a.school_id = \'\')')
        params.push(req.query.school_id)
      }
    } else if (me.role === 'admin') {
      // Admins see announcements for their school or platform-wide, targeted to 'all' or 'admin'
      conditions.push("(a.school_id = ? OR a.school_id = '')")
      params.push(me.school_id || '')
      conditions.push("a.target_role IN ('all', 'admin')")
    } else {
      // Teachers see announcements for their school or platform-wide, targeted to 'all' or 'teacher'
      conditions.push("(a.school_id = ? OR a.school_id = '')")
      params.push(me.school_id || '')
      conditions.push("a.target_role IN ('all', 'teacher')")

      // Grade targeting: if set, must match teacher's grade
      if (me.grade) {
        conditions.push("(a.target_grade = '' OR a.target_grade = ?)")
        params.push(me.grade)
      } else {
        conditions.push("a.target_grade = ''")
      }

      // Section targeting: if set, must match teacher's section
      if (me.section) {
        conditions.push("(a.target_section = '' OR a.target_section = ?)")
        params.push(me.section)
      } else {
        conditions.push("a.target_section = ''")
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY a.priority = \'urgent\' DESC, a.priority = \'important\' DESC, a.created_at DESC'

    const rows = await query(sql, params)
    const normalized = rows.map(r => ({
      ...r,
      is_read: Boolean(r.is_read)
    }))
    res.json(normalized)
  } catch (err) {
    console.error('Error listing announcements:', err.message)
    res.status(500).json({ error: 'Failed to list announcements' })
  }
})

// Unread badge count for the current user
router.get('/unread-count', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    let sql = `
      SELECT COUNT(*) AS unread_count
      FROM announcements a
      LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = ?
      WHERE ar.id IS NULL
        AND (a.expires_at IS NULL OR a.expires_at = '' OR a.expires_at > ?)
    `
    const params = [me.id, now]

    if (me.role !== 'superadmin') {
      sql += " AND (a.school_id = ? OR a.school_id = '')"
      params.push(me.school_id || '')

      if (me.role === 'admin') {
        sql += " AND a.target_role IN ('all', 'admin')"
      } else {
        sql += " AND a.target_role IN ('all', 'teacher')"
        if (me.grade) {
          sql += " AND (a.target_grade = '' OR a.target_grade = ?)"
          params.push(me.grade)
        } else {
          sql += " AND a.target_grade = ''"
        }
        if (me.section) {
          sql += " AND (a.target_section = '' OR a.target_section = ?)"
          params.push(me.section)
        } else {
          sql += " AND a.target_section = ''"
        }
      }
    }

    const rows = await query(sql, params)
    res.json({ unreadCount: Number(rows[0]?.unread_count || 0) })
  } catch (err) {
    console.error('Error fetching unread announcement count:', err.message)
    res.status(500).json({ error: 'Failed to fetch unread count' })
  }
})

// Create announcement (admin / superadmin)
router.post('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const {
      title,
      content,
      target_role = 'all',
      target_grade = '',
      target_section = '',
      priority = 'normal',
      expires_at = null,
      school_id = ''
    } = req.body || {}

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (title.trim().length > 255) {
      return res.status(400).json({ error: 'Title must be 255 characters or fewer' })
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' })
    }

    const effRole = VALID_TARGET_ROLES.includes(target_role) ? target_role : 'all'
    const effPriority = VALID_PRIORITIES.includes(priority) ? priority : 'normal'

    // School scoping: admin can only target their own school
    let effSchoolId = ''
    if (me.role === 'admin') {
      if (!me.school_id) return res.status(400).json({ error: 'School ID missing for administrator' })
      effSchoolId = me.school_id
    } else if (me.role === 'superadmin') {
      effSchoolId = (school_id || '').trim()
    }

    let effExpiresAt = null
    if (expires_at) {
      const parsedDate = new Date(expires_at)
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid expires_at date format' })
      }
      effExpiresAt = parsedDate.toISOString().replace('T', ' ').substring(0, 19)
    }

    const id = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    await run(
      `INSERT INTO announcements (
        id, school_id, title, content, target_role, target_grade, target_section,
        priority, author_id, author_name, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        effSchoolId,
        title.trim(),
        content.trim(),
        effRole,
        (target_grade || '').trim(),
        (target_section || '').trim(),
        effPriority,
        me.id,
        me.name || me.username,
        effExpiresAt,
        now,
        now
      ]
    )

    await audit(me, 'announcement.create', {
      type: 'announcement',
      id,
      name: title.trim(),
      schoolId: effSchoolId
    }, `Created [${effPriority}] announcement "${title.trim()}" for ${effRole}`)

    // Optional email dispatch for urgent announcements to opted-in users
    if (effPriority === 'urgent') {
      try {
        let recipientSql = 'SELECT u.id, u.email FROM users u WHERE u.email != \'\''
        const recipientParams = []
        if (effSchoolId) {
          recipientSql += ' AND u.school_id = ?'
          recipientParams.push(effSchoolId)
        }
        if (effRole !== 'all') {
          recipientSql += ' AND u.role = ?'
          recipientParams.push(effRole)
        }
        const recipients = await query(recipientSql, recipientParams)
        for (const recipient of recipients) {
          const pref = await query('SELECT email_on_announcement FROM user_notification_preferences WHERE user_id = ?', [recipient.id])
          if (pref.length === 0 || pref[0].email_on_announcement) {
            sendAccountEmail({
              to: recipient.email,
              subject: `[URGENT ANNOUNCEMENT] ${title.trim()}`,
              text: `${content.trim()}\n\nPosted by ${me.name || me.username}`,
              html: `<h3>${title.trim()}</h3><p>${content.trim()}</p><small>Posted by ${me.name || me.username}</small>`
            }).catch(() => {})
          }
        }
      } catch (err) {
        console.warn('Urgent announcement email dispatch skipped:', err.message)
      }
    }

    const created = (await query('SELECT * FROM announcements WHERE id = ?', [id]))[0]
    res.status(201).json({ success: true, announcement: { ...created, is_read: false } })
  } catch (err) {
    console.error('Error creating announcement:', err.message)
    res.status(500).json({ error: 'Failed to create announcement' })
  }
})

// Mark single announcement as read
router.post('/:id/read', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { id } = req.params
    const rows = await query('SELECT id FROM announcements WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Announcement not found' })

    const existing = await query(
      'SELECT id FROM announcement_reads WHERE announcement_id = ? AND user_id = ?',
      [id, me.id]
    )

    if (!existing.length) {
      const readId = uuidv4()
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      await run(
        'INSERT INTO announcement_reads (id, announcement_id, user_id, read_at) VALUES (?, ?, ?, ?)',
        [readId, id, me.id, now]
      )
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error marking announcement as read:', err.message)
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// Mark all visible announcements as read
router.post('/mark-all-read', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    // Find all unread announcements visible to this user
    let sql = `
      SELECT a.id FROM announcements a
      LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = ?
      WHERE ar.id IS NULL
        AND (a.expires_at IS NULL OR a.expires_at = '' OR a.expires_at > ?)
    `
    const params = [me.id, now]
    if (me.role !== 'superadmin') {
      sql += " AND (a.school_id = ? OR a.school_id = '')"
      params.push(me.school_id || '')
      if (me.role === 'admin') {
        sql += " AND a.target_role IN ('all', 'admin')"
      } else {
        sql += " AND a.target_role IN ('all', 'teacher')"
        if (me.grade) {
          sql += " AND (a.target_grade = '' OR a.target_grade = ?)"
          params.push(me.grade)
        } else {
          sql += " AND a.target_grade = ''"
        }
        if (me.section) {
          sql += " AND (a.target_section = '' OR a.target_section = ?)"
          params.push(me.section)
        } else {
          sql += " AND a.target_section = ''"
        }
      }
    }

    const unread = await query(sql, params)
    let markedCount = 0

    for (const item of unread) {
      const readId = uuidv4()
      await run(
        'INSERT INTO announcement_reads (id, announcement_id, user_id, read_at) VALUES (?, ?, ?, ?)',
        [readId, item.id, me.id, now]
      )
      markedCount++
    }

    res.json({ success: true, count: markedCount })
  } catch (err) {
    console.error('Error marking all announcements as read:', err.message)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

// Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin', 'admin')
    if (error) return

    const { id } = req.params
    const rows = await query('SELECT * FROM announcements WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Announcement not found' })

    const announcement = rows[0]

    // Admin can only delete announcements within their school
    if (me.role === 'admin' && announcement.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: cannot delete announcements outside your school' })
    }

    await run('DELETE FROM announcement_reads WHERE announcement_id = ?', [id])
    await run('DELETE FROM announcements WHERE id = ?', [id])

    await audit(me, 'announcement.delete', {
      type: 'announcement',
      id,
      name: announcement.title,
      schoolId: announcement.school_id
    }, `Deleted announcement "${announcement.title}"`)

    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting announcement:', err.message)
    res.status(500).json({ error: 'Failed to delete announcement' })
  }
})

// Cleanup expired announcements older than retention days (default: 90 days)
router.post('/cleanup', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const retentionDays = parseInt(req.body?.retentionDays || '90', 10)
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
      .toISOString().replace('T', ' ').substring(0, 19)

    // Select IDs to purge
    const expired = await query(
      "SELECT id FROM announcements WHERE expires_at IS NOT NULL AND expires_at != '' AND expires_at < ?",
      [cutoffDate]
    )

    let deleted = 0
    for (const item of expired) {
      await run('DELETE FROM announcement_reads WHERE announcement_id = ?', [item.id])
      await run('DELETE FROM announcements WHERE id = ?', [item.id])
      deleted++
    }

    await audit(me, 'announcement.cleanup', {
      type: 'system',
      detail: `Cleaned up ${deleted} expired announcements older than ${retentionDays} days`
    }, `Purged ${deleted} expired announcements`)

    res.json({ success: true, deleted })
  } catch (err) {
    console.error('Error cleaning up announcements:', err.message)
    res.status(500).json({ error: 'Failed to clean up announcements' })
  }
})

export default router
