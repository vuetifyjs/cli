import { createVuetify, projectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { promptLocalUpdateToContinue } from '@vuetify/cli-shared/utils'
import { defineCommand } from 'citty'
import { version } from '../../package.json'

export const init = defineCommand({
  meta: {
    name: 'init',
    description: i18n.t('commands.init.description'),
  },
  args: {
    ...projectArgs(),
    cwd: {
      type: 'string',
      description: 'The current working directory',
    },
  },
  run: async ({ args }) => {
    const didUpdate = await promptLocalUpdateToContinue({
      packageName: '@vuetify/cli',
      currentVersion: version,
      cwd: typeof args.cwd === 'string' ? args.cwd : undefined,
    })
    if (didUpdate) {
      return
    }
    await createVuetify({
      ...args,
      version,
    })
  },
})

export default init
