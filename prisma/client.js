// Resolve Prisma's URL locally without mutating process.env. The shared
// database adapter remains the source of truth for the application's backend.
function resolvePrismaUrl() {
  const explicit = (process.env.DATABASE_URL || process.env.MYSQL_URL || '').trim()
  if (explicit) return explicit
  const host = (process.env.DB_HOST || process.env.MYSQL_HOST || '').trim()
  const db = (process.env.DB_DATABASE || process.env.DB_NAME || process.env.MYSQL_DATABASE || '').trim()
  const user = (process.env.DB_USERNAME || process.env.DB_USER || process.env.MYSQL_USER || '').trim()
  if (!host || !db || !user) return ''
  const pass = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''
  const port = (process.env.DB_PORT || process.env.MYSQL_PORT || '3306').trim()
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(db)}`
}

const prismaUrl = resolvePrismaUrl()

let PrismaClient = null
try {
  const mod = await import('@prisma/client')
  PrismaClient = mod.PrismaClient
} catch (_) {
  // Graceful fallback when @prisma/client is not installed or generated in current environment
}

// Global singleton pattern to prevent multiple PrismaClient instances during hot reloads
const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ||
  (PrismaClient && prismaUrl
    ? new PrismaClient({
        datasources: { db: { url: prismaUrl } },
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
      })
    : null)

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

export default prisma
