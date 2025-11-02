import isGlobal from 'is-installed-globally'
import { addDependency } from 'nypm'

export async function upgradeSelf (pkgName: string) {
  if (!isGlobal) {
    console.log(`${pkgName} is not installed globally.`)
    return
  }
  try {
    console.log(`Upgrading ${pkgName} globally using nypm...`)
    await addDependency(`${pkgName}@latest`, { global: true })
    console.log(`Successfully upgraded ${pkgName} to latest.`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Failed to upgrade ${pkgName}: ${message}`)
    process.exitCode = 1
  }
}
