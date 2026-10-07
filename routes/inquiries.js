import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, getSchoolById } from '../db.js'
import { requireRole, actingUser, audit } from './_context.js'
import { sendAccountEmail } from '../lib/mailer.js'

const router = Router()

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']
const VALID_CATEGORIES = ['general', 'technical', 'billing', 'payment', 'license', 'attendance', 'account', 'feature_request']
const MAX_MESSAGE_LENGTH = 10000
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain', 'text/csv',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const DANGEROUS_EXTENSIONS = /\.(exe|bat|cmd|sh|php|js|mjs|cjs|py|vbs|msi|com|scr|pif)$/i

// Recent message spam tracking (in-memory sliding window)
const recentSubmissions = new Map() // key: `${userId}:${inquiryId || 'new'}`, value: { text, ts }

function checkSpam(userId, scopeId, text) {
  const key = `${userId}:${scopeId}`
  const now = Date.now()
  const prev = recentSubmissions.get(key)
  if (prev && prev.text === text.trim() && (now - prev.ts < 3000)) {
    return true
  }
  recentSubmissions.set(key, { text: text.trim(), ts: now })
  // Prune map if large
  if (recentSubmissions.size > 1000) {
    for (const [k, v] of recentSubmissions.entries()) {
      if (now - v.ts > 60000) recentSubmissions.delete(k)
    }
  }
  return false
}

function validateAttachment(att) {
  if (!att || !att.url) {
    return { valid: true, data: { url: null, name: '', type: '', size: 0 } }
  }
  const name = String(att.name || '').trim().slice(0, 255)
  const type = String(att.type || '').trim().toLowerCase().slice(0, 64)
  let size = Number(att.size || 0)
  const url = String(att.url).trim()

  if (name && DANGEROUS_EXTENSIONS.test(name)) {
    return { valid: false, error: 'Disallowed file extension' }
  }

  // Base64 Data URL length estimate if size not provided
  if (url.startsWith('data:')) {
    const commaIndex = url.indexOf(',')
    if (commaIndex > 0) {
      const base64Len = url.length - (commaIndex + 1)
      const approxBytes = Math.floor((base64Len * 3) / 4)
      if (!size) size = approxBytes
    }
  }

  if (size > MAX_ATTACHMENT_SIZE) {
    return { valid: false, error: 'Attachment exceeds maximum size of 5 MB' }
  }

  if (type && !ALLOWED_MIME_TYPES.includes(type) && !type.startsWith('image/')) {
    return { valid: false, error: 'Unsupported file type. Allowed: images, PDFs, spreadsheets, and text documents' }
  }

  return {
    valid: true,
    data: {
      url,
      name,
      type: type || 'application/octet-stream',
      size: size || 0
    }
  }
}

async function getPlatformSupportEmail() {
  try {
    const rows = await query('SELECT `value` FROM settings WHERE `key` = "support_email"')
    if (rows.length && rows[0].value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rows[0].value.trim())) {
      return rows[0].value.trim()
    }
  } catch {}
  return process.env.SUPPORT_EMAIL || process.env.MAIL_FROM_ADDRESS || ''
}

async function checkUserEmailPreference(userId, prefKey) {
  try {
    const rows = await query(`SELECT ${prefKey} FROM user_notification_preferences WHERE user_id = ?`, [userId])
    if (!rows.length) return true // default enabled
    return Boolean(rows[0][prefKey])
  } catch {
    return true
  }
}

