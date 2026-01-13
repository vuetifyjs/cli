import { log } from '@clack/prompts'
import { analyzeProject } from '@vuetify/cli-shared'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'

export const analyze = defineCommand({
  meta: {
    name: 'analyze',
    description: 'Analyze Vuetify usage in the project',
  },
  args: {
    dir: {
      type: 'positional',
      description: 'Directory to scan',
      default: '.',
    },
  },
  run: async ({ args }) => {
    log.warn('This command is experimental and may change in the future.')
    const cwd = resolve(process.cwd(), args.dir)
    const features = await analyzeProject(cwd)
    console.log(JSON.stringify(features, null, 2))
  },
})

export default analyze
