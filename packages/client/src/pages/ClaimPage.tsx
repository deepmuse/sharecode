import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Copy, Gift, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, type ClaimResponse, type ApiError } from '@/lib/api'
import { showToast } from '@/components/ui/toast'
import { ToastContainer } from '@/components/ui/toast'

type PageState = 'idle' | 'loading' | 'success' | 'empty' | 'expired' | 'not_found' | 'error'

export default function ClaimPage() {
  const { t } = useTranslation()
  const { shareId } = useParams<{ shareId: string }>()
  const [state, setState] = useState<PageState>('idle')
  const [claimedCode, setClaimedCode] = useState('')
  const [remain, setRemain] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const handleClaim = async () => {
    if (!shareId) return
    setState('loading')
    try {
      const data: ClaimResponse = await api.claimCode(shareId)
      if (data.status === 'ok' && data.code) {
        setClaimedCode(data.code)
        setRemain(data.remain ?? 0)
        setState('success')
      } else {
        setState('empty')
      }
    } catch (err) {
      const e = err as ApiError
      const i18nMsg = e.i18nKey ? t(`error.${e.i18nKey}` as string, e.message) : e.message
      if (e.code === 41002) setState('empty')
      else if (e.code === 41001) { setState('expired'); setErrorMsg(i18nMsg) }
      else if (e.code === 40401) { setState('not_found'); setErrorMsg(i18nMsg) }
      else { setState('error'); setErrorMsg(i18nMsg) }
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(claimedCode)
    showToast(t('common.copySuccess'), 'success')
  }

  const renderContent = () => {
    switch (state) {
      case 'success':
        return (
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-success mx-auto" />
              <p className="text-sm text-muted-foreground">{t('claim.successMsg')}</p>
              <p className="text-2xl font-mono font-bold">{claimedCode}</p>
              <p className="text-xs text-muted-foreground">{t('claim.remainCount', { count: remain })}</p>
            </div>
            <Button className="w-full" onClick={copyCode}>
              <Copy className="h-4 w-4" />
              {t('claim.copyCode')}
            </Button>
          </CardContent>
        )

      case 'empty':
        return (
          <CardContent className="text-center space-y-3 py-8">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">{t('claim.exhausted')}</p>
          </CardContent>
        )

      case 'expired':
        return (
          <CardContent className="text-center space-y-3 py-8">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-destructive">{errorMsg || t('claim.expired')}</p>
          </CardContent>
        )

      case 'not_found':
        return (
          <CardContent className="text-center space-y-3 py-8">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">{errorMsg || t('claim.notFound')}</p>
          </CardContent>
        )

      case 'error':
        return (
          <CardContent className="text-center space-y-3 py-8">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-destructive">{errorMsg || t('claim.error')}</p>
          </CardContent>
        )

      default:
        return (
          <CardContent>
            <Button className="w-full" size="lg" onClick={handleClaim} disabled={state === 'loading'}>
              {state === 'loading' ? t('claim.claiming') : t('claim.claimBtn')}
            </Button>
          </CardContent>
        )
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <ToastContainer />
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Gift className="h-6 w-6" />
            {t('claim.title')}
          </CardTitle>
          {state === 'idle' && <CardDescription>{t('claim.subtitle')}</CardDescription>}
        </CardHeader>
        {renderContent()}
      </Card>
    </div>
  )
}