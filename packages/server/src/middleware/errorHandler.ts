import { Request, Response, NextFunction } from 'express'
import { AppError, ErrorCode } from '../utils/errors.js'

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      i18nKey: err.i18nKey,
      message: err.message,
    })
  }

  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return res.status(400).json({
      status: 'error',
      code: ErrorCode.BAD_REQUEST.code,
      i18nKey: ErrorCode.BAD_REQUEST.i18nKey,
      message: ErrorCode.BAD_REQUEST.message,
    })
  }

  console.error('Unhandled error:', err)
  res.status(500).json({
    status: 'error',
    code: ErrorCode.INTERNAL_ERROR.code,
    i18nKey: ErrorCode.INTERNAL_ERROR.i18nKey,
    message: ErrorCode.INTERNAL_ERROR.message,
  })
}