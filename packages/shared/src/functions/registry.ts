import { REGISTRY_ORIGIN, REGISTRY_TIMEOUT, REGISTRY_VERSION } from '../constants/registry'
import { i18n } from '../i18n'

export type ItemType = 'components' | 'composables'

export interface RegistryFile {
  path: string
  name: string
  entry: boolean
  content: string
}

/** Icon soft-deps — collections are install units; classes are audit detail. */
export interface RegistryIcons {
  collections: string[]
  classes: string[]
}

export interface RegistryExample {
  id: string
  title: string
  description: string
  dir: string
  files: RegistryFile[]
  dependencies: string[]
  tokens: string[]
  /** Present from registry v1 seed; optional for older payloads. */
  icons?: RegistryIcons
}

export interface RegistryItem {
  name: string
  type: ItemType
  category: string
  level: string
  title: string
  description: string
  docs: string
  examples: RegistryExample[]
}

export interface RegistryIndexEntry {
  name: string
  type: ItemType
  category: string
  level: string
  title: string
  description: string
  docs: string
  examples: string[]
}

export interface RegistryIndex {
  version: number
  v0Version: string
  tokens: string[]
  items: RegistryIndexEntry[]
}

export interface TokenContract {
  version: number
  tokens: string[]
  prefix: string
  unocss: string
  tailwind: string
}

const RE_TRAILING_SLASH = /\/$/
const RE_SEPARATORS = /[\s_]+/g
const RE_FACTORY_PREFIX = /^(create|use)-/

async function get<T> (origin: string, path: string): Promise<T> {
  const url = `${origin.replace(RE_TRAILING_SLASH, '')}/registry/${path}`

  const response = await fetch(url, { signal: AbortSignal.timeout(REGISTRY_TIMEOUT) })
    .catch((error: Error) => {
      throw new Error(i18n.t('errors.registry.unreachable', { url, reason: error.message }))
    })

  if (!response.ok) {
    throw new Error(i18n.t('errors.registry.status', { url, status: response.status }))
  }

  return await response.json() as T
}

export async function getIndex (origin = REGISTRY_ORIGIN) {
  const index = await get<RegistryIndex>(origin, 'index.json')

  // A newer registry may describe items in a shape this CLI cannot write.
  if (index.version > REGISTRY_VERSION) {
    throw new Error(i18n.t('errors.registry.version', { found: index.version, expected: REGISTRY_VERSION }))
  }

  return index
}

export async function getItem (entry: RegistryIndexEntry, origin = REGISTRY_ORIGIN) {
  return await get<RegistryItem>(origin, `${entry.type}/${entry.name}.json`)
}

export async function getContract (origin = REGISTRY_ORIGIN) {
  return await get<TokenContract>(origin, 'tokens.json')
}

/**
 * Candidate registry entries for a user-typed name.
 *
 * Exact matches win outright. Failing that, `add popover` should still find the
 * `usePopover` composable and `add data table` the `createDataTable` one, so
 * the fallback strips the `create`/`use` prefix and tolerates a loose match.
 */
export function match (index: RegistryIndex, query: string): RegistryIndexEntry[] {
  const needle = query.trim().toLowerCase().replace(RE_SEPARATORS, '-')

  const exact = index.items.filter(item => item.name === needle)
  if (exact.length > 0) {
    return exact
  }

  const bare = index.items.filter(item => item.name.replace(RE_FACTORY_PREFIX, '') === needle)
  if (bare.length > 0) {
    return bare
  }

  return index.items.filter(item => item.name.includes(needle) || needle.includes(item.name))
}
