import type { DetectedIDE, IdeConfigWriteResult, IDEId, McpServerSpec } from '../types'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'pathe'
import * as toml from 'smol-toml'
import { DEFAULT_SETTINGS_FILE, getSupportedIDEs } from '../ide-detector'

const BEARER_PREFIX_RE = /^Bearer\s+/i
const SSE_PATH_RE = /\/sse(\/|$)/i

export type IdeConfigMode = 'merge' | 'overwrite'

export interface WriteIdeMcpConfigOptions {
  ide: IDEId | DetectedIDE
  server: McpServerSpec
  mode?: IdeConfigMode
  targetFilePath?: string
}

function resolveRootKey (ideId: IDEId) {
  if (ideId === 'code' || ideId === 'code-insiders' || ideId === 'copilot' || ideId === 'cline' || ideId === 'continue') {
    return 'servers'
  }
  if (ideId === 'crush') {
    return 'mcp'
  }
  if (ideId === 'opencode') {
    return 'mcp'
  }
  if (ideId === 'zed') {
    return 'context_servers'
  }
  return 'mcpServers'
}

async function removeFromJsonConfig (ideId: IDEId, target: string, serverId: string, existingText: string) {
  const existing = safeParseJson(existingText)
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    return false
  }

  const rootKey = resolveRootKey(ideId)
  const record = existing as Record<string, any>

  if (record[rootKey] && typeof record[rootKey] === 'object' && record[rootKey][serverId]) {
    delete record[rootKey][serverId]
    if (Object.keys(record[rootKey]).length === 0) {
      delete record[rootKey]
    }
    await writeFile(target, `${JSON.stringify(record, null, 2)}\n`)
    return true
  }
  return false
}

async function removeFromTomlConfig (ideId: IDEId, target: string, serverId: string, existingText: string) {
  const existing = safeParseToml(existingText)
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    return false
  }

  if (ideId === 'mistralvibe') {
    const config = existing as VibeConfig
    if (Array.isArray(config.mcp_servers)) {
      const filtered = config.mcp_servers.filter(s => s?.name !== serverId)
      if (filtered.length !== config.mcp_servers.length) {
        config.mcp_servers = filtered
        if (filtered.length === 0) {
          delete config.mcp_servers
        }
        await writeFile(target, toml.stringify(config as any))
        return true
      }
    }
    return false
  }

  if (ideId === 'openhands') {
    const config = existing as OpenHandsConfig
    let changed = false
    if (config.mcp?.stdio_servers) {
      const filtered = config.mcp.stdio_servers.filter(s => s.name !== serverId)
      if (filtered.length !== config.mcp.stdio_servers.length) {
        config.mcp.stdio_servers = filtered
        changed = true
      }
    }
    if (changed) {
      await writeFile(target, toml.stringify(config as any))
      return true
    }
    return false
  }

  const record = existing as Record<string, any>
  if (record.mcp_servers && typeof record.mcp_servers === 'object' && record.mcp_servers[serverId]) {
    delete record.mcp_servers[serverId]
    if (Object.keys(record.mcp_servers).length === 0) {
      delete record.mcp_servers
    }
    await writeFile(target, toml.stringify(record))
    return true
  }

  return false
}

export async function removeIdeMcpConfig (options: { ide: IDEId | DetectedIDE, serverId: string, targetFilePath?: string }) {
  const ideId = typeof options.ide === 'string' ? options.ide : options.ide.id
  const target = options.targetFilePath ?? await resolveDefaultConfigPath(options.ide)

  if (ideId === 'claude-code' || !target) {
    return false
  }

  const existingText = await tryReadFile(target)
  if (!existingText) {
    return false
  }

  if (ideId === 'crush' || ideId === 'opencode' || ideId === 'zed' || target.endsWith('.json')) {
    return await removeFromJsonConfig(ideId, target, options.serverId, existingText)
  }

  if (target.endsWith('.toml')) {
    return await removeFromTomlConfig(ideId, target, options.serverId, existingText)
  }

  return false
}

export async function writeIdeMcpConfig (options: WriteIdeMcpConfigOptions): Promise<IdeConfigWriteResult> {
  const ideId = typeof options.ide === 'string' ? options.ide : options.ide.id

  const target = options.targetFilePath ?? await resolveDefaultConfigPath(options.ide)
  if (ideId === 'claude-code' && !options.targetFilePath) {
    const command = buildClaudeCodeCommand(options.server)
    if (!command) {
      return { kind: 'skipped', ide: ideId, reason: 'Unsupported server config for this IDE' }
    }
    return { kind: 'command', ide: ideId, command }
  }

  if (!target) {
    return { kind: 'skipped', ide: ideId, reason: 'No config target for this IDE' }
  }

  const mode = options.mode ?? 'merge'
  const { created, updated } = await writeNativeConfig({
    ide: ideId,
    server: options.server,
    filePath: target,
    mode,
  })
  return { kind: 'written', ide: ideId, filePath: target, created, updated }
}

