import type { ArgDef } from 'citty'
import { i18n } from './i18n'

export type ProjectArgs = {
  dir: string
  force: boolean
}

export function projectArgs (project: string) {
  return {
    dir: {
      type: 'string',
      description: i18n.t('args.dir.description'),
      default: project,
    },
    force: {
      type: 'boolean',
      description: i18n.t('args.force.description'),
      default: false,
    },
  } satisfies Record<string, ArgDef>
}
