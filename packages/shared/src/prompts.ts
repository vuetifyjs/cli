#!/usr/bin/env node

import { existsSync, readdirSync } from 'node:fs'
import { cancel, confirm, group, multiselect, select, text } from '@clack/prompts'
import { i18n } from '@vuetify/cli-shared/i18n'
import { dim } from 'kolorist'
import { getUserAgent } from 'package-manager-detector'
import { join } from 'pathe'
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
  css?: 'unocss' | 'tailwindcss' | 'none'
  router?: 'router' | 'file-router' | 'none'
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
    force: async ({ results }) => {
      const name = (results.name as string) || args.name
      const projectRoot = join(cwd, name!)

      if (existsSync(projectRoot) && readdirSync(projectRoot).length > 0) {
        if (args.force) {
          return true
        }
        if (!args.interactive) {
          return false
        }
        const overwrite = await confirm({
          message: i18n.t('prompts.project.overwrite', { path: projectRoot }),
          initialValue: false,
        })
        if (overwrite === false || typeof overwrite !== 'boolean') {
          cancel(i18n.t('prompts.project.cancel'))
          process.exit(0)
        }
        return true
      }
      return args.force || false
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
        message: i18n.t('prompts.type.select'),
        initialValue: 'vuetify',
        options: [
          { label: i18n.t('prompts.type.vuetify.label'), value: 'vuetify', hint: i18n.t('prompts.type.vuetify.hint') },
          { label: i18n.t('prompts.type.vuetify0.label'), value: 'vuetify0', hint: i18n.t('prompts.type.vuetify0.hint') },
        ],
      })
    },
    cssFramework: ({ results }) => {
      const type = (results.type as string) || args.type
      if (type !== 'vuetify0') {
        return Promise.resolve('none')
      }

      if (args.css) {
        if (args.css.includes('unocss')) {
          return Promise.resolve('unocss')
        }
        if (args.css.includes('tailwindcss')) {
          return Promise.resolve('tailwindcss')
        }
        return Promise.resolve('none')
      }

      if (!args.interactive) {
        return Promise.resolve('none')
      }

      return select({
        message: i18n.t('prompts.css_framework.select'),
        initialValue: type === 'vuetify0' ? 'unocss' : 'none',
        options: [
          { label: 'UnoCSS', value: 'unocss', hint: i18n.t('prompts.css_framework.unocss.hint') },
          { label: 'Tailwind CSS', value: 'tailwindcss', hint: i18n.t('prompts.css_framework.tailwindcss.hint') },
          { label: i18n.t('prompts.css_framework.none'), value: 'none' },
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
      if (args.router) {
        return Promise.resolve(args.router)
      }

      const platform = (results.platform as string) || args.platform
      if (platform !== 'vue') {
        return Promise.resolve('none')
      }

      if (!args.interactive) {
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
      const type = (results.type as string) || args.type

      return platform === 'vue'
        ? multiselect({
            message: i18n.t('prompts.features.select', { hint: dim('↑/↓ to navigate, space to select, a to toggle all, enter to confirm') }),
            options: [
              { label: i18n.t('prompts.features.eslint.label'), value: 'eslint', hint: i18n.t('prompts.features.eslint.hint') },
              { label: i18n.t('prompts.features.mcp.label'), value: 'mcp', hint: i18n.t('prompts.features.mcp.hint') },
              { label: i18n.t('prompts.features.pinia.label'), value: 'pinia' },
              { label: i18n.t('prompts.features.i18n.label'), value: 'i18n' },
            ],
            initialValues: ['eslint', 'mcp'],
            required: false,
          })
        : multiselect({
            message: i18n.t('prompts.features.select', { hint: dim('↑/↓ to navigate, space to select, a to toggle all, enter to confirm') }),
            options: [
              { label: i18n.t('prompts.features.eslint.label'), value: 'eslint', hint: i18n.t('prompts.features.eslint.hint') },
              ...(type === 'vuetify0' ? [] : [{ label: i18n.t('prompts.features.vuetify_nuxt_module.label'), value: 'vuetify-nuxt-module', hint: i18n.t('prompts.features.vuetify_nuxt_module.hint') }]),
              { label: i18n.t('prompts.features.mcp.label'), value: 'mcp', hint: i18n.t('prompts.features.mcp.hint') },
              { label: i18n.t('prompts.features.pinia.label'), value: 'pinia' },
              { label: i18n.t('prompts.features.i18n.label'), value: 'i18n' },
            ],
            initialValues: ['eslint', ...(type === 'vuetify0' ? [] : ['vuetify-nuxt-module']), 'mcp'],
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
    options.cssFramework === 'none' ? 'css-none' : options.cssFramework,
  ].filter(f => f && f !== 'none')

  return {
    ...options,
    features,
  } as ProjectOptions
}
