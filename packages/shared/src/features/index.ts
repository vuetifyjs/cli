import type { PackageJson } from 'pkg-types'
import type { Feature } from './types'
import { nuxtClientHints } from './client-hints'
import { cssNone } from './css-none'
import { eslint } from './eslint'
import { i18n } from './i18n'
import { mcp } from './mcp'
import { pinia } from './pinia'
import { fileRouter, router } from './router'
import { tailwindcss } from './tailwindcss'
import { unocss, unocssVuetify, unocssWind4 } from './unocss'

export * from './client-hints'
export * from './css-none'
export * from './eslint'
export * from './i18n'
export * from './mcp'
export * from './pinia'
export * from './router'
export * from './tailwindcss'
export * from './types'
export * from './unocss'

export const features: Record<string, Feature> = {
  router,
  'file-router': fileRouter,
  pinia,
  i18n,
  eslint,
  mcp,
  'client-hints': nuxtClientHints,
  unocss,
  'unocss-wind4': unocssWind4,
  'unocss-vuetify': unocssVuetify,
  tailwindcss,
  'css-none': cssNone,
}

export async function applyFeatures (
  cwd: string,
  featureNames: string[],
  pkg: PackageJson,
  isTypescript: boolean,
  isNuxt: boolean,
  type?: 'vuetify' | 'vuetify0',
) {
  for (const name of featureNames) {
    const feature = features[name]
    if (feature) {
      await feature.apply({ cwd, pkg, isTypescript, isNuxt, type })
    }
  }
}
