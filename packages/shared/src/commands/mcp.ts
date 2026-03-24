import type { IDEId, McpEnv, McpInstallScope, McpInstallStateV1, McpServerMode } from '../mcp-core'
import { readFile, writeFile } from 'node:fs/promises'
import { confirm, intro, log, multiselect, outro } from '@clack/prompts'
import { defineCommand } from 'citty'
import { dim } from 'kolorist'
import { join } from 'pathe'
import { i18n } from '../i18n'
import {
  AgentRegistry,
  createVuetifyServerSpec,
  DEFAULT_VUETIFY_MCP_PACKAGE,
  DEFAULT_VUETIFY_MCP_SERVER_ID,
  DEFAULT_VUETIFY_REMOTE_URL,
  defaultStatePath,
  defaultStatePathForAgent,
  detectIDEs,
  getDefaultIdeConfigPath,
  getDefaultInstallScope,
  installMcp,
  listInstallStates,
  readInstallState,
  resolveCurrentInstallState,
  resolveIdeInfo,
  uninstallMcp,
  writeInstallState,
} from '../mcp-core'

type ScopeArgs = {
  local?: boolean
  global?: boolean
  remote?: boolean
}

type CommonArgs = ScopeArgs & {
  ide?: string
  agent?: string
  cwd?: string
}

const SENSITIVE_ENV_KEYS = ['VUETIFY_API_KEY'] as const
const INLINE_AUTH_RE = /Authorization:Bearer\s+\S+/gi
const INLINE_AUTH_HINT_RE = /VUETIFY_API_KEY|Authorization/i

export const mcp = defineCommand({
  meta: {
    name: 'mcp',
    description: i18n.t('commands.mcp_cli.description'),
  },
  subCommands: {
    install: defineCommand({
      meta: {
        name: 'install',
        description: i18n.t('commands.mcp_cli.install.description'),
      },
      args: {
        local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
        global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
        remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
        ide: { type: 'string', description: i18n.t('commands.mcp_cli.args.ide') },
        agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
        cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
      },
      run: async ({ args }) => {
        await runInstallOrConfig(args as CommonArgs)
      },
    }),
    config: defineCommand({
      meta: {
        name: 'config',
        description: i18n.t('commands.mcp_cli.config.description'),
      },
      args: {
        local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
        global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
        remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
        ide: { type: 'string', description: i18n.t('commands.mcp_cli.args.ide') },
        agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
        cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
      },
      run: async ({ args }) => {
        await runInstallOrConfig(args as CommonArgs)
      },
    }),
    uninstall: defineCommand({
      meta: {
        name: 'uninstall',
        description: 'Uninstall Vuetify MCP server from IDE',
      },
      args: {
        local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
        global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
        agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
        cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
      },
      run: async ({ args }) => {
        await runUninstall(args as CommonArgs)
      },
    }),
    status: defineCommand({
      meta: {
        name: 'status',
        description: i18n.t('commands.mcp_cli.status.description'),
      },
      args: {
        local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
        global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
        remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
        agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
        cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
      },
      run: async ({ args }) => {
        await runStatus(args as ScopeArgs & { cwd?: string })
      },
    }),
    where: defineCommand({
      meta: {
        name: 'where',
        description: i18n.t('commands.mcp_cli.where.description'),
      },
      args: {
        local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
        global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
        remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
        agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
        cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
      },
      run: async ({ args }) => {
        await runWhere(args as ScopeArgs & { cwd?: string })
      },
    }),
    update: defineCommand({
      meta: {
        name: 'update',
        description: i18n.t('commands.mcp_cli.update.description'),
      },
      args: {
        local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
        global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
        remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
        agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
        cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
      },
      run: async ({ args }) => {
        await runUpdate({ ...args, cwd: typeof args.cwd === 'string' ? args.cwd : undefined })
      },
    }),
    env: defineCommand({
      meta: {
        name: 'env',
        description: i18n.t('commands.mcp_cli.env.description'),
      },
      args: {
        local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
        global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
        remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
        agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
        cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
      },
      subCommands: {
        show: defineCommand({
          meta: {
            name: 'show',
            description: i18n.t('commands.mcp_cli.env.show.description'),
          },
          args: {
            local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
            global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
            remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
            agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
            cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
          },
          run: async ({ args }) => {
            await runEnvShow({ ...args, cwd: typeof args.cwd === 'string' ? args.cwd : undefined })
          },
        }),
        set: defineCommand({
          meta: {
            name: 'set',
            description: i18n.t('commands.mcp_cli.env.set.description'),
          },
          args: {
            pair: { type: 'positional', description: i18n.t('commands.mcp_cli.env.set.args.pair') },
            local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
            global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
            remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
            agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
            cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
          },
          run: async ({ args }) => {
            await runEnvSet({ ...args, pair: typeof args.pair === 'string' ? args.pair : undefined, cwd: typeof args.cwd === 'string' ? args.cwd : undefined })
          },
        }),
        unset: defineCommand({
          meta: {
            name: 'unset',
            description: i18n.t('commands.mcp_cli.env.unset.description'),
          },
          args: {
            key: { type: 'positional', description: i18n.t('commands.mcp_cli.env.unset.args.key') },
            local: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.local') },
            global: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.global') },
            remote: { type: 'boolean', description: i18n.t('commands.mcp_cli.args.remote') },
            agent: { type: 'string', description: i18n.t('commands.mcp_cli.args.agent') },
            cwd: { type: 'string', description: i18n.t('commands.mcp_cli.args.cwd') },
          },
          run: async ({ args }) => {
            await runEnvUnset({ ...args, key: typeof args.key === 'string' ? args.key : undefined, cwd: typeof args.cwd === 'string' ? args.cwd : undefined })
          },
        }),
      },
      run: async ({ args }) => {
        if (hasSubcommandInArgv('env', ['show', 'set', 'unset'])) {
          return
        }
        await runEnvShow({ ...args, cwd: typeof args.cwd === 'string' ? args.cwd : undefined })
      },
    }),
    agents: defineCommand({
      meta: {
        name: 'agents',
        description: i18n.t('commands.mcp_cli.agents.description'),
      },
      args: {
        query: { type: 'positional', description: i18n.t('commands.mcp_cli.agents.args.query') },
      },
      run: async ({ args }) => {
        await runAgents({ query: typeof args.query === 'string' ? args.query : undefined })
      },
    }),
  },
})

