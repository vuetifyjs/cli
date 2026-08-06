import { intro, log, outro } from '@clack/prompts'
import { defineCommand } from 'citty'
import { dim, green, red, yellow } from 'kolorist'
import { diffComponent } from '../functions/diff'
import { i18n } from '../i18n'

const mark = {
  same: () => green('='),
  changed: () => yellow('~'),
  'missing-local': () => red('!'),
  'only-remote': () => red('+'),
  'only-local': () => dim('·'),
} as const

export const diff = defineCommand({
  meta: {
    name: 'diff',
    description: i18n.t('commands.diff.description'),
  },
  args: {
    name: {
      type: 'positional',
      required: true,
      description: i18n.t('commands.diff.args.name'),
    },
    registry: {
      type: 'string',
      description: i18n.t('commands.add.args.registry'),
    },
  },
  run: async ({ args }) => {
    intro(i18n.t('commands.diff.intro', { name: args.name }))
    try {
      const result = await diffComponent(String(args.name), { registry: args.registry })
      if (result.origin) {
        log.message(dim(result.origin))
      }
      for (const line of result.lines) {
        log.message(`${mark[line.status]()} ${line.file}  ${dim(line.status)}`)
      }
      const dirty = result.lines.some(l => l.status !== 'same' && l.status !== 'only-local')
      outro(i18n.t('commands.diff.done'))
      if (dirty) process.exitCode = 1
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  },
})
