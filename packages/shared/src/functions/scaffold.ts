import fs, { existsSync, rmSync } from 'node:fs'
import { downloadTemplate } from 'giget'
import { join } from 'pathe'
import { readPackageJSON, writePackageJSON } from 'pkg-types'
import { DependencyInstallError, FeatureApplyError, TemplateCopyError, TemplateDownloadError } from '../errors'
import { applyFeatures, vuetifyNuxtManual } from '../features'
import { convertProjectToJS } from '../utils/convertProjectToJS'
import { installDependencies } from '../utils/installDependencies'

export interface ScaffoldOptions {
  cwd: string
  name: string
  platform: 'vue' | 'nuxt'
  type: 'vuetify' | 'vuetify0'
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

// eslint-disable-next-line complexity -- error handling adds necessary complexity for DX
export async function scaffold (options: ScaffoldOptions, callbacks: ScaffoldCallbacks = {}) {
  const {
    cwd,
    name,
    platform,
    features,
    typescript,
    type,
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
      try {
        fs.cpSync(templatePath, projectRoot, {
          recursive: true,
          filter: src => {
            return !src.includes('node_modules') && !src.includes('.git') && !src.includes('.DS_Store')
          },
        })
        debug(`Copy complete.`)
      } catch (error_) {
        const error = error_ instanceof Error ? error_ : new Error(String(error_))
        throw new TemplateCopyError(templatePath, error)
      }
    } else {
      throw new TemplateCopyError(templatePath, new Error('Template path does not exist'))
    }
  } else {
    const templateSource = `gh:vuetifyjs/templates/${templateName}`

    try {
      await downloadTemplate(templateSource, {
        dir: projectRoot,
        force,
      })
    } catch (error_) {
      const error = error_ instanceof Error ? error_ : new Error(String(error_))
      throw new TemplateDownloadError(templateName, error)
    }
  }
  callbacks.onDownloadEnd?.()

  let pkg
  pkg = await readPackageJSON(join(projectRoot, 'package.json'))

  callbacks.onConfigStart?.()
  if (features && features.length > 0) {
    try {
      await applyFeatures(projectRoot, features, pkg, !!typescript, platform === 'nuxt', clientHints, type)
    } catch (error_) {
      const error = error_ instanceof Error ? error_ : new Error(String(error_))
      throw new FeatureApplyError(features.join(', '), error)
    }
  }

  if (platform === 'nuxt' && type !== 'vuetify0' && (!features || !features.includes('vuetify-nuxt-module'))) {
    try {
      await vuetifyNuxtManual.apply({ cwd: projectRoot, pkg, isTypescript: !!typescript, isNuxt: true })
    } catch (error_) {
      const error = error_ instanceof Error ? error_ : new Error(String(error_))
      throw new FeatureApplyError('vuetify-nuxt-manual', error)
    }
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
    try {
      await installDependencies(projectRoot, packageManager as any)
    } catch (error_) {
      const error = error_ instanceof Error ? error_ : new Error(String(error_))
      throw new DependencyInstallError(packageManager, error)
    }
    callbacks.onInstallEnd?.()
  }
}
