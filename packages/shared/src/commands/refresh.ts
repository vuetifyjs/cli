import { intro, log, outro } from '@clack/prompts'
import { defineCommand } from 'citty'
import { refreshComponent } from '../functions/refresh'
import { i18n } from '../i18n'

export const refresh = defineCommand({
  meta: {
    name: 'refresh',
    description: i18n.t('commands.refresh.description'),
  },
  args: {
    name: {
      type: 'positional',
      required: true,
      description: i18n.t('commands.refresh.args.name'),
    },
    registry: {
      type: 'string',
      description: i18n.t('commands.add.args.registry'),
    },
    yes: {
      type: 'boolean',
      default: true,
      description: i18n.t('commands.add.args.yes'),
    },
  },
  run: async ({ args }) => {
    intro(i18n.t('commands.refresh.intro', { name: args.name }))
    try {
      const written = await refreshComponent({
        name: String(args.name),
        registry: args.registry,
        yes: args.yes,
        overwrite: true,
      })
      if (written.length === 0) {
        log.warn(i18n.t('commands.refresh.noop'))
      }
      outro(i18n.t('messages.all_done'))
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  },
})
