import type { PackageJson } from 'pkg-types'

export interface FeatureContext {
  cwd: string
  pkg: PackageJson
  isTypescript: boolean
  isNuxt: boolean
  clientHints?: boolean
  type?: 'vuetify' | 'vuetify0'
}

export interface Feature {
  name: string
  apply: (context: FeatureContext) => Promise<void>
}
