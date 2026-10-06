import { v4 as uuidv4 } from 'uuid'
import { run } from '../db.js'

/**
 * Record a subscription lifecycle transition in the database audit log.
 *
 * @param {Object} params
 * @param {string} params.schoolId - Target school UUID
 * @param {string} [params.licenseId] - Associated license ID if any
 * @param {string} [params.requestId] - Associated subscription_requests ID if any
 * @param {string} [params.fromStatus] - Initial status (e.g. 'none', 'pending', 'active', 'trial', 'suspended')
 * @param {string} params.toStatus - Target status ('pending', 'approved', 'rejected', 'active', 'trial', 'expired', 'suspended', 'cancelled')
 * @param {Object|null} [params.actor] - Acting user object { id, name, role }
 * @param {string} [params.notes] - Human review notes or system reasoning
 * @param {Object|string|null} [params.metadata] - Extra structured metadata (plan, amount, ref, dates)
 * @returns {Promise<string|null>} The generated history entry ID, or null on error
 */
export async function recordSubscriptionHistory({
  schoolId,
  licenseId = '',
  requestId = '',
  fromStatus = '',
  toStatus,
  actor = null,
  notes = '',
  metadata = null
}) {
  if (!schoolId || !toStatus) return null
  const id = uuidv4()
  const actorId = actor?.id ? String(actor.id) : ''
  const actorName = actor?.name ? String(actor.name) : ''
  const actorRole = actor?.role ? String(actor.role) : 'system'
  const metaStr = metadata && typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata ? String(metadata) : null)
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  try {
    await run(
      `INSERT INTO subscription_status_history (
        id, school_id, license_id, request_id, from_status, to_status,
        actor_id, actor_name, actor_role, notes, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(schoolId),
        String(licenseId || ''),
        String(requestId || ''),
        String(fromStatus || ''),
        String(toStatus),
        actorId,
        actorName,
        actorRole,
        notes ? String(notes).trim() : null,
        metaStr,
        now
      ]
    )
    return id
  } catch (err) {
    console.error('Failed to record subscription status history:', err.message)
    return null
  }
}
