import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, Clock, Users, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, type ManageResponse, type ApiError } from '@/lib/api'
import { ToastContainer } from '@/components/ui/toast'
import { formatDate } from '@/i18n'

type PageState = 'loading' | 'success' | 'error'

export default function ManagePage() {
  const { t } = useTranslation()
  const { shareId } = useParams<{ shareId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [state, setState] = useState<PageState>('loading')
  const [data, setData] = useState<ManageResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchData = async () => {
    if (!shareId || !token) {
      setState('error')
      setErrorMsg(t('manage.missingToken'))
      return
    }
    setState('loading')
    try {
      const result = await api.getManage(shareId, token)
      setData(result)
      setState('success')
    } catch (err) {
      const e = err as ApiError
      setState('error')
      setErrorMsg(e.i18nKey ? t(`error.${e.i18nKey}` as string, e.message) : (e.message || t('manage.fetchFailed')))
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (state === 'error' || !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <ToastContainer />
        <Card className="w-full max-w-lg text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">{errorMsg}</p>
            <Button className="mt-4" variant="outline" onClick={fetchData}>
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const claimedPercent = data.total > 0 ? Math.round((data.claimed / data.total) * 100) : 0

  return (
    <div className="min-h-dvh p-4">
      <ToastContainer />
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('manage.title')}
          </h1>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data.total}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('manage.total')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{data.claimed}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('manage.claimed')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{data.remain}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('manage.remain')}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{t('manage.progressLabel')}</span>
              <span>{claimedPercent}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-success transition-all duration-500"
                style={{ width: `${claimedPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {data.expiresAt && (
          <Card>
            <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t('manage.expiresAt', { time: formatDate(data.expiresAt) })}</span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('manage.detailTitle')}
            </CardTitle>
            <CardDescription>{t('manage.detailDesc', { count: data.claimed })}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">{t('manage.noRecords')}</p>
            ) : (
              <div className="space-y-2">
                {data.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="font-mono">{item.code}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(item.claimedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}