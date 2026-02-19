import { defaultDetection } from '../detect/index'
import { getClaudeCodeCommand } from '../settings-builder'
import { AbstractAgent } from './AbstractAgent'

export class ClaudeCodeAgent extends AbstractAgent {
  get id (): string {
    return 'claude-code'
  }

  get brand (): string {
    return 'Claude Code'
  }

  async detect (): Promise<boolean> {
    const detector = defaultDetection('claude')
    return detector()
  }

  getSettingsDir (): string {
    return ''
  }

  generateConfig (): string {
    return getClaudeCodeCommand()
  }
}
