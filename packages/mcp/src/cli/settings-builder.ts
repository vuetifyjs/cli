import { detectProgram } from './detect/npx'

export const SERVER_NAME = 'vuetify-mcp'

export const npx = await detectProgram('npx')

const env = {
  VUETIFY_API_KEY: process.env.VUETIFY_API_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
}

export const wslConfig = {
  command: 'wsl.exe',
  args: [
    'sh',
    '-c',
    `${npx?.path || 'npx'} -y @vuetify/mcp`,
  ],
  env,
}

export const defaultConfig = {
  command: 'npx',
  args: [
    '-y',
    '@vuetify/mcp',
  ],
  env,
}

export const httpConfig = {
  command: 'npx',
  args: [
    '-y',
    '@vuetify/mcp',
    '--transport',
    'http',
  ],
  env,
}

const wslHttpConfig = {
  command: 'wsl.exe',
  args: [
    'sh',
    '-c',
    `${npx?.path || 'npx'} -y @vuetify/mcp --transport http`,
  ],
  env,
}

export function getRemoteConfig () {
  const config: { url: string, headers?: Record<string, string> } = {
    url: 'https://mcp.vuetifyjs.com/mcp',
  }

  if (process.env.VUETIFY_API_KEY) {
    config.headers = {
      Authorization: `Bearer ${process.env.VUETIFY_API_KEY}`,
    }
  }

  return config
}

export function getServerConfig (transport?: 'stdio' | 'http', remote?: boolean) {
  // Remote always takes precedence
  if (remote) {
    return getRemoteConfig()
  }
  if (transport === 'http') {
    return npx?.wsl ? wslHttpConfig : httpConfig
  }
  return npx?.wsl ? wslConfig : defaultConfig
}

export function getClaudeCodeArgs (): string[] {
  const apiKey = process.env.VUETIFY_API_KEY
  const args = [
    'mcp',
    'add',
    '--transport',
    'http',
    '--scope',
    'user',
    SERVER_NAME,
    'https://mcp.vuetifyjs.com/mcp',
  ]

  if (apiKey) {
    args.push('--header', `Authorization:Bearer ${apiKey}`)
  }

  return args
}

export function getClaudeCodeCommand (): string {
  const args = getClaudeCodeArgs()
  return `claude ${args.map(a => a.includes(':') ? `"${a}"` : a).join(' ')}`
}
