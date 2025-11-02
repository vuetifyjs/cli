import { relative, resolve } from 'node:path'
import { downloadVuetifyV0Template, projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { defineCommand } from 'citty'

const cwd = process.cwd()

export const init = defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize a Vuetify V0 project',
  },
  args: {
    ...projectArgs('v0'),
  },
  run: ({ args }: { args: ProjectArgs }) => {
    const dir = args.dir
    const relativeDir = relative(cwd, resolve(cwd, dir))
    console.log(`Creating project in ${relativeDir}`)

    downloadVuetifyV0Template({
      cwd,
      force: args.force,
      dir: args.dir,
    })
  },
})
