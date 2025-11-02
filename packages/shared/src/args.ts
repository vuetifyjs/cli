import type { ArgDef } from 'citty'

export type ProjectArgs = {
  dir: string
  force: boolean
}

export function projectArgs (project: string) {
  return {
    dir: {
      type: 'string',
      description: 'The directory to create the project in',
      default: project,
    },
    force: {
      type: 'boolean',
      description: 'Force overwrite existing files',
      default: false,
    },
  } satisfies Record<string, ArgDef>
}
