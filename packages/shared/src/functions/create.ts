import type { ProjectArgs } from '../args'
import { join } from 'node:path'
import { intro, outro, spinner } from '@clack/prompts'
import { i18n } from '../i18n'
import { prompt } from '../prompts'
import { createBanner } from '../utils/banner'
import { scaffold } from './scaffold'

export interface CreateVuetifyOptions extends ProjectArgs {
  [key: string]: any
  version: string
  cwd?: string
  features?: string | string[]
  typescript?: boolean
  packageManager?: string
  debug?: boolean
  type?: string
  platform?: string
  clientHints?: boolean
}

export async function createVuetify (options: CreateVuetifyOptions) {
  const { version, ...args } = options
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

  const s = spinner()

  try {
    await scaffold({
      cwd,
      name: context.name,
      platform: context.platform as 'vue' | 'nuxt',
      type: context.type as 'vuetify' | 'vuetify0',
      features: context.features,
      typescript: !!context.typescript,
      packageManager: context.packageManager as string,
      install: context.install as boolean,
      force: context.force as boolean,
      clientHints: context.clientHints,
      debug: args.debug,
    }, {
      onDownloadStart: templateName => {
        s.start(i18n.t('spinners.template.downloading', { template: templateName }))
      },
      onDownloadEnd: () => {
        if (process.env.VUETIFY_CLI_TEMPLATES_PATH) {
          s.stop(i18n.t('spinners.template.copied'))
        } else {
          s.stop(i18n.t('spinners.template.downloaded'))
        }
      },
      onConfigStart: () => {
        s.start(i18n.t('spinners.config.applying'))
      },
      onConfigEnd: () => {
        s.stop(i18n.t('spinners.config.applied'))
      },
      onConvertStart: () => {
        s.start(i18n.t('spinners.convert.js'))
      },
      onConvertEnd: () => {
        s.stop(i18n.t('spinners.convert.done'))
      },
      onInstallStart: pm => {
        s.start(i18n.t('spinners.dependencies.installing_with', { pm }))
      },
      onInstallEnd: () => {
        s.stop(i18n.t('spinners.dependencies.installed'))
      },
    })
  } catch (error) {
    s.stop(i18n.t('spinners.template.failed'))
    console.error(`Failed to create project: ${error}`)
    throw error
  }

  outro(i18n.t('messages.create.generated', { name: context.name, path: projectRoot }))
}
