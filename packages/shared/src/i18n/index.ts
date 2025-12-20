import type { TranslateOptions } from 'i18n-js'
import type { TranslationKey } from './types'
import { i18n as _i18n } from './setup'

export * from './language'
export * from './types'

export const i18n = _i18n as Omit<typeof _i18n, 't'> & {
  t: (scope: TranslationKey, options?: TranslateOptions) => string
}