// Analytics summary for inquiries (KPIs)
router.get('/stats', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { schoolId } = req.query
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
    } else if (schoolId && schoolId.trim()) {
      conditions.push('school_id = ?')
      params.push(schoolId.trim())
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    const rows = await query(sql, params)
    const total = rows.length
    const open = rows.filter(r => r.status === 'open').length
    const finished = rows.filter(r => r.status === 'finished').length
    const urgent = rows.filter(r => r.priority === 'urgent' && r.status === 'open').length
    const high = rows.filter(r => r.priority === 'high' && r.status === 'open').length

    // Category distribution
    const categoryCounts = {}
    for (const c of VALID_CATEGORIES) categoryCounts[c] = 0
    for (const r of rows) {
      const cat = r.category || 'general'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    }

    // Priority distribution
    const priorityCounts = {}
    for (const p of VALID_PRIORITIES) priorityCounts[p] = 0
    for (const r of rows) {
      const pr = r.priority || 'medium'
      priorityCounts[pr] = (priorityCounts[pr] || 0) + 1
    }

    // Average resolution time (hours) for finished tickets
    let totalResolutionHours = 0
    let resolvedCount = 0
    for (const r of rows) {
      if (r.status === 'finished' && r.created_at && r.resolved_at) {
        const createdMs = new Date(r.created_at).getTime()
        const resolvedMs = new Date(r.resolved_at).getTime()
        if (resolvedMs > createdMs) {
          totalResolutionHours += (resolvedMs - createdMs) / (1000 * 60 * 60)
          resolvedCount++
        }
      }
    }
    const avgResolutionHours = resolvedCount > 0 ? Math.round((totalResolutionHours / resolvedCount) * 10) / 10 : 0
    const resolutionRate = total > 0 ? Math.round((finished / total) * 100) : 100

    res.json({
      total,
      open,
      finished,
      urgent,
      high,
      resolutionRate,
      avgResolutionHours,
      categoryCounts,
      priorityCounts
    })
  } catch (err) {
    console.error('Error fetching inquiry stats:', err.message)
    res.status(500).json({ error: 'Failed to fetch inquiry stats' })
  }
})

// Bulk status update (superadmin only)
router.post('/bulk-status', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { ids = [], status = 'finished', note = '' } = req.body || {}
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No inquiry IDs provided' })
    }
    if (!['open', 'finished'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const resolvedAt = status === 'finished' ? now : ''
    const resolvedBy = status === 'finished' ? (me.name || me.username) : ''

    let updatedCount = 0
    for (const id of ids) {
      const rows = await query('SELECT * FROM inquiries WHERE id = ?', [id])
      if (rows.length) {
        const inquiry = rows[0]
        await run(
          'UPDATE inquiries SET status = ?, resolved_at = ?, resolved_by = ?, user_notified = 0, updated_at = ? WHERE id = ?',
          [status, resolvedAt, resolvedBy, now, id]
        )
        const historyId = uuidv4()
        const historyNote = (note || `Bulk updated status to ${status}`).trim()
        await run(
          `INSERT INTO inquiry_status_history (
            id, inquiry_id, old_status, new_status, changed_by_id, changed_by_name, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [historyId, id, inquiry.status, status, me.id, me.name || me.username, historyNote, now]
        )
        updatedCount++
      }
    }

    await audit(me, 'inquiry.bulk_status', {
      type: 'inquiry',
      count: updatedCount,
      targetStatus: status
    }, `Bulk marked ${updatedCount} inquiries as ${status}`)

    res.json({ success: true, updatedCount })
  } catch (err) {
    console.error('Error bulk updating inquiries:', err.message)
    res.status(500).json({ error: 'Failed to bulk update inquiries' })
  }
})

// Export inquiries to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { status, category, priority, assigned_to, search, schoolId } = req.query

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
    } else if (schoolId && schoolId.trim()) {
      conditions.push('school_id = ?')
      params.push(schoolId.trim())
    }

    if (status && status !== 'all') {
      conditions.push('status = ?')
      params.push(status)
    }
    if (category && category !== 'all') {
      conditions.push('category = ?')
      params.push(category)
    }
    if (priority && priority !== 'all') {
      conditions.push('priority = ?')
      params.push(priority)
    }
    if (assigned_to && assigned_to !== 'all') {
      conditions.push('assigned_to = ?')
      params.push(assigned_to)
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

    const headers = ['Ticket ID', 'Campus', 'Requester', 'Role', 'Email', 'Category', 'Priority', 'Subject', 'Status', 'Assigned To', 'Created At', 'Resolved At', 'Resolved By']
    const csvRows = rows.map(r => [
      `"${r.id}"`,
      `"${(r.school_name || '').replace(/"/g, '""')}"`,
      `"${(r.user_name || '').replace(/"/g, '""')}"`,
      `"${r.user_role || ''}"`,
      `"${r.user_email || ''}"`,
      `"${r.category || ''}"`,
      `"${(r.priority || 'medium').toUpperCase()}"`,
      `"${(r.subject || '').replace(/"/g, '""')}"`,
      `"${(r.status || 'open').toUpperCase()}"`,
      `"${(r.assigned_to_name || 'Unassigned').replace(/"/g, '""')}"`,
      `"${r.created_at || ''}"`,
      `"${r.resolved_at || ''}"`,
      `"${(r.resolved_by || '').replace(/"/g, '""')}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\r\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="elytrack-inquiries-${Date.now()}.csv"`)
    res.send(csvContent)
  } catch (err) {
    console.error('Error exporting inquiries:', err.message)
    res.status(500).json({ error: 'Failed to export inquiries' })
  }
})

