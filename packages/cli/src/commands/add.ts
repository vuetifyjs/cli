import { i18n } from '@vuetify/cli-shared'
import { defineCommand } from 'citty'

export const add = defineCommand({
  meta: {
    name: 'add',
    description: i18n.t('commands.add.description'),
  },
  run: () => {
    console.log(i18n.t('commands.add.stub'))
    // TODO: Implement installation of MCP and ESLint
  },
})

export default add
