import { spinner } from '@clack/prompts'
import { downloadVuetifyV0Template, projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { relative, resolve } from 'pathe'
import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

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
  run: async ({ args }: { args: ProjectArgs }) => {
    const dir = args.dir
    const relativeDir = relative(cwd, resolve(cwd, dir))
    const s = spinner()
    s.start(i18n.t('commands.init.creating_project', { dir: relativeDir }))
    await downloadVuetifyV0Template({
      cwd,
      force: args.force,
      dir: args.dir,
    })
    s.stop(i18n.t('messages.all_done'))
  },
  subCommands: {
    upgrade,
  },
})

runMain(main)
