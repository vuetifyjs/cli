#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { confirm, intro, log, outro, select } from '@clack/prompts'
import { createVuetify, projectArgs, standardPresets } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { capitalize } from '@vuetify/cli-shared/utils'
import { defineCommand } from 'citty'
import { ansi256, dim, green } from 'kolorist'
import { join } from 'pathe'

import { version } from '../../package.json'

const blue = ansi256(33)

export const presets = defineCommand({
  meta: {
    name: 'presets',
    description: i18n.t('commands.presets.description'),
  },
  args: {
    ...projectArgs(),
    list: {
      type: 'boolean',
      description: 'List available presets',
      alias: 'l',
      default: false,
    },
  },
  run: async ({ args }) => {
    const home = homedir()
    const presetsDir = join(home, '.vuetify', 'create', 'presets')

    intro(i18n.t('commands.presets.intro'))

    const files = existsSync(presetsDir) ? readdirSync(presetsDir).filter(f => f.endsWith('.json')) : []

    const systemPresets: ({ name: string, invalid: false, formattedLine?: string, key: string })[] = []
    const userPresets: ({ name: string, invalid: boolean, formattedLine?: string, file?: string })[] = []

    for (const file of files) {
      try {
        const content = readFileSync(join(presetsDir, file), 'utf8')
        const preset = JSON.parse(content)
        const name = preset.meta?.displayName || file.replace('.json', '')
        const type = capitalize(preset.type || 'vuetify')
        const platform = capitalize(preset.platform || 'vue')
        const features = preset.features || []

        const formattedLine = `${name} ${dim(`(`)}${blue(type)} + ${green(platform)} ${dim(`|`)} ${(features.join(','))}${dim(`)`)}`
        userPresets.push({
          name,
          invalid: false,
          formattedLine,
          file,
        })
      } catch {
        userPresets.push({
          name: file.replace('.json', ''),
          invalid: true,
        })
      }
    }

    for (const [key, preset] of Object.entries(standardPresets)) {
      const name = preset.meta.displayName
      const type = capitalize(preset.type)
      const platform = capitalize(preset.platform)
      const features = preset.features || []

      const formattedLine = `${name} ${dim(`(`)}${blue(type)} + ${green(platform)}${features.length > 0 ? ` ${dim(`|`)} ${(features.join(','))}` : ''}${dim(`)`)}`
      systemPresets.push({
        name,
        invalid: false,
        formattedLine,
        key,
      })
    }

    if (args.list) {
      log.message(dim('System Presets'))
      for (const p of systemPresets) {
        log.success(p.formattedLine!)
      }

      if (userPresets.length > 0) {
        log.message(dim('User Presets'))
        for (const p of userPresets) {
          p.invalid
            ? log.error(`${p.name} ${dim('(invalid)')}`)
            : log.success(p.formattedLine!)
        }
      }

      outro(i18n.t('commands.presets.done'))
    } else {
      const options: { label: string, value: any }[] = [
        ...systemPresets.map(p => ({
          label: p.formattedLine!,
          value: p,
        })),
        ...userPresets.filter(p => !p.invalid).map(p => ({
          label: p.formattedLine!,
          value: p,
        })),
      ]

      const preset = await select({
        message: i18n.t('commands.presets.select'),
        options,
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
          preset: (preset as any).key || join(presetsDir, (preset as any).file!),
          version,
        } as any, { intro: false })
      } else {
        outro(i18n.t('commands.presets.done'))
      }
    }

    process.exit(0)
  },
})

export default presets