// List inquiries
// Superadmin sees all inquiries across all schools.
// Admins and teachers see their own inquiries (or inquiries from their school).
router.get('/', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { status, category, priority, assigned_to, search } = req.query

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

    if (priority && priority !== 'all') {
      conditions.push('priority = ?')
      params.push(priority)
    }

    if (assigned_to && assigned_to !== 'all') {
      conditions.push('assigned_to = ?')
      params.push(assigned_to)
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
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const rows = await query(
      'SELECT id, subject, category, priority, status, resolved_at, resolved_by, updated_at FROM inquiries WHERE user_id = ? AND user_notified = 0 AND status = "finished" ORDER BY updated_at DESC',
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
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { subject, category = 'general', priority = 'medium', message, userEmail = '', attachment = null } = req.body

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' })
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` })
    }

    // Attachment validation
    const attCheck = validateAttachment(attachment)
    if (!attCheck.valid) {
      return res.status(400).json({ error: attCheck.error })
    }
    const att = attCheck.data

    // Rate-limiting / anti-spam check
    if (checkSpam(me.id, 'new', message)) {
      return res.status(429).json({ error: 'Please wait a moment before submitting another inquiry.' })
    }

    let schoolName = ''
    if (me.school_id) {
      const school = await getSchoolById(me.school_id)
      if (school) schoolName = school.name || school.short || ''
    }

    const effPriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium'
    const effCategory = VALID_CATEGORIES.includes(category) ? category : (category || 'general')

    const inquiryId = uuidv4()
    const msgId = uuidv4()
    const historyId = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    await run(
      `INSERT INTO inquiries (
        id, school_id, school_name, user_id, user_name, user_email, user_role,
        category, priority, assigned_to, assigned_to_name, subject, status, user_notified,
        created_at, updated_at, resolved_at, resolved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, 'open', 1, ?, ?, '', '')`,
      [
        inquiryId,
        me.school_id || '',
        schoolName,
        me.id,
        me.name || me.username,
        userEmail || '',
        me.role,
        effCategory,
        effPriority,
        subject.trim(),
        now,
        now
      ]
    )

    await run(
      `INSERT INTO inquiry_messages (
        id, inquiry_id, sender_id, sender_name, sender_role, message,
        attachment_url, attachment_name, attachment_type, attachment_size, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        msgId,
        inquiryId,
        me.id,
        me.name || me.username,
        me.role,
        message.trim(),
        att.url,
        att.name,
        att.type,
        att.size,
        now
      ]
    )

    // Initial status history audit record
    await run(
      `INSERT INTO inquiry_status_history (
        id, inquiry_id, old_status, new_status, changed_by_id, changed_by_name, note, created_at
      ) VALUES (?, ?, 'none', 'open', ?, ?, 'Inquiry created', ?)`,
      [
        historyId,
        inquiryId,
        me.id,
        me.name || me.username,
        now
      ]
    )

    await audit(me, 'inquiry.create', {
      type: 'inquiry',
      id: inquiryId,
      name: subject.trim(),
      schoolId: me.school_id || ''
    }, `Created inquiry [${effPriority}/${effCategory}] ${subject.trim()}`)

    // Email dispatch to platform support email (if configured)
    const supportEmail = await getPlatformSupportEmail()
    if (supportEmail) {
      sendAccountEmail({
        to: supportEmail,
        subject: `[ElyTrack Support] [${effPriority.toUpperCase()}] ${subject.trim()}`,
        text: `New support inquiry submitted by ${me.name || me.username} (${me.role}) from ${schoolName || 'General'}:\n\nCategory: ${effCategory}\nPriority: ${effPriority}\n\nMessage:\n${message.trim()}`,
        html: `<h3>New Support Inquiry</h3><p><strong>From:</strong> ${me.name || me.username} (${me.role}) - ${schoolName || 'General'}</p><p><strong>Category:</strong> ${effCategory} | <strong>Priority:</strong> ${effPriority}</p><hr/><p>${message.trim()}</p>`
      }).catch(mailErr => {
        console.warn('Support email notification skipped:', mailErr.message)
      })
    }

    const created = (await query('SELECT * FROM inquiries WHERE id = ?', [inquiryId]))[0]
    res.status(201).json({ success: true, inquiry: created })
  } catch (err) {
    console.error('Error creating inquiry:', err.message)
    res.status(500).json({ error: 'Failed to create inquiry' })
  }
})

