import { Router } from 'express'
import { redis } from '../utils/redis.js'
import { generateShortCode, hashToken, generateToken } from '../utils/shortCode.js'
import { AppError, ErrorCode } from '../utils/errors.js'
import { validateCreateShare } from '../middleware/validate.js'

const MAX_CODES = Number(process.env.MAX_CODES_PER_SHARE) || 1000
const DEFAULT_EXPIRE_HOURS = Number(process.env.DEFAULT_EXPIRE_HOURS) || 168

interface CreateShareBody {
  codes?: string[]
  expireHours?: number
}

interface RouteContext {
  apiUrl: string
  appUrl: string
}

export function createShareRouter(ctx: RouteContext): Router {
  const router = Router()

  router.post('/', validateCreateShare, async (req, res, next) => {
    try {
      const { codes, expireHours } = req.body as CreateShareBody

      const filtered = codes!
        .map((c) => String(c).trim())
        .filter((c) => c.length > 0)

      const shareId = generateShortCode()
      const manageToken = generateToken()
      const tokenHash = hashToken(manageToken)
      const ttl = (expireHours || DEFAULT_EXPIRE_HOURS) * 3600
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

      const multi = redis.multi()
      multi.hset(`share:${shareId}`, {
        token: tokenHash,
        total: filtered.length,
        claimedCount: 0,
        createdAt: new Date().toISOString(),
        expiresAt,
      })
      multi.expire(`share:${shareId}`, ttl)
      multi.rpush(`share:${shareId}:pool`, ...filtered)
      multi.expire(`share:${shareId}:pool`, ttl)
      multi.hset(`share:${shareId}:stats`, 'visitCount', 0, 'claimCount', 0)
      multi.expire(`share:${shareId}:stats`, ttl)

      await multi.exec()

      console.log(`[CREATE] shareId=${shareId} total=${filtered.length}`)

      res.status(201).json({
        shareId,
        claimUrl: `${ctx.appUrl}/s/${shareId}`,
        manageUrl: `${ctx.appUrl}/manage/${shareId}?token=${manageToken}`,
        total: filtered.length,
        expiresAt,
      })
    } catch (err) {
      next(err)
    }
  })

  return router
}