async function runInstallOrConfig (args: CommonArgs) {
  const cwd = typeof args.cwd === 'string' ? args.cwd : process.cwd()
  intro(i18n.t('commands.mcp_cli.intro'))
  const scope = await resolveScope(args, cwd)
  const agents = await resolveAgents(args)
  if (agents.length === 0) {
    outro(i18n.t('messages.all_done'))
    return
  }

  const detected = await detectIDEs()

  for (const ide of agents) {
    const mode = resolveMode({ ide, remote: args.remote })

    const isConfirmed = await confirm({
      message: `Install for ${dim(ide)} with scope ${dim(scope)} in ${dim(mode)} mode?`,
      initialValue: true,
    })

    if (!isConfirmed) {
      log.info(`Skipped ${ide}`)
      log.info(`💡 Hint: You can change the scope and mode using flags.`)
      log.info(`   For global install: ${dim('--global')}`)
      log.info(`   For remote server:  ${dim('--remote')}`)
      continue
    }

    const env = mode === 'package' ? pickEnvFromProcess() : undefined
    const headers = mode === 'remote' ? pickHeadersFromProcess() : undefined

    const result = await installMcp({
      scope,
      mode,
      ide,
      cwd,
      env,
      headers,
      remoteUrl: DEFAULT_VUETIFY_REMOTE_URL,
      packageName: DEFAULT_VUETIFY_MCP_PACKAGE,
      serverId: DEFAULT_VUETIFY_MCP_SERVER_ID,
    })

    const ideInfo = detected.find(d => d.id === ide)
    const ideLabel = ideInfo?.brand ?? ide

    log.success(i18n.t('commands.mcp_cli.done', { installScope: scope, mode, ide: ideLabel }))
    log.info(i18n.t('commands.mcp_cli.details.scope', { installScope: scope }))
    log.info(i18n.t('commands.mcp_cli.details.mode', { mode }))
    log.info(i18n.t('commands.mcp_cli.details.ide', { ide: ideLabel }))
    log.info(i18n.t('commands.mcp_cli.details.server', { server: formatServerConnection(mode) }))
    log.info(i18n.t('commands.mcp_cli.details.config', { config: formatConfigResult(result.config) }))
    if (result.statePath) {
      log.info(i18n.t('commands.mcp_cli.details.state', { path: result.statePath }))
    }

    if (isAnyAuthConfigured({ env, headers })) {
      log.info(i18n.t('commands.mcp_cli.auth.configured'))
    } else {
      log.warning(i18n.t('commands.mcp_cli.auth.missing'))
      log.info(i18n.t('commands.mcp_cli.auth.how_to_set'))
    }
  }

  outro(i18n.t('messages.all_done'))
}

