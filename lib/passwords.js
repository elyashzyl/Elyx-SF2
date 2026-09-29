import bcrypt from 'bcryptjs'

const BCRYPT_PREFIXES = ['$2a$', '$2b$', '$2y$']

export function isPasswordHash(value) {
  return typeof value === 'string' && BCRYPT_PREFIXES.some(prefix => value.startsWith(prefix)) && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value)
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  return bcrypt.hash(password, 12)
}

// Existing records may predate the current password policy. This helper is
// intentionally separate from hashPassword and is only for the explicit,
// operator-run legacy migration command.
export async function hashLegacyPasswordForMigration(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Legacy password must be a non-empty string')
  }
  return bcrypt.hash(password, 12)
}

export function legacyPasswordFallbackAllowed() {
  // Never permit plaintext authentication in production, even if a broad
  // legacy-auth compatibility flag was configured for other routes.
  return (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') && process.env.ALLOW_LEGACY_PASSWORD_LOGIN === '1'
}

export async function verifyPassword(password, storedValue) {
  if (typeof password !== 'string' || typeof storedValue !== 'string') return false
  if (isPasswordHash(storedValue)) return bcrypt.compare(password, storedValue)
  return legacyPasswordFallbackAllowed() && password === storedValue
}
