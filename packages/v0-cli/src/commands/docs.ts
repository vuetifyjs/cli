import { openVuetify0Docs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand } from 'citty'

export const docs = defineCommand({
  meta: {
    name: 'docs',
    description: i18n.t('commands.docs.description'),
  },
  run: async () => {
    await openVuetify0Docs()
  },
})

export default docs
