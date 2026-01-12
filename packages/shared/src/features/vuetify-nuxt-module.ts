import type { Feature } from './types'
import { existsSync, unlinkSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const vuetifyNuxtModule: Feature = {
  name: 'vuetify-nuxt-module',
  apply: async ({ cwd, pkg, clientHints, isNuxt }) => {
    // Only applies to Nuxt
    if (!isNuxt) {
      return
    }

    pkg.dependencies = pkg.dependencies || {}
    pkg.dependencies['vuetify-nuxt-module'] = rootPkg.dependencies['vuetify-nuxt-module']

    // Update nuxt.config.ts
    const configPath = join(cwd, 'nuxt.config.ts')
    const mod = await loadFile(configPath)

    const manualModulePath = join(cwd, 'modules/vuetify.ts')
    if (existsSync(manualModulePath)) {
      unlinkSync(manualModulePath)
    }

    const options = getDefaultExportOptions(mod)
    if (options) {
      options.modules ||= []
      options.modules.push('vuetify-nuxt-module')

      options.vuetify = {
        moduleOptions: {
          /* module options */
        },
        vuetifyOptions: {
          /* vuetify options */
        },
      }
      if (clientHints) {
        options.vuetify.moduleOptions.ssrClientHints = {
          reloadOnFirstRequest: false,
          viewportSize: true,
          prefersColorScheme: true,
          prefersReducedMotion: true,
          prefersColorSchemeOptions: {
            useBrowserThemeOnly: false,
          },
        }
      }
    }

    await writeFile(configPath, mod.generate().code)
  },
}
