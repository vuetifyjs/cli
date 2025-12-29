import type { Feature } from './types'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
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

function getRulerToml () {
  return `# For a complete example, see: https://okigu.com/ruler#complete-example

# List of agents to configure
default_agents = ["copilot", "claude", "trae"]

[mcp_servers.vuetify]
url = "https://mcp.vuetifyjs.com/mcp"

# https://github.com/vuetifyjs/mcp#authentication
# [mcp_servers.vuetify.headers]
# Authorization = "Bearer <YOUR_API_KEY>"
`
}

function getAgentsMd () {
  return `# Project Rules

## General
- Follow the existing code style and patterns.
`
}
