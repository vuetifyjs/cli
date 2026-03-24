import type {
  IDEId,
  McpEnv,
  McpInstallRequest,
  McpInstallScope,
  McpInstallStateV1,
  McpServerConnection,
  McpServerMode,
  McpServerSpec,
  McpTransport,
} from '../types'
import { existsSync } from 'node:fs'
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'pathe'
import { writeIdeMcpConfig } from '../ide-config-writer'
import { detectIDEs } from '../ide-detector'

export const DEFAULT_VUETIFY_MCP_SERVER_ID = 'vuetify-mcp'
export const DEFAULT_VUETIFY_REMOTE_URL = 'https://mcp.vuetifyjs.com/mcp'
export const DEFAULT_VUETIFY_MCP_PACKAGE = '@vuetify/mcp'

export interface CreateVuetifyServerSpecOptions {
  mode?: McpServerMode
  serverId?: string
  remoteUrl?: string
  transport?: McpTransport
  packageName?: string
  env?: McpEnv
  headers?: Record<string, string>
}

export function createVuetifyServerSpec (options: CreateVuetifyServerSpecOptions): McpServerSpec {
  const serverId = options.serverId ?? DEFAULT_VUETIFY_MCP_SERVER_ID
  const packageName = options.packageName ?? DEFAULT_VUETIFY_MCP_PACKAGE
  const transport = options.transport ?? 'stdio'
  const mode = options.mode ?? 'package'

  const connection = resolveVuetifyServerConnection({
    mode,
    remoteUrl: options.remoteUrl ?? DEFAULT_VUETIFY_REMOTE_URL,
    transport,
    packageName,
    env: options.env,
    headers: options.headers,
  })

  return {
    id: serverId,
    connection,
  }
}

export interface ResolveVuetifyServerConnectionOptions {
  mode: McpServerMode
  remoteUrl: string
  transport: McpTransport
  packageName: string
  env?: McpEnv
  headers?: Record<string, string>
}

export function resolveVuetifyServerConnection (options: ResolveVuetifyServerConnectionOptions): McpServerConnection {
  if (options.mode === 'remote') {
    const base = {
      transport: 'http',
      url: options.remoteUrl,
    } as const

    const headersFromEnv = options.env?.VUETIFY_API_KEY
      ? { Authorization: `Bearer ${options.env.VUETIFY_API_KEY}` }
      : undefined
    const headers = compactHeaders({ ...headersFromEnv, ...options.headers })
    return headers ? { ...base, headers } : base
  }

  const baseArgs = ['-y', options.packageName]
  const args = options.transport === 'http'
    ? [...baseArgs, '--transport', 'http']
    : baseArgs

  const base = {
    transport: 'stdio',
    command: 'npx',
    args,
  } as const

  const env = compactEnv(options.env)
  return env ? { ...base, env } : base
}

export interface InstallMcpOptions extends Omit<McpInstallRequest, 'server'> {
  server?: McpServerSpec
  serverId?: string
  remoteUrl?: string
  packageName?: string
  transport?: McpTransport
  env?: McpEnv
  headers?: Record<string, string>
  targetFilePath?: string
}

