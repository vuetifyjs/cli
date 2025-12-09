import { x } from 'tinyexec'

export async function getNpmPackageVersion (packageName: string): Promise<string | null> {
  try {
    const { stdout } = await x('npm', ['view', packageName, 'version'])
    return stdout.trim()
  } catch {
    return null
  }
}
