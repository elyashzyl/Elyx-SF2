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

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const MAX_INPUT_DEPTH = 12
const MAX_INPUT_KEYS = 200
const MAX_INPUT_STRING_LENGTH = 100_000

function inspectInput(value, path, depth, state, { scalarMax = MAX_INPUT_STRING_LENGTH } = {}) {
  if (depth > MAX_INPUT_DEPTH) return `${path} is nested too deeply`
  if (typeof value === 'string') {
    if (value.length > scalarMax) return `${path} is too long`
    if (/\u0000/.test(value)) return `${path} contains an invalid character`
    return null
  }
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return null
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return null
  if (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array) return null
  if (typeof value !== 'object') return `${path} has an invalid value`
  if (state.keys + Object.keys(value).length > MAX_INPUT_KEYS) return 'Request contains too many fields'
  state.keys += Object.keys(value).length
  for (const [key, child] of Object.entries(value)) {
    if (BLOCKED_KEYS.has(key)) return `${path}.${key} is not allowed`
    const error = inspectInput(child, `${path}.${key}`, depth + 1, state, { scalarMax })
    if (error) return error
  }
  return null
}

/**
 * Shared request-boundary validation. Route handlers still validate their
 * domain fields, while this middleware rejects malformed object graphs,
 * prototype-pollution keys, control characters, and oversized scalar values
 * consistently across every API route.
 */
export function validateRequestInput(req, res, next) {
  const queryError = inspectInput(req.query || {}, 'query', 0, { keys: 0 }, { scalarMax: 2_000 })
  if (queryError) return res.status(400).json({ error: queryError })
  const paramsError = inspectInput(req.params || {}, 'params', 0, { keys: 0 }, { scalarMax: 255 })
  if (paramsError) return res.status(400).json({ error: paramsError })
  if (req.body !== undefined) {
    const bodyError = inspectInput(req.body, 'body', 0, { keys: 0 })
    if (bodyError) return res.status(400).json({ error: bodyError })
  }
  return next()
}
