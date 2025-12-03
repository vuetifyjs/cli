import { initVuetify, initVuetify0, projectArgs, type ProjectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand } from 'citty'

const cwd = process.cwd()

const VUETIFY_0_APP_DEFAULT_NAME = 'vuetify0-app'
const VUETIFY_APP_DEFAULT_NAME = 'vuetify-app'

export const init = defineCommand({
  meta: {
    name: 'init',
    description: i18n.t('commands.init.description'),
  },
  args: {
    ...projectArgs(),
    v0: {
      type: 'boolean',
      description: i18n.t('commands.init.v0.description'),
    },
  },
  run: async ({ args }: { args: ProjectArgs & { v0?: boolean } }) => {
    await (args.v0
      ? initVuetify0({
          cwd,
          ...args,
          defaultName: VUETIFY_0_APP_DEFAULT_NAME,
        })
      : initVuetify({
          cwd,
          ...args,
          defaultName: VUETIFY_APP_DEFAULT_NAME,
        }))
  },
})

export default init
