import { homedir } from 'node:os'
import path from 'pathe'
import { platform } from 'std-env'
import { AbstractAgent } from './AbstractAgent'

export class CursorAgent extends AbstractAgent {
  get id (): string {
    return 'cursor'
  }

  get brand (): string {
    return 'Cursor'
  }

  getSettingsDir (): string {
    switch (platform) {
      case 'darwin': {
        return path.join(homedir(), 'Library', 'Application Support', 'Cursor', 'User')
      }
      case 'win32': {
        return path.join(process.env.APPDATA!, 'Cursor', 'User')
      }
      case 'linux': {
        return path.join(homedir(), '.config', 'Cursor', 'User')
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
