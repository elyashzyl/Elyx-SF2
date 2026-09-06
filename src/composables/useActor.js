import { useAuthStore } from '../stores/auth'

// Shared auth context for raw fetch() calls (views that don't go through a store).
export function actorParams(extra = {}) {
  const auth = useAuthStore()
  return {
    userId: auth.user?.id || '',
    userRole: auth.user?.role || '',
    ...(auth.user?.school_id ? { schoolId: auth.user.school_id } : {}),
    ...extra
  }
}

export function actorQs(extra = {}) {
  return new URLSearchParams(actorParams(extra)).toString()
}

export function actorBody(payload = {}) {
  return JSON.stringify(actorParams(payload))
}
