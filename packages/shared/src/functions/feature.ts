// Types
import type { RegistryExample, RegistryIndex, RegistryIndexEntry, RegistryItem, TokenContract } from './registry'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { cancel, confirm, isCancel, log, note, select, spinner } from '@clack/prompts'
import { dim, underline } from 'kolorist'
import { loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { dirname, join, relative, resolve } from 'pathe'
import { REGISTRY_ORIGIN, THEME_PLUGIN, UNOCSS_CONFIGS, V0 } from '../constants/registry'
import { i18n } from '../i18n'
import { addDependency } from '../utils/installDependencies'
import { getProjectPackageJSON } from '../utils/package'
import { recordComponent } from './inventory'
import { getContract, getIndex, getItem, match } from './registry'

export interface FeatureOptions {
  name?: string
  example?: string
  dir?: string
  registry?: string
  overwrite?: boolean
  yes?: boolean
  cwd?: string
}

/** Styles entry points a Tailwind v4 project is likely to declare its theme in. */
const STYLESHEETS = [
  'src/tailwind.css',
  'src/style.css',
  'src/styles/main.css',
  'src/assets/main.css',
  'app/assets/css/tailwind.css',
  'app/assets/css/main.css',
  'assets/css/tailwind.css',
]

/**
 * Unwinds out of a nested prompt without tearing the process down mid-write.
 *
 * The user-facing message is logged where the problem is found, so this only
 * carries the exit code back up to `addFeature`, which sets it and returns.
 */
class Bail extends Error {
  constructor (readonly code: number) {
    super('bail')
  }
}

function stop (): never {
  cancel(i18n.t('prompts.cancel'))
  throw new Bail(0)
}

function unwrap<T> (value: T | symbol): T {
  if (isCancel(value)) {
    stop()
  }
  return value as T
}

function find (cwd: string, candidates: string[]) {
  for (const candidate of candidates) {
    const path = join(cwd, candidate)
    if (existsSync(path)) {
      return path
    }
  }
  return null
}

/** Resolve the user's argument to exactly one registry entry. */
async function pick (index: RegistryIndex, options: FeatureOptions): Promise<RegistryIndexEntry> {
  if (!options.name) {
    const chosen = unwrap(await select({
      message: i18n.t('prompts.add.feature'),
      options: index.items.map(item => ({
        label: item.title,
        value: `${item.type}/${item.name}`,
        hint: `${item.type === 'components' ? 'component' : 'composable'} · ${item.category}`,
      })),
    }))

    return index.items.find(item => `${item.type}/${item.name}` === chosen)!
  }

  const found = match(index, options.name)

  if (found.length === 0) {
    const close = index.items
      .filter(item => item.name.startsWith(options.name!.slice(0, 3)))
      .slice(0, 5)
      .map(item => item.name)

    log.error(i18n.t('commands.add.unknown', { name: options.name }))
    if (close.length > 0) {
      log.info(i18n.t('commands.add.suggest', { names: close.join(', ') }))
    }

    throw new Bail(1)
  }

  if (found.length === 1) {
    return found[0]
  }

  // Guessing which of several features the user meant is worse than stopping,
  // and a scripted run has nobody to answer the prompt.
  if (options.yes) {
    log.error(i18n.t('commands.add.ambiguous', { name: options.name }))
    log.info(i18n.t('commands.add.suggest', { names: found.map(item => item.name).join(', ') }))
    throw new Bail(1)
  }

  const chosen = unwrap(await select({
    message: i18n.t('prompts.add.resolve'),
    options: found.map(item => ({
      label: item.name,
      value: `${item.type}/${item.name}`,
      hint: `${item.type === 'components' ? 'component' : 'composable'} · ${item.category}`,
    })),
  }))

  return found.find(item => `${item.type}/${item.name}` === chosen)!
}

async function choose (item: RegistryItem, options: FeatureOptions): Promise<RegistryExample> {
  if (options.example) {
    const found = item.examples.find(example => example.id === options.example)
    if (found) {
      return found
    }

    log.error(i18n.t('commands.add.unknown', { name: options.example }))
    log.info(i18n.t('commands.add.suggest', { names: item.examples.map(example => example.id).join(', ') }))
    throw new Bail(1)
  }

  if (item.examples.length === 1) {
    return item.examples[0]
  }

  // Unlike an ambiguous name, every example here belongs to the feature the
  // user asked for, so a scripted run can take the canonical one and proceed.
  if (options.yes) {
    return item.examples.find(example => example.id === 'basic') ?? item.examples[0]
  }

  const chosen = unwrap(await select({
    message: i18n.t('prompts.add.example'),
    options: item.examples.map(example => ({
      label: example.title,
      value: example.id,
      hint: example.files.length > 1 ? `${example.files.length} files` : undefined,
    })),
  }))

  return item.examples.find(example => example.id === chosen)!
}

/** Install any package the example imports that the project does not have. */
async function depend (example: RegistryExample, options: FeatureOptions) {
  const pkg = await getProjectPackageJSON(options.cwd).catch(() => null)

  const present = new Set([
    ...Object.keys(pkg?.dependencies ?? {}),
    ...Object.keys(pkg?.devDependencies ?? {}),
    // Always present in a Vue project, and never worth reinstalling.
    'vue',
  ])

  const missing = example.dependencies.filter(name => !present.has(name))
  if (missing.length === 0) {
    return
  }

  const install = options.yes || unwrap(await confirm({
    message: i18n.t('prompts.add.install', { pkgs: missing.join(', ') }),
  }))

  if (!install) {
    return
  }

  const loader = spinner()
  loader.start(i18n.t('commands.add.deps', { pkgs: missing.join(', ') }))
  await addDependency(missing, { cwd: options.cwd, silent: true })
  loader.stop(i18n.t('spinners.dependencies.installed'))
}

/**
 * Make sure the semantic utility classes in the copied markup resolve.
 *
 * Two independent layers have to be present: `createThemePlugin` emits the
 * `--v0-*` custom properties, and the UnoCSS/Tailwind config maps them onto
 * `bg-primary`, `text-on-surface` and friends. Without both, the file lands
 * looking broken and v0 takes the blame — so this warns loudly and offers the
 * patch rather than writing silently.
 */
async function style (item: RegistryItem, example: RegistryExample, contract: TokenContract, options: FeatureOptions) {
  const cwd = options.cwd ?? process.cwd()

  if (example.tokens.length === 0) {
    return
  }

  const pkg = await getProjectPackageJSON(cwd).catch(() => null)
  const hasV0 = !!(pkg?.dependencies?.[V0] ?? pkg?.devDependencies?.[V0])

  const uno = find(cwd, UNOCSS_CONFIGS)
  const sheet = find(cwd, STYLESHEETS)
  const target = uno ?? sheet

  if (!target) {
    log.warn(i18n.t('commands.add.styling.none', {
      name: item.name,
      tokens: example.tokens.slice(0, 3).join(', '),
    }))
    // Neither engine is present, so there is nothing to infer from — show both
    // rather than guessing at one and handing over syntax for the other.
    note(
      `${i18n.t('commands.add.styling.unocss')}\n${contract.unocss}\n\n${i18n.t('commands.add.styling.tailwind')}\n${contract.tailwind}`,
      i18n.t('commands.add.styling.manual', { plugin: THEME_PLUGIN }),
    )
    return
  }

  const content = await readFile(target, 'utf8')

  // Both templates write the whole contract at once, so the presence of any
  // mapping means the block is already there.
  if (!content.includes(contract.prefix)) {
    const file = underline(relative(cwd, target))

    log.warn(i18n.t('commands.add.styling.missing', { file }))

    const patch = options.yes || unwrap(await confirm({
      message: i18n.t('prompts.add.tokens', { file }),
    }))

    if (patch) {
      const patched = target === uno
        ? await map(target, contract)
        : await append(target, content, contract.tailwind)

      if (patched) {
        log.success(i18n.t('commands.add.styling.patched', { file }))
      } else {
        note(contract.unocss, i18n.t('commands.add.styling.manual', { plugin: THEME_PLUGIN }))
      }
    } else {
      note(target === uno ? contract.unocss : contract.tailwind, i18n.t('commands.add.styling.manual', { plugin: THEME_PLUGIN }))
    }
  }

  if (hasV0 && !await themed(cwd)) {
    log.warn(i18n.t('commands.add.styling.theme', { plugin: THEME_PLUGIN, prefix: contract.prefix }))
  }
}

/**
 * Add the color map to an UnoCSS config's default export.
 *
 * The block has to land inside `defineConfig({ ... })` — appending the snippet
 * would leave the file syntactically broken — so this edits the AST and leaves
 * any colors the project already defined untouched. Returns false when the
 * config shape is one magicast cannot read, so the caller can fall back to
 * printing the snippet.
 */
async function map (path: string, contract: TokenContract) {
  try {
    const mod = await loadFile(path)
    const options = getDefaultExportOptions(mod)

    if (!options) {
      return false
    }

    options.theme ||= {}
    options.theme.colors ||= {}

    for (const token of contract.tokens) {
      options.theme.colors[token] ??= `var(${contract.prefix}${token})`
    }

    await writeFile(path, mod.generate().code)

    return true
  } catch {
    return false
  }
}

/** `@theme inline` is valid at the end of a stylesheet, so appending is safe. */
async function append (path: string, content: string, snippet: string) {
  await writeFile(path, `${content.trimEnd()}\n\n${snippet}\n`)

  return true
}

/** Whether the project installs the plugin that emits the custom properties. */
async function themed (cwd: string) {
  const candidates = [
    'src/plugins/vuetify.ts',
    'src/plugins/index.ts',
    'src/main.ts',
    'app/plugins/vuetify.ts',
    'plugins/vuetify.ts',
    'nuxt.config.ts',
  ]

  for (const candidate of candidates) {
    const content = await readFile(join(cwd, candidate), 'utf8').catch(() => '')
    if (content.includes(THEME_PLUGIN)) {
      return true
    }
  }

  return false
}

interface WriteResult {
  written: string[]
  /** Project-relative directory for the example (even when every file was skipped). */
  dir: string
  /** Components alias used as the write base. */
  base: string
}

async function write (example: RegistryExample, options: FeatureOptions): Promise<WriteResult> {
  const cwd = options.cwd ?? process.cwd()
  const nuxt = existsSync(join(cwd, 'nuxt.config.ts')) || existsSync(join(cwd, 'nuxt.config.js'))
  const base = options.dir ?? (nuxt ? 'app/components' : 'src/components')
  const dir = join(base, example.dir)
  const written: string[] = []

  for (const file of example.files) {
    const path = resolve(cwd, dir, file.name)
    const shown = relative(cwd, path)

    if (existsSync(path) && !options.overwrite) {
      // `--yes` accepts prompts, but clobbering a user's file is not a default
      // worth accepting — a scripted run skips and says so, and --overwrite is
      // the way to ask for the replacement explicitly.
      const replace = options.yes
        ? false
        : unwrap(await confirm({
            message: i18n.t('prompts.add.overwrite', { path: underline(shown) }),
            initialValue: false,
          }))

      if (!replace) {
        log.info(i18n.t('commands.add.skipped', { path: shown }))
        continue
      }
    }

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, file.content)

    written.push(shown)
    log.success(i18n.t('commands.add.wrote', { path: shown }))
  }

  return { written, dir, base }
}

