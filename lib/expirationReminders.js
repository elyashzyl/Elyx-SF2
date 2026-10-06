import { v4 as uuidv4 } from 'uuid'
import { query, run, saveDatabase } from '../db.js'
import { sendAccountEmail } from './mailer.js'
import { recordSubscriptionHistory } from './subscriptionHistory.js'

/**
 * Calculate the calendar days remaining until target date string.
 *
 * @param {string} dateStr - Target date (YYYY-MM-DD or ISO string)
 * @returns {number} Days remaining (positive, 0, or negative if passed)
 */
export function calculateDaysRemaining(dateStr) {
  if (!dateStr) return 0
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return 0
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Determine the applicable reminder threshold based on days remaining and plan type.
 *
 * @param {boolean} isTrial - Whether the license is a trial
 * @param {number} daysRemaining - Days until expiration
 * @returns {{ type: string, label: string, priority: string } | null}
 */
export function getEligibleReminderThreshold(isTrial, daysRemaining) {
  if (daysRemaining <= 0) {
    return {
      type: isTrial ? 'trial_expired' : 'sub_expired',
      label: isTrial ? 'Trial Expired' : 'Subscription Expired',
      priority: 'urgent'
    }
  }
  if (daysRemaining <= 1) {
    return {
      type: isTrial ? 'trial_1d' : 'sub_1d',
      label: '1 Day Remaining',
      priority: 'urgent'
    }
  }
  if (daysRemaining <= 3) {
    return {
      type: isTrial ? 'trial_3d' : 'sub_3d',
      label: '3 Days Remaining',
      priority: 'urgent'
    }
  }
  if (daysRemaining <= 7) {
    return {
      type: isTrial ? 'trial_7d' : 'sub_7d',
      label: '7 Days Remaining',
      priority: 'important'
    }
  }
  if (!isTrial && daysRemaining <= 14) {
    return {
      type: 'sub_14d',
      label: '14 Days Remaining',
      priority: 'normal'
    }
  }
  return null
}

/**
 * Inspect licenses and dispatch automated reminders to school administrators.
 * Deduplicates per license, threshold, and target expiration date.
 *
 * @param {Object} [options]
 * @param {string|null} [options.schoolId] - Filter check to a single school
 * @param {Object|null} [options.actor] - Acting user triggering the check
 * @returns {Promise<{ processedCount: number, remindersSent: number, reminders: Array }>}
 */
export async function evaluateLicenseExpirationReminders({ schoolId = null, actor = null } = {}) {
  let sql = `
    SELECT l.*, s.name as school_name, s.short as school_short
    FROM licenses l
    LEFT JOIN schools s ON s.id = l.school_id
  `
  const params = []
  if (schoolId) {
    sql += ' WHERE l.school_id = ?'
    params.push(schoolId)
  } else {
    sql += " WHERE l.status IN ('active', 'trial', 'expired')"
  }
  sql += ' ORDER BY l.issued_at DESC'

  const licenses = await query(sql, params)
  const remindersDispatched = []

  for (const license of licenses) {
    if (license.status === 'suspended' || license.status === 'cancelled') continue

    const targetDate = (license.status === 'trial' && license.trial_ends_at)
      ? license.trial_ends_at
      : license.expires_at

    if (!targetDate) continue

    const targetExpStr = String(targetDate).split('T')[0]
    const isTrial = license.status === 'trial' || String(license.plan_tier || '').toLowerCase().includes('trial')
    const daysRemaining = calculateDaysRemaining(targetDate)
    const threshold = getEligibleReminderThreshold(isTrial, daysRemaining)

    if (!threshold) continue

    // Deduplication check: verify if this threshold has already been sent for this target expiration date
    const existing = await query(
      'SELECT id FROM license_expiration_reminders WHERE license_id = ? AND reminder_type = ? AND target_expiration_date = ? LIMIT 1',
      [license.id, threshold.type, targetExpStr]
    )
    if (existing && existing.length > 0) continue

    // Retrieve active administrators for this school
    const admins = await query(`
      SELECT u.id, u.email, u.name,
        COALESCE(unp.email_on_status_change, 1) as email_on_status_change,
        COALESCE(unp.in_app_notifications, 1) as in_app_notifications
      FROM users u
      LEFT JOIN user_notification_preferences unp ON unp.user_id = u.id
      WHERE u.school_id = ? AND u.role = 'admin' AND u.account_status != 'disabled'
    `, [license.school_id])

    const campusName = license.school_name || license.school_short || 'your campus'
    const planName = license.plan_tier ? license.plan_tier.toUpperCase() : 'Subscription'

    const title = daysRemaining <= 0
      ? `[Notice] Campus ${isTrial ? 'Trial' : planName} has expired`
      : `[Reminder] Campus ${isTrial ? 'Trial' : planName} expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`

    const content = daysRemaining <= 0
      ? `The ElyTrack license for ${campusName} expired on ${targetExpStr}. Workspace access may be restricted. Please submit a renewal payment or contact support at ely.ashzyl@gmail.com.`
      : `The ElyTrack license for ${campusName} will expire on ${targetExpStr} (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining). Please renew your subscription to ensure continuous teacher and SF2 reporting access.`

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const expAnnouncementStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)

    // 1. Create In-App Announcement for school administrators
    const annId = uuidv4()
    try {
      await run(`
        INSERT INTO announcements (
          id, school_id, title, content, target_role, priority, author_id, author_name, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'admin', ?, 'system', 'ElyTrack Billing', ?, ?, ?)
      `, [
        annId,
        license.school_id,
        title,
        content,
        threshold.priority || 'important',
        expAnnouncementStr,
        nowStr,
        nowStr
      ])
    } catch (annErr) {
      console.warn('[reminders] Could not insert announcement:', annErr.message)
    }

    // 2. Dispatch Email Alerts to opted-in school administrators
    const emailRecipients = []
    for (const admin of admins) {
      if (admin.email && admin.email_on_status_change !== 0) {
        try {
          await sendAccountEmail({
            to: admin.email,
            subject: `[ElyTrack] Action Required: ${title}`,
            text: `${content}\n\nReview or renew your license: /licenses`,
            html: `<p><strong>${title}</strong></p><p>${content}</p><p><a href="/licenses">Review or Renew License</a></p>`
          })
          emailRecipients.push(admin.email)
        } catch (mailErr) {
          console.warn(`[reminders] Could not deliver email to ${admin.email}:`, mailErr.message)
        }
      }
    }

    // 3. Record dispatched reminder in license_expiration_reminders table
    const reminderId = uuidv4()
    const channel = emailRecipients.length > 0 ? 'both' : 'in_app'
    await run(`
      INSERT INTO license_expiration_reminders (
        id, license_id, school_id, reminder_type, target_expiration_date,
        days_remaining, channel, recipients_count, recipients_data,
        status, notes, sent_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)
    `, [
      reminderId,
      license.id,
      license.school_id,
      threshold.type,
      targetExpStr,
      daysRemaining,
      channel,
      admins.length,
      JSON.stringify({ admin_ids: admins.map(a => a.id), emails: emailRecipients }),
      `Automated ${threshold.label} notification for ${campusName}`,
      nowStr,
      nowStr
    ])

    // 4. Automatically update license status to expired if daysRemaining <= 0
    if (daysRemaining <= 0 && license.status !== 'expired') {
      await run('UPDATE licenses SET status = ? WHERE id = ?', ['expired', license.id])
      await recordSubscriptionHistory({
        schoolId: license.school_id,
        licenseId: license.id,
        fromStatus: license.status,
        toStatus: 'expired',
        actor: actor || { id: 'system', name: 'Automated Expiration Check', role: 'system' },
        notes: `License automatically marked expired on ${targetExpStr}`,
        metadata: { target_date: targetExpStr, days_remaining: daysRemaining }
      })
    }

    // 5. Record lifecycle history event
    await recordSubscriptionHistory({
      schoolId: license.school_id,
      licenseId: license.id,
      fromStatus: license.status,
      toStatus: daysRemaining <= 0 ? 'expired' : license.status,
      actor: actor || { id: 'system', name: 'Automated Reminder Engine', role: 'system' },
      notes: `Dispatched ${threshold.label} reminder (${daysRemaining}d remaining) to ${admins.length} administrator(s)`,
      metadata: {
        reminder_type: threshold.type,
        target_date: targetExpStr,
        days_remaining: daysRemaining,
        emails_sent: emailRecipients.length,
        channel
      }
    })

    remindersDispatched.push({
      id: reminderId,
      license_id: license.id,
      license_key: license.license_key,
      school_id: license.school_id,
      school_name: campusName,
      reminder_type: threshold.type,
      reminder_label: threshold.label,
      target_expiration_date: targetExpStr,
      days_remaining: daysRemaining,
      channel,
      recipients_count: admins.length,
      emails_sent: emailRecipients.length,
      sent_at: nowStr
    })
  }

  saveDatabase()

  return {
    processedCount: licenses.length,
    remindersSent: remindersDispatched.length,
    reminders: remindersDispatched
  }
}

let schedulerTimer = null

/**
 * Start background scheduler for periodic expiration checks.
 * Safe for server runs; disabled automatically during test executions.
 */
export function startExpirationReminderScheduler() {
  if (process.env.NODE_ENV === 'test') return
  if (schedulerTimer) return

  // Initial delayed evaluation on startup
  setTimeout(async () => {
    try {
      await evaluateLicenseExpirationReminders()
    } catch (err) {
      console.warn('[reminders] Initial check error:', err.message)
    }
  }, 10000).unref?.()

  // Every 12 hours check
  schedulerTimer = setInterval(async () => {
    try {
      await evaluateLicenseExpirationReminders()
    } catch (err) {
      console.warn('[reminders] Periodic check error:', err.message)
    }
  }, 12 * 60 * 60 * 1000)

  schedulerTimer.unref?.()
}

/**
 * Stop background scheduler (for teardown if needed).
 */
export function stopExpirationReminderScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
}
