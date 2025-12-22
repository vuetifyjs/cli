import fs, { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { intro, outro, spinner } from '@clack/prompts'
import { createBanner, projectArgs } from '@vuetify/cli-shared'
import { i18n } from '@vuetify/cli-shared/i18n'
import { defineCommand, runMain } from 'citty'
import { downloadTemplate } from 'giget'
import { readPackageJSON, writePackageJSON } from 'pkg-types'

import { version } from '../package.json'
import { upgrade } from './commands/upgrade'
import { applyFeatures } from './features'
import { vuetifyNuxtManual } from './features/vuetify-nuxt-manual'
import { prompt } from './prompts'
import { convertProjectToJS } from './utils/convertProjectToJS'
import { installDependencies } from './utils/installDependencies'

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
    platform: {
      type: 'string',
      description: 'The framework to use (vue, nuxt)',
      default: 'vue',
    },
  },
  run: async ({ args }) => {
    const cwd = args.cwd || process.cwd()
    const debug = (...msg: any[]) => args.debug && console.log('DEBUG:', ...msg)
    debug('run args=', JSON.stringify(args, null, 2))
    debug('VUETIFY_CLI_TEMPLATES_PATH=', process.env.VUETIFY_CLI_TEMPLATES_PATH)

    console.log(createBanner())

    intro(i18n.t('messages.create.intro', { version }))

    const features = typeof args.features === 'string'
      ? args.features.split(',').filter(Boolean)
      : args.features

    const rawArgs = args as Record<string, any>
    const packageManager = rawArgs.packageManager || rawArgs['package-manager']

    if (args.v0) {
      rawArgs.type = 'vuetify0'
    }

    const context = await prompt({
      ...args,
      features,
      packageManager,
      platform: rawArgs.platform,
      type: rawArgs.type,
    }, cwd)
    debug('context=', JSON.stringify(context, null, 2))
    const projectRoot = join(cwd, context.name)
    debug('projectRoot=', projectRoot)

    if (context.force && existsSync(projectRoot)) {
      rmSync(projectRoot, { recursive: true, force: true })
    }

    const templateName = context.platform === 'vue'
      ? `vue/base`
      : `nuxt/base`

    const s = spinner()
    s.start(i18n.t('spinners.template.downloading', { template: templateName }))

    if (process.env.VUETIFY_CLI_TEMPLATES_PATH) {
      const templatePath = join(process.env.VUETIFY_CLI_TEMPLATES_PATH, templateName)
      debug(`Copying template from ${templatePath}...`)
      if (existsSync(templatePath)) {
        debug(`templatePath exists. Copying to ${projectRoot}`)
        fs.cpSync(templatePath, projectRoot, {
          recursive: true,
          filter: src => {
            return !src.includes('node_modules') && !src.includes('.git') && !src.includes('.DS_Store')
          },
        })
        debug(`Copy complete.`)
        try {
          const files = fs.readdirSync(projectRoot)
          debug('files in projectRoot:', files)
        } catch (error) {
          debug('Failed to list files in projectRoot:', error)
        }
      } else {
        debug(`templatePath does not exist: ${templatePath}`)
      }
      s.stop(i18n.t('spinners.template.copied'))
    } else {
      const templateSource = `gh:vuetifyjs/templates/${templateName}`

      try {
        await downloadTemplate(templateSource, {
          dir: projectRoot,
          force: context.force,
        })
        s.stop(i18n.t('spinners.template.downloaded'))
      } catch (error) {
        s.stop(i18n.t('spinners.template.failed'))
        console.error(`Failed to download template: ${error}`)
        throw error
      }
    }

    let pkg
    pkg = await readPackageJSON(join(projectRoot, 'package.json'))

    s.start(i18n.t('spinners.config.applying'))
    if (context.features && context.features.length > 0) {
      await applyFeatures(projectRoot, context.features, pkg, !!context.typescript, context.clientHints)
    }

    if (context.platform === 'nuxt' && (!context.features || !context.features.includes('vuetify-nuxt-module'))) {
      await vuetifyNuxtManual.apply({ cwd: projectRoot, pkg, isTypescript: !!context.typescript })
    }
    s.stop(i18n.t('spinners.config.applied'))

    // Update package.json name
    const pkgPath = join(projectRoot, 'package.json')
    if (existsSync(pkgPath)) {
      if (!pkg) {
        pkg = await readPackageJSON(pkgPath)
      }
      pkg.name = context.name
      await writePackageJSON(pkgPath, pkg)
    }

    if (context.platform === 'vue' && !context.typescript) {
      s.start(i18n.t('spinners.convert.js'))
      await convertProjectToJS(projectRoot)
      s.stop(i18n.t('spinners.convert.done'))
    }

    if (context.install && context.packageManager) {
      s.start(i18n.t('spinners.dependencies.installing_with', { pm: context.packageManager }))
      await installDependencies(projectRoot, context.packageManager as any)
      s.stop(i18n.t('spinners.dependencies.installed'))
    }

    outro(i18n.t('messages.create.generated', { name: context.name, path: projectRoot }))
  },
  subCommands: {
    upgrade,
  },
})

runMain(main)
