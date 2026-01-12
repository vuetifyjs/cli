import type { Feature } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { addStatementToFunctionBody, isFunction } from '../utils/magicast'
import rootPkg from './dependencies/package.json' with { type: 'json' }

export const pinia: Feature = {
  name: 'pinia',
  apply: async ({ cwd, pkg, isTypescript, isNuxt }) => {
    const ext = isTypescript ? 'ts' : 'js'

    if (isNuxt) {
      pkg.dependencies ??= {}
      pkg.devDependencies ??= {}
      pkg.dependencies['pinia'] = rootPkg.dependencies.pinia
      pkg.devDependencies['@pinia/nuxt'] = rootPkg.dependencies['@pinia/nuxt']

      // Update nuxt.config.ts
      const configPath = join(cwd, 'nuxt.config.ts')
      const mod = await loadFile(configPath)

      // Assume defineNuxtConfig structure
      // We need to add to modules array
      // This is hard with magicast if structure varies.
      // But for base template it should be standard.
      const options = getDefaultExportOptions(mod)
      if (options) {
        options.modules ||= []
        options.modules.push('@pinia/nuxt')
      }

      await writeFile(configPath, mod.generate().code)

      // Create example store
      const appPath = existsSync(join(cwd, 'app')) ? 'app' : '.'
      if (!existsSync(join(cwd, appPath, 'stores'))) {
        mkdirSync(join(cwd, appPath, 'stores'), { recursive: true })
      }
      await writeFile(join(cwd, appPath, `stores/app.${ext}`), getStoreContent(isTypescript))
    } else {
      pkg.dependencies ??= {}
      pkg.dependencies['pinia'] = rootPkg.dependencies.pinia

      // Create store file
      if (!existsSync(join(cwd, 'src/stores'))) {
        mkdirSync(join(cwd, 'src/stores'), { recursive: true })
      }
      await writeFile(join(cwd, `src/stores/app.${ext}`), getStoreContent(isTypescript))

      // Update plugins/index.ts
      const pluginsPath = join(cwd, `src/plugins/index.${ext}`)
      const mod = await loadFile(pluginsPath)

      mod.imports.$prepend({
        from: 'pinia',
        imported: 'createPinia',
      })

      const registerPlugins = mod.exports.registerPlugins
      if (isFunction(registerPlugins)) {
        addStatementToFunctionBody(registerPlugins, 'app.use(createPinia())')
      }

      await writeFile(pluginsPath, mod.generate().code)
    }
  },
}

function getStoreContent (_ts: boolean) {
  return `// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    //
  }),
})
`
}
