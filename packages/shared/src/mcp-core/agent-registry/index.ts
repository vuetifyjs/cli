import type { AgentId, AgentMetadataV1 } from '../types'
import { builtinAgents as builtinAgentsList } from './builtin'

export { builtinAgents } from './builtin'

const AGENT_ID_RE = /^[a-z0-9][a-z0-9-]*$/

export class AgentRegistry {
  #agents = new Map<AgentId, AgentMetadataV1>()
  #aliases = new Map<AgentId, AgentId>()

  constructor (agents: AgentMetadataV1[] = []) {
    for (const agent of agents) {
      this.register(agent)
    }
  }

  static withBuiltins () {
    return new AgentRegistry(builtinAgentsList)
  }

  register (agent: AgentMetadataV1) {
    validateAgentMetadata(agent)
    if (this.#agents.has(agent.id)) {
      throw new Error(`Agent already registered: ${agent.id}`)
    }
    if (this.#aliases.has(agent.id)) {
      throw new Error(`Agent id conflicts with an alias: ${agent.id}`)
    }
    this.#agents.set(agent.id, agent)
    for (const alias of agent.aliases ?? []) {
      if (alias === agent.id) {
        continue
      }
      if (this.#agents.has(alias) || this.#aliases.has(alias)) {
        throw new Error(`Agent alias already registered: ${alias}`)
      }
      this.#aliases.set(alias, agent.id)
    }
  }

  registerMany (agents: AgentMetadataV1[]) {
    for (const agent of agents) {
      this.register(agent)
    }
  }

  get (id: AgentId): AgentMetadataV1 | undefined {
    return this.#agents.get(id)
  }

  resolve (idOrAlias: AgentId): AgentMetadataV1 | undefined {
    const direct = this.get(idOrAlias)
    if (direct) {
      return direct
    }
    const resolved = this.#aliases.get(idOrAlias)
    return resolved ? this.get(resolved) : undefined
  }

  list (): AgentMetadataV1[] {
    return [...this.#agents.values()].toSorted((a, b) => a.id.localeCompare(b.id))
  }

  has (id: AgentId): boolean {
    return this.#agents.has(id)
  }

  search (query: string): AgentMetadataV1[] {
    const q = query.trim().toLowerCase()
    if (!q) {
      return this.list()
    }
    return this.list().filter(agent => {
      if (agent.id.toLowerCase().includes(q)) {
        return true
      }
      if (agent.aliases?.some(a => a.toLowerCase().includes(q))) {
        return true
      }
      if (agent.name.toLowerCase().includes(q)) {
        return true
      }
      if (agent.description?.toLowerCase().includes(q)) {
        return true
      }
      if (agent.publisher?.toLowerCase().includes(q)) {
        return true
      }
      if (agent.categories?.some(c => c.toLowerCase().includes(q))) {
        return true
      }
      if (agent.tags?.some(t => t.toLowerCase().includes(q))) {
        return true
      }
      return false
    })
  }
}

export function defineAgent (agent: AgentMetadataV1): AgentMetadataV1 {
  validateAgentMetadata(agent)
  return agent
}

export function validateAgentMetadata (agent: AgentMetadataV1) {
  if (!agent || typeof agent !== 'object') {
    throw new TypeError('Agent metadata must be an object')
  }
  if (agent.schema !== 'vuetify.mcp.agent/v1') {
    throw new TypeError(`Unsupported agent schema: ${String((agent as any).schema)}`)
  }
  if (!isValidAgentId(agent.id)) {
    throw new TypeError(`Invalid agent id: ${agent.id}`)
  }
  if (agent.aliases) {
    if (!Array.isArray(agent.aliases)) {
      throw new TypeError(`Invalid agent aliases for ${agent.id}`)
    }
    for (const alias of agent.aliases) {
      if (!isValidAgentId(alias)) {
        throw new TypeError(`Invalid agent alias for ${agent.id}: ${String(alias)}`)
      }
    }
  }
  if (!agent.name || typeof agent.name !== 'string') {
    throw new TypeError(`Invalid agent name for ${agent.id}`)
  }
  if (agent.publisher != null && typeof agent.publisher !== 'string') {
    throw new TypeError(`Invalid agent publisher for ${agent.id}`)
  }
  if (agent.categories && (!Array.isArray(agent.categories) || agent.categories.some(c => typeof c !== 'string' || !c))) {
    throw new TypeError(`Invalid agent categories for ${agent.id}`)
  }
  if (agent.tags && (!Array.isArray(agent.tags) || agent.tags.some(t => typeof t !== 'string' || !t))) {
    throw new TypeError(`Invalid agent tags for ${agent.id}`)
  }
  if (agent.homepage != null && typeof agent.homepage !== 'string') {
    throw new TypeError(`Invalid agent homepage for ${agent.id}`)
  }
  if (agent.inputs) {
    for (const [key, input] of Object.entries(agent.inputs)) {
      if (!key) {
        throw new TypeError(`Invalid input key for ${agent.id}`)
      }
      if (input.type === 'env') {
        if (!input.env || typeof input.env !== 'string') {
          throw new TypeError(`Invalid env input for ${agent.id}:${key}`)
        }
      } else if (input.type === 'text') {
        if (!input.label || typeof input.label !== 'string') {
          throw new TypeError(`Invalid text input for ${agent.id}:${key}`)
        }
      } else {
        throw new TypeError(`Unsupported input type for ${agent.id}:${key}`)
      }
    }
  }
}

export function isValidAgentId (id: unknown): id is AgentId {
  return typeof id === 'string' && AGENT_ID_RE.test(id)
}
