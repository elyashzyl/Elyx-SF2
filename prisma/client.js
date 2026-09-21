// Ensure DATABASE_URL is populated for Prisma when individual DB_* variables are provided
if (!process.env.DATABASE_URL && process.env.DB_HOST && process.env.DB_DATABASE && process.env.DB_USERNAME) {
  const host = process.env.DB_HOST.trim()
  const db = (process.env.DB_DATABASE || process.env.DB_NAME)?.trim()
  const user = (process.env.DB_USERNAME || process.env.DB_USER)?.trim()
  const pass = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''
  const port = (process.env.DB_PORT || process.env.MYSQL_PORT)?.trim() || '3306'
  process.env.DATABASE_URL = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(db)}`
}

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
  (PrismaClient
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
      })
    : null)

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

export default prisma
