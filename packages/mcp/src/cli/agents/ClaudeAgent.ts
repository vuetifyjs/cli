import { homedir } from 'node:os'
import path from 'pathe'
import { platform } from 'std-env'
import { checkMacOSApp, checkWindowsApp } from '../detect/index'
import { AbstractAgent } from './AbstractAgent'

export class ClaudeAgent extends AbstractAgent {
  get id (): string {
    return 'claude'
  }

  get brand (): string {
    return 'Claude'
  }

  async detect (): Promise<boolean> {
    switch (platform) {
      case 'darwin': {
        return checkMacOSApp('Claude')
      }
      case 'win32': {
        return checkWindowsApp('claude')
      }
      default: {
        return false
      }
    }
  }

  getSettingsDir (): string {
    switch (platform) {
      case 'darwin': {
        return path.join(homedir(), 'Library', 'Application Support', 'Claude')
      }
      case 'win32': {
        return path.join(process.env.APPDATA!, 'Claude')
      }
      default: {
        return ''
      }
    }
  }

  getSettingsFile (): string {
    return 'claude_desktop_config.json'
  }
}
