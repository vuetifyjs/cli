import { tryResolvePackage } from './package'

const pkgNames = ['vuetify', '@vuetify/nightly']

export async function tryResolveVuetify ({ cwd }: { cwd?: string } = {}) {
  return tryResolvePackage(pkgNames, { cwd })
}

export async function tryResolveVuetifyVersion ({ cwd }: { cwd?: string } = {}) {
  const vuetify = await tryResolveVuetify({ cwd })
  if (!vuetify) {
    return '0.0.0'
  }
  return vuetify.version || '0.0.0'
}
