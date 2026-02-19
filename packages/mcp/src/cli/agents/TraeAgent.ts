import { homedir } from 'node:os'
import path from 'pathe'
import { platform } from 'std-env'
import { AbstractAgent } from './AbstractAgent'

export class TraeAgent extends AbstractAgent {
  get id (): string {
    return 'trae'
  }

  get brand (): string {
    return 'Trae'
  }

  getSettingsDir (): string {
    switch (platform) {
      case 'darwin': {
        return path.join(homedir(), 'Library', 'Application Support', 'Trae', 'User')
      }
      case 'win32': {
        return path.join(process.env.APPDATA!, 'Trae', 'User')
      }
      case 'linux': {
        return path.join(homedir(), '.config', 'Trae', 'User')
      }
      default: {
        return ''
      }
    }
  }

  getProjectSettingsPath (projectRoot: string): string | null {
    return path.join(projectRoot, '.vscode', 'settings.json')
  }
}
