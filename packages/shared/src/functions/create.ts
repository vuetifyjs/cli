import type { ProjectArgs } from '../args'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { box, confirm, intro, log, outro, spinner, text } from '@clack/prompts'
import slugify from '@sindresorhus/slugify'
import { ansi256, link } from 'kolorist'
import { getUserAgent } from 'package-manager-detector'
import { join, relative, resolve } from 'pathe'
import { standardPresets } from '../constants/presets'
import { i18n } from '../i18n'
import { type ProjectOptions, prompt } from '../prompts'
import { createBanner } from '../utils/banner'
import { scaffold } from './scaffold'

export interface CreateVuetifyOptions extends ProjectArgs {
  [key: string]: any
  version: string
  cwd?: string
  features?: string
  typescript?: boolean
  packageManager?: string
  debug?: boolean
  type?: string
  platform?: string
  clientHints?: boolean
  css?: string
  router?: string
}

export interface StylisticOptions {
  intro?: boolean
}

export async function createVuetify (options: CreateVuetifyOptions, commandOptions?: StylisticOptions) {
  const { version, ...args } = options
  const cwd = args.cwd || process.cwd()
  const debug = (...msg: any[]) => args.debug && console.log('DEBUG:', ...msg)
  debug('run args=', JSON.stringify(args, null, 2))
  debug('VUETIFY_CLI_TEMPLATES_PATH=', process.env.VUETIFY_CLI_TEMPLATES_PATH)

  if (commandOptions?.intro === false) {
    log.info(i18n.t('messages.create.intro', { version }))
  } else {
    console.log(createBanner())

    intro(i18n.t('messages.create.intro', { version }))
  }

  if (args.preset) {
    if (standardPresets[args.preset]) {
      const preset = standardPresets[args.preset]
      Object.assign(args, preset)
      debug('loaded standard preset=', preset)
    } else {
      const home = homedir()
      const presetPath = resolve(args.preset)
      const presetName = args.preset.endsWith('.json') ? args.preset : `${args.preset}.json`
      const globalPresetPath = join(home, '.vuetify', 'presets', presetName)

      let presetContent
      if (existsSync(presetPath)) {
        presetContent = readFileSync(presetPath, 'utf8')
      } else if (existsSync(globalPresetPath)) {
        presetContent = readFileSync(globalPresetPath, 'utf8')
      } else {
        const slug = slugify(args.preset)
        const slugGlobalPath = join(home, '.vuetify', 'presets', `${slug}.json`)
        if (existsSync(slugGlobalPath)) {
          presetContent = readFileSync(slugGlobalPath, 'utf8')
        }
      }

      if (presetContent) {
        try {
          const preset = JSON.parse(presetContent)
          Object.assign(args, preset)
          debug('loaded preset=', preset)
        } catch (error) {
          debug('failed to parse preset', error)
        }
      }
    }
  }

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
    css: rawArgs.css as ProjectOptions['css'],
    router: rawArgs.router as ProjectOptions['router'],
    vuetifyVersion: args.vuetifyVersion as ProjectOptions['vuetifyVersion'],
  }, cwd)
  debug('context=', JSON.stringify(context, null, 2))

  if (args.interactive && !args.preset) {
    const save = await confirm({
      message: i18n.t('prompts.preset.save'),
      initialValue: false,
    })

    if (save) {
      const displayName = await text({
        message: i18n.t('prompts.preset.name'),
        validate: value => {
          if (!value) {
            return 'Please enter a name'
          }
        },
      })

      if (typeof displayName === 'string') {
        const home = homedir()
        const presetsDir = join(home, '.vuetify', 'create', 'presets')
        if (!existsSync(presetsDir)) {
          mkdirSync(presetsDir, { recursive: true })
        }

        const slug = slugify(displayName)
        const filename = `${slug}.json`
        const presetPath = join(presetsDir, filename)

        let shouldSave = true
        if (existsSync(presetPath)) {
          shouldSave = await confirm({
            message: i18n.t('prompts.preset.overwrite', { name: displayName }),
            initialValue: false,
          }) as boolean
        }

        if (shouldSave) {
          const { name: _, ...presetContext } = context
          const presetContent = {
            ...presetContext,
            version, // CLI version
            meta: {
              version: '1.0.0', // Preset format version
              displayName,
            },
          }
          writeFileSync(presetPath, JSON.stringify(presetContent, null, 2))
          log.step(i18n.t('prompts.preset.saved', { path: presetPath }))
        }
      }
    }
  }

  const projectRoot = join(cwd, context.name)
  debug('projectRoot=', projectRoot)

  const s = spinner()

  try {
    await scaffold({
      cwd,
      name: context.name,
      platform: context.platform as 'vue' | 'nuxt',
      type: context.type as 'vuetify' | 'vuetify0',
      vuetifyVersion: context.vuetifyVersion,
      features: context.features,
      typescript: !!context.typescript,
      packageManager: context.packageManager,
      install: context.install,
      force: context.force,
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

  const relativePath = relative(cwd, projectRoot)
  const pm = (context.packageManager === 'none' ? getUserAgent() : context.packageManager) || 'npm'

  const lines = []
  if (relativePath) {
    lines.push(`cd ${relativePath}`)
  }
  if (!context.install) {
    lines.push(`${pm} install`)
  }
  lines.push(`${pm} ${pm === 'npm' ? 'run ' : ''}dev`)

  outro(i18n.t('messages.create.generated', { name: context.name, path: relativePath }))

  box(lines.join('\n'), 'Next steps', {
    withGuide: false,
  })

  const blue = ansi256(33)

  console.log(
    `${blue(link('Docs', 'https://0.vuetifyjs.com/guide'))}  ⸱ `
    + `${blue(link('Discord', 'https://discord.gg/vK6T89eNP7'))}  ⸱ `
    + `${blue(link('Support Us', 'https://opencollective.com/vuetify'))}\n`,
  )
}
