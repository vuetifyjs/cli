import { i18n, upgradeSelf } from '@vuetify/cli-shared'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { init } from './commands/init'

export const main = defineCommand({
  meta: {
    name: '@vuetify/v0',
    version,
    description: i18n.t('cli.v0.description'),
  },
  subCommands: {
    init,
    upgrade: defineCommand({
      meta: {
        name: 'upgrade',
        description: i18n.t('commands.upgrade.description', { pkg: '@vuetify/cli-v0' }),
      },
      run: () => upgradeSelf('@vuetify/cli-v0'),
    }),
  },
})

runMain(main)
