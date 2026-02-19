import { homedir } from 'node:os'
import path from 'pathe'
import { platform } from 'std-env'
import { AbstractAgent } from './AbstractAgent'

export class WindsurfAgent extends AbstractAgent {
  get id (): string {
    return 'windsurf'
  }

  get brand (): string {
    return 'Windsurf'
  }

  getSettingsDir (): string {
    switch (platform) {
      case 'darwin': {
        return path.join(homedir(), 'Library', 'Application Support', 'Windsurf', 'User')
      }
      case 'win32': {
        return path.join(process.env.APPDATA!, 'Windsurf', 'User')
      }
      case 'linux': {
        return path.join(homedir(), '.config', 'Windsurf', 'User')
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
