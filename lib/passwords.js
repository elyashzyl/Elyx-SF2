import bcrypt from 'bcryptjs'

const BCRYPT_PREFIXES = ['$2a$', '$2b$', '$2y$']

export function isPasswordHash(value) {
  return typeof value === 'string' && BCRYPT_PREFIXES.some(prefix => value.startsWith(prefix)) && value.length === 60
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, storedValue) {
  if (typeof password !== 'string' || typeof storedValue !== 'string') return false
  if (isPasswordHash(storedValue)) return bcrypt.compare(password, storedValue)
  // Legacy plaintext compatibility. Callers should replace this value with a
  // bcrypt hash immediately after a successful login.
  return password === storedValue
}
