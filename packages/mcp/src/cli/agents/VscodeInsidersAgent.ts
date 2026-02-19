import { homedir } from 'node:os'
import path from 'pathe'
import { platform } from 'std-env'
import { SERVER_NAME } from '../settings-builder'
import { AbstractAgent } from './AbstractAgent'

export class VscodeInsidersAgent extends AbstractAgent {
  get id (): string {
    return 'code-insiders'
  }

  get brand (): string {
    return 'VS Code Insiders'
  }

  getSettingsDir (): string {
    switch (platform) {
      case 'darwin': {
        return path.join(homedir(), 'Library', 'Application Support', 'Code - Insiders', 'User')
      }
      case 'win32': {
        return path.join(process.env.APPDATA!, 'Code - Insiders', 'User')
      }
      case 'linux': {
        return path.join(homedir(), '.config', 'Code - Insiders', 'User')
      }
      default: {
        return ''
      }
    }
  }

  getConfigPath (): string {
    return `servers.${SERVER_NAME}`
  }

  getProjectSettingsPath (projectRoot: string): string | null {
    return path.join(projectRoot, '.vscode', 'settings.json')
  }
}
