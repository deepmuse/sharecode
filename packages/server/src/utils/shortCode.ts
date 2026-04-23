import crypto from 'crypto'

const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DEFAULT_LENGTH = Number(process.env.SHORT_CODE_LENGTH) || 6

export function generateShortCode(length: number = DEFAULT_LENGTH): string {
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i]! % CHARSET.length]
  }
  return result
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}