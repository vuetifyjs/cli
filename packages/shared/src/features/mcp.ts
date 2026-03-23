import type { Feature } from './types'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const mcp: Feature = {
  name: 'mcp',
  apply: async ({ pkg }) => {
    pkg.devDependencies = pkg.devDependencies || {}
    pkg.devDependencies['@vuetify/mcp'] = rootPkg.dependencies['@vuetify/mcp']
  },
}
