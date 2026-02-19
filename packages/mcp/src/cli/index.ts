import { fileURLToPath } from 'node:url'
import tab from '@bomb.sh/tab/citty'
import { createBanner } from '@vuetify/cli-shared'
import { checkForUpdate } from '@vuetify/cli-shared/utils'
import { defineCommand, runMain, showUsage } from 'citty'
import { version } from '../../package.json'
import { configCommand, runConfig } from './commands/config'
import { rulerCommand, runRuler } from './commands/ruler'

export const main = defineCommand({
  meta: {
    name: 'vuetify-mcp',
    version,
    description: 'Vuetify MCP CLI',
  },
  subCommands: {
    config: configCommand,
    ruler: rulerCommand,
  },
  run: async ({ args, cmd }) => {
    if (args._[0] === 'complete') {
      return
    }

    if (args._.length === 0) {
      console.log(createBanner())

      const { select } = await import('@clack/prompts')

      const action = await select({
        message: 'What would you like to do?',
        options: [
          { value: 'config', label: 'Configure IDE for Vuetify MCP' },
          { value: 'ruler', label: 'Add Ruler to current project' },
        ],
      })

      if (typeof action !== 'string') {
        return
      }

      if (action === 'config') {
        await runConfig()
      } else if (action === 'ruler') {
        await runRuler()
      }
      return
    }

    showUsage(cmd)
  },
})

await tab(main)

const hasReporter = process.argv.includes('--reporter') || process.argv.includes('-r')

if (!hasReporter) {
  await checkForUpdate(version)
}

// Check if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMain(main)
}
