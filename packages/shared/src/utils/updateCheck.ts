import { box } from '@clack/prompts'
import isInstalledGlobally from 'is-installed-globally'
import { ansi256, bold, green, yellow } from 'kolorist'
import semver from 'semver'
import { i18n } from '../i18n'
import { getNpmPackageVersion } from './npm'
import { getPackageManager, getProjectPackageJSON, resolveCommand } from './package'

const blue = ansi256(33)

export async function checkForUpdate (currentVersion: string) {
  const packageName = '@vuetify/cli'
  try {
    const timeout = new Promise<string | null>(resolve =>
      setTimeout(() => resolve(null), 800),
    )
    const latestVersion = await Promise.race([
      getNpmPackageVersion(packageName),
      timeout,
    ])

    if (latestVersion && semver.gt(latestVersion, currentVersion)) {
      let message = `${yellow(bold(i18n.t('utils.update_check.available')))}\n\n${currentVersion} -> ${latestVersion}\n\n`

      const pkg = await getProjectPackageJSON().catch(() => null)
      const isLocal = pkg && (
        (pkg.dependencies && pkg.dependencies[packageName])
        || (pkg.devDependencies && pkg.devDependencies[packageName])
      )

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
