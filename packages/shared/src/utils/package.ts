import { resolveModulePath } from 'exsolve'
import { detect } from 'package-manager-detector'
import { readPackageJSON } from 'pkg-types'

export async function getPackageManager () {
  return detect({ cwd: process.cwd() })
}

export async function getProjectPackageJSON (cwd?: string) {
  return readPackageJSON(cwd || process.cwd())
}

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

export function isVersionAtLeast (version: string, targetVersion: `${number}.${number}.${number}`) {
  const [vMajor, vMinor, vPatch] = version.split('.').map(Number) as [number, number, number]
  const [major, minor, patch] = targetVersion.split('.').map(Number) as [number, number, number]
  return (
    vMajor > major
    || (vMajor === major && vMinor > minor)
    || (vMajor === major && vMinor === minor && vPatch >= patch)
  )
}

export function tryResolveFilePath (fileNames: string[] | string, { cwd, extensions = [] }: { cwd?: string, extensions?: string[] } = {}) {
  const fileNamesArray = Array.isArray(fileNames) ? fileNames : [fileNames]
  for (const fileName of fileNamesArray) {
    const filePath = resolveModulePath(fileName, {
      from: cwd,
      extensions,
      try: true,
    })
    if (!filePath) {
      continue
    }
    return filePath
  }
  return null
}

export async function tryResolvePackage (pkgNames: string[] | string, { cwd }: { cwd?: string } = {}) {
  const pkgNamesArray = Array.isArray(pkgNames) ? pkgNames : [pkgNames]
  for (const pkgName of pkgNamesArray) {
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

export async function getPackageVersion (pkg: string, { cwd }: { cwd?: string } = {}) {
  const version = await tryResolvePackage(pkg, { cwd })
  if (!version) {
    return '0.0.0'
  }
  return version.version || '0.0.0'
}
