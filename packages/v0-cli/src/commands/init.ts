import { projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand } from 'citty'
import { initVuetify0 } from '../utils/init'

const cwd = process.cwd()

const APP_DEFAULT_NAME = 'vuetify0-app'

export const init = defineCommand({
  meta: {
    name: 'init',
    description: i18n.t('commands.init.description'),
  },
  args: {
    ...projectArgs(),
  },
  run: async ({ args }: { args: ProjectArgs }) => {
    await initVuetify0({
      cwd,
      ...args,
      defaultName: APP_DEFAULT_NAME,
    })
  },
})
