import { intro, log, outro } from '@clack/prompts'
import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import { dim, green, red, yellow } from 'kolorist'
import {
  componentStatus,
  inventoryPath,
  loadInventory,
} from '../functions/inventory'
import { i18n } from '../i18n'

/**
 * Health check for the local component inventory.
 *
 * Reports missing files and whether each entry has upstream origin metadata
 * (needed later for `diff` / `update`).
 */
export const status = defineCommand({
  meta: {
    name: 'status',
    description: i18n.t('commands.status.description'),
  },
  run: async () => {
    intro(i18n.t('commands.status.intro'))

    const path = inventoryPath()
    if (!existsSync(path)) {
      log.warn(i18n.t('commands.status.noInventory'))
      outro(i18n.t('commands.list.hint'))
      return
    }

    const inventory = await loadInventory()
    const names = Object.keys(inventory.components).toSorted()

    if (names.length === 0) {
      log.info(i18n.t('commands.list.empty'))
      outro(i18n.t('commands.list.hint'))
      return
    }

    let healthy = 0
    let broken = 0
    let localOnly = 0

    for (const name of names) {
      const component = inventory.components[name]!
      const { ok, missing } = componentStatus(component)

      if (!ok) {
        broken++
        log.error(`${red('✗')} ${name} — ${i18n.t('commands.status.missingFiles', { files: missing.join(', ') })}`)
        continue
      }

      if (!component.origin) {
        localOnly++
        log.message(`${yellow('·')} ${name}  ${dim(i18n.t('commands.status.noOrigin'))}`)
        continue
      }

      healthy++
      log.message(
        `${green('✓')} ${name}  ${dim(`${component.origin.registry} · ${component.origin.example}`)}`,
      )
    }

    outro(i18n.t('commands.status.summary', {
      healthy,
      broken,
      local: localOnly,
      total: names.length,
    }))

    if (broken > 0) {
      process.exitCode = 1
    }
  },
})