async function runUninstall (args: CommonArgs) {
  const cwd = typeof args.cwd === 'string' ? args.cwd : process.cwd()
  intro('Uninstall Vuetify MCP')

  const scope = await resolveScope(args, cwd)
  const agents = await resolveAgents(args)
  if (agents.length === 0) {
    outro(i18n.t('messages.all_done'))
    return
  }

  const detected = await detectIDEs()

  for (const ide of agents) {
    const isConfirmed = await confirm({
      message: `Uninstall from ${dim(ide)} with scope ${dim(scope)}?`,
      initialValue: true,
    })

    if (!isConfirmed) {
      log.info(`Skipped ${ide}`)
      continue
    }

    const result = await uninstallMcp({
      scope,
      ide,
      cwd,
      serverId: DEFAULT_VUETIFY_MCP_SERVER_ID,
    })

    const ideInfo = detected.find(d => d.id === ide)
    const ideLabel = ideInfo?.brand ?? ide

    if (result.removed) {
      log.success(`Successfully uninstalled Vuetify MCP from ${ideLabel} config`)
    } else {
      log.info(`Vuetify MCP was not found in ${ideLabel} config`)
    }

    if (result.stateRemoved) {
      log.info('Removed local state tracking file')
    }
  }

  outro(i18n.t('messages.all_done'))
}

async function runStatus (args: ScopeArgs & { cwd?: string, agent?: string, ide?: string }) {
  const cwd = typeof args.cwd === 'string' ? args.cwd : process.cwd()
  const resolved = await resolveStateFromArgs(args, cwd)
  if (!resolved) {
    intro(i18n.t('commands.mcp_cli.intro'))
    log.info(i18n.t('commands.mcp_cli.status.not_installed'))
    outro(i18n.t('messages.all_done'))
    return
  }

  const ideInfo = await resolveIdeInfo(resolved.state.ide)
  const ideLabel = ideInfo?.brand ?? resolved.state.ide
  const configTarget = await resolveIdeConfigTarget({ ide: resolved.state.ide, scope: resolved.state.scope, cwd })
  const flags = configTarget
    ? await inspectConfigForSecrets(resolved.state.ide, configTarget, DEFAULT_VUETIFY_MCP_SERVER_ID)
    : null

  intro(i18n.t('commands.mcp_cli.intro'))
  log.info(i18n.t('commands.mcp_cli.status.scope', { installScope: resolved.state.scope }))
  log.info(i18n.t('commands.mcp_cli.status.mode', { mode: resolved.state.mode }))
  log.info(i18n.t('commands.mcp_cli.status.ide', { ide: ideLabel }))
  log.info(i18n.t('commands.mcp_cli.status.updated', { at: resolved.state.updatedAt }))

  if (configTarget?.kind === 'file') {
    log.info(i18n.t('commands.mcp_cli.status.config_file', { path: configTarget.path }))
  } else if (configTarget?.kind === 'command') {
    log.info(i18n.t('commands.mcp_cli.status.config_command', { command: configTarget.command }))
  }

  log.info(i18n.t('commands.mcp_cli.status.state', { path: resolved.statePath }))

  if (flags) {
    log.info(i18n.t('commands.mcp_cli.status.auth', { status: flags.vuetifyApiKey ? i18n.t('commands.mcp_cli.status.auth_set') : i18n.t('commands.mcp_cli.status.auth_not_set') }))
  }

  outro(i18n.t('messages.all_done'))
}

