import tab from '@bomb.sh/tab/citty'
import { createVuetify, projectArgs, registerProjectArgsCompletion } from '@vuetify/cli-shared'
import { createPresetsCommand } from '@vuetify/cli-shared/commands'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

const presets = createPresetsCommand({ version, type: 'vuetify0', filterType: 'vuetify0' })

export const main = defineCommand({
  meta: {
    name: 'create-vuetify0',
    version,
    description: i18n.t('cli.create_v0.description'),
  },
  args: {
    ...projectArgs({ exclude: ['type'] }),
    cwd: {
      type: 'string',
      description: 'The current working directory',
    },
  },
  run: async ({ args }) => {
    if (args._[0] === 'complete' || args._[0] === 'presets') {
      return
    }
    await createVuetify({
      ...args,
      version,
      type: 'vuetify0',
    })
  },
  subCommands: {
    presets,
    upgrade,
  },
})

await tab(main).then(completion => {
  registerProjectArgsCompletion(completion)
})

runMain(main)
