import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import { DEFAULT_REGISTRY, loadInventory } from './inventory'
import type { RegistryExample, RegistryFile, RegistryIndex, RegistryInstall, RegistryItem } from './registry'
import { getProjectPackageJSON } from '../utils/package'
import { REGISTRY_VERSION, V0 } from '../constants/registry'

export interface RegistryBuildOptions {
  cwd?: string
  outDir?: string
}

function installFromName (name: string, title?: string): RegistryInstall {
  const bare = name.replace(/^use-/, '')
  const pascal = bare
    .split('-')
    .filter(Boolean)
    .map(part => part[0]!.toUpperCase() + part.slice(1))
    .join('')
  return {
    factory: `create${pascal}Plugin`,
    label: title || `use${pascal}`,
    file: `${bare}.ts`,
  }
}

/**
 * Emit a static registry from the local inventory + files on disk.
 * Same shape as the official seed so others can `vuetify add --registry <url>`.
 */
export async function buildLocalRegistry (options: RegistryBuildOptions = {}) {
  const cwd = options.cwd ?? process.cwd()
  const outDir = options.outDir ?? 'registry'
  const inventory = await loadInventory(cwd)
  const pkg = await getProjectPackageJSON(cwd).catch(() => null)
  const v0Version = (pkg?.dependencies?.[V0] ?? pkg?.devDependencies?.[V0] ?? '0.0.0').replace(/^[\^~]/, '')

  const items: RegistryItem[] = []

  for (const [name, component] of Object.entries(inventory.components)) {
    const files: RegistryFile[] = []
    for (const file of component.files) {
      const abs = join(cwd, component.path, file)
      if (!existsSync(abs)) continue
      const content = await readFile(abs, 'utf8')
      files.push({
        path: `${component.path}/${file}`.split('\\').join('/'),
        name: file,
        entry: file === component.entry || (component.entry === undefined && file.endsWith('.vue')),
        content,
      })
    }
    if (files.length === 0) continue

    // Ensure exactly one entry
    if (!files.some(f => f.entry)) {
      const lastVue = [...files].reverse().find(f => f.name.endsWith('.vue'))
      if (lastVue) lastVue.entry = true
      else files.at(-1)!.entry = true
    }

    const example: RegistryExample = {
      id: 'default',
      title: component.title || name,
      description: '',
      dir: component.path.replace(/^src\/components\/?/, '') || name,
      files,
      dependencies: [V0],
      tokens: [],
      icons: { collections: [], classes: [] },
    }

    // dir for consumers: strip leading components alias when possible
    const alias = inventory.aliases.components.replace(/\/$/, '')
    if (example.dir.startsWith(alias)) {
      example.dir = example.dir.slice(alias.length).replace(/^\//, '') || name
    }

    const itemName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    const isPluginInstall = component.origin?.example === 'install'
    items.push({
      name: itemName,
      type: component.origin?.type ?? 'components',
      category: isPluginInstall ? 'plugins' : 'local',
      level: 'local',
      title: component.title || name,
      description: component.docs ?? '',
      docs: component.docs ?? '',
      // Keep on-disk files as a default example so customized plugin modules
      // (e.g. a themed createThemePlugin) re-publish; install is still install-first.
      examples: [example],
      ...(isPluginInstall
        ? { install: installFromName(itemName, component.title || name) }
        : {}),
    })
  }

  items.sort((a, b) => a.name.localeCompare(b.name))

  const index: RegistryIndex = {
    version: REGISTRY_VERSION,
    v0Version,
    tokens: [],
    items: items.map(item => ({
      name: item.name,
      type: item.type,
      category: item.category,
      level: item.level,
      title: item.title,
      description: item.description,
      docs: item.docs,
      examples: item.examples.map(e => e.id),
    })),
  }

  const root = join(cwd, outDir)
  await mkdir(join(root), { recursive: true })
  await writeFile(join(root, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
  await writeFile(join(root, 'tokens.json'), `${JSON.stringify({
    version: REGISTRY_VERSION,
    tokens: [],
    prefix: '--v0-',
    unocss: '',
    tailwind: '',
  }, null, 2)}\n`)

  for (const item of items) {
    const dir = join(root, item.type)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`)
  }

  return { outDir, count: items.length, origin: DEFAULT_REGISTRY }
}
