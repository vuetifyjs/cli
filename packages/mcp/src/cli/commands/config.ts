import type { DetectedIDE } from '../ide/types'
import { intro as clackIntro, confirm, log, outro, select } from '@clack/prompts'
import { defineCommand } from 'citty'
import { link } from 'kolorist'
import { detectIDEs } from '../detect-ide'
import { installAgent } from '../install-globally'
import { config, startMessage } from '../intro'
import { npx } from '../settings-builder'

export async function runConfig (useRemote = false) {
  const ides = await detectIDEs()

  if (ides.length === 0) {
    log.warn('No supported IDE detected.')
    return
  }

  clackIntro(startMessage)

  let idesToInstall: DetectedIDE | symbol | null = null

  if (ides.length > 1) {
    idesToInstall = await select({
      message: 'Select IDE to configure',
      options: ides.map(ide => ({ value: ide, label: ide.brand })),
    })
  }

  if (ides.length === 1) {
    idesToInstall = ides[0]
  }

  if (idesToInstall === null) {
    config(undefined, useRemote)
    return
  }

  const selectedIde = idesToInstall as DetectedIDE

  config(selectedIde, useRemote)

  if ((!npx || !npx?.pure) && selectedIde.id === 'claude') {
    log.warn(`Claude probably will fail with resolving your \`npx\`. ${link('See more', 'https://github.com/modelcontextprotocol/servers/issues/64#issuecomment-2878569805')}`)
  }

  const installType = await select({
    message: 'How would you like to install the configuration?',
    options: [
      { value: 'global', label: 'Global (User Settings)' },
      { value: 'project', label: 'Current Project (Workspace Settings)' },
    ],
  })

  if (typeof installType !== 'string') {
    return
  }

  const shouldInstall = await confirm({
    message: `Would you like to apply these settings automatically to ${installType === 'global' ? 'User Settings' : 'Current Project'}?`,
  })

  if (shouldInstall) {
    await installAgent([selectedIde], installType as 'global' | 'project', useRemote)
    outro('IDE settings updated successfully')
  } else {
    outro('Installation cancelled')
  }
}

export const configCommand = defineCommand({
  meta: {
    name: 'config',
    description: 'Configure IDE for Vuetify MCP',
  },
  args: {
    remote: {
      type: 'boolean',
      description: 'Use remote MCP server',
    },
  },
  run: async ({ args }) => {
    await runConfig(args.remote)
  },
})
