import type { Feature } from './types'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getAgentsMd, getRulerToml } from '../utils/mcp'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const mcp: Feature = {
  name: 'mcp',
  apply: async ({ cwd, pkg }) => {
    pkg.devDependencies = pkg.devDependencies || {}
    pkg.devDependencies['@intellectronica/ruler'] = rootPkg.dependencies['@intellectronica/ruler']

    pkg.scripts = pkg.scripts || {}
    pkg.scripts['mcp'] = 'ruler apply'
    pkg.scripts['mcp:revert'] = 'ruler revert'

    const rulerDir = join(cwd, '.ruler')
    await mkdir(rulerDir, { recursive: true })

    await writeFile(join(rulerDir, 'ruler.toml'), getRulerToml())
    await writeFile(join(rulerDir, 'AGENTS.md'), getAgentsMd())
  },
}
