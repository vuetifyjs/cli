import type { Feature } from './types'
import { writeFile } from 'node:fs/promises'
import { loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { join } from 'pathe'

export const nuxtClientHints: Feature = {
  name: 'client-hints',
  apply: async ({ cwd, isNuxt }) => {
    // Only applies to Nuxt
    if (!isNuxt) {
      return
    }

    // Update nuxt.config.ts
    const configPath = join(cwd, 'nuxt.config.ts')
    const mod = await loadFile(configPath)

    const options = getDefaultExportOptions(mod)
    if (options) {
      options.vuetify ??= {}
      options.vuetify.moduleOptions ??= {}
      options.vuetify.moduleOptions.ssrClientHints = {
        reloadOnFirstRequest: false,
        viewportSize: true,
        prefersColorScheme: true,
        prefersReducedMotion: true,
        prefersColorSchemeOptions: {
          useBrowserThemeOnly: false,
        },
      }
      options.vuetify.vuetifyOptions ??= {}
      options.vuetify.vuetifyOptions.theme ??= {}

      // 'system' does not work with SRR hints
      options.vuetify.vuetifyOptions.theme.defaultTheme = 'dark'
      // empty objects to avoid the module being upset
      options.vuetify.vuetifyOptions.theme.themes = {
        light: {},
        dark: {},
      }
    }

    await writeFile(configPath, mod.generate().code)
  },
}
