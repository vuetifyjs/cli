import tab from '@bomb.sh/tab/citty'
import { createBanner, registerProjectArgsCompletion } from '@vuetify/cli-shared'
import { add } from '@vuetify/cli-shared/commands'
import { i18n } from '@vuetify/cli-shared/i18n'
import { checkForUpdate } from '@vuetify/cli-shared/utils'

import { defineCommand, runMain, showUsage } from 'citty'
import { version } from '../package.json'
import { docs } from './commands/docs'
import { init } from './commands/init'
import { update } from './commands/update'
import { upgrade } from './commands/upgrade'

export const main = defineCommand({
  meta: {
    name: 'vuetify',
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
  run: async ({ args, cmd }) => {
    if (args._[0] === 'complete') {
      return
    }
    console.log(createBanner())
    showUsage(cmd)
  },
})

await tab(main).then(completion => {
  const initCommand = completion.commands.get('init')
  if (initCommand) {
    registerProjectArgsCompletion(initCommand)
  }
})

await checkForUpdate(version)
runMain(main)
