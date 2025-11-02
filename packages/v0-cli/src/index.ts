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
  },
})

runMain(main)
