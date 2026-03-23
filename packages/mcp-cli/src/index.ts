import tab from '@bomb.sh/tab/citty'
import { mcp } from '@vuetify/cli-shared/commands'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain, showUsage } from 'citty'
import { version } from '../package.json'

export const main = defineCommand({
  meta: {
    name: 'vuetify-mcp',
    version,
    description: i18n.t('commands.mcp_cli.description'),
  },
  subCommands: (mcp as any).subCommands,
  run: async ({ args, cmd }) => {
    if (args._[0] === 'complete') {
      return
    }
    if (args._.length === 0) {
      showUsage(cmd)
    }
  },
})

await tab(main)

runMain(main)
