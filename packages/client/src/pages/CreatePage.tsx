import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Link, QrCode, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, type CreateShareResponse, type ApiError } from '@/lib/api'
import { showToast } from '@/components/ui/toast'
import { ToastContainer } from '@/components/ui/toast'
import { formatDate } from '@/i18n'

export default function CreatePage() {
  const { t } = useTranslation()
  const [codes, setCodes] = useState('')
  const [expireHours, setExpireHours] = useState(168)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CreateShareResponse | null>(null)

  const handleSubmit = async () => {
    const list = codes
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (list.length === 0) {
      showToast(t('create.errorEmpty'), 'error')
      return
    }

    setLoading(true)
    try {
      const data = await api.createShare(list, expireHours)
      setResult(data)
      showToast(t('create.successTitle'), 'success')
    } catch (err) {
      const e = err as ApiError
      showToast(t(`error.${e.i18nKey}` as string, e.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showToast(t('common.copySuccess'), 'success')
  }

  if (result) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <ToastContainer />
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-6 w-6" />
              {t('create.successTitle')}
            </CardTitle>
            <CardDescription>
              {t('create.successDesc', { total: result.total, expiresAt: formatDate(result.expiresAt) })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t('create.claimUrlLabel')}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm break-all">{result.claimUrl}</code>
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(result.claimUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t('create.manageUrlLabel')}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm break-all">{result.manageUrl}</code>
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(result.manageUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={() => setResult(null)}>
              {t('create.createNew')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <ToastContainer />
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Link className="h-6 w-6" />
            {t('create.title')}
          </CardTitle>
          <CardDescription>{t('create.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('create.inputLabel')}</label>
            <Textarea
              placeholder={t('create.placeholder')}
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {t('create.codeCount', { count: codes.split('\n').filter((l) => l.trim()).length })}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Timer className="h-4 w-4" />
              {t('create.expireLabel')}
            </label>
            <Input
              type="number"
              min={1}
              max={8760}
              value={expireHours}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpireHours(Number(e.target.value))}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? t('create.submitting') : t('create.submitBtn')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}