async function runWhere (args: ScopeArgs & { cwd?: string, agent?: string, ide?: string }) {
  const cwd = typeof args.cwd === 'string' ? args.cwd : process.cwd()
  const resolved = await resolveStateFromArgs(args, cwd)
  if (!resolved) {
    intro(i18n.t('commands.mcp_cli.intro'))
    log.info(i18n.t('commands.mcp_cli.status.not_installed'))
    outro(i18n.t('messages.all_done'))
    return
  }

  const configTarget = await resolveIdeConfigTarget({ ide: resolved.state.ide, scope: resolved.state.scope, cwd })

  intro(i18n.t('commands.mcp_cli.intro'))
  log.info(i18n.t('commands.mcp_cli.where.scope', { installScope: resolved.state.scope }))
  log.info(i18n.t('commands.mcp_cli.where.mode', { mode: resolved.state.mode }))
  log.info(i18n.t('commands.mcp_cli.where.state', { path: resolved.statePath }))
  if (configTarget?.kind === 'file') {
    log.info(i18n.t('commands.mcp_cli.where.config_file', { path: configTarget.path }))
  } else if (configTarget?.kind === 'command') {
    log.info(i18n.t('commands.mcp_cli.where.config_command', { command: configTarget.command }))
  } else {
    log.warning(i18n.t('commands.mcp_cli.where.config_unknown'))
  }
  outro(i18n.t('messages.all_done'))
}

async function runUpdate (options: ScopeArgs & { cwd?: string, agent?: string, ide?: string }) {
  const cwd = options.cwd ?? process.cwd()
  const current = await resolveStateFromArgs(options, cwd)
  if (!current) {
    intro(i18n.t('commands.mcp_cli.intro'))
    log.info(i18n.t('commands.mcp_cli.status.not_installed'))
    outro(i18n.t('messages.all_done'))
    return
  }

  intro(i18n.t('commands.mcp_cli.intro'))
  const env = current.state.mode === 'package' ? pickEnvFromProcess() : undefined
  const headers = current.state.mode === 'remote' ? pickHeadersFromProcess() : undefined

  const result = await installMcp({
    scope: current.state.scope,
    mode: current.state.mode,
    ide: current.state.ide,
    cwd,
    env,
    headers,
    remoteUrl: DEFAULT_VUETIFY_REMOTE_URL,
    packageName: DEFAULT_VUETIFY_MCP_PACKAGE,
    serverId: DEFAULT_VUETIFY_MCP_SERVER_ID,
  })

  log.success(i18n.t('commands.mcp_cli.update.done'))
  log.info(i18n.t('commands.mcp_cli.details.config', { config: formatConfigResult(result.config) }))
  if (result.statePath) {
    log.info(i18n.t('commands.mcp_cli.details.state', { path: result.statePath }))
  }
  outro(i18n.t('messages.all_done'))
}

async function runEnvShow (options: ScopeArgs & { cwd?: string, agent?: string, ide?: string }) {
  const cwd = options.cwd ?? process.cwd()
  const current = await resolveStateFromArgs(options, cwd)

  intro(i18n.t('commands.mcp_cli.intro'))

  if (!current) {
    log.info(i18n.t('commands.mcp_cli.status.not_installed'))
    outro(i18n.t('messages.all_done'))
    return
  }

  const configTarget = await resolveIdeConfigTarget({ ide: current.state.ide, scope: current.state.scope, cwd })
  const flags = configTarget
    ? await inspectConfigForSecrets(current.state.ide, configTarget, DEFAULT_VUETIFY_MCP_SERVER_ID)
    : null

  log.info(i18n.t('commands.mcp_cli.env.scope', { installScope: current.state.scope }))
  log.info(i18n.t('commands.mcp_cli.env.mode', { mode: current.state.mode }))
  if (flags) {
    log.info(i18n.t('commands.mcp_cli.env.key', { key: 'VUETIFY_API_KEY', status: flags.vuetifyApiKey ? i18n.t('commands.mcp_cli.status.auth_set') : i18n.t('commands.mcp_cli.status.auth_not_set') }))
  } else {
    log.warning(i18n.t('commands.mcp_cli.env.unavailable'))
  }

  log.info(i18n.t('commands.mcp_cli.env.hint_set'))
  outro(i18n.t('messages.all_done'))
}

