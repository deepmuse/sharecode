import { Router } from 'express'
import { redis } from '../utils/redis.js'
import { hashToken } from '../utils/shortCode.js'
import { AppError, ErrorCode } from '../utils/errors.js'

export function manageRouter(): Router {
  const router = Router()

  router.get('/:shareId', async (req, res, next) => {
    try {
      const { shareId } = req.params
      const token = req.query.token as string

      if (!token) {
        throw new AppError(ErrorCode.INVALID_TOKEN, 403)
      }

      const meta = await redis.hgetall(`share:${shareId}`)

      if (!meta || !meta.token) {
        throw new AppError(ErrorCode.SHARE_NOT_FOUND, 404)
      }

      if (hashToken(token) !== meta.token) {
        throw new AppError(ErrorCode.INVALID_TOKEN, 403)
      }

      const now = Date.now()
      if (meta.expiresAt && new Date(meta.expiresAt).getTime() < now) {
        throw new AppError(ErrorCode.SHARE_EXPIRED, 410)
      }

      const [claimedRaw, stats] = await Promise.all([
        redis.lrange(`share:${shareId}:claimed`, 0, -1),
        redis.hgetall(`share:${shareId}:stats`),
      ])

      const items = claimedRaw.map((entry) => {
        const [code, claimedAt] = entry.split('::')
        return { code, status: 'claimed', claimedAt }
      })

      const claimedCount = Number(meta.claimedCount) || items.length
      const total = Number(meta.total)
      const remain = total - claimedCount

      res.json({
        shareId,
        total,
        claimed: claimedCount,
        remain,
        expiresAt: meta.expiresAt,
        createdAt: meta.createdAt,
        stats: {
          visitCount: Number(stats.visitCount) || 0,
          claimCount: Number(stats.claimCount) || claimedCount,
          lastClaimAt: items.length > 0 ? items[items.length - 1].claimedAt : null,
        },
        items,
      })
    } catch (err) {
      next(err)
    }
  })

  return router
}