// Get single inquiry and its chat thread
router.get('/:id', async (req, res) => {
  try {
    const me = await actingUser(req, res)
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

// Get status & assignment audit history for an inquiry
router.get('/:id/history', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { id } = req.params
    const rows = await query('SELECT * FROM inquiries WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Inquiry not found' })

    const inquiry = rows[0]
    if (me.role !== 'superadmin' && inquiry.user_id !== me.id) {
      if (me.role !== 'admin' || !me.school_id || me.school_id !== inquiry.school_id) {
        return res.status(403).json({ error: 'Forbidden' })
      }
    }

    const history = await query(
      'SELECT * FROM inquiry_status_history WHERE inquiry_id = ? ORDER BY created_at ASC',
      [id]
    )

    res.json({ history })
  } catch (err) {
    console.error('Error fetching inquiry history:', err.message)
    res.status(500).json({ error: 'Failed to fetch inquiry history' })
  }
})

// Send reply message in inquiry thread
router.post('/:id/messages', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { id } = req.params
    const { message, attachment = null } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' })
    }
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` })
    }

    // Rate-limiting / anti-spam check
    if (checkSpam(me.id, id, message)) {
      return res.status(429).json({ error: 'Please wait a moment before sending another message.' })
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

    // Attachment validation
    const attCheck = validateAttachment(attachment)
    if (!attCheck.valid) {
      return res.status(400).json({ error: attCheck.error })
    }
    const att = attCheck.data

    const msgId = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    await run(
      `INSERT INTO inquiry_messages (
        id, inquiry_id, sender_id, sender_name, sender_role, message,
        attachment_url, attachment_name, attachment_type, attachment_size, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        msgId,
        id,
        me.id,
        me.name || me.username,
        me.role,
        message.trim(),
        att.url,
        att.name,
        att.type,
        att.size,
        now
      ]
    )

    // If superadmin sends a reply, reset user_notified = 0 so the user is notified
    const userNotified = me.role === 'superadmin' ? 0 : inquiry.user_notified
    await run('UPDATE inquiries SET updated_at = ?, user_notified = ? WHERE id = ?', [now, userNotified, id])

    // If superadmin replies, dispatch email to user if preference is enabled
    if (me.role === 'superadmin' && inquiry.user_id !== me.id) {
      const emailEnabled = await checkUserEmailPreference(inquiry.user_id, 'email_on_inquiry_reply')
      let targetEmail = inquiry.user_email
      if (!targetEmail) {
        const u = await query('SELECT email FROM users WHERE id = ?', [inquiry.user_id])
        if (u.length && u[0].email) targetEmail = u[0].email
      }
      if (emailEnabled && targetEmail) {
        sendAccountEmail({
          to: targetEmail,
          subject: `[ElyTrack] Response to your inquiry: ${inquiry.subject}`,
          text: `Support Desk replied to your inquiry "${inquiry.subject}":\n\n"${message.trim()}"\n\nSign in to view the conversation.`,
          html: `<p>Support Desk replied to your inquiry <strong>${inquiry.subject}</strong>:</p><blockquote>${message.trim()}</blockquote>`
        }).catch(() => {})
      }
    }

    res.json({
      success: true,
      message: {
        id: msgId,
        inquiry_id: id,
        sender_id: me.id,
        sender_name: me.name || me.username,
        sender_role: me.role,
        message: message.trim(),
        attachment_url: att.url,
        attachment_name: att.name,
        attachment_type: att.type,
        attachment_size: att.size,
        created_at: now
      }
    })
  } catch (err) {
    console.error('Error posting inquiry message:', err.message)
    res.status(500).json({ error: 'Failed to post message' })
  }
})