export function buildIdeConfigDocument (ide: IDEId, server: McpServerSpec): Record<string, unknown> {
  const rootKey = ide === 'code' || ide === 'code-insiders' || ide === 'copilot' || ide === 'cline' || ide === 'continue'
    ? 'servers'
    : 'mcpServers'
  return {
    [rootKey]: {
      [server.id]: toRulerLikeServerDef(server),
    },
  }
}

export function buildClaudeCodeCommand (server: McpServerSpec): string | null {
  if (server.connection.transport !== 'http') {
    return null
  }

  const args: string[] = [
    'mcp',
    'add',
    '--transport',
    'http',
    '--scope',
    'user',
    server.id,
    server.connection.url,
  ]

  if (server.connection.headers?.Authorization) {
    args.push('--header', `Authorization:Bearer ${server.connection.headers.Authorization.replace(BEARER_PREFIX_RE, '')}`)
  }

  const quoted = args.map(a => a.includes(':') || a.includes(' ') ? JSON.stringify(a) : a).join(' ')
  return `claude ${quoted}`
}

async function resolveDefaultConfigPath (ide: IDEId | DetectedIDE): Promise<string | null> {
  const ideId = typeof ide === 'string' ? ide : ide.id

  if (typeof ide !== 'string' && ide.settingsDir) {
    const fileName = ide.settingsFile ?? DEFAULT_SETTINGS_FILE
    return join(ide.settingsDir, fileName)
  }

  const record = getSupportedIDEs().find(i => i.id === ideId)
  if (!record) {
    return null
  }

  const platform = process.platform as 'darwin' | 'linux' | 'win32'
  const settingsDir = record.settingsDir?.[platform]?.(process.env)
  const settingsFile = typeof record.settingsFile === 'string'
    ? record.settingsFile
    : record.settingsFile?.[platform] ?? (settingsDir ? DEFAULT_SETTINGS_FILE : undefined)

  if (!settingsDir || !settingsFile) {
    return null
  }

  return join(settingsDir, settingsFile)
}

async function writeNativeConfig (options: { ide: IDEId, server: McpServerSpec, filePath: string, mode: IdeConfigMode }) {
  if (options.ide === 'crush') {
    const next = buildCrushJsonDocument(options.server)
    return await writeJsonConfig(options.filePath, next, options.mode)
  }
  if (options.ide === 'openhands') {
    return await writeOpenHandsTomlConfig(options.filePath, options.server, options.mode)
  }
  if (options.ide === 'mistralvibe') {
    return await writeVibeTomlConfig(options.filePath, options.server, options.mode)
  }
  if (options.ide === 'codex' || options.filePath.endsWith('.toml')) {
    const next = buildCodexTomlDocument(options.server)
    return await writeTomlConfig(options.filePath, next, options.mode)
  }
  if (options.ide === 'opencode') {
    const next = buildOpenCodeJsonDocument(options.server)
    return await writeJsonConfig(options.filePath, next, options.mode)
  }
  if (options.ide === 'zed') {
    const next = buildZedJsonDocument(options.server)
    return await writeJsonConfig(options.filePath, next, options.mode)
  }

  const next = buildIdeConfigDocument(options.ide, options.server)
  return await writeJsonConfig(options.filePath, next, options.mode)
}

function buildCrushJsonDocument (server: McpServerSpec): Record<string, unknown> {
  if (server.connection.transport === 'http') {
    const type = SSE_PATH_RE.test(server.connection.url) ? 'sse' : 'http'
    return {
      mcp: {
        [server.id]: {
          type,
          url: server.connection.url,
          headers: server.connection.headers,
        },
      },
    }
  }

  return {
    mcp: {
      [server.id]: {
        type: 'stdio',
        command: server.connection.command,
        args: server.connection.args,
        env: server.connection.env,
      },
    },
  }
}

type VibeMcpServer = {
  name: string
  transport: 'stdio' | 'http'
  command?: string
  args?: string[]
  url?: string
  headers?: Record<string, string>
  env?: Record<string, string>
}

type VibeConfig = {
  mcp_servers?: VibeMcpServer[]
} & Record<string, unknown>

async function writeVibeTomlConfig (filePath: string, server: McpServerSpec, mode: IdeConfigMode) {
  const existingText = await tryReadFile(filePath)
  const created = existingText === null

  let config: VibeConfig = {}
  if (existingText) {
    const existing = safeParseToml(existingText)
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      config = existing as VibeConfig
    }
  }

  const entry: VibeMcpServer = server.connection.transport === 'http'
    ? {
        name: server.id,
        transport: 'http',
        url: server.connection.url,
        headers: server.connection.headers,
      }
    : {
        name: server.id,
        transport: 'stdio',
        command: server.connection.command,
        args: server.connection.args,
        env: compactEnv(server.connection.env),
      }

  const existingServers = Array.isArray(config.mcp_servers) ? config.mcp_servers : []

  const nextServers = mode === 'overwrite'
    ? [entry]
    : [...existingServers.filter(s => s?.name !== server.id), entry]

  const next: VibeConfig = {
    ...config,
    mcp_servers: nextServers,
  }

  const nextText = toml.stringify(next as any)

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, nextText)

  const updated = created ? true : existingText !== nextText
  return { created, updated }
}

