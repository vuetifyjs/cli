import { resolveModulePath } from 'exsolve'
import { readPackageJSON } from 'pkg-types'

export function extractMajor (version: string): number | null {
  if (!version) {
    return null
  }
  const match = version.match(/(\d+)/)
  if (!match) {
    return null
  }
  const major = Number(match[1])
  return Number.isNaN(major) ? null : major
}

const pkgNames = ['vuetify', '@vuetify/nightly']

export async function tryResolveVuetify (cwd: string) {
  for (const pkgName of pkgNames) {
    const pkgPath = resolveModulePath(pkgName, {
      from: cwd,
      try: true,
    })
    if (!pkgPath) {
      continue
    }
    const pkg = await readPackageJSON(pkgPath)
    return pkg
  }
  return null
}

export async function tryResolveVuetifyVersion (cwd: string) {
  const version = await tryResolveVuetify(cwd)
  if (!version) {
    return '0'
  }
  return version.version || '0'
}
