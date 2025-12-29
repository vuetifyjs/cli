import type { PackageJson } from 'pkg-types'

export interface FeatureContext {
  cwd: string
  pkg: PackageJson
  isTypescript: boolean
  clientHints?: boolean
}

export interface Feature {
  name: string
  apply: (context: FeatureContext) => Promise<void>
}
