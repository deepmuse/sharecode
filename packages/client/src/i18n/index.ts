import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zh from './locales/zh.json'
import en from './locales/en.json'
import ja from './locales/ja.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
      ja: { translation: ja },
    },
    fallbackLng: 'zh',
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'sharecode-lang',
      convertDetectedLanguage: (lng: string) => {
        const map: Record<string, string> = { zh: 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hk': 'zh', 'zh-hans': 'zh', 'zh-hant': 'zh' }
        const lower = lng.toLowerCase()
        return map[lower] ?? lower.split('-')[0]!
      },
    },
  })

export default i18n

export type Locale = 'zh' | 'en' | 'ja'

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
}

export const LOCALE_DATE_FORMATS: Record<Locale, Intl.DateTimeFormatOptions> = {
  zh: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
  en: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  ja: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
}

export function formatDate(date: string | Date, locale: string = 'zh'): string {
  const lng = locale.startsWith('zh') ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US'
  return new Date(date).toLocaleString(lng, LOCALE_DATE_FORMATS[locale as Locale] ?? LOCALE_DATE_FORMATS.zh)
}