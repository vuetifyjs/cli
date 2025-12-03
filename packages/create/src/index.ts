import { initVuetify, initVuetify0, projectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

const cwd = process.cwd()

const VUETIFY_0_APP_DEFAULT_NAME = 'vuetify0-app'
const VUETIFY_APP_DEFAULT_NAME = 'vuetify-app'

export const main = defineCommand({
  meta: {
    name: 'create-vuetify',
    version,
    description: i18n.t('cli.create.description'),
  },
  args: {
    ...projectArgs(),
    v0: {
      type: 'boolean',
      description: i18n.t('cli.create_v0.description'),
    },
  },
  run: async ({ args }) => {
    await (args.v0
      ? initVuetify0({
          cwd,
          ...args,
          defaultName: VUETIFY_0_APP_DEFAULT_NAME,
        })
      : initVuetify({
          cwd,
          ...args,
          defaultName: VUETIFY_APP_DEFAULT_NAME,
        }))
  },
  subCommands: {
    upgrade,
  },
})

runMain(main)
