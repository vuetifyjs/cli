import type { ArgDef } from 'citty'
import isInteractive from 'is-interactive'
import { i18n } from './i18n'

export type ProjectArgs = {
  dir?: string
  force: boolean
  interactive: boolean
  name?: string
  install?: boolean
  features?: string
  router?: string
  css?: string
  typescript?: boolean
  packageManager?: string
  debug?: boolean
  type?: string
  platform?: string
  preset?: string
}

export function projectArgs (options?: { exclude?: (keyof ProjectArgs)[] }) {
  const args = {
    name: {
      type: 'string',
      description: i18n.t('args.name.description'),
    },
    type: {
      type: 'enum',
      description: i18n.t('args.type.description'),
      valueHint: 'vuetify | vuetify0',
      options: ['vuetify', 'vuetify0'],
    },
    platform: {
      type: 'enum',
      description: i18n.t('args.platform.description'),
      valueHint: 'vue | nuxt',
      options: ['vue', 'nuxt'],
    },
    features: {
      type: 'string',
      description: i18n.t('args.features.description'),
      valueHint: 'pinia,eslint,i18n,mcp',
    },
    router: {
      type: 'string',
      description: i18n.t('args.router.description'),
      valueHint: 'router | file-router | none',
    },
    css: {
      type: 'string',
      description: i18n.t('args.css.description'),
      valueHint: 'unocss | unocss-wind4 | unocss-vuetify | tailwindcss | none',
    },
    packageManager: {
      type: 'string',
      description: i18n.t('args.packageManager.description'),
    },
    install: {
      type: 'boolean',
      description: i18n.t('args.install.description'),
    },
    typescript: {
      type: 'boolean',
      description: i18n.t('args.typescript.description'),
      default: true,
    },
    force: {
      type: 'boolean',
      description: i18n.t('args.force.description'),
      default: false,
    },
    interactive: {
      type: 'boolean',
      description: i18n.t('args.interactive.description'),
      default: isInteractive(),
    },
    debug: {
      type: 'boolean',
      description: i18n.t('args.debug.description'),
      default: false,
    },
    dir: {
      type: 'string',
      description: i18n.t('args.dir.description'),
    },
    preset: {
      type: 'string',
      description: i18n.t('args.preset.description'),
    },
  } satisfies Record<keyof ProjectArgs, ArgDef>

  if (options?.exclude) {
    for (const key of options.exclude) {
      delete args[key]
    }
  }

  return args
}
