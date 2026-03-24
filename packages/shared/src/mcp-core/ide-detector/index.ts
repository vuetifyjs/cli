import type { DetectedIDE, IDEId, OperatingSystem } from '../types'
import { constants } from 'node:fs'
import { access, readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter } from 'node:path'
import { join } from 'pathe'

export interface SupportedIDE {
  id: IDEId
  brand: string
  settingsDir?: Partial<Record<OperatingSystem, (env: Record<string, string | undefined>) => string>>
  settingsFile?: Partial<Record<OperatingSystem, string>> | string
  detect?: Partial<Record<OperatingSystem, (env: Record<string, string | undefined>) => Promise<boolean>>>
}

export const DEFAULT_SETTINGS_FILE = 'mcp.json'

export function getSupportedIDEs (): SupportedIDE[] {
  return [
    {
      id: 'code',
      brand: 'VS Code',
      detect: {
        darwin: env => isCommandAvailable('code', env),
        linux: env => isCommandAvailable('code', env),
        win32: env => isCommandAvailable('code', env),
      },
      settingsDir: {
        darwin: () => join(homedir(), 'Library', 'Application Support', 'Code', 'User'),
        linux: () => join(homedir(), '.config', 'Code', 'User'),
        win32: env => join(requiredEnv(env, 'APPDATA'), 'Code', 'User'),
      },
    },
    {
      id: 'code-insiders',
      brand: 'VS Code Insiders',
      detect: {
        darwin: env => isCommandAvailable('code-insiders', env),
        linux: env => isCommandAvailable('code-insiders', env),
        win32: env => isCommandAvailable('code-insiders', env),
      },
      settingsDir: {
        darwin: () => join(homedir(), 'Library', 'Application Support', 'Code - Insiders', 'User'),
        linux: () => join(homedir(), '.config', 'Code - Insiders', 'User'),
        win32: env => join(requiredEnv(env, 'APPDATA'), 'Code - Insiders', 'User'),
      },
    },
    {
      id: 'cursor',
      brand: 'Cursor',
      detect: {
        darwin: env => isCommandAvailable('cursor', env),
        linux: env => isCommandAvailable('cursor', env),
        win32: env => isCommandAvailable('cursor', env),
      },
      settingsDir: {
        darwin: () => join(homedir(), 'Library', 'Application Support', 'Cursor', 'User'),
        linux: () => join(homedir(), '.config', 'Cursor', 'User'),
        win32: env => join(requiredEnv(env, 'APPDATA'), 'Cursor', 'User'),
      },
    },
    {
      id: 'windsurf',
      brand: 'Windsurf',
      detect: {
        darwin: env => isCommandAvailable('windsurf', env),
        linux: env => isCommandAvailable('windsurf', env),
        win32: env => isCommandAvailable('windsurf', env),
      },
      settingsDir: {
        darwin: () => join(homedir(), 'Library', 'Application Support', 'Windsurf', 'User'),
        linux: () => join(homedir(), '.config', 'Windsurf', 'User'),
        win32: env => join(requiredEnv(env, 'APPDATA'), 'Windsurf', 'User'),
      },
    },
    {
      id: 'trae',
      brand: 'Trae',
      detect: {
        darwin: env => isCommandAvailable('trae', env),
        linux: env => isCommandAvailable('trae', env),
        win32: env => isCommandAvailable('trae', env),
      },
      settingsDir: {
        darwin: () => join(homedir(), 'Library', 'Application Support', 'Trae', 'User'),
        linux: () => join(homedir(), '.config', 'Trae', 'User'),
        win32: env => join(requiredEnv(env, 'APPDATA'), 'Trae', 'User'),
      },
    },
    {
      id: 'claude',
      brand: 'Claude Desktop',
      detect: {
        darwin: () => pathExists(join('/Applications', 'Claude.app')),
        win32: env => windowsAppExists('claude', env),
      },
      settingsDir: {
        darwin: () => join(homedir(), 'Library', 'Application Support', 'Claude'),
        win32: env => join(requiredEnv(env, 'APPDATA'), 'Claude'),
      },
      settingsFile: 'claude_desktop_config.json',
    },
    {
      id: 'claude-code',
      brand: 'Claude Code',
      detect: {
        darwin: env => isCommandAvailable('claude', env),
        linux: env => isCommandAvailable('claude', env),
        win32: env => isCommandAvailable('claude', env),
      },
    },
  ]
}

