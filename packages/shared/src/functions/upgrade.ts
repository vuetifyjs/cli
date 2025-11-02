import isGlobal from 'is-installed-globally'
import { addDependency } from 'nypm'
import { i18n } from '../i18n'

export async function upgradeSelf (pkgName: string) {
  if (!isGlobal) {
    console.log(i18n.t('commands.upgrade.not_global', { pkg: pkgName }))
    return
  }
  try {
    console.log(i18n.t('commands.upgrade.start', { pkg: pkgName }))
    await addDependency(`${pkgName}@latest`, { global: true })
    console.log(i18n.t('commands.upgrade.success', { pkg: pkgName }))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(i18n.t('commands.upgrade.fail', { pkg: pkgName, message }))
    process.exitCode = 1
  }
}
