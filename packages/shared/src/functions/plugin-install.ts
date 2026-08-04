/**
 * App-level install for registry plugins (useTheme → createThemePlugin, …).
 *
 * Plugins are install-first: wire the factory into the app entry, then optionally
 * seed a usage example. Detection reuses factory name scanning so we don't
 * double-register.
 */

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { log } from '@clack/prompts'
import { dim, underline } from 'kolorist'
import { loadFile } from 'magicast'
import { join, relative } from 'pathe'
import { V0 } from '../constants/registry'
import { i18n } from '../i18n'
import { addStatementToFunctionBody, isFunction } from '../utils/magicast'

export interface PluginRecipe {
  /** Registry item name (kebab), e.g. use-theme */
  name: string
  /** Docs label, e.g. useTheme */
  label: string
  /** Factory export, e.g. createThemePlugin */
  factory: string
  /** File under src/plugins/ (or app/plugins/) without path */
  file: string
  /** Source of the default-export module */
  source: string
}

/** Official v0 plugins → create*Plugin factories. */
export const PLUGIN_RECIPES: Record<string, Omit<PluginRecipe, 'name' | 'label' | 'file' | 'source'> & { label: string, factory: string }> = {
  'use-breakpoints': { label: 'useBreakpoints', factory: 'createBreakpointsPlugin' },
  'use-date': { label: 'useDate', factory: 'createDatePlugin' },
  'use-features': { label: 'useFeatures', factory: 'createFeaturesPlugin' },
  'use-hydration': { label: 'useHydration', factory: 'createHydrationPlugin' },
  'use-locale': { label: 'useLocale', factory: 'createLocalePlugin' },
  'use-logger': { label: 'useLogger', factory: 'createLoggerPlugin' },
  'use-notifications': { label: 'useNotifications', factory: 'createNotificationsPlugin' },
  'use-permissions': { label: 'usePermissions', factory: 'createPermissionsPlugin' },
  'use-reduced-motion': { label: 'useReducedMotion', factory: 'createReducedMotionPlugin' },
  'use-rtl': { label: 'useRtl', factory: 'createRtlPlugin' },
  'use-rules': { label: 'useRules', factory: 'createRulesPlugin' },
  'use-stack': { label: 'useStack', factory: 'createStackPlugin' },
  'use-storage': { label: 'useStorage', factory: 'createStoragePlugin' },
  'use-theme': { label: 'useTheme', factory: 'createThemePlugin' },
  'use-tooltip': { label: 'useTooltip', factory: 'createTooltipPlugin' },
}

/** Same scan targets as the theme preflight. */
const SCAN_TARGETS = [
  'src/plugins/vuetify.ts',
  'src/plugins/index.ts',
  'src/main.ts',
  'app/plugins/vuetify.ts',
  'app/plugins/index.ts',
  'plugins/vuetify.ts',
  'nuxt.config.ts',
]

function pluginSource (factory: string, name: string): string {
  if (name === 'use-theme') {
    return `import { ${factory} } from '${V0}'

export default ${factory}({
  default: 'light',
  themes: {
    light: {
      dark: false,
      colors: {
        'primary': '#3b82f6',
        'secondary': '#64748b',
        'error': '#ef4444',
        'info': '#1867c0',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'background': '#f5f5f5',
        'surface': '#ffffff',
        'surface-tint': '#f5f5f5',
        'surface-variant': '#eeeeee',
        'divider': '#e0e0e0',
        'on-primary': '#ffffff',
        'on-secondary': '#ffffff',
        'on-error': '#ffffff',
        'on-info': '#ffffff',
        'on-success': '#ffffff',
        'on-warning': '#1a1a1a',
        'on-background': '#212121',
        'on-surface': '#212121',
        'on-surface-variant': '#666666',
      },
    },
    dark: {
      dark: true,
      colors: {
        'primary': '#c4b5fd',
        'secondary': '#94a3b8',
        'error': '#f87171',
        'info': '#38bdf8',
        'success': '#4ade80',
        'warning': '#fb923c',
        'background': '#121212',
        'surface': '#1a1a1a',
        'surface-tint': '#2a2a2a',
        'surface-variant': '#1e1e1e',
        'divider': '#404040',
        'on-primary': '#1a1a1a',
        'on-secondary': '#1a1a1a',
        'on-error': '#1a1a1a',
        'on-info': '#1a1a1a',
        'on-success': '#1a1a1a',
        'on-warning': '#1a1a1a',
        'on-background': '#e0e0e0',
        'on-surface': '#e0e0e0',
        'on-surface-variant': '#a0a0a0',
      },
    },
  },
})
`
  }

  return `import { ${factory} } from '${V0}'

export default ${factory}()
`
}

