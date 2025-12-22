#!/usr/bin/env node

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { cancel, confirm, group, multiselect, select, text } from '@clack/prompts'
import { i18n } from '@vuetify/cli-shared/i18n'
import { dim } from 'kolorist'
import { getUserAgent } from 'package-manager-detector'
import validate from 'validate-npm-package-name'

export interface ProjectOptions {
  name: string
  platform: 'vue' | 'nuxt'
  type: 'vuetify' | 'vuetify0'
  features: string[]
  typescript?: boolean
  packageManager?: string
  install?: boolean
  force?: boolean
  clientHints?: boolean
  interactive?: boolean
}

export async function prompt (args: Partial<ProjectOptions>, cwd = process.cwd()): Promise<ProjectOptions> {
  const options = await group({
    name: () => {
      if (args.name) {
        return Promise.resolve(args.name)
      }
      if (!args.interactive) {
        return Promise.resolve('vuetify-project')
      }
      return text({
        message: i18n.t('prompts.project.name'),
        initialValue: 'vuetify-project',
        validate: value => {
          const { validForNewPackages, errors, warnings } = validate(value ? value.trim() : '')
          if (!validForNewPackages) {
            return i18n.t('prompts.project.invalid', { error: (errors || warnings)?.[0] })
          }
        },
      })
    },
    force: ({ results }) => {
      const name = (results.name as string) || args.name
      const projectRoot = join(cwd, name!)

      if (existsSync(projectRoot) && readdirSync(projectRoot).length > 0) {
        if (args.force) {
          return Promise.resolve(true)
        }
        if (!args.interactive) {
          return Promise.resolve(false)
        }
        return confirm({
          message: i18n.t('prompts.project.overwrite', { path: projectRoot }),
          initialValue: false,
        })
      }
      return Promise.resolve(args.force || false)
    },
    platform: () => {
      if (args.platform) {
        return Promise.resolve(args.platform)
      }
      if (!args.interactive) {
        return Promise.resolve('vue')
      }
      return select({
        message: i18n.t('prompts.framework.select'),
        initialValue: 'vue',
        options: [
          { label: i18n.t('prompts.framework.vue'), value: 'vue' },
          { label: i18n.t('prompts.framework.nuxt'), value: 'nuxt' },
        ],
      })
    },
    type: () => {
      if (args.type) {
        return Promise.resolve(args.type)
      }
      if (!args.interactive) {
        return Promise.resolve('vuetify')
      }
      return select({
        message: 'Which version of Vuetify?',
        initialValue: 'vuetify',
        options: [
          { label: 'Vuetify', value: 'vuetify', hint: 'Standard Material Design Component Framework' },
          { label: 'Vuetify 0 (alpha)', value: 'vuetify0', hint: 'Headless Component Library' },
        ],
      })
    },
    typescript: ({ results }) => {
      const platform = (results.platform as string) || args.platform

      if (platform === 'vue' && args.typescript === undefined) {
        return confirm({
          message: i18n.t('prompts.typescript.use'),
          initialValue: true,
        })
      }
      return Promise.resolve(args.typescript ?? true)
    },
    router: ({ results }) => {
      if (args.features) {
        if (args.features.includes('router') && args.features.includes('file-router')) {
          console.error(i18n.t('prompts.router.conflict'))
          process.exit(1)
        }
        if (args.features.includes('router')) {
          return Promise.resolve('router')
        }
        if (args.features.includes('file-router')) {
          return Promise.resolve('file-router')
        }
        return Promise.resolve('none')
      }

      const platform = (results.platform as string) || args.platform
      if (platform !== 'vue') {
        return Promise.resolve('none')
      }

      return select({
        message: i18n.t('prompts.router.select'),
        initialValue: 'router',
        options: [
          { label: i18n.t('prompts.router.none'), value: 'none' },
          { label: i18n.t('prompts.router.standard.label'), value: 'router', hint: i18n.t('prompts.router.standard.hint') },
          { label: i18n.t('prompts.router.file.label'), value: 'file-router', hint: i18n.t('prompts.router.file.hint') },
        ],
      })
    },
    features: ({ results }) => {
      if (args.features) {
        return Promise.resolve(args.features.filter(f => f !== 'router' && f !== 'file-router'))
      }
      if (!args.interactive) {
        return Promise.resolve([])
      }
      const platform = (results.platform as string) || args.platform

      return platform === 'vue'
        ? multiselect({
            message: i18n.t('prompts.features.select', { hint: dim('↑/↓ to navigate, space to select, a to toggle all, enter to confirm') }),
            options: [
              { label: i18n.t('prompts.features.eslint.label'), value: 'eslint', hint: i18n.t('prompts.features.eslint.hint') },
              { label: i18n.t('prompts.features.mcp.label'), value: 'mcp', hint: i18n.t('prompts.features.mcp.hint') },
              { label: i18n.t('prompts.features.pinia.label'), value: 'pinia', hint: i18n.t('prompts.features.pinia.hint') },
              { label: i18n.t('prompts.features.i18n.label'), value: 'i18n', hint: i18n.t('prompts.features.i18n.hint') },
            ],
            initialValues: ['eslint', 'mcp'],
            required: false,
          })
        : multiselect({
            message: i18n.t('prompts.features.select', { hint: dim('↑/↓ to navigate, space to select, a to toggle all, enter to confirm') }),
            options: [
              { label: i18n.t('prompts.features.eslint.label'), value: 'eslint', hint: i18n.t('prompts.features.eslint.hint') },
              { label: i18n.t('prompts.features.vuetify_nuxt_module.label'), value: 'vuetify-nuxt-module', hint: i18n.t('prompts.features.vuetify_nuxt_module.hint') },
              { label: i18n.t('prompts.features.mcp.label'), value: 'mcp', hint: i18n.t('prompts.features.mcp.hint') },
              { label: i18n.t('prompts.features.pinia.label'), value: 'pinia', hint: i18n.t('prompts.features.pinia.hint') },
              { label: i18n.t('prompts.features.i18n.label'), value: 'i18n', hint: i18n.t('prompts.features.i18n.hint') },
            ],
            initialValues: ['eslint', 'vuetify-nuxt-module', 'mcp'],
            required: false,
          })
    },
    clientHints: ({ results }) => {
      if (args.clientHints !== undefined) {
        return Promise.resolve(args.clientHints)
      }
      if (!args.interactive) {
        return Promise.resolve(false)
      }
      const platform = (results.platform as string) || args.platform
      const features = (results.features as string[]) || args.features || []

      if (platform === 'nuxt' && features.includes('vuetify-nuxt-module')) {
        return confirm({
          message: i18n.t('prompts.client_hints.enable'),
          initialValue: false,
        })
      }
      return Promise.resolve(false)
    },
    packageManager: () => {
      if (args.packageManager) {
        return Promise.resolve(args.packageManager)
      }
      if (args.install === false) {
        return Promise.resolve('none')
      }
      if (!args.interactive) {
        return Promise.resolve(getUserAgent() ?? 'npm')
      }
      return select({
        message: i18n.t('prompts.package_manager.select'),
        initialValue: getUserAgent() ?? 'npm',
        options: [
          { label: 'npm', value: 'npm' },
          { label: 'pnpm', value: 'pnpm' },
          { label: 'yarn', value: 'yarn' },
          { label: 'deno', value: 'deno' },
          { label: 'bun', value: 'bun' },
          { label: 'none', value: 'none' },
        ],
      })
    },
    install: ({ results }) => {
      if (args.install !== undefined) {
        return Promise.resolve(args.install)
      }
      if (!args.interactive) {
        return Promise.resolve(false)
      }
      const pm = (results.packageManager as string) || args.packageManager
      if (pm === 'none') {
        return Promise.resolve(false)
      }
      return confirm({
        message: i18n.t('prompts.install'),
        initialValue: true,
      })
    },
  }, {
    onCancel: () => {
      cancel(i18n.t('prompts.cancel'))
      process.exit(0)
    },
  })

  const features = [
    ...(options.features as string[]),
    options.router,
  ].filter(f => f && f !== 'none')

  return {
    ...options,
    features,
  } as ProjectOptions
}
