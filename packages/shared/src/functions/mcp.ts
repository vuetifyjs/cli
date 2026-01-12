import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { confirm, intro, log, outro, spinner } from '@clack/prompts'
import { ansi256 } from 'kolorist'
import { addDevDependency } from 'nypm'
import { join } from 'pathe'
import { findPackage, readPackage, updatePackage } from 'pkg-types'
import { i18n } from '../i18n'
import { getAgentsMd, getRulerToml } from '../utils/mcp'
import { tryResolvePackage } from '../utils/package'

const RULER_PKG = '@intellectronica/ruler'
const blue = ansi256(33)
const description = i18n.t('commands.mcp.description', { pkg: blue(RULER_PKG) })

export async function addMcp () {
  intro(description)

  const hasRuler = await tryResolvePackage(RULER_PKG)

  if (hasRuler) {
    log.info(i18n.t('messages.eslint.deps_already_installed'))
  } else {
    log.info(i18n.t('commands.mcp.need_to', { action: i18n.t('commands.mcp.action.install', { pkg: RULER_PKG }) }))
    const shouldInstall = await confirm({
      message: i18n.t('prompts.proceed'),
    })

    if (shouldInstall === true) {
      const s = spinner()
      s.start(i18n.t('spinners.dependencies.installing'))
      await addDevDependency(RULER_PKG, { silent: true })
      s.stop(i18n.t('spinners.dependencies.installed'))
    }
  }

  // Config files
  const rulerDir = join(process.cwd(), '.ruler')
  const rulerTomlPath = join(rulerDir, 'ruler.toml')
  const agentsMdPath = join(rulerDir, 'AGENTS.md')

  const hasRulerDir = existsSync(rulerDir)

  const shouldCreateConfig = await confirm({
    message: hasRulerDir && existsSync(rulerTomlPath) && existsSync(agentsMdPath)
      ? i18n.t('prompts.mcp.overwrite', { file: '.ruler' })
      : i18n.t('prompts.mcp.create'),
  })

  if (shouldCreateConfig === true) {
    const s = spinner()
    s.start(i18n.t('spinners.mcp.setup_config'))
    await mkdir(rulerDir, { recursive: true })
    await writeFile(rulerTomlPath, getRulerToml())
    await writeFile(agentsMdPath, getAgentsMd())
    s.stop(i18n.t('spinners.mcp.complete'))
  }

  // Scripts
  const filename = await findPackage()
  const packageJson = await readPackage(filename)

  const hasScripts = packageJson.scripts?.mcp && packageJson.scripts?.['mcp:revert']
  const shouldAddScripts = hasScripts
    ? false
    : await confirm({
        message: i18n.t('prompts.mcp.scripts'),
      })

  if (shouldAddScripts === true) {
    updatePackage(filename, pkg => {
      pkg.scripts ??= {}
      pkg.scripts['mcp'] = 'ruler apply'
      pkg.scripts['mcp:revert'] = 'ruler revert'
      return pkg
    })
  }

  outro(i18n.t('messages.all_done'))
}
