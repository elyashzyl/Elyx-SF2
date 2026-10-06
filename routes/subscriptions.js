import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, saveDatabase } from '../db.js'
import { actingUser, audit, requireRole } from './_context.js'
import { recordSubscriptionHistory } from '../lib/subscriptionHistory.js'

const router = Router()

function parseFeatures(value) {
  try { return JSON.parse(value || '{}') } catch { return {} }
}

function amountFor(plan, billingCycle) {
  return Number(billingCycle === 'monthly' ? plan.price_monthly : plan.billing_annual_total) || 0
}

function publicRequest(row) {
  return row ? { ...row, proof_url: row.proof_url || '' } : row
}

// School users can see their own subscription request history. Superadmins
// can see all requests so payment verification stays database-backed.
router.get('/requests', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })
    let rows
    if (me.role === 'superadmin') {
      rows = await query(`SELECT r.*, s.name AS school_name, p.name AS plan_name,
        pm.bank_name AS payment_bank_name, pm.type AS payment_method_type,
        pm.account_name AS payment_account_name, pm.account_number AS payment_account_number,
        u_req.name AS requested_by_name, u_rev.name AS reviewed_by_name
        FROM subscription_requests r
        LEFT JOIN schools s ON s.id = r.school_id
        LEFT JOIN subscription_plans p ON p.tier = r.plan_tier OR p.id = r.plan_tier
        LEFT JOIN payment_methods pm ON pm.id = r.payment_method_id
        LEFT JOIN users u_req ON u_req.id = r.requested_by
        LEFT JOIN users u_rev ON u_rev.id = r.reviewed_by
        ORDER BY r.created_at DESC`)
    } else {
      if (!me.school_id) return res.json([])
      rows = await query(`SELECT r.*, s.name AS school_name, p.name AS plan_name,
        pm.bank_name AS payment_bank_name, pm.type AS payment_method_type,
        pm.account_name AS payment_account_name, pm.account_number AS payment_account_number,
        u_req.name AS requested_by_name, u_rev.name AS reviewed_by_name
        FROM subscription_requests r
        LEFT JOIN schools s ON s.id = r.school_id
        LEFT JOIN subscription_plans p ON p.tier = r.plan_tier OR p.id = r.plan_tier
        LEFT JOIN payment_methods pm ON pm.id = r.payment_method_id
        LEFT JOIN users u_req ON u_req.id = r.requested_by
        LEFT JOIN users u_rev ON u_rev.id = r.reviewed_by
        WHERE r.school_id = ? ORDER BY r.created_at DESC`, [me.school_id])
    }
    res.json(rows.map(publicRequest))
  } catch (err) {
    console.error('Failed to list subscription requests:', err.message)
    res.status(500).json({ error: 'Failed to list subscription requests' })
  }
})

// Admins submit a payment reference/proof for a selected database plan.
router.post('/requests', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'admin')
    if (error) return
    if (!me.school_id) return res.status(400).json({ error: 'No school is assigned to this account' })

    const {
      school_id,
      request_type = 'renewal',
      plan_tier = '',
      billing_cycle,
      payment_method_id = '',
      payment_reference = '',
      proof_url = '',
      notes = ''
    } = req.body || {}
    const targetSchoolId = me.school_id
    if (!targetSchoolId || !String(plan_tier).trim() || !billing_cycle) return res.status(400).json({ error: 'School, plan, and billing cycle are required' })
    if (!['activation', 'renewal', 'upgrade'].includes(request_type)) return res.status(400).json({ error: 'Request type must be activation, renewal, or upgrade' })
    if (!['monthly', 'annual'].includes(billing_cycle)) return res.status(400).json({ error: 'Billing cycle must be monthly or annual' })
    if (!String(payment_reference).trim() && !String(proof_url).trim()) return res.status(400).json({ error: 'Payment reference or proof is required' })

    const plan = (await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ? LIMIT 1', [plan_tier, plan_tier]))[0]
    if (!plan) return res.status(400).json({ error: 'Selected subscription plan was not found' })
    if (billing_cycle === 'annual' && (!Number.isInteger(Number(plan.billing_months)) || Number(plan.billing_months) <= 0)) {
      return res.status(400).json({ error: 'The selected plan has no valid annual billing duration' })
    }
    const paymentMethod = payment_method_id
      ? (await query('SELECT id FROM payment_methods WHERE id = ? AND is_active = 1', [payment_method_id]))[0]
      : null
    if (payment_method_id && !paymentMethod) return res.status(400).json({ error: 'Selected payment method is not available' })

    const existing = await query('SELECT id FROM subscription_requests WHERE school_id = ? AND status = "pending" LIMIT 1', [targetSchoolId])
    if (existing.length) return res.status(409).json({ error: 'This school already has a payment request awaiting review' })

    const currentLicense = (await query('SELECT id, status FROM licenses WHERE school_id = ? ORDER BY issued_at DESC LIMIT 1', [targetSchoolId]))[0]
    const fromStatus = currentLicense?.status || 'none'

    const id = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await run(`INSERT INTO subscription_requests (
      id, school_id, license_id, request_type, plan_tier, billing_cycle, amount, payment_method_id,
      payment_reference, proof_url, status, requested_by, reviewed_by, reviewed_at,
      notes, created_at, updated_at
    ) VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, ?, 'pending', ?, '', '', ?, ?, ?)`, [
      id, targetSchoolId, request_type, plan.tier, billing_cycle, amountFor(plan, billing_cycle), payment_method_id || '',
      String(payment_reference).trim(), String(proof_url).trim(), me.id, String(notes).trim(), now, now
    ])
    await recordSubscriptionHistory({
      schoolId: targetSchoolId,
      requestId: id,
      licenseId: currentLicense?.id || '',
      fromStatus,
      toStatus: 'pending',
      actor: me,
      notes: String(notes).trim() || `Submitted ${request_type} payment for ${plan.name} (${billing_cycle})`,
      metadata: {
        request_type,
        plan_tier: plan.tier,
        billing_cycle,
        amount: amountFor(plan, billing_cycle),
        payment_reference: String(payment_reference).trim(),
        payment_method_id: payment_method_id || ''
      }
    })
    await audit(me, 'subscription_request.create', { type: 'subscription_request', id, schoolId: targetSchoolId }, `Submitted ${plan.tier} subscription payment for review`)
    saveDatabase()
    res.status(201).json({ success: true, request: publicRequest((await query('SELECT * FROM subscription_requests WHERE id = ?', [id]))[0]) })
  } catch (err) {
    console.error('Failed to create subscription request:', err.message)
    res.status(500).json({ error: 'Failed to submit subscription request' })
  }
})

