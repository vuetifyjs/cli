import { log } from '@clack/prompts'
import { analyzeProject, ConsoleReporter, JsonReporter, type Reporter } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand } from 'citty'
import { resolve } from 'pathe'

export const analyze = defineCommand({
  meta: {
    name: 'analyze',
    description: i18n.t('commands.analyze.description'),
  },
  args: {
    dir: {
      type: 'positional',
      description: i18n.t('args.scanDir.description'),
      default: '.',
    },
    output: {
      type: 'string',
      alias: 'o',
      description: i18n.t('args.output.description'),
    },
    targets: {
      type: 'string',
      alias: 't',
      description: i18n.t('args.targets.description'),
      default: '@vuetify/v0',
    },
    reporter: {
      type: 'string',
      alias: 'r',
      description: i18n.t('args.reporter.description'),
      default: 'console',
      valueHint: 'console | json',
    },
    suppressWarnings: {
      type: 'boolean',
      description: i18n.t('args.suppressWarnings.description'),
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
