import { Router } from 'express'
import { redis } from '../utils/redis.js'
import { AppError, ErrorCode } from '../utils/errors.js'

const CLAIM_LUA = `
local shareKey = KEYS[1]
local poolKey = KEYS[2]
local claimedKey = KEYS[3]
local statsKey = KEYS[4]

local exists = redis.call('EXISTS', shareKey)
if exists == 0 then
  return {"err", "NOT_FOUND"}
end

local code = redis.call('LPOP', poolKey)
if not code then
  return {"err", "EXHAUSTED"}
end

local now = ARGV[1]
redis.call('RPUSH', claimedKey, code .. '::' .. now)
redis.call('EXPIRE', claimedKey, 8640000)
redis.call('HINCRBY', shareKey, 'claimedCount', 1)
redis.call('HINCRBY', statsKey, 'claimCount', 1)

local remain = redis.call('LLEN', poolKey)

return {code, tostring(remain)}
`

export function claimRouter(): Router {
  const router = Router()

  router.post('/:shareId', async (req, res, next) => {
    try {
      const { shareId } = req.params

      const meta = await redis.hgetall(`share:${shareId}`)
      if (!meta || !meta.token) {
        throw new AppError(ErrorCode.SHARE_NOT_FOUND, 404)
      }

      if (meta.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
        throw new AppError(ErrorCode.SHARE_EXPIRED, 410)
      }

      const result = await redis.eval(
        CLAIM_LUA,
        4,
        `share:${shareId}`,
        `share:${shareId}:pool`,
        `share:${shareId}:claimed`,
        `share:${shareId}:stats`,
        new Date().toISOString(),
      )

      const arr = result as any[]

      if (arr.length === 2 && arr[0] === 'err') {
        const errType = arr[1]
        if (errType === 'EXHAUSTED') throw new AppError(ErrorCode.CODES_EXHAUSTED, 410)
      }

      const [code, remain] = arr

      console.log(`[CLAIM] shareId=${shareId} code=${code} remain=${remain}`)

      res.json({
        status: 'ok',
        code,
        remain: Number(remain),
      })
    } catch (err) {
      next(err)
    }
  })

  return router
}