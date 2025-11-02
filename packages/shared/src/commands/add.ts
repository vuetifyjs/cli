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
  run: ({ args }) => {
    const integration = args.integration
    if (!integration) {
      console.log(i18n.t('commands.add.available_integrations', { choices: choices.join(', ') }))
      return
    }
    if (!choices.includes(integration)) {
      console.log(i18n.t('commands.add.invalid_integration', { integration, choices: choices.join(', ') }))
      return
    }
    switch (integration) {
      case 'eslint': {
        addEslint()
        break
      }
    }
  },
})
