import tab from '@bomb.sh/tab/citty'
import { projectArgs } from '@vuetify/cli-shared/args'
import { createPresetsCommand } from '@vuetify/cli-shared/commands/presets'
import { registerProjectArgsCompletion } from '@vuetify/cli-shared/completion'
import { createVuetify } from '@vuetify/cli-shared/functions/create'
import { i18n } from '@vuetify/cli-shared/i18n'
import { promptLocalUpdateToContinue } from '@vuetify/cli-shared/utils'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

const presets = createPresetsCommand({ version, type: 'vuetify' })

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
    const didUpdate = await promptLocalUpdateToContinue({
      packageName: 'create-vuetify',
      currentVersion: version,
      cwd: typeof args.cwd === 'string' ? args.cwd : undefined,
    })
    if (didUpdate) {
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
