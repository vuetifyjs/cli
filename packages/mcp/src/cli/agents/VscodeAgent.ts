import { homedir } from 'node:os'
import path from 'pathe'
import { platform } from 'std-env'
import { SERVER_NAME } from '../settings-builder'
import { AbstractAgent } from './AbstractAgent'

export class VscodeAgent extends AbstractAgent {
  get id (): string {
    return 'code'
  }

  get brand (): string {
    return 'VS Code'
  }

  getSettingsDir (): string {
    switch (platform) {
      case 'darwin': {
        return path.join(homedir(), 'Library', 'Application Support', 'Code', 'User')
      }
      case 'win32': {
        return path.join(process.env.APPDATA!, 'Code', 'User')
      }
      case 'linux': {
        return path.join(homedir(), '.config', 'Code', 'User')
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
