import { box, confirm, log } from '@clack/prompts'
import isInstalledGlobally from 'is-installed-globally'
import { ansi256, bold, green, yellow } from 'kolorist'
import semver from 'semver'
import { x } from 'tinyexec'
import { i18n } from '../i18n'
import { getNpmPackageVersion } from './npm'
import { getPackageManager, getProjectPackageJSON, resolveCommand } from './package'

const blue = ansi256(33)

async function getLatestVersion (packageName: string) {
  const timeout = new Promise<string | null>(resolve =>
    setTimeout(() => resolve(null), 800),
  )
  const latestVersion = await Promise.race([
    getNpmPackageVersion(packageName),
    timeout,
  ])
  return latestVersion
}

function getLocalInstallType (pkg: any, packageName: string): 'dependencies' | 'devDependencies' | null {
  if (!pkg) {
    return null
  }
  if (pkg.dependencies && pkg.dependencies[packageName]) {
    return 'dependencies'
  }
  if (pkg.devDependencies && pkg.devDependencies[packageName]) {
    return 'devDependencies'
  }
  return null
}

function resolveLocalInstallCommand (agent: string, packageName: string, installType: 'dependencies' | 'devDependencies') {
  const target = `${packageName}@latest`
  const dev = installType === 'devDependencies'

  if (agent === 'pnpm') {
    return { command: 'pnpm', args: ['add', ...(dev ? ['-D'] : []), target] }
  }
  if (agent === 'yarn') {
    return { command: 'yarn', args: ['add', ...(dev ? ['-D'] : []), target] }
  }
  if (agent === 'bun') {
    return { command: 'bun', args: ['add', ...(dev ? ['-d'] : []), target] }
  }
  return { command: 'npm', args: ['install', ...(dev ? ['-D'] : []), target] }
}

export async function checkForUpdate (currentVersion: string) {
  const packageName = '@vuetify/cli'
  try {
    const latestVersion = await getLatestVersion(packageName)

    if (latestVersion && semver.gt(latestVersion, currentVersion)) {
      let message = `${yellow(bold(i18n.t('utils.update_check.available')))}\n\n${currentVersion} -> ${latestVersion}\n\n`

      const pkg = await getProjectPackageJSON().catch(() => null)
      const installType = getLocalInstallType(pkg, packageName)
      const isLocal = !!installType

      const pmResult = await getPackageManager()
      const pm = pmResult?.name || 'npm'

      if (isLocal) {
        const { command, args } = resolveCommand(pm, 'install', [packageName])!
        message += i18n.t('utils.update_check.run_update', { command: green(`${command} ${args.join(' ')}`) })
      } else if (isInstalledGlobally) {
        const { command, args } = resolveCommand(pm, 'global', [packageName])!
        message += i18n.t('utils.update_check.run_update', { command: green(`${command} ${args.join(' ')}`) })
      } else {
        message += i18n.t('utils.update_check.run_with', { command: blue(`${packageName}@latest`) })
      }

      box(message, '', { withGuide: false })
    }
  } catch {
    // Ignore errors during update check
  }
}

export async function promptLocalUpdateToContinue (options: {
  packageName: string
  currentVersion: string
  cwd?: string
}) {
  const packageName = options.packageName
  const currentVersion = options.currentVersion

  const startCwd = process.cwd()
  const cwd = options.cwd || startCwd

  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    return
  }

  try {
    process.chdir(cwd)
  } catch {
    return
  }

  try {
    const latestVersion = await getLatestVersion(packageName)
    if (!latestVersion || !semver.gt(latestVersion, currentVersion)) {
      return
    }

    const pkg = await getProjectPackageJSON().catch(() => null)
    const installType = getLocalInstallType(pkg, packageName)
    if (!installType) {
      return
    }

    const message = `${yellow(bold(i18n.t('utils.update_check.available')))}\n\n${currentVersion} -> ${latestVersion}\n`
    box(message, '', { withGuide: false })

    const shouldUpdate = await confirm({
      message: i18n.t('utils.update_check.update_to_continue'),
      initialValue: true,
    })
    if (shouldUpdate !== true) {
      return
    }

    const pmResult = await getPackageManager().catch(() => null)
    const agent = pmResult?.agent || pmResult?.name || 'npm'
    const { command, args } = resolveLocalInstallCommand(agent, packageName, installType)

    log.info(i18n.t('utils.update_check.updating'))
    await x(command, args)
    log.success(i18n.t('utils.update_check.updated'))
    log.info(i18n.t('utils.update_check.rerun'))
    return true
  } finally {
    process.chdir(startCwd)
  }
}
