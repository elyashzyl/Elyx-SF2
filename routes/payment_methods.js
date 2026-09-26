import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query, run } from '../db.js'
import { requireRole, actingUser, audit } from './_context.js'

const router = Router()

// List payment methods
// Regular users (or unauthenticated inquiries) see only active methods (is_active = 1)
// Superadmin sees all payment methods with configuration toggles
router.get('/', async (req, res) => {
  try {
    const me = await actingUser(req)
    let sql = 'SELECT * FROM payment_methods'
    const params = []

    if (!me || me.role !== 'superadmin') {
      sql += ' WHERE is_active = 1'
    }

    sql += ' ORDER BY sort_order ASC, created_at ASC'
    const rows = await query(sql, params)
    res.json(rows)
  } catch (err) {
    console.error('Error listing payment methods:', err.message)
    res.status(500).json({ error: 'Failed to list payment methods' })
  }
})

// Create new payment method (Superadmin only)
router.post('/', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const {
      type = 'bank_transfer',
      bank_name,
      account_name,
      account_number,
      qr_image_url = '',
      instructions = '',
      is_active = 1,
      sort_order = 0
    } = req.body

    if (!bank_name || !bank_name.trim()) {
      return res.status(400).json({ error: 'Bank or provider name is required' })
    }
    if (!account_name || !account_name.trim()) {
      return res.status(400).json({ error: 'Account name is required' })
    }
    if (!account_number || !account_number.trim()) {
      return res.status(400).json({ error: 'Account number is required' })
    }

    const id = uuidv4()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    await run(
      `INSERT INTO payment_methods (
        id, type, bank_name, account_name, account_number, qr_image_url, instructions, is_active, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        type,
        bank_name.trim(),
        account_name.trim(),
        account_number.trim(),
        qr_image_url || '',
        instructions ? instructions.trim() : '',
        is_active ? 1 : 0,
        Number(sort_order) || 0,
        now,
        now
      ]
    )

    await audit(me, 'payment_method.create', { type: 'payment_method', id, name: bank_name.trim() }, `Added payment method ${bank_name.trim()} (${account_number.trim()})`)

    const created = (await query('SELECT * FROM payment_methods WHERE id = ?', [id]))[0]
    res.json({ success: true, paymentMethod: created })
  } catch (err) {
    console.error('Error creating payment method:', err.message)
    res.status(500).json({ error: 'Failed to create payment method' })
  }
})

// Update payment method (Superadmin only)
router.put('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { id } = req.params
    const rows = await query('SELECT * FROM payment_methods WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Payment method not found' })

    const {
      type,
      bank_name,
      account_name,
      account_number,
      qr_image_url,
      instructions,
      is_active,
      sort_order
    } = req.body

    const existing = rows[0]
    const updated = {
      type: type !== undefined ? type : existing.type,
      bank_name: bank_name !== undefined ? bank_name.trim() : existing.bank_name,
      account_name: account_name !== undefined ? account_name.trim() : existing.account_name,
      account_number: account_number !== undefined ? account_number.trim() : existing.account_number,
      qr_image_url: qr_image_url !== undefined ? qr_image_url : existing.qr_image_url,
      instructions: instructions !== undefined ? instructions.trim() : existing.instructions,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      sort_order: sort_order !== undefined ? Number(sort_order) : existing.sort_order
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    await run(
      `UPDATE payment_methods
       SET type = ?, bank_name = ?, account_name = ?, account_number = ?, qr_image_url = ?, instructions = ?, is_active = ?, sort_order = ?, updated_at = ?
       WHERE id = ?`,
      [
        updated.type,
        updated.bank_name,
        updated.account_name,
        updated.account_number,
        updated.qr_image_url,
        updated.instructions,
        updated.is_active,
        updated.sort_order,
        now,
        id
      ]
    )

    await audit(me, 'payment_method.update', { type: 'payment_method', id, name: updated.bank_name }, `Updated payment method ${updated.bank_name}`)

    const refreshed = (await query('SELECT * FROM payment_methods WHERE id = ?', [id]))[0]
    res.json({ success: true, paymentMethod: refreshed })
  } catch (err) {
    console.error('Error updating payment method:', err.message)
    res.status(500).json({ error: 'Failed to update payment method' })
  }
})

// Toggle active status (Superadmin only)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { id } = req.params
    const rows = await query('SELECT * FROM payment_methods WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Payment method not found' })

    const existing = rows[0]
    const nextState = existing.is_active ? 0 : 1

    await run('UPDATE payment_methods SET is_active = ? WHERE id = ?', [nextState, id])
    await audit(me, 'payment_method.toggle', { type: 'payment_method', id, name: existing.bank_name }, `Toggled payment method ${existing.bank_name} to ${nextState ? 'active' : 'inactive'}`)

    res.json({ success: true, is_active: nextState })
  } catch (err) {
    console.error('Error toggling payment method:', err.message)
    res.status(500).json({ error: 'Failed to toggle payment method' })
  }
})

// Delete payment method (Superadmin only)
router.delete('/:id', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return

    const { id } = req.params
    const rows = await query('SELECT * FROM payment_methods WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Payment method not found' })

    const existing = rows[0]
    await run('DELETE FROM payment_methods WHERE id = ?', [id])
    await audit(me, 'payment_method.delete', { type: 'payment_method', id, name: existing.bank_name }, `Deleted payment method ${existing.bank_name}`)

    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting payment method:', err.message)
    res.status(500).json({ error: 'Failed to delete payment method' })
  }
})

export default router
