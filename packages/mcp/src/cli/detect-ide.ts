import type { DetectedIDE } from './ide/types'
import * as AgentClasses from './agents/index'
import { AbstractAgent } from './ide/types'

let cachedIDEs: DetectedIDE[] | null = null

export async function detectIDEs (): Promise<DetectedIDE[]> {
  if (cachedIDEs !== null) {
    return cachedIDEs
  }

  const detectedIDEs: DetectedIDE[] = []

  for (const agentClassName in AgentClasses) {
    const AgentClass = AgentClasses[agentClassName as keyof typeof AgentClasses]

    // Skip if not a constructor or AbstractAgent itself
    if (typeof AgentClass !== 'function' || AgentClass === AbstractAgent) {
      continue
    }

    try {
      // @ts-expect-error - we know it's a constructor
      const agent = new AgentClass()
      if (agent instanceof AbstractAgent && await agent.detect()) {
        detectedIDEs.push(agent)
      }
    } catch {
      // Ignore errors during instantiation/detection
    }
  }

  cachedIDEs = detectedIDEs
  return detectedIDEs
}

export async function getDefaultIDE (): Promise<DetectedIDE> {
  const ides = await detectIDEs()
  if (ides.length > 0) {
    return ides[0]
  }
  // Fallback
  return new AgentClasses.VscodeAgent()
}

export function clearIDECache () {
  cachedIDEs = null
}
