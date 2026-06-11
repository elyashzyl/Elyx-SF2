import express from 'express'
import cors from 'cors'
import { initDatabase } from './db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import studentRoutes from './routes/students.js'
import attendanceRoutes from './routes/attendance.js'

const app = express()
const PORT = process.env.PORT || 3001

let dbReady = false

app.use(cors())
app.use(express.json())

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

app.get('/api/health', (req, res) => {
  res.json({ status: dbReady ? 'ok' : 'starting' })
})

app.use((err, req, res, next) => {
  console.error('Server error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

initDatabase().then(() => {
  dbReady = true
  console.log('Database initialized')
}).catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})
