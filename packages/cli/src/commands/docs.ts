import { i18n, openVuetifyDocs } from '@vuetify/cli-shared'
import { defineCommand } from 'citty'

export const docs = defineCommand({
  meta: {
    name: 'docs',
    description: i18n.t('commands.docs.description'),
  },
  args: {
    version: {
      type: 'string',
      alias: 'v',
      description: i18n.t('args.version.description'),
    },
  },
  run: async ctx => {
    const version = ctx.args.version
    await openVuetifyDocs(version, { cwd: process.cwd() })
  },
})

export default docs
