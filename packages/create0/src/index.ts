import { createVuetify, projectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

export const main = defineCommand({
  meta: {
    name: 'create-vuetify-0',
    version,
    description: i18n.t('cli.create_v0.description'),
  },
  args: {
    ...projectArgs(),
    cwd: {
      type: 'string',
      description: 'The current working directory',
    },
    features: {
      type: 'string',
      description: 'The features to install (pinia, eslint, i18n, mcp)',
    },
    router: {
      type: 'string',
      description: 'The router to install (router, file-router, none)',
    },
    typescript: {
      type: 'boolean',
      description: 'Use TypeScript',
      default: true,
    },
    packageManager: {
      type: 'string',
      description: 'The package manager to use (npm, pnpm, yarn, bun)',
    },
    debug: {
      type: 'boolean',
      description: 'Show debug logs',
      default: false,
    },
    css: {
      type: 'string',
      description: 'The CSS framework to use (unocss, tailwindcss, none)',
    },
    platform: {
      type: 'string',
      description: 'The framework to use (vue, nuxt)',
    },
  },
  run: async ({ args }) => {
    await createVuetify({
      ...args,
      version,
      type: 'vuetify0',
    })
  },
  subCommands: {
    upgrade,
  },
})

runMain(main)