export interface DetectIdeOptions {
  platform?: OperatingSystem
  env?: Record<string, string | undefined>
}

export async function detectIDEs (options: DetectIdeOptions = {}): Promise<DetectedIDE[]> {
  const platform = options.platform ?? (process.platform as OperatingSystem)
  const env = options.env ?? process.env

  const ides = getSupportedIDEs()
  const results = await Promise.all(ides.map(async ide => {
    const detected = await (ide.detect?.[platform]?.(env) ?? Promise.resolve(false))
    const settingsDir = ide.settingsDir?.[platform]?.(env)
    const settingsFile = resolveSettingsFile(ide, platform)
    return {
      id: ide.id,
      brand: ide.brand,
      detected,
      settingsDir,
      settingsFile,
    } satisfies DetectedIDE
  }))

  return results
}

export async function getDefaultIDE (options: DetectIdeOptions = {}): Promise<DetectedIDE> {
  const ides = await detectIDEs(options)
  return ides.find(i => i.detected) ?? ides[0] ?? {
    id: 'code',
    brand: 'VS Code',
    detected: false,
    settingsFile: DEFAULT_SETTINGS_FILE,
  }
}

export function sortIDEsDetectedFirst (ides: DetectedIDE[]): DetectedIDE[] {
  return ides.toSorted((a, b) => {
    const aScore = a.detected ? 0 : 1
    const bScore = b.detected ? 0 : 1
    if (aScore !== bScore) {
      return aScore - bScore
    }
    return a.brand.localeCompare(b.brand)
  })
}

function resolveSettingsFile (ide: SupportedIDE, platform: OperatingSystem): string | undefined {
  if (typeof ide.settingsFile === 'string') {
    return ide.settingsFile
  }
  if (typeof ide.settingsFile === 'object') {
    return ide.settingsFile[platform] ?? DEFAULT_SETTINGS_FILE
  }
  if (ide.settingsDir) {
    return DEFAULT_SETTINGS_FILE
  }
  return undefined
}

function requiredEnv (env: Record<string, string | undefined>, key: string): string {
  const v = env[key] ?? process.env[key]
  if (!v) {
    return ''
  }
  return v
}

async function pathExists (path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function isCommandAvailable (command: string, env: Record<string, string | undefined>): Promise<boolean> {
  const platform = process.platform as OperatingSystem
  const pathValue = env.PATH ?? process.env.PATH ?? ''
  const pathEntries = pathValue.split(delimiter).filter(Boolean)

  const extensions = platform === 'win32'
    ? (env.PATHEXT ?? process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean)
    : ['']

  for (const base of pathEntries) {
    for (const ext of extensions) {
      const candidate = join(base, platform === 'win32' ? `${command}${ext}` : command)
      if (await pathExists(candidate)) {
        return true
      }
    }
  }
  return false
}

async function windowsAppExists (programName: string, env: Record<string, string | undefined>): Promise<boolean> {
  const dirs = [
    env.LOCALAPPDATA,
    env.ProgramFiles,
    env['ProgramFiles(x86)'],
  ].filter(Boolean) as string[]

  const target = `${programName}.exe`.toLowerCase()

  for (const dir of dirs) {
    const hit = await findFileRecursive(dir, target, 4)
    if (hit) {
      return true
    }
  }
  return false
}

async function findFileRecursive (startPath: string, fileNameLower: string, depth: number): Promise<boolean> {
  if (depth < 0) {
    return false
  }
  let entries: string[]
  try {
    entries = await readdir(startPath)
  } catch {
    return false
  }
  for (const entry of entries) {
    const full = join(startPath, entry)
    if (entry.toLowerCase() === fileNameLower) {
      return true
    }
    try {
      const st = await stat(full)
      if (st.isDirectory() && await findFileRecursive(full, fileNameLower, depth - 1)) {
        return true
      }
    } catch {
      continue
    }
  }
  return false
}
