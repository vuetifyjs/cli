import { i18n, upgradeSelf } from '@vuetify/cli-shared'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { init } from './commands/init'

export const main = defineCommand({
  meta: {
    name: '@vuetify/cli',
    version,
    description: i18n.t('cli.main.description'),
  },
  subCommands: {
    init,
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
