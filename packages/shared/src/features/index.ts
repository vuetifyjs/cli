import type { PackageJson } from 'pkg-types'
import type { Feature } from './types'
import { cssNone } from './css-none'
import { eslint } from './eslint'
import { i18n } from './i18n'
import { mcp } from './mcp'
import { pinia } from './pinia'
import { fileRouter, router } from './router'
import { tailwindcss } from './tailwindcss'
import { unocss } from './unocss'
import { vuetifyNuxtManual } from './vuetify-nuxt-manual'
import { vuetifyNuxtModule } from './vuetify-nuxt-module'

export * from './css-none'
export * from './eslint'
export * from './i18n'
export * from './mcp'
export * from './pinia'
export * from './router'
export * from './tailwindcss'
export * from './types'
export * from './unocss'
export * from './vuetify-nuxt-manual'
export * from './vuetify-nuxt-module'

export const features: Record<string, Feature> = {
  router,
  'file-router': fileRouter,
  pinia,
  i18n,
  eslint,
  mcp,
  'vuetify-nuxt-module': vuetifyNuxtModule,
  'vuetify-nuxt-manual': vuetifyNuxtManual,
  unocss,
  tailwindcss,
  'css-none': cssNone,
}

export async function applyFeatures (
  cwd: string,
  featureNames: string[],
  pkg: PackageJson,
  isTypescript: boolean,
  isNuxt: boolean,
  clientHints?: boolean,
  type?: 'vuetify' | 'vuetify0',
) {
  for (const name of featureNames) {
    const feature = features[name]
    if (feature) {
      await feature.apply({ cwd, pkg, isTypescript, isNuxt, clientHints, type })
    }
  }
}
