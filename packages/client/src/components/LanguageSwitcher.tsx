import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import type { Locale } from '@/i18n'
import { LOCALE_LABELS } from '@/i18n'

const LOCALES = Object.keys(LOCALE_LABELS) as Locale[]

function resolveLocale(lng: string): Locale {
  if (LOCALE_LABELS[lng as Locale]) return lng as Locale
  const lower = lng.toLowerCase()
  if (lower.startsWith('zh')) return 'zh'
  if (lower.startsWith('ja')) return 'ja'
  return 'en'
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const currentLocale = resolveLocale(i18n.language)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLang = (lng: Locale) => {
    i18n.changeLanguage(lng)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        aria-label={LOCALE_LABELS[currentLocale] ?? 'Language'}
      >
        <Globe className="h-4 w-4" />
        {LOCALE_LABELS[currentLocale]}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-md border bg-popover p-1 shadow-md">
          {LOCALES.map((lng) => (
            <button
              key={lng}
              onClick={() => changeLang(lng)}
              className={`flex w-full items-center rounded-sm px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                currentLocale === lng
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-popover-foreground hover:bg-accent'
              }`}
            >
              {LOCALE_LABELS[lng]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}