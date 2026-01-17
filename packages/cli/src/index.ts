import tab from '@bomb.sh/tab/citty'
import { createBanner, registerProjectArgsCompletion } from '@vuetify/cli-shared'
import { add, ask } from '@vuetify/cli-shared/commands'
import { i18n } from '@vuetify/cli-shared/i18n'
import { checkForUpdate } from '@vuetify/cli-shared/utils'

import { defineCommand, runMain, showUsage } from 'citty'
import { version } from '../package.json'
import { analyze } from './commands/analyze'
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
    ask,
    update,
    docs,
    upgrade,
    analyze,
  },
  run: async ({ args, cmd }) => {
    if (args._[0] === 'complete') {
      return
    }
    if (args._.length === 0) {
      console.log(createBanner())
      showUsage(cmd)
    }
  },
})

await tab(main).then(completion => {
  const initCommand = completion.commands.get('init')
  if (initCommand) {
    registerProjectArgsCompletion(initCommand)
  }
})

const hasReporter = process.argv.includes('--reporter') || process.argv.includes('-r')

if (!hasReporter) {
  await checkForUpdate(version)
}

runMain(main)
