import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { createShareRouter } from './routes/share.js'
import { claimRouter } from './routes/claim.js'
import { manageRouter } from './routes/manage.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/logger.js'
import { redis } from './utils/redis.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const API_URL = process.env.API_URL || 'http://localhost:3001'
const APP_URL = process.env.APP_URL || 'http://localhost:5173'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '../../public')

app.use(cors({ origin: APP_URL }))
app.use(express.json())
app.use(requestLogger)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const rateLimitMessage = { status: 'error', code: 42901, i18nKey: 'rateLimited', message: '请求过于频繁，请稍后再试' }

const createLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_CREATE_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_CREATE_MAX) || 10,
  message: rateLimitMessage,
})

const claimLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_CLAIM_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_CLAIM_MAX) || 5,
  message: rateLimitMessage,
})

app.use('/api/share', createLimiter, createShareRouter({ apiUrl: API_URL, appUrl: APP_URL }))
app.use('/api/claim', claimLimiter, claimRouter())
app.use('/api/manage', manageRouter())

app.use(express.static(publicDir))

app.get('/{*path}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next()
  }

  res.sendFile(path.join(publicDir, 'index.html'))
})

app.use(errorHandler)

async function start() {
  try {
    await redis.ping()
    console.log('Redis connected')
  } catch (err) {
    console.error('Redis connection failed:', err)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()