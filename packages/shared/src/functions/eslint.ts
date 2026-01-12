import { writeFile } from 'node:fs/promises'
import { confirm, intro, log, outro, spinner } from '@clack/prompts'
import { ansi256, underline } from 'kolorist'
import { loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { addDevDependency } from 'nypm'
import { resolveCommand } from 'package-manager-detector/commands'
import { relative } from 'pathe'
import { findPackage, readPackage, updatePackage } from 'pkg-types'
import { x } from 'tinyexec'
import { ESLINT, ESLINT_CONFIG, LINKS, NUXT_ESLINT } from '../constants/eslint'
import { getNuxtEslintContent, getVueEslintContent } from '../features/eslint'
import { i18n } from '../i18n'
import { getPackageManager, getPackageVersion, isVersionAtLeast, tryResolveFilePath, tryResolvePackage } from '../utils/package'

const blue = ansi256(33)
const description = i18n.t('commands.eslint.description', { configPkg: blue(ESLINT_CONFIG) })

async function getEslintStatus () {
  const nuxtConfigPath = tryResolveFilePath('./nuxt.config', {
    extensions: ['.ts', '.js', '.mjs', '.cjs', '.mts', '.cts'],
  })
  const isNuxt = !!nuxtConfigPath

  const eslintVersion = await getPackageVersion(ESLINT)
  const configVersion = await getPackageVersion(ESLINT_CONFIG)
  const nuxtEslintVersion = await getPackageVersion(NUXT_ESLINT)

  const hasEslint = await tryResolvePackage(ESLINT)
  const hasEslintConfig = await tryResolvePackage(ESLINT_CONFIG)
  const hasNuxtEslint = await tryResolvePackage(NUXT_ESLINT)

  const isEslintVersionValid = isVersionAtLeast(eslintVersion, '9.5.0')
  const isEslintSupportsConcurrency = isVersionAtLeast(eslintVersion, '9.34.0')
  const isConfigVersionValid = isVersionAtLeast(configVersion, '4.0.0')

  const packagesToInstall = [
    ...(hasEslint ? [] : [ESLINT]),
    ...(hasEslintConfig ? [] : [ESLINT_CONFIG]),
    ...(isNuxt && !hasNuxtEslint ? [NUXT_ESLINT] : []),
  ] as Array<typeof ESLINT | typeof ESLINT_CONFIG | typeof NUXT_ESLINT>

  const packagesToUpgrade = [
    ...(isEslintVersionValid ? [] : [ESLINT]),
    ...(isConfigVersionValid ? [] : [ESLINT_CONFIG]),
  ] as Array<typeof ESLINT | typeof ESLINT_CONFIG | typeof NUXT_ESLINT>

  return {
    eslintVersion,
    configVersion,
    nuxtEslintVersion,
    hasEslint,
    hasEslintConfig,
    hasNuxtEslint,
    isEslintVersionValid,
    isEslintSupportsConcurrency,
    isConfigVersionValid,
    packagesToInstall,
    packagesToUpgrade,
    isNuxt,
    nuxtConfigPath,
  }
}

function getActionMessage (status: Awaited<ReturnType<typeof getEslintStatus>>) {
  const { packagesToInstall, packagesToUpgrade, hasEslint, hasEslintConfig, hasNuxtEslint, eslintVersion, configVersion, nuxtEslintVersion } = status
  const actions: string[] = []
  if (packagesToInstall.length > 0) {
    const pkgs = packagesToInstall.map(pkg => LINKS[pkg]).join(', ')
    actions.push(i18n.t('commands.eslint.action.install', { pkgs }))
  }
  if (packagesToUpgrade.length > 0) {
    const pkgs = packagesToUpgrade.map(pkg => LINKS[pkg]).join(', ')
    const upgradeAction = i18n.t('commands.eslint.action.upgrade', { pkgs })
    if (packagesToInstall.length > 0) {
      actions.push(`${i18n.t('common.and')} ${upgradeAction}`)
    } else {
      actions.push(upgradeAction)
    }
  }

  if (hasEslint || hasEslintConfig || hasNuxtEslint) {
    actions.push(`(${i18n.t('commands.eslint.current')}:`)
    if (hasEslint) {
      actions.push(`  ${ESLINT}: ${eslintVersion}`)
    }
    if (hasEslintConfig) {
      actions.push(`  ${ESLINT_CONFIG}: ${configVersion}`)
    }
    if (hasNuxtEslint) {
      actions.push(`  ${NUXT_ESLINT}: ${nuxtEslintVersion}`)
    }
    actions.push(')')
  }
  return i18n.t('commands.eslint.need_to', { actions: actions.join(' ') })
}

export async function addEslint () {
  intro(description)

  const status = await getEslintStatus()
  const { packagesToInstall, packagesToUpgrade, isEslintSupportsConcurrency, isNuxt, nuxtConfigPath } = status

  const tsConfigPath = tryResolveFilePath('tsconfig.json')
  const isTypescript = !!tsConfigPath

  const configPath = tryResolveFilePath('./eslint.config', {
    extensions: ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'],
  })

  if (packagesToInstall.length > 0 || packagesToUpgrade.length > 0) {
    log.info(getActionMessage(status))
    const shouldInstall = await confirm({
      message: i18n.t('prompts.proceed'),
    })
    if (shouldInstall === true) {
      const s = spinner()
      s.start(i18n.t('spinners.dependencies.installing'))
      if (packagesToInstall.length > 0) {
        await addDevDependency(packagesToInstall, { silent: true })
      }
      if (packagesToUpgrade.length > 0) {
        const packageManager = await getPackageManager()
        const upgradeCommand = resolveCommand(packageManager!.agent, 'upgrade', packagesToUpgrade)
        await x(upgradeCommand!.command, upgradeCommand!.args.concat(['--silent']))
      }
      s.stop(i18n.t('spinners.dependencies.installed'))
    }
  } else {
    log.info(i18n.t('messages.eslint.deps_already_installed'))
  }

  if (isNuxt && nuxtConfigPath) {
    const mod = await loadFile(nuxtConfigPath)
    const options = getDefaultExportOptions(mod)
    if (options) {
      options.modules ||= []
      if (!options.modules.includes('@nuxt/eslint')) {
        options.modules.push('@nuxt/eslint')

        options.eslint = {
          config: {
            import: {
              package: 'eslint-plugin-import-lite',
            },
          },
        }
        await writeFile(nuxtConfigPath, mod.generate().code)
      }
    }
  }

  let overwriteConfig = false as boolean | symbol
  overwriteConfig = await (configPath
    ? confirm({
        message: i18n.t('prompts.eslint.overwrite', { file: underline(relative(process.cwd(), configPath)) }),
      })
    : confirm({
        message: i18n.t('prompts.eslint.create'),
      }))

  if (overwriteConfig === true) {
    const configData = isNuxt ? getNuxtEslintContent(isTypescript) : getVueEslintContent(isTypescript)
    const s = spinner()
    s.start(i18n.t('spinners.eslint.setup_config'))
    await writeFile(configPath ?? 'eslint.config.mjs', configData)
    s.stop(i18n.t('spinners.eslint.complete'))
  }

  const filename = await findPackage()

  const packageJson = await readPackage(filename)

  const hasLintAndFixScripts = packageJson.scripts?.lint && packageJson.scripts?.['lint:fix']
  const shouldAddScripts = hasLintAndFixScripts
    ? false
    : await confirm({
        message: i18n.t('prompts.eslint.scripts'),
      })

  if (shouldAddScripts === true) {
    updatePackage(filename, pkg => {
      pkg.scripts ??= {}
      if (!pkg.scripts.lint) {
        pkg.scripts.lint = isEslintSupportsConcurrency ? 'eslint --concurrency auto' : 'eslint'
      }
      if (!pkg.scripts['lint:fix']) {
        pkg.scripts['lint:fix'] = isEslintSupportsConcurrency ? 'eslint --fix --concurrency auto' : 'eslint --fix'
      }
      return pkg
    })
  }

  outro(i18n.t('messages.all_done'))
}