async function runEnvSet (options: ScopeArgs & { pair?: string, cwd?: string, agent?: string, ide?: string }) {
  const cwd = options.cwd ?? process.cwd()
  const current = await resolveStateFromArgs(options, cwd)

  intro(i18n.t('commands.mcp_cli.intro'))

  if (!current) {
    log.info(i18n.t('commands.mcp_cli.status.not_installed'))
    outro(i18n.t('messages.all_done'))
    return
  }

  const parsed = parseEnvPair(options.pair)
  if (!parsed) {
    log.error(i18n.t('commands.mcp_cli.env.set.invalid'))
    outro(i18n.t('messages.all_done'))
    return
  }

  const key = parsed.key
  const value = parsed.value

  if (current.state.mode === 'remote') {
    if (key !== 'VUETIFY_API_KEY') {
      log.error(i18n.t('commands.mcp_cli.env.set.invalid'))
      outro(i18n.t('messages.all_done'))
      return
    }
    await installMcp({
      scope: current.state.scope,
      mode: 'remote',
      ide: current.state.ide,
      cwd,
      headers: { Authorization: `Bearer ${value}` },
      remoteUrl: DEFAULT_VUETIFY_REMOTE_URL,
      packageName: DEFAULT_VUETIFY_MCP_PACKAGE,
      serverId: DEFAULT_VUETIFY_MCP_SERVER_ID,
    })
  } else {
    await installMcp({
      scope: current.state.scope,
      mode: current.state.mode,
      ide: current.state.ide,
      cwd,
      env: { [key]: value } satisfies McpEnv,
      remoteUrl: DEFAULT_VUETIFY_REMOTE_URL,
      packageName: DEFAULT_VUETIFY_MCP_PACKAGE,
      serverId: DEFAULT_VUETIFY_MCP_SERVER_ID,
    })
  }

  log.success(i18n.t('commands.mcp_cli.env.set.done', { key }))
  outro(i18n.t('messages.all_done'))
}

async function runEnvUnset (options: ScopeArgs & { key?: string, cwd?: string, agent?: string, ide?: string }) {
  const cwd = options.cwd ?? process.cwd()
  const current = await resolveStateFromArgs(options, cwd)

  intro(i18n.t('commands.mcp_cli.intro'))

  if (!current) {
    log.info(i18n.t('commands.mcp_cli.status.not_installed'))
    outro(i18n.t('messages.all_done'))
    return
  }

  const key = options.key?.trim()
  if (!key || !SENSITIVE_ENV_KEYS.includes(key as any)) {
    log.error(i18n.t('commands.mcp_cli.env.unset.invalid'))
    outro(i18n.t('messages.all_done'))
    return
  }
  if (current.state.mode === 'remote' && key !== 'VUETIFY_API_KEY') {
    log.error(i18n.t('commands.mcp_cli.env.unset.invalid'))
    outro(i18n.t('messages.all_done'))
    return
  }

  const target = await resolveIdeConfigTarget({ ide: current.state.ide, scope: current.state.scope, cwd })
  if (!target || target.kind !== 'file') {
    log.warning(i18n.t('commands.mcp_cli.env.unset.unsupported'))
    outro(i18n.t('messages.all_done'))
    return
  }
  if (target.path.endsWith('.toml')) {
    log.warning(i18n.t('commands.mcp_cli.env.unset.unsupported'))
    outro(i18n.t('messages.all_done'))
    return
  }

  const changed = await removeEnvKeyFromConfigFile({
    ide: current.state.ide,
    serverId: DEFAULT_VUETIFY_MCP_SERVER_ID,
    filePath: target.path,
    key,
    mode: current.state.mode,
  })

  if (changed) {
    await writeInstallState(current.statePath, {
      ...current.state,
      updatedAt: new Date().toISOString(),
    })
    log.success(i18n.t('commands.mcp_cli.env.unset.done', { key }))
  } else {
    log.info(i18n.t('commands.mcp_cli.env.unset.noop', { key }))
  }

  outro(i18n.t('messages.all_done'))
}

function hasSubcommandInArgv (command: string, subcommands: readonly string[]) {
  const argv = process.argv.slice(2)
  const idx = argv.indexOf(command)
  if (idx === -1) {
    return false
  }
  const rest = argv.slice(idx + 1)

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i]
    if (!token) {
      continue
    }
    if (token.startsWith('-')) {
      if ((token === '--cwd' || token === '--agent' || token === '--ide') && typeof rest[i + 1] === 'string' && !rest[i + 1]!.startsWith('-')) {
        i++
      }
      continue
    }
    return subcommands.includes(token)
  }

  return false
}

