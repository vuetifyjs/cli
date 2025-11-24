import type { ArgDef } from 'citty'
import isInteractive from 'is-interactive'
import { i18n } from './i18n'

export type ProjectArgs = {
  dir: string
  force: boolean
  interactive: boolean
  name?: string
  install?: boolean
}

export function projectArgs () {
  return {
    dir: {
      type: 'string',
      description: i18n.t('args.dir.description'),
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
    name: {
      type: 'string',
      description: i18n.t('args.name.description'),
    },
    install: {
      type: 'boolean',
      description: i18n.t('args.install.description'),
    },
  } satisfies Record<string, ArgDef>
}
