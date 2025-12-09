import { log, select } from '@clack/prompts'
import { defineCommand } from 'citty'
import { addEslint } from '../functions'
import { i18n } from '../i18n'

const choices = ['eslint']

export const add = defineCommand({
  meta: {
    name: 'add',
    description: i18n.t('commands.add.description'),
  },
  args: {
    integration: {
      type: 'positional',
      description: i18n.t('commands.add.integration.description', { choices: choices.join(', ') }),
    },
  },
  run: async ({ args }) => {
    let integration = args.integration
    if (!integration) {
      const selected = await select({
        message: i18n.t('prompts.add.choose_integration'),
        options: choices.map(c => ({ label: c, value: c })),
      })
      if (typeof selected === 'symbol') {
        log.warning(i18n.t('commands.add.available_integrations', { choices: choices.join(', ') }))
        return
      }
      integration = String(selected)
    }
    if (!choices.includes(integration)) {
      log.error(i18n.t('commands.add.invalid_integration', { integration, choices: choices.join(', ') }))
      return
    }
    switch (integration) {
      case 'eslint': {
        await addEslint()
        break
      }
    }
  },
})