// Assign inquiry to support staff (superadmin only)
router.patch('/:id/assign', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { id } = req.params
    const { assigned_to = '', assigned_to_name = '', note = '' } = req.body || {}

    const rows = await query('SELECT * FROM inquiries WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Inquiry not found' })

    const inquiry = rows[0]
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const historyId = uuidv4()

    await run(
      'UPDATE inquiries SET assigned_to = ?, assigned_to_name = ?, updated_at = ? WHERE id = ?',
      [assigned_to.trim(), assigned_to_name.trim(), now, id]
    )

    const historyNote = note.trim() || (assigned_to ? `Assigned to ${assigned_to_name.trim()}` : 'Unassigned from support staff')
    await run(
      `INSERT INTO inquiry_status_history (
        id, inquiry_id, old_status, new_status, changed_by_id, changed_by_name, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        id,
        inquiry.status,
        inquiry.status,
        me.id,
        me.name || me.username,
        historyNote,
        now
      ]
    )

    await audit(me, 'inquiry.assign', {
      type: 'inquiry',
      id,
      name: inquiry.subject,
      schoolId: inquiry.school_id
    }, `Assigned inquiry to ${assigned_to_name.trim() || 'none'}`)

    const updated = (await query('SELECT * FROM inquiries WHERE id = ?', [id]))[0]
    res.json({ success: true, inquiry: updated })
  } catch (err) {
    console.error('Error assigning inquiry:', err.message)
    res.status(500).json({ error: 'Failed to assign inquiry' })
  }
})

// Update status: superadmin can mark as finished or reopen
router.patch('/:id/status', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })

    const { id } = req.params
    const { status, admin_reply, note } = req.body

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

    // Status audit trail
    const historyId = uuidv4()
    const historyNote = (note || admin_reply || `Marked inquiry as ${status}`).trim()
    await run(
      `INSERT INTO inquiry_status_history (
        id, inquiry_id, old_status, new_status, changed_by_id, changed_by_name, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        id,
        inquiry.status,
        status,
        me.id,
        me.name || me.username,
        historyNote,
        now
      ]
    )

    await audit(
      me,
      status === 'finished' ? 'inquiry.resolve' : 'inquiry.reopen',
      { type: 'inquiry', id, name: inquiry.subject, schoolId: inquiry.school_id },
      `Marked inquiry as ${status}`
    )

    // Send email notification on status change if opted-in
    if (inquiry.user_id !== me.id) {
      const emailEnabled = await checkUserEmailPreference(inquiry.user_id, 'email_on_status_change')
      let targetEmail = inquiry.user_email
      if (!targetEmail) {
        const u = await query('SELECT email FROM users WHERE id = ?', [inquiry.user_id])
        if (u.length && u[0].email) targetEmail = u[0].email
      }
      if (emailEnabled && targetEmail) {
        sendAccountEmail({
          to: targetEmail,
          subject: `[ElyTrack] Your inquiry was marked as ${status === 'finished' ? 'Finished' : 'Re-opened'}`,
          text: `Your inquiry "${inquiry.subject}" status is now ${status.toUpperCase()} by ${me.name || me.username}.\n\nSign in to review details.`,
          html: `<p>Your inquiry <strong>${inquiry.subject}</strong> is now marked as <strong>${status.toUpperCase()}</strong>.</p>`
        }).catch(() => {})
      }
    }

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
    const me = await actingUser(req, res)
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
