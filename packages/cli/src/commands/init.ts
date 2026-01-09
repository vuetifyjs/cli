import { createVuetify, projectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand } from 'citty'
import { version } from '../../package.json'

export const init = defineCommand({
  meta: {
    name: 'init',
    description: i18n.t('commands.init.description'),
  },
  args: {
    ...projectArgs(),
    cwd: {
      type: 'string',
      description: 'The current working directory',
    },
    features: {
      type: 'string',
      description: 'The features to install (router, pinia, eslint)',
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
    css: {
      type: 'string',
      description: 'The CSS framework to use (unocss, tailwindcss, none)',
    },
    platform: {
      type: 'string',
      description: 'The framework to use (vue, nuxt)',
      default: 'vue',
    },
  },
  run: async ({ args }) => {
    await createVuetify({
      ...args,
      version,
    })
  },
})

export default init
