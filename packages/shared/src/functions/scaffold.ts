import fs, { existsSync, rmSync } from 'node:fs'
import { downloadTemplate } from 'giget'
import { join } from 'pathe'
import { readPackageJSON, writePackageJSON } from 'pkg-types'
import { applyFeatures, vuetifyNuxtManual } from '../features'
import { convertProjectToJS } from '../utils/convertProjectToJS'
import { getTemplateSource } from '../utils/getTemplateSource'
import { installDependencies } from '../utils/installDependencies'

export interface ScaffoldOptions {
  cwd: string
  name: string
  platform: 'vue' | 'nuxt'
  type: 'vuetify' | 'vuetify0'
  vuetifyVersion?: '3.x' | '4.x'
  features: string[]
  typescript: boolean
  packageManager?: string
  install?: boolean
  force?: boolean
  clientHints?: boolean
  debug?: boolean
}

export interface ScaffoldCallbacks {
  onLog?: (msg: string) => void
  onDownloadStart?: (templateName: string) => void
  onDownloadEnd?: () => void
  onConfigStart?: () => void
  onConfigEnd?: () => void
  onConvertStart?: () => void
  onConvertEnd?: () => void
  onInstallStart?: (pm: string) => void
  onInstallEnd?: () => void
}

export async function scaffold (options: ScaffoldOptions, callbacks: ScaffoldCallbacks = {}) {
  const {
    cwd,
    name,
    platform,
    features,
    typescript,
    type,
    vuetifyVersion,
    packageManager,
    install,
    force,
    clientHints,
    debug: debugFlag,
  } = options

  const debug = (...msg: any[]) => debugFlag && console.log('DEBUG:', ...msg)

  const projectRoot = join(cwd, name)
  debug('projectRoot=', projectRoot)

  if (force && existsSync(projectRoot)) {
    rmSync(projectRoot, { recursive: true, force: true })
  }

  const templates = {
    vue: {
      vuetify0: 'vuetify0/base',
      vuetify: 'vue/base',
    },
    nuxt: {
      vuetify0: 'vuetify0/nuxt',
      vuetify: 'vue/nuxt',
    },
  } as const

  const templateName = templates[platform][type]

  callbacks.onDownloadStart?.(templateName)

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
    } else {
      debug(`templatePath does not exist: ${templatePath}`)
    }
  } else {
    const templateSource = getTemplateSource(templateName)

    try {
      await downloadTemplate(templateSource, {
        dir: projectRoot,
        force,
      })
    } catch (error) {
      console.error(`Failed to download template: ${error}`)
      throw error
    }
  }
  callbacks.onDownloadEnd?.()

  let pkg
  pkg = await readPackageJSON(join(projectRoot, 'package.json'))

  if (vuetifyVersion === '4.x' && pkg.dependencies && pkg.dependencies.vuetify) {
    pkg.dependencies.vuetify = '^4.0.0-beta.1'
  }

  callbacks.onConfigStart?.()
  if (features && features.length > 0) {
    await applyFeatures(projectRoot, features, pkg, !!typescript, platform === 'nuxt', clientHints, type)
  }

  if (platform === 'nuxt' && type !== 'vuetify0' && (!features || !features.includes('vuetify-nuxt-module'))) {
    await vuetifyNuxtManual.apply({ cwd: projectRoot, pkg, isTypescript: !!typescript, isNuxt: true })
  }
  callbacks.onConfigEnd?.()

  // Update package.json name
  const pkgPath = join(projectRoot, 'package.json')
  if (existsSync(pkgPath)) {
    if (!pkg) {
      pkg = await readPackageJSON(pkgPath)
    }
    pkg.name = name
    await writePackageJSON(pkgPath, pkg)
  }

  if (platform === 'vue' && !typescript) {
    callbacks.onConvertStart?.()
    await convertProjectToJS(projectRoot)
    callbacks.onConvertEnd?.()
  }

  if (install && packageManager) {
    callbacks.onInstallStart?.(packageManager)
    await installDependencies(projectRoot, packageManager as any)
    callbacks.onInstallEnd?.()
  }
}
