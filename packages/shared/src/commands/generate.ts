import { intro, log, outro } from '@clack/prompts'
import { defineCommand } from 'citty'
import { underline } from 'kolorist'
import { generateComponent } from '../functions/generate'
import { i18n } from '../i18n'

export const generate = defineCommand({
  meta: {
    name: 'generate',
    description: i18n.t('commands.generate.description'),
  },
  args: {
    name: {
      type: 'positional',
      required: true,
      description: i18n.t('commands.generate.args.name'),
    },
    dir: {
      type: 'string',
      description: i18n.t('commands.generate.args.dir'),
    },
    overwrite: {
      type: 'boolean',
      default: false,
      description: i18n.t('commands.generate.args.overwrite'),
    },
  },
  run: async ({ args }) => {
    intro(i18n.t('commands.generate.intro', { name: args.name }))
    try {
      const result = await generateComponent({
        name: String(args.name),
        dir: args.dir,
        overwrite: args.overwrite,
      })
      log.success(i18n.t('commands.generate.wrote', { path: underline(result.path) }))
      log.message(i18n.t('commands.add.inventory', { file: 'vuetify.json' }))
      outro(i18n.t('messages.all_done'))
    } catch (error) {
      log.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  },
})
