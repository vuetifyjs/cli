import { log } from '@clack/prompts'
import { defineCommand } from 'citty'
import { askVuetify } from '../functions/ask'
import { i18n } from '../i18n'

export const ask = defineCommand({
  meta: {
    name: 'ask',
    description: i18n.t('commands.ask.description'),
  },
  args: {
    question: {
      type: 'positional',
      description: i18n.t('args.question.description'),
      required: true,
    },
    apiKey: {
      type: 'string',
      description: i18n.t('args.apiKey.description'),
      alias: 'k',
    },
    model: {
      type: 'string',
      description: i18n.t('args.model.description'),
      alias: 'm',
      default: 'gemini-2.5-flash',
    },
    raw: {
      type: 'boolean',
      description: i18n.t('args.raw.description'),
      alias: 'r',
    },
  },
  run: async ({ args }) => {
    console.log()
    const apiKey = args.apiKey || process.env.GEMINI_API_KEY
    if (!apiKey) {
      log.error(i18n.t('commands.ask.no_key'))
      return
    }
    await askVuetify(args.question, apiKey, args.raw, args.model)
  },
})
