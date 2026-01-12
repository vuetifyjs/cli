import tab from '@bomb.sh/tab/citty'
import { createBanner } from '@vuetify/cli-shared'
import { add } from '@vuetify/cli-shared/commands'
import { i18n } from '@vuetify/cli-shared/i18n'
import { checkForUpdate } from '@vuetify/cli-shared/utils'

import { defineCommand, runMain } from 'citty'
import { version } from '../package.json'
import { docs } from './commands/docs'
import { init } from './commands/init'
import { update } from './commands/update'
import { upgrade } from './commands/upgrade'

export const main = defineCommand({
  meta: {
    name: '@vuetify/cli',
    version,
    description: i18n.t('cli.main.description'),
  },
  subCommands: {
    init,
    add,
    update,
    docs,
    upgrade,
  },
  run: async ({ args }) => {
    if (args._[0] === 'complete') {
      return
    }
  },
})

await tab(main)

console.log(createBanner())
await checkForUpdate(version)
runMain(main)
