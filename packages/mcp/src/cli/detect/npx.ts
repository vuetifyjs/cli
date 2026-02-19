import isWsl from 'is-wsl'
import { platform } from 'std-env'
import which from 'which'

type ResolvedNpx = {
  path: string
  wsl: boolean
  pure: boolean
}

const macPaths = [
  '/usr/local/bin',
  '/opt/homebrew/bin',
  '/opt/local/bin',
  '/usr/bin',
]

async function detectPureProgram (program: 'node' | 'npx'): Promise<boolean> {
  if (platform !== 'darwin') {
    return true
  }
  return !!(await which(program, { nothrow: true, path: macPaths.join(':') }))
}

export async function detectProgram (program: 'node' | 'npx'): Promise<ResolvedNpx | null> {
  if (isWsl) {
    const { x } = await import('tinyexec')
    let windowsPath: string | undefined
    try {
      const result = await x('where.exe', [program], { throwOnError: true, nodeOptions: { shell: true } })
      windowsPath = result.stdout.trim().split('\r\n')[0]
    } catch { /** */ }

    if (windowsPath) {
      return {
        path: windowsPath,
        wsl: false,
        pure: true,
      }
    }

    let wslPath: string | undefined
    try {
      wslPath = await which(program)
    } catch {
      return null
    }

    return wslPath
      ? {
          path: wslPath,
          wsl: true,
          pure: true,
        }
      : null
  }

  let programPath: string | undefined
  try {
    programPath = await which(program)
  } catch {
    return null
  }

  return programPath
    ? {
        path: programPath,
        wsl: false,
        pure: await detectPureProgram(program),
      }
    : null
}
