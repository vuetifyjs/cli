import tab from '@bomb.sh/tab/citty'
import { createVuetify, projectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'

import { version } from '../package.json'
import { upgrade } from './commands/upgrade'

export const main = defineCommand({
  meta: {
    name: 'create-vuetify',
    version,
    description: i18n.t('cli.create.description'),
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
    css: {
      type: 'string',
      description: 'The CSS framework to use (unocss, tailwindcss, none)',
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
    type: {
      type: 'string',
      description: 'The Vuetify version to use (vuetify, vuetify0)',
      default: 'vuetify',
    },
    platform: {
      type: 'string',
      description: 'The framework to use (vue, nuxt)',
      default: 'vue',
    },
  },
  run: async ({ args }) => {
    if (args._[0] === 'complete') {
      return
    }
    await createVuetify({
      ...args,
      version,
    })
  },
  subCommands: {
    upgrade,
  },
})

await tab(main)

runMain(main)