function nuxtPluginSource (factory: string, name: string): string {
  const body = name === 'use-theme'
    ? `${factory}({
    default: 'light',
    themes: {
      light: { dark: false, colors: { primary: '#3b82f6', secondary: '#64748b', error: '#ef4444', info: '#1867c0', success: '#22c55e', warning: '#f59e0b', background: '#f5f5f5', surface: '#ffffff', 'surface-tint': '#f5f5f5', 'surface-variant': '#eeeeee', divider: '#e0e0e0', 'on-primary': '#ffffff', 'on-secondary': '#ffffff', 'on-error': '#ffffff', 'on-info': '#ffffff', 'on-success': '#ffffff', 'on-warning': '#1a1a1a', 'on-background': '#212121', 'on-surface': '#212121', 'on-surface-variant': '#666666' } },
      dark: { dark: true, colors: { primary: '#c4b5fd', secondary: '#94a3b8', error: '#f87171', info: '#38bdf8', success: '#4ade80', warning: '#fb923c', background: '#121212', surface: '#1a1a1a', 'surface-tint': '#2a2a2a', 'surface-variant': '#1e1e1e', divider: '#404040', 'on-primary': '#1a1a1a', 'on-secondary': '#1a1a1a', 'on-error': '#1a1a1a', 'on-info': '#1a1a1a', 'on-success': '#1a1a1a', 'on-warning': '#1a1a1a', 'on-background': '#e0e0e0', 'on-surface': '#e0e0e0', 'on-surface-variant': '#a0a0a0' } },
    },
  })`
    : `${factory}()`

  return `import { ${factory} } from '${V0}'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(${body})
})
`
}

export function recipeFor (name: string): PluginRecipe | null {
  const base = PLUGIN_RECIPES[name]
  if (!base) return null

  const file = `${name.replace(/^use-/, '')}.ts`

  return {
    name,
    label: base.label,
    factory: base.factory,
    file,
    source: pluginSource(base.factory, name),
  }
}

export async function pluginInstalled (factory: string, cwd: string): Promise<boolean> {
  for (const candidate of SCAN_TARGETS) {
    const content = await readFile(join(cwd, candidate), 'utf8').catch(() => '')
    if (content.includes(factory)) return true
  }

  // Written modules live under plugins/<name>.ts — not always in SCAN_TARGETS.
  for (const dir of ['src/plugins', 'app/plugins', 'plugins']) {
    const root = join(cwd, dir)
    if (!existsSync(root)) continue
    for (const file of await readdir(root).catch(() => [] as string[])) {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue
      const content = await readFile(join(root, file), 'utf8').catch(() => '')
      if (content.includes(factory)) return true
    }
  }

  return false
}

export interface InstallPluginResult {
  /** Project-relative path of the plugin module written or already present */
  path: string | null
  /** Whether we wrote/wired something new */
  installed: boolean
  /** Snippet when we could not auto-wire */
  manual?: string
}

/**
 * Write the plugin module and register it on the app when the project shape is known.
 */
