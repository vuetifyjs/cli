import { addFeature } from './feature'
import { loadInventory } from './inventory'

export interface RefreshOptions {
  name: string
  cwd?: string
  yes?: boolean
  overwrite?: boolean
  registry?: string
}

/**
 * Re-fetch a tracked component from its origin registry and overwrite local files.
 */
export async function refreshComponent (options: RefreshOptions) {
  const cwd = options.cwd ?? process.cwd()
  const inventory = await loadInventory(cwd)
  const local = inventory.components[options.name]
  if (!local?.origin) {
    throw new Error(`"${options.name}" has no registry origin — cannot refresh`)
  }

  return addFeature({
    name: local.origin.name,
    example: local.origin.example === 'install' ? undefined : local.origin.example,
    cwd,
    yes: options.yes ?? true,
    overwrite: options.overwrite ?? true,
    registry: options.registry ?? local.origin.registry,
  })
}
