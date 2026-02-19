import { defaultDetection } from '../detect/index'
import { getServerConfig, SERVER_NAME } from '../settings-builder'
import { deepset } from '../utils/deepset'

export abstract class AbstractAgent {
  /**
   * Returns whether the agent is installed on the system.
   */
  async detect (): Promise<boolean> {
    const detector = defaultDetection(this.id)
    return detector()
  }

  /**
   * Returns the configuration file name.
   */
  getSettingsFile (): string {
    return 'mcp.json'
  }

  /**
   * Returns the path in the configuration file where the MCP server config should be injected.
   */
  getConfigPath (): string {
    return `mcpServers.${SERVER_NAME}`
  }

  /**
   * Returns whether this agent supports MCP.
   */
  supportsMcp (): boolean {
    return true
  }

  /**
   * Returns the lowercase identifier of the agent (e.g., "code", "trae", "cursor").
   */
  abstract get id (): string

  /**
   * Returns the display name of the agent.
   */
  abstract get brand (): string

  /**
   * Returns the directory where the agent's settings are stored.
   */
  abstract getSettingsDir (): string

  /**
   * Returns the project-specific configuration file path.
   * Returns null if the agent does not support project-level configuration.
   */
  getProjectSettingsPath (_projectRoot: string): string | null {
    return null
  }

  /**
   * Generates the configuration string for the agent.
   */
  generateConfig (transport?: 'stdio' | 'http', remote?: boolean): string {
    const config = {}
    const serverConfig = getServerConfig(transport, remote)
    deepset(config, this.getConfigPath(), serverConfig)
    return JSON.stringify(config, null, 2)
  }
}
