export const ErrorCode = {
  INVALID_PARAMS: { code: 40001, i18nKey: 'invalidParams', message: '参数不合法' },
  EMPTY_CODES: { code: 40002, i18nKey: 'emptyCodes', message: '码列表为空' },
  EXCEED_LIMIT: { code: 40003, i18nKey: 'exceedLimit', message: '超出创建上限' },
  SHARE_NOT_FOUND: { code: 40401, i18nKey: 'shareNotFound', message: '分享不存在' },
  SHARE_EXPIRED: { code: 41001, i18nKey: 'shareExpired', message: '链接已过期' },
  CODES_EXHAUSTED: { code: 41002, i18nKey: 'codesExhausted', message: '码已领完' },
  RATE_LIMITED: { code: 42901, i18nKey: 'rateLimited', message: '请求过于频繁' },
  INTERNAL_ERROR: { code: 50001, i18nKey: 'internalError', message: '服务内部错误' },
  INVALID_TOKEN: { code: 40301, i18nKey: 'invalidToken', message: '管理凭证无效' },
  BAD_REQUEST: { code: 40001, i18nKey: 'badRequest', message: '请求体格式错误' },
} as const

export class AppError extends Error {
  public readonly code: number
  public readonly i18nKey: string
  public readonly statusCode: number

  constructor(errorCode: (typeof ErrorCode)[keyof typeof ErrorCode], statusCode: number = 400) {
    super(errorCode.message)
    this.code = errorCode.code
    this.i18nKey = errorCode.i18nKey
    this.statusCode = statusCode
  }
}