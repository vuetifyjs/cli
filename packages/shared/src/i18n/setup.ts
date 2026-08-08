import { I18n } from 'i18n-js'
import enBase from './locales/en.json' with { type: 'json' }

export const i18n = new I18n({
  en: enBase,
}, {
  defaultLocale: 'en',
  enableFallback: true,
  locale: 'en',
})
