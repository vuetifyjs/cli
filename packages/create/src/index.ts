import { projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { relative, resolve } from 'pathe'
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