// Superadmin approves/rejects requests. Approval activates or renews the
// school license using the selected plan limits and modules.
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const { status, notes = '' } = req.body || {}
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' })
    const request = (await query('SELECT * FROM subscription_requests WHERE id = ?', [req.params.id]))[0]
    if (!request) return res.status(404).json({ error: 'Subscription request not found' })
    if (request.status !== 'pending') return res.status(409).json({ error: 'This subscription request has already been reviewed' })

    const plan = (await query('SELECT * FROM subscription_plans WHERE tier = ? OR id = ? LIMIT 1', [request.plan_tier, request.plan_tier]))[0]
    if (!plan) return res.status(400).json({ error: 'The request plan no longer exists' })
    const now = new Date()
    const nowString = now.toISOString().split('T')[0]
    const renewalMonths = request.billing_cycle === 'monthly' ? 1 : Number(plan.billing_months)
    if (!Number.isInteger(renewalMonths) || renewalMonths <= 0) {
      return res.status(400).json({ error: 'The selected plan has no valid billing duration' })
    }

    let targetLicenseId = ''
    let prevLicenseStatus = 'none'

    if (status === 'approved') {
      const license = (await query('SELECT * FROM licenses WHERE school_id = ? ORDER BY issued_at DESC LIMIT 1', [request.school_id]))[0]
      if (request.request_type === 'activation' && license && ['active', 'trial'].includes(license.status)) {
        return res.status(409).json({ error: 'This school already has an active license. Submit an upgrade or renewal request instead.' })
      }
      prevLicenseStatus = license?.status || 'none'
      const baseDate = request.request_type === 'renewal' && license?.expires_at && new Date(license.expires_at) > now
        ? new Date(license.expires_at)
        : now
      const expiry = new Date(baseDate)
      expiry.setMonth(expiry.getMonth() + renewalMonths)
      const expiryString = expiry.toISOString().split('T')[0]
      const features = typeof plan.modules === 'string' ? plan.modules : JSON.stringify(plan.modules || {})
      if (license) {
        targetLicenseId = license.id
        await run(`UPDATE licenses SET plan_tier = ?, status = 'active', billing_cycle = ?, max_teachers = ?, max_students = ?, issued_at = ?, expires_at = ?, trial_ends_at = '', features = ?, notes = ? WHERE id = ?`, [
          plan.tier, request.billing_cycle, Number(plan.max_teachers), Number(plan.max_students), nowString, expiryString, features, `Payment verified: ${request.payment_reference || 'proof submitted'}`, license.id
        ])
        await run('UPDATE subscription_requests SET license_id = ? WHERE id = ?', [license.id, request.id])
      } else {
        const licenseId = uuidv4()
        targetLicenseId = licenseId
        const licenseKey = `ELY-${String(plan.tier).toUpperCase()}-${now.getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        await run(`INSERT INTO licenses (id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers, max_students, issued_at, expires_at, trial_ends_at, features, notes) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, '', ?, ?)`, [
          licenseId, request.school_id, licenseKey, plan.tier, request.billing_cycle, Number(plan.max_teachers), Number(plan.max_students), nowString, expiryString, features, 'Payment verified'
        ])
        await run('UPDATE subscription_requests SET license_id = ? WHERE id = ?', [licenseId, request.id])
      }

      // Record approval & activation in status history
      await recordSubscriptionHistory({
        schoolId: request.school_id,
        requestId: request.id,
        licenseId: targetLicenseId,
        fromStatus: 'pending',
        toStatus: 'approved',
        actor: me,
        notes: String(notes).trim() || 'Payment verified and subscription approved',
        metadata: {
          request_type: request.request_type,
          plan_tier: plan.tier,
          billing_cycle: request.billing_cycle,
          amount: request.amount,
          payment_reference: request.payment_reference,
          expires_at: expiryString
        }
      })

      await recordSubscriptionHistory({
        schoolId: request.school_id,
        licenseId: targetLicenseId,
        fromStatus: prevLicenseStatus,
        toStatus: 'active',
        actor: me,
        notes: `License active until ${expiryString}`,
        metadata: { plan_tier: plan.tier, expires_at: expiryString }
      })
    } else {
      // Record rejection in status history
      await recordSubscriptionHistory({
        schoolId: request.school_id,
        requestId: request.id,
        licenseId: request.license_id || '',
        fromStatus: 'pending',
        toStatus: 'rejected',
        actor: me,
        notes: String(notes).trim() || 'Payment verification rejected',
        metadata: {
          rejection_reason: String(notes).trim(),
          payment_reference: request.payment_reference
        }
      })
    }

    await run('UPDATE subscription_requests SET status = ?, reviewed_by = ?, reviewed_at = ?, notes = ?, updated_at = ? WHERE id = ?', [status, me.id, nowString, String(notes).trim() || request.notes || '', nowString, request.id])
    await audit(me, `subscription_request.${status}`, { type: 'subscription_request', id: request.id, schoolId: request.school_id }, `${status === 'approved' ? 'Approved' : 'Rejected'} subscription payment request`)
    saveDatabase()
    res.json({ success: true, request: publicRequest((await query('SELECT * FROM subscription_requests WHERE id = ?', [request.id]))[0]) })
  } catch (err) {
    console.error('Failed to review subscription request:', err.message)
    res.status(500).json({ error: 'Failed to review subscription request' })
  }
})

// Cancel a pending subscription request (School Admin or Superadmin)
router.post('/requests/:id/cancel', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'admin', 'superadmin')
    if (error) return
    const request = (await query('SELECT * FROM subscription_requests WHERE id = ?', [req.params.id]))[0]
    if (!request) return res.status(404).json({ error: 'Subscription request not found' })
    if (me.role !== 'superadmin' && request.school_id !== me.school_id) {
      return res.status(403).json({ error: 'Forbidden: outside your school' })
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be cancelled' })
    }

    const cancelNotes = String(req.body?.notes || 'Request cancelled by user').trim()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await run('UPDATE subscription_requests SET status = "cancelled", notes = ?, updated_at = ? WHERE id = ?', [cancelNotes, now, request.id])
    await recordSubscriptionHistory({
      schoolId: request.school_id,
      requestId: request.id,
      licenseId: request.license_id || '',
      fromStatus: 'pending',
      toStatus: 'cancelled',
      actor: me,
      notes: cancelNotes,
      metadata: { previous_status: 'pending' }
    })
    await audit(me, 'subscription_request.cancel', { type: 'subscription_request', id: request.id, schoolId: request.school_id }, 'Cancelled subscription payment request')
    saveDatabase()
    res.json({ success: true, request: publicRequest((await query('SELECT * FROM subscription_requests WHERE id = ?', [request.id]))[0]) })
  } catch (err) {
    console.error('Failed to cancel request:', err.message)
    res.status(500).json({ error: 'Failed to cancel subscription request' })
  }
})

// GET /api/subscriptions/history
// Retrieves subscription status transitions and superadmin review audit trail
router.get('/history', async (req, res) => {
  try {
    const me = await actingUser(req, res)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })
    const { schoolId, limit = 100 } = req.query
    const maxLimit = Math.min(250, Math.max(1, parseInt(limit, 10) || 100))

    let rows
    if (me.role === 'superadmin') {
      if (schoolId) {
        rows = await query(`
          SELECT h.*, s.name AS school_name
          FROM subscription_status_history h
          LEFT JOIN schools s ON s.id = h.school_id
          WHERE h.school_id = ?
          ORDER BY h.created_at DESC
          LIMIT ?
        `, [schoolId, maxLimit])
      } else {
        rows = await query(`
          SELECT h.*, s.name AS school_name
          FROM subscription_status_history h
          LEFT JOIN schools s ON s.id = h.school_id
          ORDER BY h.created_at DESC
          LIMIT ?
        `, [maxLimit])
      }
    } else {
      if (!me.school_id) return res.json([])
      rows = await query(`
        SELECT h.*, s.name AS school_name
        FROM subscription_status_history h
        LEFT JOIN schools s ON s.id = h.school_id
        WHERE h.school_id = ?
        ORDER BY h.created_at DESC
        LIMIT ?
      `, [me.school_id, maxLimit])
    }

    const parsed = rows.map(r => {
      let metadata = null
      if (r.metadata) {
        try { metadata = JSON.parse(r.metadata) } catch { metadata = r.metadata }
      }
      return {
        ...r,
        metadata
      }
    })

    res.json(parsed)
  } catch (err) {
    console.error('Failed to fetch subscription status history:', err.message)
    res.status(500).json({ error: 'Failed to retrieve subscription status history' })
  }
})

export default router
