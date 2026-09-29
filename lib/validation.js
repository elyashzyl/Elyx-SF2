// Small shared validators for route boundaries. These helpers return an error
// string so handlers can keep their existing response format and status codes.

export function asTrimmedString(value, field, { required = false, max = 255 } = {}) {
  const text = String(value ?? '').trim()
  if (required && !text) return { error: `${field} is required` }
  if (text.length > max) return { error: `${field} must be ${max} characters or fewer` }
  return { value: text }
}

export function validateDate(value, field = 'date') {
  const text = String(value ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return { error: `${field} must use YYYY-MM-DD format` }
  const parsed = new Date(`${text}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    return { error: `${field} must be a valid calendar date` }
  }
  return { value: text }
}

export function validateId(value, field = 'id') {
  const text = String(value ?? '').trim()
  if (!text || text.length > 96 || /[\u0000\r\n]/.test(text)) return { error: `${field} is invalid` }
  return { value: text }
}

export function validateOneOf(value, allowed, field) {
  if (!allowed.includes(value)) return { error: `${field} is invalid` }
  return { value }
}
