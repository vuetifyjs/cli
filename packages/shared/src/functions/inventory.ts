/**
 * Local component-library inventory (`vuetify.json`).
 *
 * Source of truth for tracking stays the user's git tree — this file only
 * indexes what `vuetify add` (and later generate) put on disk, plus optional
 * upstream origin metadata for diff/update in a later phase.
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'pathe'
import { REGISTRY_ORIGIN } from '../constants/registry'

export const INVENTORY_VERSION = 1
export const INVENTORY_FILE = 'vuetify.json'
/** @deprecated Prefer REGISTRY_ORIGIN — kept as alias for inventory call sites. */
export const DEFAULT_REGISTRY = REGISTRY_ORIGIN
export const DEFAULT_COMPONENTS_DIR = 'src/components'

export interface ComponentOrigin {
  /** Registry origin URL used for the install. */
  registry: string
  /** Feature name in that registry (`dialog`, `create-data-table`). */
  name: string
  /** Example id within the feature (`basic`, `gallery`). */
  example: string
  /** `@vuetify/v0` version advertised by the registry index at install time. */
  v0?: string
  type?: 'components' | 'composables'
}

export interface InventoryComponent {
  /** Project-relative directory holding the written files. */
  path: string
  /** Basenames written into that directory. */
  files: string[]
  /** Entry basename (the demo file), when known. */
  entry?: string
  /** Upstream seed, when the component came from a registry. */
  origin?: ComponentOrigin
  title?: string
  docs?: string
}

export interface Inventory {
  version: number
  aliases: {
    components: string
  }
  registries: Record<string, string>
  components: Record<string, InventoryComponent>
}

export function emptyInventory (componentsDir = DEFAULT_COMPONENTS_DIR): Inventory {
  return {
    version: INVENTORY_VERSION,
    aliases: { components: componentsDir },
    registries: { '@vuetify': DEFAULT_REGISTRY },
    components: {},
  }
}

export function inventoryPath (cwd = process.cwd()) {
  return join(cwd, INVENTORY_FILE)
}

export async function loadInventory (cwd = process.cwd()): Promise<Inventory> {
  const path = inventoryPath(cwd)
  if (!existsSync(path)) {
    return emptyInventory()
  }

  try {
    const raw = JSON.parse(await readFile(path, 'utf8')) as Partial<Inventory>
    return {
      version: raw.version ?? INVENTORY_VERSION,
      aliases: {
        components: raw.aliases?.components ?? DEFAULT_COMPONENTS_DIR,
      },
      registries: raw.registries ?? { '@vuetify': DEFAULT_REGISTRY },
      components: raw.components ?? {},
    }
  } catch {
    return emptyInventory()
  }
}

export async function saveInventory (inventory: Inventory, cwd = process.cwd()) {
  const path = inventoryPath(cwd)
  const body = `${JSON.stringify(inventory, null, 2)}\n`
  await writeFile(path, body)
  return path
}

export interface RecordComponentOptions {
  cwd?: string
  /** Inventory key — feature name, e.g. `dialog`. */
  name: string
  /** Absolute or cwd-relative directory that holds the files. */
  dir: string
  files: string[]
  entry?: string
  origin?: ComponentOrigin
  title?: string
  docs?: string
  /** Preferred components alias when creating the file. */
  componentsDir?: string
}

/**
 * Upsert one component into `vuetify.json`, creating the file if missing.
 * Paths are stored project-relative with POSIX separators.
 */
export async function recordComponent (options: RecordComponentOptions) {
  const cwd = options.cwd ?? process.cwd()
  const inventory = await loadInventory(cwd)

  if (options.componentsDir) {
    inventory.aliases.components = options.componentsDir
  }

  if (options.origin?.registry) {
    // Keep a short alias for the default origin; everything else by URL key.
    if (options.origin.registry.replace(/\/$/, '') === DEFAULT_REGISTRY.replace(/\/$/, '')) {
      inventory.registries['@vuetify'] = DEFAULT_REGISTRY
    } else {
      inventory.registries[options.origin.registry] = options.origin.registry
    }
  }

  const absDir = resolve(cwd, options.dir)
  const relDir = relative(cwd, absDir) || options.dir

  inventory.components[options.name] = {
    path: relDir.split('\\').join('/'),
    files: options.files,
    entry: options.entry,
    origin: options.origin,
    title: options.title,
    docs: options.docs,
  }

  await saveInventory(inventory, cwd)
  return inventory
}

/** True when every recorded basename still exists under the component path. */
export function componentStatus (
  component: InventoryComponent,
  cwd = process.cwd(),
): { ok: boolean, missing: string[] } {
  const missing: string[] = []
  for (const file of component.files) {
    const full = join(cwd, component.path, file)
    if (!existsSync(full)) {
      missing.push(file)
    }
  }
  return { ok: missing.length === 0, missing }
}

/** Resolve a registry alias (`@vuetify`) or absolute URL from inventory. */
export function resolveRegistryUrl (
  inventory: Inventory,
  aliasOrUrl?: string,
): string {
  if (!aliasOrUrl) {
    return inventory.registries['@vuetify'] ?? DEFAULT_REGISTRY
  }
  if (/^https?:\/\//i.test(aliasOrUrl)) {
    return aliasOrUrl.replace(/\/$/, '')
  }
  const key = aliasOrUrl.startsWith('@') ? aliasOrUrl : `@${aliasOrUrl}`
  const found = inventory.registries[key] ?? inventory.registries[aliasOrUrl]
  if (!found) {
    throw new Error(`Unknown registry "${aliasOrUrl}". Known: ${Object.keys(inventory.registries).join(', ') || '(none)'}`)
  }
  return found.replace(/\/$/, '')
}

/**
 * Parse `dialog`, `@vuetify/dialog`, or a bare name.
 * Namespace maps to an inventory registries key.
 */
export function parseFeatureRef (query: string): { registry?: string, name: string } {
  const trimmed = query.trim()
  const m = trimmed.match(/^(@[\w-]+)\/(.+)$/)
  if (m) {
    return { registry: m[1], name: m[2] }
  }
  return { name: trimmed }
}
