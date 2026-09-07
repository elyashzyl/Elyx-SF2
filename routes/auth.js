import { Router } from 'express'
import { query, getSchoolById, logAudit } from '../db.js'
import { schoolToResponse, requireRole } from './_context.js'

const router = Router()

async function publicUser(row) {
  const { password: _, ...userData } = row
  const school = userData.school_id ? schoolToResponse(await getSchoolById(userData.school_id)) : null
  return { ...userData, school }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const users = await query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password])
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    res.json({ user: await publicUser(users[0]) })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Superadmin starts impersonating another user (admin or teacher).
// The client swaps its session to the returned user but keeps the original
// superadmin id so it can stop impersonating later.
router.post('/impersonate', async (req, res) => {
  try {
    const { me, error } = await requireRole(req, res, 'superadmin')
    if (error) return
    const { targetId } = req.body || {}
    if (!targetId) return res.status(400).json({ error: 'targetId is required' })
    if (targetId === me.id) return res.status(400).json({ error: 'Cannot impersonate yourself' })
    const target = (await query('SELECT * FROM users WHERE id = ?', [targetId]))[0]
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.role === 'superadmin') return res.status(403).json({ error: 'Cannot impersonate another superadmin' })
    await logAudit({
      actor_id: me.id, actor_name: me.name, actor_role: me.role, actor_school_id: me.school_id || '',
      action: 'impersonate.start',
      target_type: 'user', target_id: target.id, target_name: target.name,
      target_school_id: target.school_id || '',
      detail: `Started impersonating ${target.name} (${target.role})`
    })
    res.json({ user: await publicUser(target), impersonatedBy: { id: me.id, name: me.name } })
  } catch (err) {
    console.error('Impersonate error:', err.message)
    res.status(500).json({ error: 'Impersonation failed' })
  }
})

// Stop impersonating: verify the original superadmin still exists, then
// restore their session. The client sends back the stored superadmin id.
router.post('/impersonate/stop', async (req, res) => {
  try {
    const { superadminId, userId } = req.body || {}
    if (!superadminId) return res.status(400).json({ error: 'superadminId is required' })
    const admin = (await query('SELECT * FROM users WHERE id = ?', [superadminId]))[0]
    if (!admin || admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Original superadmin session is no longer valid' })
    }
    const stopped = userId ? (await query('SELECT * FROM users WHERE id = ?', [userId]))[0] : null
    await logAudit({
      actor_id: admin.id, actor_name: admin.name, actor_role: admin.role, actor_school_id: admin.school_id || '',
      action: 'impersonate.stop',
      target_type: 'user', target_id: stopped?.id || '', target_name: stopped?.name || '',
      target_school_id: stopped?.school_id || '',
      detail: stopped ? `Stopped impersonating ${stopped.name}` : 'Stopped impersonation'
    })
    res.json({ user: await publicUser(admin) })
  } catch (err) {
    console.error('Impersonate stop error:', err.message)
    res.status(500).json({ error: 'Impersonation stop failed' })
  }
})

export default router