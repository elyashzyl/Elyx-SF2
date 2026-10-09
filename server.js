import 'dotenv/config'
import express from 'express'

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
import reportRoutes from './routes/reports.js'
import announcementRoutes from './routes/announcements.js'
import quarterlyRoutes from './routes/quarterly.js'
import gradingRoutes from './routes/grading.js'
import { validateRequestInput } from './lib/validation.js'
import { startExpirationReminderScheduler } from './lib/expirationReminders.js'

process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection:', reason);
});

const app = express()

// Resolve HTTP bind host and port with container safety
let HOST = '0.0.0.0'
const rawHost = String(process.env.HOST || '').trim()
if (rawHost && ['0.0.0.0', '127.0.0.1', 'localhost', '::'].includes(rawHost)) {
  HOST = rawHost
} else if (process.env.APP_HOST) {
  HOST = process.env.APP_HOST
} else if (rawHost) {
  console.warn(`[server] HOST="${rawHost}" is not a local interface address. Binding to 0.0.0.0 for container accessibility.`)
  HOST = '0.0.0.0'
}
if (process.env.NODE_ENV === 'production' && (HOST === '127.0.0.1' || HOST === 'localhost')) {
  console.warn(`[server] HOST is "${HOST}" in production container. Overriding to 0.0.0.0 so reverse proxy can route traffic.`)
  HOST = '0.0.0.0'
}

let PORT = 3001
let mirrorPort = null
const envPort = parseInt(process.env.PORT || '3001', 10)
if (!isNaN(envPort) && envPort > 0) {
  if (envPort === 3306 && (process.env.DB_PORT === '3306' || process.env.DB_CONNECTION === 'mysql' || process.env.DATABASE_URL)) {
    console.warn('[server] PORT is set to 3306 (MySQL port). Binding HTTP server to 3001 and mirroring on 3306 for reverse proxy compatibility.')
    PORT = 3001
    mirrorPort = 3306
  } else {
    PORT = envPort
    if (PORT !== 3001) {
      mirrorPort = 3001
    }
  }
}

function assertProductionConfiguration() {
  if (process.env.NODE_ENV !== 'production') return
  const hasUrl = Boolean(String(process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.DB_URL || '').trim())
  const hasParts = Boolean(String(process.env.DB_HOST || '').trim() && String(process.env.DB_DATABASE || '').trim() && String(process.env.DB_USERNAME || '').trim())
  const connection = String(process.env.DB_CONNECTION || '').toLowerCase()
  if (connection === 'sqlite') {
    throw new Error('Production requires MySQL; SQLite is disabled for production deployments')
  }
  if (!hasUrl && !hasParts) {
    throw new Error('Production requires DATABASE_URL or DB_HOST, DB_DATABASE, DB_USERNAME')
  }
  if (process.env.ALLOW_LEGACY_PASSWORD_LOGIN === '1') {
    throw new Error('ALLOW_LEGACY_PASSWORD_LOGIN must not be enabled in production')
  }
  if (process.env.SECRETS_ROTATED !== '1') {
    console.warn('[config] SECRETS_ROTATED is not set to 1; verify provider credentials before production use')
  }
}

assertProductionConfiguration()

let dbReady = false

function normalizeOrigin(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  try {
    const url = new URL(text)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return ''
    return `${url.protocol}//${url.host}`
  } catch {
    return ''
  }
}

