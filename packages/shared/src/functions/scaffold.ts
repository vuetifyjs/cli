import fs, { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { downloadTemplate } from 'giget'
import { dirname, join } from 'pathe'
import { readPackageJSON, writePackageJSON } from 'pkg-types'
import { applyFeatures } from '../features'
import { convertProjectToJS } from '../utils/convertProjectToJS'
import { getTemplateSource } from '../utils/getTemplateSource'
import { installDependencies } from '../utils/installDependencies'
import { getProjectAgentsMd, getProjectReadmeMd } from '../utils/projectDocs'

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
  if (type !== 'vuetify') {
    return templates[platform][type]
  }
  if (features.includes('unocss-wind4')) {
    return `${platform}/unocss-wind4`
  }
  if (features.includes('unocss-vuetify')) {
    return `${platform}/unocss-vuetify`
  }
  if (features.includes('tailwindcss')) {
    return `${platform}/tailwind`
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
        ? join(projectRoot, 'app', 'assets')
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
    debug: debugFlag,
  } = options

  const debug = (...msg: any[]) => debugFlag && console.log('DEBUG:', ...msg)

  const projectRoot = join(cwd, name)
  debug('projectRoot=', projectRoot)

  if (force && existsSync(projectRoot)) {
    // Retry removal if it fails with ENOTEMPTY
    // This can happen on macOS if .DS_Store is recreated immediately after deletion
    let retries = 5
    while (retries > 0) {
      try {
        rmSync(projectRoot, { recursive: true, force: true })
        break
      } catch (error: any) {
        if (['ENOTEMPTY', 'EPERM', 'EBUSY'].includes(error.code)) {
          retries--
          if (retries === 0) {
            throw error
          }
          // Busy wait for 50ms
          const start = Date.now()
          while (Date.now() - start < 50) {
            // wait
          }
        } else {
          throw error
        }
      }
    }
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

  await applySharedAssets(projectRoot, platform, type)

  let pkg
  pkg = await readPackageJSON(join(projectRoot, 'package.json'))

  callbacks.onConfigStart?.()
  if (features && features.length > 0) {
    await applyFeatures(projectRoot, features, pkg, !!typescript, platform === 'nuxt', type)
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

  const projectDocsOptions = {
    name,
    platform,
    type,
    features,
    typescript,
    packageManager,
    scripts: pkg?.scripts,
  } as const

  fs.writeFileSync(join(projectRoot, 'AGENTS.md'), getProjectAgentsMd(projectDocsOptions))
  fs.writeFileSync(join(projectRoot, 'README.md'), getProjectReadmeMd(projectDocsOptions))

  if (install && packageManager) {
    callbacks.onInstallStart?.(packageManager)
    await installDependencies(projectRoot, packageManager as any)
    callbacks.onInstallEnd?.()
  }
}
