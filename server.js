import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { initDatabase, query, DB_MODE } from './db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import studentRoutes from './routes/students.js'
import attendanceRoutes from './routes/attendance.js'
import settingsRoutes from './routes/settings.js'
import eventRoutes from './routes/events.js'
import dashboardRoutes from './routes/dashboard.js'
import monthlyRoutes from './routes/monthly.js'
import exportRoutes from './routes/export.js'
import schoolRoutes from './routes/schools.js'
import logRoutes from './routes/logs.js'
import scheduleRoutes from './routes/schedules.js'
import licenseRoutes from './routes/licenses.js'
import inquiryRoutes from './routes/inquiries.js'
import paymentMethodRoutes from './routes/payment_methods.js'
import subscriptionRoutes from './routes/subscriptions.js'
import { validateRequestInput } from './lib/validation.js'

const app = express()
const PORT = process.env.PORT || 3001

function assertProductionConfiguration() {
  if (process.env.NODE_ENV !== 'production') return
  const hasUrl = Boolean(String(process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.DB_URL || '').trim())
  const hasParts = ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'].every(name => String(process.env[name] || '').trim())
  const connection = String(process.env.DB_CONNECTION || '').toLowerCase()
  if (connection === 'sqlite') {
    throw new Error('Production requires MySQL; SQLite is disabled for production deployments')
  }
  if (!hasUrl && !hasParts) {
    throw new Error('Production requires DATABASE_URL or DB_HOST, DB_DATABASE, DB_USERNAME, and DB_PASSWORD')
  }
  if (process.env.ALLOW_LEGACY_PASSWORD_LOGIN === '1') {
    throw new Error('ALLOW_LEGACY_PASSWORD_LOGIN must not be enabled in production')
  }
  if (process.env.SECRETS_ROTATED !== '1') {
    throw new Error('Set SECRETS_ROTATED=1 after rotating provider credentials and exposed application secrets')
  }
}

assertProductionConfiguration()

let dbReady = false

function allowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

const configuredOrigins = allowedOrigins()
const isProduction = process.env.NODE_ENV === 'production'

app.set('trust proxy', 1)
app.use(cors({
  origin(origin, callback) {
    // Same-origin requests and command-line clients do not send Origin.
    if (!origin) return callback(null, true)
    if (configuredOrigins.includes(origin)) return callback(null, true)
    if (!isProduction && configuredOrigins.length === 0) return callback(null, true)
    return callback(new Error('CORS origin is not allowed'))
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-User-ID', 'X-User-Role']
}))
// Keep the historical 50 MB ceiling for payment QR/template uploads while
// allowing deployments to choose a smaller limit through API_BODY_LIMIT.
const requestBodyLimit = process.env.API_BODY_LIMIT || '50mb'
app.use(express.json({ limit: requestBodyLimit, strict: true }))
app.use(express.urlencoded({ limit: requestBodyLimit, extended: false }))
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({ error: 'Request body is too large' })
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body contains invalid JSON' })
  }
  return next(err)
})
app.use('/api', validateRequestInput)

// Small in-process limiter for deployment safety. This is intentionally a
// defense-in-depth control; multi-instance deployments should also enforce
// limits at the reverse proxy or API gateway.
const rateBuckets = new Map()
const rateWindowMs = Math.max(10_000, Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000))
const rateLimitMax = Math.max(1, Number(process.env.RATE_LIMIT_MAX || 120))
const sensitiveRateLimitMax = Math.max(1, Number(process.env.SENSITIVE_RATE_LIMIT_MAX || 20))
function rateLimit(req, res, next) {
  if (!isProduction && process.env.RATE_LIMIT_IN_TESTS !== '1') return next()
  const path = req.path || ''
  const sensitive = /^(\/auth\/(login|trial|invitations|password-reset|email-verification)|\/users\/[^/]+\/(invite\/resend|password-reset)|\/inquiries(?:\/|$)|\/payment-methods(?:\/|$)|\/subscriptions(?:\/|$))/.test(path)
  const max = sensitive ? sensitiveRateLimitMax : rateLimitMax
  const key = `${req.ip}:${sensitive ? 'sensitive' : 'general'}`
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || now - bucket.startedAt >= rateWindowMs) {
    rateBuckets.set(key, { startedAt: now, count: 1 })
    return next()
  }
  bucket.count += 1
  if (bucket.count > max) {
    const retryAfter = Math.max(1, Math.ceil((rateWindowMs - (now - bucket.startedAt)) / 1000))
    res.setHeader('Retry-After', retryAfter)
    return res.status(429).json({ error: 'Too many requests. Please try again later.' })
  }
  next()
}
app.use('/api', rateLimit)

function hasSessionCookie(req) {
  return /(?:^|;)\s*elytrack_session=/.test(req.get('cookie') || '')
}

function isSameOriginRequest(req) {
  const origin = req.get('origin')
  if (!origin) return true
  const sameOrigin = `${req.protocol}://${req.get('host')}`
  return origin === sameOrigin || configuredOrigins.includes(origin)
}

// SameSite cookies provide the browser-level default. This additional Origin
// check protects cookie-authenticated state changes when a deployment allows
// cross-origin frontend access through the configured CORS allowlist.
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !hasSessionCookie(req) || isSameOriginRequest(req)) return next()
  return res.status(403).json({ error: 'Cross-site request blocked' })
})

app.use((req, res, next) => {
  const requestId = req.get('X-Request-ID') || crypto.randomUUID()
  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; script-src 'self'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
  }
  const startedAt = Date.now()
  res.on('finish', () => {
    if (isProduction) {
      const actor = req.user ? { id: req.user.id || '', role: req.user.role || '', schoolId: req.user.school_id || '' } : null
      console.info(JSON.stringify({ requestId, method: req.method, path: req.path, actor, status: res.statusCode, durationMs: Date.now() - startedAt }))
    }
  })
  next()
})

app.use((req, res, next) => {
  if (req.path === '/api/health') return next()
  if (!dbReady) {
    return res.status(503).json({ error: 'Server is starting up, please wait' })
  }
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/monthly', monthlyRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/schools', schoolRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/licenses', licenseRoutes)
app.use('/api/inquiries', inquiryRoutes)
app.use('/api/payment-methods', paymentMethodRoutes)
app.use('/api/subscriptions', subscriptionRoutes)

app.get('/api/health', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ status: 'starting', db: 'unknown' })
  }
  const start = Date.now()
  try {
    await query('SELECT 1 as ping')
    const latencyMs = Date.now() - start
    res.json({
      status: 'ok',
      db: DB_MODE,
      latencyMs,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      db: DB_MODE,
      error: err.message,
      timestamp: new Date().toISOString()
    })
  }
})

import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(express.static(join(__dirname, 'dist')))

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

export async function initializeServerDatabase() {
  await initDatabase()
  dbReady = true
  return app
}

const isMainModule = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url
if (isMainModule) {
  const HOST = process.env.HOST || '0.0.0.0'

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`)
  })

  initializeServerDatabase().then(() => {
    console.log('Database initialized')
  }).catch(err => {
    console.error('Failed to initialize database:', err)
    process.exit(1)
  })
}

export default app
