import tab from '@bomb.sh/tab/citty'
import { add } from '@vuetify/cli-shared/commands/add'
import { mcp } from '@vuetify/cli-shared/commands/mcp'
import { createPresetsCommand } from '@vuetify/cli-shared/commands/presets'
import { registerProjectArgsCompletion } from '@vuetify/cli-shared/completion'
import { i18n } from '@vuetify/cli-shared/i18n'
import { createBanner } from '@vuetify/cli-shared/utils/banner'

import { defineCommand, runMain, showUsage } from 'citty'
import { version } from '../package.json'
import { analyze } from './commands/analyze'
import { docs } from './commands/docs'
import { init } from './commands/init'
import { update } from './commands/update'
import { upgrade } from './commands/upgrade'

const presets = createPresetsCommand({ version, type: 'vuetify' })

export const main = defineCommand({
  meta: {
    name: 'vuetify',
    version,
    description: i18n.t('cli.main.description'),
  },
  subCommands: {
    init,
    presets,
    add,
    mcp,
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
  const presetsCommand = completion.commands.get('presets')
  if (presetsCommand) {
    registerProjectArgsCompletion(presetsCommand)
  }
})

runMain(main)
