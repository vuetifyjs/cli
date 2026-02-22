import fs, { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { downloadTemplate } from 'giget'
import { dirname, join, parse } from 'pathe'
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

function findLocalTemplatePath (templateName: string) {
  let current = process.cwd()
  const root = parse(current).root

  while (true) {
    const templatePath = join(current, 'templates', templateName)
    const workspacePath = join(current, 'pnpm-workspace.yaml')
    const sharedPath = join(current, 'packages', 'shared')

    if (existsSync(templatePath) && existsSync(workspacePath) && existsSync(sharedPath)) {
      return templatePath
    }

    if (current === root) {
      return null
    }

    current = dirname(current)
  }
}

function resolveTemplateName (
  templates: {
    vue: {
      vuetify0: string
      vuetify: string
    }
    nuxt: {
      vuetify0: string
      vuetify: string
    }
  },
  platform: 'vue' | 'nuxt',
  type: 'vuetify' | 'vuetify0',
  features: string[],
) {
  if (platform !== 'vue' || type !== 'vuetify') {
    return templates[platform][type]
  }
  if (features.includes('unocss-wind4')) {
    return 'vue/unocss-wind4'
  }
  if (features.includes('unocss-vuetify')) {
    return 'vue/unocss-vuetify'
  }
  if (features.includes('tailwindcss')) {
    return 'vue/tailwind'
  }
  return templates[platform][type]
}

async function resolveSharedAssetsPath () {
  const templateName = 'shared-assets'
  const envTemplatesPath = process.env.VUETIFY_CLI_TEMPLATES_PATH
  if (envTemplatesPath) {
    const templatePath = join(envTemplatesPath, templateName)
    if (existsSync(templatePath)) {
      return { path: templatePath }
    }
  }

  const localTemplatePath = findLocalTemplatePath(templateName)
  if (localTemplatePath) {
    return { path: localTemplatePath }
  }

  const tempDir = fs.mkdtempSync(join(tmpdir(), 'vuetify-cli-assets-'))
  await downloadTemplate(getTemplateSource(templateName), {
    dir: tempDir,
    force: true,
  })
  return {
    path: tempDir,
    cleanup: () => rmSync(tempDir, { recursive: true, force: true }),
  }
}

function copySharedAsset (sourcePath: string, targetPath: string) {
  if (!existsSync(sourcePath)) {
    return
  }
  fs.mkdirSync(dirname(targetPath), { recursive: true })
  fs.copyFileSync(sourcePath, targetPath)
}

async function applySharedAssets (
  projectRoot: string,
  platform: 'vue' | 'nuxt',
  type: 'vuetify' | 'vuetify0',
) {
  const needsFavicon = type === 'vuetify' && (platform === 'vue' || platform === 'nuxt')
  const needsLogo = platform === 'vue' || platform === 'nuxt'
  const needsV0Badge = type === 'vuetify0'

  if (!needsFavicon && !needsLogo && !needsV0Badge) {
    return
  }

  const assets = await resolveSharedAssetsPath()
  if (!assets) {
    return
  }

  try {
    if (needsFavicon) {
      copySharedAsset(join(assets.path, 'favicon.ico'), join(projectRoot, 'public', 'favicon.ico'))
    }
    if (needsLogo) {
      const logoRoot = platform === 'nuxt'
        ? join(projectRoot, 'assets')
        : join(projectRoot, 'src', 'assets')
      copySharedAsset(join(assets.path, 'logo.png'), join(logoRoot, 'logo.png'))
      copySharedAsset(join(assets.path, 'logo.svg'), join(logoRoot, 'logo.svg'))
    }
    if (needsV0Badge) {
      copySharedAsset(join(assets.path, '0.png'), join(projectRoot, 'public', '0.png'))
    }
  } finally {
    assets.cleanup?.()
  }
}

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
      vuetify: 'nuxt/base',
    },
  } as const

  const templateName = resolveTemplateName(templates, platform, type, features)

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
    const localTemplatePath = findLocalTemplatePath(templateName)
    if (localTemplatePath) {
      debug(`Copying template from ${localTemplatePath}...`)
      fs.cpSync(localTemplatePath, projectRoot, {
        recursive: true,
        filter: src => {
          return !src.includes('node_modules') && !src.includes('.git') && !src.includes('.DS_Store')
        },
      })
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
  }
  callbacks.onDownloadEnd?.()

  await applySharedAssets(projectRoot, platform, type)

  let pkg
  pkg = await readPackageJSON(join(projectRoot, 'package.json'))

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
