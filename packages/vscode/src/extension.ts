import { defineExtension, useCommand, useDisposable } from 'reactive-vscode'
import { createProject, openApiDocs, openComponentDocs } from './commands'
import { registerCodeActionProvider, registerHoverProvider } from './providers'
import { logger } from './utils'

export default defineExtension(() => {
  logger.info('Extension Activated')

  useCommand('vuetify.createProject', createProject)
  useCommand('vuetify.openApiDocs', openApiDocs)
  useCommand('vuetify.openComponentDocs', openComponentDocs)

  useDisposable(registerHoverProvider())
  useDisposable(registerCodeActionProvider())
})
