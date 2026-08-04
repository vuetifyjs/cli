import { intro, log, outro } from '@clack/prompts'
import { defineCommand } from 'citty'
import { dim, green, yellow } from 'kolorist'
import { componentStatus, loadInventory } from '../functions/inventory'
import { i18n } from '../i18n'

/**
 * Print the local component inventory (`vuetify.json`).
 *
 * Tracking surface for phase 1 of the component-library lifecycle — what was
 * seeded via `vuetify add`, and where it lives on disk.
 */
export const list = defineCommand({
  meta: {
    name: 'list',
    description: i18n.t('commands.list.description'),
  },
  args: {
    json: {
      type: 'boolean',
      default: false,
      description: i18n.t('commands.list.args.json'),
    },
  },
  run: async ({ args }) => {
    const inventory = await loadInventory()
    const names = Object.keys(inventory.components).toSorted()

    if (args.json) {
      console.log(JSON.stringify(inventory, null, 2))
      return
    }

    intro(i18n.t('commands.list.intro'))

    if (names.length === 0) {
      log.info(i18n.t('commands.list.empty'))
      outro(i18n.t('commands.list.hint'))
      return
    }

    for (const name of names) {
      const component = inventory.components[name]!
      const { ok, missing } = componentStatus(component)
      const origin = component.origin
        ? dim(` ← ${component.origin.name}/${component.origin.example}`)
        : dim(` ← ${i18n.t('commands.list.local')}`)
      const mark = ok ? green('✓') : yellow('!')
      log.message(`${mark} ${name}  ${dim(component.path)}${origin}`)
      if (!ok) {
        log.warn(i18n.t('commands.list.missing', { name, files: missing.join(', ') }))
      }
    }

    outro(i18n.t('commands.list.count', { count: names.length }))
  },
})
