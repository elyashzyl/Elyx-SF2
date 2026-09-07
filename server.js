import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDatabase, DB_MODE } from './db.js'
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

const app = express()
const PORT = process.env.PORT || 3001

let dbReady = false

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  const _writeHead = res.writeHead
  res.writeHead = function (...args) {
    if (this.getHeader('Expires')) this.removeHeader('Expires')
    if (this.getHeader('X-Frame-Options')) this.removeHeader('X-Frame-Options')
    return _writeHead.apply(this, args)
  }
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

app.get('/api/health', (req, res) => {
  res.json({ status: dbReady ? 'ok' : 'starting', db: dbReady ? DB_MODE : 'unknown' })
})

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

const HOST = process.env.HOST || '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`)
})

initDatabase().then(() => {
  dbReady = true
  console.log('Database initialized')
}).catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})
