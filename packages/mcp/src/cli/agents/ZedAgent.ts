import { homedir } from 'node:os'
import path from 'pathe'
import { getServerConfig, SERVER_NAME } from '../settings-builder'
import { deepset } from '../utils/deepset'
import { AbstractAgent } from './AbstractAgent'

export class ZedAgent extends AbstractAgent {
  get id (): string {
    return 'zed'
  }

  get brand (): string {
    return 'Zed'
  }

  getSettingsDir (): string {
    return path.join(homedir(), '.config', 'zed')
  }

  getSettingsFile (): string {
    return 'settings.json'
  }

  getConfigPath (): string {
    return `context_servers.${SERVER_NAME}`
  }

  getProjectSettingsPath (projectRoot: string): string | null {
    return path.join(projectRoot, '.zed', 'settings.json')
  }

  generateConfig (transport?: 'stdio' | 'http', remote?: boolean): string {
    const config = {}
    const serverConfig = getServerConfig(transport, remote)

    const zedConfig = {
      ...(serverConfig as object),
      source: 'custom',
    }

    deepset(config, this.getConfigPath(), zedConfig)
    return JSON.stringify(config, null, 2)
  }
}
