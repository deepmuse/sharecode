import { useTranslation } from 'react-i18next'
import type { Locale } from '@/i18n'

export function useLanguage() {
  const { i18n } = useTranslation()
  const locale = (i18n.language?.startsWith('zh') ? 'zh'
    : i18n.language?.startsWith('ja') ? 'ja' : 'en') as Locale
  return { locale }
}