function allowedOrigins() {
  return [...new Set([
    ...String(process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(normalizeOrigin)
      .filter(Boolean),
    ...String(process.env.CORS_ORIGINS || '')
      .split(',')
      .map(normalizeOrigin)
      .filter(Boolean),
    // The frontend and API are normally served from the same public URL.
    // APP_URL is therefore a safe fallback when a separate CORS variable is
    // not configured, while explicit allowlists still take precedence.
    normalizeOrigin(process.env.APP_URL)
  ].filter(Boolean))]
}

const configuredOrigins = allowedOrigins()
const isProduction = process.env.NODE_ENV === 'production'

function requestOrigin(req) {
  const forwardedProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim()
  const forwardedHost = String(req.get('x-forwarded-host') || '').split(',')[0].trim()
  const protocol = forwardedProto || req.protocol
  const host = forwardedHost || req.get('host')
  return normalizeOrigin(`${protocol}://${host}`)
}

function getHost(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  try {
    const url = new URL(text.includes('://') ? text : `http://${text}`)
    return (url.host || '').toLowerCase()
  } catch {
    return text.toLowerCase()
  }
}

function originAllowed(req, origin) {
  const normalized = normalizeOrigin(origin)
  if (!normalized) return false
  // Same-origin requests must continue to work even when the reverse proxy's
  // internal host differs from the public host seen by the browser.
  const reqOrig = requestOrigin(req)
  if (normalized === reqOrig) return true
  if (configuredOrigins.includes(normalized)) return true

  // Allow requests from the same host when protocol differs (e.g. reverse proxy SSL termination)
  const originHost = getHost(normalized)
  const reqHost = getHost(reqOrig) || getHost(req.get('x-forwarded-host') || req.get('host'))
  if (originHost && reqHost && originHost === reqHost) return true

  // Check if configuredOrigins matches the origin's host
  if (originHost && configuredOrigins.some(c => getHost(c) === originHost)) return true

  return !isProduction && configuredOrigins.length === 0
}

app.set('trust proxy', 1)
app.use((req, res, next) => {
  const origin = String(req.get('origin') || '').trim()
  // Requests without Origin include normal browser navigations, health checks,
  // images, and command-line clients; they do not need CORS response headers.
  if (!origin) return next()
  if (!originAllowed(req, origin)) {
    console.warn('[cors] rejected origin', JSON.stringify({
      origin: normalizeOrigin(origin),
      requestOrigin: requestOrigin(req),
      configuredOrigins
    }))
    return res.status(403).json({ error: 'CORS origin is not allowed' })
  }
  res.setHeader('Access-Control-Allow-Origin', normalizeOrigin(origin))
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-User-ID, X-User-Role')
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.status(204).end()
  return next()
})
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
  const normalized = normalizeOrigin(origin)
  // Use the same forwarded-host/proto-aware calculation as the CORS layer.
  // Coolify terminates TLS before forwarding the request to Node, so req.protocol
  // and req.get('host') may otherwise describe the internal container address.
  return normalized === requestOrigin(req) || configuredOrigins.includes(normalized)
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
  if (req.path === '/api/health' || req.path === '/health') return next()
  if (!dbReady) {
    return res.status(503).json({ error: 'Server is starting up, please wait', status: 'starting' })
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
app.use('/api/reports', reportRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/quarterly', quarterlyRoutes)
app.use('/api/grading', gradingRoutes)

app.get(['/api/health', '/health'], async (req, res) => {
  if (!dbReady) {
    return res.status(200).json({ status: 'starting', db: DB_MODE })
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

const isTestRun = Boolean(
  process.env.NODE_TEST_CONTEXT ||
  (process.argv[1] && (process.argv[1].includes('.test.') || process.argv[1].includes('test.mjs')))
)

const isMainModule = !isTestRun && (
  !process.argv[1] ||
  process.argv[1].endsWith('server.js') ||
  process.argv[1].endsWith('server.mjs') ||
  (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) ||
  process.env.NODE_ENV === 'production'
)

if (isMainModule) {
  // Bind to configured PORT and also mirror on both 3000 and 3001 so reverse proxies
  // (Coolify, Traefik, Railway, Docker) route traffic regardless of whether their default
  // upstream was left at 3000 or set to 3001.
  const portsToListen = [PORT, 3000, 3001].filter(Boolean)
  const uniquePorts = [...new Set(portsToListen)]

  for (const p of uniquePorts) {
    try {
      const s = app.listen(p, HOST, () => {
        console.log(`[server] Server listening on http://${HOST}:${p}`)
      })
      s.on('error', (err) => {
        if (p === PORT) {
          console.error(`[server] Primary port ${p} error on ${HOST}:`, err.message)
          if (HOST !== '0.0.0.0') {
            console.log(`[server] Retrying primary listen on 0.0.0.0:${p}...`)
            app.listen(p, '0.0.0.0')
          }
        } else {
          // Additional/mirror port may be in use or unavailable; log without failing
          console.warn(`[server] Additional port ${p} mirror not active: ${err.message}`)
        }
      })
    } catch (err) {
      if (p === PORT) {
        console.error(`[server] Failed to bind primary port ${p}: ${err.message}`)
      }
    }
  }

  initializeServerDatabase().then(() => {
    console.log('[server] Database initialized and ready for requests')
    startExpirationReminderScheduler()
  }).catch(err => {
    console.error('Failed to initialize database on startup:', err.message)
    // Keep server process running so reverse proxy can route traffic and return informative status
  })
}

export default app