export async function installPlugin (
  recipe: PluginRecipe,
  options: { cwd?: string, overwrite?: boolean } = {},
): Promise<InstallPluginResult> {
  const cwd = options.cwd ?? process.cwd()
  const nuxt = existsSync(join(cwd, 'nuxt.config.ts')) || existsSync(join(cwd, 'nuxt.config.js'))

  if (await pluginInstalled(recipe.factory, cwd)) {
    log.info(i18n.t('commands.add.plugin.already', {
      plugin: recipe.label,
      factory: recipe.factory,
    }))
    return { path: null, installed: false }
  }

  if (nuxt) {
    const dir = existsSync(join(cwd, 'app/plugins')) ? 'app/plugins' : 'plugins'
    await mkdir(join(cwd, dir), { recursive: true })
    const rel = join(dir, recipe.file)
    const abs = join(cwd, rel)
    if (existsSync(abs) && !options.overwrite) {
      log.info(i18n.t('commands.add.skipped', { path: rel }))
      return { path: rel, installed: false }
    }
    await writeFile(abs, nuxtPluginSource(recipe.factory, recipe.name))
    log.success(i18n.t('commands.add.plugin.wrote', {
      plugin: recipe.label,
      path: underline(rel),
    }))
    return { path: rel, installed: true }
  }

  // Vue SPA: prefer src/plugins/<file> + registerPlugins
  const pluginsDir = 'src/plugins'
  await mkdir(join(cwd, pluginsDir), { recursive: true })
  const rel = join(pluginsDir, recipe.file)
  const abs = join(cwd, rel)

  if (!existsSync(abs) || options.overwrite) {
    await writeFile(abs, recipe.source)
    log.success(i18n.t('commands.add.plugin.wrote', {
      plugin: recipe.label,
      path: underline(rel),
    }))
  }

  const wired = await wireRegisterPlugins(cwd, recipe)
    || await wireMainTs(cwd, recipe)

  if (!wired) {
    const snippet = `import ${camel(recipe.file)} from '@/plugins/${recipe.file.replace(/\.ts$/, '')}'\n\napp.use(${camel(recipe.file)})`
    log.warn(i18n.t('commands.add.plugin.manual', { plugin: recipe.label }))
    log.message(dim(snippet))
    return { path: rel, installed: true, manual: snippet }
  }

  return { path: rel, installed: true }
}

function camel (file: string) {
  return file
    .replace(/\.ts$/, '')
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

async function wireRegisterPlugins (cwd: string, recipe: PluginRecipe): Promise<boolean> {
  const path = join(cwd, 'src/plugins/index.ts')
  if (!existsSync(path)) return false

  try {
    const mod = await loadFile(path)
    const local = camel(recipe.file)
    const from = `./${recipe.file.replace(/\.ts$/, '')}`

    mod.imports.$prepend({
      from,
      imported: 'default',
      local,
    })

    const register = mod.exports.registerPlugins
    if (isFunction(register)) {
      addStatementToFunctionBody(register, `app.use(${local})`)
    } else {
      return false
    }

    await writeFile(path, mod.generate().code)
    log.success(i18n.t('commands.add.plugin.wired', {
      plugin: recipe.label,
      path: underline(relative(cwd, path)),
    }))
    return true
  } catch {
    return false
  }
}

async function wireMainTs (cwd: string, recipe: PluginRecipe): Promise<boolean> {
  const path = join(cwd, 'src/main.ts')
  if (!existsSync(path)) return false

  const content = await readFile(path, 'utf8')
  if (content.includes(recipe.factory) || content.includes(`plugins/${recipe.file.replace(/\.ts$/, '')}`)) {
    return true
  }

  // Prefer non-magicast append when main is a simple createApp bootstrap
  if (!content.includes('createApp') || !content.includes('.mount')) {
    return false
  }

  const local = camel(recipe.file)
  const importLine = `import ${local} from '@/plugins/${recipe.file.replace(/\.ts$/, '')}'\n`
  let next = content

  if (!content.includes(importLine.trim()) && !content.includes(`from '@/plugins/${recipe.file.replace(/\.ts$/, '')}'`)) {
    // After last import
    const importBlock = content.match(/^(?:import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+/m)
    if (importBlock) {
      next = content.slice(0, importBlock[0].length) + importLine + content.slice(importBlock[0].length)
    } else {
      next = importLine + content
    }
  }

  if (!next.includes(`app.use(${local})`)) {
    next = next.replace(
      /(const\s+app\s*=\s*createApp\([^)]*\)\s*\n)/,
      `$1\napp.use(${local})\n`,
    )
    if (!next.includes(`app.use(${local})`)) {
      next = next.replace(
        /(app\.mount\()/,
        `app.use(${local})\n\n$1`,
      )
    }
  }

  if (next === content) return false

  await writeFile(path, next)
  log.success(i18n.t('commands.add.plugin.wired', {
    plugin: recipe.label,
    path: underline(relative(cwd, path)),
  }))
  return true
}

export function isPluginItem (item: { category?: string }) {
  return item.category === 'plugins'
}
