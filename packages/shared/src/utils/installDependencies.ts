import type { Agent, Command } from 'package-manager-detector'
import { detect, getUserAgent, resolveCommand } from 'package-manager-detector'
import { x } from 'tinyexec'
import { pnpm } from './cli/postinstall'
import { deno, yarn } from './cli/preinstall'

export const packageManager = getUserAgent() ?? 'npm'

interface PmOptions {
  cwd?: string
  silent?: boolean
  agent?: Agent
}

async function runPmCommand (command: Command, args: string[], { cwd, silent = true, agent }: PmOptions = {}) {
  const resolved = resolveCommand(
    agent ?? (await detect({ cwd }))?.agent ?? getUserAgent() ?? 'npm',
    command,
    args,
  )
  if (!resolved) {
    throw new Error(`Cannot resolve "${command}" for the detected package manager.`)
  }
  await x(resolved.command, resolved.args, {
    nodeOptions: { cwd, stdio: silent ? 'pipe' : 'inherit' },
    throwOnError: true,
  })
}

export async function addDependency (packages: string | string[], opts?: { cwd?: string, silent?: boolean, global?: boolean }) {
  const list = Array.isArray(packages) ? packages : [packages]
  await runPmCommand(opts?.global ? 'global' : 'add', list, opts)
}

export async function addDevDependency (packages: string | string[], opts?: { cwd?: string, silent?: boolean }) {
  const list = Array.isArray(packages) ? packages : [packages]
  await runPmCommand('add', ['-D', ...list], opts)
}

export async function installDependencies (root: string = process.cwd(), manager = packageManager) {
  if (manager === 'yarn') {
    await yarn(root)
  } else if (manager === 'deno') {
    await deno(root)
  }
  await runPmCommand('install', [], { cwd: root, agent: manager, silent: true })
    .catch(() => {
      console.error(
        `Failed to install dependencies using ${manager}.`,
      )
    })
  if (manager === 'pnpm') {
    await pnpm(root)
  }
}
