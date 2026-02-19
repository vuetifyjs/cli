import type { DetectedIDE } from './ide/types'
import { join } from 'node:path'
import { log } from '@clack/prompts'
import { ansi256, underline } from 'kolorist'
import { getDefaultIDE } from './detect-ide'

const defaultIde = await getDefaultIDE()

const blue = ansi256(33)

const WELCOME_MESSAGE = 'Welcome to the Vuetify MCP Server'
const CONFIG_TEMPLATE = `
Open your IDE and paste this into your
%settings% file (for %brand%):`
const CLAUDE_CODE_TEMPLATE = `
Run this command to configure Claude Code:`

export const startMessage = blue(WELCOME_MESSAGE)

function configMessage (ide: DetectedIDE) {
  if (ide.id === 'claude-code') {
    return blue(CLAUDE_CODE_TEMPLATE)
  }
  return blue(
    CONFIG_TEMPLATE
      .replace('%settings%', underline(join(ide.getSettingsDir(), ide.getSettingsFile())))
      .replace('%brand%', ide.brand),
  )
}

export function intro (): void {
  log.info(startMessage)
}

export function config (ide: DetectedIDE = defaultIde, remote?: boolean): void {
  const message = `\n${configMessage(ide)}\n\n${ide.generateConfig(undefined, remote)}`
  log.info(message)
}
