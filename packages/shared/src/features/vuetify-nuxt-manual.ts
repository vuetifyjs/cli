import type { Feature } from './types'
import { writeFile } from 'node:fs/promises'
import { builders, loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { join } from 'pathe'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const vuetifyNuxtManual: Feature = {
  name: 'vuetify-nuxt-manual',
  apply: async ({ cwd, pkg, isNuxt }) => {
    // Only applies to Nuxt
    if (!isNuxt) {
      return
    }
    const configPath = join(cwd, 'nuxt.config.ts')

    pkg.devDependencies = pkg.devDependencies || {}
    pkg.devDependencies['vite-plugin-vuetify'] = rootPkg.dependencies['vite-plugin-vuetify']
    pkg.devDependencies['@vuetify/loader-shared'] = rootPkg.dependencies['@vuetify/loader-shared']
    pkg.devDependencies['pathe'] = rootPkg.dependencies['pathe']

    const mod = await loadFile(configPath)

    // Add import { transformAssetUrls } from 'vite-plugin-vuetify'
    mod.imports.$prepend({
      from: 'vite-plugin-vuetify',
      imported: 'transformAssetUrls',
    })

    const options = getDefaultExportOptions(mod)
    if (options) {
      options.build ||= {}
      options.build.transpile ||= []
      if (!options.build.transpile.includes('vuetify')) {
        options.build.transpile.push('vuetify')
      }

      options.vite ||= {}
      options.vite.vue ||= {}
      options.vite.vue.template ||= {}
      options.vite.vue.template.transformAssetUrls = builders.raw('transformAssetUrls')
    }

    await writeFile(configPath, mod.generate().code)
  },
}
