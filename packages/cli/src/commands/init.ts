import { createVuetify, projectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
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
      description: i18n.t('args.cwd.description'),
    },
  },
  run: async ({ args }) => {
    await createVuetify({
      ...args,
      version,
    })
  },
})

export default init
