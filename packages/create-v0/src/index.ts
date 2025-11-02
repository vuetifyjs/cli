import { relative, resolve } from 'node:path'
import { downloadVuetifyV0Template, projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'

const cwd = process.cwd()

export const main = defineCommand({
  meta: {
    name: 'create-vuetify-v0',
    version,
    description: 'Create a Vuetify0 project',
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

runMain(main)
