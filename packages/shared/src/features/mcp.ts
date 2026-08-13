import type { Feature } from './types'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import { DEFAULT_VUETIFY_MCP_SERVER_ID, DEFAULT_VUETIFY_REMOTE_URL } from '../mcp-core'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const mcp: Feature = {
  name: 'mcp',
  apply: async ({ cwd, pkg }) => {
    pkg.devDependencies = pkg.devDependencies || {}
    pkg.devDependencies['@vuetify/mcp'] = rootPkg.dependencies['@vuetify/mcp']

    await writeMcpClientConfigs(cwd)
  },
}

async function writeMcpClientConfigs (cwd: string) {
  const json = getMcpClientJson()
  const toml = getGrokMcpToml()

  await mkdir(join(cwd, '.cursor'), { recursive: true })
  await writeFile(join(cwd, '.cursor/mcp.json'), json)

  await writeFile(join(cwd, '.mcp.json'), json)

  await mkdir(join(cwd, '.grok'), { recursive: true })
  await writeFile(join(cwd, '.grok/config.toml'), toml)
}

function getMcpClientJson () {
  return `${JSON.stringify({
    mcpServers: {
      [DEFAULT_VUETIFY_MCP_SERVER_ID]: {
        type: 'http',
        url: DEFAULT_VUETIFY_REMOTE_URL,
      },
    },
  }, null, 2)}\n`
}

function getGrokMcpToml () {
  return `[mcp_servers.${DEFAULT_VUETIFY_MCP_SERVER_ID}]\nurl = "${DEFAULT_VUETIFY_REMOTE_URL}"\n`
}
