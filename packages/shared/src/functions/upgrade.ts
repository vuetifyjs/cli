import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { log } from '@clack/prompts'
import { addDependency } from 'nypm'
import { i18n } from '../i18n'

function isInstalledLocally (): boolean {
  // Check if CLI is inside a local node_modules (relative to cwd)
  // If so, it's a local installation and shouldn't be upgraded globally
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const cwd = process.cwd()
  const localNodeModules = path.join(cwd, 'node_modules')

  return __dirname.startsWith(localNodeModules)
}

export async function upgradeSelf (pkgName: string) {
  if (isInstalledLocally()) {
    log.warning(i18n.t('commands.upgrade.not_global', { pkg: pkgName }))
    return
  }
  try {
    log.info(i18n.t('commands.upgrade.start', { pkg: pkgName }))
    await addDependency(`${pkgName}@latest`, { global: true })
    log.success(i18n.t('commands.upgrade.success', { pkg: pkgName }))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error(i18n.t('commands.upgrade.fail', { pkg: pkgName, message }))
    process.exitCode = 1
  }
}
