import type { PackageJson } from 'pkg-types'
import type { Feature } from './types'
import { eslint } from './eslint'
import { i18n } from './i18n'
import { mcp } from './mcp'
import { pinia } from './pinia'
import { fileRouter, router } from './router'
import { vuetifyNuxtModule } from './vuetify-nuxt-module'

export const features: Record<string, Feature> = {
  router,
  'file-router': fileRouter,
  pinia,
  i18n,
  eslint,
  mcp,
  'vuetify-nuxt-module': vuetifyNuxtModule,
}

export async function applyFeatures (
  cwd: string,
  featureNames: string[],
  pkg: PackageJson,
  isTypescript: boolean,
  clientHints?: boolean,
  type?: 'vuetify' | 'vuetify0',
) {
  for (const name of featureNames) {
    const feature = features[name]
    if (feature) {
      await feature.apply({ cwd, pkg, isTypescript, clientHints, type })
    }
  }
}