export async function installMcp (options: InstallMcpOptions) {
  const ide = options.ide
  const cwd = options.cwd ?? process.cwd()
  const mode = options.mode ?? 'package'

  const server = options.server ?? createVuetifyServerSpec({
    mode,
    serverId: options.serverId,
    remoteUrl: options.remoteUrl,
    packageName: options.packageName,
    transport: options.transport,
    env: options.env,
    headers: options.headers,
  })

  const ideInfo = await resolveIdeInfo(ide)
  const targetFilePath = options.targetFilePath ?? getDefaultIdeConfigPath({
    scope: options.scope,
    ide,
    cwd,
  })
  const configResult = await writeIdeMcpConfig({
    ide: ideInfo ?? ide,
    server,
    mode: 'merge',
    targetFilePath: targetFilePath ?? undefined,
  })

  const statePath = options.writeState === false
    ? null
    : (options.statePath ?? defaultStatePathForAgent(options.scope, cwd, ide))

  const shouldWriteState = Boolean(statePath && configResult.kind !== 'skipped')
  if (shouldWriteState) {
    await writeInstallState(statePath!, {
      schema: 'vuetify.mcp.install-state/v1',
      scope: options.scope,
      mode,
      ide,
      serverId: server.id,
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    scope: options.scope,
    mode,
    ide,
    server,
    config: configResult,
    statePath: shouldWriteState ? statePath ?? undefined : undefined,
  }
}

export interface UninstallMcpOptions {
  ide: IDEId
  scope: McpInstallScope
  cwd?: string
  serverId?: string
  targetFilePath?: string
}

export async function uninstallMcp (options: UninstallMcpOptions) {
  const ide = options.ide
  const cwd = options.cwd ?? process.cwd()
  const serverId = options.serverId ?? DEFAULT_VUETIFY_MCP_SERVER_ID
  const ideInfo = await resolveIdeInfo(ide)

  const { removeIdeMcpConfig } = await import('../ide-config-writer')

  const targetFilePath = options.targetFilePath ?? getDefaultIdeConfigPath({
    scope: options.scope,
    ide,
    cwd,
  })

  const removed = await removeIdeMcpConfig({
    ide: ideInfo ?? ide,
    serverId,
    targetFilePath: targetFilePath ?? undefined,
  })

  const statePath = defaultStatePathForAgent(options.scope, cwd, ide)
  let stateRemoved = false
  if (existsSync(statePath)) {
    try {
      const { rm } = await import('node:fs/promises')
      await rm(statePath)
      stateRemoved = true
    } catch {
      // ignore
    }
  }

  return {
    removed,
    stateRemoved,
    targetFilePath,
  }
}

export function getDefaultIdeConfigPath (options: { scope: McpInstallScope, ide: IDEId, cwd: string }): string | null {
  if (options.scope !== 'local') {
    return null
  }
  if (options.ide === 'claude') {
    return null
  }
  const ide = options.ide
  let candidates: string[] = []
  switch (ide) {
    case 'copilot':
    case 'cline':
    case 'continue': {
      candidates = [join(options.cwd, '.vscode', 'mcp.json')]
      break
    }
    case 'visual-studio': {
      candidates = [
        join(options.cwd, '.mcp.json'),
        join(options.cwd, '.vs', 'mcp.json'),
      ]
      break
    }
    case 'cursor': {
      candidates = [join(options.cwd, '.cursor', 'mcp.json')]
      break
    }
    case 'windsurf': {
      candidates = [join(options.cwd, '.windsurf', 'mcp_config.json')]
      break
    }
    case 'claude-code':
    case 'aider': {
      candidates = [join(options.cwd, '.mcp.json')]
      break
    }
    case 'codex': {
      candidates = [join(options.cwd, '.codex', 'config.toml')]
      break
    }
    case 'gemini-cli': {
      candidates = [join(options.cwd, '.gemini', 'settings.json')]
      break
    }
    case 'openhands': {
      candidates = [join(options.cwd, 'config.toml')]
      break
    }
    case 'junie': {
      candidates = [join(options.cwd, '.junie', 'mcp', 'mcp.json')]
      break
    }
    case 'qwen': {
      candidates = [join(options.cwd, '.qwen', 'settings.json')]
      break
    }
    case 'kilocode': {
      candidates = [join(options.cwd, '.kilocode', 'mcp.json')]
      break
    }
    case 'kiro': {
      candidates = [join(options.cwd, '.kiro', 'settings', 'mcp.json')]
      break
    }
    case 'opencode': {
      candidates = [join(options.cwd, 'opencode.json')]
      break
    }
    case 'firebase': {
      candidates = [join(options.cwd, '.idx', 'mcp.json')]
      break
    }
    case 'factory': {
      candidates = [join(options.cwd, '.factory', 'mcp.json')]
      break
    }
    case 'zed': {
      candidates = [join(options.cwd, '.zed', 'settings.json')]
      break
    }
    case 'roo': {
      candidates = [join(options.cwd, '.roo', 'mcp.json')]
      break
    }
    case 'amazonqcli': {
      candidates = [join(options.cwd, '.amazonq', 'mcp.json')]
      break
    }
    case 'crush': {
      candidates = [join(options.cwd, '.crush.json')]
      break
    }
    case 'firebender': {
      candidates = [join(options.cwd, 'firebender.json')]
      break
    }
    case 'mistralvibe': {
      candidates = [join(options.cwd, '.vibe', 'config.toml')]
      break
    }
    default: {
      candidates = [join(options.cwd, '.vscode', 'mcp.json')]
      break
    }
  }

  for (const p of candidates) {
    if (existsSync(p)) {
      return p
    }
  }
  return candidates[0] ?? null
}

export async function resolveIdeInfo (ide: IDEId) {
  const ides = await detectIDEs()
  return ides.find(i => i.id === ide)
}

export function defaultStatePath (scope: McpInstallScope, cwd: string) {
  if (scope === 'local') {
    return join(cwd, '.vuetify', 'mcp.json')
  }
  return join(getUserConfigDir(), 'vuetify', 'mcp.json')
}

export function defaultStatePathForAgent (scope: McpInstallScope, cwd: string, ide: IDEId) {
  const dir = scope === 'local'
    ? join(cwd, '.vuetify', 'mcp')
    : join(getUserConfigDir(), 'vuetify', 'mcp')
  return join(dir, `${ide}.json`)
}

export async function writeInstallState (filePath: string, state: McpInstallStateV1) {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`)
}

export async function readInstallState (filePath: string): Promise<McpInstallStateV1 | null> {
  const text = await tryReadFile(filePath)
  if (!text) {
    return null
  }

  const parsed = safeParseJson(text)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }

  const state = parsed as Partial<McpInstallStateV1>
  if (state.schema !== 'vuetify.mcp.install-state/v1') {
    return null
  }
  const scope = state.scope ?? 'local'

  const mode = (state.mode === 'remote' || state.mode === 'package' ? state.mode : 'package')
  if (typeof state.ide !== 'string' || typeof state.serverId !== 'string' || typeof state.updatedAt !== 'string') {
    return null
  }

  return {
    schema: 'vuetify.mcp.install-state/v1',
    scope,
    mode,
    ide: state.ide as IDEId,
    serverId: state.serverId,
    updatedAt: state.updatedAt,
  }
}

export async function resolveCurrentInstallState (cwd: string): Promise<{ state: McpInstallStateV1, statePath: string } | null> {
  const localLegacyPath = defaultStatePath('local', cwd)
  const localLegacy = await readInstallState(localLegacyPath)
  if (localLegacy) {
    return { state: localLegacy, statePath: localLegacyPath }
  }

  const globalLegacyPath = defaultStatePath('global', cwd)
  const globalLegacy = await readInstallState(globalLegacyPath)
  if (globalLegacy) {
    return { state: globalLegacy, statePath: globalLegacyPath }
  }

  const local = await listInstallStates('local', cwd)
  if (local.length > 0) {
    return local[0]!
  }

  const global = await listInstallStates('global', cwd)
  if (global.length > 0) {
    return global[0]!
  }

  return null
}

export async function listInstallStates (scope: McpInstallScope, cwd: string): Promise<Array<{ state: McpInstallStateV1, statePath: string }>> {
  const dir = scope === 'local'
    ? join(cwd, '.vuetify', 'mcp')
    : join(getUserConfigDir(), 'vuetify', 'mcp')

  let entries: string[] = []
  try {
    entries = await readdir(dir)
  } catch {
    entries = []
  }

  const results: Array<{ state: McpInstallStateV1, statePath: string }> = []
  for (const name of entries) {
    if (!name.endsWith('.json')) {
      continue
    }
    const p = join(dir, name)
    const state = await readInstallState(p)
    if (!state) {
      continue
    }
    results.push({ state, statePath: p })
  }

  return results.toSorted((a, b) => b.state.updatedAt.localeCompare(a.state.updatedAt))
}

export function getUserConfigDir () {
  const platform = process.platform
  if (platform === 'win32') {
    const appData = process.env.APPDATA
    return appData || join(homedir(), 'AppData', 'Roaming')
  }
  if (platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support')
  }
  return join(homedir(), '.config')
}

export async function getDefaultInstallScope (cwd: string): Promise<McpInstallScope> {
  try {
    await access(join(cwd, 'package.json'))
    return 'local'
  } catch {
    return 'global'
  }
}

function compactEnv (env?: McpEnv): McpEnv | undefined {
  if (!env) {
    return undefined
  }
  const entries = Object.entries(env).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) {
    return undefined
  }
  return Object.fromEntries(entries)
}

function compactHeaders (headers?: Record<string, string>): Record<string, string> | undefined {
  if (!headers) {
    return undefined
  }
  const entries = Object.entries(headers).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) {
    return undefined
  }
  return Object.fromEntries(entries)
}

async function tryReadFile (filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

function safeParseJson (text: string): unknown | null {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
