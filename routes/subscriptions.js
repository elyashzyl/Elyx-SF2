import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run, saveDatabase } from '../db.js'
import { actingUser, audit, requireRole } from './_context.js'

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
    const me = await actingUser(req)
    if (!me) return res.status(401).json({ error: 'Not authenticated' })
    let rows
    if (me.role === 'superadmin') {
      rows = await query(`SELECT r.*, s.name AS school_name, p.name AS plan_name
        FROM subscription_requests r
        LEFT JOIN schools s ON s.id = r.school_id
        LEFT JOIN subscription_plans p ON p.tier = r.plan_tier OR p.id = r.plan_tier
        ORDER BY r.created_at DESC`)
    } else {
      if (!me.school_id) return res.json([])
      rows = await query(`SELECT r.*, s.name AS school_name, p.name AS plan_name
        FROM subscription_requests r
        LEFT JOIN schools s ON s.id = r.school_id
        LEFT JOIN subscription_plans p ON p.tier = r.plan_tier OR p.id = r.plan_tier
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
    const { me, error } = await requireRole(req, res, 'admin', 'superadmin')
    if (error) return
    if (!me.school_id && me.role !== 'superadmin') return res.status(400).json({ error: 'No school is assigned to this account' })

    const {
      school_id,
      plan_tier = '',
      billing_cycle,
      payment_method_id = '',
      payment_reference = '',
      proof_url = '',
      notes = ''
    } = req.body || {}
    const targetSchoolId = me.role === 'superadmin' ? String(school_id || me.school_id || '').trim() : me.school_id
    if (!targetSchoolId || !String(plan_tier).trim() || !billing_cycle) return res.status(400).json({ error: 'School, plan, and billing cycle are required' })
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

    const id = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await run(`INSERT INTO subscription_requests (
      id, school_id, license_id, plan_tier, billing_cycle, amount, payment_method_id,
      payment_reference, proof_url, status, requested_by, reviewed_by, reviewed_at,
      notes, created_at, updated_at
    ) VALUES (?, ?, '', ?, ?, ?, ?, ?, ?, 'pending', ?, '', '', ?, ?, ?)`, [
      id, targetSchoolId, plan.tier, billing_cycle, amountFor(plan, billing_cycle), payment_method_id || '',
      String(payment_reference).trim(), String(proof_url).trim(), me.id, String(notes).trim(), now, now
    ])
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
    const expiry = new Date(now)
    expiry.setMonth(expiry.getMonth() + renewalMonths)
    const expiryString = expiry.toISOString().split('T')[0]

    if (status === 'approved') {
      const license = (await query('SELECT * FROM licenses WHERE school_id = ? ORDER BY issued_at DESC LIMIT 1', [request.school_id]))[0]
      const features = typeof plan.modules === 'string' ? plan.modules : JSON.stringify(plan.modules || {})
      if (license) {
        await run(`UPDATE licenses SET plan_tier = ?, status = 'active', billing_cycle = ?, max_teachers = ?, max_students = ?, issued_at = ?, expires_at = ?, trial_ends_at = '', features = ?, notes = ? WHERE id = ?`, [
          plan.tier, request.billing_cycle, Number(plan.max_teachers), Number(plan.max_students), nowString, expiryString, features, `Payment verified: ${request.payment_reference || 'proof submitted'}`, license.id
        ])
        await run('UPDATE subscription_requests SET license_id = ? WHERE id = ?', [license.id, request.id])
      } else {
        const licenseId = uuidv4()
        const licenseKey = `ELY-${String(plan.tier).toUpperCase()}-${now.getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        await run(`INSERT INTO licenses (id, school_id, license_key, plan_tier, status, billing_cycle, max_teachers, max_students, issued_at, expires_at, trial_ends_at, features, notes) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, '', ?, ?)`, [
          licenseId, request.school_id, licenseKey, plan.tier, request.billing_cycle, Number(plan.max_teachers), Number(plan.max_students), nowString, expiryString, features, 'Payment verified'
        ])
        await run('UPDATE subscription_requests SET license_id = ? WHERE id = ?', [licenseId, request.id])
      }
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

export default router
