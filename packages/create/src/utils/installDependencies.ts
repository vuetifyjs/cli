import { installDependencies as installDependencies$1 } from 'nypm'
import { getUserAgent } from 'package-manager-detector'
import { pnpm } from './cli/postinstall'
import { yarn } from './cli/preinstall'

export const packageManager = getUserAgent() ?? 'npm'

export async function installDependencies (root: string = process.cwd(), manager = packageManager) {
  if (manager === 'yarn') {
    await yarn(root)
  }
  await installDependencies$1({
    packageManager: manager,
    cwd: root,
    silent: true,
  })
    .catch(() => {
      console.error(
        `Failed to install dependencies using ${manager}.`,
      )
    })
  if (manager === 'pnpm') {
    await pnpm(root)
  }
}