async function resolveScope (args: ScopeArgs, cwd: string): Promise<McpInstallScope> {
  const explicit = [args.local ? 'local' : null, args.global ? 'global' : null].filter(Boolean) as McpInstallScope[]
  if (explicit.length > 1) {
    log.error(i18n.t('commands.mcp_cli.scope.conflict'))
    return await getDefaultInstallScope(cwd)
  }
  if (explicit[0]) {
    return explicit[0]
  }
  return await getDefaultInstallScope(cwd)
}

async function resolveStateFromArgs (args: ScopeArgs & { agent?: string, ide?: string }, cwd: string): Promise<{ state: McpInstallStateV1, statePath: string } | null> {
  const agent = typeof args.agent === 'string' && args.agent.trim()
    ? args.agent.trim()
    : (typeof args.ide === 'string' && args.ide.trim() ? args.ide.trim() : '')

  const scopeOrder: McpInstallScope[] = []
  if (args.local) {
    scopeOrder.push('local')
  } else if (args.global) {
    scopeOrder.push('global')
  } else {
    scopeOrder.push('local', 'global')
  }

  if (agent) {
    const registry = AgentRegistry.withBuiltins()
    const resolved = registry.resolve(agent as IDEId)
    const id = (resolved?.id ?? agent) as IDEId
    for (const scope of scopeOrder) {
      const path = defaultStatePathForAgent(scope, cwd, id)
      const state = await readInstallState(path)
      if (!state) {
        continue
      }
      if (args.remote && state.mode !== 'remote') {
        continue
      }
      return { state, statePath: path }
    }
    return null
  }

  if (args.local || args.global) {
    const scope = args.local ? 'local' : 'global'
    const legacyPath = defaultStatePath(scope, cwd)
    const legacy = await readInstallState(legacyPath)
    if (legacy && (!args.remote || legacy.mode === 'remote')) {
      return { state: legacy, statePath: legacyPath }
    }
    const states = await listInstallStates(scope, cwd)
    const picked = states[0]
    if (!picked) {
      return null
    }
    if (args.remote && picked.state.mode !== 'remote') {
      return null
    }
    return picked
  }

  const resolved = await resolveCurrentInstallState(cwd)
  if (!resolved) {
    return null
  }
  if (args.remote && resolved.state.mode !== 'remote') {
    return null
  }
  return resolved
}

