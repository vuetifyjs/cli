import { log } from '@clack/prompts'
import { analyzeProject, ConsoleReporter, JsonReporter, type Reporter } from '@vuetify/cli-shared'
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
    output: {
      type: 'string',
      alias: 'o',
      description: 'Output file path (only for json reporter)',
    },
    targets: {
      type: 'string',
      alias: 't',
      description: 'Target packages to analyze (comma separated)',
      default: '@vuetify/v0',
    },
    reporter: {
      type: 'string',
      alias: 'r',
      description: 'Reporter to use (console, json)',
      default: 'console',
      valueHint: 'console | json',
    },
    suppressWarnings: {
      type: 'boolean',
      description: 'Suppress warnings',
      default: false,
    },
  },
  run: async ({ args }) => {
    if (!args.suppressWarnings && args.reporter !== 'json') {
      log.warn('This command is experimental and may change in the future.')
    }
    const cwd = resolve(process.cwd(), args.dir)
    const targets = args.targets.split(',').map(t => t.trim())
    const report = await analyzeProject(cwd, targets)

    let reporter: Reporter
    switch (args.reporter) {
      case 'json': {
        reporter = JsonReporter
        break
      }
      default: {
        reporter = ConsoleReporter
        break
      }
    }

    await reporter.report(report, { output: args.output })
  },
})

export default analyze
