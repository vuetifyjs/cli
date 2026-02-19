import type { DetectedIDE } from './ide/types'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { log } from '@clack/prompts'
import { parse } from 'jsonc-parser'
import { dirname, resolve } from 'pathe'
import { x } from 'tinyexec'
import { getClaudeCodeArgs, getServerConfig } from './settings-builder'
import { deepset } from './utils/deepset'

export type InstallScope = 'global' | 'project'

async function installClaudeCode () {
  const args = getClaudeCodeArgs()
  const result = await x('claude', args)

  if (result.exitCode !== 0) {
    if (result.stderr.includes('already exists')) {
      // Remove existing and re-add
      await x('claude', ['mcp', 'remove', '--scope', 'user', 'vuetify-mcp'])
      await x('claude', args, { throwOnError: true })
    } else {
      throw new Error(result.stderr || 'Failed to add MCP server')
    }
  }
}

async function setIdeSettings (ideInstance: DetectedIDE, scope: InstallScope, remote?: boolean) {
  if (ideInstance.id === 'claude-code') {
    if (scope === 'project') {
      log.warn('Claude Code typically works globally, but we\'re installing it for the project.')
    }
    return installClaudeCode()
  }

  let configFilePath: string | null = null

  if (scope === 'global') {
    const settingsDir = ideInstance.getSettingsDir()
    if (!settingsDir || !existsSync(settingsDir)) {
      return
    }
    configFilePath = resolve(settingsDir, ideInstance.getSettingsFile())
  } else {
    configFilePath = ideInstance.getProjectSettingsPath(process.cwd())
  }

  if (!configFilePath) {
    return
  }

  if (scope === 'project') {
    const dir = dirname(configFilePath)
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }

  const settingsPath = ideInstance.getConfigPath()
  const serverConfig = getServerConfig(undefined, remote)

  let config = {}
  if (existsSync(configFilePath)) {
    try {
      const fileContent = await readFile(configFilePath, { encoding: 'utf8' })
      const parsed = parse(fileContent)
      if (parsed && typeof parsed === 'object') {
        config = parsed
      }
    } catch (error) {
      log.error(`Failed to parse existing config: ${String(error)}`)
      log.warn('Creating new config file instead')
    }
  }

  deepset(config, settingsPath, serverConfig)
  await writeFile(configFilePath, JSON.stringify(config, null, 2))
}

export async function installAgent (ides: DetectedIDE[], scope: InstallScope, remote?: boolean) {
  for (const ide of ides) {
    await setIdeSettings(ide, scope, remote)
  }
}