async function resolveAgents (args: { ide?: string, agent?: string }): Promise<IDEId[]> {
  const explicit = typeof args.agent === 'string' && args.agent.trim()
    ? args.agent.trim()
    : (typeof args.ide === 'string' && args.ide.trim() ? args.ide.trim() : '')

  const registry = AgentRegistry.withBuiltins()

  if (explicit) {
    const resolved = registry.resolve(explicit as IDEId)
    return [(resolved?.id ?? explicit) as IDEId]
  }

  const detectedIdes = await detectIDEs()
  const detectedSet = new Set(detectedIdes.filter(i => i.detected).map(i => i.id))

  const items = registry.list().map(agent => {
    const isDetected = agent.compatibility?.ides?.some(id => detectedSet.has(id)) ?? false
    return {
      id: agent.id,
      name: agent.name,
      detected: isDetected,
    }
  }).toSorted((a, b) => {
    if (a.detected !== b.detected) {
      return a.detected ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  const selected = await multiselect({
    message: i18n.t('prompts.mcp_cli.agents'),
    options: items.map(item => ({
      value: item.id,
      label: item.detected ? `${item.name} ${dim(i18n.t('prompts.mcp_cli.detected'))}` : item.name,
    })),
    required: true,
  })

  if (typeof selected === 'symbol') {
    return []
  }

  return (selected as string[]).map(s => s as IDEId)
}

function pickEnvFromProcess (): McpEnv | undefined {
  const env: Record<string, string> = {}
  if (process.env.VUETIFY_API_KEY) {
    env.VUETIFY_API_KEY = process.env.VUETIFY_API_KEY
  }
  return Object.keys(env).length > 0 ? env : undefined
}

function pickHeadersFromProcess (): Record<string, string> | undefined {
  if (!process.env.VUETIFY_API_KEY) {
    return undefined
  }
  return { Authorization: `Bearer ${process.env.VUETIFY_API_KEY}` }
}

function isAnyAuthConfigured (input: { env?: McpEnv, headers?: Record<string, string> }) {
  return Boolean(input.env?.VUETIFY_API_KEY || input.headers?.Authorization)
}

function formatServerConnection (mode: McpServerMode) {
  if (mode === 'remote') {
    return `${DEFAULT_VUETIFY_REMOTE_URL}`
  }
  return `npx -y ${DEFAULT_VUETIFY_MCP_PACKAGE}`
}

function formatConfigResult (config: any) {
  if (!config || typeof config !== 'object') {
    return i18n.t('commands.mcp_cli.output.unknown')
  }
  if (config.kind === 'written') {
    return config.filePath
  }
  if (config.kind === 'command') {
    return redactInlineSecrets(String(config.command))
  }
  if (config.kind === 'skipped') {
    return i18n.t('commands.mcp_cli.output.skipped', { reason: String(config.reason ?? '') })
  }
  return i18n.t('commands.mcp_cli.output.unknown')
}

function redactInlineSecrets (text: string): string {
  return text.replace(INLINE_AUTH_RE, 'Authorization:Bearer <VUETIFY_API_KEY>')
}

function resolveMode (args: { ide: IDEId, remote?: boolean }): McpServerMode {
  if (args.remote) {
    return 'remote'
  }
  if (args.ide === 'claude-code') {
    return 'remote'
  }
  return 'package'
}

function parseEnvPair (pair?: string): { key: keyof McpEnv & string, value: string } | null {
  if (!pair) {
    return null
  }
  const idx = pair.indexOf('=')
  if (idx <= 0) {
    return null
  }
  const key = pair.slice(0, idx).trim()
  const value = pair.slice(idx + 1)
  if (!key || !value) {
    return null
  }
  if (!SENSITIVE_ENV_KEYS.includes(key as any)) {
    return null
  }
  return { key: key as any, value }
}

type IdeConfigTarget
  = { kind: 'file', path: string }
    | { kind: 'command', command: string }

type IdeMcpRootKey = 'servers' | 'mcpServers' | 'context_servers' | 'mcp'

function resolveIdeMcpRootKey (ide: IDEId): IdeMcpRootKey {
  if (ide === 'code' || ide === 'code-insiders' || ide === 'copilot' || ide === 'cline' || ide === 'continue') {
    return 'servers'
  }
  if (ide === 'zed') {
    return 'context_servers'
  }
  if (ide === 'opencode' || ide === 'crush') {
    return 'mcp'
  }
  return 'mcpServers'
}

async function resolveIdeConfigTarget (options: { ide: IDEId, scope: McpInstallScope, cwd: string }): Promise<IdeConfigTarget | null> {
  const ide = options.ide
  if (ide === 'claude-code') {
    const server = createVuetifyServerSpec({ mode: 'remote' })
    if (server.connection.transport !== 'http') {
      return null
    }
    const command = redactInlineSecrets(`claude mcp add --transport http --scope user ${server.id} ${server.connection.url}`)
    return { kind: 'command', command }
  }

  const localPath = getDefaultIdeConfigPath({ scope: options.scope, ide, cwd: options.cwd })
  if (localPath) {
    return { kind: 'file', path: localPath }
  }

  const info = await resolveIdeInfo(ide)
  if (!info?.settingsDir) {
    return null
  }
  const fileName = info.settingsFile ?? 'mcp.json'
  return { kind: 'file', path: join(info.settingsDir, fileName) }
}

async function inspectConfigForSecrets (ide: IDEId, target: IdeConfigTarget, serverId: string) {
  if (target.kind !== 'file') {
    return null
  }
  const raw = await tryReadFile(target.path)
  if (!raw) {
    return { vuetifyApiKey: false }
  }
  const doc = safeParseJson(raw)
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    const vuetifyApiKey = INLINE_AUTH_HINT_RE.test(raw)
    return { vuetifyApiKey }
  }

  const rootKey = resolveIdeMcpRootKey(ide)
  const servers = (doc as any)[rootKey] as any
  const server = servers?.[serverId]

  const vuetifyApiKey = Boolean(
    server?.env?.VUETIFY_API_KEY
    || server?.headers?.Authorization
    || server?.environment?.VUETIFY_API_KEY
    || server?.api_key
    || server?.headers?.authorization,
  )

  return { vuetifyApiKey }
}

function isObjectRecord (value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cleanupEmptyObject (parent: Record<string, any>, key: string) {
  const value = parent[key]
  if (isObjectRecord(value) && Object.keys(value).length === 0) {
    delete parent[key]
    return true
  }
  return false
}

function removeRemoteAuth (server: Record<string, any>) {
  let changed = false
  if (isObjectRecord(server.headers) && 'Authorization' in server.headers) {
    delete server.headers.Authorization
    changed = true
  }
  if (isObjectRecord(server.headers) && 'authorization' in server.headers) {
    delete server.headers.authorization
    changed = true
  }
  changed ||= cleanupEmptyObject(server, 'headers')
  return changed
}

function removeLocalEnv (server: Record<string, any>, key: string) {
  let changed = false

  if (isObjectRecord(server.env) && key in server.env) {
    delete server.env[key]
    changed = true
  }
  changed ||= cleanupEmptyObject(server, 'env')

  if (isObjectRecord(server.environment) && key in server.environment) {
    delete server.environment[key]
    changed = true
  }
  changed ||= cleanupEmptyObject(server, 'environment')

  return changed
}

async function removeEnvKeyFromConfigFile (options: {
  ide: IDEId
  serverId: string
  filePath: string
  key: string
  mode: McpServerMode
}) {
  const raw = await tryReadFile(options.filePath)
  if (!raw) {
    return false
  }
  const doc = safeParseJson(raw)
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return false
  }

  const rootKey = resolveIdeMcpRootKey(options.ide)
  const servers = (doc as any)[rootKey]
  if (!isObjectRecord(servers)) {
    return false
  }

  const server = servers[options.serverId]
  if (!isObjectRecord(server)) {
    return false
  }

  const changed = options.mode === 'remote'
    ? removeRemoteAuth(server)
    : removeLocalEnv(server, options.key)

  if (!changed) {
    return false
  }

  await writeFile(options.filePath, `${JSON.stringify(doc, null, 2)}\n`)
  return true
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

async function runAgents (options: { query?: string }) {
  const registry = AgentRegistry.withBuiltins()
  const query = options.query?.trim()

  intro(i18n.t('commands.mcp_cli.intro'))

  if (query) {
    const agent = registry.resolve(query as any)
    if (!agent) {
      log.error(i18n.t('commands.mcp_cli.agents.not_found', { query }))
      outro(i18n.t('messages.all_done'))
      return
    }

    log.info(i18n.t('commands.mcp_cli.agents.show.title', { id: agent.id }))
    log.info(i18n.t('commands.mcp_cli.agents.show.name', { name: agent.name }))
    if (agent.description) {
      log.info(i18n.t('commands.mcp_cli.agents.show.description', { description: agent.description }))
    }
    if (agent.publisher) {
      log.info(i18n.t('commands.mcp_cli.agents.show.publisher', { publisher: agent.publisher }))
    }
    if (agent.homepage) {
      log.info(i18n.t('commands.mcp_cli.agents.show.homepage', { homepage: agent.homepage }))
    }
    if (agent.categories?.length) {
      log.info(i18n.t('commands.mcp_cli.agents.show.categories', { categories: agent.categories.join(', ') }))
    }
    if (agent.tags?.length) {
      log.info(i18n.t('commands.mcp_cli.agents.show.tags', { tags: agent.tags.join(', ') }))
    }

    const ides = agent.compatibility?.ides?.length ? agent.compatibility.ides.join(', ') : i18n.t('commands.mcp_cli.output.unknown')
    const scopes = agent.compatibility?.scopes?.length ? agent.compatibility.scopes.join(', ') : i18n.t('commands.mcp_cli.output.unknown')
    const modes = agent.compatibility?.modes?.length ? agent.compatibility.modes.join(', ') : i18n.t('commands.mcp_cli.output.unknown')

    log.info(i18n.t('commands.mcp_cli.agents.show.ides', { ides }))
    log.info(i18n.t('commands.mcp_cli.agents.show.scopes', { scopes }))
    log.info(i18n.t('commands.mcp_cli.agents.show.modes', { modes }))

    outro(i18n.t('messages.all_done'))
    return
  }

  log.info(i18n.t('commands.mcp_cli.agents.list.title'))
  for (const agent of registry.list()) {
    log.info(`${agent.id} — ${agent.name}`)
  }
  outro(i18n.t('messages.all_done'))
}
