const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw { status: res.status, ...data }
  }
  return data as T
}

export interface CreateShareResponse {
  shareId: string
  claimUrl: string
  manageUrl: string
  total: number
  expiresAt: string
}

export interface ClaimResponse {
  status: 'ok' | 'empty'
  code?: string
  remain?: number
  message?: string
}

export interface ManageResponse {
  shareId: string
  total: number
  claimed: number
  remain: number
  expiresAt: string
  createdAt: string
  stats: {
    visitCount: number
    claimCount: number
    lastClaimAt: string | null
  }
  items: { code: string; status: 'claimed'; claimedAt: string }[]
}

export interface ApiError {
  status: string
  code: number
  i18nKey?: string
  message: string
}

export const api = {
  createShare: (codes: string[], expireHours?: number) =>
    request<CreateShareResponse>('/share', {
      method: 'POST',
      body: JSON.stringify({ codes, expireHours }),
    }),

  claimCode: (shareId: string) =>
    request<ClaimResponse>(`/claim/${shareId}`, { method: 'POST' }),

  getManage: (shareId: string, token: string) =>
    request<ManageResponse>(`/manage/${shareId}?token=${encodeURIComponent(token)}`),
}