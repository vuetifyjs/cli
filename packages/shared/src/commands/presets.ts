import { confirm, intro, log, outro, select } from '@clack/prompts'
import { defineCommand } from 'citty'
import { ansi256, dim, green } from 'kolorist'
import { projectArgs } from '../args'
import { standardPresets } from '../constants/presets'
import { createVuetify } from '../functions/create'
import { i18n } from '../i18n'
import { capitalize, listUserPresets } from '../utils'

const blue = ansi256(33)

export interface PresetsCommandOptions {
  version: string
  type: 'vuetify' | 'vuetify0'
  filterType?: 'vuetify' | 'vuetify0'
}

export function createPresetsCommand (options: PresetsCommandOptions) {
  return defineCommand({
    meta: {
      name: 'presets',
      description: i18n.t('commands.presets.description'),
    },
    args: {
      ...projectArgs({ exclude: ['type'] }),
      list: {
        type: 'boolean',
        description: 'List available presets',
        alias: 'l',
        default: false,
      },
    },
    run: async ({ args }) => {
      intro(i18n.t('commands.presets.intro'))

      const systemPresets = Object.entries(standardPresets)
        .filter(([, preset]) => !options.filterType || preset.type === options.filterType)
        .map(([key, preset]) => {
          const name = preset.meta.displayName
          const type = capitalize(preset.type)
          const platform = capitalize(preset.platform)
          const features = preset.features || []
          const formattedLine = `${name} ${dim('(')}${blue(type)} + ${green(platform)}${features.length > 0 ? ` ${dim('|')} ${(features.join(','))}` : ''}${dim(')')}`

          return {
            key,
            name,
            formattedLine,
            invalid: false as const,
          }
        })

      const userPresets = listUserPresets().map(p => {
        if (p.invalid) {
          return {
            name: p.displayName,
            invalid: true as const,
          }
        }

        const preset = p.preset || {}
        const rawType = preset.type || 'vuetify'
        const type = capitalize(preset.type || 'vuetify')
        const platform = capitalize(preset.platform || 'vue')
        const features = preset.features || []
        const formattedLine = `${p.displayName} ${dim('(')}${blue(type)} + ${green(platform)} ${dim('|')} ${(features.join(','))}${dim(')')}`

        return {
          name: p.displayName,
          invalid: false as const,
          file: p.file,
          slug: p.slug,
          type: rawType,
          formattedLine,
        }
      }).filter(p => {
        if (p.invalid) {
          return true
        }
        return !options.filterType || (p as any).type === options.filterType
      })

      if (args.list) {
        log.message(dim('System Presets'))
        for (const p of systemPresets) {
          log.success(p.formattedLine)
        }

        const invalidUser = userPresets.filter(p => p.invalid)
        const validUser = userPresets.filter(p => !p.invalid)

        if (invalidUser.length > 0 || validUser.length > 0) {
          log.message(dim('User Presets'))
          for (const p of invalidUser) {
            log.error(`${p.name} ${dim('(invalid)')}`)
          }
          for (const p of validUser) {
            log.success((p as any).formattedLine)
          }
        }

        outro(i18n.t('commands.presets.done'))
        return
      }

      const selectionOptions: { label: string, value: any }[] = [
        ...systemPresets.map(p => ({
          label: p.formattedLine,
          value: p,
        })),
        ...userPresets.filter(p => !p.invalid).map(p => ({
          label: (p as any).formattedLine,
          value: p,
        })),
      ]

      const preset = await select({
        message: i18n.t('commands.presets.select'),
        options: selectionOptions,
      })

      if (!preset || typeof preset === 'symbol') {
        log.warn(i18n.t('commands.presets.cancel'))
        outro(i18n.t('commands.presets.done'))
        return
      }

      log.success(i18n.t('commands.presets.selected', { name: (preset as any).name }))

      const run = await confirm({
        message: i18n.t('commands.presets.use'),
      })

      if (run && typeof run !== 'symbol') {
        await createVuetify({
          ...args,
          preset: (preset as any).key || (preset as any).slug,
          type: options.type,
          version: options.version,
        } as any, { intro: false })
      } else {
        outro(i18n.t('commands.presets.done'))
      }
    },
  })
}
