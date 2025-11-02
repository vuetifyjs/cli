import { relative, resolve } from 'node:path'
import { downloadVuetifyV0Template, i18n, projectArgs, type ProjectArgs, upgradeSelf } from '@vuetify/cli-shared'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'

const cwd = process.cwd()

export const main = defineCommand({
  meta: {
    name: 'create-vuetify-v0',
    version,
    description: i18n.t('cli.create_v0.description'),
  },
  args: {
    ...projectArgs('v0'),
  },
  run: ({ args }: { args: ProjectArgs }) => {
    const dir = args.dir
    const relativeDir = relative(cwd, resolve(cwd, dir))
    console.log(i18n.t('commands.init.creating_project', { dir: relativeDir }))

    downloadVuetifyV0Template({
      cwd,
      force: args.force,
      dir: args.dir,
    })
  },
  subCommands: {
    upgrade: defineCommand({
      meta: {
        name: 'upgrade',
        description: i18n.t('commands.upgrade.description', { pkg: 'create-vuetify-v0' }),
      },
      run: () => upgradeSelf('create-vuetify-v0'),
    }),
  },
})

runMain(main)
