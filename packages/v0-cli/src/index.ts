import { upgradeSelf } from '@vuetify/cli-shared'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { init } from './commands/init'

export const main = defineCommand({
  meta: {
    name: '@vuetify/v0',
    version,
    description: 'Unified CLI for Vuetify0',
  },
  subCommands: {
    init,
    upgrade: defineCommand({
      meta: {
        name: 'upgrade',
        description: 'Upgrade @vuetify/cli-v0 to latest version',
      },
      run: () => upgradeSelf('@vuetify/cli-v0'),
    }),
  },
})

runMain(main)