export async function addFeature (options: FeatureOptions = {}) {
  try {
    return await run(options)
  } catch (error) {
    // A cancel or a resolution failure has already told the user why; anything
    // else is a real fault and belongs on the surface with its message.
    if (!(error instanceof Bail)) {
      throw error
    }

    process.exitCode = error.code

    return []
  }
}

async function run (options: FeatureOptions) {
  const origin = options.registry ?? REGISTRY_ORIGIN
  const cwd = options.cwd ?? process.cwd()

  const loader = spinner()
  loader.start(i18n.t('spinners.registry.fetching'))
  const index = await getIndex(origin)
  loader.stop(i18n.t('spinners.registry.fetched'))

  const entry = await pick(index, options)
  const item = await getItem(entry, origin)
  const example = await choose(item, options)
  const contract = await getContract(origin)

  await depend(example, options)
  await style(item, example, contract, options)

  const { written, dir, base } = await write(example, options)

  // Always refresh inventory when something landed — tracking is the phase-1
  // product surface, not an optional side effect of a successful printout.
  if (written.length > 0) {
    const entryFile = example.files.find(file => file.entry)
    await recordComponent({
      cwd,
      name: item.name,
      dir,
      files: example.files.map(file => file.name),
      entry: entryFile?.name,
      componentsDir: base,
      title: example.title || item.title,
      docs: item.docs,
      origin: {
        registry: origin.replace(/\/$/, ''),
        name: item.name,
        example: example.id,
        v0: index.v0Version,
        type: item.type,
      },
    })

    log.message(dim(i18n.t('commands.add.docs', { url: item.docs })))
    log.message(dim(i18n.t('commands.add.inventory', { file: 'vuetify.json' })))
  }

  return written
}
