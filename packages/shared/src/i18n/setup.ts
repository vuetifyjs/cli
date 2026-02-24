import { I18n } from 'i18n-js'
import { getCurrentLocale } from './language'
import enBase from './locales/en.json' with { type: 'json' }
import ruBase from './locales/ru.json' with { type: 'json' }

function normalizeLocale (locale?: string) {
  return (locale ?? 'en').split('-')[0].toLowerCase()
}

export const i18n = new I18n({
  en: enBase,
  ru: ruBase,
}, {
  defaultLocale: 'en',
  enableFallback: true,
  locale: normalizeLocale(getCurrentLocale()),
})
