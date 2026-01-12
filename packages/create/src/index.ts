import tab from '@bomb.sh/tab/citty'
import { createVuetify, projectArgs, registerProjectArgsCompletion } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

export const main = defineCommand({
  meta: {
    name: 'create-vuetify',
    version,
    description: i18n.t('cli.create.description'),
  },
  args: {
    ...projectArgs(),
    cwd: {
      type: 'string',
      description: 'The current working directory',
    },
  },
  run: async ({ args }) => {
    if (args._[0] === 'complete') {
      return
    }
    await createVuetify({
      ...args,
      version,
    })
  },
  subCommands: {
    upgrade,
  },
})

await tab(main).then(completion => {
  registerProjectArgsCompletion(completion)
})

runMain(main)
