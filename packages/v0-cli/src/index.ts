import { add } from '@vuetify/cli-shared/commands'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { docs } from './commands/docs'
import { init } from './commands/init'
import { update } from './commands/update'
import { upgrade } from './commands/upgrade'

export const main = defineCommand({
  meta: {
    name: '@vuetify/v0',
    version,
    description: i18n.t('cli.v0.description'),
  },
  subCommands: {
    init,
    add,
    update,
    docs,
    upgrade,
  },
})

runMain(main)
