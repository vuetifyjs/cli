import { initVuetify0, projectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'
import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

const cwd = process.cwd()

const APP_DEFAULT_NAME = 'vuetify0-app'

export const main = defineCommand({
  meta: {
    name: 'create-vuetify-v0',
    version,
    description: i18n.t('cli.create_v0.description'),
  },
  args: {
    ...projectArgs(),
  },
  run: async ({ args }) => {
    await initVuetify0({
      cwd,
      ...args,
      defaultName: APP_DEFAULT_NAME,
    })
  },
  subCommands: {
    upgrade,
  },
})

runMain(main)
