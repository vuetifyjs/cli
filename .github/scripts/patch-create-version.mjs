import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const packagePath = join(process.cwd(), 'packages/create/package.json')
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))

// Get version from argument, e.g., "v3.0.0" or "3.0.0"
let targetVersion = process.argv[2]

if (!targetVersion) {
  console.error('Usage: node patch-create-version.mjs <version>')
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
}

// Strip 'v' prefix if present
if (targetVersion.startsWith('v')) {
  targetVersion = targetVersion.slice(1)
}

const targetMajor = targetVersion.split('.')[0]

// Parse current version
// Assumes semver-like: major.minor.patch(-prerelease)?
const versionMatch = pkg.version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/)

if (!versionMatch) {
  console.error(`Could not parse package version: ${pkg.version}`)
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
}

// eslint-disable-next-line unicorn/no-unreadable-array-destructuring
const [, , minor, patch, prerelease] = versionMatch

let newPrerelease = ''

if (prerelease) {
  // 0.x.y-beta.z -> 0.x.y-beta-next.z
  // Non-beta: for now, keeping as is to be safe, but user only specified beta.
  newPrerelease = prerelease.startsWith('beta.')
    ? `-${prerelease.replace('beta.', 'beta-next.')}`
    : `-${prerelease}`
} else {
  // 0.x.y -> 0.x.y-next.1
  newPrerelease = '-next.1'
}

const newVersion = `${targetMajor}.${minor}.${patch}${newPrerelease}`

console.log(`Patching packages/create/package.json version from ${pkg.version} to ${newVersion}`)
pkg.version = newVersion

writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n')
