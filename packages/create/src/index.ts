import { relative, resolve } from 'node:path'
import { i18n, projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

const cwd = process.cwd()

export const main = defineCommand({
  meta: {
    name: 'create-vuetify',
    version,
    description: i18n.t('cli.create.description'),
  },
  args: {
    ...projectArgs('vuetify'),
  },
  run: ({ args }: { args: ProjectArgs }) => {
    const dir = args.dir
    const relativeDir = relative(cwd, resolve(cwd, dir))
    console.log(i18n.t('commands.init.creating_project', { dir: relativeDir }))

    // TODO: Implement Vuetify project template download
    console.log('Vuetify project creation will be implemented here')
  },
  subCommands: {
    upgrade,
  },
})

runMain(main)
