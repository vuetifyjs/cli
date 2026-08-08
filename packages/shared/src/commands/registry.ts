import { intro, log, outro } from '@clack/prompts'
import { defineCommand } from 'citty'
import { underline } from 'kolorist'
import { buildLocalRegistry } from '../functions/registry-build'
import { i18n } from '../i18n'

export const registry = defineCommand({
  meta: {
    name: 'registry',
    description: i18n.t('commands.registry.description'),
  },
  subCommands: {
    build: defineCommand({
      meta: {
        name: 'build',
        description: i18n.t('commands.registry.build.description'),
      },
      args: {
        outDir: {
          type: 'string',
          default: 'registry',
          description: i18n.t('commands.registry.build.args.outDir'),
        },
      },
      run: async ({ args }) => {
        intro(i18n.t('commands.registry.build.intro'))
        try {
          const result = await buildLocalRegistry({ outDir: args.outDir })
          log.success(i18n.t('commands.registry.build.done', {
            count: result.count,
            dir: underline(result.outDir),
          }))
          log.message(i18n.t('commands.registry.build.hint', { dir: result.outDir }))
          outro(i18n.t('messages.all_done'))
        } catch (error) {
          log.error(error instanceof Error ? error.message : String(error))
          process.exitCode = 1
        }
      },
    }),
  },
})
