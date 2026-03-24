import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { AgentRegistry } from '../src/mcp-core/agent-registry'
import { buildIdeConfigDocument, writeIdeMcpConfig } from '../src/mcp-core/ide-config-writer'
import { sortIDEsDetectedFirst } from '../src/mcp-core/ide-detector'
import { createVuetifyServerSpec, getDefaultIdeConfigPath, getDefaultInstallScope, readInstallState } from '../src/mcp-core/installer'

describe('mcp-core', () => {
  it('creates package server spec', () => {
    const server = createVuetifyServerSpec({
      mode: 'package',
      transport: 'stdio',
      env: { VUETIFY_API_KEY: 'x' },
    })

    expect(server.id).toBe('vuetify-mcp')
    expect(server.connection.transport).toBe('stdio')
    if (server.connection.transport !== 'stdio') {
      throw new Error('unexpected transport')
    }
    expect(server.connection.command).toBe('npx')
    expect(server.connection.args).toEqual(['-y', '@vuetify/mcp'])
    expect(server.connection.env).toEqual({ VUETIFY_API_KEY: 'x' })
  })

  it('creates remote server spec with Authorization header', () => {
    const server = createVuetifyServerSpec({
      mode: 'remote',
      env: { VUETIFY_API_KEY: 'x' },
    })

    expect(server.connection.transport).toBe('http')
    if (server.connection.transport !== 'http') {
      throw new Error('unexpected transport')
    }
    expect(server.connection.url).toBe('https://mcp.vuetifyjs.com/mcp')
    expect(server.connection.headers).toEqual({ Authorization: 'Bearer x' })
  })

  it('sorts IDEs detected-first', () => {
    const sorted = sortIDEsDetectedFirst([
      { id: 'code', brand: 'VS Code', detected: false },
      { id: 'cursor', brand: 'Cursor', detected: true },
    ])
    expect(sorted[0].id).toBe('cursor')
    expect(sorted[1].id).toBe('code')
  })

  it('resolves install scope based on package.json existence', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vuetify-cli-'))
    try {
      expect(await getDefaultInstallScope(dir)).toBe('global')
      await writeFile(join(dir, 'package.json'), '{}')
      expect(await getDefaultInstallScope(dir)).toBe('local')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('reads legacy remote state as global+remote mode', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vuetify-cli-'))
    const stateFile = join(dir, 'state.json')
    try {
      await writeFile(stateFile, JSON.stringify({
        schema: 'vuetify.mcp.install-state/v1',
        scope: 'remote',
        ide: 'code',
        serverId: 'vuetify-mcp',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }, null, 2))

      const state = await readInstallState(stateFile)
      expect(state).not.toBeNull()
      expect(state?.scope).toBe('global')
      expect(state?.mode).toBe('remote')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('resolves agent aliases', () => {
    const registry = new AgentRegistry([
      {
        schema: 'vuetify.mcp.agent/v1',
        id: 'foo',
        aliases: ['bar'],
        name: 'Foo',
      },
    ])

    expect(registry.resolve('bar' as any)?.id).toBe('foo')
  })

  it('resolves local MCP config paths like ruler', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vuetify-cli-'))
    try {
      const path1 = getDefaultIdeConfigPath({ scope: 'local', ide: 'visual-studio' as any, cwd: dir })
      expect(path1).toBe(join(dir, '.mcp.json'))

      await mkdir(join(dir, '.vs'), { recursive: true })
      await writeFile(join(dir, '.vs', 'mcp.json'), '{}\n')
      const path2 = getDefaultIdeConfigPath({ scope: 'local', ide: 'visual-studio' as any, cwd: dir })
      expect(path2).toBe(join(dir, '.vs', 'mcp.json'))

      await writeFile(join(dir, '.mcp.json'), '{}\n')
      const path3 = getDefaultIdeConfigPath({ scope: 'local', ide: 'visual-studio' as any, cwd: dir })
      expect(path3).toBe(join(dir, '.mcp.json'))

      expect(getDefaultIdeConfigPath({ scope: 'local', ide: 'roo' as any, cwd: dir })).toBe(join(dir, '.roo', 'mcp.json'))
      expect(getDefaultIdeConfigPath({ scope: 'local', ide: 'amazonqcli' as any, cwd: dir })).toBe(join(dir, '.amazonq', 'mcp.json'))
      expect(getDefaultIdeConfigPath({ scope: 'local', ide: 'crush' as any, cwd: dir })).toBe(join(dir, '.crush.json'))
      expect(getDefaultIdeConfigPath({ scope: 'local', ide: 'mistralvibe' as any, cwd: dir })).toBe(join(dir, '.vibe', 'config.toml'))
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('uses VS Code server root for copilot/cline/continue', () => {
    const server = createVuetifyServerSpec({ mode: 'package' })
    expect(buildIdeConfigDocument('copilot' as any, server)).toHaveProperty('servers')
    expect(buildIdeConfigDocument('cline' as any, server)).toHaveProperty('servers')
    expect(buildIdeConfigDocument('continue' as any, server)).toHaveProperty('servers')
  })

  it('writes Crush config into .crush.json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vuetify-cli-'))
    try {
      const filePath = join(dir, '.crush.json')
      const server = createVuetifyServerSpec({ mode: 'remote', env: { VUETIFY_API_KEY: 'x' } })
      const res = await writeIdeMcpConfig({ ide: 'crush' as any, server, targetFilePath: filePath })
      expect(res.kind).toBe('written')

      const text = await readFile(filePath, 'utf8')
      const parsed = JSON.parse(text)
      expect(parsed.mcp).toBeTruthy()
      expect(parsed.mcp['vuetify-mcp']).toBeTruthy()
      expect(parsed.mcp['vuetify-mcp'].url).toBe('https://mcp.vuetifyjs.com/mcp')
      expect(parsed.mcp['vuetify-mcp'].type).toBe('http')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('writes Mistral Vibe MCP servers as TOML array-of-tables', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vuetify-cli-'))
    try {
      const filePath = join(dir, '.vibe', 'config.toml')
      const server = createVuetifyServerSpec({ mode: 'remote' })
      const res = await writeIdeMcpConfig({ ide: 'mistralvibe' as any, server, targetFilePath: filePath })
      expect(res.kind).toBe('written')

      const text = await readFile(filePath, 'utf8')
      expect(text).toContain('[[mcp_servers]]')
      expect(text).toContain('name = "vuetify-mcp"')
      expect(text).toContain('transport = "http"')
      expect(text).toContain('url = "https://mcp.vuetifyjs.com/mcp"')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
