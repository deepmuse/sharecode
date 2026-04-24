import { Request, Response, NextFunction } from 'express'
import { AppError, ErrorCode } from '../utils/errors.js'

const MAX_CODE_LENGTH = 500
const MAX_CODES = Number(process.env.MAX_CODES_PER_SHARE) || 1000

export function validateCreateShare(req: Request, _res: Response, next: NextFunction) {
  const { codes, expireHours } = req.body

  if (!codes || !Array.isArray(codes)) {
    throw new AppError(ErrorCode.INVALID_PARAMS)
  }

  for (const code of codes) {
    if (typeof code !== 'string' || code.trim().length === 0) continue
    if (code.trim().length > MAX_CODE_LENGTH) {
      throw new AppError(ErrorCode.INVALID_PARAMS)
    }
  }

  const filtered = codes.filter((c: unknown) => typeof c === 'string' && c.trim().length > 0)
  if (filtered.length === 0) {
    throw new AppError(ErrorCode.EMPTY_CODES)
  }

  if (filtered.length > MAX_CODES) {
    throw new AppError(ErrorCode.EXCEED_LIMIT)
  }

  if (expireHours !== undefined && (typeof expireHours !== 'number' || expireHours < 1 || expireHours > 8760)) {
    throw new AppError(ErrorCode.INVALID_PARAMS)
  }

  next()
}