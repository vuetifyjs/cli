import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { confirm, intro, log, outro, spinner } from '@clack/prompts'
import { getAgentsMd, getRulerToml } from '@vuetify/cli-shared/utils'
import { ansi256 } from 'kolorist'
import { addDevDependency } from 'nypm'
import { join } from 'pathe'
import { findPackage, readPackage, updatePackage } from 'pkg-types'

const RULER_PKG = '@intellectronica/ruler'
const blue = ansi256(33)

async function isPackageInstalled (name: string) {
  try {
    const pkg = await readPackage(process.cwd())
    return !!(
      pkg.dependencies?.[name]
      || pkg.devDependencies?.[name]
      || pkg.peerDependencies?.[name]
    )
  } catch {
    return false
  }
}

export async function addMcp () {
  intro(`Install ${blue(RULER_PKG)} to enable MCP integration with Vuetify.`)

  const hasRuler = await isPackageInstalled(RULER_PKG)

  if (hasRuler) {
    log.info('Dependencies already installed')
  } else {
    log.info(`We need to install ${RULER_PKG}.`)
    const shouldInstall = await confirm({
      message: 'Proceed?',
    })

    if (shouldInstall === true) {
      const s = spinner()
      s.start('Installing dependencies...')
      await addDevDependency(RULER_PKG, { silent: true })
      s.stop('Dependencies installed')
    }
  }

  // Config files
  const rulerDir = join(process.cwd(), '.ruler')
  const rulerTomlPath = join(rulerDir, 'ruler.toml')
  const agentsMdPath = join(rulerDir, 'AGENTS.md')

  const hasRulerDir = existsSync(rulerDir)

  const shouldCreateConfig = await confirm({
    message: hasRulerDir && existsSync(rulerTomlPath) && existsSync(agentsMdPath)
      ? 'Overwrite existing .ruler configuration?'
      : 'Create .ruler configuration?',
  })

  if (shouldCreateConfig === true) {
    const s = spinner()
    s.start('Setting up configuration...')
    await mkdir(rulerDir, { recursive: true })
    await writeFile(rulerTomlPath, getRulerToml())
    await writeFile(agentsMdPath, getAgentsMd())
    s.stop('Configuration complete')
  }

  // Scripts
  const filename = await findPackage()
  const packageJson = await readPackage(filename)

  const hasScripts = packageJson.scripts?.mcp && packageJson.scripts?.['mcp:revert']
  const shouldAddScripts = hasScripts
    ? false
    : await confirm({
        message: 'Add scripts to package.json?',
      })

  if (shouldAddScripts === true) {
    updatePackage(filename, pkg => {
      pkg.scripts ??= {}
      pkg.scripts['mcp'] = 'ruler apply'
      pkg.scripts['mcp:revert'] = 'ruler revert'
      return pkg
    })
  }

  outro('All done!')
}
