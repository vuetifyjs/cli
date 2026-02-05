#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { confirm, intro, log, outro, select } from '@clack/prompts'
import { createVuetify, projectArgs } from '@vuetify/cli-shared'
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

    if (!existsSync(presetsDir)) {
      log.warn(i18n.t('commands.presets.empty'))
      log.info(i18n.t('commands.presets.tip'))
      outro(i18n.t('commands.presets.done'))
      return
    }

    const files = readdirSync(presetsDir).filter(f => f.endsWith('.json'))

    if (files.length === 0) {
      log.warn(i18n.t('commands.presets.empty'))
      log.info(i18n.t('commands.presets.tip'))
      outro(i18n.t('commands.presets.done'))
      return
    }

    const presets: ({ name: string, invalid: true } | { name: string, invalid: false, formattedLine?: string, file: string })[] = []
    for (const file of files) {
      try {
        const content = readFileSync(join(presetsDir, file), 'utf8')
        const preset = JSON.parse(content)
        const name = preset.meta?.displayName || file.replace('.json', '')
        const type = capitalize(preset.type || 'vuetify')
        const platform = capitalize(preset.platform || 'vue')
        const features = preset.features || []

        const formattedLine = `${name} ${dim(`(`)}${blue(type)} + ${green(platform)} ${dim(`|`)} ${(features.join(','))}${dim(`)`)}`
        presets.push({
          name,
          invalid: false,
          formattedLine,
          file,
        })
      } catch {
        presets.push({
          name: file.replace('.json', ''),
          invalid: true,
        })
      }
    }

    if (args.list) {
      for (const p of presets) {
        p.invalid
          ? log.error(`${p.name} ${dim('(invalid)')}`)
          : log.success(p.formattedLine!)
      }
      outro(i18n.t('commands.presets.done'))
    } else {
      const preset = await select({
        message: i18n.t('commands.presets.select'),
        options: presets.filter(p => !p.invalid).map(p => ({
          label: p.formattedLine!,
          value: p,
        })),
      })

      if (!preset || typeof preset === 'symbol') {
        log.warn(i18n.t('commands.presets.cancel'))
        outro(i18n.t('commands.presets.done'))
        return
      }

      log.success(i18n.t('commands.presets.selected', { name: preset.name }))

      const run = await confirm({
        message: i18n.t('commands.presets.use'),
      })

      if (run && typeof run !== 'symbol') {
        await createVuetify({
          ...args,
          preset: join(presetsDir, preset.file),
          version,
        }, { intro: false })
      } else {
        outro(i18n.t('commands.presets.done'))
      }
    }

    process.exit(0)
  },
})

export default presets
