import { intro, log, outro, select, spinner } from '@clack/prompts'
import { defineCommand, runCommand } from 'citty'
import { addEslint, addFeature } from '../functions'
import { loadInventory, parseFeatureRef, resolveRegistryUrl } from '../functions/inventory'
import { getIndex } from '../functions/registry'
import { groupedRegistryOptions } from '../functions/registry-options'
import { i18n } from '../i18n'
import { mcp } from './mcp'

/**
 * Integrations wire a tool into the project. Everything else typed after `add`
 * is looked up in the registry, so `vuetify add dialog` writes a working,
 * styled example instead of leaving the user to copy it out of the docs.
 */
const choices = ['eslint']

export const add = defineCommand({
  meta: {
    name: 'add',
    description: i18n.t('commands.add.description'),
  },
  args: {
    integration: {
      type: 'positional',
      required: false,
      description: i18n.t('commands.add.integration.description', { choices: choices.join(', ') }),
    },
    example: {
      type: 'string',
      description: i18n.t('commands.add.args.example'),
    },
    dir: {
      type: 'string',
      description: i18n.t('commands.add.args.dir'),
    },
    registry: {
      type: 'string',
      description: i18n.t('commands.add.args.registry'),
    },
    overwrite: {
      type: 'boolean',
      default: false,
      description: i18n.t('commands.add.args.overwrite'),
    },
    yes: {
      type: 'boolean',
      default: false,
      description: i18n.t('commands.add.args.yes'),
    },
  },
  run: async ({ args }) => {
    let integration = args.integration
    const inventory = await loadInventory()

    if (integration === 'mcp') {
      log.warning('The "vuetify add mcp" command is deprecated. Redirecting to "vuetify mcp install"...')
      await runCommand(mcp, { rawArgs: ['install'] })
      return
    }

    // With no argument, offer integrations and registry items in one list so
    // neither surface is hidden behind knowing its name up front.
    if (!integration) {
      const origin = resolveRegistryUrl(inventory, args.registry)
      const loader = spinner()
      loader.start(i18n.t('spinners.registry.fetching'))
      const index = await getIndex(origin)
      loader.stop(i18n.t('spinners.registry.fetched'))

      const selected = await select({
        message: i18n.t('prompts.add.feature'),
        options: [
          { label: '── Integrations', value: '__group:Integrations', disabled: true },
          ...choices.map(choice => ({ label: choice, value: choice, hint: 'integration' })),
          ...groupedRegistryOptions(index.items),
        ],
      })

      if (typeof selected === 'symbol') {
        log.warning(i18n.t('commands.add.integration.available', { choices: choices.join(', ') }))
        return
      }

      if (String(selected).startsWith('__group:')) {
        log.warning(i18n.t('commands.add.integration.available', { choices: choices.join(', ') }))
        return
      }

      integration = String(selected)
    }

    if (choices.includes(integration)) {
      switch (integration) {
        case 'eslint': {
          await addEslint()
          break
        }
      }
      return
    }

    const ref = parseFeatureRef(integration)
    const registry = resolveRegistryUrl(inventory, args.registry ?? ref.registry)

    intro(i18n.t('commands.add.intro', { name: ref.name }))

    const written = await addFeature({
      name: ref.name,
      example: args.example,
      dir: args.dir,
      registry,
      overwrite: args.overwrite,
      yes: args.yes,
    })

    // A failed resolution has already said why — don't follow it with "all done".
    if (written.length > 0) {
      outro(i18n.t('messages.all_done'))
    }
  },
})
