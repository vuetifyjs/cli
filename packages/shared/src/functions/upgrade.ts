import { log } from '@clack/prompts'
import isGlobal from 'is-installed-globally'
import { addDependency } from 'nypm'
import { i18n } from '../i18n'

export async function upgradeSelf (pkgName: string) {
  if (!isGlobal) {
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
