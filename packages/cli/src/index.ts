import { commandAdd, i18n, upgradeSelf } from '@vuetify/cli-shared'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { docs } from './commands/docs'
import { init } from './commands/init'
import { update } from './commands/update'

export const main = defineCommand({
  meta: {
    name: '@vuetify/cli',
    version,
    description: i18n.t('cli.main.description'),
  },
  subCommands: {
    init,
    add: commandAdd,
    update,
    docs,
    upgrade: defineCommand({
      meta: {
        name: 'upgrade',
        description: i18n.t('commands.upgrade.description', { pkg: '@vuetify/cli' }),
      },
      run: () => upgradeSelf('@vuetify/cli'),
    }),
  },
})

runMain(main)
