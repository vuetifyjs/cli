import tab from '@bomb.sh/tab/citty'
import { createVuetify, projectArgs, registerProjectArgsCompletion } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { presets } from './commands/presets'
import { upgrade } from './commands/upgrade'

export const main = defineCommand({
  meta: {
    name: 'create-vuetify',
    version,
    description: i18n.t('cli.create.description'),
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
      type: 'vuetify',
      version,
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
