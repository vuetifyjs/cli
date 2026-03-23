export type OperatingSystem = 'darwin' | 'linux' | 'win32'

export type IDEId
  = 'code'
    | 'code-insiders'
    | 'cursor'
    | 'windsurf'
    | 'trae'
    | 'claude'
    | 'claude-code'
    | (string & {})

export type McpInstallScope = 'local' | 'global'
export type McpServerMode = 'package' | 'remote'
export type McpTransport = 'stdio' | 'http'

export type McpEnv = Record<string, string | undefined>

export interface McpStdioServerConnection {
  transport: 'stdio'
  command: string
  args?: string[]
  env?: McpEnv
}

export interface McpHttpServerConnection {
  transport: 'http'
  url: string
  headers?: Record<string, string>
}

export type McpServerConnection = McpStdioServerConnection | McpHttpServerConnection

export interface McpServerSpec {
  id: string
  connection: McpServerConnection
}

export type AgentId = string & {}

export type AgentMetadataSchema = 'vuetify.mcp.agent/v1'

export interface AgentInputTextV1 {
  type: 'text'
  label: string
  required?: boolean
  secret?: boolean
}

export interface AgentInputEnvV1 {
  type: 'env'
  env: string
  label: string
  required?: boolean
  secret?: boolean
}

export type AgentInputV1 = AgentInputTextV1 | AgentInputEnvV1

export interface AgentCompatibilityV1 {
  ides?: IDEId[]
  scopes?: McpInstallScope[]
  modes?: McpServerMode[]
}

export interface AgentMetadataV1 {
  schema: AgentMetadataSchema
  id: AgentId
  aliases?: AgentId[]
  name: string
  description?: string
  publisher?: string
  categories?: string[]
  tags?: string[]
  homepage?: string
  compatibility?: AgentCompatibilityV1
  inputs?: Record<string, AgentInputV1>
}

export interface DetectedIDE {
  id: IDEId
  brand: string
  detected: boolean
  settingsDir?: string
  settingsFile?: string
}

export interface IdeMcpConfigTarget {
  ide: IDEId
  filePath?: string
}

export type IdeConfigWriteResult
  = {
    kind: 'written'
    ide: IDEId
    filePath: string
    created: boolean
    updated: boolean
  }
  | {
    kind: 'command'
    ide: IDEId
    command: string
  }
  | {
    kind: 'skipped'
    ide: IDEId
    reason: string
  }

export interface McpInstallRequest {
  scope: McpInstallScope
  mode?: McpServerMode
  ide: IDEId
  server: McpServerSpec
  transport?: McpTransport
  cwd?: string
  writeState?: boolean
  statePath?: string
}

export interface McpInstallStateV1 {
  schema: 'vuetify.mcp.install-state/v1'
  scope: McpInstallScope
  mode: McpServerMode
  ide: IDEId
  serverId: string
  updatedAt: string
}
