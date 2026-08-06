import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { loadInventory, resolveRegistryUrl } from './inventory'
import { getIndex, getItem, match } from './registry'
import type { RegistryExample, RegistryItem } from './registry'

export interface DiffLine {
  file: string
  /** `only-remote` = present upstream, absent on disk (would be added by refresh). */
  status: 'same' | 'changed' | 'missing-local' | 'only-remote' | 'only-local'
}

export interface DiffResult {
  name: string
  origin?: string
  lines: DiffLine[]
}

function remoteExample (
  item: RegistryItem,
  exampleId: string,
): RegistryExample | undefined {
  const exact = item.examples.find(e => e.id === exampleId)
  if (exact) return exact
  // Unknown id — do not silently compare against a different example.
  if (exampleId && exampleId !== 'install') return undefined
  return item.examples[0]
}

/**
 * Compare an inventory entry's on-disk files to its registry origin example.
 */
export async function diffComponent (
  name: string,
  options: { cwd?: string, registry?: string } = {},
): Promise<DiffResult> {
  const cwd = options.cwd ?? process.cwd()
  const inventory = await loadInventory(cwd)
  const local = inventory.components[name]
  if (!local) {
    throw new Error(`"${name}" is not in vuetify.json — nothing to diff`)
  }

  if (!local.origin || local.origin.example === 'install') {
    return {
      name,
      lines: local.files.map(file => ({ file, status: 'only-local' as const })),
    }
  }

  const origin = resolveRegistryUrl(inventory, options.registry ?? local.origin.registry)

  const index = await getIndex(origin)
  const entry = match(index, local.origin.name)[0]
    ?? index.items.find(i => i.name === local.origin!.name)
  if (!entry) {
    throw new Error(`Registry at ${origin} has no item "${local.origin.name}"`)
  }

  const item = await getItem(entry, origin)
  const example = remoteExample(item, local.origin.example)
  if (!example) {
    throw new Error(`No example "${local.origin.example}" on ${local.origin.name}`)
  }

  const remoteByName = new Map(example.files.map(f => [f.name, f.content]))
  const lines: DiffLine[] = []
  const seen = new Set<string>()

  for (const file of local.files) {
    seen.add(file)
    const abs = join(cwd, local.path, file)
    let localContent: string | null = null
    try {
      localContent = await readFile(abs, 'utf8')
    } catch {
      lines.push({ file, status: 'missing-local' })
      continue
    }
    const remote = remoteByName.get(file)
    if (remote === undefined) {
      lines.push({ file, status: 'only-local' })
    } else if (remote === localContent) {
      lines.push({ file, status: 'same' })
    } else {
      lines.push({ file, status: 'changed' })
    }
  }

  for (const file of example.files) {
    if (seen.has(file.name)) continue
    lines.push({ file: file.name, status: 'only-remote' })
  }

  return { name, origin, lines }
}