function toRulerLikeServerDef (server: McpServerSpec) {
  if (server.connection.transport === 'stdio') {
    return {
      command: server.connection.command,
      args: server.connection.args,
      env: server.connection.env,
    }
  }
  return {
    type: 'remote',
    url: server.connection.url,
    headers: server.connection.headers,
  }
}

function buildCodexTomlDocument (server: McpServerSpec): Record<string, unknown> {
  return {
    mcp_servers: {
      [server.id]: toRulerLikeServerDef(server),
    },
  }
}

type OpenHandsConfig = {
  mcp?: {
    stdio_servers?: Array<{ name: string, command: string, args?: string[], env?: Record<string, string> }>
    shttp_servers?: Array<string | { url: string, api_key?: string }>
  }
} & Record<string, unknown>

async function writeOpenHandsTomlConfig (filePath: string, server: McpServerSpec, mode: IdeConfigMode) {
  const existingText = await tryReadFile(filePath)
  const created = existingText === null

  let config: OpenHandsConfig = {}
  if (existingText) {
    const existing = safeParseToml(existingText)
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      config = existing as OpenHandsConfig
    }
  }

  config.mcp ||= {}
  config.mcp.stdio_servers ||= []
  config.mcp.shttp_servers ||= []

  if (mode === 'overwrite') {
    config.mcp.stdio_servers = []
    config.mcp.shttp_servers = []
  }

  if (server.connection.transport === 'stdio') {
    const next = {
      name: server.id,
      command: server.connection.command,
      args: server.connection.args,
      env: compactEnv(server.connection.env),
    }
    const byName = new Map(config.mcp.stdio_servers.map(s => [s.name, s]))
    byName.set(server.id, next)
    config.mcp.stdio_servers = [...byName.values()]
  } else {
    const auth = server.connection.headers?.Authorization
    const apiKey = auth?.replace(BEARER_PREFIX_RE, '')
    const entry = apiKey ? { url: server.connection.url, api_key: apiKey } : server.connection.url
    const byUrl = new Map<string, string | { url: string, api_key?: string }>()
    for (const e of config.mcp.shttp_servers) {
      const url = typeof e === 'string' ? e : e.url
      byUrl.set(url, e)
    }
    byUrl.set(server.connection.url, entry)
    config.mcp.shttp_servers = [...byUrl.values()]
  }

  const nextText = toml.stringify(config as any)

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, nextText)

  const updated = created ? true : existingText !== nextText
  return { created, updated }
}

function compactEnv (env?: Record<string, string | undefined>) {
  if (!env) {
    return undefined
  }
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === 'string' && v.length > 0) {
      out[k] = v
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function buildZedJsonDocument (server: McpServerSpec): Record<string, unknown> {
  const base = toRulerLikeServerDef(server) as Record<string, unknown>
  const { type: _type, ...withoutType } = base
  return {
    context_servers: {
      [server.id]: {
        ...withoutType,
        source: 'custom',
      },
    },
  }
}

function buildOpenCodeJsonDocument (server: McpServerSpec): Record<string, unknown> {
  if (server.connection.transport === 'http') {
    return {
      $schema: 'https://opencode.ai/config.json',
      mcp: {
        [server.id]: {
          type: 'remote',
          url: server.connection.url,
          enabled: true,
          headers: server.connection.headers,
        },
      },
    }
  }

  const command = [server.connection.command, ...(server.connection.args ?? [])]
  return {
    $schema: 'https://opencode.ai/config.json',
    mcp: {
      [server.id]: {
        type: 'local',
        command,
        enabled: true,
        environment: server.connection.env,
      },
    },
  }
}

async function writeJsonConfig (filePath: string, nextDoc: Record<string, unknown>, mode: IdeConfigMode) {
  const existingText = await tryReadFile(filePath)
  const created = existingText === null

  let next: Record<string, unknown> = nextDoc
  if (mode === 'merge' && existingText) {
    const existing = safeParseJson(existingText)
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      next = deepMerge(existing as Record<string, unknown>, nextDoc)
    }
  }

  const nextText = `${JSON.stringify(next, null, 2)}\n`

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, nextText)

  const updated = created ? true : existingText !== nextText
  return { created, updated }
}

async function writeTomlConfig (filePath: string, nextDoc: Record<string, unknown>, mode: IdeConfigMode) {
  const existingText = await tryReadFile(filePath)
  const created = existingText === null

  let next: Record<string, any> = nextDoc
  if (mode === 'merge' && existingText) {
    const existing = safeParseToml(existingText)
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      next = deepMerge(existing as Record<string, unknown>, nextDoc) as any
    }
  }

  const nextText = toml.stringify(next)

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, nextText)

  const updated = created ? true : existingText !== nextText
  return { created, updated }
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

function safeParseToml (text: string): unknown | null {
  try {
    return toml.parse(text)
  } catch {
    return null
  }
}

function deepMerge (base: Record<string, unknown>, patch: Record<string, unknown>) {
  const next: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    const prev = next[key]
    next[key] = isPlainObject(prev) && isPlainObject(value) ? deepMerge(prev, value) : value
  }
  return next
}

function isPlainObject (value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
