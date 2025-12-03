import { defineExtension, useCommand, useIsDarkTheme, watchEffect } from 'reactive-vscode'
import { createProject } from './commands'
import { logger } from './utils'

export = defineExtension(() => {
  logger.info('Extension Activated')

  useCommand('vuetify.createProject', createProject)

  const isDark = useIsDarkTheme()
  watchEffect(() => {
    logger.info('Is Dark Theme:', isDark.value)
  })
})
